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
  solatModeDuration: { fajr: 20, dhuhr: 15, asr: 15, maghrib: 10, isha: 20 },
  solatModeShowClock: true,
  solatModeShowQibla: true,
  backgroundNotifications: false,
  iqamahCountdownSound: 'chime',
};

