import { format } from "date-fns";
import { useAppContext } from "../../AppContext";
import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
import "@material/web/elevation/elevation.js";

export function DigitalClock() {
  const { settings } = useAppContext();
  const visualStyle = useVisualStyle();
  const time = useTime("tick");

  const seconds = time.getSeconds();
  const secondsFraction = (seconds + time.getMilliseconds() / 1000) / 60;

  return (
    <div className={cn(
      "relative w-full overflow-hidden flex flex-col items-center justify-center p-4 sm:p-5 lg:p-6 min-h-[100px] sm:min-h-[120px] lg:min-h-[130px] xl:min-h-[145px] max-h-[22vh] transition-all duration-300",
      "bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] rounded-[var(--md-sys-shape-corner-extra-large)] shadow-sm",
      visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[6px_6px_0px_0px_var(--md-sys-color-on-surface)] rounded-none md3-shape-extra-large text-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface-container-high)]",
      visualStyle === 'glass' && "bg-[var(--glass-bg)]/35 backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] text-[var(--md-sys-color-on-surface)] rounded-[var(--md-sys-shape-corner-extra-large)]",
      visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border border-white/20 text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-low)] rounded-[var(--md-sys-shape-corner-extra-large)]"
    )}>
      {/* @ts-ignore */}
      <md-elevation level="1"></md-elevation>

      {/* Subtle seconds progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] sm:h-[3px] z-10">
        <div
          className={cn(
            "h-full transition-all duration-300 ease-linear",
            "bg-[var(--md-sys-color-primary)]/40",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-on-surface)]/50",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-primary)]/30",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)]/25"
          )}
          style={{ width: `${secondsFraction * 100}%` }}
        />
      </div>

      {/* Decorative gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      <div className="flex flex-col items-center relative z-10 text-center w-full">
        {/* Glow behind the time text for glass style */}
        {visualStyle === 'glass' && (
          <div className="absolute w-[80%] h-12 bg-[var(--md-sys-color-primary)]/8 rounded-full blur-xl -z-10" />
        )}

        <span className="font-sans font-black tracking-tighter leading-none text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tabular-nums drop-shadow-sm select-none">
          {format(time, settings.timeFormat === "12h" ? "hh:mm:ss" : "HH:mm:ss")}
        </span>

        {settings.timeFormat === "12h" && (
          <span className={cn(
            "text-xs sm:text-sm lg:text-base font-black uppercase tracking-widest mt-3 px-4.5 py-1 rounded-full select-none transition-all duration-300",
            "bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)]",
            visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] rounded-none bg-transparent text-[var(--md-sys-color-on-surface)] shadow-[2px_2px_0px_var(--md-sys-color-on-surface)]",
            visualStyle === 'glass' && "bg-white/10 text-[var(--md-sys-color-on-surface)]",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)]/8 text-[var(--md-sys-color-primary)]"
          )}>
            {format(time, "a")}
          </span>
        )}
      </div>
    </div>
  );
}
