const { chromium } = require('playwright');

async function checkFeaturesArea() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 }
  });

  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Scroll to where Features section should start
  await genPage.evaluate(() => window.scrollTo(0, 850));
  await genPage.waitForTimeout(300);
  await genPage.screenshot({ path: 'screenshots/features-area.png' });
  console.log('Features area screenshot saved');

  await browser.close();
}

checkFeaturesArea().catch(console.error);
