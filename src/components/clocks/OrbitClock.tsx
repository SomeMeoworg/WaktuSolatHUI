import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
import "@material/web/elevation/elevation.js";

export function OrbitClock({ movement }: { movement: 'tick' | 'sweep' }) {
  const visualStyle = useVisualStyle();
  const time = useTime(movement);

  const seconds = time.getSeconds() + time.getMilliseconds() / 1000;
  const minutes = time.getMinutes() + seconds / 60;
  const hours = (time.getHours() % 12) + minutes / 60;

  return (
    <div className={cn(
      "relative w-full aspect-square shrink-0 mx-auto flex flex-col items-center justify-center transition-all duration-300",
      // Size limits (Symmetric Locking Formula)
      "max-w-[180px] sm:max-w-[220px] md:max-w-[250px] lg:max-w-[280px] xl:max-w-[310px] 2xl:max-w-[340px]",
      "max-h-[180px] sm:max-h-[220px] md:max-h-[250px] lg:max-h-[280px] xl:max-h-[310px] 2xl:max-h-[340px]",
      "max-w-[20vh] sm:max-w-[24vh] lg:max-w-[28vh] xl:max-w-[30vh]",
      "max-h-[20vh] sm:max-h-[24vh] lg:max-h-[28vh] xl:max-h-[30vh]",
      
      // Default Style: Circular Dial
      "rounded-full bg-gradient-to-br from-[var(--md-sys-color-surface-container-highest)] to-[var(--md-sys-color-surface-container-lowest)] shadow-sm",
      
      visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface-container-high)] shadow-[6px_6px_0px_0px_var(--md-sys-color-on-surface)] rounded-none",
      visualStyle === 'glass' && "border-2 border-[var(--glass-border)] bg-[var(--glass-bg)]/35 backdrop-blur-[var(--glass-blur)] rounded-full shadow-none",
      visualStyle === 'soft' && "border border-white/10 shadow-[var(--soft-shadow-light)] bg-[var(--md-sys-color-surface-container-low)] rounded-full"
    )}>
      {/* @ts-ignore */}
      <md-elevation level="1"></md-elevation>
      
      {/* Outer Orbit (Seconds) - Thicker for distant visibility */}
      <div className={cn(
        "absolute w-[90%] h-[90%] rounded-full border-[3px] border-dotted transition-colors duration-300 pointer-events-none",
        "border-[var(--md-sys-color-outline-variant)]/70",
        visualStyle === 'retro' && "border-[3px] border-[var(--md-sys-color-on-surface)]/70 border-solid",
        visualStyle === 'glass' && "border-white/25",
        visualStyle === 'soft' && "border-[var(--md-sys-color-outline-variant)]/50"
      )}>
        <div 
          className="absolute inset-0 z-30 origin-center animate-[spin_60s_linear_infinite]"
          style={{ transform: `rotate(${seconds * 6}deg)` }}
        >
          {/* Larger seconds planet node */}
          <div className={cn(
            "w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 rounded-full absolute -top-2.25 sm:-top-2.75 left-1/2 -translate-x-1/2 transition-all shadow-[0_0_12px_var(--md-sys-color-error)]",
            "bg-[var(--md-sys-color-error)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-error)] border border-[var(--md-sys-color-on-surface)] shadow-none rounded-none w-5 h-5 -top-2.5",
            visualStyle === 'glass' && "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]",
            visualStyle === 'soft' && "bg-rose-500 shadow-sm"
          )}></div>
        </div>
      </div>

      {/* Middle Orbit (Minutes) - Thicker for distant visibility */}
      <div className={cn(
        "absolute w-[66%] h-[66%] rounded-full border-[3px] border-dashed transition-colors duration-300 pointer-events-none",
        "border-[var(--md-sys-color-outline-variant)]/70",
        visualStyle === 'retro' && "border-[3px] border-[var(--md-sys-color-on-surface)]/60 border-solid",
        visualStyle === 'glass' && "border-white/25",
        visualStyle === 'soft' && "border-[var(--md-sys-color-outline-variant)]/40"
      )}>
        <div 
          className="absolute inset-0 z-20 origin-center"
          style={{ transform: `rotate(${minutes * 6}deg)` }}
        >
          {/* Larger minutes planet node */}
          <div className={cn(
            "w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 rounded-full absolute -top-3.25 sm:-top-3.75 left-1/2 -translate-x-1/2 transition-all shadow-[0_0_16px_var(--md-sys-color-tertiary)]",
            "bg-[var(--md-sys-color-tertiary)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-secondary)] border border-[var(--md-sys-color-on-surface)] shadow-none rounded-none w-7 h-7 -top-3.5",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-secondary)]/90 backdrop-blur-sm border border-white/25",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-secondary)] shadow-sm"
          )}></div>
        </div>
      </div>

      {/* Inner Orbit (Hours) - Thicker for distant visibility */}
      <div className={cn(
        "absolute w-[42%] h-[42%] rounded-full border-[4px] border-dashed transition-colors duration-300 pointer-events-none",
        "border-[var(--md-sys-color-outline-variant)]/70",
        visualStyle === 'retro' && "border-[4px] border-[var(--md-sys-color-on-surface)]/50 border-solid",
        visualStyle === 'glass' && "border-white/25",
        visualStyle === 'soft' && "border-[var(--md-sys-color-outline-variant)]/30"
      )}>
        <div 
          className="absolute inset-0 z-10 origin-center"
          style={{ transform: `rotate(${hours * 30}deg)` }}
        >
          {/* Larger hours planet node */}
          <div className={cn(
            "w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-full absolute -top-[17px] sm:-top-5 left-1/2 -translate-x-1/2 transition-all shadow-[0_0_22px_var(--md-sys-color-primary)]",
            "bg-[var(--md-sys-color-primary)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-on-surface)] shadow-none rounded-none w-9 h-9 -top-[18px]",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-primary)]/90 backdrop-blur-sm border border-white/30",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)] shadow-sm"
          )}></div>
        </div>
      </div>

      {/* Center Spindle - Scaled to match new layout */}
      <div className={cn(
        "absolute w-14 h-14 rounded-full z-0 flex flex-col items-center justify-center transition-colors duration-300 shadow-lg border border-[var(--md-sys-color-outline-variant)]/30",
        "bg-[var(--md-sys-color-on-surface)]",
        visualStyle === 'retro' && "bg-[var(--md-sys-color-on-surface)] border-2 border-white",
        visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)]/80 backdrop-blur-md",
        visualStyle === 'soft' && "bg-[var(--md-sys-color-surface-container-highest)] border-none"
      )}>
         <span className={cn(
           "text-[10px] sm:text-[11px] font-black tracking-tight tabular-nums select-none",
           "text-[var(--md-sys-color-surface)]",
           visualStyle === 'soft' && "text-[var(--md-sys-color-primary)]",
           visualStyle === 'retro' && "text-[var(--md-sys-color-surface)]"
         )}>
           {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
         </span>
      </div>

    </div>
  );
}
