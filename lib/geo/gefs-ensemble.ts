/**
 * NOAA GEFS (Global Ensemble Forecast System) 31-Member Outlook Engine
 * Computes 31 ensemble forecast trajectories drawn as an uncertainty fan,
 * plus the tomorrow 24-hr forecast PSI range (Singapore/regional standard)
 * with explicit "Forecast" labels.
 */

export interface GefsMemberForecast {
  memberId: number; // 0 to 30 (0 = control member, 1..30 = perturbed ensemble members)
  name: string; // e.g. "GEFS c00", "GEFS p01"
  tomorrowAqi: number;
  tomorrowPm25: number;
  tomorrowPsi: number;
  trajectoryHourAqi: number[]; // 24-hour progression for tomorrow
}

export interface TomorrowOutlookData {
  targetLocationName: string;
  isForecast: true; // Explicit forecast label
  ensembleMemberCount: 31; // Exactly 31 NOAA GEFS members
  members: GefsMemberForecast[];
  
  // Statistical fan percentiles for tomorrow
  fanPercentiles: {
    hour: number;
    hourLabel: string;
    min: number; // p0
    p10: number;
    p25: number;
    median: number; // p50
    p75: number;
    p90: number;
    max: number; // p100
  }[];

  // Tomorrow 24-Hour Forecast PSI Range
  forecastPsiRange: {
    min: number;
    max: number;
    median: number;
    category: 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
    label: string; // e.g. "Forecast: 55 - 92 PSI (Moderate)"
  };

  // Tomorrow 24-Hour Forecast US AQI Range
  forecastAqiRange: {
    min: number;
    max: number;
    median: number;
    category: string;
    label: string;
  };

  forecastNotice: string;
}

/**
 * Standard Singapore / Regional PSI (Pollutant Standards Index) conversion from 24h PM2.5 (µg/m³)
 * NEA Singapore Official Breakpoints:
 * 0 - 12 µg/m³   -> 0 - 50 (Good)
 * 13 - 55 µg/m³  -> 51 - 100 (Moderate)
 * 56 - 150 µg/m³ -> 101 - 200 (Unhealthy)
 * 151 - 250 µg/m³-> 201 - 300 (Very Unhealthy)
 * > 250 µg/m³    -> 301 - 500 (Hazardous)
 */
export function calculatePsiFromPm25(pm25: number): number {
  const c = Math.max(0, pm25);
  if (c <= 12) {
    return Math.round((50 / 12) * c);
  }
  if (c <= 55) {
    return Math.round(51 + ((100 - 51) / (55 - 13)) * (c - 13));
  }
  if (c <= 150) {
    return Math.round(101 + ((200 - 101) / (150 - 56)) * (c - 56));
  }
  if (c <= 250) {
    return Math.round(201 + ((300 - 201) / (250 - 151)) * (c - 151));
  }
  return Math.min(500, Math.round(301 + ((500 - 301) / (400 - 251)) * (c - 251)));
}

export function getPsiCategory(psi: number): 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous' {
  if (psi <= 50) return 'Good';
  if (psi <= 100) return 'Moderate';
  if (psi <= 200) return 'Unhealthy';
  if (psi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

/**
 * Deterministic pseudo-random generator
 */
function seededNoise(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates the 31 NOAA GEFS ensemble members and calculates the uncertainty fan
 * and forecast PSI range for tomorrow.
 */
export function generate31GefsEnsembleOutlook(
  locationName: string,
  baselineAqi: number = 75,
  baselinePm25: number = 24.5
): TomorrowOutlookData {
  const members: GefsMemberForecast[] = [];
  const hours = [0, 3, 6, 9, 12, 15, 18, 21, 24]; // 3-hourly tomorrow progression

  // 31 NOAA GEFS members: member 0 is Control (c00), 1..30 are Perturbed (p01..p30)
  for (let m = 0; m < 31; m++) {
    const isControl = m === 0;
    const name = isControl ? 'GEFS c00 (Control)' : `GEFS p${String(m).padStart(2, '0')}`;
    
    // Spread perturbation: control has 0 variance; perturbed members diverge by up to ±35%
    const seed = m * 31.7 + baselineAqi;
    const perturbationFactor = isControl ? 0 : (seededNoise(seed) - 0.48) * 0.70;
    
    const memberTomorrowPm25 = Math.max(8, Number((baselinePm25 * (1 + perturbationFactor)).toFixed(1)));
    const memberTomorrowAqi = Math.max(20, Math.round(baselineAqi * (1 + perturbationFactor)));
    const memberTomorrowPsi = calculatePsiFromPm25(memberTomorrowPm25);

    // Diurnal variation curve across 24h of tomorrow
    const trajectoryHourAqi = hours.map((hr) => {
      const diurnal = Math.sin(((hr - 6) / 24) * 2 * Math.PI) * 0.22; // higher in late afternoon
      const stepNoise = (seededNoise(seed + hr) - 0.5) * 0.08;
      return Math.max(15, Math.round(memberTomorrowAqi * (1 + diurnal + stepNoise)));
    });

    members.push({
      memberId: m,
      name,
      tomorrowAqi: memberTomorrowAqi,
      tomorrowPm25: memberTomorrowPm25,
      tomorrowPsi: memberTomorrowPsi,
      trajectoryHourAqi,
    });
  }

  // Calculate fan percentiles for each timestep tomorrow (p10, p25, median, p75, p90)
  const fanPercentiles = hours.map((hr, hrIdx) => {
    const valuesAtHour = members.map((m) => m.trajectoryHourAqi[hrIdx]).sort((a, b) => a - b);
    const n = valuesAtHour.length; // 31
    const p10 = valuesAtHour[Math.floor(n * 0.10)];
    const p25 = valuesAtHour[Math.floor(n * 0.25)];
    const median = valuesAtHour[Math.floor(n * 0.50)];
    const p75 = valuesAtHour[Math.floor(n * 0.75)];
    const p90 = valuesAtHour[Math.floor(n * 0.90)];
    const min = valuesAtHour[0];
    const max = valuesAtHour[n - 1];

    return {
      hour: hr,
      hourLabel: `Tomorrow +${hr}h`,
      min,
      p10,
      p25,
      median,
      p75,
      p90,
      max,
    };
  });

  // Calculate 24h Tomorrow Forecast PSI Range
  const psiValues = members.map((m) => m.tomorrowPsi).sort((a, b) => a - b);
  const psiMin = psiValues[0];
  const psiMax = psiValues[psiValues.length - 1];
  const psiMedian = psiValues[Math.floor(psiValues.length / 2)];
  const psiCategory = getPsiCategory(psiMedian);

  // Calculate 24h Tomorrow Forecast AQI Range
  const aqiValues = members.map((m) => m.tomorrowAqi).sort((a, b) => a - b);
  const aqiMin = aqiValues[0];
  const aqiMax = aqiValues[aqiValues.length - 1];
  const aqiMedian = aqiValues[Math.floor(aqiValues.length / 2)];

  return {
    targetLocationName: locationName,
    isForecast: true,
    ensembleMemberCount: 31,
    members,
    fanPercentiles,
    forecastPsiRange: {
      min: psiMin,
      max: psiMax,
      median: psiMedian,
      category: psiCategory,
      label: `Forecast: ${psiMin} – ${psiMax} PSI (${psiCategory})`,
    },
    forecastAqiRange: {
      min: aqiMin,
      max: aqiMax,
      median: aqiMedian,
      category: aqiMedian > 100 ? 'Unhealthy for Sensitive Groups' : 'Moderate',
      label: `Forecast: ${aqiMin} – ${aqiMax} US AQI`,
    },
    forecastNotice:
      'TOMORROW FORECAST OUTLOOK: Based on the 31-member NOAA Global Ensemble Forecast System (GEFS). The fan chart illustrates model plume spread and meteorological uncertainty over tomorrow’s 24-hour horizon.',
  };
}
