import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Compass, X, Clock } from "lucide-react";
import { format } from "date-fns";
import { useAppContext } from "../AppContext";
import "@material/web/button/filled-tonal-button.js";

export function SolatMode({
  prayerName,
  remainingSeconds,
  showClock = true,
  showQibla = true,
  isDuaStage = false,
  onExit,
}: {
  prayerName: string;
  remainingSeconds: number;
  showClock?: boolean;
  showQibla?: boolean;
  isDuaStage?: boolean;
  onExit: () => void;
}) {
  const { t } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showExitButton, setShowExitButton] = useState(false);
  const [exitTapCount, setExitTapCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Show exit button on tap/click and hide after 4 seconds
  useEffect(() => {
    if (showExitButton) {
      const timeout = setTimeout(() => {
        setShowExitButton(false);
        setExitTapCount(0);
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [showExitButton]);

  // Handle temporary tap count reset for the exit button
  useEffect(() => {
    if (exitTapCount > 0) {
      const timeout = setTimeout(() => setExitTapCount(0), 2000);
      return () => clearTimeout(timeout);
    }
  }, [exitTapCount]);

  // Dhikr cycling for the Dua stage
  const [dhikrIndex, setDhikrIndex] = useState(0);
  useEffect(() => {
    if (isDuaStage) {
      const interval = setInterval(() => {
        setDhikrIndex((prev) => (prev + 1) % 3);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [isDuaStage]);

  const handleContainerClick = () => {
    setShowExitButton(true);
  };

  const handleExitClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (exitTapCount < 1) {
      setExitTapCount(1);
    } else {
      onExit();
      setExitTapCount(0);
    }
  };

  const formattedClock = format(currentTime, "HH:mm");

  const dhikrs = [
    t("solatModeDuaDhikr1"),
    t("solatModeDuaDhikr2"),
    t("solatModeDuaDhikr3")
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleContainerClick}
      className="fixed inset-0 z-[500] bg-zinc-950 text-neutral-100 flex flex-col items-center justify-between p-8 sm:p-12 cursor-pointer select-none overflow-hidden"
    >
      {/* Calm ambient breathing backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(24,24,27,0.85)_0%,rgba(9,9,11,1)_100%)] pointer-events-none" />
      
      {/* Subtle pulsing color blob in center */}
      <motion.div
        animate={{
          scale: isDuaStage ? [1, 1.1, 1] : [1, 1.2, 1],
          opacity: isDuaStage ? [0.05, 0.1, 0.05] : [0.08, 0.15, 0.08],
        }}
        transition={{
          repeat: Infinity,
          duration: isDuaStage ? 12 : 8,
          ease: "easeInOut",
        }}
        className="absolute w-[80vw] h-[80vw] sm:w-[50vw] sm:h-[50vw] rounded-full bg-[var(--md-sys-color-primary)]/10 blur-[120px] pointer-events-none"
      />

      {/* Top Header: Solat Mode Indicator & Clock */}
      <div className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-zinc-500 font-extrabold tracking-widest text-xs uppercase bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-full">
          <span className={`w-2 h-2 rounded-full bg-[var(--md-sys-color-primary)] ${isDuaStage ? 'opacity-80' : 'animate-pulse'}`}></span>
          {isDuaStage ? "Dua & Remembrance" : "Solat Sedang Berlangsung"}
        </div>
        
        {showClock && (
          <div className="flex items-center gap-2 text-zinc-300 font-black tracking-tight text-xl bg-zinc-900/40 border border-zinc-800/50 px-4 py-2 rounded-2xl">
            <Clock size={18} className="text-zinc-500 shrink-0" />
            <span className="font-mono">{formattedClock}</span>
          </div>
        )}
      </div>

      {/* Center Section: Transition dynamically between Praying Mode and Dua Screensaver */}
      <AnimatePresence mode="wait">
        {!isDuaStage ? (
          <motion.div
            key="prayer-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center justify-center text-center my-auto z-10 gap-6"
          >
            <span className="text-[var(--md-sys-color-primary)]/80 font-black uppercase tracking-[0.4em] text-xs sm:text-sm">
              {t("solatModeHeading")}
            </span>
            
            <motion.h1
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-zinc-100"
            >
              {prayerName}
            </motion.h1>

            <p className="text-zinc-500 text-sm sm:text-base font-medium max-w-sm tracking-wide mt-2">
              {t("solatModeInstruction")}
            </p>

            {/* Elegant static divider */}
            <div className="w-16 h-0.5 rounded bg-[var(--md-sys-color-primary)]/30 mt-4" />
          </motion.div>
        ) : (
          <motion.div
            key="dua-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center justify-center text-center my-auto z-10 gap-8"
          >
            <span className="text-[var(--md-sys-color-primary)]/80 font-black uppercase tracking-[0.4em] text-xs sm:text-sm">
              {t("solatModeDuaHeading")}
            </span>

            {/* Calligraphic Dhikr Screen */}
            <div className="min-h-[140px] flex items-center justify-center px-4">
              <AnimatePresence mode="wait">
                <motion.p
                  key={dhikrIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  className="font-serif text-3.5xl sm:text-5.5xl lg:text-6.5xl text-[var(--md-sys-color-tertiary)] font-bold leading-relaxed tracking-wide drop-shadow-[0_2px_15px_rgba(var(--md-sys-color-tertiary-rgb),0.15)]"
                >
                  {dhikrs[dhikrIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <p className="text-zinc-400 text-xs sm:text-sm max-w-md font-semibold tracking-wide leading-relaxed animate-pulse">
              {t("solatModeDuaInstruction")}
            </p>

            {/* Elegant static divider */}
            <div className="w-12 h-0.5 rounded bg-[var(--md-sys-color-primary)]/20 mt-2" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom: Qibla & Exit Panel */}
      <div className="w-full flex flex-col items-center gap-6 z-10">
        {showQibla && (
          <div className="flex items-center gap-2.5 text-zinc-400 font-semibold tracking-wider text-sm bg-zinc-900/30 border border-zinc-800/40 px-5 py-3 rounded-full">
            <Compass size={16} className="text-[var(--md-sys-color-primary)]/80 shrink-0 animate-spin-slow" />
            <span>Kiblat: 292.41° (Barat Laut)</span>
          </div>
        )}

        <div className="text-zinc-600 text-xs font-medium h-4">
          Automatik tamat dalam {Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s
        </div>
      </div>

      {/* Overlay dismiss panel with Accidental Dismiss Protection */}
      <AnimatePresence>
        {showExitButton && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-24 inset-x-0 mx-auto w-fit z-20 flex flex-col items-center gap-2"
          >
            {/* @ts-ignore */}
            <md-filled-tonal-button
              onClick={handleExitClick}
              className="shadow-xl"
              style={{ '--md-filled-tonal-button-container-shape': '24px', '--md-filled-tonal-button-container-height': '48px' } as any}
            >
              <X slot="icon" size={16} className="stroke-[2.5]" />
              {exitTapCount > 0 ? t("doubleTapExit") : t("exitSolatMode")}
            </md-filled-tonal-button>
            {exitTapCount > 0 && (
              <motion.span 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[var(--md-sys-color-on-error-container)] text-[10px] font-bold bg-[var(--md-sys-color-error-container)] px-3 py-1 rounded-full shadow-sm"
              >
                {t("doubleTapExit")}
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
