const fs = require('fs');

const filePath = 'src/components/SettingsModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed escapes');
