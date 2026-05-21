import { useTime } from "./useTime";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
import "@material/web/elevation/elevation.js";

const ARABIC_NUMERALS = ["Ù¡Ù¢", "Ù¡", "Ù¢", "Ù£", "Ù¤", "Ù¥", "Ù¦", "Ù§", "Ù¨", "Ù©", "Ù¡Ù ", "Ù¡Ù¡"];

// Pre-computed positions for 12-hour numbers (radius=38% from center)
const ARABIC_POSITIONS = ARABIC_NUMERALS.map((num, i) => {
  const angleDeg = i * 30 - 90;
  const angleRad = angleDeg * (Math.PI / 180);
  const radius = 38;
  return {
    x: 50 + radius * Math.cos(angleRad),
    y: 50 + radius * Math.sin(angleRad),
    num,
  };
});

export function AnalogArabicClock({ movement }: { movement: 'tick' | 'sweep' }) {
  const visualStyle = useVisualStyle();
  const time = useTime(movement);

  const seconds = time.getSeconds() + time.getMilliseconds() / 1000;
  const minutes = time.getMinutes() + seconds / 60;
  const hours = (time.getHours() % 12) + minutes / 60;

  return (
    <div className={cn(
      "relative w-full aspect-square shrink-0 mx-auto flex flex-col items-center justify-center transition-all duration-300",
      // Size limits (Symmetric Locking Formula)
      "max-w-[180px] sm:max-w-[220px] md:max-w-[250px] lg:max-w-[280px] xl:max-w-[310px] 2xl:max-w-[340px]",
      "max-h-[180px] sm:max-h-[220px] md:max-h-[250px] lg:max-h-[280px] xl:max-h-[310px] 2xl:max-h-[340px]",
      "max-w-[20vh] sm:max-w-[24vh] lg:max-w-[28vh] xl:max-w-[30vh]",
      "max-h-[20vh] sm:max-h-[24vh] lg:max-h-[28vh] xl:max-h-[30vh]",
      
      // Default Style: Circular Dial
      "rounded-full border-[1.5px] border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface)] shadow-inner",
      
      visualStyle === 'retro' && "border-[3px] border-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface)] shadow-[6px_6px_0px_0px_var(--md-sys-color-on-surface)] rounded-none",
      visualStyle === 'glass' && "border-2 border-[var(--glass-border)] bg-[var(--glass-bg)]/35 backdrop-blur-[var(--glass-blur)] rounded-full shadow-none",
      visualStyle === 'soft' && "border border-[var(--md-sys-color-outline-variant)]/10 bg-[var(--md-sys-color-surface-container-lowest)] shadow-[var(--soft-shadow-light)] rounded-full"
    )}>
      {/* @ts-ignore */}
      <md-elevation level="2"></md-elevation>
      
      {/* Arabic Hour Markers - positioned via trigonometry */}
      {ARABIC_POSITIONS.map((pos, idx) => (
        <div
          key={idx}
          className={cn(
            "absolute flex items-center justify-center font-black select-none pointer-events-none transition-colors",
            "text-[var(--md-sys-color-on-surface)] drop-shadow-[0_2px_2px_rgba(0,0,0,0.18)]",
            visualStyle === 'retro' && "text-[var(--md-sys-color-on-surface)] font-black opacity-95 drop-shadow-none",
            visualStyle === 'glass' && "text-[var(--md-sys-color-on-surface)] drop-shadow-md opacity-90",
            visualStyle === 'soft' && "text-[var(--md-sys-color-primary)] opacity-95 drop-shadow-none"
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
              "absolute top-[2%] left-1/2 w-[1.5px] h-[4%] -ml-[0.75px] bg-[var(--md-sys-color-on-surface)]/30",
              visualStyle === 'retro' && "bg-[var(--md-sys-color-on-surface)]/50 w-[2px]",
              visualStyle === 'glass' && "bg-white/45",
              visualStyle === 'soft' && "bg-[var(--md-sys-color-outline)]/20"
            )} />
          </div>
        );
      })}

      {/* Center dot */}
      <div className={cn(
        "absolute top-1/2 left-1/2 w-4.5 h-4.5 sm:w-5 sm:h-5 -ml-2.25 sm:-ml-2.5 -mt-2.25 sm:-mt-2.5 rounded-full z-20 shadow-md",
        "bg-[var(--md-sys-color-on-surface)]",
        visualStyle === 'retro' && "bg-[var(--md-sys-color-on-surface)] border-2 border-white shadow-none",
        visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)]",
        visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)]"
      )}></div>
      <div className="absolute top-1/2 left-1/2 w-2.5 h-2.5 -ml-1.25 -mt-1.25 bg-[var(--md-sys-color-error)] rounded-full z-30 pointer-events-none"></div>

      {/* Hands */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Hour Hand */}
        <div
          className={cn(
            "absolute top-[28%] left-1/2 w-3.5 sm:w-4.5 h-[30%] rounded-full -ml-[1.75px] sm:-ml-[2.25px] origin-[50%_73.3%] z-10 shadow-md",
            "bg-[var(--md-sys-color-primary)]",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-primary)] border-2 border-[var(--md-sys-color-on-surface)] rounded-none w-4 sm:w-5 -ml-2 sm:-ml-2.5",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-on-surface)] border border-white/20",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-primary)] shadow-sm"
          )}
          style={{ transform: `rotate(${hours * 30}deg)` }}
        ></div>
        
        {/* Minute Hand */}
        <div
          className={cn(
            "absolute top-[12%] left-1/2 w-2.5 sm:w-3.25 h-[48%] rounded-full -ml-[1.25px] sm:-ml-[1.625px] origin-[50%_79.1%] z-10 shadow-md",
            "bg-[var(--md-sys-color-on-surface)] opacity-90",
            visualStyle === 'retro' && "bg-[var(--md-sys-color-secondary)] border-2 border-[var(--md-sys-color-on-surface)] rounded-none w-3 sm:w-3.75 -ml-1.5 sm:-ml-[1.875px]",
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
            visualStyle === 'retro' && "bg-[var(--md-sys-color-error)] w-[2.5px] rounded-none",
            visualStyle === 'glass' && "bg-[var(--md-sys-color-error)] shadow-[0_0_8px_var(--md-sys-color-error)]",
            visualStyle === 'soft' && "bg-[var(--md-sys-color-error)]"
          )}
          style={{ transform: `rotate(${seconds * 6}deg)` }}
        ></div>
      </div>
    </div>
  );
}
