import { US_AQI_LEVELS } from '@/lib/constants';
import { AQICategory } from '@/types';

export function getAqiCategory(aqi: number): {
  category: AQICategory;
  color: string;
  textColor: string;
  description: string;
} {
  const match = US_AQI_LEVELS.find((lvl) => aqi >= lvl.min && aqi <= lvl.max);
  if (match) {
    return {
      category: match.category as AQICategory,
      color: match.color,
      textColor: match.textColor,
      description: match.desc,
    };
  }
  // Fallback for > 500
  const last = US_AQI_LEVELS[US_AQI_LEVELS.length - 1];
  return {
    category: last.category as AQICategory,
    color: last.color,
    textColor: last.textColor,
    description: last.desc,
  };
}

export function formatMalaysiaTime(dateInput: string | Date | number): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'N/A';
  
  return new Intl.DateTimeFormat('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date) + ' (MYT UTC+8)';
}

export function getWindCompass(degrees: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return dirs[index];
}
