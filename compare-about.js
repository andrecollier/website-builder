const { chromium } = require('playwright');

async function compareAbout() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Reference
  console.log('Taking reference about screenshot...');
  const refPage = await context.newPage();
  await refPage.goto('https://fluence.framer.website/', { waitUntil: 'networkidle' });
  await refPage.waitForTimeout(2000);
  await refPage.evaluate(() => window.scrollTo(0, 3000));
  await refPage.waitForTimeout(500);
  await refPage.screenshot({ path: 'screenshots/ref-about.png' });

  // Generated
  console.log('Taking generated about screenshot...');
  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);
  await genPage.evaluate(() => window.scrollTo(0, 3000));
  await genPage.waitForTimeout(500);
  await genPage.screenshot({ path: 'screenshots/gen-about.png' });

  await browser.close();
  console.log('About screenshots saved');
}

compareAbout().catch(console.error);
