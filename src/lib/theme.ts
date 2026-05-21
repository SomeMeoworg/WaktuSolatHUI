import {
  themeFromImage,
  hexFromArgb,
  Scheme,
  Hct,
  SchemeTonalSpot,
  SchemeVibrant,
  SchemeExpressive,
  SchemeFidelity,
  SchemeNeutral,
  SchemeMonochrome,
  SchemeContent,
  DynamicScheme
} from "@material/material-color-utilities";

export type ThemeVariant = "tonal_spot" | "vibrant" | "expressive" | "fidelity" | "neutral" | "monochrome" | "content";

function getScheme(hct: Hct, isDark: boolean, variant: ThemeVariant = "tonal_spot", contrastLevel: number = 0.0) {
  switch (variant) {
    case "vibrant": return new SchemeVibrant(hct, isDark, contrastLevel);
    case "expressive": return new SchemeExpressive(hct, isDark, contrastLevel);
    case "fidelity": return new SchemeFidelity(hct, isDark, contrastLevel);
    case "neutral": return new SchemeNeutral(hct, isDark, contrastLevel);
    case "monochrome": return new SchemeMonochrome(hct, isDark, contrastLevel);
    case "content": return new SchemeContent(hct, isDark, contrastLevel);
    case "tonal_spot":
    default:
      return new SchemeTonalSpot(hct, isDark, contrastLevel);
  }
}

function applyThemeColors(scheme: DynamicScheme | Scheme, isDark: boolean = false) {
  const colors: Record<string, number> = {
    "primary": scheme.primary,
    "on-primary": scheme.onPrimary,
    "primary-container": scheme.primaryContainer,
    "on-primary-container": scheme.onPrimaryContainer,
    
    "secondary": scheme.secondary,
    "on-secondary": scheme.onSecondary,
    "secondary-container": scheme.secondaryContainer,
    "on-secondary-container": scheme.onSecondaryContainer,
    
    "tertiary": scheme.tertiary,
    "on-tertiary": scheme.onTertiary,
    "tertiary-container": scheme.tertiaryContainer,
    "on-tertiary-container": scheme.onTertiaryContainer,
    
    "background": scheme.background,
    "on-background": scheme.onBackground,
    "surface": scheme.surface,
    "on-surface": scheme.onSurface,
    
    "surface-variant": scheme.surfaceVariant,
    "on-surface-variant": scheme.onSurfaceVariant,
    
    "outline": scheme.outline,
    "outline-variant": scheme.outlineVariant,
    
    // Inverse roles
    "inverse-surface": scheme.inverseSurface,
    "inverse-on-surface": scheme.inverseOnSurface,
    "inverse-primary": scheme.inversePrimary,
    
    // New surface container roles
    "surface-container-lowest": (scheme as any).surfaceContainerLowest ?? scheme.surface,
    "surface-container-low": (scheme as any).surfaceContainerLow ?? scheme.surface,
    "surface-container": (scheme as any).surfaceContainer ?? scheme.surface,
    "surface-container-high": (scheme as any).surfaceContainerHigh ?? scheme.surfaceVariant,
    "surface-container-highest": (scheme as any).surfaceContainerHighest ?? scheme.surfaceVariant,
    "surface-bright": (scheme as any).surfaceBright ?? scheme.surface,
    "surface-dim": (scheme as any).surfaceDim ?? scheme.surface,
    "surface-tint": (scheme as any).surfaceTint ?? scheme.primary,
  };

  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  for (const [key, value] of Object.entries(colors)) {
    if (value !== undefined) {
      root.style.setProperty(`--md-sys-color-${key}`, hexFromArgb(value));
    }
  }
}

export async function applyThemeFromImage(image: HTMLImageElement, isDark: boolean = false, variant: ThemeVariant = "tonal_spot", contrastLevel: number = 0.0) {
  // themeFromImage returns Theme which we can get source color from
  const theme = await themeFromImage(image);
  const hct = Hct.fromInt(theme.source);
  const scheme = getScheme(hct, isDark, variant, contrastLevel);
  applyThemeColors(scheme, isDark);
  return scheme;
}

export function applyThemeFromColor(color: number, isDark: boolean = false, variant: ThemeVariant = "tonal_spot", contrastLevel: number = 0.0) {
  const hct = Hct.fromInt(color);
  const scheme = getScheme(hct, isDark, variant, contrastLevel);
  applyThemeColors(scheme, isDark);
  return scheme;
}

export function applyThemeFromHex(hex: string, isDark: boolean = false, variant: ThemeVariant = "tonal_spot", contrastLevel: number = 0.0) {
  // Convert hex to argb
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  const argb = parseInt(h, 16) | 0xff000000;
  return applyThemeFromColor(argb, isDark, variant, contrastLevel);
}
