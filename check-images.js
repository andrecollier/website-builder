const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3002', { waitUntil: 'networkidle', timeout: 15000 });

  const result = await page.evaluate(() => {
    const images = document.querySelectorAll('img');
    const imageInfo = [];
    for (let i = 0; i < Math.min(images.length, 5); i++) {
      const img = images[i];
      const rect = img.getBoundingClientRect();
      imageInfo.push({
        index: i,
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        src: img.src.substring(0, 60)
      });
    }
    return imageInfo;
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
