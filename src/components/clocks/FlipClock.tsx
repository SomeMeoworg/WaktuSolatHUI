import { format } from "date-fns";
import { useAppContext } from "../../AppContext";
import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import "@material/web/elevation/elevation.js";

function FlipDigit({ digit, visualStyle }: { digit: string; visualStyle: string }) {
  return (
    <div className={cn(
      "relative w-[28px] h-[42px] sm:w-[38px] sm:h-[58px] md:w-[48px] md:h-[72px] lg:w-[60px] lg:h-[90px] xl:w-[74px] xl:h-[110px] 2xl:w-[88px] 2xl:h-[132px] flex items-center justify-center overflow-hidden shadow-inner transition-all duration-300",
      "bg-[var(--md-sys-color-surface-container-high)] rounded-[var(--md-sys-shape-corner-medium)] border border-[var(--md-sys-color-outline-variant)]/20",
      visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[4px_4px_0px_0px_var(--md-sys-color-on-surface)] rounded-none text-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface-container-high)]",
      visualStyle === 'glass' && "bg-[var(--glass-bg)]/80 backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)]",
      visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border border-white/20 bg-[var(--md-sys-color-surface-container-lowest)]"
    )}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className={cn(
            "absolute text-lg sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black font-sans select-none transition-colors tabular-nums",
            "text-[var(--md-sys-color-primary)]",
            visualStyle === 'retro' && "text-[var(--md-sys-color-on-surface)]",
            visualStyle === 'glass' && "text-[var(--md-sys-color-on-surface)] drop-shadow-sm",
            visualStyle === 'soft' && "text-[var(--md-sys-color-primary)]"
          )}
          style={{ transformOrigin: "bottom" }}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
      <div className={cn(
        "absolute top-1/2 left-0 w-full h-[1px] sm:h-[1.5px] opacity-40 z-10",
        "bg-[var(--md-sys-color-surface-container-lowest)]",
        visualStyle === 'retro' && "bg-[var(--md-sys-color-on-surface)] opacity-70",
        visualStyle === 'glass' && "bg-white/20",
        visualStyle === 'soft' && "bg-[var(--md-sys-color-outline-variant)]/40"
      )}></div>
    </div>
  );
}

export function FlipClock() {
  const { settings } = useAppContext();
  const visualStyle = useVisualStyle();
  const time = useTime("tick");

  const timeString = format(time, settings.timeFormat === "12h" ? "hhmmss" : "HHmmss");

  return (
    <div className={cn(
      "relative w-full overflow-hidden flex flex-col items-center justify-center p-3 sm:p-4.5 lg:p-5.5 min-h-[85px] sm:min-h-[105px] lg:min-h-[125px] xl:min-h-[140px] max-h-[20vh] transition-all duration-300",
      "bg-[var(--md-sys-color-surface-container-highest)] rounded-[var(--md-sys-shape-corner-extra-large)] shadow-sm",
      visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[6px_6px_0px_0px_var(--md-sys-color-on-surface)] rounded-none md3-shape-extra-large bg-[var(--md-sys-color-surface-container-high)]",
      visualStyle === 'glass' && "bg-[var(--glass-bg)]/35 backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] rounded-[var(--md-sys-shape-corner-extra-large)] shadow-none",
      visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border border-white/25 rounded-[var(--md-sys-shape-corner-extra-large)] bg-[var(--md-sys-color-surface-container-low)]"
    )}>
      {/* @ts-ignore */}
      <md-elevation level="1"></md-elevation>

      <div className="flex items-center justify-center gap-0.5 sm:gap-1 lg:gap-1.5 w-full">
        <FlipDigit digit={timeString[0]} visualStyle={visualStyle} />
        <FlipDigit digit={timeString[1]} visualStyle={visualStyle} />
        
        <span className={cn(
          "text-sm sm:text-lg md:text-xl lg:text-2xl font-black mx-0.5 animate-pulse transition-colors select-none",
          "text-[var(--md-sys-color-on-surface-variant)]/50",
          visualStyle === 'retro' && "text-[var(--md-sys-color-on-surface)] opacity-90",
          visualStyle === 'glass' && "text-[var(--md-sys-color-on-surface)]",
          visualStyle === 'soft' && "text-[var(--md-sys-color-primary)] opacity-70"
        )}>:</span>
        
        <FlipDigit digit={timeString[2]} visualStyle={visualStyle} />
        <FlipDigit digit={timeString[3]} visualStyle={visualStyle} />
        
        <span className={cn(
          "text-sm sm:text-lg md:text-xl lg:text-2xl font-black mx-0.5 animate-pulse transition-colors select-none",
          "text-[var(--md-sys-color-on-surface-variant)]/50",
          visualStyle === 'retro' && "text-[var(--md-sys-color-on-surface)] opacity-90",
          visualStyle === 'glass' && "text-[var(--md-sys-color-on-surface)]",
          visualStyle === 'soft' && "text-[var(--md-sys-color-primary)] opacity-70"
        )}>:</span>
        
        <FlipDigit digit={timeString[4]} visualStyle={visualStyle} />
        <FlipDigit digit={timeString[5]} visualStyle={visualStyle} />
        
        {settings.timeFormat === "12h" && (
          <div className="flex flex-col ml-0.5 sm:ml-1 justify-center gap-0.5 font-black select-none">
            <span className={cn(
              "text-[7px] sm:text-[9px] px-1 py-0.25 sm:px-1.5 rounded-[var(--md-sys-shape-corner-small)] transition-all",
              format(time, "a") === "AM" 
                ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm" 
                : "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]/60 border border-[var(--md-sys-color-outline-variant)]/10",
              visualStyle === 'retro' && (
                format(time, "a") === "AM"
                  ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border border-[var(--md-sys-color-on-surface)] shadow-[2px_2px_0px_var(--md-sys-color-on-surface)] rounded-none"
                  : "bg-transparent text-[var(--md-sys-color-on-surface)] border border-transparent rounded-none"
              ),
              visualStyle === 'glass' && (
                format(time, "a") === "AM"
                  ? "bg-white/20 border border-[var(--glass-border)] text-[var(--md-sys-color-on-surface)]"
                  : "bg-transparent text-[var(--md-sys-color-on-surface)]/40 border border-transparent"
              ),
              visualStyle === 'soft' && (
                format(time, "a") === "AM"
                  ? "bg-[var(--md-sys-color-primary)]/15 text-[var(--md-sys-color-primary)] font-black"
                  : "bg-transparent text-[var(--md-sys-color-outline)]/40"
              )
            )}>AM</span>
            <span className={cn(
              "text-[7px] sm:text-[9px] px-1 py-0.25 sm:px-1.5 rounded-[var(--md-sys-shape-corner-small)] transition-all",
              format(time, "a") === "PM" 
                ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm" 
                : "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]/60 border border-[var(--md-sys-color-outline-variant)]/10",
              visualStyle === 'retro' && (
                format(time, "a") === "PM"
                  ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border border-[var(--md-sys-color-on-surface)] shadow-[2px_2px_0px_var(--md-sys-color-on-surface)] rounded-none"
                  : "bg-transparent text-[var(--md-sys-color-on-surface)] border border-transparent rounded-none"
              ),
              visualStyle === 'glass' && (
                format(time, "a") === "PM"
                  ? "bg-white/20 border border-[var(--glass-border)] text-[var(--md-sys-color-on-surface)]"
                  : "bg-transparent text-[var(--md-sys-color-on-surface)]/40 border border-transparent"
              ),
              visualStyle === 'soft' && (
                format(time, "a") === "PM"
                  ? "bg-[var(--md-sys-color-primary)]/15 text-[var(--md-sys-color-primary)] font-black"
                  : "bg-transparent text-[var(--md-sys-color-outline)]/40"
              )
            )}>PM</span>
          </div>
        )}
      </div>
    </div>
  );
}
