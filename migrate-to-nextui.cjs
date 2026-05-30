const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx}');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('@heroui/')) {
    content = content.replace(/@heroui\/react/g, '@nextui-org/react');
    content = content.replace(/@heroui\/system/g, '@nextui-org/system');
    content = content.replace(/@heroui\/theme/g, '@nextui-org/theme');
    content = content.replace(/@heroui\/styles/g, '@nextui-org/styles');
    fs.writeFileSync(file, content);
  }
});

let pkg = fs.readFileSync('package.json', 'utf8');
pkg = pkg.replace(/"@heroui\/react": "[^"]+"/g, '"@nextui-org/react": "^2.4.0"');
pkg = pkg.replace(/"@heroui\/styles": "[^"]+"/g, '');
pkg = pkg.replace(/"@heroui\/system": "[^"]+"/g, '');
pkg = pkg.replace(/"@heroui\/theme": "[^"]+"/g, '"@nextui-org/theme": "^2.2.0"');
fs.writeFileSync('package.json', pkg);

console.log('Migration to NextUI complete');
