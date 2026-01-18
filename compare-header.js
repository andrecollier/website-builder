const { chromium } = require('playwright');

async function compareHeaders() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Screenshot reference header
  console.log('Taking reference header screenshot...');
  const refPage = await context.newPage();
  await refPage.goto('https://fluence.framer.website/', { waitUntil: 'networkidle' });
  await refPage.waitForTimeout(2000);
  await refPage.screenshot({
    path: 'screenshots/reference-header.png',
    clip: { x: 0, y: 0, width: 1440, height: 120 }
  });

  // Screenshot generated header
  console.log('Taking generated header screenshot...');
  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);
  await genPage.screenshot({
    path: 'screenshots/generated-header.png',
    clip: { x: 0, y: 0, width: 1440, height: 120 }
  });

  await browser.close();
  console.log('Header screenshots saved');
}

compareHeaders().catch(console.error);
