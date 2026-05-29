export interface ThemeColors {
  primary: string;
  secondary: string;
  surface: string;
  background: string;
  outline: string;
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
    outline: isDark ? "#3f3f46" : "#e4e4e7"
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
}


export const ThemeVariant = { SYSTEM: 'system', LIGHT: 'light', DARK: 'dark' };
export const PRAYER_COLORS = { imsak: '#6b7280', subuh: '#3b82f6', syuruk: '#eab308', zohor: '#f59e0b', asar: '#f97316', maghrib: '#ef4444', isyak: '#6366f1' };
export async function applyThemeFromImage(src) { return '#000000'; }
export function applyThemeFromHex(hex) { return generateTheme(hex, false); }
