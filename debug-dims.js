const { chromium } = require('playwright');

async function debugDims() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 }
  });

  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Get dimensions of all key elements in Features section
  const dims = await genPage.evaluate(() => {
    const featuresSection = document.querySelector('[data-component-type="features"]');
    if (!featuresSection) return 'No features section';
    
    const section = featuresSection.querySelector('section');
    const grids = section.querySelectorAll(':scope > div');
    
    return {
      features: featuresSection.getBoundingClientRect(),
      section: section ? section.getBoundingClientRect() : null,
      childDivs: Array.from(grids).map((div, i) => ({
        index: i,
        height: div.getBoundingClientRect().height,
        top: div.getBoundingClientRect().top + window.scrollY,
        textContent: div.innerText.substring(0, 50)
      }))
    };
  });
  
  console.log('Dimensions:', JSON.stringify(dims, null, 2));

  await browser.close();
}

debugDims().catch(console.error);
