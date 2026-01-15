/**
 * Component Generator Module
 *
 * This module provides the main orchestration for component detection and variant generation.
 * It handles the complete pipeline from detecting components on a page to generating
 * code variants and saving them to the database and filesystem.
 *
 * Coordinates with:
 * - component-detector: For identifying page components
 * - variant-generator: For creating 3 code variants per component
 * - database client: For persisting component and variant data
 */

import type { Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import type {
  DetectedComponent,
  GeneratedComponent,
  ComponentVariant,
  ComponentType,
  DesignSystem,
} from '@/types';
import { CAPTURE_CONFIG } from '@/types';
import { detectAllComponents, getComponentDisplayName } from './component-detector';
import {
  generateVariantsWithMetadata,
  componentTypeToName,
  type VariantGenerationResult,
} from './variant-generator';
import {
  getDb,
  createComponent,
  createVariantsBatch,
  type ComponentInsert,
  type VariantInsert,
} from '@/lib/db/client';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Phase of the component generation process
 */
export type GenerationPhase =
  | 'initializing'
  | 'detecting'
  | 'capturing_screenshots'
  | 'generating_variants'
  | 'saving'
  | 'complete';

/**
 * Progress update for the generation process
 */
export interface GenerationProgress {
  phase: GenerationPhase;
  percent: number;
  message: string;
  currentComponent?: number;
  totalComponents?: number;
}

/**
 * Options for the component generation process
 */
export interface GeneratorOptions {
  /** Website ID for output directory naming */
  websiteId: string;
  /** Version ID for database association */
  versionId: string;
  /** Design system tokens to apply to generated code */
  designSystem?: DesignSystem;
  /** Maximum components to process (default: from CAPTURE_CONFIG) */
  maxComponents?: number;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Callback for progress updates */
  onProgress?: (progress: GenerationProgress) => void;
  /** Output directory override */
  outputDir?: string;
  /** Skip database persistence (default: false) */
  skipDatabase?: boolean;
  /** Skip screenshot capture (default: false) */
  skipScreenshots?: boolean;
}

/**
 * Result of component generation
 */
export interface GeneratorResult {
  success: boolean;
  websiteId: string;
  components: GeneratedComponent[];
  metadata: {
    detectedCount: number;
    generatedCount: number;
    failedCount: number;
    generatedAt: string;
  };
  errors: GenerationError[];
}

/**
 * Error during component generation
 */
export interface GenerationError {
  componentId?: string;
  componentType?: ComponentType;
  phase: GenerationPhase;
  message: string;
  recoverable: boolean;
}

/**
 * Result of a retry operation
 */
interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: string;
  attempts: number;
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Get the base directory for website outputs
 */
function getWebsitesBaseDir(): string {
  const envPath = process.env.WEBSITES_DIR;
  if (envPath) {
    if (envPath.startsWith('./') || envPath.startsWith('../')) {
      return path.resolve(process.cwd(), envPath);
    }
    return envPath;
  }
  return path.resolve(process.cwd(), 'Websites');
}

/**
 * Get the components directory path for a website
 */
function getComponentsDir(websiteId: string): string {
  return path.join(getWebsitesBaseDir(), websiteId, 'current', 'src', 'components');
}

/**
 * Get the reference sections directory path for a website
 */
function getSectionsDir(websiteId: string): string {
  return path.join(getWebsitesBaseDir(), websiteId, 'reference', 'sections');
}

/**
 * Ensure directory exists before writing
 */
function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Create progress update helper
 */
function createProgressEmitter(onProgress?: (progress: GenerationProgress) => void) {
  return (
    phase: GenerationPhase,
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
 * Execute a function with retry logic
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  operation: string
): Promise<RetryResult<T>> {
  let lastError: string | undefined;
  let attempts = 0;

  for (let i = 0; i < maxRetries; i++) {
    attempts++;
    try {
      const result = await fn();
      return { success: true, result, attempts };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  return {
    success: false,
    error: `${operation} failed after ${maxRetries} attempts: ${lastError}`,
    attempts,
  };
}

// ====================
// SCREENSHOT CAPTURE
// ====================

/**
 * Capture screenshot for a single component
 */
async function captureComponentScreenshot(
  page: Page,
  component: DetectedComponent,
  outputPath: string
): Promise<string> {
  ensureDirectory(path.dirname(outputPath));

  await page.screenshot({
    path: outputPath,
    clip: {
      x: component.boundingBox.x,
      y: component.boundingBox.y,
      width: component.boundingBox.width,
      height: component.boundingBox.height,
    },
    type: 'png',
  });

  return outputPath;
}

/**
 * Capture screenshots for all detected components
 */
async function captureAllScreenshots(
  page: Page,
  components: DetectedComponent[],
  sectionsDir: string,
  emitProgress: ReturnType<typeof createProgressEmitter>,
  maxRetries: number
): Promise<Map<string, string>> {
  const screenshotPaths = new Map<string, string>();

  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    const sectionNumber = String(i + 1).padStart(2, '0');
    const fileName = `${sectionNumber}-${component.type}.png`;
    const outputPath = path.join(sectionsDir, fileName);

    emitProgress(
      'capturing_screenshots',
      20 + (i / components.length) * 20,
      `Capturing ${getComponentDisplayName(component.type)}`,
      { current: i + 1, total: components.length }
    );

    const result = await withRetry(
      () => captureComponentScreenshot(page, component, outputPath),
      maxRetries,
      `Screenshot capture for ${component.type}`
    );

    if (result.success && result.result) {
      screenshotPaths.set(component.id, result.result);
    }
  }

  return screenshotPaths;
}

// ====================
// VARIANT GENERATION
// ====================

/**
 * Generate variants for a single component
 */
function generateComponentVariants(
  component: DetectedComponent,
  designSystem?: DesignSystem
): VariantGenerationResult {
  const componentName = componentTypeToName(component.type);
  return generateVariantsWithMetadata(component, {
    componentName,
    designSystem,
  });
}

/**
 * Generate variants for all detected components
 */
function generateAllVariants(
  components: DetectedComponent[],
  designSystem: DesignSystem | undefined,
  emitProgress: ReturnType<typeof createProgressEmitter>
): Map<string, VariantGenerationResult> {
  const results = new Map<string, VariantGenerationResult>();

  for (let i = 0; i < components.length; i++) {
    const component = components[i];

    emitProgress(
      'generating_variants',
      40 + (i / components.length) * 30,
      `Generating variants for ${getComponentDisplayName(component.type)}`,
      { current: i + 1, total: components.length }
    );

    const result = generateComponentVariants(component, designSystem);
    results.set(component.id, result);
  }

  return results;
}

// ====================
// FILE SYSTEM OPERATIONS
// ====================

/**
 * Save component files to the filesystem
 */
function saveComponentFiles(
  component: GeneratedComponent,
  componentsDir: string
): void {
  const componentName = componentTypeToName(component.type);
  const componentDir = path.join(componentsDir, componentName);
  const variantsDir = path.join(componentDir, 'variants');

  ensureDirectory(componentDir);
  ensureDirectory(variantsDir);

  // Save each variant
  for (const variant of component.variants) {
    const variantFileName = `${variant.name.toLowerCase().replace(' ', '-')}.tsx`;
    const variantPath = path.join(variantsDir, variantFileName);
    fs.writeFileSync(variantPath, variant.code, 'utf-8');
  }

  // Save main component file (first variant by default, or selected variant)
  const selectedVariant = component.selectedVariant
    ? component.variants.find((v) => v.id === component.selectedVariant)
    : component.variants[0];

  if (selectedVariant) {
    const mainComponentPath = path.join(componentDir, `${componentName}.tsx`);
    fs.writeFileSync(mainComponentPath, selectedVariant.code, 'utf-8');
  }

  // Create index.ts export file
  const indexContent = `export { default as ${componentName} } from './${componentName}';
export type { ${componentName}Props } from './${componentName}';
`;
  const indexPath = path.join(componentDir, 'index.ts');
  fs.writeFileSync(indexPath, indexContent, 'utf-8');
}

/**
 * Save all components to filesystem
 */
function saveAllComponents(
  components: GeneratedComponent[],
  componentsDir: string,
  emitProgress: ReturnType<typeof createProgressEmitter>
): void {
  ensureDirectory(componentsDir);

  for (let i = 0; i < components.length; i++) {
    const component = components[i];

    emitProgress(
      'saving',
      70 + (i / components.length) * 20,
      `Saving ${getComponentDisplayName(component.type)}`,
      { current: i + 1, total: components.length }
    );

    saveComponentFiles(component, componentsDir);
  }

  // Create components/index.ts that exports all components
  const exportStatements = components
    .map((c) => {
      const name = componentTypeToName(c.type);
      return `export * from './${name}';`;
    })
    .join('\n');

  const componentsIndexPath = path.join(componentsDir, 'index.ts');
  fs.writeFileSync(componentsIndexPath, exportStatements + '\n', 'utf-8');
}

// ====================
// DATABASE OPERATIONS
// ====================

/**
 * Persist component and variants to database
 */
function persistToDatabase(
  component: GeneratedComponent,
  versionId: string
): void {
  const db = getDb();

  // Insert component
  const componentInsert: ComponentInsert = {
    id: component.id,
    website_id: component.websiteId,
    version_id: versionId,
    name: component.name,
    type: component.type,
    order_index: component.order,
    status: component.status,
    error_message: component.errorMessage,
  };

  createComponent(componentInsert);

  // Insert variants
  if (component.variants.length > 0) {
    const variantInserts: VariantInsert[] = component.variants.map((v) => ({
      id: v.id,
      component_id: component.id,
      variant_name: v.name,
      description: v.description,
      code: v.code,
      preview_image: v.previewImage,
      accuracy_score: v.accuracyScore,
    }));

    createVariantsBatch(variantInserts);
  }
}

/**
 * Persist all components to database
 */
function persistAllToDatabase(
  components: GeneratedComponent[],
  versionId: string,
  emitProgress: ReturnType<typeof createProgressEmitter>
): void {
  for (let i = 0; i < components.length; i++) {
    const component = components[i];

    emitProgress(
      'saving',
      90 + (i / components.length) * 8,
      `Persisting ${getComponentDisplayName(component.type)} to database`,
      { current: i + 1, total: components.length }
    );

    try {
      persistToDatabase(component, versionId);
    } catch {
      // Continue even if database persistence fails for one component
    }
  }
}

// ====================
// MAIN GENERATION FUNCTION
// ====================

/**
 * Generate components from a Playwright page
 *
 * This is the main orchestration function that:
 * 1. Detects all components on the page
 * 2. Captures screenshots for each component
 * 3. Generates 3 code variants per component
 * 4. Saves components to filesystem
 * 5. Persists metadata to database
 *
 * @param page - Playwright Page instance (must be already navigated)
 * @param options - Generation configuration options
 * @returns Promise with GeneratorResult
 *
 * @example
 * ```typescript
 * const result = await generateComponents(page, {
 *   websiteId: 'website-123',
 *   versionId: 'v1',
 *   onProgress: (progress) => console.log(progress.message),
 * });
 * ```
 */
export async function generateComponents(
  page: Page,
  options: GeneratorOptions
): Promise<GeneratorResult> {
  const {
    websiteId,
    versionId,
    designSystem,
    maxComponents = CAPTURE_CONFIG.maxSections,
    maxRetries = CAPTURE_CONFIG.maxRetries,
    onProgress,
    outputDir,
    skipDatabase = false,
    skipScreenshots = false,
  } = options;

  const emitProgress = createProgressEmitter(onProgress);
  const errors: GenerationError[] = [];

  const componentsDir = outputDir || getComponentsDir(websiteId);
  const sectionsDir = getSectionsDir(websiteId);

  const generatedComponents: GeneratedComponent[] = [];

  try {
    // Phase 1: Detect components
    emitProgress('detecting', 5, 'Detecting page components...');

    const detectionResult = await withRetry(
      () => detectAllComponents(page, { maxComponents }),
      maxRetries,
      'Component detection'
    );

    if (!detectionResult.success || !detectionResult.result) {
      return {
        success: false,
        websiteId,
        components: [],
        metadata: {
          detectedCount: 0,
          generatedCount: 0,
          failedCount: 0,
          generatedAt: new Date().toISOString(),
        },
        errors: [
          {
            phase: 'detecting',
            message: detectionResult.error || 'Component detection failed',
            recoverable: true,
          },
        ],
      };
    }

    const detectedComponents = detectionResult.result;
    emitProgress(
      'detecting',
      15,
      `Detected ${detectedComponents.length} components`
    );

    // Phase 2: Capture screenshots (if not skipped)
    let screenshotPaths = new Map<string, string>();
    if (!skipScreenshots && detectedComponents.length > 0) {
      screenshotPaths = await captureAllScreenshots(
        page,
        detectedComponents,
        sectionsDir,
        emitProgress,
        maxRetries
      );
    }

    // Phase 3: Generate variants for each component
    emitProgress('generating_variants', 40, 'Generating component variants...');

    const variantResults = generateAllVariants(
      detectedComponents,
      designSystem,
      emitProgress
    );

    // Phase 4: Build GeneratedComponent objects
    for (let i = 0; i < detectedComponents.length; i++) {
      const detected = detectedComponents[i];
      const variantResult = variantResults.get(detected.id);
      const screenshotPath = screenshotPaths.get(detected.id);

      // Update screenshot path on detected component
      if (screenshotPath) {
        detected.screenshotPath = screenshotPath;
      }

      if (!variantResult || variantResult.variants.length === 0) {
        // Component failed to generate variants
        const errorComponent: GeneratedComponent = {
          id: detected.id,
          websiteId,
          name: componentTypeToName(detected.type),
          type: detected.type,
          order: detected.order,
          variants: [],
          selectedVariant: null,
          status: 'failed',
          errorMessage: variantResult?.metadata.errors[0]?.error || 'Variant generation failed',
          createdAt: new Date().toISOString(),
        };
        generatedComponents.push(errorComponent);

        errors.push({
          componentId: detected.id,
          componentType: detected.type,
          phase: 'generating_variants',
          message: `Failed to generate variants for ${getComponentDisplayName(detected.type)}`,
          recoverable: true,
        });
      } else {
        // Successfully generated variants
        const generated: GeneratedComponent = {
          id: detected.id,
          websiteId,
          name: componentTypeToName(detected.type),
          type: detected.type,
          order: detected.order,
          variants: variantResult.variants,
          selectedVariant: null,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        generatedComponents.push(generated);
      }
    }

    // Phase 5: Save to filesystem
    emitProgress('saving', 70, 'Saving components to filesystem...');

    const successfulComponents = generatedComponents.filter(
      (c) => c.status !== 'failed'
    );

    if (successfulComponents.length > 0) {
      try {
        saveAllComponents(successfulComponents, componentsDir, emitProgress);
      } catch (error) {
        errors.push({
          phase: 'saving',
          message: `Failed to save components: ${error instanceof Error ? error.message : String(error)}`,
          recoverable: true,
        });
      }
    }

    // Phase 6: Persist to database
    if (!skipDatabase) {
      emitProgress('saving', 90, 'Persisting to database...');
      try {
        persistAllToDatabase(generatedComponents, versionId, emitProgress);
      } catch (error) {
        errors.push({
          phase: 'saving',
          message: `Failed to persist to database: ${error instanceof Error ? error.message : String(error)}`,
          recoverable: true,
        });
      }
    }

    emitProgress('complete', 100, 'Component generation complete');

    const failedCount = generatedComponents.filter(
      (c) => c.status === 'failed'
    ).length;
    const generatedCount = generatedComponents.filter(
      (c) => c.status !== 'failed'
    ).length;

    return {
      success: errors.length === 0 || generatedCount > 0,
      websiteId,
      components: generatedComponents,
      metadata: {
        detectedCount: detectedComponents.length,
        generatedCount,
        failedCount,
        generatedAt: new Date().toISOString(),
      },
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      websiteId,
      components: generatedComponents,
      metadata: {
        detectedCount: 0,
        generatedCount: 0,
        failedCount: 0,
        generatedAt: new Date().toISOString(),
      },
      errors: [
        {
          phase: 'initializing',
          message: `Component generation failed: ${errorMessage}`,
          recoverable: true,
        },
      ],
    };
  }
}

// ====================
// SINGLE COMPONENT RETRY
// ====================

/**
 * Retry generation for a single failed component
 *
 * @param page - Playwright Page instance
 * @param componentType - Type of component to retry
 * @param options - Generation options
 * @returns Promise with GeneratedComponent or null if failed
 */
export async function retryComponent(
  page: Page,
  componentType: ComponentType,
  options: Omit<GeneratorOptions, 'maxComponents'>
): Promise<GeneratedComponent | null> {
  const { websiteId, versionId, designSystem, maxRetries = 3 } = options;

  try {
    // Detect only the specific component type
    const detectedComponents = await detectAllComponents(page, {
      maxComponents: 1,
    });

    const targetComponent = detectedComponents.find(
      (c) => c.type === componentType
    );

    if (!targetComponent) {
      return null;
    }

    // Generate variants
    const variantResult = generateComponentVariants(targetComponent, designSystem);

    if (variantResult.variants.length === 0) {
      return null;
    }

    const generated: GeneratedComponent = {
      id: targetComponent.id,
      websiteId,
      name: componentTypeToName(targetComponent.type),
      type: targetComponent.type,
      order: targetComponent.order,
      variants: variantResult.variants,
      selectedVariant: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    return generated;
  } catch {
    return null;
  }
}

// ====================
// UTILITY EXPORTS
// ====================

/**
 * Get the output directories for a website
 */
export function getOutputDirectories(websiteId: string): {
  componentsDir: string;
  sectionsDir: string;
} {
  return {
    componentsDir: getComponentsDir(websiteId),
    sectionsDir: getSectionsDir(websiteId),
  };
}

/**
 * Check if components have been generated for a website
 */
export function hasGeneratedComponents(websiteId: string): boolean {
  const componentsDir = getComponentsDir(websiteId);
  if (!fs.existsSync(componentsDir)) {
    return false;
  }

  const indexPath = path.join(componentsDir, 'index.ts');
  return fs.existsSync(indexPath);
}

/**
 * Get list of generated component types for a website
 */
export function getGeneratedComponentTypes(websiteId: string): ComponentType[] {
  const componentsDir = getComponentsDir(websiteId);
  if (!fs.existsSync(componentsDir)) {
    return [];
  }

  const entries = fs.readdirSync(componentsDir, { withFileTypes: true });
  const componentTypes: ComponentType[] = [];

  const nameToType: Record<string, ComponentType> = {
    Header: 'header',
    Hero: 'hero',
    Features: 'features',
    Testimonials: 'testimonials',
    Pricing: 'pricing',
    CallToAction: 'cta',
    Footer: 'footer',
    Cards: 'cards',
    Gallery: 'gallery',
    Contact: 'contact',
    FAQ: 'faq',
    Stats: 'stats',
    Team: 'team',
    Logos: 'logos',
  };

  for (const entry of entries) {
    if (entry.isDirectory() && nameToType[entry.name]) {
      componentTypes.push(nameToType[entry.name]);
    }
  }

  return componentTypes;
}

/**
 * Re-export types for convenience
 */
export type { DetectedComponent, GeneratedComponent, ComponentVariant };
