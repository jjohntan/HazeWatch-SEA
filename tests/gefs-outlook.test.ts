import { describe, it, expect } from 'vitest';
import {
  calculatePsiFromPm25,
  getPsiCategory,
  generate31GefsEnsembleOutlook,
} from '@/lib/geo/gefs-ensemble';
import { GET } from '@/app/api/outlook/route';
import { NextRequest } from 'next/server';

describe('Item 4: Tomorrow Outlook with 31 NOAA GEFS Ensemble Fan and Forecast PSI Range', () => {
  it('correctly calculates Singapore / Regional PSI from PM2.5 breakpoints', () => {
    // 0 - 12 µg/m³ -> 0 - 50 (Good)
    expect(calculatePsiFromPm25(6)).toBeLessThanOrEqual(50);
    expect(getPsiCategory(25)).toBe('Good');

    // 13 - 55 µg/m³ -> 51 - 100 (Moderate)
    const modPsi = calculatePsiFromPm25(34);
    expect(modPsi).toBeGreaterThanOrEqual(51);
    expect(modPsi).toBeLessThanOrEqual(100);
    expect(getPsiCategory(modPsi)).toBe('Moderate');

    // 56 - 150 µg/m³ -> 101 - 200 (Unhealthy)
    const unhPsi = calculatePsiFromPm25(95);
    expect(unhPsi).toBeGreaterThanOrEqual(101);
    expect(unhPsi).toBeLessThanOrEqual(200);
    expect(getPsiCategory(unhPsi)).toBe('Unhealthy');

    // > 250 µg/m³ -> Hazardous
    const hazPsi = calculatePsiFromPm25(320);
    expect(hazPsi).toBeGreaterThanOrEqual(301);
    expect(getPsiCategory(hazPsi)).toBe('Hazardous');
  });

  it('generates exactly 31 NOAA GEFS ensemble members and fan percentiles', () => {
    const outlook = generate31GefsEnsembleOutlook('Kuala Lumpur', 80, 26.0);

    // Exactly 31 members (1 control + 30 perturbed)
    expect(outlook.ensembleMemberCount).toBe(31);
    expect(outlook.members.length).toBe(31);
    expect(outlook.members[0].name).toContain('Control');
    expect(outlook.members[1].name).toBe('GEFS p01');
    expect(outlook.members[30].name).toBe('GEFS p30');

    // Explicitly labeled as forecasts
    expect(outlook.isForecast).toBe(true);
    expect(outlook.forecastPsiRange.label).toContain('Forecast:');
    expect(outlook.forecastAqiRange.label).toContain('Forecast:');

    // Fan percentiles exist for tomorrow's 24 hours
    expect(outlook.fanPercentiles.length).toBe(9); // 0h to 24h in 3h steps
    for (const fp of outlook.fanPercentiles) {
      expect(fp.min).toBeLessThanOrEqual(fp.p10);
      expect(fp.p10).toBeLessThanOrEqual(fp.p25);
      expect(fp.p25).toBeLessThanOrEqual(fp.median);
      expect(fp.median).toBeLessThanOrEqual(fp.p75);
      expect(fp.p75).toBeLessThanOrEqual(fp.p90);
      expect(fp.p90).toBeLessThanOrEqual(fp.max);
    }
  });

  it('GET /api/outlook returns tomorrow outlook with 31 GEFS members and forecast PSI range', async () => {
    const req = new NextRequest('http://localhost:3000/api/outlook?location=Singapore&aqi=65&pm25=19');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.outlook).toBeDefined();
    expect(data.outlook.ensembleMemberCount).toBe(31);
    expect(data.outlook.isForecast).toBe(true);
    expect(data.outlook.forecastPsiRange.min).toBeGreaterThan(0);
    expect(data.outlook.forecastPsiRange.max).toBeGreaterThanOrEqual(data.outlook.forecastPsiRange.min);
    expect(data.meta.labeledAsForecast).toBe(true);
  });
});
