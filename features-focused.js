const { chromium } = require('playwright');

async function featuresFocused() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 }
  });

  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Scroll to Features section start
  await genPage.evaluate(() => window.scrollTo(0, 1180));
  await genPage.waitForTimeout(300);
  await genPage.screenshot({ path: 'screenshots/features-focused.png' });
  console.log('Features focused screenshot saved');

  await browser.close();
}

featuresFocused().catch(console.error);
