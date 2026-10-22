'use client';

import React from 'react';
import { Wind, Flame, Navigation, Clock, Menu, X, Info } from 'lucide-react';
import { LOCATION_PRESETS } from '@/lib/constants';
import { LocationCoords } from '@/types';

interface HeaderProps {
  currentLocation: LocationCoords;
  onSelectLocation: (loc: LocationCoords) => void;
  onDetectLocation: () => void;
  isLocating: boolean;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onOpenInfo: () => void;
  isHistoricalReplay?: boolean;
  onToggleHistoricalReplay?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  onSelectLocation,
  onDetectLocation,
  isLocating,
  mobileMenuOpen,
  onToggleMobileMenu,
  onOpenInfo,
  isHistoricalReplay = false,
  onToggleHistoricalReplay,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 py-2.5 flex items-center justify-between shadow-xl">
      {/* Brand & Live Indicator */}
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 via-sky-600/30 to-amber-500/20 border border-cyan-500/30 shadow-inner">
          <Wind className="w-5 h-5 text-cyan-400 animate-pulse-subtle" />
          <Flame className="w-3 h-3 text-amber-400 absolute -bottom-0.5 -right-0.5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              HazeWatch <span className="text-cyan-400">SEA</span>
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping-slow" />
              LIVE
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden md:block">
            Southeast Asia Haze & Environmental Intelligence
          </p>
        </div>
      </div>

      {/* Center: Location Preset Selector & Geolocation */}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <select
            value={`${currentLocation.latitude.toFixed(4)},${currentLocation.longitude.toFixed(4)}`}
            onChange={(e) => {
              const [lat, lng] = e.target.value.split(',').map(Number);
              const found = LOCATION_PRESETS.find(
                (p) =>
                  Math.abs(p.latitude - lat) < 0.001 &&
                  Math.abs(p.longitude - lng) < 0.001
              );
              if (found) {
                onSelectLocation(found);
              }
            }}
            className="text-xs bg-slate-900/90 text-slate-200 border border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer max-w-[150px] sm:max-w-[200px] md:max-w-[240px] truncate"
            title="Select Southeast Asia Location"
          >
            <optgroup label="Malaysia (Primary Focus)">
              {LOCATION_PRESETS.filter((p) => p.country === 'Malaysia').map((loc) => (
                <option
                  key={loc.name}
                  value={`${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`}
                >
                  📍 {loc.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Regional Southeast Asia">
              {LOCATION_PRESETS.filter((p) => p.country !== 'Malaysia').map((loc) => (
                <option
                  key={loc.name}
                  value={`${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`}
                >
                  🌐 {loc.name} ({loc.country})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Locate Me Button */}
        <button
          onClick={onDetectLocation}
          disabled={isLocating}
          className="flex items-center space-x-1.5 text-xs bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 px-2.5 py-1.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          title="Use browser GPS geolocation"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Locate Me</span>
        </button>
      </div>

      {/* Right Controls: Timezone Badge, Methodology, Mobile Drawer Toggle */}
      <div className="flex items-center space-x-2">
        <div className="hidden lg:flex items-center space-x-1.5 text-[11px] text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-md border border-white/5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>UTC+8 (MYT)</span>
        </div>

        <button
          onClick={onToggleHistoricalReplay}
          className={`flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
            isHistoricalReplay
              ? 'bg-amber-500/30 text-amber-200 border-amber-500/60 shadow-md shadow-amber-500/20'
              : 'bg-slate-800/60 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border-white/10'
          }`}
          title="Replay every satellite fire detection since 1 August day-by-day"
        >
          <Flame className={`w-3.5 h-3.5 ${isHistoricalReplay ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
          <span className="hidden sm:inline font-medium">Fire Replay (1 Aug - Now)</span>
        </button>

        <button
          onClick={onOpenInfo}
          className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white border border-white/10 transition-colors"
          title="Methodology, Standards & Sources"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* Mobile Toggle for Environmental Panel */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 rounded-lg bg-slate-800/80 text-slate-200 border border-white/10 hover:bg-slate-700 transition-colors"
          title="Toggle Environmental Panel"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
