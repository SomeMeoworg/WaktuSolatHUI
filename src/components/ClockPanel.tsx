import { useEffect, useState, useRef, useMemo } from "react";
import { format, differenceInSeconds } from "date-fns";
import { useTime } from "./clocks/useTime";
import { ms, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import "@material/web/elevation/elevation.js";
import "@material/web/ripple/ripple.js";
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
      "relative z-10 -mt-4 sm:-mt-6 lg:mt-0 lg:ml-10",
      "flex flex-col items-center justify-center"
    )}>
      <div className={cn(
        "relative overflow-hidden flex items-center justify-center px-5 py-2 sm:px-6 sm:py-3 lg:px-10 lg:py-6 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[3rem] font-black tracking-tighter text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-[6rem] leading-none",
        "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]",
        visualStyle === 'retro' && "border-[3px] border-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface)] shadow-[4px_4px_0px_0px_var(--md-sys-color-on-surface)] lg:shadow-[6px_6px_0px_0px_var(--md-sys-color-on-surface)] rounded-none",
        visualStyle === 'glass' && "bg-[var(--glass-bg)]/80 backdrop-blur-2xl border border-[var(--glass-border)] text-[var(--md-sys-color-on-surface)]",
        visualStyle === 'soft' && "bg-[var(--md-sys-color-surface-container-lowest)] shadow-[var(--soft-shadow-heavy)] border-0"
      )}>
        {/* @ts-ignore */}
        <md-elevation level={visualStyle === 'retro' || visualStyle === 'soft' ? '0' : '2'}></md-elevation>
        
        <span className="font-mono drop-shadow-sm tabular-nums">{timeString}</span>
        {ampm && <span className="ml-1.5 sm:ml-2 lg:ml-4 text-xs sm:text-sm md:text-xl lg:text-3xl xl:text-4xl opacity-75 font-sans font-extrabold uppercase tracking-widest">{ampm}</span>}
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
                "relative w-full mb-1.5 lg:mb-2 rounded-[28px] lg:rounded-[32px] overflow-hidden flex flex-col gap-1 sm:gap-0 bg-[var(--md-sys-color-surface-container-highest)]/30",
                visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[6px_6px_0px_0px_var(--md-sys-color-on-surface)] rounded-none",
                visualStyle === 'glass' && "bg-[var(--glass-bg)]/50 backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)]",
                visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border border-white/20"
              )}
            >
              {/* @ts-ignore */}
              <md-elevation level="1"></md-elevation>
              
              <div className="flex flex-col md:flex-row w-full relative z-10 gap-1.5 sm:gap-2 lg:gap-3 p-1.5 sm:p-2 lg:p-2.5">
                {/* Left Pane: Current Prayer */}
                {prevPrayerName && (
                  <div className="bg-[var(--md-sys-color-tertiary-container)]/90 backdrop-blur-md rounded-[20px] lg:rounded-[24px] p-3.5 sm:p-4 md:w-[35%] lg:w-[30%] xl:w-[25%] flex flex-col justify-between border border-white/10 dark:border-white/5 relative overflow-hidden group">
                    {/* Decorative blurred blob */}
                    <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-[var(--md-sys-color-tertiary)]/20 rounded-full blur-2xl group-hover:bg-[var(--md-sys-color-tertiary)]/30 transition-colors duration-1000" />
                    
                    <div className="flex items-center gap-2 mb-3 md:mb-6 relative z-10">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--md-sys-color-tertiary)] animate-pulse shadow-[0_0_8px_var(--md-sys-color-tertiary)]" />
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[var(--md-sys-color-on-tertiary-container)]/80">
                        {t("now")}
                      </span>
                    </div>
                    <div className="flex flex-col relative z-10">
                      <span className="text-xl sm:text-2xl md:text-3xl font-black text-[var(--md-sys-color-on-tertiary-container)] leading-none tracking-tight">
                        {prevPrayerName}
                      </span>
                    </div>
                  </div>
                )}

                <div className={cn(
                  "bg-[var(--md-sys-color-primary-container)]/90 backdrop-blur-md rounded-[20px] lg:rounded-[24px] p-4 sm:p-5 md:p-6 flex-1 flex flex-col justify-between border border-white/10 dark:border-white/5 relative overflow-hidden group min-h-[110px]",
                  !prevPrayerName && "w-full"
                )}>
                  {/* Atmospheric Background Graphic */}
                  <div className="absolute -right-16 -top-16 w-64 h-64 bg-gradient-to-br from-[var(--md-sys-color-primary)]/20 to-transparent rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-1000 pointer-events-none" />
                  <div className="absolute -left-10 -bottom-20 w-48 h-48 bg-gradient-to-tr from-[var(--md-sys-color-primary)]/10 to-transparent rounded-full blur-2xl opacity-40 pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full relative z-10 gap-4 sm:gap-0">
                    <div className="flex flex-col w-full sm:w-auto">
                      <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[var(--md-sys-color-primary)]">
                          {t("nextPrayer")}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                        <span className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--md-sys-color-on-primary-container)] tracking-tighter leading-none drop-shadow-sm">
                          {nextPrayerName}
                        </span>
                        {nextPrayerTime && (
                          <span className="text-sm sm:text-base font-bold text-[var(--md-sys-color-on-primary-container)]/60 tracking-tight">
                            {format(nextPrayerTime, settings.timeFormat === "12h" ? "hh:mm a" : "HH:mm")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--md-sys-color-on-primary-container)]/70 mb-1">
                        {t("timeRemaining")}
                      </span>
                      <div className="flex items-baseline font-mono text-[var(--md-sys-color-primary)] text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter drop-shadow-sm">
                        {countdownParts.active ? (
                          <>
                            {countdownParts.h > 0 && (
                              <div className="flex items-baseline">
                                <AnimatedNumber value={countdownParts.h} padZero={false} />
                                <span className="text-sm sm:text-base md:text-lg opacity-60 ml-0.5 mr-1.5 font-sans font-bold">{t("hoursShort")}</span>
                              </div>
                            )}
                            {(countdownParts.m > 0 || countdownParts.h > 0) && (
                              <div className="flex items-baseline">
                                <AnimatedNumber value={countdownParts.m} padZero={true} />
                                <span className="text-sm sm:text-base md:text-lg opacity-60 ml-0.5 mr-1.5 font-sans font-bold">{t("minutesShort")}</span>
                              </div>
                            )}
                            <div className="flex items-baseline">
                              <AnimatedNumber value={countdownParts.s} padZero={true} />
                              <span className="text-sm sm:text-base md:text-lg opacity-60 ml-0.5 font-sans font-bold">{t("secondsShort")}</span>
                            </div>
                          </>
                        ) : (
                           <span className="text-3xl sm:text-4xl md:text-5xl font-sans font-black uppercase tracking-widest text-[var(--md-sys-color-error)] animate-pulse">{t("now")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* M3 Expressive Squiggly Progress bar */}
                  <div className="w-full mt-4 sm:mt-5 relative z-10">
                    <div className="w-full h-2.5 lg:h-3 bg-[var(--md-sys-color-on-primary-container)]/10 text-[var(--md-sys-color-primary)] rounded-full relative flex items-center">
                      <div
                        className="absolute inset-y-0 left-0 bg-current transition-all duration-1000 ease-linear animate-squiggle drop-shadow-[0_2px_4px_var(--md-sys-color-primary)]"
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
                        className="absolute h-3 w-3 lg:h-4 lg:w-4 bg-[var(--md-sys-color-primary)] rounded-full transition-all duration-1000 ease-linear shadow-[0_0_8px_var(--md-sys-color-primary)] border-[1.5px] border-white z-10"
                        style={{ left: `calc(${progress}% - 6px)` }}
                      />
                    </div>
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
            className="w-full flex flex-col lg:flex-row items-center justify-center mt-1 mb-1 lg:mb-4 relative"
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
