const { chromium } = require('playwright');

async function featuresSection() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 }
  });

  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Scroll to Features section
  await genPage.evaluate(() => window.scrollTo(0, 1050));
  await genPage.waitForTimeout(300);
  await genPage.screenshot({ path: 'screenshots/features-section.png' });
  console.log('Features section screenshot saved');

  await browser.close();
}

featuresSection().catch(console.error);
