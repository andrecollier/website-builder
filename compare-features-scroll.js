const { chromium } = require('playwright');

async function compareFeaturesScroll() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Take multiple screenshots at different scroll positions
  for (let scroll of [1000, 1500, 2000, 2500]) {
    await genPage.evaluate((s) => window.scrollTo(0, s), scroll);
    await genPage.waitForTimeout(300);
    await genPage.screenshot({ path: `screenshots/gen-scroll-${scroll}.png` });
    console.log(`Screenshot at scroll ${scroll}px saved`);
  }

  await browser.close();
}

compareFeaturesScroll().catch(console.error);
