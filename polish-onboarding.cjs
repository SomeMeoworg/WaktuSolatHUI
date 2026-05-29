const fs = require('fs');

function polishOnboarding(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Fix the Input void element error
    // Find the entire <Input ...> ... </Input> block
    const inputRegex = /<Input[\s\S]*?>[\s\S]*?<\/Input>/g;
    content = content.replace(inputRegex, `
                    <Input 
                      variant="bordered"
                      type="text" 
                      placeholder={tOnboarding.searchPlace}
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
                      classNames={{
                        inputWrapper: "bg-content2 shadow-sm border-default-200 hover:border-primary transition-colors",
                      }}
                    />`);

    // 2. Strip ugly Material style overrides
    content = content.replace(/style=\{\{\s*['"]--md-[^}]*\} as any\}/g, '');
    content = content.replace(/style=\{[^{]*\{['"]--md-[^}]*\}[^}]*\} as any\}/g, '');
    
    // 3. Make buttons look premium HeroUI
    // Primary start button
    content = content.replace(/<Button\s+onClick=\{handleNext\}\s+className="mt-4"\s*>/g, 
      '<Button color="primary" onClick={handleNext} className="mt-4 bg-primary text-white font-bold rounded-2xl shadow-md hover:shadow-lg w-full max-w-xs h-12">');

    // GPS button
    content = content.replace(/<Button variant="secondary"\s+onClick=\{handleGPSDetect\}\s+disabled=\{gpsLoading\}\s*>/g, 
      '<Button onClick={handleGPSDetect} disabled={gpsLoading} className="bg-secondary/20 text-secondary-foreground font-bold rounded-2xl shadow-sm hover:bg-secondary/30 w-full h-12">');

    // Notification buttons
    content = content.replace(/<Button\s+onClick=\{handleRequestNotification\}\s*>/g, 
      '<Button color={notificationPermission === "granted" ? "success" : "primary"} onClick={handleRequestNotification} className={cn("font-bold rounded-2xl shadow-md h-12", notificationPermission === "granted" ? "bg-success text-success-foreground" : "bg-primary text-white")}>');

    content = content.replace(/<Button variant="outline"\s+onClick=\{handleNext\}\s*>/g, 
      '<Button variant="bordered" onClick={handleNext} className="font-bold rounded-2xl border-2 h-12">');

    // Footer buttons
    content = content.replace(/<Button variant="outline"\s+onClick=\{handleBack\}\s*>/g, 
      '<Button variant="light" onClick={handleBack} className="font-bold rounded-xl text-default-600 hover:bg-default-100">');

    content = content.replace(/<Button\s+onClick=\{handleNext\}\s*>/g, 
      '<Button color="primary" onClick={handleNext} className="font-bold rounded-xl bg-primary text-white shadow-sm px-6">');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Polished ${filePath}`);
}

polishOnboarding('src/components/OnboardingFlow.tsx');
