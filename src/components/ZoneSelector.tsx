import React, { useState, useRef, useEffect, useMemo } from "react";
import { JAKIM_ZONES } from "../lib/zones";
import { Search, MapPin, X, Crosshair, Map as MapIcon, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";
import { M3_MOTION } from "../lib/motion";
import { motion, AnimatePresence } from "motion/react";
import "@material/web/iconbutton/filled-icon-button.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/button/filled-tonal-button.js";
import "@material/web/ripple/ripple.js";
import "@material/web/switch/switch.js";
import "@material/web/tabs/tabs.js";
import "@material/web/tabs/primary-tab.js";
import "@material/web/icon/icon.js";
import "@material/web/textfield/outlined-text-field.js";
import { useAppContext } from "../AppContext";
import { MapModal } from "./MapModal";
import { useVisualStyle } from "../hooks/useVisualStyle";
import { fetchReverseGeocode, matchZoneFromGeocode, ALIASES } from "../lib/geocoding";
import { analytics } from "../lib/analytics";
import { StorageManager } from "../lib/StorageManager";
import { sanitizeInput } from "../lib/security";

const STATE_FLAGS: Record<string, string> = {
  Johor:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Johor.svg",
  Kedah:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Kedah.svg",
  Kelantan:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Kelantan.svg",
  Melaka:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Malacca.svg",
  "Negeri Sembilan":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Negeri_Sembilan.svg",
  Pahang:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Pahang.svg",
  Perak:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Perak.svg",
  Perlis:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Perlis.svg",
  "Pulau Pinang":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Penang_(Malaysia).svg",
  Sabah:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Sabah.svg",
  Sarawak:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Sarawak.svg",
  Selangor:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Selangor.svg",
  Terengganu:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Terengganu.svg",
  "Wilayah Persekutuan":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_the_Federal_Territories.svg",
};

export function ZoneSelector({
  selectedZone,
  onZoneSelect,
  isAutoDetecting,
  currentLocationName,
}: {
  selectedZone: string;
  onZoneSelect: (zone: string) => void;
  isAutoDetecting?: boolean;
  currentLocationName?: string | null;
}) {
  const { t, settings, updateSettings } = useAppContext();
  const visualStyle = useVisualStyle();
  const [isOpen, setIsOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationPermission, setLocationPermission] = useState<PermissionState | null>(null);

  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setLocationPermission(result.state);
        result.onchange = () => {
          setLocationPermission(result.state);
        };
      }).catch(() => {});
    }
  }, []);

  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeScrollState, setActiveScrollState] = useState<string | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set focus on input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setSearchQuery(""); // clear search when closed
    }
  }, [isOpen]);

  const [detectReason, setDetectReason] = useState<string | null>(null);

  const handleAutoDetect = () => {
    if ("geolocation" in navigator) {
      setIsDetecting(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserCoords({ lat: latitude, lng: longitude });
          try {
            const data = await fetchReverseGeocode(latitude, longitude);
            const match = matchZoneFromGeocode(data);
            
            let reasonFound = "";
            if (match.reasonKey === "alias" || match.reasonKey === "locality") {
              reasonFound = t(match.reasonKey === "alias" ? "reasonMatchingArea" : "reasonMatchingLocality").replace(
                match.reasonKey === "alias" ? "{area}" : "{locality}",
                match.detailVal
              );
            } else if (match.reasonKey === "state") {
              reasonFound = t("reasonStateCapital").replace("{state}", match.detailVal);
            } else {
              reasonFound = "Kuala Lumpur (Lalai)";
            }

            onZoneSelect(match.zone);
            setDetectReason(reasonFound);
            setTimeout(() => setDetectReason(null), 5000);
            setIsOpen(false);
          } catch (err) {
            analytics.logError(err, { context: "ZoneSelector_handleAutoDetect" });
            alert(t("failDetectLocation"));
          } finally {
            setIsDetecting(false);
          }
        },
        (geoError) => {
          analytics.logError(geoError, { context: "ZoneSelector_geolocation" });
          setIsDetecting(false);
          alert(t("failDetectLocation"));
        },
        { timeout: 5000 }
      );
    } else {
      alert(t("noSupportLocation"));
    }
  };

  // Find the label for the selected zone
  let selectedLabel = t("selectZone");
  let selectedState = "";
  for (const state of JAKIM_ZONES) {
    const zone = state.zones.find((z) => z.v === selectedZone);
    if (zone) {
      selectedLabel = zone.l;
      selectedState = state.state;
      break;
    }
  }

  const filteredZones = useMemo(() => {
    if (!searchQuery.trim()) return JAKIM_ZONES;

    const query = searchQuery.toLowerCase().trim();

    // Check if the query matches an alias
    const aliasZoneCode = ALIASES[query];

    return JAKIM_ZONES.map((state) => {
      const matchingZones = state.zones.filter(
        (zone) =>
          zone.l.toLowerCase().includes(query) ||
          zone.v.toLowerCase().includes(query) ||
          (aliasZoneCode && zone.v === aliasZoneCode),
      );
      return {
        ...state,
        zones: matchingZones,
      };
    }).filter((state) => state.zones.length > 0);
  }, [searchQuery]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;

    const stateSections = container.querySelectorAll('.state-group-marker');
    let closestState: string | null = null;
    let minDistance = Infinity;
    
    stateSections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      // Calculate distance from top of container
      const distance = Math.abs(rect.top - containerRect.top);
      // If it's near the top (e.g. within 300px)
      if (distance < minDistance && distance < 300) {
        minDistance = distance;
        closestState = section.getAttribute('data-state');
      }
    });

    if (closestState && closestState !== activeScrollState) {
      setActiveScrollState(closestState);
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setActiveScrollState(null);
    }, 800);
  };

  return (
    <>
      <AnimatePresence>
        {detectReason && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] max-w-[90vw] w-max bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] px-6 py-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--md-sys-color-primary)]/20 flex items-center gap-3 font-semibold text-sm"
          >
            <MapPin
              size={20}
              className="text-[var(--md-sys-color-primary)] animate-pulse"
            />
            <span className="truncate">{detectReason}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(true)}
          className={cn(
            "relative flex-1 max-w-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] hover:bg-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-primary)] rounded-[20px] sm:rounded-[24px] overflow-hidden transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between group shadow-sm border border-[var(--md-sys-color-outline)]/5",
            visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[4px_4px_0px_0px_var(--md-sys-color-on-surface)] hover:shadow-[2px_2px_0px_0px_var(--md-sys-color-on-surface)]",
            visualStyle === 'glass' && "bg-[var(--glass-bg)] backdrop-blur-[8px] border border-[var(--glass-border)]",
            visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border-0"
          )}
        >
          {/* @ts-ignore */}
          <md-ripple></md-ripple>
          <div className="flex items-center w-full min-w-0">
            <div className="w-9 h-9 lg:w-11 lg:h-11 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-[10px] sm:rounded-[12px] flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm mr-3">
              <MapPin size={20} className={cn(
                "lg:w-6 lg:h-6",
                visualStyle === 'retro' && "stroke-[3]",
                (visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[1.5]",
                !(visualStyle === 'retro' || visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[2.5]"
              )} />
            </div>
            <div className="flex flex-col overflow-hidden min-w-0 flex-1 text-left justify-center">
              <span className="text-lg sm:text-xl lg:text-2xl leading-tight font-black tracking-tighter truncate w-full group-hover:text-[var(--md-sys-color-primary)] transition-colors">
                {selectedLabel}
              </span>
              <span className="text-[10px] sm:text-[11px] lg:text-xs font-bold tracking-wide flex items-center gap-1.5 truncate mt-0.5 opacity-80">
                {STATE_FLAGS[selectedState] && (
                  <div className="flex items-center justify-center w-[16px] h-[12px] sm:w-[18px] sm:h-[14px] bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.1)] shrink-0 rounded-[2px]">
                    <img
                      src={STATE_FLAGS[selectedState]}
                      alt=""
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />
                  </div>
                )}
                <span className="truncate">{selectedState}</span>
                <span className="font-mono font-black ml-auto flex-shrink-0 opacity-70">
                  {selectedZone}
                </span>
              </span>
            </div>
          </div>
        </motion.button>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="shrink-0 inline-flex w-[48px] h-[48px] lg:w-[56px] lg:h-[56px]"
        >
          {/* @ts-ignore */}
          <md-filled-tonal-icon-button
            onClick={() => setIsMapOpen(true)}
            title={t("viewMap")}
            style={{ '--md-filled-tonal-icon-button-container-shape': '20px', width: '100%', height: '100%' }}
          >
            <MapIcon className={cn(
              "w-[22px] h-[22px] lg:w-[24px] lg:h-[24px]",
              visualStyle === 'retro' && "stroke-[3]",
              (visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[1.5]",
              !(visualStyle === 'retro' || visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[2.5]"
            )} />
          </md-filled-tonal-icon-button>
        </motion.div>
      </div>

      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        selectedZone={selectedZone}
        userLocation={userCoords}
        onZoneSelect={(zone) => {
          onZoneSelect(zone);
          setIsMapOpen(false);
        }}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 sm:overflow-y-auto"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: "100%" }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: "100%" }}
              transition={M3_MOTION.expressiveSpring}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--md-sys-color-surface)] w-full max-w-2xl h-[85vh] sm:h-[85vh] max-h-[800px] flex flex-col rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden shadow-2xl sm:my-auto"
            >
              <div className="p-6 md:p-8 bg-[var(--md-sys-color-surface)] z-10 shrink-0 border-b border-[var(--md-sys-color-outline)]/5 flex flex-col gap-6">
                <div className="flex items-start justify-between">
                  <div className="pr-4">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--md-sys-color-primary)] leading-none mb-2">
                      {t("selectZone")}
                    </h2>
                    <p className="text-[var(--md-sys-color-on-surface-variant)] text-base font-medium opacity-80">
                      {t("selectZoneDesc")}
                    </p>
                  </div>
                  {/* @ts-ignore */}
                  <md-icon-button onClick={() => setIsOpen(false)}>
                    <md-icon>close</md-icon>
                  </md-icon-button>
                </div>

                <div className="mb-2 w-full bg-[var(--md-sys-color-surface-container)] rounded-[20px] overflow-hidden">
                  {/* @ts-ignore */}
                  <md-tabs active-tab-index={settings.locationMode === 'auto' ? 1 : 0}>
                    {/* @ts-ignore */}
                    <md-primary-tab onClick={() => updateSettings({ locationMode: 'manual' })}>
                      {t('modeManual' as any) || "Manual Selection"}
                      <md-icon slot="icon">search</md-icon>
                    </md-primary-tab>
                    {/* @ts-ignore */}
                    <md-primary-tab onClick={() => {
                      updateSettings({ locationMode: 'auto' });
                      setSearchQuery("");
                    }}>
                      {t('modeAuto' as any) || "Auto Tracking"}
                      <md-icon slot="icon">my_location</md-icon>
                    </md-primary-tab>
                  </md-tabs>
                </div>

                <AnimatePresence mode="wait">
                  {locationPermission === 'denied' && (
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0.95, y: -10 }}
                      animate={{ opacity: 1, scaleY: 1, y: 0 }}
                      exit={{ opacity: 0, scaleY: 0.95, y: -10 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      style={{ transformOrigin: "top" }}
                      className="bg-[var(--md-sys-color-error-container)]/80 text-[var(--md-sys-color-on-error-container)] px-5 py-4 rounded-2xl mb-2 text-sm shadow-sm"
                    >
                      <h4 className="font-bold mb-1">Akses Lokasi Ditolak</h4>
                      <p className="opacity-90 leading-tight">Sila benarkan akses lokasi dalam tetapan pelayar web anda untuk menggunakan ciri kemas kini zon automatik.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {settings.locationMode !== 'auto' && (
                    <motion.div 
                      key="manual-mode"
                      initial={{ opacity: 0, scaleY: 0.95, y: -10 }}
                      animate={{ opacity: 1, scaleY: 1, y: 0 }}
                      exit={{ opacity: 0, scaleY: 0.95, y: -10 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      style={{ transformOrigin: "top", willChange: "transform, opacity" }}
                      className="flex flex-col gap-4"
                    >
                      <div className="relative group w-full mb-2">
                        {/* @ts-ignore */}
                        <md-outlined-text-field
                          type="text"
                          placeholder={t("searchPlaceholder")}
                          value={searchQuery}
                          onInput={(e: any) => setSearchQuery(sanitizeInput(e.target.value))}
                          className="w-full"
                          style={{ 
                            '--md-outlined-text-field-container-shape': '28px',
                            '--md-sys-color-surface-variant': 'var(--md-sys-color-surface-container-high)'
                          } as any}
                        >
                          <md-icon slot="leading-icon">search</md-icon>
                          {searchQuery && (
                            /* @ts-ignore */
                            <md-icon-button
                              slot="trailing-icon"
                              onClick={() => setSearchQuery("")}
                            >
                              <md-icon>close</md-icon>
                            </md-icon-button>
                          )}
                        </md-outlined-text-field>
                      </div>

                      {!searchQuery && (
                        <md-filled-tonal-button
                          onClick={handleAutoDetect}
                          disabled={isDetecting}
                          className="w-full"
                          style={{ '--md-filled-tonal-button-container-height': '48px', '--md-filled-tonal-button-container-shape': '24px' } as any}
                        >
                          <Crosshair
                            size={20}
                            slot="icon"
                            className={isDetecting ? "animate-spin" : ""}
                          />
                          {isDetecting ? t("detecting") : t("detectLocation")}
                        </md-filled-tonal-button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div 
                className="flex-1 overflow-y-auto bg-[var(--md-sys-color-surface)] scroll-smooth custom-scrollbar relative"
                onScroll={handleScroll}
                onTouchMove={() => {
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                }}
              >
                {settings.locationMode === 'auto' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center h-full p-6 text-center"
                  >
                    <div className="w-16 h-16 bg-[var(--md-sys-color-secondary-container)] rounded-full flex items-center justify-center mb-4 text-[var(--md-sys-color-on-secondary-container)]">
                      <Crosshair size={28} className={cn("opacity-80", isAutoDetecting && "animate-spin")} />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] mb-1">
                      {isAutoDetecting ? t("detecting") : (t('autoModeActive' as any) || "Auto Mode Active")}
                    </h3>
                    <p className="text-[var(--md-sys-color-on-surface-variant)] text-sm max-w-[250px] mx-auto mb-8 opacity-80">
                      {isAutoDetecting ? "Memeriksa isyarat GPS..." : (t('autoModeActiveDesc' as any) || "Your zone will update automatically as you travel.")}
                    </p>
                    
                    <div className="bg-[var(--md-sys-color-surface-container)] rounded-[24px] p-5 w-full max-w-xs border border-[var(--md-sys-color-outline)]/5 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--md-sys-color-primary)] mb-1.5 opacity-80">
                        {t('autoModeCurrent' as any) || "Current Detected Location:"}
                      </p>
                      <p className="text-xl font-black leading-tight text-[var(--md-sys-color-on-surface)] mb-1 truncate">
                        {isAutoDetecting ? "Sedang menjejak..." : (currentLocationName || selectedLabel)}
                      </p>
                      <div className="inline-flex bg-[var(--md-sys-color-surface-variant)]/50 px-2 py-0.5 rounded text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] mt-1">
                        {selectedZone}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {/* Recent Zones Section */}
                    {!searchQuery && (() => {
                      const filtered = StorageManager.getRecentZones()
                        .filter((z: string) => z !== selectedZone)
                        .slice(0, 3);
                      if (filtered.length > 0) {
                        return (
                          <div className="px-6 md:px-8 pt-6 pb-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--md-sys-color-on-surface-variant)] mb-4 flex items-center gap-2">
                              <span className="opacity-60">🕐</span>
                              {t('recentLocations' as any) || "Recent Locations"}
                            </h3>
                            {/* @ts-ignore */}
                            <md-list className="bg-transparent overflow-visible flex flex-col gap-2 p-0">
                              {filtered.map((code: string) => {
                                let label = code;
                                let stateName = "";
                                for (const state of JAKIM_ZONES) {
                                  const found = state.zones.find(z => z.v === code);
                                  if (found) { label = found.l; stateName = state.state; break; }
                                }
                                return (
                                  /* @ts-ignore */
                                  <md-list-item
                                    key={`recent-${code}`}
                                    type="button"
                                    onClick={() => {
                                      onZoneSelect(code);
                                      setIsOpen(false);
                                    }}
                                    className="bg-[var(--md-sys-color-surface-container)] rounded-2xl overflow-hidden shadow-sm border border-[var(--md-sys-color-outline)]/5"
                                  >
                                    {STATE_FLAGS[stateName] && (
                                      <div slot="start" className="w-[32px] h-[20px] bg-white overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.1)] shrink-0 rounded-[2px] mr-2">
                                        <img
                                          src={STATE_FLAGS[stateName]}
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                    <div slot="headline" className="font-bold text-sm text-[var(--md-sys-color-on-surface)] truncate">{label}</div>
                                    <div slot="supporting-text" className="text-[10px] opacity-80 truncate">{stateName}</div>
                                    <div slot="end" className="text-[11px] font-mono font-black tracking-wider bg-[var(--md-sys-color-surface-variant)]/50 px-2 py-0.5 rounded-md text-[var(--md-sys-color-on-surface-variant)] shrink-0 opacity-70">
                                      {code}
                                    </div>
                                  </md-list-item>
                                );
                              })}
                            </md-list>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Active Scroll Indicator & List */}
                <AnimatePresence>
                  {activeScrollState && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 20 }}
                      className="fixed top-[40%] left-1/2 -translate-x-1/2 z-[300] pointer-events-none bg-[var(--md-sys-color-surface-container-highest)]/90 backdrop-blur-2xl p-6 rounded-[32px] shadow-[0_16px_32px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center gap-3 border border-white/10"
                    >
                      {STATE_FLAGS[activeScrollState] && (
                        <div className="w-[72px] h-[48px] bg-white rounded-lg overflow-hidden shadow-sm">
                           <img src={STATE_FLAGS[activeScrollState]} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <h3 className="text-xl md:text-2xl font-black text-[var(--md-sys-color-on-surface)] uppercase tracking-widest leading-none">
                        {activeScrollState}
                      </h3>
                    </motion.div>
                  )}
                </AnimatePresence>

                {filteredZones.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center opacity-70 space-y-4 p-4 md:p-6"
                  >
                    <div className="w-16 h-16 rounded-full bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center">
                      <Search
                        size={32}
                        className="text-[var(--md-sys-color-on-surface-variant)]"
                      />
                    </div>
                    <p className="text-[var(--md-sys-color-on-surface-variant)] font-medium text-lg">
                      {t("noMatch")} "{searchQuery}"
                    </p>
                  </motion.div>
                ) : (
                  <div className="pb-12">
                    {filteredZones.map((state) => (
                      <div key={state.state} className="mb-8 state-group-marker" data-state={state.state}>
                        <div className="flex items-center gap-3 sm:gap-4 sticky top-0 md:top-0 z-20 bg-[var(--md-sys-color-surface)]/80 backdrop-blur-xl py-3 px-4 md:px-6 shadow-sm border-b border-[var(--md-sys-color-outline)]/10">
                          <div className="flex items-center justify-center w-[22px] h-[14px] sm:w-[28px] sm:h-[18px] bg-white overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.1)] shrink-0 rounded-[1px]">
                            {STATE_FLAGS[state.state] ? (
                              <img
                                src={STATE_FLAGS[state.state]}
                                alt={`Bendera ${state.state}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <MapPin size={16} className="text-gray-400" />
                            )}
                          </div>
                          <h3 className="text-[var(--md-sys-color-primary)] font-black uppercase tracking-widest text-sm sm:text-base pr-2 inline-block">
                            {state.state}
                          </h3>
                          {/* @ts-ignore */}
                          <md-divider className="flex-1"></md-divider>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 px-4 md:px-6 pt-3">
                          {state.zones.map((zone) => {
                            const isSelected = selectedZone === zone.v;
                            return (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                key={zone.v}
                                onClick={() => {
                                  onZoneSelect(zone.v);
                                  setIsOpen(false);
                                }}
                                className={cn(
                                  "relative overflow-hidden group text-left px-6 py-6 min-h-[120px] rounded-[32px] transition-all duration-300 flex flex-col focus:outline-none focus:ring-[3px] focus:ring-[var(--md-sys-color-primary)]",
                                  isSelected
                                    ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-[0_8px_16px_-6px_rgba(0,0,0,0.2)] scale-[1.02]"
                                    : "bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] hover:shadow-md",
                                )}
                              >
                                {/* @ts-ignore */}
                                <md-ripple></md-ripple>
                                
                                {/* Watermark Background */}
                                <div className={cn(
                                  "absolute -right-2 -bottom-4 text-[5rem] font-black pointer-events-none transition-all duration-500 group-hover:scale-110",
                                  isSelected ? "opacity-[0.15] text-[var(--md-sys-color-on-primary)]" : "opacity-[0.03] text-[var(--md-sys-color-on-surface)]"
                                )}>
                                  {zone.v}
                                </div>

                                <div className="flex items-start justify-between w-full relative z-10 flex-1">
                                  <span
                                    className={cn(
                                      "text-lg sm:text-xl font-bold leading-tight line-clamp-3 pr-2 transition-colors",
                                      isSelected
                                        ? "text-[var(--md-sys-color-on-primary)]"
                                        : "text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)]",
                                    )}
                                  >
                                    {zone.l}
                                  </span>
                                  {isSelected && (
                                    <CheckCircle2
                                      size={28}
                                      className="text-[var(--md-sys-color-on-primary)] shrink-0 opacity-90"
                                      strokeWidth={2.5}
                                    />
                                  )}
                                </div>
                                <span
                                  className={cn(
                                    "text-[13px] font-black tracking-widest px-3 py-1 rounded-full inline-flex self-start mt-4 transition-colors relative z-10",
                                    isSelected
                                      ? "bg-white/20 text-[var(--md-sys-color-on-primary)]"
                                      : "bg-[var(--md-sys-color-surface-variant)]/50 text-[var(--md-sys-color-on-surface-variant)]",
                                  )}
                                >
                                  {zone.v}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </>
              )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
