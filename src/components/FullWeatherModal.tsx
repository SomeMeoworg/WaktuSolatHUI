import React, { useMemo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Droplets, Wind, Sun, Sunrise, Sunset, Umbrella, MapPin, Search, Thermometer, RefreshCcw, Activity } from "lucide-react";
import { cn } from "../lib/utils";
import { M3_MOTION } from "../lib/motion";
import { useAppContext } from "../AppContext";
import { getWeatherDetails, WeatherData } from "./WeatherWidget";
import { format, parseISO } from "date-fns";
import { ms } from "date-fns/locale";

interface FullWeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData;
  locationName: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const WeatherParticles = ({ weatherCode, isDay }: { weatherCode: number, isDay: boolean }) => {
  // Simple ambient animation based on weather
  if (weatherCode >= 61 && weatherCode <= 67) {
    // Rain
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`rain-${i}`}
            className="absolute w-[2px] h-[20px] bg-blue-300 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `-20px` }}
            animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
            transition={{ duration: 0.8 + Math.random() * 0.5, repeat: Infinity, delay: Math.random(), ease: "linear" }}
          />
        ))}
      </div>
    );
  }
  if (weatherCode === 0 && isDay) {
    // Clear day - slow rotating sun rays
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 flex items-center justify-center">
        <motion.div 
          className="w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full border-[40px] border-amber-200 border-dashed"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }
  return null;
};

const PROVIDERS = [
  { id: "best_match", name: "Auto (Best Match)", desc: "Pilih model terbaik secara automatik" },
  { id: "ecmwf_ifs04", name: "ECMWF", desc: "Model Eropah (Sangat Tepat)" },
  { id: "gfs_seamless", name: "GFS", desc: "Model Amerika Syarikat (NOAA)" },
  { id: "jma_seamless", name: "JMA", desc: "Agensi Meteorologi Jepun" }
];

export function FullWeatherModal({ isOpen, onClose, weather, locationName, onRefresh, isRefreshing }: FullWeatherModalProps) {
  const { t, settings, updateSettings } = useAppContext();
  const { label: currentLabel, Icon: CurrentIcon } = getWeatherDetails(weather.weatherCode, weather.isDay, t);

  const hourlyForecasts = useMemo(() => {
    if (!weather.hourly) return [];
    const now = new Date();
    return weather.hourly.time
      .map((timeStr, i) => ({
        time: parseISO(timeStr),
        temp: Math.round(weather.hourly!.temperature_2m[i]),
        code: weather.hourly!.weather_code[i],
        precip: weather.hourly!.precipitation_probability[i],
      }))
      .filter((f) => f.time >= now)
      .slice(0, 24);
  }, [weather.hourly]);

  const dailyForecasts = useMemo(() => {
    if (!weather.daily) return [];
    return weather.daily.time.map((timeStr, i) => ({
      date: parseISO(timeStr),
      maxTemp: Math.round(weather.daily!.temperature_2m_max[i]),
      minTemp: Math.round(weather.daily!.temperature_2m_min[i]),
      code: weather.daily!.weather_code[i],
      precip: weather.daily!.precipitation_probability_max[i],
      sunrise: weather.daily!.sunrise[i] ? parseISO(weather.daily!.sunrise[i]) : null,
      sunset: weather.daily!.sunset[i] ? parseISO(weather.daily!.sunset[i]) : null,
      uvIndex: weather.daily!.uv_index_max[i],
    }));
  }, [weather.daily]);

  const { weekMin, weekMax } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    dailyForecasts.forEach(d => {
      if (d.minTemp < min) min = d.minTemp;
      if (d.maxTemp > max) max = d.maxTemp;
    });
    return { weekMin: min !== Infinity ? min : 0, weekMax: max !== -Infinity ? max : 100 };
  }, [dailyForecasts]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 sm:overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: "100%" }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: "100%" }}
            transition={M3_MOTION.expressiveSpring}
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--md-sys-color-surface)] w-full max-w-4xl h-[90vh] sm:h-[85vh] max-h-[900px] flex flex-col rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-2xl sm:my-auto text-[var(--md-sys-color-on-surface)]"
          >
            <div className="relative p-5 sm:p-6 md:p-10 shrink-0 bg-gradient-to-br from-[var(--md-sys-color-primary-container)] to-[var(--md-sys-color-surface-variant)] flex flex-col items-center justify-center text-center overflow-hidden">
              {onRefresh && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onRefresh}
                  className="absolute top-3 left-3 sm:top-4 sm:left-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-[var(--md-sys-color-on-surface)] backdrop-blur-md transition-colors z-20"
                >
                  <motion.div
                    animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                    transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                  >
                    <RefreshCcw size={18} className="stroke-[3]" />
                  </motion.div>
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-[var(--md-sys-color-on-surface)] backdrop-blur-md transition-colors z-20"
              >
                <X size={20} className="stroke-[3]" />
              </motion.button>
              
              <WeatherParticles weatherCode={weather.weatherCode} isDay={weather.isDay} />

              <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                 <CurrentIcon className="w-[200px] h-[200px] sm:w-[300px] sm:h-[300px]" strokeWidth={1} />
              </div>

              <div className="relative z-10 w-full mt-2">
                <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3 opacity-80">
                  <MapPin size={14} className="sm:w-4 sm:h-4" />
                  <span className="font-bold tracking-widest uppercase text-[10px] sm:text-xs">{locationName}</span>
                </div>
                
                <div className="flex items-center justify-center gap-3 sm:gap-6 mb-1 sm:mb-2">
                  <CurrentIcon className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-lg text-[var(--md-sys-color-primary)]" strokeWidth={2} />
                  <div className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter drop-shadow-md">
                    {weather.temperature}°
                  </div>
                </div>
                
                <h2 className="text-lg sm:text-xl md:text-3xl font-black tracking-tight mb-4 sm:mb-5 capitalize leading-tight">
                  {currentLabel}
                </h2>

                <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-bold bg-white/20 backdrop-blur-md px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-sm max-w-[95%] mx-auto">
                  <span className="flex items-center gap-1 sm:gap-1.5"><Thermometer size={14} className="sm:w-4 sm:h-4" /> Terasa Seperti: {weather.apparentTemperature ?? weather.temperature}°</span>
                  <span className="flex items-center gap-1 sm:gap-1.5"><Droplets size={14} className="sm:w-4 sm:h-4" /> {weather.humidity}%</span>
                  <span className="flex items-center gap-1 sm:gap-1.5"><Wind size={14} className="sm:w-4 sm:h-4" /> {weather.windSpeed} km/j</span>
                </div>

                <div className="mt-4 text-[10px] sm:text-xs font-bold opacity-60">
                  Dikemas kini {weather.lastUpdated ? Math.max(0, Math.floor((Date.now() - weather.lastUpdated) / 60000)) : 0} minit lepas
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6 sm:gap-8 custom-scrollbar">
              
              {/* 24-Hour Forecast */}
              <section>
                <h3 className="text-lg font-black tracking-tight mb-4 px-2">{t("24HourForecast" as any) || "Ramalan 24 Jam"}</h3>
                <div className="flex overflow-x-auto gap-3 pb-4 px-2 custom-scrollbar snap-x">
                  {hourlyForecasts.map((hour, idx) => {
                    const { Icon: HourIcon } = getWeatherDetails(hour.code, hour.time.getHours() >= 6 && hour.time.getHours() <= 19, t);
                    return (
                      <div key={idx} className="flex flex-col items-center justify-between bg-[var(--md-sys-color-surface-container)] rounded-[1.5rem] p-4 min-w-[90px] snap-center shrink-0 border border-transparent hover:border-[var(--md-sys-color-outline-variant)] transition-colors">
                        <span className="text-sm font-bold opacity-70 mb-3">{format(hour.time, "ha")}</span>
                        <HourIcon size={28} className="mb-3 text-[var(--md-sys-color-primary)]" />
                        <span className="text-xl font-black">{hour.temp}°</span>
                        {hour.precip > 20 && (
                          <span className="text-xs font-bold text-blue-500 mt-2 flex items-center gap-1">
                            <Umbrella size={10} /> {hour.precip}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 px-1 sm:px-2">
                <div className="bg-[var(--md-sys-color-surface-container)] p-4 sm:p-5 rounded-3xl flex flex-col justify-between aspect-square">
                  <div className="flex items-center gap-1.5 sm:gap-2 opacity-70 font-bold mb-2 sm:mb-4 text-xs sm:text-base">
                    <Activity className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> Kualiti Udara (AQI)
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-black mb-1" style={{ color: weather.aqi ? (weather.aqi > 150 ? '#ef4444' : weather.aqi > 100 ? '#f97316' : weather.aqi > 50 ? '#eab308' : '#22c55e') : 'inherit' }}>
                      {weather.aqi ?? '--'}
                    </div>
                    <div className="text-xs sm:text-sm font-medium opacity-80 leading-tight">
                      {(weather.aqi ?? 0) > 150 ? "Tidak Sihat" : (weather.aqi ?? 0) > 100 ? "Sederhana (Sensitif)" : (weather.aqi ?? 0) > 50 ? "Sederhana" : "Baik"}
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--md-sys-color-surface-container)] p-4 sm:p-5 rounded-3xl flex flex-col justify-between aspect-square">
                  <div className="flex items-center gap-1.5 sm:gap-2 opacity-70 font-bold mb-2 sm:mb-4 text-xs sm:text-base">
                    <Sun className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> UV Index
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-black mb-1">{weather.uvIndex ?? '--'}</div>
                    <div className="text-xs sm:text-sm font-medium opacity-80 leading-tight">
                      {(weather.uvIndex ?? 0) > 7 ? "Tinggi" : (weather.uvIndex ?? 0) > 3 ? "Sederhana" : "Rendah"}
                    </div>
                  </div>
                </div>
                
                <div className="bg-[var(--md-sys-color-surface-container)] p-4 sm:p-5 rounded-3xl flex flex-col justify-between aspect-square">
                  <div className="flex items-center gap-1.5 sm:gap-2 opacity-70 font-bold mb-2 sm:mb-4 text-xs sm:text-base leading-tight">
                    <Sunrise className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> Matahari Terbit
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-black mb-1 leading-tight">
                      {dailyForecasts[0]?.sunrise ? format(dailyForecasts[0].sunrise, "h:mm a") : '--'}
                    </div>
                  </div>
                </div>
                
                <div className="bg-[var(--md-sys-color-surface-container)] p-4 sm:p-5 rounded-3xl flex flex-col justify-between aspect-square">
                  <div className="flex items-center gap-1.5 sm:gap-2 opacity-70 font-bold mb-2 sm:mb-4 text-xs sm:text-base leading-tight">
                    <Sunset className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> Matahari Terbenam
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-black mb-1 leading-tight">
                      {dailyForecasts[0]?.sunset ? format(dailyForecasts[0].sunset, "h:mm a") : '--'}
                    </div>
                  </div>
                </div>
                
                <div className="bg-[var(--md-sys-color-surface-container)] p-4 sm:p-5 rounded-3xl flex flex-col justify-between aspect-square">
                  <div className="flex items-center gap-1.5 sm:gap-2 opacity-70 font-bold mb-2 sm:mb-4 text-xs sm:text-base">
                    <Wind className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> Tekanan
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-black mb-1">
                      {weather.surfacePressure ?? '--'} <span className="text-xs sm:text-base font-bold opacity-60">hPa</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 7-Day Forecast */}
              <section className="px-1 sm:px-2">
                <h3 className="text-lg font-black tracking-tight mb-4">{t("7DayForecast" as any) || "Ramalan 7 Hari"}</h3>
                <div className="flex flex-col gap-2">
                  {dailyForecasts.map((day, idx) => {
                    const { Icon: DayIcon } = getWeatherDetails(day.code, true, t);
                    const isToday = idx === 0;
                    
                    const range = weekMax - weekMin || 1;
                    const leftPercent = Math.max(0, ((day.minTemp - weekMin) / range) * 100);
                    const widthPercent = Math.max(5, ((day.maxTemp - day.minTemp) / range) * 100);

                    return (
                      <div key={idx} className="flex items-center justify-between p-3 sm:p-4 bg-[var(--md-sys-color-surface-container-low)] rounded-[1.5rem]">
                        <div className="w-[70px] sm:w-24 font-bold text-[13px] sm:text-base shrink-0 truncate">
                          {isToday ? "Hari Ini" : format(day.date, "EEEE", { locale: settings.language === 'ms' ? ms : undefined })}
                        </div>
                        <div className="flex items-center justify-center gap-2 sm:gap-4 flex-1">
                          <DayIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--md-sys-color-primary)] shrink-0" />
                          {day.precip > 20 && (
                            <span className="text-[10px] sm:text-xs font-bold text-blue-500 w-8 sm:w-10 text-center">{day.precip}%</span>
                          )}
                        </div>
                        <div className="w-[120px] sm:w-48 flex items-center justify-end gap-2 sm:gap-3 font-black text-[13px] sm:text-base shrink-0">
                          <span className="opacity-60 text-right w-6 sm:w-8">{day.minTemp}°</span>
                          <div className="relative flex-1 max-w-[60px] sm:max-w-[100px] h-1.5 sm:h-2 bg-[var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden shrink-0">
                             <div 
                               className="absolute h-full bg-gradient-to-r from-blue-400 to-[var(--md-sys-color-error)] opacity-90 rounded-full" 
                               style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                             />
                          </div>
                          <span className="text-right w-6 sm:w-8">{day.maxTemp}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Provider Selection */}
              <section className="px-1 sm:px-2 mt-2 sm:mt-4 pb-8">
                <div className="bg-[var(--md-sys-color-surface-container-high)] p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem]">
                  <h3 className="text-base sm:text-lg font-black tracking-tight mb-1 sm:mb-2">Penyedia Cuaca / Model</h3>
                  <p className="text-xs sm:text-sm opacity-70 mb-4 sm:mb-6">Pilih model kaji cuaca percuma yang paling tepat untuk lokasi anda.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {PROVIDERS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => updateSettings({ weatherProvider: p.id as any })}
                        className={cn(
                          "flex flex-col items-start p-3 sm:p-4 rounded-2xl transition-all border-2 text-left",
                          (settings.weatherProvider || 'best_match') === p.id
                            ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
                            : "border-transparent bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-outline-variant)]"
                        )}
                      >
                        <span className="font-black text-sm sm:text-base mb-0.5 sm:mb-1">{p.name}</span>
                        <span className="text-[10px] sm:text-xs font-medium opacity-80">{p.desc}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 text-[10px] sm:text-xs font-bold opacity-50 flex items-center gap-1 sm:gap-1.5 justify-center">
                     Powered by <a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="underline">Open-Meteo API</a>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
