import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
const ROMAN_NUMERALS = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

// Pre-computed positions for 12-hour numbers (radius=38% from center)
const ROMAN_POSITIONS = ROMAN_NUMERALS.map((num, i) => {
  const angleDeg = i * 30 - 90;
  const angleRad = angleDeg * (Math.PI / 180);
  const radius = 38;
  return {
    x: 50 + radius * Math.cos(angleRad),
    y: 50 + radius * Math.sin(angleRad),
    num,
  };
});

export function AnalogRomanClock({ movement }: { movement: 'tick' | 'sweep' }) {
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
      
      
      {/* Roman Hour Markers - positioned via trigonometry */}
      {ROMAN_POSITIONS.map((pos) => (
        <div
          key={pos.num}
          className={cn(
            "absolute flex items-center justify-center font-serif font-black select-none pointer-events-none transition-colors",
            "text-foreground/90 drop-shadow-[0_2px_2px_rgba(0,0,0,0.15)]",
            visualStyle === 'retro' && "text-foreground font-black opacity-95 drop-shadow-none",
            visualStyle === 'glass' && "text-foreground drop-shadow-md opacity-90",
            visualStyle === 'soft' && "text-primary opacity-95 drop-shadow-none"
          )}
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(14px, 4vw, 24px)',
          }}
        >
          {pos.num}
        </div>
      ))}

      {/* Minute tick marks */}
      {[...Array(60)].map((_, i) => {
        const isHour = i % 5 === 0;
        if (isHour) return null;
        const angle = i * 6;
        return (
          <div
            key={i}
            className="absolute inset-0 pointer-events-none"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <div className={cn(
              "absolute top-[2%] left-1/2 w-[1.5px] h-[4%] -ml-[0.75px] bg-[var(--app-foreground)]/30",
              visualStyle === 'retro' && "bg-[var(--app-foreground)]/50 w-[2px]",
              visualStyle === 'glass' && "bg-white/45",
              visualStyle === 'soft' && "bg-[var(--app-outline)]/20"
            )} />
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
