const fs = require('fs');

const filePath = 'src/components/SettingsModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update Imports
if (!content.includes('Modal,')) {
  content = content.replace(
    /import \{ Button, Switch, Slider, Select \} from "@heroui\/react";/,
    'import { Button, Switch, Slider, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, Tabs, Tab, Card, CardBody, Input } from "@heroui/react";'
  );
}

// 2. Outer Layout & Modal
const modalStartRegex = /<AnimatePresence>[\s\S]*?<motion\.div[^>]*className="fixed inset-0[^>]*>[\s\S]*?<div className="absolute inset-0 bg-black\/80"[^>]*>[\s\S]*?<motion\.div[^>]*variants=\{modalVariants\}[^>]*>[\s\S]*?<div className="flex items-center justify-between[^>]*>[\s\S]*?<div>[\s\S]*?<h2[^>]*>[\s\S]*?\{t\("settings"\)\}[\s\S]*?<\/h2>[\s\S]*?<\/div>[\s\S]*?<\/motion\.button>\s*<\/div>/;

const modalStartReplacement = `<Modal 
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
        </ModalHeader>`;
content = content.replace(modalStartRegex, modalStartReplacement);

// 3. Tabs
const tabsRegex = /\{\/\* Tabs \*\/\}\s*<div className="w-full overflow-x-auto no-scrollbar border-b border-\[var\(--md-sys-color-outline\)\]\/10 shrink-0">[\s\S]*?<\/md-tabs>\s*<\/div>/;
const tabsReplacement = `<div className="w-full bg-content2 p-2 border-b border-divider shrink-0">
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
</div>`;
content = content.replace(tabsRegex, tabsReplacement);

// 4. ModalBody mapping
content = content.replace(
  /<div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8 pt-6 space-y-6 no-scrollbar bg-\[var\(--md-sys-color-surface\)\]">/,
  '<ModalBody className="custom-scrollbar px-4 sm:px-8 pb-8 pt-6">'
);

// 5. Ending tags
content = content.replace(
  /<\/div>\s*<\/motion\.div>\s*<\/motion\.div>\s*<\/AnimatePresence>\s*;\s*}/,
  `</ModalBody>
      </>
    )}
  </ModalContent>
</Modal>
  );
}`
);

// 6. Components mapping
// Switch
content = content.replace(/<md-switch([^>]*)selected=\{([^}]+)\}([^>]*)><\/md-switch>/g, '<Switch$1isSelected={$2}$3 />');
// Note: HeroUI Switch doesn't have an `icons` attribute, but passing it usually just gets ignored or passed to input.
content = content.replace(/\s*icons(?=\s|>)/g, '');

// Slider
// Material: <md-slider value={v} min={min} max={max} ...></md-slider>
// HeroUI: <Slider value={v} minValue={min} maxValue={max} ... />
// Note: Some sliders in SettingsModal might just use `value` and `min` `max`
content = content.replace(/<md-slider([^>]*)min=\{([^}]+)\}([^>]*)max=\{([^}]+)\}([^>]*)><\/md-slider>/g, '<Slider$1minValue={$2}$3maxValue={$4}$5 className="max-w-md" />');

// Select
// Material: <md-outlined-select ...> <md-select-option value="...">...</md-select-option> </md-outlined-select>
// HeroUI: <Select ...> <SelectItem key="...">...</SelectItem> </Select>
// We need to replace md-outlined-select with Select
content = content.replace(/<md-outlined-select/g, '<Select variant="bordered" className="max-w-xs"');
content = content.replace(/<\/md-outlined-select>/g, '</Select>');
// and md-select-option with SelectItem. Wait, HeroUI SelectItem uses `key` instead of `value`.
// <md-select-option value={...}> -> <SelectItem key={...}>
content = content.replace(/<md-select-option([^>]*)value=\{([^}]+)\}([^>]*)>/g, '<SelectItem$1key={$2}$3>');
content = content.replace(/<md-select-option([^>]*)value="([^"]+)"([^>]*)>/g, '<SelectItem$1key="$2"$3>');
content = content.replace(/<\/md-select-option>/g, '</SelectItem>');
content = content.replace(/<div slot="headline">([^<]+)<\/div>/g, '$1');

// md-filled-text-field
// <md-filled-text-field value={...} onInput={...}> -> <Input value={...} onChange={...} />
content = content.replace(/<md-filled-text-field/g, '<Input variant="faded"');
content = content.replace(/<\/md-filled-text-field>/g, '');
// onInput -> onChange inside Input
content = content.replace(/(<Input[^>]+)onInput=/g, '$1onChange=');

// md-icon-button -> Button isIconOnly
content = content.replace(/<md-icon-button([^>]*)>/g, '<Button isIconOnly variant="light" size="sm"$1>');
content = content.replace(/<\/md-icon-button>/g, '</Button>');

// md-icon -> lucide react icons were already used mostly, but if any <md-icon> remains:
// Remove <md-icon> slot="icon" ... >name</md-icon> completely if it's inside options because HeroUI SelectItem doesn't need slots
content = content.replace(/<md-icon[^>]*>[^<]+<\/md-icon>/g, '');

// Buttons
content = content.replace(/<md-filled-button/g, '<Button color="primary"');
content = content.replace(/<\/md-filled-button>/g, '</Button>');
content = content.replace(/<md-outlined-button/g, '<Button variant="bordered"');
content = content.replace(/<\/md-outlined-button>/g, '</Button>');
content = content.replace(/<md-text-button/g, '<Button variant="light"');
content = content.replace(/<\/md-text-button>/g, '</Button>');

// Clean up Material Design variables and classNames
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
content = content.replace(/shadow-\[0_8px_30px_rgb\(0,0,0,0\.12\)\]/g, 'shadow-lg');

// Fix the slider ticks property which HeroUI doesn't support as an attribute
content = content.replace(/\s*ticks(?=\s|>)/g, ' showSteps');

// Add "text-default-500" where opacity-80 or text-sm is used for descriptions to increase contrast cleanly
content = content.replace(/text-sm opacity-80/g, 'text-sm text-default-500');
content = content.replace(/text-xs opacity-70/g, 'text-xs text-default-400');

fs.writeFileSync(filePath, content, 'utf8');
console.log('SettingsModal.tsx layout replaced with HeroUI Components via regex.');
