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

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Fix HeroUI v3 Button prop mismatches globally
    // - Map old variants to new HeroUI variants
    // variant="flat" -> variant="secondary"
    content = content.replace(/\bvariant="flat"/g, 'variant="secondary"');
    // variant="bordered" -> variant="outline"
    content = content.replace(/\bvariant="bordered"/g, 'variant="outline"');
    // variant="light" -> variant="ghost"
    content = content.replace(/\bvariant="light"/g, 'variant="ghost"');
    // variant="faded" -> variant="secondary"
    content = content.replace(/\bvariant="faded"/g, 'variant="secondary"');
    // variant="solid" -> variant="primary"
    content = content.replace(/\bvariant="solid"/g, 'variant="primary"');
    // variant="shadow" -> variant="primary"
    content = content.replace(/\bvariant="shadow"/g, 'variant="primary"');

    // Remove color="..." entirely, because HeroUI v3 moved colors into variants
    // BE CAREFUL: Only remove color="..." on Button tags!
    content = content.replace(/(<Button[^>]*?)\s+color="[^"]+"([^>]*?>)/g, '$1$2');
    content = content.replace(/(<Button[^>]*?)\s+color=\{[^}]+\}([^>]*?>)/g, '$1$2');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    return false;
}

const files = getAllFiles(path.join(__dirname, 'src', 'components'));
let count = 0;
for (const file of files) {
    if (fixFile(file)) {
        count++;
        console.log(`Fixed ${path.basename(file)}`);
    }
}
console.log(`Fixed Button TS props in ${count} files.`);
