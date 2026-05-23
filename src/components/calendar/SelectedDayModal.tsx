import { motion, AnimatePresence } from "motion/react";
import { X, CalendarDays, Info, Calendar } from "lucide-react";
import { PrayerData } from "../../types";
import { PRAYER_NAMES, PRAYER_ICONS } from "../PrayerSchedule";
import { getAllEventsForDay, getHijriFormatted } from "../../lib/holidays";
import { cn } from "../../lib/utils";
import { format, parse } from "date-fns";
import { ms, enUS } from "date-fns/locale";
import { useAppContext } from "../../AppContext";
import { useVisualStyle, useIconStroke } from "../../hooks/useVisualStyle";

interface SelectedDayModalProps {
  day: PrayerData | null;
  onClose: () => void;
  onPrayerSelect: (k: string) => void;
}

export function SelectedDayModal({ day, onClose, onPrayerSelect }: SelectedDayModalProps) {
  const { t, settings } = useAppContext();
  const isMalay = settings.language === "ms";
  const visualStyle = useVisualStyle();
  const iconStroke = useIconStroke();
  
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
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm sm:overflow-y-auto"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: 150, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 120, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className={cn(
            "bg-[var(--md-sys-color-surface)] w-full max-h-[92dvh] overflow-y-auto max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col transition-all duration-300",
            visualStyle === "retro" && "border-[3px] border-[var(--md-sys-color-on-surface)] rounded-none shadow-[8px_8px_0px_0px_var(--md-sys-color-on-surface)]",
            visualStyle === "glass" && "bg-[var(--glass-bg)]/90 backdrop-blur-lg border border-[var(--glass-border)]",
            visualStyle === "soft" && "shadow-[var(--soft-shadow-heavy)] rounded-t-[40px] sm:rounded-[40px] border border-white/5"
          )}
          onClick={e => e.stopPropagation()}
        >
          {/* Header Ticket (Gradient-themed banner) */}
          <div className="bg-gradient-to-br from-[var(--md-sys-color-surface-container-high)] to-[var(--md-sys-color-surface-container)] p-6 relative border-b border-[var(--md-sys-color-outline)]/8 select-none">
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] rounded-full transition-colors z-10 shadow-xs cursor-pointer border border-[var(--md-sys-color-outline)]/5"
            >
              <X size={16} strokeWidth={iconStroke} />
            </motion.button>
            
            <div className="flex flex-col relative z-0">
               {isToday && (
                 <span className="mb-2 self-start px-2.5 py-0.5 bg-[var(--md-sys-color-primary)] text-white rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                   <CalendarDays size={11} /> {t("today")}
                 </span>
               )}
               
               <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                 <Calendar size={18} className="text-[var(--md-sys-color-primary)]" />
                 {format(dateObj, "dd MMMM yyyy", { locale: settings.language === 'ms' ? ms : enUS })}
               </h2>
               
               <p className="font-semibold text-[var(--md-sys-color-on-surface-variant)] mt-1.5 text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                 {(!settings.hijriFormat || settings.hijriFormat === 'both' || settings.hijriFormat === 'text') && (
                   <span className="font-black">{getHijriFormatted(day.date, settings.hijriMethod, settings.hijriAdjustment, "text", settings.language).split(" (")[0]}</span>
                 )}
                 {(!settings.hijriFormat || settings.hijriFormat === 'both') && (
                   <span className="opacity-40">•</span>
                 )}
                 {(!settings.hijriFormat || settings.hijriFormat === 'both' || settings.hijriFormat === 'number') && (
                   <span className="font-mono opacity-70 font-black">
                     {getHijriFormatted(day.date, settings.hijriMethod, settings.hijriAdjustment, "number", settings.language)}
                   </span>
                 )}
                 <span className="opacity-40">•</span>
                 <span className="opacity-80 font-black uppercase tracking-wider">{format(dateObj, "EEEE", { locale: settings.language === 'ms' ? ms : enUS })}</span>
               </p>
               
               {/* Event tags styled as outline pills */}
               {events.length > 0 && (
                 <div className="flex flex-wrap gap-1.5 mt-3.5">
                   {events.map((evt, i) => (
                     <div key={i} className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white shadow-xs border border-white/5", evt.type === 'public' ? 'bg-[var(--md-sys-color-error)]' : (evt.color || 'bg-[var(--md-sys-color-primary)]'))}>
                       {evt.title}
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
          
          {/* Frosted Grid Prayer Times Ticket Content */}
          <div className="p-6 bg-[var(--md-sys-color-surface)]">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-primary)] mb-3">
              {isMalay ? "Jadual Waktu Solat Harian" : "Daily Prayer Times Grid"}
            </h3>
            
            <div className="grid grid-cols-2 gap-2.5">
              {timesToDisplay.map((k) => {
                const Icon = PRAYER_ICONS[k];
                return (
                  <motion.button
                    key={k}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onPrayerSelect(k)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3.5 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)]/6 hover:border-[var(--md-sys-color-primary)]/30 hover:bg-[var(--md-sys-color-primary-container)]/10 rounded-2xl transition-all duration-250 group cursor-pointer shadow-xs",
                      visualStyle === "glass" && "bg-[var(--glass-bg)]/40 backdrop-blur-md border-[var(--glass-border)] shadow-inner",
                      visualStyle === "retro" && "border-2 border-[var(--md-sys-color-on-surface)] rounded-none shadow-[2px_2px_0px_0px_var(--md-sys-color-on-surface)]"
                    )}
                  >
                    <Icon size={16} strokeWidth={iconStroke} className="text-[var(--md-sys-color-primary)] opacity-75 group-hover:opacity-100 mb-1.5 shrink-0" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--md-sys-color-on-surface-variant)]">{t(k)}</span>
                    <span className="text-lg font-black font-mono text-[var(--md-sys-color-on-surface)] mt-1 tracking-tight">{day[k] ? day[k].substring(0, 5) : "--:--"}</span>
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
