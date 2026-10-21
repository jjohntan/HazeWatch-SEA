export interface HotspotFeatureProperties {
  id: string;
  latitude: number;
  longitude: number;
  brightness: number;
  acqDate: string;
  acqTime: string;
  satellite: string;
  instrument: string;
  confidence: string;
  frp: number;
  daynight: string;
  isSimulated?: boolean;
}

export interface HotspotGeoJSON {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: 'Point';
      coordinates: [number, number]; // [lng, lat]
    };
    properties: HotspotFeatureProperties;
  }>;
}

/**
 * Parses raw CSV text from NASA FIRMS API into structured GeoJSON
 */
export function parseFirmsCsvToGeoJson(csvText: string, isSimulated = false): HotspotGeoJSON {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return { type: 'FeatureCollection', features: [] };
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const latIdx = header.indexOf('latitude');
  const lngIdx = header.indexOf('longitude');
  const brightIdx = header.indexOf('bright_ti4') !== -1 ? header.indexOf('bright_ti4') : header.indexOf('brightness');
  const dateIdx = header.indexOf('acq_date');
  const timeIdx = header.indexOf('acq_time');
  const satIdx = header.indexOf('satellite');
  const confIdx = header.indexOf('confidence');
  const frpIdx = header.indexOf('frp');
  const dnIdx = header.indexOf('daynight');

  const features: HotspotGeoJSON['features'] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map((c) => c.trim());
    if (row.length < header.length) continue;

    const lat = parseFloat(row[latIdx]);
    const lng = parseFloat(row[lngIdx]);
    if (isNaN(lat) || isNaN(lng)) continue;

    const brightness = brightIdx !== -1 ? parseFloat(row[brightIdx]) : 300;
    const acqDate = dateIdx !== -1 ? row[dateIdx] : '';
    const acqTime = timeIdx !== -1 ? row[timeIdx] : '';
    const rawSat = satIdx !== -1 ? row[satIdx] : 'VIIRS';
    const satellite = rawSat === 'N20' ? 'NOAA-20' : rawSat === 'N21' ? 'NOAA-21' : rawSat;
    const confidence = confIdx !== -1 ? row[confIdx] : 'nominal';
    const frp = frpIdx !== -1 ? parseFloat(row[frpIdx]) || 5.0 : 5.0;
    const daynight = dnIdx !== -1 ? row[dnIdx] : 'D';

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties: {
        id: `hotspot-${i}-${lat.toFixed(3)}-${lng.toFixed(3)}`,
        latitude: lat,
        longitude: lng,
        brightness: isNaN(brightness) ? 300 : brightness,
        acqDate,
        acqTime: acqTime ? `${acqTime.slice(0, 2)}:${acqTime.slice(2, 4)} UTC` : 'N/A',
        satellite,
        instrument: 'VIIRS',
        confidence,
        frp: isNaN(frp) ? 5.0 : frp,
        daynight,
        isSimulated,
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Realistic regional fallback detections when NASA FIRMS key is absent
 * Covers active agricultural/clearing corridors in Sumatra, Kalimantan, and Indochina
 */
export function generateRealisticFallbackHotspots(): HotspotGeoJSON {
  const sampleClusters = [
    // Central/South Sumatra (Riau / Jambi / South Sumatra)
    { lat: 0.85, lng: 101.45, frp: 28.5, sat: 'NOAA-20', conf: 'high' },
    { lat: 0.92, lng: 101.52, frp: 18.2, sat: 'NOAA-20', conf: 'nominal' },
    { lat: -1.65, lng: 103.62, frp: 45.0, sat: 'NOAA-21', conf: 'high' },
    { lat: -2.95, lng: 104.75, frp: 12.4, sat: 'NOAA-21', conf: 'nominal' },
    { lat: -3.12, lng: 104.91, frp: 31.8, sat: 'NOAA-20', conf: 'high' },
    // West & Central Kalimantan
    { lat: -0.15, lng: 109.45, frp: 15.6, sat: 'NOAA-21', conf: 'nominal' },
    { lat: -1.82, lng: 110.15, frp: 22.3, sat: 'NOAA-20', conf: 'nominal' },
    { lat: -2.45, lng: 112.35, frp: 52.1, sat: 'NOAA-21', conf: 'high' },
    { lat: -2.52, lng: 112.41, frp: 68.4, sat: 'NOAA-20', conf: 'high' },
    { lat: -1.25, lng: 113.82, frp: 19.0, sat: 'NOAA-21', conf: 'nominal' },
    // Indochina / Northern SEA corridor (Cambodia / Lower Myanmar)
    { lat: 12.85, lng: 103.25, frp: 14.1, sat: 'NOAA-20', conf: 'nominal' },
    { lat: 13.45, lng: 104.12, frp: 38.6, sat: 'NOAA-21', conf: 'high' },
    { lat: 15.65, lng: 101.85, frp: 24.5, sat: 'NOAA-20', conf: 'nominal' },
    // Peninsular Malaysia localized agricultural/biomass
    { lat: 3.45, lng: 101.25, frp: 8.5, sat: 'NOAA-21', conf: 'low' },
    { lat: 4.85, lng: 100.82, frp: 9.2, sat: 'NOAA-20', conf: 'nominal' },
    { lat: 2.15, lng: 102.85, frp: 11.4, sat: 'NOAA-21', conf: 'nominal' },
  ];

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  return {
    type: 'FeatureCollection',
    features: sampleClusters.map((c, idx) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [c.lng, c.lat],
      },
      properties: {
        id: `sim-hotspot-${idx + 1}`,
        latitude: c.lat,
        longitude: c.lng,
        brightness: 330 + Math.random() * 20,
        acqDate: dateStr,
        acqTime: '06:15 UTC',
        satellite: c.sat,
        instrument: 'VIIRS',
        confidence: c.conf,
        frp: c.frp,
        daynight: 'D',
        isSimulated: true,
      },
    })),
  };
}
