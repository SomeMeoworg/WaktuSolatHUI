import { PrayerData } from "../types";

export function timeToMinutes(timeStr: string): number {
  if (!timeStr || timeStr === "--:--") return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  let m = Math.floor(mins);
  while (m < 0) m += 24 * 60;
  m = m % (24 * 60);
  
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
}

export interface SunnahTimes {
  suhoor: string;
  morningForbidden: string;
  duha: string;
  middayForbidden: string;
  eveningForbidden: string;
  firstThird: string;
  midnight: string;
  tahajjud: string;
}

export function calculateSunnahTimes(
  today: PrayerData, 
  nextDay: PrayerData | null, 
  options: {
    suhoorOffset: number;
    midnightMethod: 'fajr' | 'sunrise';
  }
): SunnahTimes {
  const maghribMins = timeToMinutes(today.maghrib);
  const dhuhrMins = timeToMinutes(today.dhuhr);
  const syurukMins = timeToMinutes(today.syuruk);
  const fajrMins = timeToMinutes(today.fajr);
  
  const nextFajrStr = nextDay?.fajr || today.fajr;
  const nextSyurukStr = nextDay?.syuruk || today.syuruk;
  
  const nextFajrMins = timeToMinutes(nextFajrStr) + (24 * 60);
  const nextSyurukMins = timeToMinutes(nextSyurukStr) + (24 * 60);
  
  const nightEndMins = options.midnightMethod === 'fajr' ? nextFajrMins : nextSyurukMins;
  const nightDuration = nightEndMins - maghribMins;
  
  const thirdOfNight = nightDuration / 3;
  const halfOfNight = nightDuration / 2;
  
  return {
    suhoor: minutesToTime(fajrMins - options.suhoorOffset),
    morningForbidden: today.syuruk,
    duha: minutesToTime(syurukMins + 20),
    middayForbidden: minutesToTime(dhuhrMins - 15),
    eveningForbidden: minutesToTime(maghribMins - 20),
    firstThird: minutesToTime(maghribMins + thirdOfNight),
    midnight: minutesToTime(maghribMins + halfOfNight),
    tahajjud: minutesToTime(maghribMins + thirdOfNight * 2), // Begins at last third
  };
}
