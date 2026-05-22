import { useState, useRef, useEffect, ChangeEvent, useMemo } from "react";
import { applyThemeFromHex, applyThemeFromImage, ThemeVariant, PRAYER_COLORS } from "../lib/theme";
import { 
  Palette, 
  Image as ImageIcon, 
  Moon, 
  Sun, 
  Check, 
  Contrast, 
  Type, 
  X, 
  Monitor, 
  Sunset, 
  Upload, 
  Link as LinkIcon, 
  Sliders, 
  Sparkles, 
  Eye, 
  Compass,
  Trash2
} from "lucide-react";
import { cn } from "../lib/utils";
import { M3_EASING } from "../lib/motion";
import { motion, AnimatePresence } from "motion/react";
import { useAppContext } from "../AppContext";
import { saveWallpaper, clearWallpaper, getWallpaperBlob } from "../lib/db";

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

const PRAYER_DETAILS = [
  { key: "fajr", nameKey: "fajr", color: PRAYER_COLORS.fajr, icon: Sunset, desc: "Subuh" },
  { key: "dhuhr", nameKey: "dhuhr", color: PRAYER_COLORS.dhuhr, icon: Sun, desc: "Zohor" },
  { key: "asr", nameKey: "asr", color: PRAYER_COLORS.asr, icon: Compass, desc: "Asar" },
  { key: "maghrib", nameKey: "maghrib", color: PRAYER_COLORS.maghrib, icon: Sunset, desc: "Maghrib" },
  { key: "isha", nameKey: "isha", color: PRAYER_COLORS.isha, icon: Moon, desc: "Isyak" }
];

export function ThemeControl() {
  const { settings, updateSettings, t } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [previewWallpaperUrl, setPreviewWallpaperUrl] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Load preview wallpaper thumbnail from IndexedDB
  useEffect(() => {
    let active = true;
    if (settings.wallpaperEnabled && settings.wallpaperSource === "upload") {
      getWallpaperBlob().then((blob) => {
        if (blob && active) {
          const url = URL.createObjectURL(blob);
          setPreviewWallpaperUrl(url);
        }
      });
    } else {
      setPreviewWallpaperUrl(null);
    }
    return () => {
      active = false;
    };
  }, [settings.wallpaperEnabled, settings.wallpaperSource, settings.wallpaperUrl]);

  // Clean up Object URLs for preview
  useEffect(() => {
    return () => {
      if (previewWallpaperUrl) {
        URL.revokeObjectURL(previewWallpaperUrl);
      }
    };
  }, [previewWallpaperUrl]);

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
    }, 600);
  };

  const handleColorSelect = (hex: string) => {
    withTransition(() => {
      updateSettings({ 
        themeColor: hex, 
        colorThemeMode: "manual" 
      });
    });
  };
  
  const handleVariantSelect = (variant: ThemeVariant) => {
    withTransition(() => {
      updateSettings({ themeVariant: variant });
    });
  };
  
  const handleContrastSelect = (val: number) => {
    withTransition(() => {
      updateSettings({ themeContrast: val });
    });
  };

  const handleFontSelect = (fontId: string) => {
    withTransition(() => {
      updateSettings({ themeFont: fontId });
    });
  };

  const handleShapeSelect = (shapeId: string) => {
    withTransition(() => {
      updateSettings({ themeShape: shapeId });
    });
  };

  const handleVisualStyleSelect = (styleId: string) => {
    withTransition(() => {
      const activeFont = settings.themeFont;
      const activeShape = settings.themeShape;
      
      let newFont = activeFont;
      let newShape = activeShape;

      // Smart defaults: auto-adjust font and shape for better harmony
      if (styleId === 'retro') {
        if (activeFont === "'Playfair Display', serif" || activeFont === "'Quicksand', sans-serif") {
          newFont = "'Outfit', sans-serif";
        }
        if (activeShape === 'pill') {
          newShape = 'boxy';
        }
      } else if (styleId === 'glass') {
        if (activeFont === "'JetBrains Mono', monospace") {
          newFont = "'Plus Jakarta Sans', sans-serif";
        }
        if (activeShape === 'boxy') {
          newShape = 'rounded';
        }
      } else if (styleId === 'soft') {
        if (activeShape === 'boxy') {
          newShape = 'rounded';
        }
      }

      updateSettings({ 
        visualStyle: styleId as any,
        themeFont: newFont,
        themeShape: newShape
      });
    });
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      withTransition(async () => {
        try {
          const url = await saveWallpaper(file);
          updateSettings({
            wallpaperEnabled: true,
            wallpaperSource: "upload",
            wallpaperUrl: "", // Reset URL if file uploaded
            wallpaperLastUpdated: Date.now()
          });
          setPreviewWallpaperUrl(url);
        } catch (e) {
          console.error("Failed to save custom wallpaper to IndexedDB:", e);
        }
      });
    }
  };

  const handleClearWallpaper = async () => {
    withTransition(async () => {
      try {
        await clearWallpaper();
        updateSettings({
          wallpaperEnabled: false,
          wallpaperUrl: ""
        });
        setPreviewWallpaperUrl(null);
      } catch (e) {
        console.error("Failed to clear custom wallpaper:", e);
      }
    });
  };

  const activeModeText = useMemo(() => {
    if (settings.darkThemeMode === "system") {
      return t("darkThemeModeSystem");
    } else if (settings.darkThemeMode === "solar") {
      return t("darkThemeModeSolar");
    } else if (settings.darkThemeMode === "prayer") {
      return t("darkThemeModePrayer");
    }
    return settings.themeDark ? t("darkMode") : t("lightMode");
  }, [settings.darkThemeMode, settings.themeDark, t]);

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
              {/* Mobile background shade overlay */}
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
                className="fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] shadow-2xl border border-[var(--md-sys-color-outline)]/10 bg-[var(--md-sys-color-surface-container)] flex flex-col p-6 z-[100] max-h-[85vh] overflow-y-auto no-scrollbar sm:absolute sm:top-[calc(100%+12px)] sm:bottom-auto sm:right-0 sm:left-auto lg:left-0 lg:right-auto sm:w-[390px] sm:transform-origin-top-right xl:transform-origin-top-left sm:rounded-[2rem]"
                style={{ transformOrigin: 'top right' }}
              >
                <div className="w-12 h-1.5 bg-[var(--md-sys-color-outline)]/20 rounded-full mx-auto mb-4 sm:hidden" />
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-black uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                    {t("themeSettings")}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline)]/10 flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] transition-all focus:outline-none"
                    aria-label="Close theme settings"
                  >
                    <X size={18} strokeWidth={2.5} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  {/* SECTION 1: Dark Mode Configuration */}
                  <div className="bg-[var(--md-sys-color-surface-container-low)] p-4 rounded-[1.75rem] space-y-3">
                    <h3 className="md3-label-medium text-[var(--md-sys-color-primary)] uppercase tracking-widest flex items-center gap-2">
                      <Moon size={16} strokeWidth={2.5} /> {t("darkThemeModeLabel")}
                    </h3>
                    
                    {/* Four-way segmented mode selector */}
                    <div className="grid grid-cols-4 gap-1 p-1 bg-[var(--md-sys-color-surface-container-high)] rounded-2xl">
                      {[
                        { id: "manual", icon: Sun, label: t("darkThemeModeManual") },
                        { id: "system", icon: Monitor, label: t("darkThemeModeSystem") },
                        { id: "solar", icon: Sunset, label: t("darkThemeModeSolar") },
                        { id: "prayer", icon: Compass, label: t("darkThemeModePrayer") }
                      ].map(mode => {
                        const isSelected = settings.darkThemeMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            onClick={() => withTransition(() => updateSettings({ darkThemeMode: mode.id as any }))}
                            className={cn(
                              "flex flex-col items-center justify-center py-2 px-0.5 rounded-xl text-center transition-all duration-200",
                              isSelected 
                                ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm scale-102"
                                : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-outline)]/5"
                            )}
                          >
                            <mode.icon size={16} className="mb-1" strokeWidth={2.5} />
                            <span className="text-[9px] sm:text-[10px] font-bold tracking-tighter sm:tracking-tight leading-none">{mode.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Manual Mode Secondary Toggle Switch */}
                    {settings.darkThemeMode === "manual" && (
                      <motion.button 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => withTransition(() => updateSettings({ themeDark: !settings.themeDark }))}
                        className="w-full flex items-center justify-center gap-2 bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-on-primary)] py-2.5 rounded-xl md3-label-large transition-all shadow-sm duration-200"
                      >
                        {settings.themeDark ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
                        {settings.themeDark ? t("lightMode") : t("darkMode")}
                      </motion.button>
                    )}

                    {/* Auto mode description bubble */}
                    <div className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] text-center italic bg-[var(--md-sys-color-surface-container-highest)]/30 py-1.5 px-3 rounded-lg border border-[var(--md-sys-color-outline)]/5">
                      {t("activePrayer")}: <span className="font-black text-[var(--md-sys-color-primary)] normal-case">{activeModeText}</span>
                    </div>
                  </div>

                  {/* SECTION 2: Color Palette Settings */}
                  <div className="bg-[var(--md-sys-color-surface-container-low)] p-4 rounded-[1.75rem] space-y-3">
                    <h3 className="md3-label-medium text-[var(--md-sys-color-primary)] uppercase tracking-widest flex items-center gap-2">
                      <Palette size={16} strokeWidth={2.5} /> {t("colorThemeModeLabel")}
                    </h3>

                    {/* Toggle selector: Manual vs Prayer-time Auto Colors */}
                    <div className="grid grid-cols-2 gap-1 p-1 bg-[var(--md-sys-color-surface-container-high)] rounded-2xl">
                      {[
                        { id: "manual", label: t("colorThemeModeManual") },
                        { id: "prayer", label: t("colorThemeModePrayer") }
                      ].map(source => {
                        const isSelected = settings.colorThemeMode === source.id;
                        return (
                          <button
                            key={source.id}
                            onClick={() => withTransition(() => updateSettings({ colorThemeMode: source.id as any }))}
                            className={cn(
                              "py-2 rounded-xl text-xs font-black transition-all duration-200 text-center",
                              isSelected 
                                ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm scale-102"
                                : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-outline)]/5"
                            )}
                          >
                            {source.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Color display dynamic lists */}
                    {settings.colorThemeMode === "manual" ? (
                      /* Manual Swatches Grid */
                      <div className="flex flex-wrap gap-2 justify-center pt-1">
                        {PRESET_COLORS.map(color => (
                          <motion.button
                            key={color}
                            whileHover={{ scale: 1.2, rotate: 10 }}
                            whileTap={{ scale: 0.8, rotate: -10 }}
                            onClick={() => handleColorSelect(color)}
                            className={cn(
                              "w-8 h-8 rounded-[0.75rem] border-2 transition-all shadow-sm flex items-center justify-center shrink-0 duration-300",
                              settings.themeColor === color && !settings.wallpaperEnabled
                                ? "border-transparent ring-2 ring-[var(--md-sys-color-primary)] scale-110 rounded-full" 
                                : "border-white/10 hover:border-white/40"
                            )}
                            style={{ backgroundColor: color }}
                          >
                            {settings.themeColor === color && !settings.wallpaperEnabled && (
                              <Check size={14} strokeWidth={4} className="text-white drop-shadow" />
                            )}
                          </motion.button>
                        ))}
                        <motion.label 
                          whileHover={{ scale: 1.2, rotate: 10 }}
                          whileTap={{ scale: 0.8, rotate: -10 }}
                          className="w-8 h-8 rounded-[0.75rem] bg-[var(--md-sys-color-surface-container-highest)] flex items-center justify-center cursor-pointer hover:bg-[var(--md-sys-color-secondary-container)] hover:rounded-full transition-all duration-300 border-2 border-transparent shadow-sm shrink-0"
                          title={t("customColor")}
                        >
                          <input
                            type="color"
                            className="opacity-0 absolute w-0 h-0"
                            value={settings.themeColor || "#006C54"}
                            onChange={(e) => handleColorSelect(e.target.value)}
                          />
                          <span className="text-lg font-black text-[var(--md-sys-color-on-surface-variant)]">+</span>
                        </motion.label>
                      </div>
                    ) : (
                      /* Auto Prayer Color previews horizontal/vertical deck */
                      <div className="grid grid-cols-5 gap-1 pt-1 bg-[var(--md-sys-color-surface-container-highest)]/40 p-2 rounded-2xl border border-[var(--md-sys-color-outline)]/5">
                        {PRAYER_DETAILS.map(p => {
                          return (
                            <div 
                              key={p.key} 
                              className="flex flex-col items-center p-1 rounded-xl text-center group cursor-default"
                              title={`${p.desc}: ${p.color}`}
                            >
                              <div 
                                className="w-7 h-7 rounded-[0.5rem] flex items-center justify-center relative shadow-sm border border-black/5"
                                style={{ backgroundColor: p.color }}
                              >
                                <p.icon size={12} className="text-white/95" strokeWidth={2.5} />
                              </div>
                              <span className="text-[9px] font-black uppercase text-[var(--md-sys-color-on-surface-variant)] mt-1 tracking-tighter leading-none select-none">
                                {t(p.nameKey as any)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* SECTION 3: Sophisticated Wallpaper Customization Accordion */}
                  <div className="bg-[var(--md-sys-color-surface-container-low)] p-4 rounded-[1.75rem] space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="md3-label-medium text-[var(--md-sys-color-primary)] uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon size={16} strokeWidth={2.5} /> {t("enableWallpaper")}
                      </h3>
                      {/* @ts-ignore */}
                      <md-switch
                        selected={!!settings.wallpaperEnabled}
                        onClick={() => withTransition(() => updateSettings({ wallpaperEnabled: !settings.wallpaperEnabled }))}
                      ></md-switch>
                    </div>

                    <AnimatePresence>
                      {settings.wallpaperEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ ease: M3_EASING.emphasizedDecelerate, duration: 0.3 }}
                          className="space-y-3 overflow-hidden pt-1"
                        >
                          {/* Wallpaper Source Selection: Upload file vs URL Link */}
                          <div className="grid grid-cols-2 gap-1 p-1 bg-[var(--md-sys-color-surface-container-high)] rounded-xl">
                            {[
                              { id: "upload", label: t("wallpaperSourceUpload"), icon: Upload },
                              { id: "url", label: t("wallpaperSourceUrl"), icon: LinkIcon }
                            ].map(src => {
                              const isSelected = settings.wallpaperSource === src.id;
                              return (
                                <button
                                  key={src.id}
                                  onClick={() => withTransition(() => updateSettings({ wallpaperSource: src.id as any }))}
                                  className={cn(
                                    "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-black transition-all",
                                    isSelected 
                                      ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm scale-102"
                                      : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-outline)]/5"
                                  )}
                                >
                                  <src.icon size={12} strokeWidth={2.5} />
                                  {src.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Wallpaper Inputs */}
                          {settings.wallpaperSource === "upload" ? (
                            /* Local Image Upload Area */
                            <div className="space-y-2">
                              <motion.div
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center w-full aspect-[21/9] bg-[var(--md-sys-color-surface-container-high)] border-2 border-dashed border-[var(--md-sys-color-outline)]/20 hover:border-[var(--md-sys-color-primary)] rounded-xl cursor-pointer relative overflow-hidden group transition-all"
                              >
                                {previewWallpaperUrl ? (
                                  <>
                                    <img src={previewWallpaperUrl} alt="Wallpaper preview" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-all duration-300" />
                                    <div className="z-10 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] leading-none px-3.5 py-2 rounded-full text-[10px] font-black shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 transform">
                                      {t("changeImage")}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <Upload size={18} className="mb-1 text-[var(--md-sys-color-on-surface-variant)] group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">{t("extractFromWallpaper")}</span>
                                  </>
                                )}
                              </motion.div>
                              
                              {previewWallpaperUrl && (
                                <button
                                  onClick={handleClearWallpaper}
                                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] hover:bg-[var(--md-sys-color-error)] hover:text-white transition-colors"
                                >
                                  <Trash2 size={12} />
                                  Padam Gambar Latar
                                </button>
                              )}

                              <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                              />
                            </div>
                          ) : (
                            /* URL Address Input */
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-[var(--md-sys-color-on-surface-variant)] tracking-wider">
                                {t("wallpaperSourceUrl")}
                              </label>
                              <div className="relative flex items-center bg-[var(--md-sys-color-surface-container-high)] rounded-xl border border-[var(--md-sys-color-outline)]/10 px-3">
                                <LinkIcon size={14} className="text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
                                <input
                                  type="url"
                                  className="w-full bg-transparent border-0 outline-none text-xs font-medium py-2 pl-2 text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-outline)]"
                                  placeholder={t("wallpaperUrlPlaceholder")}
                                  value={settings.wallpaperUrl || ""}
                                  onChange={(e) => updateSettings({ wallpaperUrl: e.target.value })}
                                />
                              </div>
                            </div>
                          )}

                          {/* Blur Intensity Slider */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)]">
                              <span>{t("wallpaperBlurLabel")}</span>
                              <span className="font-black text-[var(--md-sys-color-primary)]">{settings.wallpaperBlur ?? 10}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="40"
                              step="2"
                              className="w-full h-1.5 bg-[var(--md-sys-color-surface-container-high)] rounded-lg appearance-none cursor-pointer accent-[var(--md-sys-color-primary)]"
                              value={settings.wallpaperBlur ?? 10}
                              onChange={(e) => updateSettings({ wallpaperBlur: parseInt(e.target.value) })}
                            />
                          </div>

                          {/* Overlay Dim Intensity Slider */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)]">
                              <span>{t("wallpaperDimLabel")}</span>
                              <span className="font-black text-[var(--md-sys-color-primary)]">{settings.wallpaperDim ?? 40}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="90"
                              step="5"
                              className="w-full h-1.5 bg-[var(--md-sys-color-surface-container-high)] rounded-lg appearance-none cursor-pointer accent-[var(--md-sys-color-primary)]"
                              value={settings.wallpaperDim ?? 40}
                              onChange={(e) => updateSettings({ wallpaperDim: parseInt(e.target.value) })}
                            />
                          </div>

                          {/* Overlay Color Style Selector */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-[var(--md-sys-color-on-surface-variant)] tracking-wider block">
                              {t("wallpaperOverlayStyleLabel")}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                { id: "tint", label: t("wallpaperOverlayStyleTint") },
                                { id: "dark", label: t("wallpaperOverlayStyleDark") },
                                { id: "light", label: t("wallpaperOverlayStyleLight") }
                              ].map(style => {
                                const isSelected = settings.wallpaperOverlayStyle === style.id;
                                return (
                                  <button
                                    key={style.id}
                                    onClick={() => withTransition(() => updateSettings({ wallpaperOverlayStyle: style.id as any }))}
                                    className={cn(
                                      "px-3 py-1 rounded-lg text-[10px] font-extrabold border transition-all",
                                      isSelected
                                        ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent shadow-sm"
                                        : "border-[var(--md-sys-color-outline)]/10 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-outline)]/5"
                                    )}
                                  >
                                    {style.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Text shadow glow boost toggle */}
                          <div className="flex items-center justify-between border-t border-[var(--md-sys-color-outline)]/5 pt-2 mt-1">
                            <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)]">
                              {t("wallpaperTextGlowLabel")}
                            </span>
                            {/* @ts-ignore */}
                            <md-switch
                              selected={!!settings.wallpaperTextGlow}
                              onClick={() => withTransition(() => updateSettings({ wallpaperTextGlow: !settings.wallpaperTextGlow }))}
                            ></md-switch>
                          </div>

                          {/* Vignette Shadow Toggle */}
                          <div className="flex items-center justify-between border-t border-[var(--md-sys-color-outline)]/5 pt-2 mt-1">
                            <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)]">
                              {t("wallpaperVignetteLabel")}
                            </span>
                            {/* @ts-ignore */}
                            <md-switch
                              selected={!!settings.wallpaperVignette}
                              onClick={() => withTransition(() => updateSettings({ wallpaperVignette: !settings.wallpaperVignette }))}
                            ></md-switch>
                          </div>

                          {/* Mosque Auto-Dim Toggle */}
                          <div className="flex items-center justify-between border-t border-[var(--md-sys-color-outline)]/5 pt-2 mt-1">
                            <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)]">
                              {t("wallpaperMosqueAutoDimLabel")}
                            </span>
                            {/* @ts-ignore */}
                            <md-switch
                              selected={!!settings.wallpaperMosqueAutoDim}
                              onClick={() => withTransition(() => updateSettings({ wallpaperMosqueAutoDim: !settings.wallpaperMosqueAutoDim }))}
                            ></md-switch>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* SECTION 4: Styling Options (Shapes, Typography, Visual Styles, Variants, Contrast) */}
                  <div className="bg-[var(--md-sys-color-surface-container-low)] p-4 rounded-[1.75rem] space-y-4">
                    <h3 className="md3-label-medium text-[var(--md-sys-color-primary)] uppercase tracking-widest flex items-center gap-2">
                      <Sliders size={16} strokeWidth={2.5} /> {t("advancedTheme")}
                    </h3>
                    
                    {/* Visual Styles */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] block">
                        {t("visualStyle")}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {VISUAL_STYLES.map(style => (
                          <button
                            key={style.id}
                            onClick={() => handleVisualStyleSelect(style.id)}
                            className={cn(
                              "px-3 py-1 rounded-lg text-[10px] font-extrabold border transition-all",
                              settings.visualStyle === style.id
                                ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent shadow-sm"
                                : "border-[var(--md-sys-color-outline)]/10 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-outline)]/5"
                            )}
                          >
                            {style.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Palette Styles */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] block">
                        {t("paletteStyle")}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {VARIANTS.map(variant => (
                          <button
                            key={variant.id}
                            onClick={() => handleVariantSelect(variant.id)}
                            className={cn(
                              "px-3 py-1 rounded-lg text-[10px] font-extrabold border transition-all",
                              settings.themeVariant === variant.id
                                ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent shadow-sm"
                                : "border-[var(--md-sys-color-outline)]/10 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-outline)]/5"
                            )}
                          >
                            {variant.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Contrast Levels */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] block">
                        {t("contrastLevelLabel")}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {CONTRASTS.map(contrast => (
                          <button
                            key={contrast.value}
                            onClick={() => handleContrastSelect(contrast.value)}
                            className={cn(
                              "px-3 py-1 rounded-lg text-[10px] font-extrabold border transition-all",
                              settings.themeContrast === contrast.value
                                ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent shadow-sm"
                                : "border-[var(--md-sys-color-outline)]/10 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-outline)]/5"
                            )}
                          >
                            {contrast.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Typography */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] block">
                        Tipografi
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {FONTS.map(font => (
                          <button
                            key={font.id}
                            onClick={() => handleFontSelect(font.id)}
                            className={cn(
                              "px-3 py-1 rounded-lg text-[10px] font-extrabold border transition-all",
                              settings.themeFont === font.id
                                ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent shadow-sm"
                                : "border-[var(--md-sys-color-outline)]/10 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-outline)]/5"
                            )}
                            style={{ fontFamily: font.id }}
                          >
                            {font.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Shape Scale */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] block">
                        Bentuk Lengkungan
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {SHAPES.map(shape => (
                          <button
                            key={shape.id}
                            onClick={() => handleShapeSelect(shape.id)}
                            className={cn(
                              "px-3 py-1 rounded-lg text-[10px] font-extrabold border transition-all",
                              settings.themeShape === shape.id
                                ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent shadow-sm"
                                : "border-[var(--md-sys-color-outline)]/10 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-outline)]/5"
                            )}
                          >
                            {shape.name}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
