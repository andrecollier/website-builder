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
// FRAMER-SPECIFIC DETECTION
// ====================

/**
 * Detect sections specifically for Framer sites
 * Framer uses data-framer-name attributes for sections, not semantic HTML
 *
 * @param page - Playwright Page instance
 * @param options - Optional configuration
 * @returns Promise with array of SectionInfo objects
 */
export async function detectFramerSections(
  page: Page,
  options?: {
    maxSections?: number;
    minHeight?: number;
  }
): Promise<SectionInfo[]> {
  const maxSections = options?.maxSections ?? CAPTURE_CONFIG.maxSections;
  const minHeight = options?.minHeight ?? 200; // Framer sections are typically larger

  const sectionData = await page.evaluate(
    ({ minH }: { minH: number }) => {
      const pageHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const viewportHeight = window.innerHeight;
      const allFramerElements = document.querySelectorAll('[data-framer-name]');

      // Semantic section keywords to look for in data-framer-name
      const sectionKeywords = [
        'hero', 'header', 'nav', 'navigation',
        'feature', 'service', 'benefit', 'about',
        'testimonial', 'review', 'quote', 'client',
        'pricing', 'plan', 'package',
        'cta', 'contact', 'demo', 'request', 'book', 'call',
        'faq', 'question',
        'footer', 'bottom',
        'team', 'partner', 'logo', 'brand',
        'gallery', 'portfolio', 'work', 'case',
        'blog', 'journal', 'news', 'article'
      ];

      // Find large sections with semantic names OR distinct backgrounds
      const candidates: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        name: string;
        hasBg: boolean;
        bgColor: string;
        isSemanticSection: boolean;
      }> = [];

      allFramerElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const name = (el.getAttribute('data-framer-name') || '').toLowerCase();
        const computed = getComputedStyle(el);

        // Must be full-width (or close to it)
        if (rect.width < 1200) return;

        // Must have significant height
        if (rect.height < minH) return;

        // Skip elements that span most of the page (wrappers)
        if (rect.height > pageHeight * 0.7) return;

        // Check for distinct background
        const bgColor = computed.backgroundColor;
        const bgImage = computed.backgroundImage;
        const hasBg = (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') ||
                      (bgImage !== 'none');

        // Check if name contains semantic section keywords
        const isSemanticSection = sectionKeywords.some(keyword => name.includes(keyword));

        // Only include if it's a semantic section OR has a distinct background with good height
        if (!isSemanticSection && !hasBg) return;
        if (!isSemanticSection && rect.height < viewportHeight * 0.5) return;

        candidates.push({
          x: Math.round(rect.x + window.scrollX),
          y: Math.round(rect.y + window.scrollY),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          name,
          hasBg,
          bgColor: bgColor.substring(0, 30),
          isSemanticSection,
        });
      });

      // Also check for sticky image sections (Framer's hero pattern)
      const stickyElements = document.querySelectorAll('[data-framer-name]');
      stickyElements.forEach(el => {
        const computed = getComputedStyle(el);
        if (computed.position === 'sticky') {
          const rect = el.getBoundingClientRect();
          const name = (el.getAttribute('data-framer-name') || '').toLowerCase();

          if (rect.width >= 1200 && rect.height >= minH) {
            // Check if parent is much taller (scroll container)
            const parent = el.parentElement;
            if (parent) {
              const parentRect = parent.getBoundingClientRect();
              if (parentRect.height > rect.height * 2) {
                // This is a sticky scroll section
                candidates.push({
                  x: Math.round(rect.x + window.scrollX),
                  y: Math.round(rect.y + window.scrollY),
                  width: Math.round(rect.width),
                  height: Math.round(parentRect.height), // Use parent height for full scroll area
                  name: name || 'sticky-section',
                  hasBg: true,
                  bgColor: 'sticky-scroll',
                  isSemanticSection: true,
                });
              }
            }
          }
        }
      });

      // Sort by y position
      candidates.sort((a, b) => a.y - b.y);

      // Merge overlapping sections, preferring semantic ones
      const filtered: typeof candidates = [];
      for (const section of candidates) {
        const overlappingIdx = filtered.findIndex((existing) => {
          const overlapY = Math.max(
            0,
            Math.min(existing.y + existing.height, section.y + section.height) -
              Math.max(existing.y, section.y)
          );
          const smallerHeight = Math.min(existing.height, section.height);
          return overlapY > smallerHeight * 0.3;
        });

        if (overlappingIdx === -1) {
          filtered.push(section);
        } else {
          // Prefer semantic sections over generic background sections
          const existing = filtered[overlappingIdx];
          const preferNew =
            (section.isSemanticSection && !existing.isSemanticSection) ||
            (section.isSemanticSection === existing.isSemanticSection &&
             section.height > existing.height * 1.2); // Prefer larger if both semantic

          if (preferNew) {
            filtered[overlappingIdx] = section;
          }
        }
      }

      return filtered;
    },
    { minH: minHeight }
  );

  // Convert to SectionInfo with inferred types
  const sections: SectionInfo[] = [];
  const totalSections = Math.min(sectionData.length, maxSections);

  for (let i = 0; i < totalSections; i++) {
    const data = sectionData[i];

    // Infer type from name or position
    let type: SectionType = 'features';
    const nameLower = data.name;

    // Check for specific section types in order of specificity
    if (nameLower.includes('footer') || (nameLower.includes('bottom') && i === totalSections - 1)) {
      type = 'footer';
    } else if (nameLower.includes('nav') || nameLower.includes('header') || (i === 0 && data.height < 200)) {
      type = 'header';
    } else if (nameLower.includes('hero') || nameLower.includes('landing') || nameLower.includes('banner') ||
               (i === 0 && data.height >= 200) || (i === 1 && sections[0]?.type === 'header')) {
      type = 'hero';
    } else if (nameLower.includes('testimonial') || nameLower.includes('review') || nameLower.includes('quote') ||
               nameLower.includes('client') || nameLower.includes('customer')) {
      type = 'testimonials';
    } else if (nameLower.includes('pricing') || nameLower.includes('plan') || nameLower.includes('package') ||
               nameLower.includes('tier') || nameLower.includes('subscription')) {
      type = 'pricing';
    } else if (nameLower.includes('cta') || nameLower.includes('contact') || nameLower.includes('demo') ||
               nameLower.includes('request') || nameLower.includes('book') || nameLower.includes('session') ||
               nameLower.includes('schedule') || nameLower.includes('call') || nameLower.includes('start')) {
      type = 'cta';
    } else if (nameLower.includes('faq') || nameLower.includes('question') || nameLower.includes('answer')) {
      type = 'cta'; // FAQ is often part of CTA section
    } else if (nameLower.includes('feature') || nameLower.includes('service') || nameLower.includes('benefit') ||
               nameLower.includes('how') || nameLower.includes('work') || nameLower.includes('about') ||
               nameLower.includes('journal') || nameLower.includes('blog') || nameLower.includes('news')) {
      type = 'features';
    }

    sections.push({
      id: `section-${randomUUID()}`,
      type,
      boundingBox: {
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
      },
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
 * Used as a LAST RESORT fallback when all other detection methods fail
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

  // First, detect fixed navigation (often missed by bounding box detection)
  const fixedNav = await detectFixedNavigation(page);

  // Get page dimensions to check coverage
  const pageHeight = await page.evaluate(() =>
    Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
  );

  // Helper to calculate page coverage
  const calculateCoverage = (sections: SectionInfo[]) => {
    if (sections.length === 0) return 0;
    const coveredHeight = sections.reduce((sum, s) => sum + s.boundingBox.height, 0);
    return coveredHeight / pageHeight;
  };

  // Detection priority:
  // 1. Try specific CSS-based detection (class names, semantic HTML)
  // 2. Try Framer-specific detection (data-framer-name attributes)
  // 3. Fall back to viewport-based splitting only if nothing else works

  // Step 1: Try specific detection
  let sections = await detectSections(page, options);
  let coverage = calculateCoverage(sections);

  // Step 2: If poor coverage, try Framer-specific detection
  if (sections.length < 3 || coverage < 0.5) {
    const framerSections = await detectFramerSections(page, options);
    const framerCoverage = calculateCoverage(framerSections);

    // Use Framer sections if they provide better coverage
    if (framerSections.length >= 3 && framerCoverage > coverage) {
      sections = framerSections;
      coverage = framerCoverage;
    }
  }

  // Step 3: Fall back to viewport-based splitting only as last resort
  if ((sections.length < 3 || coverage < 0.5) && useGenericFallback) {
    sections = await viewportBasedSplitting(page, options);
  }

  // Fixed navigation is already captured in the header section's bounding box
  // The HTML snapshot would need to be stored elsewhere if needed later

  return sections;
}

// ====================
// FIXED NAVIGATION DETECTION
// ====================

/**
 * Detect fixed/sticky navigation elements that may be missed by bounding box detection
 * These elements have position: fixed or position: sticky and typically contain nav links
 */
async function detectFixedNavigation(page: Page): Promise<SectionInfo | null> {
  const navInfo = await page.evaluate(() => {
    // Look for fixed/sticky navigation elements
    const selectors = [
      'nav[data-framer-name*="Navigation"]',
      'nav[data-framer-name*="Nav"]',
      'nav',
      '[role="navigation"]',
      'header nav',
    ];

    for (const sel of selectors) {
      const elements = Array.from(document.querySelectorAll(sel));
      for (const el of elements) {
        const computed = window.getComputedStyle(el);
        const position = computed.position;

        // Check if it's fixed or sticky
        if (position === 'fixed' || position === 'sticky') {
          const rect = el.getBoundingClientRect();
          // Must be at or near top of viewport
          if (rect.top <= 50 && rect.height > 40 && rect.height < 200) {
            // Check if it has navigation-like content (links)
            const links = el.querySelectorAll('a');
            if (links.length >= 3) {
              return {
                html: el.outerHTML,
                boundingBox: {
                  x: rect.x + window.scrollX,
                  y: 0, // Fixed elements start at top
                  width: rect.width,
                  height: rect.height,
                },
                hasLogo: el.querySelector('img, svg') !== null,
                linkCount: links.length,
              };
            }
          }
        }
      }
    }
    return null;
  });

  if (navInfo) {
    return {
      id: `nav-${randomUUID().slice(0, 8)}`,
      type: 'header' as const, // Navigation is part of header
      boundingBox: navInfo.boundingBox,
      screenshotPath: '',
    };
  }
  return null;
}

// ====================
// CONTENT EXTRACTION
// ====================

/**
 * Extracted content from a section
 */
export interface SectionContent {
  headings: Array<{ level: number; text: string }>;
  paragraphs: string[];
  buttons: Array<{ text: string; href?: string; isPrimary: boolean }>;
  links: Array<{ text: string; href: string }>;
  images: Array<{ src: string; alt: string; role: 'hero' | 'icon' | 'decorative' | 'avatar' }>;
  lists: Array<{ type: 'ul' | 'ol'; items: string[] }>;
  layout: 'centered' | 'split' | 'grid' | 'cards' | 'list' | 'unknown';
  stats?: Array<{ value: string; label: string }>;
  badges?: string[];
}

/**
 * Extract semantic content from a section
 *
 * @param page - Playwright Page instance
 * @param boundingBox - Section bounding box
 * @returns Promise with extracted SectionContent
 */
export async function extractSectionContent(
  page: Page,
  boundingBox: BoundingBox
): Promise<SectionContent> {
  const content = await page.evaluate(
    ({ box }) => {
      // Helper to get all elements within bounding box
      const getElementsInBox = (selector: string): Element[] => {
        const elements = Array.from(document.querySelectorAll(selector));
        return elements.filter(el => {
          const rect = el.getBoundingClientRect();
          const absY = rect.y + window.scrollY;
          return (
            absY >= box.y &&
            absY + rect.height <= box.y + box.height + 50 && // Allow small tolerance
            rect.width > 0 &&
            rect.height > 0
          );
        });
      };

      // Helper to clean text
      const cleanText = (text: string): string => {
        return text.replace(/\s+/g, ' ').trim();
      };

      // Extract headings
      const headings: Array<{ level: number; text: string }> = [];
      for (let level = 1; level <= 6; level++) {
        const els = getElementsInBox(`h${level}`);
        els.forEach(el => {
          const text = cleanText(el.textContent || '');
          if (text.length > 0 && text.length < 500) {
            headings.push({ level, text });
          }
        });
      }

      // Extract paragraphs
      const paragraphs: string[] = [];
      const pEls = getElementsInBox('p');
      pEls.forEach(el => {
        const text = cleanText(el.textContent || '');
        // Filter out empty paragraphs and very short ones that might be labels
        if (text.length > 20 && text.length < 2000) {
          paragraphs.push(text);
        }
      });

      // Also look for div-based paragraphs (common in Framer)
      const divParagraphs = getElementsInBox('[data-framer-name*="Text"], [class*="paragraph"], [class*="description"]');
      divParagraphs.forEach(el => {
        const text = cleanText(el.textContent || '');
        if (text.length > 30 && text.length < 2000 && !paragraphs.includes(text)) {
          // Avoid duplicates from nested elements
          const isDuplicate = paragraphs.some(p => p.includes(text) || text.includes(p));
          if (!isDuplicate) {
            paragraphs.push(text);
          }
        }
      });

      // Extract buttons
      const buttons: Array<{ text: string; href?: string; isPrimary: boolean }> = [];
      const buttonEls = getElementsInBox('button, a[class*="button"], a[class*="btn"], [role="button"], [data-framer-name*="Button"]');
      buttonEls.forEach(el => {
        const text = cleanText(el.textContent || '');
        if (text.length > 0 && text.length < 100) {
          const href = el.getAttribute('href') || undefined;
          const computed = window.getComputedStyle(el);
          const bgColor = computed.backgroundColor;
          // Primary buttons typically have a solid background
          const isPrimary = bgColor !== 'transparent' &&
                           bgColor !== 'rgba(0, 0, 0, 0)' &&
                           !el.classList.toString().includes('secondary') &&
                           !el.classList.toString().includes('outline');

          // Avoid duplicate buttons
          if (!buttons.some(b => b.text === text)) {
            buttons.push({ text, href, isPrimary });
          }
        }
      });

      // Extract regular links (not buttons)
      const links: Array<{ text: string; href: string }> = [];
      const linkEls = getElementsInBox('a:not([class*="button"]):not([class*="btn"]):not([role="button"])');
      linkEls.forEach(el => {
        const text = cleanText(el.textContent || '');
        const href = el.getAttribute('href');
        if (text.length > 0 && text.length < 100 && href && !href.startsWith('#')) {
          // Avoid adding buttons again
          if (!buttons.some(b => b.text === text)) {
            links.push({ text, href });
          }
        }
      });

      // Extract images
      const images: Array<{ src: string; alt: string; role: 'hero' | 'icon' | 'decorative' | 'avatar' }> = [];
      const imgEls = getElementsInBox('img, [style*="background-image"]');
      imgEls.forEach(el => {
        let src = '';
        let alt = '';

        if (el.tagName === 'IMG') {
          src = (el as HTMLImageElement).src || (el as HTMLImageElement).dataset.src || '';
          alt = (el as HTMLImageElement).alt || '';
        } else {
          // Background image
          const style = window.getComputedStyle(el);
          const bgImage = style.backgroundImage;
          const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (match) {
            src = match[1];
          }
        }

        if (src) {
          const rect = el.getBoundingClientRect();
          // Classify image role
          let role: 'hero' | 'icon' | 'decorative' | 'avatar' = 'decorative';

          if (rect.width > 400 && rect.height > 300) {
            role = 'hero';
          } else if (rect.width < 100 && rect.height < 100) {
            if (el.closest('[class*="avatar"], [class*="profile"], [class*="author"]')) {
              role = 'avatar';
            } else {
              role = 'icon';
            }
          }

          // Avoid SVG data URIs and tiny tracking pixels
          if (!src.startsWith('data:image/svg') && rect.width > 10) {
            images.push({ src, alt, role });
          }
        }
      });

      // Extract lists
      const lists: Array<{ type: 'ul' | 'ol'; items: string[] }> = [];
      const listEls = getElementsInBox('ul, ol');
      listEls.forEach(el => {
        const type = el.tagName.toLowerCase() as 'ul' | 'ol';
        const items: string[] = [];
        el.querySelectorAll('li').forEach(li => {
          const text = cleanText(li.textContent || '');
          if (text.length > 0 && text.length < 500) {
            items.push(text);
          }
        });
        if (items.length > 0) {
          lists.push({ type, items });
        }
      });

      // Extract stats (numbers with labels)
      const stats: Array<{ value: string; label: string }> = [];
      const statContainers = getElementsInBox('[class*="stat"], [class*="metric"], [class*="number"], [data-framer-name*="Stat"]');
      statContainers.forEach(el => {
        // Look for a large number followed by a label
        const numbers = el.querySelectorAll('[class*="number"], [class*="value"], strong, b');
        const labels = el.querySelectorAll('[class*="label"], [class*="text"], span, p');

        if (numbers.length > 0 && labels.length > 0) {
          const value = cleanText(numbers[0].textContent || '');
          const label = cleanText(labels[labels.length - 1].textContent || '');
          if (value && label && value !== label) {
            stats.push({ value, label });
          }
        }
      });

      // Extract badges/tags
      const badges: string[] = [];
      const badgeEls = getElementsInBox('[class*="badge"], [class*="tag"], [class*="chip"], [class*="pill"]');
      badgeEls.forEach(el => {
        const text = cleanText(el.textContent || '');
        if (text.length > 0 && text.length < 50) {
          badges.push(text);
        }
      });

      // Determine layout
      let layout: 'centered' | 'split' | 'grid' | 'cards' | 'list' | 'unknown' = 'unknown';

      // Check for grid patterns
      const gridContainers = getElementsInBox('[class*="grid"], [style*="grid"]');
      const flexContainers = getElementsInBox('[style*="flex"]');

      if (gridContainers.length > 0) {
        // Check if it's a card grid
        const cards = getElementsInBox('[class*="card"]');
        if (cards.length >= 3) {
          layout = 'cards';
        } else {
          layout = 'grid';
        }
      } else if (flexContainers.length > 0) {
        // Check if content is centered
        const firstContainer = flexContainers[0];
        const computed = window.getComputedStyle(firstContainer);
        if (computed.justifyContent === 'center' || computed.alignItems === 'center') {
          layout = 'centered';
        } else if (computed.justifyContent === 'space-between') {
          layout = 'split';
        }
      }

      // Check for list layout
      if (lists.length > 0 && layout === 'unknown') {
        layout = 'list';
      }

      // Check for split/two-column layout
      const directChildren = getElementsInBox('section > div, [class*="container"] > div');
      if (directChildren.length === 2 && layout === 'unknown') {
        const child1 = directChildren[0].getBoundingClientRect();
        const child2 = directChildren[1].getBoundingClientRect();
        if (Math.abs(child1.width - child2.width) < 200) {
          layout = 'split';
        }
      }

      // Default to centered for simple sections
      if (layout === 'unknown' && headings.length <= 2 && paragraphs.length <= 2) {
        layout = 'centered';
      }

      return {
        headings,
        paragraphs,
        buttons,
        links,
        images,
        lists,
        layout,
        stats: stats.length > 0 ? stats : undefined,
        badges: badges.length > 0 ? badges : undefined,
      };
    },
    { box: boundingBox }
  );

  return content;
}

/**
 * Extract content for all detected sections
 *
 * @param page - Playwright Page instance
 * @param sections - Array of detected sections
 * @returns Promise with sections and their content
 */
export async function extractAllSectionContent(
  page: Page,
  sections: SectionInfo[]
): Promise<Array<SectionInfo & { content: SectionContent }>> {
  const sectionsWithContent: Array<SectionInfo & { content: SectionContent }> = [];

  for (const section of sections) {
    const content = await extractSectionContent(page, section.boundingBox);
    sectionsWithContent.push({
      ...section,
      content,
    });
  }

  return sectionsWithContent;
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
