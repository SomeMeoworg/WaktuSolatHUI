const fs = require('fs');

function polishAppTsx() {
  const filePath = 'src/App.tsx';
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Strip Material CSS
  content = content.replace(/\s*style=\{\{\s*['"]--md-[^}]*\} as any\}/g, '');
  content = content.replace(/\s*style=\{[^{]*\{['"]--md-[^}]*\}[^}]*\} as any\}/g, '');

  // 2. Enhance skeleton loader
  content = content.replace(/glass-card/g, 'bg-content1/60 backdrop-blur-md border border-divider shadow-sm');
  content = content.replace(/glass-panel/g, 'bg-content2/80 backdrop-blur-md border border-divider shadow-md');

  // 3. Fix main background / layout wrappers
  // Replace custom css vars with Tailwind semantics
  content = content.replace(/var\(--app-surface-variant\)/g, 'hsl(var(--heroui-content2))');
  content = content.replace(/var\(--app-background\)/g, 'hsl(var(--heroui-background))');
  content = content.replace(/var\(--glass-bg\)/g, 'hsl(var(--heroui-content1) / 0.7)');
  content = content.replace(/var\(--glass-border\)/g, 'hsl(var(--heroui-divider) / 0.5)');
  content = content.replace(/var\(--app-primary-container, hsl\(var\(--heroui-primary\) \/ 0.15\)\)/g, 'hsl(var(--heroui-primary)/0.15)');

  // Ensure main layout uses robust Tailwind gaps
  content = content.replace(/lg:border-l-4 border-\[var\(--app-surface-variant\)]/g, 'lg:border-l-2 border-divider/50');
  
  // Make main container breathe better
  content = content.replace(/max-w-\[1920px\] mx-auto relative z-10 flex flex-col lg:flex-row px-3 sm:px-6 lg:px-8 xl:px-12 py-2 sm:py-3 lg:py-4 gap-4 sm:gap-6 lg:gap-8 xl:gap-12/g,
    'max-w-[1920px] mx-auto relative z-10 flex flex-col lg:flex-row px-4 sm:px-6 lg:px-12 py-4 lg:py-8 gap-6 lg:gap-12');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Polished App.tsx layout aesthetics');
}

polishAppTsx();
