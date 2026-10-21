import { LocationCoords } from '@/types';

// Southeast Asia Region Bounding Box: [minLng, minLat, maxLng, maxLat]
export const SEA_BOUNDS: [number, number, number, number] = [92.0, -12.0, 142.0, 24.0];

// Malaysia Default View
export const DEFAULT_CENTER = {
  longitude: 101.9758,
  latitude: 4.2105,
  zoom: 5.6,
};

// Preset Strategic Southeast Asian Locations with Malaysia as First-Class Focus
export const LOCATION_PRESETS: LocationCoords[] = [
  // Malaysia (Primary Focus)
  { name: 'Kuala Lumpur', country: 'Malaysia', latitude: 3.1390, longitude: 101.6869 },
  { name: 'Penang (George Town)', country: 'Malaysia', latitude: 5.4141, longitude: 100.3288 },
  { name: 'Johor Bahru', country: 'Malaysia', latitude: 1.4927, longitude: 103.7414 },
  { name: 'Kuching (Sarawak)', country: 'Malaysia', latitude: 1.5533, longitude: 110.3592 },
  { name: 'Kota Kinabalu (Sabah)', country: 'Malaysia', latitude: 5.9804, longitude: 116.0735 },
  { name: 'Kuantan (Pahang)', country: 'Malaysia', latitude: 3.8077, longitude: 103.3260 },
  { name: 'Ipoh (Perak)', country: 'Malaysia', latitude: 4.5975, longitude: 101.0901 },
  // Regional Southeast Asia
  { name: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
  { name: 'Jakarta', country: 'Indonesia', latitude: -6.2088, longitude: 106.8456 },
  { name: 'Pekanbaru (Sumatra)', country: 'Indonesia', latitude: 0.5071, longitude: 101.4478 },
  { name: 'Pontianak (Kalimantan)', country: 'Indonesia', latitude: -0.0263, longitude: 109.3425 },
  { name: 'Bangkok', country: 'Thailand', latitude: 13.7563, longitude: 100.5018 },
  { name: 'Manila', country: 'Philippines', latitude: 14.5995, longitude: 120.9842 },
  { name: 'Ho Chi Minh City', country: 'Vietnam', latitude: 10.8231, longitude: 106.6297 },
  { name: 'Bandar Seri Begawan', country: 'Brunei', latitude: 4.9031, longitude: 114.9398 },
];

// Basemap Configuration (Reliable Carto Dark Matter raster/vector style)
export const MAP_STYLES = {
  dark: {
    name: 'Carto Dark Matter',
    styleUrl: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
};

// US EPA AQI Categories & Thresholds
export const US_AQI_LEVELS = [
  { min: 0, max: 50, category: 'Good', color: '#10b981', textColor: '#ffffff', desc: 'Air quality is satisfactory and poses little or no risk.' },
  { min: 51, max: 100, category: 'Moderate', color: '#eab308', textColor: '#000000', desc: 'Acceptable quality; sensitive individuals may experience mild effects.' },
  { min: 101, max: 150, category: 'Unhealthy for Sensitive Groups', color: '#f97316', textColor: '#ffffff', desc: 'General public not likely affected; sensitive groups may experience irritation.' },
  { min: 151, max: 200, category: 'Unhealthy', color: '#ef4444', textColor: '#ffffff', desc: 'Everyone may begin to experience health effects; sensitive groups more serious.' },
  { min: 201, max: 300, category: 'Very Unhealthy', color: '#a855f7', textColor: '#ffffff', desc: 'Health alert: risk of health effects increased for everyone.' },
  { min: 301, max: 500, category: 'Hazardous', color: '#7f1d1d', textColor: '#ffffff', desc: 'Emergency conditions; entire population is more likely to be affected.' },
] as const;

// Malaysian DOE Air Pollutant Index (API / IPU) for comparison
export const MALAYSIA_API_LEVELS = [
  { min: 0, max: 50, category: 'Baik (Good)', color: '#3b82f6' },
  { min: 51, max: 100, category: 'Sederhana (Moderate)', color: '#10b981' },
  { min: 101, max: 200, category: 'Tidak Sihat (Unhealthy)', color: '#eab308' },
  { min: 201, max: 300, category: 'Sangat Tidak Sihat (Very Unhealthy)', color: '#ef4444' },
  { min: 301, max: 999, category: 'Berbahaya (Hazardous)', color: '#7f1d1d' },
] as const;
