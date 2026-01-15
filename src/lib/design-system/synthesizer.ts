/**
 * Design System Synthesizer Module
 *
 * Combines all four design token extractors (colors, typography, spacing, effects)
 * into a unified DesignSystem object with meta information. This module serves as
 * the central orchestration point for the design extraction pipeline.
 */

import type { DesignSystem, ColorExtraction, TypographyExtraction, SpacingExtraction, EffectsExtraction } from '@/types';

import {
  extractColors,
  getDefaultColorExtraction,
  type RawColorData,
} from './color-extractor';

import {
  extractTypography,
  getDefaultTypographyExtraction,
  type RawTypographyData,
} from './typography-extractor';

import {
  extractSpacing,
  getDefaultSpacingExtraction,
  type RawSpacingData,
} from './spacing-extractor';

import {
  extractEffects,
  getDefaultEffectsExtraction,
  type RawEffectsData,
} from './effects-extractor';

// ====================
// TYPES
// ====================

/**
 * Raw data collected from page computed styles
 * Combines all data needed by individual extractors
 */
export interface RawPageData {
  url: string;
  colors: RawColorData;
  typography: RawTypographyData;
  spacing: RawSpacingData;
  effects: RawEffectsData;
}

/**
 * Configuration options for synthesis
 */
export interface SynthesizeOptions {
  /** Custom version number for the design system */
  version?: number;
  /** Skip color extraction (use defaults) */
  skipColors?: boolean;
  /** Skip typography extraction (use defaults) */
  skipTypography?: boolean;
  /** Skip spacing extraction (use defaults) */
  skipSpacing?: boolean;
  /** Skip effects extraction (use defaults) */
  skipEffects?: boolean;
}

/**
 * Result of validation check on extracted data
 */
export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

// ====================
// CONFIGURATION
// ====================

const SYNTHESIZER_CONFIG = {
  currentVersion: 1,
  // Minimum thresholds for data quality
  minColorsForExtraction: 1,
  minFontFamiliesForExtraction: 1,
  minSpacingValuesForExtraction: 1,
  minEffectsForExtraction: 0, // Effects are optional
} as const;

// ====================
// VALIDATION UTILITIES
// ====================

/**
 * Check if raw color data has sufficient data for extraction
 */
export function hasValidColorData(data: RawColorData | null | undefined): boolean {
  if (!data) return false;

  const totalColors =
    (data.colors?.length || 0) +
    (data.backgrounds?.length || 0) +
    (data.borders?.length || 0);

  return totalColors >= SYNTHESIZER_CONFIG.minColorsForExtraction;
}

/**
 * Check if raw typography data has sufficient data for extraction
 */
export function hasValidTypographyData(data: RawTypographyData | null | undefined): boolean {
  if (!data) return false;

  return (data.fontFamilies?.length || 0) >= SYNTHESIZER_CONFIG.minFontFamiliesForExtraction;
}

/**
 * Check if raw spacing data has sufficient data for extraction
 */
export function hasValidSpacingData(data: RawSpacingData | null | undefined): boolean {
  if (!data) return false;

  const totalSpacing =
    (data.paddings?.length || 0) +
    (data.margins?.length || 0) +
    (data.gaps?.length || 0);

  return totalSpacing >= SYNTHESIZER_CONFIG.minSpacingValuesForExtraction;
}

/**
 * Check if raw effects data has sufficient data for extraction
 */
export function hasValidEffectsData(data: RawEffectsData | null | undefined): boolean {
  if (!data) return false;

  const totalEffects =
    (data.boxShadows?.length || 0) +
    (data.borderRadii?.length || 0) +
    (data.transitions?.length || 0);

  return totalEffects >= SYNTHESIZER_CONFIG.minEffectsForExtraction;
}

/**
 * Validate raw page data and return validation result
 */
export function validateRawPageData(data: RawPageData | null | undefined): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!data) {
    errors.push('No page data provided');
    return { isValid: false, warnings, errors };
  }

  if (!data.url) {
    errors.push('Missing source URL in page data');
  }

  if (!hasValidColorData(data.colors)) {
    warnings.push('Insufficient color data - using defaults');
  }

  if (!hasValidTypographyData(data.typography)) {
    warnings.push('Insufficient typography data - using defaults');
  }

  if (!hasValidSpacingData(data.spacing)) {
    warnings.push('Insufficient spacing data - using defaults');
  }

  if (!hasValidEffectsData(data.effects)) {
    warnings.push('Insufficient effects data - using defaults');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

// ====================
// EXTRACTION HELPERS
// ====================

/**
 * Safely extract colors from raw data
 * Returns default extraction if data is invalid
 */
function safeExtractColors(data: RawColorData | null | undefined): ColorExtraction {
  if (!hasValidColorData(data)) {
    return getDefaultColorExtraction();
  }

  try {
    return extractColors(data!);
  } catch {
    return getDefaultColorExtraction();
  }
}

/**
 * Safely extract typography from raw data
 * Returns default extraction if data is invalid
 */
function safeExtractTypography(data: RawTypographyData | null | undefined): TypographyExtraction {
  if (!hasValidTypographyData(data)) {
    return getDefaultTypographyExtraction();
  }

  try {
    return extractTypography(data!);
  } catch {
    return getDefaultTypographyExtraction();
  }
}

/**
 * Safely extract spacing from raw data
 * Returns default extraction if data is invalid
 */
function safeExtractSpacing(data: RawSpacingData | null | undefined): SpacingExtraction {
  if (!hasValidSpacingData(data)) {
    return getDefaultSpacingExtraction();
  }

  try {
    return extractSpacing(data!);
  } catch {
    return getDefaultSpacingExtraction();
  }
}

/**
 * Safely extract effects from raw data
 * Returns default extraction if data is invalid
 */
function safeExtractEffects(data: RawEffectsData | null | undefined): EffectsExtraction {
  if (!hasValidEffectsData(data)) {
    return getDefaultEffectsExtraction();
  }

  try {
    return extractEffects(data!);
  } catch {
    return getDefaultEffectsExtraction();
  }
}

// ====================
// META GENERATION
// ====================

/**
 * Generate meta information for the design system
 */
export function generateMeta(
  sourceUrl: string,
  version?: number
): DesignSystem['meta'] {
  return {
    sourceUrl: sourceUrl || 'unknown',
    extractedAt: new Date().toISOString(),
    version: version ?? SYNTHESIZER_CONFIG.currentVersion,
  };
}

// ====================
// MAIN SYNTHESIS
// ====================

/**
 * Synthesize a complete DesignSystem from raw page data
 *
 * This is the main entry point for the design extraction pipeline.
 * It combines all four extractors and produces a unified DesignSystem object.
 *
 * @param rawData - Raw data collected from page computed styles
 * @param options - Optional configuration for synthesis
 * @returns Complete DesignSystem object with all tokens
 */
export function synthesizeDesignSystem(
  rawData: RawPageData,
  options: SynthesizeOptions = {}
): DesignSystem {
  const { version, skipColors, skipTypography, skipSpacing, skipEffects } = options;

  // Extract each category (with safe fallbacks)
  const colors = skipColors
    ? getDefaultColorExtraction()
    : safeExtractColors(rawData.colors);

  const typography = skipTypography
    ? getDefaultTypographyExtraction()
    : safeExtractTypography(rawData.typography);

  const spacing = skipSpacing
    ? getDefaultSpacingExtraction()
    : safeExtractSpacing(rawData.spacing);

  const effects = skipEffects
    ? getDefaultEffectsExtraction()
    : safeExtractEffects(rawData.effects);

  // Generate meta information
  const meta = generateMeta(rawData.url, version);

  // Combine into unified design system
  return {
    meta,
    colors,
    typography,
    spacing,
    effects,
  };
}

/**
 * Synthesize DesignSystem from individual extraction results
 *
 * Use this when you have already run individual extractors
 * and want to combine the results into a unified object.
 *
 * @param sourceUrl - Original URL the data was extracted from
 * @param extractions - Individual extraction results
 * @param version - Optional version number
 * @returns Complete DesignSystem object
 */
export function combineExtractions(
  sourceUrl: string,
  extractions: {
    colors?: ColorExtraction;
    typography?: TypographyExtraction;
    spacing?: SpacingExtraction;
    effects?: EffectsExtraction;
  },
  version?: number
): DesignSystem {
  return {
    meta: generateMeta(sourceUrl, version),
    colors: extractions.colors ?? getDefaultColorExtraction(),
    typography: extractions.typography ?? getDefaultTypographyExtraction(),
    spacing: extractions.spacing ?? getDefaultSpacingExtraction(),
    effects: extractions.effects ?? getDefaultEffectsExtraction(),
  };
}

/**
 * Get a default DesignSystem for when no data is available
 *
 * Useful for initializing the editor or when extraction fails completely.
 *
 * @param sourceUrl - Optional source URL to include in meta
 * @returns Complete DesignSystem with default values for all categories
 */
export function getDefaultDesignSystem(sourceUrl: string = 'default'): DesignSystem {
  return {
    meta: generateMeta(sourceUrl, SYNTHESIZER_CONFIG.currentVersion),
    colors: getDefaultColorExtraction(),
    typography: getDefaultTypographyExtraction(),
    spacing: getDefaultSpacingExtraction(),
    effects: getDefaultEffectsExtraction(),
  };
}

/**
 * Merge two design systems, with the override taking precedence
 *
 * Useful for applying user modifications to extracted tokens.
 *
 * @param base - Base design system
 * @param override - Override values (partial)
 * @returns Merged design system
 */
export function mergeDesignSystems(
  base: DesignSystem,
  override: Partial<DesignSystem>
): DesignSystem {
  return {
    meta: {
      ...base.meta,
      ...override.meta,
      // Always update extractedAt when merging
      extractedAt: new Date().toISOString(),
    },
    colors: override.colors
      ? { ...base.colors, ...override.colors }
      : base.colors,
    typography: override.typography
      ? { ...base.typography, ...override.typography }
      : base.typography,
    spacing: override.spacing
      ? { ...base.spacing, ...override.spacing }
      : base.spacing,
    effects: override.effects
      ? { ...base.effects, ...override.effects }
      : base.effects,
  };
}

/**
 * Check if a design system has been modified from its original state
 *
 * Compares two design systems and returns true if they differ.
 * Meta information is excluded from comparison.
 *
 * @param original - Original design system
 * @param current - Current design system to compare
 * @returns True if the systems differ in any token values
 */
export function hasDesignSystemChanged(
  original: DesignSystem,
  current: DesignSystem
): boolean {
  // Deep compare without meta
  const originalWithoutMeta = {
    colors: original.colors,
    typography: original.typography,
    spacing: original.spacing,
    effects: original.effects,
  };

  const currentWithoutMeta = {
    colors: current.colors,
    typography: current.typography,
    spacing: current.spacing,
    effects: current.effects,
  };

  return JSON.stringify(originalWithoutMeta) !== JSON.stringify(currentWithoutMeta);
}

/**
 * Clone a design system (deep copy)
 *
 * @param designSystem - Design system to clone
 * @returns Deep copy of the design system
 */
export function cloneDesignSystem(designSystem: DesignSystem): DesignSystem {
  return JSON.parse(JSON.stringify(designSystem));
}

// ====================
// EXPORTS
// ====================

export {
  // Re-export raw data types for convenience
  type RawColorData,
  type RawTypographyData,
  type RawSpacingData,
  type RawEffectsData,
};
