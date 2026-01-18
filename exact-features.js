const { chromium } = require('playwright');

async function exactFeatures() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 }
  });

  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Scroll to exact Features start
  await genPage.evaluate(() => window.scrollTo(0, 1229));
  await genPage.waitForTimeout(300);
  await genPage.screenshot({ path: 'screenshots/features-exact.png' });
  
  // Also check what elements exist in Features section
  const elements = await genPage.evaluate(() => {
    const section = document.querySelector('[data-component-type="features"]');
    if (!section) return 'No features section found';
    
    const h2s = section.querySelectorAll('h2');
    const h3s = section.querySelectorAll('h3');
    const h4s = section.querySelectorAll('h4');
    
    return {
      h2Texts: Array.from(h2s).map(el => el.textContent.substring(0, 50)),
      h3Texts: Array.from(h3s).map(el => el.textContent.substring(0, 50)),
      h4Texts: Array.from(h4s).map(el => el.textContent.substring(0, 50))
    };
  });
  
  console.log('Features elements:', JSON.stringify(elements, null, 2));

  await browser.close();
}

exactFeatures().catch(console.error);
