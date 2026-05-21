import { useEffect, useState, useRef, useCallback } from "react";

/**
 * Extract the state/subdivision name from the geocode API response.
 * The API returns { osm: <nominatim data>, bdc: <bigdatacloud data> }.
 */
function extractStateName(data: any): string {
  // Try BigDataCloud first (more reliable for Malaysia)
  if (data?.bdc?.principalSubdivision) return data.bdc.principalSubdivision;
  if (data?.bdc?.city) return data.bdc.city;
  // Fallback to Nominatim/OSM
  if (data?.osm?.address?.state) return data.osm.address.state;
  if (data?.osm?.address?.city) return data.osm.address.city;
  return "";
}

function extractLocalityName(data: any): string {
  if (data?.bdc?.locality) return data.bdc.locality;
  if (data?.bdc?.city) return data.bdc.city;
  if (data?.osm?.address?.city) return data.osm.address.city;
  if (data?.osm?.address?.town) return data.osm.address.town;
  if (data?.osm?.address?.suburb) return data.osm.address.suburb;
  if (data?.bdc?.principalSubdivision) return data.bdc.principalSubdivision;
  if (data?.osm?.address?.state) return data.osm.address.state;
  return "Kawasan Semasa";
}

function mapStateToZone(stateName: string): string {
  if (!stateName) return "";
  const s = stateName.toLowerCase();
  if (s.includes("johor")) return "JHR02";
  if (s.includes("kedah")) return "KDH01";
  if (s.includes("kelantan")) return "KTN01";
  if (s.includes("melaka") || s.includes("malacca")) return "MLK01";
  if (s.includes("negeri sembilan")) return "NGS02";
  if (s.includes("pahang")) return "PHG02";
  if (s.includes("perak")) return "PRK02";
  if (s.includes("perlis")) return "PLS01";
  if (s.includes("pulau pinang") || s.includes("penang")) return "PNG01";
  if (s.includes("sabah")) return "SBH07";
  if (s.includes("sarawak")) return "SWK08";
  if (s.includes("selangor")) return "SGR01";
  if (s.includes("terengganu")) return "TRG01";
  if (s.includes("kuala lumpur") || s.includes("putrajaya") || s.includes("federal territory")) return "WLY01";
  if (s.includes("labuan")) return "WLY02";
  return "";
}

export function useLocationTracking(
  selectedZone: string,
  setSelectedZone: (zone: string) => void,
  locationMode: 'auto' | 'manual',
) {
  const [promptZone, setPromptZone] = useState<string | null>(null);
  const [promptLocationName, setPromptLocationName] = useState<string | null>(null);
  const [autoUpdatedZone, setAutoUpdatedZone] = useState<string | null>(null);
  const [autoUpdatedLocationName, setAutoUpdatedLocationName] = useState<string | null>(null);
  
  const [currentLocationName, setCurrentLocationName] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const lastCheckTime = useRef<number>(0);
  
  // Use refs for dependencies to prevent infinite re-render loops inside checkLocation
  const selectedZoneRef = useRef(selectedZone);
  const locationModeRef = useRef(locationMode);

  useEffect(() => {
    selectedZoneRef.current = selectedZone;
    locationModeRef.current = locationMode;
  }, [selectedZone, locationMode]);

  const checkLocation = useCallback((force = false) => {
    if (!("geolocation" in navigator)) return;

    const now = Date.now();
    // If not forced, throttle checks to once every 5 minutes
    if (!force && now - lastCheckTime.current < 5 * 60 * 1000) return;
    
    setIsDetecting(true);
    
    // If forcing, bust the GPS cache by setting maximumAge to 0
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        lastCheckTime.current = Date.now();
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `/api/geocode?lat=${latitude}&lng=${longitude}`,
          );
          if (!res.ok) throw new Error();

          const data = await res.json();
          
          // Correctly extract from the nested API response: { osm: {...}, bdc: {...} }
          const stateName = extractStateName(data);
          const locName = extractLocalityName(data);
          
          setCurrentLocationName(locName);

          const foundZone = mapStateToZone(stateName);

          if (foundZone) {
            if (locationModeRef.current === 'auto') {
              // In Auto mode, ALWAYS set the zone to the detected one when forced
              // This ensures switching back to auto always gets a fresh detection
              if (force || foundZone !== selectedZoneRef.current) {
                setSelectedZone(foundZone);
                
                // Show the toast if it was a forced check (user action/load) OR if the zone changed
                setAutoUpdatedZone(foundZone);
                setAutoUpdatedLocationName(locName);
                setTimeout(() => {
                  setAutoUpdatedZone(null);
                  setAutoUpdatedLocationName(null);
                }, 5000);
              }
            } else if (locationModeRef.current === 'manual') {
              if (foundZone !== selectedZoneRef.current) {
                setPromptZone(foundZone);
                setPromptLocationName(locName);
              }
            }
          }
        } catch (err) {
          // Ignore
        } finally {
          setIsDetecting(false);
        }
      },
      () => {
        setIsDetecting(false);
      },
      { timeout: 10000, maximumAge: force ? 0 : 60000 },
    );
  }, [setSelectedZone]);

  // When locationMode changes to 'auto', FORCE a cache-busting check immediately
  // Reset lastCheckTime so the throttle doesn't block this critical detection
  const prevMode = useRef(locationMode);
  useEffect(() => {
    const changedToAuto = prevMode.current !== 'auto' && locationMode === 'auto';
    prevMode.current = locationMode;
    
    if (changedToAuto) {
      // Reset throttle so the forced check always goes through
      lastCheckTime.current = 0;
      checkLocation(true);
    }
  }, [locationMode, checkLocation]);

  // Periodic background checking
  useEffect(() => {
    const intervalId = setInterval(() => checkLocation(false), 5 * 60 * 1000);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When tab becomes visible again, force check if in auto mode
        if (locationModeRef.current === 'auto') {
          checkLocation(true);
        } else {
          checkLocation(false);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initial check on mount — force if in auto mode to always get fresh location
    if (locationModeRef.current === 'auto') {
      lastCheckTime.current = 0;
      checkLocation(true);
    } else {
      checkLocation(false);
    }

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkLocation]);

  const acceptPrompt = () => {
    if (promptZone) {
      setSelectedZone(promptZone);
      setPromptZone(null);
      setPromptLocationName(null);
    }
  };

  const dismissPrompt = () => {
    setPromptZone(null);
    setPromptLocationName(null);
  };

  return { promptZone, promptLocationName, autoUpdatedZone, autoUpdatedLocationName, currentLocationName, isDetecting, acceptPrompt, dismissPrompt };
}
