const { chromium } = require('playwright');

async function compareAll() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Reference page
  console.log('Taking reference screenshots...');
  const refPage = await context.newPage();
  await refPage.goto('https://fluence.framer.website/', { waitUntil: 'networkidle' });
  await refPage.waitForTimeout(3000);

  // Hero section (0-1000px)
  await refPage.screenshot({ path: 'screenshots/ref-01-hero.png', clip: { x: 0, y: 0, width: 1440, height: 1000 } });

  // Scroll and capture more
  await refPage.evaluate(() => window.scrollTo(0, 900));
  await refPage.waitForTimeout(300);
  await refPage.screenshot({ path: 'screenshots/ref-02-hero2.png' });

  // Generated page
  console.log('Taking generated screenshots...');
  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(3000);

  // Hero section
  await genPage.screenshot({ path: 'screenshots/gen-01-hero.png', clip: { x: 0, y: 0, width: 1440, height: 1000 } });

  // Scroll and capture more
  await genPage.evaluate(() => window.scrollTo(0, 900));
  await genPage.waitForTimeout(300);
  await genPage.screenshot({ path: 'screenshots/gen-02-hero2.png' });

  await browser.close();
  console.log('All screenshots saved');
}

compareAll().catch(console.error);
