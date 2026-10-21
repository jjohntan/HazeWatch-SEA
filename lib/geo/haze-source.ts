import { LocationCoords } from '@/types';
import { HotspotGeoJSON } from './hotspots';

export interface UpwindSectorAssessment {
  sector: string; // e.g. "Southwest (Sumatra)", "East (Kalimantan)"
  hotspotCount: number;
  totalFrpMw: number;
  meanDistanceKm: number;
  windAlignmentScore: number; // 0 to 1 (how directly wind blows from this cluster to user)
}

export interface HazeSourceAnalysis {
  riskLevel: 'Minimal' | 'Guarded' | 'Elevated' | 'Severe';
  riskScore: number; // 0 - 100
  dominantWindVector: {
    degrees: number;
    speedKmh: number;
    compass: string;
    blowingFrom: string;
  };
  upwindHotspotCount: number;
  totalRegionalHotspots: number;
  primaryUpwindClusters: UpwindSectorAssessment[];
  summaryNarrative: string;
  confidenceRating: 'High' | 'Moderate' | 'Low (Sparse Data)';
  uncertaintyDisclaimer: string;
}

// Great-circle distance between two coordinates in kilometers
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Bearing from point 1 to point 2 in degrees (0 = North, 90 = East, 180 = South, 270 = West)
function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}

// Get regional geographic sector label relative to Malaysia / SEA
function getSectorLabel(lat: number, lon: number): string {
  if (lat < 2.5 && lon < 105.0) return 'Southwest Sector (Sumatra)';
  if (lat < 4.0 && lon >= 108.0 && lon <= 118.0) return 'Southeast Sector (Kalimantan / Borneo)';
  if (lat >= 6.0 && lon < 105.0) return 'Northwest Sector (Indochina / Thailand)';
  if (lat >= 1.0 && lat <= 7.0 && lon >= 99.5 && lon <= 104.5) return 'Peninsular Local Sector';
  if (lat >= 1.0 && lat <= 7.0 && lon > 109.0) return 'East Malaysia Local Sector (Sabah & Sarawak)';
  return 'Regional Boundary';
}

/**
 * Correlates real-time satellite fire hotspots with localized meteorological wind vectors
 * to generate an indicative haze trajectory assessment for the chosen location.
 */
export function assessHazeSourceIntelligence(
  userLocation: LocationCoords,
  hotspotsGeoJson: HotspotGeoJSON | null,
  windDirectionDeg: number = 225, // default Southwest monsoon
  windSpeedKmh: number = 12,
  currentPm25: number = 25
): HazeSourceAnalysis {
  const disclaimer =
    'SCIENTIFIC SOURCE ATTRIBUTION NOTICE: This assessment is an automated numerical correlation between satellite thermal anomalies and surface wind vectors. Satellite detections represent heat signatures and may include agricultural, peatland, or industrial heat. Smoke trajectory models are indicative and do not constitute legal cross-border liability determination.';

  if (!hotspotsGeoJson || !hotspotsGeoJson.features || hotspotsGeoJson.features.length === 0) {
    return {
      riskLevel: 'Minimal',
      riskScore: 5,
      dominantWindVector: {
        degrees: windDirectionDeg,
        speedKmh: windSpeedKmh,
        compass: 'SW',
        blowingFrom: 'Southwest',
      },
      upwindHotspotCount: 0,
      totalRegionalHotspots: 0,
      primaryUpwindClusters: [],
      summaryNarrative:
        'Zero thermal anomalies detected by NOAA-20/21 satellites in the regional coverage zone within the past observation cycle.',
      confidenceRating: 'Low (Sparse Data)',
      uncertaintyDisclaimer: disclaimer,
    };
  }

  const totalFeatures = hotspotsGeoJson.features.length;

  // The direction from which wind blows into the user's location
  // E.g., if windDirectionDeg = 225° (SW wind), the wind is coming FROM the Southwest (225°)
  const upwindAzimuth = (windDirectionDeg + 360) % 360;

  const sectorsMap: Record<string, { count: number; totalFrp: number; distances: number[]; alignments: number[] }> = {};
  let upwindCount = 0;

  for (const feature of hotspotsGeoJson.features) {
    const [hLon, hLat] = feature.geometry.coordinates;
    const distanceKm = getDistanceKm(userLocation.latitude, userLocation.longitude, hLat, hLon);

    // Limit influence radius to 1,200 km for regional transboundary smoke transport
    if (distanceKm > 1200 || distanceKm < 5) continue;

    // Bearing from user to the hotspot (where the hotspot is located relative to user)
    const bearingFromUserToHotspot = getBearing(userLocation.latitude, userLocation.longitude, hLat, hLon);

    // Angle difference between hotspot bearing and wind origin
    // If the wind comes from 225° and hotspot is at 225°, diff = 0° (directly upwind!)
    let angleDiff = Math.abs(bearingFromUserToHotspot - upwindAzimuth);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;

    // A hotspot is considered "upwind" if it lies within a 65° cone of the wind trajectory
    if (angleDiff <= 65) {
      upwindCount++;
      const sector = getSectorLabel(hLat, hLon);
      const frp = feature.properties.frp || 10;
      const alignment = Math.max(0, 1 - angleDiff / 65);

      if (!sectorsMap[sector]) {
        sectorsMap[sector] = { count: 0, totalFrp: 0, distances: [], alignments: [] };
      }
      sectorsMap[sector].count += 1;
      sectorsMap[sector].totalFrp += frp;
      sectorsMap[sector].distances.push(distanceKm);
      sectorsMap[sector].alignments.push(alignment);
    }
  }

  // Aggregate sectors
  const primaryUpwindClusters: UpwindSectorAssessment[] = Object.entries(sectorsMap).map(
    ([sector, data]) => {
      const avgDist = data.distances.reduce((a, b) => a + b, 0) / data.distances.length;
      const avgAlign = data.alignments.reduce((a, b) => a + b, 0) / data.alignments.length;
      return {
        sector,
        hotspotCount: data.count,
        totalFrpMw: Math.round(data.totalFrp),
        meanDistanceKm: Math.round(avgDist),
        windAlignmentScore: Number(avgAlign.toFixed(2)),
      };
    }
  );

  // Sort sectors by hotspot count descending
  primaryUpwindClusters.sort((a, b) => b.hotspotCount - a.hotspotCount);

  // Risk Score calculation (0 - 100) based on upwind hotspot volume, wind speed, and current PM2.5
  let riskScore = 0;
  riskScore += Math.min(45, (upwindCount / 60) * 45); // upwind volume up to 45 pts
  riskScore += Math.min(30, (currentPm25 / 100) * 30); // elevated particulate up to 30 pts
  if (windSpeedKmh > 10) riskScore += 15; // wind capable of transboundary advection
  riskScore = Math.min(100, Math.round(riskScore));

  let riskLevel: HazeSourceAnalysis['riskLevel'] = 'Minimal';
  if (riskScore >= 75) riskLevel = 'Severe';
  else if (riskScore >= 50) riskLevel = 'Elevated';
  else if (riskScore >= 25) riskLevel = 'Guarded';

  // Format wind compass
  const compassDir = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][
    Math.round((windDirectionDeg % 360) / 22.5) % 16
  ];

  // Narrative summary
  let summaryNarrative = '';
  if (upwindCount === 0) {
    summaryNarrative = `Surface winds are blowing from the ${compassDir} at ${windSpeedKmh} km/h with no significant satellite thermal anomaly clusters positioned in the immediate upwind trajectory towards ${userLocation.name}.`;
  } else {
    const topCluster = primaryUpwindClusters[0];
    summaryNarrative = `Trajectory analysis detects ${upwindCount} thermal anomalies aligned with prevailing ${compassDir} winds (${windSpeedKmh} km/h). Primary active concentration is situated in the ${topCluster?.sector || 'regional boundary'} (~${topCluster?.meanDistanceKm || 0} km away), indicating potential smoke plume transport towards the local monitoring basin.`;
  }

  return {
    riskLevel,
    riskScore,
    dominantWindVector: {
      degrees: Math.round(windDirectionDeg),
      speedKmh: Math.round(windSpeedKmh),
      compass: compassDir,
      blowingFrom: `${compassDir} (${Math.round(windDirectionDeg)}°)`,
    },
    upwindHotspotCount: upwindCount,
    totalRegionalHotspots: totalFeatures,
    primaryUpwindClusters: primaryUpwindClusters.slice(0, 3),
    summaryNarrative,
    confidenceRating: totalFeatures > 100 ? 'High' : 'Moderate',
    uncertaintyDisclaimer: disclaimer,
  };
}
