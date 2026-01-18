const { chromium } = require('playwright');

async function compareHero() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Screenshot reference hero area
  console.log('Taking reference hero screenshot...');
  const refPage = await context.newPage();
  await refPage.goto('https://fluence.framer.website/', { waitUntil: 'networkidle' });
  await refPage.waitForTimeout(2000);

  // Full hero section (scroll down a bit to capture more)
  await refPage.screenshot({
    path: 'screenshots/reference-hero.png',
    clip: { x: 0, y: 0, width: 1440, height: 1000 }
  });

  // Screenshot generated hero area
  console.log('Taking generated hero screenshot...');
  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  await genPage.screenshot({
    path: 'screenshots/generated-hero.png',
    clip: { x: 0, y: 0, width: 1440, height: 1000 }
  });

  // Also take full page screenshots
  await refPage.screenshot({
    path: 'screenshots/reference-fullpage.png',
    fullPage: true
  });

  await genPage.screenshot({
    path: 'screenshots/generated-fullpage.png',
    fullPage: true
  });

  await browser.close();
  console.log('Hero screenshots saved');
}

compareHero().catch(console.error);
