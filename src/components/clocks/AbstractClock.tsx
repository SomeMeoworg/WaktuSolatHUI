import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
export function AbstractClock({ movement }: { movement: 'tick' | 'sweep' }) {
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
      "rounded-full bg-content4 shadow-sm border-[1.5px] border-divider",
      
      visualStyle === 'retro' && "border-2 border-[var(--app-foreground)] bg-content3 shadow-[6px_6px_0px_0px_var(--app-foreground)] rounded-none",
      visualStyle === 'glass' && "border-2 border-[var(--glass-border)] bg-[var(--glass-bg)]/35 backdrop-blur-[var(--glass-blur)] rounded-full shadow-none",
      visualStyle === 'soft' && "border border-white/10 shadow-[var(--soft-shadow-light)] bg-content1 rounded-full"
    )}>
      
      
      {/* Abstract Hour Blob - Enlarged for visibility */}
      <div 
        className={cn(
          "absolute w-[70%] h-[70%] rounded-full blur-2xl transition-all duration-1000 ease-linear origin-bottom-right",
          "bg-primary mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-35",
          visualStyle === 'retro' && "bg-primary opacity-25 dark:opacity-20 blur-xl rounded-none",
          visualStyle === 'glass' && "bg-primary opacity-40 dark:opacity-30 blur-3xl",
          visualStyle === 'soft' && "bg-primary opacity-35 dark:opacity-25 blur-2xl"
        )}
        style={{ transform: `rotate(${hours * 30}deg) translate(20%, -20%)` }}
      ></div>

      {/* Abstract Minute Blob - Enlarged for visibility */}
      <div 
        className={cn(
          "absolute w-[50%] h-[50%] rounded-full blur-xl transition-all duration-500 ease-linear origin-bottom-left",
          "bg-[var(--app-secondary)] mix-blend-multiply dark:mix-blend-screen opacity-55 dark:opacity-40",
          visualStyle === 'retro' && "bg-[var(--app-secondary)] opacity-25 dark:opacity-20 blur-lg rounded-none",
          visualStyle === 'glass' && "bg-[var(--app-secondary)] opacity-45 dark:opacity-35 blur-2xl",
          visualStyle === 'soft' && "bg-[var(--app-secondary)] opacity-40 dark:opacity-30 blur-xl"
        )}
        style={{ transform: `rotate(${minutes * 6}deg) translate(-30%, -30%)` }}
      ></div>

      {/* Secondary accent blob for richness */}
      <div 
        className={cn(
          "absolute w-[35%] h-[35%] rounded-full blur-lg transition-all duration-700 ease-linear origin-center",
          "bg-[var(--app-secondary)] mix-blend-multiply dark:mix-blend-screen opacity-30 dark:opacity-20",
          visualStyle === 'retro' && "hidden",
          visualStyle === 'glass' && "bg-[var(--app-secondary)] opacity-25 dark:opacity-20",
          visualStyle === 'soft' && "bg-[var(--app-secondary)] opacity-20 dark:opacity-15"
        )}
        style={{ transform: `rotate(${seconds * 6}deg) translate(40%, 20%)` }}
      ></div>

      {/* Abstract Second Dot - Orbiting ring */}
      <div className={cn(
        "absolute w-[80%] h-[80%] rounded-full border-[1.5px] border-dashed pointer-events-none z-10",
        "border-divider",
        visualStyle === 'retro' && "border-2 border-[var(--app-foreground)]/40 border-solid rounded-none",
        visualStyle === 'glass' && "border-white/10",
        visualStyle === 'soft' && "border-divider"
      )}>
        <div 
          className="absolute inset-0 z-20 origin-center"
          style={{ transform: `rotate(${seconds * 6}deg)` }}
        >
          <div className={cn(
            "w-4 h-4 sm:w-5 sm:h-5 rounded-full absolute -top-2 sm:-top-2.5 left-1/2 -translate-x-1/2 transition-all",
            "bg-[var(--app-danger)] shadow-[0_0_12px_var(--app-danger)]",
            visualStyle === 'retro' && "bg-[var(--app-danger)] border-2 border-[var(--app-foreground)] rounded-none shadow-none w-4 h-4",
            visualStyle === 'glass' && "bg-[var(--app-danger)] shadow-[0_0_10px_rgba(244,63,94,0.6)]",
            visualStyle === 'soft' && "bg-[var(--app-danger)] shadow-[0_0_8px_var(--app-danger)]"
          )}></div>
        </div>
      </div>

      {/* Center Digital Display for functional readability */}
      <div className={cn(
        "relative z-30 px-5 sm:px-6 py-2.5 sm:py-3 rounded-[var(--shape-lg)] shadow-md border transition-all duration-300",
        "bg-content1/85 backdrop-blur-md border-divider",
        visualStyle === 'retro' && "bg-content1 border-2 border-[var(--app-foreground)] rounded-none shadow-[3px_3px_0px_var(--app-foreground)]",
        visualStyle === 'glass' && "bg-[var(--glass-bg)]/80 border-[var(--glass-border)] backdrop-blur-xl",
        visualStyle === 'soft' && "bg-content1 border-none shadow-[var(--soft-shadow-dark)]"
      )}>
         <span className={cn(
           "font-sans font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground tabular-nums select-none",
           visualStyle === 'retro' && "text-foreground",
           visualStyle === 'soft' && "text-primary"
         )}>
            {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
         </span>
      </div>

    </div>
  );
}
