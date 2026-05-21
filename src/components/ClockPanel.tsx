import { useEffect, useState } from "react";
import { format, differenceInSeconds } from "date-fns";
import { ms, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import "@material/web/elevation/elevation.js";
import "@material/web/ripple/ripple.js";
import { Compass, Sunrise, Moon, Calendar } from "lucide-react";
import { useAppContext } from "../AppContext";
import { getHijriFormatted, HIJRI_MONTHS, HIJRI_MONTHS_EN } from "../lib/holidays";
import { useVisualStyle, getStyleClasses } from "../hooks/useVisualStyle";
import { cn } from "../lib/utils";
import { PrayerData } from "../types";

import { DigitalClock } from "./clocks/DigitalClock";
import { AnalogClock } from "./clocks/AnalogClock";
import { AnaDigiClock } from "./clocks/AnaDigiClock";
import { ChronographClock } from "./clocks/ChronographClock";
import { FlipClock } from "./clocks/FlipClock";
import { WordClock } from "./clocks/WordClock";
import { MinimalistClock } from "./clocks/MinimalistClock";
import { OrbitClock } from "./clocks/OrbitClock";
import { TypographicClock } from "./clocks/TypographicClock";
import { PrayerRingClock } from "./clocks/PrayerRingClock";
import { AbstractClock } from "./clocks/AbstractClock";
import { AnalogNumericClock } from "./clocks/AnalogNumericClock";
import { AnalogRomanClock } from "./clocks/AnalogRomanClock";
import { AnalogArabicClock } from "./clocks/AnalogArabicClock";
import { DashboardClock } from "./clocks/DashboardClock";
import { SwissStationClock } from "./clocks/SwissStationClock";
import { BauhausClock } from "./clocks/BauhausClock";
import { LayeredClock } from "./clocks/LayeredClock";

export function ClockPanel({
  currentTime,
  nextPrayerName,
  nextPrayerTime,
  prevPrayerTime,
  prevPrayerName,
  todayHijri,
  syurukTime,
  todayData,
  onCalendarClick,
}: {
  currentTime: Date;
  nextPrayerName: string | null;
  nextPrayerTime: Date | null;
  prevPrayerTime?: Date | null;
  prevPrayerName?: string | null;
  todayHijri?: string;
  syurukTime?: string | null;
  todayData?: PrayerData | null;
  onCalendarClick?: () => void;
}) {
  const { t, settings } = useAppContext();
  const visualStyle = useVisualStyle();
  const [countdownString, setCountdownString] = useState("");
  const [progress, setProgress] = useState(0);
  const [smoothTime, setSmoothTime] = useState(currentTime);

  useEffect(() => {
    let animationFrameId: number;
    const updateTime = () => {
      setSmoothTime(new Date());
      animationFrameId = requestAnimationFrame(updateTime);
    };
    animationFrameId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    if (!nextPrayerTime) {
      setCountdownString("");
      setProgress(0);
      return;
    }

    const diffInSecs = differenceInSeconds(nextPrayerTime, currentTime);

    if (diffInSecs <= 0) {
      setCountdownString(t("now"));
      setProgress(100);
      return;
    }

    const h = Math.floor(diffInSecs / 3600);
    const m = Math.floor((diffInSecs % 3600) / 60);
    const s = diffInSecs % 60;

    let parts = [];
    if (h > 0) parts.push(`${h}${t("hoursShort")}`);
    if (m > 0 || h > 0) parts.push(`${m}${t("minutesShort")}`);
    parts.push(`${s}${t("secondsShort")}`);

    setCountdownString(parts.join(" "));

    if (prevPrayerTime) {
      const total = nextPrayerTime.getTime() - prevPrayerTime.getTime();
      const current = currentTime.getTime() - prevPrayerTime.getTime();
      setProgress(Math.max(0, Math.min(100, (current / total) * 100)));
    } else {
      setProgress(50);
    }
  }, [currentTime, nextPrayerTime, prevPrayerTime, t]);

  // Parse Hijri date components for symmetric expressive layout
  let hijriDayNum = "";
  let hijriMonthYear = "";
  const hijriLabel = settings.language === "ms" ? "Hijriah" : "Hijri";

  if (todayHijri) {
    const parts = todayHijri.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const mIndex = parseInt(month, 10) - 1;
      if (mIndex >= 0 && mIndex < 12) {
        const monthName = settings.language === "ms" ? HIJRI_MONTHS[mIndex] : HIJRI_MONTHS_EN[mIndex];
        hijriDayNum = String(parseInt(day, 10));
        hijriMonthYear = `${monthName} ${year}H`;
      }
    }
  }

  if (!hijriDayNum && todayHijri) {
    hijriDayNum = "•";
    hijriMonthYear = getHijriFormatted(todayHijri, "text", settings.language);
  }

  return (
    <div className="flex flex-col mt-0 sm:mt-1 w-full flex-1 justify-start gap-1.5 sm:gap-2">
      <div className="flex flex-col w-full">
        <AnimatePresence mode="popLayout">
          {nextPrayerName && (
            <motion.div
              key="next-prayer"
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "relative w-full mb-1.5 lg:mb-2 bg-[var(--md-sys-color-primary-container)] rounded-[24px] p-2.5 sm:p-3 lg:p-3.5 flex flex-col gap-1.5 sm:gap-2",
                visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[6px_6px_0px_0px_var(--md-sys-color-on-surface)]",
                visualStyle === 'glass' && "bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)]",
                visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border border-white/20"
              )}
            >
              {/* @ts-ignore */}
              <md-elevation level="1"></md-elevation>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 relative z-10">
                <div className="flex items-center gap-3 px-1 sm:px-2 w-full sm:w-auto">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--md-sys-color-on-primary)] animate-pulse relative z-10" />
                  </div>
                    <div className="flex flex-col flex-1">
                    <span className="md3-label-small font-bold uppercase tracking-widest text-[var(--md-sys-color-on-primary-container)]/80 mb-0">
                      {t("nextPrayer")}
                    </span>
                    <div className="flex items-baseline gap-2 sm:gap-3">
                      <span className="md3-headline-large font-black text-[var(--md-sys-color-on-primary-container)] tracking-tight leading-none text-lg sm:text-xl lg:text-2xl">
                        {nextPrayerName}
                      </span>
                      {nextPrayerTime && (
                        <span className="text-sm sm:text-base font-bold text-[var(--md-sys-color-on-primary-container)]/60 tracking-tight leading-none">
                          {format(
                            nextPrayerTime,
                            settings.timeFormat === "12h" ? "hh:mm a" : "HH:mm",
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-end w-full sm:w-auto mt-0.5 sm:mt-0 pt-1.5 sm:pt-0 border-t border-[var(--md-sys-color-on-primary-container)]/10 sm:border-0 pl-0 sm:pl-4">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap justify-center sm:justify-end">
                    {prevPrayerName && (
                      <>
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[var(--md-sys-color-primary)] flex items-center gap-1.5 bg-[var(--md-sys-color-primary)]/10 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)] animate-pulse"></span>
                          {t("now")}: {prevPrayerName}
                        </span>
                        <span className="text-[var(--md-sys-color-on-primary-container)]/30 text-xs hidden sm:inline-block">
                          â€¢
                        </span>
                      </>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--md-sys-color-on-primary-container)]/70">
                      {t("timeRemaining")}
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl lg:text-3xl font-sans font-black tracking-tight text-[var(--md-sys-color-primary)] drop-shadow-sm leading-none tabular-nums">
                    {countdownString}
                  </span>
                </div>
              </div>

              {/* Squiggly Progress bar */}
              <div className="px-1 sm:px-2 w-full mt-0.5">
                <div className="w-full h-2.5 lg:h-3 bg-[var(--md-sys-color-on-primary-container)]/10 text-[var(--md-sys-color-primary)] rounded-full relative flex items-center">
                  <div
                    className="absolute inset-y-0 left-0 bg-current transition-all duration-1000 ease-linear animate-squiggle"
                    style={{
                      width: `${progress}%`,
                      maskImage: `url("data:image/svg+xml,%3Csvg width='40' height='16' viewBox='0 0 40 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 0 8 Q 10 2 20 8 T 40 8' fill='none' stroke='black' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      maskRepeat: "repeat-x",
                      WebkitMaskImage: `url("data:image/svg+xml,%3Csvg width='40' height='16' viewBox='0 0 40 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 0 8 Q 10 2 20 8 T 40 8' fill='none' stroke='black' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      WebkitMaskRepeat: "repeat-x",
                    }}
                  />
                  {/* End ball */}
                  <div
                    className="absolute h-2.5 w-2.5 lg:h-3 lg:w-3 bg-current rounded-full transition-all duration-1000 ease-linear shadow-sm"
                    style={{ left: `calc(${progress}% - 6px)` }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Clock Face Container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={settings.clockFace || 'digital'}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full flex items-center justify-center mt-1 mb-1"
          >
            {(!settings.clockFace || settings.clockFace === 'digital') && (
              <DigitalClock />
            )}
            {settings.clockFace === 'analog' && (
              <AnalogClock movement={settings.clockMovement || 'sweep'} />
            )}
            {settings.clockFace === 'analog-numeric' && (
              <AnalogNumericClock movement={settings.clockMovement || 'sweep'} />
            )}
            {settings.clockFace === 'analog-roman' && (
              <AnalogRomanClock movement={settings.clockMovement || 'sweep'} />
            )}
            {settings.clockFace === 'analog-arabic' && (
              <AnalogArabicClock movement={settings.clockMovement || 'sweep'} />
            )}
            {settings.clockFace === 'dashboard' && (
              <DashboardClock movement={settings.clockMovement || 'sweep'} />
            )}
            {settings.clockFace === 'abstract' && (
              <AbstractClock movement={settings.clockMovement || 'sweep'} />
            )}
            {settings.clockFace === 'anadigi' && (
              <AnaDigiClock movement={settings.clockMovement || 'sweep'} />
            )}
            {settings.clockFace === 'chronograph' && (
              <ChronographClock 
                movement={settings.clockMovement || 'sweep'}
                nextPrayerName={nextPrayerName}
                nextPrayerTime={nextPrayerTime}
                prevPrayerTime={prevPrayerTime}
                todayHijri={todayHijri}
              />
            )}
            {settings.clockFace === 'flip' && <FlipClock />}
            {settings.clockFace === 'word' && <WordClock />}
            {settings.clockFace === 'minimal' && <MinimalistClock movement={settings.clockMovement || 'sweep'} />}
            {settings.clockFace === 'orbit' && <OrbitClock movement={settings.clockMovement || 'sweep'} />}
            {settings.clockFace === 'typographic' && <TypographicClock />}
            {settings.clockFace === 'prayer-ring' && <PrayerRingClock movement={settings.clockMovement || 'sweep'} todayData={todayData} />}
            {settings.clockFace === 'swiss-station' && <SwissStationClock movement={settings.clockMovement || 'sweep'} />}
            {settings.clockFace === 'bauhaus' && <BauhausClock movement={settings.clockMovement || 'sweep'} />}
            {settings.clockFace === 'layered' && <LayeredClock movement={settings.clockMovement || 'sweep'} />}
          </motion.div>
        </AnimatePresence>

        {/* Date & Hijri - Way Material 3 Expressive Row */}
        <div className="flex flex-col items-center w-full mt-1 sm:mt-1.5 mb-0.5 lg:mb-1 z-10">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4 w-full">
            {/* Gregorian Date Card */}
            <motion.div
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCalendarClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCalendarClick?.(); } }}
              className={cn(
                "relative overflow-hidden flex items-center gap-2 sm:gap-3 lg:gap-4 p-2.5 sm:p-3 lg:p-3.5 xl:p-4 transition-all duration-500 ease-out cursor-pointer select-none group",
                "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] rounded-tl-[32px] rounded-tr-[10px] rounded-br-[32px] rounded-bl-[10px] sm:rounded-tl-[40px] sm:rounded-tr-[12px] sm:rounded-br-[40px] sm:rounded-bl-[12px]",
                visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[4px_4px_0px_0px_var(--md-sys-color-on-surface)] rounded-none",
                visualStyle === 'glass' && "bg-[var(--glass-bg)]/40 backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] text-[var(--md-sys-color-on-surface)]",
                visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border border-white/20 bg-[var(--md-sys-color-primary-container)]"
              )}
            >
              {/* @ts-ignore */}
              <md-elevation level="1"></md-elevation>
              {/* @ts-ignore */}
              <md-ripple></md-ripple>

              {/* Dynamic Calendar Watermark */}
              <Calendar className={cn(
                "absolute -right-3 -bottom-3 w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 opacity-[0.06] pointer-events-none transition-all duration-700 ease-out group-hover:rotate-12 group-hover:scale-125 group-hover:opacity-[0.12]",
                "text-[var(--md-sys-color-primary)]",
                visualStyle === 'retro' && "text-[var(--md-sys-color-on-surface)] opacity-10",
                visualStyle === 'glass' && "text-[var(--md-sys-color-on-surface)] opacity-10",
                visualStyle === 'soft' && "text-[var(--md-sys-color-primary)] opacity-[0.08]"
              )} />

              {/* Gregorian Day Number */}
              <span className={cn(
                "text-3.5xl sm:text-4.5xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black font-sans leading-none tracking-tighter select-none shrink-0 tabular-nums z-10 transition-colors duration-300",
                "text-[var(--md-sys-color-primary)]",
                visualStyle === 'retro' && "text-[var(--md-sys-color-on-surface)]",
                visualStyle === 'glass' && "text-[var(--md-sys-color-on-surface)]",
                visualStyle === 'soft' && "text-[var(--md-sys-color-primary)]"
              )}>
                {format(currentTime, "d")}
              </span>

              {/* Month, Year, Day details */}
              <div className="flex flex-col min-w-0 gap-0.5 z-10">
                <span className="text-[13px] sm:text-[15px] lg:text-[17px] xl:text-xl 2xl:text-2.5xl font-black leading-tight tracking-tight truncate">
                  {format(currentTime, "MMMM yyyy", {
                    locale: settings.language === "ms" ? ms : enUS,
                  })}
                </span>
                <span className={cn(
                  "text-[10px] sm:text-xs lg:text-[13px] xl:text-sm 2xl:text-[17px] font-extrabold uppercase tracking-widest leading-none opacity-80 truncate",
                  visualStyle === 'retro' && "opacity-95"
                )}>
                  {format(currentTime, "EEEE", {
                    locale: settings.language === "ms" ? ms : enUS,
                  })}
                </span>
              </div>
            </motion.div>

            {/* Hijri Date Card */}
            <motion.div
              whileHover={{ scale: 1.03, y: -3 }}
              className={cn(
                "relative overflow-hidden flex items-center gap-2 sm:gap-3 lg:gap-4 p-2.5 sm:p-3 lg:p-3.5 xl:p-4 transition-all duration-500 ease-out select-none group",
                "bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] rounded-tl-[10px] rounded-tr-[32px] rounded-br-[10px] rounded-bl-[32px] sm:rounded-tl-[12px] sm:rounded-tr-[40px] sm:rounded-br-[12px] sm:rounded-bl-[40px]",
                visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[4px_4px_0px_0px_var(--md-sys-color-on-surface)] rounded-none text-[var(--md-sys-color-on-surface)]",
                visualStyle === 'glass' && "bg-[var(--glass-bg)]/40 backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] text-[var(--md-sys-color-on-surface)]",
                visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border border-white/20 bg-[var(--md-sys-color-tertiary-container)]"
              )}
            >
              {/* @ts-ignore */}
              <md-elevation level="1"></md-elevation>

              {/* Dynamic Moon Watermark */}
              <Moon className={cn(
                "absolute -right-3 -bottom-3 w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 opacity-[0.06] pointer-events-none transition-all duration-700 ease-out group-hover:-rotate-12 group-hover:scale-125 group-hover:opacity-[0.12]",
                "text-[var(--md-sys-color-tertiary)]",
                visualStyle === 'retro' && "text-[var(--md-sys-color-on-surface)] opacity-10",
                visualStyle === 'glass' && "text-[var(--md-sys-color-on-surface)] opacity-10",
                visualStyle === 'soft' && "text-[var(--md-sys-color-tertiary)] opacity-[0.08]"
              )} />

              {/* Hijri Day Number */}
              <span className={cn(
                "text-3.5xl sm:text-4.5xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black font-sans leading-none tracking-tighter select-none shrink-0 tabular-nums z-10 transition-colors duration-300",
                "text-[var(--md-sys-color-tertiary)]",
                visualStyle === 'retro' && "text-[var(--md-sys-color-on-surface)]",
                visualStyle === 'glass' && "text-[var(--md-sys-color-on-surface)]",
                visualStyle === 'soft' && "text-[var(--md-sys-color-tertiary)]"
              )}>
                {hijriDayNum || "•"}
              </span>

              {/* Hijri details */}
              <div className="flex flex-col min-w-0 gap-0.5 z-10">
                <span className="text-[13px] sm:text-[15px] lg:text-[17px] xl:text-xl 2xl:text-2.5xl font-black leading-tight tracking-tight truncate">
                  {hijriMonthYear || "..."}
                </span>
                <span className={cn(
                  "text-[10px] sm:text-xs lg:text-[13px] xl:text-sm 2xl:text-[17px] font-extrabold uppercase tracking-widest leading-none opacity-80 truncate",
                  visualStyle === 'retro' && "opacity-95"
                )}>
                  {hijriLabel}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <div className="flex flex-row gap-2 lg:gap-3 mt-auto w-full shrink-0">
        <motion.div
          whileHover={{ scale: 1.02, rotate: -1, y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] p-2 sm:p-2.5 rounded-[var(--md-sys-shape-corner-extra-large)] flex-1 relative overflow-hidden cursor-default min-h-[56px] sm:min-h-[64px] lg:min-h-[68px] flex flex-col justify-between",
            visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[4px_4px_0px_0px_var(--md-sys-color-on-surface)]",
            visualStyle === 'glass' && "bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)]",
            visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)]"
          )}
        >
          {/* @ts-ignore */}
          <md-ripple></md-ripple>
          <motion.div
            className="absolute -right-2 -bottom-2 w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-[var(--md-sys-color-tertiary)]/10 pointer-events-none"
            whileHover={{ rotate: -12, opacity: 0.2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Compass className="w-full h-full" />
          </motion.div>

          <div className="relative z-10 flex flex-col h-full justify-between gap-1">
            <h3 className="md3-label-small text-[var(--md-sys-color-on-tertiary-container)]/80 font-black uppercase tracking-widest">
              {t("qibla")}
            </h3>
            <div>
              <p className="text-lg sm:text-xl lg:text-2xl font-black font-mono tracking-tighter leading-none">
                292.41°
              </p>
              <p className="text-[9px] sm:text-[10px] opacity-80 font-bold mt-1 tracking-wide">
                {t("fromTrueNorth")}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, rotate: 1, y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] p-2 sm:p-2.5 rounded-[var(--md-sys-shape-corner-extra-large)] flex-1 relative overflow-hidden cursor-default min-h-[56px] sm:min-h-[64px] lg:min-h-[68px] flex flex-col justify-between",
            visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[4px_4px_0px_0px_var(--md-sys-color-on-surface)]",
            visualStyle === 'glass' && "bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)]",
            visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)]"
          )}
        >
          {/* @ts-ignore */}
          <md-ripple></md-ripple>
          <motion.div
            className="absolute -right-2 -bottom-2 w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-[var(--md-sys-color-secondary)]/10 pointer-events-none"
            whileHover={{ rotate: 12, opacity: 0.2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Sunrise className="w-full h-full" />
          </motion.div>

          <div className="relative z-10 flex flex-col h-full justify-between gap-1">
            <h3 className="md3-label-small text-[var(--md-sys-color-on-secondary-container)]/80 font-black uppercase tracking-widest">
              {t("sunrise")}
            </h3>
            <div>
              <p className="text-lg sm:text-xl lg:text-2xl font-black font-mono tracking-tighter leading-none">
                {syurukTime || "--:--"}
              </p>
              <p className="text-[9px] sm:text-[10px] opacity-80 font-bold mt-1 tracking-wide">
                {t("dailySunrise")}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
