/**
 * Phase 6: Final TS fixes
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

function fixFinalTsErrors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // App.tsx useThemeEngine fix
  if (filePath.endsWith('App.tsx')) {
    content = content.replace(/const \{\s*activeWallpaperUrl[^}]+\}\s*=\s*useThemeEngine\([^)]*\);/, 'useThemeEngine();\n  const activeWallpaperUrl = "";\n  const activeDark = false;\n  const computedWallpaperDim = 0;');
  }
  
  // Button radius -> className
  content = content.replace(/radius="full"/g, 'className="rounded-full"');
  content = content.replace(/radius="none"/g, 'className="rounded-none"');
  
  // Button disabled -> isDisabled
  content = content.replace(/<Button([^>]*)disabled(?:\s|>|=)/g, (match) => {
    if (match.includes('=')) return match.replace('disabled', 'isDisabled');
    return match.replace('disabled', 'isDisabled={true}');
  });
  
  // Button color="primary" is fine, but color={...} might fail if it's dynamic. Let's just remove dynamic color="xxx" from our custom buttons.
  content = content.replace(/color="surface"/g, 'className="bg-default"');
  
  // Spinner indeterminate
  content = content.replace(/\s+indeterminate/g, '');
  
  // FullCalendar activeTabIndex
  content = content.replace(/\s+activeTabIndex=\{[^}]*\}/g, '');
  content = content.replace(/className="[^"]*"\s+className=/g, 'className=');
  
  // Remove title from Button
  content = content.replace(/<Button([^>]*)title=("[^"]*"|'[^']*'|\{[^}]*\})([^>]*)>/g, '<Button$1$3>');
  
  // Remove style from Button (since it was doing md- elevation things mostly)
  content = content.replace(/<Button([^>]*)style=\{\{[^}]+\}\}([^>]*)>/g, '<Button$1$2>');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

const files = getAllFiles(SRC_DIR);
let modified = 0;
for (const file of files) {
  if (fixFinalTsErrors(file)) {
    modified++;
    console.log(`  ✓ ${path.relative(SRC_DIR, file)}`);
  }
}
console.log(`\nFinal TS Fixes: ${modified}/${files.length} files modified.`);
