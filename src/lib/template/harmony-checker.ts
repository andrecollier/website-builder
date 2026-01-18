/**
 * Visual Harmony Checker Module
 *
 * Calculates visual harmony scores between mixed sections from multiple reference
 * websites. Analyzes color compatibility, typography consistency, and spacing
 * alignment to provide a 0-100 harmony score with specific issues and suggestions.
 */

import type {
  DesignSystem,
  Reference,
  SectionMapping,
  HarmonyResult,
  HarmonyIssue,
  SectionType,
  ColorExtraction,
  TypographyExtraction,
  SpacingExtraction,
} from '@/types';

// ====================
// TYPES
// ====================

/**
 * Configuration for harmony calculation
 */
export interface HarmonyCheckOptions {
  /** Minimum score threshold for color harmony (0-100) */
  colorThreshold?: number;
  /** Minimum score threshold for typography harmony (0-100) */
  typographyThreshold?: number;
  /** Minimum score threshold for spacing harmony (0-100) */
  spacingThreshold?: number;
  /** Weight for color in overall score (0-1) */
  colorWeight?: number;
  /** Weight for typography in overall score (0-1) */
  typographyWeight?: number;
  /** Weight for spacing in overall score (0-1) */
  spacingWeight?: number;
}

/**
 * Detailed harmony scores for each category
 */
export interface HarmonyBreakdown {
  color: number;
  typography: number;
  spacing: number;
  overall: number;
}

/**
 * Complete harmony analysis result
 */
export interface DetailedHarmonyResult extends HarmonyResult {
  breakdown: HarmonyBreakdown;
  referencesAnalyzed: string[];
  sectionsAnalyzed: SectionType[];
}

// ====================
// CONFIGURATION
// ====================

const HARMONY_CONFIG = {
  // Weight distribution (must sum to 1.0)
  defaultWeights: {
    color: 0.4,       // 40% - Most visually important
    typography: 0.35, // 35% - Critical for consistency
    spacing: 0.25,    // 25% - Important but more flexible
  },

  // Thresholds for issues (0-100)
  thresholds: {
    high: 60,    // Below this is high severity
    medium: 75,  // Below this is medium severity
    low: 85,     // Below this is low severity
  },

  // Color comparison tolerances
  color: {
    hueTolerance: 15,           // degrees (0-360)
    saturationTolerance: 0.15,  // 15% difference allowed
    lightnessTolerance: 0.15,   // 15% difference allowed
    minPaletteOverlap: 0.3,     // 30% of colors should be compatible
  },

  // Typography comparison tolerances
  typography: {
    scaleDifferenceTolerance: 0.2, // 20% size difference allowed
    minScaleMatches: 0.5,          // 50% of scale items should match
  },

  // Spacing comparison tolerances
  spacing: {
    valueDifferenceTolerance: 0.25, // 25% difference allowed
    minValueMatches: 0.4,           // 40% of values should match
  },
} as const;

// ====================
// COLOR UTILITIES
// ====================

/**
 * Convert hex color to HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, '');

  // Parse RGB
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100) / 100,
    l: Math.round(l * 100) / 100,
  };
}

/**
 * Calculate color similarity (0-1, higher is more similar)
 */
function calculateColorSimilarity(color1: string, color2: string): number {
  const hsl1 = hexToHsl(color1);
  const hsl2 = hexToHsl(color2);

  if (!hsl1 || !hsl2) return 0;

  // Calculate differences
  const hueDiff = Math.min(
    Math.abs(hsl1.h - hsl2.h),
    360 - Math.abs(hsl1.h - hsl2.h)
  ) / 180; // Normalize to 0-1

  const satDiff = Math.abs(hsl1.s - hsl2.s);
  const lightDiff = Math.abs(hsl1.l - hsl2.l);

  // Weighted similarity (hue is most important)
  const similarity = 1 - (hueDiff * 0.5 + satDiff * 0.25 + lightDiff * 0.25);

  return Math.max(0, similarity);
}

/**
 * Check if two colors are compatible
 */
function areColorsCompatible(color1: string, color2: string): boolean {
  const hsl1 = hexToHsl(color1);
  const hsl2 = hexToHsl(color2);

  if (!hsl1 || !hsl2) return false;

  const hueDiff = Math.min(
    Math.abs(hsl1.h - hsl2.h),
    360 - Math.abs(hsl1.h - hsl2.h)
  );

  const satDiff = Math.abs(hsl1.s - hsl2.s);
  const lightDiff = Math.abs(hsl1.l - hsl2.l);

  return (
    hueDiff <= HARMONY_CONFIG.color.hueTolerance &&
    satDiff <= HARMONY_CONFIG.color.saturationTolerance &&
    lightDiff <= HARMONY_CONFIG.color.lightnessTolerance
  );
}

/**
 * Get all colors from a color extraction
 */
function getAllColors(colors: ColorExtraction): string[] {
  const allColors: string[] = [];

  // Add primary and secondary colors
  allColors.push(...colors.primary);
  allColors.push(...colors.secondary);
  allColors.push(...colors.neutral);

  // Add semantic colors
  allColors.push(
    colors.semantic.success,
    colors.semantic.error,
    colors.semantic.warning,
    colors.semantic.info
  );

  return allColors.filter(c => c && c.startsWith('#'));
}

// ====================
// TYPOGRAPHY UTILITIES
// ====================

/**
 * Extract font size from CSS string (e.g., "16px" -> 16)
 */
function extractFontSize(sizeString: string): number {
  const match = sizeString.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Calculate typography scale similarity (0-1)
 */
function calculateTypographySimilarity(
  typo1: TypographyExtraction,
  typo2: TypographyExtraction
): number {
  // Compare font families
  const headingMatch = typo1.fonts.heading === typo2.fonts.heading ? 1 : 0;
  const bodyMatch = typo1.fonts.body === typo2.fonts.body ? 1 : 0;
  const fontSimilarity = (headingMatch + bodyMatch) / 2;

  // Compare scale ratios
  const scales1 = [
    typo1.scale.h1,
    typo1.scale.h2,
    typo1.scale.h3,
    typo1.scale.body,
  ].map(extractFontSize);

  const scales2 = [
    typo2.scale.h1,
    typo2.scale.h2,
    typo2.scale.h3,
    typo2.scale.body,
  ].map(extractFontSize);

  let scaleMatches = 0;
  const tolerance = HARMONY_CONFIG.typography.scaleDifferenceTolerance;

  for (let i = 0; i < scales1.length; i++) {
    const diff = Math.abs(scales1[i] - scales2[i]) / scales1[i];
    if (diff <= tolerance) {
      scaleMatches++;
    }
  }

  const scaleSimilarity = scaleMatches / scales1.length;

  // Weight fonts more heavily than scale
  return fontSimilarity * 0.6 + scaleSimilarity * 0.4;
}

// ====================
// SPACING UTILITIES
// ====================

/**
 * Get all spacing values from a spacing extraction
 */
function getAllSpacingValues(spacing: SpacingExtraction): number[] {
  const values: number[] = [];

  // Extract values from scale array
  if (spacing.scale) {
    spacing.scale.forEach(value => {
      if (typeof value === 'number' && value > 0) values.push(value);
    });
  }

  return values;
}

/**
 * Calculate spacing similarity (0-1)
 */
function calculateSpacingSimilarity(
  spacing1: SpacingExtraction,
  spacing2: SpacingExtraction
): number {
  const values1 = getAllSpacingValues(spacing1);
  const values2 = getAllSpacingValues(spacing2);

  if (values1.length === 0 || values2.length === 0) return 0.5; // Neutral if no data

  let matches = 0;
  const tolerance = HARMONY_CONFIG.spacing.valueDifferenceTolerance;

  // For each value in set 1, find closest in set 2
  for (const v1 of values1) {
    for (const v2 of values2) {
      const diff = Math.abs(v1 - v2) / v1;
      if (diff <= tolerance) {
        matches++;
        break; // Count each v1 only once
      }
    }
  }

  return matches / values1.length;
}

// ====================
// HARMONY CALCULATION
// ====================

/**
 * Calculate color harmony score between multiple references
 */
function calculateColorHarmony(references: Reference[]): {
  score: number;
  issues: HarmonyIssue[];
} {
  if (references.length < 2) {
    return { score: 100, issues: [] };
  }

  const issues: HarmonyIssue[] = [];
  let totalSimilarity = 0;
  let comparisons = 0;

  // Compare each pair of references
  for (let i = 0; i < references.length; i++) {
    for (let j = i + 1; j < references.length; j++) {
      const ref1 = references[i];
      const ref2 = references[j];

      const colors1 = getAllColors(ref1.tokens.colors);
      const colors2 = getAllColors(ref2.tokens.colors);

      let compatiblePairs = 0;
      let totalPairs = 0;

      // Compare all color pairs
      for (const c1 of colors1) {
        for (const c2 of colors2) {
          totalPairs++;
          if (areColorsCompatible(c1, c2)) {
            compatiblePairs++;
          }
        }
      }

      const similarity = totalPairs > 0 ? compatiblePairs / totalPairs : 0;
      totalSimilarity += similarity;
      comparisons++;

      // Create issue if similarity is too low
      if (similarity < HARMONY_CONFIG.color.minPaletteOverlap) {
        issues.push({
          type: 'color_clash',
          severity: similarity < 0.15 ? 'high' : similarity < 0.25 ? 'medium' : 'low',
          description: `Color palettes from "${ref1.name}" and "${ref2.name}" have limited compatibility (${Math.round(similarity * 100)}%)`,
          affectedSections: [], // Will be populated by caller if needed
        });
      }
    }
  }

  const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 1;
  const score = Math.round(avgSimilarity * 100);

  return { score, issues };
}

/**
 * Calculate typography harmony score between multiple references
 */
function calculateTypographyHarmony(references: Reference[]): {
  score: number;
  issues: HarmonyIssue[];
} {
  if (references.length < 2) {
    return { score: 100, issues: [] };
  }

  const issues: HarmonyIssue[] = [];
  let totalSimilarity = 0;
  let comparisons = 0;

  // Compare each pair of references
  for (let i = 0; i < references.length; i++) {
    for (let j = i + 1; j < references.length; j++) {
      const ref1 = references[i];
      const ref2 = references[j];

      const similarity = calculateTypographySimilarity(
        ref1.tokens.typography,
        ref2.tokens.typography
      );

      totalSimilarity += similarity;
      comparisons++;

      // Create issue if similarity is too low
      if (similarity < HARMONY_CONFIG.typography.minScaleMatches) {
        issues.push({
          type: 'typography_mismatch',
          severity: similarity < 0.3 ? 'high' : similarity < 0.45 ? 'medium' : 'low',
          description: `Typography systems from "${ref1.name}" and "${ref2.name}" differ significantly (${Math.round(similarity * 100)}% match)`,
          affectedSections: [],
        });
      }
    }
  }

  const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 1;
  const score = Math.round(avgSimilarity * 100);

  return { score, issues };
}

/**
 * Calculate spacing harmony score between multiple references
 */
function calculateSpacingHarmony(references: Reference[]): {
  score: number;
  issues: HarmonyIssue[];
} {
  if (references.length < 2) {
    return { score: 100, issues: [] };
  }

  const issues: HarmonyIssue[] = [];
  let totalSimilarity = 0;
  let comparisons = 0;

  // Compare each pair of references
  for (let i = 0; i < references.length; i++) {
    for (let j = i + 1; j < references.length; j++) {
      const ref1 = references[i];
      const ref2 = references[j];

      const similarity = calculateSpacingSimilarity(
        ref1.tokens.spacing,
        ref2.tokens.spacing
      );

      totalSimilarity += similarity;
      comparisons++;

      // Create issue if similarity is too low
      if (similarity < HARMONY_CONFIG.spacing.minValueMatches) {
        issues.push({
          type: 'spacing_inconsistent',
          severity: similarity < 0.25 ? 'high' : similarity < 0.35 ? 'medium' : 'low',
          description: `Spacing systems from "${ref1.name}" and "${ref2.name}" are inconsistent (${Math.round(similarity * 100)}% match)`,
          affectedSections: [],
        });
      }
    }
  }

  const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 1;
  const score = Math.round(avgSimilarity * 100);

  return { score, issues };
}

// ====================
// VALIDATION UTILITIES
// ====================

/**
 * Check if references are ready for harmony analysis
 */
export function canCalculateHarmony(references: Reference[]): boolean {
  if (references.length < 2) return false;

  return references.every(ref => {
    return (
      ref.status === 'ready' &&
      ref.tokens &&
      ref.tokens.colors &&
      ref.tokens.typography &&
      ref.tokens.spacing
    );
  });
}

/**
 * Get references used in a section mapping
 */
export function getUsedReferences(
  sectionMapping: SectionMapping,
  allReferences: Reference[]
): Reference[] {
  const usedReferences = new Set<Reference>();

  Object.values(sectionMapping).forEach(refId => {
    if (!refId) return;

    // Support both UUID-based and index-based referenceId
    const referenceIndex = parseInt(refId, 10);
    if (!isNaN(referenceIndex) && referenceIndex >= 0 && referenceIndex < allReferences.length) {
      // Use index to get reference
      usedReferences.add(allReferences[referenceIndex]);
    } else {
      // Use as UUID to find reference
      const ref = allReferences.find(r => r.id === refId);
      if (ref) usedReferences.add(ref);
    }
  });

  return Array.from(usedReferences);
}

/**
 * Get affected sections for a pair of references
 */
function getAffectedSections(
  ref1Id: string,
  ref2Id: string,
  sectionMapping: SectionMapping,
  allReferences?: Reference[]
): SectionType[] {
  const sections: SectionType[] = [];

  for (const [sectionType, refId] of Object.entries(sectionMapping)) {
    // Direct ID match
    if (refId === ref1Id || refId === ref2Id) {
      sections.push(sectionType as SectionType);
      continue;
    }

    // If refId is an index, resolve it to actual ID and compare
    if (allReferences) {
      const referenceIndex = parseInt(refId, 10);
      if (!isNaN(referenceIndex) && referenceIndex >= 0 && referenceIndex < allReferences.length) {
        const resolvedId = allReferences[referenceIndex].id;
        if (resolvedId === ref1Id || resolvedId === ref2Id) {
          sections.push(sectionType as SectionType);
        }
      }
    }
  }

  return sections;
}

// ====================
// SUGGESTIONS
// ====================

/**
 * Generate suggestions based on issues
 */
function generateSuggestions(
  issues: HarmonyIssue[],
  breakdown: HarmonyBreakdown
): string[] {
  const suggestions: string[] = [];

  // Color suggestions
  const colorIssues = issues.filter(i => i.type === 'color_clash');
  if (colorIssues.length > 0 || breakdown.color < 70) {
    suggestions.push('Consider selecting a single reference as the primary color source');
    suggestions.push('Use neutral colors (grays, whites) as a common ground between sections');
  }

  // Typography suggestions
  const typoIssues = issues.filter(i => i.type === 'typography_mismatch');
  if (typoIssues.length > 0 || breakdown.typography < 70) {
    suggestions.push('Choose one reference to provide the base typography system');
    suggestions.push('Ensure heading and body fonts are consistent across sections');
  }

  // Spacing suggestions
  const spacingIssues = issues.filter(i => i.type === 'spacing_inconsistent');
  if (spacingIssues.length > 0 || breakdown.spacing < 70) {
    suggestions.push('Normalize spacing values by selecting a primary token source');
    suggestions.push('Use consistent padding and margin values between sections');
  }

  // Overall suggestions
  if (breakdown.overall < 60) {
    suggestions.push('These references have significantly different design systems');
    suggestions.push('Consider choosing references with more similar visual styles');
  } else if (breakdown.overall >= 85) {
    suggestions.push('These references work well together!');
  }

  return suggestions;
}

// ====================
// MAIN FUNCTIONS
// ====================

/**
 * Calculate visual harmony between multiple references
 *
 * @param references - Array of processed references to analyze
 * @param sectionMapping - Optional mapping to identify affected sections
 * @param options - Optional configuration for harmony calculation
 * @returns Detailed harmony analysis with score, issues, and suggestions
 */
export function calculateHarmony(
  references: Reference[],
  sectionMapping?: SectionMapping,
  options: HarmonyCheckOptions = {}
): DetailedHarmonyResult {
  // Validate inputs
  if (!canCalculateHarmony(references)) {
    return {
      score: 0,
      breakdown: { color: 0, typography: 0, spacing: 0, overall: 0 },
      issues: [{
        type: 'color_clash',
        severity: 'high',
        description: 'Insufficient references or references not ready for analysis',
        affectedSections: [],
      }],
      suggestions: ['Ensure all references are processed successfully', 'Add at least 2 valid references'],
      referencesAnalyzed: [],
      sectionsAnalyzed: [],
    };
  }

  // Apply default options
  const weights = {
    color: options.colorWeight ?? HARMONY_CONFIG.defaultWeights.color,
    typography: options.typographyWeight ?? HARMONY_CONFIG.defaultWeights.typography,
    spacing: options.spacingWeight ?? HARMONY_CONFIG.defaultWeights.spacing,
  };

  // Calculate individual scores
  const colorResult = calculateColorHarmony(references);
  const typographyResult = calculateTypographyHarmony(references);
  const spacingResult = calculateSpacingHarmony(references);

  // Combine issues
  const allIssues = [
    ...colorResult.issues,
    ...typographyResult.issues,
    ...spacingResult.issues,
  ];

  // Add affected sections to issues if mapping provided
  if (sectionMapping) {
    allIssues.forEach(issue => {
      // Find references mentioned in the description
      const mentionedRefs = references.filter(ref =>
        issue.description.includes(`"${ref.name}"`)
      );

      if (mentionedRefs.length === 2) {
        issue.affectedSections = getAffectedSections(
          mentionedRefs[0].id,
          mentionedRefs[1].id,
          sectionMapping,
          references
        );
      }
    });
  }

  // Calculate weighted overall score
  const overallScore = Math.round(
    colorResult.score * weights.color +
    typographyResult.score * weights.typography +
    spacingResult.score * weights.spacing
  );

  const breakdown: HarmonyBreakdown = {
    color: colorResult.score,
    typography: typographyResult.score,
    spacing: spacingResult.score,
    overall: overallScore,
  };

  // Generate suggestions
  const suggestions = generateSuggestions(allIssues, breakdown);

  // Extract analyzed data
  const referencesAnalyzed = references.map(ref => ref.name);
  const sectionsAnalyzed = sectionMapping
    ? (Object.keys(sectionMapping) as SectionType[])
    : [];

  return {
    score: overallScore,
    breakdown,
    issues: allIssues,
    suggestions,
    referencesAnalyzed,
    sectionsAnalyzed,
  };
}

/**
 * Quick harmony check - returns just the score
 *
 * @param references - Array of processed references
 * @returns Harmony score (0-100)
 */
export function getHarmonyScore(references: Reference[]): number {
  const result = calculateHarmony(references);
  return result.score;
}

/**
 * Check if harmony score meets a threshold
 *
 * @param references - Array of processed references
 * @param threshold - Minimum acceptable score (0-100)
 * @returns True if harmony meets or exceeds threshold
 */
export function meetsHarmonyThreshold(
  references: Reference[],
  threshold: number
): boolean {
  const score = getHarmonyScore(references);
  return score >= threshold;
}

// ====================
// EXPORTS
// ====================

export { HARMONY_CONFIG };
