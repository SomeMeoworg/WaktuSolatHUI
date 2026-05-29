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
            "bg-content1 w-full max-h-[92dvh] overflow-y-auto max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col transition-all duration-300",
            visualStyle === "retro" && "border-[3px] border-[var(--app-foreground)] rounded-none shadow-[8px_8px_0px_0px_var(--app-foreground)]",
            visualStyle === "glass" && "bg-[var(--glass-bg)]/90 backdrop-blur-lg border border-[var(--glass-border)]",
            visualStyle === "soft" && "shadow-[var(--soft-shadow-heavy)] rounded-t-[40px] sm:rounded-[40px] border border-white/5"
          )}
          onClick={e => e.stopPropagation()}
        >
          {/* Header Ticket (Gradient-themed banner) */}
          <div className="bg-gradient-to-br from-[var(--app-surface-container-high)] to-[var(--app-surface-container)] p-6 relative border-b border-divider select-none">
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-content1 text-[var(--app-outline)] hover:text-foreground rounded-full transition-colors z-10 shadow-xs cursor-pointer border border-divider"
            >
              <X size={16} strokeWidth={iconStroke} />
            </motion.button>
            
            <div className="flex flex-col relative z-0">
               {isToday && (
                 <span className="mb-2 self-start px-2.5 py-0.5 bg-primary text-white rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                   <CalendarDays size={11} /> {t("today")}
                 </span>
               )}
               
               <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                 <Calendar size={18} className="text-primary" />
                 {format(dateObj, "dd MMMM yyyy", { locale: settings.language === 'ms' ? ms : enUS })}
               </h2>
               
               <p className="font-semibold text-[var(--app-outline)] mt-1.5 text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                 {(!settings.hijriFormat || settings.hijriFormat === 'both' || settings.hijriFormat === 'text') && (
                   <span className="font-black">{getHijriFormatted(day.date, settings.hijriMethod, settings.hijriAdjustment, "text", settings.language, day.hijri).split(" (")[0]}</span>
                 )}
                 {(!settings.hijriFormat || settings.hijriFormat === 'both') && (
                   <span className="opacity-40">•</span>
                 )}
                 {(!settings.hijriFormat || settings.hijriFormat === 'both' || settings.hijriFormat === 'number') && (
                   <span className="font-mono opacity-70 font-black">
                     {getHijriFormatted(day.date, settings.hijriMethod, settings.hijriAdjustment, "number", settings.language, day.hijri)}
                   </span>
                 )}
                 <span className="opacity-40">•</span>
                 <span className="opacity-80 font-black uppercase tracking-wider">{format(dateObj, "EEEE", { locale: settings.language === 'ms' ? ms : enUS })}</span>
               </p>
               
               {/* Event tags styled as outline pills */}
               {events.length > 0 && (
                 <div className="flex flex-wrap gap-1.5 mt-3.5">
                   {events.map((evt, i) => (
                     <div key={i} className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white shadow-xs border border-white/5", evt.type === 'public' ? 'bg-[var(--app-danger)]' : (evt.color || 'bg-primary'))}>
                       {evt.title}
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
          
          {/* Frosted Grid Prayer Times Ticket Content */}
          <div className="p-6 bg-content1">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">
              {isMalay ? "Jadual Waktu Solat Harian" : "Daily Prayer Times Grid"}
            </h3>
            
            <div className="grid grid-cols-2 gap-2.5">
              {timesToDisplay.map((k) => {
                const Icon = PRAYER_ICONS[k] as React.ComponentType<any>;
                return (
                  <motion.button
                    key={k}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onPrayerSelect(k)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3.5 bg-content2 border border-divider hover:border-primary/30 hover:bg-[var(--app-primary-container, hsl(var(--heroui-primary) / 0.15))]/10 rounded-2xl transition-all duration-250 group cursor-pointer shadow-xs",
                      visualStyle === "glass" && "bg-[var(--glass-bg)]/40 backdrop-blur-md border-[var(--glass-border)] shadow-inner",
                      visualStyle === "retro" && "border-2 border-[var(--app-foreground)] rounded-none shadow-[2px_2px_0px_0px_var(--app-foreground)]"
                    )}
                  >
                    <Icon size={16} strokeWidth={iconStroke} className="text-primary opacity-75 group-hover:opacity-100 mb-1.5 shrink-0" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--app-outline)]">{t(k)}</span>
                    <span className="text-lg font-black font-mono text-foreground mt-1 tracking-tight">{day[k] ? day[k].substring(0, 5) : "--:--"}</span>
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
