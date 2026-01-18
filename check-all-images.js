const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3002', { waitUntil: 'networkidle', timeout: 15000 });

  const result = await page.evaluate(() => {
    const images = document.querySelectorAll('img');
    const imageInfo = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const rect = img.getBoundingClientRect();
      // Only include images that are visible in viewport
      if (rect.width > 100 && rect.height > 100 && rect.top < 1000) {
        imageInfo.push({
          index: i,
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          src: img.src.substring(0, 60)
        });
      }
    }
    return imageInfo;
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
