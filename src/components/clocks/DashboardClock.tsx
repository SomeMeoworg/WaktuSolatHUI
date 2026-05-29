import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
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
      "rounded-full border-[1.5px] border-divider bg-content1 shadow-inner",
      
      visualStyle === 'retro' && "border-2 border-[var(--app-foreground)] bg-content1 shadow-[6px_6px_0px_0px_var(--app-foreground)] rounded-none",
      visualStyle === 'glass' && "border-2 border-[var(--glass-border)] bg-[var(--glass-bg)]/35 backdrop-blur-[var(--glass-blur)] rounded-full shadow-none",
      visualStyle === 'soft' && "border border-divider bg-content1 shadow-[var(--soft-shadow-light)] rounded-full"
    )}>
      
      
      {/* Outer Glow */}
      {visualStyle !== 'glass' && (
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_var(--app-primary)] opacity-10 pointer-events-none"></div>
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
                isMajor ? 'w-[3px] h-3.5 bg-[var(--app-foreground)] opacity-85' : 'w-[1.5px] h-2 bg-[var(--app-outline)]/60 opacity-50',
                visualStyle === 'retro' && (isMajor ? 'bg-[var(--app-foreground)] opacity-95 w-[3px]' : 'bg-[var(--app-foreground)]/40'),
                visualStyle === 'glass' && (isMajor ? 'bg-[var(--app-foreground)] opacity-90' : 'bg-[var(--app-foreground)]/30'),
                visualStyle === 'soft' && (isMajor ? 'bg-primary opacity-80' : 'bg-[var(--app-outline)]/20')
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
                "mt-5 font-sans font-black text-[10px] sm:text-[12px] lg:text-[14px] text-foreground opacity-75 transition-colors tabular-nums",
                visualStyle === 'retro' && "text-foreground opacity-90",
                visualStyle === 'glass' && "text-foreground opacity-80",
                visualStyle === 'soft' && "text-primary opacity-60"
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
        "bg-content3 border-2 border-divider",
        visualStyle === 'retro' && "bg-[var(--app-foreground)] border-2 border-white",
        visualStyle === 'glass' && "bg-[var(--app-foreground)]",
        visualStyle === 'soft' && "bg-primary"
      )}></div>
      <div className="absolute top-1/2 left-1/2 w-2.5 h-2.5 -ml-1.25 -mt-1.25 bg-[var(--app-danger)] rounded-full z-30 pointer-events-none shadow-[0_0_8px_var(--app-danger)]"></div>

      {/* Hands */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Hour Hand (Speedometer Needle style) */}
        <div
          className={cn(
            "absolute top-[28%] left-1/2 w-2.5 sm:w-3 h-[30%] rounded-full -ml-[1.25px] sm:-ml-[1.5px] origin-[50%_73.3%] z-10 shadow-md transition-all",
            "bg-primary",
            visualStyle === 'retro' && "bg-primary border border-[var(--app-foreground)] rounded-none w-3.5 sm:w-4 -ml-1.75 sm:-ml-2",
            visualStyle === 'glass' && "bg-[var(--app-foreground)] border border-white/20",
            visualStyle === 'soft' && "bg-primary"
          )}
          style={{ transform: `rotate(${hours * 30}deg)` }}
        ></div>
        
        {/* Minute Hand (Speedometer Needle style) */}
        <div
          className={cn(
            "absolute top-[12%] left-1/2 w-1.5 sm:w-2 h-[48%] rounded-full -ml-[0.75px] sm:-ml-[1px] origin-[50%_79.1%] z-10 shadow-md transition-all",
            "bg-[var(--app-outline)]",
            visualStyle === 'retro' && "bg-[var(--app-secondary)] border border-[var(--app-foreground)] rounded-none w-2.5 sm:w-3 -ml-1.25 sm:-ml-1.5",
            visualStyle === 'glass' && "bg-[var(--app-foreground)]/80 border border-white/10",
            visualStyle === 'soft' && "bg-[var(--app-secondary)] opacity-80"
          )}
          style={{ transform: `rotate(${minutes * 6}deg)` }}
        ></div>
        
        {/* Second Hand (Red, sweeps) */}
        <div
          className={cn(
            "absolute top-[8%] left-1/2 w-[2px] h-[55%] rounded-full -ml-[1px] origin-[50%_76.3%] z-20 shadow-[0_0_8px_var(--app-danger)] transition-all",
            "bg-[var(--app-danger)]",
            visualStyle === 'retro' && "bg-[var(--app-danger)] w-[2.5px] rounded-none shadow-none",
            visualStyle === 'glass' && "bg-[var(--app-danger)] shadow-[0_0_10px_rgba(244,63,94,0.7)]",
            visualStyle === 'soft' && "bg-[var(--app-danger)] shadow-none"
          )}
          style={{ transform: `rotate(${seconds * 6}deg)` }}
        ></div>
      </div>
    </div>
  );
}
