import { useEffect, useState, useRef, useMemo } from "react";
import { format, differenceInSeconds } from "date-fns";
import { ms, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import "@material/web/elevation/elevation.js";
import "@material/web/ripple/ripple.js";
import { Compass, Sunrise, Moon, Calendar, Play, Pause, Plus } from "lucide-react";
import { useAppContext } from "../AppContext";
import { getHijriFormatted, HIJRI_MONTHS, HIJRI_MONTHS_EN } from "../lib/holidays";
import { useVisualStyle, useThemeShape, getStyleClasses } from "../hooks/useVisualStyle";
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

function playSynthesizedSound(type: 'chime' | 'tick', pitchHz?: number) {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'tick') {
      // Clean tick: high frequency, extremely short decay
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } else {
      // Chime: pure sine with pleasant harmonic decay
      osc.type = 'triangle';
      const freq = pitchHz || 587.33; // D5 default
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.7);
    }
  } catch (e) {
    // Ignore context errors
  }
}

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
  iqamahCountdownActive = false,
  iqamahRemainingSeconds = 0,
  iqamahTotalSeconds = 0,
  currentPrayerNameForIqamah = null,
  iqamahPaused = false,
  onIqamahTogglePause,
  onIqamahAddMinute,
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
  iqamahCountdownActive?: boolean;
  iqamahRemainingSeconds?: number;
  iqamahTotalSeconds?: number;
  currentPrayerNameForIqamah?: string | null;
  iqamahPaused?: boolean;
  onIqamahTogglePause?: () => void;
  onIqamahAddMinute?: () => void;
}) {
  const { t, settings } = useAppContext();
  const visualStyle = useVisualStyle();
  const themeShape = useThemeShape();

  const gregorianCardStyle = useMemo(() => {
    if (visualStyle === 'retro') return { borderRadius: '0px' };
    return {
      borderTopLeftRadius: 'var(--md-sys-shape-corner-extra-large)',
      borderBottomRightRadius: 'var(--md-sys-shape-corner-extra-large)',
      borderTopRightRadius: 'var(--md-sys-shape-corner-medium)',
      borderBottomLeftRadius: 'var(--md-sys-shape-corner-medium)',
    };
  }, [visualStyle]);

  const hijriCardStyle = useMemo(() => {
    if (visualStyle === 'retro') return { borderRadius: '0px' };
    return {
      borderTopRightRadius: 'var(--md-sys-shape-corner-extra-large)',
      borderBottomLeftRadius: 'var(--md-sys-shape-corner-extra-large)',
      borderTopLeftRadius: 'var(--md-sys-shape-corner-medium)',
      borderBottomRightRadius: 'var(--md-sys-shape-corner-medium)',
    };
  }, [visualStyle]);

  const [countdownString, setCountdownString] = useState("");
  const [progress, setProgress] = useState(0);

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

  const lastPlayedSecondRef = useRef<number>(-1);

  useEffect(() => {
    if (
      iqamahCountdownActive && 
      iqamahRemainingSeconds >= 0 && 
      iqamahRemainingSeconds <= 10 && 
      iqamahRemainingSeconds !== lastPlayedSecondRef.current &&
      settings.iqamahCountdownSound &&
      settings.iqamahCountdownSound !== 'none'
    ) {
      lastPlayedSecondRef.current = iqamahRemainingSeconds;
      
      const soundType = settings.iqamahCountdownSound;
      if (soundType === 'chime') {
        // Steady, uniform professional beep (800Hz)
        playSynthesizedSound('chime', 800);
      } else if (soundType === 'tick') {
        playSynthesizedSound('tick');
      }
    }
    
    if (!iqamahCountdownActive) {
      lastPlayedSecondRef.current = -1;
    }
  }, [iqamahCountdownActive, iqamahRemainingSeconds, settings.iqamahCountdownSound]);

  // Parse Hijri date components for symmetric expressive layout
  let hijriDayNum = "";
  let hijriMonthYear = "";
  let hijriLabel = settings.language === "ms" ? "Hijriah" : "Hijri";

  if (todayHijri) {
    const parts = todayHijri.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const mIndex = parseInt(month, 10) - 1;
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);

      hijriDayNum = String(dayNum);

      if (settings.hijriFormat === "number") {
        // Numeric mode
        hijriMonthYear = `${monthNum} / ${year}H`;
      } else {
        // Text mode or both mode
        if (mIndex >= 0 && mIndex < 12) {
          const monthName = settings.language === "ms" ? HIJRI_MONTHS[mIndex] : HIJRI_MONTHS_EN[mIndex];
          hijriMonthYear = `${monthName} ${year}H`;
        } else {
          hijriMonthYear = `${monthNum} / ${year}H`;
        }
      }

      if (!settings.hijriFormat || settings.hijriFormat === "both") {
        // Both mode: add numeric date to subtitle label
        hijriLabel = `${settings.language === "ms" ? "Hijriah" : "Hijri"} • ${dayNum}/${monthNum}/${year}H`;
      }
    }
  }

  if (!hijriDayNum && todayHijri) {
    hijriDayNum = "•";
    hijriMonthYear = getHijriFormatted(todayHijri, settings.hijriFormat || "both", settings.language);
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
        <div className="flex flex-col items-center w-full mt-1.5 sm:mt-2 mb-0.5 lg:mb-1 z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3.5 sm:gap-4 w-full">
            {/* Gregorian Date Card */}
            <motion.div
              style={gregorianCardStyle}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCalendarClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCalendarClick?.(); } }}
              className={cn(
                "relative overflow-hidden flex items-center gap-2.5 sm:gap-2 md:gap-3 lg:gap-2 xl:gap-4 p-3 sm:p-2.5 md:p-3.5 lg:p-2.5 xl:p-4 transition-all duration-500 ease-out cursor-pointer select-none group",
                "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]",
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
                "absolute -right-3 -bottom-3 w-12 h-12 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-10 lg:h-10 xl:w-16 xl:h-16 opacity-[0.04] pointer-events-none transition-all duration-700 ease-out group-hover:rotate-12 group-hover:scale-125 group-hover:opacity-[0.08]",
                "text-[var(--md-sys-color-primary)]",
                visualStyle === 'retro' && "text-[var(--md-sys-color-on-surface)] opacity-5",
                visualStyle === 'glass' && "text-[var(--md-sys-color-on-surface)] opacity-5",
                visualStyle === 'soft' && "text-[var(--md-sys-color-primary)] opacity-[0.05]"
              )} />

              {/* Gregorian Day Number */}
              <span className={cn(
                "text-3.5xl sm:text-2.5xl md:text-3.5xl lg:text-3.5xl xl:text-4xl 2xl:text-4.5xl font-black font-sans leading-none tracking-tighter select-none shrink-0 tabular-nums z-10 transition-colors duration-300",
                "text-[var(--md-sys-color-primary)]",
                visualStyle === 'retro' && "text-[var(--md-sys-color-on-surface)]",
                visualStyle === 'glass' && "text-[var(--md-sys-color-on-surface)]",
                visualStyle === 'soft' && "text-[var(--md-sys-color-primary)]"
              )}>
                {format(currentTime, "d")}
              </span>

              {/* Month, Year, Day details */}
              <div className="flex flex-col min-w-0 gap-0.5 z-10">
                <span className="text-base sm:text-xs md:text-sm lg:text-base xl:text-sm 2xl:text-base font-black leading-tight tracking-tight truncate">
                  {format(currentTime, "MMMM yyyy", {
                    locale: settings.language === "ms" ? ms : enUS,
                  })}
                </span>
                <span className={cn(
                  "text-xs sm:text-[9px] md:text-[10px] lg:text-xs xl:text-[10px] 2xl:text-xs font-extrabold uppercase tracking-widest leading-none opacity-80 truncate",
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
              style={hijriCardStyle}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative overflow-hidden flex items-center gap-2.5 sm:gap-2 md:gap-3 lg:gap-2 xl:gap-4 p-3 sm:p-2.5 md:p-3.5 lg:p-2.5 xl:p-4 transition-all duration-500 ease-out select-none group",
                "bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]",
                visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[4px_4px_0px_0px_var(--md-sys-color-on-surface)] rounded-none text-[var(--md-sys-color-on-surface)]",
                visualStyle === 'glass' && "bg-[var(--glass-bg)]/40 backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] text-[var(--md-sys-color-on-surface)]",
                visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border border-white/20 bg-[var(--md-sys-color-tertiary-container)]"
              )}
            >
              {/* @ts-ignore */}
              <md-elevation level="1"></md-elevation>
              {/* @ts-ignore */}
              <md-ripple></md-ripple>

              {/* Dynamic Moon Watermark */}
              <Moon className={cn(
                "absolute -right-3 -bottom-3 w-12 h-12 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-10 lg:h-10 xl:w-16 xl:h-16 opacity-[0.04] pointer-events-none transition-all duration-700 ease-out group-hover:-rotate-12 group-hover:scale-125 group-hover:opacity-[0.08]",
                "text-[var(--md-sys-color-tertiary)]",
                visualStyle === 'retro' && "text-[var(--md-sys-color-on-surface)] opacity-5",
                visualStyle === 'glass' && "text-[var(--md-sys-color-on-surface)] opacity-5",
                visualStyle === 'soft' && "text-[var(--md-sys-color-tertiary)] opacity-[0.05]"
              )} />

              {/* Hijri Day Number */}
              <span className={cn(
                "text-3.5xl sm:text-2.5xl md:text-3.5xl lg:text-3.5xl xl:text-4xl 2xl:text-4.5xl font-black font-sans leading-none tracking-tighter select-none shrink-0 tabular-nums z-10 transition-colors duration-300",
                "text-[var(--md-sys-color-tertiary)]",
                visualStyle === 'retro' && "text-[var(--md-sys-color-on-surface)]",
                visualStyle === 'glass' && "text-[var(--md-sys-color-on-surface)]",
                visualStyle === 'soft' && "text-[var(--md-sys-color-tertiary)]"
              )}>
                {hijriDayNum || "•"}
              </span>

              {/* Hijri details */}
              <div className="flex flex-col min-w-0 gap-0.5 z-10">
                <span className="text-base sm:text-xs md:text-sm lg:text-base xl:text-sm 2xl:text-base font-black leading-tight tracking-tight truncate">
                  {hijriMonthYear || "..."}
                </span>
                <span className={cn(
                  "text-xs sm:text-[9px] md:text-[10px] lg:text-xs xl:text-[10px] 2xl:text-xs font-extrabold uppercase tracking-widest leading-none opacity-80 truncate",
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
        <AnimatePresence mode="wait">
          {!iqamahCountdownActive ? (
            <motion.div
              key="qibla-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.02, rotate: -1, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] p-2 sm:p-2.5 rounded-[var(--md-sys-shape-corner-extra-large)] flex-1 relative overflow-hidden cursor-default min-h-[56px] sm:min-h-[64px] lg:min-h-[68px] flex flex-col justify-between",
                visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[4px_4px_0px_0px_var(--md-sys-color-on-surface)] rounded-none",
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
          ) : (
            <motion.div
              key="iqamah-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "p-2 sm:p-2.5 rounded-[var(--md-sys-shape-corner-extra-large)] flex-1 relative overflow-hidden min-h-[56px] sm:min-h-[64px] lg:min-h-[68px] flex flex-col justify-between select-none transition-all duration-300 group cursor-default",
                iqamahRemainingSeconds <= 10 
                  ? "bg-red-600 text-white border-2 border-red-700 shadow-[0_0_20px_rgba(220,38,38,0.7)] animate-pulse" 
                  : iqamahRemainingSeconds <= 30
                    ? "bg-amber-500 text-white border-2 border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                    : "bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] border border-[var(--md-sys-color-error)]/30",
                visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[4px_4px_0px_0px_var(--md-sys-color-on-surface)] rounded-none",
                visualStyle === 'glass' && "bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] text-[var(--md-sys-color-on-surface)]",
                visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border border-white/20"
              )}
            >
              {/* Progress Bar background overlay */}
              <div 
                className="absolute inset-y-0 left-0 bg-[var(--md-sys-color-error)]/10 dark:bg-white/10 transition-all duration-1000 ease-linear pointer-events-none"
                style={{ 
                  width: `${(iqamahRemainingSeconds / (iqamahTotalSeconds || 600)) * 100}%`,
                  display: iqamahRemainingSeconds <= 5 ? 'none' : 'block'
                }}
              />
              
              <div className="relative z-10 flex flex-col h-full justify-between gap-1 w-full text-center">
                {iqamahRemainingSeconds <= 5 ? (
                  <div className="flex flex-col items-center justify-center h-full w-full py-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-100 dark:text-red-200 animate-bounce leading-none mb-1">
                      {currentPrayerNameForIqamah || "IQAMAH"}
                    </span>
                    <motion.span 
                      key={iqamahRemainingSeconds}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: [1, 1.4, 1.1], opacity: 1 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="text-4xl sm:text-5xl lg:text-6xl font-black font-sans tracking-tight leading-none text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]"
                    >
                      {iqamahRemainingSeconds}
                    </motion.span>
                  </div>
                ) : (
                  <>
                    <h3 className={cn(
                      "md3-label-small font-black uppercase tracking-widest text-center",
                      iqamahRemainingSeconds <= 10 ? "text-red-100 dark:text-red-200" : iqamahRemainingSeconds <= 30 ? "text-amber-100" : "text-[var(--md-sys-color-on-error-container)]/80"
                    )}>
                      IQAMAH {currentPrayerNameForIqamah ? `• ${currentPrayerNameForIqamah}` : ''} {iqamahPaused ? " (PAUSED)" : ""}
                    </h3>
                    <div className="flex flex-col items-center">
                      <p className={cn(
                        "font-black font-mono tracking-tighter leading-none text-center transition-all duration-300",
                        iqamahRemainingSeconds <= 10 ? "text-3xl sm:text-4xl lg:text-5xl text-white" : iqamahRemainingSeconds <= 30 ? "text-2.5xl sm:text-3xl lg:text-4xl text-white" : "text-xl sm:text-2xl lg:text-3xl"
                      )}>
                        {Math.floor(iqamahRemainingSeconds / 60)}:
                        {String(iqamahRemainingSeconds % 60).padStart(2, '0')}
                      </p>
                      <p className={cn(
                        "text-[9px] sm:text-[10px] font-bold mt-1 tracking-wide text-center",
                        iqamahRemainingSeconds <= 10 ? "text-red-100" : iqamahRemainingSeconds <= 30 ? "text-amber-100" : "opacity-80"
                      )}>
                        {iqamahRemainingSeconds <= 10 ? "SEDIA BERSOLAT" : iqamahRemainingSeconds <= 30 ? "SAK SAF RAPAT & LURUS" : "Sila bersedia untuk solat berjemaah"}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Tactile Administrative Overlays revealed on hover/touch */}
              {onIqamahTogglePause && onIqamahAddMinute && iqamahRemainingSeconds > 5 && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onIqamahTogglePause();
                    }}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur transition-all active:scale-90"
                    title={iqamahPaused ? "Mula" : "Jeda"}
                  >
                    {iqamahPaused ? <Play className="w-5 h-5 fill-white stroke-[2.5]" /> : <Pause className="w-5 h-5 fill-white stroke-[2.5]" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onIqamahAddMinute();
                    }}
                    className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center gap-1 font-bold text-xs backdrop-blur transition-all active:scale-90"
                    title="Tambah 1 minit"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+1m</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
