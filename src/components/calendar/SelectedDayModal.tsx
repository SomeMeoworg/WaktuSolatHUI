import { motion, AnimatePresence } from "motion/react";
import { X, CalendarDays, Info } from "lucide-react";
import { PrayerData } from "../../types";
import { PRAYER_NAMES, PRAYER_ICONS } from "../PrayerSchedule";
import { getAllEventsForDay, getHijriFormatted } from "../../lib/holidays";
import { cn } from "../../lib/utils";
import { format, parse } from "date-fns";
import { ms, enUS } from "date-fns/locale";
import { useAppContext } from "../../AppContext";

interface SelectedDayModalProps {
  day: PrayerData | null;
  onClose: () => void;
  onPrayerSelect: (k: string) => void;
}

export function SelectedDayModal({ day, onClose, onPrayerSelect }: SelectedDayModalProps) {
  const { t, settings } = useAppContext();
  
  if (!day) return null;
  
  const dateObj = parse(day.date, "dd-MMM-yyyy", new Date());
  const isToday = day.date === format(new Date(), "dd-MMM-yyyy");
  const events = getAllEventsForDay(dateObj, day.hijri);
  const timesToDisplay = ["imsak", "fajr", "syuruk", "dhuhr", "asr", "maghrib", "isha"] as const;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 sm:overflow-y-auto"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: "100%", opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: "100%", opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-[var(--md-sys-color-surface)] w-full max-h-[90dvh] overflow-y-auto max-w-lg rounded-t-4xl sm:rounded-4xl shadow-2xl sm:my-auto flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[var(--md-sys-color-surface-variant)] p-6 md:p-8 relative">
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] rounded-full transition-colors z-10 shadow-sm"
            >
              <X size={20} />
            </motion.button>
            <div className="flex flex-col relative z-0">
               {isToday && (
                 <span className="mb-2 self-start px-3 py-1 bg-[var(--md-sys-color-primary)] text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                   <CalendarDays size={14} /> {t("today")}
                 </span>
               )}
               <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--md-sys-color-on-surface)]">
                 {format(dateObj, "dd MMMM yyyy", { locale: settings.language === 'ms' ? ms : enUS })}
               </h2>
               <p className="font-semibold text-[var(--md-sys-color-on-surface-variant)] mt-1 text-lg flex items-center gap-2">
                 {(!settings.hijriFormat || settings.hijriFormat === 'both' || settings.hijriFormat === 'text') && (
                   <span>{getHijriFormatted(day.hijri, "text", settings.language)}</span>
                 )}
                 {(!settings.hijriFormat || settings.hijriFormat === 'both') && (
                   <span className="opacity-40">•</span>
                 )}
                 {(!settings.hijriFormat || settings.hijriFormat === 'both' || settings.hijriFormat === 'number') && (
                   <span className={settings.hijriFormat === 'both' ? "font-mono text-sm opacity-70" : ""}>{day.hijri}</span>
                 )}
                 <span className="opacity-40">•</span>
                 <span>{format(dateObj, "EEEE", { locale: settings.language === 'ms' ? ms : enUS })}</span>
               </p>
               
               {events.length > 0 && (
                 <div className="flex flex-wrap gap-2 mt-4">
                   {events.map((evt, i) => (
                     <div key={i} className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-sm", evt.type === 'public' ? 'bg-red-500' : (evt.color || 'bg-primary'))}>
                       {evt.title}
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 md:p-8 bg-[var(--md-sys-color-surface)]">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--md-sys-color-on-surface-variant)] mb-4">
              Jadual Waktu Solat
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {timesToDisplay.map((k) => {
                const Icon = PRAYER_ICONS[k];
                return (
                  <motion.button
                    key={k}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onPrayerSelect(k)}
                    className="flex flex-col items-center justify-center p-4 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/20 hover:border-[var(--md-sys-color-secondary)]/50 hover:bg-[var(--md-sys-color-secondary-container)] hover:text-[var(--md-sys-color-on-secondary-container)] rounded-3xl transition-colors focus:ring-2 focus:ring-[var(--md-sys-color-primary)] group"
                  >
                    <Icon size={20} className="text-[var(--md-sys-color-primary)] opacity-70 group-hover:opacity-100 mb-2" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--md-sys-color-on-surface-variant)]">{PRAYER_NAMES[k]}</span>
                    <span className="text-xl font-black font-mono text-[var(--md-sys-color-on-surface)] mt-1">{day[k] ? day[k].substring(0, 5) : "--:--"}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
