const fs = require('fs');

function cleanSharePanel(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Strip all Material CSS overrides completely
    content = content.replace(/\s*style=\{\{\s*['"]--md-[^}]*\} as any\}/g, '');
    content = content.replace(/\s*style=\{[^{]*\{['"]--md-[^}]*\}[^}]*\} as any\}/g, '');

    // 2. Replace md-outlined-text-field with HeroUI Input safely
    const oldInputRegex = /\{\/\* @ts-ignore \*\/\}\s*<md-outlined-text-field[\s\S]*?value=\{searchQuery\}[\s\S]*?onInput=\{\(e: any\) => setSearchQuery\(sanitizeInput\(e\.target\.value\)\)\}[\s\S]*?placeholder=\{t\("searchZonePlaceholder" as any\)\}[\s\S]*?className="w-full"[\s\S]*?>[\s\S]*?<Search size=\{18\} \/>[\s\S]*?\{searchQuery && \([\s\S]*?\/\* @ts-ignore \*\/[\s\S]*?<md-icon-button[\s\S]*?onClick=\{\(\) => setSearchQuery\(""\)\}>[\s\S]*?<X size=\{18\} \/>[\s\S]*?<\/md-icon-button>[\s\S]*?\)\}[\s\S]*?<\/md-outlined-text-field>/g;

    const replacement = `
                        <Input variant="bordered"
                          value={searchQuery}
                          onChange={(e: any) => setSearchQuery(sanitizeInput(e.target.value))}
                          placeholder={t("searchZonePlaceholder" as any)}
                          className="w-full"
                          startContent={<Search size={18} className="text-default-400" />}
                          endContent={
                            searchQuery ? (
                              <Button isIconOnly variant="light" radius="full" size="sm" onClick={() => setSearchQuery("")}>
                                <X size={16} />
                              </Button>
                            ) : null
                          }
                          classNames={{ inputWrapper: "bg-content2 shadow-sm" }}
                        />`;

    const newContent = content.replace(oldInputRegex, replacement);
    
    // Also strip generic classes
    let finalContent = newContent.replace(/bg-\[var\(--md-sys-color-surface\)\]/g, 'bg-content1');
    finalContent = finalContent.replace(/ring-\[var\(--md-sys-color-outline\)\]\/12/g, 'ring-divider');
    finalContent = finalContent.replace(/border-\[var\(--md-sys-color-outline\)\]\/10/g, 'border-divider');
    finalContent = finalContent.replace(/bg-\[var\(--md-sys-color-surface-container-low\)\]/g, 'bg-content1');
    
    if (finalContent !== content) {
        fs.writeFileSync(filePath, finalContent, 'utf8');
        console.log('Successfully fully upgraded SharePanel.tsx to HeroUI Input!');
    } else {
        console.log('Failed to match broken md-outlined-text-field in SharePanel.tsx');
    }
}

cleanSharePanel('src/components/SharePanel.tsx');
