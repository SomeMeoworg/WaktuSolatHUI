import { useState, useMemo } from "react";
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, isToday } from "date-fns";
import { ms, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import { PrayerData } from "../../types";
import { getAllEventsForDay } from "../../lib/holidays";
import { cn } from "../../lib/utils";
import { useAppContext } from "../../AppContext";

interface CalendarGridViewProps {
  currentDate: Date;
  monthData: PrayerData[];
  onSelectDay: (day: PrayerData) => void;
  isLoading?: boolean;
}

export function CalendarGridView({ currentDate, monthData, onSelectDay, isLoading }: CalendarGridViewProps) {
  const { settings } = useAppContext();
  
  // We need to build a grid.
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }
  
  const dayNames = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      // 2024-01-01 was a Monday
      return format(addDays(new Date(2024, 0, 1), i), "EEEE", { locale: settings.language === 'ms' ? ms : enUS });
    });
  }, [settings.language]);
  
  // Create a map to easily look up PrayerData by date string
  const dataMap = useMemo(() => {
    const map = new Map<string, PrayerData>();
    monthData.forEach(d => {
      // Date format is "dd-MMM-yyyy", e.g., "15-May-2024"
      // Wait, we need to map Date object format to Jakim format
      // Actually date-fns format(d, "dd-MMM-yyyy") produces English month names (e.g., "May")
      // But Jakim might return Malay names or English depending?
      // Let's use the object date strings. Let's just index to exactly match if possible, or parse Jakim date.
      // Usually Jakim returns "dd-MMM-yyyy" in English (e.g. "01-Jan-2024")
      map.set(d.date.toLowerCase(), d);
    });
    return map;
  }, [monthData]);

  // Format Date to match Jakim format (e.g. "01-Jan-2024")
  const toJakimDateString = (d: Date) => {
     return format(d, "dd-MMM-yyyy").toLowerCase();
  };

  return (
    <div className={cn("flex flex-col w-full h-full min-h-[400px]", isLoading && "opacity-50 pointer-events-none")}>
      <div className="grid grid-cols-7 border-b border-[var(--md-sys-color-outline)]/10 mb-2">
        {dayNames.map((dayName, idx) => (
          <div key={dayName} className={cn(
            "py-3 text-center text-xs sm:text-sm font-bold uppercase tracking-wider",
            idx >= 5 ? "text-red-500/80" : "text-[var(--md-sys-color-on-surface-variant)]"
          )}>
            <span className="hidden sm:inline">{dayName}</span>
            <span className="sm:hidden">{dayName.slice(0, 3)}</span>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 flex-1 auto-rows-[minmax(64px,1fr)] sm:auto-rows-[minmax(80px,1fr)] lg:auto-rows-[minmax(110px,1fr)] gap-2 lg:gap-3">
        {days.map((d, i) => {
           const isCurrentMonth = isSameMonth(d, monthStart);
           const isCurrentDay = isToday(d);
           const formattedDate = format(d, "d");
           
           const jakimDateStr = toJakimDateString(d);
           const pData = dataMap.get(jakimDateStr);
           
           let hijriParts = null;
           let events: any[] = [];
           
           if (pData) {
             const hijriDate = pData.hijri; // e.g. "1445-09-01"
             hijriParts = hijriDate.split('-');
             events = getAllEventsForDay(d, hijriDate);
           } else {
             events = getAllEventsForDay(d, null);
           }
           
           const hasPublicHoliday = events.some(e => e.type === 'public');

           return (
             <motion.div
               key={d.toISOString()}
               whileHover={{ scale: isCurrentMonth ? 1.05 : 1, zIndex: 50, rotate: isCurrentMonth ? (i % 2 === 0 ? 2 : -2) : 0 }}
               whileTap={{ scale: isCurrentMonth ? 0.95 : 1 }}
               onClick={() => {
                 if (pData) onSelectDay(pData);
               }}
               className={cn(
                 "relative flex flex-col p-2 sm:p-3 rounded-[1rem] sm:rounded-[1.5rem] transition-colors cursor-pointer overflow-hidden group shadow-sm ring-1 ring-[var(--md-sys-color-outline)]/5",
                 isCurrentMonth 
                    ? "bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] text-[var(--md-sys-color-on-surface)]" 
                    : "bg-[var(--md-sys-color-surface-container-lowest)] opacity-50 text-[var(--md-sys-color-on-surface-variant)]/40 hover:bg-[var(--md-sys-color-surface-container-low)]",
                 isCurrentDay && "ring-4 ring-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] z-10 hover:bg-[var(--md-sys-color-primary-container)] shadow-md"
               )}
             >
               <div className="flex justify-between items-start">
                  <span className={cn(
                    "text-base sm:text-lg lg:text-2xl font-black tabular-nums transition-colors tracking-tighter",
                    isCurrentDay && "text-[var(--md-sys-color-primary)]",
                    !isCurrentDay && hasPublicHoliday && isCurrentMonth && "text-red-500",
                    isCurrentMonth && !isCurrentDay && !hasPublicHoliday && "group-hover:text-[var(--md-sys-color-primary)]"
                  )}>
                    {formattedDate}
                  </span>
                  
                  {hijriParts && isCurrentMonth && (
                    <span className="text-[10px] sm:text-xs font-black text-[var(--md-sys-color-on-surface-variant)] opacity-60 mt-1 tabular-nums group-hover:text-[var(--md-sys-color-primary)] transition-colors">
                       {parseInt(hijriParts[2])}
                    </span>
                  )}
               </div>
               
               <div className="flex flex-col gap-1 mt-auto shrink-0 z-10 w-full overflow-hidden">
                 {events.slice(0, 2).map((evt, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg truncate font-black tracking-widest uppercase text-white w-full shadow-sm",
                        evt.type === 'public' ? "bg-red-500" : evt.color || "bg-[var(--md-sys-color-primary)]"
                      )}
                      title={evt.title}
                    >
                      {evt.title}
                    </div>
                 ))}
                 {events.length > 2 && (
                    <div className="text-[8px] sm:text-[10px] font-black uppercase text-[var(--md-sys-color-on-surface-variant)] ml-1">
                      +{events.length - 2} {settings.language === 'ms' ? 'lagi' : 'more'}
                    </div>
                 )}
               </div>
             </motion.div>
           );
        })}
      </div>
    </div>
  );
}
