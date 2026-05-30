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

// 2. Replace Outer Layout & Modal
// We'll just replace the start and end of the AnimatePresence manually by finding the exact string.
const modalStartRegex = /<AnimatePresence>\s*\{isOpen && \(\s*<motion\.div[^>]*className="fixed inset-0[^>]*>\s*<div className="absolute inset-0 bg-black\/80" onClick=\{onClose\} \/>\s*<motion\.div\s*variants=\{modalVariants\}[^>]*>\s*<div className="flex items-center justify-between[^>]*>\s*<div>\s*<h2[^>]*>\s*\{t\("settings"\)\}\s*<\/h2>\s*<\/div>\s*<motion\.button[^>]*>[\s\S]*?<\/motion\.button>\s*<\/div>/;

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

// 3. Replace Tabs Layout
const tabsRegex = /\{\/\* Tabs \*\/\}\s*<div className="w-full overflow-x-auto no-scrollbar border-b border-\[var\(--md-sys-color-outline\)\]\/10 shrink-0">\s*\{\/\* @ts-ignore \*\/\}\s*<md-tabs[^>]*>\s*\{\/\* @ts-ignore \*\/\}\s*<md-primary-tab onClick=\{[^>]*>\s*\{t\("general"\)\}\s*<span slot="icon"><Settings size=\{18\} \/><\/span>\s*<\/md-primary-tab>\s*\{\/\* @ts-ignore \*\/\}\s*<md-primary-tab onClick=\{[^>]*>\s*\{t\("notifications"\)\}\s*<span slot="icon"><Bell size=\{18\} \/><\/span>\s*<\/md-primary-tab>\s*\{\/\* @ts-ignore \*\/\}\s*<md-primary-tab onClick=\{[^>]*>\s*\{t\("offset"\)\}\s*<span slot="icon"><Clock size=\{18\} \/><\/span>\s*<\/md-primary-tab>\s*\{\/\* @ts-ignore \*\/\}\s*<md-primary-tab onClick=\{[^>]*>\s*\{t\("sunnahAndOptional" as any\) \|\| "Lanjutan"\}\s*<span slot="icon"><Sliders size=\{18\} \/><\/span>\s*<\/md-primary-tab>\s*\{\/\* @ts-ignore \*\/\}\s*<md-primary-tab onClick=\{[^>]*>\s*\{t\("mosqueMode" as any\) \|\| "Mod Masjid"\}\s*<span slot="icon"><MoonStar size=\{18\} \/><\/span>\s*<\/md-primary-tab>\s*<\/md-tabs>\s*<\/div>/;

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

// Replace body wrapper
content = content.replace(
  /<div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8 pt-6 space-y-6 no-scrollbar bg-\[var\(--md-sys-color-surface\)\]">/,
  '<ModalBody className="custom-scrollbar px-4 sm:px-8 pb-8 pt-6 space-y-6">'
);

// Replace end wrapper by finding the exact ending sequence
const endRegex = /<\/div>\s*<\/motion\.div>\s*<\/motion\.div>\s*\}\)\s*<\/AnimatePresence>|<\/div>\s*<\/motion\.div>\s*<\/motion\.div>\s*\}\s*<\/AnimatePresence>\s*\);\s*\}/;
content = content.replace(endRegex, `</ModalBody>
      </>
    )}
  </ModalContent>
</Modal>
  );
}`);

// 4. Safe Component Replacements using [^>]*?
// md-switch
content = content.replace(/<md-switch([^>]*?)selected=\{([^}]+)\}([^>]*?)>/g, '<Switch$1isSelected={$2}$3>');
content = content.replace(/<md-switch([^>]*?)>/g, '<Switch$1>');
content = content.replace(/<\/md-switch>/g, '</Switch>');

// md-slider
content = content.replace(/<md-slider([^>]*?)min=\{([^}]+)\}([^>]*?)max=\{([^}]+)\}([^>]*?)>/g, '<Slider$1minValue={$2}$3maxValue={$4}$5 className="max-w-md">');
content = content.replace(/<md-slider([^>]*?)>/g, '<Slider$1 className="max-w-md">');
content = content.replace(/<\/md-slider>/g, '</Slider>');
content = content.replace(/\s*ticks/g, ' showSteps');
content = content.replace(/\s*labeled/g, ' ');

// md-outlined-select
content = content.replace(/<md-outlined-select([^>]*?)>/g, '<Select variant="bordered" className="max-w-xs"$1>');
content = content.replace(/<\/md-outlined-select>/g, '</Select>');

// md-select-option
content = content.replace(/<md-select-option([^>]*?)value=\{([^}]+)\}([^>]*?)>/g, '<SelectItem$1key={$2}$3>');
content = content.replace(/<md-select-option([^>]*?)value="([^"]+)"([^>]*?)>/g, '<SelectItem$1key="$2"$3>');
content = content.replace(/<\/md-select-option>/g, '</SelectItem>');

// slots
content = content.replace(/<div slot="headline">([^<]+)<\/div>/g, '$1');
content = content.replace(/<md-icon slot="icon"[^>]*>[^<]+<\/md-icon>/g, '');

// buttons
content = content.replace(/<md-icon-button([^>]*?)>/g, '<Button isIconOnly variant="light" size="sm"$1>');
content = content.replace(/<\/md-icon-button>/g, '</Button>');
content = content.replace(/<md-filled-button([^>]*?)>/g, '<Button color="primary"$1>');
content = content.replace(/<\/md-filled-button>/g, '</Button>');
content = content.replace(/<md-outlined-button([^>]*?)>/g, '<Button variant="bordered"$1>');
content = content.replace(/<\/md-outlined-button>/g, '</Button>');
content = content.replace(/<md-text-button([^>]*?)>/g, '<Button variant="light"$1>');
content = content.replace(/<\/md-text-button>/g, '</Button>');
content = content.replace(/<md-filled-tonal-icon-button([^>]*?)>/g, '<Button isIconOnly variant="flat"$1>');
content = content.replace(/<\/md-filled-tonal-icon-button>/g, '</Button>');

// filter-chip -> Button
content = content.replace(/<md-filter-chip([^>]*?)label=\{([^}]+)\}([^>]*?)selected=\{([^}]+)\}([^>]*?)><\/md-filter-chip>/g, '<Button size="sm" variant={$4 ? "solid" : "flat"} color={$4 ? "primary" : "default"}$1$3$5>{$2}</Button>');
content = content.replace(/<md-filter-chip([^>]*?)label="([^"]+)"([^>]*?)selected=\{([^}]+)\}([^>]*?)><\/md-filter-chip>/g, '<Button size="sm" variant={$4 ? "solid" : "flat"} color={$4 ? "primary" : "default"}$1$3$5>$2</Button>');

// Remove ripples
content = content.replace(/<md-ripple><\/md-ripple>/g, '');
content = content.replace(/<md-ripple \/>/g, '');

// Clean ts-ignore related to md-
content = content.replace(/\{\/\* @ts-ignore \*\/\}\s*<Switch/g, '<Switch');
content = content.replace(/\{\/\* @ts-ignore \*\/\}\s*<Slider/g, '<Slider');
content = content.replace(/\{\/\* @ts-ignore \*\/\}\s*<Select/g, '<Select');
content = content.replace(/\{\/\* @ts-ignore \*\/\}\s*<Button/g, '<Button');

// Remove any remaining raw md- classes or icons attribute
content = content.replace(/\s*icons(?=\s|>|\/)/g, '');

// Global Style replacements
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

fs.writeFileSync(filePath, content, 'utf8');
console.log('Regex transform complete');
