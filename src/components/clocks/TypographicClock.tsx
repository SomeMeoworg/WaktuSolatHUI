import { format } from "date-fns";
import { useAppContext } from "../../AppContext";
import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
export function TypographicClock() {
  const { settings } = useAppContext();
  const visualStyle = useVisualStyle();
  const time = useTime("tick");

  const seconds = time.getSeconds();

  return (
    <div className={cn(
      "relative w-full overflow-hidden p-4 sm:p-5 lg:p-6 min-h-[120px] sm:min-h-[145px] lg:min-h-[165px] xl:min-h-[180px] max-h-[26vh] flex flex-col justify-between transition-all duration-300",
      "bg-primary rounded-[var(--shape-xl)] shadow-md",
      visualStyle === 'retro' && "border-2 border-[var(--app-foreground)] shadow-[6px_6px_0px_0px_var(--app-foreground)] rounded-none md3-shape-extra-large bg-content3 text-foreground",
      visualStyle === 'glass' && "bg-[var(--glass-bg)]/35 backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] text-foreground rounded-[var(--shape-xl)]",
      visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border border-white/20 bg-content1 rounded-[var(--shape-xl)]"
    )}>
      
      
      {/* Subtle gradient overlay */}
      {visualStyle === 'default' && (
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white via-transparent to-black"></div>
        </div>
      )}
      
      {/* Wide stacked digits layout */}
      <div className="flex items-baseline gap-3 sm:gap-4 lg:gap-6 relative z-10 w-full">
        <span className={cn(
          "text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black leading-[0.85] tracking-tighter drop-shadow-md select-none font-sans tabular-nums",
          "text-primary-foreground",
          visualStyle === 'retro' && "text-foreground drop-shadow-none",
          visualStyle === 'glass' && "text-foreground drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]",
          visualStyle === 'soft' && "text-primary"
        )}>
          {format(time, settings.timeFormat === "12h" ? "hh" : "HH")}
        </span>
        <span className={cn(
          "text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black leading-[0.85] tracking-tighter opacity-40 drop-shadow-sm select-none font-sans tabular-nums",
          "text-primary-foreground",
          visualStyle === 'retro' && "text-foreground/70 drop-shadow-none",
          visualStyle === 'glass' && "text-foreground/50",
          visualStyle === 'soft' && "text-[var(--app-secondary)]/60"
        )}>
          {format(time, "mm")}
        </span>
      </div>

      {/* Seconds spinner & AM/PM bottom bar */}
      <div className="flex items-center justify-between w-full mt-3 sm:mt-4 relative z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
            {/* Spinning Outer Ring */}
            <div
              className={cn(
                "absolute inset-0 rounded-full border-[3px] animate-spin",
                "border-[var(--app-primary-foreground)]/20 border-t-[var(--app-primary-foreground)]",
                visualStyle === 'retro' && "border-[var(--app-foreground)]/20 border-t-[var(--app-foreground)] rounded-none border-2",
                visualStyle === 'glass' && "border-[var(--app-foreground)]/15 border-t-[var(--app-foreground)]",
                visualStyle === 'soft' && "border-primary/15 border-t-[var(--app-primary)]"
              )}
              style={{ animationDuration: '60s' }}
            />
            {/* Seconds Text */}
            <span className={cn(
              "relative text-[10px] sm:text-xs font-black select-none font-sans tabular-nums",
              "text-primary-foreground",
              visualStyle === 'retro' && "text-foreground",
              visualStyle === 'glass' && "text-foreground",
              visualStyle === 'soft' && "text-primary"
            )}>
              {format(time, "ss")}
            </span>
          </div>
          {settings.timeFormat === "12h" && (
             <span className={cn(
               "text-sm sm:text-base font-black uppercase tracking-widest select-none font-sans",
               "text-primary-foreground",
               visualStyle === 'retro' && "text-foreground",
               visualStyle === 'glass' && "text-foreground",
               visualStyle === 'soft' && "text-primary opacity-95"
             )}>{format(time, "a")}</span>
          )}
        </div>
      </div>
    </div>
  );
}
