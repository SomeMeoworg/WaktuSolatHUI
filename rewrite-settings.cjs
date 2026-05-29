const fs = require('fs');

const filePath = 'src/components/SettingsModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add missing imports
if (!content.includes('Modal,')) {
  content = content.replace(
    /import \{ Button, Switch, Slider, Select \} from "@heroui\/react";/,
    'import { Button, Switch, Slider, Select, Modal, ModalContent, ModalHeader, ModalBody, Tabs, Tab, Card, CardBody } from "@heroui/react";'
  );
}

// 2. Replace the AnimatePresence outer modal shell with HeroUI Modal
const modalShellStartRegex = /<AnimatePresence>[\s\S]*?<motion\.div[^>]*className="fixed inset-0[^>]*>[\s\S]*?<div className="absolute inset-0 bg-black\/80" onClick=\{onClose\} \/>[\s\S]*?<motion\.div[^>]*variants=\{modalVariants\}[^>]*>[\s\S]*?<div className="flex items-center justify-between[^>]*>[\s\S]*?<div>[\s\S]*?<h2[^>]*>[\s\S]*?\{t\("settings"\)\}[\s\S]*?<\/h2>[\s\S]*?<\/div>[\s\S]*?<\/button>\s*<\/div>/;

const modalShellStartReplacement = `<Modal 
  isOpen={isOpen} 
  onClose={onClose} 
  size="3xl"
  scrollBehavior="inside"
  backdrop="blur"
  classNames={{
    base: "bg-content1 rounded-[2.5rem] shadow-2xl h-[90vh] sm:h-[85vh] m-2 sm:m-0",
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

content = content.replace(modalShellStartRegex, modalShellStartReplacement);

// 3. Replace the Tabs row
const tabsRegex = /\{\/\* Tabs \*\/\}\s*<div className="w-full overflow-x-auto no-scrollbar border-b border-divider shrink-0">[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/;

const tabsReplacement = `<div className="w-full bg-content2 p-2 border-b border-divider">
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

// 4. Change the inner body wrapper
content = content.replace(
  /<div className="flex-1 overflow-y-auto custom-scrollbar bg-content1">/,
  '<ModalBody className="custom-scrollbar">'
);

// 5. Replace closing tags
const modalClosingRegex = /<\/div>\s*<\/motion\.div>\s*<\/motion\.div>\s*<\/AnimatePresence>/;
const modalClosingReplacement = `</ModalBody>
      </>
    )}
  </ModalContent>
</Modal>`;
content = content.replace(modalClosingRegex, modalClosingReplacement);

// 6. Rewrite Cards formatting for all tabs
// We replace large background divs with HeroUI Cards where appropriate.
// Currently, sections look like:
// <div className="bg-content2 border border-divider rounded-[24px] p-6">
// Let's replace those with standard HeroUI <Card> setups if possible, or just keep the generic ones but style them properly since they are purely structural.
content = content.replace(/className="bg-content2 border border-divider rounded-\[24px\] p-6"/g, 'className="bg-content1 border border-divider rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow"');

content = content.replace(/className="bg-content3 border border-divider rounded-\[20px\] p-4 sm:p-5 flex flex-col gap-4"/g, 'className="bg-content2 border border-divider rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm"');

fs.writeFileSync(filePath, content, 'utf8');
console.log('SettingsModal.tsx layout replaced with HeroUI Modal/Tabs.');
