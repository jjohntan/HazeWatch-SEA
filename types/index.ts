export type AQIStandard = 'US_AQI' | 'MY_API';

export type AQICategory = 
  | 'Good' 
  | 'Moderate' 
  | 'Unhealthy for Sensitive Groups' 
  | 'Unhealthy' 
  | 'Very Unhealthy' 
  | 'Hazardous';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  name: string;
  country?: string;
  isUserLocation?: boolean;
}

export interface CurrentAirQuality {
  pm2_5: number;
  pm10: number;
  us_aqi: number;
  category: AQICategory;
  categoryColor: string;
  dominantPollutant: string;
  windSpeed10m: number;
  windDirection10m: number;
  timestamp: string; // ISO String
  source: string;
  isModelEstimate: boolean;
}

export interface HourlyForecastItem {
  time: string; // ISO String
  pm2_5: number;
  pm10: number;
  us_aqi: number;
  windSpeed10m?: number;
  windDirection10m?: number;
}

export interface ForecastResponse {
  location: LocationCoords;
  current: CurrentAirQuality;
  hourly: HourlyForecastItem[];
  meta: {
    dataSource: string;
    model: string;
    timezone: string;
    updatedAt: string;
  };
}

export interface SatelliteHotspot {
  id: string;
  latitude: number;
  longitude: number;
  brightness: number;
  scan?: number;
  track?: number;
  acqDate: string;
  acqTime: string;
  satellite: string;
  instrument: string;
  confidence: 'low' | 'nominal' | 'high' | number;
  frp?: number; // Fire Radiative Power (MW)
  daynight?: 'D' | 'N';
}

export interface MapLayerState {
  airQuality: boolean;
  hotspots: boolean;
  wind: boolean;
  dispersion: boolean;
}

export interface HotspotFilterState {
  timeRangeHours: 24 | 48;
  satellite: 'all' | 'NOAA-20' | 'NOAA-21' | 'VIIRS';
  minConfidence: 'all' | 'nominal' | 'high';
}

export interface TimelineState {
  selectedHourOffset: number; // 0 to 48
  isPlaying: boolean;
  speedMs: number;
}
