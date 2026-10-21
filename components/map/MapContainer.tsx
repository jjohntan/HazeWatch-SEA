'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { DEFAULT_CENTER, MAP_STYLES, SEA_BOUNDS } from '@/lib/constants';
import { LocationCoords, MapLayerState } from '@/types';
import { MapControls } from './MapControls';
import { Legend } from '../dashboard/Legend';

interface MapContainerProps {
  currentLocation: LocationCoords;
  onSelectLocation: (loc: LocationCoords) => void;
  layers: MapLayerState;
  onToggleLayer: (layer: keyof MapLayerState) => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  currentLocation,
  onSelectLocation,
  layers,
  onToggleLayer,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const locationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const onSelectLocationRef = useRef(onSelectLocation);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // Keep ref up to date to avoid stale closures in map event handlers
  useEffect(() => {
    onSelectLocationRef.current = onSelectLocation;
  }, [onSelectLocation]);

  // Initialize MapLibre GL JS Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES.dark.style as unknown as maplibregl.StyleSpecification,
      center: [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude],
      zoom: DEFAULT_CENTER.zoom,
      minZoom: 3,
      maxZoom: 14,
      maxBounds: [
        [SEA_BOUNDS[0] - 5, SEA_BOUNDS[1] - 5],
        [SEA_BOUNDS[2] + 5, SEA_BOUNDS[3] + 5],
      ],
      attributionControl: false,
    });

    // Add minimal attribution
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: 'CARTO | OpenStreetMap | Open-Meteo',
      }),
      'bottom-right'
    );

    map.on('load', () => {
      setMapLoaded(true);

      // Create an active location marker element with glowing radar effect
      const el = document.createElement('div');
      el.className = 'location-marker';
      el.innerHTML = `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-8 h-8 rounded-full bg-cyan-400/30 animate-ping"></div>
          <div class="relative w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-lg"></div>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude])
        .addTo(map);

      locationMarkerRef.current = marker;
    });

    // Click anywhere on SEA to inspect coordinates
    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      if (onSelectLocationRef.current) {
        onSelectLocationRef.current({
          name: `Selected (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
          latitude: Number(lat.toFixed(4)),
          longitude: Number(lng.toFixed(4)),
          country: 'Custom Coordinate',
        });
      }
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position and fly to when currentLocation changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    if (locationMarkerRef.current) {
      locationMarkerRef.current.setLngLat([
        currentLocation.longitude,
        currentLocation.latitude,
      ]);
    }

    mapInstanceRef.current.flyTo({
      center: [currentLocation.longitude, currentLocation.latitude],
      zoom: Math.max(mapInstanceRef.current.getZoom(), 6),
      essential: true,
      duration: 1200,
    });
  }, [currentLocation, mapLoaded]);

  // Map Controls handlers
  const handleResetView = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo({
      center: [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude],
      zoom: DEFAULT_CENTER.zoom,
      essential: true,
      duration: 1000,
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomOut();
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden bg-slate-950">
      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Layer Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-20">
        <MapControls
          layers={layers}
          onToggleLayer={onToggleLayer}
          onResetView={handleResetView}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
      </div>

      {/* Floating Legend (Bottom Left) */}
      <div className="absolute bottom-20 left-4 z-20 hidden sm:block">
        <Legend />
      </div>

      {/* Center Reticle / Coordinate status on hover or mobile */}
      <div className="absolute top-4 left-4 z-10 glass-panel px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 pointer-events-none hidden md:block">
        <span className="text-cyan-400 font-semibold">Active Focus:</span> {currentLocation.name} ({currentLocation.latitude.toFixed(2)}°N, {currentLocation.longitude.toFixed(2)}°E)
      </div>
    </div>
  );
};
