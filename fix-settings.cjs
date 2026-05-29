const fs = require('fs');
let c = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

// Fix duplicate classNames that are on the SAME line
c = c.replace(/className="flex w-full border-b border-divider"\s+className="min-w-max w-full"/g, 'className="flex min-w-max w-full border-b border-divider"');

fs.writeFileSync('src/components/SettingsModal.tsx', c);
console.log("Fixed duplicate className in SettingsModal!");
