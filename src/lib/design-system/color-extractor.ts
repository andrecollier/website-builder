/**
 * Color Extractor Module
 *
 * Extracts colors from page computed styles, categorizes them by usage
 * (primary, secondary, neutral, semantic), generates color palettes,
 * and calculates WCAG contrast ratios.
 */

import chroma from 'chroma-js';
import type { ColorExtraction } from '@/types';

// ====================
// TYPES
// ====================

export interface RawColorData {
  colors: string[];
  backgrounds: string[];
  borders: string[];
}

export interface ColorWithFrequency {
  color: string;
  frequency: number;
  normalized: string;
}

export interface ContrastResult {
  ratio: number;
  aa: boolean;
  aaa: boolean;
  aaLarge: boolean;
  aaaLarge: boolean;
}

// ====================
// CONFIGURATION
// ====================

const COLOR_CONFIG = {
  minColorDistance: 10, // Minimum CIEDE2000 distance to consider colors distinct
  maxPaletteColors: 5,
  neutralThreshold: 0.1, // Chroma threshold for neutral colors (low saturation)
  semanticHueRanges: {
    success: { min: 80, max: 160 },  // Greens
    error: { min: 330, max: 30 },    // Reds (wraps around)
    warning: { min: 30, max: 60 },   // Yellows/Oranges
    info: { min: 180, max: 250 },    // Blues
  },
} as const;

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Parse and normalize a color string to hex format
 * Returns null for invalid or transparent colors
 */
export function normalizeColor(colorString: string): string | null {
  if (!colorString || colorString === 'transparent' || colorString === 'inherit') {
    return null;
  }

  try {
    const color = chroma(colorString);
    // Skip fully transparent colors
    if (color.alpha() === 0) {
      return null;
    }
    return color.hex();
  } catch {
    return null;
  }
}

/**
 * Check if a color is considered neutral (grayscale or very low saturation)
 */
export function isNeutralColor(colorHex: string): boolean {
  try {
    const color = chroma(colorHex);
    const [, saturation] = color.hsl();
    // Neutral if saturation is below threshold
    return isNaN(saturation) || saturation < COLOR_CONFIG.neutralThreshold;
  } catch {
    return false;
  }
}

/**
 * Get the hue of a color (0-360)
 */
export function getColorHue(colorHex: string): number {
  try {
    const [hue] = chroma(colorHex).hsl();
    return isNaN(hue) ? 0 : hue;
  } catch {
    return 0;
  }
}

/**
 * Check if a hue falls within a range (handles wrap-around for reds)
 */
function hueInRange(hue: number, min: number, max: number): boolean {
  if (min > max) {
    // Wrap around (e.g., reds: 330-30)
    return hue >= min || hue <= max;
  }
  return hue >= min && hue <= max;
}

/**
 * Calculate CIEDE2000 color difference
 */
export function colorDistance(color1: string, color2: string): number {
  try {
    return chroma.deltaE(color1, color2, 'lab');
  } catch {
    return Infinity;
  }
}

/**
 * Deduplicate colors by merging similar ones
 */
export function deduplicateColors(colors: ColorWithFrequency[]): ColorWithFrequency[] {
  const deduplicated: ColorWithFrequency[] = [];

  for (const item of colors) {
    const existing = deduplicated.find(
      (d) => colorDistance(d.normalized, item.normalized) < COLOR_CONFIG.minColorDistance
    );

    if (existing) {
      // Merge frequency into existing color
      existing.frequency += item.frequency;
    } else {
      deduplicated.push({ ...item });
    }
  }

  return deduplicated.sort((a, b) => b.frequency - a.frequency);
}

// ====================
// WCAG CONTRAST
// ====================

/**
 * Calculate WCAG 2.1 contrast ratio between two colors
 * Returns ratio from 1 to 21
 */
export function calculateContrast(foreground: string, background: string): number {
  try {
    return chroma.contrast(foreground, background);
  } catch {
    return 1;
  }
}

/**
 * Check WCAG compliance levels for a contrast ratio
 */
export function checkWcagCompliance(ratio: number): ContrastResult {
  return {
    ratio: Math.round(ratio * 100) / 100,
    aa: ratio >= 4.5,      // Normal text AA
    aaa: ratio >= 7,       // Normal text AAA
    aaLarge: ratio >= 3,   // Large text AA
    aaaLarge: ratio >= 4.5, // Large text AAA
  };
}

/**
 * Get contrast result between two colors
 */
export function getContrastResult(foreground: string, background: string): ContrastResult {
  const ratio = calculateContrast(foreground, background);
  return checkWcagCompliance(ratio);
}

// ====================
// PALETTE GENERATION
// ====================

type PaletteShade = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950';

/**
 * Generate a full color palette from a base color
 * Creates 11 shades from 50 (lightest) to 950 (darkest)
 */
export function generatePalette(baseColor: string): Record<PaletteShade, string> {
  try {
    const base = chroma(baseColor);
    const [h, s] = base.hsl();
    const safeHue = isNaN(h) ? 0 : h;
    const safeSat = isNaN(s) ? 0 : s;

    // Generate palette using lightness scale
    // Lightness values calibrated to match Tailwind's color palette
    const lightnessScale: Record<PaletteShade, number> = {
      '50': 0.97,
      '100': 0.94,
      '200': 0.86,
      '300': 0.76,
      '400': 0.62,
      '500': 0.50,
      '600': 0.42,
      '700': 0.35,
      '800': 0.28,
      '900': 0.22,
      '950': 0.14,
    };

    const palette: Partial<Record<PaletteShade, string>> = {};

    for (const [shade, lightness] of Object.entries(lightnessScale) as [PaletteShade, number][]) {
      // Adjust saturation based on lightness (lighter colors need more saturation to look good)
      const adjustedSat = lightness > 0.8
        ? safeSat * 1.1
        : lightness < 0.3
          ? safeSat * 0.9
          : safeSat;

      palette[shade] = chroma.hsl(safeHue, Math.min(1, adjustedSat), lightness).hex();
    }

    return palette as Record<PaletteShade, string>;
  } catch {
    // Fallback to grayscale palette
    return {
      '50': '#fafafa',
      '100': '#f4f4f5',
      '200': '#e4e4e7',
      '300': '#d4d4d8',
      '400': '#a1a1aa',
      '500': '#71717a',
      '600': '#52525b',
      '700': '#3f3f46',
      '800': '#27272a',
      '900': '#18181b',
      '950': '#09090b',
    };
  }
}

/**
 * Generate a name for a color based on its hue
 */
export function generateColorName(colorHex: string, index: number): string {
  try {
    const [hue, sat] = chroma(colorHex).hsl();

    // Neutral colors
    if (isNaN(sat) || sat < 0.1) {
      return index === 0 ? 'gray' : `gray-${index + 1}`;
    }

    // Map hue to color name
    const safeHue = isNaN(hue) ? 0 : hue;
    let name: string;

    if (safeHue < 15 || safeHue >= 345) {
      name = 'red';
    } else if (safeHue < 45) {
      name = 'orange';
    } else if (safeHue < 70) {
      name = 'amber';
    } else if (safeHue < 90) {
      name = 'yellow';
    } else if (safeHue < 150) {
      name = 'green';
    } else if (safeHue < 180) {
      name = 'teal';
    } else if (safeHue < 210) {
      name = 'cyan';
    } else if (safeHue < 250) {
      name = 'blue';
    } else if (safeHue < 290) {
      name = 'indigo';
    } else if (safeHue < 330) {
      name = 'purple';
    } else {
      name = 'pink';
    }

    return index === 0 ? name : `${name}-${index + 1}`;
  } catch {
    return `color-${index + 1}`;
  }
}

// ====================
// COLOR CATEGORIZATION
// ====================

/**
 * Categorize colors by semantic meaning based on hue
 */
export function findSemanticColor(
  colors: ColorWithFrequency[],
  semanticType: keyof typeof COLOR_CONFIG.semanticHueRanges
): string {
  const range = COLOR_CONFIG.semanticHueRanges[semanticType];

  // Find best matching color that isn't neutral
  const candidates = colors.filter((c) => {
    if (isNeutralColor(c.normalized)) return false;
    const hue = getColorHue(c.normalized);
    return hueInRange(hue, range.min, range.max);
  });

  if (candidates.length > 0) {
    return candidates[0].normalized;
  }

  // Fallback colors if none found
  const fallbacks: Record<keyof typeof COLOR_CONFIG.semanticHueRanges, string> = {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  return fallbacks[semanticType];
}

/**
 * Separate colors into primary, secondary, and neutral categories
 */
export function categorizeColors(colors: ColorWithFrequency[]): {
  primary: string[];
  secondary: string[];
  neutral: string[];
} {
  const neutralColors: string[] = [];
  const accentColors: ColorWithFrequency[] = [];

  // Separate neutral from accent colors
  for (const color of colors) {
    if (isNeutralColor(color.normalized)) {
      neutralColors.push(color.normalized);
    } else {
      accentColors.push(color);
    }
  }

  // Sort accent colors by frequency
  accentColors.sort((a, b) => b.frequency - a.frequency);

  // Primary colors: top most frequent accent colors
  const primary = accentColors
    .slice(0, Math.min(3, accentColors.length))
    .map((c) => c.normalized);

  // Secondary colors: next set of accent colors
  const secondary = accentColors
    .slice(3, Math.min(6, accentColors.length))
    .map((c) => c.normalized);

  // Deduplicate and limit neutrals
  const uniqueNeutrals = [...new Set(neutralColors)].slice(0, 10);

  return {
    primary,
    secondary,
    neutral: uniqueNeutrals,
  };
}

// ====================
// MAIN EXTRACTION
// ====================

/**
 * Extract and process colors from raw page data
 */
export function extractColors(rawData: RawColorData): ColorExtraction {
  // Collect all colors with frequency
  const colorMap = new Map<string, number>();

  const processColors = (colorList: string[], weight: number = 1) => {
    for (const colorStr of colorList) {
      const normalized = normalizeColor(colorStr);
      if (normalized) {
        const current = colorMap.get(normalized) || 0;
        colorMap.set(normalized, current + weight);
      }
    }
  };

  // Process with different weights (text colors weighted higher)
  processColors(rawData.colors, 2);
  processColors(rawData.backgrounds, 1.5);
  processColors(rawData.borders, 1);

  // Convert to array format
  const colorsWithFrequency: ColorWithFrequency[] = Array.from(colorMap.entries()).map(
    ([color, frequency]) => ({
      color,
      frequency,
      normalized: color,
    })
  );

  // Deduplicate similar colors
  const deduplicated = deduplicateColors(colorsWithFrequency);

  // Categorize colors
  const { primary, secondary, neutral } = categorizeColors(deduplicated);

  // Find semantic colors
  const semantic = {
    success: findSemanticColor(deduplicated, 'success'),
    error: findSemanticColor(deduplicated, 'error'),
    warning: findSemanticColor(deduplicated, 'warning'),
    info: findSemanticColor(deduplicated, 'info'),
  };

  // Generate palettes for primary colors
  const palettes: ColorExtraction['palettes'] = {};
  const paletteSourceColors = primary.slice(0, COLOR_CONFIG.maxPaletteColors);

  for (let i = 0; i < paletteSourceColors.length; i++) {
    const colorName = generateColorName(paletteSourceColors[i], i);
    palettes[colorName] = generatePalette(paletteSourceColors[i]);
  }

  // Always include a gray palette from neutrals
  if (neutral.length > 0) {
    // Find a mid-tone neutral for the gray palette
    const midNeutral = neutral.find((c) => {
      const [, , l] = chroma(c).hsl();
      return l > 0.3 && l < 0.7;
    }) || neutral[0];

    palettes['gray'] = generatePalette(midNeutral);
  } else {
    // Default gray palette
    palettes['gray'] = generatePalette('#71717a');
  }

  return {
    primary: primary.length > 0 ? primary : ['#3b82f6'],
    secondary: secondary.length > 0 ? secondary : ['#6366f1'],
    neutral: neutral.length > 0 ? neutral : ['#71717a', '#f4f4f5', '#18181b'],
    semantic,
    palettes,
  };
}

/**
 * Get default color extraction for empty data
 */
export function getDefaultColorExtraction(): ColorExtraction {
  return {
    primary: ['#3b82f6'],
    secondary: ['#6366f1'],
    neutral: ['#71717a', '#f4f4f5', '#18181b'],
    semantic: {
      success: '#22c55e',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    },
    palettes: {
      blue: generatePalette('#3b82f6'),
      gray: generatePalette('#71717a'),
    },
  };
}
