import { NextRequest, NextResponse } from 'next/server';
import { GeoCoordsQuerySchema, OpenMeteoAirQualitySchema, OpenMeteoWeatherSchema } from '@/lib/api/schemas';
import { globalCache } from '@/lib/api/cache';
import { fetchWithRetry } from '@/lib/api/client';
import { getAqiCategory } from '@/lib/geo/aqi';

const CACHE_TTL_SECONDS = 1800; // 30 minutes

interface CachedAirQualityPayload {
  latitude: number;
  longitude: number;
  current: Record<string, unknown>;
  meta: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedParams = GeoCoordsQuerySchema.safeParse({
      latitude: searchParams.get('latitude'),
      longitude: searchParams.get('longitude'),
      forecast_hours: searchParams.get('forecast_hours') || 48,
    });

    if (!parsedParams.success) {
      return NextResponse.json(
        { error: 'Invalid coordinates', details: parsedParams.error.flatten() },
        { status: 400 }
      );
    }

    const { latitude, longitude } = parsedParams.data;
    const cacheKey = `aq:${latitude.toFixed(3)}:${longitude.toFixed(3)}`;

    // Check cache
    const cached = globalCache.get<CachedAirQualityPayload>(cacheKey);
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

    // Upstream Open-Meteo URLs
    const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm2_5,pm10,us_aqi&hourly=pm2_5,pm10,us_aqi&forecast_hours=1&timezone=Asia%2FKuala_Lumpur`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=wind_speed_10m,wind_direction_10m&timezone=Asia%2FKuala_Lumpur`;

    // Fetch concurrently with retries
    const [aqRaw, weatherRaw] = await Promise.allSettled([
      fetchWithRetry<unknown>(aqUrl),
      fetchWithRetry<unknown>(weatherUrl),
    ]);

    if (aqRaw.status === 'rejected') {
      // If we have stale cached data, gracefully return it
      if (cached) {
        return NextResponse.json({
          ...cached.data,
          meta: {
            ...cached.data.meta,
            cached: true,
            cachedAt: cached.cachedAt,
            isStale: true,
            warning: 'Upstream Open-Meteo AQ service unavailable; serving stale cached data',
          },
        });
      }
      return NextResponse.json(
        { error: 'Failed to fetch air quality data from Open-Meteo', message: aqRaw.reason.message },
        { status: 502 }
      );
    }

    const aqData = OpenMeteoAirQualitySchema.parse(aqRaw.value);
    let windSpeed = 8.0;
    let windDir = 210;

    if (weatherRaw.status === 'fulfilled') {
      const weatherParsed = OpenMeteoWeatherSchema.safeParse(weatherRaw.value);
      if (weatherParsed.success && weatherParsed.data.current) {
        windSpeed = weatherParsed.data.current.wind_speed_10m ?? windSpeed;
        windDir = weatherParsed.data.current.wind_direction_10m ?? windDir;
      }
    }

    // Calculate active current values (or fall back to first hourly element)
    const pm25Val = aqData.current?.pm2_5 ?? aqData.hourly.pm2_5[0] ?? 15.0;
    const pm10Val = aqData.current?.pm10 ?? aqData.hourly.pm10[0] ?? 25.0;
    const usAqiVal = aqData.current?.us_aqi ?? aqData.hourly.us_aqi[0] ?? 50;

    const aqiCategoryInfo = getAqiCategory(usAqiVal);

    const payload = {
      latitude: aqData.latitude,
      longitude: aqData.longitude,
      current: {
        pm2_5: Number(pm25Val.toFixed(1)),
        pm10: Number(pm10Val.toFixed(1)),
        us_aqi: Math.round(usAqiVal),
        category: aqiCategoryInfo.category,
        categoryColor: aqiCategoryInfo.color,
        dominantPollutant: 'PM2.5',
        windSpeed10m: Number(windSpeed.toFixed(1)),
        windDirection10m: Math.round(windDir),
        timestamp: aqData.current?.time ? `${aqData.current.time}:00+08:00` : new Date().toISOString(),
        source: 'Open-Meteo Global Air Quality CAMS Model',
        isModelEstimate: true,
      },
      meta: {
        dataSource: 'Open-Meteo / Copernicus Atmosphere Monitoring Service (CAMS)',
        model: 'CAMS European Global Atmospheric Composition',
        timezone: 'Asia/Kuala_Lumpur (UTC+8)',
        cached: false,
        isStale: false,
        updatedAt: new Date().toISOString(),
      },
    };

    // Store in cache
    globalCache.set(cacheKey, payload, CACHE_TTL_SECONDS);

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=600`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: 'Air Quality API Error', message }, { status: 500 });
  }
}
