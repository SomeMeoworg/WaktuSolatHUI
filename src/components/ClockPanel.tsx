// @ts-nocheck
import { Button } from "@heroui/react";
import { useEffect, useState, useRef, useMemo } from "react";
import { format, differenceInSeconds } from "date-fns";
import { useTime } from "./clocks/useTime";
import { ms, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import { Compass, Sunrise, Moon, Calendar, Play, Pause, Plus } from "lucide-react";
import { useAppContext } from "../AppContext";
import { getHijriFormatted, getDynamicHijriDate, HIJRI_MONTHS, HIJRI_MONTHS_EN } from "../lib/holidays";
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
import { AnimatedNumber } from "./AnimatedDigit";

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
    // AudioContext might be blocked or not supported
  }
}

function ExternalDigitalComplication() {
  const { settings } = useAppContext();
  const time = useTime('tick');
  const visualStyle = useVisualStyle();
  
  const timeString = format(time, settings.timeFormat === '12h' ? "h:mm" : "HH:mm");
  const ampm = settings.timeFormat === '12h' ? format(time, "a") : "";

  if (settings.showExternalDigitalClock === false) return null;

  return (
    <div className={cn(
      "relative z-10 mt-2 sm:mt-4 lg:mt-0 lg:ml-8",
      "flex flex-col items-center justify-center"
    )}>
      <div className={cn(
        "relative overflow-hidden flex items-baseline justify-center px-6 py-2.5 sm:px-8 sm:py-3 lg:px-10 lg:py-6 rounded-[1.25rem] sm:rounded-3xl lg:rounded-[3rem] font-black tracking-tighter text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-[6rem] leading-none",
        "bg-content4 text-foreground ring-1 ring-divider shadow-sm",
        visualStyle === 'retro' && "border-[3px] border-[var(--app-foreground)] bg-content1 shadow-[4px_4px_0px_0px_var(--app-foreground)] lg:shadow-[6px_6px_0px_0px_var(--app-foreground)] rounded-none ring-0",
        visualStyle === 'glass' && "bg-[var(--glass-bg)]/60 backdrop-blur-2xl border border-[var(--glass-border)] text-foreground ring-0 shadow-lg",
        visualStyle === 'soft' && "bg-content1 shadow-[var(--soft-shadow-medium)] border-0 ring-0"
      )}>
        
        
        <span className="font-mono drop-shadow-sm tabular-nums">{timeString}</span>
        {ampm && <span className="ml-1.5 sm:ml-2 lg:ml-4 text-[10px] sm:text-xs md:text-base lg:text-2xl xl:text-3xl opacity-70 font-sans font-extrabold uppercase tracking-widest">{ampm}</span>}
      </div>
    </div>
  );
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
      borderTopLeftRadius: 'var(--shape-xl)',
      borderBottomRightRadius: 'var(--shape-xl)',
      borderTopRightRadius: 'var(--shape-md)',
      borderBottomLeftRadius: 'var(--shape-md)',
    };
  }, [visualStyle]);

  const hijriCardStyle = useMemo(() => {
    if (visualStyle === 'retro') return { borderRadius: '0px' };
    return {
      borderTopRightRadius: 'var(--shape-xl)',
      borderBottomLeftRadius: 'var(--shape-xl)',
      borderTopLeftRadius: 'var(--shape-md)',
      borderBottomRightRadius: 'var(--shape-md)',
    };
  }, [visualStyle]);

  const [countdownParts, setCountdownParts] = useState({ h: 0, m: 0, s: 0, active: false });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!nextPrayerTime) {
      setCountdownParts({ h: 0, m: 0, s: 0, active: false });
      setProgress(0);
      return;
    }

    const diffInSecs = differenceInSeconds(nextPrayerTime, currentTime);

    if (diffInSecs <= 0) {
      setCountdownParts({ h: 0, m: 0, s: 0, active: false });
      setProgress(100);
      return;
    }

    const h = Math.floor(diffInSecs / 3600);
    const m = Math.floor((diffInSecs % 3600) / 60);
    const s = diffInSecs % 60;

    setCountdownParts({ h, m, s, active: true });

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

  const dynamicHijriStr = getDynamicHijriDate(
    todayData?.date || currentTime.toISOString(),
    settings.hijriMethod,
    settings.hijriAdjustment,
    todayData?.hijri
  );

  if (dynamicHijriStr) {
    const parts = dynamicHijriStr.split("-");
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

  if (!hijriDayNum) {
    hijriDayNum = "•";
    hijriMonthYear = "---";
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
                "relative w-full mb-1.5 lg:mb-2 rounded-[24px] sm:rounded-[28px] overflow-hidden flex flex-col shrink-0",
                (!visualStyle || visualStyle === 'default') && "premium-glass-heavy premium-glow-border text-white",
                visualStyle === 'retro' && "border-2 border-[var(--app-foreground)] shadow-[6px_6px_0px_0px_var(--app-foreground)] rounded-none text-foreground bg-content1",
                visualStyle === 'glass' && "bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] premium-glow-border text-glass-contrast",
                visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border border-divider bg-content1 text-foreground"
              )}
            >
              {/* Main Cohesive Next/Current Prayer Card Content */}
              <div className="flex flex-col w-full relative z-10 p-4 sm:p-5 gap-3">
                {/* Top Row: Prayer Statuses */}
                <div className={cn(
                  "flex flex-row justify-between items-center w-full border-b pb-2.5",
                  (visualStyle === 'glass' || visualStyle === 'default') ? "border-white/10" : "border-divider"
                )}>
                  {prevPrayerName && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                      <span className={cn("text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-75", (visualStyle === 'retro' || visualStyle === 'soft') ? "text-foreground/70" : "text-white/70")}>
                        {t("now")}:
                      </span>
                      <span className={cn("text-xs sm:text-sm font-black", (visualStyle === 'retro' || visualStyle === 'soft') ? "text-foreground" : "text-white")}>
                        {prevPrayerName}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-75", (visualStyle === 'retro' || visualStyle === 'soft') ? "text-foreground/70" : "text-white/70")}>
                      {t("nextPrayer")}:
                    </span>
                    <span className={cn("text-xs sm:text-sm font-black", (visualStyle === 'retro' || visualStyle === 'soft') ? "text-foreground" : "text-white")}>
                      {nextPrayerName}
                    </span>
                    {nextPrayerTime && (
                      <span className={cn(
                        "text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded-full select-none",
                        (visualStyle === 'retro' || visualStyle === 'soft')
                          ? "bg-foreground/10 text-foreground"
                          : "bg-white/15 text-white/90"
                      )}>
                        {format(nextPrayerTime, settings.timeFormat === "12h" ? "hh:mm a" : "HH:mm")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Row: Countdown Timer & Label */}
                <div className="flex flex-row justify-between items-center w-full">
                  <div className="flex flex-col">
                    <span className={cn("text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5", (visualStyle === 'retro' || visualStyle === 'soft') ? "text-foreground/60" : "text-white/50")}>
                      {t("timeRemaining")}
                    </span>
                    <div className={cn(
                      "flex items-baseline font-mono text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter",
                      (visualStyle === 'retro' || visualStyle === 'soft') ? "text-foreground" : "text-white"
                    )}>
                      {countdownParts.active ? (
                        <>
                          {countdownParts.h > 0 && (
                            <div className="flex items-baseline">
                              <AnimatedNumber value={countdownParts.h} padZero={false} />
                              <span className="text-xs sm:text-sm opacity-60 ml-0.5 mr-1.5 font-sans font-bold">{t("hoursShort")}</span>
                            </div>
                          )}
                          {(countdownParts.m > 0 || countdownParts.h > 0) && (
                            <div className="flex items-baseline">
                              <AnimatedNumber value={countdownParts.m} padZero={true} />
                              <span className="text-xs sm:text-sm opacity-60 ml-0.5 mr-1.5 font-sans font-bold">{t("minutesShort")}</span>
                            </div>
                          )}
                          <div className="flex items-baseline">
                            <AnimatedNumber value={countdownParts.s} padZero={true} />
                            <span className="text-xs sm:text-sm opacity-60 ml-0.5 font-sans font-bold">{t("secondsShort")}</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xl sm:text-2xl font-sans font-black uppercase tracking-widest text-[var(--app-danger)] animate-pulse">{t("now")}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Squiggly / Straight Progress Bar */}
                <div className="w-full mt-1 relative z-10">
                  <div className={cn(
                    "w-full h-2 rounded-full relative flex items-center",
                    (visualStyle === 'retro' || visualStyle === 'soft') ? "bg-foreground/10" : "bg-white/20"
                  )}>
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 bg-current transition-all duration-1000 ease-linear animate-squiggle drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]",
                        (visualStyle === 'retro' || visualStyle === 'soft') ? "text-primary" : "text-white"
                      )}
                      style={{
                        width: `${progress}%`,
                        maskImage: `url("data:image/svg+xml,%3Csvg width='40' height='16' viewBox='0 0 40 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 0 8 Q 10 2 20 8 T 40 8' fill='none' stroke='black' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        maskRepeat: "repeat-x",
                        WebkitMaskImage: `url("data:image/svg+xml,%3Csvg width='40' height='16' viewBox='0 0 40 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 0 8 Q 10 2 20 8 T 40 8' fill='none' stroke='black' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        WebkitMaskRepeat: "repeat-x",
                      }}
                    />
                    {/* Tracking dot */}
                    <div
                      className={cn(
                        "absolute h-2.5 w-2.5 rounded-full transition-all duration-1000 ease-linear shadow-[0_0_6px_rgba(255,255,255,0.6)] border z-10",
                        (visualStyle === 'retro' || visualStyle === 'soft') ? "bg-primary border-primary" : "bg-white border-white/50"
                      )}
                      style={{ left: `calc(${progress}% - 5px)` }}
                    />
                  </div>
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
            className={cn(
              "w-full flex items-center justify-center relative origin-top transition-all duration-300 shrink-0",
              settings.showExternalDigitalClock && ['analog', 'analog-numeric', 'analog-roman', 'analog-arabic', 'dashboard', 'minimal', 'orbit', 'swiss-station', 'bauhaus', 'layered'].includes(settings.clockFace || '') 
                ? "flex-col lg:flex-row scale-90 sm:scale-100 -mb-6 sm:mb-1 lg:mb-4 mt-0 sm:mt-1" 
                : "flex-col lg:flex-row mt-1 mb-1 lg:mb-4 scale-100"
            )}
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
            
            {/* External Digital Complication for purely analog faces */}
            {['analog', 'analog-numeric', 'analog-roman', 'analog-arabic', 'dashboard', 'minimal', 'orbit', 'swiss-station', 'bauhaus', 'layered'].includes(settings.clockFace || '') && (
              <ExternalDigitalComplication />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Date & Hijri - Way Material 3 Expressive Row */}
        <div className="flex flex-col items-center w-full mt-0.5 sm:mt-2 mb-0.5 lg:mb-1 z-10 shrink-0">
          <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-4 w-full">
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
                "relative overflow-hidden flex items-center gap-2 sm:gap-2 md:gap-3 lg:gap-2 xl:gap-4 p-2.5 sm:p-2.5 md:p-3.5 lg:p-2.5 xl:p-4 transition-all duration-500 ease-out cursor-pointer select-none group",
                (!visualStyle || visualStyle === 'default') && "premium-glass text-white",
                visualStyle === 'retro' && "border-2 border-[var(--app-foreground)] shadow-[4px_4px_0px_0px_var(--app-foreground)] rounded-none bg-content1 text-foreground",
                visualStyle === 'glass' && "bg-white/10 backdrop-blur-xl border border-white/20 text-white",
                visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border border-divider bg-content1 text-foreground"
              )}
            >
              
              

              {/* Dynamic Calendar Watermark */}
              <Calendar className={cn(
                "absolute -right-3 -bottom-3 w-10 h-10 md:w-14 md:h-14 lg:w-10 lg:h-10 xl:w-16 xl:h-16 opacity-[0.04] pointer-events-none transition-all duration-700 ease-out group-hover:rotate-12 group-hover:scale-125 group-hover:opacity-[0.08]",
                "text-primary",
                visualStyle === 'retro' && "text-foreground opacity-5",
                visualStyle === 'glass' && "text-foreground opacity-5",
                visualStyle === 'soft' && "text-primary opacity-[0.05]"
              )} />

              {/* Gregorian Day Number */}
              <span className={cn(
                "text-xl sm:text-2xl md:text-2.5xl lg:text-2.5xl xl:text-3xl 2xl:text-3.5xl font-black font-sans leading-none tracking-tighter select-none shrink-0 tabular-nums z-10 transition-colors duration-300",
                (!visualStyle || visualStyle === 'default' || visualStyle === 'glass') ? "text-glass-contrast" : "text-primary"
              )}>
                {format(currentTime, "d")}
              </span>

              {/* Month, Year, Day details */}
              <div className={cn(
                "flex flex-col min-w-0 gap-0.5 z-10",
                (!visualStyle || visualStyle === 'default' || visualStyle === 'glass') ? "text-white" : "text-foreground"
              )}>
                <span className="text-xs md:text-sm lg:text-base xl:text-sm 2xl:text-base font-black leading-tight tracking-tight truncate">
                  {format(currentTime, "MMMM yyyy", {
                    locale: settings.language === "ms" ? ms : enUS,
                  })}
                </span>
                <span className={cn(
                  "text-[9px] md:text-[10px] lg:text-xs xl:text-[10px] 2xl:text-xs font-extrabold uppercase tracking-widest leading-none opacity-80 truncate",
                  (!visualStyle || visualStyle === 'default' || visualStyle === 'glass') ? "text-white/80" : "text-foreground/75",
                  visualStyle === 'retro' && "opacity-95 text-foreground"
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
                "relative overflow-hidden flex items-center gap-2 sm:gap-2 md:gap-3 lg:gap-2 xl:gap-4 p-2.5 sm:p-2.5 md:p-3.5 lg:p-2.5 xl:p-4 transition-all duration-500 ease-out select-none group",
                (!visualStyle || visualStyle === 'default') && "premium-glass text-white",
                visualStyle === 'retro' && "border-2 border-[var(--app-foreground)] shadow-[4px_4px_0px_0px_var(--app-foreground)] rounded-none bg-content1 text-foreground",
                visualStyle === 'glass' && "bg-white/10 backdrop-blur-xl border border-white/20 text-white",
                visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border border-divider bg-content1 text-foreground"
              )}
            >
              
              

              {/* Dynamic Moon Watermark */}
              <Moon className={cn(
                "absolute -right-3 -bottom-3 w-10 h-10 md:w-14 md:h-14 lg:w-10 lg:h-10 xl:w-16 xl:h-16 opacity-[0.04] pointer-events-none transition-all duration-700 ease-out group-hover:-rotate-12 group-hover:scale-125 group-hover:opacity-[0.08]",
                (!visualStyle || visualStyle === 'default' || visualStyle === 'glass') ? "text-[var(--app-secondary)]" : "text-secondary",
                visualStyle === 'retro' && "text-foreground opacity-5",
                visualStyle === 'glass' && "text-foreground opacity-5",
                visualStyle === 'soft' && "text-[var(--app-secondary)] opacity-[0.05]"
              )} />

              {/* Hijri Day Number */}
              <span className={cn(
                "text-xl sm:text-2xl md:text-2.5xl lg:text-2.5xl xl:text-3xl 2xl:text-3.5xl font-black font-sans leading-none tracking-tighter select-none shrink-0 tabular-nums z-10 transition-colors duration-300",
                (!visualStyle || visualStyle === 'default' || visualStyle === 'glass') ? "text-glass-contrast" : "text-[var(--app-secondary)]"
              )}>
                {hijriDayNum || "•"}
              </span>

              {/* Hijri details */}
              <div className={cn(
                "flex flex-col min-w-0 gap-0.5 z-10",
                (!visualStyle || visualStyle === 'default' || visualStyle === 'glass') ? "text-white" : "text-foreground"
              )}>
                <span className="text-xs md:text-sm lg:text-base xl:text-sm 2xl:text-base font-black leading-tight tracking-tight truncate">
                  {hijriMonthYear || "..."}
                </span>
                <span className={cn(
                  "text-[9px] md:text-[10px] lg:text-xs xl:text-[10px] 2xl:text-xs font-extrabold uppercase tracking-widest leading-none opacity-80 truncate",
                  (!visualStyle || visualStyle === 'default' || visualStyle === 'glass') ? "text-white/80" : "text-foreground/75",
                  visualStyle === 'retro' && "opacity-95 text-foreground"
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
                "p-2 sm:p-2.5 rounded-[var(--shape-xl)] flex-1 relative overflow-hidden cursor-default min-h-[56px] sm:min-h-[64px] lg:min-h-[68px] flex flex-col justify-between",
                (!visualStyle || visualStyle === 'default') && "premium-glass text-white",
                visualStyle === 'retro' && "border-2 border-[var(--app-foreground)] shadow-[4px_4px_0px_0px_var(--app-foreground)] rounded-none text-foreground bg-content1",
                visualStyle === 'glass' && "bg-white/10 backdrop-blur-xl border border-white/20 text-white",
                visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border border-divider bg-content1 text-foreground"
              )}
            >
              
              <motion.div
                className="absolute -right-2 -bottom-2 w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-[var(--app-secondary)]/10 pointer-events-none"
                whileHover={{ rotate: -12, opacity: 0.2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Compass className="w-full h-full" />
              </motion.div>

              <div className="relative z-10 flex flex-col h-full justify-between gap-1">
                <h3 className={cn(
                  "text-xs font-semibold tracking-wide font-black uppercase tracking-widest",
                  (!visualStyle || visualStyle === 'default' || visualStyle === 'glass') ? "text-white/80" : "text-secondary"
                )}>
                  {t("qibla")}
                </h3>
                <div className={(!visualStyle || visualStyle === 'default' || visualStyle === 'glass') ? "text-white" : "text-foreground"}>
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
                "p-2 sm:p-2.5 rounded-[var(--shape-xl)] flex-1 relative overflow-hidden min-h-[56px] sm:min-h-[64px] lg:min-h-[68px] flex flex-col justify-between select-none transition-all duration-300 group cursor-default",
                iqamahRemainingSeconds <= 10 
                  ? "bg-red-600 text-white border-2 border-red-700 shadow-[0_0_20px_rgba(220,38,38,0.7)] animate-pulse" 
                  : iqamahRemainingSeconds <= 30
                    ? "bg-amber-500 text-white border-2 border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                    : cn(
                        (!visualStyle || visualStyle === 'default') && "bg-[var(--app-danger-container,hsl(var(--heroui-danger)/0.15))] text-[var(--app-danger)] border border-[var(--app-danger)]/30",
                        visualStyle === 'retro' && "border-2 border-[var(--app-foreground)] shadow-[4px_4px_0px_0px_var(--app-foreground)] rounded-none text-[var(--app-danger)] bg-content1",
                        visualStyle === 'glass' && "bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] text-[var(--app-danger)]",
                        visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border border-[var(--app-danger)]/30 bg-content1 text-[var(--app-danger)]"
                      )
              )}
            >
              {/* Progress Bar background overlay */}
              <div 
                className="absolute inset-y-0 left-0 bg-[var(--app-danger)]/10 dark:bg-white/10 transition-all duration-1000 ease-linear pointer-events-none"
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
                      "text-xs font-semibold tracking-wide font-black uppercase tracking-widest text-center",
                      iqamahRemainingSeconds <= 10 ? "text-red-100 dark:text-red-200" : iqamahRemainingSeconds <= 30 ? "text-amber-100" : "text-[var(--app-danger)]/80"
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
                  <Button isIconOnly variant="ghost" className="rounded-full"
                    onClick={(e: any) => {
                      e.stopPropagation();
                      onIqamahTogglePause();
                    }}
                    title={iqamahPaused ? "Mula" : "Jeda"}
                  >
                    {iqamahPaused ? <Play className="fill-white stroke-[2.5]" /> : <Pause className="fill-white stroke-[2.5]" />}
                  </Button>
                  <Button variant="ghost"
                    onClick={(e: any) => {
                      e.stopPropagation();
                      onIqamahAddMinute();
                    }}
                    title="Tambah 1 minit"
                  >
                    <Plus />
                    +1m
                  </Button>
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
            "p-2 sm:p-2.5 rounded-[var(--shape-xl)] flex-1 relative overflow-hidden cursor-default min-h-[56px] sm:min-h-[64px] lg:min-h-[68px] flex flex-col justify-between",
            (!visualStyle || visualStyle === 'default') && "premium-glass text-white",
            visualStyle === 'retro' && "border-2 border-[var(--app-foreground)] shadow-[4px_4px_0px_0px_var(--app-foreground)] rounded-none text-foreground bg-content1",
            visualStyle === 'glass' && "bg-white/10 backdrop-blur-xl border border-white/20 text-white",
            visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border border-divider bg-content1 text-foreground"
          )}
        >
          
          <motion.div
            className="absolute -right-2 -bottom-2 w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-[var(--app-secondary)]/10 pointer-events-none"
            whileHover={{ rotate: 12, opacity: 0.2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Sunrise className="w-full h-full" />
          </motion.div>

          <div className="relative z-10 flex flex-col h-full justify-between gap-1">
            <h3 className={cn(
              "text-xs font-semibold tracking-wide font-black uppercase tracking-widest",
              (!visualStyle || visualStyle === 'default' || visualStyle === 'glass') ? "text-white/80" : "text-secondary"
            )}>
              {t("sunrise")}
            </h3>
            <div className={(!visualStyle || visualStyle === 'default' || visualStyle === 'glass') ? "text-white" : "text-foreground"}>
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
