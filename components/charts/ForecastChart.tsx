'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { HourlyForecastItem } from '@/types';
import { Activity } from 'lucide-react';

interface ForecastChartProps {
  hourly: HourlyForecastItem[];
  selectedHourOffset: number;
  onSelectHour?: (hour: number) => void;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  hourly,
  selectedHourOffset,
  onSelectHour,
}) => {
  const [metric, setMetric] = useState<'aqi' | 'pm25'>('aqi');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !hourly || hourly.length === 0) {
    return (
      <div className="w-full h-44 flex items-center justify-center glass-panel-subtle rounded-xl text-slate-500 text-xs">
        Loading 48h forecast trajectory...
      </div>
    );
  }

  // Format data for Recharts
  const chartData = hourly.map((item, index) => {
    const d = new Date(item.time);
    const hourLabel = `${d.getHours()}:00`;
    return {
      index,
      time: hourLabel,
      fullTime: item.time,
      aqi: item.us_aqi,
      pm25: item.pm2_5,
      isCurrent: index === selectedHourOffset,
    };
  });

  const isAqi = metric === 'aqi';
  const dataKey = isAqi ? 'aqi' : 'pm25';
  const color = isAqi ? '#38bdf8' : '#10b981';

  return (
    <div className="glass-panel-subtle rounded-xl p-3 border border-white/5">
      {/* Metric Selector Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>48-Hour Forecast Trend</span>
        </div>

        <div className="flex items-center space-x-1 bg-slate-900/80 p-0.5 rounded-lg border border-white/10 text-[10px]">
          <button
            onClick={() => setMetric('aqi')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              isAqi
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            US AQI
          </button>
          <button
            onClick={() => setMetric('pm25')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              !isAqi
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            PM2.5 (µg/m³)
          </button>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="w-full h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
            onClick={(e) => {
              if (e && typeof e.activeTooltipIndex === 'number' && onSelectHour) {
                onSelectHour(e.activeTooltipIndex);
              }
            }}
          >
            <defs>
              <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="time"
              interval={7}
              stroke="#64748b"
              fontSize={9}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={9}
              tickLine={false}
              domain={['auto', 'auto']}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-white/10 rounded-lg p-2 text-[11px] shadow-xl text-slate-200">
                      <div className="text-slate-400 text-[10px] mb-1">
                        +{data.index}h Forecast ({data.time} MYT)
                      </div>
                      <div className="font-semibold text-white">
                        {isAqi ? `US AQI: ${data.aqi}` : `PM2.5: ${data.pm25} µg/m³`}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Threshold Guideline Reference Lines */}
            {isAqi ? (
              <>
                <ReferenceLine y={50} stroke="#10b981" strokeDasharray="3 3" opacity={0.6} />
                <ReferenceLine y={100} stroke="#eab308" strokeDasharray="3 3" opacity={0.6} />
                <ReferenceLine y={150} stroke="#f97316" strokeDasharray="3 3" opacity={0.6} />
              </>
            ) : (
              <ReferenceLine y={15} stroke="#10b981" strokeDasharray="3 3" opacity={0.6} />
            )}

            {/* Indicator for currently scrubbed timeline hour */}
            <ReferenceLine
              x={chartData[selectedHourOffset]?.time}
              stroke="#f43f5e"
              strokeWidth={1.5}
            />

            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#metricGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
        <span>Timeline: Now → +48 Hours</span>
        <span className="text-cyan-400 font-mono">
          Hover or click chart to scrub
        </span>
      </div>
    </div>
  );
};
