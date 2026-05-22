import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
import "@material/web/elevation/elevation.js";

export function MinimalistClock({ movement }: { movement: 'tick' | 'sweep' }) {
  const visualStyle = useVisualStyle();
  const time = useTime(movement);

  const seconds = time.getSeconds() + time.getMilliseconds() / 1000;
  const minutes = time.getMinutes() + seconds / 60;
  const hours = (time.getHours() % 12) + minutes / 60;

  return (
    <div className={cn(
      "relative w-full aspect-square shrink-0 mx-auto flex flex-col items-center justify-center transition-all duration-300",
      // Size limits (Optimized for Mobile & Desktop)
      "w-[90%] sm:w-full max-w-[280px] sm:max-w-[320px] md:max-w-[340px] lg:max-w-[360px]",
      
      // Default Style: Circular Dial
      "rounded-full bg-[var(--md-sys-color-surface)] shadow-inner",
      
      visualStyle === 'retro' && "border-[3px] border-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface)] shadow-[6px_6px_0px_0px_var(--md-sys-color-on-surface)] rounded-none",
      visualStyle === 'glass' && "border-2 border-[var(--glass-border)] bg-[var(--glass-bg)]/35 backdrop-blur-[var(--glass-blur)] rounded-full shadow-none",
      visualStyle === 'soft' && "border border-[var(--md-sys-color-outline-variant)]/10 bg-[var(--md-sys-color-surface-container-lowest)] shadow-[var(--soft-shadow-light)] rounded-full"
    )}>
      {/* @ts-ignore */}
      <md-elevation level="1"></md-elevation>
      
      {/* Only 12, 3, 6, 9 markers - Thicker & Bolder */}
      {[0, 3, 6, 9].map((i) => (
        <div
          key={i}
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `rotate(${i * 30}deg)` }}
        >
          <div className={cn(
            "w-[5px] sm:w-[6px] h-5.5 sm:h-7 mx-auto mt-2 rounded-full opacity-90 transition-colors",
            "bg-[var(--md-sys-color-on-surface)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-on-surface)] opacity-100 rounded-none w-2 h-7.5",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)] opacity-80",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)] opacity-55"
          )}></div>
        </div>
      ))}

      {/* Center spindle */}
      <div className={cn(
        "absolute top-1/2 left-1/2 w-4 h-4 -ml-2 -mt-2 rounded-full z-20 shadow-md transition-all",
        "bg-[var(--md-sys-color-on-surface)]",
        visualStyle === 'retro' && "bg-[var(--md-sys-color-on-surface)] border-2 border-white shadow-none",
        visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)] shadow-[0_0_6px_var(--md-sys-color-on-surface)]",
        visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)]"
      )}></div>

      {/* Hands */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Hour Hand - Thicker and wider */}
        <div
          className={cn(
            "absolute top-[28%] left-1/2 w-[6px] sm:w-[8px] h-[22%] -ml-[3px] sm:-ml-[4px] origin-bottom z-10 shadow-sm transition-all",
            "bg-[var(--md-sys-color-on-surface)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-on-surface)] rounded-none w-[7px] sm:w-[9px] -ml-[3.5px] sm:-ml-[4.5px]",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)]/95 border border-white/10",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)] opacity-95"
          )}
          style={{ transform: `rotate(${hours * 30}deg)` }}
        ></div>
        
        {/* Minute Hand - Thicker and longer */}
        <div
          className={cn(
            "absolute top-[12%] left-1/2 w-[4px] sm:w-[5px] h-[38%] -ml-[2px] sm:-ml-[2.5px] origin-bottom z-10 opacity-85 transition-all",
            "bg-[var(--md-sys-color-on-surface)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-secondary)] border border-[var(--md-sys-color-on-surface)] rounded-none w-[4px] sm:w-[5px] -ml-[2px] sm:-ml-[2.5px]",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)]/85 border border-white/10",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-secondary)] opacity-90"
          )}
          style={{ transform: `rotate(${minutes * 6}deg)` }}
        ></div>
        
        {/* Second Hand - Sleek with red tip or solid accent */}
        <div
          className={cn(
            "absolute top-[6%] left-1/2 w-[2px] sm:w-[2.5px] h-[48%] -ml-[1px] sm:-ml-[1.25px] origin-[50%_91.6%] z-20 shadow-sm transition-all",
            "bg-[var(--md-sys-color-primary)]",
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
