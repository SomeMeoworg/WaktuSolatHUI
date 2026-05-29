import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { BellRing, Check, X } from "lucide-react";
import { modalVariants } from "../lib/motion";
import { useVisualStyle } from "../hooks/useVisualStyle";
import { cn } from "../lib/utils";

interface NotificationPrePromptProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  language: "ms" | "en";
}

export function NotificationPrePrompt({
  isOpen,
  onClose,
  onConfirm,
  language
}: NotificationPrePromptProps) {
  const visualStyle = useVisualStyle();

  const titleText = language === "ms" ? "Aktifkan Notifikasi Waktu Solat" : "Enable Prayer Notifications";
  const descText = language === "ms" 
    ? "Aplikasi memerlukan kebenaran notifikasi untuk menghantar amaran azan secara tepat dan memaklumkan anda beberapa minit sebelum waktu solat bermula." 
    : "The app requires notification permission to trigger timely Azan alerts and remind you minutes before each prayer begins.";
  
  const allowText = language === "ms" ? "Benarkan Notifikasi" : "Allow Notifications";
  const deferText = language === "ms" ? "Nanti Saja" : "Maybe Later";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Dialog Container */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative bg-content2 w-full max-w-md flex flex-col rounded-[2.5rem] overflow-hidden shadow-2xl border border-divider p-6 text-center select-none",
              visualStyle === "glass" && "bg-[var(--glass-bg)] backdrop-blur-[24px] border border-[var(--glass-border)]",
              visualStyle === "retro" && "border-2 border-[var(--app-foreground)] shadow-[6px_6px_0px_0px_var(--app-foreground)]",
              visualStyle === "soft" && "shadow-[var(--soft-shadow-light)] border-0"
            )}
          >
            {/* Expressive M3 Icon Badge */}
            <div className="mx-auto w-16 h-16 rounded-[24px] bg-[var(--app-primary-container, hsl(var(--heroui-primary) / 0.15))] text-primary flex items-center justify-center mb-6 ring-8 ring-[var(--app-primary-container, hsl(var(--heroui-primary) / 0.15))]/10 animate-bounce-slow">
              <BellRing size={28} className="stroke-[2.2]" />
            </div>

            <h2 className="text-xl font-semibold font-black text-foreground mb-3 px-2 leading-tight">
              {titleText}
            </h2>

            <p className="text-sm text-[var(--app-outline)] leading-relaxed mb-8 px-3">
              {descText}
            </p>

            {/* Actions Grid */}
            <div className="flex flex-col gap-2.5 w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 py-4 rounded-3xl font-black text-sm text-primary-foreground bg-primary shadow-md hover:shadow-lg transition-all cursor-pointer",
                  visualStyle === "retro" && "border-2 border-[var(--app-foreground)] rounded-none shadow-[2px_2px_0px_var(--app-foreground)]",
                  visualStyle === "glass" && "bg-primary backdrop-blur-none"
                )}
              >
                <Check size={16} className="stroke-[2.5]" />
                {allowText}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-3xl font-bold text-sm text-[var(--app-outline)] hover:bg-[var(--app-surface-variant)]/50 transition-all cursor-pointer",
                  visualStyle === "retro" && "border-2 border-[var(--app-foreground)] rounded-none"
                )}
              >
                <X size={14} className="stroke-[2.5]" />
                {deferText}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export default NotificationPrePrompt;
