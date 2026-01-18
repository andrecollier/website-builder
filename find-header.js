const { chromium } = require('playwright');

async function findHeader() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 }
  });

  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Get position of Product Overview text
  const position = await genPage.evaluate(() => {
    const el = document.body.innerText;
    const featuresSection = document.querySelector('[data-component-type="features"]');
    if (featuresSection) {
      const rect = featuresSection.getBoundingClientRect();
      return { top: rect.top + window.scrollY, height: rect.height };
    }
    return null;
  });
  
  console.log('Features section position:', position);
  
  if (position) {
    await genPage.evaluate((y) => window.scrollTo(0, y - 100), position.top);
    await genPage.waitForTimeout(300);
    await genPage.screenshot({ path: 'screenshots/features-start.png' });
    console.log('Features start screenshot saved');
  }

  await browser.close();
}

findHeader().catch(console.error);
