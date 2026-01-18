const { chromium } = require('playwright');

async function findFeaturesHeader() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 }
  });

  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Get the exact position of the h2 "Explore the Power"
  const h2Position = await genPage.evaluate(() => {
    const h2 = Array.from(document.querySelectorAll('h2')).find(el => el.textContent.includes('Explore the Power'));
    if (h2) {
      const rect = h2.getBoundingClientRect();
      return { top: rect.top + window.scrollY, height: rect.height, text: h2.textContent };
    }
    return null;
  });
  
  console.log('H2 Position:', h2Position);
  
  if (h2Position) {
    // Scroll to position the h2 at the top of viewport
    await genPage.evaluate((y) => window.scrollTo(0, y - 150), h2Position.top);
    await genPage.waitForTimeout(300);
    await genPage.screenshot({ path: 'screenshots/features-header.png' });
    console.log('Features header screenshot saved');
  }

  await browser.close();
}

findFeaturesHeader().catch(console.error);
