import { describe, it, expect } from 'vitest';
import { GeoCoordsQuerySchema, OpenMeteoAirQualitySchema } from '@/lib/api/schemas';

describe('API Zod Validation Schemas', () => {
  it('accepts valid coordinates within Southeast Asia', () => {
    const valid = GeoCoordsQuerySchema.safeParse({
      latitude: '3.1390',
      longitude: '101.6869',
      forecast_hours: '48',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.latitude).toBeCloseTo(3.139);
      expect(valid.data.longitude).toBeCloseTo(101.6869);
      expect(valid.data.forecast_hours).toBe(48);
    }
  });

  it('rejects invalid or out-of-range coordinates', () => {
    const invalidLat = GeoCoordsQuerySchema.safeParse({
      latitude: '95.0', // > 90
      longitude: '101.68',
    });
    expect(invalidLat.success).toBe(false);

    const invalidLng = GeoCoordsQuerySchema.safeParse({
      latitude: '3.13',
      longitude: '250', // > 180
    });
    expect(invalidLng.success).toBe(false);
  });

  it('parses typical Open-Meteo air quality payload correctly', () => {
    const samplePayload = {
      latitude: 3.14,
      longitude: 101.69,
      timezone: 'Asia/Kuala_Lumpur',
      current: {
        time: '2026-10-21T18:00',
        pm2_5: 35.5,
        pm10: 45.2,
        us_aqi: 101,
      },
      hourly: {
        time: ['2026-10-21T18:00', '2026-10-21T19:00'],
        pm2_5: [35.5, 38.0],
        pm10: [45.2, 49.0],
        us_aqi: [101, 107],
      },
    };

    const parsed = OpenMeteoAirQualitySchema.safeParse(samplePayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.current?.us_aqi).toBe(101);
      expect(parsed.data.hourly.pm2_5.length).toBe(2);
    }
  });
});
