import { motion, AnimatePresence } from "motion/react";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/tabs/tabs.js";
import "@material/web/tabs/primary-tab.js";
import "@material/web/chips/filter-chip.js";
import "@material/web/switch/switch.js";
import {
  X,
  Bell,
  BellRing,
  BellOff,
  Volume2,
  Mic,
  Activity,
  Settings,
  Clock,
  Smartphone,
  Music,
  ChevronDown,
  Plus,
  Minus,
  Wifi,
  WifiOff,
  Download,
  RefreshCw,
  Check,
  AlertCircle,
  Trash2,
  Sliders,
  MoonStar
} from "lucide-react";
import { cn } from "../lib/utils";
import { modalVariants } from "../lib/motion";
import {
  PrayerKey,
  PrayerPreference,
  NotificationSound,
  PreAlertTime,
  NotificationType,
} from "../types";
import { PRAYER_NAMES } from "./PrayerSchedule";
import { useEffect, useState } from "react";
import { useAppContext } from "../AppContext";
import { saveOfflinePrayers, clearAllOfflinePrayers } from "../lib/db";
import { StorageManager } from "../lib/StorageManager";

function playSynthesizedSoundLocal(type: 'chime' | 'tick', pitchHz?: number) {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'tick') {
      // Clean tick: high frequency, extremely short decay
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } else {
      // Chime: pure sine with pleasant harmonic decay
      osc.type = 'triangle';
      const freq = pitchHz || 587.33; // D5 default
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.7);
    }
  } catch (e) {
    // Ignore context errors
  }
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: Record<PrayerKey, PrayerPreference>;
  onUpdatePreference: (
    key: PrayerKey,
    updates: Partial<PrayerPreference>,
  ) => void;
  permission: string;
  onRequestPermission: () => void;
  onTestSound: (sound: NotificationSound, message: string) => void;
  selectedZone: string;
  onPreviewAzanAlert?: (style: string) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  preferences,
  onUpdatePreference,
  permission,
  onRequestPermission,
  onTestSound,
  selectedZone,
  onPreviewAzanAlert,
}: SettingsModalProps) {
  const { settings, updateSettings, t } = useAppContext();
  const [activeTab, setActiveTab] = useState<
    "general" | "notifications" | "adjustments" | "mosque" | "advanced"
  >("general");
  const [showAdvancedGeneral, setShowAdvancedGeneral] = useState(false);
  const [showAdvancedCalculations, setShowAdvancedCalculations] = useState(false);
  const [showHijriEngine, setShowHijriEngine] = useState(false);

  const [downloadRange, setDownloadRange] = useState<'week' | 'month' | 'year'>('month');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  const handleSaveOffline = async () => {
    if (!navigator.onLine) {
      setDownloadError(settings.language === "ms" ? "Tiada sambungan internet" : "No internet connection");
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);
    setDownloadSuccess(false);

    try {
      let url = `/api/solat/${selectedZone}`;
      if (downloadRange === 'month') {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1);
        url = `/api/solat/${selectedZone}?year=${year}&month=${month}`;
      } else if (downloadRange === 'year') {
        const d = new Date();
        const year = d.getFullYear();
        url = `/api/solat/${selectedZone}?year=${year}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch prayer times from server");
      const data = await res.json();
      
      if (!data || !data.prayerTime || !Array.isArray(data.prayerTime) || data.prayerTime.length === 0) {
        throw new Error("No prayer data returned from API");
      }

      await saveOfflinePrayers(selectedZone, data.prayerTime, downloadRange);
      
      updateSettings({
        offlineCachedRange: downloadRange,
        offlineCachedAt: Date.now()
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      console.error("Offline download failed:", err);
      setDownloadError(t("saveOfflineFailed" as any) || "Gagal menyimpan luar talian");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      // 1. Clear IndexedDB prayer times
      await clearAllOfflinePrayers();
      
      // 2. Clear cached prayer times via StorageManager
      StorageManager.clearAllCachedPrayerData();
      
      // 3. Reset settings
      updateSettings({
        offlineCachedRange: undefined,
        offlineCachedAt: undefined
      });
      
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to clear offline cache:", err);
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const PRE_ALERT_OPTIONS: { label: string; value: PreAlertTime }[] = [
    { label: t("none"), value: 0 },
    { label: `5 ${t("minutes")}`, value: 5 },
    { label: `10 ${t("minutes")}`, value: 10 },
    { label: `15 ${t("minutes")}`, value: 15 },
  ];

  const SOUND_OPTIONS: {
    label: string;
    value: NotificationSound;
    icon: any;
  }[] = [
    { label: t("default"), value: "default", icon: Volume2 },
    { label: t("beep"), value: "beep", icon: Activity },
    { label: t("voice"), value: "voice", icon: Mic },
    { label: t("azan1" as any), value: "azan1", icon: Music },
    { label: t("azan2" as any), value: "azan2", icon: Music },
    { label: t("chime" as any), value: "chime", icon: Bell },
    { label: t("softChime" as any), value: "soft-chime", icon: BellRing },
    { label: t("bellEcho" as any), value: "bell-echo", icon: Bell },
    { label: t("ambientGong" as any), value: "ambient-gong", icon: Volume2 },
    { label: t("digitalSweep" as any), value: "digital-sweep", icon: Activity },
  ];

  const PRAYER_KEYS: PrayerKey[] = [
    "imsak",
    "fajr",
    "syuruk",
    "dhuhr",
    "asr",
    "maghrib",
    "isha",
  ];
  
  const SUNNAH_KEYS = [
    "suhoor",
    "morningForbidden",
    "duha",
    "middayForbidden",
    "eveningForbidden",
    "firstThird",
    "midnight",
    "tahajjud"
  ] as const;

  return (
    <Modal 
  isOpen={isOpen} 
  onClose={onClose} 
  size="3xl"
  scrollBehavior="inside"
  backdrop="blur"
  classNames={{
    base: "bg-content1 rounded-[2.5rem] shadow-2xl h-[90vh] sm:h-[85vh] m-2 sm:m-0 border border-divider",
    header: "border-b border-divider p-6 md:p-8 flex-col items-start gap-4",
    body: "p-0 bg-content2/30",
    closeButton: "top-6 right-6 hover:bg-content3"
  }}
>
  <ModalContent>
    {(onClose) => (
      <>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-primary leading-none mb-2">
            {t("settings")}
          </h2>
        </ModalHeader>

            {/* Tabs */}
            <div className="w-full overflow-x-auto no-scrollbar border-b border-divider shrink-0">
              {/* @ts-ignore */}
              <md-tabs className="min-w-max w-full" activeTabIndex={activeTab === 'general' ? 0 : activeTab === 'notifications' ? 1 : activeTab === 'adjustments' ? 2 : activeTab === 'advanced' ? 3 : 4}>
              {/* @ts-ignore */}
              <md-primary-tab onClick={() => setActiveTab("general")}>
                {t("general")}
                <span slot="icon"><Settings size={18} /></span>
              </md-primary-tab>
              {/* @ts-ignore */}
              <md-primary-tab onClick={() => setActiveTab("notifications")}>
                {t("notifications")}
                <span slot="icon"><Bell size={18} /></span>
              </md-primary-tab>
              {/* @ts-ignore */}
              <md-primary-tab onClick={() => setActiveTab("adjustments")}>
                {t("offset")}
                <span slot="icon"><Clock size={18} /></span>
              </md-primary-tab>
              {/* @ts-ignore */}
              <md-primary-tab onClick={() => setActiveTab("advanced")}>
                {t("sunnahAndOptional" as any) || "Lanjutan"}
                <span slot="icon"><Sliders size={18} /></span>
              </md-primary-tab>
              {/* @ts-ignore */}
              <md-primary-tab onClick={() => setActiveTab("mosque")}>
                {t("mosqueMode" as any)}
                <span slot="icon"><Music size={18} /></span>
              </md-primary-tab>
            </md-tabs>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8 pt-6 space-y-6 no-scrollbar bg-[var(--md-sys-color-surface-container-lowest)]">
              {activeTab === "general" && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  {/* Language & Time Format Card */}
                  <div className="bg-content2 rounded-[32px] p-6 border border-divider shadow-sm space-y-6">
                    <div className="space-y-3">
                      <label className="md3-title-medium font-bold text-primary flex items-center gap-2">
                        {t("language")}
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {/* @ts-ignore */}
                        <Button size="sm" variant={settings.language === "ms" ? "solid" : "flat"} color={settings.language === "ms" ? "primary" : "default"}
                          
                          
                          onClick={() => updateSettings({ language: "ms" })}
                        >{t("malay" as any)}</Button>
                        {/* @ts-ignore */}
                        <Button size="sm" variant={settings.language === "en" ? "solid" : "flat"} color={settings.language === "en" ? "primary" : "default"}
                          
                          
                          onClick={() => updateSettings({ language: "en" })}
                        >{t("english" as any)}</Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="md3-title-medium font-bold text-primary flex items-center gap-2">
                        {t("timeFormat")}
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {/* @ts-ignore */}
                        <Button size="sm" variant={settings.timeFormat === "12h" ? "solid" : "flat"} color={settings.timeFormat === "12h" ? "primary" : "default"}
                          
                          
                          onClick={() => updateSettings({ timeFormat: "12h" })}
                        >{t("hour12" as any)}</Button>
                        {/* @ts-ignore */}
                        <Button size="sm" variant={settings.timeFormat === "24h" ? "solid" : "flat"} color={settings.timeFormat === "24h" ? "primary" : "default"}
                          
                          
                          onClick={() => updateSettings({ timeFormat: "24h" })}
                        >{t("hour24" as any)}</Button>
                      </div>
                    </div>
                  </div>

                  {/* Religion & Formatting Card */}
                  <div className="bg-content2 rounded-[32px] p-6 border border-divider shadow-sm space-y-6">
                    <div className="space-y-3">
                      <label className="md3-title-medium font-bold text-primary flex items-center gap-2">
                        {t("mazhab")}
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {/* @ts-ignore */}
                        <Button size="sm" variant={settings.mazhab !== "hanafi" ? "solid" : "flat"} color={settings.mazhab !== "hanafi" ? "primary" : "default"}
                          
                          
                          onClick={() => updateSettings({ mazhab: "shafii" })}
                        >{t("mazhabShafii" as any)}</Button>
                        {/* @ts-ignore */}
                        <Button size="sm" variant={settings.mazhab === "hanafi" ? "solid" : "flat"} color={settings.mazhab === "hanafi" ? "primary" : "default"}
                          
                          
                          onClick={() => updateSettings({ mazhab: "hanafi" })}
                        >{t("mazhabHanafi" as any)}</Button>
                      </div>
                      {settings.mazhab === "hanafi" && (
                        <p className="text-sm text-danger mt-2 italic font-bold">
                          {t("hanafiAsarNote" as any)}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="md3-title-medium font-bold text-primary flex items-center gap-2">
                        {t("hijriFormat")}
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {/* @ts-ignore */}
                        <Button size="sm" variant={!settings.hijriFormat || settings.hijriFormat === "both" ? "solid" : "flat"} color={!settings.hijriFormat || settings.hijriFormat === "both" ? "primary" : "default"}
                          
                          
                          onClick={() => updateSettings({ hijriFormat: "both" })}
                        >{t("hijriBoth")}</Button>
                        {/* @ts-ignore */}
                        <Button size="sm" variant={settings.hijriFormat === "text" ? "solid" : "flat"} color={settings.hijriFormat === "text" ? "primary" : "default"}
                          
                          
                          onClick={() => updateSettings({ hijriFormat: "text" })}
                        >{t("hijriText")}</Button>
                        {/* @ts-ignore */}
                        <Button size="sm" variant={settings.hijriFormat === "number" ? "solid" : "flat"} color={settings.hijriFormat === "number" ? "primary" : "default"}
                          
                          
                          onClick={() => updateSettings({ hijriFormat: "number" })}
                        >{t("hijriNumber")}</Button>
                      </div>
                    </div>
                  </div>

                  {/* Clock Customization Card */}
                  <div className="bg-content2 rounded-[32px] p-0 border border-divider shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 pb-4 bg-content3">
                      <label className="md3-title-medium font-bold text-primary flex items-center gap-2">
                        {t("clockStyle" as any)}
                      </label>
                    </div>
                    {/* Wrap for clocks so they are all visible on desktop and mobile */}
                    <div className="flex flex-wrap gap-2.5 p-6 bg-content2">
                      {(["digital", "analog", "analog-numeric", "analog-roman", "analog-arabic", "anadigi", "chronograph", "flip", "word", "minimal", "orbit", "typographic", "prayer-ring", "dashboard", "abstract", "swiss-station", "bauhaus", "layered"] as const).map((style) => (
                        <div key={style} className="shrink-0">
                          {/* @ts-ignore */}
                          <Button size="sm" variant={settings.clockFace === style || (!settings.clockFace && style === "digital") ? "solid" : "flat"} color={settings.clockFace === style || (!settings.clockFace && style === "digital") ? "primary" : "default"}
                            
                            
                            onClick={() => updateSettings({ clockFace: style })}
                          >{
                              style === "digital"
                                ? t("clockStyleDigital" as any)
                                : style === "analog"
                                  ? t("clockStyleAnalog" as any)
                                  : style === "analog-numeric"
                                    ? t("clockStyleAnalogNumeric" as any)
                                    : style === "analog-roman"
                                      ? t("clockStyleAnalogRoman" as any)
                                      : style === "analog-arabic"
                                        ? t("clockStyleAnalogArabic" as any)
                                        : style === "anadigi"
                                          ? t("clockStyleAnaDigi" as any)
                                          : style === "chronograph"
                                            ? t("clockStyleChronograph" as any)
                                            : style === "flip"
                                              ? t("clockStyleFlip" as any)
                                              : style === "word"
                                                ? t("clockStyleWord" as any)
                                                : style === "minimal"
                                                  ? t("clockStyleMinimal" as any)
                                                  : style === "orbit"
                                                    ? t("clockStyleOrbit" as any)
                                                    : style === "typographic"
                                                      ? t("clockStyleTypographic" as any)
                                                      : style === "prayer-ring"
                                                        ? t("clockStylePrayerRing" as any)
                                                        : style === "dashboard"
                                                          ? t("clockStyleDashboard" as any)
                                                          : style === "swiss-station"
                                                            ? t("clockStyleSwissStation" as any)
                                                            : style === "bauhaus"
                                                              ? t("clockStyleBauhaus" as any)
                                                              : style === "layered"
                                                                ? t("clockStyleLayered" as any)
                                                                : t("clockStyleAbstract" as any)
                            }</Button>
                        </div>
                      ))}
                    </div>

                    {settings.clockFace !== "digital" && (
                      <div className="p-5 pt-0 border-t border-divider mt-2">
                        <label className="md3-label-large font-bold text-primary flex items-center gap-2 mb-3 mt-4">
                          {t("clockMovement" as any)}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(["sweep", "tick"] as const).map((movement) => (
                            /* @ts-ignore */
                            <Button size="sm" variant={settings.clockMovement === movement || (!settings.clockMovement && movement === "sweep") ? "solid" : "flat"} color={settings.clockMovement === movement || (!settings.clockMovement && movement === "sweep") ? "primary" : "default"}
                              key={movement}
                              
                              
                              onClick={() => updateSettings({ clockMovement: movement })}
                            >{
                                movement === "sweep"
                                  ? t("clockMovementSweep" as any)
                                  : t("clockMovementTick" as any)
                              }</Button>
                          ))}
                        </div>

                        {['analog', 'analog-numeric', 'analog-roman', 'analog-arabic', 'dashboard', 'minimal', 'orbit', 'swiss-station', 'bauhaus', 'layered'].includes(settings.clockFace || '') && (
                          <div className="flex items-center justify-between mt-6">
                            <div>
                              <div className="md3-label-large font-bold text-foreground">
                                {t("showExternalDigitalClock" as any)}
                              </div>
                              <div className="text-xs text-default-500 mt-1">
                                {t("showExternalDigitalClockDesc" as any)}
                              </div>
                            </div>
                            {/* @ts-ignore */}
                            <Switch
                              isSelected={settings.showExternalDigitalClock}
                              onClick={() => updateSettings({ showExternalDigitalClock: !settings.showExternalDigitalClock })}
                             />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Collapsible Advanced & Offline Options (Progressive Disclosure) */}
                  <div className={cn(
                    "rounded-[32px] overflow-hidden border border-divider shadow-sm transition-all duration-300 mt-4",
                    showAdvancedGeneral
                      ? "bg-content2 p-6 space-y-6"
                      : "bg-[var(--md-sys-color-surface-container-low)] hover:bg-content2 p-4 sm:p-5"
                  )}>
                    <button
                      onClick={() => setShowAdvancedGeneral(!showAdvancedGeneral)}
                      type="button"
                      className="relative w-full flex items-center justify-between font-bold text-left cursor-pointer focus:outline-none overflow-hidden"
                    >
                      {/* @ts-ignore */}
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
                          <Sliders size={20} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-foreground">
                            {settings.language === "ms" ? "Pilihan Paparan & Luar Talian Lanjutan" : "Advanced View & Offline Options"}
                          </h3>
                          <p className="text-xs text-default-500 mt-0.5">
                            {settings.language === "ms" 
                              ? "Format Hijri, tetapan Iqamah, Imsak, Jumaat, dan mod luar talian." 
                              : "Hijri formatting, Iqamah, Imsak, Jumu'ah, and offline caching."}
                          </p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: showAdvancedGeneral ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-default-500"
                      >
                        <ChevronDown size={20} />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {showAdvancedGeneral && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden space-y-6 pt-4 border-t border-divider"
                        >
                          <div className="space-y-2">
                            <label className="md3-label-large font-bold text-foreground">
                              {t("hijriFormat")}
                            </label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {/* @ts-ignore */}
                              <Button size="sm" variant={!settings.hijriFormat || settings.hijriFormat === "both" ? "solid" : "flat"} color={!settings.hijriFormat || settings.hijriFormat === "both" ? "primary" : "default"}
                                
                                
                                onClick={() => updateSettings({ hijriFormat: "both" })}
                              >{t("hijriBoth")}</Button>
                              {/* @ts-ignore */}
                              <Button size="sm" variant={settings.hijriFormat === "text" ? "solid" : "flat"} color={settings.hijriFormat === "text" ? "primary" : "default"}
                                
                                
                                onClick={() => updateSettings({ hijriFormat: "text" })}
                              >{t("hijriText")}</Button>
                              {/* @ts-ignore */}
                              <Button size="sm" variant={settings.hijriFormat === "number" ? "solid" : "flat"} color={settings.hijriFormat === "number" ? "primary" : "default"}
                                
                                
                                onClick={() => updateSettings({ hijriFormat: "number" })}
                              >{t("hijriNumber")}</Button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-3xl bg-content1 ring-1 ring-[var(--md-sys-color-outline)]/5 shadow-sm mt-4">
                            <div>
                              <label className="md3-label-large font-bold text-foreground block mb-0.5">
                                {t("showIqamah" as any)}
                              </label>
                              <p className="md3-body-small text-default-500 leading-relaxed max-w-[200px] sm:max-w-xs">
                                {t("iqamahDesc" as any)}
                              </p>
                            </div>
                            {/* @ts-ignore */}
                            <Switch
                              isSelected={!!settings.showIqamah}
                              onChange={(e: any) =>
                                updateSettings({ showIqamah: e.target.selected })
                              }
                             />
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-3xl bg-content1 ring-1 ring-[var(--md-sys-color-outline)]/5 shadow-sm mt-2">
                            <div>
                              <label className="md3-label-large font-bold text-foreground block mb-0.5">
                                {t("trackImsak" as any) || "Track Imsak"}
                              </label>
                              <p className="md3-body-small text-default-500 leading-relaxed max-w-[200px] sm:max-w-xs">
                                {t("trackImsakDesc" as any) || "Show Imsak as the next time after Isha"}
                              </p>
                            </div>
                            {/* @ts-ignore */}
                            <Switch
                              isSelected={!!settings.trackImsak}
                              onChange={(e: any) =>
                                updateSettings({ trackImsak: e.target.selected })
                              }
                             />
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-3xl bg-content1 ring-1 ring-[var(--md-sys-color-outline)]/5 shadow-sm mt-2">
                            <div>
                              <label className="md3-label-large font-bold text-foreground block mb-0.5">
                                {t("showJumaat" as any) || "Show Jumu'ah"}
                              </label>
                              <p className="md3-body-small text-default-500 leading-relaxed max-w-[200px] sm:max-w-xs">
                                {t("showJumaatDesc" as any) || "Replace Dhuhr with Jumu'ah on Fridays"}
                              </p>
                            </div>
                            {/* @ts-ignore */}
                            <Switch
                              isSelected={settings.showJumaat !== false}
                              onChange={(e: any) =>
                                updateSettings({ showJumaat: e.target.selected })
                              }
                             />
                          </div>

                          {/* Offline Mode section */}
                          <hr className="border-divider my-4" />

                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <WifiOff className="text-primary w-5 h-5" />
                              <h3 className="md3-title-medium font-bold text-foreground">
                                {t("offlineMode" as any)}
                              </h3>
                            </div>

                            <p className="md3-body-small text-default-500 leading-relaxed">
                              {t("saveOfflineDesc" as any)}
                            </p>

                            <div className="p-5 rounded-3xl bg-content3 ring-1 ring-[var(--md-sys-color-outline)]/5 space-y-4">
                              {/* Cache Status */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-divider pb-4">
                                <div>
                                  <span className="text-xs uppercase font-black tracking-widest text-default-500">
                                    {t("cachingStatus" as any)}
                                  </span>
                                  <div className="font-bold text-sm sm:text-base mt-0.5 text-foreground">
                                    {settings.offlineCachedRange ? (
                                      <span className="flex items-center gap-1.5 text-primary">
                                        <Check size={16} className="stroke-[3]" />
                                        {t("offlineCacheSaved" as any)
                                          .replace("{zone}", selectedZone)
                                          .replace("{range}", t(`offline${settings.offlineCachedRange.charAt(0).toUpperCase() + settings.offlineCachedRange.slice(1)}` as any))}
                                      </span>
                                    ) : (
                                      <span className="text-[var(--md-sys-color-outline)]">
                                        {t("offlineCacheNotSaved" as any)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {settings.offlineCachedAt && (
                                  <div className="text-right">
                                    <span className="text-[10px] sm:text-xs text-default-500 block">
                                      {t("offlineCacheAtLabel" as any).replace(
                                        "{date}",
                                        new Date(settings.offlineCachedAt).toLocaleDateString(
                                          settings.language === "ms" ? "ms-MY" : "en-US",
                                          { dateStyle: "medium" }
                                        )
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Cache Duration */}
                              <div className="space-y-2">
                                <label className="md3-label-large font-bold text-foreground block">
                                  {t("offlineDuration" as any)}
                                </label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {(["week", "month", "year"] as const).map((range) => (
                                    /* @ts-ignore */
                                    <Button size="sm" variant={downloadRange === range ? "solid" : "flat"} color={downloadRange === range ? "primary" : "default"}
                                      key={range}
                                      ` as any)}
                                      
                                      onClick={() => setDownloadRange(range)}
                                    >{t(`offline${range.charAt(0).toUpperCase() + range.slice(1)}</Button>
                                  ))}
                                </div>
                              </div>

                              {/* Save & Clear Buttons */}
                              <div className="flex flex-wrap items-center gap-3 pt-2">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  disabled={isDownloading}
                                  onClick={handleSaveOffline}
                                  type="button"
                                  className={cn(
                                    "flex-1 sm:flex-none px-6 py-3 rounded-full font-bold flex items-center justify-center gap-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]",
                                    isDownloading
                                      ? "bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-outline)] cursor-not-allowed"
                                      : "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm hover:opacity-95"
                                  )}
                                >
                                  {isDownloading ? (
                                    <>
                                      <RefreshCw size={16} className="animate-spin" />
                                      {t("syncing" as any)}
                                    </>
                                  ) : (
                                    <>
                                      <Download size={16} />
                                      {t("saveOfflineBtn" as any)}
                                    </>
                                  )}
                                </motion.button>

                                {settings.offlineCachedRange && (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={isClearing}
                                    onClick={handleClearCache}
                                    type="button"
                                    className={cn(
                                      "flex-1 sm:flex-none px-5 py-3 rounded-full font-bold flex items-center justify-center gap-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-error)]",
                                      isClearing
                                        ? "bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-outline)] cursor-not-allowed"
                                        : "bg-danger-50 text-[var(--md-sys-color-on-error-container)] shadow-sm hover:opacity-90"
                                    )}
                                  >
                                    {isClearing ? (
                                      <>
                                        <RefreshCw size={16} className="animate-spin" />
                                        {settings.language === "ms" ? "Membersih..." : "Clearing..."}
                                      </>
                                    ) : (
                                      <>
                                        <Trash2 size={16} />
                                        {settings.language === "ms" ? "Padam Cache" : "Clear Cache"}
                                      </>
                                    )}
                                  </motion.button>
                                )}
                              </div>

                              {/* Feedback Messages */}
                              <div className="min-h-[20px]">
                                {downloadError && (
                                  <span className="text-xs text-danger font-bold flex items-center gap-1">
                                    <AlertCircle size={14} />
                                    {downloadError}
                                  </span>
                                )}
                                {downloadSuccess && (
                                  <span className="text-xs text-primary font-bold flex items-center gap-1">
                                    <Check size={14} className="stroke-[3]" />
                                    {t("saveOfflineSuccess" as any)}
                                  </span>
                                )}
                                {clearSuccess && (
                                  <span className="text-xs text-primary font-bold flex items-center gap-1">
                                    <Check size={14} className="stroke-[3]" />
                                    {settings.language === "ms" ? "Cache berjaya dipadam" : "Cache cleared successfully"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Auto Sync Offline Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-3xl bg-content1 ring-1 ring-[var(--md-sys-color-outline)]/5 shadow-sm">
                              <div className="pr-4">
                                <label className="md3-label-large font-bold text-foreground block mb-0.5">
                                  {t("autoSyncOffline" as any)}
                                </label>
                                <p className="md3-body-small text-default-500 leading-relaxed max-w-[200px] sm:max-w-xs">
                                  {t("autoSyncOfflineDesc" as any)}
                                </p>
                              </div>
                              {/* @ts-ignore */}
                              <Switch
                                isSelected={!!settings.autoSyncOffline}
                                onChange={(e: any) =>
                                  updateSettings({ autoSyncOffline: e.target.selected })
                                }
                               />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-6">
                  {permission !== "granted" && (
                    <div className="mb-2 p-5 bg-danger-50 text-[var(--md-sys-color-on-error-container)] rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-sm border border-[var(--md-sys-color-error)]/20">
                      <div>
                        <p className="font-bold mb-1">
                          {t("blockedNotificationsTitle")}
                        </p>
                        <p className="text-sm opacity-90">
                          {t("blockedNotificationsDesc")}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onRequestPermission}
                        className="px-5 py-2.5 bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] rounded-full font-bold whitespace-nowrap hover:opacity-90 w-full sm:w-auto shadow-sm"
                      >
                        {t("managePermission")}
                      </motion.button>
                    </div>
                  )}

                  {/* VISUAL ALERTS STYLE SETTINGS CARD (FLOATING/OVERLAY NOTIFICATIONS FOR ALL PEOPLE) */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-content3 ring-1 ring-[var(--md-sys-color-outline)]/10 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
                        <Smartphone size={20} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-foreground">
                          {t("visualAlertSection" as any)}
                        </h3>
                        <p className="text-xs text-default-500">
                          {settings.language === "ms" 
                            ? "Tetapkan gaya overlay pengumuman waktu azan semasa aplikasi dibuka." 
                            : "Configure style of adhan time announcements when app is active."}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-divider">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-primary ml-1">
                          {t("azanAlertStyle" as any)}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(["dramatic", "standard", "modern", "subtle", "minimal", "none"] as const).map((style) => (
                            /* @ts-ignore */
                            <Button size="sm" variant={settings.azanAlertStyle === style || (!settings.azanAlertStyle && style === "standard") ? "solid" : "flat"} color={settings.azanAlertStyle === style || (!settings.azanAlertStyle && style === "standard") ? "primary" : "default"}
                              key={style}
                              
                              
                              onClick={() => updateSettings({ azanAlertStyle: style })}
                            >{
                                style === "dramatic"
                                  ? t("styleDramatic" as any)
                                  : style === "standard"
                                    ? t("styleStandard" as any)
                                    : style === "modern"
                                      ? t("styleModern" as any)
                                      : style === "subtle"
                                        ? t("styleSubtle" as any)
                                        : style === "minimal"
                                          ? t("styleMinimal" as any)
                                          : t("none")
                              }</Button>
                          ))}
                        </div>
                      </div>

                      {settings.azanAlertStyle !== "none" && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between p-4 bg-content1 rounded-[2rem] shadow-sm ring-1 ring-[var(--md-sys-color-outline)]/5 mt-4">
                            <span className="font-bold text-foreground text-sm">
                              {t("azanAlertDuration" as any)}
                            </span>
                            <div className="flex-1 px-2 sm:px-4">
                              {/* @ts-ignore */}
                              <Slider
                                min="5"
                                max="120"
                                step="5"
                                value={settings.azanAlertDuration ?? 20}
                                labeled
                                ticks
                                onChange={(e: any) => updateSettings({ azanAlertDuration: e.target.value })}
                               className="max-w-md" />
                            </div>
                            <span className="w-20 text-right font-mono text-lg font-black text-primary">
                              {settings.azanAlertDuration ?? 20}s
                            </span>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.02, y: -0.5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              onPreviewAzanAlert?.(settings.azanAlertStyle || "standard");
                            }}
                            className="w-full py-3 px-4 mt-2 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] font-black text-xs rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Volume2 size={16} />
                            <span>{settings.language === "ms" ? "Pratonton Gaya Amaran" : "Preview Alert Style"}</span>
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>

                  {PRAYER_KEYS.map((key) => {
                    const pref = preferences[key] || {
                      enabled: false,
                      preAlert: 0,
                      sound: "default",
                      offset: 0,
                    };
                    const isFardhu = [
                      "fajr",
                      "dhuhr",
                      "asr",
                      "maghrib",
                      "isha",
                    ].includes(key);

                    return (
                      <div
                        key={key}
                        className={cn(
                          "p-6 sm:p-8 rounded-3xl transition-all duration-300 shadow-sm overflow-hidden",
                          pref.enabled
                            ? "border border-transparent bg-[var(--md-sys-color-primary-container)]/10 ring-1 ring-[var(--md-sys-color-primary)]/20"
                            : "border border-transparent bg-[var(--md-sys-color-surface-variant)]/30 grayscale-[0.3]",
                        )}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                          <div className="flex items-center gap-4">
                            {/* @ts-ignore */}
                            <Switch
                              isSelected={pref.enabled}
                              onChange={(e: any) =>
                                onUpdatePreference(key, {
                                  enabled: e.target.selected,
                                })
                              }
                             />
                            <div>
                              <h4
                                className={cn(
                                  "text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 transition-colors duration-300",
                                  pref.enabled
                                    ? "text-foreground"
                                    : "text-default-500/70",
                                )}
                              >
                                {t(key as any)}
                                {!isFardhu && (
                                  <span className="px-2 py-0.5 rounded-md bg-[var(--md-sys-color-surface-variant)] text-[10px] font-black uppercase tracking-widest opacity-80">
                                    {t("filterSunat" as any)}
                                  </span>
                                )}
                              </h4>
                            </div>
                          </div>

                          {pref.enabled && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (
                                  pref.sound === "default" &&
                                  permission === "granted"
                                ) {
                                  new Notification(
                                    t("testDefaultNotificationTitle" as any),
                                    {
                                      body: t(
                                        "testDefaultNotificationBody" as any,
                                      ),
                                    },
                                  );
                                } else {
                                  onTestSound(
                                    pref.sound,
                                    `${t("testSoundBody" as any)} ${t(key as any)}`,
                                  );
                                }
                              }}
                              className="text-xs font-bold px-4 py-2 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] transition-colors shadow-sm whitespace-nowrap self-end sm:self-auto"
                            >
                              {t("testSound")}
                            </motion.button>
                          )}
                        </div>

                        <div
                          className={cn(
                            "flex flex-col gap-4 mt-2 transition-opacity duration-300",
                            !pref.enabled && "opacity-50 pointer-events-none",
                          )}
                        >
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-primary ml-1">
                              {t("sound")}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {SOUND_OPTIONS.map((opt) => (
                                /* @ts-ignore */
                                <Button size="sm" variant={pref.sound === opt.value ? "solid" : "flat"} color={pref.sound === opt.value ? "primary" : "default"}
                                  key={opt.value}
                                  
                                  
                                  onClick={() =>
                                    onUpdatePreference(key, {
                                      sound: opt.value,
                                    })
                                  }
                                >
                                  <opt.icon slot="icon" size={18} />
                                </md-filter-chip>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-primary ml-1">
                              {t("preAlert")}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {PRE_ALERT_OPTIONS.map((opt) => (
                                /* @ts-ignore */
                                <md-filter-chip
                                  key={opt.value}
                                  label={opt.label}
                                  selected={pref.preAlert === opt.value}
                                  onClick={() =>
                                    onUpdatePreference(key, {
                                      preAlert: opt.value,
                                    })
                                  }
                                >{opt.label}</Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === "adjustments" && (
                <div className="space-y-8 max-w-xl mx-auto pb-4">
                  <div>
                    <p className="text-sm text-default-500 mb-4 bg-[var(--md-sys-color-surface-variant)]/30 p-5 rounded-[2rem] font-medium leading-relaxed ring-1 ring-[var(--md-sys-color-outline)]/5 shadow-inner">
                      {t("offsetDescription" as any)}
                    </p>
                    <div className="space-y-4">
                      {PRAYER_KEYS.map((key) => {
                        const pref = preferences[key] || { offset: 0 };
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between p-4 sm:p-5 bg-content1 rounded-[2rem] shadow-sm ring-1 ring-[var(--md-sys-color-outline)]/5 hover:shadow-md transition-shadow"
                          >
                            <span className="font-black text-foreground w-24 tracking-wider uppercase text-sm">
                              {t(key as any)}
                            </span>
                            <div className="flex items-center gap-3 sm:gap-4">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  onUpdatePreference(key, {
                                    offset: (pref.offset || 0) - 1,
                                  })
                                }
                                className="relative overflow-hidden w-10 h-10 rounded-full flex items-center justify-center bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] transition-colors"
                              >
                                {/* @ts-ignore */}
                                
                                <Minus size={20} className="relative z-10" />
                              </motion.button>
                              <span className="w-10 sm:w-16 flex font-mono text-lg sm:text-2xl font-black items-center justify-center tabular-nums text-primary">
                                {pref.offset > 0 ? "+" : ""}
                                {pref.offset || 0}
                              </span>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  onUpdatePreference(key, {
                                    offset: (pref.offset || 0) + 1,
                                  })
                                }
                                className="relative overflow-hidden w-10 h-10 rounded-full flex items-center justify-center bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] transition-colors"
                              >
                                {/* @ts-ignore */}
                                
                                <Plus size={20} className="relative z-10" />
                              </motion.button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {settings.showIqamah && (
                    <div>
                      <h3 className="text-xl font-black text-primary mb-4 px-2">
                        {t("iqamahOffset" as any)}
                      </h3>
                      <div className="space-y-4">
                        {(
                          ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const
                        ).map((key) => {
                          const pref = preferences[key] || { iqamahOffset: 0 };
                          return (
                            <div
                              key={`iqamah-${key}`}
                              className="flex items-center justify-between p-4 sm:p-5 bg-content1 rounded-[2rem] shadow-sm ring-1 ring-[var(--md-sys-color-outline)]/5 hover:shadow-md transition-shadow"
                            >
                              <span className="font-black text-foreground w-24 tracking-wider uppercase text-sm">
                                {t(key as any)}
                              </span>
                              <div className="flex items-center gap-3 sm:gap-4">
                                <Button isIconOnly variant="flat"
                                  onClick={() =>
                                    onUpdatePreference(key, {
                                      iqamahOffset: Math.max(
                                        0,
                                        (pref.iqamahOffset || 0) - 1,
                                      ),
                                    })
                                  }
                                >
                                  <span slot="icon" className="font-bold">
                                    -
                                  </span>
                                </Button>
                                <span className="w-10 sm:w-16 flex font-mono text-lg sm:text-2xl font-black items-center justify-center tabular-nums text-primary">
                                  {pref.iqamahOffset || 0}
                                </span>
                                <Button isIconOnly variant="flat"
                                  onClick={() =>
                                    onUpdatePreference(key, {
                                      iqamahOffset:
                                        (pref.iqamahOffset || 0) + 1,
                                    })
                                  }
                                >
                                  <span slot="icon" className="font-bold">
                                    +
                                  </span>
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "advanced" && (
                <div className="space-y-6 max-w-2xl mx-auto pb-4">
                  {/* Sunnah Settings */}
                  <div className="bg-content2 rounded-[32px] p-6 sm:p-8 border border-divider shadow-sm space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
                        <MoonStar size={20} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-foreground">
                          {t("showSunnahTimes" as any) || "Waktu Sunat"}
                        </h3>
                        <p className="text-xs text-default-500">
                          Papar waktu-waktu ibadah sunat dan waktu haram solat.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SUNNAH_KEYS.map((key) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-content1 rounded-2xl ring-1 ring-[var(--md-sys-color-outline)]/5 shadow-sm">
                          <div>
                            <span className="font-bold text-foreground text-sm block">
                              {t(key as any)}
                            </span>
                            <span className="text-[10px] text-default-500 leading-tight block mt-0.5">
                              {t(`${key}Desc` as any)}
                            </span>
                          </div>
                          {/* @ts-ignore */}
                          <Switch
                            isSelected={!!settings.showSunnahTimes?.includes(key)}
                            onChange={(e: any) => {
                              const current = settings.showSunnahTimes || [];
                              const isSelected = e.target.selected;
                              if (isSelected && !current.includes(key as any)) {
                                updateSettings({ showSunnahTimes: [...current, key as any] });
                              } else if (!isSelected && current.includes(key as any)) {
                                updateSettings({ showSunnahTimes: current.filter(k => k !== key) });
                              }
                            }}
                           />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Calculation Rules (Collapsible) */}
                  <div className={cn(
                    "rounded-[32px] overflow-hidden border border-divider shadow-sm transition-all duration-300",
                    showAdvancedCalculations
                      ? "bg-content2 p-6 space-y-6"
                      : "bg-[var(--md-sys-color-surface-container-low)] hover:bg-content2 p-4 sm:p-5"
                  )}>
                    <button
                      onClick={() => setShowAdvancedCalculations(!showAdvancedCalculations)}
                      type="button"
                      className="relative w-full flex items-center justify-between font-bold text-left cursor-pointer focus:outline-none overflow-hidden"
                    >
                      {/* @ts-ignore */}
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
                          <Sliders size={20} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-foreground">
                            {t("advancedCalculationRules" as any)}
                          </h3>
                          <p className="text-xs text-default-500 mt-0.5">
                            {settings.language === "ms" 
                              ? "Ubahsuai offset Imsak/Sahur, kaedah Tengah Malam & Asar." 
                              : "Modify Suhoor/Imsak offsets, Midnight & Asar methods."}
                          </p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: showAdvancedCalculations ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-default-500"
                      >
                        <ChevronDown size={20} />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {showAdvancedCalculations && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden space-y-6 pt-4 border-t border-divider"
                        >
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-primary ml-1">
                              {t("suhoorOffset" as any)}
                            </label>
                            <div className="flex flex-wrap gap-2 animate-in fade-in duration-200">
                              {[15, 30, 45, 60].map((mins) => (
                                /* @ts-ignore */
                                <Button size="sm" variant={settings.suhoorOffset === mins || (!settings.suhoorOffset && mins === 30) ? "solid" : "flat"} color={settings.suhoorOffset === mins || (!settings.suhoorOffset && mins === 30) ? "primary" : "default"}
                                  key={`suhoor-${mins}`}
                                   min`}
                                  
                                  onClick={() => updateSettings({ suhoorOffset: mins })}
                                >{`${mins}</Button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-primary ml-1">
                              {t("imsakOffset" as any)}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {[2, 5, 10, 15].map((mins) => (
                                /* @ts-ignore */
                                <Button size="sm" variant={settings.imsakOffset === mins || (!settings.imsakOffset && mins === 10) ? "solid" : "flat"} color={settings.imsakOffset === mins || (!settings.imsakOffset && mins === 10) ? "primary" : "default"}
                                  key={`imsak-${mins}`}
                                   min`}
                                  
                                  onClick={() => updateSettings({ imsakOffset: mins })}
                                >{`${mins}</Button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-primary ml-1">
                              {t("midnightMethod" as any)}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {/* @ts-ignore */}
                              <Button size="sm" variant={!settings.midnightMethod || settings.midnightMethod === "fajr" ? "solid" : "flat"} color={!settings.midnightMethod || settings.midnightMethod === "fajr" ? "primary" : "default"}
                                
                                
                                onClick={() => updateSettings({ midnightMethod: "fajr" })}
                              >{t("midnightFajr" as any)}</Button>
                              {/* @ts-ignore */}
                              <Button size="sm" variant={settings.midnightMethod === "sunrise" ? "solid" : "flat"} color={settings.midnightMethod === "sunrise" ? "primary" : "default"}
                                
                                
                                onClick={() => updateSettings({ midnightMethod: "sunrise" })}
                              >{t("midnightSunrise" as any)}</Button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-primary ml-1">
                              {t("asrEnds" as any)}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {/* @ts-ignore */}
                              <Button size="sm" variant={!settings.asrEnds || settings.asrEnds === "maghrib" ? "solid" : "flat"} color={!settings.asrEnds || settings.asrEnds === "maghrib" ? "primary" : "default"}
                                
                                
                                onClick={() => updateSettings({ asrEnds: "maghrib" })}
                              >{t("asrEndsMaghrib" as any)}</Button>
                              {/* @ts-ignore */}
                              <Button size="sm" variant={settings.asrEnds === "sunset" ? "solid" : "flat"} color={settings.asrEnds === "sunset" ? "primary" : "default"}
                                
                                
                                onClick={() => updateSettings({ asrEnds: "sunset" })}
                              >{t("asrEndsSunset" as any)}</Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Hijri Calendar Engine (Collapsible) */}
                  <div className={cn(
                    "rounded-[32px] overflow-hidden border border-divider shadow-sm transition-all duration-300 mt-4",
                    showHijriEngine
                      ? "bg-content2 p-6 space-y-6"
                      : "bg-[var(--md-sys-color-surface-container-low)] hover:bg-content2 p-4 sm:p-5"
                  )}>
                    <button
                      onClick={() => setShowHijriEngine(!showHijriEngine)}
                      type="button"
                      className="relative w-full flex items-center justify-between font-bold text-left cursor-pointer focus:outline-none overflow-hidden"
                    >
                      {/* @ts-ignore */}
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
                          <Sliders size={20} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-foreground">
                            {t("hijriCalendarEngine" as any)}
                          </h3>
                          <p className="text-xs text-default-500 mt-0.5">
                            {settings.language === "ms" 
                              ? "Tetapkan kaedah kiraan kalendar Hijri & pelarasan hari." 
                              : "Configure Hijri calendar calculation methods & day offset."}
                          </p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: showHijriEngine ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-default-500"
                      >
                        <ChevronDown size={20} />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {showHijriEngine && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden space-y-6 pt-4 border-t border-divider"
                        >
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-primary ml-1">
                              {t("hijriMethod" as any)}
                            </label>
                            <div className="w-full">
                              {/* @ts-ignore */}
                              <Select variant="bordered" className="max-w-xs"
                                value={settings.hijriMethod || "jakim"}
                                onChange={(e: any) => updateSettings({ hijriMethod: e.target.value })}
                                onInput={(e: any) => updateSettings({ hijriMethod: e.target.value })}
                                style={{ width: "100%" }}
                              >
                                {((["jakim", "umalqura", "tbla", "civil", "islamic"] as const).map((method) => (
                                  /* @ts-ignore */
                                  <SelectItem 
                                    key={`hijri-${method}`} 
                                    key={method}
                                    onClick={() => updateSettings({ hijriMethod: method })}
                                  >
                                    {t(`method${method.charAt(0).toUpperCase() + method.slice(1)}` as any)}
                                  </SelectItem>
                                )))}
                              </Select>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-content1 rounded-[2rem] shadow-sm ring-1 ring-[var(--md-sys-color-outline)]/5 mt-4">
                            <span className="font-bold text-foreground text-sm">
                              {t("hijriAdjustment" as any)}
                            </span>
                            <div className="flex items-center gap-3 sm:gap-4">
                              {/* @ts-ignore */}
                              <Button isIconOnly variant="flat"
                                onClick={() =>
                                  updateSettings({
                                    hijriAdjustment: Math.max(-2, (settings.hijriAdjustment ?? 0) - 1),
                                  })
                                }
                                aria-label={settings.language === "ms" ? "Kurangkan pelarasan Hijri" : "Decrease Hijri adjustment"}
                              >
                                <Minus size={20} />
                              </Button>
                              <span className="w-16 flex font-mono text-lg sm:text-xl font-black items-center justify-center tabular-nums text-primary">
                                {(settings.hijriAdjustment ?? 0) > 0 ? "+" : ""}
                                {settings.hijriAdjustment ?? 0}
                              </span>
                              {/* @ts-ignore */}
                              <Button isIconOnly variant="flat"
                                onClick={() =>
                                  updateSettings({
                                    hijriAdjustment: Math.min(2, (settings.hijriAdjustment ?? 0) + 1),
                                  })
                                }
                                aria-label={settings.language === "ms" ? "Tambah pelarasan Hijri" : "Increase Hijri adjustment"}
                              >
                                <Plus size={20} />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {activeTab === "mosque" && (
                <div className="space-y-8 max-w-xl mx-auto pb-6">


                  {/* SUB-SECTION 2: IQAMAH COUNTDOWN SOUNDS */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-content3 ring-1 ring-[var(--md-sys-color-outline)]/10 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
                        <Activity size={20} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-foreground">
                          {t("iqamahSoundSection" as any)}
                        </h3>
                        <p className="text-xs text-default-500">
                          Select countdown alert tones and audition sounds.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-divider">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-primary ml-1">
                          {t("iqamahCountdownSound" as any)}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(["chime", "tick", "none"] as const).map((sound) => (
                            /* @ts-ignore */
                            <Button size="sm" variant={settings.iqamahCountdownSound === sound || (!settings.iqamahCountdownSound && sound === "chime") ? "solid" : "flat"} color={settings.iqamahCountdownSound === sound || (!settings.iqamahCountdownSound && sound === "chime") ? "primary" : "default"}
                              key={sound}
                              
                              
                              onClick={() => updateSettings({ iqamahCountdownSound: sound })}
                            >{
                                sound === "chime"
                                  ? t("chime" as any)
                                  : sound === "tick"
                                    ? t("clockMovementTick" as any)
                                    : t("none")
                              }</Button>
                          ))}
                        </div>
                      </div>

                      {/* Audition Testing row */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => playSynthesizedSoundLocal('chime', 800)}
                          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-3xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] text-xs font-bold shadow-sm border border-divider transition-all focus:outline-none"
                        >
                          <Volume2 size={16} />
                          {t("testIqamahChime" as any)}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => playSynthesizedSoundLocal('tick')}
                          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-3xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] text-xs font-bold shadow-sm border border-divider transition-all focus:outline-none"
                        >
                          <Volume2 size={16} />
                          {t("testIqamahTick" as any)}
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* SUB-SECTION 3: SOLAT SCREENAVER */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-content3 ring-1 ring-[var(--md-sys-color-outline)]/10 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
                        <Clock size={20} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-foreground">
                          {t("solatScreensaverSection" as any)}
                        </h3>
                        <p className="text-xs text-default-500">
                          Configure private prayer window and remembrance timers.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-divider">
                      <div className="flex items-center justify-between p-1">
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            {t("solatModeEnabled" as any)}
                          </h4>
                          <p className="text-[11px] text-default-500 leading-relaxed mt-0.5">
                            {t("solatModeInstruction" as any)}
                          </p>
                        </div>
                        {/* @ts-ignore */}
                        <Switch
                          isSelected={!!settings.solatModeEnabled}
                          onChange={(e: any) =>
                            updateSettings({ solatModeEnabled: e.target.selected })
                          }
                         />
                      </div>

                      {settings.solatModeEnabled && (
                        <div className="space-y-4 pt-4 mt-2 border-t border-divider">
                          {/* Show Clock & Qibla toggles */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center justify-between p-4 bg-content1 rounded-[2rem] shadow-sm ring-1 ring-[var(--md-sys-color-outline)]/5">
                              <span className="font-bold text-foreground text-xs">
                                {t("solatModeShowClock" as any)}
                              </span>
                              {/* @ts-ignore */}
                              <Switch
                                isSelected={settings.solatModeShowClock !== false}
                                onChange={(e: any) =>
                                  updateSettings({ solatModeShowClock: e.target.selected })
                                }
                               />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-content1 rounded-[2rem] shadow-sm ring-1 ring-[var(--md-sys-color-outline)]/5">
                              <span className="font-bold text-foreground text-xs">
                                {t("solatModeShowQibla" as any)}
                              </span>
                              {/* @ts-ignore */}
                              <Switch
                                isSelected={settings.solatModeShowQibla !== false}
                                onChange={(e: any) =>
                                  updateSettings({ solatModeShowQibla: e.target.selected })
                                }
                               />
                            </div>
                          </div>

                          {/* Post-solat Dua duration */}
                          <div className="flex items-center justify-between p-4 bg-content1 rounded-[2rem] shadow-sm ring-1 ring-[var(--md-sys-color-outline)]/5 mt-2">
                            <div>
                              <span className="font-bold text-foreground text-sm block">
                                {t("solatModeDuaDuration" as any)}
                              </span>
                              <span className="text-[10px] text-default-500 block">
                                Serene dhikr interval before exit.
                              </span>
                            </div>
                            <div className="flex-1 px-4 max-w-[200px]">
                              {/* @ts-ignore */}
                              <Slider
                                min="0"
                                max="10"
                                step="1"
                                value={settings.solatModeDuaDuration ?? 0}
                                labeled
                                ticks
                                onChange={(e: any) => updateSettings({ solatModeDuaDuration: e.target.value })}
                               className="max-w-md" />
                            </div>
                            <span className="w-12 text-right font-mono font-bold text-primary tabular-nums">
                              {settings.solatModeDuaDuration ?? 0}m
                            </span>
                          </div>

                          {/* Individual Prayer Durations */}
                          <div className="pt-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary ml-1 mb-2">
                              {t("solatModeDuration" as any)}
                            </h4>
                            <div className="space-y-2">
                              {(["fajr", "dhuhr", "asr", "maghrib", "isha"] as const).map((key) => {
                                const duration = settings.solatModeDuration?.[key] ?? 10;
                                return (
                                  <div
                                    key={`solat-dur-${key}`}
                                    className="flex items-center justify-between p-3 bg-content1 rounded-[1.5rem] shadow-sm ring-1 ring-[var(--md-sys-color-outline)]/5"
                                  >
                                    <span className="font-bold text-foreground tracking-wider uppercase text-xs w-24 pl-1">
                                      {t(key as any)}
                                    </span>
                                    <div className="flex-1 px-4">
                                      {/* @ts-ignore */}
                                      <Slider
                                        min="1"
                                        max="60"
                                        step="1"
                                        value={duration}
                                        labeled
                                        ticks
                                        onChange={(e: any) => {
                                          const currentDurations = settings.solatModeDuration ?? { fajr: 10, dhuhr: 10, asr: 10, maghrib: 10, isha: 10 };
                                          updateSettings({
                                            solatModeDuration: {
                                              ...currentDurations,
                                              [key]: e.target.value,
                                            },
                                          });
                                        }}
                                       className="max-w-md" />
                                    </div>
                                    <span className="w-12 text-right font-mono font-bold text-primary tabular-nums text-sm">
                                      {duration}m
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SUB-SECTION 4: BACKGROUND UTILITY */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-content3 ring-1 ring-[var(--md-sys-color-outline)]/10 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          {t("backgroundNotifications" as any)}
                        </h3>
                        <p className="text-[10px] text-default-500 leading-relaxed mt-0.5 max-w-[200px] sm:max-w-xs">
                          Keep prayer sound/alerts active even when tab is minimized or screen is locked.
                        </p>
                      </div>
                      {/* @ts-ignore */}
                      <Switch
                        isSelected={!!settings.backgroundNotifications}
                        onChange={(e: any) =>
                          updateSettings({ backgroundNotifications: e.target.selected })
                        }
                       />
                    </div>
                  </div>
                </div>
              )}
            </div>
</ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
