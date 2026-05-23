import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Send,
  ChevronDown,
  Link2,
  ExternalLink,
  Search,
  Download,
  QrCode,
  Sparkles,
  Image as ImageIcon,
  Clock,
  MapPin,
  Calendar,
} from "lucide-react";
import { cn } from "../lib/utils";
import { JAKIM_ZONES } from "../lib/zones";
import { useAppContext } from "../AppContext";
import { getHijriFormatted } from "../lib/holidays";
import { useVisualStyle, useIconStroke } from "../hooks/useVisualStyle";
import { QRCode } from "../lib/qr";

interface SharePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentZone: string;
  currentZoneData: any; // Today's prayer data to avoid refetching
}

function getZoneLabel(zoneCode: string): string {
  for (const state of JAKIM_ZONES) {
    for (const z of state.zones) {
      if (z.v === zoneCode) return z.l;
    }
  }
  return zoneCode;
}

function getStateLabel(zoneCode: string): string {
  for (const state of JAKIM_ZONES) {
    for (const z of state.zones) {
      if (z.v === zoneCode) return state.state;
    }
  }
  return "";
}

function buildShareUrl(zone: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}?zone=${zone}`;
}

export function SharePanel({ isOpen, onClose, currentZone, currentZoneData }: SharePanelProps) {
  const { t, settings } = useAppContext();
  const isMalay = settings.language === "ms";
  const visualStyle = useVisualStyle();
  const iconStroke = useIconStroke();

  const [shareZone, setShareZone] = useState(currentZone);
  const [copied, setCopied] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"link" | "image" | "qr">("link");

  // Dynamic schedule fetching state for selected sharing zone
  const [fetchedData, setFetchedData] = useState<any[] | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Sync share zone to current zone when opening/changing
  useEffect(() => {
    if (isOpen) {
      setShareZone(currentZone);
      setActiveTab("link");
      setSearchQuery("");
      setShowZonePicker(false);
    }
  }, [isOpen, currentZone]);

  // Fetch zone schedules dynamically when shareZone changes
  useEffect(() => {
    if (!isOpen) return;
    if (shareZone === currentZone) {
      setFetchedData(null);
      return;
    }

    let active = true;
    const fetchZoneData = async () => {
      setLoadingData(true);
      try {
        // Attempt load from IndexedDB cache fallback first
        const cacheName = `waktu-solat-data-${shareZone}`;
        const cached = localStorage.getItem(cacheName);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (active && parsed && parsed.length > 0) {
            setFetchedData(parsed);
            setLoadingData(false);
            return;
          }
        }

        const res = await fetch(`/api/solat/${shareZone}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (active && data && data.prayerTime) {
          setFetchedData(data.prayerTime);
          localStorage.setItem(cacheName, JSON.stringify(data.prayerTime));
        }
      } catch (err) {
        console.error("Failed to load preview zone data:", err);
      } finally {
        if (active) setLoadingData(false);
      }
    };

    fetchZoneData();
    return () => {
      active = false;
    };
  }, [shareZone, currentZone, isOpen]);

  // Calculate matching date strings
  const todayFormatted = useMemo(() => {
    const d = new Date();
    // JAKIM date format: 'dd-MMM-yyyy' (e.g. '23-May-2026')
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }, []);

  // Compute active preview data
  const previewTodayData = useMemo(() => {
    if (shareZone === currentZone) {
      return currentZoneData;
    }
    if (!fetchedData) return null;
    return fetchedData.find((d: any) => d.date === todayFormatted) || fetchedData[0] || null;
  }, [shareZone, currentZone, currentZoneData, fetchedData, todayFormatted]);

  const shareUrl = useMemo(() => buildShareUrl(shareZone), [shareZone]);
  const shareTitle = isMalay
    ? `Waktu Solat ${shareZone} — ${getZoneLabel(shareZone)}`
    : `Prayer Times ${shareZone} — ${getZoneLabel(shareZone)}`;
  const shareText = isMalay
    ? `Lihat waktu solat terkini untuk ${getZoneLabel(shareZone)} di AlurWaktu.`
    : `Check the latest prayer times for ${getZoneLabel(shareZone)} on AlurWaktu.`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const handleTelegram = () => {
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  };

  // Canvas-based Postcard image drawing pipeline (crisp, vector-sharp offline drawing)
  const drawPostcard = async (): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not construct 2D context");

    const width = 800;
    const height = 1000;
    const scale = 2; // High-DPI upscale

    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    // Grab theme colors from variables dynamically
    let primaryColor = "#006C54";
    let surfaceColor = "#1a1c1e";
    let onSurfaceColor = "#ffffff";
    let accentColor = "#e0e0e0";
    
    if (typeof window !== "undefined") {
      const style = window.getComputedStyle(document.documentElement);
      primaryColor = style.getPropertyValue("--md-sys-color-primary").trim() || primaryColor;
      surfaceColor = style.getPropertyValue("--md-sys-color-surface-container").trim() || surfaceColor;
      onSurfaceColor = style.getPropertyValue("--md-sys-color-on-surface").trim() || onSurfaceColor;
      accentColor = style.getPropertyValue("--md-sys-color-on-surface-variant").trim() || accentColor;
    }

    // 1. Premium Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, primaryColor);
    bgGrad.addColorStop(0.35, primaryColor);
    bgGrad.addColorStop(0.7, surfaceColor);
    bgGrad.addColorStop(1, "#0a0a0b");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative Islamic grid dots
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    for (let x = 30; x < width; x += 40) {
      for (let y = 30; y < height; y += 40) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Premium glowing abstract overlays
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    ctx.beginPath();
    ctx.arc(width / 2, height + 200, 600, 0, Math.PI * 2);
    ctx.fill();

    // 2. Branding Header
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "bold 13px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.letterSpacing = "6px";
    ctx.fillText("ALURWAKTU", width / 2, 60);

    // Emblem Star drawing (simple decorative geometric symbol)
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    const emblemX = width / 2;
    const emblemY = 90;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const radius = i % 2 === 0 ? 8 : 4;
      ctx.lineTo(emblemX + Math.cos(angle) * radius, emblemY + Math.sin(angle) * radius);
    }
    ctx.closePath();
    ctx.fill();

    // 3. Zone details
    const zoneName = getZoneLabel(shareZone);
    const stateName = getStateLabel(shareZone);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 36px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText(shareZone, width / 2, 160);

    // Capsule background for Zone Label
    ctx.font = "bold 16px 'Plus Jakarta Sans', system-ui, sans-serif";
    const labelWidth = ctx.measureText(zoneName).width + 30;
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.beginPath();
    ctx.roundRect(width / 2 - labelWidth / 2, 185, labelWidth, 34, 17);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.fillText(zoneName, width / 2, 208);

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "bold 13px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText(stateName.toUpperCase(), width / 2, 245);

    // 4. Dates Section
    const gregDateStr = new Date().toLocaleDateString(isMalay ? "ms-MY" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const rawHijri = previewTodayData?.hijri || "";
    const hijriDateStr = getHijriFormatted(rawHijri, "text", settings.language as any);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText(gregDateStr, width / 2, 305);

    if (hijriDateStr) {
      ctx.fillStyle = "#FFD700"; // Rich gold text
      ctx.font = "bold 15px 'Plus Jakarta Sans', system-ui, sans-serif";
      ctx.fillText(hijriDateStr, width / 2, 332);
    }

    // 5. Schedule Table Border Capsule
    const tableY = 380;
    const tableWidth = 600;
    const tableHeight = 490;
    const tableX = width / 2 - tableWidth / 2;

    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.roundRect(tableX, tableY, tableWidth, tableHeight, 28);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.stroke();

    // 6. Prayer times mapping
    const rawKeys = ["imsak", "fajr", "syuruk", "dhuhr", "asr", "maghrib", "isha"];
    const activeKeys = rawKeys.filter((k) => k !== "imsak" && k !== "syuruk" || settings.trackImsak);
    const rowHeight = tableHeight / activeKeys.length;

    activeKeys.forEach((key, idx) => {
      const rowY = tableY + idx * rowHeight;
      
      // Zebra row backgrounds
      if (idx % 2 === 1) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
        ctx.beginPath();
        ctx.roundRect(tableX + 10, rowY + 5, tableWidth - 20, rowHeight - 10, 16);
        ctx.fill();
      }

      // Draw prayer icon placeholder (clean decorative circle/symbols)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1.5;
      const iconX = tableX + 35;
      const iconY = rowY + rowHeight / 2;

      ctx.beginPath();
      if (key === "fajr" || key === "maghrib") {
        // Horizon rising/setting sun
        ctx.arc(iconX, iconY + 2, 6, Math.PI, 0);
        ctx.moveTo(iconX - 10, iconY + 2);
        ctx.lineTo(iconX + 10, iconY + 2);
        ctx.stroke();
      } else if (key === "dhuhr" || key === "syuruk") {
        // Radiant sun
        ctx.arc(iconX, iconY, 6, 0, Math.PI * 2);
        ctx.stroke();
      } else if (key === "asr") {
        // Compass symbol
        ctx.arc(iconX, iconY, 7, 0, Math.PI * 2);
        ctx.moveTo(iconX, iconY - 7);
        ctx.lineTo(iconX, iconY + 7);
        ctx.moveTo(iconX - 7, iconY);
        ctx.lineTo(iconX + 7, iconY);
        ctx.stroke();
      } else if (key === "isha" || key === "imsak") {
        // Crescent moon
        ctx.arc(iconX - 2, iconY, 6, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
      } else {
        ctx.arc(iconX, iconY, 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw labels
      const rawTime = previewTodayData ? previewTodayData[key] : "--:--";
      let formattedTime = rawTime;
      if (rawTime && rawTime !== "--:--") {
        try {
          const [hStr, mStr] = rawTime.split(":");
          const hr = parseInt(hStr, 10);
          if (settings.timeFormat === "12h") {
            const period = hr >= 12 ? "PM" : "AM";
            const displayHr = hr % 12 === 0 ? 12 : hr % 12;
            formattedTime = `${String(displayHr).padStart(2, "0")}:${mStr} ${period}`;
          } else {
            formattedTime = `${hStr}:${mStr}`;
          }
        } catch {
          formattedTime = rawTime;
        }
      }

      const pLabel = isMalay ? t(key as any) : key.charAt(0).toUpperCase() + key.slice(1);

      // Name Text
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 17px 'Plus Jakarta Sans', system-ui, sans-serif";
      ctx.fillText(pLabel, tableX + 65, rowY + rowHeight / 2 + 6);

      // Time Text
      ctx.textAlign = "right";
      ctx.fillStyle = key === "fajr" || key === "maghrib" ? "#ffffff" : "rgba(255, 255, 255, 0.95)";
      ctx.font = "900 19px 'JetBrains Mono', monospace, sans-serif";
      ctx.fillText(formattedTime, tableX + tableWidth - 35, rowY + rowHeight / 2 + 6);
    });

    // 7. Footer
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "medium 11px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText("Jadual dijana secara automatik. Sila layari alurwaktu.pages.dev", width / 2, 920);

    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.font = "bold 10px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.letterSpacing = "1px";
    ctx.fillText("OFFLINE COMPATIBLE • BUILT BY ANTIGRAVITY AI", width / 2, 942);

    return canvas;
  };

  const handleDownloadImage = async () => {
    try {
      const canvas = await drawPostcard();
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `AlurWaktu_Share_${shareZone}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Postcard download failed:", err);
    }
  };

  const handleSystemShare = async () => {
    // Native sharing API with support for sharing raw generated image files!
    if (navigator.share) {
      try {
        if (navigator.canShare && activeTab === "image") {
          const canvas = await drawPostcard();
          canvas.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], `AlurWaktu_${shareZone}.png`, { type: "image/png" });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: shareTitle,
                text: shareText,
              });
            } else {
              // Fallback to text link share
              await navigator.share({
                title: shareTitle,
                text: shareText,
                url: shareUrl,
              });
            }
          });
        } else {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl,
          });
        }
      } catch {
        // Cancelled
      }
    }
  };

  // Dynamic searchable zone picker calculations
  const filteredZones = useMemo(() => {
    if (!searchQuery.trim()) {
      return JAKIM_ZONES;
    }
    const q = searchQuery.toLowerCase();
    return JAKIM_ZONES.map((state) => {
      const matched = state.zones.filter(
        (z) =>
          z.v.toLowerCase().includes(q) ||
          z.l.toLowerCase().includes(q) ||
          state.state.toLowerCase().includes(q)
      );
      return {
        ...state,
        zones: matched,
      };
    }).filter((state) => state.zones.length > 0);
  }, [searchQuery]);

  // Generate offline QR code matrix using our custom class
  const qrMatrix = useMemo(() => {
    if (activeTab !== "qr") return null;
    try {
      const qr = new QRCode(shareUrl);
      return qr.getModules();
    } catch (e) {
      console.error("QR Code calculation error:", e);
      return null;
    }
  }, [shareUrl, activeTab]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
          style={{ isolation: "isolate" }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

          {/* Modal Container */}
          <motion.div
            initial={{ y: 200, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 150, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 30, stiffness: 380 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative bg-[var(--md-sys-color-surface-container)] w-full sm:max-w-xl rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl shadow-black/60 flex flex-col max-h-[92vh] sm:max-h-[85vh] transition-all",
              visualStyle === "retro" && "border-[3px] border-[var(--md-sys-color-on-surface)] shadow-[8px_8px_0px_0px_var(--md-sys-color-on-surface)]",
              visualStyle === "glass" && "bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)]",
              visualStyle === "soft" && "shadow-[var(--soft-shadow-heavy)] rounded-t-[40px] sm:rounded-[40px] border border-white/5"
            )}
          >
            {/* Mobile drag handle bar */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1.5 rounded-full bg-[var(--md-sys-color-outline)]/20" />
            </div>

            {/* Premium Header */}
            <div className="flex items-center justify-between px-6 pt-3 pb-2 sm:pt-6 sm:pb-3 border-b border-[var(--md-sys-color-outline)]/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary)]/10 flex items-center justify-center relative overflow-hidden group">
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  >
                    <Share2 size={20} className="text-[var(--md-sys-color-primary)] relative z-10" />
                  </motion.div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-[var(--md-sys-color-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-[var(--md-sys-color-on-surface)]">
                    {isMalay ? "Kongsi Waktu Solat" : "Share Prayer Times"}
                  </h3>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-bold">
                    {isMalay ? "ALURWAKTU KONGSI" : "ALURWAKTU SHARING"}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-error-container)] hover:text-[var(--md-sys-color-on-error-container)] transition-all cursor-pointer"
              >
                <X size={18} strokeWidth={iconStroke} />
              </motion.button>
            </div>

            {/* Searchable Zone Selector (Fixed above contents) */}
            <div className="px-6 py-3 border-b border-[var(--md-sys-color-outline)]/8 bg-[var(--md-sys-color-surface-container-low)] shrink-0">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-[10px] uppercase tracking-widest font-black text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
                  <MapPin size={12} className="text-[var(--md-sys-color-primary)]" />
                  {isMalay ? "Pilih Zon Kongsi" : "Select Share Zone"}
                </span>
                {shareZone !== currentZone && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setShareZone(currentZone)}
                    className="text-[10px] font-black text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-primary)] uppercase tracking-wide cursor-pointer transition-colors"
                  >
                    {isMalay ? "Set Semula Asal" : "Reset Default"}
                  </motion.button>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowZonePicker(!showZonePicker)}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-[var(--md-sys-color-surface)] ring-1 ring-[var(--md-sys-color-outline)]/12 text-left transition-all hover:ring-[var(--md-sys-color-primary)]/40 shadow-sm cursor-pointer",
                  visualStyle === "retro" && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[2px_2px_0px_0px_var(--md-sys-color-on-surface)] ring-0 rounded-none",
                  visualStyle === "soft" && "rounded-2xl"
                )}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-black text-sm text-[var(--md-sys-color-primary)]">
                    {shareZone}
                  </span>
                  <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] ml-3 truncate">
                    {getZoneLabel(shareZone)} ({getStateLabel(shareZone)})
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  strokeWidth={iconStroke}
                  className={cn(
                    "text-[var(--md-sys-color-outline)] transition-transform duration-300",
                    showZonePicker && "rotate-180"
                  )}
                />
              </motion.button>

              {/* Collapsible Searchable Dropdown */}
              <AnimatePresence>
                {showZonePicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="max-h-[300px] sm:max-h-[240px] flex flex-col mt-2 rounded-2xl bg-[var(--md-sys-color-surface)] ring-1 ring-[var(--md-sys-color-outline)]/12 shadow-xl overflow-hidden">
                      {/* Search Bar */}
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--md-sys-color-outline)]/10 bg-[var(--md-sys-color-surface-container-low)]">
                        <Search size={16} className="text-[var(--md-sys-color-outline)]" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={isMalay ? "Cari zon, daerah, atau negeri..." : "Search zone, district, or state..."}
                          className="w-full bg-transparent border-0 outline-none text-sm text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-outline)] py-1"
                        />
                        {searchQuery && (
                          <X
                            size={16}
                            onClick={() => setSearchQuery("")}
                            className="text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
                          />
                        )}
                      </div>

                      {/* Scrollable Zones List */}
                      <div className="flex-1 overflow-y-auto divide-y divide-[var(--md-sys-color-outline)]/5 no-scrollbar">
                        {filteredZones.length > 0 ? (
                          filteredZones.map((state) => (
                            <div key={state.state}>
                              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-high)]/40 sticky top-0 backdrop-blur-sm">
                                {state.state}
                              </div>
                              {state.zones.map((z) => (
                                <button
                                  key={z.v}
                                  onClick={() => {
                                    setShareZone(z.v);
                                    setShowZonePicker(false);
                                    setCopied(false);
                                  }}
                                  className={cn(
                                    "w-full text-left px-5 py-3 text-xs flex items-center gap-3 transition-colors hover:bg-[var(--md-sys-color-primary)]/8 cursor-pointer",
                                    z.v === shareZone &&
                                      "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold"
                                  )}
                                >
                                  <span className="font-black text-xs text-[var(--md-sys-color-primary)] w-14 shrink-0">
                                    {z.v}
                                  </span>
                                  <span className="truncate text-xs text-[var(--md-sys-color-on-surface)]">
                                    {z.l}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-xs text-[var(--md-sys-color-outline)] font-bold">
                            {isMalay ? "Tiada padanan dijumpai" : "No matches found"}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Scrollable Contents Section */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 no-scrollbar">
              {/* Tab Selector */}
              <div className="flex p-1 rounded-2xl bg-[var(--md-sys-color-surface-container-high)]/60 ring-1 ring-white/5">
                {(["link", "image", "qr"] as const).map((tab) => {
                  const isActive = activeTab === tab;
                  const label =
                    tab === "link"
                      ? isMalay ? "Pautan Pintar" : "Smart Link"
                      : tab === "image"
                        ? isMalay ? "Poster Waktu" : "Schedule Card"
                        : isMalay ? "QR Kod Offline" : "Offline QR";
                  const Icon = tab === "link" ? Link2 : tab === "image" ? ImageIcon : QrCode;

                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer relative",
                        isActive
                          ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md"
                          : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]/40"
                      )}
                    >
                      <Icon size={14} strokeWidth={iconStroke} />
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Interactive Displays */}
              <AnimatePresence mode="wait">
                {activeTab === "link" && (
                  <motion.div
                    key="link-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Tiny info banner */}
                    <div className="bg-[var(--md-sys-color-primary)]/8 border border-[var(--md-sys-color-primary)]/15 rounded-2xl p-4 flex gap-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      <Sparkles size={16} className="text-[var(--md-sys-color-primary)] shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        {isMalay
                          ? "Berkongsi pautan pintar membolehkan rakan anda melihat zon waktu solat terpilih secara automatik apabila melayari laman web ini."
                          : "Sharing a smart link lets others view your chosen prayer zone schedule automatically when they open this site."}
                      </p>
                    </div>

                    {/* URL bar with Copy button */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] ml-1">
                        {isMalay ? "Pautan untuk dikongsi" : "Link to share"}
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] ring-1 ring-[var(--md-sys-color-outline)]/10 min-w-0">
                          <Link2 size={16} className="text-[var(--md-sys-color-outline)] shrink-0" />
                          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono truncate tracking-tight select-all">
                            {shareUrl}
                          </span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleCopy}
                          className={cn(
                            "px-4 rounded-2xl flex items-center justify-center gap-1.5 font-black text-xs shadow-md transition-all cursor-pointer shrink-0 min-w-[95px]",
                            copied
                              ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                              : "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] hover:bg-[var(--md-sys-color-primary)] hover:text-white"
                          )}
                        >
                          {copied ? (
                            <>
                              <Check size={14} strokeWidth={iconStroke} />
                              {isMalay ? "Disalin" : "Copied"}
                            </>
                          ) : (
                            <>
                              <Copy size={14} strokeWidth={iconStroke} />
                              {isMalay ? "Salin" : "Copy"}
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>

                    {/* Quick Direct Sharing Grid */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] ml-1 block">
                        {isMalay ? "Kongsi Secara Terus" : "Direct Share"}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <motion.button
                          whileHover={{ y: -2, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleWhatsApp}
                          className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl bg-[#25D366]/8 text-[#25D366] hover:bg-[#25D366]/12 border border-[#25D366]/20 transition-all font-black text-xs cursor-pointer shadow-sm"
                        >
                          <MessageCircle size={20} strokeWidth={iconStroke} />
                          WhatsApp
                        </motion.button>
                        <motion.button
                          whileHover={{ y: -2, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleTelegram}
                          className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl bg-[#0088cc]/8 text-[#0088cc] hover:bg-[#0088cc]/12 border border-[#0088cc]/20 transition-all font-black text-xs cursor-pointer shadow-sm"
                        >
                          <Send size={20} strokeWidth={iconStroke} />
                          Telegram
                        </motion.button>
                        <motion.button
                          whileHover={{ y: -2, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSystemShare}
                          disabled={typeof navigator !== "undefined" && !navigator.share}
                          className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl bg-[var(--md-sys-color-primary-container)]/30 text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/50 border border-[var(--md-sys-color-primary)]/10 transition-all font-black text-xs cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-sm"
                        >
                          <ExternalLink size={20} strokeWidth={iconStroke} />
                          {isMalay ? "Sistem" : "System"}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "image" && (
                  <motion.div
                    key="image-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Real-time schedule preview card */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                          {isMalay ? "Pratonton Poster" : "Postcard Preview"}
                        </span>
                        {loadingData && (
                          <span className="text-[9px] font-black text-[var(--md-sys-color-primary)] animate-pulse uppercase tracking-wider">
                            {isMalay ? "Mengemas kini data..." : "Updating data..."}
                          </span>
                        )}
                      </div>

                      {/* Poster Ticket card */}
                      <div
                        className={cn(
                          "relative rounded-[28px] overflow-hidden text-white shadow-xl shadow-black/40 border border-white/10 select-none bg-gradient-to-b from-[var(--md-sys-color-primary)] to-[var(--md-sys-color-surface-container)] p-6 aspect-[4/5] flex flex-col justify-between max-w-[340px] mx-auto transition-all",
                          loadingData && "animate-pulse"
                        )}
                      >
                        {/* Background subtle glowing orbs and dots grid */}
                        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
                        <div className="absolute -bottom-20 -right-20 w-44 h-44 rounded-full bg-white/5 blur-xl pointer-events-none" />

                        {/* Top Branding Header */}
                        <div className="flex justify-between items-start shrink-0 relative z-10">
                          <div>
                            <span className="text-[9px] uppercase tracking-[0.25em] font-black text-white/60 block">
                              ALURWAKTU
                            </span>
                            <span className="text-xl font-black text-white tracking-tighter mt-1 block">
                              {shareZone}
                            </span>
                          </div>
                          <div className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/10 text-[9px] font-black tracking-wide uppercase">
                            {isMalay ? "Waktu Solat" : "Prayer Times"}
                          </div>
                        </div>

                        {/* Zone names & dates */}
                        <div className="my-3 text-center relative z-10">
                          <h4 className="text-base font-black text-white leading-tight truncate px-2">
                            {getZoneLabel(shareZone)}
                          </h4>
                          <p className="text-[10px] text-white/75 font-semibold uppercase tracking-wider mt-0.5">
                            {getStateLabel(shareZone)}
                          </p>

                          <div className="mt-3 inline-flex flex-col items-center py-1.5 px-4 rounded-2xl bg-black/15 border border-white/5 min-w-[180px]">
                            <span className="text-[11px] font-black text-white flex items-center gap-1">
                              <Calendar size={11} />
                              {new Date().toLocaleDateString(isMalay ? "ms-MY" : "en-US", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            {previewTodayData?.hijri && (
                              <span className="text-[9px] font-black text-[#FFD700] mt-0.5">
                                {getHijriFormatted(previewTodayData.hijri, "text", settings.language as any)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Simple table representing times */}
                        <div className="bg-black/20 rounded-[20px] p-3 border border-white/5 space-y-1.5 relative z-10 flex-1 flex flex-col justify-center my-1.5">
                          {loadingData ? (
                            <div className="flex flex-col items-center justify-center h-full py-6 space-y-2">
                              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span className="text-[10px] font-black text-white/60">
                                {isMalay ? "Memuat turun..." : "Loading times..."}
                              </span>
                            </div>
                          ) : (
                            ["fajr", "dhuhr", "asr", "maghrib", "isha"].map((key) => {
                              const rawTime = previewTodayData ? previewTodayData[key] : "--:--";
                              let formatted = rawTime;
                              if (rawTime && rawTime !== "--:--") {
                                try {
                                  const [h, m] = rawTime.split(":");
                                  const hr = parseInt(h, 10);
                                  if (settings.timeFormat === "12h") {
                                    const p = hr >= 12 ? "PM" : "AM";
                                    const dh = hr % 12 === 0 ? 12 : hr % 12;
                                    formatted = `${String(dh).padStart(2, "0")}:${m} ${p}`;
                                  } else {
                                    formatted = `${h}:${m}`;
                                  }
                                } catch {
                                  formatted = rawTime;
                                }
                              }
                              return (
                                <div
                                  key={key}
                                  className="flex items-center justify-between px-3 py-1 rounded-xl hover:bg-white/5 transition-all text-xs font-black"
                                >
                                  <span className="text-white/80">{isMalay ? t(key as any) : key.toUpperCase()}</span>
                                  <span className="font-mono text-white tracking-wide text-xs">{formatted}</span>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Tiny footer */}
                        <div className="text-center shrink-0 pt-1 relative z-10">
                          <span className="text-[8px] text-white/45 tracking-widest font-black uppercase">
                            Generated by alurwaktu.pages.dev
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Image Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDownloadImage}
                        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-black text-xs cursor-pointer shadow-md"
                      >
                        <Download size={16} strokeWidth={iconStroke} />
                        {isMalay ? "Muat Turun PNG" : "Download PNG"}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSystemShare}
                        disabled={typeof navigator !== "undefined" && !navigator.share}
                        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-primary)]/10 font-black text-xs cursor-pointer shadow-sm disabled:opacity-40"
                      >
                        <Share2 size={16} strokeWidth={iconStroke} />
                        {isMalay ? "Kongsi Gambar" : "Share Image"}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {activeTab === "qr" && (
                  <motion.div
                    key="qr-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 flex flex-col items-center text-center"
                  >
                    <div className="bg-[var(--md-sys-color-primary)]/8 border border-[var(--md-sys-color-primary)]/15 rounded-2xl p-4 text-xs text-[var(--md-sys-color-on-surface-variant)] text-left w-full">
                      <p className="leading-relaxed">
                        {isMalay
                          ? "Imbas QR kod ini menggunakan kamera telefon pintar untuk berkongsi zon waktu solat secara pantas dalam keadaan luar talian."
                          : "Scan this QR code using a smartphone camera to instantly share the prayer zone schedule offline."}
                      </p>
                    </div>

                    {/* QR Code Container */}
                    <div className="p-5 rounded-[28px] bg-white ring-1 ring-black/5 shadow-inner inline-flex items-center justify-center relative overflow-hidden my-2">
                      {qrMatrix ? (
                        <div className="grid gap-[2.5px] bg-white p-1" style={{ gridTemplateColumns: `repeat(${qrMatrix.length}, minmax(0, 1fr))` }}>
                          {qrMatrix.map((row, rIdx) =>
                            row.map((cell, cIdx) => (
                              <div
                                key={`${rIdx}-${cIdx}`}
                                className={cn(
                                  "w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] transition-all duration-300",
                                  cell ? "bg-[#0b1f1a]" : "bg-transparent",
                                  // Round finding patterns (classic premium custom M3 style QR pixels)
                                  ((rIdx < 7 && cIdx < 7) || (rIdx < 7 && cIdx >= qrMatrix.length - 7) || (rIdx >= qrMatrix.length - 7 && cIdx < 7))
                                    ? cell ? "bg-[var(--md-sys-color-primary)]" : "bg-transparent"
                                    : cell ? "rounded-full" : ""
                                )}
                              />
                            ))
                          )}
                        </div>
                      ) : (
                        <div className="w-[180px] h-[180px] flex items-center justify-center text-xs font-black text-[var(--md-sys-color-outline)]">
                          {isMalay ? "Menjana QR..." : "Generating QR..."}
                        </div>
                      )}
                    </div>

                    <div className="text-center w-full px-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--md-sys-color-primary)] block">
                        {shareZone} — {getZoneLabel(shareZone)}
                      </span>
                      <span className="text-[9px] text-[var(--md-sys-color-outline)] font-medium mt-0.5 block truncate select-all">
                        {shareUrl}
                      </span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCopy}
                      className={cn(
                        "w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-md transition-all cursor-pointer",
                        copied
                          ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                          : "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
                      )}
                    >
                      {copied ? (
                        <>
                          <Check size={16} strokeWidth={iconStroke} />
                          {isMalay ? "Disalin Ke Papan Keratan" : "Copied to Clipboard"}
                        </>
                      ) : (
                        <>
                          <Copy size={16} strokeWidth={iconStroke} />
                          {isMalay ? "Salin Pautan QR" : "Copy QR Link"}
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
