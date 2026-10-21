import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'HazeWatch SEA API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    timezone: 'Asia/Kuala_Lumpur (UTC+8)',
    endpoints: [
      '/api/air-quality',
      '/api/forecast',
      '/api/weather',
      '/api/hotspots',
      '/api/dispersion',
      '/api/health',
    ],
  });
}
