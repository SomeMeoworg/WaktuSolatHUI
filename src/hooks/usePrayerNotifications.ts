import { useState, useEffect, useRef, useCallback } from 'react';
import { PrayerData, PrayerKey, Preferences, PrayerPreference, NotificationSound, PreAlertTime } from '../types';
import { PRAYER_NAMES } from '../components/PrayerSchedule';
import { useAppContext } from '../AppContext';

const DEFAULT_PREFS: Preferences = {
  imsak: { enabled: false, sound: 'default', preAlert: 0, offset: 0, iqamahOffset: 10 },
  fajr: { enabled: false, sound: 'default', preAlert: 0, offset: 0, iqamahOffset: 20 },
  syuruk: { enabled: false, sound: 'default', preAlert: 0, offset: 0, iqamahOffset: 0 },
  dhuhr: { enabled: false, sound: 'default', preAlert: 0, offset: 0, iqamahOffset: 15 },
  asr: { enabled: false, sound: 'default', preAlert: 0, offset: 0, iqamahOffset: 10 },
  maghrib: { enabled: false, sound: 'default', preAlert: 0, offset: 0, iqamahOffset: 5 },
  isha: { enabled: false, sound: 'default', preAlert: 0, offset: 0, iqamahOffset: 15 }
};

export function usePrayerNotifications(
  currentTime: Date, 
  todayData: PrayerData | null
) {
  const { t } = useAppContext();
  const [preferences, setPreferences] = useState<Preferences>(() => {
    if (typeof localStorage !== "undefined") {
      const savedV2 = localStorage.getItem('prayer_notifications_v2');
      if (savedV2) {
        return { ...DEFAULT_PREFS, ...JSON.parse(savedV2) };
      }
      
      const savedV1 = localStorage.getItem('prayer_notifications');
      if (savedV1) {
        // migration from simple boolean
        const oldPref = JSON.parse(savedV1);
        const newPref: Partial<Preferences> = {};
        for (const k in DEFAULT_PREFS) {
          const key = k as PrayerKey;
          newPref[key] = { enabled: oldPref[key] || false, sound: 'default', preAlert: 0, offset: 0, iqamahOffset: DEFAULT_PREFS[key].iqamahOffset };
        }
        return { ...DEFAULT_PREFS, ...newPref };
      }
    }
    return DEFAULT_PREFS;
  });

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  
  const notifiedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem('prayer_notifications_v2', JSON.stringify(preferences));
    }
  }, [preferences]);

  const requestPermission = async () => {
    if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
      const p = await Notification.requestPermission();
      setPermission(p);
    }
  };

  const togglePreference = async (key: PrayerKey) => {
    let p = permission;
    if (p === 'default' && !preferences[key].enabled) {
      if (typeof Notification !== "undefined") {
        p = await Notification.requestPermission();
        setPermission(p);
      }
    }
    
    setPreferences(prev => ({ 
      ...prev, 
      [key]: { ...prev[key], enabled: !prev[key].enabled } 
    }));
  };

  const updatePreference = (key: PrayerKey, updates: Partial<PrayerPreference>) => {
    setPreferences(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates }
    }));
  };

  const playSound = useCallback((sound: NotificationSound, message: string) => {
    if (sound === 'voice') {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = t("language") === "ms" ? 'ms-MY' : 'en-US';
        window.speechSynthesis.speak(utterance);
      }
      return;
    } 
    
    // Synthesized sounds
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const startTime = ctx.currentTime;
      
      const playTone = (freq: number, type: OscillatorType, delay: number, dur: number, vol = 0.1) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime + delay);
        
        // Attack, Sustain, Decay
        gain.gain.setValueAtTime(0, startTime + delay);
        gain.gain.linearRampToValueAtTime(vol, startTime + delay + Math.min(0.05, dur * 0.1));
        gain.gain.exponentialRampToValueAtTime(0.00001, startTime + delay + dur);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime + delay);
        osc.stop(startTime + delay + dur);
      };

      if (sound === 'beep') {
        playTone(880, 'sine', 0, 0.5, 0.1);
        playTone(880, 'sine', 0.6, 0.5, 0.1);
      } else if (sound === 'chime') {
        playTone(523.25, 'sine', 0, 1.2, 0.15); // C5
        playTone(659.25, 'sine', 0.15, 1.2, 0.15); // E5
        playTone(783.99, 'sine', 0.3, 2.0, 0.15); // G5
        playTone(1046.50, 'sine', 0.45, 2.5, 0.2); // C6
      } else if (sound === 'soft-chime') {
        playTone(440, 'triangle', 0, 1.5, 0.08); // A4
        playTone(329.63, 'triangle', 0.4, 2.0, 0.08); // E4
        playTone(440, 'triangle', 0.8, 1.5, 0.05); // A4
      } else if (sound === 'azan1' || sound === 'azan2') {
        const file = sound === 'azan1' ? '/audio/azan-makkah.mp3' : '/audio/azan-madinah.mp3';
        const audio = new Audio(file);
        audio.volume = 0.5;
        audio.play().catch(err => {
          console.warn("Real audio playback failed, falling back to synthesized tone", err);
          if (sound === 'azan1') {
            // Simple 4-note resonant sequence echoing Allahu Akbar
            playTone(392.00, 'sine', 0, 1.2, 0.2); // G4
            playTone(392.00, 'sine', 1.2, 2.0, 0.2); // G4
            playTone(349.23, 'sine', 3.4, 0.8, 0.2); // F4
            playTone(392.00, 'sine', 4.2, 2.5, 0.2); // G4
          } else {
            // Different tone mimicking a traditional call pattern
            playTone(440.00, 'sine', 0, 1.2, 0.2); // A4
            playTone(440.00, 'sine', 1.4, 1.5, 0.2); // A4
            playTone(493.88, 'sine', 3.0, 1.0, 0.2); // B4
            playTone(440.00, 'sine', 4.2, 2.5, 0.2); // A4
          }
        });
      }
    } catch (e) {
      console.warn("AudioContext playback failed", e);
    }
  }, [t]);

  useEffect(() => {
    if (!todayData || permission !== 'granted') return;

    const timeString = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
    const secString = currentTime.getSeconds();
    
    if (timeString === '00:00' && secString === 0) {
      notifiedRef.current = {};
    }

    if (secString !== 0) return;

    Object.keys(preferences).forEach((key) => {
      const pKey = key as PrayerKey;
      const pref = preferences[pKey];
      
      if (pref.enabled && todayData[pKey]) {
        const pTimeStr = todayData[pKey].substring(0, 5);
        
        // Exact time notification
        const notificationKey = `${todayData.date}-${pKey}-main`;
        if (pTimeStr === timeString && !notifiedRef.current[notificationKey]) {
          notifiedRef.current[notificationKey] = true;
          
          const prayerName = t(pKey as any);
          const body = t("prayerTimeNow").replace("{prayer}", prayerName);
          const title = t("prayerNotification").replace("{prayer}", prayerName);
          
          try {
            new Notification(title, {
              body,
              requireInteraction: true
            });
            playSound(pref.sound, body);
          } catch (e) {
            console.error("Failed to show notification:", e);
          }
        }
        
        // Pre-alert notification
        if (pref.preAlert > 0) {
          const [h, m] = pTimeStr.split(':').map(Number);
          const pDataDate = new Date(); // Same day
          pDataDate.setHours(h, m, 0, 0);
          
          pDataDate.setMinutes(pDataDate.getMinutes() - pref.preAlert);
          const preAlertStr = `${pDataDate.getHours().toString().padStart(2, '0')}:${pDataDate.getMinutes().toString().padStart(2, '0')}`;
          
          const preAlertKey = `${todayData.date}-${pKey}-pre`;
          
          if (preAlertStr === timeString && !notifiedRef.current[preAlertKey]) {
            notifiedRef.current[preAlertKey] = true;
            
            const prayerName = t(pKey as any);
            const preBody = t("preAlertMessage").replace("{minutes}", pref.preAlert.toString()).replace("{prayer}", prayerName);
            const preTitle = t("preAlertNotification").replace("{prayer}", prayerName);
            
            try {
              new Notification(preTitle, {
                body: preBody,
                requireInteraction: true
              });
              
              if (pref.sound === 'default') {
                // Rely on native Notification sound
              } else {
                 playSound(pref.sound, preBody);
              }
            } catch (e) {
              console.error("Failed to show pre-alert notification:", e);
            }
          }
        }
      }
    });
  }, [currentTime, todayData, preferences, permission, playSound, t]);

  return { preferences, togglePreference, updatePreference, permission, requestPermission, playSound };
}
