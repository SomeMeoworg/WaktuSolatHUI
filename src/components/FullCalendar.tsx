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

export type CalendarTab = "grid" | "list" | "public_holidays" | "islamic_events";
export type ListViewFilter = "daily" | "weekly" | "monthly";

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
  
  const [activeTab, setActiveTab] = useState<CalendarTab>("grid");
  const [view, setView] = useState<ListViewFilter>("monthly");
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  const [dataCache, setDataCache] = useState<Record<string, PrayerData[]>>({
    [format(new Date(), "yyyy-MM")]: initialMonthData
  });
  
  const [isLoading, setIsLoading] = useState(false);
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
    
    // For weekly view list, we might need to pre-fetch adjacent months
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
    // Default to monthly match for grid and monthly list
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
      const formattedHijri = getHijriFormatted(day.hijri, settings.hijriFormat || "both", settings.language);
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

  return (
    <>
      <AnimatePresence>
        <motion.div
           variants={modalVariants}
           initial="hidden"
           animate="visible"
           exit="exit"
           className="fixed inset-0 z-40 bg-[var(--md-sys-color-background)] w-full h-full flex flex-col font-sans text-[var(--md-sys-color-on-background)]"
        >
          {/* STICKY HEADER ZONE */}
          <div className="sticky top-0 z-50 bg-[var(--md-sys-color-surface)]/80 backdrop-blur-2xl border-b border-[var(--md-sys-color-outline)]/10 shadow-sm shrink-0">
            <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
              
              {/* Top Title & Close */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-3xl lg:text-4xl font-black tracking-tighter text-[var(--md-sys-color-primary)] flex items-center gap-3">
                    <CalendarRange size={36} className="stroke-[2.5]" /> {t("calendar")}
                  </h2>
                  <p className="font-bold text-[var(--md-sys-color-on-surface-variant)] text-sm md:text-base opacity-80">
                    {t("extensiveCalendarDesc")}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-12 h-12 flex items-center justify-center rounded-full text-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-error-container)] hover:text-[var(--md-sys-color-on-error-container)] shrink-0 shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-error)]"
                >
                  <X size={24} className="stroke-[3]" />
                </motion.button>
              </div>

              {/* Tab navigation */}
              {/* @ts-ignore */}
              <md-tabs className="w-full shrink-0 bg-transparent" activeTabIndex={activeTab === 'grid' ? 0 : activeTab === 'list' ? 1 : activeTab === 'public_holidays' ? 2 : 3}>
                {/* @ts-ignore */}
                <md-primary-tab onClick={() => setActiveTab("grid")}>
                  <div className="flex items-center gap-2"><span slot="icon"><CalendarDays size={18} /></span> {t("calendarGrid")}</div>
                </md-primary-tab>
                {/* @ts-ignore */}
                <md-primary-tab onClick={() => setActiveTab("list")}>
                  <div className="flex items-center gap-2"><span slot="icon"><ListTree size={18} /></span> {t("schedule")}</div>
                </md-primary-tab>
                {/* @ts-ignore */}
                <md-primary-tab onClick={() => setActiveTab("public_holidays")}>
                  <div className="flex items-center gap-2"><span slot="icon"><PartyPopper size={18} /></span> {t("publicHolidays")}</div>
                </md-primary-tab>
                {/* @ts-ignore */}
                <md-primary-tab onClick={() => setActiveTab("islamic_events")}>
                  <div className="flex items-center gap-2"><span slot="icon"><Moon size={18} /></span> {t("islamicEvents")}</div>
                </md-primary-tab>
              </md-tabs>

              {/* Controls Row */}
              {activeTab !== "public_holidays" && activeTab !== "islamic_events" && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--md-sys-color-surface-container-low)] p-3 px-5 rounded-[24px] border border-[var(--md-sys-color-outline)]/5 shadow-sm">
                  {activeTab === "list" ? (
                    <div className="flex bg-[var(--md-sys-color-surface-container-high)] p-1 rounded-[16px] shadow-inner shrink-0 overflow-x-auto no-scrollbar">
                      {(["daily", "weekly", "monthly"] as const).map(v => (
                        <button
                          key={v}
                          onClick={() => setView(v)}
                          className={cn(
                            "px-5 py-2 rounded-[12px] font-bold text-sm transition-all duration-300 whitespace-nowrap",
                            view === v 
                              ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md" 
                              : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]"
                          )}
                        >
                          {t(v as any)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="hidden sm:block text-sm font-bold opacity-0">.</div> // spacer
                  )}
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {activeTab === 'list' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopy}
                        disabled={uniqueDisplayData.length === 0}
                        className="mr-auto sm:mr-2 flex items-center gap-2 px-5 py-2.5 bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] rounded-[16px] transition-colors font-bold disabled:opacity-50 shadow-sm"
                        title={t("copySchedule")}
                      >
                        {isCopied ? <Check size={18} className="stroke-[3]" /> : <Copy size={18} className="stroke-[2.5]" />}
                        <span className="hidden lg:inline">{isCopied ? t("copied") : t("copy")}</span>
                      </motion.button>
                    )}
                    
                    <div className="flex items-center gap-2 bg-[var(--md-sys-color-surface-container-high)] p-1 rounded-[20px] shadow-inner shrink-0">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handlePrev}
                        className="p-3 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] rounded-[16px] hover:text-[var(--md-sys-color-primary)] transition-colors shadow-sm"
                        disabled={isLoading}
                      >
                        <ChevronLeft size={20} strokeWidth={3} />
                      </motion.button>
                      
                      <h3 className="text-sm md:text-base font-black min-w-[140px] text-center uppercase tracking-widest text-[var(--md-sys-color-primary)] px-2">
                        {activeTab === "list" && view === "daily" 
                          ? format(currentDate, "dd MMM yyyy", { locale: settings.language === 'ms' ? ms : enUS })
                          : activeTab === "list" && view === "weekly"
                            ? `${t("week")} ${format(currentDate, "w")}, ${format(currentDate, "yyyy")}`
                            : format(currentDate, "MMMM yyyy", { locale: settings.language === 'ms' ? ms : enUS })}
                      </h3>
                      
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleNext}
                        className="p-3 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] rounded-[16px] hover:text-[var(--md-sys-color-primary)] transition-colors shadow-sm"
                        disabled={isLoading}
                      >
                        <ChevronRight size={20} strokeWidth={3} />
                      </motion.button>
                    </div>

                    {isLoading && <Loader2 size={24} className="animate-spin text-[var(--md-sys-color-primary)] ml-2" strokeWidth={3} />}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SCROLLABLE CONTENT ZONE */}
          <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
              {/* Error View */}
              {error && (
                <div className="w-full p-6 mb-6 text-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error-container)] rounded-[24px] font-bold text-center shadow-sm">
                  {error}
                </div>
              )}

              {/* Content Switcher */}
              <div className="flex-1 min-h-0 w-full animate-in fade-in zoom-in duration-300">
                {activeTab === "grid" && (
                  <div className="bg-[var(--md-sys-color-surface-container-low)] shadow-sm rounded-[32px] border border-[var(--md-sys-color-outline)]/10 p-4 sm:p-6 lg:p-8 h-full flex flex-col">
                    <CalendarGridView 
                      currentDate={currentDate} 
                      monthData={uniqueDisplayData} 
                      isLoading={isLoading}
                      onSelectDay={(day) => setSelectedDayData(day)}
                    />
                  </div>
                )}
                {activeTab === "list" && (
                  <PrayerTimesListView 
                    data={uniqueDisplayData} 
                    view={view}
                    isLoading={isLoading} 
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

      <AnimatePresence>
        {(selectedPrayer) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80"
            onClick={() => setSelectedPrayer(null)}
          >
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-[var(--md-sys-color-surface)] w-full max-w-sm rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] p-8 relative overflow-hidden">
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedPrayer(null)}
                  className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors z-10"
                >
                  <X size={20} />
                </motion.button>
                <div className="relative z-10 flex flex-col items-center text-center">
                  {(() => {
                    const Icon = PRAYER_ICONS[selectedPrayer.key];
                    return <Icon size={48} className="mb-4 opacity-90 drop-shadow-md" />;
                  })()}
                  <h3 className="text-3xl font-black mb-1 drop-shadow-sm">{t(selectedPrayer.key as any)}</h3>
                  <div className="text-5xl font-mono font-bold tracking-tighter drop-shadow-md my-2">
                    {selectedPrayer.time}
                  </div>
                  <div className="text-sm opacity-90 mt-2 font-medium">
                    {selectedPrayer.dateValue.replace(/-/g, " ")} • {getHijriFormatted(selectedPrayer.hijriValue, settings.hijriFormat || "both", settings.language)}
                  </div>
                </div>
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-black/5 rounded-full pointer-events-none" />
              </div>
              <div className="p-6 md:p-8 bg-[var(--md-sys-color-surface)]">
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] rounded-full shrink-0">
                    <Info size={20} />
                  </div>
                  <p className="text-[var(--md-sys-color-on-surface)] leading-relaxed font-medium">
                    {getPrayerDesc(selectedPrayer.key)}
                  </p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPrayer(null)}
                  className="w-full mt-8 py-3 px-4 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-secondary-container)] hover:text-[var(--md-sys-color-on-secondary-container)] font-bold rounded-xl transition-colors"
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

function TabButton({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex-1 min-w-fit sm:min-w-[120px] whitespace-nowrap flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-3 sm:py-3 sm:px-5 rounded-full transition-all font-bold text-xs sm:text-sm lg:text-base",
        active 
          ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md shadow-[var(--md-sys-color-primary)]/30" 
          : "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)]"
      )}
    >
       <Icon size={16} className={cn("sm:w-[18px] sm:h-[18px]", active ? "" : "opacity-70")} />
       {label}
    </motion.button>
  );
}

function SubTab({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all",
        active 
          ? "bg-[var(--md-sys-color-tertiary)] text-[var(--md-sys-color-on-tertiary)] shadow-sm shadow-[var(--md-sys-color-tertiary)]/20" 
          : "bg-[var(--md-sys-color-tertiary-container)]/50 text-[var(--md-sys-color-on-tertiary-container)] hover:bg-[var(--md-sys-color-tertiary-container)]"
      )}
    >
       {label}
    </motion.button>
  );
}
