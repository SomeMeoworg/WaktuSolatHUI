const fs = require('fs');

function fixInput(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. In ZoneSelector, if it is in the reverted state, fix the Input manually and cleanly
    if (filePath.includes('ZoneSelector.tsx')) {
        // Strip CSS overrides
        content = content.replace(/\s*style=\{\{\s*['"]--md-[^}]*\} as any\}/g, '');
        content = content.replace(/\s*style=\{[^{]*\{['"]--md-[^}]*\}[^}]*\} as any\}/g, '');
        
        // Fix the raw Input block
        const regex = /<Input variant="outline"[\s\S]*?placeholder={t\("searchPlaceholder"\)}[\s\S]*?value={searchQuery}[\s\S]*?onInput=\{\(e: any\) => setSearchQuery\(sanitizeInput\(e\.target\.value\)\)\}[\s\S]*?className="w-full"[\s\S]*?>[\s\S]*?<Search size=\{18\} \/>[\s\S]*?\{searchQuery && \([\s\S]*?\/\* @ts-ignore \*\/[\s\S]*?<Button isIconOnly variant="ghost" radius="full"[\s\S]*?onClick=\{\(\) => setSearchQuery\(""\)\}[\s\S]*?>[\s\S]*?<X size=\{18\} \/>[\s\S]*?<\/Button>[\s\S]*?\)\}[\s\S]*?<\/Input>/g;
        
        content = content.replace(regex, `
                        <Input variant="bordered"
                          type="text"
                          placeholder={t("searchPlaceholder")}
                          value={searchQuery}
                          onChange={(e: any) => setSearchQuery(sanitizeInput(e.target.value))}
                          startContent={<Search size={18} className="text-default-400" />}
                          endContent={
                            searchQuery ? (
                              <Button isIconOnly variant="light" radius="full" size="sm" onClick={() => setSearchQuery("")}>
                                <X size={16} />
                              </Button>
                            ) : null
                          }
                          classNames={{ inputWrapper: "bg-content2 shadow-sm" }}
                        />`);
                        
        // Also fix the mangled onChange if it somehow got there
        content = content.replace(/onChange=\{\(e: any\) =\n\s*startContent=\{<Search size=\{18\} className="text-default-400" \/>\} \/>/g, 
            `onChange={(e: any) => setSearchQuery(sanitizeInput(e.target.value))}
             startContent={<Search size={18} className="text-default-400" />}
             endContent={
               searchQuery ? (
                 <Button isIconOnly variant="light" radius="full" size="sm" onClick={() => setSearchQuery("")}>
                   <X size={16} />
                 </Button>
               ) : null
             }
             classNames={{ inputWrapper: "bg-content2 shadow-sm" }}
            />`);
    }
    
    if (filePath.includes('SharePanel.tsx')) {
        // Fix the mangled onChange
        content = content.replace(/onChange=\{\(e: any\) =\n\s*startContent=\{<Search size=\{18\} className="text-default-400" \/>\} \/>/g, 
            `onChange={(e: any) => setSearchQuery(sanitizeInput(e.target.value))}
             startContent={<Search size={18} className="text-default-400" />}
             endContent={
               searchQuery ? (
                 <Button isIconOnly variant="light" radius="full" size="sm" onClick={() => setSearchQuery("")}>
                   <X size={16} />
                 </Button>
               ) : null
             }
             classNames={{ inputWrapper: "bg-content2 shadow-sm" }}
            />`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

fixInput('src/components/ZoneSelector.tsx');
fixInput('src/components/SharePanel.tsx');
console.log("Fixed inputs properly!");
