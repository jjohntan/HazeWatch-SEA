'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { DEFAULT_CENTER, MAP_STYLES, SEA_BOUNDS } from '@/lib/constants';
import { LocationCoords, MapLayerState } from '@/types';
import { MapControls } from './MapControls';
import { Legend } from '../dashboard/Legend';
import { WindParticleEngine } from './WindParticleEngine';
import { RegionalWindPoint } from '@/app/api/weather/route';
import { HotspotGeoJSON, HotspotFeatureProperties } from '@/lib/geo/hotspots';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const locationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const windEngineRef = useRef<WindParticleEngine | null>(null);
  const onSelectLocationRef = useRef(onSelectLocation);
  const layersWindRef = useRef(layers.wind);
  const activePopupRef = useRef<maplibregl.Popup | null>(null);

  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [hotspotsData, setHotspotsData] = useState<HotspotGeoJSON | null>(null);

  // Keep refs up to date
  useEffect(() => {
    onSelectLocationRef.current = onSelectLocation;
  }, [onSelectLocation]);

  useEffect(() => {
    layersWindRef.current = layers.wind;
  }, [layers.wind]);

  // Fetch hotspots & regional wind grid
  useEffect(() => {
    async function fetchLayerData() {
      try {
        const [hotspotsRes, windRes] = await Promise.all([
          fetch('/api/hotspots'),
          fetch('/api/weather?grid=regional'),
        ]);

        if (hotspotsRes.ok) {
          const json = await hotspotsRes.json();
          if (json.geojson) {
            setHotspotsData(json.geojson);
          }
        }

        if (windRes.ok) {
          const windJson = await windRes.json();
          if (Array.isArray(windJson.grid) && windEngineRef.current) {
            windEngineRef.current.setGrid(windJson.grid as RegionalWindPoint[]);
          }
        }
      } catch (err) {
        console.warn('Failed to load layer geospatial feeds:', err);
      }
    }

    fetchLayerData();
  }, []);

  // Initialize MapLibre GL JS
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Explicit worker configuration for Next.js bundler
    if (typeof window !== 'undefined') {
      maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES.dark.styleUrl,
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

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: 'CARTO | OpenStreetMap | Open-Meteo | NASA FIRMS',
      }),
      'bottom-right'
    );

    map.on('load', () => {
      setMapLoaded(true);

      // User location radar marker
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

      // Initialize wind particle canvas engine
      if (canvasRef.current) {
        windEngineRef.current = new WindParticleEngine(map, canvasRef.current);
        if (layersWindRef.current) {
          windEngineRef.current.start();
        }
      }
    });

    // Click on map to select location
    map.on('click', (e) => {
      // If clicking directly on a hotspot feature, ignore map-wide select
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['unclustered-hotspot-points', 'hotspot-clusters'],
      });
      if (features.length > 0) return;

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
      if (windEngineRef.current) {
        windEngineRef.current.destroy();
        windEngineRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Hotspots Layer on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded || !hotspotsData) return;

    // Add GeoJSON source with clustering if not present
    if (!map.getSource('hotspots-source')) {
      map.addSource('hotspots-source', {
        type: 'geojson',
        data: hotspotsData as GeoJSON.GeoJSON,
        cluster: true,
        clusterMaxZoom: 10,
        clusterRadius: 50,
      });

      // 1. Clustered circles
      map.addLayer({
        id: 'hotspot-clusters',
        type: 'circle',
        source: 'hotspots-source',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#f59e0b', // < 5: amber
            5,
            '#f97316', // 5-15: orange
            15,
            '#ef4444', // > 15: red
          ],
          'circle-radius': ['step', ['get', 'point_count'], 16, 5, 22, 15, 28],
          'circle-opacity': 0.85,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.6,
        },
      });

      // 2. Cluster count text labels
      map.addLayer({
        id: 'hotspot-cluster-count',
        type: 'symbol',
        source: 'hotspots-source',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // 3. Individual Hotspot points (unclustered)
      map.addLayer({
        id: 'unclustered-hotspot-points',
        type: 'circle',
        source: 'hotspots-source',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'frp'],
            5,
            '#f59e0b',
            25,
            '#f97316',
            50,
            '#ef4444',
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4,
            4,
            8,
            7,
            12,
            12,
          ],
          'circle-opacity': 0.9,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#fef08a',
        },
      });

      // Cluster click -> zoom in
      map.on('click', 'hotspot-clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['hotspot-clusters'],
        });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource('hotspots-source') as maplibregl.GeoJSONSource;
        if (source && clusterId !== undefined) {
          source.getClusterExpansionZoom(clusterId).then((zoom) => {
            const geom = features[0].geometry as GeoJSON.Point;
            map.easeTo({
              center: geom.coordinates as [number, number],
              zoom: zoom + 0.5,
              duration: 800,
            });
          });
        }
      });

      // Individual hotspot click -> popup
      map.on('click', 'unclustered-hotspot-points', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties as unknown as HotspotFeatureProperties;
        const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];

        const popupContent = document.createElement('div');
        popupContent.className = 'text-xs space-y-1.5 p-1 text-slate-200';
        popupContent.innerHTML = `
          <div class="flex items-center justify-between border-b border-white/10 pb-1">
            <span class="font-bold text-amber-400 flex items-center gap-1">
              🔥 Satellite Thermal Anomaly
            </span>
            <span class="text-[10px] px-1.5 py-0.2 rounded font-mono ${
              props.confidence === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
            }">
              ${props.confidence?.toUpperCase() || 'NOMINAL'}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
            <div><span class="text-slate-400">Satellite:</span> <strong class="text-white">${props.satellite}</strong></div>
            <div><span class="text-slate-400">Sensor:</span> <strong class="text-white">${props.instrument}</strong></div>
            <div><span class="text-slate-400">Radiative Power:</span> <strong class="text-amber-300">${props.frp} MW</strong></div>
            <div><span class="text-slate-400">Acquired:</span> <strong class="text-white">${props.acqDate}</strong></div>
          </div>
          <div class="text-[10px] text-slate-400 pt-1 border-t border-white/10">
            Detected: ${coords[1].toFixed(3)}°N, ${coords[0].toFixed(3)}°E (${props.acqTime})
          </div>
          <div class="text-[9px] text-slate-400 bg-slate-900/60 p-1.5 rounded border border-white/5 leading-snug">
            ⚠️ <em>Thermal detection by satellite. Represents elevated ground temperature (biomass burning or industrial heat). Not verified wildfire attribution.</em>
          </div>
        `;

        if (activePopupRef.current) {
          activePopupRef.current.remove();
        }

        const newPopup = new maplibregl.Popup({ closeButton: true, maxWidth: '280px' })
          .setLngLat(coords)
          .setDOMContent(popupContent)
          .addTo(map);

        activePopupRef.current = newPopup;
      });

      // Cursor changes on hover
      map.on('mouseenter', 'hotspot-clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'hotspot-clusters', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('mouseenter', 'unclustered-hotspot-points', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'unclustered-hotspot-points', () => {
        map.getCanvas().style.cursor = '';
      });
    } else {
      const source = map.getSource('hotspots-source') as maplibregl.GeoJSONSource;
      source.setData(hotspotsData as GeoJSON.GeoJSON);
    }

    // Toggle layer visibility
    const visibility = layers.hotspots ? 'visible' : 'none';
    if (map.getLayer('hotspot-clusters')) {
      map.setLayoutProperty('hotspot-clusters', 'visibility', visibility);
      map.setLayoutProperty('hotspot-cluster-count', 'visibility', visibility);
      map.setLayoutProperty('unclustered-hotspot-points', 'visibility', visibility);
    }
  }, [mapLoaded, hotspotsData, layers.hotspots]);

  // Toggle Wind Layer animation
  useEffect(() => {
    if (!windEngineRef.current) return;
    if (layers.wind) {
      windEngineRef.current.start();
    } else {
      windEngineRef.current.stop();
    }
  }, [layers.wind]);

  // Fly to active location
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

  // Map Controls
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

      {/* Wind Particles Animation Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
          layers.wind ? 'opacity-100' : 'opacity-0'
        }`}
      />

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

      {/* Active Focus Display */}
      <div className="absolute top-4 left-4 z-10 glass-panel px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 pointer-events-none hidden md:block">
        <span className="text-cyan-400 font-semibold">Active Focus:</span> {currentLocation.name} ({currentLocation.latitude.toFixed(2)}°N, {currentLocation.longitude.toFixed(2)}°E)
      </div>
    </div>
  );
};
