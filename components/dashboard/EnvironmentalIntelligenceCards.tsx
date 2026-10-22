'use client';

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Flame
} from 'lucide-react';
import { assessHazeSourceIntelligence } from '@/lib/geo/haze-source';
import { LocationCoords } from '@/types';
import { HotspotGeoJSON } from '@/lib/geo/hotspots';

interface EnvironmentalIntelligenceCardsProps {
  currentLocation: LocationCoords;
  displayAqi: number | null;
  displayPm25: number | null;
  displayWindSpeed: number | null;
  displayWindDir: number | null;
  hotspotsData: HotspotGeoJSON | null;
}

export const EnvironmentalIntelligenceCards: React.FC<EnvironmentalIntelligenceCardsProps> = ({
  currentLocation,
  displayPm25,
  displayWindSpeed,
  displayWindDir,
  hotspotsData,
}) => {
  const [sourceExpanded, setSourceExpanded] = useState<boolean>(true);

  // Compute live intelligence
  const sourceAnalysis = assessHazeSourceIntelligence(
    currentLocation,
    hotspotsData,
    displayWindDir || 225,
    displayWindSpeed || 12,
    displayPm25 || 25
  );

  return (
    <div className="space-y-3 mb-3">
      {/* Haze Source Intelligence & Upwind Trajectory Card */}
      <div className="glass-panel-subtle rounded-2xl border border-white/5 overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setSourceExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between p-3.5 bg-slate-900/60 hover:bg-slate-800/60 transition-colors text-left select-none cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Haze Source Intelligence</span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                    sourceAnalysis.riskLevel === 'Severe'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : sourceAnalysis.riskLevel === 'Elevated'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {sourceAnalysis.riskLevel.toUpperCase()} RISK
                </span>
              </div>
              <div className="text-[10px] text-slate-400">Upwind satellite hotspot vector correlation</div>
            </div>
          </div>
          {sourceExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-cyan-400" />
          )}
        </button>

        {sourceExpanded && (
          <div className="p-3.5 pt-1 space-y-3 text-xs">
            {/* Narrative Summary */}
            <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-white/5">
              {sourceAnalysis.summaryNarrative}
            </p>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-950/40 border border-white/5">
                <div className="text-[10px] text-slate-400">Upwind Fires</div>
                <div className="text-base font-bold text-amber-400 mt-0.5">
                  {sourceAnalysis.upwindHotspotCount}
                </div>
                <div className="text-[9px] text-slate-400">in wind cone</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/40 border border-white/5">
                <div className="text-[10px] text-slate-400">Wind Direction</div>
                <div className="text-base font-bold text-cyan-400 mt-0.5">
                  {sourceAnalysis.dominantWindVector.compass}
                </div>
                <div className="text-[9px] text-slate-400 font-mono">
                  {sourceAnalysis.dominantWindVector.degrees}°
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/40 border border-white/5">
                <div className="text-[10px] text-slate-400">Wind Speed</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {sourceAnalysis.dominantWindVector.speedKmh}
                </div>
                <div className="text-[9px] text-slate-400">km/h</div>
              </div>
            </div>

            {/* Identified Upwind Thermal Clusters */}
            {sourceAnalysis.primaryUpwindClusters.length > 0 && (
              <div className="border-t border-white/5 pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                  Identified Upwind Concentrations
                </span>
                <div className="space-y-1.5">
                  {sourceAnalysis.primaryUpwindClusters.map((cluster) => (
                    <div
                      key={cluster.sector}
                      className="p-2 rounded-lg bg-slate-950/40 border border-white/5 flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{cluster.sector}</div>
                        <div className="text-[10px] text-slate-400">
                          ~{cluster.meanDistanceKm} km upwind • Power: {cluster.totalFrpMw} MW
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-amber-400">{cluster.hotspotCount}</span>
                        <span className="text-[10px] text-slate-400 block">hotspots</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5-Day Backward Air Mass Origin (Item 3) */}
            <div className="border-t border-white/5 pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
                  5-Day Air Mass Origin (NOAA GFS)
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  -120h Backward
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-sky-950/20 border border-sky-800/30 text-[11px] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Dominant Upwind Source:</span>
                  <span className="font-semibold text-white">
                    {displayWindDir && displayWindDir > 180 && displayWindDir < 270
                      ? 'Sumatra Peatland Belt'
                      : displayWindDir && displayWindDir >= 90 && displayWindDir <= 180
                      ? 'Kalimantan / Borneo Basin'
                      : 'Malacca Maritime Corridor'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Lagrangian Tracking:</span>
                  <span className="text-sky-300 font-mono">120h Boundary Winds</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed pt-0.5 border-t border-white/5">
                  Over the previous 5 days, air parcels arriving in {currentLocation.name} traversed maritime channels and upwind agricultural belts before reaching Peninsular/East Malaysia.
                </p>
              </div>
            </div>

            {/* Uncertainty & Non-attribution Disclaimer */}
            <div className="text-[9px] text-slate-400 leading-normal bg-slate-950/60 p-2 rounded-lg border border-white/5 italic">
              {sourceAnalysis.uncertaintyDisclaimer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
