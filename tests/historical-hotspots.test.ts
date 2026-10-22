import { describe, it, expect } from 'vitest';
import {
  getHistoricalDateRange,
  getDailyHotspotSummary,
  generateHistoricalDailyGeoJson,
} from '@/lib/geo/historical-hotspots';
import { GET } from '@/app/api/hotspots/route';
import { NextRequest } from 'next/server';

describe('Historical Satellite Fire Replay (Item 1: Since 1 Aug)', () => {
  it('generates a full date range starting from 1 Aug', () => {
    const dates = getHistoricalDateRange('2026-08-01', '2026-10-22');
    expect(dates[0]).toBe('2026-08-01');
    expect(dates).toContain('2026-10-08');
    expect(dates[dates.length - 1]).toBe('2026-10-22');
    expect(dates.length).toBeGreaterThanOrEqual(80);
  });

  it('correctly provides the 8 Oct peak fire detection event (13,012 fires in Indonesia)', () => {
    const summary = getDailyHotspotSummary('2026-10-08');
    expect(summary.date).toBe('2026-10-08');
    expect(summary.indonesiaCount).toBe(13012);
    expect(summary.isPeakSpike).toBe(true);
    expect(summary.totalHotspots).toBeGreaterThan(13000);
    expect(summary.dayLabel).toBe('8 Oct');
  });

  it('generates realistic GeoJSON point distributions for historical dates', () => {
    const geojson = generateHistoricalDailyGeoJson('2026-10-08');
    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.features.length).toBeGreaterThan(500);

    const firstPoint = geojson.features[0];
    expect(firstPoint.properties.acqDate).toBe('2026-10-08');
    expect(firstPoint.geometry.coordinates[0]).toBeGreaterThanOrEqual(92);
    expect(firstPoint.geometry.coordinates[0]).toBeLessThanOrEqual(142);
    expect(firstPoint.geometry.coordinates[1]).toBeGreaterThanOrEqual(-12);
    expect(firstPoint.geometry.coordinates[1]).toBeLessThanOrEqual(24);
  });

  it('GET /api/hotspots returns historical payload when date parameter is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/hotspots?date=2026-10-08');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.meta.isHistoricalReplay).toBe(true);
    expect(data.meta.indonesiaCount).toBe(13012);
    expect(data.meta.dayLabel).toBe('8 Oct');
    expect(data.summary.indonesiaCount).toBe(13012);
    expect(data.geojson.features.length).toBeGreaterThan(0);
  });
});
