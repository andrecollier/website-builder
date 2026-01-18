const { chromium } = require('playwright');

async function checkConsole() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // Capture console messages
  page.on('console', msg => console.log('Console:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('Page error:', err.message));

  await page.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Get the badge element if it exists
  const badge = await page.locator('text=BUSINESS').first();
  if (await badge.count() > 0) {
    const box = await badge.boundingBox();
    console.log('Badge found:', box);
  } else {
    console.log('Badge NOT found in DOM');

    // Check for lowercase version
    const lowerBadge = await page.locator('text=business').first();
    if (await lowerBadge.count() > 0) {
      console.log('Found lowercase badge instead');
    }
  }

  // Take screenshot with badge highlighted if found
  await page.screenshot({
    path: 'screenshots/debug-badge.png',
    fullPage: true
  });

  await browser.close();
}

checkConsole().catch(console.error);
