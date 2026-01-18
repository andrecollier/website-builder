const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3002', { waitUntil: 'networkidle', timeout: 15000 });

  const result = await page.evaluate(() => {
    const main = document.querySelector('#main');
    if (!main) return 'main not found';

    const children = [];
    for (let i = 0; i < main.children.length; i++) {
      const child = main.children[i];
      const rect = child.getBoundingClientRect();
      children.push({
        index: i,
        tagName: child.tagName,
        firstClass: child.className.split(' ')[0],
        top: rect.top,
        height: rect.height
      });
    }
    return children;
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
