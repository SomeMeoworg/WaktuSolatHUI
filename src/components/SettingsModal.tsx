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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{ isolation: "isolate" }}
        >
          <div className="absolute inset-0 bg-black/80" onClick={onClose} />

          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[var(--md-sys-color-surface-container)] w-full max-w-3xl max-h-[90dvh] flex flex-col rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden shadow-2xl border border-[var(--md-sys-color-outline)]/20 shadow-black/50"
          >
            <div className="flex items-center justify-between p-6 sm:px-8 sm:pt-8 sm:pb-4 border-b border-[var(--md-sys-color-outline)]/10 shrink-0 bg-[var(--md-sys-color-surface)]">
              <div>
                <h2 className="md3-headline-small font-bold">
                  {t("settings")}
                </h2>
              </div>
               <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                aria-label={t("close") || "Close"}
                className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-error-container)] hover:text-[var(--md-sys-color-on-error-container)] shrink-0 shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-error)]"
              >
                <X size={22} className="stroke-[2.5]" />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="w-full overflow-x-auto no-scrollbar border-b border-[var(--md-sys-color-outline)]/10 shrink-0">
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
                  <div className="bg-[var(--md-sys-color-surface-container)] rounded-[32px] p-6 border border-[var(--md-sys-color-outline)]/5 shadow-sm space-y-6">
                    <div className="space-y-3">
                      <label className="md3-title-medium font-bold text-[var(--md-sys-color-primary)] flex items-center gap-2">
                        {t("language")}
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {/* @ts-ignore */}
                        <md-filter-chip
                          label={t("malay" as any)}
                          selected={settings.language === "ms"}
                          onClick={() => updateSettings({ language: "ms" })}
                        ></md-filter-chip>
                        {/* @ts-ignore */}
                        <md-filter-chip
                          label={t("english" as any)}
                          selected={settings.language === "en"}
                          onClick={() => updateSettings({ language: "en" })}
                        ></md-filter-chip>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="md3-title-medium font-bold text-[var(--md-sys-color-primary)] flex items-center gap-2">
                        {t("timeFormat")}
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {/* @ts-ignore */}
                        <md-filter-chip
                          label={t("hour12" as any)}
                          selected={settings.timeFormat === "12h"}
                          onClick={() => updateSettings({ timeFormat: "12h" })}
                        ></md-filter-chip>
                        {/* @ts-ignore */}
                        <md-filter-chip
                          label={t("hour24" as any)}
                          selected={settings.timeFormat === "24h"}
                          onClick={() => updateSettings({ timeFormat: "24h" })}
                        ></md-filter-chip>
                      </div>
                    </div>
                  </div>

                  {/* Religion & Formatting Card */}
                  <div className="bg-[var(--md-sys-color-surface-container)] rounded-[32px] p-6 border border-[var(--md-sys-color-outline)]/5 shadow-sm space-y-6">
                    <div className="space-y-3">
                      <label className="md3-title-medium font-bold text-[var(--md-sys-color-primary)] flex items-center gap-2">
                        {t("mazhab")}
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {/* @ts-ignore */}
                        <md-filter-chip
                          label={t("mazhabShafii" as any)}
                          selected={settings.mazhab !== "hanafi"}
                          onClick={() => updateSettings({ mazhab: "shafii" })}
                        ></md-filter-chip>
                        {/* @ts-ignore */}
                        <md-filter-chip
                          label={t("mazhabHanafi" as any)}
                          selected={settings.mazhab === "hanafi"}
                          onClick={() => updateSettings({ mazhab: "hanafi" })}
                        ></md-filter-chip>
                      </div>
                      {settings.mazhab === "hanafi" && (
                        <p className="text-sm text-[var(--md-sys-color-error)] mt-2 italic font-bold">
                          {t("hanafiAsarNote" as any)}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="md3-title-medium font-bold text-[var(--md-sys-color-primary)] flex items-center gap-2">
                        {t("hijriFormat")}
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {/* @ts-ignore */}
                        <md-filter-chip
                          label={t("hijriBoth")}
                          selected={!settings.hijriFormat || settings.hijriFormat === "both"}
                          onClick={() => updateSettings({ hijriFormat: "both" })}
                        ></md-filter-chip>
                        {/* @ts-ignore */}
                        <md-filter-chip
                          label={t("hijriText")}
                          selected={settings.hijriFormat === "text"}
                          onClick={() => updateSettings({ hijriFormat: "text" })}
                        ></md-filter-chip>
                        {/* @ts-ignore */}
                        <md-filter-chip
                          label={t("hijriNumber")}
                          selected={settings.hijriFormat === "number"}
                          onClick={() => updateSettings({ hijriFormat: "number" })}
                        ></md-filter-chip>
                      </div>
                    </div>
                  </div>

                  {/* Clock Customization Card */}
                  <div className="bg-[var(--md-sys-color-surface-container)] rounded-[32px] p-0 border border-[var(--md-sys-color-outline)]/5 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 pb-4 bg-[var(--md-sys-color-surface-container-high)]">
                      <label className="md3-title-medium font-bold text-[var(--md-sys-color-primary)] flex items-center gap-2">
                        {t("clockStyle" as any)}
                      </label>
                    </div>
                    {/* Wrap for clocks so they are all visible on desktop and mobile */}
                    <div className="flex flex-wrap gap-2.5 p-6 bg-[var(--md-sys-color-surface-container)]">
                      {(["digital", "analog", "analog-numeric", "analog-roman", "analog-arabic", "anadigi", "chronograph", "flip", "word", "minimal", "orbit", "typographic", "prayer-ring", "dashboard", "abstract", "swiss-station", "bauhaus", "layered"] as const).map((style) => (
                        <div key={style} className="shrink-0">
                          {/* @ts-ignore */}
                          <md-filter-chip
                            label={
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
                            }
                            selected={settings.clockFace === style || (!settings.clockFace && style === "digital")}
                            onClick={() => updateSettings({ clockFace: style })}
                          ></md-filter-chip>
                        </div>
                      ))}
                    </div>

                    {settings.clockFace !== "digital" && (
                      <div className="p-5 pt-0 border-t border-[var(--md-sys-color-outline)]/5 mt-2">
                        <label className="md3-label-large font-bold text-[var(--md-sys-color-primary)] flex items-center gap-2 mb-3 mt-4">
                          {t("clockMovement" as any)}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(["sweep", "tick"] as const).map((movement) => (
                            /* @ts-ignore */
                            <md-filter-chip
                              key={movement}
                              label={
                                movement === "sweep"
                                  ? t("clockMovementSweep" as any)
                                  : t("clockMovementTick" as any)
                              }
                              selected={settings.clockMovement === movement || (!settings.clockMovement && movement === "sweep")}
                              onClick={() => updateSettings({ clockMovement: movement })}
                            ></md-filter-chip>
                          ))}
                        </div>

                        {['analog', 'analog-numeric', 'analog-roman', 'analog-arabic', 'dashboard', 'minimal', 'orbit', 'swiss-station', 'bauhaus', 'layered'].includes(settings.clockFace || '') && (
                          <div className="flex items-center justify-between mt-6">
                            <div>
                              <div className="md3-label-large font-bold text-[var(--md-sys-color-on-surface)]">
                                {t("showExternalDigitalClock" as any)}
                              </div>
                              <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                                {t("showExternalDigitalClockDesc" as any)}
                              </div>
                            </div>
                            {/* @ts-ignore */}
                            <md-switch
                              selected={settings.showExternalDigitalClock}
                              onClick={() => updateSettings({ showExternalDigitalClock: !settings.showExternalDigitalClock })}
                            ></md-switch>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Collapsible Advanced & Offline Options (Progressive Disclosure) */}
                  <div className={cn(
                    "rounded-[32px] overflow-hidden border border-[var(--md-sys-color-outline)]/10 shadow-sm transition-all duration-300 mt-4",
                    showAdvancedGeneral
                      ? "bg-[var(--md-sys-color-surface-container)] p-6 space-y-6"
                      : "bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] p-4 sm:p-5"
                  )}>
                    <button
                      onClick={() => setShowAdvancedGeneral(!showAdvancedGeneral)}
                      type="button"
                      className="relative w-full flex items-center justify-between font-bold text-left cursor-pointer focus:outline-none overflow-hidden"
                    >
                      {/* @ts-ignore */}
                      <md-ripple></md-ripple>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
                          <Sliders size={20} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-[var(--md-sys-color-on-surface)]">
                            {settings.language === "ms" ? "Pilihan Paparan & Luar Talian Lanjutan" : "Advanced View & Offline Options"}
                          </h3>
                          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                            {settings.language === "ms" 
                              ? "Format Hijri, tetapan Iqamah, Imsak, Jumaat, dan mod luar talian." 
                              : "Hijri formatting, Iqamah, Imsak, Jumu'ah, and offline caching."}
                          </p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: showAdvancedGeneral ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[var(--md-sys-color-on-surface-variant)]"
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
                          className="overflow-hidden space-y-6 pt-4 border-t border-[var(--md-sys-color-outline)]/10"
                        >
                          <div className="space-y-2">
                            <label className="md3-label-large font-bold text-[var(--md-sys-color-on-surface)]">
                              {t("hijriFormat")}
                            </label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {/* @ts-ignore */}
                              <md-filter-chip
                                label={t("hijriBoth")}
                                selected={!settings.hijriFormat || settings.hijriFormat === "both"}
                                onClick={() => updateSettings({ hijriFormat: "both" })}
                              ></md-filter-chip>
                              {/* @ts-ignore */}
                              <md-filter-chip
                                label={t("hijriText")}
                                selected={settings.hijriFormat === "text"}
                                onClick={() => updateSettings({ hijriFormat: "text" })}
                              ></md-filter-chip>
                              {/* @ts-ignore */}
                              <md-filter-chip
                                label={t("hijriNumber")}
                                selected={settings.hijriFormat === "number"}
                                onClick={() => updateSettings({ hijriFormat: "number" })}
                              ></md-filter-chip>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-3xl bg-[var(--md-sys-color-surface)] ring-1 ring-[var(--md-sys-color-outline)]/5 shadow-sm mt-4">
                            <div>
                              <label className="md3-label-large font-bold text-[var(--md-sys-color-on-surface)] block mb-0.5">
                                {t("showIqamah" as any)}
                              </label>
                              <p className="md3-body-small text-[var(--md-sys-color-on-surface-variant)] leading-relaxed max-w-[200px] sm:max-w-xs">
                                {t("iqamahDesc" as any)}
                              </p>
                            </div>
                            {/* @ts-ignore */}
                            <md-switch
                              selected={!!settings.showIqamah}
                              onChange={(e: any) =>
                                updateSettings({ showIqamah: e.target.selected })
                              }
                              icons
                            ></md-switch>
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-3xl bg-[var(--md-sys-color-surface)] ring-1 ring-[var(--md-sys-color-outline)]/5 shadow-sm mt-2">
                            <div>
                              <label className="md3-label-large font-bold text-[var(--md-sys-color-on-surface)] block mb-0.5">
                                {t("trackImsak" as any) || "Track Imsak"}
                              </label>
                              <p className="md3-body-small text-[var(--md-sys-color-on-surface-variant)] leading-relaxed max-w-[200px] sm:max-w-xs">
                                {t("trackImsakDesc" as any) || "Show Imsak as the next time after Isha"}
                              </p>
                            </div>
                            {/* @ts-ignore */}
                            <md-switch
                              selected={!!settings.trackImsak}
                              onChange={(e: any) =>
                                updateSettings({ trackImsak: e.target.selected })
                              }
                              icons
                            ></md-switch>
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-3xl bg-[var(--md-sys-color-surface)] ring-1 ring-[var(--md-sys-color-outline)]/5 shadow-sm mt-2">
                            <div>
                              <label className="md3-label-large font-bold text-[var(--md-sys-color-on-surface)] block mb-0.5">
                                {t("showJumaat" as any) || "Show Jumu'ah"}
                              </label>
                              <p className="md3-body-small text-[var(--md-sys-color-on-surface-variant)] leading-relaxed max-w-[200px] sm:max-w-xs">
                                {t("showJumaatDesc" as any) || "Replace Dhuhr with Jumu'ah on Fridays"}
                              </p>
                            </div>
                            {/* @ts-ignore */}
                            <md-switch
                              selected={settings.showJumaat !== false}
                              onChange={(e: any) =>
                                updateSettings({ showJumaat: e.target.selected })
                              }
                              icons
                            ></md-switch>
                          </div>

                          {/* Offline Mode section */}
                          <hr className="border-[var(--md-sys-color-outline)]/10 my-4" />

                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <WifiOff className="text-[var(--md-sys-color-primary)] w-5 h-5" />
                              <h3 className="md3-title-medium font-bold text-[var(--md-sys-color-on-surface)]">
                                {t("offlineMode" as any)}
                              </h3>
                            </div>

                            <p className="md3-body-small text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                              {t("saveOfflineDesc" as any)}
                            </p>

                            <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-high)] ring-1 ring-[var(--md-sys-color-outline)]/5 space-y-4">
                              {/* Cache Status */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--md-sys-color-outline)]/10 pb-4">
                                <div>
                                  <span className="text-xs uppercase font-black tracking-widest text-[var(--md-sys-color-on-surface-variant)]">
                                    {t("cachingStatus" as any)}
                                  </span>
                                  <div className="font-bold text-sm sm:text-base mt-0.5 text-[var(--md-sys-color-on-surface)]">
                                    {settings.offlineCachedRange ? (
                                      <span className="flex items-center gap-1.5 text-[var(--md-sys-color-primary)]">
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
                                    <span className="text-[10px] sm:text-xs text-[var(--md-sys-color-on-surface-variant)] block">
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
                                <label className="md3-label-large font-bold text-[var(--md-sys-color-on-surface)] block">
                                  {t("offlineDuration" as any)}
                                </label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {(["week", "month", "year"] as const).map((range) => (
                                    /* @ts-ignore */
                                    <md-filter-chip
                                      key={range}
                                      label={t(`offline${range.charAt(0).toUpperCase() + range.slice(1)}` as any)}
                                      selected={downloadRange === range}
                                      onClick={() => setDownloadRange(range)}
                                    ></md-filter-chip>
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
                                        : "bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] shadow-sm hover:opacity-90"
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
                                  <span className="text-xs text-[var(--md-sys-color-error)] font-bold flex items-center gap-1">
                                    <AlertCircle size={14} />
                                    {downloadError}
                                  </span>
                                )}
                                {downloadSuccess && (
                                  <span className="text-xs text-[var(--md-sys-color-primary)] font-bold flex items-center gap-1">
                                    <Check size={14} className="stroke-[3]" />
                                    {t("saveOfflineSuccess" as any)}
                                  </span>
                                )}
                                {clearSuccess && (
                                  <span className="text-xs text-[var(--md-sys-color-primary)] font-bold flex items-center gap-1">
                                    <Check size={14} className="stroke-[3]" />
                                    {settings.language === "ms" ? "Cache berjaya dipadam" : "Cache cleared successfully"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Auto Sync Offline Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-3xl bg-[var(--md-sys-color-surface)] ring-1 ring-[var(--md-sys-color-outline)]/5 shadow-sm">
                              <div className="pr-4">
                                <label className="md3-label-large font-bold text-[var(--md-sys-color-on-surface)] block mb-0.5">
                                  {t("autoSyncOffline" as any)}
                                </label>
                                <p className="md3-body-small text-[var(--md-sys-color-on-surface-variant)] leading-relaxed max-w-[200px] sm:max-w-xs">
                                  {t("autoSyncOfflineDesc" as any)}
                                </p>
                              </div>
                              {/* @ts-ignore */}
                              <md-switch
                                selected={!!settings.autoSyncOffline}
                                onChange={(e: any) =>
                                  updateSettings({ autoSyncOffline: e.target.selected })
                                }
                                icons
                              ></md-switch>
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
                    <div className="mb-2 p-5 bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-sm border border-[var(--md-sys-color-error)]/20">
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
                  <div className="p-6 sm:p-8 rounded-[var(--md-sys-shape-corner-extra-large)] bg-[var(--md-sys-color-surface-container-high)] ring-1 ring-[var(--md-sys-color-outline)]/10 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
                        <Smartphone size={20} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-[var(--md-sys-color-on-surface)]">
                          {t("visualAlertSection" as any)}
                        </h3>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                          {settings.language === "ms" 
                            ? "Tetapkan gaya overlay pengumuman waktu azan semasa aplikasi dibuka." 
                            : "Configure style of adhan time announcements when app is active."}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-[var(--md-sys-color-outline)]/10">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] ml-1">
                          {t("azanAlertStyle" as any)}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(["dramatic", "standard", "modern", "subtle", "minimal", "none"] as const).map((style) => (
                            /* @ts-ignore */
                            <md-filter-chip
                              key={style}
                              label={
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
                              }
                              selected={settings.azanAlertStyle === style || (!settings.azanAlertStyle && style === "standard")}
                              onClick={() => updateSettings({ azanAlertStyle: style })}
                            ></md-filter-chip>
                          ))}
                        </div>
                      </div>

                      {settings.azanAlertStyle !== "none" && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between p-4 bg-[var(--md-sys-color-surface)] rounded-[2rem] shadow-sm ring-1 ring-[var(--md-sys-color-outline)]/5 mt-4">
                            <span className="font-bold text-[var(--md-sys-color-on-surface)] text-sm">
                              {t("azanAlertDuration" as any)}
                            </span>
                            <div className="flex-1 px-2 sm:px-4">
                              {/* @ts-ignore */}
                              <md-slider
                                min="5"
                                max="120"
                                step="5"
                                value={settings.azanAlertDuration ?? 20}
                                labeled
                                ticks
                                onChange={(e: any) => updateSettings({ azanAlertDuration: e.target.value })}
                              ></md-slider>
                            </div>
                            <span className="w-20 text-right font-mono text-lg font-black text-[var(--md-sys-color-primary)]">
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
                          "p-6 sm:p-8 rounded-[var(--md-sys-shape-corner-extra-large)] transition-all duration-300 shadow-sm overflow-hidden",
                          pref.enabled
                            ? "border border-transparent bg-[var(--md-sys-color-primary-container)]/10 ring-1 ring-[var(--md-sys-color-primary)]/20"
                            : "border border-transparent bg-[var(--md-sys-color-surface-variant)]/30 grayscale-[0.3]",
                        )}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                          <div className="flex items-center gap-4">
                            {/* @ts-ignore */}
                            <md-switch
                              selected={pref.enabled}
                              icons
                              onChange={(e: any) =>
                                onUpdatePreference(key, {
                                  enabled: e.target.selected,
                                })
                              }
                            ></md-switch>
                            <div>
                              <h4
                                className={cn(
                                  "text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 transition-colors duration-300",
                                  pref.enabled
                                    ? "text-[var(--md-sys-color-on-surface)]"
                                    : "text-[var(--md-sys-color-on-surface-variant)]/70",
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
                            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] ml-1">
                              {t("sound")}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {SOUND_OPTIONS.map((opt) => (
                                /* @ts-ignore */
                                <md-filter-chip
                                  key={opt.value}
                                  label={opt.label}
                                  selected={pref.sound === opt.value}
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
                            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] ml-1">
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
                                ></md-filter-chip>
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
                    <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-4 bg-[var(--md-sys-color-surface-variant)]/30 p-5 rounded-[2rem] font-medium leading-relaxed ring-1 ring-[var(--md-sys-color-outline)]/5 shadow-inner">
                      {t("offsetDescription" as any)}
                    </p>
                    <div className="space-y-4">
                      {PRAYER_KEYS.map((key) => {
                        const pref = preferences[key] || { offset: 0 };
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between p-4 sm:p-5 bg-[var(--md-sys-color-surface)] rounded-[2rem] shadow-sm ring-1 ring-[var(--md-sys-color-outline)]/5 hover:shadow-md transition-shadow"
                          >
                            <span className="font-black text-[var(--md-sys-color-on-surface)] w-24 tracking-wider uppercase text-sm">
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
                                <md-ripple></md-ripple>
                                <Minus size={20} className="relative z-10" />
                              </motion.button>
                              <span className="w-10 sm:w-16 flex font-mono text-lg sm:text-2xl font-black items-center justify-center tabular-nums text-[var(--md-sys-color-primary)]">
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
                                <md-ripple></md-ripple>
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
                      <h3 className="text-xl font-black text-[var(--md-sys-color-primary)] mb-4 px-2">
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
                              className="flex items-center justify-between p-4 sm:p-5 bg-[var(--md-sys-color-surface)] rounded-[2rem] shadow-sm ring-1 ring-[var(--md-sys-color-outline)]/5 hover:shadow-md transition-shadow"
                            >
                              <span className="font-black text-[var(--md-sys-color-on-surface)] w-24 tracking-wider uppercase text-sm">
                                {t(key as any)}
                              </span>
                              <div className="flex items-center gap-3 sm:gap-4">
                                <md-filled-tonal-icon-button
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
                                </md-filled-tonal-icon-button>
                                <span className="w-10 sm:w-16 flex font-mono text-lg sm:text-2xl font-black items-center justify-center tabular-nums text-[var(--md-sys-color-primary)]">
                                  {pref.iqamahOffset || 0}
                                </span>
                                <md-filled-tonal-icon-button
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
                                </md-filled-tonal-icon-button>
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
                  <div className="bg-[var(--md-sys-color-surface-container)] rounded-[32px] p-6 sm:p-8 border border-[var(--md-sys-color-outline)]/5 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
                        <MoonStar size={20} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-[var(--md-sys-color-on-surface)]">
                          {t("showSunnahTimes" as any) || "Waktu Sunat"}
                        </h3>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                          Papar waktu-waktu ibadah sunat dan waktu haram solat.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SUNNAH_KEYS.map((key) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-[var(--md-sys-color-surface)] rounded-2xl ring-1 ring-[var(--md-sys-color-outline)]/5 shadow-sm">
                          <div>
                            <span className="font-bold text-[var(--md-sys-color-on-surface)] text-sm block">
                              {t(key as any)}
                            </span>
                            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] leading-tight block mt-0.5">
                              {t(`${key}Desc` as any)}
                            </span>
                          </div>
                          {/* @ts-ignore */}
                          <md-switch
                            selected={!!settings.showSunnahTimes?.includes(key)}
                            onChange={(e: any) => {
                              const current = settings.showSunnahTimes || [];
                              const isSelected = e.target.selected;
                              if (isSelected && !current.includes(key as any)) {
                                updateSettings({ showSunnahTimes: [...current, key as any] });
                              } else if (!isSelected && current.includes(key as any)) {
                                updateSettings({ showSunnahTimes: current.filter(k => k !== key) });
                              }
                            }}
                            icons
                          ></md-switch>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Calculation Rules (Collapsible) */}
                  <div className={cn(
                    "rounded-[32px] overflow-hidden border border-[var(--md-sys-color-outline)]/10 shadow-sm transition-all duration-300",
                    showAdvancedCalculations
                      ? "bg-[var(--md-sys-color-surface-container)] p-6 space-y-6"
                      : "bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] p-4 sm:p-5"
                  )}>
                    <button
                      onClick={() => setShowAdvancedCalculations(!showAdvancedCalculations)}
                      type="button"
                      className="relative w-full flex items-center justify-between font-bold text-left cursor-pointer focus:outline-none overflow-hidden"
                    >
                      {/* @ts-ignore */}
                      <md-ripple></md-ripple>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
                          <Sliders size={20} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-[var(--md-sys-color-on-surface)]">
                            {t("advancedCalculationRules" as any)}
                          </h3>
                          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                            {settings.language === "ms" 
                              ? "Ubahsuai offset Imsak/Sahur, kaedah Tengah Malam & Asar." 
                              : "Modify Suhoor/Imsak offsets, Midnight & Asar methods."}
                          </p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: showAdvancedCalculations ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[var(--md-sys-color-on-surface-variant)]"
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
                          className="overflow-hidden space-y-6 pt-4 border-t border-[var(--md-sys-color-outline)]/10"
                        >
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] ml-1">
                              {t("suhoorOffset" as any)}
                            </label>
                            <div className="flex flex-wrap gap-2 animate-in fade-in duration-200">
                              {[15, 30, 45, 60].map((mins) => (
                                /* @ts-ignore */
                                <md-filter-chip
                                  key={`suhoor-${mins}`}
                                  label={`${mins} min`}
                                  selected={settings.suhoorOffset === mins || (!settings.suhoorOffset && mins === 30)}
                                  onClick={() => updateSettings({ suhoorOffset: mins })}
                                ></md-filter-chip>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] ml-1">
                              {t("imsakOffset" as any)}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {[2, 5, 10, 15].map((mins) => (
                                /* @ts-ignore */
                                <md-filter-chip
                                  key={`imsak-${mins}`}
                                  label={`${mins} min`}
                                  selected={settings.imsakOffset === mins || (!settings.imsakOffset && mins === 10)}
                                  onClick={() => updateSettings({ imsakOffset: mins })}
                                ></md-filter-chip>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] ml-1">
                              {t("midnightMethod" as any)}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {/* @ts-ignore */}
                              <md-filter-chip
                                label={t("midnightFajr" as any)}
                                selected={!settings.midnightMethod || settings.midnightMethod === "fajr"}
                                onClick={() => updateSettings({ midnightMethod: "fajr" })}
                              ></md-filter-chip>
                              {/* @ts-ignore */}
                              <md-filter-chip
                                label={t("midnightSunrise" as any)}
                                selected={settings.midnightMethod === "sunrise"}
                                onClick={() => updateSettings({ midnightMethod: "sunrise" })}
                              ></md-filter-chip>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] ml-1">
                              {t("asrEnds" as any)}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {/* @ts-ignore */}
                              <md-filter-chip
                                label={t("asrEndsMaghrib" as any)}
                                selected={!settings.asrEnds || settings.asrEnds === "maghrib"}
                                onClick={() => updateSettings({ asrEnds: "maghrib" })}
                              ></md-filter-chip>
                              {/* @ts-ignore */}
                              <md-filter-chip
                                label={t("asrEndsSunset" as any)}
                                selected={settings.asrEnds === "sunset"}
                                onClick={() => updateSettings({ asrEnds: "sunset" })}
                              ></md-filter-chip>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Hijri Calendar Engine (Collapsible) */}
                  <div className={cn(
                    "rounded-[32px] overflow-hidden border border-[var(--md-sys-color-outline)]/10 shadow-sm transition-all duration-300 mt-4",
                    showHijriEngine
                      ? "bg-[var(--md-sys-color-surface-container)] p-6 space-y-6"
                      : "bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] p-4 sm:p-5"
                  )}>
                    <button
                      onClick={() => setShowHijriEngine(!showHijriEngine)}
                      type="button"
                      className="relative w-full flex items-center justify-between font-bold text-left cursor-pointer focus:outline-none overflow-hidden"
                    >
                      {/* @ts-ignore */}
                      <md-ripple></md-ripple>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
                          <Sliders size={20} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-[var(--md-sys-color-on-surface)]">
                            {t("hijriCalendarEngine" as any)}
                          </h3>
                          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                            {settings.language === "ms" 
                              ? "Tetapkan kaedah kiraan kalendar Hijri & pelarasan hari." 
                              : "Configure Hijri calendar calculation methods & day offset."}
                          </p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: showHijriEngine ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[var(--md-sys-color-on-surface-variant)]"
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
                          className="overflow-hidden space-y-6 pt-4 border-t border-[var(--md-sys-color-outline)]/10"
                        >
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] ml-1">
                              {t("hijriMethod" as any)}
                            </label>
                            <div className="w-full">
                              {/* @ts-ignore */}
                              <md-outlined-select
                                value={settings.hijriMethod || "jakim"}
                                onChange={(e: any) => updateSettings({ hijriMethod: e.target.value })}
                                onInput={(e: any) => updateSettings({ hijriMethod: e.target.value })}
                                style={{ width: "100%" }}
                              >
                                {((["jakim", "umalqura", "tbla", "civil", "islamic"] as const).map((method) => (
                                  /* @ts-ignore */
                                  <md-select-option 
                                    key={`hijri-${method}`} 
                                    value={method}
                                    onClick={() => updateSettings({ hijriMethod: method })}
                                  >
                                    <div slot="headline">{t(`method${method.charAt(0).toUpperCase() + method.slice(1)}` as any)}</div>
                                  </md-select-option>
                                )))}
                              </md-outlined-select>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-[var(--md-sys-color-surface)] rounded-[2rem] shadow-sm ring-1 ring-[var(--md-sys-color-outline)]/5 mt-4">
                            <span className="font-bold text-[var(--md-sys-color-on-surface)] text-sm">
                              {t("hijriAdjustment" as any)}
                            </span>
                            <div className="flex items-center gap-3 sm:gap-4">
                              {/* @ts-ignore */}
                              <md-filled-tonal-icon-button
                                onClick={() =>
                                  updateSettings({
                                    hijriAdjustment: Math.max(-2, (settings.hijriAdjustment ?? 0) - 1),
                                  })
                                }
                                aria-label={settings.language === "ms" ? "Kurangkan pelarasan Hijri" : "Decrease Hijri adjustment"}
                              >
                                <Minus size={20} />
                              </md-filled-tonal-icon-button>
                              <span className="w-16 flex font-mono text-lg sm:text-xl font-black items-center justify-center tabular-nums text-[var(--md-sys-color-primary)]">
                                {(settings.hijriAdjustment ?? 0) > 0 ? "+" : ""}
                                {settings.hijriAdjustment ?? 0}
                              </span>
                              {/* @ts-ignore */}
                              <md-filled-tonal-icon-button
                                onClick={() =>
                                  updateSettings({
                                    hijriAdjustment: Math.min(2, (settings.hijriAdjustment ?? 0) + 1),
                                  })
                                }
                                aria-label={settings.language === "ms" ? "Tambah pelarasan Hijri" : "Increase Hijri adjustment"}
                              >
                                <Plus size={20} />
                              </md-filled-tonal-icon-button>
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
                  <div className="p-6 sm:p-8 rounded-[var(--md-sys-shape-corner-extra-large)] bg-[var(--md-sys-color-surface-container-high)] ring-1 ring-[var(--md-sys-color-outline)]/10 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
                        <Activity size={20} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-[var(--md-sys-color-on-surface)]">
                          {t("iqamahSoundSection" as any)}
                        </h3>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                          Select countdown alert tones and audition sounds.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-[var(--md-sys-color-outline)]/10">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] ml-1">
                          {t("iqamahCountdownSound" as any)}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(["chime", "tick", "none"] as const).map((sound) => (
                            /* @ts-ignore */
                            <md-filter-chip
                              key={sound}
                              label={
                                sound === "chime"
                                  ? t("chime" as any)
                                  : sound === "tick"
                                    ? t("clockMovementTick" as any)
                                    : t("none")
                              }
                              selected={settings.iqamahCountdownSound === sound || (!settings.iqamahCountdownSound && sound === "chime")}
                              onClick={() => updateSettings({ iqamahCountdownSound: sound })}
                            ></md-filter-chip>
                          ))}
                        </div>
                      </div>

                      {/* Audition Testing row */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => playSynthesizedSoundLocal('chime', 800)}
                          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-3xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] text-xs font-bold shadow-sm border border-[var(--md-sys-color-outline)]/5 transition-all focus:outline-none"
                        >
                          <Volume2 size={16} />
                          {t("testIqamahChime" as any)}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => playSynthesizedSoundLocal('tick')}
                          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-3xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] text-xs font-bold shadow-sm border border-[var(--md-sys-color-outline)]/5 transition-all focus:outline-none"
                        >
                          <Volume2 size={16} />
                          {t("testIqamahTick" as any)}
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* SUB-SECTION 3: SOLAT SCREENAVER */}
                  <div className="p-6 sm:p-8 rounded-[var(--md-sys-shape-corner-extra-large)] bg-[var(--md-sys-color-surface-container-high)] ring-1 ring-[var(--md-sys-color-outline)]/10 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
                        <Clock size={20} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-[var(--md-sys-color-on-surface)]">
                          {t("solatScreensaverSection" as any)}
                        </h3>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                          Configure private prayer window and remembrance timers.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-[var(--md-sys-color-outline)]/10">
                      <div className="flex items-center justify-between p-1">
                        <div>
                          <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                            {t("solatModeEnabled" as any)}
                          </h4>
                          <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed mt-0.5">
                            {t("solatModeInstruction" as any)}
                          </p>
                        </div>
                        {/* @ts-ignore */}
                        <md-switch
                          selected={!!settings.solatModeEnabled}
                          onChange={(e: any) =>
                            updateSettings({ solatModeEnabled: e.target.selected })
                          }
                          icons
                        ></md-switch>
                      </div>

                      {settings.solatModeEnabled && (
                        <div className="space-y-4 pt-4 mt-2 border-t border-[var(--md-sys-color-outline)]/5">
                          {/* Show Clock & Qibla toggles */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center justify-between p-4 bg-[var(--md-sys-color-surface)] rounded-[2rem] shadow-sm ring-1 ring-[var(--md-sys-color-outline)]/5">
                              <span className="font-bold text-[var(--md-sys-color-on-surface)] text-xs">
                                {t("solatModeShowClock" as any)}
                              </span>
                              {/* @ts-ignore */}
                              <md-switch
                                selected={settings.solatModeShowClock !== false}
                                onChange={(e: any) =>
                                  updateSettings({ solatModeShowClock: e.target.selected })
                                }
                                icons
                              ></md-switch>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-[var(--md-sys-color-surface)] rounded-[2rem] shadow-sm ring-1 ring-[var(--md-sys-color-outline)]/5">
                              <span className="font-bold text-[var(--md-sys-color-on-surface)] text-xs">
                                {t("solatModeShowQibla" as any)}
                              </span>
                              {/* @ts-ignore */}
                              <md-switch
                                selected={settings.solatModeShowQibla !== false}
                                onChange={(e: any) =>
                                  updateSettings({ solatModeShowQibla: e.target.selected })
                                }
                                icons
                              ></md-switch>
                            </div>
                          </div>

                          {/* Post-solat Dua duration */}
                          <div className="flex items-center justify-between p-4 bg-[var(--md-sys-color-surface)] rounded-[2rem] shadow-sm ring-1 ring-[var(--md-sys-color-outline)]/5 mt-2">
                            <div>
                              <span className="font-bold text-[var(--md-sys-color-on-surface)] text-sm block">
                                {t("solatModeDuaDuration" as any)}
                              </span>
                              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">
                                Serene dhikr interval before exit.
                              </span>
                            </div>
                            <div className="flex-1 px-4 max-w-[200px]">
                              {/* @ts-ignore */}
                              <md-slider
                                min="0"
                                max="10"
                                step="1"
                                value={settings.solatModeDuaDuration ?? 0}
                                labeled
                                ticks
                                onChange={(e: any) => updateSettings({ solatModeDuaDuration: e.target.value })}
                              ></md-slider>
                            </div>
                            <span className="w-12 text-right font-mono font-bold text-[var(--md-sys-color-primary)] tabular-nums">
                              {settings.solatModeDuaDuration ?? 0}m
                            </span>
                          </div>

                          {/* Individual Prayer Durations */}
                          <div className="pt-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] ml-1 mb-2">
                              {t("solatModeDuration" as any)}
                            </h4>
                            <div className="space-y-2">
                              {(["fajr", "dhuhr", "asr", "maghrib", "isha"] as const).map((key) => {
                                const duration = settings.solatModeDuration?.[key] ?? 10;
                                return (
                                  <div
                                    key={`solat-dur-${key}`}
                                    className="flex items-center justify-between p-3 bg-[var(--md-sys-color-surface)] rounded-[1.5rem] shadow-sm ring-1 ring-[var(--md-sys-color-outline)]/5"
                                  >
                                    <span className="font-bold text-[var(--md-sys-color-on-surface)] tracking-wider uppercase text-xs w-24 pl-1">
                                      {t(key as any)}
                                    </span>
                                    <div className="flex-1 px-4">
                                      {/* @ts-ignore */}
                                      <md-slider
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
                                      ></md-slider>
                                    </div>
                                    <span className="w-12 text-right font-mono font-bold text-[var(--md-sys-color-primary)] tabular-nums text-sm">
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
                  <div className="p-6 sm:p-8 rounded-[var(--md-sys-shape-corner-extra-large)] bg-[var(--md-sys-color-surface-container-high)] ring-1 ring-[var(--md-sys-color-outline)]/10 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                          {t("backgroundNotifications" as any)}
                        </h3>
                        <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed mt-0.5 max-w-[200px] sm:max-w-xs">
                          Keep prayer sound/alerts active even when tab is minimized or screen is locked.
                        </p>
                      </div>
                      {/* @ts-ignore */}
                      <md-switch
                        selected={!!settings.backgroundNotifications}
                        onChange={(e: any) =>
                          updateSettings({ backgroundNotifications: e.target.selected })
                        }
                        icons
                      ></md-switch>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
