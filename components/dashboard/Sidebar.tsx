'use client';

import React from 'react';
import { 
  Wind, 
  Compass, 
  Activity, 
  ShieldCheck, 
  HelpCircle,
  Clock,
  MapPin,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { LocationCoords, CurrentAirQuality, HourlyForecastItem } from '@/types';
import { formatMalaysiaTime, getAqiCategory } from '@/lib/geo/aqi';
import { ForecastChart } from '@/components/charts/ForecastChart';
import { GefsOutlookFanChart } from '@/components/charts/GefsOutlookFanChart';
import { EnvironmentalIntelligenceCards } from './EnvironmentalIntelligenceCards';
import { HotspotGeoJSON } from '@/lib/geo/hotspots';
import { TomorrowOutlookData } from '@/lib/geo/gefs-ensemble';

interface SidebarProps {
  currentLocation: LocationCoords;
  airQuality: CurrentAirQuality | null;
  forecast?: HourlyForecastItem[];
  selectedHourOffset?: number;
  onSelectHour?: (hour: number) => void;
  isLoading: boolean;
  error?: string | null;
  onRefresh: () => void;
  className?: string;
  hotspotsData?: HotspotGeoJSON | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentLocation,
  airQuality,
  forecast = [],
  selectedHourOffset = 0,
  onSelectHour,
  isLoading,
  error = null,
  onRefresh,
  className = '',
  hotspotsData = null,
}) => {
  // Determine if viewing current conditions or a future forecast hour
  const isForecasting = selectedHourOffset > 0 && forecast[selectedHourOffset];
  const activeData = isForecasting ? forecast[selectedHourOffset] : null;

  // Active AQI and Category
  const displayAqi = activeData ? activeData.us_aqi : (airQuality?.us_aqi ?? null);
  const aqiInfo = displayAqi !== null ? getAqiCategory(displayAqi) : null;
  const displayPm25 = activeData ? activeData.pm2_5 : (airQuality?.pm2_5 ?? null);
  const displayPm10 = activeData ? activeData.pm10 : (airQuality?.pm10 ?? null);
  const displayWindSpeed = activeData?.windSpeed10m ?? airQuality?.windSpeed10m ?? null;
  const displayWindDir = activeData?.windDirection10m ?? airQuality?.windDirection10m ?? null;

  // Tomorrow's Outlook: 31 NOAA GEFS Ensemble Fan & Forecast PSI Range (Item 4)
  const [outlookData, setOutlookData] = React.useState<TomorrowOutlookData | null>(null);
  const [outlookLoading, setOutlookLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    let isCancelled = false;
    async function fetchOutlook() {
      setOutlookLoading(true);
      try {
        const url = `/api/outlook?location=${encodeURIComponent(currentLocation.name)}&aqi=${displayAqi || 75}&pm25=${displayPm25 || 24.5}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled && json.outlook) {
            setOutlookData(json.outlook);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch GEFS ensemble outlook:', err);
      } finally {
        if (!isCancelled) setOutlookLoading(false);
      }
    }

    fetchOutlook();

    return () => {
      isCancelled = true;
    };
  }, [currentLocation.name, displayAqi, displayPm25]);

  return (
    <aside
      className={`glass-panel border-r border-white/10 flex flex-col h-full overflow-y-auto text-slate-200 p-4 transition-all duration-300 ${className}`}
    >
      {/* Location Card */}
      <div className="glass-panel-subtle rounded-xl p-3.5 mb-3 border border-white/5">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5 text-xs text-cyan-400 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              <span>{currentLocation.country || 'Southeast Asia'}</span>
              {currentLocation.isUserLocation && (
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-500/30">
                  Your Location
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {currentLocation.name}
            </h2>
            <div className="text-[11px] text-slate-400 font-mono">
              {currentLocation.latitude.toFixed(4)}° N, {currentLocation.longitude.toFixed(4)}° E
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors border border-white/10 disabled:opacity-50"
            title="Refresh latest observations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error / Fallback Alert Banner */}
      {error && (
        <div className="mb-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <div className="text-[11px] leading-tight">
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main AQI Status Card */}
      <div className="glass-panel-subtle rounded-2xl p-4 mb-3 border border-white/5 relative overflow-hidden flex-shrink-0">
        {/* Ambient background glow based on category color */}
        <div 
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ backgroundColor: aqiInfo?.color || '#10b981' }}
        />

        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Air Quality Index
            </span>
            {isForecasting && (
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30 whitespace-nowrap">
                +{selectedHourOffset}h FORECAST
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-white/10 flex-shrink-0 whitespace-nowrap">
            US EPA Standard
          </span>
        </div>

        {/* AQI Score and Category Status */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div 
            className="text-4xl sm:text-5xl font-black tracking-tight leading-none flex-shrink-0"
            style={{ color: aqiInfo?.color || '#10b981' }}
          >
            {displayAqi !== null ? Math.round(displayAqi) : '--'}
          </div>
          <div className="text-right min-w-0">
            <div className="text-sm sm:text-base font-bold text-white leading-tight break-words">
              {aqiInfo?.category || (isLoading ? 'Fetching live API...' : 'Unavailable')}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              {displayAqi !== null ? `AQI Index Score` : 'Awaiting data'}
            </div>
          </div>
        </div>

        {/* Severity Banner */}
        <div 
          className="px-3 py-1.5 rounded-lg text-xs font-medium mb-3 flex items-center space-x-2 border"
          style={{ 
            backgroundColor: `${aqiInfo?.color || '#10b981'}15`,
            borderColor: `${aqiInfo?.color || '#10b981'}35`,
            color: aqiInfo?.color || '#10b981'
          }}
        >
          <Activity className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            {aqiInfo?.category === 'Good' && 'Satisfactory air quality; little to no health risk.'}
            {aqiInfo?.category === 'Moderate' && 'Acceptable; unusually sensitive persons consider reducing prolonged exertion.'}
            {aqiInfo?.category === 'Unhealthy for Sensitive Groups' && 'Sensitive groups (asthma/elderly) should limit outdoor activity.'}
            {aqiInfo?.category === 'Unhealthy' && 'Everyone may experience health effects; wear N95 mask outdoors.'}
            {aqiInfo?.category === 'Very Unhealthy' && 'Health alert: avoid outdoor activities; keep indoor air clean.'}
            {aqiInfo?.category === 'Hazardous' && 'Emergency warning: stay indoors; seal windows and run HEPA filters.'}
            {!aqiInfo && 'Connecting to Open-Meteo Environmental Network...'}
          </span>
        </div>

        {/* Note on Malaysian API / IPU Distinction */}
        <div className="text-[10px] text-slate-400 flex items-start space-x-1.5 bg-slate-950/40 p-2 rounded-lg border border-white/5">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-300">Standard Distinction:</strong> This score uses US EPA AQI. Malaysia&apos;s official DOE APIMS reports API/IPU values calculated under different national sub-index equations.
          </div>
        </div>
      </div>

      {/* Particulate Matter Concentrations */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {/* PM2.5 */}
        <div className="glass-panel-subtle rounded-xl p-3 border border-white/5">
          <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
            <span>PM2.5</span>
            <span className="text-[10px] text-cyan-400">Fine Dust</span>
          </div>
          <div className="text-xl font-bold text-white mb-0.5">
            {displayPm25 !== null ? `${displayPm25.toFixed(1)}` : '--'}
            <span className="text-xs font-normal text-slate-400 ml-1">µg/m³</span>
          </div>
          <div className="text-[10px] text-slate-400">
            WHO 24h: 15 µg/m³
          </div>
        </div>

        {/* PM10 */}
        <div className="glass-panel-subtle rounded-xl p-3 border border-white/5">
          <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
            <span>PM10</span>
            <span className="text-[10px] text-sky-400">Coarse</span>
          </div>
          <div className="text-xl font-bold text-white mb-0.5">
            {displayPm10 !== null ? `${displayPm10.toFixed(1)}` : '--'}
            <span className="text-xs font-normal text-slate-400 ml-1">µg/m³</span>
          </div>
          <div className="text-[10px] text-slate-400">
            WHO 24h: 45 µg/m³
          </div>
        </div>
      </div>

      {/* Local Meteorological Vectors */}
      <div className="glass-panel-subtle rounded-xl p-3 mb-3 border border-white/5">
        <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2 flex items-center justify-between">
          <span>Surface Wind Vector (10m)</span>
          <Wind className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-cyan-950/40 text-cyan-400 border border-cyan-800/30">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Direction</div>
              <div className="text-xs font-bold text-white">
                {displayWindDir !== null ? `${Math.round(displayWindDir)}°` : '--'}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-sky-950/40 text-sky-400 border border-sky-800/30">
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Velocity</div>
              <div className="text-xs font-bold text-white">
                {displayWindSpeed !== null ? `${displayWindSpeed.toFixed(1)} km/h` : '--'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Haze Source Intelligence & 5-Day Trajectory Origin */}
      <EnvironmentalIntelligenceCards
        currentLocation={currentLocation}
        displayAqi={displayAqi}
        displayPm25={displayPm25}
        displayWindSpeed={displayWindSpeed}
        displayWindDir={displayWindDir}
        hotspotsData={hotspotsData}
      />

      {/* 48-Hour Forecast Trend Chart */}
      <div className="mb-3">
        <ForecastChart
          hourly={forecast}
          selectedHourOffset={selectedHourOffset}
          onSelectHour={onSelectHour}
        />
      </div>

      {/* Tomorrow's Outlook: 31 NOAA GEFS Ensemble Fan & Forecast PSI Range (Item 4) */}
      <div className="mb-3">
        <GefsOutlookFanChart
          outlook={outlookData}
          isLoading={outlookLoading}
        />
      </div>

      {/* Model vs Observation Explanation */}
      <div className="glass-panel-subtle rounded-xl p-3 mb-3 border border-white/5 text-[11px] space-y-1.5">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Modelled vs Measured Data</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          Environmental data is queried from Open-Meteo Global Air Quality CAMS reanalysis and numerical weather models. Station observations may fluctuate with localized vehicular or industrial micro-climates.
        </p>
      </div>

      {/* Attribution & Timestamp Footer */}
      <div className="mt-auto pt-3 border-t border-white/5 text-[10px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Updated:</span>
          </span>
          <span className="font-mono text-slate-400">
            {airQuality ? formatMalaysiaTime(airQuality.timestamp) : (isLoading ? 'Updating...' : 'N/A')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Data Sources:</span>
          <span className="text-slate-400">Open-Meteo, Copernicus, ECMWF</span>
        </div>
      </div>
    </aside>
  );
};
