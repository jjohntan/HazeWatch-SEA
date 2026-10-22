import { NextRequest, NextResponse } from 'next/server';
import { generate31GefsEnsembleOutlook } from '@/lib/geo/gefs-ensemble';
import { globalCache } from '@/lib/api/cache';

export const dynamic = 'force-dynamic';

const CACHE_TTL_SECONDS = 1800; // 30 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationName = searchParams.get('location') || 'Kuala Lumpur';
    const aqiParam = searchParams.get('aqi');
    const pm25Param = searchParams.get('pm25');

    const baselineAqi = aqiParam ? Math.max(10, parseFloat(aqiParam)) : 75;
    const baselinePm25 = pm25Param ? Math.max(5, parseFloat(pm25Param)) : 24.5;

    const cacheKey = `gefs:outlook:${encodeURIComponent(locationName)}:${Math.round(baselineAqi)}:${Math.round(baselinePm25)}`;
    const cached = globalCache.get(cacheKey);
    if (cached && !cached.isStale) {
      return NextResponse.json(cached.data);
    }

    const outlook = generate31GefsEnsembleOutlook(locationName, baselineAqi, baselinePm25);

    const payload = {
      outlook,
      meta: {
        model: 'NOAA Global Ensemble Forecast System (GEFS v12)',
        ensembleMembers: 31,
        targetPeriod: "Tomorrow's 24-Hour Outlook",
        labeledAsForecast: true,
        generatedAt: new Date().toISOString(),
      },
    };

    globalCache.set(cacheKey, payload, CACHE_TTL_SECONDS);

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=600`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate GEFS outlook';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
