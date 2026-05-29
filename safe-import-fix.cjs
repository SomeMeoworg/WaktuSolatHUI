const fs = require('fs');
let c = fs.readFileSync('src/components/OnboardingFlow.tsx', 'utf8');

c = c.replace(/X\r?\n\}\s+from\s+['"]lucide-react['"];/, 'X,\n  Crosshair,\n  Search,\n  Map as MapIcon,\n  CheckCircle2\n} from "lucide-react";');

fs.writeFileSync('src/components/OnboardingFlow.tsx', c);
console.log("Safely added lucide icons via regex!");
