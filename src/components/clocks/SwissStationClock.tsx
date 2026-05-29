import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
export function SwissStationClock({ movement }: { movement: 'tick' | 'sweep' }) {
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
      "rounded-full bg-content1 shadow-inner",
      
      visualStyle === 'retro' && "border-2 border-[var(--app-foreground)] bg-content1 shadow-[6px_6px_0px_0px_var(--app-foreground)] rounded-none",
      visualStyle === 'glass' && "border-2 border-[var(--glass-border)] bg-[var(--glass-bg)]/35 backdrop-blur-[var(--glass-blur)] rounded-full shadow-none",
      visualStyle === 'soft' && "border border-divider bg-content1 shadow-[var(--soft-shadow-light)] rounded-full"
    )}>
      
      
      {/* Swiss Hour Ticks - Thick and long */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `rotate(${i * 30}deg)` }}
        >
          <div className={cn(
            "w-[5px] h-[16px] sm:w-[6.5px] sm:h-[20px] mx-auto mt-1 sm:mt-1.5 transition-colors",
            "bg-[var(--app-foreground)]",
            visualStyle === 'retro' && "bg-[var(--app-foreground)] rounded-none w-[6px] h-[18px]",
            visualStyle === 'glass' && "bg-[var(--app-foreground)]/90",
            visualStyle === 'soft' && "bg-primary"
          )}></div>
        </div>
      ))}
      
      {/* Swiss Minute Ticks - Sharp & highly legible */}
      {[...Array(60)].map((_, i) => {
        if (i % 5 === 0) return null;
        return (
          <div
            key={`m${i}`}
            className="absolute inset-0 pointer-events-none"
            style={{ transform: `rotate(${i * 6}deg)` }}
          >
            <div className={cn(
              "w-[2px] h-[5.5px] sm:w-[3px] sm:h-[6.5px] mx-auto mt-1 sm:mt-1.5 transition-colors",
              "bg-[var(--app-outline)]/80",
              visualStyle === 'retro' && "bg-[var(--app-foreground)]/75 rounded-none w-[2px] h-[6px]",
              visualStyle === 'glass' && "bg-[var(--app-foreground)]/60",
              visualStyle === 'soft' && "bg-[var(--app-outline)]/40"
            )}></div>
          </div>
        );
      })}

      {/* Center dot/axis */}
      <div className={cn(
        "absolute top-1/2 left-1/2 w-4.5 h-4.5 sm:w-5 sm:h-5 -ml-2.25 sm:-ml-2.5 -mt-2.25 sm:-mt-2.5 rounded-full z-20 shadow-md transition-colors",
        "bg-[var(--app-foreground)]",
        visualStyle === 'retro' && "bg-[var(--app-foreground)] border-2 border-white shadow-none",
        visualStyle === 'glass' && "bg-[var(--app-foreground)]",
        visualStyle === 'soft' && "bg-primary"
      )}></div>

      {/* Hands */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Hour Hand - Thick rectangular blade */}
        <div
          className={cn(
            "absolute top-[28%] left-1/2 w-[7px] sm:w-[9px] h-[30%] -ml-[3.5px] sm:-ml-[4.5px] origin-[50%_73.3%] z-10 transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]",
            "bg-[var(--app-foreground)]",
            visualStyle === 'retro' && "bg-primary border border-white rounded-none",
            visualStyle === 'glass' && "bg-[var(--app-foreground)]/95",
            visualStyle === 'soft' && "bg-primary"
          )}
          style={{ transform: `rotate(${hours * 30}deg)` }}
        ></div>
        
        {/* Minute Hand - Longer rectangular blade */}
        <div
          className={cn(
            "absolute top-[12%] left-1/2 w-[5.5px] sm:w-[7px] h-[48%] -ml-[2.75px] sm:-ml-[3.5px] origin-[50%_79.1%] z-10 transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]",
            "bg-[var(--app-foreground)]",
            visualStyle === 'retro' && "bg-[var(--app-secondary)] border border-white rounded-none",
            visualStyle === 'glass' && "bg-[var(--app-foreground)]/85",
            visualStyle === 'soft' && "bg-[var(--app-secondary)]"
          )}
          style={{ transform: `rotate(${minutes * 6}deg)` }}
        ></div>
        
        {/* Iconic Swiss Red sweep second hand with red disc tip */}
        <div
          className={cn(
            "absolute top-[10%] left-1/2 w-[2px] h-[55%] -ml-[1px] origin-[50%_72.7%] z-20 transition-colors shadow-[0_4px_12px_rgba(255,0,0,0.2)]",
            "bg-[var(--app-danger)]",
            visualStyle === 'retro' && "bg-[var(--app-danger)] w-[2.5px] rounded-none",
            visualStyle === 'glass' && "bg-[var(--app-danger)] shadow-[0_0_8px_rgba(244,63,94,0.6)]",
            visualStyle === 'soft' && "bg-[var(--app-danger)]"
          )}
          style={{ transform: `rotate(${seconds * 6}deg)` }}
        >
           {/* Red disk at the tip */}
           <div className={cn(
             "absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-sm",
             "bg-[var(--app-danger)]",
             visualStyle === 'retro' && "bg-[var(--app-danger)] border border-white rounded-none w-4 h-4",
             visualStyle === 'glass' && "bg-[var(--app-danger)] shadow-[0_0_6px_rgba(244,63,94,0.6)]",
             visualStyle === 'soft' && "bg-[var(--app-danger)]"
           )}></div>
        </div>
      </div>
    </div>
  );
}
