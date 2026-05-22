import { format } from "date-fns";
import { useAppContext } from "../../AppContext";
import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
import "@material/web/elevation/elevation.js";

export function AnaDigiClock({ movement }: { movement: 'tick' | 'sweep' }) {
  const { settings } = useAppContext();
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
      "rounded-full border-2 border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface)] shadow-inner",
      
      visualStyle === 'retro' && "border-[3px] border-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface)] shadow-[6px_6px_0px_0px_var(--md-sys-color-on-surface)] rounded-none",
      visualStyle === 'glass' && "border-2 border-[var(--glass-border)] bg-[var(--glass-bg)]/35 backdrop-blur-[var(--glass-blur)] rounded-full shadow-none",
      visualStyle === 'soft' && "border border-[var(--md-sys-color-outline-variant)]/10 bg-[var(--md-sys-color-surface-container-lowest)] shadow-[var(--soft-shadow-light)] rounded-full"
    )}>
      {/* @ts-ignore */}
      <md-elevation level="2"></md-elevation>
      
      {/* Hour Markers */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `rotate(${i * 30}deg)` }}
        >
          <div className={cn(
            "w-1.5 h-3.5 mx-auto mt-2 rounded-full opacity-60 transition-colors",
            "bg-[var(--md-sys-color-on-surface-variant)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-on-surface)] opacity-95 rounded-none w-2 h-4",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)] opacity-75",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)] opacity-40"
          )}></div>
        </div>
      ))}

      {/* Center dot */}
      <div className={cn(
        "absolute top-1/2 left-1/2 w-4.5 h-4.5 sm:w-5 sm:h-5 -ml-2.25 sm:-ml-2.5 -mt-2.25 sm:-mt-2.5 rounded-full z-20 shadow-md",
        "bg-[var(--md-sys-color-on-surface)]",
        visualStyle === 'retro' && "bg-[var(--md-sys-color-on-surface)] border-2 border-white shadow-none",
        visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)]",
        visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)]"
      )}></div>
      <div className="absolute top-1/2 left-1/2 w-2.5 h-2.5 -ml-1.25 -mt-1.25 bg-[var(--md-sys-color-primary)] rounded-full z-30 pointer-events-none"></div>

      {/* Digital Cutout (6 o'clock position) */}
      <div className={cn(
        "absolute bottom-[15%] left-1/2 -translate-x-1/2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-[var(--md-sys-shape-corner-medium)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] z-0 border transition-all duration-300",
        "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)]/20",
        visualStyle === 'retro' && "bg-[var(--md-sys-color-surface)] border-2 border-[var(--md-sys-color-on-surface)] rounded-none shadow-[2px_2px_0px_var(--md-sys-color-on-surface)]",
        visualStyle === 'glass' && "bg-[var(--glass-bg)]/80 border-[var(--glass-border)]",
        visualStyle === 'soft' && "bg-[var(--md-sys-color-surface-container-low)] border-none shadow-[var(--soft-shadow-dark)]"
      )}>
        <span className={cn(
          "font-sans font-black text-sm sm:text-base lg:text-lg tracking-tight opacity-95 select-none tabular-nums",
          visualStyle === 'soft' && "text-[var(--md-sys-color-primary)] font-black"
        )}>
          {format(time, settings.timeFormat === "12h" ? "hh:mm a" : "HH:mm")}
        </span>
      </div>

      {/* Hands */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Hour Hand */}
        <div
          className={cn(
            "absolute top-[25%] left-1/2 w-3 sm:w-3.5 h-[35%] rounded-full -ml-[1.5px] sm:-ml-[1.75px] origin-[50%_71.4%] z-10 shadow-md",
            "bg-[var(--md-sys-color-primary)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-primary)] border-2 border-[var(--md-sys-color-on-surface)] rounded-none w-3.5 sm:w-4 -ml-1.75 sm:-ml-2",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)] border border-white/20",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)] shadow-sm"
          )}
          style={{ transform: `rotate(${hours * 30}deg)` }}
        ></div>
        
        {/* Minute Hand */}
        <div
          className={cn(
            "absolute top-[12%] left-1/2 w-2 sm:w-2.5 h-[48%] rounded-full -ml-[1px] sm:-ml-[1.25px] origin-[50%_79.1%] z-10 shadow-md opacity-90",
            "bg-[var(--md-sys-color-on-surface)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-secondary)] border-2 border-[var(--md-sys-color-on-surface)] rounded-none w-2.5 sm:w-3 -ml-1.25 sm:-ml-1.5",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)]/85 border border-white/10",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-secondary)] opacity-80"
          )}
          style={{ transform: `rotate(${minutes * 6}deg)` }}
        ></div>
        
        {/* Second Hand */}
        <div
          className={cn(
            "absolute top-[8%] left-1/2 w-[2px] h-[55%] rounded-full -ml-[1px] origin-[50%_76.3%] z-20 shadow-sm",
            "bg-[var(--md-sys-color-error)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-error)] w-[2.5px] rounded-none shadow-none",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-error)] shadow-[0_0_8px_var(--md-sys-color-error)]",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-error)]"
          )}
          style={{ transform: `rotate(${seconds * 6}deg)` }}
        ></div>
      </div>
    </div>
  );
}
