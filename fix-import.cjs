const fs = require('fs');
let c = fs.readFileSync('src/components/OnboardingFlow.tsx', 'utf8');

c = c.replace(/import\s+\{([\s\S]*?)\}\s+from\s+['"]lucide-react['"];/, (match, group1) => {
    if (!group1.includes('Crosshair')) {
        return `import {${group1}, Crosshair\n} from "lucide-react";`;
    }
    return match;
});

fs.writeFileSync('src/components/OnboardingFlow.tsx', c);
console.log("Fixed Crosshair import!");
