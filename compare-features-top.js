const { chromium } = require('playwright');

async function compareFeaturesTop() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Generated - scroll to features section
  console.log('Taking generated features screenshot...');
  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Scroll to features (first cards)
  await genPage.evaluate(() => window.scrollTo(0, 1200));
  await genPage.waitForTimeout(500);
  await genPage.screenshot({ path: 'screenshots/gen-features-top.png' });

  await browser.close();
  console.log('Features top screenshot saved');
}

compareFeaturesTop().catch(console.error);
