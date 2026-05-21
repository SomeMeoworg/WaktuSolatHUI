import { motion } from "motion/react";
import { Volume2, X, Bell } from "lucide-react";
import { useAppContext } from "../AppContext";
import { format } from "date-fns";

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
  style: "dramatic" | "standard" | "subtle";
  onDismiss: () => void;
}) {
  const { t, settings } = useAppContext();

  const formattedTime = format(
    prayerTime,
    settings.timeFormat === "12h" ? "hh:mm a" : "HH:mm"
  );

  if (style === "subtle") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-[300] w-[90%] max-w-sm"
      >
        <div className="bg-[var(--md-sys-color-primary-container)] border border-[var(--md-sys-color-primary)]/20 shadow-2xl rounded-[24px] p-4 flex items-center justify-between gap-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shrink-0 animate-bounce">
              <Bell size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-bold text-[var(--md-sys-color-on-primary-container)] text-base leading-tight">
                {t("azanAlertTitle", { prayer: prayerName })}
              </h4>
              <p className="text-[var(--md-sys-color-on-primary-container)]/70 text-xs mt-0.5">
                {formattedTime} • Tutup dalam {remainingSeconds}s
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-on-primary-container)] shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      </motion.div>
    );
  }

  if (style === "standard") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-0 inset-x-0 z-[300] w-full p-4 sm:p-6"
      >
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-[var(--md-sys-color-primary-container)] via-[var(--md-sys-color-primary-container)] to-[var(--md-sys-color-secondary-container)] border border-[var(--md-sys-color-primary)]/20 shadow-2xl rounded-[32px] p-6 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-2xl">
          {/* Animated concentric decorative rings */}
          <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full border-4 border-[var(--md-sys-color-primary)]/5 animate-ping pointer-events-none" />
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
              <Volume2 size={32} className="stroke-[2.5] animate-pulse" />
            </div>
            <div className="text-center sm:text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]/10 px-3 py-1 rounded-full">
                MASUK WAKTU SOLAT
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--md-sys-color-on-primary-container)] tracking-tight mt-1.5 leading-none">
                Sila bersedia untuk Azan {prayerName}
              </h2>
              <p className="text-[var(--md-sys-color-on-primary-container)]/70 text-sm mt-1 font-semibold">
                Waktu Azan: {formattedTime} • Automatik tutup dalam {remainingSeconds}s
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <button
              onClick={onDismiss}
              className="px-5 py-3 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <X size={16} className="stroke-[2.5]" />
              {t("dismissAlert", "Tutup")}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Dramatic full-screen alert
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] bg-slate-950 flex flex-col items-center justify-between p-8 sm:p-12 text-white overflow-hidden select-none"
    >
      {/* Concentric pulsing background ripples */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="absolute w-[200vw] h-[200vw] sm:w-[120vw] sm:h-[120vw] rounded-full border border-emerald-500/20 animate-pulse scale-90" />
        <div className="absolute w-[150vw] h-[150vw] sm:w-[90vw] sm:h-[90vw] rounded-full border-2 border-emerald-500/10 animate-ping" />
        <div className="absolute w-[100vw] h-[100vw] sm:w-[60vw] sm:h-[60vw] rounded-full border border-emerald-500/30 animate-pulse" />
      </div>

      {/* Elegant Mosque silhouette background */}
      <div className="absolute bottom-0 inset-x-0 h-[30vh] opacity-[0.04] bg-[url('/img/mosque-silhouette.svg')] bg-bottom bg-no-repeat bg-contain pointer-events-none" />

      {/* Top section: remaining seconds */}
      <div className="flex justify-between items-center w-full z-10">
        <div className="flex items-center gap-2 text-emerald-400 font-black tracking-widest text-xs uppercase bg-emerald-950/40 border border-emerald-500/20 px-4 py-2 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          Mosque Display Mode
        </div>
        <div className="text-white/40 text-sm font-semibold">
          Tutup dalam {remainingSeconds}s
        </div>
      </div>

      {/* Center: Hero Adhan details */}
      <div className="flex flex-col items-center text-center z-10 gap-6 my-auto">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="w-28 h-28 rounded-full bg-emerald-500/10 border-4 border-emerald-500 text-emerald-400 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)]"
        >
          <Volume2 size={56} className="stroke-[2.5]" />
        </motion.div>

        <div className="flex flex-col gap-2">
          <span className="text-emerald-400 font-black uppercase tracking-[0.3em] text-sm sm:text-base">
            MASUK WAKTU SOLAT
          </span>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight bg-gradient-to-b from-white via-white to-neutral-400 bg-clip-text text-transparent">
            {prayerName}
          </h1>
          <p className="text-xl sm:text-2xl text-neutral-300 font-semibold tracking-wide mt-2">
            Waktu Azan: {formattedTime}
          </p>
        </div>

        <p className="text-neutral-400 text-sm sm:text-base max-w-md font-semibold tracking-wide animate-pulse">
          Sila diam diri untuk mendengar panggilan solat yang suci.
        </p>
      </div>

      {/* Bottom: Close / Dismiss */}
      <div className="z-10 w-full max-w-xs">
        <button
          onClick={onDismiss}
          className="w-full py-4 rounded-2xl bg-emerald-500 text-slate-950 font-black text-base shadow-lg hover:shadow-emerald-500/20 hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
        >
          <X size={20} className="stroke-[2.5]" />
          MATIKAN ALARAN
        </button>
      </div>
    </motion.div>
  );
}
