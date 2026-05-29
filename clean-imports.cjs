const fs = require('fs');

function cleanImports(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/import "@material\/web\/[^"]+";\r?\n/g, '');
    fs.writeFileSync(filePath, content, 'utf8');
}

cleanImports('src/components/SharePanel.tsx');
console.log('Removed legacy Material imports from SharePanel');
