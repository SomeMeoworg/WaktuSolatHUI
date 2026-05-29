/**
 * Phase 9: Apply HeroUI Aesthetic
 * Replaces Material Web CSS variables with HeroUI semantic Tailwind classes.
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

function applyHeroUIDesign(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Backgrounds
  content = content.replace(/bg-\[var\(--app-background\)]/g, 'bg-background');
  content = content.replace(/bg-\[var\(--app-surface\)]/g, 'bg-content1');
  content = content.replace(/bg-\[var\(--app-surface-container\)]/g, 'bg-content2');
  content = content.replace(/bg-\[var\(--app-surface-container-high\)]/g, 'bg-content3');
  content = content.replace(/bg-\[var\(--app-surface-container-highest\)]/g, 'bg-content4');
  
  // Hover Backgrounds
  content = content.replace(/hover:bg-\[var\(--app-surface-container-high\)]/g, 'hover:bg-default-200');
  content = content.replace(/hover:bg-\[var\(--app-surface-container\)]/g, 'hover:bg-default-100');
  content = content.replace(/hover:bg-\[var\(--app-primary\)]/g, 'hover:bg-primary');
  content = content.replace(/hover:bg-\[var\(--app-primary-container\)]/g, 'hover:bg-primary-100');
  
  // Foregrounds
  content = content.replace(/text-\[var\(--app-foreground\)]/g, 'text-foreground');
  content = content.replace(/text-\[var\(--app-on-surface-variant\)]/g, 'text-default-500');
  content = content.replace(/text-\[var\(--app-on-surface\)]/g, 'text-foreground');
  content = content.replace(/text-\[var\(--app-primary\)]/g, 'text-primary');
  content = content.replace(/text-\[var\(--app-primary-foreground\)]/g, 'text-primary-foreground');
  content = content.replace(/text-\[var\(--app-on-primary-container\)]/g, 'text-primary-800');
  content = content.replace(/hover:text-\[var\(--app-primary-foreground\)]/g, 'hover:text-primary-foreground');
  
  // Primary
  content = content.replace(/bg-\[var\(--app-primary\)]/g, 'bg-primary');
  content = content.replace(/bg-\[var\(--app-primary-container\)]/g, 'bg-primary-100');
  content = content.replace(/border-\[var\(--app-primary\)]/g, 'border-primary');
  
  // Borders & Dividers
  content = content.replace(/border-\[var\(--app-outline\)]\/(\d+)/g, 'border-divider');
  content = content.replace(/border-\[var\(--app-outline\)]/g, 'border-divider');
  content = content.replace(/ring-\[var\(--app-outline\)]\/(\d+)/g, 'ring-divider');
  content = content.replace(/ring-\[var\(--app-outline\)]/g, 'ring-divider');
  content = content.replace(/border-\[var\(--app-outline-variant\)]/g, 'border-divider');
  
  // Placeholder
  content = content.replace(/placeholder:text-\[var\(--app-outline\)]/g, 'placeholder:text-default-400');
  
  // Layout refinements for HeroUI
  // Replace rounded-[2rem] or rounded-[1.5rem] with standard rounded-2xl or rounded-xl
  content = content.replace(/rounded-\[2rem\]/g, 'rounded-3xl');
  content = content.replace(/rounded-\[1\.5rem\]/g, 'rounded-2xl');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

const files = getAllFiles(SRC_DIR);
let modified = 0;
for (const file of files) {
  if (applyHeroUIDesign(file)) {
    modified++;
    console.log(`  ✓ ${path.relative(SRC_DIR, file)}`);
  }
}
console.log(`\nHeroUI Design Mapping: ${modified}/${files.length} files modified.`);
