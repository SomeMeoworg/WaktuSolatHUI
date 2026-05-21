import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
import "@material/web/elevation/elevation.js";

export function AbstractClock({ movement }: { movement: 'tick' | 'sweep' }) {
  const visualStyle = useVisualStyle();
  const time = useTime(movement);

  const seconds = time.getSeconds() + time.getMilliseconds() / 1000;
  const minutes = time.getMinutes() + seconds / 60;
  const hours = (time.getHours() % 12) + minutes / 60;

  return (
    <div className={cn(
      "relative w-full aspect-square shrink-0 mx-auto flex flex-col items-center justify-center transition-all duration-300 overflow-hidden",
      // Size limits (Symmetric Locking Formula)
      "max-w-[180px] sm:max-w-[220px] md:max-w-[250px] lg:max-w-[280px] xl:max-w-[310px] 2xl:max-w-[340px]",
      "max-h-[180px] sm:max-h-[220px] md:max-h-[250px] lg:max-h-[280px] xl:max-h-[310px] 2xl:max-h-[340px]",
      "max-w-[20vh] sm:max-w-[24vh] lg:max-w-[28vh] xl:max-w-[30vh]",
      "max-h-[20vh] sm:max-h-[24vh] lg:max-h-[28vh] xl:max-h-[30vh]",
      
      // Default Style: Circular Dial
      "rounded-full bg-[var(--md-sys-color-surface-container-highest)] shadow-sm border-[1.5px] border-[var(--md-sys-color-outline-variant)]/20",
      
      visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface-container-high)] shadow-[6px_6px_0px_0px_var(--md-sys-color-on-surface)] rounded-none",
      visualStyle === 'glass' && "border-2 border-[var(--glass-border)] bg-[var(--glass-bg)]/35 backdrop-blur-[var(--glass-blur)] rounded-full shadow-none",
      visualStyle === 'soft' && "border border-white/10 shadow-[var(--soft-shadow-light)] bg-[var(--md-sys-color-surface-container-low)] rounded-full"
    )}>
      {/* @ts-ignore */}
      <md-elevation level="1"></md-elevation>
      
      {/* Abstract Hour Blob - Enlarged for visibility */}
      <div 
        className={cn(
          "absolute w-[70%] h-[70%] rounded-full blur-2xl transition-all duration-1000 ease-linear origin-bottom-right",
          "bg-[var(--md-sys-color-primary)] mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-35",
          visualStyle === 'retro' && "bg-[var(--md-sys-color-primary)] opacity-25 dark:opacity-20 blur-xl rounded-none",
          visualStyle === 'glass' && "bg-[var(--md-sys-color-primary)] opacity-40 dark:opacity-30 blur-3xl",
          visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)] opacity-35 dark:opacity-25 blur-2xl"
        )}
        style={{ transform: `rotate(${hours * 30}deg) translate(20%, -20%)` }}
      ></div>

      {/* Abstract Minute Blob - Enlarged for visibility */}
      <div 
        className={cn(
          "absolute w-[50%] h-[50%] rounded-full blur-xl transition-all duration-500 ease-linear origin-bottom-left",
          "bg-[var(--md-sys-color-tertiary)] mix-blend-multiply dark:mix-blend-screen opacity-55 dark:opacity-40",
          visualStyle === 'retro' && "bg-[var(--md-sys-color-tertiary)] opacity-25 dark:opacity-20 blur-lg rounded-none",
          visualStyle === 'glass' && "bg-[var(--md-sys-color-tertiary)] opacity-45 dark:opacity-35 blur-2xl",
          visualStyle === 'soft' && "bg-[var(--md-sys-color-tertiary)] opacity-40 dark:opacity-30 blur-xl"
        )}
        style={{ transform: `rotate(${minutes * 6}deg) translate(-30%, -30%)` }}
      ></div>

      {/* Secondary accent blob for richness */}
      <div 
        className={cn(
          "absolute w-[35%] h-[35%] rounded-full blur-lg transition-all duration-700 ease-linear origin-center",
          "bg-[var(--md-sys-color-secondary)] mix-blend-multiply dark:mix-blend-screen opacity-30 dark:opacity-20",
          visualStyle === 'retro' && "hidden",
          visualStyle === 'glass' && "bg-[var(--md-sys-color-secondary)] opacity-25 dark:opacity-20",
          visualStyle === 'soft' && "bg-[var(--md-sys-color-secondary)] opacity-20 dark:opacity-15"
        )}
        style={{ transform: `rotate(${seconds * 6}deg) translate(40%, 20%)` }}
      ></div>

      {/* Abstract Second Dot - Orbiting ring */}
      <div className={cn(
        "absolute w-[80%] h-[80%] rounded-full border-[1.5px] border-dashed pointer-events-none z-10",
        "border-[var(--md-sys-color-outline-variant)]/25",
        visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)]/40 border-solid rounded-none",
        visualStyle === 'glass' && "border-white/10",
        visualStyle === 'soft' && "border-[var(--md-sys-color-outline-variant)]/15"
      )}>
        <div 
          className="absolute inset-0 z-20 origin-center"
          style={{ transform: `rotate(${seconds * 6}deg)` }}
        >
          <div className={cn(
            "w-4 h-4 sm:w-5 sm:h-5 rounded-full absolute -top-2 sm:-top-2.5 left-1/2 -translate-x-1/2 transition-all",
            "bg-[var(--md-sys-color-error)] shadow-[0_0_12px_var(--md-sys-color-error)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-error)] border-2 border-[var(--md-sys-color-on-surface)] rounded-none shadow-none w-4 h-4",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-error)] shadow-[0_0_10px_rgba(244,63,94,0.6)]",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-error)] shadow-[0_0_8px_var(--md-sys-color-error)]"
          )}></div>
        </div>
      </div>

      {/* Center Digital Display for functional readability */}
      <div className={cn(
        "relative z-30 px-5 sm:px-6 py-2.5 sm:py-3 rounded-[var(--md-sys-shape-corner-large)] shadow-md border transition-all duration-300",
        "bg-[var(--md-sys-color-surface)]/85 backdrop-blur-md border-[var(--md-sys-color-outline-variant)]/15",
        visualStyle === 'retro' && "bg-[var(--md-sys-color-surface)] border-2 border-[var(--md-sys-color-on-surface)] rounded-none shadow-[3px_3px_0px_var(--md-sys-color-on-surface)]",
        visualStyle === 'glass' && "bg-[var(--glass-bg)]/80 border-[var(--glass-border)] backdrop-blur-xl",
        visualStyle === 'soft' && "bg-[var(--md-sys-color-surface-container-lowest)] border-none shadow-[var(--soft-shadow-dark)]"
      )}>
         <span className={cn(
           "font-sans font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-[var(--md-sys-color-on-surface)] tabular-nums select-none",
           visualStyle === 'retro' && "text-[var(--md-sys-color-on-surface)]",
           visualStyle === 'soft' && "text-[var(--md-sys-color-primary)]"
         )}>
            {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
         </span>
      </div>

    </div>
  );
}
