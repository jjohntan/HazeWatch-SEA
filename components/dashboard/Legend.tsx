'use client';

import React, { useState } from 'react';
import { US_AQI_LEVELS } from '@/lib/constants';
import { ChevronDown, ChevronUp, Flame, Wind, Eye } from 'lucide-react';

export const Legend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="glass-panel rounded-xl shadow-2xl border border-white/10 text-slate-200 overflow-hidden w-64 md:w-72 transition-all">
      {/* Header with expand/collapse */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold tracking-wide bg-slate-900/90 hover:bg-slate-800 text-slate-200 transition-colors border-b border-white/10 cursor-pointer select-none"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
          <Eye className="w-3.5 h-3.5" />
          Map Legend & Standards
        </span>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-3 space-y-3 text-[11px]">
          {/* AQI Gradient Spectrum */}
          <div>
            <div className="font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>US AQI Scale</span>
              <span className="text-[10px] text-slate-400">0 – 500+</span>
            </div>
            <div className="space-y-1">
              {US_AQI_LEVELS.map((lvl) => (
                <div key={lvl.category} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: lvl.color }}
                    />
                    <span className="text-slate-300">{lvl.category}</span>
                  </div>
                  <span className="font-mono text-slate-400">
                    {lvl.min}-{lvl.max}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 pt-2">
            <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Satellite Hotspots (VIIRS)</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Thermal anomalies detected by NOAA-20/21. Color intensity reflects Fire Radiative Power (MW). High values indicate energetic combustion.
            </p>
          </div>

          <div className="border-t border-white/5 pt-2">
            <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Wind className="w-3 h-3 text-sky-400" />
              <span>Animated Wind Streamlines</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Particle vectors represent 10m surface winds. Particles stream in the downwind direction with velocity proportional to speed.
            </p>
          </div>

          <div className="border-t border-white/5 pt-2">
            <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500/80 border border-purple-400" />
              <span>ASMC Smoke Dispersion</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Transboundary smoke haze boundary model from ASEAN Specialised Meteorological Centre (ASMC) tracking regional peat and forest fire plume dispersion.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
