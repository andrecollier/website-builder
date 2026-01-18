const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3002', { waitUntil: 'networkidle', timeout: 15000 });

  const result = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    if (!h1) return 'h1 not found';
    const computed = window.getComputedStyle(h1);
    return {
      fontSizeVar: computed.getPropertyValue('--font-size'),
      framerFontSize: computed.getPropertyValue('--framer-font-size'),
      computedFontSize: computed.fontSize
    };
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
