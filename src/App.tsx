import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { format, parse, isAfter, addDays, startOfDay } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import "@material/web/button/filled-tonal-button.js";
import { Compass } from "lucide-react";
import { ZoneSelector } from "./components/ZoneSelector";
import { ThemeControl } from "./components/ThemeControl";
import { FullScreenToggle } from "./components/FullScreenToggle";
import { ClockPanel } from "./components/ClockPanel";
import { PrayerSchedule, PRAYER_NAMES } from "./components/PrayerSchedule";
// Lazy-loaded components for better performance
const FullCalendar = lazy(() =>
  import("./components/FullCalendar").then((m) => ({
    default: m.FullCalendar,
  })),
);
const SettingsModal = lazy(() =>
  import("./components/SettingsModal").then((m) => ({
    default: m.SettingsModal,
  })),
);
const WeatherWidget = lazy(() =>
  import("./components/WeatherWidget").then((m) => ({
    default: m.WeatherWidget,
  })),
);
import { PrayerData, JakimResponse, PrayerKey } from "./types";
import { usePrayerNotifications } from "./hooks/usePrayerNotifications";
import { useLocationTracking } from "./hooks/useLocationTracking";
import { LocationToast } from "./components/LocationToast";
import { AzanAlert } from "./components/AzanAlert";
import { SolatMode } from "./components/SolatMode";
import { CalendarDays, CalendarRange } from "lucide-react";
import { useAppContext } from "./AppContext";
import { useVisualStyle } from "./hooks/useVisualStyle";
import { cn } from "./lib/utils";
import { getWallpaperBlob } from "./lib/db";
import { applyThemeFromHex, applyThemeFromImage, PRAYER_COLORS } from "./lib/theme";

const PRAYER_KEYS = [
  "imsak",
  "fajr",
  "syuruk",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
] as const;

export default function App() {
  const { settings, updateSettings, t } = useAppContext();
  const visualStyle = useVisualStyle();

  const [selectedZone, setSelectedZone] = useState(() => {
    return localStorage.getItem("waktu-solat-zone") || "";
  });

  const { promptZone, promptLocationName, autoUpdatedZone, autoUpdatedLocationName, currentLocationName, isDetecting, acceptPrompt, dismissPrompt } = useLocationTracking(
    selectedZone,
    setSelectedZone,
    settings.locationMode || 'manual'
  );

  // Track whether a zone change came from auto-detection vs manual selection
  const isAutoZoneChange = useRef(false);

  // Wrapper around setSelectedZone that tracks the source
  const handleManualZoneSelect = useCallback((zone: string) => {
    isAutoZoneChange.current = false;
    setSelectedZone(zone);
  }, []);

  // When in auto mode, zone changes come from the tracking hook — mark them
  useEffect(() => {
    if (settings.locationMode === 'auto') {
      isAutoZoneChange.current = true;
    }
  }, [settings.locationMode]);

  useEffect(() => {
    if (!selectedZone) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const res = await fetch(
                `/api/geocode?lat=${latitude}&lng=${longitude}`,
              );
              if (!res.ok) throw new Error("Failed to fetch geocode");

              let data;
              try {
                data = await res.json();
              } catch (e) {
                throw new Error("Invalid geocode JSON");
              }

              // API returns { osm: {...}, bdc: {...} } — extract state from nested objects
              const stateName = data?.bdc?.principalSubdivision || data?.bdc?.city || data?.osm?.address?.state || data?.osm?.address?.city || "";
              let foundZone = "SGR01"; // Fallback

              if (stateName) {
                const s = stateName.toLowerCase();
                if (s.includes("johor"))
                  foundZone = "JHR02"; // Johor Bahru
                else if (s.includes("kedah"))
                  foundZone = "KDH01"; // Kota Setar
                else if (s.includes("kelantan"))
                  foundZone = "KTN01"; // Kota Bharu
                else if (s.includes("melaka") || s.includes("malacca"))
                  foundZone = "MLK01";
                else if (s.includes("negeri sembilan"))
                  foundZone = "NGS02"; // Seremban
                else if (s.includes("pahang"))
                  foundZone = "PHG02"; // Kuantan
                else if (s.includes("perak"))
                  foundZone = "PRK02"; // Ipoh
                else if (s.includes("perlis")) foundZone = "PLS01";
                else if (s.includes("pulau pinang") || s.includes("penang"))
                  foundZone = "PNG01";
                else if (s.includes("sabah"))
                  foundZone = "SBH07"; // Kota Kinabalu
                else if (s.includes("sarawak"))
                  foundZone = "SWK08"; // Kuching
                else if (s.includes("selangor"))
                  foundZone = "SGR01"; // Gombak/Petaling
                else if (s.includes("terengganu"))
                  foundZone = "TRG01"; // Kuala Terengganu
                else if (
                  s.includes("kuala lumpur") ||
                  s.includes("putrajaya") ||
                  s.includes("federal territory")
                )
                  foundZone = "WLY01";
                else if (s.includes("labuan")) foundZone = "WLY02";
              }

              setSelectedZone(foundZone);
              localStorage.setItem("waktu-solat-zone", foundZone);
            } catch (err) {
              setSelectedZone("SGR01");
            }
          },
          () => {
            // Geolocation denied or failed
            setSelectedZone("SGR01");
          },
          { timeout: 5000 },
        );
      } else {
        setSelectedZone("SGR01");
      }
    } else {
      localStorage.setItem("waktu-solat-zone", selectedZone);
      
      // Only update recent zones for MANUAL selections (not auto-detected)
      if (!isAutoZoneChange.current) {
        try {
          const recent = JSON.parse(localStorage.getItem("waktu-solat-recent-zones") || "[]");
          if (Array.isArray(recent)) {
            const updated = [selectedZone, ...recent.filter((z: string) => z !== selectedZone)].slice(0, 5);
            localStorage.setItem("waktu-solat-recent-zones", JSON.stringify(updated));
          }
        } catch (e) {
          // ignore
        }
      }
      // Reset the flag after processing
      isAutoZoneChange.current = false;
    }
  }, [selectedZone]);

  const [currentTime, setCurrentTime] = useState(new Date());

  const [weekData, setWeekData] = useState<PrayerData[]>(() => {
    const zone = localStorage.getItem("waktu-solat-zone");
    if (zone) {
      try {
        const cached = localStorage.getItem(`waktu-solat-data-${zone}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(() => {
    const zone = localStorage.getItem("waktu-solat-zone");
    if (!zone) return true;
    const cached = localStorage.getItem(`waktu-solat-data-${zone}`);
    return !cached;
  });
  const [error, setError] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedZone) return;

    localStorage.setItem("waktu-solat-zone", selectedZone);
    let isMounted = true;

    const fetchSolat = () => {
      setIsLoading(true);
      fetch(`/api/solat/${selectedZone}`)
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to load");
          try {
            return await res.json();
          } catch (e) {
            throw new Error("Invalid prayer JSON");
          }
        })
        .then((data: JakimResponse) => {
          if (isMounted) {
            setWeekData(data.prayerTime);
            localStorage.setItem(
              `waktu-solat-data-${selectedZone}`,
              JSON.stringify(data.prayerTime),
            );
            setError(null);
          }
        })
        .catch((err) => {
          console.error(err);
          if (isMounted) {
            setError(t("failedToLoadSolat"));
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    };

    fetchSolat();
    const intervalId = setInterval(fetchSolat, 60 * 60 * 1000); // Refresh every hour

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [selectedZone, t]);

  // Find today's and tomorrow's data
  // JAKIM dates are like '21-Oct-2024'
  const todayFormatted = format(currentTime, "dd-MMM-yyyy");
  const tomorrowFormatted = format(addDays(currentTime, 1), "dd-MMM-yyyy");

  const todayData =
    weekData.find((d) => d.date === todayFormatted) || weekData[0] || null;
  const tomorrowData =
    weekData.find((d) => d.date === tomorrowFormatted) || weekData[1] || null;

  const {
    preferences,
    togglePreference,
    updatePreference,
    permission,
    requestPermission,
    playSound,
  } = usePrayerNotifications(currentTime, todayData);

  const getAdjustedTime = (
    data: PrayerData,
    key: PrayerKey,
    baseDate: Date,
  ) => {
    let pTime = parse(data[key], "HH:mm:ss", startOfDay(baseDate));
    const pref = preferences[key];
    if (pref && pref.offset)
      pTime = new Date(pTime.getTime() + pref.offset * 60000);
    if (key === "asr" && settings.mazhab === "hanafi")
      pTime = new Date(pTime.getTime() + 45 * 60000);
    return pTime;
  };

  // Compute next prayer
  let nextPrayerName: string | null = null;
  let nextPrayerTime: Date | null = null;
  let nextPrayerKey: string | null = null;
  let prevPrayerTime: Date | null = null;
  let prevPrayerName: string | null = null;
  let prevPrayerKey: string | null = null;

  if (todayData) {
    let lastP: Date | null = null;
    let lastKey: (typeof PRAYER_KEYS)[number] | null = null;
    let foundNext = false;

    for (const key of PRAYER_KEYS) {
      const pTime = getAdjustedTime(todayData, key, currentTime);
      if (isAfter(pTime, currentTime)) {
        nextPrayerName = t(key as any);
        nextPrayerTime = pTime;
        nextPrayerKey = key;
        prevPrayerTime = lastP;
        prevPrayerName = lastKey ? t(lastKey as any) : null;
        prevPrayerKey = lastKey;
        foundNext = true;
        break;
      }
      lastP = pTime;
      lastKey = key;
    }

    // If no next prayer today, it must be tomorrow's first prayer (Imsak)
    if (!foundNext && tomorrowData) {
      const pTime = getAdjustedTime(
        tomorrowData,
        "imsak",
        addDays(currentTime, 1),
      );
      nextPrayerName = t("imsak");
      nextPrayerTime = pTime;
      nextPrayerKey = "imsak";
      prevPrayerTime = getAdjustedTime(todayData, "isha", currentTime);
      prevPrayerName = t("isha");
      prevPrayerKey = "isha";
    }

    // Fallback if prevPrayerTime couldn't be determined
    if (foundNext && !prevPrayerTime && nextPrayerTime) {
      prevPrayerTime = new Date(nextPrayerTime.getTime() - 8 * 3600 * 1000);
      prevPrayerName = t("isha");
      prevPrayerKey = "isha";
    }
  }

  // State for tracking manually dismissed alerts and manually exited solat mode
  const [manuallyDismissedAzanAlert, setManuallyDismissedAzanAlert] = useState<string | null>(null);
  const [manuallyExitedSolatPrayer, setManuallyExitedSolatPrayer] = useState<string | null>(null);
  
  // Mosque Mode administrative controls state
  const [iqamahModifier, setIqamahModifier] = useState<Record<string, number>>({});
  const [iqamahPausedState, setIqamahPausedState] = useState<Record<string, { paused: boolean; remainingSecs: number }>>({});

  // Track the last active prayer to reset manual exit/dismiss states when it changes
  const lastActivePrayerRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevPrayerKey && prevPrayerKey !== lastActivePrayerRef.current) {
      setManuallyDismissedAzanAlert(null);
      setManuallyExitedSolatPrayer(null);
      // Reset Mosque mode admin states for the new prayer
      if (prevPrayerKey) {
        setIqamahModifier(prev => ({ ...prev, [prevPrayerKey]: 0 }));
        setIqamahPausedState(prev => ({ ...prev, [prevPrayerKey]: { paused: false, remainingSecs: 0 } }));
      }
      lastActivePrayerRef.current = prevPrayerKey;
    }
  }, [prevPrayerKey]);

  const handleIqamahTogglePause = useCallback(() => {
    if (!prevPrayerKey || !prevPrayerTime) return;
    const isPaused = !!iqamahPausedState[prevPrayerKey]?.paused;
    
    if (isPaused) {
      // Resuming: adjust the modifier so that iqamahEndTime matches the remaining seconds from now
      const remainingSecs = iqamahPausedState[prevPrayerKey]?.remainingSecs || 0;
      const pref = preferences[prevPrayerKey as PrayerKey];
      const baseOffset = pref?.iqamahOffset ?? 0;
      
      const newIqamahEndTime = new Date(Date.now() + remainingSecs * 1000);
      const newModifier = (newIqamahEndTime.getTime() - prevPrayerTime.getTime()) / 60000 - baseOffset;
      
      setIqamahModifier(prev => ({ ...prev, [prevPrayerKey]: newModifier }));
      setIqamahPausedState(prev => ({
        ...prev,
        [prevPrayerKey]: { paused: false, remainingSecs: 0 }
      }));
    } else {
      // Pausing: record current remaining seconds
      const pref = preferences[prevPrayerKey as PrayerKey];
      const activeModifier = iqamahModifier[prevPrayerKey] || 0;
      const iqamahOffsetMinutes = (pref?.iqamahOffset ?? 0) + activeModifier;
      const iqamahEndTime = new Date(prevPrayerTime.getTime() + iqamahOffsetMinutes * 60 * 1000);
      const currentRemaining = Math.max(0, Math.floor((iqamahEndTime.getTime() - Date.now()) / 1000));
      
      setIqamahPausedState(prev => ({
        ...prev,
        [prevPrayerKey]: { paused: true, remainingSecs: currentRemaining }
      }));
    }
  }, [prevPrayerKey, prevPrayerTime, iqamahPausedState, iqamahModifier, preferences]);

  const handleIqamahAddMinute = useCallback(() => {
    if (!prevPrayerKey) return;
    
    // Add 1 minute to the modifier
    setIqamahModifier(prev => ({
      ...prev,
      [prevPrayerKey]: (prev[prevPrayerKey] || 0) + 1
    }));
    
    // If paused, also add 60 seconds to the frozen remaining seconds
    if (iqamahPausedState[prevPrayerKey]?.paused) {
      setIqamahPausedState(prev => ({
        ...prev,
        [prevPrayerKey]: {
          paused: true,
          remainingSecs: (prev[prevPrayerKey]?.remainingSecs || 0) + 60
        }
      }));
    }
  }, [prevPrayerKey, iqamahPausedState]);

  // Compute Active States for Azan Alert, Iqamah Countdown, and Solat Mode
  let azanAlertActive = false;
  let azanAlertRemainingSeconds = 0;
  let azanAlertPrayerName: string | null = null;
  
  let iqamahCountdownActive = false;
  let iqamahRemainingSeconds = 0;
  let iqamahTotalSeconds = 0;
  let currentPrayerNameForIqamah: string | null = null;
  
  let solatModeActive = false;
  let solatRemainingSeconds = 0;
  let solatTotalSeconds = 0;
  let solatPrayerName: string | null = null;
  let isSolatDuaStage = false;

  if (prevPrayerKey && prevPrayerTime && todayData) {
    const validKeys: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    
    if (validKeys.includes(prevPrayerKey as PrayerKey)) {
      const pref = preferences[prevPrayerKey as PrayerKey];
      const activeModifier = iqamahModifier[prevPrayerKey] || 0;
      const iqamahOffsetMinutes = settings.showIqamah ? ((pref?.iqamahOffset ?? 0) + activeModifier) : 0;
      
      const solatDurations = settings.solatModeDuration ?? { fajr: 10, dhuhr: 10, asr: 10, maghrib: 10, isha: 10 };
      const solatDurationMinutes = solatDurations[prevPrayerKey] ?? 10;
      
      const iqamahEndTime = new Date(prevPrayerTime.getTime() + iqamahOffsetMinutes * 60 * 1000);
      const solatEndTime = new Date(iqamahEndTime.getTime() + solatDurationMinutes * 60 * 1000);
      const duaDurationMinutes = settings.solatModeDuaDuration ?? 0;
      const duaEndTime = new Date(solatEndTime.getTime() + duaDurationMinutes * 60 * 1000);
      
      // 1. Azan Alert Active Check
      if (settings.azanAlertStyle && settings.azanAlertStyle !== 'none' && manuallyDismissedAzanAlert !== prevPrayerKey) {
        const alertDurationSeconds = settings.azanAlertDuration ?? 20;
        const alertEndTime = new Date(prevPrayerTime.getTime() + alertDurationSeconds * 1000);
        
        if (currentTime >= prevPrayerTime && currentTime < alertEndTime) {
          azanAlertActive = true;
          azanAlertRemainingSeconds = Math.max(0, Math.floor((alertEndTime.getTime() - currentTime.getTime()) / 1000));
          azanAlertPrayerName = prevPrayerName;
        }
      }
      
      // 2. Iqamah Countdown Active Check (only active if Azan alert is finished or dismissed)
      if (settings.showIqamah && iqamahOffsetMinutes > 0 && !azanAlertActive) {
        const isPaused = !!iqamahPausedState[prevPrayerKey]?.paused;
        const pausedSecs = iqamahPausedState[prevPrayerKey]?.remainingSecs || 0;
        
        if ((currentTime >= prevPrayerTime && currentTime < iqamahEndTime) || (isPaused && pausedSecs > 0)) {
          iqamahCountdownActive = true;
          iqamahTotalSeconds = iqamahOffsetMinutes * 60;
          
          if (isPaused) {
            iqamahRemainingSeconds = pausedSecs;
          } else {
            iqamahRemainingSeconds = Math.max(0, Math.floor((iqamahEndTime.getTime() - currentTime.getTime()) / 1000));
          }
          currentPrayerNameForIqamah = prevPrayerName;
        }
      }
      
      // 3. Solat Mode Active Check (active after iqamahEndTime, only if not manually exited and not paused)
      if (settings.solatModeEnabled && manuallyExitedSolatPrayer !== prevPrayerKey && !iqamahPausedState[prevPrayerKey]?.paused) {
        if (currentTime >= iqamahEndTime && currentTime < duaEndTime) {
          solatModeActive = true;
          const isDua = currentTime >= solatEndTime;
          isSolatDuaStage = isDua;
          
          if (isDua) {
            solatTotalSeconds = duaDurationMinutes * 60;
            solatRemainingSeconds = Math.max(0, Math.floor((duaEndTime.getTime() - currentTime.getTime()) / 1000));
          } else {
            solatTotalSeconds = solatDurationMinutes * 60;
            solatRemainingSeconds = Math.max(0, Math.floor((solatEndTime.getTime() - currentTime.getTime()) / 1000));
          }
          solatPrayerName = prevPrayerName;
        }
      }
    }
  }

  // ----------------------------------------------------
  // premium theme & wallpaper customization engine
  // ----------------------------------------------------
  
  // 1. IndexedDB custom wallpaper loader
  const [dbWallpaperUrl, setDbWallpaperUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (settings.wallpaperEnabled && settings.wallpaperSource === 'upload') {
      getWallpaperBlob().then((blob) => {
        if (blob && active) {
          const url = URL.createObjectURL(blob);
          setDbWallpaperUrl(url);
        }
      });
    } else {
      setDbWallpaperUrl(null);
    }
    return () => {
      active = false;
    };
  }, [settings.wallpaperEnabled, settings.wallpaperSource]);

  // Clean up Object URLs to prevent leaks
  useEffect(() => {
    return () => {
      if (dbWallpaperUrl) {
        URL.revokeObjectURL(dbWallpaperUrl);
      }
    };
  }, [dbWallpaperUrl]);

  const activeWallpaperUrl = useMemo(() => {
    if (!settings.wallpaperEnabled) return null;
    if (settings.wallpaperSource === 'upload') {
      return dbWallpaperUrl;
    }
    return settings.wallpaperUrl || null;
  }, [settings.wallpaperEnabled, settings.wallpaperSource, dbWallpaperUrl, settings.wallpaperUrl]);

  // 2. OS Device Settings Dark Mode Listener
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (settings.darkThemeMode !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [settings.darkThemeMode]);

  // 3. Solar Sunrise / Sunset Dark Mode Engine
  const solarDark = useMemo(() => {
    if (!todayData) return false;
    try {
      const sunriseTime = getAdjustedTime(todayData, "syuruk", currentTime);
      const sunsetTime = getAdjustedTime(todayData, "maghrib", currentTime);
      return isAfter(currentTime, sunsetTime) || !isAfter(currentTime, sunriseTime);
    } catch (e) {
      return false;
    }
  }, [todayData, currentTime]);

  // 4. Resolve Active Dark Mode state
  const activeDark = useMemo(() => {
    if (settings.darkThemeMode === "system") {
      return systemDark;
    } else if (settings.darkThemeMode === "solar") {
      return solarDark;
    } else if (settings.darkThemeMode === "prayer") {
      if (!prevPrayerKey) return false;
      const key = prevPrayerKey.toLowerCase();
      // Fajr (Subuh), Maghrib, Isha, Imsak are dark
      // Syuruk, Dhuhr (Zohor), Asr (Asar) are light
      return ["fajr", "maghrib", "isha", "imsak"].includes(key);
    }
    return !!settings.themeDark;
  }, [settings.darkThemeMode, systemDark, solarDark, settings.themeDark, prevPrayerKey]);

  // 5. Dynamic Prayer-Time Colors calculation
  const activeColor = useMemo(() => {
    if (settings.colorThemeMode === "prayer" && prevPrayerKey) {
      const key = prevPrayerKey.toLowerCase();
      const colorKey = key in PRAYER_COLORS ? key : "fajr";
      return PRAYER_COLORS[colorKey as keyof typeof PRAYER_COLORS] || settings.themeColor || "#006C54";
    }
    return settings.themeColor || "#006C54";
  }, [settings.colorThemeMode, prevPrayerKey, settings.themeColor]);

  // 6. Apply themes dynamically to DOM and Material 3 Tonal Spot scheme generator
  useEffect(() => {
    // A. Apply fonts dynamically
    if (settings.themeFont) {
      document.documentElement.style.setProperty("--app-font-sans", settings.themeFont);
    }
    
    // B. Apply shape scale attributes
    if (settings.themeShape) {
      document.documentElement.setAttribute("data-shape", settings.themeShape);
    }
    
    // C. Apply visual style attributes
    if (settings.visualStyle) {
      document.documentElement.setAttribute("data-style", settings.visualStyle);
    }

    // D. Apply wallpaper active attribute
    document.documentElement.setAttribute(
      "data-wallpaper",
      settings.wallpaperEnabled && activeWallpaperUrl ? "true" : "false"
    );

    // E. Apply font attribute for CSS styling
    if (settings.themeFont) {
      document.documentElement.setAttribute("data-font", settings.themeFont);
    }

    // F. Apply generated colors & contrast
    const variant = settings.themeVariant || "tonal_spot";
    const contrast = settings.themeContrast !== undefined ? settings.themeContrast : 0.0;

    const applyM3Theme = () => {
      if (settings.wallpaperEnabled && activeWallpaperUrl) {
        const img = new Image();
        img.src = activeWallpaperUrl;
        img.crossOrigin = "anonymous";
        img.onload = () => {
          applyThemeFromImage(img, activeDark, variant, contrast).catch(() => {
            applyThemeFromHex(activeColor, activeDark, variant, contrast);
          });
        };
        img.onerror = () => {
          applyThemeFromHex(activeColor, activeDark, variant, contrast);
        };
      } else {
        applyThemeFromHex(activeColor, activeDark, variant, contrast);
      }
    };

    // Smooth material transition wrapper
    document.documentElement.classList.add("theme-transitioning");
    applyM3Theme();
    const timer = setTimeout(() => {
      document.documentElement.classList.remove("theme-transitioning");
    }, 600);

    return () => clearTimeout(timer);
  }, [
    activeColor,
    activeDark,
    settings.themeVariant,
    settings.themeContrast,
    settings.themeFont,
    settings.themeShape,
    settings.visualStyle,
    settings.wallpaperEnabled,
    activeWallpaperUrl
  ]);

  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);

  if (!weekData.length && isLoading) {
    return (
      <div className="min-h-[100dvh] lg:h-[100dvh] flex flex-col w-full font-sans text-[var(--md-sys-color-on-background)] lg:overflow-hidden relative bg-[var(--md-sys-color-background)]">
        <main className="flex-1 w-full max-w-[1920px] mx-auto relative z-10 flex flex-col lg:flex-row px-3 sm:px-6 lg:px-8 xl:px-12 py-2 sm:py-3 lg:py-4 gap-4 sm:gap-6 lg:gap-8 xl:gap-12 lg:overflow-hidden min-h-0">
          {/* Left Side: Skeleton */}
          <section className="flex flex-col w-full lg:w-[50%] xl:w-[55%] lg:overflow-visible pb-2 lg:pb-0 min-h-0 relative z-20">
            <header className="relative flex items-center gap-3 z-[60] mb-2 flex-wrap shrink-0">
              <div className="w-48 h-12 bg-[var(--md-sys-color-surface-container)] rounded-[1.25rem] animate-pulse"></div>
              <div className="w-32 h-12 bg-[var(--md-sys-color-surface-container-high)] rounded-[1.25rem] animate-pulse ml-auto sm:ml-0 hidden sm:block"></div>
              <div className="w-12 h-12 bg-[var(--md-sys-color-surface-container-highest)] rounded-full animate-pulse ml-auto sm:ml-0"></div>
              <div className="w-12 h-12 bg-[var(--md-sys-color-surface-container)] rounded-full animate-pulse"></div>
            </header>

          <div className="flex-1 flex flex-col justify-center lg:justify-start xl:justify-center min-h-0 lg:overflow-y-auto no-scrollbar pt-1">
              <div className="flex-1 flex flex-col justify-between h-full">
                <div>
                  <div className="relative w-full mb-4 lg:mb-6 bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 shadow-sm animate-pulse h-[110px] lg:h-[130px]"></div>

                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left z-10 w-full mt-4 sm:mt-6 py-1 sm:py-2 pl-2 sm:pl-4 gap-4">
                    <div className="w-64 h-16 sm:h-20 lg:h-24 bg-[var(--md-sys-color-surface-container-high)] rounded-2xl animate-pulse"></div>
                    <div className="w-48 h-6 sm:h-8 bg-[var(--md-sys-color-surface-container-highest)] rounded-xl animate-pulse"></div>
                    <div className="w-36 h-4 sm:h-5 bg-[var(--md-sys-color-surface-container)] rounded-lg animate-pulse mb-8"></div>
                  </div>
                </div>

                <div className="flex flex-row gap-3 mt-auto w-full shrink-0">
                  <div className="bg-[var(--md-sys-color-surface-container-high)] rounded-[1.5rem] lg:rounded-[2rem] flex-1 min-h-[100px] lg:min-h-[120px] animate-pulse"></div>
                  <div className="bg-[var(--md-sys-color-surface-container)] rounded-[1.5rem] lg:rounded-[2rem] flex-1 min-h-[100px] lg:min-h-[120px] animate-pulse"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Right Side: Skeleton */}
          <section className="w-full lg:w-[50%] xl:w-[45%] lg:pl-6 xl:pl-8 lg:border-l-4 border-[var(--md-sys-color-surface-variant)] flex flex-col lg:overflow-hidden min-h-0 relative z-10 pt-4 lg:pt-0">
            <div className="flex-1 overflow-y-auto lg:overflow-hidden pr-2 pb-6 lg:pb-0 no-scrollbar min-h-0 flex flex-col">
              <div className="flex flex-col gap-2 min-h-full lg:flex-1 lg:min-h-0">
                <div className="flex w-full items-center justify-between bg-[var(--md-sys-color-surface-container-low)] rounded-[1.5rem] p-3 sm:p-4 lg:p-3 xl:p-4 shrink-0 animate-pulse h-[70px] sm:h-[80px]"></div>

                <div className="flex-1 w-full flex flex-col min-h-0 animate-pulse mt-2">
                  <div className="flex justify-between items-center mb-1 lg:mb-2 pl-3 pr-1 shrink-0 h-[40px]">
                    <div className="w-32 h-8 bg-[var(--md-sys-color-surface-container-highest)] rounded-xl"></div>
                    <div className="w-10 h-10 bg-[var(--md-sys-color-surface-container-highest)] rounded-[1rem]"></div>
                  </div>

                  <div className="flex px-1 sm:px-2 gap-2 mb-2 lg:mb-3 pt-1 shrink-0">
                    <div className="w-16 h-8 bg-[var(--md-sys-color-surface-container-high)] rounded-full"></div>
                    <div className="w-20 h-8 bg-[var(--md-sys-color-surface-container)] rounded-full"></div>
                    <div className="w-20 h-8 bg-[var(--md-sys-color-surface-container)] rounded-full"></div>
                  </div>

                  <div className="flex flex-col gap-1.5 sm:gap-2 flex-1 justify-between px-1 sm:px-2 pb-2 lg:pb-0 min-h-0">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="flex-1 min-h-[50px] lg:min-h-[60px] bg-[var(--md-sys-color-surface-container-low)] rounded-[1.25rem] sm:rounded-[1.5rem] w-full"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // Mosque Auto-Dimming calculation for the wallpaper overlay
  const computedWallpaperDim = useMemo(() => {
    let dim = settings.wallpaperDim ?? 40;
    const isMosqueActive = azanAlertActive || iqamahCountdownActive || solatModeActive;
    if (settings.wallpaperMosqueAutoDim && isMosqueActive) {
      dim = Math.min(95, dim + 25);
    }
    return dim / 100;
  }, [settings.wallpaperDim, settings.wallpaperMosqueAutoDim, azanAlertActive, iqamahCountdownActive, solatModeActive]);

  return (
    <div className={cn(
      "min-h-[100dvh] lg:h-[100dvh] flex flex-col w-full font-sans text-[var(--md-sys-color-on-background)] lg:overflow-hidden relative bg-[var(--md-sys-color-background)]",
      visualStyle === 'glass' && "bg-gradient-to-br from-[var(--md-sys-color-background)] via-[var(--md-sys-color-surface-variant)] to-[var(--md-sys-color-primary-container)]",
      settings.wallpaperEnabled && activeWallpaperUrl && settings.wallpaperTextGlow && "text-glow-boost"
    )}>
      {/* Legible Custom Wallpaper Layer */}
      {settings.wallpaperEnabled && activeWallpaperUrl && (
        <div className="app-wallpaper-layer">
          <img
            src={activeWallpaperUrl}
            alt=""
            className="app-wallpaper-image"
            style={{
              filter: `blur(${settings.wallpaperBlur ?? 10}px)`,
            }}
          />
          {settings.wallpaperVignette && <div className="app-wallpaper-vignette" />}
          <div
            className="app-wallpaper-overlay"
            style={{
              backgroundColor:
                settings.wallpaperOverlayStyle === 'dark'
                  ? '#0f172a'
                  : settings.wallpaperOverlayStyle === 'light'
                  ? '#ffffff'
                  : 'var(--md-sys-color-background)',
              opacity: computedWallpaperDim,
            }}
          />
        </div>
      )}

      <Suspense fallback={null}>
        <FullCalendar
          isOpen={showCalendar}
          initialMonthData={weekData}
          selectedZone={selectedZone}
          onClose={() => setShowCalendar(false)}
        />
        <SettingsModal
          isOpen={showNotificationSettings}
          onClose={() => setShowNotificationSettings(false)}
          preferences={preferences}
          onUpdatePreference={updatePreference}
          permission={permission}
          onRequestPermission={requestPermission}
          onTestSound={playSound}
        />
      </Suspense>
      
      <AnimatePresence>
        {azanAlertActive && azanAlertPrayerName && prevPrayerTime && (
          <AzanAlert
            prayerName={azanAlertPrayerName}
            prayerTime={prevPrayerTime}
            remainingSeconds={azanAlertRemainingSeconds}
            style={settings.azanAlertStyle || 'standard'}
            onDismiss={() => {
              if (prevPrayerKey) setManuallyDismissedAzanAlert(prevPrayerKey);
            }}
          />
        )}
        {solatModeActive && solatPrayerName && (
          <SolatMode
            prayerName={solatPrayerName}
            remainingSeconds={solatRemainingSeconds}
            showClock={settings.solatModeShowClock}
            showQibla={settings.solatModeShowQibla}
            isDuaStage={isSolatDuaStage}
            onExit={() => {
              if (prevPrayerKey) setManuallyExitedSolatPrayer(prevPrayerKey);
            }}
          />
        )}
      </AnimatePresence>

      <main className="flex-1 w-full max-w-[2560px] mx-auto relative z-10 flex flex-col lg:flex-row px-4 sm:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 lg:py-8 gap-8 lg:gap-12 xl:gap-16 lg:overflow-hidden min-h-0">
        <LocationToast 
          promptZone={promptZone}
          promptLocationName={promptLocationName}
          autoUpdatedZone={autoUpdatedZone}
          autoUpdatedLocationName={autoUpdatedLocationName}
          onAccept={acceptPrompt}
          onDismiss={dismissPrompt}
        />
        {/* Left Side: Clock & Hero */}
        <section className="flex flex-col w-full lg:w-[50%] xl:w-[55%] lg:overflow-visible pb-2 lg:pb-0 min-h-0 relative z-20">
            <header className="relative flex items-center gap-3 z-[60] mb-2 flex-wrap shrink-0">
            <ZoneSelector
              selectedZone={selectedZone}
              onZoneSelect={handleManualZoneSelect}
              isAutoDetecting={isDetecting}
              currentLocationName={currentLocationName}
            />
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="ml-auto sm:ml-0 shrink-0 inline-flex w-12 h-12 lg:w-[56px] lg:h-[56px]"
            >
              {/* @ts-ignore */}
              <md-filled-tonal-icon-button
                onClick={() => setShowCalendar(true)}
                title={t("calendarLabel")}
                style={{ '--md-filled-tonal-icon-button-container-shape': '24px', width: '100%', height: '100%' }}
              >
                <CalendarRange className="w-5 h-5 lg:w-[22px] lg:h-[22px] stroke-[2.5]" />
              </md-filled-tonal-icon-button>
            </motion.div>
            <ThemeControl />
            <FullScreenToggle />
          </header>

            <div className="flex-1 flex flex-col justify-center lg:justify-start xl:justify-center min-h-0 lg:overflow-y-auto no-scrollbar pt-1">
            <ClockPanel
              currentTime={currentTime}
              nextPrayerName={nextPrayerName}
              nextPrayerTime={nextPrayerTime}
              prevPrayerTime={prevPrayerTime}
              prevPrayerName={prevPrayerName}
              todayHijri={todayData?.hijri}
              syurukTime={
                todayData?.syuruk ? todayData.syuruk.slice(0, 5) : null
              }
              todayData={todayData}
              onCalendarClick={() => setShowCalendar(true)}
              iqamahCountdownActive={iqamahCountdownActive}
              iqamahRemainingSeconds={iqamahRemainingSeconds}
              iqamahTotalSeconds={iqamahTotalSeconds}
              currentPrayerNameForIqamah={currentPrayerNameForIqamah}
              iqamahPaused={prevPrayerKey ? !!iqamahPausedState[prevPrayerKey]?.paused : false}
              onIqamahTogglePause={handleIqamahTogglePause}
              onIqamahAddMinute={handleIqamahAddMinute}
            />
          </div>
        </section>

        {/* Right Side: Schedule Grid */}
        <section className={cn(
          "w-full lg:w-[50%] xl:w-[45%] lg:pl-6 xl:pl-8 lg:border-l-4 border-[var(--md-sys-color-surface-variant)] flex flex-col lg:overflow-hidden min-h-0 relative z-10",
          visualStyle === 'retro' && "lg:border-l-2 lg:border-[var(--md-sys-color-on-surface)]",
          visualStyle === 'glass' && "lg:border-l lg:border-[var(--glass-border)]",
          visualStyle === 'soft' && "lg:border-l-0"
        )}>
          {error && (
            <div className="bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] p-4 rounded-4xl mb-6 shrink-0 shadow-sm">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto lg:overflow-hidden pr-2 pb-6 lg:pb-0 no-scrollbar min-h-0 flex flex-col">
            <div className="flex flex-col gap-2 min-h-full lg:flex-1 lg:min-h-0">
              <Suspense
                fallback={
                  <div className="h-[200px] bg-[var(--md-sys-color-surface-container)] rounded-3xl animate-pulse w-full"></div>
                }
              >
                <WeatherWidget selectedZone={selectedZone} />
              </Suspense>
              <PrayerSchedule
                todayData={todayData}
                nextPrayerKey={nextPrayerKey}
                currentPrayerKey={prevPrayerKey}
                preferences={preferences}
                onTogglePreference={togglePreference}
                notificationPermission={permission}
                onRequestPermission={requestPermission}
                onSettingsClick={() => setShowNotificationSettings(true)}
                currentTime={currentTime}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
