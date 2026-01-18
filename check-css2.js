const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3002', { waitUntil: 'networkidle', timeout: 15000 });

  // Check if preset class matches h1
  const result = await page.evaluate(() => {
    const h1 = document.querySelector('h1.framer-styles-preset-k2pg7h');
    if (!h1) return { found: false };

    // Check all stylesheets for rules matching this element
    const matchingRules = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText && rule.selectorText.includes('framer-styles-preset-k2pg7h')) {
            // Check if this rule matches our h1
            const matches = h1.matches(rule.selectorText.split(',')[0].trim());
            matchingRules.push({
              selector: rule.selectorText.substring(0, 100),
              matches: matches
            });
          }
        }
      } catch (e) {
        // CORS error for external stylesheets
      }
    }

    return {
      found: true,
      h1Classes: h1.className,
      matchingRules: matchingRules.slice(0, 5)
    };
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
