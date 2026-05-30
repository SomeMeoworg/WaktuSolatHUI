const fs = require('fs');

// PrayerSchedule.tsx
let ps = fs.readFileSync('src/components/PrayerSchedule.tsx', 'utf8');
ps = ps.replace(/@heroui\/react/g, '@nextui-org/react');
fs.writeFileSync('src/components/PrayerSchedule.tsx', ps);

// FullScreenToggle.tsx
let fsT = fs.readFileSync('src/components/FullScreenToggle.tsx', 'utf8');
fsT = fsT.replace(/variant="secondary"/g, 'variant="flat" color="secondary"');
fsT = fsT.replace(/style={{ '--md-filled-tonal/g, 'style={{ /* @ts-ignore */ \'--md-filled-tonal');
fs.writeFileSync('src/components/FullScreenToggle.tsx', fsT);

// SettingsModal.tsx
let sm = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');
sm = sm.replace(/settings\.theme /g, 'settings.themeVariant ');
sm = sm.replace(/settings\.theme,/g, 'settings.themeVariant,');
sm = sm.replace(/theme: val/g, 'themeVariant: val');
sm = sm.replace(/settings\.hijriOffset/g, 'settings.hijriAdjustment');
sm = sm.replace(/hijriOffset: /g, 'hijriAdjustment: ');
sm = sm.replace(/settings\.solatModeDuration\[key\]/g, 'settings.solatModeDuration[key as string]');
sm = sm.replace(/settings\.solatModeDuration\[state\.selected\]/g, 'settings.solatModeDuration[state.selected as string]');
fs.writeFileSync('src/components/SettingsModal.tsx', sm);

// ZoneSelector.tsx
let zs = fs.readFileSync('src/components/ZoneSelector.tsx', 'utf8');
zs = zs.replace(/radius="xl"/g, 'radius="lg"');
fs.writeFileSync('src/components/ZoneSelector.tsx', zs);

// main.tsx
let mn = fs.readFileSync('src/main.tsx', 'utf8');
mn = mn.replace(/HeroUIProvider/g, 'NextUIProvider');
fs.writeFileSync('src/main.tsx', mn);

// hero.ts (probably tailwind.config)
let hr = fs.readFileSync('src/hero.ts', 'utf8');
hr = hr.replace(/heroui/g, 'nextui');
fs.writeFileSync('src/hero.ts', hr);

// hooks & lib types
let ute = fs.readFileSync('src/hooks/useThemeEngine.ts', 'utf8');
ute = ute.replace(/function useThemeEngine\(selectedTheme/g, 'function useThemeEngine(selectedTheme: string | undefined');
fs.writeFileSync('src/hooks/useThemeEngine.ts', ute);

let thm = fs.readFileSync('src/lib/theme.ts', 'utf8');
thm = thm.replace(/function isValidColor\(src/g, 'function isValidColor(src: any');
thm = thm.replace(/function isValidHex\(hex/g, 'function isValidHex(hex: any');
fs.writeFileSync('src/lib/theme.ts', thm);

console.log('Fixed typings successfully');
