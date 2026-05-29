const fs = require('fs');

const filePath = 'src/components/SettingsModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Ensure imports
if (!content.includes('Modal,')) {
  content = content.replace(
    /import \{ Button, Switch, Slider, Select \} from "@heroui\/react";/,
    'import { Button, Switch, Slider, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, Tabs, Tab, Card, CardBody, Input } from "@heroui/react";'
  );
}

// 1. Modal wrapper
content = content.replace(/<AnimatePresence>([\s\S]*?)<motion\.div\s+variants=\{modalVariants\}[^>]*>([\s\S]*?)<div className="flex items-center justify-between[^>]*>([\s\S]*?)<h2[^>]*>\s*\{t\("settings"\)\}\s*<\/h2>([\s\S]*?)<\/motion\.button>\s*<\/div>/, `<Modal 
  isOpen={isOpen} 
  onClose={onClose} 
  size="3xl"
  scrollBehavior="inside"
  backdrop="blur"
  classNames={{
    base: "bg-content1 rounded-[2.5rem] shadow-2xl h-[90vh] sm:h-[85vh] m-2 sm:m-0 border border-divider",
    header: "border-b border-divider p-6 md:p-8 flex-col items-start gap-4",
    body: "p-0 bg-content2/30",
    closeButton: "top-6 right-6 hover:bg-content3"
  }}
>
  <ModalContent>
    {(onClose) => (
      <>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-primary leading-none mb-2">
            {t("settings")}
          </h2>
        </ModalHeader>`);

// 2. Tabs
content = content.replace(/\{\/\* Tabs \*\/\}\s*<div className="w-full overflow-x-auto no-scrollbar border-b border-\[var\(--md-sys-color-outline\)\]\/10 shrink-0">\s*<md-tabs[^>]*>\s*<md-primary-tab onClick=\{[^>]*>\s*\{t\("general"\)\}\s*<span slot="icon"><Settings size=\{18\} \/><\/span>\s*<\/md-primary-tab>\s*<md-primary-tab onClick=\{[^>]*>\s*\{t\("notifications"\)\}\s*<span slot="icon"><Bell size=\{18\} \/><\/span>\s*<\/md-primary-tab>\s*<md-primary-tab onClick=\{[^>]*>\s*\{t\("offset"\)\}\s*<span slot="icon"><Clock size=\{18\} \/><\/span>\s*<\/md-primary-tab>\s*<md-primary-tab onClick=\{[^>]*>\s*\{t\("sunnahAndOptional" as any\) \|\| "Lanjutan"\}\s*<span slot="icon"><Sliders size=\{18\} \/><\/span>\s*<\/md-primary-tab>\s*<md-primary-tab onClick=\{[^>]*>\s*\{t\("mosqueMode" as any\) \|\| "Mod Masjid"\}\s*<span slot="icon"><MoonStar size=\{18\} \/><\/span>\s*<\/md-primary-tab>\s*<\/md-tabs>\s*<\/div>/, `<div className="w-full bg-content2 p-2 border-b border-divider shrink-0">
  <Tabs 
    fullWidth 
    size="md" 
    radius="lg"
    selectedKey={activeTab}
    onSelectionChange={(key) => setActiveTab(key as any)}
    classNames={{
      tabList: "bg-transparent",
      cursor: "bg-background shadow-sm",
      tab: "h-10",
      tabContent: "group-data-[selected=true]:text-primary font-bold"
    }}
  >
    <Tab key="general" title={<div className="flex items-center gap-2"><Settings size={16} /><span>{t("general")}</span></div>} />
    <Tab key="notifications" title={<div className="flex items-center gap-2"><Bell size={16} /><span>{t("notifications")}</span></div>} />
    <Tab key="adjustments" title={<div className="flex items-center gap-2"><Clock size={16} /><span>{t("offset")}</span></div>} />
    <Tab key="advanced" title={<div className="flex items-center gap-2"><Sliders size={16} /><span>{t("sunnahAndOptional" as any) || "Lanjutan"}</span></div>} />
    <Tab key="mosque" title={<div className="flex items-center gap-2"><MoonStar size={16} /><span>{t("mosqueMode" as any) || "Mod Masjid"}</span></div>} />
  </Tabs>
</div>`);

// 3. ModalBody open
content = content.replace(/<div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8 pt-6 space-y-6 no-scrollbar bg-\[var\(--md-sys-color-surface\)\]">/, '<ModalBody className="custom-scrollbar px-4 sm:px-8 pb-8 pt-6 space-y-6">');

// 4. End tags
// Replace the last </div></motion.div></motion.div>}</AnimatePresence> with Modal closing
content = content.replace(/<\/div>\s*<\/motion\.div>\s*<\/motion\.div>\s*\}\s*<\/AnimatePresence>\s*\);\s*\}/, `</ModalBody>
      </>
    )}
  </ModalContent>
</Modal>
  );
}`);

// Component replacements without greedy regex
content = content.replace(/<md-switch([^>]*)selected=([^>]*?)onChange=([^>]*)><\/md-switch>/g, '<Switch$1isSelected=$2onChange=$3 />');
content = content.replace(/<md-switch([^>]*)onChange=([^>]*?)selected=([^>]*)><\/md-switch>/g, '<Switch$1onChange=$2isSelected=$3 />');

// Sometimes attributes span newlines. In JS `[^>]*` handles newlines perfectly.
content = content.replace(/<md-slider([^>]*)><\/md-slider>/g, (match, p1) => {
  let attrs = p1.replace(/\s*ticks\s*/g, ' showSteps ');
  attrs = attrs.replace(/\s*labeled\s*/g, ' ');
  attrs = attrs.replace(/min=([^ ]+)/g, 'minValue=$1');
  attrs = attrs.replace(/max=([^ ]+)/g, 'maxValue=$1');
  return `<Slider${attrs} className="max-w-md" />`;
});

// filter-chip
content = content.replace(/<md-filter-chip([^>]*)><\/md-filter-chip>/g, (match, p1) => {
  let label = '';
  p1 = p1.replace(/label=\{([^}]+)\}/, (m, l) => { label = `{${l}}`; return ''; });
  p1 = p1.replace(/label="([^"]+)"/, (m, l) => { label = l; return ''; });
  let selected = '';
  p1 = p1.replace(/selected=\{([^}]+)\}/, (m, s) => { selected = s; return ''; });
  
  if (selected) {
    return `<Button size="sm" variant={${selected} ? "solid" : "flat"} color={${selected} ? "primary" : "default"}${p1}>${label}</Button>`;
  }
  return `<Button size="sm" variant="flat"${p1}>${label}</Button>`;
});

// Ripple
content = content.replace(/<md-ripple><\/md-ripple>/g, '');
content = content.replace(/<md-ripple \/>/g, '');

// icon-buttons
content = content.replace(/<md-filled-tonal-icon-button([^>]*)>/g, '<Button isIconOnly variant="flat"$1>');
content = content.replace(/<\/md-filled-tonal-icon-button>/g, '</Button>');

content = content.replace(/<md-icon-button([^>]*)>/g, '<Button isIconOnly variant="light"$1>');
content = content.replace(/<\/md-icon-button>/g, '</Button>');

// select
content = content.replace(/<md-outlined-select([^>]*)>/g, '<Select variant="bordered" className="max-w-xs"$1>');
content = content.replace(/<\/md-outlined-select>/g, '</Select>');

content = content.replace(/<md-select-option([^>]*)value=([^>]*)>/g, '<SelectItem$1key=$2>');
content = content.replace(/<\/md-select-option>/g, '</SelectItem>');

// slot replacements
content = content.replace(/<div slot="headline">([^<]+)<\/div>/g, '$1');
content = content.replace(/<md-icon slot="icon"[^>]*>[^<]+<\/md-icon>/g, '');

// Style replacements
content = content.replace(/bg-\[var\(--md-sys-color-surface-container\)\]/g, 'bg-content2');
content = content.replace(/bg-\[var\(--md-sys-color-surface\)\]/g, 'bg-content1');
content = content.replace(/bg-\[var\(--md-sys-color-surface-container-high\)\]/g, 'bg-content3');
content = content.replace(/bg-\[var\(--md-sys-color-error-container\)\]/g, 'bg-danger-50');
content = content.replace(/bg-\[var\(--app-danger-container,\shsl\(--heroui-danger\)\s\/\s0\.15\)\]/g, 'bg-danger-50');
content = content.replace(/text-\[var\(--md-sys-color-on-surface\)\]/g, 'text-foreground');
content = content.replace(/text-\[var\(--md-sys-color-on-surface-variant\)\]/g, 'text-default-500');
content = content.replace(/text-\[var\(--md-sys-color-primary\)\]/g, 'text-primary');
content = content.replace(/text-\[var\(--md-sys-color-error\)\]/g, 'text-danger');
content = content.replace(/text-\[var\(--app-danger\)\]/g, 'text-danger');
content = content.replace(/border-\[var\(--md-sys-color-outline\)\]\/[\d]+/g, 'border-divider');
content = content.replace(/border-\[var\(--md-sys-color-primary\)\]\/[\d]+/g, 'border-primary/20');
content = content.replace(/rounded-\[var\(--md-sys-shape-[^\]]+\)\]/g, 'rounded-3xl');

content = content.replace(/\s*icons(?=\s|>)/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Script ran successfully');
