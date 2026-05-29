/**
 * Phase 2 migration v4: Safely replace Material Web tags with HeroUI tags
 * This script only renames tags to valid React tags/components without touching attributes
 * to prevent breaking JSX arrow functions and complex syntax.
 * 
 * Run with: node fix-heroui-components-v4.cjs
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

function migrateComponents(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Track which components were added so we can insert the import
  const herouiImports = new Set();
  
  // Clean up ts-ignore
  content = content.replace(/\s*{\/\*\s*@ts-ignore\s*\*\/}\s*\n(\s*<md-)/g, '\n$1');
  
  // Remove material elements that have no direct HeroUI equivalent (like ripple)
  content = content.replace(/<md-ripple[^>]*>\s*<\/md-ripple>/g, '');
  content = content.replace(/<md-ripple[^>]*\/>/g, '');
  content = content.replace(/<md-elevation[^>]*>\s*<\/md-elevation>/g, '');
  content = content.replace(/<md-elevation[^>]*\/>/g, '');
  
  // Helper to replace opening/closing tags safely
  const replaceTag = (oldTag, newTag, requiresImport = null) => {
    // Open tag (matches <md-switch or <md-switch>)
    const openRegex = new RegExp(`<${oldTag}(?=\\s|>|\\/>)`, 'g');
    if (openRegex.test(content)) {
      if (requiresImport) herouiImports.add(requiresImport);
      content = content.replace(openRegex, `<${newTag}`);
    }
    // Close tag
    const closeRegex = new RegExp(`<\\/${oldTag}>`, 'g');
    content = content.replace(closeRegex, `</${newTag.split(' ')[0]}>`); // newTag might be "Button color='primary'", we just want "</Button>"
  };

  // 1. Buttons
  replaceTag('md-filled-button', 'Button color="primary"', 'Button');
  replaceTag('md-outlined-button', 'Button variant="bordered"', 'Button');
  replaceTag('md-text-button', 'Button variant="light"', 'Button');
  replaceTag('md-elevated-button', 'Button variant="shadow"', 'Button');
  replaceTag('md-filled-tonal-button', 'Button variant="flat"', 'Button');
  
  // 2. Icon Buttons
  replaceTag('md-icon-button', 'Button isIconOnly variant="light" radius="full"', 'Button');
  replaceTag('md-filled-icon-button', 'Button isIconOnly color="primary" radius="full"', 'Button');
  replaceTag('md-filled-tonal-icon-button', 'Button isIconOnly variant="flat" radius="full"', 'Button');
  replaceTag('md-outlined-icon-button', 'Button isIconOnly variant="bordered" radius="full"', 'Button');
  
  // 3. Inputs
  replaceTag('md-outlined-text-field', 'Input variant="bordered"', 'Input');
  replaceTag('md-filled-text-field', 'Input variant="flat"', 'Input');
  
  // 4. Switches & Checkboxes
  replaceTag('md-switch', 'Switch', 'Switch');
  replaceTag('md-checkbox', 'Checkbox', 'Checkbox');
  
  // 5. Sliders
  replaceTag('md-slider', 'Slider', 'Slider');
  
  // 6. Loaders & Dividers
  replaceTag('md-circular-progress', 'Spinner', 'Spinner');
  replaceTag('md-linear-progress', 'Progress', 'Progress');
  replaceTag('md-divider', 'Divider', 'Divider');
  
  // 7. Chips / Filter Chips
  // We use Button with a rounded-full class for Chips in HeroUI
  replaceTag('md-filter-chip', 'Button radius="full" variant="flat"', 'Button');
  
  // 8. Selects
  // HeroUI has a Select component, we can try to map it directly
  replaceTag('md-outlined-select', 'Select variant="bordered"', 'Select');
  replaceTag('md-select-option', 'SelectItem', 'Select');
  
  // 9. Lists -> standard divs
  replaceTag('md-list', 'div className="flex flex-col gap-2"');
  replaceTag('md-list-item', 'div className="px-4 py-3 rounded-xl hover:bg-default-100 transition-colors flex items-center gap-3 cursor-pointer"');
  
  // 10. Tabs (since HeroUI tabs structure is totally different, we map them to custom flex buttons)
  replaceTag('md-tabs', 'div className="flex w-full border-b border-divider"');
  replaceTag('md-primary-tab', 'button type="button" className="flex-1 px-4 py-3 text-sm font-semibold transition-colors hover:bg-default-100 border-b-2 border-transparent focus:outline-none data-[active]:border-primary data-[active]:text-primary"');
  replaceTag('md-secondary-tab', 'button type="button" className="flex-1 px-4 py-3 text-sm font-semibold transition-colors hover:bg-default-100 border-b-2 border-transparent focus:outline-none data-[active]:border-primary data-[active]:text-primary"');

  // Fix `selected` -> `isSelected` for HeroUI Switch, Checkbox, Tabs
  content = content.replace(/\bselected=\{([^}]+)\}/g, 'isSelected={$1}');
  
  // Fix empty slots references
  content = content.replace(/\s*slot="[^"]+"/g, '');
  
  // Cleanup leftover Material Icons
  content = content.replace(/<md-icon>close<\/md-icon>/g, '<X size={18} />');
  content = content.replace(/<md-icon>search<\/md-icon>/g, '<Search size={18} />');
  content = content.replace(/<md-icon>my_location<\/md-icon>/g, '<Crosshair size={18} />');
  content = content.replace(/<md-icon>[^<]*<\/md-icon>/g, '');
  content = content.replace(/<span className="material-icon-placeholder">[^<]*<\/span>/g, '');

  // Add HeroUI imports if needed
  if (herouiImports.size > 0 && filePath.endsWith('.tsx')) {
    const importStr = `import { ${Array.from(herouiImports).join(', ')} } from "@heroui/react";\n`;
    // Find the last import statement or the beginning of the file
    if (!content.includes('@heroui/react')) {
      const match = content.match(/^import .*?;\n/m);
      if (match) {
        content = content.replace(/^(import .*?;\n)(?!import)/m, `$1${importStr}`);
      } else {
        content = importStr + content;
      }
    }
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
  if (migrateComponents(file)) {
    modified++;
    console.log(`  ✓ ${path.relative(SRC_DIR, file)}`);
  }
}
console.log(`\nComponent migration (Safe): ${modified}/${files.length} files modified.`);
