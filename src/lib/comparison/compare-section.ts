/**
 * Compare Section Module
 *
 * Handles capturing screenshots of generated components
 * and initiating comparisons with reference screenshots.
 */

import { chromium, Browser, Page } from 'playwright';
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
    const componentHandles = await page.$$('main > *');

    if (componentHandles.length === 0) {
      // Fallback: try body > * if no main element
      const bodyHandles = await page.$$('body > main, body > section, body > header, body > footer, body > div');
      if (bodyHandles.length > 0) {
        componentHandles.push(...bodyHandles);
      }
    }

    // Capture each component found in the DOM
    for (let i = 0; i < componentHandles.length; i++) {
      const handle = componentHandles[i];
      const boundingBox = await handle.boundingBox();

      // Skip elements with no size
      if (!boundingBox || boundingBox.height < 10) {
        continue;
      }

      // Match with reference section based on index
      const sectionIndex = capturedPaths.length;
      if (sectionIndex >= sections.length) {
        break;
      }

      const section = sections[sectionIndex];
      const sectionNumber = String(sectionIndex + 1).padStart(2, '0');
      const filename = `${sectionNumber}-${section.type}.png`;
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
