/**
 * Compare Section Module
 *
 * Handles capturing screenshots of generated components
 * and initiating comparisons with reference screenshots.
 */

import { chromium, Browser, Page, ElementHandle } from 'playwright';
import fs from 'fs';
import path from 'path';
import { compareAllSections, ComparisonReport } from './visual-diff';
import { startGeneratedSite, checkGeneratedSiteStatus } from './server-manager';

// ====================
// INTERFACES
// ====================

interface SectionMetadata {
  id: string;
  type: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface CaptureOptions {
  websiteId: string;
  websitesDir: string;
  generatedSiteUrl: string;
  viewportWidth?: number;
  viewportHeight?: number;
}

interface DetectedComponent {
  handle: ElementHandle;
  type: string;
  confidence: number;
}

// ====================
// COMPONENT TYPE DETECTION
// ====================

/**
 * Detect the type of a component from its DOM structure
 * First checks for data-component-type attribute (from scaffold),
 * then falls back to heuristic detection.
 * Returns the detected type (header, hero, features, etc.) and confidence
 */
async function detectComponentType(
  handle: ElementHandle,
  page: Page,
  index: number,
  totalComponents: number
): Promise<{ type: string; confidence: number }> {
  // First, check for explicit data-component-type attribute (set by scaffold)
  const explicitType = await handle.evaluate((el) => {
    return el.getAttribute('data-component-type');
  });

  if (explicitType) {
    return { type: explicitType.toLowerCase(), confidence: 1.0 };
  }

  const info = await handle.evaluate((el, { idx, total }) => {
    const tagName = el.tagName.toLowerCase();
    const className = el.className || '';
    const id = el.id || '';
    const innerHTML = el.innerHTML || '';
    const textContent = el.textContent || '';
    const dataFramerName = el.getAttribute('data-framer-name') || '';

    // Get first few class names for analysis
    const classes = className.split(/\s+/).slice(0, 10).join(' ');

    // Check for specific patterns
    const hasNav = el.querySelector('nav') !== null;
    const hasLogo = innerHTML.includes('logo') || innerHTML.includes('Logo');
    const hasMenuItems = el.querySelectorAll('a').length > 3;
    const hasPricingCards = el.querySelectorAll('[class*="price"], [class*="pricing"], [class*="plan"]').length > 0
      || (innerHTML.match(/\$\d+/g) || []).length > 1
      || (innerHTML.match(/\/mo|\/month|\/year/gi) || []).length > 0;
    const hasTestimonialPattern = innerHTML.includes('testimonial')
      || el.querySelectorAll('blockquote, [class*="quote"], [class*="review"]').length > 0
      || (el.querySelectorAll('img').length > 2 && textContent.length > 200);
    const hasTeamPattern = innerHTML.includes('team') || innerHTML.includes('Team')
      || (el.querySelectorAll('img').length > 3 && el.querySelectorAll('h3, h4').length > 2);
    const hasHeroPattern = el.querySelector('h1') !== null
      || (idx <= 2 && el.querySelector('h2') !== null && textContent.length < 500);
    const hasFooterPattern = tagName === 'footer'
      || innerHTML.includes('©')
      || innerHTML.includes('copyright')
      || innerHTML.includes('Privacy')
      || innerHTML.includes('Terms');
    const hasCTAPattern = (el.querySelectorAll('button, a[class*="btn"], a[class*="button"]').length > 0)
      && textContent.length < 300
      && !hasNav;
    const hasFeaturePattern = el.querySelectorAll('[class*="feature"], [class*="card"], [class*="grid"] > div').length > 2
      || (el.querySelectorAll('svg, img').length > 2 && el.querySelectorAll('h3, h4').length > 2);

    return {
      tagName,
      classes,
      id,
      dataFramerName,
      hasNav,
      hasLogo,
      hasMenuItems,
      hasPricingCards,
      hasTestimonialPattern,
      hasTeamPattern,
      hasHeroPattern,
      hasFooterPattern,
      hasCTAPattern,
      hasFeaturePattern,
      textLength: textContent.length,
      imgCount: el.querySelectorAll('img').length,
      isFirst: idx === 0,
      isLast: idx === total - 1,
    };
  }, { idx: index, total: totalComponents });

  // Determine type based on patterns with confidence scores
  let type = 'section';
  let confidence = 0.5;

  // Header detection (usually first, has nav)
  if (info.tagName === 'header' || (info.isFirst && info.hasNav) || (info.hasLogo && info.hasMenuItems && info.textLength < 500)) {
    type = 'header';
    confidence = info.tagName === 'header' ? 0.95 : (info.hasNav ? 0.9 : 0.8);
  }
  // Footer detection (usually last, has copyright)
  else if (info.tagName === 'footer' || info.hasFooterPattern || (info.isLast && info.textLength > 100)) {
    type = 'footer';
    confidence = info.tagName === 'footer' ? 0.95 : (info.hasFooterPattern ? 0.9 : 0.7);
  }
  // Pricing detection
  else if (info.hasPricingCards) {
    type = 'pricing';
    confidence = 0.9;
  }
  // Testimonials detection
  else if (info.hasTestimonialPattern) {
    type = 'testimonials';
    confidence = 0.85;
  }
  // Team detection
  else if (info.hasTeamPattern) {
    type = 'team';
    confidence = 0.8;
  }
  // Hero detection (early in page, has h1 or prominent heading)
  else if (info.hasHeroPattern && index <= 2) {
    type = 'hero';
    confidence = info.isFirst ? 0.7 : 0.85; // First element might be header
  }
  // CTA detection
  else if (info.hasCTAPattern && index > 2) {
    type = 'cta';
    confidence = 0.75;
  }
  // Features detection
  else if (info.hasFeaturePattern) {
    type = 'features';
    confidence = 0.8;
  }

  // Check class names for explicit type hints
  const classLower = info.classes.toLowerCase();
  const typeHints = ['header', 'hero', 'features', 'testimonials', 'pricing', 'team', 'cta', 'footer', 'about', 'services'];
  for (const hint of typeHints) {
    if (classLower.includes(hint) || info.id.toLowerCase().includes(hint)) {
      type = hint === 'about' || hint === 'services' ? 'features' : hint;
      confidence = 0.95;
      break;
    }
  }

  // Check data-framer-name for explicit naming
  if (info.dataFramerName) {
    const framerNameLower = info.dataFramerName.toLowerCase();
    for (const hint of typeHints) {
      if (framerNameLower.includes(hint)) {
        type = hint === 'about' || hint === 'services' ? 'features' : hint;
        confidence = 0.98;
        break;
      }
    }
  }

  return { type, confidence };
}

// ====================
// SCREENSHOT CAPTURE
// ====================

/**
 * Capture screenshots of the generated website sections
 *
 * Uses DOM-based element capture instead of metadata bounding boxes.
 * This approach finds actual components in the generated page and captures
 * them based on their real positions, avoiding issues where the generated
 * page has different dimensions than the original.
 *
 * @param options - Capture configuration
 * @returns Array of captured screenshot paths
 */
export async function captureGeneratedScreenshots(
  options: CaptureOptions
): Promise<string[]> {
  const {
    websiteId,
    websitesDir,
    generatedSiteUrl,
    viewportWidth = 1440,
    viewportHeight = 900,
  } = options;

  const websiteDir = path.join(websitesDir, websiteId);
  const metadataPath = path.join(websiteDir, 'reference', 'metadata.json');
  const outputDir = path.join(websiteDir, 'generated', 'screenshots');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Load section metadata (for type names only, not bounding boxes)
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Metadata file not found: ${metadataPath}`);
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  const sections: SectionMetadata[] = metadata.sections || [];

  if (sections.length === 0) {
    throw new Error('No sections found in metadata');
  }

  let browser: Browser | null = null;
  const capturedPaths: string[] = [];

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      viewport: { width: viewportWidth, height: viewportHeight },
    });

    const page = await context.newPage();

    // Navigate to generated site
    await page.goto(generatedSiteUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for page to fully render
    await page.waitForTimeout(2000);

    // DOM-based capture: Find all direct children of main element
    // This captures actual components as they exist in the generated page
    // Try both <main> element and #main (div with id="main" for Framer sites)
    let componentHandles = await page.$$('main > *');

    if (componentHandles.length === 0) {
      // Try #main > * for Framer-generated sites
      componentHandles = await page.$$('#main > *');
    }

    if (componentHandles.length === 0) {
      // Fallback: try body > * if no main element
      const bodyHandles = await page.$$('body > main, body > section, body > header, body > footer, body > div');
      if (bodyHandles.length > 0) {
        componentHandles.push(...bodyHandles);
      }
    }

    // First pass: detect all component types
    const detectedComponents: DetectedComponent[] = [];
    const totalComponents = componentHandles.length;

    for (let i = 0; i < componentHandles.length; i++) {
      const handle = componentHandles[i];
      const boundingBox = await handle.boundingBox();

      // Skip elements with no size
      if (!boundingBox || boundingBox.height < 10) {
        continue;
      }

      const { type, confidence } = await detectComponentType(handle, page, i, totalComponents);
      detectedComponents.push({ handle, type, confidence });
    }

    console.log(`Detected ${detectedComponents.length} components:`,
      detectedComponents.map((c, i) => `${i + 1}:${c.type}(${Math.round(c.confidence * 100)}%)`).join(', '));

    // Track how many of each type we've seen for numbering (e.g., hero, hero2)
    const typeCounter: Record<string, number> = {};

    // Second pass: capture screenshots with detected types
    for (let i = 0; i < detectedComponents.length; i++) {
      const { handle, type } = detectedComponents[i];

      // Increment counter for this type
      typeCounter[type] = (typeCounter[type] || 0) + 1;
      const typeIndex = typeCounter[type];

      // Generate filename: 01-header.png, 02-hero.png, 03-hero2.png, etc.
      const sectionNumber = String(i + 1).padStart(2, '0');
      const typeSuffix = typeIndex > 1 ? String(typeIndex) : '';
      const filename = `${sectionNumber}-${type}${typeSuffix}.png`;
      const outputPath = path.join(outputDir, filename);

      try {
        // Scroll component into view
        await handle.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);

        // Wait for any lazy-loaded images in this component
        await page.evaluate(async () => {
          const images = Array.from(document.querySelectorAll('img'));
          await Promise.all(
            images
              .filter(img => {
                const rect = img.getBoundingClientRect();
                return rect.top < window.innerHeight && rect.bottom > 0;
              })
              .map(img =>
                img.complete
                  ? Promise.resolve()
                  : new Promise(resolve => {
                      img.onload = resolve;
                      img.onerror = resolve;
                      setTimeout(resolve, 2000);
                    })
              )
          );
        });

        // Take screenshot of this component directly using element handle
        await handle.screenshot({
          path: outputPath,
          type: 'png',
        });

        capturedPaths.push(outputPath);
        console.log(`Captured: ${filename}`);
      } catch (error) {
        console.error(`Error capturing component ${i + 1}:`, error);
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return capturedPaths;
}

/**
 * Run full comparison workflow:
 * 1. Auto-start generated site if not running
 * 2. Capture screenshots of generated site
 * 3. Compare with reference screenshots
 * 4. Generate diff images and report
 *
 * @param options - Comparison options
 * @returns Comparison report
 */
export async function runComparison(options: {
  websiteId: string;
  websitesDir: string;
  generatedSiteUrl?: string;
  autoStartServer?: boolean;
}): Promise<ComparisonReport> {
  const {
    websiteId,
    websitesDir,
    generatedSiteUrl,
    autoStartServer = true,
  } = options;

  const port = 3002;
  let siteUrl = generatedSiteUrl || `http://localhost:${port}`;

  console.log(`Starting comparison for website: ${websiteId}`);

  // Step 0: Auto-start the generated site if needed
  if (autoStartServer && !generatedSiteUrl) {
    console.log('Checking if generated site is running...');
    const status = await checkGeneratedSiteStatus(port);

    if (!status.running) {
      console.log('Generated site not running. Starting it...');
      const startResult = await startGeneratedSite({
        websiteId,
        websitesDir,
        port,
      });

      if (!startResult.success) {
        throw new Error(`Failed to start generated site: ${startResult.error}`);
      }

      siteUrl = startResult.url || siteUrl;
      console.log(`Generated site started at ${siteUrl}`);
    } else {
      console.log(`Generated site already running at ${status.url}`);
      siteUrl = status.url || siteUrl;
    }
  }

  // Step 1: Capture screenshots of generated site
  console.log('Capturing generated screenshots...');
  try {
    await captureGeneratedScreenshots({
      websiteId,
      websitesDir,
      generatedSiteUrl: siteUrl,
    });
  } catch (error) {
    console.error('Error capturing screenshots:', error);
    // Continue with comparison even if capture fails
    // (might have existing screenshots)
  }

  // Step 2: Compare all sections
  console.log('Comparing sections...');
  const report = await compareAllSections(websiteId, websitesDir);

  console.log(`Comparison complete. Overall accuracy: ${report.overallAccuracy}%`);
  console.log(`Sections above 90%: ${report.summary.sectionsAbove90}`);
  console.log(`Sections 80-90%: ${report.summary.sectionsAbove80}`);
  console.log(`Sections below 80%: ${report.summary.sectionsBelow80}`);

  return report;
}

/**
 * Get existing comparison report if available
 */
export function getExistingReport(
  websiteId: string,
  websitesDir: string
): ComparisonReport | null {
  const reportPath = path.join(websitesDir, websiteId, 'comparison', 'report.json');

  if (fs.existsSync(reportPath)) {
    try {
      return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    } catch {
      return null;
    }
  }

  return null;
}
