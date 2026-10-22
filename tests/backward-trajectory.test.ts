import { describe, it, expect } from 'vitest';
import { calculate5DayBackwardTrajectory } from '@/lib/geo/backward-trajectory';
import { LOCATION_PRESETS } from '@/lib/constants';
import { GET } from '@/app/api/trajectory/route';
import { NextRequest } from 'next/server';

describe('Item 3: 5-Day Backward Air Parcel Trajectory Model for Malaysia', () => {
  const kualaLumpur = LOCATION_PRESETS.find((p) => p.name === 'Kuala Lumpur')!;

  it('calculates 120-hour (5-day) backward trajectory with 3-hourly waypoints', () => {
    const trajectory = calculate5DayBackwardTrajectory(kualaLumpur, 14, 220);

    expect(trajectory.totalDurationHours).toBe(120);
    expect(trajectory.waypoints.length).toBe(41); // 0h + (120 / 3) = 41 waypoints

    // Waypoint 0 should be arrival in Malaysia
    const arrival = trajectory.waypoints[0];
    expect(arrival.hoursAgo).toBe(0);
    expect(arrival.latitude).toBeCloseTo(kualaLumpur.latitude, 2);
    expect(arrival.longitude).toBeCloseTo(kualaLumpur.longitude, 2);

    // Oldest waypoint should be 120 hours ago
    const origin = trajectory.waypoints[trajectory.waypoints.length - 1];
    expect(origin.hoursAgo).toBe(120);
    // Southwest wind (220°) means the parcel came from the Southwest (Sumatra / Indian Ocean)
    expect(origin.latitude).toBeLessThan(kualaLumpur.latitude);
    expect(origin.longitude).toBeLessThan(kualaLumpur.longitude);
  });

  it('identifies maritime and land passage percentages and origin region', () => {
    const trajectory = calculate5DayBackwardTrajectory(kualaLumpur, 18, 225);

    expect(trajectory.marinePassagePercent).toBeGreaterThanOrEqual(0);
    expect(trajectory.landPassagePercent).toBeGreaterThanOrEqual(0);
    expect(trajectory.marinePassagePercent + trajectory.landPassagePercent).toBe(100);
    expect(trajectory.originRegion.length).toBeGreaterThan(0);
    expect(trajectory.modelDisclaimer).toContain('LAGRANGIAN AIR PARCEL RECONSTRUCTION');
  });

  it('GET /api/trajectory returns valid LineString and Waypoint GeoJSON', async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/trajectory?lat=${kualaLumpur.latitude}&lon=${kualaLumpur.longitude}&name=Kuala%20Lumpur&speed=15&dir=220`
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.trajectory).toBeDefined();
    expect(data.geojson.type).toBe('FeatureCollection');

    const lineFeature = data.geojson.features.find((f: any) => f.geometry.type === 'LineString');
    expect(lineFeature).toBeDefined();
    expect(lineFeature.geometry.coordinates.length).toBe(41);

    const pointFeatures = data.geojson.features.filter((f: any) => f.geometry.type === 'Point');
    expect(pointFeatures.length).toBe(41);
  });
});
