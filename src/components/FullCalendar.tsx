import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import "@material/web/tabs/tabs.js";
import "@material/web/tabs/primary-tab.js";
import "@material/web/tabs/secondary-tab.js";
import { format, parse, addMonths, subMonths, startOfMonth, addDays, subDays, isSameDay, isSameWeek } from "date-fns";
import { ms, enUS } from "date-fns/locale";
import { PrayerData, PrayerKey } from "../types";
import { PRAYER_NAMES, PRAYER_ICONS } from "./PrayerSchedule";
import { Moon, Sun, Sunrise, Sunset, SunDim, SunMedium, X, Info, ChevronLeft, ChevronRight, Loader2, Calendar, CalendarDays, CalendarRange, Copy, Check, ListTree, Clock, PartyPopper } from "lucide-react";
import { cn } from "../lib/utils";
import { useAppContext } from "../AppContext";
import { getHijriFormatted } from "../lib/holidays";

import { CalendarGridView } from "./calendar/CalendarGridView";
import { PrayerTimesListView } from "./calendar/PrayerTimesListView";
import { EventsListView } from "./calendar/EventsListView";
import { SelectedDayModal } from "./calendar/SelectedDayModal";
import { modalVariants } from "../lib/motion";
import { useVisualStyle, useIconStroke } from "../hooks/useVisualStyle";

export type CalendarTab = "grid" | "list" | "public_holidays" | "islamic_events";
export type ListViewFilter = "daily" | "weekly" | "monthly";

const calendarVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.2, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.15, ease: "easeIn" }
  }
};

export function FullCalendar({
  isOpen,
  initialMonthData,
  selectedZone,
  onClose
}: {
  isOpen: boolean;
  initialMonthData: PrayerData[];
  selectedZone: string;
  onClose: () => void;
}) {
  const { t, settings } = useAppContext();
  const visualStyle = useVisualStyle();
  const iconStroke = useIconStroke();
  
  const [activeTab, setActiveTab] = useState<CalendarTab>("grid");
  const [view, setView] = useState<ListViewFilter>("monthly");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  const [dataCache, setDataCache] = useState<Record<string, PrayerData[]>>({
    [format(new Date(), "yyyy-MM")]: initialMonthData
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingState, setShowLoadingState] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDayData, setSelectedDayData] = useState<PrayerData | null>(null);
  const [selectedPrayer, setSelectedPrayer] = useState<{
    key: PrayerKey,
    time: string,
    dateValue: string,
    hijriValue: string,
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const getPrayerDesc = (key: string) => {
    return t(`${key}Desc` as any);
  };

  useEffect(() => {
    let timer: any;
    if (isLoading) {
      timer = setTimeout(() => setShowLoadingState(true), 200);
    } else {
      setShowLoadingState(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchMonthData = async (date: Date) => {
      const key = format(date, "yyyy-MM");
      if (dataCache[key]) return; // Already cached
      
      setIsLoading(true);
      setError(null);
      try {
        const y = date.getFullYear();
        const m = date.getMonth() + 1;
        const url = `/api/solat/${selectedZone}?year=${y}&month=${m}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed");
        
        let data;
        try {
          data = await res.json();
        } catch (e) {
          throw new Error("Invalid calendar JSON");
        }
        
        setDataCache(prev => ({
          ...prev,
          [key]: data.prayerTime || []
        }));
      } catch (err) {
        setError(t("failedToLoad"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthData(currentDate);
    
    if (activeTab === "list" && view === "weekly") {
      const mon = new Date(currentDate);
      const start = subDays(mon, mon.getDay());
      const end = addDays(mon, 6);
      
      if (start.getMonth() !== currentDate.getMonth()) fetchMonthData(start);
      if (end.getMonth() !== currentDate.getMonth()) fetchMonthData(end);
    }
  }, [currentDate, selectedZone, view, dataCache, isOpen, activeTab, t]);

  const handlePrev = () => {
    if (activeTab === "list" && view === "daily") setCurrentDate(prev => subDays(prev, 1));
    else if (activeTab === "list" && view === "weekly") setCurrentDate(prev => subDays(prev, 7));
    else setCurrentDate(prev => subMonths(startOfMonth(prev), 1));
  };
  
  const handleNext = () => {
    if (activeTab === "list" && view === "daily") setCurrentDate(prev => addDays(prev, 1));
    else if (activeTab === "list" && view === "weekly") setCurrentDate(prev => addDays(prev, 7));
    else setCurrentDate(prev => addMonths(startOfMonth(prev), 1));
  };

  // Pre-process Data
  const allAvailableData: PrayerData[] = [];
  Object.values(dataCache).forEach(arr => {
    if (Array.isArray(arr)) {
      allAvailableData.push(...arr);
    }
  });
  
  const displayData = allAvailableData.filter(day => {
    const d = parse(day.date, "dd-MMM-yyyy", new Date());
    if (activeTab === "list" && view === "daily") return isSameDay(d, currentDate);
    if (activeTab === "list" && view === "weekly") return isSameWeek(d, currentDate, { weekStartsOn: 1 });
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
  }).sort((a, b) => parse(a.date, "dd-MMM-yyyy", new Date()).getTime() - parse(b.date, "dd-MMM-yyyy", new Date()).getTime());

  const uniqueMap = new Map<string, PrayerData>();
  displayData.forEach(item => uniqueMap.set(item.date, item));
  const uniqueDisplayData = Array.from(uniqueMap.values());

  const handleCopy = () => {
    if (uniqueDisplayData.length === 0) return;
    const timesToDisplay = ["imsak", "fajr", "syuruk", "dhuhr", "asr", "maghrib", "isha"] as const;

    let text = `${t("schedule")} - ${selectedZone}\n\n`;
    
    uniqueDisplayData.forEach(day => {
      const formattedHijri = getHijriFormatted(day.date, settings.hijriMethod, settings.hijriAdjustment, settings.hijriFormat || "both", settings.language, day.hijri);
      text += `${t("date")}: ${day.date.replace(/-/g, " ")} (${formattedHijri} - ${day.day})\n`;
      timesToDisplay.forEach(k => {
        text += `${t(k)}: ${day[k] ? day[k].substring(0, 5) : "--:--"}\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  const isWallpaperActive = settings.wallpaperEnabled;

  return (
    <>
      <AnimatePresence>
        <motion.div
           variants={calendarVariants}
           initial="hidden"
           animate="visible"
           exit="exit"
           className={cn(
             "fixed inset-0 z-40 w-full h-full flex flex-col font-sans text-[var(--md-sys-color-on-background)] overflow-hidden transition-all duration-300 select-none",
             isWallpaperActive
               ? "bg-black/60 backdrop-blur-3xl"
               : visualStyle === 'glass'
                 ? "bg-[var(--glass-bg)]/85 backdrop-blur-[28px] border border-[var(--glass-border)]"
                 : "bg-[var(--md-sys-color-background)]",
             visualStyle === 'soft' && "shadow-[var(--soft-shadow-heavy)] bg-[var(--md-sys-color-background)]",
             visualStyle === 'retro' && "border-[4px] border-[var(--md-sys-color-on-surface)] rounded-none"
           )}
        >
          {/* STICKY HEADER ZONE */}
          <div className={cn(
            "sticky top-0 z-50 border-b border-[var(--md-sys-color-outline)]/12 shadow-sm shrink-0 transition-all duration-300",
            isWallpaperActive ? "bg-black/20 backdrop-blur-md" : visualStyle === 'glass' ? "bg-white/5 backdrop-blur-md" : "bg-[var(--md-sys-color-surface)]/90 backdrop-blur-2xl"
          )}>
            <div className="max-w-7xl mx-auto w-full p-3 sm:p-4 lg:py-4 lg:px-6 flex flex-col gap-2.5 sm:gap-3.5">
              
              {/* Top Title & Close Button */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[var(--md-sys-color-primary)]/10 flex items-center justify-center shrink-0">
                    <CalendarRange size={22} className="text-[var(--md-sys-color-primary)] stroke-[2.5] sm:scale-110" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-black tracking-tight text-[var(--md-sys-color-primary)] leading-tight">
                      {t("calendar")}
                    </h2>
                    <p className="font-bold text-[var(--md-sys-color-on-surface-variant)] text-[10px] sm:text-xs uppercase tracking-wider opacity-85">
                      {t("extensiveCalendarDesc")}
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-error-container)] hover:text-[var(--md-sys-color-on-error-container)] shrink-0 shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-error)] cursor-pointer"
                >
                  <X size={16} strokeWidth={iconStroke} />
                </motion.button>
              </div>

              {/* Tab Navigation Menu (MWC) */}
              <div className="w-full shrink-0 overflow-x-auto no-scrollbar pt-0.5">
                {/* @ts-ignore */}
                <md-tabs className="w-full bg-transparent shrink-0" activeTabIndex={activeTab === 'grid' ? 0 : activeTab === 'list' ? 1 : activeTab === 'public_holidays' ? 2 : 3}>
                  {/* @ts-ignore */}
                  <md-primary-tab onClick={() => setActiveTab("grid")}>
                    <div className="flex items-center gap-2 py-0.5 text-xs sm:text-sm"><span slot="icon"><CalendarDays size={14} /></span> {t("calendarGrid")}</div>
                  </md-primary-tab>
                  {/* @ts-ignore */}
                  <md-primary-tab onClick={() => setActiveTab("list")}>
                    <div className="flex items-center gap-2 py-0.5 text-xs sm:text-sm"><span slot="icon"><ListTree size={14} /></span> {t("schedule")}</div>
                  </md-primary-tab>
                  {/* @ts-ignore */}
                  <md-primary-tab onClick={() => setActiveTab("public_holidays")}>
                    <div className="flex items-center gap-2 py-0.5 text-xs sm:text-sm"><span slot="icon"><PartyPopper size={14} /></span> {t("publicHolidays")}</div>
                  </md-primary-tab>
                  {/* @ts-ignore */}
                  <md-primary-tab onClick={() => setActiveTab("islamic_events")}>
                    <div className="flex items-center gap-2 py-0.5 text-xs sm:text-sm"><span slot="icon"><Moon size={14} /></span> {t("islamicEvents")}</div>
                  </md-primary-tab>
                </md-tabs>
              </div>

              {/* Navigation and Date Controls Row */}
              {activeTab !== "public_holidays" && activeTab !== "islamic_events" && (
                <div className={cn(
                  activeTab === "grid" 
                    ? "flex items-center justify-center py-1 sm:py-2 shrink-0 w-full" 
                    : "flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--md-sys-color-surface-container-low)] p-2.5 px-4 rounded-[20px] border border-[var(--md-sys-color-outline)]/5 shadow-sm transition-colors",
                  visualStyle === 'glass' && activeTab !== "grid" && "bg-[var(--glass-bg)]/30 backdrop-blur-sm border-[var(--glass-border)]"
                )}>
                  {activeTab === "list" ? (
                    <div className="flex bg-[var(--md-sys-color-surface-container-high)] p-1 rounded-xl shadow-inner shrink-0 overflow-x-auto no-scrollbar">
                      {(["daily", "weekly", "monthly"] as const).map(v => (
                        <button
                          key={v}
                          onClick={() => setView(v)}
                          className={cn(
                            "px-4 py-1.5 rounded-lg font-black text-xs transition-all duration-200 whitespace-nowrap cursor-pointer",
                            view === v 
                              ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm" 
                              : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]"
                          )}
                        >
                          {t(v as any)}
                        </button>
                      ))}
                    </div>
                  ) : activeTab === "grid" ? null : (
                    <div className="hidden sm:block text-[10px] font-bold opacity-0">.</div> 
                  )}
                  
                  <div className={cn(
                    "flex items-center gap-3 shrink-0",
                    activeTab === "grid" ? "justify-center w-auto" : "w-full sm:w-auto justify-between sm:justify-end"
                  )}>
                    {activeTab === 'list' && (
                      <motion.button
                        whileHover={{ scale: 1.03, y: -0.5 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleCopy}
                        disabled={uniqueDisplayData.length === 0}
                        className="mr-auto sm:mr-1 flex items-center gap-2 px-4 py-2 bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:bg-[var(--md-sys-color-primary)] hover:text-white rounded-xl transition-all font-black text-xs disabled:opacity-50 shadow-xs cursor-pointer"
                        title={t("copySchedule")}
                      >
                        {isCopied ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} strokeWidth={iconStroke} />}
                        <span>{isCopied ? t("copied") : t("copy")}</span>
                      </motion.button>
                    )}
                    
                    {/* Centered navigation pill */}
                    <div className="flex items-center gap-2.5 bg-[var(--md-sys-color-surface-container-high)] p-1 rounded-full border border-[var(--md-sys-color-outline)]/8 shadow-inner shrink-0">
                      <motion.button 
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={handlePrev}
                        className="p-2 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] rounded-full hover:text-[var(--md-sys-color-primary)] transition-all shadow-xs cursor-pointer"
                        disabled={isLoading}
                      >
                        <ChevronLeft size={16} strokeWidth={iconStroke} />
                      </motion.button>
                      
                      <h3 className="text-xs font-black min-w-[130px] text-center uppercase tracking-widest text-[var(--md-sys-color-primary)] px-1 flex items-center justify-center gap-1.5 select-none">
                        <Clock size={12} className="text-[var(--md-sys-color-primary)]" />
                        {activeTab === "list" && view === "daily" 
                          ? format(currentDate, "dd MMM yyyy", { locale: settings.language === 'ms' ? ms : enUS })
                          : activeTab === "list" && view === "weekly"
                            ? `${t("week")} ${format(currentDate, "w")}, ${format(currentDate, "yyyy")}`
                            : format(currentDate, "MMMM yyyy", { locale: settings.language === 'ms' ? ms : enUS })}
                      </h3>
                      
                      <motion.button 
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={handleNext}
                        className="p-2 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] rounded-full hover:text-[var(--md-sys-color-primary)] transition-all shadow-xs cursor-pointer"
                        disabled={isLoading}
                      >
                        <ChevronRight size={16} strokeWidth={iconStroke} />
                      </motion.button>
                    </div>

                    {showLoadingState && <Loader2 size={18} className="animate-spin text-[var(--md-sys-color-primary)] shrink-0 ml-1" strokeWidth={3} />}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SCROLLABLE CONTENT ZONE - Dynamically binds grid height to fit viewport without scrolling */}
          <div className={cn(
            "flex-1 w-full custom-scrollbar bg-transparent min-h-0",
            activeTab === "grid" 
              ? "p-2 sm:p-4 lg:p-5 overflow-hidden flex flex-col" 
              : "p-4 sm:p-5 lg:p-6 overflow-y-auto"
          )}>
            <div className={cn(
              "max-w-7xl mx-auto w-full h-full flex flex-col min-h-0",
              activeTab === "grid" && "flex-1"
            )}>
              {error && (
                <div className="w-full p-4 mb-4 text-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error-container)] rounded-2xl font-black text-center shadow-xs text-xs uppercase tracking-wider">
                  {error}
                </div>
              )}

              {/* Main Tab Render Switcher */}
              <div className={cn(
                "flex-1 min-h-0 w-full animate-in fade-in zoom-in duration-200",
                activeTab === "grid" && "flex flex-col"
              )}>
                {activeTab === "grid" && (
                  <div className={cn(
                    "bg-[var(--md-sys-color-surface-container-low)] shadow-sm rounded-[32px] border border-[var(--md-sys-color-outline)]/10 p-2.5 sm:p-4 lg:p-5 flex-1 flex flex-col min-h-0 transition-all duration-300",
                    visualStyle === 'glass' && "bg-[var(--glass-bg)]/40 backdrop-blur-md border-[var(--glass-border)] shadow-inner"
                  )}>
                    <CalendarGridView 
                      currentDate={currentDate} 
                      monthData={uniqueDisplayData} 
                      isLoading={showLoadingState}
                      onSelectDay={(day) => setSelectedDayData(day)}
                    />
                  </div>
                )}
                {activeTab === "list" && (
                  <PrayerTimesListView 
                    data={uniqueDisplayData} 
                    view={view}
                    isLoading={showLoadingState}
                    onPrayerSelect={(p) => setSelectedPrayer(p)}
                  />
                )}
                {activeTab === "public_holidays" && (
                  <EventsListView currentDate={currentDate} type="public" />
                )}
                {activeTab === "islamic_events" && (
                  <EventsListView currentDate={currentDate} type="islamic" />
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <SelectedDayModal 
        day={selectedDayData} 
        onClose={() => setSelectedDayData(null)}
        onPrayerSelect={(k) => {
          if (selectedDayData) {
            setSelectedPrayer({
              key: k as PrayerKey,
              time: selectedDayData[k as PrayerKey] ? selectedDayData[k as PrayerKey]!.substring(0, 5) : "--:--",
              dateValue: selectedDayData.date,
              hijriValue: selectedDayData.hijri
            });
          }
        }}
      />

      {/* Selected Individual Prayer Modal */}
      <AnimatePresence>
        {(selectedPrayer) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={() => setSelectedPrayer(null)}
          >
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                "bg-[var(--md-sys-color-surface)] w-full max-w-sm rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden shadow-2xl transition-all duration-300",
                visualStyle === "retro" && "border-[3px] border-[var(--md-sys-color-on-surface)] rounded-none shadow-[8px_8px_0px_0px_var(--md-sys-color-on-surface)]",
                visualStyle === "glass" && "bg-[var(--glass-bg)]/90 backdrop-blur-lg border border-[var(--glass-border)]",
                visualStyle === "soft" && "shadow-[var(--soft-shadow-heavy)] border border-white/5"
              )}
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-gradient-to-tr from-[var(--md-sys-color-primary)] to-[var(--md-sys-color-primary-container)] text-white p-6 md:p-8 relative overflow-hidden">
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedPrayer(null)}
                  className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/25 rounded-full transition-colors z-10 cursor-pointer"
                >
                  <X size={16} strokeWidth={iconStroke} />
                </motion.button>
                
                <div className="relative z-10 flex flex-col items-center text-center">
                  {(() => {
                    const Icon = PRAYER_ICONS[selectedPrayer.key];
                    return <Icon size={42} className="mb-3 opacity-90 drop-shadow-md" />;
                  })()}
                  <h3 className="text-2xl font-black mb-1 drop-shadow-sm">{t(selectedPrayer.key as any)}</h3>
                  <div className="text-4xl font-mono font-bold tracking-tighter drop-shadow-md my-2">
                    {selectedPrayer.time}
                  </div>
                  <div className="text-[11px] opacity-85 mt-2 font-black uppercase tracking-wider">
                    {selectedPrayer.dateValue.replace(/-/g, " ")} • {getHijriFormatted(selectedPrayer.dateValue, settings.hijriMethod, settings.hijriAdjustment, settings.hijriFormat || "both", settings.language, selectedPrayer.hijri).split(" (")[0]}
                  </div>
                </div>
                
                {/* Background decorative circles */}
                <div className="absolute -top-24 -right-24 w-44 h-44 bg-white/5 rounded-full pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-44 h-44 bg-black/5 rounded-full pointer-events-none" />
              </div>

              <div className="p-6 md:p-8 bg-[var(--md-sys-color-surface)]">
                <div className="flex gap-3.5 items-start">
                  <div className="p-2 bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] rounded-full shrink-0">
                    <Info size={16} strokeWidth={iconStroke} />
                  </div>
                  <p className="text-[var(--md-sys-color-on-surface)] text-xs leading-relaxed font-semibold">
                    {getPrayerDesc(selectedPrayer.key)}
                  </p>
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPrayer(null)}
                  className="w-full mt-6 py-2.5 px-4 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-secondary-container)] hover:text-[var(--md-sys-color-on-secondary-container)] font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs border border-[var(--md-sys-color-outline)]/10"
                >
                  {t("close")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
