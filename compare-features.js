const { chromium } = require('playwright');

async function compareFeatures() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Reference - scroll to features section
  console.log('Taking reference features screenshot...');
  const refPage = await context.newPage();
  await refPage.goto('https://fluence.framer.website/', { waitUntil: 'networkidle' });
  await refPage.waitForTimeout(2000);

  // Scroll to features (approximately 1000px down)
  await refPage.evaluate(() => window.scrollTo(0, 1100));
  await refPage.waitForTimeout(500);
  await refPage.screenshot({ path: 'screenshots/ref-features.png' });

  // Generated - scroll to features section
  console.log('Taking generated features screenshot...');
  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Scroll to features
  await genPage.evaluate(() => window.scrollTo(0, 1100));
  await genPage.waitForTimeout(500);
  await genPage.screenshot({ path: 'screenshots/gen-features.png' });

  await browser.close();
  console.log('Features screenshots saved');
}

compareFeatures().catch(console.error);
