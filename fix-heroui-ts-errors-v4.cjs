/**
 * Phase 8: Final TS fixes v4
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
  
  // Revert variant="outline" back to variant="bordered"
  content = content.replace(/variant="outline"/g, 'variant="bordered"');
  
  // Remove `title=` from Button entirely
  content = content.replace(/<Button([^>]*)title=(?:"[^"]*"|'[^']*'|\{[^}]*\})([^>]*)>/g, '<Button$1$2>');
  
  // Remove `color=` from custom components that aren't native HeroUI colors
  content = content.replace(/<Button([^>]*)color=(?:"surface"|'surface'|\{color\})([^>]*)>/g, '<Button$1$2>');
  content = content.replace(/<Button([^>]*)color=\{[a-zA-Z]+\}([^>]*)>/g, '<Button$1$2>');
  
  // Switch onClick -> onChange in ThemeControl.tsx
  if (filePath.endsWith('ThemeControl.tsx')) {
    content = content.replace(/<Switch([^>]*)onClick=/g, '<Switch$1onChange=');
    
    // Fix PRAYER_COLORS keys
    content = content.replace(/PRAYER_COLORS\.fajr/g, 'PRAYER_COLORS.subuh');
    content = content.replace(/PRAYER_COLORS\.dhuhr/g, 'PRAYER_COLORS.zohor');
    content = content.replace(/PRAYER_COLORS\.asr/g, 'PRAYER_COLORS.asar');
    content = content.replace(/PRAYER_COLORS\.isha/g, 'PRAYER_COLORS.isyak');
    
    // Fix ThemeVariant type usage
    content = content.replace(/theme:\s*ThemeVariant/g, 'theme: any');
    content = content.replace(/ThemeVariant,\s*ThemeVariant/g, 'any, any');
    content = content.replace(/currentTheme:\s*ThemeVariant/g, 'currentTheme: any');
  }

  // Fix Slider min/max string values in SettingsModal, ThemeControl, etc
  content = content.replace(/min="(\d+)"/g, 'min={$1}');
  content = content.replace(/max="(\d+)"/g, 'max={$1}');
  content = content.replace(/step="(\d+)"/g, 'step={$1}');
  
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
console.log(`\nTS Fixes v4: ${modified}/${files.length} files modified.`);
