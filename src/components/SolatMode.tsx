import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Compass, X, Clock } from "lucide-react";
import { format } from "date-fns";
import { useAppContext } from "../AppContext";

export function SolatMode({
  prayerName,
  remainingSeconds,
  showClock = true,
  showQibla = true,
  onExit,
}: {
  prayerName: string;
  remainingSeconds: number;
  showClock?: boolean;
  showQibla?: boolean;
  onExit: () => void;
}) {
  const { t } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showExitButton, setShowExitButton] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Show exit button on tap/click and hide after 4 seconds
  useEffect(() => {
    if (showExitButton) {
      const timeout = setTimeout(() => setShowExitButton(false), 4000);
      return () => clearTimeout(timeout);
    }
  }, [showExitButton]);

  const handleContainerClick = () => {
    setShowExitButton(true);
  };

  const formattedClock = format(currentTime, "HH:mm");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleContainerClick}
      className="fixed inset-0 z-[500] bg-zinc-950 text-neutral-100 flex flex-col items-center justify-between p-8 sm:p-12 cursor-pointer select-none overflow-hidden"
    >
      {/* Calm ambient breathing backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(24,24,27,0.8)_0%,rgba(9,9,11,1)_100%)] pointer-events-none" />
      
      {/* Subtle pulsing color blob in center */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.08, 0.15, 0.08],
        }}
        transition={{
          repeat: Infinity,
          duration: 8,
          ease: "easeInOut",
        }}
        className="absolute w-[80vw] h-[80vw] sm:w-[50vw] sm:h-[50vw] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none"
      />

      {/* Top Header: Solat Mode Indicator & Clock */}
      <div className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-zinc-500 font-extrabold tracking-widest text-xs uppercase bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Solat Sedang Berlangsung
        </div>
        
        {showClock && (
          <div className="flex items-center gap-2 text-zinc-300 font-black tracking-tight text-xl bg-zinc-900/40 border border-zinc-800/50 px-4 py-2 rounded-2xl">
            <Clock size={18} className="text-zinc-500 shrink-0" />
            <span className="font-mono">{formattedClock}</span>
          </div>
        )}
      </div>

      {/* Center: Main Prayer Title & Breathing Indicator */}
      <div className="flex flex-col items-center justify-center text-center my-auto z-10 gap-6">
        <span className="text-emerald-500/80 font-black uppercase tracking-[0.4em] text-xs sm:text-sm">
          {t("solatModeHeading", "Zon Ketenteraman")}
        </span>
        
        <motion.h1
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-zinc-100"
        >
          {prayerName}
        </motion.h1>

        <p className="text-zinc-500 text-sm sm:text-base font-medium max-w-sm tracking-wide mt-2">
          {t("solatModeInstruction", "Sila rapatkan saf dan matikan peranti mudah alih")}
        </p>

        {/* Breathing Ring */}
        <div className="relative w-16 h-16 flex items-center justify-center mt-6">
          <motion.div
            animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full border border-emerald-500"
          />
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
        </div>
      </div>

      {/* Bottom: Qibla & Exit Panel */}
      <div className="w-full flex flex-col items-center gap-6 z-10">
        {showQibla && (
          <div className="flex items-center gap-2.5 text-zinc-400 font-semibold tracking-wider text-sm bg-zinc-900/30 border border-zinc-800/40 px-5 py-3 rounded-full">
            <Compass size={16} className="text-emerald-500/80 shrink-0 animate-spin-slow" />
            <span>Kiblat: 292.41° (Barat Laut)</span>
          </div>
        )}

        <div className="text-zinc-600 text-xs font-medium h-4">
          Automatik tamat dalam {Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s
        </div>
      </div>

      {/* Overlay dismiss panel */}
      <AnimatePresence>
        {showExitButton && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-24 inset-x-0 mx-auto w-fit z-20"
            onClick={(e) => e.stopPropagation()} // prevent double triggers
          >
            <button
              onClick={onExit}
              className="px-6 py-3.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold text-sm shadow-xl flex items-center gap-2 hover:scale-105 transition-all"
            >
              <X size={16} className="stroke-[2.5]" />
              {t("exitSolatMode", "Tamat Mod Solat")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
