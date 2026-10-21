import { NextRequest, NextResponse } from 'next/server';
import { GeoCoordsQuerySchema, OpenMeteoAirQualitySchema, OpenMeteoWeatherSchema } from '@/lib/api/schemas';
import { globalCache } from '@/lib/api/cache';
import { fetchWithRetry } from '@/lib/api/client';
import { HourlyForecastItem } from '@/types';

const CACHE_TTL_SECONDS = 1800; // 30 minutes

interface CachedForecastPayload {
  latitude: number;
  longitude: number;
  forecastHours: number;
  hourly: HourlyForecastItem[];
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
        { error: 'Invalid coordinates or forecast hours', details: parsedParams.error.flatten() },
        { status: 400 }
      );
    }

    const { latitude, longitude, forecast_hours } = parsedParams.data;
    const cacheKey = `forecast:${latitude.toFixed(3)}:${longitude.toFixed(3)}:${forecast_hours}`;

    const cached = globalCache.get<CachedForecastPayload>(cacheKey);
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

    const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=pm2_5,pm10,us_aqi&forecast_hours=${forecast_hours}&timezone=Asia%2FKuala_Lumpur`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=wind_speed_10m,wind_direction_10m&forecast_hours=${forecast_hours}&timezone=Asia%2FKuala_Lumpur`;

    const [aqRaw, weatherRaw] = await Promise.allSettled([
      fetchWithRetry<unknown>(aqUrl),
      fetchWithRetry<unknown>(weatherUrl),
    ]);

    if (aqRaw.status === 'rejected') {
      if (cached) {
        return NextResponse.json({
          ...cached.data,
          meta: {
            ...cached.data.meta,
            cached: true,
            cachedAt: cached.cachedAt,
            isStale: true,
            warning: 'Upstream Open-Meteo AQ service unavailable; serving stale cached forecast',
          },
        });
      }
      return NextResponse.json(
        { error: 'Failed to fetch forecast from Open-Meteo', message: aqRaw.reason.message },
        { status: 502 }
      );
    }

    const aqData = OpenMeteoAirQualitySchema.parse(aqRaw.value);
    let weatherHourly: { time: string[]; wind_speed_10m: (number | null)[]; wind_direction_10m: (number | null)[] } | null = null;

    if (weatherRaw.status === 'fulfilled') {
      const weatherParsed = OpenMeteoWeatherSchema.safeParse(weatherRaw.value);
      if (weatherParsed.success) {
        weatherHourly = weatherParsed.data.hourly;
      }
    }

    const count = Math.min(aqData.hourly.time.length, forecast_hours);
    const hourlyItems: HourlyForecastItem[] = [];

    for (let i = 0; i < count; i++) {
      const timeStr = aqData.hourly.time[i];
      const pm2_5 = aqData.hourly.pm2_5[i] ?? 0;
      const pm10 = aqData.hourly.pm10[i] ?? 0;
      const us_aqi = aqData.hourly.us_aqi[i] ?? 0;
      const windSpeed = weatherHourly?.wind_speed_10m[i] ?? 5.0;
      const windDir = weatherHourly?.wind_direction_10m[i] ?? 180;

      hourlyItems.push({
        time: timeStr.includes('+') ? timeStr : `${timeStr}:00+08:00`,
        pm2_5: Number(pm2_5.toFixed(1)),
        pm10: Number(pm10.toFixed(1)),
        us_aqi: Math.round(us_aqi),
        windSpeed10m: Number((windSpeed ?? 5).toFixed(1)),
        windDirection10m: Math.round(windDir ?? 180),
      });
    }

    const payload = {
      latitude: aqData.latitude,
      longitude: aqData.longitude,
      forecastHours: count,
      hourly: hourlyItems,
      meta: {
        dataSource: 'Open-Meteo Global Air Quality CAMS Model',
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
    return NextResponse.json({ error: 'Forecast API Error', message }, { status: 500 });
  }
}
