import { format } from "date-fns";
import { useAppContext } from "../../AppContext";
import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
import "@material/web/elevation/elevation.js";

export function ChronographClock({
  movement,
  nextPrayerName,
  nextPrayerTime,
  prevPrayerTime,
}: {
  movement: 'tick' | 'sweep';
  nextPrayerName: string | null;
  nextPrayerTime: Date | null;
  prevPrayerTime?: Date | null;
  todayHijri?: string;
}) {
  const { settings } = useAppContext();
  const visualStyle = useVisualStyle();
  const time = useTime(movement);

  const seconds = time.getSeconds() + time.getMilliseconds() / 1000;
  const minutes = time.getMinutes() + seconds / 60;
  const hours = (time.getHours() % 12) + minutes / 60;

  // Progress for the top sub-dial (prayer progress)
  let prayerProgress = 0;
  if (nextPrayerTime && prevPrayerTime) {
    const total = nextPrayerTime.getTime() - prevPrayerTime.getTime();
    const current = time.getTime() - prevPrayerTime.getTime();
    prayerProgress = Math.max(0, Math.min(100, (current / total) * 100));
  }
  
  // 24-hour time for the bottom sub-dial
  const hours24 = time.getHours() + minutes / 60;

  return (
    <div className={cn(
      "relative w-full aspect-square shrink-0 mx-auto flex flex-col items-center justify-center transition-all duration-300 overflow-hidden",
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
      
      {/* Outer Ring Marks */}
      {[...Array(60)].map((_, i) => {
        const isMajor = i % 5 === 0;
        return (
          <div
            key={`tm${i}`}
            className="absolute inset-0 pointer-events-none"
            style={{ transform: `rotate(${i * 6}deg)` }}
          >
            <div className={cn(
              "mx-auto rounded-b-full transition-all",
              "bg-[var(--md-sys-color-on-surface-variant)]",
              isMajor ? 'w-1 h-2.5 opacity-80' : 'w-0.5 h-1.5 opacity-30',
              visualStyle === 'retro' && "bg-[var(--md-sys-color-on-surface)] opacity-85",
              visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)]",
              visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)] opacity-40"
            )} />
          </div>
        );
      })}

      {/* --- Top Sub-Dial (Prayer Progress) --- */}
      <div className={cn(
        "absolute top-[18%] left-1/2 -translate-x-1/2 w-[36%] h-[36%] rounded-full flex items-center justify-center border transition-all duration-300",
        "border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container-low)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]",
        visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface)] shadow-none rounded-none",
        visualStyle === 'glass' && "border border-[var(--glass-border)] bg-white/5 backdrop-blur-sm",
        visualStyle === 'soft' && "border-none bg-[var(--md-sys-color-surface-container-low)] shadow-[var(--soft-shadow-dark)]"
      )}>
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="50%" cy="50%" r="43%" fill="none" stroke="currentColor" className="text-[var(--md-sys-color-outline-variant)]/20" strokeWidth="1.5" />
          <circle cx="50%" cy="50%" r="43%" fill="none" stroke="currentColor" className="text-[var(--md-sys-color-primary)]" strokeWidth="2" strokeDasharray={`${(prayerProgress / 100) * 270} 270`} strokeLinecap="round" />
        </svg>
        <span className={cn(
          "text-[8px] sm:text-[9.5px] font-black uppercase tracking-wider text-center mt-3 px-0.5 truncate max-w-[90%] transition-colors",
          "text-[var(--md-sys-color-primary)]",
          visualStyle === 'retro' && "text-[var(--md-sys-color-on-surface)]"
        )}>{nextPrayerName || '...'}</span>
        
        <div className={cn(
          "absolute top-1/2 left-1/2 w-1.5 h-1.5 -ml-0.75 -mt-0.75 rounded-full z-10",
          "bg-[var(--md-sys-color-on-surface)]",
          visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)]"
        )}></div>
        <div 
          className={cn(
            "absolute top-1/2 left-1/2 w-0.5 h-[40%] origin-bottom -ml-[1px] -mt-[40%] transition-colors",
            "bg-[var(--md-sys-color-on-surface)]",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)]"
          )}
          style={{ transform: `rotate(${prayerProgress * 3.6}deg)` }}
        ></div>
      </div>

      {/* --- Bottom Sub-Dial (24 Hour) --- */}
      <div className={cn(
        "absolute bottom-[18%] left-1/2 -translate-x-1/2 w-[32%] h-[32%] rounded-full flex items-center justify-center border transition-all duration-300",
        "border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container-low)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]",
        visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface)] shadow-none rounded-none",
        visualStyle === 'glass' && "border border-[var(--glass-border)] bg-white/5 backdrop-blur-sm",
        visualStyle === 'soft' && "border-none bg-[var(--md-sys-color-surface-container-low)] shadow-[var(--soft-shadow-dark)]"
      )}>
        <span className="absolute top-0.5 text-[8px] sm:text-[9px] font-black text-[var(--md-sys-color-on-surface-variant)]/70 select-none">24</span>
        <span className="absolute bottom-0.5 text-[8px] sm:text-[9px] font-black text-[var(--md-sys-color-on-surface-variant)]/70 select-none">12</span>
        
        <div className={cn(
          "absolute top-1/2 left-1/2 w-1.5 h-1.5 -ml-0.75 -mt-0.75 rounded-full z-10",
          "bg-[var(--md-sys-color-on-surface)]",
          visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)]"
        )}></div>
        <div 
          className={cn(
            "absolute top-1/2 left-1/2 w-0.5 h-[40%] origin-bottom -ml-[1px] -mt-[40%] transition-colors",
            "bg-[var(--md-sys-color-on-surface)]",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)]"
          )}
          style={{ transform: `rotate(${hours24 * 15}deg)` }}
        ></div>
      </div>

      {/* Date Window (3 o'clock) */}
      <div className={cn(
        "absolute top-1/2 right-[12%] -translate-y-1/2 px-1.5 py-0.5 rounded shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-300",
        "bg-[var(--md-sys-color-inverse-surface)] text-[var(--md-sys-color-inverse-on-surface)]",
        visualStyle === 'retro' && "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border-2 border-[var(--md-sys-color-on-surface)] rounded-none shadow-none",
        visualStyle === 'glass' && "bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--md-sys-color-on-surface)]",
        visualStyle === 'soft' && "bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-primary)] shadow-[var(--soft-shadow-dark)]"
      )}>
        <span className="font-sans font-black text-[9px] sm:text-[10px] select-none tabular-nums">{format(time, "dd")}</span>
      </div>

      {/* Center spindle */}
      <div className={cn(
        "absolute top-1/2 left-1/2 w-4.5 h-4.5 sm:w-5 sm:h-5 -ml-2.25 sm:-ml-2.5 -mt-2.25 sm:-mt-2.5 rounded-full z-25 shadow-md",
        "bg-[var(--md-sys-color-on-surface)]",
        visualStyle === 'retro' && "bg-[var(--md-sys-color-on-surface)] border-2 border-white shadow-none",
        visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)]",
        visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)]"
      )}></div>
      <div className="absolute top-1/2 left-1/2 w-2.5 h-2.5 -ml-1.25 -mt-1.25 bg-white rounded-full z-30 pointer-events-none"></div>

      {/* Hands */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Hour Hand */}
        <div
          className={cn(
            "absolute top-[28%] left-1/2 w-3 sm:w-3.5 h-[30%] rounded-full -ml-[1.5px] sm:-ml-[1.75px] origin-[50%_73.3%] z-10 shadow-md",
            "bg-[var(--md-sys-color-on-surface)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-on-surface)] rounded-none w-3.5 sm:w-4 -ml-1.75 sm:-ml-2",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)] border border-white/20",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)] shadow-sm"
          )}
          style={{ transform: `rotate(${hours * 30}deg)` }}
        ></div>
        
        {/* Minute Hand */}
        <div
          className={cn(
            "absolute top-[12%] left-1/2 w-2 sm:w-2.5 h-[48%] rounded-full -ml-[1px] sm:-ml-[1.25px] origin-[50%_79.1%] z-10 shadow-md opacity-90",
            "bg-[var(--md-sys-color-on-surface)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-secondary)] border border-[var(--md-sys-color-on-surface)] rounded-none w-2.5 sm:w-3 -ml-1.25 sm:-ml-1.5",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)]/80 border border-white/10",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-secondary)] opacity-80"
          )}
          style={{ transform: `rotate(${minutes * 6}deg)` }}
        ></div>
        
        {/* Chrono Second Hand */}
        <div
          className={cn(
            "absolute top-[8%] left-1/2 w-[2px] h-[55%] rounded-full -ml-[1px] origin-[50%_76.3%] z-20 shadow-sm",
            "bg-[var(--md-sys-color-error)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-error)] w-[2.5px] rounded-none shadow-none",
            visualStyle === 'glass' && "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]",
            visualStyle === 'soft' && "bg-rose-500"
          )}
          style={{ transform: `rotate(${seconds * 6}deg)` }}
        ></div>
      </div>
    </div>
  );
}
