/**
 * Design Token Merger Module
 *
 * Merges design tokens from multiple reference sources into a unified DesignSystem.
 * Supports base token selection with selective overrides from other references.
 * This enables the Template Mode to create visually cohesive mixed-source websites.
 */

import type {
  DesignSystem,
  ColorExtraction,
  TypographyExtraction,
  SpacingExtraction,
  EffectsExtraction,
  MergeStrategy,
  TokenOverride,
  Reference,
} from '@/types';

// ====================
// TYPES
// ====================

/**
 * Input for token merging operation
 */
export interface MergeTokensInput {
  /** All available references with their extracted tokens */
  references: Reference[];
  /** Strategy defining base reference and overrides */
  strategy: MergeStrategy;
}

/**
 * Result of token merge operation
 */
export interface MergeTokensResult {
  /** Unified design system with merged tokens */
  designSystem: DesignSystem;
  /** List of applied overrides for debugging */
  appliedOverrides: string[];
  /** List of overrides that failed to apply */
  failedOverrides: string[];
  /** Warnings during merge process */
  warnings: string[];
}

/**
 * Options for customizing merge behavior
 */
export interface MergeOptions {
  /** Allow partial path matches (e.g., "colors" matches all color tokens) */
  allowPartialPaths?: boolean;
  /** Strict mode - fail on any override errors instead of continuing */
  strict?: boolean;
  /** Custom merge timestamp (defaults to current time) */
  timestamp?: string;
}

// ====================
// CONFIGURATION
// ====================

const MERGER_CONFIG = {
  /** Default version for merged design systems */
  defaultVersion: 1,
  /** Supported token paths for overrides */
  supportedPaths: {
    colors: ['primary', 'secondary', 'neutral', 'semantic', 'palettes'],
    typography: ['fonts', 'scale', 'weights', 'lineHeights'],
    spacing: ['baseUnit', 'scale', 'containerMaxWidth', 'sectionPadding'],
    effects: ['shadows', 'radii', 'transitions'],
  },
} as const;

// ====================
// VALIDATION UTILITIES
// ====================

/**
 * Validate that a reference exists in the provided list
 */
export function validateReferenceExists(
  references: Reference[],
  referenceId: string
): boolean {
  return references.some((ref) => ref.id === referenceId);
}

/**
 * Validate merge strategy has required fields and valid references
 */
export function validateMergeStrategy(
  strategy: MergeStrategy,
  references: Reference[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!strategy.base) {
    errors.push('Merge strategy must specify a base reference ID');
  } else if (!validateReferenceExists(references, strategy.base)) {
    errors.push(`Base reference "${strategy.base}" not found in available references`);
  }

  if (!strategy.overrides || !Array.isArray(strategy.overrides)) {
    errors.push('Merge strategy must include an overrides array');
  } else {
    strategy.overrides.forEach((override, index) => {
      if (!override.referenceId) {
        errors.push(`Override at index ${index} missing referenceId`);
      } else if (!validateReferenceExists(references, override.referenceId)) {
        errors.push(`Override reference "${override.referenceId}" not found`);
      }

      if (!override.path) {
        errors.push(`Override at index ${index} missing path`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that all references have ready status with valid tokens
 */
export function validateReferencesReady(references: Reference[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  references.forEach((ref) => {
    if (ref.status !== 'ready') {
      errors.push(`Reference "${ref.id}" (${ref.url}) is not ready (status: ${ref.status})`);
    }

    if (!ref.tokens) {
      errors.push(`Reference "${ref.id}" (${ref.url}) has no tokens`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ====================
// PATH UTILITIES
// ====================

/**
 * Parse a token path into segments
 * Example: "colors.primary" -> ["colors", "primary"]
 */
export function parseTokenPath(path: string): string[] {
  return path.split('.').filter((segment) => segment.length > 0);
}

/**
 * Get value from nested object using path
 * Example: getValueAtPath(obj, ["colors", "primary"]) -> obj.colors.primary
 */
export function getValueAtPath(obj: unknown, pathSegments: string[]): unknown {
  let current: any = obj;

  for (const segment of pathSegments) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}

/**
 * Set value in nested object using path
 * Mutates the object in place
 */
export function setValueAtPath(obj: any, pathSegments: string[], value: unknown): boolean {
  if (pathSegments.length === 0) {
    return false;
  }

  let current = obj;

  // Navigate to parent of target
  for (let i = 0; i < pathSegments.length - 1; i++) {
    const segment = pathSegments[i];

    if (current[segment] === undefined || current[segment] === null) {
      // Create intermediate objects as needed
      current[segment] = {};
    }

    current = current[segment];
  }

  // Set the final value
  const finalSegment = pathSegments[pathSegments.length - 1];
  current[finalSegment] = value;
  return true;
}

/**
 * Deep clone an object (for immutable operations)
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ====================
// OVERRIDE APPLICATION
// ====================

/**
 * Apply a single override to the merged design system
 */
export function applyOverride(
  designSystem: DesignSystem,
  override: TokenOverride,
  references: Reference[],
  options: MergeOptions
): { success: boolean; error?: string } {
  // Find the reference that contains the override value
  const sourceRef = references.find((ref) => ref.id === override.referenceId);

  if (!sourceRef) {
    return { success: false, error: `Reference "${override.referenceId}" not found` };
  }

  // Parse the path
  const pathSegments = parseTokenPath(override.path);

  if (pathSegments.length === 0) {
    return { success: false, error: `Invalid path: "${override.path}"` };
  }

  // Get the value from source reference tokens
  const sourceValue = override.value !== undefined
    ? override.value
    : getValueAtPath(sourceRef.tokens, pathSegments);

  if (sourceValue === undefined) {
    return {
      success: false,
      error: `Value not found at path "${override.path}" in reference "${override.referenceId}"`,
    };
  }

  // Apply the override to the design system
  const success = setValueAtPath(designSystem, pathSegments, deepClone(sourceValue));

  if (!success) {
    return { success: false, error: `Failed to set value at path "${override.path}"` };
  }

  return { success: true };
}

// ====================
// MAIN MERGE FUNCTION
// ====================

/**
 * Merge design tokens from multiple references into a unified DesignSystem
 *
 * Takes a base reference as the foundation and applies selective overrides
 * from other references to create a cohesive mixed design system.
 *
 * @param input - References and merge strategy
 * @param options - Optional merge behavior customization
 * @returns Merged design system with metadata about applied overrides
 */
export function mergeTokens(
  input: MergeTokensInput,
  options: MergeOptions = {}
): MergeTokensResult {
  const { references, strategy } = input;
  const appliedOverrides: string[] = [];
  const failedOverrides: string[] = [];
  const warnings: string[] = [];

  // Validate inputs
  const strategyValidation = validateMergeStrategy(strategy, references);
  if (!strategyValidation.isValid) {
    throw new Error(`Invalid merge strategy: ${strategyValidation.errors.join(', ')}`);
  }

  const referencesValidation = validateReferencesReady(references);
  if (!referencesValidation.isValid) {
    if (options.strict) {
      throw new Error(`References not ready: ${referencesValidation.errors.join(', ')}`);
    }
    warnings.push(...referencesValidation.errors);
  }

  // Get base reference
  const baseRef = references.find((ref) => ref.id === strategy.base);

  if (!baseRef) {
    throw new Error(`Base reference "${strategy.base}" not found`);
  }

  if (!baseRef.tokens) {
    throw new Error(`Base reference "${strategy.base}" has no tokens`);
  }

  // Start with a deep clone of the base reference tokens
  const mergedSystem: DesignSystem = deepClone(baseRef.tokens);

  // Update metadata for merged system
  mergedSystem.meta = {
    sourceUrl: `merged:${references.map((r) => r.id).join(',')}`,
    extractedAt: options.timestamp || new Date().toISOString(),
    version: MERGER_CONFIG.defaultVersion,
  };

  // Apply overrides
  for (const override of strategy.overrides) {
    const result = applyOverride(mergedSystem, override, references, options);

    if (result.success) {
      appliedOverrides.push(override.path);
    } else {
      const errorMsg = `${override.path}: ${result.error}`;
      failedOverrides.push(errorMsg);

      if (options.strict) {
        throw new Error(`Failed to apply override: ${errorMsg}`);
      } else {
        warnings.push(`Skipped override: ${errorMsg}`);
      }
    }
  }

  return {
    designSystem: mergedSystem,
    appliedOverrides,
    failedOverrides,
    warnings,
  };
}

/**
 * Helper function to merge tokens from references map
 * Extracts references from a map where keys are reference IDs
 */
export function mergeTokensFromMap(
  referencesMap: Record<string, Reference>,
  strategy: MergeStrategy,
  options?: MergeOptions
): MergeTokensResult {
  const references = Object.values(referencesMap);
  return mergeTokens({ references, strategy }, options);
}

/**
 * Create a simple merge strategy with base and optional full-system overrides
 * Useful for simple cases where you want to use one reference's entire token category
 */
export function createSimpleMergeStrategy(
  baseReferenceId: string,
  overrides?: {
    colors?: string;
    typography?: string;
    spacing?: string;
    effects?: string;
  }
): MergeStrategy {
  const tokenOverrides: TokenOverride[] = [];

  if (overrides) {
    if (overrides.colors) {
      tokenOverrides.push({
        referenceId: overrides.colors,
        path: 'colors',
        value: undefined,
      });
    }

    if (overrides.typography) {
      tokenOverrides.push({
        referenceId: overrides.typography,
        path: 'typography',
        value: undefined,
      });
    }

    if (overrides.spacing) {
      tokenOverrides.push({
        referenceId: overrides.spacing,
        path: 'spacing',
        value: undefined,
      });
    }

    if (overrides.effects) {
      tokenOverrides.push({
        referenceId: overrides.effects,
        path: 'effects',
        value: undefined,
      });
    }
  }

  return {
    base: baseReferenceId,
    overrides: tokenOverrides,
  };
}

// ====================
// EXPORTS
// ====================

export {
  type DesignSystem,
  type ColorExtraction,
  type TypographyExtraction,
  type SpacingExtraction,
  type EffectsExtraction,
  type MergeStrategy,
  type TokenOverride,
  type Reference,
};
