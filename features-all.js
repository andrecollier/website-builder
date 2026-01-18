const { chromium } = require('playwright');

async function featuresAll() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1400 }
  });

  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Scroll to capture entire Features section
  await genPage.evaluate(() => window.scrollTo(0, 1100));
  await genPage.waitForTimeout(300);
  await genPage.screenshot({ path: 'screenshots/features-all.png' });
  console.log('Features all screenshot saved');

  await browser.close();
}

featuresAll().catch(console.error);
