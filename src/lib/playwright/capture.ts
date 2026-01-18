/**
 * Website Capture Module
 *
 * This module provides the main screenshot capture orchestration for websites.
 * It handles browser lifecycle, error recovery (3 retries), and coordinates
 * with scroll-loader, section-detector, and cache modules.
 */

import { chromium, type Browser, type Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import type { CaptureProgress, CaptureResult, SectionInfo, CapturePhase } from '@/types';
import { CAPTURE_CONFIG } from '@/types';
import {
  autoScroll,
  waitForImages,
  waitForFonts,
  waitForAnimations,
  dismissCookieConsent,
} from './scroll-loader';
import { detectAllSections, getPageDimensions } from './section-detector';
import { getCached, setCache, copyCacheToWebsite } from '@/lib/cache';
import type { RawPageData } from '@/lib/design-system/synthesizer';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Options for the capture process
 */
export interface CaptureOptions {
  /** Website ID for output directory naming */
  websiteId: string;
  /** URL to capture */
  url: string;
  /** Viewport width (default: from CAPTURE_CONFIG) */
  viewportWidth?: number;
  /** Viewport height (default: from CAPTURE_CONFIG) */
  viewportHeight?: number;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Page load timeout in ms (default: 30000) */
  pageTimeout?: number;
  /** Callback for progress updates */
  onProgress?: (progress: CaptureProgress) => void;
  /** Skip cache lookup (default: false) */
  skipCache?: boolean;
  /** Headless mode (default: true) */
  headless?: boolean;
}

/**
 * Result of a retry operation
 */
interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: string;
  attempts: number;
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Get the base directory for website screenshots
 */
function getWebsitesBaseDir(): string {
  const envPath = process.env.WEBSITES_DIR;
  if (envPath) {
    if (envPath.startsWith('./') || envPath.startsWith('../')) {
      return path.resolve(process.cwd(), envPath);
    }
    return envPath;
  }
  return path.resolve(process.cwd(), 'Websites');
}

/**
 * Ensure directory exists before writing
 */
function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Get the reference directory path for a website
 */
function getReferenceDir(websiteId: string): string {
  return path.join(getWebsitesBaseDir(), websiteId, 'reference');
}

/**
 * Get the sections directory path for a website
 */
function getSectionsDir(websiteId: string): string {
  return path.join(getReferenceDir(websiteId), 'sections');
}

/**
 * Create progress update helper
 */
function createProgressEmitter(onProgress?: (progress: CaptureProgress) => void) {
  return (phase: CapturePhase, percent: number, message: string, sectionInfo?: { current: number; total: number }) => {
    if (onProgress) {
      onProgress({
        phase,
        percent,
        message,
        currentSection: sectionInfo?.current,
        totalSections: sectionInfo?.total,
      });
    }
  };
}

/**
 * Execute a function with retry logic
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  operation: string
): Promise<RetryResult<T>> {
  let lastError: string | undefined;
  let attempts = 0;

  for (let i = 0; i < maxRetries; i++) {
    attempts++;
    try {
      const result = await fn();
      return { success: true, result, attempts };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  return { success: false, error: `${operation} failed after ${maxRetries} attempts: ${lastError}`, attempts };
}

// ====================
// BROWSER MANAGEMENT
// ====================

/**
 * Launch a new browser instance with timeout
 */
async function launchBrowser(headless: boolean = true): Promise<Browser> {
  const BROWSER_LAUNCH_TIMEOUT = 30000; // 30 seconds

  const launchPromise = chromium.launch({
    headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(
        `Browser launch timed out after ${BROWSER_LAUNCH_TIMEOUT / 1000} seconds. ` +
        'This may indicate a system resource issue or Playwright installation problem.'
      ));
    }, BROWSER_LAUNCH_TIMEOUT);
  });

  try {
    return await Promise.race([launchPromise, timeoutPromise]);
  } catch (error) {
    // Ensure clear error message
    if (error instanceof Error) {
      throw new Error(`Failed to launch browser: ${error.message}`);
    }
    throw new Error('Failed to launch browser: Unknown error');
  }
}

/**
 * Create a new page with the specified viewport
 */
async function createPage(
  browser: Browser,
  viewportWidth: number,
  viewportHeight: number
): Promise<Page> {
  const page = await browser.newPage();
  // CRITICAL: Set viewport BEFORE navigation
  await page.setViewportSize({
    width: viewportWidth,
    height: viewportHeight,
  });
  return page;
}

// ====================
// CAPTURE FUNCTIONS
// ====================

/**
 * Navigate to a URL and wait for content to load
 * Enhanced for Framer and animation-heavy sites
 */
async function navigateAndLoad(
  page: Page,
  url: string,
  timeout: number,
  emitProgress: ReturnType<typeof createProgressEmitter>
): Promise<void> {
  emitProgress('initializing', 10, 'Loading page...');

  // Use load event for more complete page rendering
  await page.goto(url, {
    waitUntil: 'load',
    timeout,
  });

  // Wait for initial page render and JavaScript execution
  await page.waitForTimeout(1000);

  // Try to dismiss cookie consent banners
  await dismissCookieConsent(page);

  emitProgress('scrolling', 20, 'Scrolling to trigger lazy-loaded content...');
  await autoScroll(page);

  emitProgress('waiting_images', 40, 'Waiting for images to load...');
  await waitForImages(page);

  emitProgress('waiting_fonts', 50, 'Waiting for fonts to load...');
  await waitForFonts(page);

  emitProgress('waiting_fonts', 55, 'Waiting for animations to settle...');
  await waitForAnimations(page);

  // Wait for critical hero content to be visible (H1, main headers)
  emitProgress('waiting_fonts', 58, 'Waiting for hero content...');
  await waitForHeroContent(page);
}

/**
 * Wait for hero content (H1, main headers) to be visible
 * Critical for Framer sites with entrance animations
 */
async function waitForHeroContent(page: Page, maxWait: number = 5000): Promise<void> {
  try {
    // Wait for H1 to be visible (most hero sections have one)
    await page.waitForSelector('h1', {
      state: 'visible',
      timeout: maxWait
    });
  } catch {
    // H1 might not exist, try other hero indicators
    try {
      // Try common hero section patterns
      await page.waitForSelector('[class*="hero"] h1, [class*="Hero"] h1, section:first-of-type h1, header + section h1', {
        state: 'visible',
        timeout: 2000,
      });
    } catch {
      // No hero content found, continue anyway
    }
  }

  // Final wait for any straggler animations
  await page.waitForTimeout(500);
}

/**
 * Capture full page screenshot
 */
async function captureFullPage(
  page: Page,
  outputPath: string,
  emitProgress: ReturnType<typeof createProgressEmitter>
): Promise<void> {
  emitProgress('capturing', 60, 'Capturing full page screenshot...');

  ensureDirectory(path.dirname(outputPath));

  await page.screenshot({
    path: outputPath,
    fullPage: true,
    type: 'png',
  });
}

/**
 * Capture individual sections
 */
async function captureSections(
  page: Page,
  sections: SectionInfo[],
  sectionsDir: string,
  emitProgress: ReturnType<typeof createProgressEmitter>
): Promise<SectionInfo[]> {
  ensureDirectory(sectionsDir);

  const capturedSections: SectionInfo[] = [];
  const totalSections = sections.length;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sectionNumber = String(i + 1).padStart(2, '0');
    const sectionFileName = `${sectionNumber}-${section.type}.png`;
    const sectionPath = path.join(sectionsDir, sectionFileName);

    emitProgress(
      'sections',
      70 + (i / totalSections) * 25,
      `Capturing section ${i + 1}/${totalSections}: ${section.type}`,
      { current: i + 1, total: totalSections }
    );

    try {
      // Scroll to section first (clip only works within viewport)
      // Scroll past the section then back to trigger intersection observers
      await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 200)), section.boundingBox.y);
      await page.waitForTimeout(300);
      await page.evaluate((y) => window.scrollTo(0, y + 500), section.boundingBox.y);
      await page.waitForTimeout(300);
      await page.evaluate((y) => window.scrollTo(0, y), section.boundingBox.y);
      await page.waitForTimeout(500); // Wait for lazy-loaded content to appear

      // Wait for images in viewport to load
      await page.evaluate(async () => {
        const images = Array.from(document.querySelectorAll('img'));
        await Promise.all(
          images
            .filter(img => {
              const rect = img.getBoundingClientRect();
              return rect.top < window.innerHeight && rect.bottom > 0;
            })
            .map(img => img.complete ? Promise.resolve() :
              new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
                setTimeout(resolve, 2000); // Max 2s per image
              })
            )
        );
      });

      // Calculate clip relative to current viewport
      const clipY = section.boundingBox.y - await page.evaluate(() => window.scrollY);

      await page.screenshot({
        path: sectionPath,
        clip: {
          x: section.boundingBox.x,
          y: Math.max(0, clipY),
          width: section.boundingBox.width,
          height: Math.min(section.boundingBox.height, 900), // Limit to viewport height
        },
        type: 'png',
      });

      capturedSections.push({
        ...section,
        screenshotPath: sectionPath,
      });
    } catch {
      // Continue capturing other sections if one fails
      capturedSections.push({
        ...section,
        screenshotPath: '',
      });
    }
  }

  return capturedSections;
}

/**
 * Save capture metadata
 */
function saveMetadata(
  referenceDir: string,
  url: string,
  viewportWidth: number,
  viewportHeight: number,
  fullPageHeight: number,
  sections: SectionInfo[]
): void {
  const metadata = {
    url,
    capturedAt: new Date().toISOString(),
    viewportWidth,
    viewportHeight,
    fullPageHeight,
    sectionCount: sections.length,
    sections: sections.map((s) => ({
      id: s.id,
      type: s.type,
      boundingBox: s.boundingBox,
    })),
  };

  const metadataPath = path.join(referenceDir, 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
}

// ====================
// DESIGN EXTRACTION
// ====================

/**
 * Extract raw page data for design system generation
 * Uses page.evaluate() to extract computed styles from DOM elements
 *
 * @param page - Playwright Page instance
 * @param url - Source URL for the page data
 * @returns Promise with RawPageData containing colors, typography, spacing, and effects
 *
 * @example
 * ```typescript
 * const rawData = await extractRawPageData(page, 'https://example.com');
 * // rawData contains all extracted CSS computed styles
 * ```
 */
export async function extractRawPageData(page: Page, url: string): Promise<RawPageData> {
  const rawData = await page.evaluate(() => {
    // Arrays to collect data
    const colors: string[] = [];
    const backgrounds: string[] = [];
    const borders: string[] = [];
    const fontFamilies: string[] = [];
    const fontSizes: string[] = [];
    const fontWeights: string[] = [];
    const lineHeights: string[] = [];
    const elementTypes: string[] = [];
    const paddings: string[] = [];
    const margins: string[] = [];
    const gaps: string[] = [];
    const maxWidths: string[] = [];
    const spacingElementTypes: string[] = [];
    const boxShadows: string[] = [];
    const borderRadii: string[] = [];
    const transitions: string[] = [];

    // Helper to check if a color is valid (not transparent or inherit)
    const isValidColor = (color: string): boolean => {
      if (!color) return false;
      const lower = color.toLowerCase();
      if (lower === 'transparent' || lower === 'inherit' || lower === 'initial') return false;
      if (lower === 'rgba(0, 0, 0, 0)') return false;
      return true;
    };

    // Query all visible elements
    const elements = Array.from(document.querySelectorAll('*'));

    for (const element of elements) {
      // Skip script, style, and hidden elements
      const tagName = element.tagName.toLowerCase();
      if (tagName === 'script' || tagName === 'style' || tagName === 'noscript') {
        continue;
      }

      // Get computed styles
      const styles = window.getComputedStyle(element);

      // Skip invisible elements
      if (styles.display === 'none' || styles.visibility === 'hidden') {
        continue;
      }

      // Extract colors
      const color = styles.color;
      if (isValidColor(color)) {
        colors.push(color);
      }

      const backgroundColor = styles.backgroundColor;
      if (isValidColor(backgroundColor)) {
        backgrounds.push(backgroundColor);
      }

      const borderColor = styles.borderColor;
      if (isValidColor(borderColor)) {
        borders.push(borderColor);
      }

      // Extract typography
      const fontFamily = styles.fontFamily;
      if (fontFamily) {
        fontFamilies.push(fontFamily);
        elementTypes.push(tagName);
      }

      const fontSize = styles.fontSize;
      if (fontSize) {
        fontSizes.push(fontSize);
      }

      const fontWeight = styles.fontWeight;
      if (fontWeight) {
        fontWeights.push(fontWeight);
      }

      const lineHeight = styles.lineHeight;
      if (lineHeight) {
        lineHeights.push(lineHeight);
      }

      // Extract spacing
      const padding = styles.padding;
      if (padding && padding !== '0px') {
        paddings.push(padding);
        spacingElementTypes.push(tagName);
      }

      const margin = styles.margin;
      if (margin && margin !== '0px') {
        margins.push(margin);
      }

      const gap = styles.gap;
      if (gap && gap !== 'normal' && gap !== '0px') {
        gaps.push(gap);
      }

      const maxWidth = styles.maxWidth;
      if (maxWidth && maxWidth !== 'none') {
        maxWidths.push(maxWidth);
      }

      // Extract effects
      const boxShadow = styles.boxShadow;
      if (boxShadow && boxShadow !== 'none') {
        boxShadows.push(boxShadow);
      }

      const borderRadius = styles.borderRadius;
      if (borderRadius && borderRadius !== '0px') {
        borderRadii.push(borderRadius);
      }

      const transition = styles.transition;
      if (transition && transition !== 'none' && transition !== 'all 0s ease 0s') {
        transitions.push(transition);
      }
    }

    return {
      colors: {
        colors,
        backgrounds,
        borders,
      },
      typography: {
        fontFamilies,
        fontSizes,
        fontWeights,
        lineHeights,
        elementTypes,
      },
      spacing: {
        paddings,
        margins,
        gaps,
        maxWidths,
        elementTypes: spacingElementTypes,
      },
      effects: {
        boxShadows,
        borderRadii,
        transitions,
      },
    };
  });

  return {
    url,
    colors: rawData.colors,
    typography: rawData.typography,
    spacing: rawData.spacing,
    effects: rawData.effects,
  };
}

// ====================
// MAIN CAPTURE FUNCTION
// ====================

/**
 * Capture a website with full-page and per-section screenshots
 * Handles browser lifecycle, error recovery (3 retries), and caching
 *
 * @param options - Capture configuration options
 * @returns Promise with CaptureResult
 *
 * @example
 * ```typescript
 * const result = await captureWebsite({
 *   websiteId: 'website-123',
 *   url: 'https://example.com',
 *   onProgress: (progress) => console.log(progress.message),
 * });
 * ```
 */
export async function captureWebsite(options: CaptureOptions): Promise<CaptureResult> {
  const {
    websiteId,
    url,
    viewportWidth = CAPTURE_CONFIG.viewport.width,
    viewportHeight = CAPTURE_CONFIG.viewport.height,
    maxRetries = CAPTURE_CONFIG.maxRetries,
    pageTimeout = CAPTURE_CONFIG.pageTimeout,
    onProgress,
    skipCache = false,
    headless = true,
  } = options;

  const emitProgress = createProgressEmitter(onProgress);
  const referenceDir = getReferenceDir(websiteId);
  const sectionsDir = getSectionsDir(websiteId);
  const fullPagePath = path.join(referenceDir, 'full-page.png');

  // Check cache first (unless skipped)
  if (!skipCache) {
    emitProgress('initializing', 5, 'Checking cache...');
    const websiteDir = path.join(getWebsitesBaseDir(), websiteId);
    const cachedResult = copyCacheToWebsite(url, websiteDir);

    if (cachedResult) {
      emitProgress('complete', 100, 'Using cached screenshots');

      // Get page dimensions from cached metadata if available
      const metadataPath = path.join(referenceDir, 'metadata.json');
      let fullPageHeight = 0;
      if (fs.existsSync(metadataPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          fullPageHeight = metadata.fullPageHeight || 0;
        } catch {
          // Ignore metadata read errors
        }
      }

      return {
        success: true,
        websiteId,
        fullPagePath: cachedResult.fullPagePath,
        sections: cachedResult.sections,
        metadata: {
          url,
          capturedAt: new Date().toISOString(),
          viewportWidth,
          viewportHeight,
          fullPageHeight,
        },
      };
    }
  }

  // Ensure output directories exist
  ensureDirectory(referenceDir);
  ensureDirectory(sectionsDir);

  let browser: Browser | null = null;

  try {
    // Launch browser with retry
    emitProgress('initializing', 5, 'Launching browser...');
    const browserResult = await withRetry(
      () => launchBrowser(headless),
      maxRetries,
      'Browser launch'
    );

    if (!browserResult.success || !browserResult.result) {
      return {
        success: false,
        websiteId,
        fullPagePath: '',
        sections: [],
        metadata: {
          url,
          capturedAt: new Date().toISOString(),
          viewportWidth,
          viewportHeight,
          fullPageHeight: 0,
        },
        error: browserResult.error,
      };
    }

    browser = browserResult.result;

    // Create page
    const page = await createPage(browser, viewportWidth, viewportHeight);

    // Navigate and load content with retry
    const navigationResult = await withRetry(
      () => navigateAndLoad(page, url, pageTimeout, emitProgress),
      maxRetries,
      'Page navigation'
    );

    if (!navigationResult.success) {
      return {
        success: false,
        websiteId,
        fullPagePath: '',
        sections: [],
        metadata: {
          url,
          capturedAt: new Date().toISOString(),
          viewportWidth,
          viewportHeight,
          fullPageHeight: 0,
        },
        error: navigationResult.error,
      };
    }

    // Get page dimensions
    const dimensions = await getPageDimensions(page);

    // Capture full page with retry
    const fullPageResult = await withRetry(
      () => captureFullPage(page, fullPagePath, emitProgress),
      maxRetries,
      'Full page capture'
    );

    if (!fullPageResult.success) {
      return {
        success: false,
        websiteId,
        fullPagePath: '',
        sections: [],
        metadata: {
          url,
          capturedAt: new Date().toISOString(),
          viewportWidth,
          viewportHeight,
          fullPageHeight: dimensions.scrollHeight,
        },
        error: fullPageResult.error,
      };
    }

    // Detect sections
    emitProgress('sections', 65, 'Detecting page sections...');
    const detectedSections = await detectAllSections(page);

    // Capture sections (partial failures don't block the process)
    const capturedSections = await captureSections(page, detectedSections, sectionsDir, emitProgress);

    // Filter to only successfully captured sections
    const successfulSections = capturedSections.filter((s) => s.screenshotPath !== '');

    // Save metadata
    saveMetadata(
      referenceDir,
      url,
      viewportWidth,
      viewportHeight,
      dimensions.scrollHeight,
      successfulSections
    );

    // Update cache
    setCache(url, fullPagePath, successfulSections);

    // Extract raw page data for design system generation (before browser closes)
    // This is optional - don't fail the capture if it errors
    let rawData;
    try {
      emitProgress('complete', 95, 'Extracting design data...');
      rawData = await extractRawPageData(page, url);
    } catch (extractError) {
      // Log but don't fail - design data extraction is optional
      console.warn('[capture] Design data extraction failed:', extractError);
    }

    emitProgress('complete', 100, 'Capture complete');

    return {
      success: true,
      websiteId,
      fullPagePath,
      sections: successfulSections,
      metadata: {
        url,
        capturedAt: new Date().toISOString(),
        viewportWidth,
        viewportHeight,
        fullPageHeight: dimensions.scrollHeight,
      },
      rawData,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      websiteId,
      fullPagePath: '',
      sections: [],
      metadata: {
        url,
        capturedAt: new Date().toISOString(),
        viewportWidth,
        viewportHeight,
        fullPageHeight: 0,
      },
      error: `Capture failed: ${errorMessage}`,
    };
  } finally {
    // CRITICAL: Always close browser to prevent memory leaks
    if (browser) {
      await browser.close();
    }
  }
}

// ====================
// ADDITIONAL EXPORTS
// ====================

/**
 * Check if a URL has valid cached screenshots
 */
export { getCached, copyCacheToWebsite } from '@/lib/cache';

/**
 * Get the reference directory path for a website
 */
export { getReferenceDir, getSectionsDir };

/**
 * Re-export section detection utilities
 */
export { detectAllSections, detectSections } from './section-detector';

/**
 * Re-export scroll and wait utilities
 */
export {
  autoScroll,
  waitForImages,
  waitForFonts,
  waitForAnimations,
  waitForContentComplete,
  dismissCookieConsent,
} from './scroll-loader';
