const fs = require('fs');

function fixFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Add missing lucide-react imports (Search, MapPin, etc.)
    // Safest way is to just replace the whole import block for lucide-react
    const allLucideIcons = [
        "Sparkles", "MapPin", "Bell", "Volume2", "ArrowRight", 
        "ArrowLeft", "Check", "Compass", "Play", "Pause", "X", 
        "Crosshair", "Search", "Map as MapIcon", "CheckCircle2"
    ];
    content = content.replace(/import\s+\{([\s\S]*?)\}\s+from\s+['"]lucide-react['"];/, () => {
        return `import {\n  ${allLucideIcons.join(",\n  ")}\n} from "lucide-react";`;
    });

    // 2. Fix Button prop mismatches based on IDE errors
    // - Remove 'color="xxx"'
    content = content.replace(/\s+color="[^"]+"/g, '');
    
    // - Map old variants to new HeroUI variants
    // variant="flat" -> variant="secondary"
    content = content.replace(/\bvariant="flat"/g, 'variant="secondary"');
    // variant="bordered" -> variant="outline"
    content = content.replace(/\bvariant="bordered"/g, 'variant="outline"');
    // variant="light" -> variant="ghost"
    content = content.replace(/\bvariant="light"/g, 'variant="ghost"');

    // Fix TS ignore directives for Button components just in case
    // Wait, the user wants it FIXED, not ignored. The above variants and color removal fix it.
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${filePath}`);
}

fixFile('src/components/OnboardingFlow.tsx');
