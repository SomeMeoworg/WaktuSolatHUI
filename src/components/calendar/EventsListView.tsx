import { useState, useMemo } from "react";
import { format, eachDayOfInterval, startOfYear, endOfYear, startOfDay } from "date-fns";
import { ms, enUS } from "date-fns/locale";
import { motion } from "motion/react";
import { CalendarDays, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { getAllEventsForDay } from "../../lib/holidays";
import { cn } from "../../lib/utils";
import { useAppContext } from "../../AppContext";
import { useVisualStyle, useIconStroke } from "../../hooks/useVisualStyle";

interface EventsListViewProps {
  currentDate: Date;
  type: "public" | "islamic" | "all";
}

export function EventsListView({ currentDate, type }: EventsListViewProps) {
  const { t, settings } = useAppContext();
  const visualStyle = useVisualStyle();
  const iconStroke = useIconStroke();
  
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
     
    // Sort events by date
    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [currentDate, type]);

  const today = startOfDay(new Date());

  if (eventsList.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center p-12 text-center bg-content2 border border-divider rounded-3xl mt-4 select-none",
        visualStyle === "glass" && "bg-[var(--glass-bg)] backdrop-blur-md border-[var(--glass-border)] shadow-inner"
      )}>
        <AlertCircle size={36} className="text-[var(--app-outline)]/50 mb-3" />
        <p className="text-[var(--app-outline)] font-black text-sm uppercase tracking-widest">
          {t("noData")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5 mt-4 pb-8 w-full max-w-4xl mx-auto">
      {eventsList.map((evt, idx) => {
        const isPast = evt.date < today;
        const isTodayEvent = evt.date.getTime() === today.getTime();
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.03, 0.4), type: "spring", stiffness: 350, damping: 25 }}
            key={`${evt.date.toISOString()}-${evt.title}`}
            className={cn(
               "flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 p-4 sm:p-5 rounded-[22px] border transition-all duration-300 relative overflow-hidden select-none shadow-xs hover:shadow-md",
               isTodayEvent 
                 ? "bg-[var(--app-primary-container, hsl(var(--heroui-primary) / 0.15))]/15 border-primary ring-2 ring-[var(--app-primary)]/20 shadow-md" 
                 : isPast 
                   ? "bg-[var(--app-surface-variant)]/10 border-divider opacity-45 grayscale-[25%]"
                   : "bg-content1 border-divider hover:border-primary/25",
               visualStyle === "glass" && "bg-[var(--glass-bg)]/40 backdrop-blur-md border-[var(--glass-border)]",
               visualStyle === "retro" && "border-2 border-[var(--app-foreground)] rounded-none shadow-[2px_2px_0px_0px_var(--app-foreground)]"
            )}
          >
            {isTodayEvent && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_8px_var(--app-primary)]" />}

            {/* Date block */}
            <div className={cn("flex items-center gap-4 min-w-[110px] shrink-0", isPast && "opacity-75")}>
               <div className={cn(
                 "w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-xs shrink-0 select-none",
                 evt.type === 'public' 
                   ? "bg-[var(--app-danger-container, hsl(var(--heroui-danger) / 0.15))] text-[var(--app-danger)] border border-[var(--app-danger)]/10" 
                   : "bg-[var(--app-primary-container, hsl(var(--heroui-primary) / 0.15))] text-primary border border-primary/10",
                 isPast && "bg-gray-100 text-gray-500 border-gray-200"
               )}>
                 <span className="text-[8px] font-black uppercase tracking-wider">{format(evt.date, "MMM", { locale: settings.language === 'ms' ? ms : enUS })}</span>
                 <span className="text-xl font-black leading-none mt-0.5">{format(evt.date, "dd")}</span>
               </div>
               <div className="flex flex-col sm:hidden">
                 <span className="text-xs font-black opacity-80 uppercase tracking-widest text-[var(--app-outline)]">{format(evt.date, "EEEE", { locale: settings.language === 'ms' ? ms : enUS })}</span>
               </div>
            </div>
            
            {/* Week day label (desktop) */}
            <div className="hidden sm:block min-w-[90px] shrink-0">
              <span className="text-xs font-black opacity-70 uppercase tracking-widest text-[var(--app-outline)]">{format(evt.date, "EEEE", { locale: settings.language === 'ms' ? ms : enUS })}</span>
            </div>
            
            {/* Event Name & Badges */}
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              <span className={cn(
                "font-black text-base sm:text-lg truncate leading-snug",
                isPast ? "text-[var(--app-outline)] line-through decoration-[var(--app-outline)]/40 opacity-75" : "text-foreground"
              )}>
                {evt.title}
              </span>
              <div className="flex flex-wrap gap-1.5 items-center">
                 <span className={cn(
                   "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                   evt.type === 'public' 
                     ? isPast ? "bg-red-50/20 text-red-500/70 border-red-200/30" : "bg-[var(--app-danger-container, hsl(var(--heroui-danger) / 0.15))]/20 text-[var(--app-danger)] border-[var(--app-danger)]/10" 
                     : isPast ? "bg-emerald-50/20 text-emerald-500/70 border-emerald-200/30" : "bg-[var(--app-primary-container, hsl(var(--heroui-primary) / 0.15))]/20 text-primary border-primary/10"
                 )}>
                   {evt.type === 'public' ? t("publicHolidays") : t("islamicEvents")}
                 </span>
                 
                 {isTodayEvent ? (
                   <span className="px-2 py-0.5 rounded bg-primary text-white text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                     <CalendarDays size={10} /> {t("today")}
                   </span>
                 ) : isPast ? (
                   <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                     <CheckCircle2 size={10} /> {t("passed")}
                   </span>
                 ) : (
                   <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                     <Clock size={10} strokeWidth={iconStroke} /> {t("upcoming")}
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
