const { chromium } = require('playwright');

async function featuresTop() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 }
  });

  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Scroll to exactly Features start
  await genPage.evaluate(() => window.scrollTo(0, 1229));
  await genPage.waitForTimeout(300);
  await genPage.screenshot({ path: 'screenshots/features-top.png' });
  console.log('Features top screenshot saved');

  await browser.close();
}

featuresTop().catch(console.error);
