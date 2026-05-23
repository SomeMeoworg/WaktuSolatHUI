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

  const activeKeys = useMemo(() => {
    const rawKeys = ["imsak", "fajr", "syuruk", "dhuhr", "asr", "maghrib", "isha"];
    return rawKeys.filter((k) => k !== "imsak" && k !== "syuruk" || settings.trackImsak);
  }, [settings.trackImsak]);

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

  // Canvas-based Postcard image drawing pipeline (crisp, vector-sharp dynamic offline drawing)
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

    // Dynamic Material 3 style retriever helper
    const getCssVar = (name: string, fallback: string): string => {
      if (typeof window === "undefined") return fallback;
      const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return val || fallback;
    };

    // Query active theme M3 dynamic colors
    const colorPrimary = getCssVar("--md-sys-color-primary", "#6750A4");
    const colorOnPrimary = getCssVar("--md-sys-color-on-primary", "#FFFFFF");
    const colorPrimaryContainer = getCssVar("--md-sys-color-primary-container", "#EADDFF");
    const colorSecondaryContainer = getCssVar("--md-sys-color-secondary-container", "#E8DEF8");
    const colorOnSecondaryContainer = getCssVar("--md-sys-color-on-secondary-container", "#1D192B");
    const colorTertiary = getCssVar("--md-sys-color-tertiary", "#7D5260");
    const colorSurface = getCssVar("--md-sys-color-surface", "#FEF7FF");
    const colorSurfaceContainer = getCssVar("--md-sys-color-surface-container", "#F3EDF7");
    const colorSurfaceContainerHigh = getCssVar("--md-sys-color-surface-container-high", "#ECE6F0");
    const colorSurfaceContainerLow = getCssVar("--md-sys-color-surface-container-low", "#F7F2FA");
    const colorOnSurface = getCssVar("--md-sys-color-on-surface", "#1D1B20");
    const colorOnSurfaceVariant = getCssVar("--md-sys-color-on-surface-variant", "#49454F");
    const colorOutline = getCssVar("--md-sys-color-outline", "#79747E");

    // 1. Premium Dynamic Theme Gradient Background (Material 3 Expressive)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, colorPrimaryContainer);
    bgGrad.addColorStop(0.35, colorSurfaceContainerLow);
    bgGrad.addColorStop(1, colorSurfaceContainerHigh);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative Islamic grid dots (adapts dynamically to outline contrast)
    ctx.fillStyle = colorOutline;
    ctx.globalAlpha = 0.08;
    for (let x = 30; x < width; x += 40) {
      for (let y = 30; y < height; y += 40) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0; // Reset

    // Reset shadow state to keep vector text perfectly crisp
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 2. Branding Header (Left Aligned)
    ctx.textAlign = "left";
    ctx.fillStyle = colorOnSurfaceVariant;
    ctx.globalAlpha = 0.7;
    ctx.font = "bold 13px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    ctx.letterSpacing = "6px";
    ctx.fillText("ALURWAKTU", 75, 75);
    ctx.globalAlpha = 1.0;

    // 3. Zone details (Left Aligned)
    const zoneName = getZoneLabel(shareZone);
    const stateName = getStateLabel(shareZone);
    const maxLabelLen = 28;
    const truncatedZoneName = zoneName.length > maxLabelLen ? zoneName.slice(0, maxLabelLen) + "..." : zoneName;

    // Draw main zone code big and bold
    ctx.fillStyle = colorPrimary;
    ctx.font = "900 64px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    ctx.fillText(shareZone, 75, 148);

    // Draw truncated zone name (district)
    ctx.fillStyle = colorOnSurface;
    ctx.font = "bold 24px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    ctx.letterSpacing = "0px";
    ctx.fillText(truncatedZoneName, 75, 192);

    // Draw state name
    ctx.fillStyle = colorOnSurfaceVariant;
    ctx.globalAlpha = 0.8;
    ctx.font = "bold 12px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    ctx.letterSpacing = "3px";
    ctx.fillText(stateName.toUpperCase(), 75, 222);
    ctx.globalAlpha = 1.0;

    // 4. Draw elegant Pill Badge (Top Right)
    const badgeW = 80;
    const badgeH = 28;
    const badgeX = width - 75 - badgeW;
    const badgeY = 53;

    ctx.fillStyle = colorPrimary;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 14);
    ctx.fill();
    
    ctx.strokeStyle = colorPrimary;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = colorOnPrimary;
    ctx.font = "bold 10px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText(isMalay ? "POSTER" : "CARD", badgeX + badgeW / 2, badgeY + 17);

    // 5. Dates Section (Centered Pill Capsule - Dynamic High Contrast)
    const datesY = 258;
    const datePillW = 380;
    const datePillH = 80;
    const datePillX = width / 2 - datePillW / 2;

    ctx.fillStyle = colorSecondaryContainer;
    ctx.beginPath();
    ctx.roundRect(datePillX, datesY, datePillW, datePillH, 20);
    ctx.fill();
    ctx.strokeStyle = colorOutline;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.15;
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    const gregDateStr = new Date().toLocaleDateString(isMalay ? "ms-MY" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const rawHijri = previewTodayData?.hijri || "";
    const hijriDateStr = getHijriFormatted(rawHijri, "text", settings.language as any).split(" (")[0];

    ctx.textAlign = "center";
    ctx.fillStyle = colorOnSecondaryContainer;
    ctx.font = "bold 18px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    ctx.fillText(`📅 ${gregDateStr}`, width / 2, datesY + 34);

    if (hijriDateStr) {
      ctx.fillStyle = colorTertiary;
      ctx.font = "bold 13px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
      ctx.fillText(hijriDateStr, width / 2, datesY + 60);
    }

    // 6. Obligatory Prayer Times Table (Clean, dynamic surface container)
    const tableY = 368;
    const tableWidth = 650;
    const tableHeight = 470;
    const tableX = width / 2 - tableWidth / 2;

    ctx.fillStyle = colorSurfaceContainer;
    ctx.beginPath();
    ctx.roundRect(tableX, tableY, tableWidth, tableHeight, 32);
    ctx.fill();
    ctx.strokeStyle = colorOutline;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.15;
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    const rowHeight = tableHeight / activeKeys.length;

    activeKeys.forEach((key, idx) => {
      const rowY = tableY + idx * rowHeight;

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

      const pLabel = (isMalay ? t(key as any) : key).toUpperCase();

      // Name Text (Left aligned)
      ctx.textAlign = "left";
      ctx.fillStyle = colorOnSurfaceVariant;
      ctx.font = "bold 20px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
      ctx.letterSpacing = "1.5px";
      ctx.fillText(pLabel, tableX + 50, rowY + rowHeight / 2 + 7);

      // Time Text (Right aligned, highly readable mono font)
      ctx.textAlign = "right";
      ctx.fillStyle = colorOnSurface;
      ctx.font = "900 22px 'JetBrains Mono', monospace, sans-serif";
      ctx.letterSpacing = "0px";
      ctx.fillText(formattedTime, tableX + tableWidth - 50, rowY + rowHeight / 2 + 7);
    });

    // 7. Footer Branding
    ctx.textAlign = "center";
    ctx.fillStyle = colorOnSurfaceVariant;
    ctx.globalAlpha = 0.5;
    ctx.font = "bold 13px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    ctx.letterSpacing = "4px";
    ctx.fillText("ALURWAKTU.PAGES.DEV", width / 2, 905);
    ctx.globalAlpha = 1.0;

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
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ willChange: "transform, opacity" }}
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
                    {t("shareHeader" as any)}
                  </h3>
                  <p className="text-[9px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-bold">
                    {t("shareSubheader" as any)}
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
                  {t("selectShareZone" as any)}
                </span>
                {shareZone !== currentZone && (
                  <button
                    onClick={() => setShareZone(currentZone)}
                    className="text-[9px] font-black text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-primary)] uppercase tracking-wide cursor-pointer transition-colors"
                  >
                    {t("resetDefault" as any)}
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
                    initial={{ opacity: 0, scaleY: 0.95, y: -10 }}
                    animate={{ opacity: 1, scaleY: 1, y: 0 }}
                    exit={{ opacity: 0, scaleY: 0.95, y: -10 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: "top", willChange: "transform, opacity" }}
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
                          placeholder={t("searchZonePlaceholder" as any)}
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
                            {t("noMatchesFound" as any)}
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
                      ? t("smartLink" as any)
                      : tab === "image"
                        ? t("scheduleCard" as any)
                        : t("offlineQR" as any);
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
                        {t("linkInfoDesc" as any)}
                      </p>
                    </div>

                    {/* URL bar with Copy button */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] ml-1">
                        {t("linkToShare" as any)}
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
                              {t("copied" as any)}
                            </>
                          ) : (
                            <>
                              <Copy size={13} strokeWidth={iconStroke} />
                              {t("copy" as any)}
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>

                    {/* Quick Direct Sharing Grid */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] ml-1 block">
                        {t("directShare" as any)}
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
                          {t("systemShare" as any)}
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
                          {t("postcardPreview" as any)}
                        </span>
                        {loadingData && (
                          <span className="text-[8px] font-black text-[var(--md-sys-color-primary)] animate-pulse uppercase tracking-wider">
                            {t("updating" as any)}
                          </span>
                        )}
                      </div>

                      {/* Poster Ticket card - Redesigned to left aligned dynamic dynamic theme layout */}
                      <div
                        className={cn(
                          "relative rounded-[32px] overflow-hidden text-[var(--md-sys-color-on-surface)] shadow-xl shadow-black/5 border border-[var(--md-sys-color-outline)]/12 select-none bg-gradient-to-br from-[var(--md-sys-color-primary-container)]/18 to-[var(--md-sys-color-surface-container-high)] p-6 aspect-[4/5] flex flex-col justify-between w-full max-w-[260px] xs:max-w-[290px] sm:max-w-[310px] mx-auto transition-all",
                          loadingData && "animate-pulse"
                        )}
                      >
                        {/* Background subtle dynamic dots */}
                        <div className="absolute inset-0 bg-grid opacity-[0.03] dark:opacity-[0.06] pointer-events-none" />

                        {/* Top Branding & Zone Header (Left Aligned matching Canvas perfectly!) */}
                        <div className="flex justify-between items-start shrink-0 relative z-10 w-full text-left">
                          <div className="flex-1 min-w-0">
                            <span className="text-[9.5px] uppercase tracking-[0.25em] font-black text-[var(--md-sys-color-on-surface-variant)]/80 block">
                              ALURWAKTU
                            </span>
                            <span className="text-2xl sm:text-3xl font-black text-[var(--md-sys-color-primary)] tracking-tight mt-1 block">
                              {shareZone}
                            </span>
                            <h4 className="text-xs sm:text-sm font-black text-[var(--md-sys-color-on-surface)] leading-snug truncate mt-1 max-w-[170px] xs:max-w-[190px] sm:max-w-[210px]">
                              {getZoneLabel(shareZone)}
                            </h4>
                            <span className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]/80 font-bold uppercase tracking-widest mt-0.5 block">
                              {getStateLabel(shareZone)}
                            </span>
                          </div>
                          
                          {/* Elegant Badge top right */}
                          <div className="px-3 py-1 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border border-[var(--md-sys-color-primary)]/10 text-[8px] font-black tracking-widest uppercase shrink-0 shadow-sm">
                            {isMalay ? "POSTER" : "CARD"}
                          </div>
                        </div>

                        {/* Centered Date Pill Capsule (High Contrast Dynamic) */}
                        <div className="my-2 text-center relative z-10 flex justify-center w-full">
                          <div className="inline-flex flex-col items-center py-2 px-4 rounded-2xl bg-[var(--md-sys-color-secondary-container)] border border-[var(--md-sys-color-outline)]/10 min-w-[170px] sm:min-w-[190px] shadow-sm">
                            <span className="text-[10px] sm:text-[11px] font-black text-[var(--md-sys-color-on-secondary-container)] flex items-center gap-1.5 justify-center">
                              <Calendar size={11} className="text-[var(--md-sys-color-on-secondary-container)]/85" />
                              {new Date().toLocaleDateString(isMalay ? "ms-MY" : "en-US", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                            {previewTodayData?.hijri && (
                              <span className="text-[8px] sm:text-[9px] font-black text-[var(--md-sys-color-tertiary)] mt-1 tracking-wide uppercase">
                                {getHijriFormatted(previewTodayData.hijri, "text", settings.language as any).split(" (")[0]}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Dynamic Material 3 Prayers Schedule Container */}
                        <div className="bg-[var(--md-sys-color-surface-container)]/95 rounded-[24px] p-4 border border-[var(--md-sys-color-outline)]/10 space-y-1 relative z-10 flex-1 flex flex-col justify-center my-1.5 max-h-[160px] sm:max-h-[185px] shadow-inner">
                          {loadingData ? (
                            <div className="flex flex-col items-center justify-center h-full py-4 space-y-1.5">
                              <div className="w-5 h-5 border-2 border-[var(--md-sys-color-primary)]/30 border-t-[var(--md-sys-color-primary)] rounded-full animate-spin" />
                              <span className="text-[9px] font-black text-[var(--md-sys-color-on-surface-variant)]/60">
                                {t("loading" as any)}
                              </span>
                            </div>
                          ) : (
                            activeKeys.map((key) => {
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
                                  className="flex items-center justify-between px-2.5 py-0.5 rounded-lg hover:bg-[var(--md-sys-color-primary)]/8 hover:text-[var(--md-sys-color-primary)] transition-all text-[11px] font-black"
                                >
                                  <span className="text-[var(--md-sys-color-on-surface-variant)] text-[9px] sm:text-[10px] tracking-wide">
                                    {(isMalay ? t(key as any) : key).toUpperCase()}
                                  </span>
                                  <span className="font-mono text-[var(--md-sys-color-on-surface)] tracking-normal text-[10px] sm:text-[11px] font-extrabold">{formatted}</span>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Centered minimalist branding footer */}
                        <div className="text-center shrink-0 pt-0.5 relative z-10 w-full">
                          <span className="text-[8px] text-[var(--md-sys-color-on-surface-variant)]/50 tracking-[0.25em] font-black uppercase">
                            ALURWAKTU.PAGES.DEV
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Image Action Buttons - Split Layout Capsule Row */}
                    <div className="flex items-center gap-2.5 w-full pt-1">
                      {/* Primary action capsule button (Copy Poster) */}
                      <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCopyImageToClipboard}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-xs cursor-pointer shadow-md transition-all select-none",
                          copyImageState === "success"
                            ? "bg-[#25D366] text-white"
                            : copyImageState === "error"
                              ? "bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)]"
                              : "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:shadow-lg hover:shadow-[var(--md-sys-color-primary)]/20"
                        )}
                      >
                        {copyImageState === "success" ? (
                          <>
                            <ClipboardCheck size={16} strokeWidth={iconStroke} />
                            {t("copiedToast" as any)}
                          </>
                        ) : (
                          <>
                            <Copy size={16} strokeWidth={iconStroke} />
                            {t("copyPoster" as any)}
                          </>
                        )}
                      </motion.button>

                      {/* Circular supporting button (Download PNG) */}
                      <motion.button
                        whileHover={{ scale: 1.08, rotate: 5, y: -1 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={handleDownloadImage}
                        title={t("downloadPNG" as any)}
                        className="w-11 h-11 flex items-center justify-center rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-outline)]/10 shadow-sm cursor-pointer shrink-0 transition-colors"
                      >
                        <Download size={16} strokeWidth={iconStroke} />
                      </motion.button>

                      {/* Circular supporting button (Share) */}
                      <motion.button
                        whileHover={{ scale: 1.08, rotate: -5, y: -1 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={handleSystemShare}
                        disabled={typeof navigator !== "undefined" && !navigator.share}
                        title={t("sharePoster" as any)}
                        className="w-11 h-11 flex items-center justify-center rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-outline)]/10 shadow-sm cursor-pointer shrink-0 disabled:opacity-40 transition-colors"
                      >
                        <Share2 size={16} strokeWidth={iconStroke} />
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
                        {t("qrInfoDesc" as any)}
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
                          {t("generatingQR" as any)}
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
                          {t("copiedToClipboard" as any)}
                        </>
                      ) : (
                        <>
                          <Copy size={15} strokeWidth={iconStroke} />
                          {t("copyQRLink" as any)}
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
