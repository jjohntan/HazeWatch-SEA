import { describe, it, expect } from 'vitest';
import { parseFirmsCsvToGeoJson, generateRealisticFallbackHotspots } from '@/lib/geo/hotspots';

describe('NASA FIRMS CSV to GeoJSON Parsing', () => {
  it('parses valid NASA FIRMS VIIRS CSV into GeoJSON FeatureCollection', () => {
    const csvData = `latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
1.234,101.567,345.2,0.4,0.3,2026-10-21,0630,N20,VIIRS,nominal,2.0NRT,295.2,18.4,D
-2.456,112.789,360.1,0.5,0.4,2026-10-21,0715,N21,VIIRS,high,2.0NRT,301.0,42.8,D`;

    const geojson = parseFirmsCsvToGeoJson(csvData);
    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.features.length).toBe(2);

    const first = geojson.features[0];
    expect(first.geometry.coordinates).toEqual([101.567, 1.234]); // GeoJSON is [lng, lat]
    expect(first.properties.satellite).toBe('NOAA-20');
    expect(first.properties.confidence).toBe('nominal');
    expect(first.properties.frp).toBe(18.4);

    const second = geojson.features[1];
    expect(second.properties.satellite).toBe('NOAA-21');
    expect(second.properties.confidence).toBe('high');
    expect(second.properties.frp).toBe(42.8);
  });

  it('handles empty or malformed CSV gracefully', () => {
    const empty = parseFirmsCsvToGeoJson('');
    expect(empty.features.length).toBe(0);

    const headerOnly = parseFirmsCsvToGeoJson('latitude,longitude,brightness\n');
    expect(headerOnly.features.length).toBe(0);
  });

  it('generates calibrated Southeast Asia fallback hotspots with valid coordinates', () => {
    const fallback = generateRealisticFallbackHotspots();
    expect(fallback.features.length).toBeGreaterThan(5);
    for (const f of fallback.features) {
      expect(f.geometry.coordinates[0]).toBeGreaterThanOrEqual(92);
      expect(f.geometry.coordinates[0]).toBeLessThanOrEqual(142);
      expect(f.geometry.coordinates[1]).toBeGreaterThanOrEqual(-12);
      expect(f.geometry.coordinates[1]).toBeLessThanOrEqual(24);
      expect(f.properties.isSimulated).toBe(true);
    }
  });
});
