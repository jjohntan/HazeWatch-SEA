import { NextRequest, NextResponse } from 'next/server';
import { globalCache } from '@/lib/api/cache';
import { parseFirmsCsvToGeoJson, generateRealisticFallbackHotspots, HotspotGeoJSON } from '@/lib/geo/hotspots';

export const dynamic = 'force-dynamic';

const CACHE_TTL_SECONDS = 3600; // 60 minutes

interface CachedHotspotsPayload {
  geojson: HotspotGeoJSON;
  count: number;
  meta: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') === '1' ? '1' : '2';
    const source = searchParams.get('source') || 'VIIRS_NOAA20_NRT';
    const confidenceFilter = searchParams.get('confidence') || 'all'; // all | nominal | high
    const bbox = searchParams.get('bbox') || '92,-12,142,24'; // Southeast Asia

    const cacheKey = `hotspots:${source}:${days}:${bbox}:${confidenceFilter}`;

    // Check cache
    const cached = globalCache.get<CachedHotspotsPayload>(cacheKey);
    if (cached && !cached.isStale) {
      return NextResponse.json({
        ...cached.data,
        meta: {
          ...cached.data.meta,
          cached: true,
          cachedAt: cached.cachedAt,
          isStale: false,
        },
      });
    }

    const mapKey = process.env.NASA_FIRMS_MAP_KEY?.trim();

    // If key is not configured or is placeholder, return realistic fallback
    if (!mapKey || mapKey === 'your_nasa_firms_map_key_here') {
      const fallbackGeoJson = generateRealisticFallbackHotspots();
      
      // Apply confidence filter
      let features = fallbackGeoJson.features;
      if (confidenceFilter === 'high') {
        features = features.filter((f) => f.properties.confidence === 'high');
      } else if (confidenceFilter === 'nominal') {
        features = features.filter((f) => f.properties.confidence === 'nominal' || f.properties.confidence === 'high');
      }

      const payload: CachedHotspotsPayload = {
        geojson: {
          type: 'FeatureCollection',
          features,
        },
        count: features.length,
        meta: {
          dataSource: 'NASA FIRMS VIIRS Active Fire Anomalies (Calibrated Fallback)',
          sourceSatellite: source,
          timeRangeDays: days,
          isSimulated: true,
          notice: 'NASA_FIRMS_MAP_KEY is not configured on the server. Displaying calibrated Southeast Asia satellite detections. To connect to live NASA FIRMS feeds, register for a free key at https://firms.modaps.eosdis.nasa.gov/api/map_key/ and add it to your environment variables.',
          updatedAt: new Date().toISOString(),
          cached: false,
          isStale: false,
        },
      };

      globalCache.set(cacheKey, payload, CACHE_TTL_SECONDS);
      return NextResponse.json(payload);
    }

    // Live NASA FIRMS API Request
    const firmsUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${source}/${bbox}/${days}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(firmsUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/csv',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`NASA FIRMS upstream error: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    const parsedGeoJson = parseFirmsCsvToGeoJson(csvText, false);

    // Filter by confidence if specified
    let features = parsedGeoJson.features;
    if (confidenceFilter === 'high') {
      features = features.filter((f) => f.properties.confidence === 'high');
    } else if (confidenceFilter === 'nominal') {
      features = features.filter((f) => f.properties.confidence === 'nominal' || f.properties.confidence === 'high');
    }

    const payload: CachedHotspotsPayload = {
      geojson: {
        type: 'FeatureCollection',
        features,
      },
      count: features.length,
      meta: {
        dataSource: 'NASA FIRMS NRT Active Fire Detections (VIIRS)',
        sourceSatellite: source,
        timeRangeDays: days,
        isSimulated: false,
        updatedAt: new Date().toISOString(),
        cached: false,
        isStale: false,
      },
    };

    globalCache.set(cacheKey, payload, CACHE_TTL_SECONDS);

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=600`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve hotspots';
    console.warn('NASA FIRMS retrieval failed, using fallback:', message);

    // Fall back gracefully
    const fallback = generateRealisticFallbackHotspots();
    return NextResponse.json({
      geojson: fallback,
      count: fallback.features.length,
      meta: {
        dataSource: 'NASA FIRMS (Offline Fallback)',
        isSimulated: true,
        error: message,
        updatedAt: new Date().toISOString(),
        cached: false,
        isStale: true,
      },
    });
  }
}
