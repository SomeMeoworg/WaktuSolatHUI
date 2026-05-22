import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
import "@material/web/elevation/elevation.js";

export function DashboardClock({ movement }: { movement: 'tick' | 'sweep' }) {
  const visualStyle = useVisualStyle();
  const time = useTime(movement);

  const seconds = time.getSeconds() + time.getMilliseconds() / 1000;
  const minutes = time.getMinutes() + seconds / 60;
  const hours = (time.getHours() % 12) + minutes / 60;

  return (
    <div className={cn(
      "relative w-full aspect-square shrink-0 mx-auto flex flex-col items-center justify-center transition-all duration-300 overflow-hidden",
      // Size limits (Optimized for Mobile & Desktop)
      "w-[90%] sm:w-full max-w-[280px] sm:max-w-[320px] md:max-w-[340px] lg:max-w-[360px]",
      
      // Default Style: Circular Dial
      "rounded-full border-[1.5px] border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface)] shadow-inner",
      
      visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface)] shadow-[6px_6px_0px_0px_var(--md-sys-color-on-surface)] rounded-none",
      visualStyle === 'glass' && "border-2 border-[var(--glass-border)] bg-[var(--glass-bg)]/35 backdrop-blur-[var(--glass-blur)] rounded-full shadow-none",
      visualStyle === 'soft' && "border border-[var(--md-sys-color-outline-variant)]/10 bg-[var(--md-sys-color-surface-container-lowest)] shadow-[var(--soft-shadow-light)] rounded-full"
    )}>
      {/* @ts-ignore */}
      <md-elevation level="3"></md-elevation>
      
      {/* Outer Glow */}
      {visualStyle !== 'glass' && (
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_var(--md-sys-color-primary)] opacity-10 pointer-events-none"></div>
      )}
      
      {/* Speedometer-style Ticks */}
      {[...Array(60)].map((_, i) => {
        const isMajor = i % 5 === 0;
        return (
          <div
            key={i}
            className="absolute inset-0 pointer-events-none"
            style={{ transform: `rotate(${i * 6}deg)` }}
          >
            <div 
              className={cn(
                "mx-auto mt-2 rounded-sm transition-all",
                isMajor ? 'w-[3px] h-3.5 bg-[var(--md-sys-color-on-surface)] opacity-85' : 'w-[1.5px] h-2 bg-[var(--md-sys-color-on-surface-variant)]/60 opacity-50',
                visualStyle === 'retro' && (isMajor ? 'bg-[var(--md-sys-color-on-surface)] opacity-95 w-[3px]' : 'bg-[var(--md-sys-color-on-surface)]/40'),
                visualStyle === 'glass' && (isMajor ? 'bg-[var(--md-sys-color-on-surface)] opacity-90' : 'bg-[var(--md-sys-color-on-surface)]/30'),
                visualStyle === 'soft' && (isMajor ? 'bg-[var(--md-sys-color-primary)] opacity-80' : 'bg-[var(--md-sys-color-outline)]/20')
              )}
            ></div>
          </div>
        );
      })}
      
      {/* Numeric Markers for major ticks */}
      {[...Array(12)].map((_, i) => {
        const num = i === 0 ? 60 : i * 5;
        // Only show some numbers to keep it clean
        if (i % 2 !== 0) return null;
        return (
          <div
            key={`num${i}`}
            className="absolute inset-0 flex justify-center pointer-events-none"
            style={{ transform: `rotate(${i * 30}deg)` }}
          >
            <div 
              className={cn(
                "mt-5 font-sans font-black text-[10px] sm:text-[12px] lg:text-[14px] text-[var(--md-sys-color-on-surface)] opacity-75 transition-colors tabular-nums",
                visualStyle === 'retro' && "text-[var(--md-sys-color-on-surface)] opacity-90",
                visualStyle === 'glass' && "text-[var(--md-sys-color-on-surface)] opacity-80",
                visualStyle === 'soft' && "text-[var(--md-sys-color-primary)] opacity-60"
              )}
              style={{ transform: `rotate(-${i * 30}deg)` }}
            >
              {num}
            </div>
          </div>
        );
      })}

      {/* Center hub */}
      <div className={cn(
        "absolute top-1/2 left-1/2 w-5 h-5 sm:w-6 sm:h-6 -ml-2.5 sm:-ml-3 -mt-2.5 sm:-mt-3 rounded-full z-20 shadow-md transition-colors",
        "bg-[var(--md-sys-color-surface-container-high)] border-2 border-[var(--md-sys-color-outline-variant)]",
        visualStyle === 'retro' && "bg-[var(--md-sys-color-on-surface)] border-2 border-white",
        visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)]",
        visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)]"
      )}></div>
      <div className="absolute top-1/2 left-1/2 w-2.5 h-2.5 -ml-1.25 -mt-1.25 bg-[var(--md-sys-color-error)] rounded-full z-30 pointer-events-none shadow-[0_0_8px_var(--md-sys-color-error)]"></div>

      {/* Hands */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Hour Hand (Speedometer Needle style) */}
        <div
          className={cn(
            "absolute top-[28%] left-1/2 w-2.5 sm:w-3 h-[30%] rounded-full -ml-[1.25px] sm:-ml-[1.5px] origin-[50%_73.3%] z-10 shadow-md transition-all",
            "bg-[var(--md-sys-color-primary)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-on-surface)] rounded-none w-3.5 sm:w-4 -ml-1.75 sm:-ml-2",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)] border border-white/20",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)]"
          )}
          style={{ transform: `rotate(${hours * 30}deg)` }}
        ></div>
        
        {/* Minute Hand (Speedometer Needle style) */}
        <div
          className={cn(
            "absolute top-[12%] left-1/2 w-1.5 sm:w-2 h-[48%] rounded-full -ml-[0.75px] sm:-ml-[1px] origin-[50%_79.1%] z-10 shadow-md transition-all",
            "bg-[var(--md-sys-color-on-surface-variant)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-secondary)] border border-[var(--md-sys-color-on-surface)] rounded-none w-2.5 sm:w-3 -ml-1.25 sm:-ml-1.5",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)]/80 border border-white/10",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-secondary)] opacity-80"
          )}
          style={{ transform: `rotate(${minutes * 6}deg)` }}
        ></div>
        
        {/* Second Hand (Red, sweeps) */}
        <div
          className={cn(
            "absolute top-[8%] left-1/2 w-[2px] h-[55%] rounded-full -ml-[1px] origin-[50%_76.3%] z-20 shadow-[0_0_8px_var(--md-sys-color-error)] transition-all",
            "bg-[var(--md-sys-color-error)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-error)] w-[2.5px] rounded-none shadow-none",
            visualStyle === 'glass' && "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)]",
            visualStyle === 'soft' && "bg-rose-500 shadow-none"
          )}
          style={{ transform: `rotate(${seconds * 6}deg)` }}
        ></div>
      </div>
    </div>
  );
}
