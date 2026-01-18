const { chromium } = require('playwright');

async function compareFaq() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Reference
  console.log('Taking reference FAQ screenshot...');
  const refPage = await context.newPage();
  await refPage.goto('https://fluence.framer.website/', { waitUntil: 'networkidle' });
  await refPage.waitForTimeout(2000);
  await refPage.evaluate(() => window.scrollTo(0, 5500));
  await refPage.waitForTimeout(500);
  await refPage.screenshot({ path: 'screenshots/ref-faq.png' });

  // Generated
  console.log('Taking generated FAQ screenshot...');
  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);
  await genPage.evaluate(() => window.scrollTo(0, 4800));
  await genPage.waitForTimeout(500);
  await genPage.screenshot({ path: 'screenshots/gen-faq.png' });

  await browser.close();
  console.log('FAQ screenshots saved');
}

compareFaq().catch(console.error);
