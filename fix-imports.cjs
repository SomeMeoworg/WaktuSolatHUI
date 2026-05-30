const fs = require('fs');
const path = require('path');

const fixes = [
  // Import path fixes: @nextui-org/react -> @heroui/react
  { file: 'src/App.tsx', from: '@nextui-org/react', to: '@heroui/react' },
  { file: 'src/components/ThemeControl.tsx', from: '@nextui-org/react', to: '@heroui/react' },
  { file: 'src/components/SolatMode.tsx', from: '@nextui-org/react', to: '@heroui/react' },
  { file: 'src/components/PrayerSchedule.tsx', from: '@nextui-org/react', to: '@heroui/react' },
  { file: 'src/components/OnboardingFlow.tsx', from: '@nextui-org/react', to: '@heroui/react' },
  { file: 'src/components/MapModal.tsx', from: '@nextui-org/react', to: '@heroui/react' },
  { file: 'src/components/LocationToast.tsx', from: '@nextui-org/react', to: '@heroui/react' },
  { file: 'src/components/FullScreenToggle.tsx', from: '@nextui-org/react', to: '@heroui/react' },
  { file: 'src/components/FullCalendar.tsx', from: '@nextui-org/react', to: '@heroui/react' },
  { file: 'src/components/ErrorBoundary.tsx', from: '@nextui-org/react', to: '@heroui/react' },
  { file: 'src/components/ClockPanel.tsx', from: '@nextui-org/react', to: '@heroui/react' },
  { file: 'src/components/AzanAlert.tsx', from: '@nextui-org/react', to: '@heroui/react' },
];

let count = 0;
for (const fix of fixes) {
  const filePath = path.resolve(fix.file);
  if (!fs.existsSync(filePath)) { console.log(`SKIP: ${fix.file} not found`); continue; }
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(fix.from)) {
    content = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
    fs.writeFileSync(filePath, content);
    count++;
    console.log(`FIXED: ${fix.file}`);
  } else {
    console.log(`SKIP: ${fix.file} (already correct or not found)`);
  }
}

// Fix heroui-plugin.ts
const pluginPath = path.resolve('src/heroui-plugin.ts');
if (fs.existsSync(pluginPath)) {
  fs.writeFileSync(pluginPath, '// HeroUI v3 — no plugin export needed\nexport {};\n');
  console.log('FIXED: src/heroui-plugin.ts');
  count++;
}

console.log(`\nDone. Fixed ${count} files.`);
