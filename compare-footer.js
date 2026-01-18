const { chromium } = require('playwright');

async function compareFooter() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Reference - scroll to footer section
  console.log('Taking reference footer screenshot...');
  const refPage = await context.newPage();
  await refPage.goto('https://fluence.framer.website/', { waitUntil: 'networkidle' });
  await refPage.waitForTimeout(2000);

  // Scroll to bottom
  await refPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await refPage.waitForTimeout(500);
  await refPage.screenshot({ path: 'screenshots/ref-footer.png' });

  // Generated - scroll to footer section
  console.log('Taking generated footer screenshot...');
  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Scroll to bottom
  await genPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await genPage.waitForTimeout(500);
  await genPage.screenshot({ path: 'screenshots/gen-footer.png' });

  await browser.close();
  console.log('Footer screenshots saved');
}

compareFooter().catch(console.error);
