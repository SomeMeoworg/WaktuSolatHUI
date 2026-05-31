import { format } from "date-fns";
import { useAppContext } from "../../AppContext";
import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
export function DigitalClock() {
  const { settings } = useAppContext();
  const visualStyle = useVisualStyle();
  const time = useTime("tick");

  const seconds = time.getSeconds();
  const secondsFraction = (seconds + time.getMilliseconds() / 1000) / 60;

  return (
    <div className={cn(
      "relative w-full overflow-hidden flex flex-col items-center justify-center p-3.5 sm:p-4.5 lg:p-5 min-h-[90px] sm:min-h-[100px] lg:min-h-[110px] xl:min-h-[120px] transition-all duration-300",
      "bg-transparent text-glass-contrast rounded-[var(--shape-xl)]",
      visualStyle === 'retro' && "border-2 border-[var(--app-foreground)] shadow-[6px_6px_0px_0px_var(--app-foreground)] rounded-none md3-shape-extra-large text-glass-contrast bg-transparent",
      visualStyle === 'glass' && "bg-[var(--glass-bg)]/35 backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] text-glass-contrast rounded-[var(--shape-xl)]",
      visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border border-white/20 text-glass-contrast bg-transparent rounded-[var(--shape-xl)]"
    )}>
      

      {/* Subtle seconds progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] sm:h-[3px] z-10">
        <div
          className={cn(
            "h-full transition-all duration-300 ease-linear",
            "bg-primary/40",
            visualStyle === 'retro' && "bg-[var(--app-foreground)]/50",
            visualStyle === 'glass' && "bg-primary/30",
            visualStyle === 'soft' && "bg-primary/25"
          )}
          style={{ width: `${secondsFraction * 100}%` }}
        />
      </div>

      {/* Decorative gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      <div className="flex flex-col items-center relative z-10 text-center w-full">
        {/* Glow behind the time text for glass style */}
        {visualStyle === 'glass' && (
          <div className="absolute w-[80%] h-12 bg-primary/8 rounded-full blur-xl -z-10" />
        )}

        <span className="font-sans font-black tracking-tighter leading-none text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-6xl tabular-nums drop-shadow-sm select-none">
          {format(time, settings.timeFormat === "12h" ? "hh:mm:ss" : "HH:mm:ss")}
        </span>

        {settings.timeFormat === "12h" && (
          <span className={cn(
            "text-xs sm:text-sm lg:text-base font-black uppercase tracking-widest mt-3 px-4.5 py-1 rounded-full select-none transition-all duration-300",
            "bg-white/10 text-glass-contrast",
            visualStyle === 'retro' && "border-2 border-[var(--app-foreground)] rounded-none bg-transparent text-glass-contrast shadow-[2px_2px_0px_var(--app-foreground)]",
            visualStyle === 'glass' && "bg-white/10 text-glass-contrast",
            visualStyle === 'soft' && "bg-white/10 text-glass-contrast"
          )}>
            {format(time, "a")}
          </span>
        )}
      </div>
    </div>
  );
}
