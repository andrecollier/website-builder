/**
 * Page Assembler Module
 *
 * This module provides functionality for combining approved components into
 * complete HTML pages with proper structure. It handles:
 * - Loading approved components from the database
 * - Ordering components by their designated sequence
 * - Generating semantic HTML structure (header, main, footer)
 * - Applying design system styles
 * - Generating complete page layouts ready for export
 *
 * Coordinates with:
 * - database client: For loading approved components and variants
 * - design system: For applying consistent styling
 * - asset handler: For managing images and assets
 * - interactivity generator: For adding JavaScript functionality
 */

import type { ComponentType, DesignSystem } from '@/types';
import {
  getDb,
  type ComponentRecord,
  type VariantRecord,
} from '@/lib/db/client';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Phase of the page assembly process
 */
export type AssemblyPhase =
  | 'initializing'
  | 'loading_components'
  | 'validating'
  | 'ordering'
  | 'assembling'
  | 'complete';

/**
 * Progress update for the assembly process
 */
export interface AssemblyProgress {
  phase: AssemblyPhase;
  percent: number;
  message: string;
  currentComponent?: number;
  totalComponents?: number;
}

/**
 * Options for the page assembly process
 */
export interface AssemblyOptions {
  /** Website ID to assemble */
  websiteId: string;
  /** Version ID for component selection (defaults to active version) */
  versionId?: string;
  /** Design system tokens to apply */
  designSystem?: DesignSystem;
  /** Include only specific component types */
  includeTypes?: ComponentType[];
  /** Exclude specific component types */
  excludeTypes?: ComponentType[];
  /** Callback for progress updates */
  onProgress?: (progress: AssemblyProgress) => void;
  /** Skip validation checks (default: false) */
  skipValidation?: boolean;
}

/**
 * Assembled component ready for page insertion
 */
export interface AssembledComponent {
  id: string;
  type: ComponentType;
  name: string;
  order: number;
  html: string;
  metadata: {
    variantUsed: string;
    hasCustomCode: boolean;
    accuracyScore: number | null;
  };
}

/**
 * Complete page structure
 */
export interface PageStructure {
  header: AssembledComponent | null;
  hero: AssembledComponent | null;
  sections: AssembledComponent[];
  footer: AssembledComponent | null;
}

/**
 * Result of page assembly
 */
export interface AssemblyResult {
  success: boolean;
  websiteId: string;
  versionId: string;
  structure: PageStructure;
  components: AssembledComponent[];
  metadata: {
    totalComponents: number;
    approvedComponents: number;
    averageAccuracy: number | null;
    assembledAt: string;
  };
  warnings: AssemblyWarning[];
  errors: AssemblyError[];
}

/**
 * Warning during assembly
 */
export interface AssemblyWarning {
  componentId: string;
  componentType: ComponentType;
  message: string;
  suggestion: string;
}

/**
 * Error during assembly
 */
export interface AssemblyError {
  componentId?: string;
  componentType?: ComponentType;
  phase: AssemblyPhase;
  message: string;
  recoverable: boolean;
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Create progress update helper
 */
function createProgressEmitter(onProgress?: (progress: AssemblyProgress) => void) {
  return (
    phase: AssemblyPhase,
    percent: number,
    message: string,
    componentInfo?: { current: number; total: number }
  ) => {
    if (onProgress) {
      onProgress({
        phase,
        percent,
        message,
        currentComponent: componentInfo?.current,
        totalComponents: componentInfo?.total,
      });
    }
  };
}

/**
 * Get component display name for logging
 */
function getComponentDisplayName(type: ComponentType, index: number): string {
  const typeNames: Record<ComponentType, string> = {
    header: 'Header',
    hero: 'Hero',
    features: 'Features',
    testimonials: 'Testimonials',
    pricing: 'Pricing',
    cta: 'Call to Action',
    footer: 'Footer',
    cards: 'Cards',
    gallery: 'Gallery',
    contact: 'Contact',
    faq: 'FAQ',
    stats: 'Stats',
    team: 'Team',
    logos: 'Logos',
  };
  return `${typeNames[type] || type} #${index + 1}`;
}

/**
 * Extract HTML from component code
 * Handles TSX, JSX, and plain HTML formats
 */
function extractHtmlFromCode(code: string): string {
  // If code contains JSX/TSX, extract return statement content
  const returnMatch = code.match(/return\s*\(([\s\S]*?)\);?\s*}/);
  if (returnMatch) {
    return returnMatch[1].trim();
  }

  // Check for JSX without explicit return (arrow function implicit return)
  const arrowMatch = code.match(/=>\s*\(([\s\S]*?)\)/);
  if (arrowMatch) {
    return arrowMatch[1].trim();
  }

  // If it's already HTML-like, use as-is
  if (code.trim().startsWith('<')) {
    return code.trim();
  }

  // Fallback: return empty string with warning
  return '';
}

/**
 * Check if component is a structural component (header/footer)
 */
function isStructuralComponent(type: ComponentType): boolean {
  return type === 'header' || type === 'footer';
}

/**
 * Check if component is a hero component
 */
function isHeroComponent(type: ComponentType): boolean {
  return type === 'hero';
}

// ====================
// DATABASE OPERATIONS
// ====================

/**
 * Load approved components for a website/version
 */
function loadApprovedComponents(
  websiteId: string,
  versionId?: string
): ComponentRecord[] {
  const database = getDb();

  let query = `
    SELECT * FROM components
    WHERE website_id = ? AND approved = 1 AND status = 'approved'
  `;
  const params: (string | number)[] = [websiteId];

  if (versionId) {
    query += ' AND version_id = ?';
    params.push(versionId);
  }

  query += ' ORDER BY order_index ASC';

  const stmt = database.prepare(query);
  return stmt.all(...params) as ComponentRecord[];
}

/**
 * Load the selected variant for a component
 */
function loadComponentVariant(
  componentId: string,
  variantId: string | null
): VariantRecord | null {
  const database = getDb();

  if (!variantId) {
    // If no variant selected, get the first variant (Variant A)
    const stmt = database.prepare(`
      SELECT * FROM component_variants
      WHERE component_id = ?
      ORDER BY variant_name ASC
      LIMIT 1
    `);
    return stmt.get(componentId) as VariantRecord | null;
  }

  const stmt = database.prepare(`
    SELECT * FROM component_variants
    WHERE component_id = ? AND id = ?
  `);
  return stmt.get(componentId, variantId) as VariantRecord | null;
}

/**
 * Get the active version ID for a website
 */
function getActiveVersionId(websiteId: string): string | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id FROM versions
    WHERE website_id = ? AND is_active = 1
    LIMIT 1
  `);
  const result = stmt.get(websiteId) as { id: string } | undefined;
  return result?.id || null;
}

// ====================
// VALIDATION
// ====================

/**
 * Validate assembled components for completeness
 */
function validateComponents(
  components: AssembledComponent[]
): AssemblyWarning[] {
  const warnings: AssemblyWarning[] = [];
  const typesSeen = new Set<ComponentType>();

  // Check for duplicates of structural components
  for (const component of components) {
    if (isStructuralComponent(component.type)) {
      if (typesSeen.has(component.type)) {
        warnings.push({
          componentId: component.id,
          componentType: component.type,
          message: `Multiple ${component.type} components detected`,
          suggestion: `Consider keeping only one ${component.type} component for proper page structure`,
        });
      }
    }
    typesSeen.add(component.type);
  }

  // Check if header/footer exist
  if (!typesSeen.has('header')) {
    warnings.push({
      componentId: '',
      componentType: 'header',
      message: 'No header component found',
      suggestion: 'Consider adding a header for consistent navigation',
    });
  }

  if (!typesSeen.has('footer')) {
    warnings.push({
      componentId: '',
      componentType: 'footer',
      message: 'No footer component found',
      suggestion: 'Consider adding a footer for copyright and links',
    });
  }

  // Check for empty HTML
  for (const component of components) {
    if (!component.html || component.html.trim().length === 0) {
      warnings.push({
        componentId: component.id,
        componentType: component.type,
        message: `Component ${component.name} has no HTML content`,
        suggestion: 'Review the component code and ensure it generates valid HTML',
      });
    }
  }

  return warnings;
}

// ====================
// ASSEMBLY OPERATIONS
// ====================

/**
 * Assemble a single component from database record
 */
function assembleComponent(
  component: ComponentRecord,
  variant: VariantRecord | null
): AssembledComponent | null {
  if (!variant) {
    return null;
  }

  // Use custom code if available, otherwise use variant code
  const code = component.custom_code || variant.code;
  const html = extractHtmlFromCode(code);

  return {
    id: component.id,
    type: component.type,
    name: component.name,
    order: component.order_index,
    html,
    metadata: {
      variantUsed: variant.id,
      hasCustomCode: !!component.custom_code,
      accuracyScore: component.accuracy_score,
    },
  };
}

/**
 * Organize components into page structure
 */
function organizePageStructure(
  components: AssembledComponent[]
): PageStructure {
  const structure: PageStructure = {
    header: null,
    hero: null,
    sections: [],
    footer: null,
  };

  for (const component of components) {
    if (component.type === 'header') {
      // Use the first header found
      if (!structure.header) {
        structure.header = component;
      }
    } else if (component.type === 'footer') {
      // Use the last footer found (or first if none exists)
      structure.footer = component;
    } else if (component.type === 'hero') {
      // Use the first hero found
      if (!structure.hero) {
        structure.hero = component;
      } else {
        // Additional heroes go to sections
        structure.sections.push(component);
      }
    } else {
      // All other components go to sections
      structure.sections.push(component);
    }
  }

  return structure;
}

/**
 * Calculate average accuracy score
 */
function calculateAverageAccuracy(
  components: AssembledComponent[]
): number | null {
  const scores = components
    .map((c) => c.metadata.accuracyScore)
    .filter((s): s is number => s !== null);

  if (scores.length === 0) {
    return null;
  }

  const sum = scores.reduce((acc, score) => acc + score, 0);
  return sum / scores.length;
}

// ====================
// MAIN ASSEMBLY FUNCTION
// ====================

/**
 * Assemble a complete page from approved components
 */
export async function assemblePage(
  options: AssemblyOptions
): Promise<AssemblyResult> {
  const {
    websiteId,
    versionId: providedVersionId,
    includeTypes,
    excludeTypes,
    onProgress,
    skipValidation = false,
  } = options;

  const emitProgress = createProgressEmitter(onProgress);
  const warnings: AssemblyWarning[] = [];
  const errors: AssemblyError[] = [];

  try {
    // Initialize
    emitProgress('initializing', 0, 'Initializing page assembly...');

    // Determine version ID
    let versionId = providedVersionId;
    if (!versionId) {
      versionId = getActiveVersionId(websiteId);
      if (!versionId) {
        throw new Error('No active version found for website');
      }
    }

    // Load components
    emitProgress('loading_components', 10, 'Loading approved components from database...');
    let componentRecords = loadApprovedComponents(websiteId, versionId);

    if (componentRecords.length === 0) {
      errors.push({
        phase: 'loading_components',
        message: 'No approved components found for assembly',
        recoverable: false,
      });

      return {
        success: false,
        websiteId,
        versionId: versionId || '',
        structure: {
          header: null,
          hero: null,
          sections: [],
          footer: null,
        },
        components: [],
        metadata: {
          totalComponents: 0,
          approvedComponents: 0,
          averageAccuracy: null,
          assembledAt: new Date().toISOString(),
        },
        warnings: [],
        errors,
      };
    }

    // Filter by include/exclude types
    if (includeTypes && includeTypes.length > 0) {
      componentRecords = componentRecords.filter((c) =>
        includeTypes.includes(c.type)
      );
    }
    if (excludeTypes && excludeTypes.length > 0) {
      componentRecords = componentRecords.filter(
        (c) => !excludeTypes.includes(c.type)
      );
    }

    // Validate ordering
    emitProgress('validating', 20, 'Validating component order...');
    const orderIndices = componentRecords.map((c) => c.order_index);
    const hasDuplicates = new Set(orderIndices).size !== orderIndices.length;
    if (hasDuplicates) {
      warnings.push({
        componentId: '',
        componentType: 'header',
        message: 'Duplicate order indices detected',
        suggestion: 'Components may not appear in the intended order',
      });
    }

    // Assemble components
    emitProgress('assembling', 30, 'Assembling components...');
    const assembled: AssembledComponent[] = [];

    for (let i = 0; i < componentRecords.length; i++) {
      const component = componentRecords[i];
      const progress = 30 + ((i / componentRecords.length) * 60);

      emitProgress(
        'assembling',
        progress,
        `Assembling ${getComponentDisplayName(component.type, i)}...`,
        { current: i + 1, total: componentRecords.length }
      );

      // Load variant
      const variant = loadComponentVariant(
        component.id,
        component.selected_variant
      );

      if (!variant) {
        warnings.push({
          componentId: component.id,
          componentType: component.type,
          message: `No variant found for ${component.name}`,
          suggestion: 'Component will be skipped in assembly',
        });
        continue;
      }

      // Assemble component
      const assembledComponent = assembleComponent(component, variant);

      if (!assembledComponent) {
        warnings.push({
          componentId: component.id,
          componentType: component.type,
          message: `Failed to assemble ${component.name}`,
          suggestion: 'Check component code for errors',
        });
        continue;
      }

      assembled.push(assembledComponent);
    }

    // Validate assembled components
    if (!skipValidation) {
      emitProgress('validating', 90, 'Validating assembled components...');
      const validationWarnings = validateComponents(assembled);
      warnings.push(...validationWarnings);
    }

    // Organize into page structure
    emitProgress('ordering', 95, 'Organizing page structure...');
    const structure = organizePageStructure(assembled);

    // Calculate metadata
    const averageAccuracy = calculateAverageAccuracy(assembled);

    // Complete
    emitProgress('complete', 100, 'Page assembly complete');

    return {
      success: true,
      websiteId,
      versionId,
      structure,
      components: assembled,
      metadata: {
        totalComponents: componentRecords.length,
        approvedComponents: assembled.length,
        averageAccuracy,
        assembledAt: new Date().toISOString(),
      },
      warnings,
      errors: [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    errors.push({
      phase: 'initializing',
      message: `Assembly failed: ${errorMessage}`,
      recoverable: false,
    });

    return {
      success: false,
      websiteId,
      versionId: providedVersionId || '',
      structure: {
        header: null,
        hero: null,
        sections: [],
        footer: null,
      },
      components: [],
      metadata: {
        totalComponents: 0,
        approvedComponents: 0,
        averageAccuracy: null,
        assembledAt: new Date().toISOString(),
      },
      warnings,
      errors,
    };
  }
}

/**
 * Get page structure for a website without full assembly
 * Useful for previewing component organization
 */
export function getPageStructure(
  websiteId: string,
  versionId?: string
): PageStructure {
  const componentRecords = loadApprovedComponents(websiteId, versionId);

  // Create minimal assembled components (without HTML)
  const components: AssembledComponent[] = componentRecords.map((c) => ({
    id: c.id,
    type: c.type,
    name: c.name,
    order: c.order_index,
    html: '',
    metadata: {
      variantUsed: c.selected_variant || '',
      hasCustomCode: !!c.custom_code,
      accuracyScore: c.accuracy_score,
    },
  }));

  return organizePageStructure(components);
}

/**
 * Validate components without assembling
 * Returns list of warnings that would occur during assembly
 */
export function validateComponentsForAssembly(
  websiteId: string,
  versionId?: string
): AssemblyWarning[] {
  const componentRecords = loadApprovedComponents(websiteId, versionId);

  // Create minimal assembled components
  const components: AssembledComponent[] = componentRecords.map((c) => ({
    id: c.id,
    type: c.type,
    name: c.name,
    order: c.order_index,
    html: '<div></div>', // Placeholder to pass empty check
    metadata: {
      variantUsed: c.selected_variant || '',
      hasCustomCode: !!c.custom_code,
      accuracyScore: c.accuracy_score,
    },
  }));

  return validateComponents(components);
}
