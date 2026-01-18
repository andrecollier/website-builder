/**
 * Responsive Capture Module
 *
 * Captures websites at multiple viewport sizes (mobile, tablet, desktop)
 * to enable responsive component generation.
 */

import { chromium, type Browser, type Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import type { SectionInfo, CaptureProgress, CapturePhase } from '@/types';
import { detectAllSections } from './section-detector';
import {
  autoScroll,
  waitForImages,
  waitForFonts,
  waitForAnimations,
  dismissCookieConsent,
} from './scroll-loader';

// ====================
// VIEWPORT DEFINITIONS
// ====================

/**
 * Viewport breakpoint configuration
 */
export interface ViewportConfig {
  name: 'mobile' | 'tablet' | 'desktop';
  width: number;
  height: number;
  /** Tailwind prefix for this breakpoint */
  tailwindPrefix: string;
  /** Whether this is the base (mobile-first) breakpoint */
  isBase: boolean;
}

/**
 * Standard breakpoints matching Tailwind defaults
 */
export const VIEWPORT_CONFIGS: ViewportConfig[] = [
  {
    name: 'mobile',
    width: 375,
    height: 812, // iPhone X
    tailwindPrefix: '',
    isBase: true,
  },
  {
    name: 'tablet',
    width: 768,
    height: 1024, // iPad
    tailwindPrefix: 'md:',
    isBase: false,
  },
  {
    name: 'desktop',
    width: 1440,
    height: 900,
    tailwindPrefix: 'lg:',
    isBase: false,
  },
];

// ====================
// TYPES
// ====================

/**
 * Extracted styles at a specific viewport
 */
export interface ViewportStyles {
  viewport: ViewportConfig['name'];
  width: number;
  styles: Record<string, string>;
}

/**
 * Section with responsive data
 */
export interface ResponsiveSectionInfo extends SectionInfo {
  /** Styles extracted at each viewport */
  responsiveStyles: ViewportStyles[];
  /** HTML snapshot at each viewport (layout may differ) */
  responsiveHtml: Record<ViewportConfig['name'], string>;
  /** Bounding box at each viewport */
  responsiveBoundingBox: Record<ViewportConfig['name'], SectionInfo['boundingBox']>;
}

/**
 * Result of responsive capture
 */
export interface ResponsiveCaptureResult {
  success: boolean;
  websiteId: string;
  /** Full page screenshot paths per viewport */
  fullPagePaths: Record<ViewportConfig['name'], string>;
  /** Sections with responsive data */
  sections: ResponsiveSectionInfo[];
  metadata: {
    url: string;
    capturedAt: string;
    viewports: ViewportConfig[];
  };
  error?: string;
}

/**
 * Options for responsive capture
 */
export interface ResponsiveCaptureOptions {
  websiteId: string;
  url: string;
  /** Viewports to capture (default: all) */
  viewports?: ViewportConfig['name'][];
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Page load timeout */
  pageTimeout?: number;
  /** Progress callback */
  onProgress?: (progress: CaptureProgress) => void;
  /** Headless mode */
  headless?: boolean;
}

// ====================
// UTILITY FUNCTIONS
// ====================

function getWebsitesBaseDir(): string {
  return process.env.WEBSITES_DIR
    ? path.resolve(process.cwd(), process.env.WEBSITES_DIR)
    : path.resolve(process.cwd(), 'Websites');
}

function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function createProgressEmitter(onProgress?: (progress: CaptureProgress) => void) {
  return (phase: CapturePhase, percent: number, message: string) => {
    if (onProgress) {
      onProgress({ phase, percent, message });
    }
  };
}

// ====================
// STYLE EXTRACTION
// ====================

/**
 * Extract computed styles for all sections at current viewport
 */
async function extractSectionStyles(
  page: Page,
  sections: SectionInfo[]
): Promise<Map<string, Record<string, string>>> {
  const stylesMap = new Map<string, Record<string, string>>();

  for (const section of sections) {
    const styles = await page.evaluate(
      ({ box }) => {
        // Find element at this position
        const el = document.elementFromPoint(
          box.x + box.width / 2,
          Math.min(box.y + 100, box.y + box.height / 2)
        );

        if (!el) return {};

        const computed = window.getComputedStyle(el);
        const styleProps = [
          'display',
          'flexDirection',
          'justifyContent',
          'alignItems',
          'gap',
          'gridTemplateColumns',
          'gridTemplateRows',
          'padding',
          'paddingTop',
          'paddingRight',
          'paddingBottom',
          'paddingLeft',
          'margin',
          'fontSize',
          'lineHeight',
          'textAlign',
          'width',
          'maxWidth',
          'height',
        ];

        const result: Record<string, string> = {};
        for (const prop of styleProps) {
          const value = computed.getPropertyValue(
            prop.replace(/([A-Z])/g, '-$1').toLowerCase()
          );
          if (value && value !== 'none' && value !== 'normal' && value !== 'auto') {
            result[prop] = value;
          }
        }
        return result;
      },
      { box: section.boundingBox }
    );

    stylesMap.set(section.id, styles);
  }

  return stylesMap;
}

/**
 * Extract HTML for sections at current viewport
 */
async function extractSectionHtml(
  page: Page,
  sections: SectionInfo[]
): Promise<Map<string, string>> {
  const htmlMap = new Map<string, string>();

  for (const section of sections) {
    const html = await page.evaluate(
      ({ box }) => {
        // Find element at this position
        const el = document.elementFromPoint(
          box.x + box.width / 2,
          Math.min(box.y + 100, box.y + box.height / 2)
        );

        if (!el) return '';

        // Get parent section/article if element is nested
        const section =
          el.closest('section') ||
          el.closest('article') ||
          el.closest('div[class*="framer"]') ||
          el;

        return section.outerHTML;
      },
      { box: section.boundingBox }
    );

    htmlMap.set(section.id, html);
  }

  return htmlMap;
}

// ====================
// VIEWPORT CAPTURE
// ====================

/**
 * Capture website at a specific viewport
 */
async function captureAtViewport(
  page: Page,
  viewport: ViewportConfig,
  websiteDir: string,
  emitProgress: ReturnType<typeof createProgressEmitter>
): Promise<{
  fullPagePath: string;
  sections: SectionInfo[];
  sectionStyles: Map<string, Record<string, string>>;
  sectionHtml: Map<string, string>;
}> {
  // Set viewport
  await page.setViewportSize({
    width: viewport.width,
    height: viewport.height,
  });

  // Wait for layout to settle after viewport change
  await page.waitForTimeout(500);

  // Scroll to trigger lazy loading at new viewport
  emitProgress(
    'scrolling',
    20,
    `Scrolling at ${viewport.name} (${viewport.width}px)...`
  );
  await autoScroll(page);
  await waitForImages(page);

  // Create viewport-specific directories
  const viewportDir = path.join(websiteDir, 'reference', viewport.name);
  const sectionsDir = path.join(viewportDir, 'sections');
  ensureDirectory(viewportDir);
  ensureDirectory(sectionsDir);

  // Capture full page
  const fullPagePath = path.join(viewportDir, 'full-page.png');
  emitProgress(
    'capturing',
    40,
    `Capturing full page at ${viewport.name}...`
  );
  await page.screenshot({
    path: fullPagePath,
    fullPage: true,
    type: 'png',
  });

  // Detect sections at this viewport
  emitProgress(
    'sections',
    50,
    `Detecting sections at ${viewport.name}...`
  );
  const sections = await detectAllSections(page);

  // Capture section screenshots
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sectionPath = path.join(
      sectionsDir,
      `${String(i + 1).padStart(2, '0')}-${section.type}.png`
    );

    try {
      // Scroll to section
      await page.evaluate((y) => window.scrollTo(0, y), section.boundingBox.y);
      await page.waitForTimeout(300);

      await page.screenshot({
        path: sectionPath,
        clip: {
          x: section.boundingBox.x,
          y: section.boundingBox.y - (await page.evaluate(() => window.scrollY)),
          width: Math.min(section.boundingBox.width, viewport.width),
          height: Math.min(section.boundingBox.height, 900),
        },
        type: 'png',
      });

      section.screenshotPath = sectionPath;
    } catch {
      // Continue if screenshot fails
    }
  }

  // Extract styles and HTML at this viewport
  emitProgress('sections', 70, `Extracting styles at ${viewport.name}...`);
  const sectionStyles = await extractSectionStyles(page, sections);
  const sectionHtml = await extractSectionHtml(page, sections);

  return {
    fullPagePath,
    sections,
    sectionStyles,
    sectionHtml,
  };
}

// ====================
// MAIN CAPTURE FUNCTION
// ====================

/**
 * Capture website at multiple viewports for responsive analysis
 *
 * @param options - Capture options
 * @returns Promise with ResponsiveCaptureResult
 *
 * @example
 * ```typescript
 * const result = await captureResponsive({
 *   websiteId: 'website-123',
 *   url: 'https://example.framer.website',
 *   onProgress: (p) => console.log(p.message),
 * });
 * ```
 */
export async function captureResponsive(
  options: ResponsiveCaptureOptions
): Promise<ResponsiveCaptureResult> {
  const {
    websiteId,
    url,
    viewports = ['mobile', 'tablet', 'desktop'],
    maxRetries = 3,
    pageTimeout = 30000,
    onProgress,
    headless = true,
  } = options;

  const emitProgress = createProgressEmitter(onProgress);
  const websiteDir = path.join(getWebsitesBaseDir(), websiteId);

  const viewportConfigs = VIEWPORT_CONFIGS.filter((v) =>
    viewports.includes(v.name)
  );

  let browser: Browser | null = null;

  try {
    // Launch browser
    emitProgress('initializing', 5, 'Launching browser...');
    browser = await chromium.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Start with desktop viewport for initial load
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to URL
    emitProgress('initializing', 10, 'Loading page...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: pageTimeout });
    await page.waitForTimeout(500);
    await dismissCookieConsent(page);
    await autoScroll(page);
    await waitForImages(page);
    await waitForFonts(page);
    await waitForAnimations(page);

    // Capture at each viewport
    const fullPagePaths: Record<ViewportConfig['name'], string> = {} as any;
    const viewportData: Map<
      ViewportConfig['name'],
      {
        sections: SectionInfo[];
        styles: Map<string, Record<string, string>>;
        html: Map<string, string>;
      }
    > = new Map();

    const progressPerViewport = 80 / viewportConfigs.length;

    for (let i = 0; i < viewportConfigs.length; i++) {
      const viewport = viewportConfigs[i];
      const baseProgress = 15 + i * progressPerViewport;

      emitProgress(
        'capturing',
        baseProgress,
        `Capturing ${viewport.name} (${viewport.width}px)...`
      );

      const result = await captureAtViewport(
        page,
        viewport,
        websiteDir,
        (phase, percent, message) => {
          const adjustedPercent =
            baseProgress + (percent / 100) * progressPerViewport;
          emitProgress(phase, adjustedPercent, message);
        }
      );

      fullPagePaths[viewport.name] = result.fullPagePath;
      viewportData.set(viewport.name, {
        sections: result.sections,
        styles: result.sectionStyles,
        html: result.sectionHtml,
      });
    }

    // Merge section data across viewports
    emitProgress('complete', 95, 'Merging responsive data...');

    // Use desktop sections as base (most detailed)
    const desktopData = viewportData.get('desktop') || Array.from(viewportData.values())[0];
    if (!desktopData) {
      throw new Error('No viewport data available');
    }
    const responsiveSections: ResponsiveSectionInfo[] = desktopData.sections.map(
      (section) => {
        const responsiveStyles: ViewportStyles[] = [];
        const responsiveHtml: Record<ViewportConfig['name'], string> = {} as any;
        const responsiveBoundingBox: Record<
          ViewportConfig['name'],
          SectionInfo['boundingBox']
        > = {} as any;

        for (const [viewportName, data] of Array.from(viewportData.entries())) {
          // Find matching section by index/type
          const matchingSection = data.sections.find(
            (s) => s.type === section.type
          );

          if (matchingSection) {
            responsiveStyles.push({
              viewport: viewportName,
              width: VIEWPORT_CONFIGS.find((v) => v.name === viewportName)!.width,
              styles: data.styles.get(matchingSection.id) || {},
            });

            responsiveHtml[viewportName] =
              data.html.get(matchingSection.id) || '';
            responsiveBoundingBox[viewportName] = matchingSection.boundingBox;
          }
        }

        return {
          ...section,
          responsiveStyles,
          responsiveHtml,
          responsiveBoundingBox,
        };
      }
    );

    // Save metadata
    const metadata = {
      url,
      capturedAt: new Date().toISOString(),
      viewports: viewportConfigs,
      sections: responsiveSections.map((s) => ({
        id: s.id,
        type: s.type,
        responsiveBoundingBox: s.responsiveBoundingBox,
      })),
    };

    const metadataPath = path.join(websiteDir, 'reference', 'responsive-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    emitProgress('complete', 100, 'Responsive capture complete');

    return {
      success: true,
      websiteId,
      fullPagePaths,
      sections: responsiveSections,
      metadata: {
        url,
        capturedAt: new Date().toISOString(),
        viewports: viewportConfigs,
      },
    };
  } catch (error) {
    return {
      success: false,
      websiteId,
      fullPagePaths: {} as any,
      sections: [],
      metadata: {
        url,
        capturedAt: new Date().toISOString(),
        viewports: viewportConfigs,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Compare styles between viewports to detect responsive changes
 */
export function compareViewportStyles(
  responsiveStyles: ViewportStyles[]
): Map<string, { mobile: string; tablet?: string; desktop?: string }> {
  const changes = new Map<
    string,
    { mobile: string; tablet?: string; desktop?: string }
  >();

  const mobileStyles =
    responsiveStyles.find((s) => s.viewport === 'mobile')?.styles || {};
  const tabletStyles =
    responsiveStyles.find((s) => s.viewport === 'tablet')?.styles || {};
  const desktopStyles =
    responsiveStyles.find((s) => s.viewport === 'desktop')?.styles || {};

  // Find all unique style properties
  const allProps = Array.from(new Set([
    ...Object.keys(mobileStyles),
    ...Object.keys(tabletStyles),
    ...Object.keys(desktopStyles),
  ]));

  for (const prop of allProps) {
    const mobile = mobileStyles[prop];
    const tablet = tabletStyles[prop];
    const desktop = desktopStyles[prop];

    // Only include if there are differences
    if (mobile !== tablet || tablet !== desktop) {
      changes.set(prop, {
        mobile: mobile || '',
        tablet: tablet !== mobile ? tablet : undefined,
        desktop: desktop !== tablet ? desktop : undefined,
      });
    }
  }

  return changes;
}

/**
 * Generate Tailwind classes from responsive style changes
 */
export function generateResponsiveTailwindClasses(
  styleChanges: Map<string, { mobile: string; tablet?: string; desktop?: string }>
): string[] {
  const classes: string[] = [];

  // Map CSS properties to Tailwind classes
  const propertyMappings: Record<string, (value: string) => string | null> = {
    display: (v) => {
      if (v === 'flex') return 'flex';
      if (v === 'grid') return 'grid';
      if (v === 'block') return 'block';
      if (v === 'none') return 'hidden';
      return null;
    },
    flexDirection: (v) => {
      if (v === 'row') return 'flex-row';
      if (v === 'column') return 'flex-col';
      return null;
    },
    justifyContent: (v) => {
      if (v === 'center') return 'justify-center';
      if (v === 'space-between') return 'justify-between';
      if (v === 'flex-start') return 'justify-start';
      if (v === 'flex-end') return 'justify-end';
      return null;
    },
    alignItems: (v) => {
      if (v === 'center') return 'items-center';
      if (v === 'flex-start') return 'items-start';
      if (v === 'flex-end') return 'items-end';
      return null;
    },
    textAlign: (v) => {
      if (v === 'center') return 'text-center';
      if (v === 'left') return 'text-left';
      if (v === 'right') return 'text-right';
      return null;
    },
    gridTemplateColumns: (v) => {
      const colMatch = v.match(/repeat\((\d+)/);
      if (colMatch) {
        return `grid-cols-${colMatch[1]}`;
      }
      return null;
    },
  };

  for (const [prop, values] of Array.from(styleChanges.entries())) {
    const mapper = propertyMappings[prop];
    if (!mapper) continue;

    // Mobile (base)
    if (values.mobile) {
      const mobileClass = mapper(values.mobile);
      if (mobileClass) classes.push(mobileClass);
    }

    // Tablet (md:)
    if (values.tablet) {
      const tabletClass = mapper(values.tablet);
      if (tabletClass) classes.push(`md:${tabletClass}`);
    }

    // Desktop (lg:)
    if (values.desktop) {
      const desktopClass = mapper(values.desktop);
      if (desktopClass) classes.push(`lg:${desktopClass}`);
    }
  }

  return classes;
}

export default {
  captureResponsive,
  compareViewportStyles,
  generateResponsiveTailwindClasses,
  VIEWPORT_CONFIGS,
};
