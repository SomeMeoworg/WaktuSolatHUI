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
};
