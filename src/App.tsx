// @ts-nocheck
import { Button, Spinner } from "@heroui/react";
import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { format, parse, isAfter, addDays, startOfDay } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { Compass } from "lucide-react";
import { ZoneSelector } from "./components/ZoneSelector";
import { ThemeControl } from "./components/ThemeControl";
import { FullScreenToggle } from "./components/FullScreenToggle";
import { ClockPanel } from "./components/ClockPanel";
import { PrayerSchedule } from "./components/PrayerSchedule";

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

import { PrayerData, PrayerKey } from "./types";
import { usePrayerNotifications } from "./hooks/usePrayerNotifications";
import { useLocationTracking } from "./hooks/useLocationTracking";
import { LocationToast } from "./components/LocationToast";
import { AzanAlert } from "./components/AzanAlert";
import { SolatMode } from "./components/SolatMode";
import { SharePanel } from "./components/SharePanel";
import { CalendarRange, Wifi, RefreshCw } from "lucide-react";
import { useAppContext } from "./AppContext";
import { useVisualStyle } from "./hooks/useVisualStyle";
import { cn } from "./lib/utils";
import { StorageManager } from "./lib/StorageManager";
import { OnboardingFlow } from "./components/OnboardingFlow";

// Feature Hooks
import { useTime } from "./hooks/useTime";
import { usePrayerTimes } from "./hooks/usePrayerTimes";
import { useMosqueState } from "./hooks/useMosqueState";
import { useThemeEngine } from "./hooks/useThemeEngine";
import { NotificationPrePrompt } from "./components/NotificationPrePrompt";

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

  // Onboarding Completed State
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return StorageManager.getHasCompletedOnboarding();
  });

  // 1. Time Ticking State
  const currentTime = useTime();

  // 2. Zone Selection State
  const [selectedZone, setSelectedZone] = useState(() => {
    // Shared link query param check: ?zone=PRK02
    const urlParams = new URLSearchParams(window.location.search);
    const urlZone = urlParams.get("zone");
    if (urlZone && urlZone.match(/^[A-Z]{3}\d{2}$/)) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
      return urlZone;
    }
    return StorageManager.getZone() || "";
  });

  // 3. Location Auto Detection & Tracking Hook
  const {
    promptZone,
    promptLocationName,
    autoUpdatedZone,
    autoUpdatedLocationName,
    currentLocationName,
    isDetecting,
    acceptPrompt,
    dismissPrompt,
    userCoords,
  } = useLocationTracking(selectedZone, setSelectedZone, settings.locationMode || 'manual');

  // Track whether a zone change came from auto-detection vs manual selection
  const isAutoZoneChange = useRef(false);

  const handleManualZoneSelect = useCallback((zone: string) => {
    isAutoZoneChange.current = false;
    setSelectedZone(zone);
  }, []);

  // Sync mode triggers
  useEffect(() => {
    if (settings.locationMode === 'auto') {
      isAutoZoneChange.current = true;
    }
  }, [settings.locationMode]);

  useEffect(() => {
    if (!selectedZone) {
      setSelectedZone("SGR01");
      StorageManager.setZone("SGR01");
    } else {
      StorageManager.setZone(selectedZone);
      
      // Update recent zones only for manual selections
      if (!isAutoZoneChange.current) {
        StorageManager.saveRecentZone(selectedZone);
      }
      isAutoZoneChange.current = false;
    }
  }, [selectedZone]);

  // 4. Prayer Schedules Loading & Offline State Hook
  const {
    weekData,
    isLoading,
    showSkeleton,
    error,
    isOfflineModeActive,
    showOnlineSyncToast,
    setShowOnlineSyncToast,
    isSyncing,
    syncStatus,
    triggerSilentSync,
  } = usePrayerTimes(selectedZone, setSelectedZone, settings, updateSettings, t);

  // Find today's and tomorrow's prayer data
  const todayFormatted = format(currentTime, "dd-MMM-yyyy");
  const tomorrowFormatted = format(addDays(currentTime, 1), "dd-MMM-yyyy");

  const todayData = useMemo(() => {
    return weekData.find((d) => d.date === todayFormatted) || weekData[0] || null;
  }, [weekData, todayFormatted]);

  const tomorrowData = useMemo(() => {
    return weekData.find((d) => d.date === tomorrowFormatted) || weekData[1] || null;
  }, [weekData, tomorrowFormatted]);

  // 5. Prayer Notification Trigger Hook
  const {
    preferences,
    togglePreference: rawTogglePreference,
    updatePreference,
    permission,
    requestPermission: rawRequestPermission,
    playSound,
  } = usePrayerNotifications(currentTime, todayData);

  const [showPrePrompt, setShowPrePrompt] = useState(false);
  const pendingPermissionAction = useRef<(() => void) | null>(null);

  const requestPermission = useCallback(async () => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      setShowPrePrompt(true);
      pendingPermissionAction.current = async () => {
        await rawRequestPermission();
      };
    } else {
      await rawRequestPermission();
    }
  }, [rawRequestPermission]);

  const togglePreference = useCallback(async (key: PrayerKey) => {
    if (typeof Notification !== "undefined" && Notification.permission === "default" && !preferences[key].enabled) {
      setShowPrePrompt(true);
      pendingPermissionAction.current = async () => {
        await rawRequestPermission();
        rawTogglePreference(key);
      };
    } else {
      rawTogglePreference(key);
    }
  }, [preferences, rawTogglePreference, rawRequestPermission]);

  const handlePrePromptConfirm = useCallback(async () => {
    setShowPrePrompt(false);
    if (pendingPermissionAction.current) {
      await pendingPermissionAction.current();
      pendingPermissionAction.current = null;
    } else {
      await rawRequestPermission();
    }
  }, [rawRequestPermission]);

  const handlePrePromptClose = useCallback(() => {
    setShowPrePrompt(false);
    pendingPermissionAction.current = null;
  }, []);

  const getAdjustedTime = useCallback((
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
  }, [preferences, settings.mazhab]);

  // 6. Compute Next & Current active prayers
  const computedPrayers = useMemo(() => {
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

      const isFriday = currentTime.getDay() === 5;
      const showJumaat = settings.showJumaat !== false;
      const trackImsak = settings.trackImsak === true;

      const keysToTrack = PRAYER_KEYS.filter(k => trackImsak ? true : k !== "imsak");

      for (const key of keysToTrack) {
        const pTime = getAdjustedTime(todayData, key, currentTime);
        if (isAfter(pTime, currentTime)) {
          nextPrayerKey = key;
          nextPrayerName = (key === "dhuhr" && isFriday && showJumaat) ? t("jumaat" as any) : t(key as any);
          nextPrayerTime = pTime;
          
          prevPrayerKey = lastKey;
          prevPrayerTime = lastP;
          prevPrayerName = lastKey ? ((lastKey === "dhuhr" && isFriday && showJumaat) ? t("jumaat" as any) : t(lastKey as any)) : null;
          
          foundNext = true;
          break;
        }
        lastP = pTime;
        lastKey = key;
      }

      // If no next prayer remains today, grab tomorrow's first tracked prayer
      if (!foundNext && tomorrowData) {
        const firstKey = trackImsak ? "imsak" : "fajr";
        const pTime = getAdjustedTime(
          tomorrowData,
          firstKey,
          addDays(currentTime, 1),
        );
        nextPrayerName = t(firstKey as any);
        nextPrayerTime = pTime;
        nextPrayerKey = firstKey;
        prevPrayerTime = getAdjustedTime(todayData, "isha", currentTime);
        prevPrayerName = t("isha");
        prevPrayerKey = "isha";
      }

      // Fallback
      if (foundNext && !prevPrayerTime && nextPrayerTime) {
        prevPrayerTime = new Date(nextPrayerTime.getTime() - 8 * 3600 * 1000);
        prevPrayerName = t("isha");
        prevPrayerKey = "isha";
      }
    }

    return {
      nextPrayerName,
      nextPrayerTime,
      nextPrayerKey,
      prevPrayerTime,
      prevPrayerName,
      prevPrayerKey,
    };
  }, [todayData, tomorrowData, currentTime, settings.showJumaat, settings.trackImsak, getAdjustedTime, t]);

  const {
    nextPrayerName,
    nextPrayerTime,
    nextPrayerKey,
    prevPrayerTime,
    prevPrayerName,
    prevPrayerKey,
  } = computedPrayers;

  // 7. Mosque Alerts, Countdowns, and Active Displays Hook
  const {
    manuallyDismissedAzanAlert,
    setManuallyDismissedAzanAlert,
    manuallyExitedSolatPrayer,
    setManuallyExitedSolatPrayer,
    mockAzanAlert,
    setMockAzanAlert,
    iqamahPausedState,
    handleIqamahTogglePause,
    handleIqamahAddMinute,
    azanAlertActive,
    azanAlertRemainingSeconds,
    azanAlertPrayerName,
    iqamahCountdownActive,
    iqamahRemainingSeconds,
    iqamahTotalSeconds,
    currentPrayerNameForIqamah,
    solatModeActive,
    solatRemainingSeconds,
    solatTotalSeconds,
    solatPrayerName,
    isSolatDuaStage,
    isMosqueActive,
  } = useMosqueState(
    currentTime,
    prevPrayerKey,
    prevPrayerName,
    prevPrayerTime,
    todayData,
    settings,
    preferences,
    t
  );

  // 8. Custom dynamic theme schema application Hook
  useThemeEngine();
  const activeWallpaperUrl = "";
  const activeDark = false;
  const computedWallpaperDim = 0;

  const [showCalendar, setShowCalendar] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  // Initial flashing prevention
  if (!weekData.length && isLoading && !showSkeleton) {
    return <div className="min-h-[100dvh] bg-background" />;
  }

  // Render Skeleton view while loading
  if (!weekData.length && showSkeleton) {
    return (
      <div className="min-h-[100dvh] lg:h-[100dvh] flex flex-col w-full font-sans text-foreground lg:overflow-hidden relative bg-background">
        <main className="flex-1 w-full max-w-[1920px] mx-auto relative z-10 flex flex-col lg:flex-row px-4 sm:px-6 lg:px-12 py-4 lg:py-8 gap-6 lg:gap-12 lg:overflow-hidden min-h-0">
          <section className="flex flex-col w-full lg:w-[50%] xl:w-[55%] lg:overflow-visible pb-2 lg:pb-0 min-h-0 relative z-20">
            <header className="relative flex items-center gap-3 z-[60] mb-2 flex-wrap shrink-0">
              <div className="w-48 h-12 bg-content2/80 backdrop-blur-md border border-divider shadow-md rounded-2xl animate-pulse"></div>
              <div className="w-32 h-12 bg-content3 rounded-[1.25rem] animate-pulse ml-auto sm:ml-0 hidden sm:block"></div>
              <div className="w-12 h-12 bg-content4 rounded-full animate-pulse ml-auto sm:ml-0"></div>
              <div className="w-12 h-12 bg-content2 rounded-full animate-pulse"></div>
            </header>
            <div className="flex-1 flex flex-col justify-center lg:justify-start xl:justify-center min-h-0 lg:overflow-y-auto no-scrollbar pt-1">
              <div className="flex-1 flex flex-col justify-between h-full">
                <div>
                  <div className="relative w-full mb-4 lg:mb-6 bg-content1/60 backdrop-blur-md border border-divider shadow-sm p-4 sm:p-5 flex flex-col gap-3 shadow-sm animate-pulse h-[110px] lg:h-[130px]"></div>
                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left z-10 w-full mt-4 sm:mt-6 py-1 sm:py-2 pl-2 sm:pl-4 gap-4">
                    <div className="w-64 h-16 sm:h-20 lg:h-24 bg-content3 rounded-2xl animate-pulse"></div>
                    <div className="w-48 h-6 sm:h-8 bg-content4 rounded-xl animate-pulse"></div>
                    <div className="w-36 h-4 sm:h-5 bg-content2 rounded-lg animate-pulse mb-8"></div>
                  </div>
                </div>
                <div className="flex flex-row gap-3 mt-auto w-full shrink-0">
                  <div className="bg-content3 rounded-2xl lg:rounded-3xl flex-1 min-h-[100px] lg:min-h-[120px] animate-pulse"></div>
                  <div className="bg-content2 rounded-2xl lg:rounded-3xl flex-1 min-h-[100px] lg:min-h-[120px] animate-pulse"></div>
                </div>
              </div>
            </div>
          </section>
          <section className="w-full lg:w-[50%] xl:w-[45%] lg:pl-6 xl:pl-8 lg:border-l-4 border-[hsl(var(--heroui-content2))] flex flex-col lg:overflow-hidden min-h-0 relative z-10 pt-4 lg:pt-0">
            <div className="flex-1 overflow-y-auto lg:overflow-hidden pr-2 pb-6 lg:pb-0 no-scrollbar min-h-0 flex flex-col">
              <div className="flex flex-col gap-2 min-h-full lg:flex-1 lg:min-h-0">
                <div className="flex w-full items-center justify-between bg-content1/60 backdrop-blur-md border border-divider shadow-sm p-3 sm:p-4 lg:p-3 xl:p-4 shrink-0 animate-pulse h-[70px] sm:h-[80px]"></div>
                <div className="flex-1 w-full flex flex-col min-h-0 animate-pulse mt-2">
                  <div className="flex justify-between items-center mb-1 lg:mb-2 pl-3 pr-1 shrink-0 h-[40px]">
                    <div className="w-32 h-8 bg-content4 rounded-xl"></div>
                    <div className="w-10 h-10 bg-content4 rounded-[1rem]"></div>
                  </div>
                  <div className="flex px-1 sm:px-2 gap-2 mb-2 lg:mb-3 pt-1 shrink-0">
                    <div className="w-16 h-8 bg-content3 rounded-full"></div>
                    <div className="w-20 h-8 bg-content2 rounded-full"></div>
                    <div className="w-20 h-8 bg-content2 rounded-full"></div>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:gap-2 flex-1 justify-between px-1 sm:px-2 pb-2 lg:pb-0 min-h-0">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="flex-1 min-h-[50px] lg:min-h-[60px] bg-content1/60 backdrop-blur-md border border-divider shadow-sm sm:rounded-2xl w-full"
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

  return (
    <div className={cn(
      "hui-app-container",
      !(settings.wallpaperEnabled && activeWallpaperUrl) && "hui-app-container-no-wallpaper",
      !(settings.wallpaperEnabled && activeWallpaperUrl) && visualStyle === 'glass' && "bg-gradient-to-br from-[hsl(var(--heroui-background))] via-[hsl(var(--heroui-content2))] to-[hsl(var(--heroui-primary)/0.15)]",
      settings.wallpaperEnabled && activeWallpaperUrl && settings.wallpaperTextGlow && "text-glow-boost"
    )}>
      {/* Dynamic Wallpaper Overlay Layer */}
      {settings.wallpaperEnabled && activeWallpaperUrl && (
        <div className="app-wallpaper-layer">
          <img
            src={activeWallpaperUrl}
            alt=""
            className="app-wallpaper-image"
            style={{
              filter: `blur(${settings.wallpaperBlur ?? 2}px)`,
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
                  : 'hsl(var(--heroui-background))',
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
          isOpen={showNotificationSettings && !mockAzanAlert}
          onClose={() => setShowNotificationSettings(false)}
          preferences={preferences}
          onUpdatePreference={updatePreference}
          permission={permission}
          onRequestPermission={requestPermission}
          onTestSound={playSound}
          selectedZone={selectedZone}
          onPreviewAzanAlert={(style) => {
            setMockAzanAlert({
              prayerName: prevPrayerName || t("fajr"),
              style,
              remainingSeconds: settings.azanAlertDuration ?? 20
            });
          }}
        />
      </Suspense>
      
      <AnimatePresence>
        {(azanAlertActive || mockAzanAlert) && (azanAlertPrayerName || mockAzanAlert?.prayerName) && (
          <AzanAlert
            prayerName={mockAzanAlert ? mockAzanAlert.prayerName : azanAlertPrayerName!}
            prayerTime={mockAzanAlert ? new Date() : prevPrayerTime!}
            remainingSeconds={mockAzanAlert ? mockAzanAlert.remainingSeconds : azanAlertRemainingSeconds}
            style={(mockAzanAlert ? mockAzanAlert.style : settings.azanAlertStyle || 'standard') as any}
            onDismiss={() => {
              if (mockAzanAlert) {
                setMockAzanAlert(null);
              } else if (prevPrayerKey) {
                setManuallyDismissedAzanAlert(prevPrayerKey);
              }
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

      <main className="hui-main-content">
        <LocationToast 
          promptZone={promptZone}
          promptLocationName={promptLocationName}
          autoUpdatedZone={autoUpdatedZone}
          autoUpdatedLocationName={autoUpdatedLocationName}
          onAccept={acceptPrompt}
          onDismiss={dismissPrompt}
        />
        {/* Left Panel: Analog/Digital Clocks */}
        <section className="hui-panel-left">
          <header className="hui-header">
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
              <Button isIconOnly variant="ghost" className="rounded-full"
                onClick={() => setShowCalendar(true)}
                title={t("calendarLabel")}
                aria-label={t("calendarLabel")}
                
              >
                <CalendarRange className="w-5 h-5 lg:w-[22px] lg:h-[22px] stroke-[2.5]" />
              </Button>
            </motion.div>
            <ThemeControl />
            <FullScreenToggle />
          </header>

          <div className="hui-clock-container no-scrollbar">
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

        {/* Right Panel: Weather & Prayer Schedules Grid */}
        <section className="hui-panel-right">
          {error && (
            <div className="bg-[var(--app-danger-container, hsl(var(--heroui-danger) / 0.15))] text-[var(--app-danger)] p-4 rounded-4xl mb-6 shrink-0 shadow-sm">
              {error}
            </div>
          )}

          <div className="hui-panel-right-scrollable no-scrollbar">
            <div className="flex flex-col gap-2 min-h-full lg:flex-1 lg:min-h-0">
              <Suspense
                fallback={
                  <div className="h-[100px] sm:h-[130px] flex items-center justify-center bg-content2 rounded-3xl w-full">
                    <Spinner></Spinner>
                  </div>
                }
              >
                <WeatherWidget selectedZone={selectedZone} userCoords={userCoords} currentLocationName={currentLocationName} />
              </Suspense>
              <PrayerSchedule
                todayData={todayData}
                tomorrowData={tomorrowData}
                nextPrayerKey={nextPrayerKey}
                currentPrayerKey={prevPrayerKey}
                preferences={preferences}
                onTogglePreference={togglePreference}
                notificationPermission={permission}
                onRequestPermission={requestPermission}
                onSettingsClick={() => setShowNotificationSettings(true)}
                onShareClick={() => setShowSharePanel(true)}
                currentTime={currentTime}
              />
            </div>
          </div>
        </section>
      </main>

      <SharePanel
        isOpen={showSharePanel}
        onClose={() => setShowSharePanel(false)}
        currentZone={selectedZone}
        currentZoneData={todayData}
      />

      <AnimatePresence>
        {showOnlineSyncToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:max-w-md z-[80] flex items-center justify-between gap-4 p-5 rounded-3xl shadow-xl border cursor-default bg-content3 border-divider shadow-black/30",
              visualStyle === 'retro' && "border-2 border-[var(--app-foreground)] shadow-[4px_4px_0px_0px_var(--app-foreground)]",
              visualStyle === 'glass' && "bg-[hsl(var(--heroui-content1) / 0.7)] backdrop-blur-[12px] border border-[hsl(var(--heroui-divider) / 0.5)]",
              visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border-0"
            )}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-[hsl(var(--heroui-primary)/0.15)] text-primary mt-0.5">
                <Wifi className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-foreground">
                  {syncStatus === 'success' ? t("syncSuccess" as any) : syncStatus === 'error' ? t("syncFailed" as any) : t("backOnline" as any)}
                </span>
                <p className="text-xs text-[var(--app-outline)] mt-0.5 leading-normal">
                  {syncStatus === 'success' 
                    ? (settings.language === "ms" ? "Waktu solat dikemaskini!" : "Prayer times synchronized!") 
                    : syncStatus === 'error'
                    ? (settings.language === "ms" ? "Gagal mengemaskini waktu solat." : "Failed to sync prayer times.")
                    : t("backOnlineToastDesc" as any)}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 shrink-0">
              {syncStatus === 'idle' && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowOnlineSyncToast(false)}
                    className="px-3 py-2 text-xs font-bold rounded-full text-[var(--app-outline)] hover:bg-[hsl(var(--heroui-content2))]/50"
                  >
                    {t("close")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isSyncing}
                    onClick={triggerSilentSync}
                    className="px-4 py-2 text-xs font-bold rounded-full bg-primary text-primary-foreground shadow-sm hover:opacity-95 flex items-center gap-1.5"
                  >
                    {isSyncing && <RefreshCw size={12} className="animate-spin" />}
                    {t("syncNow" as any)}
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <NotificationPrePrompt
        isOpen={showPrePrompt}
        onClose={handlePrePromptClose}
        onConfirm={handlePrePromptConfirm}
        language={settings.language || "ms"}
      />
      {!hasCompletedOnboarding && (
        <OnboardingFlow 
          language={settings.language || "ms"} 
          onComplete={(zone) => {
            setSelectedZone(zone);
            setHasCompletedOnboarding(true);
          }}
        />
      )}
    </div>
  );
}
