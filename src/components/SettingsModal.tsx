import { useState } from "react";
import {
  Modal, useOverlayState, Tabs, Switch, Slider,
  Separator, Button
} from "@heroui/react";
import {
  Settings, Bell, Clock, Sliders, MoonStar,
  Volume2, Activity, Mic, Music, BellRing,
  Download, Check, AlertCircle
} from "lucide-react";
import { useAppContext } from "../AppContext";
import { saveOfflinePrayers, clearAllOfflinePrayers } from "../lib/db";
import {
  PrayerKey, PrayerPreference, NotificationSound,
  PreAlertTime
} from "../types";
import { PRAYER_NAMES } from "./PrayerSchedule";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: Record<PrayerKey, PrayerPreference>;
  onUpdatePreference: (key: PrayerKey, updates: Partial<PrayerPreference>) => void;
  permission: string;
  onRequestPermission: () => void;
  onTestSound: (sound: NotificationSound, message: string) => void;
  selectedZone: string;
  onPreviewAzanAlert?: (style: string) => void;
}

const PRAYER_KEYS: PrayerKey[] = ["imsak", "fajr", "syuruk", "dhuhr", "asr", "maghrib", "isha"];

export function SettingsModal({
  isOpen, onClose, preferences, onUpdatePreference,
  permission, onRequestPermission, onTestSound,
  selectedZone, onPreviewAzanAlert
}: SettingsModalProps) {
  const { settings, updateSettings, t } = useAppContext();
  const [activeTab, setActiveTab] = useState("general");

  // Offline caching states
  const [downloadRange, setDownloadRange] = useState<'week' | 'month' | 'year'>('month');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  // Controlled overlay state for HeroUI v3
  const state = useOverlayState({
    isOpen,
    onOpenChange: (open: boolean) => { if (!open) onClose(); }
  });

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
        url = `/api/solat/${selectedZone}?year=${d.getFullYear()}&month=${d.getMonth() + 1}`;
      } else if (downloadRange === 'year') {
        url = `/api/solat/${selectedZone}?year=${new Date().getFullYear()}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch prayer times from server");
      const data = await res.json();
      if (!data?.prayerTime?.length) throw new Error("No prayer data returned from API");
      await saveOfflinePrayers(selectedZone, data.prayerTime, downloadRange);
      updateSettings({ offlineCachedRange: downloadRange, offlineCachedAt: Date.now() });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      console.error("Offline download failed:", err);
      setDownloadError(t("saveOfflineFailed" as any) || "Gagal menyimpan luar talian");
    } finally {
      setIsDownloading(false);
    }
  };

  const SOUND_OPTIONS = [
    { label: t("default"), value: "default" },
    { label: t("beep"), value: "beep" },
    { label: t("voice"), value: "voice" },
    { label: t("azan1" as any), value: "azan1" },
    { label: t("azan2" as any), value: "azan2" },
    { label: t("chime" as any), value: "chime" },
    { label: t("softChime" as any), value: "soft-chime" },
    { label: t("bellEcho" as any), value: "bell-echo" },
    { label: t("ambientGong" as any), value: "ambient-gong" },
    { label: t("digitalSweep" as any), value: "digital-sweep" },
  ];

  const PRE_ALERT_OPTIONS = [
    { label: t("none"), value: 0 },
    { label: `5 ${t("minutes")}`, value: 5 },
    { label: `10 ${t("minutes")}`, value: 10 },
    { label: `15 ${t("minutes")}`, value: 15 },
  ];

  // Reusable setting row
  const SettingRow = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-4">
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-[var(--app-foreground)]">{title}</h4>
        {description && <p className="text-xs text-[var(--app-outline)] mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="flex-shrink-0 flex items-center justify-end">
        {children}
      </div>
    </div>
  );

  // Reusable section card
  const SectionCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`premium-glass rounded-2xl ${className}`}>
      {children}
    </div>
  );

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable className="bg-black/40 backdrop-blur-md">
        <Modal.Container size="lg" scroll="inside" placement="center" className="max-h-[90vh] sm:max-h-[85vh] m-2 sm:m-0">
          <Modal.Dialog className="premium-glass-heavy rounded-[2.5rem] outline-none flex flex-col max-h-[90vh] sm:max-h-[85vh]">
            {/* Header */}
            <Modal.Header className="border-b border-[var(--app-outline-variant)]/20 p-6 md:p-8 flex flex-col items-start gap-2 shrink-0">
              <Modal.Heading className="text-3xl md:text-4xl font-black tracking-tighter text-[var(--app-primary)] leading-none">
                {t("settings")}
              </Modal.Heading>
            </Modal.Header>

            {/* Tab Navigation */}
            <div className="w-full bg-[var(--app-surface-container)]/30 backdrop-blur-md p-2 border-b border-white/10 shrink-0">
              <Tabs
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(key as string)}
                className="w-full"
              >
                <Tabs.List className="flex w-full bg-transparent gap-1">
                  <Tabs.Tab id="general" className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors data-[selected]:bg-[var(--app-surface)] data-[selected]:text-[var(--app-primary)] data-[selected]:shadow-sm text-[var(--app-outline)] hover:text-[var(--app-foreground)]">
                    <Settings size={16} /><span className="hidden sm:inline">{t("general")}</span>
                  </Tabs.Tab>
                  <Tabs.Tab id="notifications" className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors data-[selected]:bg-[var(--app-surface)] data-[selected]:text-[var(--app-primary)] data-[selected]:shadow-sm text-[var(--app-outline)] hover:text-[var(--app-foreground)]">
                    <Bell size={16} /><span className="hidden sm:inline">{t("notifications")}</span>
                  </Tabs.Tab>
                  <Tabs.Tab id="adjustments" className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors data-[selected]:bg-[var(--app-surface)] data-[selected]:text-[var(--app-primary)] data-[selected]:shadow-sm text-[var(--app-outline)] hover:text-[var(--app-foreground)]">
                    <Clock size={16} /><span className="hidden sm:inline">{t("offset")}</span>
                  </Tabs.Tab>
                  <Tabs.Tab id="advanced" className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors data-[selected]:bg-[var(--app-surface)] data-[selected]:text-[var(--app-primary)] data-[selected]:shadow-sm text-[var(--app-outline)] hover:text-[var(--app-foreground)]">
                    <Sliders size={16} /><span className="hidden sm:inline">{t("sunnahAndOptional" as any) || "Lanjutan"}</span>
                  </Tabs.Tab>
                  <Tabs.Tab id="mosque" className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors data-[selected]:bg-[var(--app-surface)] data-[selected]:text-[var(--app-primary)] data-[selected]:shadow-sm text-[var(--app-outline)] hover:text-[var(--app-foreground)]">
                    <MoonStar size={16} /><span className="hidden sm:inline">{t("mosqueMode" as any) || "Mod Masjid"}</span>
                  </Tabs.Tab>
                </Tabs.List>

                {/* Tab Panels — scrollable body */}
                <div className="overflow-y-auto flex-1 px-4 sm:px-8 pb-8 pt-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>

                  {/* GENERAL */}
                  <Tabs.Panel id="general" className="space-y-6 max-w-2xl mx-auto w-full outline-none">
                    <SectionCard>
                      <div className="p-6 space-y-1">
                        <SettingRow title={t("language")} description="Select application language">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={settings.language === "ms" ? "primary" : "ghost"}
                              onPress={() => updateSettings({ language: "ms" })}
                            >Bahasa Melayu</Button>
                            <Button
                              size="sm"
                              variant={settings.language === "en" ? "primary" : "ghost"}
                              onPress={() => updateSettings({ language: "en" })}
                            >English</Button>
                          </div>
                        </SettingRow>
                        <Separator className="my-2" />
                        <SettingRow title={t("timeFormat")} description="12-hour or 24-hour format">
                          <Switch
                            isSelected={settings.timeFormat === "24h"}
                            onChange={(val: boolean) => updateSettings({ timeFormat: val ? "24h" : "12h" })}
                          >
                            <Switch.Control><Switch.Thumb /></Switch.Control>
                            <Switch.Content><span className="text-sm font-medium">{settings.timeFormat}</span></Switch.Content>
                          </Switch>
                        </SettingRow>
                        <Separator className="my-2" />
                        <SettingRow title={t("themeMode" as any) || "Theme Mode"}>
                          <div className="flex flex-wrap gap-2">
                            {["light", "dark", "system"].map(theme => (
                              <Button
                                key={theme} size="sm"
                                variant={settings.themeVariant === theme ? "primary" : "ghost"}
                                onPress={() => updateSettings({ themeVariant: theme as any })}
                              >
                                <span className="capitalize">{theme}</span>
                              </Button>
                            ))}
                          </div>
                        </SettingRow>
                        <Separator className="my-2" />
                        <SettingRow title={t("backgroundNotifications" as any) || "Background Notifications"} description="Keep prayer sound/alerts active even when tab is minimized">
                          <Switch
                            isSelected={!!settings.backgroundNotifications}
                            onChange={(val: boolean) => updateSettings({ backgroundNotifications: val })}
                          >
                            <Switch.Control><Switch.Thumb /></Switch.Control>
                          </Switch>
                        </SettingRow>
                      </div>
                    </SectionCard>
                  </Tabs.Panel>

                  {/* NOTIFICATIONS */}
                  <Tabs.Panel id="notifications" className="space-y-6 max-w-2xl mx-auto w-full outline-none">
                    <SectionCard>
                      <div className="p-6">
                        <SettingRow title="Master Notification Toggle" description="Enable or disable all notifications">
                          <Switch
                            isSelected={permission === "granted"}
                            onChange={(val: boolean) => {
                              if (val && permission !== "granted") onRequestPermission();
                            }}
                          >
                            <Switch.Control><Switch.Thumb /></Switch.Control>
                          </Switch>
                        </SettingRow>
                      </div>
                    </SectionCard>

                    <h3 className="text-lg font-bold text-[var(--app-primary)] mt-6 mb-2">Prayer Alerts</h3>

                    {PRAYER_KEYS.map((key) => {
                      const pref = preferences[key];
                      if (!pref) return null;
                      return (
                        <SectionCard key={key} className="mb-4">
                          <div className="p-4 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-base font-bold capitalize text-[var(--app-foreground)] flex items-center gap-2">
                                {PRAYER_NAMES[key] ? (PRAYER_NAMES[key] as any)[settings.language] : key}
                              </h4>
                              <Switch
                                isSelected={pref.enabled}
                                onChange={(val: boolean) => onUpdatePreference(key, { enabled: val })}
                              >
                                <Switch.Control><Switch.Thumb /></Switch.Control>
                              </Switch>
                            </div>

                            {pref.enabled && (
                              <div className="pt-4 border-t border-[var(--app-outline-variant)]/20 space-y-4">
                                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                                  <div className="w-full sm:w-1/2">
                                    <label className="text-xs text-[var(--app-outline)] mb-1 block">Alert Sound</label>
                                    <select
                                      className="w-full rounded-xl border border-[var(--app-outline-variant)]/30 bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-foreground)]"
                                      value={pref.sound}
                                      onChange={(e) => onUpdatePreference(key, { sound: e.target.value as NotificationSound })}
                                    >
                                      {SOUND_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="w-full sm:w-1/2">
                                    <label className="text-xs text-[var(--app-outline)] mb-1 block">Pre-Alert</label>
                                    <select
                                      className="w-full rounded-xl border border-[var(--app-outline-variant)]/30 bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-foreground)]"
                                      value={String(pref.preAlert || 0)}
                                      onChange={(e) => onUpdatePreference(key, { preAlert: Number(e.target.value) as PreAlertTime })}
                                    >
                                      {PRE_ALERT_OPTIONS.map((opt) => (
                                        <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs text-[var(--app-outline)] mb-2">Volume</p>
                                  <Slider
                                    minValue={0}
                                    maxValue={1}
                                    step={0.1}
                                    value={pref.volume !== undefined ? pref.volume : 1}
                                    onChange={(v: number | number[]) => onUpdatePreference(key, { volume: (typeof v === 'number' ? v : v[0]) })}
                                    className="max-w-md"
                                  >
                                    <Slider.Track>
                                      <Slider.Fill />
                                      <Slider.Thumb />
                                    </Slider.Track>
                                  </Slider>
                                </div>
                              </div>
                            )}
                          </div>
                        </SectionCard>
                      );
                    })}
                  </Tabs.Panel>

                  {/* ADJUSTMENTS */}
                  <Tabs.Panel id="adjustments" className="space-y-6 max-w-2xl mx-auto w-full outline-none">
                    <div className="bg-[var(--app-primary)]/10 text-[var(--app-primary)] p-4 rounded-xl text-sm font-medium">
                      {t("offsetDescription" as any) || "Adjust the prayer times by adding or subtracting minutes."}
                    </div>

                    <SectionCard>
                      <div className="p-2">
                        {PRAYER_KEYS.map((key, index) => {
                          const offset = settings.adjustments?.[key] ?? 0;
                          return (
                            <div key={key}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                                <span className="font-bold capitalize w-24 text-sm">
                                  {PRAYER_NAMES[key] ? (PRAYER_NAMES[key] as any)[settings.language] : key}
                                </span>
                                <div className="flex-1">
                                  <Slider
                                    minValue={-20}
                                    maxValue={20}
                                    step={1}
                                    value={offset}
                                    onChange={(v: number | number[]) => updateSettings({
                                      adjustments: { ...settings.adjustments, [key]: (typeof v === 'number' ? v : v[0]) }
                                    })}
                                    className="max-w-full"
                                  >
                                    <Slider.Track>
                                      <Slider.Fill />
                                      <Slider.Thumb />
                                    </Slider.Track>
                                  </Slider>
                                </div>
                                <span className="w-12 text-right font-mono text-[var(--app-primary)] font-bold">{offset > 0 ? `+${offset}` : offset}m</span>
                              </div>
                              {index < PRAYER_KEYS.length - 1 && <Separator className="mx-4" />}
                            </div>
                          );
                        })}
                      </div>
                    </SectionCard>
                  </Tabs.Panel>

                  {/* ADVANCED */}
                  <Tabs.Panel id="advanced" className="space-y-6 max-w-2xl mx-auto w-full outline-none">
                    <SectionCard>
                      <div className="p-6 space-y-1">
                        <SettingRow title="High Latitude Calculations" description="Enable alternative calculation methods for extreme latitudes">
                          <Switch
                            isSelected={!!settings.highLatitude}
                            onChange={(val: boolean) => updateSettings({ highLatitude: val })}
                          >
                            <Switch.Control><Switch.Thumb /></Switch.Control>
                          </Switch>
                        </SettingRow>
                        <Separator className="my-2" />
                        <SettingRow title="Hijri Date Adjustment" description="Adjust the Hijri calendar by +/- 2 days">
                          <div className="flex items-center gap-3">
                            <Slider
                              minValue={-2}
                              maxValue={2}
                              step={1}
                              value={settings.hijriAdjustment || 0}
                              onChange={(v: number | number[]) => updateSettings({ hijriAdjustment: (typeof v === 'number' ? v : v[0]) })}
                              className="w-32"
                            >
                              <Slider.Track>
                                <Slider.Fill />
                                <Slider.Thumb />
                              </Slider.Track>
                            </Slider>
                            <span className="w-6 text-right font-mono text-sm">{settings.hijriAdjustment || 0}</span>
                          </div>
                        </SettingRow>
                      </div>
                    </SectionCard>

                    <SectionCard>
                      <div className="p-6 space-y-4">
                        <SettingRow title="Offline Data Cache" description="Download prayer data for offline use">
                          <select
                            className="rounded-xl border border-[var(--app-outline-variant)]/30 bg-[var(--app-surface)] px-3 py-2 text-sm w-32"
                            value={downloadRange}
                            onChange={(e) => setDownloadRange(e.target.value as any)}
                          >
                            <option value="week">1 Week</option>
                            <option value="month">1 Month</option>
                            <option value="year">1 Year</option>
                          </select>
                        </SettingRow>
                        <div className="flex gap-2 justify-end mt-2">
                          <Button variant="primary" onPress={handleSaveOffline} isDisabled={isDownloading}>
                            {isDownloading ? "Downloading..." : "Download Offline Data"}
                          </Button>
                        </div>
                        {downloadSuccess && <p className="text-green-500 text-xs text-right mt-2">Downloaded successfully!</p>}
                        {downloadError && <p className="text-red-500 text-xs text-right mt-2">{downloadError}</p>}
                      </div>
                    </SectionCard>
                  </Tabs.Panel>

                  {/* MOSQUE */}
                  <Tabs.Panel id="mosque" className="space-y-6 max-w-2xl mx-auto w-full outline-none">
                    <div className="bg-[var(--app-primary)]/10 text-[var(--app-primary)] p-4 rounded-xl text-sm font-medium">
                      Mosque mode simplifies the interface to display a beautiful large clock and prayer times for public displays.
                    </div>

                    <SectionCard>
                      <div className="p-6 space-y-1">
                        <SettingRow title="Enable Mosque Mode UI" description="Transform the app layout to digital signage">
                          <Switch
                            isSelected={!!settings.solatMode}
                            onChange={(val: boolean) => updateSettings({ solatMode: val })}
                          >
                            <Switch.Control><Switch.Thumb /></Switch.Control>
                          </Switch>
                        </SettingRow>

                        {settings.solatMode && (
                          <>
                            <Separator className="my-2" />
                            <SettingRow title="Show Clock" description="Display analog clock in mosque mode">
                              <Switch
                                isSelected={settings.solatModeShowClock !== false}
                                onChange={(val: boolean) => updateSettings({ solatModeShowClock: val })}
                              >
                                <Switch.Control><Switch.Thumb /></Switch.Control>
                              </Switch>
                            </SettingRow>
                            <Separator className="my-2" />
                            <SettingRow title="Show Qibla Direction" description="Display qibla pointer in mosque mode">
                              <Switch
                                isSelected={settings.solatModeShowQibla !== false}
                                onChange={(val: boolean) => updateSettings({ solatModeShowQibla: val })}
                              >
                                <Switch.Control><Switch.Thumb /></Switch.Control>
                              </Switch>
                            </SettingRow>
                            <Separator className="my-2" />
                            <div className="pt-2">
                              <h4 className="text-sm font-bold mb-4 text-[var(--app-foreground)]">Prayer Transition Durations</h4>
                              {PRAYER_KEYS.map((key) => {
                                const duration = settings.solatModeDuration?.[key] ?? 10;
                                return (
                                  <div key={key} className="flex items-center justify-between py-2 gap-4">
                                    <span className="font-medium text-sm capitalize w-24">
                                      {PRAYER_NAMES[key] ? (PRAYER_NAMES[key] as any)[settings.language] : key}
                                    </span>
                                    <Slider
                                      minValue={1}
                                      maxValue={30}
                                      step={1}
                                      value={duration}
                                      onChange={(v: number | number[]) => {
                                        const cur = settings.solatModeDuration || { fajr: 10, dhuhr: 10, asr: 10, maghrib: 10, isha: 10, imsak: 10, syuruk: 10 };
                                        updateSettings({ solatModeDuration: { ...cur, [key]: (typeof v === 'number' ? v : v[0]) } });
                                      }}
                                      className="flex-1"
                                    >
                                      <Slider.Track>
                                        <Slider.Fill />
                                        <Slider.Thumb />
                                      </Slider.Track>
                                    </Slider>
                                    <span className="w-8 text-right font-mono text-sm">{duration}m</span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </SectionCard>
                  </Tabs.Panel>

                </div>
              </Tabs>
            </div>

            {/* Close button */}
            <Modal.CloseTrigger className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--app-surface-container)] transition-colors text-[var(--app-outline)]" />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
