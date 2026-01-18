/**
 * Component Detector Module
 *
 * This module provides functions for identifying and extracting web page components
 * (header, hero, features, testimonials, pricing, cta, footer, cards, gallery,
 * contact, faq, stats, team, logos) from web pages using Playwright for DOM analysis.
 *
 * Extends the section detection patterns with additional component types and
 * more comprehensive selector coverage for modern web layouts.
 */

import type { Page } from 'playwright';
import { CAPTURE_CONFIG } from '@/types';
import type { ComponentType, DetectedComponent } from '@/types';
import { randomUUID } from 'crypto';

// ====================
// FRAMER STYLE NORMALIZATION
// ====================

/**
 * Normalize Framer animation styles in extracted HTML
 * Framer sites use animation states with opacity:0, transform, and filter
 * that make components invisible when captured. This function normalizes
 * these styles to ensure components are visible.
 *
 * NOTE: Noise overlay elements (256x256 textures) are removed entirely.
 * Noise effects should be generated separately in post-processing
 * (e.g., nano banana integration) for better control.
 *
 * @param html - Raw HTML string from element.outerHTML
 * @returns Normalized HTML with visible styles
 */
export function normalizeFramerStyles(html: string): string {
  if (!html) return html;

  // First pass: Remove noise overlay elements entirely
  // Framer uses small repeating textures (256x256) as noise overlays
  // These should be generated in post-processing, not extracted
  const noiseOverlayPattern = /<div[^>]*style=["'][^"']*(?:background-image\s*:\s*url\([^)]*(?:width=256|height=256)[^)]*\)|background-repeat\s*:\s*repeat)[^"']*["'][^>]*(?:\/>|><\/div>)/gi;
  let cleaned = html.replace(noiseOverlayPattern, '<!-- noise overlay removed -->');

  // Also remove elements with noise/grain texture URLs
  const noiseUrlPattern = /<div[^>]*style=["'][^"']*url\([^)]*(?:noise|grain|texture)[^)]*\)[^"']*["'][^>]*(?:\/>|><\/div>)/gi;
  cleaned = cleaned.replace(noiseUrlPattern, '<!-- noise overlay removed -->');

  // Pattern to match inline style attributes
  // Handles both style="..." and style='...'
  return cleaned.replace(/style=(["'])(.*?)\1/gi, (match, quote, styleContent) => {
    let normalized = styleContent;

    // Remove opacity: 0 (with various formats)
    // opacity: 0, opacity:0, opacity: '0', opacity:"0"
    normalized = normalized.replace(
      /opacity\s*:\s*['"]?0['"]?\s*;?/gi,
      'opacity: 1;'
    );

    // Remove transform animations (translateY, translateX, scale, rotate)
    // Keep transform: none or simple transforms
    normalized = normalized.replace(
      /transform\s*:\s*['"]?(?:translateY|translateX|translate3d|scale|rotate)\([^)]+\)['"]?\s*;?/gi,
      ''
    );

    // Remove filter: blur(...) that hides content
    normalized = normalized.replace(
      /filter\s*:\s*['"]?blur\([^)]+\)['"]?\s*;?/gi,
      ''
    );

    // Remove visibility: hidden
    normalized = normalized.replace(
      /visibility\s*:\s*['"]?hidden['"]?\s*;?/gi,
      'visibility: visible;'
    );

    // Remove will-change properties (animation optimization hints)
    normalized = normalized.replace(
      /will-change\s*:\s*[^;]+;?/gi,
      ''
    );

    // Clean up multiple semicolons and trailing semicolons
    normalized = normalized.replace(/;+/g, ';').replace(/;\s*$/, '');

    return `style=${quote}${normalized}${quote}`;
  });
}

// ====================
// COMPONENT SELECTORS
// ====================

/**
 * Selector configurations for detecting different component types
 * Each component type has multiple selectors to match various HTML patterns
 */
export const COMPONENT_SELECTORS: Record<ComponentType, string[]> = {
  header: [
    'header',
    '[role="banner"]',
    'nav:first-of-type',
    '.header',
    '#header',
    '[class*="header"]',
    '[class*="navbar"]',
    '[class*="nav-bar"]',
    '[class*="top-bar"]',
    '[class*="topbar"]',
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
    '[class*="above-fold"]',
    '[class*="intro-section"]',
  ],
  features: [
    '[class*="feature"]',
    '[id*="feature"]',
    '[class*="services"]',
    '[id*="services"]',
    '[class*="benefits"]',
    '[class*="capabilities"]',
    '[class*="what-we-do"]',
    '[class*="offerings"]',
    '[class*="solutions"]',
  ],
  testimonials: [
    '[class*="testimonial"]',
    '[id*="testimonial"]',
    '[class*="review"]',
    '[id*="review"]',
    '[class*="quote"]',
    '[class*="customer"]',
    '[class*="social-proof"]',
    '[class*="feedback"]',
    '[class*="client-say"]',
  ],
  pricing: [
    '[class*="pricing"]',
    '[id*="pricing"]',
    '[class*="plans"]',
    '[id*="plans"]',
    '[class*="subscription"]',
    '[class*="packages"]',
    '[class*="price-table"]',
    '[class*="tier"]',
  ],
  cta: [
    '[class*="cta"]',
    '[id*="cta"]',
    '[class*="call-to-action"]',
    '[class*="signup"]',
    '[class*="get-started"]',
    '[class*="action"]',
    '[class*="subscribe"]',
    '[class*="newsletter"]',
    // Framer-specific: CTA sections with "request", "demo", "contact", or FAQ
    '[data-framer-name*="CTA"]',
    '[data-framer-name*="Contact"]',
    '[data-framer-name*="Request"]',
    '[data-framer-name*="FAQ"]',
  ],
  footer: [
    'footer',
    '[role="contentinfo"]',
    '.footer',
    '#footer',
    '[class*="footer"]',
    '[class*="site-footer"]',
    '[class*="bottom-bar"]',
    // Framer-specific: Footer sections
    '[data-framer-name*="Footer"]',
    '[data-framer-name*="CTA Footer"]',
  ],
  cards: [
    '[class*="card-grid"]',
    '[class*="cards"]',
    '[class*="card-container"]',
    '[class*="card-section"]',
    '[class*="card-list"]',
    '[class*="grid-cards"]',
    '[class*="card-deck"]',
  ],
  gallery: [
    '[class*="gallery"]',
    '[id*="gallery"]',
    '[class*="portfolio"]',
    '[id*="portfolio"]',
    '[class*="showcase"]',
    '[class*="work-samples"]',
    '[class*="project-grid"]',
    '[class*="image-grid"]',
  ],
  contact: [
    '[class*="contact"]',
    '[id*="contact"]',
    '[class*="get-in-touch"]',
    '[class*="reach-us"]',
    '[class*="form-section"]',
    '[class*="inquiry"]',
    'form[action*="contact"]',
  ],
  faq: [
    '[class*="faq"]',
    '[id*="faq"]',
    '[class*="questions"]',
    '[class*="accordion"]',
    '[class*="frequently-asked"]',
    '[class*="help-section"]',
    '[class*="support"]',
  ],
  stats: [
    '[class*="stats"]',
    '[id*="stats"]',
    '[class*="statistics"]',
    '[class*="numbers"]',
    '[class*="metrics"]',
    '[class*="counter"]',
    '[class*="achievements"]',
    '[class*="by-the-numbers"]',
  ],
  team: [
    '[class*="team"]',
    '[id*="team"]',
    '[class*="people"]',
    '[class*="staff"]',
    '[class*="members"]',
    '[class*="about-us"]',
    '[class*="leadership"]',
    '[class*="founders"]',
  ],
  logos: [
    '[class*="logo-grid"]',
    '[class*="logos"]',
    '[class*="clients"]',
    '[class*="partners"]',
    '[class*="trusted-by"]',
    '[class*="brands"]',
    '[class*="companies"]',
    '[class*="sponsors"]',
    '[class*="as-seen"]',
  ],
};

/**
 * Priority order for component types (from top to bottom of page)
 * This represents the typical layout order of components on landing pages
 */
export const COMPONENT_ORDER: ComponentType[] = [
  'header',
  'hero',
  'logos',
  'features',
  'stats',
  'cards',
  'testimonials',
  'gallery',
  'team',
  'pricing',
  'faq',
  'cta',
  'contact',
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
  type: ComponentType;
  selector: string;
  boundingBox: BoundingBox;
  element?: {
    html: string;
    styles: Record<string, string>;
  };
}

// ====================
// DETECTION FUNCTIONS
// ====================

/**
 * Detect a specific component type on the page (first instance only)
 *
 * @param page - Playwright Page instance
 * @param componentType - Type of component to detect
 * @returns Promise with DetectedElement or null if not found
 */
async function detectComponentType(
  page: Page,
  componentType: ComponentType
): Promise<DetectedElement | null> {
  const selectors = COMPONENT_SELECTORS[componentType];

  for (const selector of selectors) {
    try {
      const locator = page.locator(selector).first();
      const isVisible = await locator.isVisible({ timeout: 500 });

      if (isVisible) {
        const boundingBox = await locator.boundingBox();

        if (boundingBox && boundingBox.height > 50) {
          // Filter out tiny elements
          // Extract HTML and computed styles
          const elementData = await locator.evaluate((el) => {
            const computedStyles = window.getComputedStyle(el);
            const styles: Record<string, string> = {};

            // Capture key style properties
            const styleProps = [
              'backgroundColor',
              'color',
              'fontSize',
              'fontFamily',
              'fontWeight',
              'padding',
              'margin',
              'display',
              'flexDirection',
              'justifyContent',
              'alignItems',
              'gap',
              'gridTemplateColumns',
              'borderRadius',
              'boxShadow',
            ];

            for (const prop of styleProps) {
              styles[prop] = computedStyles.getPropertyValue(
                prop.replace(/([A-Z])/g, '-$1').toLowerCase()
              );
            }

            return {
              html: el.outerHTML,
              styles,
            };
          });

          return {
            type: componentType,
            selector,
            boundingBox: {
              x: Math.round(boundingBox.x),
              y: Math.round(boundingBox.y),
              width: Math.round(boundingBox.width),
              height: Math.round(boundingBox.height),
            },
            element: elementData,
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
 * Detect ALL instances of a specific component type on the page
 *
 * @param page - Playwright Page instance
 * @param componentType - Type of component to detect
 * @param minHeight - Minimum height for a valid component
 * @returns Promise with array of DetectedElements
 */
async function detectAllOfComponentType(
  page: Page,
  componentType: ComponentType,
  minHeight: number = 50
): Promise<DetectedElement[]> {
  const selectors = COMPONENT_SELECTORS[componentType];
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

                // Extract HTML and styles
                const elementData = await element.evaluate((el) => {
                  const computedStyles = window.getComputedStyle(el);
                  const styles: Record<string, string> = {};
                  const styleProps = [
                    'backgroundColor', 'color', 'fontSize', 'fontFamily',
                    'fontWeight', 'padding', 'margin', 'display',
                    'flexDirection', 'justifyContent', 'alignItems', 'gap',
                  ];
                  for (const prop of styleProps) {
                    styles[prop] = computedStyles.getPropertyValue(
                      prop.replace(/([A-Z])/g, '-$1').toLowerCase()
                    );
                  }
                  return { html: el.outerHTML, styles };
                });

                allDetected.push({
                  type: componentType,
                  selector,
                  boundingBox: {
                    x: Math.round(boundingBox.x),
                    y: Math.round(boundingBox.y),
                    width: Math.round(boundingBox.width),
                    height: Math.round(boundingBox.height),
                  },
                  element: elementData,
                });
              }
            }
          }
        } catch {
          continue;
        }
      }
    } catch {
      continue;
    }
  }

  return allDetected;
}

/**
 * Filter out overlapping components, keeping the more specific ones
 *
 * @param components - Array of detected elements
 * @returns Filtered array without overlapping components
 */
function filterOverlappingComponents(components: DetectedElement[]): DetectedElement[] {
  const filtered: DetectedElement[] = [];

  for (const component of components) {
    const overlaps = filtered.some((existing) => {
      // Check if components significantly overlap (more than 80% overlap)
      const overlapX = Math.max(
        0,
        Math.min(
          existing.boundingBox.x + existing.boundingBox.width,
          component.boundingBox.x + component.boundingBox.width
        ) - Math.max(existing.boundingBox.x, component.boundingBox.x)
      );
      const overlapY = Math.max(
        0,
        Math.min(
          existing.boundingBox.y + existing.boundingBox.height,
          component.boundingBox.y + component.boundingBox.height
        ) - Math.max(existing.boundingBox.y, component.boundingBox.y)
      );
      const overlapArea = overlapX * overlapY;

      const componentArea = component.boundingBox.width * component.boundingBox.height;
      const existingArea = existing.boundingBox.width * existing.boundingBox.height;
      const smallerArea = Math.min(componentArea, existingArea);

      return overlapArea > smallerArea * 0.8;
    });

    if (!overlaps) {
      filtered.push(component);
    }
  }

  return filtered;
}

/**
 * Sort components by their vertical position on the page
 *
 * @param components - Array of detected elements
 * @returns Sorted array (top to bottom)
 */
function sortComponentsByPosition(components: DetectedElement[]): DetectedElement[] {
  return [...components].sort((a, b) => a.boundingBox.y - b.boundingBox.y);
}

// ====================
// MAIN DETECTION FUNCTION
// ====================

/**
 * Detect all page components and return their information
 * Identifies header, hero, features, testimonials, pricing, cta, footer,
 * cards, gallery, contact, faq, stats, team, and logos components
 *
 * @param page - Playwright Page instance
 * @param options - Optional configuration
 * @returns Promise with array of DetectedComponent objects
 *
 * @example
 * ```typescript
 * const components = await detectComponents(page);
 * // Returns: [{ id: '...', type: 'header', boundingBox: {...}, ... }, ...]
 * ```
 */
export async function detectComponents(
  page: Page,
  options?: {
    maxComponents?: number;
    minHeight?: number;
  }
): Promise<DetectedComponent[]> {
  const maxComponents = options?.maxComponents ?? CAPTURE_CONFIG.maxSections;
  const minHeight = options?.minHeight ?? 50;

  const detectedElements: DetectedElement[] = [];

  // Component types that typically only appear once
  const singletonTypes: ComponentType[] = ['header', 'hero', 'cta', 'footer', 'contact'];

  // Component types that can repeat multiple times on a page
  const repeatableTypes: ComponentType[] = [
    'features', 'testimonials', 'pricing', 'cards', 'gallery', 'faq', 'stats', 'team', 'logos'
  ];

  // Detect singleton component types (only first instance)
  for (const componentType of singletonTypes) {
    const detected = await detectComponentType(page, componentType);
    if (detected && detected.boundingBox.height >= minHeight) {
      detectedElements.push(detected);
    }
  }

  // Detect ALL instances of repeatable component types
  for (const componentType of repeatableTypes) {
    const allOfType = await detectAllOfComponentType(page, componentType, minHeight);
    detectedElements.push(...allOfType);
  }

  // Filter overlapping components and sort by position
  const filteredComponents = filterOverlappingComponents(detectedElements);
  const sortedComponents = sortComponentsByPosition(filteredComponents);

  // Limit to max components
  const limitedComponents = sortedComponents.slice(0, maxComponents);

  // Convert to DetectedComponent format with order index
  // Apply Framer style normalization to ensure components are visible
  return limitedComponents.map((element, index): DetectedComponent => ({
    id: `component-${randomUUID()}`,
    type: element.type,
    order: index,
    boundingBox: element.boundingBox,
    screenshotPath: '', // Will be populated during capture
    htmlSnapshot: normalizeFramerStyles(element.element?.html ?? ''),
    styles: element.element?.styles ?? {},
  }));
}

// ====================
// FALLBACK DETECTION
// ====================

/**
 * Detect components using generic semantic HTML elements
 * Used as a fallback when specific component detection finds nothing
 *
 * @param page - Playwright Page instance
 * @param options - Optional configuration
 * @returns Promise with array of DetectedComponent objects
 *
 * @example
 * ```typescript
 * const components = await detectGenericComponents(page);
 * // Returns components based on <section>, <article>, and <main> elements
 * ```
 */
export async function detectGenericComponents(
  page: Page,
  options?: {
    maxComponents?: number;
    minHeight?: number;
  }
): Promise<DetectedComponent[]> {
  const maxComponents = options?.maxComponents ?? CAPTURE_CONFIG.maxSections;
  const minHeight = options?.minHeight ?? 100;

  // Get all semantic section elements with their data
  const componentData = await page.evaluate(
    ({ minH }: { minH: number }) => {
      const elements = document.querySelectorAll('section, article, main > div');
      const results: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        html: string;
        styles: Record<string, string>;
      }> = [];

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.height >= minH && rect.width > 100) {
          const computedStyles = window.getComputedStyle(el);
          const styles: Record<string, string> = {};

          const styleProps = [
            'background-color',
            'color',
            'font-size',
            'font-family',
            'padding',
            'margin',
            'display',
          ];

          for (const prop of styleProps) {
            styles[prop] = computedStyles.getPropertyValue(prop);
          }

          results.push({
            x: Math.round(rect.x + window.scrollX),
            y: Math.round(rect.y + window.scrollY),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            html: el.outerHTML,
            styles,
          });
        }
      });

      return results;
    },
    { minH: minHeight }
  );

  const components: DetectedComponent[] = [];

  // Convert to DetectedComponent, assigning generic types based on position
  for (let i = 0; i < Math.min(componentData.length, maxComponents); i++) {
    const data = componentData[i];

    // Assign type based on position
    let type: ComponentType = 'features';
    if (i === 0) type = 'hero';
    if (i === componentData.length - 1) type = 'footer';

    components.push({
      id: `component-${randomUUID()}`,
      type,
      order: i,
      boundingBox: {
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
      },
      screenshotPath: '',
      htmlSnapshot: normalizeFramerStyles(data.html),
      styles: data.styles,
    });
  }

  return components;
}

// ====================
// VIEWPORT-BASED SPLITTING
// ====================

/**
 * Split page into components based on viewport height
 * Used as a fallback for sites with obfuscated class names (like Framer)
 * where semantic detection fails to find all sections
 *
 * @param page - Playwright Page instance
 * @param options - Optional configuration
 * @returns Promise with array of DetectedComponent objects
 */
async function viewportBasedSplitting(
  page: Page,
  options?: {
    maxComponents?: number;
    minHeight?: number;
  }
): Promise<DetectedComponent[]> {
  const maxComponents = options?.maxComponents ?? CAPTURE_CONFIG.maxSections;
  const minHeight = options?.minHeight ?? 200;

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
    maxComponents
  );

  const components: DetectedComponent[] = [];
  const sectionHeight = Math.ceil(pageHeight / numSections);

  // Section type assignment based on position
  const getSectionType = (index: number, total: number): ComponentType => {
    if (index === 0) return 'header';
    if (index === 1) return 'hero';
    if (index === total - 1) return 'footer';
    if (index === total - 2) return 'cta';

    // Middle sections rotate through features, testimonials, pricing
    const middleTypes: ComponentType[] = ['features', 'testimonials', 'pricing'];
    return middleTypes[(index - 2) % middleTypes.length];
  };

  for (let i = 0; i < numSections; i++) {
    const y = i * sectionHeight;
    const height = Math.min(sectionHeight, pageHeight - y);

    // Skip sections that are too small
    if (height < minHeight) continue;

    components.push({
      id: `component-${randomUUID()}`,
      type: getSectionType(i, numSections),
      order: i,
      boundingBox: {
        x: 0,
        y: Math.round(y),
        width: Math.round(pageWidth),
        height: Math.round(height),
      },
      screenshotPath: '',
      htmlSnapshot: '',
      styles: {},
    });
  }

  return components;
}

// ====================
// COMBINED DETECTION
// ====================

/**
 * Detect components using specific selectors first, falling back to viewport-based splitting
 * This is the recommended function to use for comprehensive component detection
 *
 * @param page - Playwright Page instance
 * @param options - Optional configuration
 * @returns Promise with array of DetectedComponent objects
 *
 * @example
 * ```typescript
 * const components = await detectAllComponents(page);
 * // Returns best available component detection results
 * ```
 */
export async function detectAllComponents(
  page: Page,
  options?: {
    maxComponents?: number;
    minHeight?: number;
    useGenericFallback?: boolean;
  }
): Promise<DetectedComponent[]> {
  const useGenericFallback = options?.useGenericFallback ?? true;
  const maxComponents = options?.maxComponents ?? CAPTURE_CONFIG.maxSections;

  // Get page height for coverage calculation
  const pageHeight = await page.evaluate(() =>
    Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
  );

  // Try specific detection first
  const specificComponents = await detectComponents(page, options);

  // Calculate how much of the page is covered by detected components
  const coveredHeight = specificComponents.reduce((sum, c) => sum + c.boundingBox.height, 0);
  const coverage = coveredHeight / pageHeight;

  // If we have good coverage (>70%) and enough components, use specific detection
  if (coverage > 0.7 && specificComponents.length >= 5) {
    return specificComponents;
  }

  // Try generic fallback first
  if (useGenericFallback) {
    const genericComponents = await detectGenericComponents(page, options);

    // Merge unique components (avoid duplicates based on position)
    const merged = [...specificComponents];

    for (const generic of genericComponents) {
      const isDuplicate = specificComponents.some((specific) => {
        const yDiff = Math.abs(specific.boundingBox.y - generic.boundingBox.y);
        return yDiff < 100; // Consider within 100px as same component
      });

      if (!isDuplicate) {
        merged.push(generic);
      }
    }

    // Sort by position
    const sorted = merged.sort((a, b) => a.boundingBox.y - b.boundingBox.y);

    // Calculate merged coverage
    const mergedCoverage = sorted.reduce((sum, c) => sum + c.boundingBox.height, 0) / pageHeight;

    // If merged has good coverage, use it
    if (mergedCoverage > 0.7 && sorted.length >= 5) {
      return sorted.slice(0, maxComponents).map((component, index) => ({
        ...component,
        order: index,
      }));
    }
  }

  // Final fallback: viewport-based splitting for full page coverage
  // This ensures we capture all sections even on Framer sites with obfuscated classes
  console.log('Using viewport-based splitting as fallback for full page coverage');
  const viewportComponents = await viewportBasedSplitting(page, options);

  // Merge with any detected components to preserve type information
  const finalComponents: DetectedComponent[] = [];

  for (const vpComponent of viewportComponents) {
    // Check if we have a detected component at this position
    const matchingDetected = specificComponents.find((specific) => {
      const overlap = Math.min(
        specific.boundingBox.y + specific.boundingBox.height,
        vpComponent.boundingBox.y + vpComponent.boundingBox.height
      ) - Math.max(specific.boundingBox.y, vpComponent.boundingBox.y);
      return overlap > vpComponent.boundingBox.height * 0.5;
    });

    if (matchingDetected) {
      // Use detected component's type and HTML snapshot
      finalComponents.push({
        ...vpComponent,
        type: matchingDetected.type,
        htmlSnapshot: matchingDetected.htmlSnapshot,
        styles: matchingDetected.styles,
      });
    } else {
      finalComponents.push(vpComponent);
    }
  }

  return finalComponents.slice(0, maxComponents).map((component, index) => ({
    ...component,
    order: index,
  }));
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Get component type display name
 *
 * @param type - ComponentType
 * @returns Human-readable display name
 */
export function getComponentDisplayName(type: ComponentType): string {
  const names: Record<ComponentType, string> = {
    header: 'Header',
    hero: 'Hero Section',
    features: 'Features',
    testimonials: 'Testimonials',
    pricing: 'Pricing',
    cta: 'Call to Action',
    footer: 'Footer',
    cards: 'Card Grid',
    gallery: 'Gallery',
    contact: 'Contact Form',
    faq: 'FAQ',
    stats: 'Statistics',
    team: 'Team',
    logos: 'Logo Grid',
  };
  return names[type];
}

/**
 * Check if a component type is a primary section
 *
 * @param type - ComponentType
 * @returns Boolean indicating if type is a primary section
 */
export function isPrimarySectionType(type: ComponentType): boolean {
  const primaryTypes: ComponentType[] = [
    'header',
    'hero',
    'features',
    'testimonials',
    'pricing',
    'cta',
    'footer',
  ];
  return primaryTypes.includes(type);
}

/**
 * Get recommended minimum height for a component type
 *
 * @param type - ComponentType
 * @returns Recommended minimum height in pixels
 */
export function getMinHeightForType(type: ComponentType): number {
  const heights: Record<ComponentType, number> = {
    header: 50,
    hero: 300,
    features: 200,
    testimonials: 150,
    pricing: 250,
    cta: 100,
    footer: 100,
    cards: 200,
    gallery: 200,
    contact: 200,
    faq: 150,
    stats: 100,
    team: 200,
    logos: 80,
  };
  return heights[type];
}
