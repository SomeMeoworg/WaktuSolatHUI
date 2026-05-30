const fs = require('fs');

// FullScreenToggle.tsx
let fsT = fs.readFileSync('src/components/FullScreenToggle.tsx', 'utf8');
fsT = fsT.replace(/style={{ \/\* @ts-ignore \*\/ '--md-filled-tonal-icon-button-container-shape': '24px', width: '100%', height: '100%' }}/g, 'style={{ "--md-filled-tonal-icon-button-container-shape": "24px", width: "100%", height: "100%" } as any}');
fs.writeFileSync('src/components/FullScreenToggle.tsx', fsT);

// PrayerSchedule.tsx
let ps = fs.readFileSync('src/components/PrayerSchedule.tsx', 'utf8');
ps = ps.replace(/variant="secondary"/g, 'variant="flat" color="secondary"');
ps = ps.replace(/style={{/g, 'style={{');
ps = ps.replace(/'--md-filled-tonal-icon-button-container-shape': '9999px',/g, '"--md-filled-tonal-icon-button-container-shape": "9999px" as any,');
fs.writeFileSync('src/components/PrayerSchedule.tsx', ps);

// SettingsModal.tsx
let sm = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');
sm = sm.replace(/theme:/g, 'themeVariant:');
sm = sm.replace(/settings\.solatModeDuration\[(.*?)\]/g, 'settings.solatModeDuration[$1 as string]');
sm = sm.replace(/as string as string/g, 'as string');
fs.writeFileSync('src/components/SettingsModal.tsx', sm);

// hooks & lib types
let ute = fs.readFileSync('src/hooks/useThemeEngine.ts', 'utf8');
ute = ute.replace(/function useThemeEngine\(selectedTheme/g, 'function useThemeEngine(selectedTheme: string | undefined');
fs.writeFileSync('src/hooks/useThemeEngine.ts', ute);

let thm = fs.readFileSync('src/lib/theme.ts', 'utf8');
thm = thm.replace(/export function isValidColor\(src/g, 'export function isValidColor(src: any');
thm = thm.replace(/export function isValidHex\(hex/g, 'export function isValidHex(hex: any');
fs.writeFileSync('src/lib/theme.ts', thm);

console.log('Fixed typings successfully 2');
