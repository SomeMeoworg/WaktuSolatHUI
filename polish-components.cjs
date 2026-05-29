/**
 * Phase 11: Polish core components to HeroUI aesthetic
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src/components');

function getAllFiles(dir, exts = ['.tsx', '.ts']) {
  let results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && item.name !== 'node_modules' && item.name !== 'dist') {
      results = results.concat(getAllFiles(fullPath, exts));
    } else if (item.isFile() && exts.some(ext => item.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

function polishComponent(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Replace old material typographies with tailwind equivalents
  content = content.replace(/md3-headline-medium/g, 'text-3xl font-bold tracking-tight');
  content = content.replace(/md3-title-medium/g, 'text-lg font-semibold');
  content = content.replace(/md3-title-small/g, 'text-base font-medium');
  content = content.replace(/md3-body-medium/g, 'text-medium text-default-500');
  content = content.replace(/md3-body-small/g, 'text-small text-default-400');
  content = content.replace(/md3-label-large/g, 'text-small font-semibold tracking-wide uppercase');
  content = content.replace(/md3-display-medium/g, 'text-5xl font-bold tracking-tighter');
  
  // Replace elevation with HeroUI shadows
  content = content.replace(/md3-elevation-1/g, 'shadow-sm');
  content = content.replace(/md3-elevation-2/g, 'shadow-medium');
  content = content.replace(/md3-elevation-3/g, 'shadow-large');
  
  // Card replacements
  content = content.replace(/bg-content1 rounded-2xl p-4/g, 'glass-card p-4');
  content = content.replace(/bg-content2 rounded-2xl/g, 'glass-panel rounded-2xl');
  content = content.replace(/bg-content3 rounded-2xl/g, 'bg-default-200/50 backdrop-blur-md rounded-2xl');
  
  // Prayer highlighting aesthetic in PrayerSchedule.tsx
  if (filePath.endsWith('PrayerSchedule.tsx')) {
     content = content.replace(/className="([^"]*)bg-primary([^"]*)"/g, (match, p1, p2) => {
        // If it's a solid bg-primary row, let's make it a nice HeroUI highlighted row
        if (p1.includes('flex-1') && !p1.includes('text')) {
             return `className="${p1}bg-primary text-primary-foreground shadow-medium transform scale-[1.02] transition-transform${p2}"`;
        }
        return match;
     });
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

const files = getAllFiles(SRC_DIR);
let modified = 0;
for (const file of files) {
  if (polishComponent(file)) {
    modified++;
    console.log(`  ✓ ${path.relative(SRC_DIR, file)}`);
  }
}
console.log(`\nComponent Polish: ${modified}/${files.length} files modified.`);
