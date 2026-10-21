'use client';

import React from 'react';
import { Layers, Wind, Flame, RotateCcw, Plus, Minus, ShieldAlert } from 'lucide-react';
import { MapLayerState } from '@/types';

interface MapControlsProps {
  layers: MapLayerState;
  onToggleLayer: (layer: keyof MapLayerState) => void;
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  layers,
  onToggleLayer,
  onResetView,
  onZoomIn,
  onZoomOut,
}) => {
  return (
    <div className="flex flex-col space-y-2">
      {/* Layer Toggle Card */}
      <div className="glass-panel rounded-xl p-2 shadow-2xl border border-white/10 text-slate-200">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between border-b border-white/5 mb-1">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Map Layers
          </span>
        </div>

        <div className="flex flex-col space-y-1">
          {/* Air Quality */}
          <button
            onClick={() => onToggleLayer('airQuality')}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              layers.airQuality
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Air Quality
            </span>
            <span className="text-[10px] font-mono">{layers.airQuality ? 'ON' : 'OFF'}</span>
          </button>

          {/* Hotspots */}
          <button
            onClick={() => onToggleLayer('hotspots')}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              layers.hotspots
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Fire Hotspots
            </span>
            <span className="text-[10px] font-mono">{layers.hotspots ? 'ON' : 'OFF'}</span>
          </button>

          {/* Wind Particles */}
          <button
            onClick={() => onToggleLayer('wind')}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              layers.wind
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              Wind Streamlines
            </span>
            <span className="text-[10px] font-mono">{layers.wind ? 'ON' : 'OFF'}</span>
          </button>

          {/* ASMC Smoke Dispersion */}
          <button
            onClick={() => onToggleLayer('dispersion')}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              layers.dispersion
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              ASMC Dispersion
            </span>
            <span className="text-[10px] font-mono">{layers.dispersion ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Quick Actions */}
      <div className="glass-panel rounded-xl p-1.5 shadow-2xl border border-white/10 flex flex-col space-y-1 items-center">
        <button
          onClick={onZoomIn}
          className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-slate-200 transition-colors"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-slate-200 transition-colors"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="w-full border-t border-white/10 my-0.5" />
        <button
          onClick={onResetView}
          className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-cyan-900/60 text-cyan-300 transition-colors"
          title="Reset to Malaysia & SEA"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
