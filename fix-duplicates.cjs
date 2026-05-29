const fs = require('fs');
let c = fs.readFileSync('src/components/ZoneSelector.tsx', 'utf8');

// Fix duplicate classNames that are on the SAME line
c = c.replace(/className="[^"]*"\s+className="([^"]*)"/g, 'className="$1"');

// Fix duplicate classNames that span multiple lines (like line 484 and 491)
// We look for a className, followed by some attributes, followed by another className before the closing >
c = c.replace(/(className="[^"]*")([\s\S]*?)(className="[^"]*")([^>]*>)/g, (match, class1, middle, class2, end) => {
    // Just keep the second one (the one from my polish script) which has the beautiful HeroUI stuff
    return class2 + middle + end;
});

fs.writeFileSync('src/components/ZoneSelector.tsx', c);
console.log("Fixed duplicate classNames!");
