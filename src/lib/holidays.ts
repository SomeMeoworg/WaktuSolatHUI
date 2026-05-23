import { format } from "date-fns";

export const FEDERAL_HOLIDAYS_FIXED: Record<string, string> = {
  "01-01": "Tahun Baru",
  "02-01": "Hari Wilayah Persekutuan",
  "05-01": "Hari Pekerja",
  "08-31": "Hari Kebangsaan",
  "09-16": "Hari Malaysia",
  "12-25": "Hari Krismas",
};

export const ISLAMIC_EVENTS: Record<string, { title: string, color: string, isHoliday: boolean }> = {
  "01-01": { title: "Awal Muharram", color: "bg-blue-500", isHoliday: true },
  "03-12": { title: "Maulidur Rasul", color: "bg-green-500", isHoliday: true },
  "07-27": { title: "Israk & Mikraj", color: "bg-indigo-500", isHoliday: false },
  "08-15": { title: "Nisfu Syaaban", color: "bg-purple-500", isHoliday: false },
  "09-01": { title: "Awal Ramadan", color: "bg-amber-500", isHoliday: true }, // (Johor/Kedah/Melaka)
  "09-17": { title: "Nuzul Quran", color: "bg-teal-500", isHoliday: true }, // (Certain states)
  "10-01": { title: "Hari Raya Aidilfitri", color: "bg-emerald-500", isHoliday: true },
  "10-02": { title: "Hari Raya Aidilfitri", color: "bg-emerald-400", isHoliday: true },
  "12-09": { title: "Hari Arafah (Sunat Puasa)", color: "bg-orange-500", isHoliday: false },
  "12-10": { title: "Hari Raya Aidiladha", color: "bg-rose-500", isHoliday: true },
  "12-11": { title: "Hari Raya Aidiladha (Hari Kedua)", color: "bg-rose-400", isHoliday: true }, // Certain states
  "01-09": { title: "Hari Tasu'a (Sunat Puasa)", color: "bg-cyan-500", isHoliday: false },
  "01-10": { title: "Hari Asyura (Sunat Puasa)", color: "bg-indigo-600", isHoliday: false },
};

export function getFixedPublicHoliday(date: Date) {
  const md = format(date, "MM-dd");
  return FEDERAL_HOLIDAYS_FIXED[md] || null;
}

export function getIslamicEvent(hijriDate: string) {
  if (!hijriDate) return null;
  const parts = hijriDate.split('-');
  if (parts.length === 3) {
    const month = parts[1];
    const day = parts[2];
    const md = `${month}-${day}`;
    
    // Check dynamic Sunnah fasting events
    // Ayyamul Bidh (White Days) - 13, 14, 15 of every month
    // Except 13th of Zulhijjah (Tashreeq day - forbidden to fast)
    if ((day === "13" || day === "14" || day === "15") && !(month === "12" && day === "13")) {
      return ISLAMIC_EVENTS[md] || { title: "Puasa Sunat Ayyamul Bidh", color: "bg-sky-400", isHoliday: false };
    }
    
    return ISLAMIC_EVENTS[md] || null;
  }
  
  if (parts.length === 2) {
      const md = hijriDate;
      const [month, day] = md.split("-");
      if ((day === "13" || day === "14" || day === "15") && !(month === "12" && day === "13")) {
        return ISLAMIC_EVENTS[md] || { title: "Puasa Sunat Ayyamul Bidh", color: "bg-sky-400", isHoliday: false };
      }
      return ISLAMIC_EVENTS[md] || null;
  }
  return null;
}

export function getVariableHolidays(date: Date): string | null {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const dates: Record<string, string> = {
    // 2024
    "2024-01-25": "Hari Thaipusam",
    "2024-02-10": "Tahun Baru Cina",
    "2024-02-11": "Tahun Baru Cina (Hari Kedua)",
    "2024-03-12": "Awal Ramadan",
    "2024-03-28": "Nuzul Al-Quran",
    "2024-04-10": "Hari Raya Aidilfitri",
    "2024-04-11": "Hari Raya Aidilfitri (Hari Kedua)",
    "2024-05-22": "Hari Wesak",
    "2024-06-03": "Hari Keputeraan YDP Agong",
    "2024-06-17": "Hari Raya Aidiladha",
    "2024-07-07": "Awal Muharram",
    "2024-09-16": "Maulidur Rasul",
    "2024-10-31": "Hari Deepavali",
    // 2025
    "2025-02-11": "Hari Thaipusam",
    "2025-01-29": "Tahun Baru Cina",
    "2025-01-30": "Tahun Baru Cina (Hari Kedua)",
    "2025-03-02": "Awal Ramadan",
    "2025-03-17": "Nuzul Al-Quran",
    "2025-03-31": "Hari Raya Aidilfitri",
    "2025-04-01": "Hari Raya Aidilfitri (Hari Kedua)",
    "2025-05-12": "Hari Wesak",
    "2025-06-02": "Hari Keputeraan YDP Agong",
    "2025-06-06": "Hari Raya Aidiladha",
    "2025-06-27": "Awal Muharram",
    "2025-09-05": "Maulidur Rasul",
    "2025-10-20": "Hari Deepavali",
    // 2026
    "2026-02-01": "Hari Thaipusam",
    "2026-02-17": "Tahun Baru Cina",
    "2026-02-18": "Tahun Baru Cina (Hari Kedua) & Awal Ramadan",
    "2026-03-07": "Nuzul Al-Quran",
    "2026-03-20": "Hari Raya Aidilfitri",
    "2026-03-21": "Hari Raya Aidilfitri (Hari Kedua)",
    "2026-05-27": "Hari Raya Aidiladha",
    "2026-05-31": "Hari Wesak",
    "2026-06-01": "Hari Keputeraan YDP Agong",
    "2026-06-17": "Awal Muharram",
    "2026-08-26": "Maulidur Rasul",
    "2026-11-08": "Hari Deepavali",
    // 2027
    "2027-01-22": "Hari Thaipusam",
    "2027-02-06": "Tahun Baru Cina",
    "2027-02-07": "Tahun Baru Cina (Hari Kedua)",
    "2027-02-08": "Awal Ramadan",
    "2027-02-25": "Nuzul Al-Quran",
    "2027-03-10": "Hari Raya Aidilfitri",
    "2027-03-11": "Hari Raya Aidilfitri (Hari Kedua)",
    "2027-05-17": "Hari Raya Aidiladha",
    "2027-05-20": "Hari Wesak",
    "2027-06-07": "Hari Keputeraan YDP Agong",
    "2027-06-06": "Awal Muharram",
    "2027-08-15": "Maulidur Rasul",
    "2027-10-29": "Hari Deepavali",
  };
  const ds = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return dates[ds] || null;
}

export function getAllEventsForDay(gregorianDate: Date, hijriDateStr: string | null) {
    const events: { title: string, type: 'public' | 'islamic', color?: string }[] = [];
    
    // Fixed public holidays
    const fixed = getFixedPublicHoliday(gregorianDate);
    if (fixed) events.push({ title: fixed, type: 'public' });
    
    // Variable public holidays / Islamic Events fallback
    const variable = getVariableHolidays(gregorianDate);
    if (variable) {
        // Tag as Islamic event if it's one of the known titles
        const isIslamic = ["Awal Ramadan", "Hari Raya Aidilfitri", "Hari Raya Aidilfitri (Hari Kedua)", "Hari Raya Aidiladha", "Awal Muharram", "Maulidur Rasul"].includes(variable);
        let color = "bg-[var(--md-sys-color-primary)]";
        if (variable.includes("Aidilfitri")) color = "bg-emerald-500";
        if (variable.includes("Aidiladha")) color = "bg-rose-500";
        if (variable.includes("Ramadan")) color = "bg-amber-500";
        if (variable.includes("Muharram")) color = "bg-blue-500";
        if (variable.includes("Maulidur")) color = "bg-green-500";
        
        events.push({ title: variable, type: isIslamic ? 'islamic' : 'public', color: isIslamic ? color : undefined });
    }
    
    // Exact Hijri Islamic Events (takes precedence if available)
    if (hijriDateStr) {
        const islamic = getIslamicEvent(hijriDateStr);
        if (islamic) {
           // check if we already added it from variable list to avoid duplicates
           if (!events.some(e => e.title === islamic.title)) {
               events.push({ title: islamic.title, type: 'islamic', color: islamic.color });
           }
        }
    }
    
    return events;
}

export const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabiulawal", "Rabiulakhir", 
  "Jamadilawal", "Jamadilakhir", "Rejab", "Syaaban", 
  "Ramadan", "Syawal", "Zulkaedah", "Zulhijjah"
];

export const HIJRI_MONTHS_EN = [
  "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
];

export function getDynamicHijriDate(
  gregorianDateStr: string,
  method: 'umalqura' | 'tbla' | 'civil' | 'rgsa' = 'umalqura',
  adjustment: number = 0
): string {
  if (!gregorianDateStr) return "";
  const date = new Date(gregorianDateStr);
  if (isNaN(date.getTime())) return "";

  if (adjustment !== 0) {
    date.setDate(date.getDate() + adjustment);
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-' + method, {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    const day = parts.find(p => p.type === 'day')?.value || '1';
    const month = parts.find(p => p.type === 'month')?.value || '1';
    let year = parts.find(p => p.type === 'year')?.value || '1445';
    year = year.replace(/\D/g, ''); // strip ' AH'
    
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (e) {
    return "";
  }
}

export function getHijriFormatted(
  gregorianDateStr: string,
  method: 'umalqura' | 'tbla' | 'civil' | 'rgsa' = 'umalqura',
  adjustment: number = 0,
  formatType: "text" | "number" | "both" = "both",
  language: 'ms' | 'en' = 'ms'
) {
  const dynamicHijriStr = getDynamicHijriDate(gregorianDateStr, method, adjustment);
  if (!dynamicHijriStr) return "";
  
  const parts = dynamicHijriStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const mIndex = parseInt(month, 10) - 1;
    if (mIndex >= 0 && mIndex < 12) {
      const monthName = language === 'ms' ? HIJRI_MONTHS[mIndex] : HIJRI_MONTHS_EN[mIndex];
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      if (formatType === "text") return `${dayNum} ${monthName} ${year}H`;
      if (formatType === "number") return `${dayNum}/${monthNum}/${year}H`;
      return `${dayNum} ${monthName} ${year}H (${dayNum}/${monthNum}/${year}H)`;
    }
  }
  return dynamicHijriStr;
}
