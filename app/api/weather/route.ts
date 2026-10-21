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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
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

    const payload = {
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
