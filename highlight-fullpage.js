const { chromium } = require('playwright');

async function highlightFullpage() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 }
  });

  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Add highlighting
  await genPage.evaluate(() => {
    const h2 = Array.from(document.querySelectorAll('h2')).find(el => el.textContent.includes('Explore the Power'));
    if (h2) {
      h2.style.border = '5px solid red';
      h2.style.background = 'yellow';
    }
    // Highlight Adaptive Learning
    const h3 = Array.from(document.querySelectorAll('h3')).find(el => el.textContent.includes('Adaptive Learning'));
    if (h3) {
      h3.style.border = '5px solid purple';
      h3.style.background = 'pink';
    }
  });

  await genPage.waitForTimeout(300);
  await genPage.screenshot({ path: 'screenshots/highlight-full.png', fullPage: true });
  console.log('Highlighted full page screenshot saved');

  await browser.close();
}

highlightFullpage().catch(console.error);
