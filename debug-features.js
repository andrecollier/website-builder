const { chromium } = require('playwright');

async function debugFeatures() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 }
  });

  const genPage = await context.newPage();
  await genPage.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
  await genPage.waitForTimeout(2000);

  // Check for Features section content
  const featuresContent = await genPage.evaluate(() => {
    const body = document.body.innerHTML;
    return {
      hasProductOverview: body.includes('Product Overview'),
      hasExplorePower: body.includes('Explore the Power'),
      hasAdaptiveLearning: body.includes('Adaptive Learning'),
      hasSmartAutomation: body.includes('Smart Automation'),
      hasDataMapping: body.includes('Data Mapping'),
      hasRealTimeAnalytics: body.includes('Real-time Analytics'),
    };
  });
  
  console.log('Features content check:', JSON.stringify(featuresContent, null, 2));

  await browser.close();
}

debugFeatures().catch(console.error);
