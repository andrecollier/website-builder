/**
 * Template Module Exports
 *
 * Complete template generation pipeline including:
 * - Reference processing with caching for efficient reuse
 * - Harmony checking for visual consistency validation
 * - Token merging to create unified design systems
 * - Template generation orchestrating all modules
 * - Database persistence for template projects
 */

// ====================
// HARMONY CHECKER
// ====================

export {
  calculateHarmony,
  getHarmonyScore,
  meetsHarmonyThreshold,
  canCalculateHarmony,
  getUsedReferences,
  HARMONY_CONFIG,
  type HarmonyCheckOptions,
  type HarmonyBreakdown,
  type DetailedHarmonyResult,
} from './harmony-checker';

// ====================
// REFERENCE PROCESSOR
// ====================

export {
  processReference,
  processReferences,
  clearReferenceCache,
  clearAllReferenceCaches,
  getReferenceCacheStats,
  generateReferenceName,
  isReferenceCacheValid,
  getCachedReference,
  extractDomain,
  type ReferenceProcessorConfig,
  type ProcessReferenceResult,
  type ReferenceCacheEntry,
} from './reference-processor';

// ====================
// TEMPLATE GENERATOR
// ====================

export {
  generateTemplate,
  loadTemplateProject,
  getResultSummary,
  type TemplateGenerationPhase,
  type TemplateGenerationProgress,
  type GenerateTemplateOptions,
  type TemplateGenerationResult,
  type TemplateGenerationError,
} from './template-generator';

// ====================
// TOKEN MERGER
// ====================

export {
  mergeTokens,
  mergeTokensFromMap,
  createSimpleMergeStrategy,
  validateReferenceExists,
  validateMergeStrategy,
  validateReferencesReady,
  parseTokenPath,
  getValueAtPath,
  setValueAtPath,
  deepClone,
  applyOverride,
  type MergeTokensInput,
  type MergeTokensResult,
  type MergeOptions,
  type DesignSystem,
  type ColorExtraction,
  type TypographyExtraction,
  type SpacingExtraction,
  type EffectsExtraction,
  type MergeStrategy,
  type TokenOverride,
  type Reference,
} from './token-merger';
