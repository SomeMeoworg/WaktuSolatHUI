import { Button, Input } from "@heroui/react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  MapPin, 
  Bell, 
  Volume2, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Compass, 
  Play, 
  Pause,
  X,
  Crosshair,
  Search,
  Map as MapIcon,
  CheckCircle2
} from "lucide-react";
import { cn } from "../lib/utils";
import { StorageManager } from "../lib/StorageManager";
import { JAKIM_ZONES } from "../lib/zones";
import { sanitizeInput } from "../lib/security";
interface OnboardingFlowProps {
  onComplete: (zone: string) => void;
  language: "ms" | "en";
}

export function OnboardingFlow({ onComplete, language }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedZone, setSelectedZone] = useState("SGR01");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  
  // Audio state
  const [selectedSound, setSelectedSound] = useState<string>("chime");
  const [isPlayingSound, setIsPlayingSound] = useState<string | null>(null);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  const isMalay = language === "ms";

  // Translate helpers
  const tOnboarding = {
    welcomeTitle: isMalay ? "Selamat Pulang ke AlurWaktu" : "Welcome Home to AlurWaktu",
    welcomeDesc: isMalay 
      ? "AlurWaktu ialah aplikasi waktu solat premium dengan reka bentuk Material 3 Expressive, visual fizik dinamik, dan sokongan luar talian sepenuhnya." 
      : "AlurWaktu is a premium prayer times utility featuring Material 3 Expressive, physical animations, and full offline caching support.",
    startBtn: isMalay ? "Mula Konfigurasi" : "Start Setup",
    
    locTitle: isMalay ? "Pilih Zon Waktu Solat" : "Select Prayer Times Zone",
    locDesc: isMalay 
      ? "Sila pilih zon anda secara manual atau benarkan pengesanan kedudukan GPS automatik." 
      : "Please select your zone manually or allow automatic GPS location tracking.",
    gpsBtn: isMalay ? "Kesan Lokasi GPS" : "Detect GPS Location",
    gpsLoading: isMalay ? "Mengesan kedudukan..." : "Detecting location...",
    gpsSuccessText: isMalay ? "Kawasan berjaya dikesan!" : "Location successfully matched!",
    searchPlace: isMalay ? "Cari daerah / kawasan..." : "Search district or zone...",
    manualLabel: isMalay ? "Pilihan Zon Manual" : "Manual Zone Selection",

    notifTitle: isMalay ? "Sentiasa Tepat Waktu" : "Stay On Schedule",
    notifDesc: isMalay 
      ? "Dapatkan pemberitahuan visual serta audio makluman Azan sejurus masuk waktu solat. Anda boleh menetapkan peringatan awal untuk setiap waktu." 
      : "Receive elegant notifications and beautiful audio Azan reminders as soon as prayer times enter. Customize pre-alerts per prayer.",
    notifBtn: isMalay ? "Benarkan Notifikasi" : "Enable Notifications",
    notifGranted: isMalay ? "Notifikasi Dibenarkan ✓" : "Notifications Granted ✓",
    notifSkip: isMalay ? "Langkau buat masa sekarang" : "Skip for now",

    soundTitle: isMalay ? "Tema Bunyi Alunan" : "Acoustic Audio Theme",
    soundDesc: isMalay 
      ? "Pilih makluman kegemaran anda untuk alunan azan atau peringatan awal." 
      : "Choose your favorite acoustic tone for adhan entry or pre-alerts.",
    finishBtn: isMalay ? "Selesai & Masuk Aplikasi" : "Finish & Enter App",
    backBtn: isMalay ? "Kembali" : "Back",
    nextBtn: isMalay ? "Seterusnya" : "Next"
  };

  const stepsCount = 4;

  const handleNext = () => {
    if (currentStep < stepsCount - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Save settings to StorageManager and complete onboarding
      StorageManager.setHasCompletedOnboarding(true);
      
      // Update global context settings in main app via onComplete callback
      onComplete(selectedZone);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Play simulated sound tones to show premium quality
  const playPreviewSound = (soundType: string) => {
    try {
      if (isPlayingSound) {
        setIsPlayingSound(null);
        return;
      }
      
      const ctx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioCtx) setAudioCtx(ctx);

      setIsPlayingSound(soundType);
      const startTime = ctx.currentTime;

      const playTone = (freq: number, type: OscillatorType, delay: number, dur: number, vol = 0.15) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime + delay);
        
        gain.gain.setValueAtTime(0, startTime + delay);
        gain.gain.linearRampToValueAtTime(vol, startTime + delay + Math.min(0.05, dur * 0.1));
        gain.gain.exponentialRampToValueAtTime(0.00001, startTime + delay + dur);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime + delay);
        osc.stop(startTime + delay + dur);
      };

      if (soundType === 'beep') {
        playTone(880, 'sine', 0, 0.4, 0.1);
        playTone(880, 'sine', 0.5, 0.4, 0.1);
      } else if (soundType === 'chime') {
        playTone(523.25, 'sine', 0, 1.0, 0.12);
        playTone(659.25, 'sine', 0.15, 1.0, 0.12);
        playTone(783.99, 'sine', 0.3, 1.5, 0.12);
      } else if (soundType === 'soft-chime') {
        playTone(440, 'triangle', 0, 1.2, 0.08);
        playTone(329.63, 'triangle', 0.4, 1.5, 0.08);
      } else if (soundType === 'ambient-gong') {
        playTone(110.00, 'triangle', 0, 2.5, 0.25);
        playTone(220.00, 'sine', 0.05, 2.0, 0.12);
      }

      setTimeout(() => {
        setIsPlayingSound(null);
      }, 2500);

    } catch (e) {
      console.warn("Audio Context playback not allowed in browser until interaction:", e);
      setIsPlayingSound(null);
    }
  };

  const handleRequestNotification = async () => {
    if (typeof Notification !== "undefined") {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      // Update local storage preference as well
      const savedPrefs = StorageManager.getItem('prayer_notifications_v2');
      let parsed = savedPrefs ? JSON.parse(savedPrefs) : {};
      
      const defaultNotificationKeys = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
      defaultNotificationKeys.forEach(k => {
        if (!parsed[k]) {
          parsed[k] = { enabled: true, sound: selectedSound, preAlert: 0, offset: 0, iqamahOffset: 10 };
        } else {
          parsed[k].enabled = true;
        }
      });
      StorageManager.setItem('prayer_notifications_v2', JSON.stringify(parsed));
    }
  };

  const handleGPSDetect = () => {
    if ("geolocation" in navigator) {
      setGpsLoading(true);
      setGpsError(null);
      setGpsSuccess(false);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`/api/geocoding?lat=${latitude}&lon=${longitude}`);
            if (!res.ok) throw new Error("Gagal mengesan zon");
            const data = await res.json();
            if (data && data.zone) {
              setSelectedZone(data.zone);
              setGpsSuccess(true);
            } else {
              throw new Error("Kawasan tidak disokong");
            }
          } catch (err: any) {
            setGpsError(isMalay ? "Gagal memadankan koordinat ke zon Malaysia." : "Failed to map coordinates to Malaysia zone.");
          } finally {
            setGpsLoading(false);
          }
        },
        (err) => {
          setGpsLoading(false);
          setGpsError(isMalay ? "Akses GPS tidak dibenarkan atau gagal." : "GPS access denied or failed.");
        },
        { timeout: 8000 }
      );
    } else {
      setGpsError(isMalay ? "Pelayar anda tidak menyokong GPS." : "Browser does not support GPS.");
    }
  };

  // Filter list of zones for manual setup
  const filteredZonesList = JAKIM_ZONES.map((state) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return state;
    const matched = state.zones.filter(z => 
      z.l.toLowerCase().includes(query) || z.v.toLowerCase().includes(query)
    );
    return { ...state, zones: matched };
  }).filter(state => state.zones.length > 0);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 sm:p-6 bg-background font-sans text-foreground selection:bg-[var(--app-primary-container, hsl(var(--heroui-primary) / 0.15))]/30 overflow-hidden">
      {/* Decorative premium floating shapes for wow impact - using M3 primary/secondary theme colors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-[var(--app-primary-container, hsl(var(--heroui-primary) / 0.15))]/20 blur-[100px]" 
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[10%] w-[400px] sm:w-[550px] h-[400px] sm:h-[550px] rounded-full bg-[var(--app-secondary)]/15 blur-[120px]" 
        />
      </div>

      {/* Main Premium Card Wrapper */}
      <div className="relative z-10 w-full max-w-xl min-h-[500px] sm:min-h-[550px] p-6 sm:p-8 rounded-[28px] sm:rounded-[36px] premium-glass-heavy premium-glow-border flex flex-col justify-between overflow-hidden shadow-2xl">
        
        
        {/* Step dots header */}
        <div className="flex items-center justify-between mb-6 shrink-0 z-10">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-primary stroke-[2] animate-pulse" />
            <span className="text-[10px] font-black tracking-widest uppercase text-foreground/60">
              {isMalay ? "PENGATURAN AWAL" : "WELCOME SETUP"}
            </span>
          </div>
          <div className="flex gap-1.5">
            {[...Array(stepsCount)].map((_, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  idx === currentStep ? "w-6 bg-primary" : "w-1.5 bg-foreground/20"
                )}
              />
            ))}
          </div>
        </div>        {/* Carousel slide contents */}
        <div className="flex-1 flex flex-col justify-center min-h-0 py-2 z-10">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="step-welcome"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col items-center text-center space-y-6"
              >
                {/* Premium crescent geometry simulation spinner using M3 primary theme colors */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-t-3 border-r-3 border-primary/50 filter drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]"
                  />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2.5 rounded-full border-b-3 border-l-3 border-[var(--app-secondary)]/50 filter drop-shadow-[0_0_8px_rgba(236,72,153,0.3)]"
                  />
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-[24px] premium-glass flex items-center justify-center text-[var(--app-primary)] shadow-[0_12px_40px_rgba(0,0,0,0.1)] border border-white/30 backdrop-blur-md">
                    <Compass className="w-9 h-9 sm:w-10 sm:h-10 text-primary animate-pulse stroke-[1.5]" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight bg-clip-text bg-gradient-to-br from-foreground via-foreground to-foreground/70">
                    {tOnboarding.welcomeTitle}
                  </h1>
                  <p className="text-sm text-foreground/75 leading-relaxed max-w-sm mx-auto font-medium">
                    {tOnboarding.welcomeDesc}
                  </p>
                </div>
                <Button 
                  onPress={handleNext} 
                  className="mt-6 bg-gradient-to-r from-primary to-[var(--app-secondary)] text-white font-extrabold tracking-wide rounded-2xl shadow-[0_8px_30px_rgba(99,102,241,0.25)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.45)] hover:scale-[1.03] active:scale-[0.98] transition-all w-full max-w-xs h-13 text-base flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>{tOnboarding.startBtn}</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform stroke-[2.5]" />
                </Button>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="step-location"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col space-y-4 h-full max-h-[350px] sm:max-h-[390px] min-h-0"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-black tracking-tight text-foreground mb-1 flex items-center justify-center gap-2">
                    <MapPin className="w-6 h-6 text-primary stroke-[2.5]" />
                    {tOnboarding.locTitle}
                  </h2>
                  <p className="text-xs text-foreground/75 font-medium max-w-sm mx-auto">
                    {tOnboarding.locDesc}
                  </p>
                </div>

                {/* GPS trigger */}
                <div className="flex flex-col gap-2 shrink-0">
                  <Button 
                    onPress={handleGPSDetect} 
                    isDisabled={gpsLoading} 
                    className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 font-bold rounded-2xl shadow-sm w-full h-12 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Crosshair size={18} className={cn("stroke-[2]", gpsLoading && "animate-spin")} />
                    <span>{gpsLoading ? tOnboarding.gpsLoading : tOnboarding.gpsBtn}</span>
                  </Button>

                  {gpsSuccess && (
                    <div className="text-center text-xs font-bold text-success-500 animate-pulse flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={14} className="stroke-[2.5]" />
                      <span>{tOnboarding.gpsSuccessText} ({selectedZone})</span>
                    </div>
                  )}

                  {gpsError && (
                    <div className="text-center text-[11px] font-bold text-danger flex items-center justify-center gap-1.5">
                      <X size={14} className="stroke-[2.5]" />
                      <span>{gpsError}</span>
                    </div>
                  )}
                </div>

                {/* Search Manual list inside onboarding card scrollbox */}
                <div className="flex-1 flex flex-col min-h-0 border border-divider rounded-2xl bg-content1/50 backdrop-blur-md overflow-hidden shadow-inner">
                  <div className="px-2 py-2 border-b border-divider/40">
                    <div className="relative w-full">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50 pointer-events-none" />
                      <input 
                        type="text" 
                        placeholder={tOnboarding.searchPlace}
                        value={searchQuery}
                        onChange={(e: any) => setSearchQuery(sanitizeInput(e.target.value))}
                        className="w-full bg-[var(--app-surface-container)]/80 border border-divider hover:border-primary/50 focus:border-primary rounded-xl pl-10 pr-10 py-2.5 text-sm font-semibold text-foreground placeholder:text-foreground/45 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--app-surface-container-high)] text-foreground/60 transition-colors cursor-pointer"
                        >
                          <X size={14} className="stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-1 divide-y divide-divider/40 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-divider/40">
                    {filteredZonesList.map(state => (
                      <div key={state.state} className="py-1">
                        <div className="px-3 py-1 text-[9px] font-extrabold uppercase tracking-wider text-primary bg-primary/5 rounded-md my-0.5">
                          {state.state}
                        </div>
                        {state.zones.map(z => (
                          <button
                            key={z.v}
                            onClick={() => {
                              setSelectedZone(z.v);
                              setGpsSuccess(false);
                            }}
                            className={cn(
                              "relative overflow-hidden w-full text-left px-3 py-2.5 text-xs flex items-center justify-between transition-all hover:bg-primary/5 cursor-pointer rounded-xl mt-0.5 font-semibold",
                              z.v === selectedZone 
                                ? "bg-primary/10 border-l-3 border-primary text-primary pl-4 rounded-l-none font-bold"
                                : "text-foreground/80 hover:text-foreground"
                            )}
                          >
                            <span className="truncate">{z.l}</span>
                            <span className="font-mono text-[9px] opacity-70 bg-divider/40 px-1.5 py-0.5 rounded">{z.v}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step-notifications"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col items-center text-center space-y-6"
              >
                <div className="w-20 h-20 rounded-[24px] premium-glass text-primary flex items-center justify-center shadow-lg border border-white/20 p-5">
                  <Bell className="w-10 h-10 text-primary stroke-[1.5]" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-tight">
                    {tOnboarding.notifTitle}
                  </h2>
                  <p className="text-sm text-foreground/75 leading-relaxed max-w-sm font-medium">
                    {tOnboarding.notifDesc}
                  </p>
                </div>

                <div className="flex flex-col gap-3 w-full shrink-0 max-w-xs mt-4">
                  {notificationPermission === 'granted' ? (
                    <Button
                      onPress={handleRequestNotification}
                      variant="secondary"
                      className="font-extrabold rounded-2xl bg-success-500 text-white shadow-md h-12 w-full text-base transition-all scale-100 hover:scale-[1.02] cursor-pointer"
                    >
                      {tOnboarding.notifGranted}
                    </Button>
                  ) : (
                    <Button
                      onPress={handleRequestNotification}
                      variant="primary"
                      className="font-extrabold rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.25)] h-13 w-full text-base bg-gradient-to-r from-primary to-[var(--app-secondary)] text-white hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      {tOnboarding.notifBtn}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onPress={handleNext} 
                    className="font-bold rounded-2xl h-12 w-full border-divider hover:bg-content2 text-foreground/80 cursor-pointer"
                  >
                    {tOnboarding.notifSkip}
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step-sounds"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col space-y-4"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-black tracking-tight text-foreground mb-1 flex items-center justify-center gap-2">
                    <Volume2 className="w-6 h-6 text-primary stroke-[2.5]" />
                    {tOnboarding.soundTitle}
                  </h2>
                  <p className="text-xs text-foreground/75 font-medium max-w-sm mx-auto">
                    {tOnboarding.soundDesc}
                  </p>
                </div>

                {/* Sounds list selector in gorgeous high-fidelity design */}
                <div className="grid grid-cols-1 gap-2.5 max-w-sm mx-auto w-full py-2">
                  {[
                    { id: 'chime', name: isMalay ? "Alunan Loceng Chime" : "Acoustic Chime", desc: isMalay ? "Melodi tonal spot premium lembut." : "Soft harmonic spot chime." },
                    { id: 'soft-chime', name: isMalay ? "Genta Lembut (Soft)" : "Soft Bell Triangle", desc: isMalay ? "Alunan gelombang segitiga hening." : "Quiet ambient acoustic reflection." },
                    { id: 'ambient-gong', name: isMalay ? "Gong Sufi Kuno" : "Mystical Sufi Gong", desc: isMalay ? "Resonansi gelombang dalam meditasi." : "Deep resonant contemplative gong." },
                    { id: 'beep', name: isMalay ? "Isyarat Beep Digital" : "Standard Digital Beep", desc: isMalay ? "Makluman standard dwi-frekuensi." : "Dual-frequency retro buzzer alert." }
                  ].map((snd) => (
                    <div 
                      key={snd.id}
                      onClick={() => setSelectedSound(snd.id)}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group",
                        selectedSound === snd.id 
                          ? "bg-primary/10 border-primary text-primary pl-4 border-l-4 rounded-l-none shadow-sm" 
                          : "bg-content1/50 border-divider/60 hover:bg-content2 text-foreground"
                      )}
                    >
                      <div className="flex flex-col text-left min-w-0 pr-4">
                        <span className="text-xs font-bold leading-tight truncate">{snd.name}</span>
                        <span className={cn("text-[10px] truncate mt-1 leading-none font-medium", selectedSound === snd.id ? "text-primary/70" : "text-foreground/60")}>{snd.desc}</span>
                      </div>
                      <Button 
                        isIconOnly 
                        variant={isPlayingSound === snd.id ? "secondary" : "ghost"}
                        onPress={(e: any) => {
                          e.stopPropagation();
                          playPreviewSound(snd.id);
                        }}
                        className="rounded-xl shadow-none cursor-pointer text-primary"
                        aria-label="Preview Sound Option"
                      >
                        {isPlayingSound === snd.id ? <Pause size={16} className="stroke-[2.5]" /> : <Play size={16} className="stroke-[2.5]" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation Buttons */}
        {currentStep > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-divider shrink-0 z-10">
            <Button 
              variant="ghost" 
              onPress={handleBack} 
              className="font-bold rounded-xl text-foreground/70 hover:bg-divider/20 cursor-pointer"
            >
              {tOnboarding.backBtn}
            </Button>
            <Button 
              variant="primary" 
              onPress={handleNext} 
              className="font-extrabold rounded-xl text-white shadow-sm px-6 cursor-pointer"
            >
              {currentStep === stepsCount - 1 ? (
                <span>{tOnboarding.finishBtn}</span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>{tOnboarding.nextBtn}</span>
                  <ArrowRight size={16} className="stroke-[2.5]" />
                </div>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
