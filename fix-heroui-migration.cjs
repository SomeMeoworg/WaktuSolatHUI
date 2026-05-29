/**
 * Batch migration script: replaces all Material 3 CSS variables and component references
 * across the entire src directory to use HeroUI v3 conventions.
 * 
 * Run with: node fix-heroui-migration.cjs
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

// CSS variable replacements (order matters — more specific patterns first)
const CSS_VAR_REPLACEMENTS = [
  // Surface containers
  ['var(--md-sys-color-surface-container-lowest)', 'var(--app-surface)'],
  ['var(--md-sys-color-surface-container-low)', 'var(--app-surface)'],
  ['var(--md-sys-color-surface-container-high)', 'var(--app-surface-container-high)'],
  ['var(--md-sys-color-surface-container-highest)', 'var(--app-surface-container-highest)'],
  ['var(--md-sys-color-surface-container)', 'var(--app-surface-container)'],
  
  // Surface
  ['var(--md-sys-color-surface-variant)', 'var(--app-surface-variant)'],
  ['var(--md-sys-color-on-surface-variant)', 'var(--app-outline)'],
  ['var(--md-sys-color-surface-bright)', 'var(--app-surface)'],
  ['var(--md-sys-color-surface-dim)', 'var(--app-surface-container)'],
  ['var(--md-sys-color-surface-tint)', 'var(--app-primary)'],
  ['var(--md-sys-color-on-surface)', 'var(--app-foreground)'],
  ['var(--md-sys-color-surface)', 'var(--app-surface)'],
  
  // Primary
  ['var(--md-sys-color-on-primary-container)', 'var(--app-primary)'],
  ['var(--md-sys-color-primary-container)', 'var(--app-primary-container, hsl(var(--heroui-primary) / 0.15))'],
  ['var(--md-sys-color-on-primary)', 'var(--app-primary-foreground)'],
  ['var(--md-sys-color-primary)', 'var(--app-primary)'],
  
  // Secondary
  ['var(--md-sys-color-on-secondary-container)', 'var(--app-secondary)'],
  ['var(--md-sys-color-secondary-container)', 'var(--app-secondary-container, hsl(var(--heroui-secondary) / 0.15))'],
  ['var(--md-sys-color-on-secondary)', 'var(--app-secondary-foreground)'],
  ['var(--md-sys-color-secondary)', 'var(--app-secondary)'],
  
  // Tertiary (map to secondary in HeroUI)
  ['var(--md-sys-color-on-tertiary-container)', 'var(--app-secondary)'],
  ['var(--md-sys-color-tertiary-container)', 'var(--app-secondary-container, hsl(var(--heroui-secondary) / 0.15))'],
  ['var(--md-sys-color-on-tertiary)', 'var(--app-secondary-foreground)'],
  ['var(--md-sys-color-tertiary)', 'var(--app-secondary)'],
  
  // Error
  ['var(--md-sys-color-on-error-container)', 'var(--app-danger)'],
  ['var(--md-sys-color-error-container)', 'var(--app-danger-container, hsl(var(--heroui-danger) / 0.15))'],
  ['var(--md-sys-color-on-error)', 'var(--app-danger-foreground)'],
  ['var(--md-sys-color-error)', 'var(--app-danger)'],
  
  // Background
  ['var(--md-sys-color-on-background)', 'var(--app-foreground)'],
  ['var(--md-sys-color-background)', 'var(--app-background)'],
  
  // Outline
  ['var(--md-sys-color-outline-variant)', 'var(--app-outline)'],
  ['var(--md-sys-color-outline)', 'var(--app-outline)'],
  
  // Inverse
  ['var(--md-sys-color-inverse-surface)', 'var(--app-foreground)'],
  ['var(--md-sys-color-inverse-on-surface)', 'var(--app-background)'],
  ['var(--md-sys-color-inverse-primary)', 'var(--app-primary)'],
  
  // Shape
  ['var(--md-sys-shape-corner-extra-large)', 'var(--shape-xl)'],
  ['var(--md-sys-shape-corner-extra-small)', 'var(--shape-xs)'],
  ['var(--md-sys-shape-corner-large)', 'var(--shape-lg)'],
  ['var(--md-sys-shape-corner-medium)', 'var(--shape-md)'],
  ['var(--md-sys-shape-corner-small)', 'var(--shape-sm)'],
  ['var(--md-sys-shape-corner-full)', 'var(--shape-full)'],
  ['var(--md-sys-shape-corner-none)', '0px'],
];

// Material Web component import removals
const MD_IMPORT_PATTERN = /import\s+["']@material\/web\/[^"']+["'];?\s*\r?\n/g;

// Material Web component tag replacements (in JSX)
// These will be handled per-component in individual files

function getAllFiles(dir, exts = ['.tsx', '.ts', '.css']) {
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

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // 1. Remove Material Web imports
  content = content.replace(MD_IMPORT_PATTERN, '');
  
  // 2. Replace CSS variables
  for (const [from, to] of CSS_VAR_REPLACEMENTS) {
    content = content.split(from).join(to);
  }
  
  // 3. Replace M3 typography CSS class names
  content = content.replace(/md3-display-large/g, 'text-6xl font-light tracking-tight');
  content = content.replace(/md3-display-medium/g, 'text-5xl font-light');
  content = content.replace(/md3-display-small/g, 'text-4xl font-light');
  content = content.replace(/md3-headline-large/g, 'text-3xl font-bold');
  content = content.replace(/md3-headline-medium/g, 'text-2xl font-bold');
  content = content.replace(/md3-headline-small/g, 'text-xl font-bold');
  content = content.replace(/md3-title-large/g, 'text-xl font-semibold');
  content = content.replace(/md3-title-medium/g, 'text-base font-semibold');
  content = content.replace(/md3-title-small/g, 'text-sm font-medium');
  content = content.replace(/md3-body-large/g, 'text-base');
  content = content.replace(/md3-body-medium/g, 'text-sm');
  content = content.replace(/md3-body-small/g, 'text-xs');
  content = content.replace(/md3-label-large/g, 'text-sm font-semibold');
  content = content.replace(/md3-label-medium/g, 'text-xs font-semibold tracking-wide');
  content = content.replace(/md3-label-small/g, 'text-xs font-semibold tracking-wide');
  
  // 4. Replace layout class names
  content = content.replace(/m3e-panel-right-scrollable/g, 'hui-panel-right-scrollable');
  content = content.replace(/m3e-panel-right/g, 'hui-panel-right');
  content = content.replace(/m3e-panel-left/g, 'hui-panel-left');
  content = content.replace(/m3e-main-content/g, 'hui-main-content');
  content = content.replace(/m3e-app-container/g, 'hui-app-container');
  content = content.replace(/m3e-header/g, 'hui-header');
  content = content.replace(/m3e-clock-container/g, 'hui-clock-container');
  
  // 5. Replace custom-m3e-tooltip
  content = content.replace(/custom-m3e-tooltip/g, 'custom-hui-tooltip');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

// Run the migration
const files = getAllFiles(SRC_DIR);
let modified = 0;
for (const file of files) {
  if (migrateFile(file)) {
    modified++;
    console.log(`  ✓ ${path.relative(SRC_DIR, file)}`);
  }
}
console.log(`\nMigrated ${modified}/${files.length} files.`);
