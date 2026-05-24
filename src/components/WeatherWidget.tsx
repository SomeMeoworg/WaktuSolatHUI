import { useEffect, useState } from "react";
import { ZONE_COORDINATES } from "../lib/zoneCoordinates";
import "@material/web/ripple/ripple.js";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSun,
  Moon,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  Umbrella,
  WifiOff,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppContext } from "../AppContext";
import { useVisualStyle } from "../hooks/useVisualStyle";
import { cn } from "../lib/utils";
import { JAKIM_ZONES } from "../lib/zones";
import { FullWeatherModal } from "./FullWeatherModal";

export interface HourlyForecast {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
  precipitation_probability: number[];
}

export interface DailyForecast {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
  uv_index_max: number[];
  precipitation_probability_max: number[];
}

export interface WeatherData {
  temperature: number;
  apparentTemperature: number; // Feels like
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  isDay: boolean;
  uvIndex?: number;
  surfacePressure?: number;
  minTemp?: number;
  maxTemp?: number;
  precipitationProb?: number;
  aqi?: number;
  lastUpdated: number; // Timestamp
  hourly?: HourlyForecast;
  daily?: DailyForecast;
}

export function WeatherWidget({ selectedZone, userCoords, currentLocationName }: { selectedZone: string, userCoords?: {lat: number, lng: number} | null, currentLocationName?: string | null }) {
  const { t, settings } = useAppContext();
  const visualStyle = useVisualStyle();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const [weather, setWeather] = useState<WeatherData | null>(() => {
    const cached = localStorage.getItem(`weather-${selectedZone}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.temperature === "number") {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedZone) return;

    // Default to KL if not found, or use user's exact coords if available
    const coords = userCoords ? [userCoords.lat, userCoords.lng] : (ZONE_COORDINATES[selectedZone] || [3.13, 101.68]);
    const [lat, lng] = coords;

    let isMounted = true;

    const fetchWeather = async (force = false) => {
      // Smart caching check (15 mins)
      if (!force) {
        const cachedStr = localStorage.getItem(`weather-${selectedZone}`);
        if (cachedStr) {
          try {
            const cached: WeatherData = JSON.parse(cachedStr);
            if (cached && cached.lastUpdated && Date.now() - cached.lastUpdated < 15 * 60 * 1000) {
              setWeather(cached);
              setIsLoading(false);
              return;
            }
          } catch (e) {}
        }
      }

      setIsLoading(true);
      if (force) setIsRefreshing(true);
      try {
        const provider = settings.weatherProvider || 'best_match';
        
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m,surface_pressure,uv_index&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=Asia%2FSingapore&models=${provider}`;
        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi&timezone=Asia%2FSingapore`;

        const [weatherRes, aqiRes] = await Promise.allSettled([
          fetch(weatherUrl),
          fetch(aqiUrl)
        ]);

        if (weatherRes.status === 'rejected' || !weatherRes.value.ok) throw new Error("Failed to fetch weather");

        let weatherData = await weatherRes.value.json();
        let aqiData = null;
        if (aqiRes.status === 'fulfilled' && aqiRes.value.ok) {
          try {
            aqiData = await aqiRes.value.json();
          } catch (e) {}
        }

        if (isMounted && weatherData.current) {
          const newData: WeatherData = {
            temperature: Math.round(weatherData.current.temperature_2m),
            apparentTemperature: Math.round(weatherData.current.apparent_temperature),
            weatherCode: weatherData.current.weather_code,
            humidity: weatherData.current.relative_humidity_2m,
            windSpeed: weatherData.current.wind_speed_10m,
            isDay: weatherData.current.is_day === 1,
            uvIndex: weatherData.current.uv_index,
            surfacePressure: weatherData.current.surface_pressure,
            minTemp: weatherData.daily?.temperature_2m_min?.[0] ? Math.round(weatherData.daily.temperature_2m_min[0]) : undefined,
            maxTemp: weatherData.daily?.temperature_2m_max?.[0] ? Math.round(weatherData.daily.temperature_2m_max[0]) : undefined,
            precipitationProb: weatherData.daily?.precipitation_probability_max?.[0],
            aqi: aqiData?.current?.us_aqi ? Math.round(aqiData.current.us_aqi) : undefined,
            lastUpdated: Date.now(),
            hourly: weatherData.hourly,
            daily: weatherData.daily,
          };
          
          setWeather(newData);
          localStorage.setItem(`weather-${selectedZone}`, JSON.stringify(newData));
        }
      } catch (err) {
        console.error("Open-Meteo fetch error:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    (window as any).refreshWeatherFn = () => { fetchWeather(true); };

    fetchWeather();
    const intervalId = setInterval(() => fetchWeather(), 30 * 60 * 1000); // 30 minutes

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      (window as any).refreshWeatherFn = undefined;
    };
  }, [selectedZone, settings.weatherProvider, userCoords]);

  const handleRefresh = () => {
    if ((window as any).refreshWeatherFn) (window as any).refreshWeatherFn();
  };

  if (!isOnline) {
    return (
      <motion.div
        className={cn(
          "flex w-full items-center justify-between bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] rounded-[var(--md-sys-shape-corner-extra-large)] p-3 sm:p-4 lg:p-3 xl:p-4 relative overflow-hidden shrink-0 cursor-default border border-[var(--md-sys-color-error)]/25",
          visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[3px_3px_0px_0px_var(--md-sys-color-on-surface)]",
          visualStyle === 'glass' && "bg-[var(--glass-bg)] backdrop-blur-[8px] border border-[var(--glass-border)]",
          visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border-0"
        )}
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* @ts-ignore */}
        <md-ripple></md-ripple>
        <div className="flex items-center gap-3 sm:gap-4 z-10 w-full pr-2 lg:pr-3 relative">
          <motion.div
            className="w-10 h-10 sm:w-12 sm:h-12 lg:w-11 lg:h-11 xl:w-12 xl:h-12 rounded-[var(--md-sys-shape-corner-large)] flex items-center justify-center shrink-0 bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)]"
            whileHover={{ rotate: 12, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <WifiOff className={cn(
              "w-5 h-5 sm:w-6 sm:h-6",
              visualStyle === 'retro' && "stroke-[3]",
              (visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[1.5]",
              !(visualStyle === 'retro' || visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[2.5]"
            )} />
          </motion.div>

          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-black text-sm sm:text-base lg:text-lg leading-tight text-[var(--md-sys-color-on-error-container)] truncate">
              {t("noInternetConnection")}
            </span>
            <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-widest mt-1 opacity-80 text-[var(--md-sys-color-on-error-container)]/80">
              {t("offlineModeActive")}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isLoading && !weather) return null;
  if (!weather) return null;

  let locationName = currentLocationName || selectedZone;
  if (!currentLocationName) {
    for (const state of JAKIM_ZONES) {
      const zone = state.zones.find(z => z.v === selectedZone);
      if (zone) {
        locationName = zone.l.split(',')[0];
        break;
      }
    }
  }

  const { label, Icon } = getWeatherDetails(weather.weatherCode, weather.isDay, t);

  // Determine background class based on weather code and day/night
  const getWidgetBgClass = () => {
    if (!weather) return "bg-[var(--md-sys-color-surface-container)]";
    if (weather.weatherCode >= 61 && weather.weatherCode <= 67) {
      // Rain
      return weather.isDay 
        ? "bg-gradient-to-br from-blue-300/30 to-[var(--md-sys-color-surface-container)]"
        : "bg-gradient-to-br from-indigo-900/30 to-[var(--md-sys-color-surface-container)]";
    }
    if (weather.weatherCode === 0) {
      // Clear
      return weather.isDay
        ? "bg-gradient-to-br from-amber-200/30 to-[var(--md-sys-color-surface-container)]"
        : "bg-gradient-to-br from-indigo-900/30 to-[var(--md-sys-color-surface-container)]";
    }
    return "bg-[var(--md-sys-color-surface-container)]";
  };

  return (
    <>
    <motion.button
      onClick={() => setIsModalOpen(true)}
      className={cn(
        "flex w-full items-center justify-between text-[var(--md-sys-color-on-surface)] rounded-[var(--md-sys-shape-corner-extra-large)] p-3 sm:p-4 lg:p-3 xl:p-4 relative overflow-hidden shrink-0 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]",
        getWidgetBgClass(),
        visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[3px_3px_0px_0px_var(--md-sys-color-on-surface)]",
        visualStyle === 'glass' && "bg-[var(--glass-bg)] backdrop-blur-[8px] border border-[var(--glass-border)]",
        visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border-0"
      )}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {/* @ts-ignore */}
      <md-ripple></md-ripple>
      <div className="flex items-center gap-3 sm:gap-4 z-10 w-full pr-2 lg:pr-3 relative">
        <motion.div
          className="w-10 h-10 sm:w-12 sm:h-12 lg:w-11 lg:h-11 xl:w-12 xl:h-12 rounded-[var(--md-sys-shape-corner-large)] flex items-center justify-center shrink-0 bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]"
          whileHover={{ rotate: 12, scale: 1.1, backgroundColor: "var(--md-sys-color-primary-container)", color: "var(--md-sys-color-on-primary-container)" }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
        >
          <Icon className={cn(
            "w-5 h-5 sm:w-6 sm:h-6",
            visualStyle === 'retro' && "stroke-[3]",
            (visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[1.5]",
            !(visualStyle === 'retro' || visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[2.5]"
          )} />
        </motion.div>

        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between w-full">
            <span className="font-black text-sm sm:text-base lg:text-lg leading-tight text-[var(--md-sys-color-on-surface)] truncate">
              {label}
            </span>
            <div className="flex items-baseline gap-1.5 ml-2 shrink-0">
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-[var(--md-sys-color-tertiary)] tracking-tight tabular-nums">
                {weather.temperature}°
              </span>
              {weather.minTemp !== undefined &&
                weather.maxTemp !== undefined && (
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[var(--md-sys-color-tertiary)]/80 hidden sm:inline">
                    {weather.minTemp}° – {weather.maxTemp}°
                  </span>
                )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 opacity-80">
            <div
              className="flex items-center gap-1.5 text-[var(--md-sys-color-on-surface-variant)]"
              title={t("humidity" as any)}
            >
              <Droplets className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--md-sys-color-tertiary)] shrink-0 stroke-[3]" />
              <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-widest">
                {weather.humidity}%{" "}
                <span className="hidden sm:inline">
                  {t("humidityShort" as any)}
                </span>
              </span>
            </div>
            {weather.precipitationProb !== undefined && (
              <div
                className="flex items-center gap-1.5 text-[var(--md-sys-color-on-surface-variant)]"
                title={t("rainProb" as any)}
              >
                <Umbrella className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--md-sys-color-tertiary)] shrink-0 stroke-[3]" />
                <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-widest">
                  {weather.precipitationProb}%{" "}
                  <span className="hidden sm:inline">
                    {t("rainShort" as any)}
                  </span>
                </span>
              </div>
            )}
            <div
              className="flex items-center gap-1.5 text-[var(--md-sys-color-on-surface-variant)]"
              title={t("windSpeed" as any)}
            >
              <Wind className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--md-sys-color-tertiary)] shrink-0 stroke-[3]" />
              <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-widest">
                {weather.windSpeed}
                {t("kmh")}{" "}
                <span className="hidden sm:inline">
                  {t("windShort" as any)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.button>

    <FullWeatherModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      weather={weather}
      locationName={locationName}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
    />
    </>
  );
}

export const getWeatherDetails = (code: number, isDay: boolean, t: any) => {
  switch (code) {
    case 0:
      return {
        label: isDay ? t("weatherSunny" as any) : t("weatherClear" as any),
        Icon: isDay ? Sun : Moon,
      };
    case 1:
    case 2:
    case 3:
      return {
        label: t("weatherCloudy" as any),
        Icon: isDay ? CloudSun : CloudMoon,
      };
    case 45:
    case 48:
      return { label: t("weatherFoggy" as any), Icon: CloudFog };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { label: t("weatherDrizzle" as any), Icon: CloudDrizzle };
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      return { label: t("weatherRain" as any), Icon: CloudRain };
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return { label: t("weatherSnow" as any), Icon: Cloud }; 
    case 95:
    case 96:
    case 99:
      return { label: t("weatherThunderstorm" as any), Icon: CloudLightning };
    default:
      return { label: t("weatherUnknown" as any), Icon: Cloud };
  }
};
