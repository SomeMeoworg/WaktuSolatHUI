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
}

export function SettingsModal({
  isOpen,
  onClose,
  preferences,
  onUpdatePreference,
  permission,
  onRequestPermission,
  onTestSound,
}: SettingsModalProps) {
  const { settings, updateSettings, t } = useAppContext();
  const [activeTab, setActiveTab] = useState<
    "general" | "notifications" | "adjustments"
  >("general");

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
                className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-error-container)] hover:text-[var(--md-sys-color-on-error-container)] shrink-0 shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-error)]"
              >
                <X size={22} className="stroke-[2.5]" />
              </motion.button>
            </div>

            {/* Tabs */}
            {/* @ts-ignore */}
            <md-tabs className="w-full shrink-0 border-b border-[var(--md-sys-color-outline)]/10" activeTabIndex={activeTab === 'general' ? 0 : activeTab === 'notifications' ? 1 : 2}>
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
            </md-tabs>

            <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-8 pt-8 space-y-8 no-scrollbar bg-[var(--md-sys-color-surface-container)]">
              {activeTab === "general" && (
                <div className="space-y-6 max-w-xl mx-auto">
                  <div className="space-y-2">
                    <label className="md3-label-large font-bold text-[var(--md-sys-color-on-surface)]">
                      {t("language")}
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
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

                  <div className="space-y-2">
                    <label className="md3-label-large font-bold text-[var(--md-sys-color-on-surface)]">
                      {t("timeFormat")}
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
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

                  <div className="space-y-2">
                    <label className="md3-label-large font-bold text-[var(--md-sys-color-on-surface)]">
                      {t("mazhab")}
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
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
                      <p className="text-xs text-[var(--md-sys-color-primary)] mt-2 italic">
                        {t("hanafiAsarNote" as any)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="md3-label-large font-bold text-[var(--md-sys-color-on-surface)]">
                      {t("notificationType")}
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(["in-app", "push", "both"] as const).map((type) => (
                        /* @ts-ignore */
                        <md-filter-chip
                          key={type}
                          label={
                            type === "in-app"
                              ? t("inApp")
                              : type === "push"
                                ? t("push")
                                : t("both")
                          }
                          selected={settings.notificationType === type}
                          onClick={() => updateSettings({ notificationType: type })}
                        ></md-filter-chip>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="md3-label-large font-bold text-[var(--md-sys-color-on-surface)]">
                      {t("clockStyle" as any)}
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(["digital", "analog", "analog-numeric", "analog-roman", "analog-arabic", "anadigi", "chronograph", "flip", "word", "minimal", "orbit", "typographic", "prayer-ring", "dashboard", "abstract", "swiss-station", "bauhaus", "layered"] as const).map((style) => (
                        /* @ts-ignore */
                        <md-filter-chip
                          key={style}
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
                      ))}
                    </div>
                  </div>

                  {settings.clockFace !== "digital" && (
                    <div className="space-y-2">
                      <label className="md3-label-large font-bold text-[var(--md-sys-color-on-surface)]">
                        {t("clockMovement" as any)}
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
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
                    </div>
                  )}

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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
