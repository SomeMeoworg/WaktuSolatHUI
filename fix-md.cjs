const fs = require('fs');

const filePath = 'src/components/SettingsModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all remaining <md-switch ... ></md-switch>
content = content.replace(/<md-switch([\s\S]*?)selected=\{([\s\S]*?)\}([\s\S]*?)><\/md-switch>/g, '<Switch$1isSelected={$2}$3 />');

// Replace all remaining <md-slider ... ></md-slider>
content = content.replace(/<md-slider([\s\S]*?)min=\{([\s\S]*?)\}([\s\S]*?)max=\{([\s\S]*?)\}([\s\S]*?)><\/md-slider>/g, '<Slider$1minValue={$2}$3maxValue={$4}$5 className="max-w-md" />');

// If there are sliders that don't have min/max explicitly in the line (e.g. solatModeDuaDuration):
content = content.replace(/<md-slider([\s\S]*?)><\/md-slider>/g, '<Slider$1 className="max-w-md" />');

// Check for any remaining <md-
console.log('Remaining <md- tags:', content.match(/<md-[a-z-]+/g) || 'None');

fs.writeFileSync(filePath, content, 'utf8');
