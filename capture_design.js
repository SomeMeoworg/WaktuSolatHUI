import { chromium } from 'playwright-core';
import path from 'path';

async function run() {
  console.log('Launching Microsoft Edge headless...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  
  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001');
  
  // Set localStorage items to bypass onboarding
  console.log('Bypassing onboarding and setting default zone to SGR01...');
  await page.evaluate(() => {
    localStorage.setItem('waktu-solat-onboarding-completed', 'true');
    localStorage.setItem('waktu-solat-zone', 'SGR01');
  });
  
  // Reload page to apply localStorage state
  await page.reload();
  
  // Wait for the main elements of the dashboard (prayer rows) to render
  console.log('Waiting for prayer schedule rows to render...');
  try {
    await page.waitForSelector('.prayer-row', { timeout: 8000 });
    console.log('Dashboard successfully loaded and rendered!');
  } catch (error) {
    console.warn('Timed out waiting for .prayer-row. Proceeding with capture anyway.');
  }

  // Allow animations and API assets to load completely
  await page.waitForTimeout(2000);
  
  const artifactDir = 'C:\\Users\\alif325\\.gemini\\antigravity-ide\\brain\\198ca10f-1669-45f6-93ca-d1e34ae9d4cd';
  const styles = ['default', 'glass', 'retro', 'soft'];
  
  for (const style of styles) {
    console.log(`Applying visual style preset: ${style}...`);
    await page.evaluate((s) => {
      document.documentElement.setAttribute('data-style', s);
    }, style);
    
    // Give smooth transitions time to finish
    await page.waitForTimeout(1000);
    
    const screenshotPath = path.join(artifactDir, `media__visual_${style}.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`Captured state screenshot: ${screenshotPath}`);
  }
  
  await browser.close();
  console.log('Design visual capture sequence successfully completed!');
}

run().catch(err => {
  console.error('Browser capture encountered an error:', err);
  process.exit(1);
});
