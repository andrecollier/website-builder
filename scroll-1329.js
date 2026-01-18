const { chromium } = require('playwright');

async function scroll1329() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 800 }
  });

  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  await genPage.evaluate(() => window.scrollTo(0, 1329));
  await genPage.waitForTimeout(300);
  await genPage.screenshot({ path: 'screenshots/scroll-1329.png' });
  console.log('Scroll 1329 screenshot saved');

  await browser.close();
}

scroll1329().catch(console.error);
