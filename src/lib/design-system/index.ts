/**
 * Design System Module Exports
 *
 * Complete design token extraction pipeline including:
 * - Color extraction with WCAG contrast and palette generation
 * - Typography extraction with font scale and weights
 * - Spacing extraction with grid detection
 * - Effects extraction with shadows, radii, and transitions
 * - Synthesizer to combine all extractions into a unified DesignSystem
 * - Tailwind config generator for tailwind.config.js output
 * - CSS variables generator for custom properties output
 */

// ====================
// COLOR EXTRACTOR
// ====================

export {
  normalizeColor,
  isNeutralColor,
  getColorHue,
  colorDistance,
  deduplicateColors,
  calculateContrast,
  checkWcagCompliance,
  getContrastResult,
  generatePalette,
  generateColorName,
  findSemanticColor,
  categorizeColors,
  extractColors,
  getDefaultColorExtraction,
  type RawColorData,
  type ColorWithFrequency,
  type ContrastResult,
} from './color-extractor';

// ====================
// TYPOGRAPHY EXTRACTOR
// ====================

export {
  pxToRem,
  remToPx,
  parseFontSize,
  parseLineHeight,
  parseFontWeight,
  normalizeFontFamily,
  isMonospaceFont,
  isHeadingTag,
  isBodyTag,
  extractFonts,
  extractSizeScale,
  extractWeights,
  extractLineHeights,
  extractTypography,
  getDefaultTypographyExtraction,
  type RawTypographyData,
  type FontWithUsage,
  type SizeWithContext,
} from './typography-extractor';

// ====================
// SPACING EXTRACTOR
// ====================

export {
  parseSpacingValue,
  parseMaxWidth,
  parsePaddingShorthand,
  roundToBaseUnit,
  alignsWithBaseUnit,
  calculateAlignmentScore,
  detectBaseUnit,
  generateSpacingScale,
  detectContainerMaxWidth,
  detectSectionPadding,
  extractSpacing,
  getDefaultSpacingExtraction,
  type RawSpacingData,
  type SpacingValue,
  type ContainerCandidate,
} from './spacing-extractor';

// ====================
// EFFECTS EXTRACTOR
// ====================

export {
  parseShadowBlurRadius,
  normalizeShadow,
  parseRadius,
  parseTransitionDuration,
  extractTransitionDuration,
  formatDuration,
  formatRadius,
  categorizeShadows,
  categorizeRadii,
  categorizeTransitions,
  extractEffects,
  getDefaultEffectsExtraction,
  type RawEffectsData,
  type ShadowValue,
  type RadiusValue,
  type TransitionValue,
} from './effects-extractor';

// ====================
// SYNTHESIZER
// ====================

export {
  hasValidColorData,
  hasValidTypographyData,
  hasValidSpacingData,
  hasValidEffectsData,
  validateRawPageData,
  generateMeta,
  synthesizeDesignSystem,
  combineExtractions,
  getDefaultDesignSystem,
  mergeDesignSystems,
  hasDesignSystemChanged,
  cloneDesignSystem,
  type RawPageData,
  type SynthesizeOptions,
  type ValidationResult,
} from './synthesizer';

// ====================
// TAILWIND GENERATOR
// ====================

export {
  generateColors,
  generateFontFamily,
  generateFontSize,
  generateFontWeight,
  generateLineHeight,
  generateSpacing,
  generateBorderRadius,
  generateBoxShadow,
  generateTransitionDuration,
  generateThemeExtend,
  generateTailwindConfig,
  generateTailwindConfigString,
  generateTailwindConfigTsString,
  TAILWIND_GENERATOR_DEFAULTS,
  type TailwindGeneratorConfig,
  type TailwindColors,
  type TailwindThemeExtend,
  type TailwindConfig,
} from './tailwind-generator';

// ====================
// CSS GENERATOR
// ====================

export {
  toVariableName,
  hexToRgb,
  escapeCssValue,
  generateColorVariables,
  generateTypographyVariables,
  generateSpacingVariables,
  generateEffectsVariables,
  generateAllVariableGroups,
  generateCSSVariables,
  generateCSSVariablesWithDarkMode,
  generateCSSVariablesWithClassDarkMode,
  generateCSSVariablesWithReset,
  CSS_GENERATOR_DEFAULTS,
  type CSSGeneratorConfig,
  type CSSVariableGroup,
  type CSSVariable,
} from './css-generator';

// ====================
// PREVIEW
// ====================

export {
  generateDesignSystemPreview,
  generatePreviewHtml,
  formatDesignSystemReport,
  type DesignSystemPreview,
  type ColorSwatch,
  type TypographyPreview,
  type FontPreview,
  type SpacingPreview,
} from './preview';
