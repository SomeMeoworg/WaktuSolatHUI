import { motion } from "motion/react";
import { Volume2, X, Bell } from "lucide-react";
import { useAppContext } from "../AppContext";
import { format } from "date-fns";
import { useState, useEffect } from "react";

export function AzanAlert({
  prayerName,
  prayerTime,
  remainingSeconds,
  style = "standard",
  onDismiss,
}: {
  prayerName: string;
  prayerTime: Date;
  remainingSeconds: number;
  style: "dramatic" | "standard" | "modern" | "subtle" | "minimal";
  onDismiss: () => void;
}) {
  const { t, settings } = useAppContext();
  const [dismissTapCount, setDismissTapCount] = useState(0);

  useEffect(() => {
    if (dismissTapCount > 0) {
      const tId = setTimeout(() => setDismissTapCount(0), 2000);
      return () => clearTimeout(tId);
    }
  }, [dismissTapCount]);

  const handleDismiss = () => {
    if (dismissTapCount < 1) {
      setDismissTapCount(1);
    } else {
      onDismiss();
      setDismissTapCount(0);
    }
  };

  const formattedTime = format(
    prayerTime,
    settings.timeFormat === "12h" ? "hh:mm a" : "HH:mm"
  );

  // Calculate dynamic progress percentage
  const durationLimit = settings.azanAlertDuration ?? 20;
  const progressPercent = Math.max(0, Math.min(100, (remainingSeconds / durationLimit) * 100));

  // 1. SUBTLE (ELEGANT LUXURY GLASS TOAST - BOTTOM RIGHT)
  if (style === "subtle") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 35, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.94 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-6 right-6 z-[300] w-[90%] max-w-sm"
      >
        <div className="bg-[var(--md-sys-color-surface-container-highest)]/85 dark:bg-[#121214]/85 backdrop-blur-2xl border border-[var(--md-sys-color-primary)]/20 dark:border-white/12 shadow-[0_20px_50px_rgba(0,0,0,0.35)] rounded-[28px] p-5 flex items-center justify-between gap-4 relative overflow-hidden ring-1 ring-black/5">
          <div className="flex items-center gap-4 relative z-10">
            {/* Pulsing visualizer bell icon */}
            <div className="relative shrink-0 flex items-center justify-center">
              <motion.span 
                animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                className="absolute w-10 h-10 rounded-full bg-[var(--md-sys-color-primary)]/20"
              />
              <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shrink-0 shadow-md relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <motion.div
                  animate={{ rotate: [0, 15, -15, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <Bell size={18} className="stroke-[2.5]" />
                </motion.div>
              </div>
            </div>
            <div>
              <h4 className="font-black text-[var(--md-sys-color-on-surface)] dark:text-zinc-100 text-sm tracking-tight leading-tight">
                {t("azanAlertTitle", { prayer: prayerName })}
              </h4>
              <p className="text-[var(--md-sys-color-on-surface-variant)]/90 dark:text-zinc-400/90 text-[11px] font-bold mt-1">
                {formattedTime} • {t("closeInSeconds" as any, { seconds: remainingSeconds })}
              </p>
            </div>
          </div>
          
          {/* @ts-ignore */}
          <md-icon-button onClick={onDismiss}>
            <md-icon>close</md-icon>
          </md-icon-button>

          {/* Glowing slide timeline at the bottom */}
          <div className="absolute bottom-0 inset-x-0 h-1 bg-[var(--md-sys-color-primary)]/10 dark:bg-white/5">
            <motion.div
              className="h-full bg-[var(--md-sys-color-primary)] shadow-[0_-1px_8px_var(--md-sys-color-primary)]"
              initial={{ width: "100%" }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // 2. MODERN (DYNAMIC ISLAND FLOATING CAPSULE - TOP CENTER)
  if (style === "modern") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -60, x: "-50%", scale: 0.94 }}
        animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
        exit={{ opacity: 0, y: -30, x: "-50%", scale: 0.94 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-[92%] max-w-md"
      >
        <div className="bg-[#0b0b0d]/90 dark:bg-black/90 backdrop-blur-3xl border border-[var(--md-sys-color-primary)]/30 dark:border-white/12 shadow-[0_24px_50px_rgba(0,0,0,0.45)] rounded-[30px] p-4 pl-5 flex items-center justify-between gap-4 ring-1 ring-black/5 relative overflow-hidden">
          {/* Subtle slow pulsing glow inside background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--md-sys-color-primary)]/5 via-transparent to-[var(--md-sys-color-primary)]/5 animate-pulse" />
          
          <div className="flex items-center gap-4 relative z-10 min-w-0 flex-1">
            {/* Animated ringing bell with physical dual acoustic halo */}
            <div className="relative shrink-0 flex items-center justify-center">
              <motion.span 
                animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                className="absolute w-12 h-12 rounded-2xl bg-[var(--md-sys-color-primary)]/20 pointer-events-none"
              />
              <motion.span 
                animate={{ scale: [1, 2.1], opacity: [0.3, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.6 }}
                className="absolute w-12 h-12 rounded-2xl bg-[var(--md-sys-color-primary)]/10 pointer-events-none"
              />
              <div className="w-11 h-11 rounded-2xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-lg relative overflow-hidden group z-10 border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <motion.div
                  animate={{ rotate: [0, 18, -18, 12, -12, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                >
                  <Bell size={20} className="stroke-[2.5] relative z-10" />
                </motion.div>
              </div>
            </div>
            
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--md-sys-color-primary)] opacity-95 block mb-0.5">
                {t("enteringPrayerTime" as any)}
              </span>
              <h4 className="font-black text-white text-base tracking-tight leading-none truncate">
                {prayerName} • <span className="text-zinc-400 font-bold font-mono text-sm">{formattedTime}</span>
              </h4>
              
              {/* Dynamic visual remaining timeline */}
              <div className="w-full h-1 bg-white/10 rounded-full mt-2.5 overflow-hidden">
                <motion.div 
                  className="h-full bg-[var(--md-sys-color-primary)] shadow-[0_0_8px_var(--md-sys-color-primary)]"
                  initial={{ width: "100%" }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 relative z-10 shrink-0 pr-1">
            <span className="text-[10px] font-mono font-black text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]/12 px-2.5 py-1.5 rounded-xl border border-[var(--md-sys-color-primary)]/15 tabular-nums">
              {remainingSeconds}s
            </span>
            <button
              onClick={onDismiss}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 hover:scale-105 active:scale-95 shadow-sm transition-all cursor-pointer"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // 3. MINIMAL (SLEEK MICRO-STATUS PILL - TOP RIGHT)
  if (style === "minimal") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed top-6 right-6 z-[300]"
      >
        <div className="bg-zinc-900/90 dark:bg-black/95 text-white backdrop-blur-xl border border-zinc-800/80 dark:border-white/15 shadow-2xl rounded-full px-5 py-2.5 flex items-center gap-3.5 select-none ring-1 ring-black/10">
          {/* Active pulsing emerald/primary ring */}
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--md-sys-color-primary)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--md-sys-color-primary)]"></span>
          </span>
          
          <span className="text-[11px] font-black tracking-tight flex items-center gap-2 whitespace-nowrap">
            <span className="text-zinc-100">{prayerName}</span> 
            <span className="opacity-60 font-bold font-mono">{formattedTime}</span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-black font-mono text-[var(--md-sys-color-primary)]/90 tabular-nums">
              {remainingSeconds}s
            </span>
          </span>
          
          <button
            onClick={onDismiss}
            className="w-5.5 h-5.5 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white shrink-0 transition-colors cursor-pointer"
          >
            <X size={11} strokeWidth={3} />
          </button>
        </div>
      </motion.div>
    );
  }

  // 4. STANDARD (FROSTED GLASS GLOSSY BANNER - TOP FLOATING)
  if (style === "standard") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className="fixed top-0 inset-x-0 z-[300] w-full p-4 sm:p-6"
      >
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-[var(--md-sys-color-surface-container-highest)]/90 via-[var(--md-sys-color-surface-container-highest)]/95 to-[var(--md-sys-color-surface-container-high)]/90 dark:from-[#0d0d0f]/90 dark:via-[#121214]/95 dark:to-[#0d0d0f]/90 border border-[var(--md-sys-color-primary)]/20 dark:border-white/12 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.55)] rounded-[32px] p-6 sm:p-7 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-3xl ring-1 ring-black/5">
          {/* Animated decorative concentric ring halos */}
          <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full border-[6px] border-[var(--md-sys-color-primary)]/8 animate-ping pointer-events-none" />
          <div className="absolute right-10 -top-10 w-32 h-32 rounded-full border-2 border-[var(--md-sys-color-primary)]/8 animate-pulse pointer-events-none" />
          
          <div className="flex items-center gap-5 relative z-10 flex-col sm:flex-row text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
              <Volume2 size={32} className="stroke-[2.5] animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]/10 px-3.5 py-1 rounded-full border border-[var(--md-sys-color-primary)]/15">
                {t("enteringPrayerTime" as any)}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--md-sys-color-on-surface)] dark:text-white tracking-tight mt-3 leading-none">
                {t("prepareForAzan" as any, { prayer: prayerName })}
              </h2>
              <p className="text-[var(--md-sys-color-on-surface-variant)]/90 dark:text-zinc-400 text-sm mt-2.5 font-bold">
                {t("azanTimePrefix" as any)}: {formattedTime} • {t("closeInSeconds" as any, { seconds: remainingSeconds })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <button
              onClick={handleDismiss}
              className="px-7 py-4 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-black text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 relative overflow-hidden cursor-pointer"
            >
              <X size={16} className="stroke-[2.5]" />
              <span>
                {dismissTapCount > 0 ? t("doubleTapExit") : t("dismissAlert")}
              </span>
            </button>
          </div>

          {/* Dynamic sliding indicator at bottom of banner */}
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-[var(--md-sys-color-primary)]/10 dark:bg-white/5">
            <motion.div
              className="h-full bg-[var(--md-sys-color-primary)] shadow-[0_-2px_10px_var(--md-sys-color-primary)]"
              initial={{ width: "100%" }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // 5. DRAMATIC (AMBIENT SCREEN BREATHING SILHOUETTE - FULL SCREEN)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] bg-gradient-to-br from-[var(--md-sys-color-background)] via-[var(--md-sys-color-surface-container-highest)] to-[var(--md-sys-color-primary-container)]/30 flex flex-col items-center justify-between p-8 sm:p-12 text-[var(--md-sys-color-on-background)] overflow-hidden select-none"
    >
      {/* Calm ambient organic breathing backdrop blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 0.95, 1],
          x: [0, 40, -30, 0],
          y: [0, -30, 40, 0],
          opacity: [0.15, 0.28, 0.18, 0.15],
        }}
        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
        className="absolute w-[95vw] h-[95vw] sm:w-[65vw] sm:h-[65vw] rounded-full bg-[var(--md-sys-color-primary)]/20 blur-[130px] pointer-events-none top-1/4 left-1/4"
      />
      <motion.div
        animate={{
          scale: [1, 0.9, 1.15, 1],
          x: [0, -50, 30, 0],
          y: [0, 40, -30, 0],
          opacity: [0.1, 0.22, 0.14, 0.1],
        }}
        transition={{ repeat: Infinity, duration: 15, ease: "easeInOut", delay: 2 }}
        className="absolute w-[80vw] h-[80vw] sm:w-[50vw] sm:h-[50vw] rounded-full bg-[var(--md-sys-color-secondary)]/15 blur-[110px] pointer-events-none bottom-1/4 right-1/4"
      />

      {/* Top linear progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[var(--md-sys-color-primary)]/10 z-50">
        <motion.div 
          className="h-full bg-[var(--md-sys-color-primary)] shadow-[0_0_12px_var(--md-sys-color-primary)]"
          initial={{ width: "100%" }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </div>

      {/* Concentric pulsing background ripples (Audio Visualizer Rings) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.16] z-0">
        <motion.div 
          animate={{ scale: [1, 1.9, 1], opacity: [0.1, 0.38, 0.1] }}
          transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut" }}
          className="absolute w-[80vw] h-[80vw] sm:w-[50vw] sm:h-[50vw] rounded-full border-2 border-[var(--md-sys-color-primary)]"
        />
        <motion.div 
          animate={{ scale: [1.2, 2.3, 1.2], opacity: [0.05, 0.24, 0.05] }}
          transition={{ repeat: Infinity, duration: 5.8, ease: "easeInOut", delay: 1.2 }}
          className="absolute w-[80vw] h-[80vw] sm:w-[50vw] sm:h-[50vw] rounded-full border border-[var(--md-sys-color-primary)]"
        />
        <motion.div 
          animate={{ scale: [0.85, 1.45, 0.85], opacity: [0.18, 0.48, 0.18] }}
          transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut", delay: 0.6 }}
          className="absolute w-[80vw] h-[80vw] sm:w-[50vw] sm:h-[50vw] rounded-full border-4 border-[var(--md-sys-color-primary)]"
        />
      </div>

      {/* Elegant Mosque silhouette background */}
      <div className="absolute bottom-0 inset-x-0 h-[26vh] pointer-events-none z-0 flex items-end">
        <svg viewBox="0 0 1200 220" className="w-full h-full text-[var(--md-sys-color-primary)] opacity-[0.06]" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,220 L1200,220 L1200,180 L1150,180 L1150,120 L1140,105 L1140,50 L1130,50 L1130,35 L1120,50 L1110,50 L1110,105 L1100,120 L1100,180 L920,180 L920,150 C920,120 870,105 850,105 C830,105 780,120 780,150 L780,180 L100,180 L100,120 L90,105 L90,50 L80,50 L80,35 L70,50 L60,50 L60,105 L50,120 L50,180 L0,180 Z" />
        </svg>
      </div>

      {/* Top section: Mode tag & info */}
      <div className="flex justify-between items-center w-full z-10 relative">
        <div className="flex items-center gap-2.5 text-[var(--md-sys-color-primary)] font-black tracking-widest text-[10px] sm:text-xs uppercase bg-[var(--md-sys-color-primary-container)] border border-[var(--md-sys-color-primary)]/20 px-4 py-2.5 rounded-full shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--md-sys-color-primary)] animate-ping"></span>
          {t("mosqueDisplayMode" as any)}
        </div>
        <div className="text-[var(--md-sys-color-on-background)]/85 text-xs sm:text-sm font-black bg-black/20 border border-white/5 rounded-full px-4 py-1.5 backdrop-blur-md">
          {t("closeInSeconds" as any, { seconds: remainingSeconds })}
        </div>
      </div>

      {/* Center: Glowing Adhan details */}
      <div className="flex flex-col items-center text-center z-10 gap-8 my-auto relative">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[var(--md-sys-color-primary-container)]/80 backdrop-blur-md border-4 border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] flex items-center justify-center shadow-[0_0_60px_rgba(var(--md-sys-color-primary-rgb),0.35)] relative group"
        >
          <Volume2 size={48} className="stroke-[2.5]" />
          <motion.div
            animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
            className="absolute -inset-4 rounded-full border-2 border-[var(--md-sys-color-primary)] pointer-events-none"
          />
        </motion.div>

        <div className="flex flex-col gap-4">
          <span className="text-[var(--md-sys-color-primary)] font-black uppercase tracking-[0.3em] text-xs sm:text-sm">
            {t("enteringPrayerTime" as any)}
          </span>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-[var(--md-sys-color-on-background)] drop-shadow-[0_4px_16px_rgba(0,0,0,0.15)] leading-tight">
            {prayerName}
          </h1>
          <p className="text-xl sm:text-2xl text-[var(--md-sys-color-on-surface-variant)] dark:text-zinc-200 font-black tracking-wide mt-1.5 bg-black/10 px-6 py-2 rounded-2xl border border-white/5 inline-block mx-auto">
            {t("azanTimePrefix" as any)}: {formattedTime}
          </p>
        </div>

        <p className="text-[var(--md-sys-color-on-background)]/85 text-xs sm:text-sm max-w-md font-bold tracking-wide leading-relaxed animate-pulse">
          {t("dramaticInstruction" as any)}
        </p>
      </div>

      {/* Bottom: Close Button with Accidental Dismiss Protection */}
      <div className="z-10 w-full max-w-xs relative flex flex-col items-center gap-3">
        <button
          onClick={handleDismiss}
          className="w-full py-4.5 rounded-2xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-black text-sm sm:text-base shadow-lg hover:shadow-xl transition-all hover:scale-103 active:scale-97 flex items-center justify-center gap-2 relative overflow-hidden cursor-pointer border border-white/10"
        >
          <X size={20} className="stroke-[2.5]" />
          <span>
            {dismissTapCount > 0 ? t("doubleTapExit") : t("dismissAlert")}
          </span>
        </button>
        {dismissTapCount > 0 && (
          <motion.span 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[var(--md-sys-color-primary)] text-xs font-black bg-[var(--md-sys-color-primary-container)] border border-[var(--md-sys-color-primary)]/15 px-4 py-1.5 rounded-full shadow-md"
          >
            {t("doubleTapExit")}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
