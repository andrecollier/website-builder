/**
 * Section Detector Module
 *
 * This module provides functions for identifying and extracting page sections
 * (header, hero, features, testimonials, pricing, cta, footer) from web pages
 * using Playwright for DOM analysis.
 */

import type { Page } from 'playwright';
import { CAPTURE_CONFIG } from '@/types';
import type { SectionType, SectionInfo } from '@/types';
import { randomUUID } from 'crypto';

// ====================
// SECTION SELECTORS
// ====================

/**
 * Selector configurations for detecting different section types
 * Each section type has multiple selectors to match various HTML patterns
 */
const SECTION_SELECTORS: Record<SectionType, string[]> = {
  header: [
    'header',
    '[role="banner"]',
    'nav:first-of-type',
    '.header',
    '#header',
    '[class*="header"]',
    '[class*="navbar"]',
    '[class*="nav-bar"]',
  ],
  hero: [
    '[class*="hero"]',
    '[id*="hero"]',
    'section:first-of-type',
    'main > section:first-child',
    '[class*="banner"]:not(header)',
    '[class*="jumbotron"]',
    '[class*="landing"]',
    '[class*="masthead"]',
  ],
  features: [
    '[class*="feature"]',
    '[id*="feature"]',
    '[class*="services"]',
    '[id*="services"]',
    '[class*="benefits"]',
    '[class*="capabilities"]',
    '[class*="what-we-do"]',
  ],
  testimonials: [
    '[class*="testimonial"]',
    '[id*="testimonial"]',
    '[class*="review"]',
    '[id*="review"]',
    '[class*="quote"]',
    '[class*="customer"]',
    '[class*="social-proof"]',
  ],
  pricing: [
    '[class*="pricing"]',
    '[id*="pricing"]',
    '[class*="plans"]',
    '[id*="plans"]',
    '[class*="subscription"]',
    '[class*="packages"]',
  ],
  cta: [
    '[class*="cta"]',
    '[id*="cta"]',
    '[class*="call-to-action"]',
    '[class*="signup"]',
    '[class*="get-started"]',
    '[class*="action"]',
    // Framer-specific: CTA often has "request", "demo", "contact" or dark background
    '[data-framer-name*="CTA"]',
    '[data-framer-name*="Contact"]',
    '[data-framer-name*="Request"]',
    'section:has(h2:has-text("Request"))',
    'section:has(h2:has-text("Contact"))',
    'section:has(h2:has-text("FAQ"))',
  ],
  footer: [
    'footer',
    '[role="contentinfo"]',
    '.footer',
    '#footer',
    '[class*="footer"]',
    '[class*="site-footer"]',
    // Framer-specific: footer often has "join", "revolution", or is last dark section
    '[data-framer-name*="Footer"]',
    '[data-framer-name*="CTA Footer"]',
    'section:has(h2:has-text("Ready to"))',
    'section:has(h2:has-text("Join"))',
  ],
};

/**
 * Priority order for section types (from top to bottom of page)
 */
const SECTION_ORDER: SectionType[] = [
  'header',
  'hero',
  'features',
  'testimonials',
  'pricing',
  'cta',
  'footer',
];

// ====================
// BOUNDING BOX INTERFACE
// ====================

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectedElement {
  type: SectionType;
  selector: string;
  boundingBox: BoundingBox;
}

// ====================
// DETECTION FUNCTIONS
// ====================

/**
 * Detect a specific section type on the page
 *
 * @param page - Playwright Page instance
 * @param sectionType - Type of section to detect
 * @returns Promise with DetectedElement or null if not found
 */
async function detectSectionType(
  page: Page,
  sectionType: SectionType
): Promise<DetectedElement | null> {
  const selectors = SECTION_SELECTORS[sectionType];

  for (const selector of selectors) {
    try {
      const locator = page.locator(selector).first();
      const isVisible = await locator.isVisible({ timeout: 500 });

      if (isVisible) {
        const boundingBox = await locator.boundingBox();

        if (boundingBox && boundingBox.height > 50) {
          // Filter out tiny elements
          return {
            type: sectionType,
            selector,
            boundingBox: {
              x: Math.round(boundingBox.x),
              y: Math.round(boundingBox.y),
              width: Math.round(boundingBox.width),
              height: Math.round(boundingBox.height),
            },
          };
        }
      }
    } catch {
      // Selector not found, continue to next
      continue;
    }
  }

  return null;
}

/**
 * Detect ALL instances of a specific section type on the page
 *
 * @param page - Playwright Page instance
 * @param sectionType - Type of section to detect
 * @param minHeight - Minimum height for a valid section
 * @returns Promise with array of DetectedElements
 */
async function detectAllOfType(
  page: Page,
  sectionType: SectionType,
  minHeight: number = 50
): Promise<DetectedElement[]> {
  const selectors = SECTION_SELECTORS[sectionType];
  const allDetected: DetectedElement[] = [];
  const seenPositions = new Set<string>();

  for (const selector of selectors) {
    try {
      const locator = page.locator(selector);
      const count = await locator.count();

      for (let i = 0; i < count; i++) {
        try {
          const element = locator.nth(i);
          const isVisible = await element.isVisible({ timeout: 300 });

          if (isVisible) {
            const boundingBox = await element.boundingBox();

            if (boundingBox && boundingBox.height >= minHeight) {
              // Create a key based on position to avoid duplicates
              const posKey = `${Math.round(boundingBox.y)}-${Math.round(boundingBox.height)}`;
              if (!seenPositions.has(posKey)) {
                seenPositions.add(posKey);
                allDetected.push({
                  type: sectionType,
                  selector,
                  boundingBox: {
                    x: Math.round(boundingBox.x),
                    y: Math.round(boundingBox.y),
                    width: Math.round(boundingBox.width),
                    height: Math.round(boundingBox.height),
                  },
                });
              }
            }
          }
        } catch {
          // Individual element failed, continue
          continue;
        }
      }
    } catch {
      // Selector not found, continue to next
      continue;
    }
  }

  return allDetected;
}

/**
 * Filter out overlapping sections, keeping the more specific ones
 *
 * @param sections - Array of detected elements
 * @returns Filtered array without overlapping sections
 */
function filterOverlappingSections(sections: DetectedElement[]): DetectedElement[] {
  const filtered: DetectedElement[] = [];

  for (const section of sections) {
    const overlaps = filtered.some((existing) => {
      // Check if sections significantly overlap (more than 80% overlap)
      const overlapX = Math.max(
        0,
        Math.min(existing.boundingBox.x + existing.boundingBox.width, section.boundingBox.x + section.boundingBox.width) -
          Math.max(existing.boundingBox.x, section.boundingBox.x)
      );
      const overlapY = Math.max(
        0,
        Math.min(existing.boundingBox.y + existing.boundingBox.height, section.boundingBox.y + section.boundingBox.height) -
          Math.max(existing.boundingBox.y, section.boundingBox.y)
      );
      const overlapArea = overlapX * overlapY;

      const sectionArea = section.boundingBox.width * section.boundingBox.height;
      const existingArea = existing.boundingBox.width * existing.boundingBox.height;
      const smallerArea = Math.min(sectionArea, existingArea);

      return overlapArea > smallerArea * 0.8;
    });

    if (!overlaps) {
      filtered.push(section);
    }
  }

  return filtered;
}

/**
 * Sort sections by their vertical position on the page
 *
 * @param sections - Array of detected elements
 * @returns Sorted array (top to bottom)
 */
function sortSectionsByPosition(sections: DetectedElement[]): DetectedElement[] {
  return [...sections].sort((a, b) => a.boundingBox.y - b.boundingBox.y);
}

// ====================
// MAIN DETECTION FUNCTION
// ====================

/**
 * Detect all page sections and return their information
 * Identifies header, hero, features, testimonials, pricing, cta, and footer sections
 *
 * @param page - Playwright Page instance
 * @param options - Optional configuration
 * @returns Promise with array of SectionInfo objects
 *
 * @example
 * ```typescript
 * const sections = await detectSections(page);
 * // Returns: [{ id: '...', type: 'header', boundingBox: {...}, screenshotPath: '' }, ...]
 * ```
 */
export async function detectSections(
  page: Page,
  options?: {
    maxSections?: number;
    minHeight?: number;
  }
): Promise<SectionInfo[]> {
  const maxSections = options?.maxSections ?? CAPTURE_CONFIG.maxSections;
  const minHeight = options?.minHeight ?? 50;

  const detectedElements: DetectedElement[] = [];

  // Section types that typically only appear once
  const singletonTypes: SectionType[] = ['header', 'hero', 'cta', 'footer'];

  // Section types that can repeat multiple times
  const repeatableTypes: SectionType[] = ['features', 'testimonials', 'pricing'];

  // Detect singleton section types (only first instance)
  for (const sectionType of singletonTypes) {
    const detected = await detectSectionType(page, sectionType);

    if (detected && detected.boundingBox.height >= minHeight) {
      detectedElements.push(detected);
    }
  }

  // Detect ALL instances of repeatable section types
  for (const sectionType of repeatableTypes) {
    const allOfType = await detectAllOfType(page, sectionType, minHeight);
    detectedElements.push(...allOfType);
  }

  // Filter overlapping sections and sort by position
  const filteredSections = filterOverlappingSections(detectedElements);
  const sortedSections = sortSectionsByPosition(filteredSections);

  // Limit to max sections
  const limitedSections = sortedSections.slice(0, maxSections);

  // Convert to SectionInfo format
  return limitedSections.map((element): SectionInfo => ({
    id: `section-${randomUUID()}`,
    type: element.type,
    boundingBox: element.boundingBox,
    screenshotPath: '', // Will be populated during capture
  }));
}

// ====================
// FALLBACK DETECTION
// ====================

/**
 * Detect sections using generic semantic HTML elements
 * Used as a fallback when specific section detection finds nothing
 *
 * @param page - Playwright Page instance
 * @param options - Optional configuration
 * @returns Promise with array of SectionInfo objects
 *
 * @example
 * ```typescript
 * const sections = await detectGenericSections(page);
 * // Returns sections based on <section>, <article>, and <main> elements
 * ```
 */
export async function detectGenericSections(
  page: Page,
  options?: {
    maxSections?: number;
    minHeight?: number;
  }
): Promise<SectionInfo[]> {
  const maxSections = options?.maxSections ?? CAPTURE_CONFIG.maxSections;
  const minHeight = options?.minHeight ?? 100;

  const sections: SectionInfo[] = [];

  // Get all semantic section elements
  const sectionData = await page.evaluate(
    ({ minH }: { minH: number }) => {
      const elements = document.querySelectorAll('section, article, main > div');
      const results: Array<{ x: number; y: number; width: number; height: number }> = [];

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.height >= minH && rect.width > 100) {
          results.push({
            x: Math.round(rect.x + window.scrollX),
            y: Math.round(rect.y + window.scrollY),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      });

      return results;
    },
    { minH: minHeight }
  );

  // Convert to SectionInfo, assigning generic types based on position
  for (let i = 0; i < Math.min(sectionData.length, maxSections); i++) {
    const data = sectionData[i];

    // Assign type based on position
    let type: SectionType = 'features';
    if (i === 0) type = 'hero';
    if (i === sectionData.length - 1) type = 'footer';

    sections.push({
      id: `section-${randomUUID()}`,
      type,
      boundingBox: data,
      screenshotPath: '',
    });
  }

  return sections;
}

// ====================
// VIEWPORT-BASED SPLITTING
// ====================

/**
 * Split page into sections based on viewport height
 * Used as a fallback for sites with obfuscated class names (like Framer)
 * where semantic section detection fails
 *
 * @param page - Playwright Page instance
 * @param options - Optional configuration
 * @returns Promise with array of SectionInfo objects
 *
 * @example
 * ```typescript
 * const sections = await viewportBasedSplitting(page);
 * // Returns viewport-height segments as sections
 * ```
 */
async function viewportBasedSplitting(
  page: Page,
  options?: {
    maxSections?: number;
    minHeight?: number;
  }
): Promise<SectionInfo[]> {
  const maxSections = options?.maxSections ?? CAPTURE_CONFIG.maxSections;
  const minHeight = options?.minHeight ?? 100;

  // Get page dimensions
  const dimensions = await page.evaluate(() => ({
    viewportHeight: window.innerHeight,
    pageHeight: Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    ),
    pageWidth: document.body.scrollWidth || window.innerWidth,
  }));

  const { viewportHeight, pageHeight, pageWidth } = dimensions;

  // Calculate number of sections based on page height divided by viewport height
  const numSections = Math.min(
    Math.max(1, Math.ceil(pageHeight / viewportHeight)),
    maxSections
  );

  const sections: SectionInfo[] = [];
  const sectionHeight = Math.ceil(pageHeight / numSections);

  // Section type assignment based on position
  const getSectionType = (index: number, total: number): SectionType => {
    if (index === 0) return 'header';
    if (index === 1) return 'hero';
    if (index === total - 1) return 'footer';
    if (index === total - 2) return 'cta';

    // Middle sections rotate through features, testimonials, pricing
    const middleTypes: SectionType[] = ['features', 'testimonials', 'pricing'];
    return middleTypes[(index - 2) % middleTypes.length];
  };

  for (let i = 0; i < numSections; i++) {
    const y = i * sectionHeight;
    const height = Math.min(sectionHeight, pageHeight - y);

    // Skip sections that are too small
    if (height < minHeight) continue;

    sections.push({
      id: `section-${randomUUID()}`,
      type: getSectionType(i, numSections),
      boundingBox: {
        x: 0,
        y: Math.round(y),
        width: Math.round(pageWidth),
        height: Math.round(height),
      },
      screenshotPath: '',
    });
  }

  return sections;
}

// ====================
// COMBINED DETECTION
// ====================

/**
 * Detect sections using specific selectors first, falling back to generic detection
 * This is the recommended function to use for comprehensive section detection
 *
 * @param page - Playwright Page instance
 * @param options - Optional configuration
 * @returns Promise with array of SectionInfo objects
 *
 * @example
 * ```typescript
 * const sections = await detectAllSections(page);
 * // Returns best available section detection results
 * ```
 */
export async function detectAllSections(
  page: Page,
  options?: {
    maxSections?: number;
    minHeight?: number;
    useGenericFallback?: boolean;
  }
): Promise<SectionInfo[]> {
  const useGenericFallback = options?.useGenericFallback ?? true;

  // Get page dimensions to check coverage
  const pageHeight = await page.evaluate(() =>
    Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
  );

  // Try specific detection first
  const specificSections = await detectSections(page, options);

  // Check if detected sections cover most of the page (> 80%)
  if (specificSections.length >= 3) {
    const coveredHeight = specificSections.reduce((sum, s) => sum + s.boundingBox.height, 0);
    const coverage = coveredHeight / pageHeight;

    if (coverage > 0.8) {
      return specificSections;
    }
  }

  // Use viewport-based splitting to ensure full page coverage
  if (useGenericFallback) {
    const viewportSections = await viewportBasedSplitting(page, options);
    return viewportSections;
  }

  return specificSections;
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Get the viewport dimensions of the page
 *
 * @param page - Playwright Page instance
 * @returns Promise with viewport dimensions
 */
export async function getPageDimensions(
  page: Page
): Promise<{ width: number; height: number; scrollHeight: number }> {
  return await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    scrollHeight: document.body.scrollHeight,
  }));
}

/**
 * Check if an element is within the viewport
 *
 * @param boundingBox - Element bounding box
 * @param viewportHeight - Viewport height
 * @returns Boolean indicating if element is in viewport
 */
export function isInViewport(
  boundingBox: BoundingBox,
  viewportHeight: number
): boolean {
  return boundingBox.y < viewportHeight && boundingBox.y + boundingBox.height > 0;
}
