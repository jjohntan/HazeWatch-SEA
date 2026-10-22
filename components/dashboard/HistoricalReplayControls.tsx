'use client';

import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Calendar, Flame, AlertCircle } from 'lucide-react';
import { DailyHotspotSummary } from '@/lib/geo/historical-hotspots';

interface HistoricalReplayControlsProps {
  dates: string[];
  currentIndex: number;
  onSelectDateIndex: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  summary: DailyHotspotSummary | null;
  onCloseReplay: () => void;
}

export const HistoricalReplayControls: React.FC<HistoricalReplayControlsProps> = ({
  dates,
  currentIndex,
  onSelectDateIndex,
  isPlaying,
  onTogglePlay,
  summary,
  onCloseReplay,
}) => {
  const currentDate = dates[currentIndex] || '2026-10-08';
  const isOct8Peak = currentDate.endsWith('-10-08');

  // Jump directly to benchmark event: 8 Oct (13,012 fires in Indonesia)
  const jumpToOct8 = () => {
    const oct8Index = dates.findIndex((d) => d.endsWith('-10-08'));
    if (oct8Index !== -1) {
      onSelectDateIndex(oct8Index);
    }
  };

  return (
    <div className="glass-panel rounded-2xl px-4 py-3 shadow-2xl border border-amber-500/30 text-slate-200 w-full max-w-4xl mx-auto backdrop-blur-md bg-slate-950/90 relative animate-fade-in">
      {/* Top Banner / Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-2.5">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
            <Flame className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>HISTORICAL SATELLITE REPLAY (SINCE 1 AUG)</span>
          </div>

          <button
            onClick={jumpToOct8}
            className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 border ${
              isOct8Peak
                ? 'bg-red-500/30 text-red-200 border-red-500/60 shadow-lg shadow-red-500/20 animate-pulse'
                : 'bg-slate-800/80 text-amber-300 hover:bg-amber-500/20 border-white/10'
            }`}
            title="Jump to Indonesia peak fire anomaly event"
          >
            <span>🔥 8 Oct Peak (13,012 fires)</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {summary && (
            <div className="text-right">
              <span className="text-xs text-slate-300">
                Total Regional Fires: <strong className="text-amber-300 font-mono text-sm">{summary.totalHotspots.toLocaleString()}</strong>
              </span>
              <div className="text-[10px] text-slate-400">
                Indonesia: <strong className="text-red-400">{summary.indonesiaCount.toLocaleString()}</strong> | Malaysia: {summary.malaysiaCount}
              </div>
            </div>
          )}

          <button
            onClick={onCloseReplay}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 ml-2"
            title="Exit historical replay mode and return to live forecast"
          >
            Exit Replay
          </button>
        </div>
      </div>

      {/* Playback Controls & Slider */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onSelectDateIndex(0)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Jump to 1 August"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onTogglePlay}
            className={`p-2 rounded-xl flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
            }`}
            title={isPlaying ? 'Pause Replay' : 'Auto-Replay Day by Day'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={() => onSelectDateIndex(Math.min(dates.length - 1, currentIndex + 1))}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Next Day (+1d)"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center space-x-1.5 text-xs text-slate-200 font-mono ml-2">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <strong className="text-white text-sm">{summary?.dayLabel || currentDate}</strong>
            <span className="text-slate-400 text-[11px]">({currentDate})</span>
          </div>
        </div>

        {summary?.isPeakSpike && (
          <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-red-300 bg-red-950/60 px-2.5 py-1 rounded-md border border-red-500/40">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <span>Severe Fire Outbreak: 13,012 active fires detected in Indonesia</span>
          </div>
        )}
      </div>

      {/* Date Slider Track */}
      <div className="relative w-full flex items-center">
        <input
          type="range"
          min={0}
          max={dates.length - 1}
          step={1}
          value={currentIndex}
          onChange={(e) => onSelectDateIndex(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
        />
      </div>

      {/* Timeline Milestones */}
      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
        <span>1 Aug (Dry Season Start)</span>
        <span>1 Sep</span>
        <span className={isOct8Peak ? 'text-red-400 font-bold' : ''}>8 Oct (13,012 Fires)</span>
        <span>Latest</span>
      </div>
    </div>
  );
};
