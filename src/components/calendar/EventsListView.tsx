import { useState, useMemo } from "react";
import { format, eachDayOfInterval, startOfYear, endOfYear, startOfDay } from "date-fns";
import { ms, enUS } from "date-fns/locale";
import { motion } from "motion/react";
import { CalendarDays, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { getAllEventsForDay } from "../../lib/holidays";
import { cn } from "../../lib/utils";
import { useAppContext } from "../../AppContext";

interface EventsListViewProps {
  currentDate: Date;
  type: "public" | "islamic" | "all";
}

export function EventsListView({ currentDate, type }: EventsListViewProps) {
  const { t, settings } = useAppContext();
  
  // Generate all events for the current year
  const eventsList = useMemo(() => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    const days = eachDayOfInterval({ start: yearStart, end: yearEnd });
    
    const list: { date: Date, title: string, type: 'public' | 'islamic', color?: string }[] = [];
    
    days.forEach(d => {
       const evts = getAllEventsForDay(d, null);
       evts.forEach(e => {
         if (type === "all" || e.type === type) {
            list.push({ date: d, title: e.title, type: e.type, color: e.color });
         }
       });
    });
    
    return list;
  }, [currentDate, type]);

  const today = startOfDay(new Date());

  if (eventsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]/20 rounded-4xl mt-4">
        <AlertCircle size={48} className="text-[var(--md-sys-color-on-surface-variant)]/50 mb-4" />
        <p className="text-[var(--md-sys-color-on-surface-variant)] font-medium text-lg">
          {t("noData")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4 mt-4 pb-8 w-full max-w-4xl mx-auto">
      {eventsList.map((evt, idx) => {
        const isPast = evt.date < today;
        const isTodayEvent = evt.date.getTime() === today.getTime();
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.05, 0.5) }}
            key={`${evt.date.toISOString()}-${evt.title}`}
            className={cn(
               "flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-4 sm:p-5 rounded-3xl md:rounded-3xl border transition-all duration-300",
               isTodayEvent 
                 ? "bg-[var(--md-sys-color-primary-container)] border-[var(--md-sys-color-primary)]/50 shadow-md ring-1 ring-[var(--md-sys-color-primary)]/20" 
                 : isPast 
                   ? "bg-[var(--md-sys-color-surface-variant)]/20 border-[var(--md-sys-color-outline)]/5 opacity-60 grayscale-[30%]"
                   : "bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline)]/10 hover:border-[var(--md-sys-color-primary)]/30 shadow-sm hover:shadow-md"
            )}
          >
            <div className={cn("flex items-center gap-4 min-w-[120px] shrink-0", isPast && "opacity-80")}>
               <div className={cn(
                 "w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-sm shrink-0",
                 evt.type === 'public' ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100",
                 isPast && "bg-gray-100 text-gray-500 border-gray-200"
               )}>
                 <span className="text-[10px] font-bold uppercase tracking-wider">{format(evt.date, "MMM", { locale: settings.language === 'ms' ? ms : enUS })}</span>
                 <span className="text-2xl font-black leading-none mt-0.5">{format(evt.date, "dd")}</span>
               </div>
               <div className="flex flex-col sm:hidden">
                 <span className="text-sm font-bold opacity-80">{format(evt.date, "EEEE", { locale: settings.language === 'ms' ? ms : enUS })}</span>
               </div>
            </div>
            
            <div className="hidden sm:block min-w-[100px] shrink-0">
              <span className="text-sm font-bold opacity-70">{format(evt.date, "EEEE", { locale: settings.language === 'ms' ? ms : enUS })}</span>
            </div>
            
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <span className={cn(
                "font-black text-lg sm:text-xl truncate leading-tight",
                isPast ? "text-[var(--md-sys-color-on-surface-variant)] line-through decoration-[var(--md-sys-color-outline)]/40" : "text-[var(--md-sys-color-on-surface)]"
              )}>
                {evt.title}
              </span>
              <div className="flex flex-wrap gap-2 items-center">
                 <span className={cn(
                   "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                   evt.type === 'public' 
                     ? isPast ? "bg-red-50/50 text-red-600/70 border-red-200/50" : "bg-red-50 text-red-600 border-red-200" 
                     : isPast ? "bg-emerald-50/50 text-emerald-600/70 border-emerald-200/50" : "bg-emerald-50 text-emerald-600 border-emerald-200"
                 )}>
                   {evt.type === 'public' ? t("publicHolidays") : t("islamicEvents")}
                 </span>
                 
                 {isTodayEvent ? (
                   <span className="px-2.5 py-0.5 rounded-full bg-[var(--md-sys-color-primary)] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                     <CalendarDays size={12} /> {t("today")}
                   </span>
                 ) : isPast ? (
                   <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                     <CheckCircle2 size={12} /> {t("passed")}
                   </span>
                 ) : (
                   <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                     <Clock size={12} /> {t("upcoming")}
                   </span>
                 )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
