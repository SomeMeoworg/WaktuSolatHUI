import { useState, useRef, useEffect, ChangeEvent, useMemo } from "react";
import { applyThemeFromHex, applyThemeFromImage, ThemeVariant } from "../lib/theme";
import { Palette, Image as ImageIcon, Moon, Sun, Check, Contrast, Type } from "lucide-react";
import { cn } from "../lib/utils";
import { M3_EASING } from "../lib/motion";
import { motion, AnimatePresence } from "motion/react";
import { useAppContext } from "../AppContext";
import { LangKey } from "../translations";

const PRESET_COLORS = [
  "#006C54", // Emerald
  "#006874", // Cyan
  "#2C5E8A", // Ocean
  "#5A539B", // Indigo
  "#734C9E", // Amethyst
  "#984061", // Rose
  "#B3261E", // Crimson
  "#9E423A", // Rust
  "#8C5000", // Amber
  "#6E5D00", // Gold
  "#4F6354", // Forest
  "#3A4851", // Blueprint
  "#1A1C1E", // Pitch
  "#6B7075", // Slate
];

export function ThemeControl() {
  const { t } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);

  const VARIANTS = useMemo<{ id: ThemeVariant; name: string }[]>(() => [
    { id: "tonal_spot", name: t("variantAsas") },
    { id: "vibrant", name: t("variantCeria") },
    { id: "expressive", name: t("variantEkspresif") },
    { id: "fidelity", name: t("variantSetia") },
    { id: "neutral", name: t("variantNeutral") },
    { id: "monochrome", name: t("variantMono") },
    { id: "content", name: t("variantKandungan") },
  ], [t]);

  const CONTRASTS = useMemo(() => [
    { value: 0.0, name: t("contrastStandard") },
    { value: 0.5, name: t("contrastMedium") },
    { value: 1.0, name: t("contrastHigh") }
  ], [t]);

  const FONTS = useMemo(() => [
    { id: "'Plus Jakarta Sans', sans-serif", name: t("fontModern") },
    { id: "'Outfit', sans-serif", name: t("fontGeometric") },
    { id: "'Quicksand', sans-serif", name: t("fontFriendly") },
    { id: "'Playfair Display', serif", name: t("fontClassic") },
    { id: "'JetBrains Mono', monospace", name: t("fontTechnical") }
  ], [t]);

  const SHAPES = useMemo(() => [
    { id: "rounded", name: t("shapeRounded") },
    { id: "boxy", name: t("shapeBoxy") },
    { id: "semi", name: t("shapeSemi") },
    { id: "pill", name: t("shapePill") },
  ], [t]);

  const VISUAL_STYLES = useMemo(() => [
    { id: "default", name: t("styleDefault") },
    { id: "retro", name: t("styleRetro") },
    { id: "glass", name: t("styleGlass") },
    { id: "soft", name: t("styleSoft") },
  ], [t]);
  
  const [isDark, setIsDark] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('theme_dark');
      if (saved !== null) return saved === 'true';
    }
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });
  
  const [activeColor, setActiveColor] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('theme_color') || PRESET_COLORS[0];
    }
    return PRESET_COLORS[0];
  });
  
  const [activeVariant, setActiveVariant] = useState<ThemeVariant>(() => {
    if (typeof localStorage !== 'undefined') {
      return (localStorage.getItem('theme_variant') as ThemeVariant) || "tonal_spot";
    }
    return "tonal_spot";
  });
  
  const [contrastLevel, setContrastLevel] = useState<number>(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('theme_contrast');
      return stored !== null ? parseFloat(stored) : 0.0;
    }
    return 0.0;
  });

  const [activeFont, setActiveFont] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('theme_font') || FONTS[0].id;
    }
    return FONTS[0].id;
  });

  const [activeShape, setActiveShape] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('theme_shape') || SHAPES[0].id;
    }
    return SHAPES[0].id;
  });

  const [activeVisualStyle, setActiveVisualStyle] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('theme_visual_style') || 'default';
    }
    return 'default';
  });
  
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial load
  useEffect(() => {
    applyThemeFromHex(activeColor, isDark, activeVariant, contrastLevel);
  }, []); // Run once on mount

  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-sans', activeFont);
  }, [activeFont]);

  useEffect(() => {
    document.documentElement.setAttribute('data-shape', activeShape);
  }, [activeShape]);

  useEffect(() => {
    document.documentElement.setAttribute('data-style', activeVisualStyle);
  }, [activeVisualStyle]);

  useEffect(() => {
    document.body.style.backgroundImage = wallpaperUrl ? `url(${wallpaperUrl})` : 'none';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
  }, [wallpaperUrl]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const withTransition = (action: () => void) => {
    document.documentElement.classList.add('theme-transitioning');
    action();
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 600); // matches CSS duration
  };

  const handleColorSelect = (hex: string) => {
    withTransition(() => {
      setActiveColor(hex);
      setWallpaperUrl(null);
      localStorage.setItem('theme_color', hex);
      localStorage.removeItem('theme_wallpaper');
      applyThemeFromHex(hex, isDark, activeVariant, contrastLevel);
    });
  };
  
  const handleVariantSelect = (variant: ThemeVariant) => {
    withTransition(() => {
      setActiveVariant(variant);
      localStorage.setItem('theme_variant', variant);
      if (wallpaperUrl) {
        const img = new Image();
        img.src = wallpaperUrl;
        img.onload = () => {
          applyThemeFromImage(img, isDark, variant, contrastLevel);
        }
      } else {
        applyThemeFromHex(activeColor, isDark, variant, contrastLevel);
      }
    });
  };
  
  const handleContrastSelect = (val: number) => {
    withTransition(() => {
      setContrastLevel(val);
      localStorage.setItem('theme_contrast', val.toString());
      if (wallpaperUrl) {
        const img = new Image();
        img.src = wallpaperUrl;
        img.onload = () => {
          applyThemeFromImage(img, isDark, activeVariant, val);
        }
      } else {
        applyThemeFromHex(activeColor, isDark, activeVariant, val);
      }
    });
  };

  const handleFontSelect = (fontId: string) => {
    withTransition(() => {
      setActiveFont(fontId);
      localStorage.setItem('theme_font', fontId);
      // Actual font application happens in useEffect
    });
  };

  const handleShapeSelect = (shapeId: string) => {
    withTransition(() => {
      setActiveShape(shapeId);
      localStorage.setItem('theme_shape', shapeId);
      // Actual shape application happens in useEffect
    });
  };

  const handleVisualStyleSelect = (styleId: string) => {
    withTransition(() => {
      setActiveVisualStyle(styleId);
      localStorage.setItem('theme_visual_style', styleId);
      
      // Smart defaults: auto-adjust font and shape for better harmony
      if (styleId === 'retro') {
        // Retro works best with bold geometric fonts and boxy/semi shapes
        if (activeFont === "'Playfair Display', serif" || activeFont === "'Quicksand', sans-serif") {
          const geoFont = "'Outfit', sans-serif";
          setActiveFont(geoFont);
          document.documentElement.style.setProperty('--app-font-sans', geoFont);
          localStorage.setItem('theme_font', geoFont);
        }
        if (activeShape === 'pill') {
          setActiveShape('boxy');
          document.documentElement.setAttribute('data-shape', 'boxy');
          localStorage.setItem('theme_shape', 'boxy');
        }
      } else if (styleId === 'glass') {
        // Glass works best with clean modern fonts and rounded shapes
        if (activeFont === "'JetBrains Mono', monospace") {
          const modernFont = "'Plus Jakarta Sans', sans-serif";
          setActiveFont(modernFont);
          document.documentElement.style.setProperty('--app-font-sans', modernFont);
          localStorage.setItem('theme_font', modernFont);
        }
        if (activeShape === 'boxy') {
          setActiveShape('rounded');
          document.documentElement.setAttribute('data-shape', 'rounded');
          localStorage.setItem('theme_shape', 'rounded');
        }
      } else if (styleId === 'soft') {
        // Soft UI works best with rounded shapes and friendly fonts
        if (activeShape === 'boxy') {
          setActiveShape('rounded');
          document.documentElement.setAttribute('data-shape', 'rounded');
          localStorage.setItem('theme_shape', 'rounded');
        }
      }
    });
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      withTransition(() => {
        const url = URL.createObjectURL(file);
        setWallpaperUrl(url);
        
        const img = new Image();
        img.src = url;
        img.onload = () => {
          applyThemeFromImage(img, isDark, activeVariant, contrastLevel).then(() => {});
        };
      });
    }
  };

  const toggleDarkMode = () => {
    withTransition(() => {
      const newDark = !isDark;
      setIsDark(newDark);
      localStorage.setItem('theme_dark', newDark.toString());
      
      if (wallpaperUrl) {
        const img = new Image();
        img.src = wallpaperUrl;
        img.onload = () => {
          applyThemeFromImage(img, newDark, activeVariant, contrastLevel);
        }
      } else {
        applyThemeFromHex(activeColor, newDark, activeVariant, contrastLevel);
      }
    });
  };

  return (
    <>
      <div className="relative z-50 lg:static" ref={containerRef}>
        <motion.div
          whileHover={{ scale: 1.1, rotate: 15, transition: { ease: M3_EASING.emphasizedDecelerate, duration: 0.3 } }}
          whileTap={{ scale: 0.9, rotate: -5, transition: { ease: M3_EASING.emphasizedAccelerate, duration: 0.15 } }}
          className="inline-flex flex-shrink-0 w-12 h-12 lg:w-[56px] lg:h-[56px]"
        >
          {/* @ts-ignore */}
          <md-filled-tonal-icon-button
            onClick={() => setIsOpen(!isOpen)}
            title={t("themeSettings")}
            style={{ '--md-filled-tonal-icon-button-container-shape': '24px', width: '100%', height: '100%' }}
          >
            <Palette size={22} className="stroke-[2.5]" />
          </md-filled-tonal-icon-button>
        </motion.div>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Mobile overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-[90] sm:hidden"
                onClick={() => setIsOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, y: "100%", scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: "100%", scale: 0.95 }}
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
                className="fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] shadow-2xl border border-[var(--md-sys-color-outline)]/10 bg-[var(--md-sys-color-surface-container)] flex flex-col p-6 z-[100] max-h-[85vh] overflow-y-auto no-scrollbar sm:absolute sm:top-[calc(100%+12px)] sm:bottom-auto sm:right-0 sm:left-auto lg:left-0 lg:right-auto sm:w-[380px] sm:transform-origin-top-right xl:transform-origin-top-left sm:rounded-[2rem]"
                style={{ transformOrigin: 'top right' }}
              >
                <div className="w-12 h-1.5 bg-[var(--md-sys-color-outline)]/20 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="space-y-5">
              {/* Appearance & Color */}
              <div className="bg-[var(--md-sys-color-surface-container-low)] p-5 rounded-[2rem] space-y-4">
                <h3 className="md3-label-medium text-[var(--md-sys-color-primary)] uppercase tracking-widest flex items-center gap-2">
                  <Palette size={18} strokeWidth={2.5} /> {t("appearanceAndColor")}
                </h3>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleDarkMode}
                  className="md3-state-layer w-full flex items-center justify-center gap-2 bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-on-primary)] py-3 rounded-[1.25rem] md3-label-large transition-colors shadow-sm active:scale-95 duration-200"
                >
                  {isDark ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
                  {isDark ? t("lightMode") : t("darkMode")}
                </motion.button>

                <div className="flex flex-wrap gap-3 justify-center">
                  {PRESET_COLORS.map(color => (
                    <motion.button
                      key={color}
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      whileTap={{ scale: 0.8, rotate: -10 }}
                      onClick={() => handleColorSelect(color)}
                      className={cn(
                        "w-10 h-10 rounded-[1rem] border-2 transition-all shadow-sm ring-offset-2 ring-offset-[var(--md-sys-color-surface-container)] flex items-center justify-center shrink-0 duration-300",
                        activeColor === color && !wallpaperUrl ? "border-transparent ring-2 ring-current scale-110 rounded-full" : "border-white/20 hover:border-white/50"
                      )}
                      style={{ backgroundColor: color, color: color }}
                    >
                      {activeColor === color && !wallpaperUrl && <Check size={18} strokeWidth={3} className="text-white shadow-black/50 drop-shadow-md" />}
                    </motion.button>
                  ))}
                  <motion.label 
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    whileTap={{ scale: 0.8, rotate: -10 }}
                    className="w-10 h-10 rounded-[1rem] bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-center cursor-pointer hover:bg-[var(--md-sys-color-secondary-container)] hover:text-[var(--md-sys-color-on-secondary-container)] hover:rounded-full transition-all duration-300 border-2 border-transparent shadow-sm shrink-0"
                    title={t("customColor")}
                  >
                    <input
                      type="color"
                      className="opacity-0 absolute w-0 h-0"
                      value={activeColor}
                      onChange={(e) => handleColorSelect(e.target.value)}
                    />
                    <span className="text-2xl font-black text-[var(--md-sys-color-on-surface-variant)] leading-none -mt-1">+</span>
                  </motion.label>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="bg-[var(--md-sys-color-surface-container-low)] p-5 rounded-[2rem] space-y-4">
                <h3 className="md3-label-medium text-[var(--md-sys-color-primary)] uppercase tracking-widest flex items-center gap-2">
                  <Sun size={18} strokeWidth={2.5} /> {t("advancedTheme")}
                </h3>
                
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">{t("paletteStyle")}</span>
                  <div className="flex flex-wrap gap-2">
                    {VARIANTS.map(variant => (
                      /* @ts-ignore */
                      <md-filter-chip
                        key={variant.id}
                        label={variant.name}
                        selected={activeVariant === variant.id}
                        onClick={() => handleVariantSelect(variant.id)}
                      ></md-filter-chip>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">{t("contrastLevelLabel")}</span>
                  <div className="flex flex-wrap gap-2">
                    {CONTRASTS.map(contrast => (
                      /* @ts-ignore */
                      <md-filter-chip
                        key={contrast.value}
                        label={contrast.name}
                        selected={contrastLevel === contrast.value}
                        onClick={() => handleContrastSelect(contrast.value)}
                      ></md-filter-chip>
                    ))}
                  </div>
                </div>
              </div>

              {/* Elements */}
              <div className="bg-[var(--md-sys-color-surface-container-low)] p-5 rounded-[2rem] space-y-4 shadow-inner ring-1 ring-white/5">
                <h3 className="md3-label-medium text-[var(--md-sys-color-primary)] uppercase tracking-widest flex items-center gap-2">
                  <Type size={18} strokeWidth={2.5} /> {t("typographyAndShapes")}
                </h3>
                
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">{t("visualStyle")}</span>
                  <div className="flex flex-wrap gap-2">
                    {VISUAL_STYLES.map(style => (
                      /* @ts-ignore */
                      <md-filter-chip
                        key={style.id}
                        label={style.name}
                        selected={activeVisualStyle === style.id}
                        onClick={() => handleVisualStyleSelect(style.id)}
                      ></md-filter-chip>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {FONTS.map(font => (
                    /* @ts-ignore */
                    <md-filter-chip
                      key={font.id}
                      label={font.name}
                      selected={activeFont === font.id}
                      onClick={() => handleFontSelect(font.id)}
                      style={{ fontFamily: font.id }}
                    ></md-filter-chip>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {SHAPES.map(shape => (
                    /* @ts-ignore */
                    <md-filter-chip
                      key={shape.id}
                      label={shape.name}
                      selected={activeShape === shape.id}
                      onClick={() => handleShapeSelect(shape.id)}
                    ></md-filter-chip>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-[var(--md-sys-color-outline)]/10 mb-5" />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="md3-state-layer flex flex-col items-center justify-center w-full aspect-[21/9] bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-primary)] rounded-[1.5rem] overflow-hidden relative group transition-colors shadow-sm mt-2"
            >
              {wallpaperUrl ? (
                <>
                  <img src={wallpaperUrl} alt="Wallpaper" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-30 transition-opacity" />
                  <div className="z-10 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] leading-none px-4 py-2.5 rounded-full text-xs font-black shadow-md opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 transform">
                    {t("changeImage")}
                  </div>
                </>
              ) : (
                <>
                  <ImageIcon size={24} className="mb-2 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300" strokeWidth={2.5} />
                  <span className="text-xs font-black uppercase tracking-wider px-2 text-center">{t("extractFromWallpaper")}</span>
                </>
              )}
            </motion.button>
            <input
               type="file"
               ref={fileInputRef}
               className="hidden"
               accept="image/*"
               onChange={handleImageUpload}
            />
          </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
