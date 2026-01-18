const { chromium } = require('playwright');

async function sideBySide() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Reference full page
  const refPage = await context.newPage();
  await refPage.goto('https://fluence.framer.website/', { waitUntil: 'networkidle' });
  await refPage.waitForTimeout(3000);
  await refPage.screenshot({ path: 'screenshots/ref-full.png', fullPage: true });

  // Generated full page
  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);
  await genPage.screenshot({ path: 'screenshots/gen-full.png', fullPage: true });

  await browser.close();
  console.log('Full page screenshots saved');
}

sideBySide().catch(console.error);
