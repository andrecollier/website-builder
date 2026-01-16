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

  // Load section metadata
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

    // Get full page height
    const pageHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
    });

    // Capture each section based on reference metadata
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionNumber = String(i + 1).padStart(2, '0');
      const filename = `${sectionNumber}-${section.type}.png`;
      const outputPath = path.join(outputDir, filename);

      try {
        // Scroll to section position
        await page.evaluate((y) => window.scrollTo(0, y), section.boundingBox.y);
        await page.waitForTimeout(500);

        // Wait for any lazy-loaded content
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

        // Calculate clip area relative to viewport
        const scrollY = await page.evaluate(() => window.scrollY);
        const clipY = section.boundingBox.y - scrollY;

        // Capture screenshot of section
        await page.screenshot({
          path: outputPath,
          clip: {
            x: section.boundingBox.x,
            y: Math.max(0, clipY),
            width: section.boundingBox.width,
            height: Math.min(section.boundingBox.height, viewportHeight),
          },
          type: 'png',
        });

        capturedPaths.push(outputPath);
        console.log(`Captured: ${filename}`);
      } catch (error) {
        console.error(`Error capturing section ${i + 1}:`, error);
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
 * 1. Capture screenshots of generated site
 * 2. Compare with reference screenshots
 * 3. Generate diff images and report
 *
 * @param options - Comparison options
 * @returns Comparison report
 */
export async function runComparison(options: {
  websiteId: string;
  websitesDir: string;
  generatedSiteUrl?: string;
}): Promise<ComparisonReport> {
  const {
    websiteId,
    websitesDir,
    generatedSiteUrl = 'http://localhost:3001',
  } = options;

  console.log(`Starting comparison for website: ${websiteId}`);

  // Step 1: Capture screenshots of generated site
  console.log('Capturing generated screenshots...');
  try {
    await captureGeneratedScreenshots({
      websiteId,
      websitesDir,
      generatedSiteUrl,
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
