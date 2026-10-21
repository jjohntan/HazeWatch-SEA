import { describe, it, expect } from 'vitest';
import { getHealthAdvisory } from '@/lib/geo/advisory';
import { assessHazeSourceIntelligence } from '@/lib/geo/haze-source';
import { GET } from '@/app/api/dispersion/route';
import { NextRequest } from 'next/server';
import { HotspotGeoJSON } from '@/lib/geo/hotspots';

describe('Phase 4: Public Health Guidance & Advisories', () => {
  it('returns appropriate advisory for Good air quality (AQI <= 50)', () => {
    const adv = getHealthAdvisory(35);
    expect(adv.category).toBe('Good');
    expect(adv.generalPublic.maskRecommendation).toBe('No mask required.');
    expect(adv.schoolsAndChildren.badge).toBe('Unrestricted');
    expect(adv.medicalDisclaimer).toContain('PUBLIC HEALTH NOTICE');
  });

  it('recommends N95 masks and outdoor limits for Unhealthy air quality (AQI = 165)', () => {
    const adv = getHealthAdvisory(165);
    expect(adv.category).toBe('Unhealthy');
    expect(adv.generalPublic.maskRecommendation).toContain('N95');
    expect(adv.outdoorWorkers.badge).toBe('Hazardous Shift');
    expect(adv.sensitiveGroups.badge).toBe('High Danger');
  });

  it('issues emergency advisories for Hazardous air quality (AQI = 320)', () => {
    const adv = getHealthAdvisory(320);
    expect(adv.category).toBe('Hazardous');
    expect(adv.generalPublic.maskRecommendation).toContain('N95');
    expect(adv.schoolsAndChildren.badge).toBe('Mandatory Closure');
    expect(adv.indoorAirMeasures.length).toBeGreaterThan(0);
  });
});

describe('Phase 4: Haze Source Intelligence Engine', () => {
  const mockHotspots: HotspotGeoJSON = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [101.5, 0.5], // Sumatra (south-west of KL)
        },
        properties: {
          latitude: 0.5,
          longitude: 101.5,
          brightness: 340,
          confidence: 'high',
          acqDate: '2026-10-21',
          acqTime: '0600',
          satellite: 'NOAA-20',
          instrument: 'VIIRS',
          frp: 45.0,
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [112.5, -2.5], // Kalimantan (south-east of KL)
        },
        properties: {
          latitude: -2.5,
          longitude: 112.5,
          brightness: 330,
          confidence: 'nominal',
          acqDate: '2026-10-21',
          acqTime: '0630',
          satellite: 'NOAA-21',
          instrument: 'VIIRS',
          frp: 30.0,
        },
      },
    ],
  };

  const kualaLumpur = {
    name: 'Kuala Lumpur',
    latitude: 3.139,
    longitude: 101.6869,
  };

  it('correctly filters upwind hotspots based on wind direction', () => {
    // Southwest wind (215°): fires south-west (Sumatra) are directly upwind
    const analysisSW = assessHazeSourceIntelligence(
      kualaLumpur,
      mockHotspots,
      215, // wind from SW
      15,  // 15 km/h
      45   // moderate PM2.5
    );

    expect(analysisSW.totalRegionalHotspots).toBe(2);
    expect(analysisSW.upwindHotspotCount).toBeGreaterThanOrEqual(1);
    expect(analysisSW.uncertaintyDisclaimer).toContain('liability determination');
  });

  it('identifies dominant regional burning corridors', () => {
    const analysis = assessHazeSourceIntelligence(
      kualaLumpur,
      mockHotspots,
      215,
      12,
      35
    );

    expect(analysis.primaryUpwindClusters.length).toBeGreaterThan(0);
    const sumatraSector = analysis.primaryUpwindClusters.find((s) => s.sector.includes('Sumatra'));
    expect(sumatraSector).toBeDefined();
    expect(sumatraSector?.hotspotCount).toBeGreaterThanOrEqual(1);
  });
});

describe('Phase 4: ASEAN ASMC Smoke Dispersion API', () => {
  it('generates valid GeoJSON smoke dispersion polygons', async () => {
    const req = new NextRequest('http://localhost:3000/api/dispersion?hour=0');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.geojson).toBeDefined();
    expect(data.geojson.type).toBe('FeatureCollection');
    expect(data.geojson.features.length).toBeGreaterThanOrEqual(3);

    const firstPlume = data.geojson.features[0];
    expect(firstPlume.geometry.type).toBe('Polygon');
    expect(firstPlume.properties.plumeId).toBeDefined();
    expect(firstPlume.properties.sourceRegion).toBeDefined();
    expect(firstPlume.properties.densityUgM3).toBeGreaterThan(0);

    expect(data.meta.source).toContain('ASMC');
    expect(data.meta.caveat).toBeDefined();
  });

  it('simulates temporal advective drift when hour offset advances', async () => {
    const req0 = new NextRequest('http://localhost:3000/api/dispersion?hour=0');
    const req24 = new NextRequest('http://localhost:3000/api/dispersion?hour=24');

    const res0 = await GET(req0);
    const res24 = await GET(req24);

    const data0 = await res0.json();
    const data24 = await res24.json();

    const coord0 = data0.geojson.features[0].geometry.coordinates[0][0];
    const coord24 = data24.geojson.features[0].geometry.coordinates[0][0];

    // Due to NE advection drift, coordinates at +24h are drifted north-eastward
    expect(coord24[0]).toBeGreaterThan(coord0[0]); // longitude drifted east
    expect(coord24[1]).toBeGreaterThan(coord0[1]); // latitude drifted north
  });
});
