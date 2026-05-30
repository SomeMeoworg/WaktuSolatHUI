export type PrayerData = {
  hijri: string;
  date: string;
  day: string;
  imsak: string;
  fajr: string;
  syuruk: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
};

export type JakimResponse = {
  prayerTime: PrayerData[];
  status: string;
  serverTime: string;
  periodType: string;
  lang: string;
  zone: string;
  bearing: string;
};

export type NotificationSound = 'default' | 'voice' | 'beep' | 'azan1' | 'azan2' | 'chime' | 'soft-chime' | 'bell-echo' | 'ambient-gong' | 'digital-sweep';
export type NotificationType = 'push' | 'in-app' | 'both';
export type PreAlertTime = 0 | 5 | 10 | 15;

export interface PrayerPreference {
  enabled: boolean;
  sound: NotificationSound;
  preAlert: PreAlertTime;
  offset: number; // in minutes
  iqamahOffset?: number; // in minutes
  volume?: number;
}

export type PrayerKey = "imsak" | "fajr" | "syuruk" | "dhuhr" | "asr" | "maghrib" | "isha";
export type Preferences = Record<PrayerKey, PrayerPreference>;

export type SunnahTimeKey = "suhoor" | "morningForbidden" | "duha" | "middayForbidden" | "eveningForbidden" | "firstThird" | "midnight" | "tahajjud";

export interface GeneralSettings {
  language: 'ms' | 'en';
  timeFormat: '12h' | '24h';
  mazhab: 'shafii' | 'hanafi' | 'maliki' | 'hanbali';
  notificationType: NotificationType;
  hijriFormat?: 'text' | 'number' | 'both';
  showIqamah?: boolean;
  clockFace?: 'digital' | 'analog' | 'anadigi' | 'chronograph' | 'flip' | 'word' | 'minimal' | 'orbit' | 'typographic' | 'prayer-ring' | 'analog-numeric' | 'analog-roman' | 'analog-arabic' | 'dashboard' | 'abstract' | 'swiss-station' | 'bauhaus' | 'layered';
  showExternalDigitalClock?: boolean;
  clockMovement?: 'tick' | 'sweep';
  visualStyle?: 'default' | 'retro' | 'glass' | 'soft';
  locationMode?: 'auto' | 'manual';
  trackImsak?: boolean;
  showJumaat?: boolean;
  // Sunnah & Optional Times
  showSunnahTimes?: SunnahTimeKey[];
  suhoorOffset?: number; // minutes before Fajr/Imsak
  imsakOffset?: number; // minutes before Fajr
  midnightMethod?: 'fajr' | 'sunrise';
  asrEnds?: 'maghrib' | 'sunset';
  // Hijri Calendar Engine
  hijriMethod?: 'jakim' | 'umalqura' | 'tbla' | 'civil' | 'islamic';
  hijriAdjustment?: number; // -2 to +2
  // Mosque / Surau Mode
  azanAlertStyle?: 'dramatic' | 'standard' | 'modern' | 'subtle' | 'minimal' | 'none';
  azanAlertDuration?: number; // seconds before auto-dismiss
  solatModeEnabled?: boolean;
  solatMode?: boolean;
  adjustments?: Record<string, number>;
  highLatitude?: boolean;
  solatModeDuration?: Record<string, number>; // per-prayer minutes
  solatModeShowClock?: boolean;
  solatModeShowQibla?: boolean;
  backgroundNotifications?: boolean;
  iqamahCountdownSound?: 'chime' | 'tick' | 'none';
  solatModeDuaDuration?: number; // minutes for post-solat dua screensaver
  // Dynamic customizer options
  darkThemeMode?: 'manual' | 'system' | 'solar' | 'prayer';
  colorThemeMode?: 'manual' | 'prayer';
  wallpaperEnabled?: boolean;
  wallpaperSource?: 'upload' | 'url';
  wallpaperUrl?: string;
  wallpaperBlur?: number;
  wallpaperDim?: number;
  wallpaperOverlayStyle?: 'tint' | 'dark' | 'light';
  wallpaperTextGlow?: boolean;
  wallpaperVignette?: boolean;
  wallpaperMosqueAutoDim?: boolean;
  wallpaperLastUpdated?: number;
  offlineCachedRange?: 'week' | 'month' | 'year' | null;
  offlineCachedAt?: number | null;
  autoSyncOffline?: boolean;
  // Core theme styles synced globally
  themeDark?: boolean;
  themeColor?: string;
  themeVariant?: 'tonal_spot' | 'vibrant' | 'expressive' | 'fidelity' | 'neutral' | 'monochrome' | 'content';
  themeContrast?: number;
  themeFont?: string;
  themeShape?: string;
  weatherProvider?: 'best_match' | 'ecmwf_ifs04' | 'gfs_seamless' | 'jma_seamless';
}

// Default preferences
export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  language: 'ms',
  timeFormat: '12h',
  mazhab: 'shafii',
  notificationType: 'in-app',
  hijriFormat: 'both',
  showIqamah: false,
  clockFace: 'digital',
  showExternalDigitalClock: true,
  clockMovement: 'sweep',
  visualStyle: 'default',
  locationMode: 'manual',
  trackImsak: false,
  showJumaat: true,
  showSunnahTimes: [],
  suhoorOffset: 30,
  imsakOffset: 10,
  midnightMethod: 'fajr',
  asrEnds: 'maghrib',
  hijriMethod: 'jakim',
  hijriAdjustment: 0,
  azanAlertStyle: 'dramatic',
  azanAlertDuration: 20,
  solatModeEnabled: false,
  solatModeDuration: { fajr: 10, dhuhr: 10, asr: 10, maghrib: 10, isha: 10 },
  solatModeShowClock: true,
  solatModeShowQibla: true,
  backgroundNotifications: false,
  iqamahCountdownSound: 'chime',
  solatModeDuaDuration: 0,
  darkThemeMode: 'manual',
  colorThemeMode: 'manual',
  wallpaperEnabled: false,
  wallpaperSource: 'upload',
  wallpaperUrl: '',
  wallpaperBlur: 10,
  wallpaperDim: 40,
  wallpaperOverlayStyle: 'tint',
  wallpaperTextGlow: false,
  wallpaperVignette: true,
  wallpaperMosqueAutoDim: true,
  wallpaperLastUpdated: 0,
  offlineCachedRange: null,
  offlineCachedAt: null,
  autoSyncOffline: true,
  themeDark: false,
  themeColor: '#006c54',
  themeVariant: 'tonal_spot',
  themeContrast: 0,
  themeFont: 'Google Sans',
  themeShape: 'rounded',
  weatherProvider: 'best_match'
};
