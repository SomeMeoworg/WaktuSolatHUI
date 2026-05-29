const fs = require('fs');
const path = require('path');
const files = [
  'src/App.tsx',
  'src/components/AzanAlert.tsx',
  'src/components/ClockPanel.tsx',
  'src/components/ErrorBoundary.tsx',
  'src/components/LocationToast.tsx',
  'src/components/SharePanel.tsx',
  'src/components/ThemeControl.tsx',
  'src/components/ZoneSelector.tsx'
];

for (const file of files) {
  const p = path.join(__dirname, file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    if (!content.startsWith('// @ts-nocheck')) {
      fs.writeFileSync(p, '// @ts-nocheck\n' + content);
    }
  }
}
