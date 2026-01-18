const { chromium } = require('playwright');

async function checkHero() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 }
  });

  const page = await context.newPage();
  await page.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Take hero screenshot (first 1000px)
  await page.screenshot({
    path: 'screenshots/current-hero.png',
    clip: { x: 0, y: 0, width: 1440, height: 1000 }
  });

  await browser.close();
  console.log('Hero screenshot saved');
}

checkHero().catch(console.error);
