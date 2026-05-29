/**
 * Phase 2 migration: Replace Material Web component JSX tags with HeroUI React components.
 * 
 * This handles the actual HTML/JSX component tag replacements.
 * Run with: node fix-heroui-components.cjs
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
  
  // Remove all remaining @ts-ignore comments that were for Material Web
  // Only remove @ts-ignore that is immediately before md- elements
  content = content.replace(/\s*{\/\*\s*@ts-ignore\s*\*\/}\s*\n(\s*<md-)/g, '\n$1');
  
  // --- Replace Material Web component JSX tags ---
  
  // md-ripple → remove entirely (HeroUI has built-in interactions)
  content = content.replace(/<md-ripple[^>]*>\s*<\/md-ripple>/g, '');
  content = content.replace(/<md-ripple[^>]*\/>/g, '');
  
  // md-elevation → remove entirely (use Tailwind shadow)
  content = content.replace(/<md-elevation[^>]*>\s*<\/md-elevation>/g, '');
  content = content.replace(/<md-elevation[^>]*\/>/g, '');
  
  // md-divider → <hr />
  content = content.replace(/<md-divider[^>]*>\s*<\/md-divider>/g, '<hr className="border-[var(--app-outline)]/10" />');
  content = content.replace(/<md-divider[^>]*\/>/g, '<hr className="border-[var(--app-outline)]/10" />');
  
  // md-circular-progress → spinner div
  content = content.replace(/<md-circular-progress[^>]*>\s*<\/md-circular-progress>/g, 
    '<div className="w-8 h-8 border-3 border-[var(--app-primary)]/30 border-t-[var(--app-primary)] rounded-full animate-spin" />');
  
  // md-linear-progress → progress bar div
  content = content.replace(/<md-linear-progress[^>]*>\s*<\/md-linear-progress>/g, 
    '<div className="w-full h-1 bg-[var(--app-primary)]/20 rounded-full overflow-hidden"><div className="h-full bg-[var(--app-primary)] rounded-full animate-pulse w-1/2" /></div>');
  
  // md-icon with text content → lucide icons are already used, just remove md-icon wrappers
  content = content.replace(/<md-icon[^>]*>([^<]*)<\/md-icon>/g, (match, iconName) => {
    // If it's just a Material icon name like "close", "search" etc, keep the text
    return `<span className="material-icon-placeholder">${iconName.trim()}</span>`;
  });
  
  // md-switch → native button-based toggle switch
  // Complex pattern: <md-switch selected={...} onChange={...} icons></md-switch>
  content = content.replace(
    /<md-switch\s+([^>]*)>\s*<\/md-switch>/g,
    (match, attrs) => {
      // Extract selected and onChange/onClick
      const selectedMatch = attrs.match(/selected=\{([^}]+)\}/);
      const onChangeMatch = attrs.match(/onChange=\{([^}]+)\}/);
      const onClickMatch = attrs.match(/onClick=\{([^}]+)\}/);
      
      const selected = selectedMatch ? selectedMatch[1] : 'false';
      const handler = onChangeMatch 
        ? `onChange={${onChangeMatch[1]}}` 
        : onClickMatch 
          ? `onClick={${onClickMatch[1]}}` 
          : '';
      
      return `<button
                type="button"
                role="switch"
                aria-checked={${selected}}
                ${handler}
                className={\`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 \${${selected} ? 'bg-[var(--app-primary)]' : 'bg-[var(--app-outline)]/30'}\`}
              >
                <span className={\`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 \${${selected} ? 'translate-x-6' : 'translate-x-1'}\`} />
              </button>`;
    }
  );
  
  // md-filter-chip → button with chip styling
  content = content.replace(
    /<md-filter-chip\s+([^>]*)>\s*<\/md-filter-chip>/g,
    (match, attrs) => {
      const labelMatch = attrs.match(/label=\{([^}]+)\}/);
      const selectedMatch = attrs.match(/selected=\{([^}]+)\}/);
      const onClickMatch = attrs.match(/onClick=\{([^}]+)\}/);
      const keyMatch = attrs.match(/key=\{([^}]+)\}/);
      
      const label = labelMatch ? labelMatch[1] : '""';
      const selected = selectedMatch ? selectedMatch[1] : 'false';
      const onClick = onClickMatch ? `onClick={${onClickMatch[1]}}` : '';
      const key = keyMatch ? `key={${keyMatch[1]}}` : '';
      
      return `<button
                type="button"
                ${key}
                ${onClick}
                className={\`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border \${${selected} ? 'bg-[var(--app-primary)] text-[var(--app-primary-foreground)] border-[var(--app-primary)] shadow-sm' : 'bg-[var(--app-surface-container)] text-[var(--app-foreground)] border-[var(--app-outline)]/20 hover:bg-[var(--app-surface-container-high)]'}\`}
              >{${label}}</button>`;
    }
  );
  
  // md-tabs and md-primary-tab → custom tab component
  // First, let's mark md-tabs blocks 
  content = content.replace(/<md-tabs[^>]*>/g, '<div className="flex border-b border-[var(--app-outline)]/10">');
  content = content.replace(/<\/md-tabs>/g, '</div>');
  
  content = content.replace(
    /<md-primary-tab\s+([^>]*)>([\s\S]*?)<\/md-primary-tab>/g,
    (match, attrs, children) => {
      const onClickMatch = attrs.match(/onClick=\{([^}]+)\}/);
      const onClick = onClickMatch ? `onClick={${onClickMatch[1]}}` : '';
      // Clean children of slot markup
      let cleanChildren = children
        .replace(/<span\s+slot="icon">/g, '<span className="mr-2">')
        .replace(/<md-icon\s+slot="icon">[^<]*<\/md-icon>/g, '');
      
      return `<button type="button" ${onClick} className="flex-1 px-4 py-3 text-sm font-semibold text-center transition-colors hover:bg-[var(--app-surface-container)] border-b-2 border-transparent focus:outline-none data-[active]:border-[var(--app-primary)] data-[active]:text-[var(--app-primary)]">${cleanChildren}</button>`;
    }
  );
  
  // md-icon-button → button with icon styling
  content = content.replace(
    /<md-icon-button\s+([\s\S]*?)>([\s\S]*?)<\/md-icon-button>/g,
    (match, attrs, children) => {
      const onClickMatch = attrs.match(/onClick=\{([^}]+)\}/);
      const classMatch = attrs.match(/className=\{([^}]+)\}/);
      const titleMatch = attrs.match(/title=\{([^}]+)\}/);
      const styleMatch = attrs.match(/style=\{([^}]+)\}/);
      
      const onClick = onClickMatch ? `onClick={${onClickMatch[1]}}` : '';
      const className = classMatch ? classMatch[1] : '""';
      const title = titleMatch ? `title={${titleMatch[1]}}` : '';
      
      // Clean children
      let cleanChildren = children
        .replace(/<md-icon>[^<]*<\/md-icon>/g, '')
        .trim();
      
      return `<button type="button" ${onClick} ${title} className={"w-10 h-10 rounded-full flex items-center justify-center text-[var(--app-foreground)] hover:bg-[var(--app-surface-container)] transition-colors " + (${className})}>${cleanChildren}</button>`;
    }
  );
  
  // md-filled-tonal-icon-button → button with tonal styling
  content = content.replace(
    /<md-filled-tonal-icon-button\s+([\s\S]*?)>([\s\S]*?)<\/md-filled-tonal-icon-button>/g,
    (match, attrs, children) => {
      const onClickMatch = attrs.match(/onClick=\{([^}]+)\}/);
      const titleMatch = attrs.match(/title=\{([^}]+)\}/);
      const ariaMatch = attrs.match(/aria-label=\{([^}]+)\}/);
      const styleMatch = attrs.match(/style=\{([^}]+)\}/);
      
      const onClick = onClickMatch ? `onClick={${onClickMatch[1]}}` : '';
      const title = titleMatch ? `title={${titleMatch[1]}}` : '';
      const aria = ariaMatch ? `aria-label={${ariaMatch[1]}}` : '';
      
      let cleanChildren = children.trim();
      
      return `<button type="button" ${onClick} ${title} ${aria} className="w-full h-full rounded-2xl flex items-center justify-center bg-[var(--app-surface-container-high)] text-[var(--app-foreground)] hover:bg-[var(--app-primary)] hover:text-[var(--app-primary-foreground)] transition-colors shadow-sm">${cleanChildren}</button>`;
    }
  );
  
  // md-filled-tonal-button → button with tonal styling
  content = content.replace(
    /<md-filled-tonal-button\s+([\s\S]*?)>([\s\S]*?)<\/md-filled-tonal-button>/g,
    (match, attrs, children) => {
      const onClickMatch = attrs.match(/onClick=\{([^}]+)\}/);
      const disabledMatch = attrs.match(/disabled=\{([^}]+)\}/);
      const classMatch = attrs.match(/className=\{?["']([^"'}]+)["']\}?/);
      
      const onClick = onClickMatch ? `onClick={${onClickMatch[1]}}` : '';
      const disabled = disabledMatch ? `disabled={${disabledMatch[1]}}` : '';
      const extraClass = classMatch ? classMatch[1] : '';
      
      let cleanChildren = children
        .replace(/<[^>]*slot="icon"[^>]*\/>/g, '')
        .trim();
      
      return `<button type="button" ${onClick} ${disabled} className="px-6 py-3 rounded-2xl font-semibold bg-[var(--app-surface-container-high)] text-[var(--app-foreground)] hover:bg-[var(--app-primary)] hover:text-[var(--app-primary-foreground)] transition-all shadow-sm disabled:opacity-50 ${extraClass}">${cleanChildren}</button>`;
    }
  );
  
  // md-filled-icon-button → button 
  content = content.replace(
    /<md-filled-icon-button\s+([\s\S]*?)>([\s\S]*?)<\/md-filled-icon-button>/g,
    (match, attrs, children) => {
      const onClickMatch = attrs.match(/onClick=\{([^}]+)\}/);
      const onClick = onClickMatch ? `onClick={${onClickMatch[1]}}` : '';
      return `<button type="button" ${onClick} className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--app-primary)] text-[var(--app-primary-foreground)] hover:opacity-90 transition-all shadow-sm">${children.trim()}</button>`;
    }
  );
  
  // md-outlined-text-field → input
  content = content.replace(
    /<md-outlined-text-field\s+([\s\S]*?)>([\s\S]*?)<\/md-outlined-text-field>/g,
    (match, attrs, children) => {
      const typeMatch = attrs.match(/type="([^"]+)"/);
      const placeholderMatch = attrs.match(/placeholder=\{([^}]+)\}/);
      const valueMatch = attrs.match(/value=\{([^}]+)\}/);
      const onInputMatch = attrs.match(/onInput=\{([^}]+)\}/);
      const classMatch = attrs.match(/className="([^"]+)"/);
      
      const type = typeMatch ? typeMatch[1] : 'text';
      const placeholder = placeholderMatch ? `placeholder={${placeholderMatch[1]}}` : '';
      const value = valueMatch ? `value={${valueMatch[1]}}` : '';
      const onInput = onInputMatch ? `onInput={${onInputMatch[1]}}` : '';
      const className = classMatch ? classMatch[1] : 'w-full';
      
      return `<input type="${type}" ${placeholder} ${value} ${onInput} className="${className} px-4 py-3 rounded-2xl border-2 border-[var(--app-outline)]/20 bg-[var(--app-surface-container)] text-[var(--app-foreground)] placeholder:text-[var(--app-outline)] focus:border-[var(--app-primary)] focus:outline-none transition-colors" ref={inputRef} />`;
    }
  );
  
  // md-list → div
  content = content.replace(/<md-list([^>]*)>/g, (match, attrs) => {
    const classMatch = attrs.match(/className="([^"]+)"/);
    const className = classMatch ? classMatch[1] : '';
    return `<div className="${className} flex flex-col gap-2">`;
  });
  content = content.replace(/<\/md-list>/g, '</div>');
  
  // md-list-item → button/div
  content = content.replace(
    /<md-list-item\s+([\s\S]*?)>([\s\S]*?)<\/md-list-item>/g,
    (match, attrs, children) => {
      const onClickMatch = attrs.match(/onClick=\{([^}]+)\}/);
      const classMatch = attrs.match(/className="([^"]+)"/);
      const keyMatch = attrs.match(/key=\{([^}]+)\}/);
      
      const onClick = onClickMatch ? `onClick={${onClickMatch[1]}}` : '';
      const className = classMatch ? classMatch[1] : '';
      const key = keyMatch ? `key={${keyMatch[1]}}` : '';
      
      // Clean slot-based content
      let cleanChildren = children
        .replace(/slot="[^"]+"/g, '')
        .trim();
      
      return `<button type="button" ${key} ${onClick} className="${className} w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 hover:bg-[var(--app-surface-container-high)] transition-colors">${cleanChildren}</button>`;
    }
  );
  
  // md-outlined-select and md-select-option → native select (simplified)
  content = content.replace(/<md-outlined-select[^>]*>/g, '<select className="px-4 py-3 rounded-2xl border-2 border-[var(--app-outline)]/20 bg-[var(--app-surface-container)] text-[var(--app-foreground)]">');
  content = content.replace(/<\/md-outlined-select>/g, '</select>');
  content = content.replace(/<md-select-option/g, '<option');
  content = content.replace(/<\/md-select-option>/g, '</option>');
  
  // md-slider → range input
  content = content.replace(
    /<md-slider\s+([\s\S]*?)>\s*<\/md-slider>/g,
    (match, attrs) => {
      const minMatch = attrs.match(/min=\{([^}]+)\}/);
      const maxMatch = attrs.match(/max=\{([^}]+)\}/);
      const valueMatch = attrs.match(/value=\{([^}]+)\}/);
      const onInputMatch = attrs.match(/onInput=\{([^}]+)\}/);
      const onChangeMatch = attrs.match(/onChange=\{([^}]+)\}/);
      const stepMatch = attrs.match(/step=\{([^}]+)\}/);
      
      const min = minMatch ? `min={${minMatch[1]}}` : 'min={0}';
      const max = maxMatch ? `max={${maxMatch[1]}}` : 'max={100}';
      const value = valueMatch ? `value={${valueMatch[1]}}` : '';
      const handler = onInputMatch ? `onInput={${onInputMatch[1]}}` : onChangeMatch ? `onChange={${onChangeMatch[1]}}` : '';
      const step = stepMatch ? `step={${stepMatch[1]}}` : '';
      
      return `<input type="range" ${min} ${max} ${value} ${handler} ${step} className="w-full h-3 rounded-full appearance-none cursor-pointer accent-[var(--app-primary)] bg-[var(--app-surface-container-high)]" />`;
    }
  );

  // md-checkbox → native checkbox
  content = content.replace(
    /<md-checkbox\s+([\s\S]*?)>\s*<\/md-checkbox>/g,
    (match, attrs) => {
      const checkedMatch = attrs.match(/checked=\{([^}]+)\}/);
      const onChangeMatch = attrs.match(/onChange=\{([^}]+)\}/);
      
      const checked = checkedMatch ? `checked={${checkedMatch[1]}}` : '';
      const onChange = onChangeMatch ? `onChange={${onChangeMatch[1]}}` : '';
      
      return `<input type="checkbox" ${checked} ${onChange} className="w-5 h-5 rounded accent-[var(--app-primary)] cursor-pointer" />`;
    }
  );
  
  // Clean up any remaining {/* @ts-ignore */} before non-md elements
  // (Some may have been left behind if the md- tag was already replaced)
  
  // Clean up material-icon-placeholder spans - these should have been Lucide icons
  // For "close" icon, "search" icon etc that were used in md-icon
  content = content.replace(/<span className="material-icon-placeholder">close<\/span>/g, '<X size={18} />');
  content = content.replace(/<span className="material-icon-placeholder">search<\/span>/g, '<Search size={18} />');
  content = content.replace(/<span className="material-icon-placeholder">my_location<\/span>/g, '<Crosshair size={18} />');
  
  // Remove empty slot references
  content = content.replace(/\s*slot="[^"]+"/g, '');
  
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
console.log(`\nComponent migration: ${modified}/${files.length} files modified.`);
