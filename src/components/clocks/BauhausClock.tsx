import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
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
      "rounded-full bg-content1",
      
      visualStyle === 'retro' && "border-2 border-[var(--app-foreground)] bg-content1 shadow-[6px_6px_0px_0px_var(--app-foreground)] rounded-none",
      visualStyle === 'glass' && "border-2 border-[var(--glass-border)] bg-[var(--glass-bg)]/45 backdrop-blur-[var(--glass-blur)] rounded-full shadow-none",
      visualStyle === 'soft' && "border border-divider bg-content1 shadow-[var(--soft-shadow-light)] rounded-full"
    )}>
      
      
      {/* Only primary axis markers (12, 3, 6, 9) */}
      {[0, 3, 6, 9].map((i) => {
        let color = 'var(--app-foreground)';
        if (i === 0) color = 'var(--app-danger)'; // Red top marker
        else if (i === 3) color = 'var(--app-primary)'; // Blue right marker
        else if (i === 6) color = 'var(--app-secondary)'; // Yellow bottom marker
        
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
        "bg-[var(--app-danger)] opacity-90 dark:opacity-80",
        visualStyle === 'retro' && "bg-[var(--app-danger)] border border-[var(--app-foreground)] mix-blend-normal dark:mix-blend-normal",
        visualStyle === 'glass' && "bg-[var(--app-danger)]/80 shadow-[0_0_8px_var(--app-danger)]",
        visualStyle === 'soft' && "bg-primary"
      )}></div>

      {/* Hands (Thick Bauhaus style geometric elements) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Hour Hand (Thick black/accent rectangle) */}
        <div
          className={cn(
            "absolute top-[26%] left-1/2 w-[8px] sm:w-[10px] h-[25%] -ml-[4px] sm:-ml-[5px] origin-bottom z-10 transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]",
            "bg-[var(--app-foreground)]",
            visualStyle === 'retro' && "bg-primary border border-[var(--app-foreground)] rounded-none w-2.5 sm:w-3",
            visualStyle === 'glass' && "bg-[var(--app-foreground)]",
            visualStyle === 'soft' && "bg-primary"
          )}
          style={{ transform: `rotate(${hours * 30}deg)` }}
        ></div>
        
        {/* Minute Hand (Slightly thinner, very long primary block) */}
        <div
          className={cn(
            "absolute top-[10%] left-1/2 w-[5px] sm:w-[6px] h-[41%] -ml-[2.5px] sm:-ml-[3px] origin-bottom z-10 transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]",
            "bg-primary",
            visualStyle === 'retro' && "bg-[var(--app-secondary)] border border-[var(--app-foreground)] rounded-none w-1.5 sm:w-2",
            visualStyle === 'glass' && "bg-sky-500",
            visualStyle === 'soft' && "bg-[var(--app-secondary)]"
          )}
          style={{ transform: `rotate(${minutes * 6}deg)` }}
        ></div>
        
        {/* Second Hand (Very thin line with dot) */}
        <div
          className={cn(
            "absolute top-[10%] left-1/2 w-0.5 h-[50%] -ml-[1px] origin-[50%_80%] z-20 transition-colors shadow-[0_2px_8px_rgba(var(--md-sys-color-tertiary-rgb,0,0,0),0.3)]",
            "bg-[var(--app-secondary)] mix-blend-multiply dark:mix-blend-screen",
            visualStyle === 'retro' && "bg-[var(--app-danger)] mix-blend-normal dark:mix-blend-normal",
            visualStyle === 'glass' && "bg-[var(--app-secondary)]",
            visualStyle === 'soft' && "bg-[var(--app-danger)]"
          )}
          style={{ transform: `rotate(${seconds * 6}deg)` }}
        >
           <div className={cn(
             "absolute top-full left-1/2 -translate-x-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mt-2 transition-colors",
             "bg-[var(--app-secondary)]",
             visualStyle === 'retro' && "bg-[var(--app-danger)] border border-[var(--app-foreground)]",
             visualStyle === 'glass' && "bg-[var(--app-secondary)]",
             visualStyle === 'soft' && "bg-[var(--app-danger)]"
           )}></div>
        </div>
      </div>
    </div>
  );
}
