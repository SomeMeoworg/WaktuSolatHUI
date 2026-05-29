import { Button } from "@heroui/react";
import { useEffect, useState, useRef } from "react";
import { X, Navigation, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from "react-leaflet";
import type { FeatureCollection, Geometry, Feature } from "geojson";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { cn } from "../lib/utils";
import { M3_MOTION } from "../lib/motion";
import { useAppContext } from "../AppContext";
import { JAKIM_ZONES } from "../lib/zones";
import { ZONE_COORDINATES } from "../lib/zoneCoordinates";
// Fix for leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    const tid = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(tid);
  }, [center, zoom, map]);
  return null;
}

export function MapModal({
  isOpen,
  onClose,
  selectedZone,
  userLocation,
  onZoneSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedZone: string;
  userLocation: { lat: number; lng: number } | null;
  onZoneSelect?: (zone: string) => void;
}) {
  const { t } = useAppContext();
  const [center, setCenter] = useState<[number, number]>([4.2105, 101.9758]); // Malaysia center
  const [zoom, setZoom] = useState(6);
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON>(null);
  const mapRef = useRef<L.Map>(null);

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isOpen && !geoData) {
      fetch('/malaysia-jakim.geojson')
        .then(res => res.json())
        .then(data => setGeoData(data))
        .catch(err => console.error("Failed to load geojson", err));
    }
  }, [isOpen, geoData]);

  useEffect(() => {
    if (isOpen) {
      if (ZONE_COORDINATES[selectedZone]) {
        setCenter(ZONE_COORDINATES[selectedZone]);
        setZoom(9);
      } else if (userLocation) {
        setCenter([userLocation.lat, userLocation.lng]);
        setZoom(10);
      } else {
        setCenter([4.2105, 101.9758]); // Default Malaysia
        setZoom(6);
      }
    }
  }, [selectedZone, userLocation, isOpen]);

  // Once geoData loads and we have a selectedZone, we can zoom to its exact polygon bounds
  useEffect(() => {
    if (isOpen && geoData && geoJsonLayerRef.current && mapRef.current) {
      const layer = geoJsonLayerRef.current;
      layer.eachLayer((l: any) => {
        if (l.feature?.properties?.jakim_code === selectedZone) {
          mapRef.current?.fitBounds(l.getBounds(), { padding: [50, 50], maxZoom: 10 });
        }
      });
    }
  }, [geoData, selectedZone, isOpen]);

  let zoneLabel = "";
  for (const state of JAKIM_ZONES) {
    const found = state.zones.find((z) => z.v === selectedZone);
    if (found) {
      zoneLabel = found.l;
      break;
    }
  }

  const onEachFeature = (feature: Feature<Geometry, any>, layer: L.Layer) => {
    const jakimCode = feature.properties?.jakim_code;
    const isSelected = selectedZone === jakimCode;

    // Find full zone name
    let zoneName = feature.properties?.name || jakimCode;
    let stateName = "";
    for (const state of JAKIM_ZONES) {
      const found = state.zones.find(z => z.v === jakimCode);
      if (found) {
        zoneName = found.l;
        stateName = state.state;
        break;
      }
    }

    layer.on({
      click: (e) => {
        if (onZoneSelect && jakimCode) {
          onZoneSelect(jakimCode);
          // Optional: automatically fit bounds on click
          // const map = mapRef.current;
          // if (map) map.fitBounds((e.target as L.Polygon).getBounds(), { padding: [50, 50], maxZoom: 10 });
        }
      },
      mouseover: (e) => {
        const target = e.target;
        if (!isSelected) {
          target.setStyle({
            fillOpacity: 0.4,
            fillColor: 'var(--app-secondary-container, hsl(var(--heroui-secondary) / 0.15))',
            weight: 2,
            color: 'var(--app-secondary)'
          });
          target.bringToFront();
        }
      },
      mouseout: (e) => {
        const target = e.target;
        if (!isSelected) {
          geoJsonLayerRef.current?.resetStyle(target);
        }
      }
    });

    if (jakimCode) {
      layer.bindTooltip(`
        <div class="font-sans max-w-[220px] text-center p-1">
          <strong class="text-base block mb-1 text-primary">${zoneName}</strong>
          <span class="text-xs font-mono font-bold block text-[var(--app-outline)] opacity-90">${jakimCode} - ${stateName}</span>
          ${!isSelected ? `<span class="text-[10px] text-[var(--app-outline)] uppercase mt-2 block opacity-70 border-t border-divider pt-1">Click to select</span>` : ''}
        </div>
      `, { direction: 'top', sticky: true, className: 'custom-hui-tooltip border-none shadow-xl rounded-xl overflow-hidden' });
    }
  };

  const styleFeature = (feature: any) => {
    const isSelected = selectedZone === feature.properties?.jakim_code;
    
    return {
      color: isSelected ? 'var(--app-primary)' : 'var(--app-outline)',
      fillColor: isSelected ? 'var(--app-primary)' : 'var(--app-foreground)',
      weight: isSelected ? 5 : 1.5,
      opacity: isSelected ? 1 : 0.6,
      fillOpacity: isSelected ? 0.4 : 0.1,
      dashArray: isSelected ? undefined : ''
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/80 sm:overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: "100%" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: "100%" }}
            transition={M3_MOTION.expressiveSpring}
            onAnimationComplete={() => window.dispatchEvent(new Event('resize'))}
            className="w-full max-w-6xl bg-content1 rounded-[var(--shape-xl)] shadow-2xl overflow-hidden flex flex-col h-[90dvh] sm:my-auto"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 md:p-8 border-b border-divider shrink-0 gap-4 bg-content1">
              <div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-primary mb-1">
                  {t('mapView')}
                </h2>
                <div className="flex items-center gap-2 text-[var(--app-outline)]">
                  <MapPin size={16} className="shrink-0" />
                  <p className="text-base font-bold truncate max-w-[300px] md:max-w-none">{zoneLabel || selectedZone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                {userLocation && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" 
                      onClick={() => {
                        if (mapRef.current) {
                          mapRef.current.setView([userLocation.lat, userLocation.lng], 12);
                        }
                      }}
                      
                    >
                      <Navigation size={18} />
                      {t('yourLocation')}
                    </Button>
                  </motion.div>
                )}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-12 h-12 flex items-center justify-center rounded-full text-foreground bg-content3 hover:bg-[var(--app-danger-container, hsl(var(--heroui-danger) / 0.15))] hover:text-[var(--app-danger)] shrink-0 shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-danger)]"
                >
                  <X size={24} className="stroke-[3]" />
                </motion.button>
              </div>
            </div>
            
            <div className="flex-1 w-full relative shrink-0 bg-content1">
              {/* Floating Selection Indicator */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] pointer-events-none w-[90%] max-w-sm">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedZone}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={M3_MOTION.expressiveSpring}
                    className="bg-primary shadow-[0_16px_32px_rgba(0,0,0,0.3)] rounded-3xl p-5 flex flex-col items-center justify-center text-center overflow-hidden"
                  >
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-primary-foreground opacity-90 mb-1">
                      {t('selectedZone' as any)}
                    </span>
                    <span className="text-xl sm:text-3xl font-black text-primary-foreground leading-tight drop-shadow-sm truncate w-full px-2">
                      {zoneLabel || selectedZone}
                    </span>
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                      <MapPin size={80} className="text-primary-foreground" />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {!geoData && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-content1/50 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-[var(--app-primary)] rounded-full animate-spin"></div>
                    <span className="font-bold text-primary animate-pulse tracking-widest uppercase">Loading Boundaries...</span>
                  </div>
                </div>
              )}
              
              <MapContainer 
                center={center} 
                zoom={zoom} 
                style={{ width: '100%', height: '100%', minHeight: '400px' }}
                ref={mapRef}
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"}
                />
                
                {userLocation && (
                  <Marker position={[userLocation.lat, userLocation.lng]}>
                    <Popup className="font-bold text-lg">{t('yourLocation')}</Popup>
                  </Marker>
                )}

                {geoData && (
                  <GeoJSON 
                    data={geoData} 
                    style={styleFeature}
                    onEachFeature={onEachFeature}
                    ref={geoJsonLayerRef}
                  />
                )}
                <MapUpdater center={center} zoom={zoom} />
              </MapContainer>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
