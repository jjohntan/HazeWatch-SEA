'use client';

import React from 'react';
import { X, ShieldCheck, Database, Satellite, Wind, BookOpen, AlertCircle } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel max-w-2xl w-full rounded-2xl p-6 border border-white/10 shadow-2xl overflow-y-auto max-h-[85vh] text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">About HazeWatch SEA</h2>
              <p className="text-xs text-slate-400">Environmental Architecture & Methodology</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <div>
            <h3 className="text-sm font-semibold text-cyan-300 mb-1 flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              1. Open-Meteo Air Quality & Meteorological Models
            </h3>
            <p className="text-slate-400">
              Air quality data (PM2.5, PM10, US AQI) and 48-hour forecasts are queried from the Open-Meteo Global Air Quality API, powered by ECMWF Copernicus Atmosphere Monitoring Service (CAMS) and regional numerical weather predictions.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
              <Satellite className="w-4 h-4" />
              2. NASA FIRMS Active Fire Hotspots
            </h3>
            <p className="text-slate-400">
              Satellite thermal anomaly points are ingested from the NASA FIRMS (Fire Information for Resource Management System) VIIRS instruments aboard NOAA-20 and NOAA-21. Note: A satellite thermal anomaly indicates elevated temperature and may reflect agricultural burning, industrial activity, or wildfires.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-sky-300 mb-1 flex items-center gap-1.5">
              <Wind className="w-4 h-4" />
              3. Dynamic Wind Vectors & Dispersion
            </h3>
            <p className="text-slate-400">
              10-metre atmospheric wind vectors are retrieved from global weather models. Particle streamlines illustrate prevailing downwind trajectories to provide situational awareness of transboundary smoke movement.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-emerald-300 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              4. Standard Distinction: US AQI vs Malaysian API (IPU)
            </h3>
            <p className="text-slate-400">
              The primary index displayed is the US EPA Air Quality Index (US AQI). Malaysia&apos;s Department of Environment (DOE APIMS) calculates the Air Pollutant Index (API/IPU) with distinct mathematical formulas and pollutant weighting. We keep these indices strictly separated to prevent misleading comparisons.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
            <div className="text-[11px]">
              <strong>Public Health Guidance Disclaimer:</strong> HazeWatch SEA is designed for environmental monitoring, educational, and situational awareness. It is not an official medical diagnostic tool. For official government advisories, refer to DOE Malaysia (APIMS) or the ASEAN Specialised Meteorological Centre (ASMC).
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg"
          >
            Close & Explore Map
          </button>
        </div>
      </div>
    </div>
  );
};
