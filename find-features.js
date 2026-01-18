const { chromium } = require('playwright');

async function findFeatures() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Take screenshots to find first features cards
  for (let scroll of [800, 900, 1100, 1200, 1300]) {
    await genPage.evaluate((s) => window.scrollTo(0, s), scroll);
    await genPage.waitForTimeout(300);
    await genPage.screenshot({ path: `screenshots/find-${scroll}.png` });
    console.log(`Screenshot at scroll ${scroll}px saved`);
  }

  await browser.close();
}

findFeatures().catch(console.error);
