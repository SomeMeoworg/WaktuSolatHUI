import { useTime } from "./useTime";
import { format } from "date-fns";
import { useVisualStyle } from "../../hooks/useVisualStyle";
import { cn } from "../../lib/utils";
const numberWords: string[] = [
  "TWELVE", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN", "TWENTY"
];

const tensWords: string[] = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY"];

function getWordForNumber(n: number): string {
  if (n <= 20) return numberWords[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${tensWords[tens]}${ones > 0 ? " " + numberWords[ones] : ""}`;
}

function timeToWords(hours: number, minutes: number): string {
  const h = hours % 12 || 12;
  
  if (minutes === 0) return `IT IS EXACTLY\n${numberWords[h]}\nO'CLOCK`;
  if (minutes === 15) return `IT IS\nA QUARTER\nPAST ${numberWords[h]}`;
  if (minutes === 30) return `IT IS\nHALF PAST\n${numberWords[h]}`;
  if (minutes === 45) return `IT IS\nA QUARTER\nTO ${numberWords[(h % 12) + 1]}`;

  if (minutes < 30) {
    return `IT IS\n${getWordForNumber(minutes)}\nMINUTES PAST\n${numberWords[h]}`;
  } else {
    return `IT IS\n${getWordForNumber(60 - minutes)}\nMINUTES TO\n${numberWords[(h % 12) + 1]}`;
  }
}

export function WordClock() {
  const visualStyle = useVisualStyle();
  const time = useTime("tick");
  const words = timeToWords(time.getHours(), time.getMinutes());
  
  return (
    <div className={cn(
      "relative w-full overflow-hidden p-3.5 sm:p-4.5 lg:p-5 min-h-[110px] sm:min-h-[135px] lg:min-h-[155px] xl:min-h-[170px] max-h-[24vh] flex flex-col justify-between transition-all duration-300",
      "bg-content3 rounded-[var(--shape-xl)] shadow-sm border border-divider",
      visualStyle === 'retro' && "border-2 border-[var(--app-foreground)] shadow-[6px_6px_0px_0px_var(--app-foreground)] rounded-none md3-shape-extra-large bg-content3 text-foreground",
      visualStyle === 'glass' && "bg-[var(--glass-bg)]/35 backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] text-foreground rounded-[var(--shape-xl)]",
      visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border border-white/25 bg-content1 rounded-[var(--shape-xl)]"
    )}>
      

      {/* Subtle accent glow in background */}
      {visualStyle === 'default' && (
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />
      )}
      {visualStyle === 'glass' && (
        <div className="absolute bottom-0 left-0 w-2/3 h-2/3 bg-[var(--app-secondary)]/5 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Fluid word layout filling the aspect-square grid */}
      <div className="font-black uppercase tracking-tighter whitespace-pre-line select-none font-sans flex-1 flex flex-col justify-center gap-0.5 sm:gap-1.5 relative z-10 min-w-0 overflow-hidden">
        {words.split('\n').map((line, i) => (
          <div key={i} className={cn(
            "leading-[1.05] drop-shadow-sm",
            "text-[clamp(0.9rem,4.2cqi,2.2rem)] sm:text-[clamp(1.1rem,4.8cqi,2.6rem)]",
            "bg-clip-text text-transparent bg-gradient-to-r from-[var(--app-primary)] via-[var(--app-primary)] to-[var(--app-secondary)] opacity-95",
            visualStyle === 'retro' && "text-foreground bg-none bg-current opacity-100 drop-shadow-none",
            visualStyle === 'glass' && "text-foreground bg-none bg-current drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]",
            visualStyle === 'soft' && "from-[var(--app-primary)] to-[var(--app-secondary)]"
          )}>
            {line}
          </div>
        ))}
      </div>
      
      {/* Footer digital display */}
      <div className={cn(
        "mt-2 pt-2 sm:mt-3 sm:pt-2.5 border-t flex items-center justify-between opacity-70 font-sans tabular-nums text-[9px] sm:text-[11px] font-black tracking-widest select-none relative z-10",
        "border-divider text-[var(--app-outline)]",
        visualStyle === 'retro' && "border-[var(--app-foreground)]/30 text-foreground border-t-2",
        visualStyle === 'glass' && "border-white/10 text-foreground",
        visualStyle === 'soft' && "border-divider text-primary"
      )}>
        <span>{format(time, "hh:mm a")}</span>
        <span className="flex items-center gap-1.5">
          <span className={cn(
            "w-1 h-1 rounded-full animate-pulse",
            "bg-primary",
            visualStyle === 'retro' && "bg-[var(--app-foreground)] rounded-none",
            visualStyle === 'soft' && "bg-primary"
          )} />
          {format(time, "ss")}S
        </span>
      </div>
    </div>
  );
}
