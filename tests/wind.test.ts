import { describe, it, expect } from 'vitest';

describe('Meteorological Wind Vector Physics', () => {
  it('correctly derives eastward (u) and northward (v) components for downwind flow', () => {
    // Meteorological wind from North (0° or 360°) flows towards South: u = 0, v < 0
    const dirN = 0;
    const speed = 10;
    const radN = (dirN * Math.PI) / 180;
    const uN = -speed * Math.sin(radN);
    const vN = -speed * Math.cos(radN);

    expect(Math.abs(uN)).toBeCloseTo(0);
    expect(vN).toBeCloseTo(-10);

    // Wind from West (270°) flows towards East: u > 0, v = 0
    const dirW = 270;
    const radW = (dirW * Math.PI) / 180;
    const uW = -speed * Math.sin(radW);
    const vW = -speed * Math.cos(radW);

    expect(uW).toBeCloseTo(10);
    expect(Math.abs(vW)).toBeCloseTo(0);

    // Wind from South-West (225°) flows towards North-East: u > 0, v > 0
    const dirSW = 225;
    const radSW = (dirSW * Math.PI) / 180;
    const uSW = -speed * Math.sin(radSW);
    const vSW = -speed * Math.cos(radSW);

    expect(uSW).toBeGreaterThan(0);
    expect(vSW).toBeGreaterThan(0);
  });
});
