const { chromium } = require('playwright');
const path = require('path');

async function takeScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Screenshot reference site
  console.log('Taking reference screenshot...');
  const refPage = await context.newPage();
  await refPage.goto('https://fluence.framer.website/', { waitUntil: 'networkidle' });
  await refPage.waitForTimeout(2000);
  await refPage.screenshot({
    path: 'screenshots/reference-fullpage.png',
    fullPage: true
  });

  // Take section screenshots of reference
  const refSections = ['header', 'hero', 'features', 'about', 'faq', 'footer'];
  let refScrollY = 0;
  for (let i = 0; i < 6; i++) {
    await refPage.evaluate((y) => window.scrollTo(0, y), refScrollY);
    await refPage.waitForTimeout(500);
    await refPage.screenshot({
      path: `screenshots/reference-section-${i+1}.png`
    });
    refScrollY += 900;
  }

  // Screenshot generated site
  console.log('Taking generated screenshot...');
  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);
  await genPage.screenshot({
    path: 'screenshots/generated-fullpage.png',
    fullPage: true
  });

  // Take section screenshots of generated
  let genScrollY = 0;
  for (let i = 0; i < 6; i++) {
    await genPage.evaluate((y) => window.scrollTo(0, y), genScrollY);
    await genPage.waitForTimeout(500);
    await genPage.screenshot({
      path: `screenshots/generated-section-${i+1}.png`
    });
    genScrollY += 900;
  }

  await browser.close();
  console.log('Screenshots saved to screenshots/ folder');
}

takeScreenshots().catch(console.error);
