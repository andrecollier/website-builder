const { chromium } = require('playwright');

async function compareSections() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Reference screenshots
  console.log('Taking reference screenshots...');
  const refPage = await context.newPage();
  await refPage.goto('https://fluence.framer.website/', { waitUntil: 'networkidle' });
  await refPage.waitForTimeout(2000);

  await refPage.screenshot({ path: 'screenshots/ref-fullpage.png', fullPage: true });

  // Generated screenshots
  console.log('Taking generated screenshots...');
  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  await genPage.screenshot({ path: 'screenshots/gen-fullpage.png', fullPage: true });

  await browser.close();
  console.log('Screenshots saved');
}

compareSections().catch(console.error);
