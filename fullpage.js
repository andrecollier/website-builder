const { chromium } = require('playwright');

async function fullpage() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  await genPage.screenshot({ path: 'screenshots/fullpage-gen.png', fullPage: true });
  console.log('Full page screenshot saved');

  await browser.close();
}

fullpage().catch(console.error);
