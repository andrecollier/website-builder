const { chromium } = require('playwright');

async function findRefFaq() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const refPage = await context.newPage();
  await refPage.goto('https://fluence.framer.website/', { waitUntil: 'networkidle' });
  await refPage.waitForTimeout(2000);

  // Find FAQ section
  const faqPosition = await refPage.evaluate(() => {
    const faqText = Array.from(document.querySelectorAll('*')).find(el => 
      el.textContent && el.textContent.includes('Frequently Asked') && 
      el.tagName.match(/^H[1-6]$/)
    );
    if (faqText) {
      return faqText.getBoundingClientRect().top + window.scrollY;
    }
    return null;
  });
  
  console.log('FAQ position:', faqPosition);
  
  if (faqPosition) {
    await refPage.evaluate((y) => window.scrollTo(0, y - 100), faqPosition);
    await refPage.waitForTimeout(500);
    await refPage.screenshot({ path: 'screenshots/ref-faq-found.png' });
  }

  await browser.close();
}

findRefFaq().catch(console.error);
