/**
 * Phase 5: Fix TS errors from HeroUI component props mismatch
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
  
  // Fix Switch icons prop
  content = content.replace(/\s+icons(?:\s|>|=)/g, (match) => {
    if (match.includes('=')) return '';
    return match.replace('icons', '');
  });
  content = content.replace(/\s+icons=\{true\}/g, '');
  content = content.replace(/\s+icons=\{false\}/g, '');
  content = content.replace(/<Switch([^>]*)icons([^>]*)>/g, '<Switch$1$2>');
  
  // Fix Button variants (assume they expect "solid" | "ghost" | "outline" | "primary" | "secondary")
  content = content.replace(/variant="flat"/g, 'variant="ghost"');
  content = content.replace(/variant="light"/g, 'variant="ghost"');
  content = content.replace(/variant="bordered"/g, 'variant="outline"');
  
  // Fix max="90" in slider which should be max={90}
  content = content.replace(/max="(\d+)"/g, 'max={$1}');
  
  // Fix missing SelectItem import
  if (content.includes('<SelectItem') && !content.includes('SelectItem') && content.includes('@heroui/react')) {
    content = content.replace(/import \{([^}]*)Select([^}]*)\} from "@heroui\/react";/, 'import {$1Select, SelectItem$2} from "@heroui/react";');
  }
  
  // Fix duplicate classNames in ZoneSelector
  if (filePath.endsWith('ZoneSelector.tsx')) {
    content = content.replace(/className="[^"]*"\s+className=/g, 'className=');
    content = content.replace(/type="button"\s+type="button"/g, 'type="button"');
  }
  
  // Fix style --md-filled-tonal-icon-button-container-shape
  content = content.replace(/style=\{\{\s*'--md-filled[^}]+\}\}/g, '');

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
console.log(`\nTS Error Fixes: ${modified}/${files.length} files modified.`);
