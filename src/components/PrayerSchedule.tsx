import { PrayerData, PrayerPreference } from "../types";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/iconbutton/filled-tonal-icon-button.js";
import "@material/web/chips/filter-chip.js";
import { ElementType, useState } from "react";
import {
  Moon,
  Sun,
  Sunrise,
  Sunset,
  SunDim,
  SunMedium,
  Bell,
  BellOff,
  BellRing,
  Settings,
  Share2,
} from "lucide-react";
import { useAppContext } from "../AppContext";
import { parse, startOfDay, format } from "date-fns";
import { useVisualStyle } from "../hooks/useVisualStyle";
import { calculateSunnahTimes } from "../lib/sunnah";

export const PRAYER_NAMES: Record<string, string> = {
  imsak: "Imsak",
  fajr: "Subuh",
  syuruk: "Syuruk",
  dhuhr: "Zohor",
  asr: "Asar",
  maghrib: "Maghrib",
  isha: "Isyak",
};

export const PRAYER_ICONS: Record<string, ElementType> = {
  imsak: Moon,
  fajr: Sunrise,
  syuruk: Sun, // Just an alternate sunrise
  dhuhr: SunMedium,
  asr: SunDim,
  maghrib: Sunset,
  isha: Moon,
};

type PrayerKey =
  | "imsak"
  | "fajr"
  | "syuruk"
  | "dhuhr"
  | "asr"
  | "maghrib"
  | "isha"
  | "suhoor"
  | "morningForbidden"
  | "duha"
  | "middayForbidden"
  | "eveningForbidden"
  | "firstThird"
  | "midnight"
  | "tahajjud";

export function PrayerSchedule({
  todayData,
  tomorrowData,
  nextPrayerKey,
  currentPrayerKey,
  preferences,
  onTogglePreference,
  notificationPermission,
  onRequestPermission,
  onSettingsClick,
  onShareClick,
  currentTime,
}: {
  todayData: PrayerData | null;
  tomorrowData?: PrayerData | null;
  nextPrayerKey: string | null;
  currentPrayerKey?: string | null;
  preferences: Record<PrayerKey, PrayerPreference>;
  onTogglePreference: (key: PrayerKey) => void;
  notificationPermission: string;
  onRequestPermission: () => void;
  onSettingsClick: () => void;
  onShareClick: () => void;
  currentTime: Date;
}) {
  const { t, settings } = useAppContext();
  const visualStyle = useVisualStyle();
  const [filter, setFilter] = useState<"all" | "fardu" | "sunnah">("fardu");

  if (!todayData) {
    return (
      <div className="flex-1 w-full flex flex-col min-h-0 animate-pulse mt-2">
        <div className="flex justify-between items-center mb-1 lg:mb-2 pl-3 pr-1 shrink-0 h-[40px]">
          <div className="w-32 h-8 bg-[var(--md-sys-color-surface-variant)]/50 rounded-xl"></div>
          <div className="w-10 h-10 bg-[var(--md-sys-color-surface-variant)]/50 rounded-[1rem]"></div>
        </div>

        <div className="flex px-1 sm:px-2 gap-2 mb-2 lg:mb-3 pt-1 shrink-0">
          <div className="w-16 h-8 bg-[var(--md-sys-color-surface-variant)]/50 rounded-full"></div>
          <div className="w-20 h-8 bg-[var(--md-sys-color-surface-variant)]/30 rounded-full"></div>
          <div className="w-20 h-8 bg-[var(--md-sys-color-surface-variant)]/30 rounded-full"></div>
        </div>

        <div className="flex flex-col gap-1.5 sm:gap-2 flex-1 justify-start px-1 sm:px-2 pb-2 lg:pb-0 min-h-0 overflow-y-auto no-scrollbar">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex-1 min-h-[50px] lg:min-h-[60px] bg-[var(--md-sys-color-surface-container-low)] rounded-[32px] w-full"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  const baseTimes: Record<string, string> = {
    imsak: todayData.imsak,
    fajr: todayData.fajr,
    syuruk: todayData.syuruk,
    dhuhr: todayData.dhuhr,
    asr: todayData.asr,
    maghrib: todayData.maghrib,
    isha: todayData.isha,
  };

  const sunnahCalculated = calculateSunnahTimes(todayData, tomorrowData || null, {
    suhoorOffset: settings.suhoorOffset || 30,
    midnightMethod: settings.midnightMode || 'fajr'
  });

  const mergedData = { ...baseTimes, ...sunnahCalculated };

  let allKeys = [
    ...(settings.trackImsak ? ["imsak" as PrayerKey] : []),
    "fajr",
    "syuruk",
    "dhuhr",
    "asr",
    "maghrib",
    "isha",
  ];

  if (settings.showSunnahTimes && settings.showSunnahTimes.length > 0) {
    allKeys = Array.from(new Set([...allKeys, ...settings.showSunnahTimes] as PrayerKey[]));
    
    // Sort allKeys chronologically based on their calculated time string in mergedData
    allKeys.sort((a, b) => {
      // Handling times crossing midnight can be tricky if we don't know if it's PM or AM for the next day.
      // But standard time format is 24h: HH:mm.
      // For firstThird, midnight, tahajjud they happen after Isha but technically early morning next day or late night.
      // Easiest is to compare by mapping them to minutes relative to today's midnight.
      const getMins = (k: string) => {
        const timeStr = mergedData[k as keyof typeof mergedData] || "00:00";
        const [h, m] = timeStr.split(":").map(Number);
        let mins = h * 60 + m;
        // If the key is a night/Sunnah time that typically falls after Maghrib, and its hours are small (e.g. 0-6), it belongs to tomorrow.
        if (["firstThird", "midnight", "tahajjud"].includes(k) && h < 12) {
          mins += 24 * 60;
        }
        return mins;
      };
      
      return getMins(a) - getMins(b);
    });
  }

  const allTimes: PrayerKey[] = allKeys as PrayerKey[];
  const fardhuTimes: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
  const sunnahTimesFilter: PrayerKey[] = [
    ...(settings.trackImsak ? ["imsak" as PrayerKey] : []),
    "syuruk",
    ...(settings.showSunnahTimes || []) as PrayerKey[]
  ].sort((a, b) => allKeys.indexOf(a) - allKeys.indexOf(b)) as PrayerKey[];

  const timesToDisplay: PrayerKey[] =
    filter === "fardu"
      ? fardhuTimes
      : filter === "sunnah"
        ? sunnahTimesFilter
        : allTimes;

  const hasAnyNotificationEnabled = Object.values(preferences).some(
    (p) => p?.enabled,
  );

  const isFriday = currentTime.getDay() === 5;
  const showJumaat = settings.showJumaat !== false;

  const getPrayerDisplayName = (key: PrayerKey) => {
    if (key === "dhuhr" && isFriday && showJumaat) {
      return t("jumaat");
    }
    return t(key as any);
  };

  const formatTime = (key: PrayerKey) => {
    if (!mergedData[key as keyof typeof mergedData]) return "--:--";
    let pTime = parse(mergedData[key as keyof typeof mergedData], "HH:mm:ss", startOfDay(currentTime));
    // If parsing fails because of HH:mm instead of HH:mm:ss
    if (isNaN(pTime.getTime())) {
      pTime = parse(mergedData[key as keyof typeof mergedData], "HH:mm", startOfDay(currentTime));
    }
    const pref = preferences[key as any];
    if (pref && pref.offset)
      pTime = new Date(pTime.getTime() + pref.offset * 60000);
    if (key === "asr" && settings.mazhab === "hanafi")
      pTime = new Date(pTime.getTime() + 45 * 60000);

    return format(pTime, settings.timeFormat === "12h" ? "hh:mm a" : "HH:mm");
  };

  const formatIqamahTime = (key: PrayerKey, iqamahOffset: number) => {
    if (!mergedData[key as keyof typeof mergedData]) return "--:--";
    let pTime = parse(mergedData[key as keyof typeof mergedData], "HH:mm:ss", startOfDay(currentTime));
    // If parsing fails because of HH:mm instead of HH:mm:ss
    if (isNaN(pTime.getTime())) {
      pTime = parse(mergedData[key as keyof typeof mergedData], "HH:mm", startOfDay(currentTime));
    }
    const pref = preferences[key as any];
    if (pref && pref.offset)
      pTime = new Date(pTime.getTime() + pref.offset * 60000);
    if (key === "asr" && settings.mazhab === "hanafi")
      pTime = new Date(pTime.getTime() + 45 * 60000);

    pTime = new Date(pTime.getTime() + iqamahOffset * 60000);
    return format(pTime, settings.timeFormat === "12h" ? "hh:mm a" : "HH:mm");
  };

  return (
    <div className="flex-1 w-full flex flex-col min-h-0">
      <div className="flex justify-between items-center mb-1 lg:mb-2 pl-3 pr-1 shrink-0">
        <h3 className="md3-headline-small font-black tracking-[-0.04em] text-[var(--md-sys-color-primary)] opacity-90 drop-shadow-sm">
          {t("schedule")}
        </h3>
        <div className="flex items-center gap-1">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex mt-1 w-10 h-10 lg:w-[44px] lg:h-[44px]"
          >
            {/* @ts-ignore */}
            <md-icon-button
              onClick={onShareClick}
              title={t("share" as any) || "Share"}
              style={{ width: '100%', height: '100%' }}
            >
              <Share2 size={18} className={cn(
                visualStyle === 'retro' && "stroke-[3]",
                visualStyle === 'glass' && "stroke-[1.5]",
                visualStyle === 'soft' && "stroke-[1.5]",
                !(visualStyle === 'retro' || visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[2]"
              )} />
            </md-icon-button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex rotate-3 mt-1 w-10 h-10 lg:w-[48px] lg:h-[48px]"
          >
            {/* @ts-ignore */}
            <md-filled-tonal-icon-button
              onClick={onSettingsClick}
              title={t("settings")}
              style={{ '--md-filled-tonal-icon-button-container-shape': '20px', width: '100%', height: '100%' }}
            >
              <Settings size={20} className={cn(
                visualStyle === 'retro' && "stroke-[3]",
                visualStyle === 'glass' && "stroke-[1.5]",
                visualStyle === 'soft' && "stroke-[1.5]",
                !(visualStyle === 'retro' || visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[2.5]"
              )} />
            </md-filled-tonal-icon-button>
          </motion.div>
        </div>
      </div>

      <div className="flex gap-2 mb-2 lg:mb-3 px-2 overflow-x-auto no-scrollbar pt-1 pb-1 shrink-0">
          {(["all", "fardu", "sunnah"] as const).map((f) => {
          const isSelected = filter === f;
          return (
            <motion.div
              key={f}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex shrink-0"
            >
              {/* @ts-ignore */}
              <md-filter-chip
                selected={isSelected ? true : undefined}
                label={
                  f === "all"
                    ? t("filterAll" as any)
                    : f === "fardu"
                      ? t("filterFardu" as any)
                      : t("filterSunat" as any)
                }
                onClick={() => setFilter(f)}
              ></md-filter-chip>
            </motion.div>
          );
        })}
      </div>

      {hasAnyNotificationEnabled && notificationPermission === "denied" && (
        <motion.div
          initial={{ opacity: 0, scaleY: 0.95, y: -8 }}
          animate={{ opacity: 1, scaleY: 1, y: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          style={{ transformOrigin: "top" }}
          className="mb-4 bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] p-5 rounded-[1.5rem] text-sm font-black shadow-sm"
        >
          {t("blockedNotificationsDesc")}
        </motion.div>
      )}

      <div className="flex flex-col gap-1.5 sm:gap-2 flex-1 justify-start px-1 sm:px-2 pb-2 lg:pb-0 min-h-0 overflow-y-auto no-scrollbar">
        {timesToDisplay.map((key, index) => {
          const isNext = key === nextPrayerKey;
          const isCurrent = key === currentPrayerKey;
          const isFardhu = ["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(
            key,
          );
          const timeLabel = formatTime(key);
          const Icon = PRAYER_ICONS[key] || Bell;
          const pref = preferences[key as any] || {
            enabled: false,
            preAlert: 0,
            sound: "default",
            offset: 0,
          };

          let shapeClasses = "rounded-[24px] sm:rounded-[32px]";
          if (isNext) shapeClasses = "rounded-[32px] sm:rounded-[40px]";
          else if (isCurrent)
            shapeClasses = "rounded-[28px] sm:rounded-[36px]";

          return (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
              whileHover={isNext ? { scale: 1.02, y: -2 } : { scale: 1.01, x: 3 }}
              whileTap={{ scale: 0.98 }}
              key={key}
              className={cn(
                "group relative overflow-hidden flex items-center justify-between min-h-0",
                shapeClasses,
                isNext
                  ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-md px-4 py-3 sm:p-5 lg:py-4 lg:px-5 z-20 flex-[1.05] min-h-[64px] lg:min-h-[76px] shrink-0"
                  : isCurrent
                    ? "bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] shadow-sm px-4 py-3 sm:p-4 lg:py-3 lg:px-5 z-10 flex-[1.02] min-h-[60px] lg:min-h-[70px] shrink-0"
                    : isFardhu
                      ? "bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] py-2.5 px-4 sm:p-4 lg:py-3 lg:px-4 shadow-sm flex-1 min-h-[56px] lg:min-h-[64px] shrink-0"
                      : "bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] py-2.5 px-4 sm:p-4 lg:py-2.5 lg:px-4 flex-1 min-h-[56px] lg:min-h-[64px] shrink-0",
                visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[3px_3px_0px_0px_var(--md-sys-color-on-surface)]",
                visualStyle === 'glass' && "backdrop-blur-[8px] border border-[var(--glass-border)]",
                visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border-0"
              )}
            >
              {/* @ts-ignore */}
              <md-ripple></md-ripple>
              {/* @ts-ignore */}
              <md-elevation level={isNext ? "2" : isCurrent ? "1" : "0"}></md-elevation>
              <div className="flex items-center gap-2 sm:gap-3 z-10 h-full pl-0.5 sm:pl-1">
                <motion.div
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                    isNext
                      ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md w-10 h-10 sm:w-12 sm:h-12"
                      : isCurrent
                        ? "bg-[var(--md-sys-color-tertiary)]/20 text-[var(--md-sys-color-on-tertiary-container)] ring-1 ring-[var(--md-sys-color-tertiary)]/20"
                        : isFardhu
                          ? "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-secondary)]"
                          : "bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)]",
                  )}
                  whileHover={{ scale: 1.15, rotate: isNext ? 12 : isCurrent ? -12 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                >
                  <Icon
                    size={isNext || isCurrent ? 18 : 16}
                    className={cn(
                      isNext || isCurrent
                        ? "sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                        : "w-4 h-4 sm:w-[18px] sm:h-[18px]",
                      visualStyle === 'retro' && "stroke-[3]",
                      (visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[1.5]"
                    )}
                    strokeWidth={isNext ? 2.5 : 2}
                  />
                </motion.div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span
                      className={cn(
                        "font-black tracking-tight",
                        isNext
                          ? "text-lg sm:text-xl lg:text-2xl drop-shadow-sm"
                          : isCurrent
                            ? "text-base sm:text-lg lg:text-xl"
                            : "text-sm sm:text-base lg:text-lg",
                        isCurrent &&
                          "text-[var(--md-sys-color-on-tertiary-container)]",
                      )}
                    >
                      {getPrayerDisplayName(key)}
                    </span>
                    {!isFardhu && !isNext && !isCurrent && (
                      <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-[var(--md-sys-color-surface)] text-[10px] font-black uppercase tracking-widest opacity-70">
                        {t("filterSunat" as any)}
                      </span>
                    )}
                  </div>
                  {isNext && (
                    <span className="text-[10px] sm:text-xs lg:text-sm font-black uppercase tracking-[0.15em] opacity-80 mt-0.5 max-w-fit border-b-[2px] border-[var(--md-sys-color-primary)]/20 pb-0.5">
                      {t("nextPrayer")}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-tertiary)] mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--md-sys-color-tertiary)] animate-pulse" />
                      {t("currentPrayer")}
                    </span>
                  )}
                </div>
              </div>

              <div className="z-10 ml-auto flex items-center gap-2 sm:gap-4 pr-1 sm:pr-2">
                <div className="flex flex-col items-end">
                  <span
                    className={cn(
                      "font-black tracking-[-0.04em] tabular-nums whitespace-nowrap",
                      isNext
                        ? "text-xl sm:text-2xl lg:text-3xl text-[var(--md-sys-color-primary)]"
                        : isCurrent
                          ? "text-lg sm:text-xl lg:text-2xl"
                          : "text-base sm:text-lg lg:text-xl",
                      isCurrent &&
                        "text-[var(--md-sys-color-on-tertiary-container)]",
                    )}
                  >
                    {timeLabel}
                  </span>
                  {settings.showIqamah &&
                    isFardhu &&
                    pref.iqamahOffset !== undefined && (
                      <span
                        className={cn(
                          "text-[9px] sm:text-[10px] lg:text-[11px] font-bold uppercase tracking-wider block text-right mt-0.5",
                          isNext
                            ? "text-[var(--md-sys-color-primary)]/70"
                            : isCurrent
                              ? "text-[var(--md-sys-color-on-tertiary-container)]/70"
                              : "text-[var(--md-sys-color-on-surface-variant)]/70",
                        )}
                      >
                        {t("iqamah")}:{" "}
                        {formatIqamahTime(key, pref.iqamahOffset)}
                      </span>
                    )}
                  {pref.preAlert > 0 && pref.enabled && (
                    <span
                      className={cn(
                        "text-[8px] sm:text-[9px] lg:text-[10px] font-bold uppercase tracking-wider opacity-60 block text-right",
                        settings.showIqamah &&
                          isFardhu &&
                          pref.iqamahOffset !== undefined
                          ? "mt-0.5"
                          : "mt-0.5",
                      )}
                    >
                      -{pref.preAlert}
                      {t("minutesShort")} {t("alert")}
                    </span>
                  )}
                </div>

                <md-icon-button
                  onClick={() => onTogglePreference(key as any)}
                  className={cn(
                    "flex items-center justify-center shrink-0",
                    pref.enabled &&
                      "text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]/10",
                  )}
                >
                  {pref.enabled ? (
                    <BellRing size={18} />
                  ) : (
                    <BellOff size={18} className="opacity-40" />
                  )}
                </md-icon-button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
