import { Button } from "@heroui/react";
import { useState, useEffect } from "react";
import { Maximize, Minimize } from "lucide-react";
import { motion } from "motion/react";


export function FullScreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex shrink-0 w-12 h-12 lg:w-[56px] lg:h-[56px]"
    >
      <Button isIconOnly variant="secondary" radius="full"
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        style={{ '--md-filled-tonal-icon-button-container-shape': '24px', width: '100%', height: '100%' }}
      >
        {isFullscreen ? (
          <Minimize size={24} className="stroke-[2.5]" />
        ) : (
          <Maximize size={24} className="stroke-[2.5]" />
        )}
      </Button>
    </motion.div>
  );
}
