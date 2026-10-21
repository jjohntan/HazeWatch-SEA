import { NextRequest, NextResponse } from 'next/server';
import { GeoCoordsQuerySchema, OpenMeteoWeatherSchema } from '@/lib/api/schemas';
import { globalCache } from '@/lib/api/cache';
import { fetchWithRetry } from '@/lib/api/client';
import { getWindCompass } from '@/lib/geo/aqi';

const CACHE_TTL_SECONDS = 1800; // 30 minutes

interface CachedWeatherPayload {
  latitude: number;
  longitude: number;
  current: Record<string, unknown>;
  meta: Record<string, unknown>;
}

export interface RegionalWindPoint {
  latitude: number;
  longitude: number;
  speed: number; // km/h
  direction: number; // degrees
  u: number; // Eastward vector
  v: number; // Northward vector
  compass: string;
}

interface CachedRegionalWindPayload {
  grid: RegionalWindPoint[];
  count: number;
  meta: Record<string, unknown>;
}

// Key meteorological nodes across Southeast Asia (Malaysia first)
const REGIONAL_GRID_POINTS = [
  { lat: 3.139, lng: 101.687, name: 'Kuala Lumpur' },
  { lat: 5.414, lng: 100.329, name: 'Penang' },
  { lat: 1.493, lng: 103.741, name: 'Johor Bahru' },
  { lat: 3.808, lng: 103.326, name: 'Kuantan' },
  { lat: 4.597, lng: 101.090, name: 'Ipoh' },
  { lat: 1.553, lng: 110.359, name: 'Kuching' },
  { lat: 3.194, lng: 113.042, name: 'Bintulu' },
  { lat: 5.980, lng: 116.074, name: 'Kota Kinabalu' },
  { lat: 1.352, lng: 103.820, name: 'Singapore' },
  { lat: 3.595, lng: 98.672, name: 'Medan' },
  { lat: 0.507, lng: 101.448, name: 'Pekanbaru' },
  { lat: -2.991, lng: 104.757, name: 'Palembang' },
  { lat: -0.026, lng: 109.343, name: 'Pontianak' },
  { lat: -3.319, lng: 114.591, name: 'Banjarmasin' },
  { lat: -6.209, lng: 106.846, name: 'Jakarta' },
  { lat: 13.756, lng: 100.502, name: 'Bangkok' },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isRegionalGrid = searchParams.get('grid') === 'regional';

    if (isRegionalGrid) {
      const cacheKey = 'weather:regional_grid_sea';
      const cached = globalCache.get<CachedRegionalWindPayload>(cacheKey);
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

      // Query Open-Meteo multi-location in a single query
      const lats = REGIONAL_GRID_POINTS.map((p) => p.lat).join(',');
      const lngs = REGIONAL_GRID_POINTS.map((p) => p.lng).join(',');
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=wind_speed_10m,wind_direction_10m`;

      const raw = await fetchWithRetry<Array<{
        latitude: number;
        longitude: number;
        current?: { wind_speed_10m?: number; wind_direction_10m?: number };
      }>>(url);

      const gridResults: RegionalWindPoint[] = [];

      if (Array.isArray(raw)) {
        raw.forEach((item, index) => {
          const speed = item.current?.wind_speed_10m ?? 8.0;
          const dir = item.current?.wind_direction_10m ?? 210;
          const rad = (dir * Math.PI) / 180;

          // Flow direction towards downwind:
          // Meteorological direction is FROM. So particle moves along -sin(rad) and -cos(rad).
          const u = -speed * Math.sin(rad);
          const v = -speed * Math.cos(rad);

          gridResults.push({
            latitude: REGIONAL_GRID_POINTS[index]?.lat ?? item.latitude,
            longitude: REGIONAL_GRID_POINTS[index]?.lng ?? item.longitude,
            speed: Number(speed.toFixed(1)),
            direction: Math.round(dir),
            u: Number(u.toFixed(2)),
            v: Number(v.toFixed(2)),
            compass: getWindCompass(dir),
          });
        });
      }

      const payload: CachedRegionalWindPayload = {
        grid: gridResults,
        count: gridResults.length,
        meta: {
          dataSource: 'Open-Meteo Global Numerical Weather Prediction (NWP)',
          model: 'ECMWF IFS / GFS Surface Wind',
          timezone: 'Asia/Kuala_Lumpur (UTC+8)',
          cached: false,
          isStale: false,
          updatedAt: new Date().toISOString(),
        },
      };

      globalCache.set(cacheKey, payload, CACHE_TTL_SECONDS);

      return NextResponse.json(payload, {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=600`,
        },
      });
    }

    // Single Coordinate Weather Query
    const parsedParams = GeoCoordsQuerySchema.safeParse({
      latitude: searchParams.get('latitude'),
      longitude: searchParams.get('longitude'),
    });

    if (!parsedParams.success) {
      return NextResponse.json(
        { error: 'Invalid coordinates', details: parsedParams.error.flatten() },
        { status: 400 }
      );
    }

    const { latitude, longitude } = parsedParams.data;
    const cacheKey = `weather:${latitude.toFixed(3)}:${longitude.toFixed(3)}`;

    const cached = globalCache.get<CachedWeatherPayload>(cacheKey);
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

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=wind_speed_10m,wind_direction_10m&hourly=wind_speed_10m,wind_direction_10m&forecast_hours=48&timezone=Asia%2FKuala_Lumpur`;

    const weatherRaw = await fetchWithRetry<unknown>(weatherUrl);
    const weatherData = OpenMeteoWeatherSchema.parse(weatherRaw);

    const speed = weatherData.current?.wind_speed_10m ?? weatherData.hourly.wind_speed_10m[0] ?? 0;
    const dir = weatherData.current?.wind_direction_10m ?? weatherData.hourly.wind_direction_10m[0] ?? 0;

    const payload: CachedWeatherPayload = {
      latitude: weatherData.latitude,
      longitude: weatherData.longitude,
      current: {
        windSpeed10m: Number(speed.toFixed(1)),
        windDirection10m: Math.round(dir),
        compass: getWindCompass(dir),
        timestamp: weatherData.current?.time ? `${weatherData.current.time}:00+08:00` : new Date().toISOString(),
      },
      meta: {
        dataSource: 'Open-Meteo Numerical Weather Prediction Models',
        timezone: 'Asia/Kuala_Lumpur (UTC+8)',
        cached: false,
        isStale: false,
        updatedAt: new Date().toISOString(),
      },
    };

    globalCache.set(cacheKey, payload, CACHE_TTL_SECONDS);

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=600`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: 'Weather API Error', message }, { status: 500 });
  }
}
