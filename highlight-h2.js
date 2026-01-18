const { chromium } = require('playwright');

async function highlightH2() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 }
  });

  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Add red border to the h2 and its parent
  await genPage.evaluate(() => {
    const h2 = Array.from(document.querySelectorAll('h2')).find(el => el.textContent.includes('Explore the Power'));
    if (h2) {
      h2.style.border = '5px solid red';
      h2.style.background = 'yellow';
      h2.parentElement.style.border = '5px solid blue';
    }
    // Also highlight "Product Overview" badge
    const badge = Array.from(document.querySelectorAll('p')).find(el => el.textContent.includes('Product Overview'));
    if (badge) {
      badge.style.border = '5px solid green';
      badge.style.background = 'lime';
    }
  });

  // Scroll to where the h2 should be
  await genPage.evaluate(() => window.scrollTo(0, 1200));
  await genPage.waitForTimeout(300);
  await genPage.screenshot({ path: 'screenshots/highlight-h2.png' });
  console.log('Highlighted H2 screenshot saved');

  await browser.close();
}

highlightH2().catch(console.error);
