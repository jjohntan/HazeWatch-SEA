'use client';

import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';
import { HourlyForecastItem } from '@/types';

interface TimelineSliderProps {
  selectedHourOffset: number;
  onHourChange: (hourOffset: number) => void;
  hourlyData?: HourlyForecastItem[];
  isPlaying: boolean;
  onTogglePlay: () => void;
  maxHours?: number;
}

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
  selectedHourOffset,
  onHourChange,
  isPlaying,
  onTogglePlay,
  maxHours = 48,
}) => {
  // Format current forecast hour time
  const getDisplayTime = () => {
    const targetDate = new Date();
    targetDate.setHours(targetDate.getHours() + selectedHourOffset);
    return new Intl.DateTimeFormat('en-MY', {
      timeZone: 'Asia/Kuala_Lumpur',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(targetDate);
  };

  return (
    <div className="glass-panel rounded-2xl px-4 py-3 shadow-2xl border border-white/10 text-slate-200 w-full max-w-4xl mx-auto backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-2.5">
        {/* Playback Controls & Status */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onHourChange(0)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Reset to Current Conditions (Now)"
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
            title={isPlaying ? 'Pause Timeline' : 'Play 48h Progression'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={() => onHourChange(Math.min(maxHours, selectedHourOffset + 1))}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Next Forecast Hour (+1h)"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <div className="text-xs font-semibold text-white ml-2 flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                selectedHourOffset === 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              {selectedHourOffset === 0 ? 'NOW' : `+${selectedHourOffset}h FORECAST`}
            </span>
          </div>
        </div>

        {/* Explicit Timezone Clock */}
        <div className="flex items-center space-x-2 text-xs text-slate-300 font-mono">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{getDisplayTime()} (UTC+8)</span>
        </div>
      </div>

      {/* Slider Track */}
      <div className="relative w-full flex items-center">
        <input
          type="range"
          min={0}
          max={maxHours}
          step={1}
          value={selectedHourOffset}
          onChange={(e) => onHourChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
        />
      </div>

      {/* Timeline Hour Markers */}
      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
        <span className="font-semibold text-emerald-400">Now</span>
        <span>+12h</span>
        <span>+24h</span>
        <span>+36h</span>
        <span className="font-semibold text-cyan-400">+48h Forecast</span>
      </div>
    </div>
  );
};
