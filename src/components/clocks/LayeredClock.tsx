import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
export function LayeredClock({ movement }: { movement: 'tick' | 'sweep' }) {
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
      
      
      {/* Outer Ring - Minutes/Seconds Track */}
      <div className={cn(
        "absolute w-[90%] h-[90%] rounded-full border-2 sm:border-[3px] transition-all duration-300",
        "border-divider",
        visualStyle === 'retro' && "border-2 border-[var(--app-foreground)]/60",
        visualStyle === 'glass' && "border-white/25",
        visualStyle === 'soft' && "border-divider"
      )}></div>
      
      {/* Inner Ring - Hours Track */}
      <div className={cn(
        "absolute w-[60%] h-[60%] rounded-full border-2 sm:border-[3px] transition-all duration-300",
        "border-divider bg-content1 shadow-[0_2px_8px_rgba(0,0,0,0.05)]",
        visualStyle === 'retro' && "border-2 border-[var(--app-foreground)] bg-content3 shadow-none",
        visualStyle === 'glass' && "border-white/15 bg-white/5 backdrop-blur-md",
        visualStyle === 'soft' && "border-divider bg-content1 shadow-[var(--soft-shadow-dark)]"
      )}></div>

      {/* Center dot */}
      <div className={cn(
        "absolute top-1/2 left-1/2 w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 -ml-2.25 sm:-ml-2.75 -mt-2.25 sm:-mt-2.75 rounded-full z-30 shadow-[0_0_8px_var(--app-primary)] transition-all",
        "bg-primary",
        visualStyle === 'retro' && "bg-[var(--app-foreground)] border-2 border-white shadow-none",
        visualStyle === 'glass' && "bg-[var(--app-foreground)] shadow-[0_0_6px_var(--app-foreground)]",
        visualStyle === 'soft' && "bg-primary shadow-sm"
      )}></div>

      {/* Hands (Concentric overlapping circles/bars) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Hour Hand */}
        <div
          className={cn(
            "absolute top-[28%] left-1/2 w-4 sm:w-5 h-[25%] rounded-full -ml-2 sm:-ml-2.5 origin-[50%_88%] z-10 shadow-md border border-white/20 transition-all",
            "bg-[var(--app-secondary)]/85 backdrop-blur-sm",
            visualStyle === 'retro' && "bg-primary border-2 border-[var(--app-foreground)] rounded-none mix-blend-normal shadow-none w-4.5 sm:w-5.5 -ml-2.25 sm:-ml-2.75",
            visualStyle === 'glass' && "bg-[var(--app-foreground)]/80 border-white/10",
            visualStyle === 'soft' && "bg-primary border-none"
          )}
          style={{ transform: `rotate(${hours * 30}deg)` }}
        ></div>
        
        {/* Minute Hand */}
        <div
          className={cn(
            "absolute top-[12%] left-1/2 w-3 sm:w-3.5 h-[42%] rounded-full -ml-1.5 sm:-ml-[1.75px] origin-[50%_90%] z-20 shadow-md border border-white/20 transition-all",
            "bg-primary/85 backdrop-blur-sm",
            visualStyle === 'retro' && "bg-[var(--app-secondary)] border-2 border-[var(--app-foreground)] rounded-none mix-blend-normal shadow-none w-3 sm:w-3.75 -ml-1.5 sm:-ml-[1.875px]",
            visualStyle === 'glass' && "bg-[var(--app-foreground)]/90 border-white/10",
            visualStyle === 'soft' && "bg-[var(--app-secondary)] border-none"
          )}
          style={{ transform: `rotate(${minutes * 6}deg)` }}
        ></div>
        
        {/* Second Hand */}
        <div
          className={cn(
            "absolute top-[5%] left-1/2 w-[2px] sm:w-[2.5px] h-[55%] rounded-full -ml-[1px] sm:-ml-[1.25px] origin-[50%_81.8%] z-30 shadow-sm transition-all",
            "bg-[var(--app-danger)]",
            visualStyle === 'retro' && "bg-[var(--app-danger)] w-[2.5px] rounded-none shadow-none",
            visualStyle === 'glass' && "bg-[var(--app-danger)] shadow-[0_0_8px_var(--app-danger)]",
            visualStyle === 'soft' && "bg-[var(--app-danger)]"
          )}
          style={{ transform: `rotate(${seconds * 6}deg)` }}
        ></div>
      </div>
    </div>
  );
}
