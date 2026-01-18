const { chromium } = require('playwright');

async function compareFooter2() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Reference
  console.log('Taking reference footer screenshot...');
  const refPage = await context.newPage();
  await refPage.goto('https://fluence.framer.website/', { waitUntil: 'networkidle' });
  await refPage.waitForTimeout(2000);
  await refPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 900));
  await refPage.waitForTimeout(500);
  await refPage.screenshot({ path: 'screenshots/ref-footer2.png' });

  // Generated
  console.log('Taking generated footer screenshot...');
  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);
  await genPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 900));
  await genPage.waitForTimeout(500);
  await genPage.screenshot({ path: 'screenshots/gen-footer2.png' });

  await browser.close();
  console.log('Footer screenshots saved');
}

compareFooter2().catch(console.error);
