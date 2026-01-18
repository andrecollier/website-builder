/**
 * Generator Module Exports
 *
 * Complete component generation pipeline including:
 * - Component detection with selector patterns for all component types
 * - Variant generation with 3 strategies (pixel-perfect, semantic, modernized)
 * - Component generator orchestration for full pipeline execution
 * - File system operations for saving generated components
 * - Database persistence for component and variant metadata
 */

// ====================
// COMPONENT DETECTOR
// ====================

export {
  COMPONENT_SELECTORS,
  COMPONENT_ORDER,
  detectComponents,
  detectGenericComponents,
  detectAllComponents,
  getComponentDisplayName,
  isPrimarySectionType,
  getMinHeightForType,
} from './component-detector';

// ====================
// VARIANT GENERATOR
// ====================

export {
  componentTypeToName,
  generateVariants,
  generateVariantsWithMetadata,
  hasValidVariants,
  getVariantByName,
  getVariantByStrategy,
  getAvailableStrategies,
  getVariantConfig,
  type VariantStrategy,
  type VariantConfig,
  type GenerateVariantsOptions,
  type VariantGenerationResult,
} from './variant-generator';

// ====================
// COMPONENT GENERATOR
// ====================

export {
  generateComponents,
  retryComponent,
  getOutputDirectories,
  hasGeneratedComponents,
  getGeneratedComponentTypes,
  type GenerationPhase,
  type GenerationProgress,
  type GeneratorOptions,
  type GeneratorResult,
  type GenerationError,
  type DetectedComponent,
  type GeneratedComponent,
  type ComponentVariant,
} from './component-generator';

// ====================
// AI GENERATOR (Phase B)
// ====================

export {
  generateComponentWithAI,
  isAIGenerationAvailable,
  estimateTokens,
  type AIGenerationInput,
  type AIGenerationResult,
} from './ai-generator';

// ====================
// REFINEMENT LOOP (Phase C)
// ====================

export {
  generateUntilPerfect,
  refineAllComponents,
  generateRefinementReport,
  type RefinementInput,
  type RefinementProgress,
  type RefinementAttempt,
  type RefinementResult,
} from './refinement-loop';

// ====================
// DESIGN SYSTEM INJECTOR (Phase D)
// ====================

export {
  generateCSSVariables,
  generateUtilityClasses,
  generateFullCSS,
  generateTailwindConfig,
  injectDesignTokens,
  isColorDark,
  getContrastingTextColor,
  mergeWithDefaults,
  type CSSOutput,
  type TailwindConfigExtension,
} from './design-system-injector';
