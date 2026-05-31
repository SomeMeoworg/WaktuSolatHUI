import { chromium } from 'playwright-core';
import path from 'path';

async function run() {
  console.log('Launching Microsoft Edge headless for exhaustive visual capture...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  
  // Debug listeners
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.stack || err.message));
  
  const artifactDir = 'C:\\Users\\alif325\\.gemini\\antigravity-ide\\brain\\198ca10f-1669-45f6-93ca-d1e34ae9d4cd';
  
  console.log('--- Phase 1: Onboarding Carousel Walkthrough ---');
  console.log('Clearing storage and loading fresh instance...');
  await page.goto('http://localhost:3001');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(2000);
  
  // Slide 0: Welcome Screen
  console.log('Step 0: Welcome Screen');
  await page.screenshot({ path: path.join(artifactDir, 'media__visual_onboarding_0_welcome.png') });
  const startBtn = page.locator('button:has-text("Start Setup"), button:has-text("Mula Konfigurasi")');
  await startBtn.first().click();
  
  // Slide 1: Location Setup
  console.log('Step 1: Zone Selection Screen');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'media__visual_onboarding_1_location.png') });
  const nextBtn = page.locator('button:has-text("Next"), button:has-text("Seterusnya")');
  await nextBtn.first().click();
  
  // Slide 2: Notifications Permission Setup
  console.log('Step 2: Notifications Setup Screen');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'media__visual_onboarding_2_notifications.png') });
  const skipBtn = page.locator('button:has-text("Skip for now"), button:has-text("Langkau buat masa sekarang")');
  await skipBtn.first().click();
  
  // Slide 3: Sound Setup Screen
  console.log('Step 3: Sound theme Selection Screen');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'media__visual_onboarding_3_sounds.png') });
  const finishBtn = page.locator('button:has-text("Finish & Enter App"), button:has-text("Selesai & Masuk Aplikasi")');
  await finishBtn.first().click();
  
  // Phase 2: Active Dashboard Mount & Style capture
  console.log('--- Phase 2: Dashboard Presets Capture ---');
  console.log('Waiting for main prayer rows to render...');
  try {
    await page.waitForSelector('.prayer-row', { timeout: 10000 });
    console.log('Dashboard successfully loaded and populated!');
  } catch (err) {
    console.warn('Timeout waiting for .prayer-row, proceeding anyway...');
  }
  
  await page.waitForTimeout(2000);
  const styles = ['default', 'glass', 'retro', 'soft'];
  for (const style of styles) {
    await page.evaluate((s) => {
      document.documentElement.setAttribute('data-style', s);
    }, style);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, `media__visual_dashboard_${style}.png`) });
    console.log(`Captured Style Preset: ${style}`);
  }
  
  // Set back to default style for modals
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-style', 'default');
  });
  await page.waitForTimeout(500);

  // Helper to load clean dashboard by preserving localstorage onboarding state
  const loadCleanDashboard = async () => {
    console.log('Reloading dashboard to get a fresh clean state...');
    await page.goto('http://localhost:3001');
    await page.evaluate(() => {
      localStorage.setItem('waktu-solat-onboarding-completed', 'true');
      localStorage.setItem('waktu-solat-zone', 'SGR01');
    });
    await page.reload();
    await page.waitForSelector('.prayer-row', { timeout: 8000 });
    await page.waitForTimeout(1000);
  };

  // Phase 3: Interactive Dialogs & Overlay Modals
  console.log('--- Phase 3: Dashboard Modals Capture ---');
  
  // 1. FullCalendar Modal
  await loadCleanDashboard();
  console.log('Opening Calendar range modal...');
  const calendarBtn = page.locator('button:has(svg.lucide-calendar-range)');
  if (await calendarBtn.count() > 0) {
    await calendarBtn.first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(artifactDir, 'media__visual_modal_calendar.png') });
    console.log('Captured: Full Calendar Modal');
  }
  
  // 2. Settings Modal
  await loadCleanDashboard();
  console.log('Opening Settings modal...');
  const settingsBtn = page.locator('button:has(svg.lucide-settings)');
  if (await settingsBtn.count() > 0) {
    await settingsBtn.first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(artifactDir, 'media__visual_modal_settings.png') });
    console.log('Captured: Settings Modal');
  }
  
  // 3. Share Panel Modal
  await loadCleanDashboard();
  console.log('Opening Share card selector panel...');
  const shareBtn = page.locator('button:has(svg.lucide-share2)');
  if (await shareBtn.count() > 0) {
    await shareBtn.first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(artifactDir, 'media__visual_modal_share.png') });
    console.log('Captured: Share Panel');
  }
  
  // 4. Weather Details Forecast Modal
  await loadCleanDashboard();
  console.log('Opening Weather detailed statistics forecast modal...');
  const weatherBtn = page.locator('button:has(svg.lucide-droplets), button:has(svg.lucide-sun), button:has(svg.lucide-cloud-rain)');
  if (await weatherBtn.count() > 0) {
    await weatherBtn.first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(artifactDir, 'media__visual_modal_weather.png') });
    console.log('Captured: Weather Detailed Modal');
  }
  
  await browser.close();
  console.log('Exhaustive UI design visual capture sequence successfully completed!');
}

run().catch(err => {
  console.error('Visual capture encountered a fatal error:', err);
  process.exit(1);
});
