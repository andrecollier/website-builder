const { chromium } = require('playwright');

async function debugH2() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 }
  });

  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Get computed styles of the h2
  const h2Styles = await genPage.evaluate(() => {
    const h2 = Array.from(document.querySelectorAll('h2')).find(el => el.textContent.includes('Explore the Power'));
    if (h2) {
      const style = window.getComputedStyle(h2);
      const rect = h2.getBoundingClientRect();
      return {
        color: style.color,
        opacity: style.opacity,
        visibility: style.visibility,
        display: style.display,
        position: style.position,
        zIndex: style.zIndex,
        width: rect.width,
        height: rect.height,
        top: rect.top + window.scrollY,
        left: rect.left
      };
    }
    return null;
  });
  
  console.log('H2 Computed Styles:', JSON.stringify(h2Styles, null, 2));

  // Also check parent elements
  const parentInfo = await genPage.evaluate(() => {
    const h2 = Array.from(document.querySelectorAll('h2')).find(el => el.textContent.includes('Explore the Power'));
    if (h2) {
      let parent = h2.parentElement;
      const parents = [];
      while (parent && parents.length < 5) {
        const style = window.getComputedStyle(parent);
        const rect = parent.getBoundingClientRect();
        parents.push({
          tag: parent.tagName,
          width: rect.width,
          height: rect.height,
          overflow: style.overflow,
          opacity: style.opacity
        });
        parent = parent.parentElement;
      }
      return parents;
    }
    return null;
  });
  
  console.log('Parent Elements:', JSON.stringify(parentInfo, null, 2));

  await browser.close();
}

debugH2().catch(console.error);
