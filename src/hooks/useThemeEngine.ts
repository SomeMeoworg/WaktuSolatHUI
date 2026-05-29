import { useEffect } from "react";
import { useAppContext } from "../AppContext";
import { generateTheme, applyTheme } from "../lib/theme";
import { useVisualStyle } from "./useVisualStyle";

export function useThemeEngine() {
  const { settings } = useAppContext();
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  useEffect(() => {
    // Generate the theme colors
    const colors = generateTheme(settings.themeColor, isDark);
    
    // Apply the colors to CSS variables
    applyTheme(colors);
    
    // Update theme-color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", colors.surface);
    }
    
    // Optionally apply to HeroUI root container if needed
    // document.documentElement.style.setProperty('--heroui-primary', ...);
  }, [settings.themeColor]);
}
