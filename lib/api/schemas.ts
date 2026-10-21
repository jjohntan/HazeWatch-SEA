import { z } from 'zod';

// Request Query Parameters Schema
export const GeoCoordsQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  forecast_hours: z.coerce.number().min(1).max(96).default(48),
});

// Upstream Open-Meteo Air Quality Response Schema
export const OpenMeteoAirQualitySchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  current: z.object({
    time: z.string(),
    pm2_5: z.number().nullable().optional(),
    pm10: z.number().nullable().optional(),
    us_aqi: z.number().nullable().optional(),
  }).optional(),
  hourly: z.object({
    time: z.array(z.string()),
    pm2_5: z.array(z.number().nullable()),
    pm10: z.array(z.number().nullable()),
    us_aqi: z.array(z.number().nullable()),
  }),
});

// Upstream Open-Meteo Weather Response Schema
export const OpenMeteoWeatherSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  current: z.object({
    time: z.string(),
    wind_speed_10m: z.number().nullable().optional(),
    wind_direction_10m: z.number().nullable().optional(),
  }).optional(),
  hourly: z.object({
    time: z.array(z.string()),
    wind_speed_10m: z.array(z.number().nullable()),
    wind_direction_10m: z.array(z.number().nullable()),
  }),
});

// Normalized Air Quality Output Schema
export const NormalizedAirQualitySchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  current: z.object({
    pm2_5: z.number(),
    pm10: z.number(),
    us_aqi: z.number(),
    category: z.string(),
    categoryColor: z.string(),
    dominantPollutant: z.string(),
    windSpeed10m: z.number(),
    windDirection10m: z.number(),
    timestamp: z.string(),
    source: z.string(),
    isModelEstimate: z.boolean(),
  }),
  meta: z.object({
    dataSource: z.string(),
    model: z.string(),
    cached: z.boolean(),
    cachedAt: z.string().optional(),
    isStale: z.boolean(),
    updatedAt: z.string(),
  }),
});
