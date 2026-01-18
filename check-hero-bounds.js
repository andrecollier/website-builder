const { chromium } = require('playwright');

async function checkHeroBounds() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 }
  });

  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Get Hero section bounds
  const sections = await genPage.evaluate(() => {
    const components = document.querySelectorAll('[data-component-type]');
    return Array.from(components).map(el => {
      const rect = el.getBoundingClientRect();
      return {
        type: el.getAttribute('data-component-type'),
        top: rect.top + window.scrollY,
        bottom: rect.bottom + window.scrollY,
        height: rect.height
      };
    });
  });
  
  console.log('Section Bounds:', JSON.stringify(sections, null, 2));

  await browser.close();
}

checkHeroBounds().catch(console.error);
