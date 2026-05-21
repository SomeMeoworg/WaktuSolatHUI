import { motion } from "motion/react";
import { parse, isSameWeek, format } from "date-fns";
import { ms, enUS } from "date-fns/locale";
import { CalendarDays, Info } from "lucide-react";
import { PrayerData, PrayerKey } from "../../types";
import { PRAYER_NAMES, PRAYER_ICONS } from "../PrayerSchedule";
import { getIslamicEvent, getHijriFormatted } from "../../lib/holidays";
import { cn } from "../../lib/utils";
import { useAppContext } from "../../AppContext";

interface PrayerTimesListViewProps {
  data: PrayerData[];
  view?: "daily" | "weekly" | "monthly";
  isLoading: boolean;
  onPrayerSelect: (prayer: { key: PrayerKey; time: string; dateValue: string; hijriValue: string }) => void;
}

export function PrayerTimesListView({ data, view = "monthly", isLoading, onPrayerSelect }: PrayerTimesListViewProps) {
  const { t, settings } = useAppContext();
  const timesToDisplay: PrayerKey[] = ["imsak", "fajr", "syuruk", "dhuhr", "asr", "maghrib", "isha"];

  if (data.length === 0 && !isLoading) {
    return (
      <div className="p-12 flex items-center justify-center bg-[var(--md-sys-color-surface)] shadow-sm rounded-4xl border border-[var(--md-sys-color-outline)]/20">
        <p className="text-[var(--md-sys-color-on-surface-variant)] font-medium">
          {t("noData")}
        </p>
      </div>
    );
  }

  if (view === "daily") {
    const day = data[0];
    if (!day) return null;
    const isToday = day.date === format(new Date(), "dd-MMM-yyyy");
    const evt = getIslamicEvent(day.hijri);

    return (
      <div className="flex flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={cn(
            "bg-[var(--md-sys-color-surface)] rounded-[var(--md-sys-shape-corner-extra-large)] p-8 md:p-12 flex flex-col items-center text-center gap-4 relative overflow-hidden",
            isToday && "bg-[var(--md-sys-color-primary-container)]/40 ring-4 ring-[var(--md-sys-color-primary)]/20"
          )}>
          {isToday && <div className="absolute top-0 left-0 w-full h-2 bg-[var(--md-sys-color-primary)] shadow-[0_0_20px_var(--md-sys-color-primary)]" />}
          
          <div className="flex flex-col items-center gap-1">
             <span className="text-sm md:text-base font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest">
               {format(parse(day.date, "dd-MMM-yyyy", new Date()), "EEEE", { locale: settings.language === 'ms' ? ms : enUS })}
             </span>
             <h3 className="text-3xl md:text-5xl font-black text-[var(--md-sys-color-on-surface)] tracking-tighter">
               {format(parse(day.date, "dd-MMM-yyyy", new Date()), "dd MMMM yyyy", { locale: settings.language === 'ms' ? ms : enUS })}
             </h3>
          </div>
          
          <div className="flex items-center gap-2 mt-2 px-6 py-3 bg-[var(--md-sys-color-surface-variant)] rounded-full border border-[var(--md-sys-color-outline)]/10 text-[var(--md-sys-color-on-surface-variant)] shadow-inner">
             {(!settings.hijriFormat || settings.hijriFormat === 'both' || settings.hijriFormat === 'text') && (
               <span className="font-semibold text-sm md:text-base">{getHijriFormatted(day.hijri, "text", settings.language)}</span>
             )}
             {(!settings.hijriFormat || settings.hijriFormat === 'both') && (
               <span className="opacity-40">•</span>
             )}
             {(!settings.hijriFormat || settings.hijriFormat === 'both' || settings.hijriFormat === 'number') && (
               <span className="font-mono font-medium text-xs md:text-sm opacity-80">{day.hijri}</span>
             )}
          </div>

          {evt && (
            <div className={`mt-3 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold text-white uppercase tracking-widest shadow-sm ${evt.color || 'bg-[var(--md-sys-color-primary)]'}`}>
              {evt.title}
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {timesToDisplay.map((k, idx) => {
            const Icon = PRAYER_ICONS[k];
            const timeStr = day[k as keyof PrayerData] as string;
            if (!timeStr || !Icon) return null;
            return (
              <motion.button
                key={k}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05, type: "spring", stiffness: 350, damping: 22 }}
                whileHover={{ scale: 1.06, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onPrayerSelect({ key: k as PrayerKey, time: timeStr.substring(0, 5), dateValue: day.date, hijriValue: day.hijri })}
                className={cn(
                  "relative bg-[var(--md-sys-color-surface-container)] rounded-[var(--md-sys-shape-corner-extra-large)] p-6 flex flex-col items-center gap-3 overflow-hidden focus:outline-none focus:ring-4 focus:ring-[var(--md-sys-color-primary)]",
                  isToday ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]" : ""
                )}
              >
                {/* @ts-ignore */}
                <md-ripple></md-ripple>
                <div className="p-3 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] relative z-10">
                  <Icon size={24} />
                </div>
                <div className="flex flex-col items-center z-10">
                  <span className="text-sm font-bold opacity-80 uppercase tracking-widest">{t(k)}</span>
                  <span className="text-2xl md:text-3xl font-black font-mono tracking-tighter mt-1">{timeStr ? timeStr.substring(0, 5) : "--:--"}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === "weekly") {
    return (
      <div className="flex flex-col gap-4">
        {data.map((day, idx) => {
          const isToday = day.date === format(new Date(), "dd-MMM-yyyy");
          const evt = getIslamicEvent(day.hijri);
          
          return (
              <motion.div 
              key={day.date}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
              className={cn(
                 "bg-[var(--md-sys-color-surface-container)] rounded-[var(--md-sys-shape-corner-extra-large)] p-6 lg:p-8 flex flex-col lg:flex-row gap-5 lg:items-center relative overflow-hidden",
                 isToday ? "bg-[var(--md-sys-color-primary-container)]/30 ring-4 ring-[var(--md-sys-color-primary)]/40" : ""
              )}
            >
              <div className="flex flex-col min-w-[200px] shrink-0 gap-0.5">
                <span className={cn("font-black text-xl lg:text-2xl", isToday ? "text-[var(--md-sys-color-primary)]" : "text-[var(--md-sys-color-on-surface)]")}>
                  {format(parse(day.date, "dd-MMM-yyyy", new Date()), "dd MMMM", { locale: settings.language === 'ms' ? ms : enUS })}
                </span>
                <span className="text-sm font-black opacity-80 uppercase tracking-widest text-[var(--md-sys-color-on-surface-variant)]">
                  {format(parse(day.date, "dd-MMM-yyyy", new Date()), "EEEE", { locale: settings.language === 'ms' ? ms : enUS })}
                </span>
                <span className="text-xs font-mono opacity-60 mt-1">
                  {(!settings.hijriFormat || settings.hijriFormat === 'both' || settings.hijriFormat === 'text') && getHijriFormatted(day.hijri, "text", settings.language)}
                  {(!settings.hijriFormat || settings.hijriFormat === 'both') && " • "}
                  {(!settings.hijriFormat || settings.hijriFormat === 'both' || settings.hijriFormat === 'number') && day.hijri}
                </span>
                
                {evt && (
                  <span className={`mt-2 inline-flex w-fit px-2.5 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-wider shadow-sm ${evt.color || 'bg-[var(--md-sys-color-primary)]'}`}>
                    {evt.title}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 lg:gap-3 flex-1 lg:justify-end mt-2 lg:mt-0">
                {timesToDisplay.map((k) => {
                  const Icon = PRAYER_ICONS[k];
                  return (
                    <motion.button
                      key={k}
                      whileHover={{ scale: 1.06, y: -3 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      onClick={() => onPrayerSelect({
                        key: k,
                        time: day[k] ? day[k].substring(0, 5) : "--:--",
                        dateValue: day.date,
                        hijriValue: day.hijri
                      })}
                      className={cn(
                        "relative flex items-center gap-2 p-3 rounded-[var(--md-sys-shape-corner-extra-large)] bg-[var(--md-sys-color-surface-variant)]/30 flex-1 min-w-[90px] justify-center lg:justify-start lg:flex-none overflow-hidden focus:outline-none focus:ring-4 focus:ring-[var(--md-sys-color-primary)]",
                        isToday && "bg-[var(--md-sys-color-surface)]"
                      )}
                    >
                      {/* @ts-ignore */}
                      <md-ripple></md-ripple>
                      <div className="p-1.5 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] relative z-10">
                        <Icon size={14} />
                      </div>
                      <div className="flex flex-col items-center lg:items-start leading-none z-10">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{t(k)}</span>
                        <span className="font-mono font-black text-sm lg:text-base mt-0.5">{day[k] ? day[k].substring(0, 5) : "--:--"}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // Monthly View (Table)
  return (
    <div className="w-full overflow-x-auto bg-[var(--md-sys-color-surface-container)] rounded-[var(--md-sys-shape-corner-extra-large)] p-3 sm:p-5 md:p-8">
      <table className="w-full text-left border-collapse min-w-[800px] sm:min-w-[950px]">
        <thead>
          <tr className="border-b-2 border-[var(--md-sys-color-primary)]/20 text-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface-variant)]/30">
            <th className="py-3 px-3 sm:py-4 sm:px-5 font-black uppercase tracking-wider text-[10px] sm:text-xs w-[120px] sm:w-[140px] rounded-tl-2xl">{t("gregorianDate")}</th>
            <th className="py-3 px-3 sm:py-4 sm:px-5 font-black uppercase tracking-wider text-[10px] sm:text-xs w-[140px] sm:w-[160px]">{t("hijriDate")}</th>
            <th className="py-3 px-3 sm:py-4 sm:px-5 font-black uppercase tracking-wider text-[10px] sm:text-xs w-[80px] sm:w-[100px]">{t("day")}</th>
            {timesToDisplay.map((k, i) => (
              <th key={k} className={cn("py-4 px-3 font-black uppercase tracking-wider text-xs text-center", i === timesToDisplay.length - 1 && "rounded-tr-2xl")}>{t(k)}</th>
            ))}
          </tr>
        </thead>
        <tbody className={isLoading ? "opacity-50 transition-opacity" : "transition-opacity"}>
          {data.map((day, idx) => {
            const isToday = day.date === format(new Date(), "dd-MMM-yyyy");
            const dateObj = parse(day.date, "dd-MMM-yyyy", new Date());
            const isCurrentWeekDay = isSameWeek(dateObj, new Date(), { weekStartsOn: 1 });
            const evt = getIslamicEvent(day.hijri);
            
            return (
              <motion.tr 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                key={day.date}
                className={cn(
              "border-b border-[var(--md-sys-color-outline)]/10 transition-colors group relative hover:shadow-[0_4px_12px_-4px_var(--md-sys-color-primary)] hover:border-transparent hover:rounded-2xl hover:z-10",
              isToday 
                ? "bg-[var(--md-sys-color-primary-container)]/50 hover:bg-[var(--md-sys-color-primary-container)]/80 text-[var(--md-sys-color-on-primary-container)] ring-2 ring-[var(--md-sys-color-primary)]/40 hover:ring-2 hover:ring-[var(--md-sys-color-primary)]/40 z-10" 
                : isCurrentWeekDay
                  ? "bg-[var(--md-sys-color-secondary-container)]/15 hover:bg-[var(--md-sys-color-secondary-container)]/40" 
                  : "hover:bg-[var(--md-sys-color-surface-variant)]/60"
                )}
              >
                <td className="py-4 px-5 tabular-nums relative">
                  {isToday && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--md-sys-color-primary)] rounded-r-full shadow-[0_0_8px_var(--md-sys-color-primary)]"></div>}
                  <div className={cn("font-black text-sm lg:text-base tracking-tight", isToday && "text-[var(--md-sys-color-primary)] drop-shadow-sm")}>{format(dateObj, "dd MMM yyyy", { locale: settings.language === 'ms' ? ms : enUS })}</div>
                  {isToday && <span className="mt-1 flex gap-1.5 items-center px-2.5 py-1 bg-[var(--md-sys-color-primary)] text-white text-[10px] rounded-md uppercase tracking-widest font-black w-fit shadow-md"><CalendarDays size={12} strokeWidth={2.5}/> {t("today")}</span>}
                </td>
                <td className="py-4 px-5">
                  <div className="flex flex-col gap-0.5">
                    {(!settings.hijriFormat || settings.hijriFormat === 'both' || settings.hijriFormat === 'text') && (
                      <span className="text-sm font-black whitespace-nowrap">{getHijriFormatted(day.hijri, "text", settings.language)}</span>
                    )}
                    {(!settings.hijriFormat || settings.hijriFormat === 'both' || settings.hijriFormat === 'number') && (
                      <span className="text-[10px] font-mono font-black opacity-60 tabular-nums">{day.hijri}</span>
                    )}
                  </div>
                  {evt && (
                    <div className="mt-1.5 flex">
                      <motion.span 
                        animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }} 
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-black text-white uppercase tracking-widest shadow-md origin-left ${evt.color || 'bg-[var(--md-sys-color-primary)]'}`}
                      >
                        {evt.title}
                      </motion.span>
                    </div>
                  )}
                </td>
                <td className="py-4 px-5 text-sm opacity-80 font-black uppercase tracking-widest">
                  {format(dateObj, "EEEE", { locale: settings.language === 'ms' ? ms : enUS })}
                </td>
                {timesToDisplay.map((k) => {
                  const Icon = PRAYER_ICONS[k];
                  return (
                    <td key={k} className="py-1.5 px-0.5 lg:px-1.5 text-center align-middle">
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: (idx % 2 === 0 ? 3 : -3) }}
                        whileTap={{ scale: 0.9, rotate: 0 }}
                        onClick={() => onPrayerSelect({
                          key: k,
                          time: day[k] ? day[k].substring(0, 5) : "--:--",
                          dateValue: day.date,
                          hijriValue: day.hijri
                        })}
                        className={cn(
                          "relative w-full py-2 px-1 lg:py-2.5 flex flex-col xl:flex-row items-center justify-center gap-1 xl:gap-2 rounded-[var(--md-sys-shape-corner-medium)] overflow-hidden focus:outline-none focus:ring-4 focus:ring-[var(--md-sys-color-primary)] focus:ring-offset-1",
                          isToday 
                            ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]" 
                            : "bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]"
                        )}
                        title={t(k)}
                      >
                        {/* @ts-ignore */}
                        <md-ripple></md-ripple>
                        <Icon size={18} strokeWidth={2.5} className={cn(
                          "shrink-0",
                          isToday ? "text-[var(--md-sys-color-primary)]" : "text-[var(--md-sys-color-on-surface-variant)]"
                        )} />
                        <span className="tabular-nums font-mono text-[11px] sm:text-xs lg:text-sm xl:text-base font-black whitespace-nowrap">{day[k] ? day[k].substring(0, 5) : "--:--"}</span>
                      </motion.button>
                    </td>
                  );
                })}
              </motion.tr>
            );
          })}
        </tbody>
      </table>
      
      {data.length === 0 && !isLoading && (
        <div className="p-12 flex items-center justify-center">
          <p className="text-[var(--md-sys-color-on-surface-variant)] font-medium">
            {t("noData")}
          </p>
        </div>
      )}
    </div>
  );
}
