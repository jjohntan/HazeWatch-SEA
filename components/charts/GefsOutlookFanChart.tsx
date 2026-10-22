'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { TomorrowOutlookData } from '@/lib/geo/gefs-ensemble';
import { Wind, HelpCircle } from 'lucide-react';

interface GefsOutlookFanChartProps {
  outlook: TomorrowOutlookData | null;
  isLoading?: boolean;
}

export const GefsOutlookFanChart: React.FC<GefsOutlookFanChartProps> = ({
  outlook,
  isLoading = false,
}) => {
  const [viewMode, setViewMode] = useState<'fan' | 'members'>('fan');

  if (isLoading || !outlook) {
    return (
      <div className="glass-panel-subtle rounded-2xl p-4 border border-white/5 animate-pulse text-xs text-slate-400">
        Loading Tomorrow&apos;s 31 NOAA GEFS Forecast Fan...
      </div>
    );
  }

  // Build chart data matching fan percentiles
  const chartData = outlook.fanPercentiles.map((fp) => {
    return {
      hourLabel: fp.hour === 0 ? '00:00' : `${String(fp.hour).padStart(2, '0')}:00`,
      min: fp.min,
      // Stacked bands for area fan:
      // Band 1 (Outer 80% CI: p10 to p90): base = p10, height = p90 - p10
      // Band 2 (Inner 50% CI: p25 to p75): base = p25, height = p75 - p25
      p10_base: fp.p10,
      p10_p90_range: Math.max(0, fp.p90 - fp.p10),
      p25_base: fp.p25,
      p25_p75_range: Math.max(0, fp.p75 - fp.p25),
      median: fp.median,
      p10: fp.p10,
      p25: fp.p25,
      p75: fp.p75,
      p90: fp.p90,
      max: fp.max,
      // Add individual members for 'members' view
      ...outlook.members.reduce((acc, m, idx) => {
        acc[`m_${idx}`] = m.trajectoryHourAqi[Math.floor(fp.hour / 3)] || fp.median;
        return acc;
      }, {} as Record<string, number>),
    };
  });

  return (
    <div className="glass-panel-subtle rounded-2xl p-4 border border-white/5 space-y-3">
      {/* Header with explicit FORECAST badges */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                Tomorrow&apos;s Outlook
              </h3>
              <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40">
                FORECAST
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              31 NOAA GEFS Ensemble Members Fan Plume
            </div>
          </div>
        </div>

        {/* View toggle (Fan vs All 31 Members) */}
        <div className="flex items-center space-x-1 bg-slate-900/80 p-0.5 rounded-lg border border-white/10 text-[10px]">
          <button
            onClick={() => setViewMode('fan')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              viewMode === 'fan'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ensemble Fan
          </button>
          <button
            onClick={() => setViewMode('members')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              viewMode === 'members'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All 31 Spills
          </button>
        </div>
      </div>

      {/* Tomorrow's Forecast PSI & AQI Range Banner (both labelled as forecasts) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Forecast PSI Range Card */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Forecast PSI Range
            </span>
            <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              FORECAST
            </span>
          </div>
          <div className="text-base font-extrabold text-white flex items-baseline gap-1">
            <span className="text-sky-300">{outlook.forecastPsiRange.min}</span>
            <span className="text-slate-500 text-xs font-normal">–</span>
            <span className="text-sky-300">{outlook.forecastPsiRange.max}</span>
            <span className="text-[10px] text-slate-400 font-normal ml-0.5">PSI</span>
          </div>
          <div className="text-[10px] text-slate-300 font-medium">
            Category: <span className="text-amber-300">{outlook.forecastPsiRange.category}</span>
          </div>
        </div>

        {/* Forecast US AQI Range Card */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Forecast AQI Range
            </span>
            <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              FORECAST
            </span>
          </div>
          <div className="text-base font-extrabold text-white flex items-baseline gap-1">
            <span className="text-cyan-300">{outlook.forecastAqiRange.min}</span>
            <span className="text-slate-500 text-xs font-normal">–</span>
            <span className="text-cyan-300">{outlook.forecastAqiRange.max}</span>
            <span className="text-[10px] text-slate-400 font-normal ml-0.5">AQI</span>
          </div>
          <div className="text-[10px] text-slate-300 font-medium">
            Median: <span className="text-cyan-300 font-bold">{outlook.forecastAqiRange.median}</span>
          </div>
        </div>
      </div>

      {/* Fan Chart Visualization */}
      <div className="w-full h-40 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="fanOuterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#0284c7" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="fanInnerGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#0284c7" stopOpacity={0.20} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="hourLabel"
              stroke="#64748b"
              fontSize={9}
              tickLine={false}
              axisLine={false}
            />
            <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="glass-panel p-2.5 rounded-lg border border-white/10 text-[11px] space-y-1 shadow-xl">
                      <div className="font-semibold text-white border-b border-white/10 pb-1 flex items-center justify-between gap-2">
                        <span>Tomorrow {label}</span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300">
                          FORECAST
                        </span>
                      </div>
                      <div className="text-slate-300">
                        Median (p50): <strong className="text-white">{data.median} AQI</strong>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        50% Ensemble Core: {data.p25} – {data.p75} AQI
                      </div>
                      <div className="text-[10px] text-slate-400">
                        80% Confidence Plume: {data.p10} – {data.p90} AQI
                      </div>
                      <div className="text-[9px] text-slate-500 pt-0.5">
                        Span of 31 GEFS Members: {data.min} – {data.max}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {viewMode === 'fan' ? (
              <>
                {/* Outer 80% CI Plume (p10 to p90) */}
                <Area
                  type="monotone"
                  dataKey="p90"
                  stroke="#38bdf8"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  fillOpacity={1}
                  fill="url(#fanOuterGrad)"
                />
                {/* Inner 50% CI Plume (p25 to p75) */}
                <Area
                  type="monotone"
                  dataKey="p75"
                  stroke="#0284c7"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#fanInnerGrad)"
                />
                {/* Median Trajectory (p50) */}
                <Line
                  type="monotone"
                  dataKey="median"
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: '#ffffff' }}
                />
              </>
            ) : (
              <>
                {/* Render all 31 individual ensemble member lines */}
                {Array.from({ length: 31 }).map((_, i) => (
                  <Line
                    key={i}
                    type="monotone"
                    dataKey={`m_${i}`}
                    stroke={i === 0 ? '#ffffff' : '#38bdf8'}
                    strokeWidth={i === 0 ? 2 : 0.8}
                    strokeOpacity={i === 0 ? 0.95 : 0.4}
                    dot={false}
                  />
                ))}
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Methodology Footer */}
      <div className="text-[10px] text-slate-400 flex items-start gap-1.5 bg-slate-950/40 p-2 rounded-lg border border-white/5">
        <HelpCircle className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
        <div className="leading-snug">
          <strong className="text-slate-300">Ensemble Spread Interpretation:</strong> Wider fan shading represents higher meteorological divergence between the 31 NOAA GEFS perturbations tomorrow. Both the fan chart and PSI values are labeled as numerical forecasts.
        </div>
      </div>
    </div>
  );
};
