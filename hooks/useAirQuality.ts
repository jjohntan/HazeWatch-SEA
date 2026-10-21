'use client';

import { useState, useEffect, useCallback } from 'react';
import { LocationCoords, CurrentAirQuality, HourlyForecastItem } from '@/types';

interface UseAirQualityResult {
  airQuality: CurrentAirQuality | null;
  forecast: HourlyForecastItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAirQuality(location: LocationCoords): UseAirQualityResult {
  const [airQuality, setAirQuality] = useState<CurrentAirQuality | null>(null);
  const [forecast, setForecast] = useState<HourlyForecastItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { latitude, longitude } = location;

      // Fetch live air quality and 48h forecast in parallel
      const [aqRes, forecastRes] = await Promise.all([
        fetch(`/api/air-quality?latitude=${latitude}&longitude=${longitude}`),
        fetch(`/api/forecast?latitude=${latitude}&longitude=${longitude}&forecast_hours=48`),
      ]);

      if (!aqRes.ok) {
        throw new Error(`Air Quality API returned HTTP ${aqRes.status}`);
      }

      const aqData = await aqRes.json();
      setAirQuality(aqData.current);

      if (forecastRes.ok) {
        const forecastData = await forecastRes.json();
        if (Array.isArray(forecastData.hourly)) {
          setForecast(forecastData.hourly);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch environmental data';
      console.warn('Live API request failed, using fallback/cached state:', msg);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [location.latitude, location.longitude]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    airQuality,
    forecast,
    isLoading,
    error,
    refetch: fetchData,
  };
}
