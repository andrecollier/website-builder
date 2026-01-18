const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3002', { waitUntil: 'networkidle', timeout: 15000 });

  const result = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    if (!h1) return 'h1 not found';
    const rect = h1.getBoundingClientRect();
    const computed = window.getComputedStyle(h1);
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      fontSize: computed.fontSize,
      color: computed.color,
      text: h1.textContent.substring(0, 50)
    };
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
