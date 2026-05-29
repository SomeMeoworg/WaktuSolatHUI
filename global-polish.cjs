const fs = require('fs');
const path = require('path');

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

function processInputReplacement(content) {
  // We need to match <Input ...> ... </Input>
  // Due to variable attributes, we'll do this carefully with a regex that captures everything inside
  let newContent = content;

  // First, find all <Input> tags that have children
  const inputRegex = /<Input([^>]*)>([\s\S]*?)<\/Input>/g;
  
  newContent = newContent.replace(inputRegex, (match, attrs, children) => {
    // If the children are just empty or whitespace, we just self-close it
    if (children.trim() === '') {
      return `<Input${attrs} />`;
    }

    // If it contains a Search icon and an X button (common in this app)
    let startContent = '';
    let endContent = '';
    let cleanChildren = children;

    if (children.includes('<Search')) {
      startContent = 'startContent={<Search size={18} className="text-default-400" />}';
      cleanChildren = cleanChildren.replace(/<Search[^>]*>/, '');
    }

    // Try to extract the clear button
    const btnMatch = cleanChildren.match(/\{([\s\S]*?onClick[^>]*setSearchQuery\(\"\"\)[^}]*\}[\s\S]*?)\}/);
    if (btnMatch) {
      endContent = `endContent={${btnMatch[0]}}`;
      cleanChildren = cleanChildren.replace(btnMatch[0], '');
    }

    // For SharePanel or generic stuff, just safely wrap any leftover children
    // Actually, in SharePanel and ZoneSelector, there is ONLY Search and Button.
    let newAttrs = attrs;
    if (startContent) newAttrs += `\n  ${startContent}`;
    if (endContent) newAttrs += `\n  ${endContent}`;

    return `<Input${newAttrs} />`;
  });

  return newContent;
}

function polishFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // 1. Fix Input void element bugs
    content = processInputReplacement(content);

    // 2. Strip ALL Material CSS style overrides globally
    content = content.replace(/\s*style=\{\{\s*['"]--md-[^}]*\} as any\}/g, '');
    content = content.replace(/\s*style=\{[^{]*\{['"]--md-[^}]*\}[^}]*\} as any\}/g, '');
    
    // 3. Optional: replace onChange on Input if it was accidentally mapped to onInput by earlier script
    // HeroUI uses onChange/onValueChange
    // Wait, onInput is valid HTML but onChange is standard React.
    content = content.replace(/<Input([^>]*)onInput=/g, '<Input$1onChange=');

    // 4. Upgrade HeroUI semantic classes
    // Replace old arbitrary variables if any remain (though Tailwind classes are better)
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Polished ${path.basename(filePath)}`);
        return true;
    }
    return false;
}

const files = getAllFiles(path.join(__dirname, 'src'));
let count = 0;
for (const file of files) {
    if (polishFile(file)) {
        count++;
    }
}
console.log(`Polished ${count} files globally.`);
