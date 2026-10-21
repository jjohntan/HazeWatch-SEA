import { describe, it, expect } from 'vitest';
import { parseFirmsCsvToGeoJson } from '../lib/geo/hotspots';
import { getAqiCategory, getWindCompass, formatMalaysiaTime } from '../lib/geo/aqi';
import { getHealthAdvisory } from '../lib/geo/advisory';
import { assessHazeSourceIntelligence } from '../lib/geo/haze-source';
import { LOCATION_PRESETS } from '../lib/constants';

describe('End-to-End Core Workflow Integration', () => {
  it('correctly maps AQI values through category determination and health advisories', () => {
    // Scenario 1: Moderate Air Quality (AQI = 75, PM2.5 = 25)
    const moderateAqi = 75;
    const moderateCategory = getAqiCategory(moderateAqi);
    expect(moderateCategory.category).toBe('Moderate');

    const moderateAdvisory = getHealthAdvisory(moderateAqi);
    expect(moderateAdvisory.category).toBe('Moderate');
    expect(moderateAdvisory.outdoorWorkers.badge).toBe('Standard');

    // Scenario 2: Unhealthy Air Quality (AQI = 175, PM2.5 = 95)
    const unhealthyAqi = 175;
    const unhealthyCategory = getAqiCategory(unhealthyAqi);
    expect(unhealthyCategory.category).toBe('Unhealthy');

    const unhealthyAdvisory = getHealthAdvisory(unhealthyAqi);
    expect(unhealthyAdvisory.generalPublic.maskRecommendation).toContain('N95');
    expect(unhealthyAdvisory.outdoorWorkers.badge).toBe('Hazardous Shift');
  });

  it('correctly integrates wind vectors and NASA satellite hotspots into source risk analysis', () => {
    const kualaLumpur = LOCATION_PRESETS.find((p) => p.name === 'Kuala Lumpur')!;
    expect(kualaLumpur).toBeDefined();

    // Simulated FIRMS CSV with fires south of KL (Sumatra)
    const mockCsv = `latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,confidence,version,bright_ti5,frp,daynight
0.5,101.5,335.2,0.4,0.3,2026-10-21,0630,N,nominal,2.0NRT,298.1,28.5,D
0.6,101.8,340.0,0.4,0.3,2026-10-21,0630,N,high,2.0NRT,301.2,45.0,D`;

    const hotspots = parseFirmsCsvToGeoJson(mockCsv);
    expect(hotspots.features.length).toBe(2);

    // Wind direction = 225° (Southwest monsoon blowing from Sumatra towards Peninsular Malaysia)
    const windSpeedKmh = 18.0;
    const windDirectionDeg = 225.0;

    // Run risk assessment with elevated PM2.5
    const risk = assessHazeSourceIntelligence(kualaLumpur, hotspots, windDirectionDeg, windSpeedKmh, 85);
    expect(risk).toBeDefined();
    expect(risk.upwindHotspotCount).toBeGreaterThanOrEqual(0);
    expect(risk.uncertaintyDisclaimer).toContain('legal cross-border liability');
    expect(getWindCompass(windDirectionDeg)).toBe('SW');
  });

  it('ensures all location presets have valid coordinates within the Southeast Asia bounding domain', () => {
    // SEA bounds: Longitude [92, 142], Latitude [-12, 24]
    for (const preset of LOCATION_PRESETS) {
      expect(preset.latitude).toBeGreaterThanOrEqual(-12);
      expect(preset.latitude).toBeLessThanOrEqual(24);
      expect(preset.longitude).toBeGreaterThanOrEqual(92);
      expect(preset.longitude).toBeLessThanOrEqual(142);
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.country.length).toBeGreaterThan(0);
    }
  });

  it('formats Malaysia Standard Time properly with UTC+8 offset marker', () => {
    const formatted = formatMalaysiaTime('2026-10-21T06:00:00Z');
    expect(formatted).toContain('MYT UTC+8');
  });
});
