import type { Map } from 'maplibre-gl';
import { RegionalWindPoint } from '@/app/api/weather/route';

interface Particle {
  lng: number;
  lat: number;
  age: number;
  maxAge: number;
}

export class WindParticleEngine {
  private map: Map;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private animationFrameId: number | null = null;
  private grid: RegionalWindPoint[] = [];
  private particles: Particle[] = [];
  private isRunning = false;
  private maxParticles: number;
  private speedFactor = 0.00045;

  constructor(map: Map, canvas: HTMLCanvasElement) {
    this.map = map;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Mobile performance tuning
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    this.maxParticles = isMobile ? 180 : 420;

    this.handleResize = this.handleResize.bind(this);
    this.animate = this.animate.bind(this);

    this.resizeCanvas();
    this.map.on('resize', this.handleResize);
    this.map.on('move', this.handleResize);
  }

  public setGrid(grid: RegionalWindPoint[]): void {
    this.grid = grid;
    if (this.particles.length === 0 && grid.length > 0) {
      this.initParticles();
    }
  }

  private resizeCanvas(): void {
    const rect = this.map.getContainer().getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  }

  private handleResize(): void {
    this.resizeCanvas();
  }

  private initParticles(): void {
    const bounds = this.map.getBounds();
    const west = bounds.getWest();
    const east = bounds.getEast();
    const south = bounds.getSouth();
    const north = bounds.getNorth();

    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        lng: west + Math.random() * (east - west),
        lat: south + Math.random() * (north - south),
        age: Math.floor(Math.random() * 80),
        maxAge: 70 + Math.floor(Math.random() * 40),
      });
    }
  }

  /**
   * Interpolate wind vector (u, v) using Inverse Distance Weighting from regional grid
   */
  private interpolateWind(lng: number, lat: number): { u: number; v: number; speed: number } {
    if (this.grid.length === 0) {
      return { u: 1.5, v: -1.0, speed: 5 }; // calm default
    }

    let totalWeight = 0;
    let uSum = 0;
    let vSum = 0;
    let speedSum = 0;

    for (const pt of this.grid) {
      const dLng = pt.longitude - lng;
      const dLat = pt.latitude - lat;
      const distSq = dLng * dLng + dLat * dLat;

      if (distSq < 0.0001) {
        return { u: pt.u, v: pt.v, speed: pt.speed };
      }

      const weight = 1 / Math.pow(distSq, 1.2);
      totalWeight += weight;
      uSum += pt.u * weight;
      vSum += pt.v * weight;
      speedSum += pt.speed * weight;
    }

    return {
      u: uSum / totalWeight,
      v: vSum / totalWeight,
      speed: speedSum / totalWeight,
    };
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.initParticles();
    this.animate();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  private animate(): void {
    if (!this.isRunning || !this.ctx) return;

    const rect = this.map.getContainer().getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Trail persistence fade
    this.ctx.fillStyle = 'rgba(9, 13, 22, 0.90)';
    this.ctx.globalCompositeOperation = 'destination-in';
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.globalCompositeOperation = 'source-over';

    const bounds = this.map.getBounds();
    const west = bounds.getWest();
    const east = bounds.getEast();
    const south = bounds.getSouth();
    const north = bounds.getNorth();

    this.ctx.lineWidth = 1.6;
    this.ctx.lineCap = 'round';

    for (const p of this.particles) {
      const prevPos = this.map.project([p.lng, p.lat]);

      // Meteorological wind interpolation
      const wind = this.interpolateWind(p.lng, p.lat);

      // Downwind displacement
      p.lng += wind.u * this.speedFactor;
      p.lat += wind.v * this.speedFactor;
      p.age++;

      const nextPos = this.map.project([p.lng, p.lat]);

      // Respawn particle if expired or outside current map bounds
      if (
        p.age > p.maxAge ||
        p.lng < west ||
        p.lng > east ||
        p.lat < south ||
        p.lat > north ||
        nextPos.x < 0 ||
        nextPos.x > width ||
        nextPos.y < 0 ||
        nextPos.y > height
      ) {
        p.lng = west + Math.random() * (east - west);
        p.lat = south + Math.random() * (north - south);
        p.age = 0;
        p.maxAge = 60 + Math.floor(Math.random() * 50);
        continue;
      }

      // Dynamic color based on velocity
      const alpha = Math.sin((p.age / p.maxAge) * Math.PI);
      if (wind.speed > 15) {
        this.ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.85})`; // Fast cyan
      } else if (wind.speed > 8) {
        this.ctx.strokeStyle = `rgba(14, 165, 233, ${alpha * 0.75})`; // Moderate sky
      } else {
        this.ctx.strokeStyle = `rgba(125, 211, 252, ${alpha * 0.55})`; // Light breeze
      }

      this.ctx.beginPath();
      this.ctx.moveTo(prevPos.x, prevPos.y);
      this.ctx.lineTo(nextPos.x, nextPos.y);
      this.ctx.stroke();
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  public destroy(): void {
    this.stop();
    this.map.off('resize', this.handleResize);
    this.map.off('move', this.handleResize);
  }
}
