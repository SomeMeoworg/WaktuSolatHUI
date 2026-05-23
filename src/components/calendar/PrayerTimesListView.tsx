import { useState } from "react";
import { motion } from "motion/react";
import { parse, isSameWeek, format } from "date-fns";
import { ms, enUS } from "date-fns/locale";
import { CalendarDays, Info, Copy, Check, Clock } from "lucide-react";
import { PrayerData, PrayerKey } from "../../types";
import { PRAYER_NAMES, PRAYER_ICONS } from "../PrayerSchedule";
import { getIslamicEvent, getHijriFormatted } from "../../lib/holidays";
import { cn } from "../../lib/utils";
import { useAppContext } from "../../AppContext";
import { useVisualStyle, useIconStroke } from "../../hooks/useVisualStyle";

interface PrayerTimesListViewProps {
  data: PrayerData[];
  view?: "daily" | "weekly" | "monthly";
  isLoading: boolean;
  onPrayerSelect: (prayer: { key: PrayerKey; time: string; dateValue: string; hijriValue: string }) => void;
}

export function PrayerTimesListView({ data, view = "monthly", isLoading, onPrayerSelect }: PrayerTimesListViewProps) {
  const { t, settings } = useAppContext();
  const isMalay = settings.language === "ms";
  const visualStyle = useVisualStyle();
  const iconStroke = useIconStroke();
  const timesToDisplay: PrayerKey[] = ["imsak", "fajr", "syuruk", "dhuhr", "asr", "maghrib", "isha"];

  // State to track individual row copying success
  const [copiedRowDate, setCopiedRowDate] = useState<string | null>(null);

  const handleCopyDaySchedule = (day: PrayerData) => {
    const formattedHijri = getHijriFormatted(day.date, settings.hijriMethod, settings.hijriAdjustment, settings.hijriFormat || "both", settings.language);
    let text = `${day.date.replace(/-/g, " ")} (${formattedHijri} - ${day.day})\n`;
    timesToDisplay.forEach(k => {
      text += `${t(k)}: ${day[k] ? day[k].substring(0, 5) : "--:--"}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopiedRowDate(day.date);
      setTimeout(() => setCopiedRowDate(null), 2000);
    });
  };

  if (data.length === 0 && !isLoading) {
    return (
      <div className={cn(
        "p-12 flex items-center justify-center bg-[var(--md-sys-color-surface-container)] shadow-sm rounded-3xl border border-[var(--md-sys-color-outline)]/12",
        visualStyle === "glass" && "bg-[var(--glass-bg)] backdrop-blur-md border-[var(--glass-border)]"
      )}>
        <p className="text-[var(--md-sys-color-on-surface-variant)] font-black text-sm uppercase tracking-widest text-center">
          {t("noData")}
        </p>
      </div>
    );
  }

  // Daily View Redesign
  if (view === "daily") {
    const day = data[0];
    if (!day) return null;
    const isToday = day.date === format(new Date(), "dd-MMM-yyyy");
    const evt = getIslamicEvent(day.hijri);

    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 24 }}
          className={cn(
            "bg-[var(--md-sys-color-surface-container)] rounded-[28px] p-6 sm:p-10 flex flex-col items-center text-center gap-4 relative overflow-hidden border border-[var(--md-sys-color-outline)]/8 shadow-sm transition-all duration-300",
            isToday && "bg-gradient-to-br from-[var(--md-sys-color-primary-container)] to-[var(--md-sys-color-primary-container)]/40 ring-4 ring-[var(--md-sys-color-primary)]/20 shadow-md",
            visualStyle === "glass" && "bg-[var(--glass-bg)] backdrop-blur-md border-[var(--glass-border)]",
            visualStyle === "retro" && "border-[3px] border-[var(--md-sys-color-on-surface)] rounded-none shadow-[4px_4px_0px_0px_var(--md-sys-color-on-surface)]"
          )}>
          {isToday && <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--md-sys-color-primary)] shadow-[0_0_12px_var(--md-sys-color-primary)]" />}
          
          <div className="flex flex-col items-center gap-1 select-none">
             <span className="text-[10px] sm:text-xs font-black text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest opacity-85">
               {format(parse(day.date, "dd-MMM-yyyy", new Date()), "EEEE", { locale: settings.language === 'ms' ? ms : enUS })}
             </span>
             <h3 className="text-2xl sm:text-4xl font-black text-[var(--md-sys-color-on-surface)] tracking-tighter mt-1">
               {format(parse(day.date, "dd-MMM-yyyy", new Date()), "dd MMMM yyyy", { locale: settings.language === 'ms' ? ms : enUS })}
             </h3>
          </div>
          
          <div className="flex items-center gap-2 mt-1 px-5 py-2.5 bg-[var(--md-sys-color-surface-container-high)] rounded-full border border-[var(--md-sys-color-outline)]/8 text-[var(--md-sys-color-on-surface-variant)] shadow-inner text-xs font-bold transition-all">
             {(!settings.hijriFormat || settings.hijriFormat === 'both' || settings.hijriFormat === 'text') && (
               <span className="font-black text-xs">{getHijriFormatted(day.date, settings.hijriMethod, settings.hijriAdjustment, "text", settings.language)}</span>
             )}
             {(!settings.hijriFormat || settings.hijriFormat === 'both') && (
               <span className="opacity-40">•</span>
             )}
             {(!settings.hijriFormat || settings.hijriFormat === 'both' || settings.hijriFormat === 'number') && (
               <span className="font-mono font-black text-[10px] opacity-75">
                 {getHijriFormatted(day.date, settings.hijriMethod, settings.hijriAdjustment, "number", settings.language)}
               </span>
             )}
          </div>

          {evt && (
            <div className={`mt-2 px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-sm select-none ${evt.color || 'bg-[var(--md-sys-color-primary)]'}`}>
              {evt.title}
            </div>
          )}
        </motion.div>

        {/* Daily Grid of Clocks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full">
          {timesToDisplay.map((k, idx) => {
            const Icon = PRAYER_ICONS[k];
            const timeStr = day[k as keyof PrayerData] as string;
            if (!timeStr || !Icon) return null;
            return (
              <motion.button
                key={k}
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.04, type: "spring", stiffness: 350, damping: 24 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onPrayerSelect({ key: k as PrayerKey, time: timeStr.substring(0, 5), dateValue: day.date, hijriValue: day.hijri })}
                className={cn(
                  "relative bg-[var(--md-sys-color-surface-container)] rounded-[24px] border border-[var(--md-sys-color-outline)]/8 p-5 flex flex-col items-center gap-3.5 overflow-hidden shadow-xs hover:shadow-md cursor-pointer transition-all duration-350 focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]",
                  isToday && "bg-[var(--md-sys-color-primary-container)]/10 ring-1 ring-[var(--md-sys-color-primary)]/20",
                  visualStyle === "glass" && "bg-[var(--glass-bg)] backdrop-blur-md border-[var(--glass-border)]",
                  visualStyle === "retro" && "border-2 border-[var(--md-sys-color-on-surface)] rounded-none shadow-[2px_2px_0px_0px_var(--md-sys-color-on-surface)]"
                )}
              >
                {/* @ts-ignore */}
                <md-ripple></md-ripple>
                <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] flex items-center justify-center relative z-10 shrink-0 shadow-inner">
                  <Icon size={18} strokeWidth={iconStroke} />
                </div>
                <div className="flex flex-col items-center z-10 select-none">
                  <span className="text-[10px] font-black opacity-80 uppercase tracking-widest text-[var(--md-sys-color-on-surface-variant)]">{t(k)}</span>
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-tighter mt-1 text-[var(--md-sys-color-on-surface)]">{timeStr.substring(0, 5)}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  // Weekly List View Redesign
  if (view === "weekly") {
    return (
      <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full pb-8">
        {data.map((day, idx) => {
          const isToday = day.date === format(new Date(), "dd-MMM-yyyy");
          const evt = getIslamicEvent(day.hijri);
          
          return (
            <motion.div 
              key={day.date}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03, type: 'spring', stiffness: 350, damping: 24 }}
              className={cn(
                 "bg-[var(--md-sys-color-surface-container)] rounded-[24px] p-5 lg:p-6 flex flex-col lg:flex-row gap-4 lg:items-center relative overflow-hidden border border-[var(--md-sys-color-outline)]/8 shadow-xs hover:shadow-md transition-all duration-300",
                 isToday && "bg-[var(--md-sys-color-primary-container)]/10 ring-2 ring-[var(--md-sys-color-primary)]/35",
                 visualStyle === "glass" && "bg-[var(--glass-bg)] backdrop-blur-md border-[var(--glass-border)]",
                 visualStyle === "retro" && "border-2 border-[var(--md-sys-color-on-surface)] rounded-none shadow-[3px_3px_0px_0px_var(--md-sys-color-on-surface)]"
              )}
            >
              {isToday && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--md-sys-color-primary)]" />}

              <div className="flex flex-col min-w-[190px] shrink-0 gap-0.5 select-none">
                <span className={cn("font-black text-lg sm:text-xl tracking-tight flex items-center gap-1.5", isToday ? "text-[var(--md-sys-color-primary)]" : "text-[var(--md-sys-color-on-surface)]")}>
                  {format(parse(day.date, "dd-MMM-yyyy", new Date()), "dd MMMM", { locale: settings.language === 'ms' ? ms : enUS })}
                  {isToday && (
                    <span className="px-2 py-0.5 bg-[var(--md-sys-color-primary)] text-white text-[8px] font-black uppercase rounded-md tracking-wider flex items-center gap-1 shadow-sm">
                      <CalendarDays size={10} /> {t("today")}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-black opacity-80 uppercase tracking-widest text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  {format(parse(day.date, "dd-MMM-yyyy", new Date()), "EEEE", { locale: settings.language === 'ms' ? ms : enUS })}
                </span>
                <span className="text-[9px] font-mono font-black opacity-55 mt-1">
                  {(!settings.hijriFormat || settings.hijriFormat === 'both' || settings.hijriFormat === 'text') && getHijriFormatted(day.date, settings.hijriMethod, settings.hijriAdjustment, "text", settings.language)}
                </span>
                <span className="font-mono opacity-60 font-black">
                  {(!settings.hijriFormat || settings.hijriFormat === 'both' || settings.hijriFormat === 'number') && getHijriFormatted(day.date, settings.hijriMethod, settings.hijriAdjustment, "number", settings.language)}
                </span>
                
                {evt && (
                  <span className={`mt-2.5 inline-flex w-fit px-2.5 py-0.5 rounded-full text-[9px] font-black text-white uppercase tracking-wider shadow-sm ${evt.color || 'bg-[var(--md-sys-color-primary)]'}`}>
                    {evt.title}
                  </span>
                )}
              </div>
              
              {/* Horizontal grid list row of times */}
              <div className="flex flex-wrap gap-2 flex-1 lg:justify-end mt-2 lg:mt-0">
                {timesToDisplay.map((k) => {
                  const Icon = PRAYER_ICONS[k];
                  return (
                    <motion.button
                      key={k}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 500, damping: 24 }}
                      onClick={() => onPrayerSelect({
                        key: k,
                        time: day[k] ? day[k].substring(0, 5) : "--:--",
                        dateValue: day.date,
                        hijriValue: day.hijri
                      })}
                      className={cn(
                        "relative flex items-center gap-2 p-2.5 rounded-2xl bg-[var(--md-sys-color-surface-variant)]/35 border border-[var(--md-sys-color-outline)]/5 flex-1 min-w-[90px] justify-center lg:justify-start lg:flex-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] cursor-pointer",
                        isToday && "bg-[var(--md-sys-color-surface)]",
                        visualStyle === "retro" && "border-2 border-[var(--md-sys-color-on-surface)] rounded-none"
                      )}
                    >
                      {/* @ts-ignore */}
                      <md-ripple></md-ripple>
                      <div className="p-1 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] relative z-10 shrink-0">
                        <Icon size={12} strokeWidth={iconStroke} />
                      </div>
                      <div className="flex flex-col items-center lg:items-start leading-none z-10 select-none">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60 text-[var(--md-sys-color-on-surface-variant)]">{t(k)}</span>
                        <span className="font-mono font-black text-xs sm:text-sm mt-0.5 text-[var(--md-sys-color-on-surface)]">{day[k] ? day[k].substring(0, 5) : "--:--"}</span>
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

  // Monthly Table Redesign (Visual Masterpiece)
  return (
    <div className={cn(
      "w-full overflow-x-auto bg-[var(--md-sys-color-surface-container)] rounded-[28px] border border-[var(--md-sys-color-outline)]/8 p-3 sm:p-5 shadow-xs transition-all duration-300",
      visualStyle === "glass" && "bg-[var(--glass-bg)]/35 backdrop-blur-md border-[var(--glass-border)] shadow-inner"
    )}>
      <table className="w-full text-left border-collapse min-w-[920px] sm:min-w-[1020px]">
        <thead>
          <tr className="border-b border-[var(--md-sys-color-outline)]/12 text-[var(--md-sys-color-on-surface)]">
            <th className="py-4 px-4 font-black uppercase tracking-widest text-[9px] sm:text-xs w-[140px] text-[var(--md-sys-color-primary)]">{t("gregorianDate")}</th>
            <th className="py-4 px-4 font-black uppercase tracking-widest text-[9px] sm:text-xs w-[150px] text-[var(--md-sys-color-primary)]">{t("hijriDate")}</th>
            <th className="py-4 px-4 font-black uppercase tracking-widest text-[9px] sm:text-xs w-[100px] text-[var(--md-sys-color-primary)]">{t("day")}</th>
            {timesToDisplay.map((k) => (
              <th key={k} className="py-4 px-1 font-black uppercase tracking-widest text-[9px] sm:text-xs text-center text-[var(--md-sys-color-on-surface-variant)]">{t(k)}</th>
            ))}
            <th className="py-4 px-2 font-black uppercase tracking-widest text-[9px] sm:text-xs w-[60px] text-center text-[var(--md-sys-color-primary)]">{t("copy" as any)}</th>
          </tr>
        </thead>
        <tbody className={cn("divide-y divide-[var(--md-sys-color-outline)]/5 transition-opacity duration-300", isLoading && "opacity-40")}>
          {data.map((day, idx) => {
            const isToday = day.date === format(new Date(), "dd-MMM-yyyy");
            const dateObj = parse(day.date, "dd-MMM-yyyy", new Date());
            const isCurrentWeekDay = isSameWeek(dateObj, new Date(), { weekStartsOn: 1 });
            const evt = getIslamicEvent(day.hijri);
            
            return (
              <motion.tr 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.015, 0.4), type: "spring", stiffness: 400, damping: 25 }}
                key={day.date}
                className={cn(
                  "transition-all duration-200 group relative border-b border-[var(--md-sys-color-outline)]/4",
                  isToday 
                    ? "bg-[var(--md-sys-color-primary-container)]/30 hover:bg-[var(--md-sys-color-primary-container)]/40 text-[var(--md-sys-color-on-primary-container)] z-[2]" 
                    : isCurrentWeekDay
                      ? "bg-[var(--md-sys-color-secondary-container)]/8 hover:bg-[var(--md-sys-color-secondary-container)]/15" 
                      : "hover:bg-[var(--md-sys-color-surface-container-high)]/50"
                )}
              >
                {/* Gregorian Date Column */}
                <td className="py-3.5 px-4 tabular-nums relative select-none">
                  {isToday && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--md-sys-color-primary)] rounded-r-full shadow-[0_0_8px_var(--md-sys-color-primary)]" />}
                  <div className={cn("font-black text-xs sm:text-sm tracking-tight", isToday && "text-[var(--md-sys-color-primary)]")}>
                    {format(dateObj, "dd MMM yyyy", { locale: settings.language === 'ms' ? ms : enUS })}
                  </div>
                  {isToday && (
                    <span className="mt-1 inline-flex gap-1 items-center px-1.5 py-0.5 bg-[var(--md-sys-color-primary)] text-white text-[8px] rounded uppercase tracking-wider font-black w-fit shadow-sm">
                      <CalendarDays size={10} /> {t("today")}
                    </span>
                  )}
                </td>

                {/* Hijri Date Column */}
                <td className="py-3.5 px-4 select-none">
                  <div className="flex flex-col gap-0.5">
                    {(!settings.hijriFormat || settings.hijriFormat === 'both' || settings.hijriFormat === 'text') && (
                      <span className="text-xs font-black whitespace-nowrap">{getHijriFormatted(day.date, settings.hijriMethod, settings.hijriAdjustment, "text", settings.language).split(" (")[0]}</span>
                    )}
                    {(!settings.hijriFormat || settings.hijriFormat === 'both' || settings.hijriFormat === 'number') && (
                      <span className="text-[9px] font-mono font-black opacity-55 tabular-nums">
                        {getHijriFormatted(day.date, settings.hijriMethod, settings.hijriAdjustment, "number", settings.language)}
                      </span>
                    )}
                  </div>
                  {evt && (
                    <div className="mt-1 flex">
                      <span className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-widest shadow-xs",
                        evt.color || "bg-[var(--md-sys-color-primary)]"
                      )}>
                        {evt.title}
                      </span>
                    </div>
                  )}
                </td>

                {/* Day Name Column */}
                <td className="py-3.5 px-4 text-xs font-black opacity-75 uppercase tracking-wider select-none">
                  {format(dateObj, "EEEE", { locale: settings.language === 'ms' ? ms : enUS })}
                </td>

                {/* Prayer Times columns */}
                {timesToDisplay.map((k) => {
                  const Icon = PRAYER_ICONS[k];
                  return (
                    <td key={k} className="py-1.5 px-0.5 text-center align-middle">
                      <motion.button 
                        whileHover={{ scale: 1.07 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => onPrayerSelect({
                          key: k,
                          time: day[k] ? day[k].substring(0, 5) : "--:--",
                          dateValue: day.date,
                          hijriValue: day.hijri
                        })}
                        className={cn(
                          "relative w-full py-2 px-1 flex flex-col items-center justify-center gap-0.5 rounded-xl border border-transparent overflow-hidden focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] cursor-pointer transition-all duration-300",
                          isToday 
                            ? "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)]" 
                            : "bg-[var(--md-sys-color-surface-container-low)]/80 text-[var(--md-sys-color-on-surface)] group-hover:bg-[var(--md-sys-color-surface)] group-hover:border-[var(--md-sys-color-outline)]/8"
                        )}
                        title={t(k)}
                      >
                        {/* @ts-ignore */}
                        <md-ripple></md-ripple>
                        <span className="tabular-nums font-mono text-[11px] sm:text-xs font-black whitespace-nowrap">{day[k] ? day[k].substring(0, 5) : "--:--"}</span>
                      </motion.button>
                    </td>
                  );
                })}

                {/* Direct Row Copy Button */}
                <td className="py-1.5 px-2 text-center align-middle">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleCopyDaySchedule(day)}
                    title={isMalay ? "Salin Jadual Hari Ini" : "Copy Today's Schedule"}
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer shadow-xs",
                      copiedRowDate === day.date
                        ? "bg-[#25D366] text-white"
                        : "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-primary)] hover:text-white border border-[var(--md-sys-color-outline)]/5"
                    )}
                  >
                    {copiedRowDate === day.date ? (
                      <Check size={12} strokeWidth={3} />
                    ) : (
                      <Copy size={12} strokeWidth={iconStroke} />
                    )}
                  </motion.button>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
      
      {data.length === 0 && !isLoading && (
        <div className="p-12 flex items-center justify-center select-none">
          <p className="text-[var(--md-sys-color-on-surface-variant)] font-black text-sm uppercase tracking-widest text-center">
            {t("noData")}
          </p>
        </div>
      )}
    </div>
  );
}
