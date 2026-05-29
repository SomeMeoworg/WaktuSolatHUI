/**
 * Phase 2 migration v3: Replace Material Web component JSX tags with HeroUI React components.
 * 
 * Run with: node fix-heroui-components-v3.cjs
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

// Regex generator that strictly enforces word boundaries so md-icon doesn't match md-icon-button
const makeTagRegex = (tagName) => new RegExp(`<${tagName}(?=\\s|>|\\/>)([^>'"\\{]*(?:(?:'[^']*'|"[^"]*"|\\{[^\\}]*\\})[^>'"\\{]*)*)>([\\s\\S]*?)<\\/${tagName}>`, 'g');
const makeSelfClosingRegex = (tagName) => new RegExp(`<${tagName}(?=\\s|>|\\/>)([^>'"\\{]*(?:(?:'[^']*'|"[^"]*"|\\{[^\\}]*\\})[^>'"\\{]*)*)(?:>|\\/>)`, 'g');
const makeOpenTagRegex = (tagName) => new RegExp(`<${tagName}(?=\\s|>|\\/>)([^>'"\\{]*(?:(?:'[^']*'|"[^"]*"|\\{[^\\}]*\\})[^>'"\\{]*)*)>`, 'g');

function extractAttribute(attrStr, attrName) {
  const match = attrStr.match(new RegExp(`\\b${attrName}=(?:("([^"]*)")|('([^']*)')|(\\{([^}]*)\\}))`));
  if (!match) return null;
  return match[2] !== undefined ? `"${match[2]}"` 
       : match[4] !== undefined ? `"${match[4]}"` 
       : `{${match[6]}}`;
}

function migrateComponents(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  content = content.replace(/\s*{\/\*\s*@ts-ignore\s*\*\/}\s*\n(\s*<md-)/g, '\n$1');
  
  // Clean up ripples/elevations
  content = content.replace(/<md-ripple[^>]*>\s*<\/md-ripple>/g, '');
  content = content.replace(/<md-ripple[^>]*\/>/g, '');
  content = content.replace(/<md-elevation[^>]*>\s*<\/md-elevation>/g, '');
  content = content.replace(/<md-elevation[^>]*\/>/g, '');
  
  // Dividers
  content = content.replace(makeSelfClosingRegex('md-divider'), '<hr className="border-[var(--app-outline)]/10" />');
  
  // Progress
  content = content.replace(makeTagRegex('md-circular-progress'), '<div className="w-8 h-8 border-3 border-[var(--app-primary)]/30 border-t-[var(--app-primary)] rounded-full animate-spin" />');
  content = content.replace(makeTagRegex('md-linear-progress'), '<div className="w-full h-1 bg-[var(--app-primary)]/20 rounded-full overflow-hidden"><div className="h-full bg-[var(--app-primary)] rounded-full animate-pulse w-1/2" /></div>');
  
  // Switches
  content = content.replace(makeTagRegex('md-switch'), (m, attrs) => {
    const selected = extractAttribute(attrs, 'selected') || 'false';
    const onChange = extractAttribute(attrs, 'onChange');
    const onClick = extractAttribute(attrs, 'onClick');
    const handler = onChange ? `onChange={${onChange.replace(/^\{|\}$/g, '')}}` : onClick ? `onClick={${onClick.replace(/^\{|\}$/g, '')}}` : '';
    const sel = selected.replace(/^\{|\}$/g, '');
    
    return `<button type="button" role="switch" aria-checked={${sel}} ${handler} className={\`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 \${${sel} ? 'bg-[var(--app-primary)]' : 'bg-[var(--app-outline)]/30'}\`}><span className={\`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 \${${sel} ? 'translate-x-6' : 'translate-x-1'}\`} /></button>`;
  });
  
  // Filter chips
  content = content.replace(makeTagRegex('md-filter-chip'), (m, attrs) => {
    const label = extractAttribute(attrs, 'label') || '""';
    const selected = extractAttribute(attrs, 'selected') || 'false';
    const onClick = extractAttribute(attrs, 'onClick') ? `onClick=${extractAttribute(attrs, 'onClick')}` : '';
    const key = extractAttribute(attrs, 'key') ? `key=${extractAttribute(attrs, 'key')}` : '';
    const sel = selected.replace(/^\{|\}$/g, '');
    
    return `<button type="button" ${key} ${onClick} className={\`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border \${${sel} ? 'bg-[var(--app-primary)] text-[var(--app-primary-foreground)] border-[var(--app-primary)] shadow-sm' : 'bg-[var(--app-surface-container)] text-[var(--app-foreground)] border-[var(--app-outline)]/20 hover:bg-[var(--app-surface-container-high)]'}\`}>{${label.replace(/^\{|\}$/g, '')}}</button>`;
  });
  
  // Tabs
  content = content.replace(makeOpenTagRegex('md-tabs'), '<div className="flex border-b border-[var(--app-outline)]/10">');
  content = content.replace(/<\/md-tabs>/g, '</div>');
  
  content = content.replace(makeTagRegex('md-primary-tab'), (m, attrs, inner) => {
    const onClick = extractAttribute(attrs, 'onClick') ? `onClick=${extractAttribute(attrs, 'onClick')}` : '';
    let cleanInner = inner.replace(/<span\s+slot="icon">/g, '<span className="mr-2">').replace(/<md-icon\s+slot="icon">[^<]*<\/md-icon>/g, '');
    return `<button type="button" ${onClick} className="flex-1 px-4 py-3 text-sm font-semibold text-center transition-colors hover:bg-[var(--app-surface-container)] border-b-2 border-transparent focus:outline-none data-[active]:border-[var(--app-primary)] data-[active]:text-[var(--app-primary)]">${cleanInner}</button>`;
  });
  
  // Buttons
  content = content.replace(makeTagRegex('md-icon-button'), (m, attrs, inner) => {
    const onClick = extractAttribute(attrs, 'onClick') ? `onClick=${extractAttribute(attrs, 'onClick')}` : '';
    const title = extractAttribute(attrs, 'title') ? `title=${extractAttribute(attrs, 'title')}` : '';
    const className = extractAttribute(attrs, 'className') || '""';
    let cls = className.replace(/^\{|\}$/g, '');
    let cleanInner = inner.replace(/<md-icon>[^<]*<\/md-icon>/g, '').trim();
    return `<button type="button" ${onClick} ${title} className={"w-10 h-10 rounded-full flex items-center justify-center text-[var(--app-foreground)] hover:bg-[var(--app-surface-container)] transition-colors " + (${cls})}>${cleanInner}</button>`;
  });
  
  content = content.replace(makeTagRegex('md-filled-tonal-icon-button'), (m, attrs, inner) => {
    const onClick = extractAttribute(attrs, 'onClick') ? `onClick=${extractAttribute(attrs, 'onClick')}` : '';
    const title = extractAttribute(attrs, 'title') ? `title=${extractAttribute(attrs, 'title')}` : '';
    const aria = extractAttribute(attrs, 'aria-label') ? `aria-label=${extractAttribute(attrs, 'aria-label')}` : '';
    return `<button type="button" ${onClick} ${title} ${aria} className="w-full h-full rounded-2xl flex items-center justify-center bg-[var(--app-surface-container-high)] text-[var(--app-foreground)] hover:bg-[var(--app-primary)] hover:text-[var(--app-primary-foreground)] transition-colors shadow-sm">${inner.trim()}</button>`;
  });
  
  content = content.replace(makeTagRegex('md-filled-tonal-button'), (m, attrs, inner) => {
    const onClick = extractAttribute(attrs, 'onClick') ? `onClick=${extractAttribute(attrs, 'onClick')}` : '';
    const disabled = extractAttribute(attrs, 'disabled') ? `disabled=${extractAttribute(attrs, 'disabled')}` : '';
    const className = extractAttribute(attrs, 'className') || '""';
    let cleanInner = inner.replace(/<[^>]*slot="icon"[^>]*\/>/g, '').trim();
    return `<button type="button" ${onClick} ${disabled} className={\`px-6 py-3 rounded-2xl font-semibold bg-[var(--app-surface-container-high)] text-[var(--app-foreground)] hover:bg-[var(--app-primary)] hover:text-[var(--app-primary-foreground)] transition-all shadow-sm disabled:opacity-50 \${${className.replace(/^\{|\}$/g, '')}}\`}>${cleanInner}</button>`;
  });
  
  content = content.replace(makeTagRegex('md-filled-button'), (m, attrs, inner) => {
    const onClick = extractAttribute(attrs, 'onClick') ? `onClick=${extractAttribute(attrs, 'onClick')}` : '';
    const disabled = extractAttribute(attrs, 'disabled') ? `disabled=${extractAttribute(attrs, 'disabled')}` : '';
    const className = extractAttribute(attrs, 'className') || '""';
    return `<button type="button" ${onClick} ${disabled} className={\`px-6 py-3 rounded-2xl font-semibold bg-[var(--app-primary)] text-[var(--app-primary-foreground)] hover:opacity-90 transition-all shadow-sm disabled:opacity-50 \${${className.replace(/^\{|\}$/g, '')}}\`}>${inner.trim()}</button>`;
  });

  content = content.replace(makeTagRegex('md-outlined-button'), (m, attrs, inner) => {
    const onClick = extractAttribute(attrs, 'onClick') ? `onClick=${extractAttribute(attrs, 'onClick')}` : '';
    return `<button type="button" ${onClick} className="px-6 py-3 rounded-2xl font-semibold border-2 border-[var(--app-outline)]/20 text-[var(--app-foreground)] hover:bg-[var(--app-surface-container)] transition-all">${inner.trim()}</button>`;
  });
  
  content = content.replace(makeTagRegex('md-filled-icon-button'), (m, attrs, inner) => {
    const onClick = extractAttribute(attrs, 'onClick') ? `onClick=${extractAttribute(attrs, 'onClick')}` : '';
    return `<button type="button" ${onClick} className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--app-primary)] text-[var(--app-primary-foreground)] hover:opacity-90 transition-all shadow-sm">${inner.trim()}</button>`;
  });
  
  // md-icon text - must be AFTER all button replacements so it doesn't mess them up!
  content = content.replace(makeTagRegex('md-icon'), (m, attrs, inner) => {
    return `<span className="material-icon-placeholder">${inner.trim()}</span>`;
  });
  
  // Inputs
  content = content.replace(makeTagRegex('md-outlined-text-field'), (m, attrs, inner) => {
    const type = extractAttribute(attrs, 'type') || '"text"';
    const placeholder = extractAttribute(attrs, 'placeholder') ? `placeholder=${extractAttribute(attrs, 'placeholder')}` : '';
    const value = extractAttribute(attrs, 'value') ? `value=${extractAttribute(attrs, 'value')}` : '';
    const onInput = extractAttribute(attrs, 'onInput') ? `onInput=${extractAttribute(attrs, 'onInput')}` : '';
    const onChange = extractAttribute(attrs, 'onChange') ? `onChange=${extractAttribute(attrs, 'onChange')}` : '';
    const className = extractAttribute(attrs, 'className') || '"w-full"';
    
    return `<input type=${type} ${placeholder} ${value} ${onInput} ${onChange} className={\`\${${className.replace(/^\{|\}$/g, '')}} px-4 py-3 rounded-2xl border-2 border-[var(--app-outline)]/20 bg-[var(--app-surface-container)] text-[var(--app-foreground)] placeholder:text-[var(--app-outline)] focus:border-[var(--app-primary)] focus:outline-none transition-colors\`} />`;
  });
  
  // Self closing text field variants 
  content = content.replace(makeSelfClosingRegex('md-outlined-text-field'), (m, attrs) => {
    const type = extractAttribute(attrs, 'type') || '"text"';
    const placeholder = extractAttribute(attrs, 'placeholder') ? `placeholder=${extractAttribute(attrs, 'placeholder')}` : '';
    const value = extractAttribute(attrs, 'value') ? `value=${extractAttribute(attrs, 'value')}` : '';
    const onInput = extractAttribute(attrs, 'onInput') ? `onInput=${extractAttribute(attrs, 'onInput')}` : '';
    const onChange = extractAttribute(attrs, 'onChange') ? `onChange=${extractAttribute(attrs, 'onChange')}` : '';
    const className = extractAttribute(attrs, 'className') || '"w-full"';
    
    return `<input type=${type} ${placeholder} ${value} ${onInput} ${onChange} className={\`\${${className.replace(/^\{|\}$/g, '')}} px-4 py-3 rounded-2xl border-2 border-[var(--app-outline)]/20 bg-[var(--app-surface-container)] text-[var(--app-foreground)] placeholder:text-[var(--app-outline)] focus:border-[var(--app-primary)] focus:outline-none transition-colors\`} />`;
  });

  // Self-closing text field in OnboardingFlow fix
  content = content.replace(/<md-filled-text-field([^>]*)>/g, (m, attrs) => {
    const type = extractAttribute(attrs, 'type') || '"text"';
    const placeholder = extractAttribute(attrs, 'placeholder') ? `placeholder=${extractAttribute(attrs, 'placeholder')}` : '';
    const value = extractAttribute(attrs, 'value') ? `value=${extractAttribute(attrs, 'value')}` : '';
    const onInput = extractAttribute(attrs, 'onInput') ? `onInput=${extractAttribute(attrs, 'onInput')}` : '';
    const onChange = extractAttribute(attrs, 'onChange') ? `onChange=${extractAttribute(attrs, 'onChange')}` : '';
    const className = extractAttribute(attrs, 'className') || '"w-full"';
    return `<input type=${type} ${placeholder} ${value} ${onInput} ${onChange} className={\`\${${className.replace(/^\{|\}$/g, '')}} px-4 py-3 rounded-2xl bg-[var(--app-surface-container-high)] text-[var(--app-foreground)] placeholder:text-[var(--app-outline)] focus:outline-none transition-colors\`} />`;
  });
  content = content.replace(/<\/md-filled-text-field>/g, '');

  // Lists
  content = content.replace(makeOpenTagRegex('md-list'), (m, attrs) => {
    const className = extractAttribute(attrs, 'className') || '""';
    return `<div className={\`\${${className.replace(/^\{|\}$/g, '')}} flex flex-col gap-2\`}>`;
  });
  content = content.replace(/<\/md-list>/g, '</div>');
  
  content = content.replace(makeTagRegex('md-list-item'), (m, attrs, inner) => {
    const onClick = extractAttribute(attrs, 'onClick') ? `onClick=${extractAttribute(attrs, 'onClick')}` : '';
    const className = extractAttribute(attrs, 'className') || '""';
    const key = extractAttribute(attrs, 'key') ? `key=${extractAttribute(attrs, 'key')}` : '';
    let cleanInner = inner.replace(/slot="[^"]+"/g, '').trim();
    
    return `<button type="button" ${key} ${onClick} className={\`\${${className.replace(/^\{|\}$/g, '')}} w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 hover:bg-[var(--app-surface-container-high)] transition-colors\`}>${cleanInner}</button>`;
  });
  
  // Selects
  content = content.replace(makeOpenTagRegex('md-outlined-select'), '<select className="px-4 py-3 rounded-2xl border-2 border-[var(--app-outline)]/20 bg-[var(--app-surface-container)] text-[var(--app-foreground)]">');
  content = content.replace(/<\/md-outlined-select>/g, '</select>');
  content = content.replace(/<md-select-option/g, '<option');
  content = content.replace(/<\/md-select-option>/g, '</option>');
  
  // Sliders
  content = content.replace(makeTagRegex('md-slider'), (m, attrs) => {
    const min = extractAttribute(attrs, 'min') ? `min=${extractAttribute(attrs, 'min')}` : 'min={0}';
    const max = extractAttribute(attrs, 'max') ? `max=${extractAttribute(attrs, 'max')}` : 'max={100}';
    const value = extractAttribute(attrs, 'value') ? `value=${extractAttribute(attrs, 'value')}` : '';
    const onChange = extractAttribute(attrs, 'onChange') ? `onChange=${extractAttribute(attrs, 'onChange')}` : '';
    const onInput = extractAttribute(attrs, 'onInput') ? `onInput=${extractAttribute(attrs, 'onInput')}` : '';
    const step = extractAttribute(attrs, 'step') ? `step=${extractAttribute(attrs, 'step')}` : '';
    
    return `<input type="range" ${min} ${max} ${value} ${onChange} ${onInput} ${step} className="w-full h-3 rounded-full appearance-none cursor-pointer accent-[var(--app-primary)] bg-[var(--app-surface-container-high)]" />`;
  });

  // Checkboxes
  content = content.replace(makeTagRegex('md-checkbox'), (m, attrs) => {
    const checked = extractAttribute(attrs, 'checked') ? `checked=${extractAttribute(attrs, 'checked')}` : '';
    const onChange = extractAttribute(attrs, 'onChange') ? `onChange=${extractAttribute(attrs, 'onChange')}` : '';
    return `<input type="checkbox" ${checked} ${onChange} className="w-5 h-5 rounded accent-[var(--app-primary)] cursor-pointer" />`;
  });

  // Icon placeholders cleanup
  content = content.replace(/<span className="material-icon-placeholder">close<\/span>/g, '<X size={18} />');
  content = content.replace(/<span className="material-icon-placeholder">search<\/span>/g, '<Search size={18} />');
  content = content.replace(/<span className="material-icon-placeholder">my_location<\/span>/g, '<Crosshair size={18} />');
  content = content.replace(/<span className="material-icon-placeholder">[^<]*<\/span>/g, '');
  
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
