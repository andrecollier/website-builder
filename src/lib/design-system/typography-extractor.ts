/**
 * Typography Extractor Module
 *
 * Extracts typography information from page computed styles, including
 * font families, size scale (h1-h6, body, small), weights, and line-heights
 * with automatic px-to-rem conversion.
 */

import type { TypographyExtraction } from '@/types';

// ====================
// TYPES
// ====================

export interface RawTypographyData {
  fontFamilies: string[];
  fontSizes: string[];
  fontWeights: string[];
  lineHeights: string[];
  elementTypes: string[]; // Corresponding element tags (h1, h2, p, etc.)
}

export interface FontWithUsage {
  family: string;
  usage: 'heading' | 'body' | 'mono' | 'unknown';
  frequency: number;
}

export interface SizeWithContext {
  sizePx: number;
  sizeRem: string;
  elementType: string;
  frequency: number;
}

// ====================
// CONFIGURATION
// ====================

const TYPOGRAPHY_CONFIG = {
  baseFontSize: 16, // Browser default font size in px
  headingTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  bodyTags: ['p', 'span', 'div', 'li', 'td', 'th', 'label', 'a'],
  monoIndicators: ['monospace', 'mono', 'courier', 'consolas', 'menlo', 'monaco'],
  systemFontStack: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  monoFontStack: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  // Standard size scale reference (in px)
  sizeScale: {
    display: { min: 48, max: 96 },
    h1: { min: 32, max: 48 },
    h2: { min: 24, max: 32 },
    h3: { min: 20, max: 24 },
    h4: { min: 18, max: 20 },
    h5: { min: 16, max: 18 },
    h6: { min: 14, max: 16 },
    body: { min: 14, max: 18 },
    small: { min: 12, max: 14 },
    xs: { min: 10, max: 12 },
  },
  // Standard weights
  standardWeights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  // Line height categories
  lineHeightCategories: {
    tight: { min: 1.0, max: 1.3 },
    normal: { min: 1.3, max: 1.6 },
    relaxed: { min: 1.6, max: 2.2 },
  },
} as const;

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Convert pixels to rem units
 */
export function pxToRem(px: number): string {
  const rem = px / TYPOGRAPHY_CONFIG.baseFontSize;
  // Round to 3 decimal places for cleaner output
  const rounded = Math.round(rem * 1000) / 1000;
  return `${rounded}rem`;
}

/**
 * Convert rem to pixels
 */
export function remToPx(rem: number): number {
  return rem * TYPOGRAPHY_CONFIG.baseFontSize;
}

/**
 * Parse a font size string to pixels
 * Handles px, rem, em, and pt units
 */
export function parseFontSize(sizeStr: string): number | null {
  if (!sizeStr || typeof sizeStr !== 'string') {
    return null;
  }

  const trimmed = sizeStr.trim().toLowerCase();

  // Match number with optional unit
  const match = trimmed.match(/^([\d.]+)(px|rem|em|pt|%)?$/);
  if (!match) {
    return null;
  }

  const value = parseFloat(match[1]);
  if (isNaN(value)) {
    return null;
  }

  const unit = match[2] || 'px';

  switch (unit) {
    case 'px':
      return value;
    case 'rem':
    case 'em':
      return remToPx(value);
    case 'pt':
      return value * (96 / 72); // Convert points to pixels
    case '%':
      return (value / 100) * TYPOGRAPHY_CONFIG.baseFontSize;
    default:
      return value;
  }
}

/**
 * Parse a line height value (can be unitless, px, or percentage)
 */
export function parseLineHeight(lineHeightStr: string, fontSizePx?: number): number | null {
  if (!lineHeightStr || typeof lineHeightStr !== 'string') {
    return null;
  }

  const trimmed = lineHeightStr.trim().toLowerCase();

  // Handle 'normal' keyword
  if (trimmed === 'normal') {
    return 1.5; // Browser default
  }

  // Unitless value (ratio)
  const unitless = parseFloat(trimmed);
  if (!isNaN(unitless) && !trimmed.includes('px') && !trimmed.includes('%')) {
    return unitless;
  }

  // Match number with unit
  const match = trimmed.match(/^([\d.]+)(px|%)?$/);
  if (!match) {
    return null;
  }

  const value = parseFloat(match[1]);
  if (isNaN(value)) {
    return null;
  }

  const unit = match[2];

  if (unit === 'px' && fontSizePx) {
    // Convert px line-height to ratio
    return value / fontSizePx;
  } else if (unit === '%') {
    return value / 100;
  }

  return value;
}

/**
 * Parse font weight string to number
 */
export function parseFontWeight(weightStr: string): number | null {
  if (!weightStr || typeof weightStr !== 'string') {
    return null;
  }

  const trimmed = weightStr.trim().toLowerCase();

  // Named weights
  const namedWeights: Record<string, number> = {
    thin: 100,
    hairline: 100,
    extralight: 200,
    'extra-light': 200,
    ultralight: 200,
    light: 300,
    normal: 400,
    regular: 400,
    book: 400,
    medium: 500,
    semibold: 600,
    'semi-bold': 600,
    demibold: 600,
    bold: 700,
    extrabold: 800,
    'extra-bold': 800,
    ultrabold: 800,
    black: 900,
    heavy: 900,
  };

  if (namedWeights[trimmed]) {
    return namedWeights[trimmed];
  }

  // Numeric weight
  const numeric = parseInt(trimmed, 10);
  if (!isNaN(numeric) && numeric >= 1 && numeric <= 1000) {
    // Round to nearest standard weight
    return TYPOGRAPHY_CONFIG.standardWeights.reduce((prev, curr) =>
      Math.abs(curr - numeric) < Math.abs(prev - numeric) ? curr : prev
    );
  }

  return null;
}

/**
 * Normalize a font family string
 * Removes quotes and normalizes spacing
 */
export function normalizeFontFamily(fontFamily: string): string {
  if (!fontFamily || typeof fontFamily !== 'string') {
    return '';
  }

  // Get the first font in the stack
  const fonts = fontFamily.split(',').map((f) => f.trim());
  const primaryFont = fonts[0] || '';

  // Remove quotes
  return primaryFont.replace(/["']/g, '').trim();
}

/**
 * Check if a font family is a monospace font
 */
export function isMonospaceFont(fontFamily: string): boolean {
  const lower = fontFamily.toLowerCase();
  return TYPOGRAPHY_CONFIG.monoIndicators.some((indicator) =>
    lower.includes(indicator.toLowerCase())
  );
}

/**
 * Check if an element tag is a heading
 */
export function isHeadingTag(tag: string): boolean {
  return TYPOGRAPHY_CONFIG.headingTags.includes(tag.toLowerCase());
}

/**
 * Check if an element tag is typically body text
 */
export function isBodyTag(tag: string): boolean {
  return TYPOGRAPHY_CONFIG.bodyTags.includes(tag.toLowerCase());
}

// ====================
// FONT EXTRACTION
// ====================

/**
 * Extract and categorize fonts from raw data
 */
export function extractFonts(
  fontFamilies: string[],
  elementTypes: string[]
): TypographyExtraction['fonts'] {
  const fontUsage = new Map<string, FontWithUsage>();

  // Process each font with its element context
  for (let i = 0; i < fontFamilies.length; i++) {
    const rawFamily = fontFamilies[i];
    const elementType = elementTypes[i] || 'unknown';
    const family = normalizeFontFamily(rawFamily);

    if (!family) continue;

    const existing = fontUsage.get(family);

    if (existing) {
      existing.frequency += 1;
      // Update usage based on element type
      if (isHeadingTag(elementType) && existing.usage !== 'mono') {
        existing.usage = 'heading';
      } else if (isBodyTag(elementType) && existing.usage === 'unknown') {
        existing.usage = 'body';
      }
    } else {
      let usage: FontWithUsage['usage'] = 'unknown';

      if (isMonospaceFont(family)) {
        usage = 'mono';
      } else if (isHeadingTag(elementType)) {
        usage = 'heading';
      } else if (isBodyTag(elementType)) {
        usage = 'body';
      }

      fontUsage.set(family, { family, usage, frequency: 1 });
    }
  }

  // Convert to array and sort by frequency
  const sortedFonts = Array.from(fontUsage.values()).sort(
    (a, b) => b.frequency - a.frequency
  );

  // Find best font for each category
  const headingFont = sortedFonts.find((f) => f.usage === 'heading')?.family;
  const bodyFont = sortedFonts.find((f) => f.usage === 'body')?.family;
  const monoFont = sortedFonts.find((f) => f.usage === 'mono')?.family;

  // Fallback: if no heading font, use the most common non-mono font
  const fallbackFont = sortedFonts.find((f) => f.usage !== 'mono')?.family;

  return {
    heading: headingFont || fallbackFont || TYPOGRAPHY_CONFIG.systemFontStack,
    body: bodyFont || fallbackFont || TYPOGRAPHY_CONFIG.systemFontStack,
    mono: monoFont || TYPOGRAPHY_CONFIG.monoFontStack,
  };
}

// ====================
// SIZE SCALE EXTRACTION
// ====================

/**
 * Extract size scale from raw font sizes and element types
 */
export function extractSizeScale(
  fontSizes: string[],
  elementTypes: string[]
): TypographyExtraction['scale'] {
  const sizesByElement = new Map<string, number[]>();

  // Group sizes by element type
  for (let i = 0; i < fontSizes.length; i++) {
    const sizePx = parseFontSize(fontSizes[i]);
    const elementType = elementTypes[i]?.toLowerCase() || 'unknown';

    if (sizePx === null) continue;

    const existing = sizesByElement.get(elementType) || [];
    existing.push(sizePx);
    sizesByElement.set(elementType, existing);
  }

  // Calculate median size for each element type
  const getMedianSize = (sizes: number[]): number => {
    if (sizes.length === 0) return 0;
    const sorted = [...sizes].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  // Extract sizes for each heading level
  const h1Sizes = sizesByElement.get('h1') || [];
  const h2Sizes = sizesByElement.get('h2') || [];
  const h3Sizes = sizesByElement.get('h3') || [];
  const h4Sizes = sizesByElement.get('h4') || [];
  const h5Sizes = sizesByElement.get('h5') || [];
  const h6Sizes = sizesByElement.get('h6') || [];
  const pSizes = sizesByElement.get('p') || [];
  const spanSizes = sizesByElement.get('span') || [];
  const smallSizes = sizesByElement.get('small') || [];

  // Get extracted sizes or use defaults
  const extractedH1 = getMedianSize(h1Sizes);
  const extractedH2 = getMedianSize(h2Sizes);
  const extractedH3 = getMedianSize(h3Sizes);
  const extractedH4 = getMedianSize(h4Sizes);
  const extractedH5 = getMedianSize(h5Sizes);
  const extractedH6 = getMedianSize(h6Sizes);
  const extractedBody = getMedianSize([...pSizes, ...spanSizes]);
  const extractedSmall = getMedianSize(smallSizes);

  // Collect all sizes for display and xs estimation
  const allSizes = [
    ...h1Sizes,
    ...h2Sizes,
    ...h3Sizes,
    ...h4Sizes,
    ...h5Sizes,
    ...h6Sizes,
    ...pSizes,
    ...spanSizes,
    ...smallSizes,
  ];

  // Find largest size for display (larger than h1)
  const maxSize = allSizes.length > 0 ? Math.max(...allSizes) : 0;
  const displaySize = maxSize > (extractedH1 || 36) ? maxSize : 0;

  // Find smallest size for xs
  const minSize = allSizes.length > 0 ? Math.min(...allSizes) : 0;
  const xsSize = minSize < (extractedSmall || 14) && minSize > 0 ? minSize : 0;

  // Build scale with extracted values or sensible defaults
  return {
    display: pxToRem(displaySize || 60),
    h1: pxToRem(extractedH1 || 36),
    h2: pxToRem(extractedH2 || 30),
    h3: pxToRem(extractedH3 || 24),
    h4: pxToRem(extractedH4 || 20),
    h5: pxToRem(extractedH5 || 18),
    h6: pxToRem(extractedH6 || 16),
    body: pxToRem(extractedBody || 16),
    small: pxToRem(extractedSmall || 14),
    xs: pxToRem(xsSize || 12),
  };
}

// ====================
// WEIGHT EXTRACTION
// ====================

/**
 * Extract unique font weights from raw data
 */
export function extractWeights(fontWeights: string[]): number[] {
  const weights = new Set<number>();

  for (const weightStr of fontWeights) {
    const weight = parseFontWeight(weightStr);
    if (weight !== null) {
      weights.add(weight);
    }
  }

  // Convert to sorted array
  const sortedWeights = Array.from(weights).sort((a, b) => a - b);

  // If no weights extracted, provide defaults
  if (sortedWeights.length === 0) {
    return [400, 500, 600, 700];
  }

  // Ensure we have at least regular (400) and bold (700)
  if (!sortedWeights.includes(400)) {
    sortedWeights.push(400);
  }
  if (!sortedWeights.includes(700)) {
    sortedWeights.push(700);
  }

  return sortedWeights.sort((a, b) => a - b);
}

// ====================
// LINE HEIGHT EXTRACTION
// ====================

/**
 * Extract line height values and categorize them
 */
export function extractLineHeights(
  lineHeights: string[],
  fontSizes: string[]
): TypographyExtraction['lineHeights'] {
  const parsedLineHeights: number[] = [];

  for (let i = 0; i < lineHeights.length; i++) {
    const fontSizePx = fontSizes[i] ? parseFontSize(fontSizes[i]) : undefined;
    const lineHeight = parseLineHeight(
      lineHeights[i],
      fontSizePx !== null ? fontSizePx : undefined
    );
    if (lineHeight !== null && lineHeight > 0 && lineHeight < 5) {
      parsedLineHeights.push(lineHeight);
    }
  }

  if (parsedLineHeights.length === 0) {
    // Return sensible defaults
    return {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    };
  }

  // Sort line heights
  const sorted = [...parsedLineHeights].sort((a, b) => a - b);

  // Categorize based on ranges
  const tightCandidates = sorted.filter(
    (lh) =>
      lh >= TYPOGRAPHY_CONFIG.lineHeightCategories.tight.min &&
      lh < TYPOGRAPHY_CONFIG.lineHeightCategories.tight.max
  );

  const normalCandidates = sorted.filter(
    (lh) =>
      lh >= TYPOGRAPHY_CONFIG.lineHeightCategories.normal.min &&
      lh < TYPOGRAPHY_CONFIG.lineHeightCategories.normal.max
  );

  const relaxedCandidates = sorted.filter(
    (lh) =>
      lh >= TYPOGRAPHY_CONFIG.lineHeightCategories.relaxed.min &&
      lh <= TYPOGRAPHY_CONFIG.lineHeightCategories.relaxed.max
  );

  // Get median or default for each category
  const getMedian = (arr: number[]): number => {
    if (arr.length === 0) return 0;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 !== 0
      ? arr[mid]
      : (arr[mid - 1] + arr[mid]) / 2;
  };

  // Round to 2 decimal places
  const round = (n: number): number => Math.round(n * 100) / 100;

  return {
    tight: round(getMedian(tightCandidates) || 1.25),
    normal: round(getMedian(normalCandidates) || 1.5),
    relaxed: round(getMedian(relaxedCandidates) || 1.75),
  };
}

// ====================
// MAIN EXTRACTION
// ====================

/**
 * Extract typography information from raw page data
 */
export function extractTypography(rawData: RawTypographyData): TypographyExtraction {
  const fonts = extractFonts(rawData.fontFamilies, rawData.elementTypes);
  const scale = extractSizeScale(rawData.fontSizes, rawData.elementTypes);
  const weights = extractWeights(rawData.fontWeights);
  const lineHeights = extractLineHeights(rawData.lineHeights, rawData.fontSizes);

  return {
    fonts,
    scale,
    weights,
    lineHeights,
  };
}

/**
 * Get default typography extraction for empty data
 */
export function getDefaultTypographyExtraction(): TypographyExtraction {
  return {
    fonts: {
      heading: TYPOGRAPHY_CONFIG.systemFontStack,
      body: TYPOGRAPHY_CONFIG.systemFontStack,
      mono: TYPOGRAPHY_CONFIG.monoFontStack,
    },
    scale: {
      display: '3.75rem',
      h1: '2.25rem',
      h2: '1.875rem',
      h3: '1.5rem',
      h4: '1.25rem',
      h5: '1.125rem',
      h6: '1rem',
      body: '1rem',
      small: '0.875rem',
      xs: '0.75rem',
    },
    weights: [400, 500, 600, 700],
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  };
}
