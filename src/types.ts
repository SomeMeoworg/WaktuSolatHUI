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

export type NotificationSound = 'default' | 'voice' | 'beep' | 'azan1' | 'azan2' | 'chime' | 'soft-chime';
export type NotificationType = 'push' | 'in-app' | 'both';
export type PreAlertTime = 0 | 5 | 10 | 15;

export interface PrayerPreference {
  enabled: boolean;
  sound: NotificationSound;
  preAlert: PreAlertTime;
  offset: number; // in minutes
  iqamahOffset?: number; // in minutes
}

export type PrayerKey = "imsak" | "fajr" | "syuruk" | "dhuhr" | "asr" | "maghrib" | "isha";
export type Preferences = Record<PrayerKey, PrayerPreference>;

export interface GeneralSettings {
  language: 'ms' | 'en';
  timeFormat: '12h' | '24h';
  mazhab: 'shafii' | 'hanafi' | 'maliki' | 'hanbali';
  notificationType: NotificationType;
  hijriFormat?: 'text' | 'number' | 'both';
  showIqamah?: boolean;
  clockFace?: 'digital' | 'analog' | 'anadigi' | 'chronograph' | 'flip' | 'word' | 'minimal' | 'orbit' | 'typographic' | 'prayer-ring' | 'analog-numeric' | 'analog-roman' | 'analog-arabic' | 'dashboard' | 'abstract' | 'swiss-station' | 'bauhaus' | 'layered';
  clockMovement?: 'tick' | 'sweep';
  visualStyle?: 'default' | 'retro' | 'glass' | 'soft';
  locationMode?: 'auto' | 'manual';
  // Mosque / Surau Mode
  azanAlertStyle?: 'dramatic' | 'standard' | 'subtle' | 'none';
  azanAlertDuration?: number; // seconds before auto-dismiss
  solatModeEnabled?: boolean;
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
  // Core theme styles synced globally
  themeDark?: boolean;
  themeColor?: string;
  themeVariant?: 'tonal_spot' | 'vibrant' | 'expressive' | 'fidelity' | 'neutral' | 'monochrome' | 'content';
  themeContrast?: number;
  themeFont?: string;
  themeShape?: string;
}

// Default preferences
export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  language: 'ms',
  timeFormat: '12h',
  mazhab: 'shafii',
  notificationType: 'both',
  hijriFormat: 'both',
  showIqamah: false,
  clockFace: 'digital',
  clockMovement: 'sweep',
  visualStyle: 'default',
  locationMode: 'manual',
  azanAlertStyle: 'standard',
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
  themeDark: false,
  themeColor: '#006C54', // Emerald
  themeVariant: 'tonal_spot',
  themeContrast: 0.0,
  themeFont: "'Plus Jakarta Sans', sans-serif",
  themeShape: 'rounded',
};

