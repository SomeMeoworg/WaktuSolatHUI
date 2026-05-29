// @ts-nocheck
import { Button } from "@heroui/react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Check, X } from "lucide-react";
import { JAKIM_ZONES } from "../lib/zones";
function getZoneName(zoneCode: string) {
  for (const state of JAKIM_ZONES) {
    const found = state.zones.find((z) => z.v === zoneCode);
    if (found) return found.l;
  }
  return zoneCode;
}

import { useAppContext } from "../AppContext";

export function LocationToast({
  promptZone,
  promptLocationName,
  autoUpdatedZone,
  autoUpdatedLocationName,
  onAccept,
  onDismiss,
}: {
  promptZone: string | null;
  promptLocationName?: string | null;
  autoUpdatedZone: string | null;
  autoUpdatedLocationName?: string | null;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const { t } = useAppContext();

  return (
    <AnimatePresence>
      {(promptZone || autoUpdatedZone) && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm"
        >
          <div className="bg-content4 border border-divider shadow-2xl rounded-[28px] p-5 flex flex-col gap-3 backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                autoUpdatedZone 
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                  : "bg-[var(--app-primary-container, hsl(var(--heroui-primary) / 0.15))] text-primary"
              }`}>
                {autoUpdatedZone ? <Check size={24} className="stroke-[2.5]" /> : <MapPin size={24} className="stroke-[2.5]" />}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h4 className="font-bold text-foreground text-lg leading-tight">
                  {autoUpdatedZone ? t("locationUpdated" as any) : t("locationNewDetected" as any)}
                </h4>
                <p className="text-[var(--app-outline)] text-sm mt-1">
                  {autoUpdatedZone
                    ? t("locationAutoUpdatedDesc" as any, { zoneName: getZoneName(autoUpdatedZone), locationName: autoUpdatedLocationName || "GPS Semasa" })
                    : t("locationPromptDesc" as any, { locationName: promptLocationName || "lokasi baharu", zoneName: getZoneName(promptZone!) })}
                </p>
              </div>
            </div>
            
            {promptZone && (
              <div className="flex items-center justify-end gap-2 mt-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" onClick={onDismiss}>
                    {t("ignore" as any)}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={onAccept}>
                    {t("changeZone" as any)}
                  </Button>
                </motion.div>
              </div>
            )}
            {autoUpdatedZone && (
               <div className="flex justify-end">
                   <motion.button 
                     onClick={onDismiss}
                     className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--app-surface-variant)] text-[var(--app-outline)]"
                   >
                     <X size={18} />
                   </motion.button>
               </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
