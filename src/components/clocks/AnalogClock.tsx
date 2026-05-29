import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
export function AnalogClock({ movement }: { movement: 'tick' | 'sweep' }) {
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
      "rounded-full border-[1.5px] border-divider bg-content1 shadow-inner",
      
      visualStyle === 'retro' && "border-[3px] border-[var(--app-foreground)] bg-content1 shadow-[6px_6px_0px_0px_var(--app-foreground)] rounded-none",
      visualStyle === 'glass' && "border-2 border-[var(--glass-border)] bg-[var(--glass-bg)]/35 backdrop-blur-[var(--glass-blur)] rounded-full shadow-none",
      visualStyle === 'soft' && "border border-divider bg-content1 shadow-[var(--soft-shadow-light)] rounded-full"
    )}>
      
      
      {/* Hour Markers */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `rotate(${i * 30}deg)` }}
        >
          <div className={cn(
            "w-2 sm:w-2.5 h-4.5 sm:h-5.5 mx-auto mt-2 rounded-full opacity-80",
            "bg-[var(--app-outline)]",
            visualStyle === 'retro' && "bg-[var(--app-foreground)] opacity-95 w-3 h-6 rounded-none",
            visualStyle === 'glass' && "bg-[var(--app-foreground)] opacity-90",
            visualStyle === 'soft' && "bg-primary opacity-70"
          )}></div>
        </div>
      ))}
      
      {/* Minute Markers */}
      {[...Array(60)].map((_, i) => {
        if (i % 5 === 0) return null;
        return (
          <div
            key={`m${i}`}
            className="absolute inset-0 pointer-events-none"
            style={{ transform: `rotate(${i * 6}deg)` }}
          >
            <div className={cn(
              "w-[1px] sm:w-[1.5px] h-2 sm:h-2.5 mx-auto mt-2 rounded-full opacity-55",
              "bg-[var(--app-outline)]",
              visualStyle === 'retro' && "bg-[var(--app-foreground)] opacity-80 w-[1.5px] h-2.5 rounded-none",
              visualStyle === 'glass' && "bg-[var(--app-foreground)] opacity-65",
              visualStyle === 'soft' && "bg-[var(--app-outline)] opacity-40"
            )}></div>
          </div>
        );
      })}

      {/* Center dot */}
      <div className={cn(
        "absolute top-1/2 left-1/2 w-4.5 h-4.5 sm:w-5 sm:h-5 -ml-2.25 sm:-ml-2.5 -mt-2.25 sm:-mt-2.5 rounded-full z-30 shadow-[0_2px_4px_rgba(0,0,0,0.3)]",
        "bg-[var(--app-foreground)]",
        visualStyle === 'retro' && "bg-[var(--app-foreground)] border-2 border-white shadow-none",
        visualStyle === 'glass' && "bg-[var(--app-foreground)]",
        visualStyle === 'soft' && "bg-primary shadow-[var(--soft-shadow-light)]"
      )}></div>
      <div className="absolute top-1/2 left-1/2 w-2.5 h-2.5 -ml-1.25 -mt-1.25 bg-[var(--app-danger)] rounded-full z-40 pointer-events-none"></div>

      {/* Hands */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Hour Hand */}
        <div
          className={cn(
            "absolute top-[28%] left-1/2 w-3.5 sm:w-4.5 h-[30%] rounded-full -ml-[1.75px] sm:-ml-[2.25px] origin-[50%_73.3%] z-10 shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]",
            "bg-primary",
            visualStyle === 'retro' && "bg-primary border-2 border-[var(--app-foreground)] rounded-none w-4 sm:w-5 -ml-2 sm:-ml-2.5",
            visualStyle === 'glass' && "bg-[var(--app-foreground)] border border-white/20",
            visualStyle === 'soft' && "bg-primary shadow-sm"
          )}
          style={{ transform: `rotate(${hours * 30}deg)` }}
        ></div>
        
        {/* Minute Hand */}
        <div
          className={cn(
            "absolute top-[12%] left-1/2 w-2.5 sm:w-3.25 h-[48%] rounded-full -ml-[1.25px] sm:-ml-[1.625px] origin-[50%_79.1%] z-10 shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]",
            "bg-[var(--app-foreground)] opacity-95",
            visualStyle === 'retro' && "bg-[var(--app-secondary)] border-2 border-[var(--app-foreground)] rounded-none w-3 sm:w-3.75 -ml-1.5 sm:-ml-[1.875px]",
            visualStyle === 'glass' && "bg-[var(--app-foreground)]/85 border border-white/10",
            visualStyle === 'soft' && "bg-[var(--app-secondary)] opacity-80"
          )}
          style={{ transform: `rotate(${minutes * 6}deg)` }}
        ></div>
        
        {/* Second Hand */}
        <div
          className={cn(
            "absolute top-[8%] left-1/2 w-[2px] h-[55%] rounded-full -ml-[1px] origin-[50%_76.3%] z-20 shadow-[0_4px_12px_rgba(255,0,0,0.2)]",
            "bg-[var(--app-danger)]",
            visualStyle === 'retro' && "bg-[var(--app-danger)] w-[2.5px] rounded-none",
            visualStyle === 'glass' && "bg-[var(--app-danger)] shadow-[0_0_8px_var(--app-danger)]",
            visualStyle === 'soft' && "bg-[var(--app-danger)]"
          )}
          style={{ transform: `rotate(${seconds * 6}deg)` }}
        ></div>
      </div>
    </div>
  );
}
