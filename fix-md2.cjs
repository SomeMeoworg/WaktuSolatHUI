const fs = require('fs');

const filePath = 'src/components/SettingsModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace md-filter-chip
// <md-filter-chip label="Melayu" selected={...} onClick={...}></md-filter-chip>
// -> <Button size="sm" variant={... ? "solid" : "flat"} color={... ? "primary" : "default"} onClick={...}>Melayu</Button>
content = content.replace(/<md-filter-chip([\s\S]*?)label=\{([^}]+)\}([\s\S]*?)selected=\{([^}]+)\}([\s\S]*?)><\/md-filter-chip>/g, '<Button size="sm" variant={$4 ? "solid" : "flat"} color={$4 ? "primary" : "default"}$1$3$5>{$2}</Button>');

content = content.replace(/<md-filter-chip([\s\S]*?)label="([^"]+)"([\s\S]*?)selected=\{([^}]+)\}([\s\S]*?)><\/md-filter-chip>/g, '<Button size="sm" variant={$4 ? "solid" : "flat"} color={$4 ? "primary" : "default"}$1$3$5>$2</Button>');

// Replace md-ripple
content = content.replace(/<md-ripple><\/md-ripple>/g, '');

// Replace md-filled-tonal-icon-button
content = content.replace(/<md-filled-tonal-icon-button/g, '<Button isIconOnly variant="flat"');
content = content.replace(/<\/md-filled-tonal-icon-button>/g, '</Button>');

// Fix the missing div at the end
// Find where </ModalBody> is at the end of the file
const parts = content.split('</ModalBody>');
if (parts.length > 1) {
  // Add a </div> right before the last </ModalBody>
  const lastIndex = content.lastIndexOf('</ModalBody>');
  content = content.substring(0, lastIndex) + '</div>\n' + content.substring(lastIndex);
}

fs.writeFileSync(filePath, content, 'utf8');
