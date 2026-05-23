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
  MapPin,
  Calendar,
  ClipboardCheck,
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

// Canvas dynamic text-wrapping helper to ensure 100% legibility
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  let linesCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
      linesCount++;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return linesCount + 1; // Returns exact number of lines printed
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

  // Copy states
  const [copyImageState, setCopyImageState] = useState<"idle" | "success" | "error">("idle");

  // Dynamic schedule fetching state for selected sharing zone
  const [fetchedData, setFetchedData] = useState<any[] | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Sync share zone to current zone when opening
  useEffect(() => {
    if (isOpen) {
      setShareZone(currentZone);
      setActiveTab("link");
      setSearchQuery("");
      setShowZonePicker(false);
      setCopyImageState("idle");
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
    
    if (typeof window !== "undefined") {
      const style = window.getComputedStyle(document.documentElement);
      primaryColor = style.getPropertyValue("--md-sys-color-primary").trim() || primaryColor;
      surfaceColor = style.getPropertyValue("--md-sys-color-surface-container").trim() || surfaceColor;
      onSurfaceColor = style.getPropertyValue("--md-sys-color-on-surface").trim() || onSurfaceColor;
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

    // Reset shadow state for branding text to keep it vector sharp
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 2. Branding Header
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "bold 13px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
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

    // Set premium drop shadow for legibility before drawing main texts
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.shadowOffsetX = 0;

    // Draw main zone code big and bold
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 48px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    ctx.fillText(shareZone, width / 2, 165);

    // Draw state name
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = "bold 13px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    ctx.letterSpacing = "3px";
    ctx.fillText(stateName.toUpperCase(), width / 2, 205);

    // Dynamic wrapped zone description (to prevent overlapping!)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    ctx.letterSpacing = "0px";

    const wrapStartY = 238;
    const wrapLineHeight = 26;
    const maxWrapWidth = 600;
    const linesPrinted = wrapText(ctx, zoneName, width / 2, wrapStartY, maxWrapWidth, wrapLineHeight);

    // Compute Date start dynamically
    const datesY = wrapStartY + (linesPrinted * wrapLineHeight) + 18;

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
    ctx.font = "bold 21px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    ctx.fillText(gregDateStr, width / 2, datesY);

    if (hijriDateStr) {
      ctx.fillStyle = "#FFD700"; // Gold color for premium Hijri display
      ctx.font = "bold 15px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
      ctx.fillText(hijriDateStr, width / 2, datesY + 26);
    }

    // 5. Frosted Glass Schedule Table (Compute table Y from dates Y)
    const tableY = datesY + 54;
    const tableWidth = 620;
    const tableHeight = 460;
    const tableX = width / 2 - tableWidth / 2;

    // Disable text shadow when drawing panel borders to avoid blur
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Frosted table background container
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.roundRect(tableX, tableY, tableWidth, tableHeight, 28);
    ctx.fill();

    // Elegant outline border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 6. Prayer times mapping
    const rawKeys = ["imsak", "fajr", "syuruk", "dhuhr", "asr", "maghrib", "isha"];
    const activeKeys = rawKeys.filter((k) => k !== "imsak" && k !== "syuruk" || settings.trackImsak);
    const rowHeight = tableHeight / activeKeys.length;

    // Soft drop shadow for table contents
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;

    activeKeys.forEach((key, idx) => {
      const rowY = tableY + idx * rowHeight;
      
      // Zebra row backgrounds for enhanced reading comfort
      if (idx % 2 === 1) {
        ctx.shadowColor = "transparent";
        ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
        ctx.beginPath();
        ctx.roundRect(tableX + 10, rowY + 5, tableWidth - 20, rowHeight - 10, 16);
        ctx.fill();
        
        ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;
      }

      // Draw custom prayer icon shape
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 2;
      const iconX = tableX + 38;
      const iconY = rowY + rowHeight / 2;

      ctx.beginPath();
      if (key === "fajr" || key === "maghrib") {
        ctx.arc(iconX, iconY + 2, 6, Math.PI, 0);
        ctx.moveTo(iconX - 10, iconY + 2);
        ctx.lineTo(iconX + 10, iconY + 2);
        ctx.stroke();
      } else if (key === "dhuhr" || key === "syuruk") {
        ctx.arc(iconX, iconY, 6, 0, Math.PI * 2);
        ctx.stroke();
      } else if (key === "asr") {
        ctx.arc(iconX, iconY, 7, 0, Math.PI * 2);
        ctx.moveTo(iconX, iconY - 7);
        ctx.lineTo(iconX, iconY + 7);
        ctx.moveTo(iconX - 7, iconY);
        ctx.lineTo(iconX + 7, iconY);
        ctx.stroke();
      } else if (key === "isha" || key === "imsak") {
        ctx.arc(iconX - 2, iconY, 6, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
      } else {
        ctx.arc(iconX, iconY, 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Format individual times
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
      ctx.font = "bold 18px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
      ctx.fillText(pLabel, tableX + 68, rowY + rowHeight / 2 + 6);

      // Time Text (highly readable mono font)
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 20px 'JetBrains Mono', monospace, sans-serif";
      ctx.fillText(formattedTime, tableX + tableWidth - 38, rowY + rowHeight / 2 + 6);
    });

    // 7. Footer (Remove shadow for small text)
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "medium 11px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    ctx.fillText("Jadual dijana secara automatik. Sila layari alurwaktu.pages.dev", width / 2, 925);

    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.font = "bold 10px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    ctx.letterSpacing = "1px";
    ctx.fillText("OFFLINE COMPATIBLE • COPIABLE CLIPBOARD PORTRAIT", width / 2, 946);

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

  // Direct PNG Copy to system clipboard using modern ClipboardItem API
  const handleCopyImageToClipboard = async () => {
    try {
      const canvas = await drawPostcard();
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setCopyImageState("error");
          return;
        }
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            const data = [new ClipboardItem({ "image/png": blob })];
            await navigator.clipboard.write(data);
            setCopyImageState("success");
            setTimeout(() => setCopyImageState("idle"), 2500);
          } else {
            setCopyImageState("error");
            setTimeout(() => setCopyImageState("idle"), 2500);
          }
        } catch (err) {
          console.error("Clipboard write error:", err);
          setCopyImageState("error");
          setTimeout(() => setCopyImageState("idle"), 2500);
        }
      }, "image/png");
    } catch (err) {
      console.error("Copy image failed:", err);
      setCopyImageState("error");
      setTimeout(() => setCopyImageState("idle"), 2500);
    }
  };

  const handleSystemShare = async () => {
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
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

          {/* Modal Container */}
          <motion.div
            initial={{ y: 150, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 120, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 32, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative bg-[var(--md-sys-color-surface-container)] w-full sm:max-w-xl rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl shadow-black/60 flex flex-col max-h-[96vh] sm:max-h-[88vh] transition-all",
              visualStyle === "retro" && "border-[3px] border-[var(--md-sys-color-on-surface)] shadow-[6px_6px_0px_0px_var(--md-sys-color-on-surface)] rounded-none",
              visualStyle === "glass" && "bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)]",
              visualStyle === "soft" && "shadow-[var(--soft-shadow-heavy)] rounded-t-[40px] sm:rounded-[40px] border border-white/5"
            )}
          >
            {/* Mobile drag handle bar */}
            <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
              <div className="w-12 h-1.5 rounded-full bg-[var(--md-sys-color-outline)]/20" />
            </div>

            {/* Premium Header */}
            <div className="flex items-center justify-between px-5 py-2 sm:px-6 sm:pt-4 sm:pb-3 border-b border-[var(--md-sys-color-outline)]/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary)]/10 flex items-center justify-center relative overflow-hidden group">
                  <motion.div 
                    animate={{ rotate: [0, 8, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                  >
                    <Share2 size={20} className="text-[var(--md-sys-color-primary)] relative z-10" />
                  </motion.div>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-tight text-[var(--md-sys-color-on-surface)]">
                    {isMalay ? "Kongsi Waktu Solat" : "Share Prayer Times"}
                  </h3>
                  <p className="text-[9px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-bold">
                    {isMalay ? "ALURWAKTU KONGSI" : "ALURWAKTU SHARING"}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-error-container)] hover:text-[var(--md-sys-color-on-error-container)] transition-all cursor-pointer"
              >
                <X size={18} strokeWidth={iconStroke} />
              </motion.button>
            </div>

            {/* Searchable Zone Selector */}
            <div className="px-5 py-2.5 sm:px-6 border-b border-[var(--md-sys-color-outline)]/8 bg-[var(--md-sys-color-surface-container-low)] shrink-0">
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="text-[9px] uppercase tracking-widest font-black text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
                  <MapPin size={11} className="text-[var(--md-sys-color-primary)]" />
                  {isMalay ? "Pilih Zon Kongsi" : "Select Share Zone"}
                </span>
                {shareZone !== currentZone && (
                  <button
                    onClick={() => setShareZone(currentZone)}
                    className="text-[9px] font-black text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-primary)] uppercase tracking-wide cursor-pointer transition-colors"
                  >
                    {isMalay ? "Set Semula Asal" : "Reset Default"}
                  </button>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowZonePicker(!showZonePicker)}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-[var(--md-sys-color-surface)] ring-1 ring-[var(--md-sys-color-outline)]/12 text-left transition-all hover:ring-[var(--md-sys-color-primary)]/40 shadow-sm cursor-pointer",
                  visualStyle === "retro" && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[2px_2px_0px_0px_var(--md-sys-color-on-surface)] ring-0 rounded-none",
                  visualStyle === "soft" && "rounded-2xl"
                )}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-black text-xs sm:text-sm text-[var(--md-sys-color-primary)]">
                    {shareZone}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] ml-3 truncate">
                    {getZoneLabel(shareZone)} ({getStateLabel(shareZone)})
                  </span>
                </div>
                <ChevronDown
                  size={15}
                  strokeWidth={iconStroke}
                  className={cn(
                    "text-[var(--md-sys-color-outline)] transition-transform duration-250",
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
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="max-h-[250px] sm:max-h-[220px] flex flex-col mt-1.5 rounded-2xl bg-[var(--md-sys-color-surface)] ring-1 ring-[var(--md-sys-color-outline)]/12 shadow-xl overflow-hidden">
                      {/* Search Bar */}
                      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--md-sys-color-outline)]/10 bg-[var(--md-sys-color-surface-container-low)]">
                        <Search size={15} className="text-[var(--md-sys-color-outline)]" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={isMalay ? "Cari zon, daerah, atau negeri..." : "Search zone, district, or state..."}
                          className="w-full bg-transparent border-0 outline-none text-xs text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-outline)] py-1"
                        />
                        {searchQuery && (
                          <X
                            size={15}
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
                              <div className="px-3.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-high)]/40 sticky top-0 backdrop-blur-sm">
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
                                    "w-full text-left px-4 py-2.5 text-[11px] flex items-center gap-3 transition-colors hover:bg-[var(--md-sys-color-primary)]/8 cursor-pointer",
                                    z.v === shareZone &&
                                      "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold"
                                  )}
                                >
                                  <span className="font-black text-[11px] text-[var(--md-sys-color-primary)] w-12 shrink-0">
                                    {z.v}
                                  </span>
                                  <span className="truncate text-[11px] text-[var(--md-sys-color-on-surface)]">
                                    {z.l}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-[11px] text-[var(--md-sys-color-outline)] font-bold">
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
            <div className="flex-1 overflow-y-auto px-5 py-3 sm:px-6 sm:py-4 space-y-3 sm:space-y-4 no-scrollbar">
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
                        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-black text-[11px] transition-all cursor-pointer relative",
                        isActive
                          ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md"
                          : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]/40"
                      )}
                    >
                      <Icon size={13} strokeWidth={iconStroke} />
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
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-3"
                  >
                    {/* Tiny info banner */}
                    <div className="bg-[var(--md-sys-color-primary)]/8 border border-[var(--md-sys-color-primary)]/15 rounded-2xl p-3.5 flex gap-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      <Sparkles size={15} className="text-[var(--md-sys-color-primary)] shrink-0 mt-0.5" />
                      <p className="leading-relaxed text-[11px]">
                        {isMalay
                          ? "Berkongsi pautan pintar membolehkan rakan anda melihat zon waktu solat terpilih secara automatik apabila melayari laman web ini."
                          : "Sharing a smart link lets others view your chosen prayer zone schedule automatically when they open this site."}
                      </p>
                    </div>

                    {/* URL bar with Copy button */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] ml-1">
                        {isMalay ? "Pautan untuk dikongsi" : "Link to share"}
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] ring-1 ring-[var(--md-sys-color-outline)]/10 min-w-0">
                          <Link2 size={15} className="text-[var(--md-sys-color-outline)] shrink-0" />
                          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-mono truncate tracking-tight select-all">
                            {shareUrl}
                          </span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleCopy}
                          className={cn(
                            "px-3.5 rounded-2xl flex items-center justify-center gap-1.5 font-black text-[11px] shadow-sm transition-all cursor-pointer shrink-0 min-w-[85px]",
                            copied
                              ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                              : "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] hover:bg-[var(--md-sys-color-primary)] hover:text-white"
                          )}
                        >
                          {copied ? (
                            <>
                              <Check size={13} strokeWidth={iconStroke} />
                              {isMalay ? "Disalin" : "Copied"}
                            </>
                          ) : (
                            <>
                              <Copy size={13} strokeWidth={iconStroke} />
                              {isMalay ? "Salin" : "Copy"}
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>

                    {/* Quick Direct Sharing Grid */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] ml-1 block">
                        {isMalay ? "Kongsi Secara Terus" : "Direct Share"}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <motion.button
                          whileHover={{ y: -1.5, scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleWhatsApp}
                          className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-[#25D366]/8 text-[#25D366] border border-[#25D366]/15 font-black text-[10px] cursor-pointer"
                        >
                          <MessageCircle size={18} strokeWidth={iconStroke} />
                          WhatsApp
                        </motion.button>
                        <motion.button
                          whileHover={{ y: -1.5, scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleTelegram}
                          className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-[#0088cc]/8 text-[#0088cc] border border-[#0088cc]/15 font-black text-[10px] cursor-pointer"
                        >
                          <Send size={18} strokeWidth={iconStroke} />
                          Telegram
                        </motion.button>
                        <motion.button
                          whileHover={{ y: -1.5, scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleSystemShare}
                          disabled={typeof navigator !== "undefined" && !navigator.share}
                          className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-[var(--md-sys-color-primary-container)]/30 text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-primary)]/10 font-black text-[10px] cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                        >
                          <ExternalLink size={18} strokeWidth={iconStroke} />
                          {isMalay ? "Sistem" : "System"}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "image" && (
                  <motion.div
                    key="image-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-3"
                  >
                    {/* Real-time schedule preview card */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                          {isMalay ? "Pratonton Poster" : "Postcard Preview"}
                        </span>
                        {loadingData && (
                          <span className="text-[8px] font-black text-[var(--md-sys-color-primary)] animate-pulse uppercase tracking-wider">
                            {isMalay ? "Mengemas kini..." : "Updating..."}
                          </span>
                        )}
                      </div>

                      {/* Poster Ticket card - Responsive sizing to prevent overflow */}
                      <div
                        className={cn(
                          "relative rounded-[28px] overflow-hidden text-white shadow-xl shadow-black/40 border border-white/10 select-none bg-gradient-to-b from-[var(--md-sys-color-primary)] to-[var(--md-sys-color-surface-container)] p-4 sm:p-5 aspect-[4/5] flex flex-col justify-between w-full max-w-[260px] xs:max-w-[290px] sm:max-w-[310px] mx-auto transition-all",
                          loadingData && "animate-pulse"
                        )}
                      >
                        {/* Background subtle glowing overlays */}
                        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
                        <div className="absolute -bottom-20 -right-20 w-36 h-36 rounded-full bg-white/5 blur-lg pointer-events-none" />

                        {/* Top Branding Header */}
                        <div className="flex justify-between items-start shrink-0 relative z-10">
                          <div>
                            <span className="text-[8px] uppercase tracking-[0.2em] font-black text-white/60 block">
                              ALURWAKTU
                            </span>
                            <span className="text-base sm:text-lg font-black text-white tracking-tighter mt-0.5 block">
                              {shareZone}
                            </span>
                          </div>
                          <div className="px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/10 text-[8px] font-black tracking-wide uppercase">
                            {isMalay ? "Poster" : "Card"}
                          </div>
                        </div>

                        {/* Zone names & dates */}
                        <div className="my-1.5 text-center relative z-10">
                          {/* Truncate beautifully on mobile to avoid overlap */}
                          <h4 className="text-xs sm:text-sm font-black text-white leading-snug truncate px-1 max-w-[240px] mx-auto">
                            {getZoneLabel(shareZone)}
                          </h4>
                          <p className="text-[9px] text-white/70 font-semibold uppercase tracking-wider mt-0.5">
                            {getStateLabel(shareZone)}
                          </p>

                          <div className="mt-2 inline-flex flex-col items-center py-1 px-3 rounded-xl bg-black/15 border border-white/5 min-w-[150px]">
                            <span className="text-[10px] font-black text-white flex items-center gap-1">
                              <Calendar size={10} />
                              {new Date().toLocaleDateString(isMalay ? "ms-MY" : "en-US", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                            {previewTodayData?.hijri && (
                              <span className="text-[8px] font-black text-[#FFD700] mt-0.5">
                                {getHijriFormatted(previewTodayData.hijri, "text", settings.language as any).split(" (")[0]}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Frosted glass list representing times */}
                        <div className="bg-black/20 rounded-xl p-2.5 border border-white/5 space-y-1 relative z-10 flex-1 flex flex-col justify-center my-1.5 max-h-[160px] sm:max-h-[180px]">
                          {loadingData ? (
                            <div className="flex flex-col items-center justify-center h-full py-4 space-y-1.5">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span className="text-[9px] font-black text-white/60">
                                {isMalay ? "Memuat..." : "Loading..."}
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
                                  className="flex items-center justify-between px-2 py-0.5 rounded-lg hover:bg-white/5 transition-all text-[11px] font-black"
                                >
                                  <span className="text-white/85 text-[10px]">{isMalay ? t(key as any) : key.toUpperCase()}</span>
                                  <span className="font-mono text-white tracking-wide text-[10px]">{formatted}</span>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Tiny footer */}
                        <div className="text-center shrink-0 pt-0.5 relative z-10">
                          <span className="text-[7px] text-white/40 tracking-widest font-black uppercase">
                            alurwaktu.pages.dev
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Image Action Buttons - Responsive Row of 3 Options */}
                    <div className="flex flex-col xs:flex-row gap-1.5 w-full">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDownloadImage}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-black text-xs cursor-pointer shadow-sm"
                      >
                        <Download size={14} strokeWidth={iconStroke} />
                        {isMalay ? "Muat Turun" : "Download"}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCopyImageToClipboard}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-xs cursor-pointer shadow-sm transition-all",
                          copyImageState === "success"
                            ? "bg-[#25D366] text-white"
                            : copyImageState === "error"
                              ? "bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)]"
                              : "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] hover:bg-[var(--md-sys-color-primary)] hover:text-white"
                        )}
                      >
                        {copyImageState === "success" ? (
                          <>
                            <ClipboardCheck size={14} strokeWidth={iconStroke} />
                            {isMalay ? "Disalin!" : "Copied!"}
                          </>
                        ) : (
                          <>
                            <Copy size={14} strokeWidth={iconStroke} />
                            {isMalay ? "Salin Poster" : "Copy Poster"}
                          </>
                        )}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSystemShare}
                        disabled={typeof navigator !== "undefined" && !navigator.share}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container-highest)]/80 text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline)]/10 font-black text-xs cursor-pointer shadow-sm disabled:opacity-40"
                      >
                        <Share2 size={14} strokeWidth={iconStroke} />
                        {isMalay ? "Kongsi" : "Share"}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {activeTab === "qr" && (
                  <motion.div
                    key="qr-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-3 flex flex-col items-center text-center"
                  >
                    <div className="bg-[var(--md-sys-color-primary)]/8 border border-[var(--md-sys-color-primary)]/15 rounded-2xl p-3.5 text-xs text-[var(--md-sys-color-on-surface-variant)] text-left w-full">
                      <p className="leading-relaxed text-[11px]">
                        {isMalay
                          ? "Imbas QR kod ini menggunakan kamera telefon pintar untuk berkongsi zon waktu solat secara pantas dalam keadaan luar talian."
                          : "Scan this QR code using a smartphone camera to instantly share the prayer zone schedule offline."}
                      </p>
                    </div>

                    {/* QR Code Container */}
                    <div className="p-4 rounded-[28px] bg-white ring-1 ring-black/5 shadow-inner inline-flex items-center justify-center relative overflow-hidden my-1">
                      {qrMatrix ? (
                        <div className="grid gap-[2px] bg-white p-0.5" style={{ gridTemplateColumns: `repeat(${qrMatrix.length}, minmax(0, 1fr))` }}>
                          {qrMatrix.map((row, rIdx) =>
                            row.map((cell, cIdx) => (
                              <div
                                key={`${rIdx}-${cIdx}`}
                                className={cn(
                                  "w-[4.5px] h-[4.5px] sm:w-[5.5px] sm:h-[5.5px] transition-all duration-200",
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
                        <div className="w-[150px] h-[150px] flex items-center justify-center text-[11px] font-black text-[var(--md-sys-color-outline)]">
                          {isMalay ? "Menjana QR..." : "Generating QR..."}
                        </div>
                      )}
                    </div>

                    <div className="text-center w-full px-2">
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
                        "w-full py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-black text-xs shadow-sm transition-all cursor-pointer",
                        copied
                          ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                          : "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
                      )}
                    >
                      {copied ? (
                        <>
                          <Check size={15} strokeWidth={iconStroke} />
                          {isMalay ? "Disalin Ke Papan Keratan" : "Copied to Clipboard"}
                        </>
                      ) : (
                        <>
                          <Copy size={15} strokeWidth={iconStroke} />
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
