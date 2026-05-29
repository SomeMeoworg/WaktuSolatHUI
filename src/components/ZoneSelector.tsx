import React, { useState, useRef, useEffect, useMemo } from "react";
import { JAKIM_ZONES } from "../lib/zones";
import { Search, MapPin, X, Crosshair, Map as MapIcon, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";
import { M3_MOTION } from "../lib/motion";
import { motion, AnimatePresence } from "motion/react";
import { useAppContext } from "../AppContext";
import { MapModal } from "./MapModal";
import { useVisualStyle } from "../hooks/useVisualStyle";
import { fetchReverseGeocode, matchZoneFromGeocode, ALIASES } from "../lib/geocoding";
import { analytics } from "../lib/analytics";
import { StorageManager } from "../lib/StorageManager";
import { sanitizeInput } from "../lib/security";
import { Modal, ModalContent, ModalHeader, ModalBody, Tabs, Tab, Input, Button, Divider } from "@heroui/react";

const STATE_FLAGS: Record<string, string> = {
  Johor: "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Johor.svg",
  Kedah: "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Kedah.svg",
  Kelantan: "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Kelantan.svg",
  Melaka: "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Malacca.svg",
  "Negeri Sembilan": "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Negeri_Sembilan.svg",
  Pahang: "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Pahang.svg",
  Perak: "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Perak.svg",
  Perlis: "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Perlis.svg",
  "Pulau Pinang": "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Penang_(Malaysia).svg",
  Sabah: "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Sabah.svg",
  Sarawak: "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Sarawak.svg",
  Selangor: "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Selangor.svg",
  Terengganu: "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Terengganu.svg",
  "Wilayah Persekutuan": "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_the_Federal_Territories.svg",
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

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeScrollState, setActiveScrollState] = useState<string | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setSearchQuery("");
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
      const distance = Math.abs(rect.top - containerRect.top);
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
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] max-w-[90vw] w-max bg-primary-100 text-primary-800 px-6 py-4 rounded-full shadow-lg border border-primary-200 flex items-center gap-3 font-semibold text-sm"
          >
            <MapPin size={20} className="text-primary animate-pulse" />
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
            "relative flex-1 max-w-full bg-content2/80 hover:bg-content3 backdrop-blur-md rounded-[20px] sm:rounded-[24px] overflow-hidden transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between group shadow-sm border border-divider",
            visualStyle === 'retro' && "border-2 border-foreground shadow-[4px_4px_0px_0px_var(--app-foreground)] hover:shadow-[2px_2px_0px_0px_var(--app-foreground)]",
            visualStyle === 'glass' && "bg-white/10 backdrop-blur-lg border border-white/20",
            visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border-0 bg-content1"
          )}
        >
          <div className="flex items-center w-full min-w-0">
            <div className="w-9 h-9 lg:w-11 lg:h-11 bg-primary text-primary-foreground rounded-[10px] sm:rounded-[12px] flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm mr-3">
              <MapPin size={20} className={cn(
                "lg:w-6 lg:h-6",
                visualStyle === 'retro' && "stroke-[3]",
                (visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[1.5]",
                !(visualStyle === 'retro' || visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[2.5]"
              )} />
            </div>
            <div className="flex flex-col overflow-hidden min-w-0 flex-1 text-left justify-center">
              <span className="text-lg sm:text-xl lg:text-2xl leading-tight font-black tracking-tighter truncate w-full text-foreground group-hover:text-primary transition-colors">
                {selectedLabel}
              </span>
              <span className="text-[10px] sm:text-[11px] lg:text-xs font-bold tracking-wide flex items-center gap-1.5 truncate mt-0.5 opacity-80 text-default-600">
                {STATE_FLAGS[selectedState] && (
                  <div className="flex items-center justify-center w-[16px] h-[12px] sm:w-[18px] sm:h-[14px] bg-white overflow-hidden shadow-sm shrink-0 rounded-[2px]">
                    <img src={STATE_FLAGS[selectedState]} alt="" className="w-full h-full object-cover select-none pointer-events-none" />
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
          <Button
            isIconOnly
            variant="flat"
            color="primary"
            className="w-full h-full rounded-[20px]"
            onClick={() => setIsMapOpen(true)}
            title={t("viewMap")}
          >
            <MapIcon className={cn(
              "w-[22px] h-[22px] lg:w-[24px] lg:h-[24px]",
              visualStyle === 'retro' && "stroke-[3]",
              (visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[1.5]",
              !(visualStyle === 'retro' || visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[2.5]"
            )} />
          </Button>
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

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        size="4xl"
        scrollBehavior="inside"
        placement="center"
        backdrop="blur"
        classNames={{
          base: "bg-content1 rounded-[2.5rem] shadow-2xl h-[90vh] sm:h-[85vh] m-2 sm:m-0",
          header: "border-b border-divider p-6 md:p-8 flex-col items-start gap-4",
          body: "p-0 bg-content2/30",
          closeButton: "top-6 right-6 hover:bg-content3"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="pr-4">
                  <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-primary leading-none mb-2">
                    {t("selectZone")}
                  </h2>
                  <p className="text-default-500 text-base font-medium">
                    {t("selectZoneDesc")}
                  </p>
                </div>

                <div className="w-full bg-content2 rounded-[20px] p-1 mt-4">
                  <Tabs 
                    fullWidth 
                    size="md" 
                    radius="lg"
                    selectedKey={settings.locationMode}
                    onSelectionChange={(key) => {
                      updateSettings({ locationMode: key as any });
                      if (key === 'auto') setSearchQuery("");
                    }}
                    classNames={{
                      tabList: "bg-transparent",
                      cursor: "bg-background shadow-sm",
                      tab: "h-10",
                      tabContent: "group-data-[selected=true]:text-primary font-bold"
                    }}
                  >
                    <Tab key="manual" title={
                      <div className="flex items-center gap-2">
                        <Search size={16} />
                        <span>{t('modeManual' as any) || "Manual Selection"}</span>
                      </div>
                    } />
                    <Tab key="auto" title={
                      <div className="flex items-center gap-2">
                        <Crosshair size={16} />
                        <span>{t('modeAuto' as any) || "Auto Tracking"}</span>
                      </div>
                    } />
                  </Tabs>
                </div>

                {locationPermission === 'denied' && (
                  <div className="w-full bg-danger-50 text-danger-900 px-5 py-4 rounded-2xl text-sm shadow-sm mt-4 border border-danger-200">
                    <h4 className="font-bold mb-1">Akses Lokasi Ditolak</h4>
                    <p className="opacity-90 leading-tight">Sila benarkan akses lokasi dalam tetapan pelayar web anda untuk menggunakan ciri kemas kini zon automatik.</p>
                  </div>
                )}

                {settings.locationMode !== 'auto' && (
                  <div className="w-full flex flex-col gap-3 mt-4">
                    <Input
                      type="text"
                      placeholder={t("searchPlaceholder" as any)}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
                      variant="bordered"
                      radius="xl"
                      size="lg"
                      classNames={{ inputWrapper: "bg-content1 shadow-sm border-divider hover:border-primary", input: "text-base font-semibold" }}
                      startContent={<Search size={18} className="text-default-400" />}
                      endContent={searchQuery ? (
                        <Button isIconOnly variant="light" size="sm" radius="full" onClick={() => setSearchQuery("")}>
                          <X size={16} className="text-default-400" />
                        </Button>
                      ) : null}
                    />

                    {!searchQuery && (
                      <Button
                        color="primary"
                        variant="flat"
                        size="lg"
                        radius="xl"
                        className="w-full font-bold shadow-sm"
                        isLoading={isDetecting}
                        onClick={handleAutoDetect}
                        startContent={!isDetecting && <Crosshair size={20} />}
                      >
                        {isDetecting ? t("detecting") : t("detectLocation")}
                      </Button>
                    )}
                  </div>
                )}
              </ModalHeader>

              <ModalBody onScroll={handleScroll} className="custom-scrollbar relative">
                {settings.locationMode === 'auto' ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center min-h-[400px]">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                      <Crosshair size={32} className={cn(isAutoDetecting && "animate-spin")} />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {isAutoDetecting ? t("detecting") : (t('autoModeActive' as any) || "Auto Mode Active")}
                    </h3>
                    <p className="text-default-500 text-sm max-w-[280px] mx-auto mb-8">
                      {isAutoDetecting ? "Memeriksa isyarat GPS..." : (t('autoModeActiveDesc' as any) || "Your zone will update automatically as you travel.")}
                    </p>
                    
                    <div className="bg-content1 rounded-[24px] p-6 w-full max-w-sm border border-divider shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 opacity-80">
                        {t('autoModeCurrent' as any) || "Current Detected Location:"}
                      </p>
                      <p className="text-2xl font-black leading-tight text-foreground mb-2 truncate">
                        {isAutoDetecting ? "Sedang menjejak..." : (currentLocationName || selectedLabel)}
                      </p>
                      <div className="inline-flex bg-default-100 px-3 py-1 rounded-lg text-sm font-mono font-bold text-default-600">
                        {selectedZone}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pb-12">
                    {/* Recent Zones Section */}
                    {!searchQuery && (() => {
                      const filtered = StorageManager.getRecentZones()
                        .filter((z: string) => z !== selectedZone)
                        .slice(0, 3);
                      if (filtered.length > 0) {
                        return (
                          <div className="px-6 md:px-8 pt-6 pb-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-default-500 mb-4 flex items-center gap-2">
                              <span className="opacity-60">🕐</span>
                              {t('recentLocations' as any) || "Recent Locations"}
                            </h3>
                            <div className="flex flex-col gap-2">
                              {filtered.map((code: string) => {
                                let label = code;
                                let stateName = "";
                                for (const state of JAKIM_ZONES) {
                                  const found = state.zones.find(z => z.v === code);
                                  if (found) { label = found.l; stateName = state.state; break; }
                                }
                                return (
                                  <Button
                                    key={code}
                                    variant="flat"
                                    className="w-full justify-start h-auto py-3 px-4 bg-content1 hover:bg-content2 border border-divider shadow-sm"
                                    onClick={() => {
                                      onZoneSelect(code);
                                      setIsOpen(false);
                                    }}
                                  >
                                    {STATE_FLAGS[stateName] && (
                                      <div className="w-8 h-5 bg-white overflow-hidden shadow-sm shrink-0 rounded-sm mr-2">
                                        <img src={STATE_FLAGS[stateName]} alt="" className="w-full h-full object-cover" />
                                      </div>
                                    )}
                                    <div className="flex flex-col items-start flex-1 overflow-hidden">
                                      <span className="font-bold text-sm text-foreground truncate w-full text-left">{label}</span>
                                      <span className="text-[10px] text-default-500 truncate w-full text-left">{stateName}</span>
                                    </div>
                                    <div className="text-[11px] font-mono font-black tracking-wider bg-default-100 px-2 py-0.5 rounded-md text-default-600 shrink-0">
                                      {code}
                                    </div>
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Active Scroll Indicator */}
                    <AnimatePresence>
                      {activeScrollState && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: -20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: 20 }}
                          className="fixed top-[40%] left-1/2 -translate-x-1/2 z-[300] pointer-events-none bg-content1/90 backdrop-blur-2xl p-6 rounded-[32px] shadow-2xl flex flex-col items-center justify-center gap-3 border border-white/10"
                        >
                          {STATE_FLAGS[activeScrollState] && (
                            <div className="w-[72px] h-[48px] bg-white rounded-lg overflow-hidden shadow-sm">
                               <img src={STATE_FLAGS[activeScrollState]} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <h3 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-widest leading-none">
                            {activeScrollState}
                          </h3>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {filteredZones.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-full flex flex-col items-center justify-center opacity-70 space-y-4 p-8 min-h-[300px]"
                      >
                        <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center">
                          <Search size={32} className="text-default-400" />
                        </div>
                        <p className="text-default-500 font-medium text-lg">
                          {t("noMatch")} "{searchQuery}"
                        </p>
                      </motion.div>
                    ) : (
                      <div className="pt-4">
                        {filteredZones.map((state) => (
                          <div key={state.state} className="mb-8 state-group-marker" data-state={state.state}>
                            <div className="flex items-center gap-3 sm:gap-4 sticky top-0 z-20 bg-content2/80 backdrop-blur-xl py-3 px-6 shadow-sm border-y border-divider">
                              <div className="flex items-center justify-center w-[28px] h-[18px] bg-white overflow-hidden shadow-sm shrink-0 rounded-[2px]">
                                {STATE_FLAGS[state.state] ? (
                                  <img src={STATE_FLAGS[state.state]} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <MapPin size={16} className="text-gray-400" />
                                )}
                              </div>
                              <h3 className="text-primary font-black uppercase tracking-widest text-sm sm:text-base pr-2 inline-block">
                                {state.state}
                              </h3>
                              <Divider className="flex-1" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-6 pt-4">
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
                                      "relative overflow-hidden group text-left px-6 py-6 min-h-[120px] rounded-[24px] transition-all duration-300 flex flex-col focus:outline-none focus:ring-2 focus:ring-primary border",
                                      isSelected
                                        ? "bg-primary text-primary-foreground shadow-md border-transparent scale-[1.02]"
                                        : "bg-content1 hover:bg-content2 text-foreground border-divider hover:shadow-sm"
                                    )}
                                  >
                                    <div className={cn(
                                      "absolute -right-2 -bottom-4 text-[5rem] font-black pointer-events-none transition-all duration-500 group-hover:scale-110",
                                      isSelected ? "opacity-[0.15] text-primary-foreground" : "opacity-[0.03] text-foreground"
                                    )}>
                                      {zone.v}
                                    </div>
                                    <div className="flex items-start justify-between w-full relative z-10 flex-1">
                                      <span className={cn(
                                          "text-lg sm:text-xl font-bold leading-tight line-clamp-3 pr-2 transition-colors",
                                          isSelected ? "text-primary-foreground" : "text-foreground group-hover:text-primary"
                                        )}
                                      >
                                        {zone.l}
                                      </span>
                                      {isSelected && (
                                        <CheckCircle2 size={28} className="text-primary-foreground shrink-0 opacity-90" strokeWidth={2.5} />
                                      )}
                                    </div>
                                    <span className={cn(
                                        "text-[13px] font-black tracking-widest px-3 py-1 rounded-full inline-flex self-start mt-4 transition-colors relative z-10",
                                        isSelected ? "bg-white/20 text-primary-foreground" : "bg-default-100 text-default-600"
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
                  </div>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
