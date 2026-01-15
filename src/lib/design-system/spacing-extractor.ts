/**
 * Spacing Extractor Module
 *
 * Extracts spacing information from page computed styles, including
 * base unit detection (4px or 8px grid), spacing scale generation,
 * container max-widths, and section padding patterns.
 */

import type { SpacingExtraction } from '@/types';

// ====================
// TYPES
// ====================

export interface RawSpacingData {
  paddings: string[];
  margins: string[];
  gaps: string[];
  maxWidths: string[];
  elementTypes: string[]; // Corresponding element tags (section, div, container, etc.)
}

export interface SpacingValue {
  valuePx: number;
  frequency: number;
  source: 'padding' | 'margin' | 'gap';
}

export interface ContainerCandidate {
  maxWidth: number;
  frequency: number;
}

// ====================
// CONFIGURATION
// ====================

const SPACING_CONFIG = {
  // Common base units for design systems
  possibleBaseUnits: [4, 8] as const,
  // Standard spacing scales based on base units
  scale4px: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128],
  scale8px: [0, 8, 16, 24, 32, 40, 48, 64, 80, 96, 128, 160, 192, 256],
  // Container width detection thresholds
  minContainerWidth: 320,
  maxContainerWidth: 2000,
  // Common container widths to look for
  commonContainerWidths: [640, 768, 1024, 1152, 1280, 1440, 1536, 1920],
  // Section element identifiers
  sectionTags: ['section', 'main', 'article', 'header', 'footer', 'aside'],
  // Container class patterns
  containerPatterns: ['container', 'wrapper', 'content', 'main'],
  // Padding threshold for section detection (px)
  minSectionPadding: 16,
  maxSectionPadding: 200,
} as const;

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Parse a spacing value string to pixels
 * Handles px, rem, em units and shorthand values
 */
export function parseSpacingValue(valueStr: string): number | null {
  if (!valueStr || typeof valueStr !== 'string') {
    return null;
  }

  const trimmed = valueStr.trim().toLowerCase();

  // Handle 'auto' and other non-numeric values
  if (trimmed === 'auto' || trimmed === 'inherit' || trimmed === 'initial' || trimmed === 'none') {
    return null;
  }

  // Handle 0 without unit
  if (trimmed === '0') {
    return 0;
  }

  // Match number with optional unit
  const match = trimmed.match(/^(-?[\d.]+)(px|rem|em|%|vw|vh)?$/);
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
      return Math.round(value);
    case 'rem':
    case 'em':
      return Math.round(value * 16); // Assuming 16px base font size
    case '%':
    case 'vw':
    case 'vh':
      // Viewport-relative units can't be converted to px reliably
      return null;
    default:
      return Math.round(value);
  }
}

/**
 * Parse a max-width value to pixels
 */
export function parseMaxWidth(valueStr: string): number | null {
  if (!valueStr || typeof valueStr !== 'string') {
    return null;
  }

  const trimmed = valueStr.trim().toLowerCase();

  // Handle 'none' and other non-numeric values
  if (trimmed === 'none' || trimmed === 'auto' || trimmed === 'inherit' || trimmed === 'initial') {
    return null;
  }

  // Handle percentage-based max-widths (not useful for container detection)
  if (trimmed.includes('%')) {
    return null;
  }

  // Match number with optional unit
  const match = trimmed.match(/^([\d.]+)(px|rem|em)?$/);
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
      return Math.round(value);
    case 'rem':
    case 'em':
      return Math.round(value * 16);
    default:
      return Math.round(value);
  }
}

/**
 * Extract padding values from a shorthand or single value
 * Returns array of [top, right, bottom, left] or null
 */
export function parsePaddingShorthand(valueStr: string): number[] | null {
  if (!valueStr || typeof valueStr !== 'string') {
    return null;
  }

  const parts = valueStr.trim().split(/\s+/);
  const parsed = parts.map(parseSpacingValue);

  // If any value couldn't be parsed, return null
  if (parsed.some((v) => v === null)) {
    return null;
  }

  const values = parsed as number[];

  switch (values.length) {
    case 1:
      // All sides same
      return [values[0], values[0], values[0], values[0]];
    case 2:
      // Vertical | Horizontal
      return [values[0], values[1], values[0], values[1]];
    case 3:
      // Top | Horizontal | Bottom
      return [values[0], values[1], values[2], values[1]];
    case 4:
      // Top | Right | Bottom | Left
      return values;
    default:
      return null;
  }
}

/**
 * Round a value to the nearest multiple of a base unit
 */
export function roundToBaseUnit(value: number, baseUnit: number): number {
  return Math.round(value / baseUnit) * baseUnit;
}

/**
 * Check if a value aligns well with a base unit
 * Returns true if the value is a multiple of the base unit
 */
export function alignsWithBaseUnit(value: number, baseUnit: number): boolean {
  if (value === 0) return true;
  return value % baseUnit === 0;
}

/**
 * Calculate alignment score for a set of values against a base unit
 * Higher score means better alignment
 */
export function calculateAlignmentScore(values: number[], baseUnit: number): number {
  if (values.length === 0) return 0;

  const alignedCount = values.filter((v) => alignsWithBaseUnit(v, baseUnit)).length;
  return alignedCount / values.length;
}

// ====================
// BASE UNIT DETECTION
// ====================

/**
 * Detect the base spacing unit (4px or 8px) from extracted values
 */
export function detectBaseUnit(spacingValues: SpacingValue[]): number {
  if (spacingValues.length === 0) {
    // Default to 4px for more granular control
    return 4;
  }

  // Extract all unique non-zero pixel values
  const uniqueValues = [...new Set(
    spacingValues
      .map((v) => v.valuePx)
      .filter((v) => v > 0)
  )];

  if (uniqueValues.length === 0) {
    return 4;
  }

  // Calculate alignment scores for each possible base unit
  const scores = SPACING_CONFIG.possibleBaseUnits.map((baseUnit) => ({
    baseUnit,
    score: calculateAlignmentScore(uniqueValues, baseUnit),
  }));

  // Find the base unit with the best alignment
  // Prefer 8px if scores are close (more common in modern design systems)
  const sortedScores = scores.sort((a, b) => b.score - a.score);

  // If 8px has at least 70% alignment, prefer it over 4px
  const score8px = scores.find((s) => s.baseUnit === 8)?.score || 0;
  if (score8px >= 0.7) {
    return 8;
  }

  // Otherwise, return the best scoring unit
  return sortedScores[0].baseUnit;
}

// ====================
// SCALE GENERATION
// ====================

/**
 * Generate a spacing scale based on detected values and base unit
 */
export function generateSpacingScale(
  spacingValues: SpacingValue[],
  baseUnit: number
): number[] {
  // Get the reference scale for the base unit
  const referenceScale = baseUnit === 8
    ? SPACING_CONFIG.scale8px
    : SPACING_CONFIG.scale4px;

  // Collect all unique values and their frequencies
  const valueFrequency = new Map<number, number>();

  for (const item of spacingValues) {
    if (item.valuePx <= 0) continue;

    // Round to base unit for grouping
    const rounded = roundToBaseUnit(item.valuePx, baseUnit);
    const current = valueFrequency.get(rounded) || 0;
    valueFrequency.set(rounded, current + item.frequency);
  }

  // Get extracted values sorted by frequency
  const extractedValues = Array.from(valueFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([value]) => value);

  // Build scale by combining reference scale with extracted values
  const scaleSet = new Set<number>();

  // Add common values from reference scale that appear in extracted data
  for (const refValue of referenceScale) {
    // Include if it's in extracted values or is a fundamental value (0, base, base*2)
    if (
      extractedValues.includes(refValue) ||
      refValue === 0 ||
      refValue === baseUnit ||
      refValue === baseUnit * 2 ||
      refValue === baseUnit * 4
    ) {
      scaleSet.add(refValue);
    }
  }

  // Add top extracted values that align with base unit
  const topExtracted = extractedValues
    .filter((v) => alignsWithBaseUnit(v, baseUnit))
    .slice(0, 15);

  for (const value of topExtracted) {
    scaleSet.add(value);
  }

  // Ensure we have a sensible minimum scale
  const essentialValues = baseUnit === 8
    ? [0, 8, 16, 24, 32, 48, 64, 96]
    : [0, 4, 8, 12, 16, 24, 32, 48, 64, 96];

  for (const value of essentialValues) {
    scaleSet.add(value);
  }

  // Convert to sorted array and filter out unreasonably large values
  const scale = Array.from(scaleSet)
    .filter((v) => v <= 256)
    .sort((a, b) => a - b);

  return scale;
}

// ====================
// CONTAINER WIDTH DETECTION
// ====================

/**
 * Detect container max-width from extracted values
 */
export function detectContainerMaxWidth(
  maxWidths: string[],
  elementTypes: string[]
): string {
  const widthCandidates = new Map<number, number>();

  // Process max-width values
  for (let i = 0; i < maxWidths.length; i++) {
    const width = parseMaxWidth(maxWidths[i]);
    if (width === null) continue;

    // Filter to reasonable container widths
    if (width < SPACING_CONFIG.minContainerWidth || width > SPACING_CONFIG.maxContainerWidth) {
      continue;
    }

    // Boost score for container-like elements
    const elementType = elementTypes[i]?.toLowerCase() || '';
    const isContainerElement =
      SPACING_CONFIG.sectionTags.some((tag) => elementType.includes(tag)) ||
      SPACING_CONFIG.containerPatterns.some((pattern) => elementType.includes(pattern));

    const weight = isContainerElement ? 2 : 1;
    const current = widthCandidates.get(width) || 0;
    widthCandidates.set(width, current + weight);
  }

  if (widthCandidates.size === 0) {
    // Return a sensible default
    return '1280px';
  }

  // Find most common width that matches a common container size
  let bestWidth = 1280;
  let bestScore = 0;

  for (const [width, frequency] of widthCandidates.entries()) {
    // Bonus for common container widths
    const isCommon = SPACING_CONFIG.commonContainerWidths.some(
      (common) => Math.abs(common - width) <= 16
    );
    const score = frequency * (isCommon ? 1.5 : 1);

    if (score > bestScore) {
      bestScore = score;
      bestWidth = width;
    }
  }

  return `${bestWidth}px`;
}

// ====================
// SECTION PADDING DETECTION
// ====================

/**
 * Detect section padding patterns for mobile and desktop
 */
export function detectSectionPadding(
  paddings: string[],
  elementTypes: string[]
): { mobile: string; desktop: string } {
  const horizontalPaddings: number[] = [];

  // Extract horizontal padding from section-like elements
  for (let i = 0; i < paddings.length; i++) {
    const elementType = elementTypes[i]?.toLowerCase() || '';
    const isSection = SPACING_CONFIG.sectionTags.some((tag) =>
      elementType.includes(tag)
    );

    if (!isSection) continue;

    const parsed = parsePaddingShorthand(paddings[i]);
    if (!parsed) continue;

    // Horizontal padding is right and left (indices 1 and 3)
    const horizontalPad = Math.max(parsed[1], parsed[3]);
    if (
      horizontalPad >= SPACING_CONFIG.minSectionPadding &&
      horizontalPad <= SPACING_CONFIG.maxSectionPadding
    ) {
      horizontalPaddings.push(horizontalPad);
    }
  }

  if (horizontalPaddings.length === 0) {
    // Return sensible defaults
    return {
      mobile: '16px',
      desktop: '32px',
    };
  }

  // Sort paddings to find patterns
  const sorted = [...horizontalPaddings].sort((a, b) => a - b);

  // Mobile padding: smaller values (25th percentile)
  const mobileIndex = Math.floor(sorted.length * 0.25);
  const mobilePadding = sorted[mobileIndex] || 16;

  // Desktop padding: larger values (75th percentile)
  const desktopIndex = Math.floor(sorted.length * 0.75);
  const desktopPadding = sorted[desktopIndex] || 32;

  // Round to common values
  const roundedMobile = roundToNiceValue(mobilePadding);
  const roundedDesktop = roundToNiceValue(desktopPadding);

  return {
    mobile: `${roundedMobile}px`,
    desktop: `${roundedDesktop}px`,
  };
}

/**
 * Round a padding value to a nice, standard value
 */
function roundToNiceValue(value: number): number {
  const niceValues = [8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 128];

  // Find the closest nice value
  let closest = niceValues[0];
  let minDiff = Math.abs(value - closest);

  for (const nice of niceValues) {
    const diff = Math.abs(value - nice);
    if (diff < minDiff) {
      minDiff = diff;
      closest = nice;
    }
  }

  return closest;
}

// ====================
// MAIN EXTRACTION
// ====================

/**
 * Extract spacing information from raw page data
 */
export function extractSpacing(rawData: RawSpacingData): SpacingExtraction {
  // Collect all spacing values with their sources
  const spacingValues: SpacingValue[] = [];

  const processValues = (
    values: string[],
    source: SpacingValue['source']
  ) => {
    for (const valueStr of values) {
      // Handle shorthand values by extracting individual values
      const parts = valueStr.split(/\s+/);
      for (const part of parts) {
        const parsed = parseSpacingValue(part);
        if (parsed !== null && parsed >= 0) {
          const existing = spacingValues.find(
            (v) => v.valuePx === parsed && v.source === source
          );
          if (existing) {
            existing.frequency += 1;
          } else {
            spacingValues.push({ valuePx: parsed, frequency: 1, source });
          }
        }
      }
    }
  };

  // Process all spacing sources
  processValues(rawData.paddings, 'padding');
  processValues(rawData.margins, 'margin');
  processValues(rawData.gaps, 'gap');

  // Detect base unit
  const baseUnit = detectBaseUnit(spacingValues);

  // Generate spacing scale
  const scale = generateSpacingScale(spacingValues, baseUnit);

  // Detect container max-width
  const containerMaxWidth = detectContainerMaxWidth(
    rawData.maxWidths,
    rawData.elementTypes
  );

  // Detect section padding patterns
  const sectionPadding = detectSectionPadding(
    rawData.paddings,
    rawData.elementTypes
  );

  return {
    baseUnit,
    scale,
    containerMaxWidth,
    sectionPadding,
  };
}

/**
 * Get default spacing extraction for empty data
 */
export function getDefaultSpacingExtraction(): SpacingExtraction {
  return {
    baseUnit: 4,
    scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128],
    containerMaxWidth: '1280px',
    sectionPadding: {
      mobile: '16px',
      desktop: '32px',
    },
  };
}
