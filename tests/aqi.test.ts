import { describe, it, expect } from 'vitest';
import { getAqiCategory, getWindCompass, formatMalaysiaTime } from '@/lib/geo/aqi';

describe('AQI calculations and categorizations', () => {
  it('correctly categorizes Good AQI (0-50)', () => {
    const res = getAqiCategory(25);
    expect(res.category).toBe('Good');
    expect(res.color).toBe('#10b981');
  });

  it('correctly categorizes Moderate AQI (51-100)', () => {
    const res = getAqiCategory(75);
    expect(res.category).toBe('Moderate');
    expect(res.color).toBe('#eab308');
  });

  it('correctly categorizes Unhealthy for Sensitive Groups (101-150)', () => {
    const res = getAqiCategory(120);
    expect(res.category).toBe('Unhealthy for Sensitive Groups');
    expect(res.color).toBe('#f97316');
  });

  it('correctly categorizes Unhealthy (151-200)', () => {
    const res = getAqiCategory(170);
    expect(res.category).toBe('Unhealthy');
    expect(res.color).toBe('#ef4444');
  });

  it('correctly categorizes Hazardous (> 300)', () => {
    const res = getAqiCategory(350);
    expect(res.category).toBe('Hazardous');
    expect(res.color).toBe('#7f1d1d');
  });

  it('computes wind compass directions accurately', () => {
    expect(getWindCompass(0)).toBe('N');
    expect(getWindCompass(90)).toBe('E');
    expect(getWindCompass(180)).toBe('S');
    expect(getWindCompass(270)).toBe('W');
    expect(getWindCompass(45)).toBe('NE');
    expect(getWindCompass(225)).toBe('SW');
  });

  it('formats timestamps into explicit Malaysia UTC+8 format', () => {
    const formatted = formatMalaysiaTime('2026-10-21T10:30:00Z');
    expect(formatted).toContain('MYT UTC+8');
  });
});
