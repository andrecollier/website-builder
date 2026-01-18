const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3002', { waitUntil: 'networkidle', timeout: 15000 });

  const result = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const heroImg = document.querySelectorAll('img')[10]; // The visible carousel image

    const h1Computed = h1 ? window.getComputedStyle(h1) : null;
    const imgComputed = heroImg ? window.getComputedStyle(heroImg) : null;

    // Find hero2 component
    const components = document.querySelectorAll('[data-framer-name]');
    const componentInfo = [];
    components.forEach(c => {
      const rect = c.getBoundingClientRect();
      const computed = window.getComputedStyle(c);
      if (rect.top < 50) {
        componentInfo.push({
          name: c.getAttribute('data-framer-name'),
          top: rect.top,
          zIndex: computed.zIndex,
          position: computed.position,
          overflow: computed.overflow
        });
      }
    });

    return {
      h1: h1 ? {
        zIndex: h1Computed.zIndex,
        position: h1Computed.position
      } : 'not found',
      img: heroImg ? {
        zIndex: imgComputed.zIndex,
        position: imgComputed.position
      } : 'not found',
      topComponents: componentInfo.slice(0, 5)
    };
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
