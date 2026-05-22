import { format } from "date-fns";
import { useAppContext } from "../../AppContext";
import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
import "@material/web/elevation/elevation.js";
import { PrayerData } from "../../types";

const DEFAULT_PREFS = {
  fajr: { offset: 0 },
  dhuhr: { offset: 0 },
  asr: { offset: 0 },
  maghrib: { offset: 0 },
  isha: { offset: 0 },
};

export function PrayerRingClock({
  movement,
  todayData,
}: {
  movement: 'tick' | 'sweep';
  todayData?: PrayerData | null;
}) {
  const { settings } = useAppContext();
  const visualStyle = useVisualStyle();
  const time = useTime(movement);

  const seconds = time.getSeconds() + time.getMilliseconds() / 1000;
  const minutes = time.getMinutes() + seconds / 60;
  const hours = (time.getHours() % 12) + minutes / 60;

  // Load preferences from localStorage for offsets
  let preferences: any = DEFAULT_PREFS;
  try {
    const saved = localStorage.getItem('prayer_notifications_v2');
    if (saved) {
      preferences = JSON.parse(saved);
    }
  } catch (e) {
    // ignore
  }

  const getPrayerAngle = (key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha') => {
    if (!todayData || !todayData[key]) {
      // Fallbacks matching typical clock face angles
      if (key === 'fajr') return 172;
      if (key === 'dhuhr') return 37;
      if (key === 'asr') return 135;
      if (key === 'maghrib') return 220;
      return 255; // isha
    }

    const parts = todayData[key].split(':');
    let h = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10);

    const pref = preferences[key];
    if (pref && typeof pref.offset === 'number') {
      m += pref.offset;
    }

    if (key === 'asr' && settings.mazhab === 'hanafi') {
      m += 45;
    }

    const totalMinutes = h * 60 + m;
    const finalHours = Math.floor(totalMinutes / 60) % 12;
    const finalMinutes = totalMinutes % 60;

    return finalHours * 30 + finalMinutes * 0.5;
  };

  const fajrAngle = getPrayerAngle('fajr');
  const dhuhrAngle = getPrayerAngle('dhuhr');
  const asrAngle = getPrayerAngle('asr');
  const maghribAngle = getPrayerAngle('maghrib');
  const ishaAngle = getPrayerAngle('isha');

  return (
    <div className={cn(
      "relative w-full aspect-square shrink-0 mx-auto flex flex-col items-center justify-center transition-all duration-300",
      // Size limits (Optimized for Mobile & Desktop)
      "w-[90%] sm:w-full max-w-[280px] sm:max-w-[320px] md:max-w-[340px] lg:max-w-[360px]",
      
      // Default Style: Circular Dial
      "rounded-full border-2 border-[var(--md-sys-color-primary-container)] bg-[var(--md-sys-color-surface)] shadow-inner",
      
      visualStyle === 'retro' && "border-[3px] border-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface)] shadow-[6px_6px_0px_0px_var(--md-sys-color-on-surface)] rounded-none",
      visualStyle === 'glass' && "border-2 border-[var(--glass-border)] bg-[var(--glass-bg)]/35 backdrop-blur-[var(--glass-blur)] rounded-full shadow-none",
      visualStyle === 'soft' && "border border-[var(--md-sys-color-outline-variant)]/10 bg-[var(--md-sys-color-surface-container-lowest)] shadow-[var(--soft-shadow-light)] rounded-full"
    )}>
      {/* @ts-ignore */}
      <md-elevation level="2"></md-elevation>
      
      {/* Abstract Prayer Markers on the Bezel - Bigger & Pulsing */}
      {[
        { key: 'fajr', angle: fajrAngle },
        { key: 'dhuhr', angle: dhuhrAngle },
        { key: 'asr', angle: asrAngle },
        { key: 'maghrib', angle: maghribAngle },
        { key: 'isha', angle: ishaAngle }
      ].map((pr) => (
        <div key={pr.key} className="absolute inset-0 pointer-events-none" style={{ transform: `rotate(${pr.angle}deg)` }}>
          <div className={cn(
            "w-4 h-4 mx-auto mt-0.5 rounded-full shadow-[0_0_12px_var(--md-sys-color-primary)] transition-all border-2 border-[var(--md-sys-color-surface)] animate-pulse",
            "bg-[var(--md-sys-color-primary)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-primary)] border border-white shadow-none rounded-none w-4.5 h-4.5 mt-0 animate-none",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-primary)] shadow-[0_0_8px_var(--md-sys-color-primary)]",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)] border-white/40"
          )}></div>
        </div>
      ))}

      {/* Hour Markers */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `rotate(${i * 30}deg)` }}
        >
          <div className={cn(
            "w-1 h-3 mx-auto mt-4 rounded-full opacity-40 transition-colors",
            "bg-[var(--md-sys-color-on-surface-variant)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-on-surface)] opacity-80 rounded-none w-1 h-3.5",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)] opacity-50",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)] opacity-30"
          )}></div>
        </div>
      ))}
      
      {/* Center cutout - Fluid customizable sans-serif typography */}
      <div className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] h-[55%] rounded-full shadow-inner flex flex-col items-center justify-center z-0 transition-all duration-300",
        "bg-[var(--md-sys-color-surface-container-highest)]",
        visualStyle === 'retro' && "bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-on-surface)] shadow-none rounded-none",
        visualStyle === 'glass' && "bg-white/5 border border-white/10 backdrop-blur-md",
        visualStyle === 'soft' && "bg-[var(--md-sys-color-surface-container-low)] shadow-[var(--soft-shadow-dark)]"
      )}>
         <span className={cn(
           "text-xl sm:text-2xl md:text-3xl font-sans font-black tracking-tight text-[var(--md-sys-color-on-surface)] tabular-nums select-none",
           visualStyle === 'retro' && "text-[var(--md-sys-color-on-surface)]",
           visualStyle === 'soft' && "text-[var(--md-sys-color-primary)]"
         )}>
           {format(time, settings.timeFormat === "12h" ? "hh:mm" : "HH:mm")}
         </span>
         {settings.timeFormat === "12h" && (
           <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-on-surface-variant)]/60 -mt-1 select-none font-sans">
             {format(time, "a")}
           </span>
         )}
       </div>

      {/* Hands */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Hour Hand - Thicker */}
        <div
          className={cn(
            "absolute top-[25%] left-1/2 w-3 sm:w-3.5 h-[25%] rounded-full -ml-[1.5px] sm:-ml-[1.75px] origin-bottom shadow-md",
            "bg-[var(--md-sys-color-on-surface)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-on-surface)] border border-white rounded-none w-4 sm:w-4.5 -ml-2 sm:-ml-[2.25px]",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)]",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)]/90"
          )}
          style={{ transform: `rotate(${hours * 30}deg)` }}
        ></div>
        
        {/* Minute Hand - Thicker */}
        <div
          className={cn(
            "absolute top-[10%] left-1/2 w-2 sm:w-2.5 h-[40%] rounded-full -ml-[1px] sm:-ml-[1.25px] origin-bottom shadow-md",
            "bg-[var(--md-sys-color-tertiary)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-secondary)] border border-white rounded-none w-2.5 sm:w-3 -ml-[1.25px] sm:-ml-[1.5px]",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)]/80",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-secondary)]/90"
          )}
          style={{ transform: `rotate(${minutes * 6}deg)` }}
        ></div>
        
        {/* Second Hand - Sleek with tip */}
        <div
          className={cn(
            "absolute top-[5%] left-1/2 w-[2px] sm:w-[2.5px] h-[55%] rounded-full -ml-[1px] sm:-ml-[1.25px] origin-[50%_81.8%] shadow-lg",
            "bg-[var(--md-sys-color-error)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-error)] w-[2.5px] rounded-none shadow-none",
            visualStyle === 'glass' && "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]",
            visualStyle === 'soft' && "bg-rose-500"
          )}
          style={{ transform: `rotate(${seconds * 6}deg)` }}
        >
          <div className={cn(
            "w-3.5 h-3.5 rounded-full absolute bottom-[18.2%] -left-1.5",
            "bg-[var(--md-sys-color-error)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-error)] border border-white shadow-none rounded-none w-3.5 h-3.5 -left-1.5",
            visualStyle === 'glass' && "bg-rose-500",
            visualStyle === 'soft' && "bg-rose-500"
          )}></div>
        </div>
      </div>

      {/* Center spindle */}
      <div className={cn(
        "absolute top-1/2 left-1/2 w-3.5 h-3.5 -ml-1.75 -mt-1.75 rounded-full z-20 shadow-lg",
        "bg-[var(--md-sys-color-surface)] border-2 border-[var(--md-sys-color-error)]",
        visualStyle === 'retro' && "bg-white border-2 border-[var(--md-sys-color-on-surface)]",
        visualStyle === 'glass' && "bg-white border-[var(--md-sys-color-on-surface)]",
        visualStyle === 'soft' && "bg-white border-rose-500"
      )}></div>
    </div>
  );
}
