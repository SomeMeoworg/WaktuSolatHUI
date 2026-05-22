import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
import "@material/web/elevation/elevation.js";

export function BauhausClock({ movement }: { movement: 'tick' | 'sweep' }) {
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
      "rounded-full bg-[var(--md-sys-color-surface)]",
      
      visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface)] shadow-[6px_6px_0px_0px_var(--md-sys-color-on-surface)] rounded-none",
      visualStyle === 'glass' && "border-2 border-[var(--glass-border)] bg-[var(--glass-bg)]/45 backdrop-blur-[var(--glass-blur)] rounded-full shadow-none",
      visualStyle === 'soft' && "border border-[var(--md-sys-color-outline-variant)]/10 bg-[var(--md-sys-color-surface-container-lowest)] shadow-[var(--soft-shadow-light)] rounded-full"
    )}>
      {/* @ts-ignore */}
      <md-elevation level="1"></md-elevation>
      
      {/* Only primary axis markers (12, 3, 6, 9) */}
      {[0, 3, 6, 9].map((i) => {
        let color = 'var(--md-sys-color-on-surface)';
        if (i === 0) color = 'var(--md-sys-color-error)'; // Red top marker
        else if (i === 3) color = 'var(--md-sys-color-primary)'; // Blue right marker
        else if (i === 6) color = 'var(--md-sys-color-tertiary)'; // Yellow bottom marker
        
        return (
          <div
            key={i}
            className="absolute inset-0 pointer-events-none"
            style={{ transform: `rotate(${i * 30}deg)` }}
          >
            <div 
              className="w-1.5 h-6 sm:h-8 mx-auto"
              style={{ backgroundColor: color }}
            ></div>
          </div>
        );
      })}

      {/* Center Geometric Shape */}
      <div className={cn(
        "absolute top-1/2 left-1/2 w-7 h-7 sm:w-8 sm:h-8 -ml-3.5 -mt-3.5 sm:-ml-4 sm:-mt-4 rounded-full z-20 mix-blend-multiply dark:mix-blend-screen transition-colors",
        "bg-[var(--md-sys-color-error)] opacity-90 dark:opacity-80",
        visualStyle === 'retro' && "bg-[var(--md-sys-color-error)] border border-[var(--md-sys-color-on-surface)] mix-blend-normal dark:mix-blend-normal",
        visualStyle === 'glass' && "bg-[var(--md-sys-color-error)]/80 shadow-[0_0_8px_var(--md-sys-color-error)]",
        visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)]"
      )}></div>

      {/* Hands (Thick Bauhaus style geometric elements) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Hour Hand (Thick black/accent rectangle) */}
        <div
          className={cn(
            "absolute top-[26%] left-1/2 w-[8px] sm:w-[10px] h-[25%] -ml-[4px] sm:-ml-[5px] origin-bottom z-10 transition-colors",
            "bg-[var(--md-sys-color-on-surface)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-on-surface)] rounded-none w-2.5 sm:w-3",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)]",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)]"
          )}
          style={{ transform: `rotate(${hours * 30}deg)` }}
        ></div>
        
        {/* Minute Hand (Slightly thinner, very long primary block) */}
        <div
          className={cn(
            "absolute top-[10%] left-1/2 w-[5px] sm:w-[6px] h-[41%] -ml-[2.5px] sm:-ml-[3px] origin-bottom z-10 transition-colors",
            "bg-[var(--md-sys-color-primary)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-secondary)] border border-[var(--md-sys-color-on-surface)] rounded-none w-1.5 sm:w-2",
            visualStyle === 'glass' && "bg-sky-500",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-secondary)]"
          )}
          style={{ transform: `rotate(${minutes * 6}deg)` }}
        ></div>
        
        {/* Second Hand (Very thin line with dot) */}
        <div
          className={cn(
            "absolute top-[10%] left-1/2 w-0.5 h-[50%] -ml-[1px] origin-[50%_80%] z-20 transition-colors",
            "bg-[var(--md-sys-color-tertiary)] mix-blend-multiply dark:mix-blend-screen",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-error)] mix-blend-normal dark:mix-blend-normal",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-tertiary)]",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-error)]"
          )}
          style={{ transform: `rotate(${seconds * 6}deg)` }}
        >
           <div className={cn(
             "absolute top-full left-1/2 -translate-x-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mt-2 transition-colors",
             "bg-[var(--md-sys-color-tertiary)]",
             visualStyle === 'retro' && "bg-[var(--md-sys-color-error)] border border-[var(--md-sys-color-on-surface)]",
             visualStyle === 'glass' && "bg-[var(--md-sys-color-tertiary)]",
             visualStyle === 'soft' && "bg-[var(--md-sys-color-error)]"
           )}></div>
        </div>
      </div>
    </div>
  );
}
