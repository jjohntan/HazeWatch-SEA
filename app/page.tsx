'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TimelineSlider } from '@/components/dashboard/TimelineSlider';
import { HistoricalReplayControls } from '@/components/dashboard/HistoricalReplayControls';
import { InfoModal } from '@/components/dashboard/InfoModal';
import { LOCATION_PRESETS } from '@/lib/constants';
import { LocationCoords, MapLayerState } from '@/types';
import { useAirQuality } from '@/hooks/useAirQuality';
import { HotspotGeoJSON } from '@/lib/geo/hotspots';
import { DailyHotspotSummary } from '@/lib/geo/historical-hotspots';

// Dynamically load MapLibre MapContainer with SSR disabled
const MapContainer = dynamic(
  () => import('@/components/map/MapContainer').then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium tracking-wide">Loading Geospatial Engine...</span>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  const [currentLocation, setCurrentLocation] = useState<LocationCoords>(LOCATION_PRESETS[0]); // Kuala Lumpur default
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [infoModalOpen, setInfoModalOpen] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Live Open-Meteo Air Quality & 48-Hour Forecast Hook
  const { airQuality, forecast, isLoading, error, refetch } = useAirQuality(currentLocation);

  // Map layer toggle states
  const [layers, setLayers] = useState<MapLayerState>({
    airQuality: true,
    hotspots: true,
    wind: true,
    dispersion: false,
    trajectory: true,
  });

  // Timeline state
  const [selectedHourOffset, setSelectedHourOffset] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hotspotsData, setHotspotsData] = useState<HotspotGeoJSON | null>(null);

  // Historical Daily Fire Replay state (Since 1 Aug)
  const [isHistoricalReplay, setIsHistoricalReplay] = useState<boolean>(false);
  const [historicalDates] = useState<string[]>(() => {
    // Generate dates from 2026-08-01 through 2026-10-22
    const dates: string[] = [];
    const curr = new Date('2026-08-01');
    const end = new Date('2026-10-22');
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  });
  // Default to 8 Oct peak index if available, else latest date
  const [historicalDateIndex, setHistoricalDateIndex] = useState<number>(() => {
    const oct8 = '2026-10-08';
    const dates = [];
    const curr = new Date('2026-08-01');
    const end = new Date('2026-10-22');
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    const idx = dates.indexOf(oct8);
    return idx !== -1 ? idx : dates.length - 1;
  });
  const [isReplayingHistory, setIsReplayingHistory] = useState<boolean>(false);
  const [historicalSummary, setHistoricalSummary] = useState<DailyHotspotSummary | null>(null);

  // Fetch hotspots data (Live or Historical Daily Replay)
  useEffect(() => {
    let isCancelled = false;

    async function fetchHotspots() {
      try {
        const url = isHistoricalReplay && historicalDates[historicalDateIndex]
          ? `/api/hotspots?date=${historicalDates[historicalDateIndex]}`
          : '/api/hotspots';

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled && json.geojson) {
            setHotspotsData(json.geojson);
            if (json.summary) {
              setHistoricalSummary(json.summary);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch hotspots feed in page:', err);
      }
    }

    fetchHotspots();

    return () => {
      isCancelled = true;
    };
  }, [isHistoricalReplay, historicalDateIndex, historicalDates]);

  // Auto-play historical date progression
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHistoricalReplay && isReplayingHistory) {
      interval = setInterval(() => {
        setHistoricalDateIndex((prev) => (prev >= historicalDates.length - 1 ? 0 : prev + 1));
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [isHistoricalReplay, isReplayingHistory, historicalDates.length]);

  // Auto-play timeline progression for forecast
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isHistoricalReplay && isPlaying) {
      interval = setInterval(() => {
        setSelectedHourOffset((prev) => (prev >= 48 ? 0 : prev + 1));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isHistoricalReplay, isPlaying]);

  const handleToggleLayer = (layer: keyof MapLayerState) => {
    setLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  const handleSelectLocation = (loc: LocationCoords) => {
    setCurrentLocation(loc);
    setSelectedHourOffset(0); // Reset timeline to current hour on location change
  };

  // Browser Geolocation
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const userLoc: LocationCoords = {
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
          name: 'Detected Location',
          country: 'Malaysia / SEA',
          isUserLocation: true,
        };
        handleSelectLocation(userLoc);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation denied or unavailable:', err.message);
        // Fall back gracefully to default Malaysia view without breaking app
      },
      { timeout: 10000 }
    );
  };

  return (
    <main className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Top Navigation Bar */}
      <Header
        currentLocation={currentLocation}
        onSelectLocation={handleSelectLocation}
        onDetectLocation={handleDetectLocation}
        isLocating={isLocating}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        onOpenInfo={() => setInfoModalOpen(true)}
        isHistoricalReplay={isHistoricalReplay}
        onToggleHistoricalReplay={() => {
          setIsHistoricalReplay(!isHistoricalReplay);
          setIsPlaying(false);
          setIsReplayingHistory(false);
          // If turning on replay, ensure hotspots layer is visible
          if (!isHistoricalReplay) {
            setLayers((prev) => ({ ...prev, hotspots: true }));
          }
        }}
      />

      {/* Main Map-First Workspace */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Left Environmental Information Panel (Desktop Sidebar) */}
        <div className="hidden md:block w-80 lg:w-96 flex-shrink-0 h-full z-20">
          <Sidebar
            currentLocation={currentLocation}
            airQuality={airQuality}
            forecast={forecast}
            selectedHourOffset={selectedHourOffset}
            onSelectHour={setSelectedHourOffset}
            isLoading={isLoading}
            error={error}
            onRefresh={refetch}
            hotspotsData={hotspotsData}
          />
        </div>

        {/* Mobile Environmental Panel Drawer */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden absolute inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in flex"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div 
              className="w-5/6 max-w-sm h-full bg-slate-950 shadow-2xl relative flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b border-white/10 bg-slate-900/90">
                <span className="text-xs font-bold text-white tracking-wide uppercase">Environmental Intelligence</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  title="Close panel"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  currentLocation={currentLocation}
                  airQuality={airQuality}
                  forecast={forecast}
                  selectedHourOffset={selectedHourOffset}
                  onSelectHour={setSelectedHourOffset}
                  isLoading={isLoading}
                  error={error}
                  onRefresh={refetch}
                  hotspotsData={hotspotsData}
                />
              </div>
            </div>
          </div>
        )}

        {/* Interactive Map Viewport */}
        <div className="relative flex-1 h-full w-full">
          <MapContainer
            currentLocation={currentLocation}
            onSelectLocation={handleSelectLocation}
            layers={layers}
            onToggleLayer={handleToggleLayer}
            selectedHourOffset={selectedHourOffset}
            hotspotsData={hotspotsData}
          />

          {/* Bottom Floating Timeline or Historical Replay Controls */}
          <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-auto">
            {isHistoricalReplay ? (
              <HistoricalReplayControls
                dates={historicalDates}
                currentIndex={historicalDateIndex}
                onSelectDateIndex={setHistoricalDateIndex}
                isPlaying={isReplayingHistory}
                onTogglePlay={() => setIsReplayingHistory(!isReplayingHistory)}
                summary={historicalSummary}
                onCloseReplay={() => {
                  setIsHistoricalReplay(false);
                  setIsReplayingHistory(false);
                }}
              />
            ) : (
              <TimelineSlider
                selectedHourOffset={selectedHourOffset}
                onHourChange={setSelectedHourOffset}
                hourlyData={forecast}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Methodology & Standards Modal */}
      <InfoModal isOpen={infoModalOpen} onClose={() => setInfoModalOpen(false)} />
    </main>
  );
}
