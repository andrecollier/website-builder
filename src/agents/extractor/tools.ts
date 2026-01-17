/**
 * Extractor Agent Tools Module
 *
 * Tool functions for the extractor agent to process raw page data
 * and extract design system tokens (colors, typography, spacing, effects).
 *
 * These tools wrap the design-system extraction modules and provide
 * a consistent tool interface for use by the extractor agent.
 */

import {
  extractColors,
  getDefaultColorExtraction,
  type RawColorData,
} from '@/lib/design-system/color-extractor';
import {
  extractTypography,
  getDefaultTypographyExtraction,
  type RawTypographyData,
} from '@/lib/design-system/typography-extractor';
import {
  extractSpacing,
  getDefaultSpacingExtraction,
  type RawSpacingData,
} from '@/lib/design-system/spacing-extractor';
import {
  extractEffects,
  getDefaultEffectsExtraction,
  type RawEffectsData,
} from '@/lib/design-system/effects-extractor';
import type {
  ColorExtraction,
  TypographyExtraction,
  SpacingExtraction,
  EffectsExtraction,
} from '@/types';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Tool execution context
 * Provides access to shared state and metadata
 */
export interface ToolContext {
  websiteId: string;
}

/**
 * Extract Colors Tool Input
 */
export interface ExtractColorsToolInput {
  /** Raw color data from page capture */
  rawData: RawColorData;
}

/**
 * Extract Colors Tool Output
 */
export interface ExtractColorsToolOutput {
  success: boolean;
  colors: ColorExtraction;
  error?: string;
}

/**
 * Extract Typography Tool Input
 */
export interface ExtractTypographyToolInput {
  /** Raw typography data from page capture */
  rawData: RawTypographyData;
}

/**
 * Extract Typography Tool Output
 */
export interface ExtractTypographyToolOutput {
  success: boolean;
  typography: TypographyExtraction;
  error?: string;
}

/**
 * Extract Spacing Tool Input
 */
export interface ExtractSpacingToolInput {
  /** Raw spacing data from page capture */
  rawData: RawSpacingData;
}

/**
 * Extract Spacing Tool Output
 */
export interface ExtractSpacingToolOutput {
  success: boolean;
  spacing: SpacingExtraction;
  error?: string;
}

/**
 * Extract Effects Tool Input
 */
export interface ExtractEffectsToolInput {
  /** Raw effects data from page capture */
  rawData: RawEffectsData;
}

/**
 * Extract Effects Tool Output
 */
export interface ExtractEffectsToolOutput {
  success: boolean;
  effects: EffectsExtraction;
  error?: string;
}

// ====================
// EXTRACT COLORS TOOL
// ====================

/**
 * Extract Colors Tool
 *
 * Extracts colors from raw page data, categorizes them by usage
 * (primary, secondary, neutral, semantic), generates color palettes,
 * and calculates WCAG contrast ratios.
 *
 * @param input - Color extraction parameters (rawData)
 * @param context - Tool execution context
 * @returns Promise resolving to color extraction result
 *
 * @example
 * ```typescript
 * const result = await extractColorsTool({
 *   rawData: {
 *     colors: ['#3b82f6', '#1e40af', '#ffffff'],
 *     backgrounds: ['#ffffff', '#f3f4f6'],
 *     borders: ['#e5e7eb', '#d1d5db']
 *   }
 * }, context);
 *
 * if (result.success) {
 *   console.log('Primary colors:', result.colors.primary);
 *   console.log('Semantic colors:', result.colors.semantic);
 * }
 * ```
 */
export async function extractColorsTool(
  input: ExtractColorsToolInput,
  context: ToolContext
): Promise<ExtractColorsToolOutput> {
  try {
    // Validate input
    if (!input.rawData) {
      return {
        success: false,
        colors: getDefaultColorExtraction(),
        error: 'Missing rawData parameter',
      };
    }

    const { rawData } = input;

    // Validate raw data structure
    if (!rawData.colors || !rawData.backgrounds || !rawData.borders) {
      return {
        success: false,
        colors: getDefaultColorExtraction(),
        error: 'Invalid rawData structure: missing required fields',
      };
    }

    // Extract colors using the color extractor
    const colors = extractColors(rawData);

    return {
      success: true,
      colors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      colors: getDefaultColorExtraction(),
      error: errorMessage,
    };
  }
}

// ====================
// EXTRACT TYPOGRAPHY TOOL
// ====================

/**
 * Extract Typography Tool
 *
 * Extracts typography information from raw page data, including
 * font families, size scale (h1-h6, body, small), weights, and line-heights
 * with automatic px-to-rem conversion.
 *
 * @param input - Typography extraction parameters (rawData)
 * @param context - Tool execution context
 * @returns Promise resolving to typography extraction result
 *
 * @example
 * ```typescript
 * const result = await extractTypographyTool({
 *   rawData: {
 *     fontFamilies: ['Inter', 'System UI', 'Arial'],
 *     fontSizes: ['16px', '20px', '24px', '32px'],
 *     fontWeights: ['400', '600', '700'],
 *     lineHeights: ['1.5', '1.6', '1.2'],
 *     elementTypes: ['p', 'h3', 'h2', 'h1']
 *   }
 * }, context);
 *
 * if (result.success) {
 *   console.log('Font families:', result.typography.fonts);
 *   console.log('Size scale:', result.typography.scale);
 * }
 * ```
 */
export async function extractTypographyTool(
  input: ExtractTypographyToolInput,
  context: ToolContext
): Promise<ExtractTypographyToolOutput> {
  try {
    // Validate input
    if (!input.rawData) {
      return {
        success: false,
        typography: getDefaultTypographyExtraction(),
        error: 'Missing rawData parameter',
      };
    }

    const { rawData } = input;

    // Validate raw data structure
    if (
      !rawData.fontFamilies ||
      !rawData.fontSizes ||
      !rawData.fontWeights ||
      !rawData.lineHeights ||
      !rawData.elementTypes
    ) {
      return {
        success: false,
        typography: getDefaultTypographyExtraction(),
        error: 'Invalid rawData structure: missing required fields',
      };
    }

    // Extract typography using the typography extractor
    const typography = extractTypography(rawData);

    return {
      success: true,
      typography,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      typography: getDefaultTypographyExtraction(),
      error: errorMessage,
    };
  }
}

// ====================
// EXTRACT SPACING TOOL
// ====================

/**
 * Extract Spacing Tool
 *
 * Extracts spacing information from raw page data, including
 * base unit detection (4px or 8px grid), spacing scale generation,
 * container max-widths, and section padding patterns.
 *
 * @param input - Spacing extraction parameters (rawData)
 * @param context - Tool execution context
 * @returns Promise resolving to spacing extraction result
 *
 * @example
 * ```typescript
 * const result = await extractSpacingTool({
 *   rawData: {
 *     paddings: ['16px', '24px', '32px', '48px'],
 *     margins: ['8px', '16px', '24px'],
 *     gaps: ['12px', '16px', '24px'],
 *     maxWidths: ['1280px', '1024px', '768px'],
 *     elementTypes: ['section', 'div', 'div', 'main']
 *   }
 * }, context);
 *
 * if (result.success) {
 *   console.log('Base unit:', result.spacing.baseUnit);
 *   console.log('Spacing scale:', result.spacing.scale);
 * }
 * ```
 */
export async function extractSpacingTool(
  input: ExtractSpacingToolInput,
  context: ToolContext
): Promise<ExtractSpacingToolOutput> {
  try {
    // Validate input
    if (!input.rawData) {
      return {
        success: false,
        spacing: getDefaultSpacingExtraction(),
        error: 'Missing rawData parameter',
      };
    }

    const { rawData } = input;

    // Validate raw data structure
    if (
      !rawData.paddings ||
      !rawData.margins ||
      !rawData.gaps ||
      !rawData.maxWidths ||
      !rawData.elementTypes
    ) {
      return {
        success: false,
        spacing: getDefaultSpacingExtraction(),
        error: 'Invalid rawData structure: missing required fields',
      };
    }

    // Extract spacing using the spacing extractor
    const spacing = extractSpacing(rawData);

    return {
      success: true,
      spacing,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      spacing: getDefaultSpacingExtraction(),
      error: errorMessage,
    };
  }
}

// ====================
// EXTRACT EFFECTS TOOL
// ====================

/**
 * Extract Effects Tool
 *
 * Extracts effects information from raw page data, including
 * box shadows (sm/md/lg/xl), border radii (sm/md/lg/full), and
 * transition durations (fast/normal/slow).
 *
 * @param input - Effects extraction parameters (rawData)
 * @param context - Tool execution context
 * @returns Promise resolving to effects extraction result
 *
 * @example
 * ```typescript
 * const result = await extractEffectsTool({
 *   rawData: {
 *     boxShadows: ['0 1px 3px rgba(0,0,0,0.12)', '0 4px 6px rgba(0,0,0,0.1)'],
 *     borderRadii: ['4px', '8px', '12px', '9999px'],
 *     transitions: ['150ms', '200ms', '300ms']
 *   }
 * }, context);
 *
 * if (result.success) {
 *   console.log('Shadows:', result.effects.shadows);
 *   console.log('Radii:', result.effects.radii);
 * }
 * ```
 */
export async function extractEffectsTool(
  input: ExtractEffectsToolInput,
  context: ToolContext
): Promise<ExtractEffectsToolOutput> {
  try {
    // Validate input
    if (!input.rawData) {
      return {
        success: false,
        effects: getDefaultEffectsExtraction(),
        error: 'Missing rawData parameter',
      };
    }

    const { rawData } = input;

    // Validate raw data structure
    if (!rawData.boxShadows || !rawData.borderRadii || !rawData.transitions) {
      return {
        success: false,
        effects: getDefaultEffectsExtraction(),
        error: 'Invalid rawData structure: missing required fields',
      };
    }

    // Extract effects using the effects extractor
    const effects = extractEffects(rawData);

    return {
      success: true,
      effects,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      effects: getDefaultEffectsExtraction(),
      error: errorMessage,
    };
  }
}

// ====================
// TOOL CONTEXT CREATION
// ====================

/**
 * Create a tool context for extractor agent tools
 * Convenience function for creating tool execution contexts
 *
 * @param websiteId - Website identifier
 * @returns Tool context
 */
export function createToolContext(websiteId: string): ToolContext {
  return {
    websiteId,
  };
}
