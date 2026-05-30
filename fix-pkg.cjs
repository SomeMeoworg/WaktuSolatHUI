const fs = require('fs');

const pkgStr = fs.readFileSync('package.json', 'utf8');
// Fix the malformed JSON string before parsing
// We'll just read it by removing multiple commas
let fixedStr = pkgStr.replace(/,\s*,/g, ',');
fixedStr = fixedStr.replace(/,\s*\}/g, '}');

try {
  const pkg = JSON.parse(fixedStr);
  
  if (pkg.dependencies) {
    delete pkg.dependencies['@heroui/react'];
    delete pkg.dependencies['@heroui/styles'];
    delete pkg.dependencies['@heroui/system'];
    delete pkg.dependencies['@heroui/theme'];
    
    pkg.dependencies['@nextui-org/react'] = '^2.4.0';
    pkg.dependencies['@nextui-org/theme'] = '^2.2.0';
    pkg.dependencies['@nextui-org/system'] = '^2.1.0';
    pkg.dependencies['framer-motion'] = '^11.2.10';
  }

  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2), 'utf8');
  console.log('package.json fixed and updated successfully.');
} catch (e) {
  console.error('Failed to parse fixed JSON:', e);
}
