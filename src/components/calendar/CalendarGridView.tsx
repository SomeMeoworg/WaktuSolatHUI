import { useState, useMemo } from "react";
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, isToday } from "date-fns";
import { ms, enUS } from "date-fns/locale";
import { motion } from "motion/react";
import { PrayerData } from "../../types";
import { getAllEventsForDay } from "../../lib/holidays";
import { cn } from "../../lib/utils";
import { useAppContext } from "../../AppContext";
import { useVisualStyle } from "../../hooks/useVisualStyle";

interface CalendarGridViewProps {
  currentDate: Date;
  monthData: PrayerData[];
  onSelectDay: (day: PrayerData) => void;
  isLoading?: boolean;
}

export function CalendarGridView({ currentDate, monthData, onSelectDay, isLoading }: CalendarGridViewProps) {
  const { settings } = useAppContext();
  const visualStyle = useVisualStyle();
  
  // Build 6-row calendar grid starting from Monday
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = useMemo(() => {
    const list = [];
    let day = startDate;
    while (day <= endDate) {
      list.push(day);
      day = addDays(day, 1);
    }
    return list;
  }, [startDate, endDate]);
  
  const dayNames = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      return format(addDays(new Date(2024, 0, 1), i), "EEEE", { locale: settings.language === 'ms' ? ms : enUS });
    });
  }, [settings.language]);
  
  // Lookup map to quickly retrieve prayer times by date string
  const dataMap = useMemo(() => {
    const map = new Map<string, PrayerData>();
    monthData.forEach(d => {
      map.set(d.date.toLowerCase(), d);
    });
    return map;
  }, [monthData]);

  const toJakimDateString = (d: Date) => {
     return format(d, "dd-MMM-yyyy").toLowerCase();
  };

  return (
    <div className={cn("flex flex-col w-full h-full min-h-0 flex-1 transition-opacity duration-300", isLoading && "opacity-40 pointer-events-none")}>
      {/* Week Day Headers */}
      <div className="grid grid-cols-7 border-b border-divider mb-1 sm:mb-2 pb-0.5 sm:pb-1 shrink-0">
        {dayNames.map((dayName, idx) => {
          const isWeekend = idx >= 5; 
          return (
            <div key={dayName} className={cn(
              "py-1.5 sm:py-2 text-center text-[9px] sm:text-xs font-black uppercase tracking-widest transition-colors select-none",
              isWeekend 
                ? "text-[var(--app-danger)]" 
                : "text-[var(--app-outline)]/70"
            )}>
              <span className="hidden sm:inline">{dayName}</span>
              <span className="sm:hidden">{dayName.slice(0, 3)}</span>
            </div>
          );
        })}
      </div>
      
      {/* Day Cells Grid - Scroll-free h-full flex layout */}
      <div className="flex-1 min-h-0 w-full overflow-hidden relative">
        <motion.div 
          key={currentDate.toISOString()} // Key resets animation on month change
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} // Highly optimized out-quintic bezier
          style={{ willChange: "transform, opacity" }}
          className="grid grid-cols-7 grid-rows-6 gap-1.5 sm:gap-2.5 h-full w-full justify-items-center items-center sm:justify-items-stretch sm:items-stretch"
        >
          {days.map((d, i) => {
            const isCurrentMonth = isSameMonth(d, monthStart);
            const isCurrentDay = isToday(d);
            const formattedDate = format(d, "d");
            
            const jakimDateStr = toJakimDateString(d);
            const pData = dataMap.get(jakimDateStr);
            
            let hijriParts = null;
            let events: any[] = [];
            
            if (pData) {
              const hijriDate = pData.hijri; 
              hijriParts = hijriDate.split('-');
              events = getAllEventsForDay(d, hijriDate);
            } else {
              events = getAllEventsForDay(d, null);
            }
            
            const hasPublicHoliday = events.some(e => e.type === 'public');

            return (
              <div
                key={d.toISOString()}
                onClick={() => {
                  if (pData) onSelectDay(pData);
                }}
                className={cn(
                  "relative flex flex-col items-center sm:items-stretch transition-all border border-divider select-none group cursor-pointer",
                  // Mobile Sizing: Compact Circle. Desktop Sizing: Spacious Square tile
                  "w-full aspect-square max-w-[40px] sm:max-w-none sm:aspect-auto sm:h-full justify-center sm:justify-between p-1 sm:p-2 rounded-full sm:rounded-2xl",
                  // Colors
                  isCurrentMonth 
                    ? "text-foreground" 
                    : "opacity-35 text-[var(--app-outline)]/20 hover:opacity-50",
                  isCurrentDay 
                    ? "bg-primary text-primary-foreground shadow-md shadow-[var(--app-primary)]/20 font-bold z-[2]"
                    : isCurrentMonth
                      ? "bg-content2 hover:bg-[var(--app-primary-container, hsl(var(--heroui-primary) / 0.15))]/10"
                      : "bg-content1/40",
                  // Visual Styles adaptation
                  visualStyle === "retro" && "border-2 border-[var(--app-foreground)] rounded-none shadow-[2px_2px_0px_0px_var(--app-foreground)] sm:hover:translate-y-[-2px] sm:hover:shadow-[4px_4px_0px_0px_var(--app-foreground)]",
                  visualStyle === "glass" && isCurrentMonth && !isCurrentDay && "bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border-[var(--glass-border)]",
                  visualStyle === "soft" && !isCurrentDay && "shadow-[var(--soft-shadow-light)]"
                )}
              >
                {/* Top Row: Date labels (centered on mobile, split on desktop) */}
                <div className="flex justify-center sm:justify-between items-center sm:items-start shrink-0 w-full">
                  <span className={cn(
                    "text-xs sm:text-sm lg:text-lg font-black tabular-nums tracking-tighter transition-all",
                    isCurrentDay ? "text-primary-foreground scale-110" : !isCurrentMonth ? "text-[var(--app-outline)]/40" : "",
                    !isCurrentDay && hasPublicHoliday && isCurrentMonth && "text-[var(--app-danger)]",
                    isCurrentMonth && !isCurrentDay && !hasPublicHoliday && "group-hover:text-primary"
                  )}>
                    {formattedDate}
                  </span>
                  
                  {hijriParts && isCurrentMonth && (
                    <span className={cn(
                      "hidden sm:inline text-[9px] font-black opacity-50 tabular-nums group-hover:text-primary transition-colors",
                      isCurrentDay ? "text-primary-foreground opacity-80" : "text-[var(--app-outline)]"
                    )}>
                       {parseInt(hijriParts[2], 10)}
                    </span>
                  )}
                </div>
                
                {/* Event Indicators Row (centered under date) */}
                <div className="flex flex-col justify-end w-full shrink-0 mt-0.5 sm:mt-1">
                  {/* Circle Dots representing holidays (perfect for mobile & tablet/desktop) */}
                  <div className="flex gap-1 justify-center sm:justify-start items-center h-1.5 overflow-hidden">
                    {events.map((evt, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0",
                          evt.type === 'public' 
                            ? isCurrentDay ? "bg-white" : "bg-[var(--app-danger)]" 
                            : isCurrentDay ? "bg-white" : "bg-primary"
                        )}
                        title={evt.title}
                      />
                    ))}
                  </div>

                  {/* Horizontal pill badge describing first holiday on large screens */}
                  <div className="hidden lg:flex flex-col gap-1 w-full mt-1.5 overflow-hidden">
                    {events.slice(0, 1).map((evt, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "text-[8px] px-1 py-0.5 rounded-md truncate font-black tracking-wider uppercase text-white shadow-xs w-full text-left select-none",
                          evt.type === 'public' 
                            ? "bg-[var(--app-danger)]" 
                            : "bg-primary"
                        )}
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
