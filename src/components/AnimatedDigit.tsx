import { AnimatePresence, motion } from "motion/react";
import { cn } from "../lib/utils";

export function AnimatedDigit({
  value,
  className,
}: {
  value: string | number;
  className?: string;
}) {
  const isDigit = typeof value === "number" || /^\d$/.test(String(value));

  return (
    <div className={cn("relative inline-flex items-center justify-center overflow-hidden", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          initial={{ y: "100%", filter: "blur(4px)", opacity: 0 }}
          animate={{ y: 0, filter: "blur(0px)", opacity: 1 }}
          exit={{ y: "-100%", filter: "blur(4px)", opacity: 0, position: "absolute" }}
          transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
          className="inline-block leading-none"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function AnimatedNumber({
  value,
  className,
  padZero = true,
}: {
  value: number;
  className?: string;
  padZero?: boolean;
}) {
  const str = padZero ? String(value).padStart(2, "0") : String(value);
  const chars = str.split("");

  return (
    <div className={cn("flex items-baseline", className)}>
      {chars.map((char, i) => (
        <AnimatedDigit key={`${i}-${chars.length}`} value={char} />
      ))}
    </div>
  );
}
