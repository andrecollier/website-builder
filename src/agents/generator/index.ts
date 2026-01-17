/**
 * Generator Agent Module
 *
 * Handles component generation from section screenshots including:
 * - Parallel processing of multiple sections
 * - Component detection and classification
 * - Variant generation (3 variants per component)
 * - Database and filesystem persistence
 *
 * Model: Sonnet (code generation quality is important)
 */

// Claude Agent SDK imports
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';

import type { Page } from 'playwright';
import type {
  GeneratorAgentResult,
  AgentContext,
  RetryResult,
} from '../types';
import type {
  CaptureProgress,
  GeneratedComponent,
  ExtractionError,
  SectionInfo,
  DesignSystem,
} from '@/types';
import {
  updateContext,
  updateProgress,
} from '../shared/context';
import {
  publishAgentStarted,
  publishAgentCompleted,
  publishAgentFailed,
  createProgressPublisher,
} from '../shared/messages';
import {
  generateComponents,
  type GeneratorOptions,
  type GeneratorResult,
  type GenerationProgress,
} from '@/lib/generator/component-generator';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Options for the generator agent execution
 */
export interface GeneratorAgentOptions {
  /** Website ID for output directory naming */
  websiteId: string;
  /** Version ID for database association */
  versionId: string;
  /** Playwright page instance */
  page: Page;
  /** Sections to generate components for */
  sections: SectionInfo[];
  /** Design system tokens to apply to generated code */
  designSystem?: DesignSystem;
  /** Maximum components to process per section (default: from CAPTURE_CONFIG) */
  maxComponents?: number;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Whether to process sections in parallel (default: true) */
  parallel?: boolean;
  /** Maximum parallel operations (default: 3) */
  maxParallel?: number;
  /** Callback for progress updates */
  onProgress?: (progress: CaptureProgress) => void;
  /** Skip database persistence (default: false) */
  skipDatabase?: boolean;
  /** Skip screenshot capture (default: false) */
  skipScreenshots?: boolean;
}

/**
 * Result of generating components for a single section
 */
interface SectionGenerationResult {
  sectionId: string;
  success: boolean;
  components: GeneratedComponent[];
  error?: string;
}

/**
 * Generator progress phase
 */
type GeneratorPhase = 'initializing' | 'generating_variants' | 'saving' | 'complete' | 'failed';

// ====================
// AGENT DEFINITION (Claude SDK)
// ====================

/**
 * Generator Agent Definition for Claude SDK
 *
 * This agent generates React components from section screenshots using
 * design tokens. Supports parallel processing of multiple sections.
 */
export const generatorAgentDef: AgentDefinition = {
  description: 'Generator agent that generates React components from section screenshots with parallel processing',
  prompt: `You are the Generator Agent for the Website Cooker extraction pipeline. Your role is to:

1. Component Detection:
   - Analyze section screenshots to identify component types
   - Classify components (header, hero, features, CTA, footer, etc.)
   - Determine component structure and hierarchy

2. React Component Generation:
   - Generate clean, production-ready React/TypeScript code
   - Apply design tokens from the DesignSystem
   - Use Tailwind CSS for styling
   - Follow React best practices (hooks, composition, etc.)

3. Variant Generation:
   - Generate 3 variants per component:
     * Variant 1: Faithful reproduction of original design
     * Variant 2: Alternative layout/style
     * Variant 3: Different approach/pattern
   - Ensure each variant is unique and usable

4. Parallel Processing:
   - Process multiple sections concurrently
   - Manage parallelization with concurrency limits
   - Handle partial failures gracefully

5. Persistence:
   - Save generated components to filesystem
   - Store metadata in database
   - Create preview screenshots

Input: Sections from CaptureResult + DesignSystem
Output: Array of GeneratedComponent with variants`,
  tools: [], // No subagent spawning needed
  model: 'sonnet'
};

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Execute a function with retry logic
 * Follows the retry pattern from capture.ts with exponential backoff
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

/**
 * Create progress emitter helper
 * Integrates with shared context and message bus
 */
function createProgressEmitter(
  websiteId: string,
  onProgress?: (progress: CaptureProgress) => void
) {
  const progressPublisher = createProgressPublisher(websiteId, 'generator');

  return (phase: GeneratorPhase, percent: number, message: string, componentInfo?: { current: number; total: number }) => {
    // Map generator phases to CaptureProgress phases
    const capturePhase: CaptureProgress['phase'] = phase === 'generating_variants'
      ? 'capturing' // Use 'capturing' as closest match
      : phase === 'saving'
      ? 'sections'
      : phase === 'complete'
      ? 'complete'
      : phase === 'failed'
      ? 'failed'
      : 'initializing';

    const progress: CaptureProgress = {
      phase: capturePhase,
      percent,
      message,
      currentSection: componentInfo?.current,
      totalSections: componentInfo?.total,
    };

    // Update shared context
    updateProgress(websiteId, progress);

    // Publish to message bus
    progressPublisher(progress);

    // Call external callback if provided
    if (onProgress) {
      onProgress(progress);
    }
  };
}

/**
 * Create an ExtractionError from an Error object
 */
function createError(
  phase: number,
  error: Error | string,
  recoverable = true
): ExtractionError {
  const message = error instanceof Error ? error.message : error;
  return {
    id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    phase,
    message,
    details: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    recoverable,
  };
}

/**
 * Process sections in parallel with concurrency limit
 * This is the key parallelization feature of the Generator agent
 */
async function processInParallel<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  maxConcurrent: number
): Promise<R[]> {
  const results: R[] = [];
  const queue = [...items];
  const activePromises = new Set<Promise<void>>();

  while (queue.length > 0 || activePromises.size > 0) {
    // Start new tasks up to the concurrency limit
    while (activePromises.size < maxConcurrent && queue.length > 0) {
      const item = queue.shift()!;
      const index = items.indexOf(item);

      const promise = processor(item, index)
        .then((result) => {
          results[index] = result;
        })
        .finally(() => {
          activePromises.delete(promise);
        });

      activePromises.add(promise);
    }

    // Wait for at least one promise to complete
    if (activePromises.size > 0) {
      await Promise.race(activePromises);
    }
  }

  return results;
}

/**
 * Generate components for a single section
 */
async function generateSectionComponents(
  page: Page,
  section: SectionInfo,
  options: GeneratorAgentOptions,
  emitProgress: (phase: GeneratorPhase, percent: number, message: string, componentInfo?: { current: number; total: number }) => void,
  sectionIndex: number,
  totalSections: number
): Promise<SectionGenerationResult> {
  const {
    websiteId,
    versionId,
    designSystem,
    maxComponents,
    maxRetries = 3,
    skipDatabase = false,
    skipScreenshots = false,
  } = options;

  try {
    emitProgress(
      'generating_variants',
      Math.round((sectionIndex / totalSections) * 80) + 10,
      `Generating components for section ${section.type}...`,
      { current: sectionIndex + 1, total: totalSections }
    );

    // Call the existing generateComponents function
    const generatorOptions: GeneratorOptions = {
      websiteId,
      versionId,
      designSystem,
      maxComponents,
      maxRetries,
      skipDatabase,
      skipScreenshots,
      onProgress: (progress: GenerationProgress) => {
        // Forward progress updates
        const adjustedPercent = Math.round(
          (sectionIndex / totalSections) * 80 +
          (progress.percent / totalSections) * 0.8
        ) + 10;
        emitProgress(
          'generating_variants',
          adjustedPercent,
          `Section ${section.type}: ${progress.message}`,
          { current: sectionIndex + 1, total: totalSections }
        );
      },
    };

    const result = await generateComponents(page, generatorOptions);

    if (!result.success) {
      throw new Error(result.metadata.failedCount > 0
        ? `Generation failed: ${result.errors[0]?.message || 'Unknown error'}`
        : 'Generation completed with no components'
      );
    }

    return {
      sectionId: section.id,
      success: true,
      components: result.components,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      sectionId: section.id,
      success: false,
      components: [],
      error: errorMessage,
    };
  }
}

// ====================
// MAIN GENERATION FUNCTION
// ====================

/**
 * Execute the generator agent
 *
 * Wraps the existing generateComponents() function from lib/generator/component-generator.ts
 * with agent infrastructure (progress tracking, message bus, error handling).
 *
 * Key feature: Processes multiple sections in PARALLEL for improved performance.
 *
 * @param options - Generator execution options
 * @returns Promise resolving to generator agent result
 *
 * @example
 * ```typescript
 * const result = await executeGenerator({
 *   websiteId: 'website-123',
 *   versionId: 'v1',
 *   page: playwrightPage,
 *   sections: captureResult.sections,
 *   designSystem: designSystemData,
 *   parallel: true,
 *   maxParallel: 3,
 *   onProgress: (progress) => console.log(progress.message),
 * });
 * ```
 */
export async function executeGenerator(
  options: GeneratorAgentOptions
): Promise<GeneratorAgentResult> {
  const {
    websiteId,
    versionId,
    page,
    sections,
    designSystem,
    maxComponents,
    maxRetries = 3,
    parallel = true,
    maxParallel = 3,
    skipDatabase = false,
    skipScreenshots = false,
    onProgress,
  } = options;

  // Publish agent started event
  publishAgentStarted(websiteId, 'generator', 'Starting generator agent...');

  // Create progress emitter
  const emitProgress = createProgressEmitter(websiteId, onProgress);

  try {
    // Validate inputs
    emitProgress('initializing', 5, 'Validating generator inputs...');

    if (!page) {
      throw new Error('Playwright page instance is required');
    }

    if (!sections || sections.length === 0) {
      throw new Error('No sections provided for component generation');
    }

    emitProgress('initializing', 10, `Processing ${sections.length} sections${parallel ? ' in parallel' : ''}...`);

    // Process sections (parallel or sequential based on options)
    let sectionResults: SectionGenerationResult[];

    if (parallel && sections.length > 1) {
      // PARALLEL PROCESSING - key feature of Generator agent
      emitProgress(
        'generating_variants',
        15,
        `Processing ${sections.length} sections in parallel (max ${maxParallel} concurrent)...`
      );

      sectionResults = await processInParallel(
        sections,
        (section, index) => generateSectionComponents(
          page,
          section,
          options,
          emitProgress,
          index,
          sections.length
        ),
        maxParallel
      );
    } else {
      // Sequential processing (fallback)
      emitProgress('generating_variants', 15, 'Processing sections sequentially...');

      sectionResults = [];
      for (let i = 0; i < sections.length; i++) {
        const result = await generateSectionComponents(
          page,
          sections[i],
          options,
          emitProgress,
          i,
          sections.length
        );
        sectionResults.push(result);
      }
    }

    // Aggregate results
    emitProgress('saving', 90, 'Aggregating component generation results...');

    const allComponents: GeneratedComponent[] = [];
    const errors: ExtractionError[] = [];

    sectionResults.forEach((result, index) => {
      if (result.success) {
        allComponents.push(...result.components);
      } else if (result.error) {
        errors.push(createError(
          4, // Phase 4: Generating Components
          new Error(`Section ${sections[index].type}: ${result.error}`),
          true
        ));
      }
    });

    // Check if we have any successful results
    const successfulSections = sectionResults.filter(r => r.success).length;
    const failedSections = sectionResults.filter(r => !r.success).length;

    if (successfulSections === 0) {
      throw new Error(`All ${sections.length} sections failed to generate components`);
    }

    // Update shared context with generation results
    updateContext(websiteId, {
      status: 'generating',
      components: allComponents,
      errors,
    });

    // Publish agent completed event
    const completionMessage = `Generated ${allComponents.length} components from ${successfulSections}/${sections.length} sections` +
      (failedSections > 0 ? ` (${failedSections} sections failed)` : '');

    publishAgentCompleted(
      websiteId,
      'generator',
      completionMessage,
      allComponents
    );

    emitProgress('complete', 100, completionMessage);

    return {
      success: true,
      agentType: 'generator',
      message: completionMessage,
      data: allComponents,
    };
  } catch (error) {
    // Handle generation failure
    const extractionError = createError(
      4, // Phase 4: Generating Components
      error instanceof Error ? error : String(error),
      true
    );

    emitProgress('failed', 0, `Generation failed: ${extractionError.message}`);
    publishAgentFailed(websiteId, 'generator', extractionError);

    return {
      success: false,
      agentType: 'generator',
      message: 'Generator agent failed',
      error: {
        message: extractionError.message,
        details: extractionError.details,
        recoverable: true,
      },
    };
  }
}

/**
 * Get the generator agent configuration
 * Used by the agent registry for agent instantiation
 */
export function getGeneratorConfig() {
  return {
    type: 'generator' as const,
    model: 'sonnet' as const,
    maxRetries: 3,
    timeout: 300000, // 5 minutes (longer for component generation)
    verbose: false,
  };
}
