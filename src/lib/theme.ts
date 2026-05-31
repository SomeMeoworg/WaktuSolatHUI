export interface ThemeColors {
  primary: string;
  secondary: string;
  surface: string;
  background: string;
  outline: string;
  foreground: string;
  surfaceContainer: string;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const cleanHex = hex.replace(/^#/, "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export function generateTheme(sourceColorHex: string, isDark: boolean): ThemeColors {
  // In a real app we'd convert the hex to HSL and derive these.
  // For now, since we're using HeroUI, we just return basic fallbacks.
  // HeroUI handles the actual semantic tokens natively!
  return {
    primary: sourceColorHex,
    secondary: "#4b5563",
    surface: isDark ? "#18181b" : "#ffffff",
    background: isDark ? "#09090b" : "#f4f4f5",
    outline: isDark ? "#3f3f46" : "#e4e4e7",
    foreground: isDark ? "#f4f4f5" : "#1a1a1a",
    surfaceContainer: isDark ? "#141416" : "#f3f4f6"
  };
}

export function applyTheme(colors: ThemeColors) {
  const root = document.documentElement;
  // Apply our custom CSS variables for legacy compatibility
  root.style.setProperty('--app-primary', colors.primary);
  root.style.setProperty('--app-secondary', colors.secondary);
  root.style.setProperty('--app-surface', colors.surface);
  root.style.setProperty('--app-background', colors.background);
  root.style.setProperty('--app-outline', colors.outline);
  root.style.setProperty('--app-foreground', colors.foreground);
  root.style.setProperty('--app-surface-container', colors.surfaceContainer);

  // Sync dynamic HSL variables for HeroUI v3's standard transparent overlays
  const primaryHsl = hexToHsl(colors.primary);
  const secondaryHsl = hexToHsl(colors.secondary);
  const dangerHsl = hexToHsl("#ef4444");

  root.style.setProperty('--heroui-primary', `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`);
  root.style.setProperty('--heroui-secondary', `${secondaryHsl.h} ${secondaryHsl.s}% ${secondaryHsl.l}%`);
  root.style.setProperty('--heroui-danger', `${dangerHsl.h} ${dangerHsl.s}% ${dangerHsl.l}%`);
}


export const ThemeVariant = { SYSTEM: 'system', LIGHT: 'light', DARK: 'dark' };
export const PRAYER_COLORS = { imsak: '#6b7280', subuh: '#3b82f6', syuruk: '#eab308', zohor: '#f59e0b', asar: '#f97316', maghrib: '#ef4444', isyak: '#6366f1' };
export async function applyThemeFromImage(src: any) { return '#000000'; }
export function applyThemeFromHex(hex: any) { return generateTheme(hex, false); }
