import { NextRequest, NextResponse } from 'next/server';
import { calculate5DayBackwardTrajectory } from '@/lib/geo/backward-trajectory';
import { globalCache } from '@/lib/api/cache';
import { LOCATION_PRESETS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const CACHE_TTL_SECONDS = 1800; // 30 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');
    const nameParam = searchParams.get('name') || 'Malaysia Target Location';
    const windSpeedParam = searchParams.get('speed');
    const windDirParam = searchParams.get('dir');

    // Default to Kuala Lumpur, Malaysia
    const lat = latParam ? parseFloat(latParam) : LOCATION_PRESETS[0].latitude;
    const lon = lonParam ? parseFloat(lonParam) : LOCATION_PRESETS[0].longitude;
    const windSpeed = windSpeedParam ? parseFloat(windSpeedParam) : 14.0;
    const windDir = windDirParam ? parseFloat(windDirParam) : 220.0;

    const cacheKey = `trajectory:5day:${lat.toFixed(2)}:${lon.toFixed(2)}:${Math.round(windDir)}:${Math.round(windSpeed)}`;
    const cached = globalCache.get(cacheKey);
    if (cached && !cached.isStale) {
      return NextResponse.json(cached.data);
    }

    const targetLocation = {
      latitude: lat,
      longitude: lon,
      name: nameParam,
      country: 'Malaysia',
    };

    const trajectory = calculate5DayBackwardTrajectory(targetLocation, windSpeed, windDir);

    // Build GeoJSON LineString and Waypoint Points for MapLibre rendering
    const lineCoordinates = trajectory.waypoints.map((wp) => [wp.longitude, wp.latitude]);
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: lineCoordinates,
          },
          properties: {
            id: '5day-air-trajectory-line',
            originRegion: trajectory.originRegion,
            totalDurationHours: trajectory.totalDurationHours,
          },
        },
        ...trajectory.waypoints.map((wp, idx) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [wp.longitude, wp.latitude],
          },
          properties: {
            id: `waypoint-${wp.hoursAgo}h`,
            hoursAgo: wp.hoursAgo,
            label: wp.hoursAgo === 0 ? 'Current Arrival (Malaysia)' : `-${wp.hoursAgo}h (${wp.sector})`,
            speedKmh: wp.speedKmh,
            directionDeg: wp.directionDeg,
            altitudeMeters: wp.altitudeMeters,
            sector: wp.sector,
            isOrigin: idx === trajectory.waypoints.length - 1,
            isArrival: idx === 0,
          },
        })),
      ],
    };

    const payload = {
      trajectory,
      geojson,
      meta: {
        model: 'Kinematic Backward Particle Model on NOAA GFS Boundary Winds',
        durationHours: 120,
        waypointsCount: trajectory.waypoints.length,
        originRegion: trajectory.originRegion,
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
    const msg = error instanceof Error ? error.message : 'Failed to calculate backward trajectory';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
