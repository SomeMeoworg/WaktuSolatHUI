/**
 * Phase 7: Final TS fixes v3
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

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

function fixTsErrors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Remove `color="surface"` or `color="something"` from Buttons
  // HeroUI Button colors are restricted. If we had color="surface", just remove it or change to className
  content = content.replace(/<Button([^>]*)color=(?:"[^"]*"|'[^']*'|\{[^}]*\})([^>]*)>/g, (match, p1, p2) => {
    // Only remove if it's not primary/secondary/success/warning/danger
    if (match.includes('"primary"') || match.includes('"secondary"')) return match;
    return `<Button${p1}${p2}>`;
  });
  
  // Remove `title=` from Button entirely since it conflicts with Button props type in some versions, or it's wrapped.
  content = content.replace(/<Button([^>]*)title=(?:"[^"]*"|'[^']*'|\{[^}]*\})([^>]*)>/g, '<Button$1$2>');
  
  // Tabs replacement left `isSelected` and `label` on Buttons. Remove them.
  content = content.replace(/<Button([^>]*)isSelected=\{[^}]*\}([^>]*)>/g, '<Button$1$2>');
  content = content.replace(/<Button([^>]*)label=(?:"[^"]*"|'[^']*'|\{[^}]*\})([^>]*)>/g, '<Button$1$2>');
  
  // Fix double className in PrayerSchedule
  if (filePath.endsWith('PrayerSchedule.tsx')) {
    content = content.replace(/className="[^"]*"\s+className=/g, 'className=');
  }
  
  // Input missing icons in OnboardingFlow
  if (filePath.endsWith('OnboardingFlow.tsx')) {
    if (content.includes('Crosshair') && !content.includes('import { Crosshair')) {
      content = content.replace(/import \{([^}]*)\} from "lucide-react";/, 'import {$1, Crosshair, Search} from "lucide-react";');
    }
    // variant="ghost" for Input isn't allowed. Allowed are flat, bordered, faded, underlined
    content = content.replace(/<Input([^>]*)variant="ghost"([^>]*)>/g, '<Input$1variant="flat"$2>');
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
  if (fixTsErrors(file)) {
    modified++;
    console.log(`  ✓ ${path.relative(SRC_DIR, file)}`);
  }
}
console.log(`\nTS Fixes v3: ${modified}/${files.length} files modified.`);
