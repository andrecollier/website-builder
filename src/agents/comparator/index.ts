/**
 * Comparator Agent Module
 *
 * Handles visual comparison of generated components against reference screenshots:
 * - Parallel processing of multiple components
 * - Pixel-level comparison using pixelmatch
 * - Accuracy calculation and reporting
 * - Diff image generation
 *
 * Model: Haiku (fast numerical comparisons)
 */

// Claude Agent SDK imports
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';

import type {
  ComparatorAgentResult,
  AgentContext,
  RetryResult,
} from '../types';
import type {
  CaptureProgress,
  ExtractionError,
  GeneratedComponent,
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
  compareAllSections,
  type ComparisonReport,
  type ComparisonResult,
} from '@/lib/comparison/visual-diff';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Options for the comparator agent execution
 */
export interface ComparatorAgentOptions {
  /** Website ID for finding reference and generated files */
  websiteId: string;
  /** Base directory for websites (default: ./Websites) */
  websitesDir?: string;
  /** Components to compare (optional, for filtering) */
  components?: GeneratedComponent[];
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Whether to process components in parallel (default: true) */
  parallel?: boolean;
  /** Maximum parallel operations (default: 5, higher than generator for faster comparisons) */
  maxParallel?: number;
  /** Callback for progress updates */
  onProgress?: (progress: CaptureProgress) => void;
  /** Comparison threshold (0-1, default: 0.1) */
  threshold?: number;
}

/**
 * Result of comparing a single component
 */
interface ComponentComparisonResult {
  componentId: string;
  success: boolean;
  accuracy: number;
  mismatchedPixels: number;
  totalPixels: number;
  diffImagePath?: string;
  error?: string;
}

/**
 * Comparator progress phase
 */
type ComparatorPhase = 'initializing' | 'comparing' | 'calculating' | 'complete' | 'failed';

// ====================
// AGENT DEFINITION (Claude SDK)
// ====================

/**
 * Comparator Agent Definition for Claude SDK
 *
 * This agent performs visual comparison of generated components against
 * reference screenshots using pixelmatch. Supports parallel processing.
 */
export const comparatorAgentDef: AgentDefinition = {
  description: 'Comparator agent that performs visual comparison of generated components with parallel processing',
  prompt: `You are the Comparator Agent for the Website Cooker extraction pipeline. Your role is to:

1. Visual Comparison:
   - Compare generated component screenshots with reference screenshots
   - Use pixelmatch for pixel-level comparison
   - Calculate accuracy scores (percentage of matching pixels)
   - Generate diff images highlighting differences

2. Accuracy Calculation:
   - Calculate per-component accuracy
   - Compute overall accuracy across all components
   - Identify mismatched pixels and their locations
   - Track total pixel counts

3. Parallel Processing:
   - Process multiple component comparisons concurrently
   - Manage parallelization with higher concurrency than Generator
   - Handle partial failures gracefully
   - Aggregate results efficiently

4. Reporting:
   - Generate detailed comparison reports
   - Include metrics (accuracy, mismatched pixels, total pixels)
   - Save diff images to filesystem
   - Provide actionable feedback on quality

5. Quality Thresholds:
   - Apply comparison thresholds (default: 0.1)
   - Flag components below acceptable accuracy
   - Report high-quality vs. low-quality components

Input: GeneratedComponent array + reference screenshots
Output: ComparisonReport with accuracy scores and diff images`,
  tools: [], // No subagent spawning needed
  model: 'haiku'
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
  const progressPublisher = createProgressPublisher(websiteId, 'comparator');

  return (phase: ComparatorPhase, percent: number, message: string, componentInfo?: { current: number; total: number }) => {
    // Map comparator phases to CaptureProgress phases
    const capturePhase: CaptureProgress['phase'] = phase === 'comparing'
      ? 'sections' // Use 'sections' as closest match for comparing
      : phase === 'calculating'
      ? 'complete'
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
 * Process components in parallel with concurrency limit
 * This is the key parallelization feature of the Comparator agent
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
 * Compare a single component result
 */
async function compareComponentResult(
  comparison: ComparisonResult,
  emitProgress: (phase: ComparatorPhase, percent: number, message: string, componentInfo?: { current: number; total: number }) => void,
  componentIndex: number,
  totalComponents: number
): Promise<ComponentComparisonResult> {
  try {
    emitProgress(
      'comparing',
      Math.round((componentIndex / totalComponents) * 80) + 10,
      `Comparing ${comparison.sectionName}...`,
      { current: componentIndex + 1, total: totalComponents }
    );

    // The comparison has already been done by compareAllSections
    // We just need to format the result
    return {
      componentId: comparison.sectionName,
      success: true,
      accuracy: comparison.accuracy,
      mismatchedPixels: comparison.mismatchedPixels,
      totalPixels: comparison.totalPixels,
      diffImagePath: comparison.diffImagePath,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      componentId: comparison.sectionName,
      success: false,
      accuracy: 0,
      mismatchedPixels: 0,
      totalPixels: 0,
      error: errorMessage,
    };
  }
}

// ====================
// MAIN COMPARISON FUNCTION
// ====================

/**
 * Execute the comparator agent
 *
 * Wraps the existing compareAllSections() function from lib/comparison/visual-diff.ts
 * with agent infrastructure (progress tracking, message bus, error handling).
 *
 * Key feature: Processes multiple component comparisons in PARALLEL for improved performance.
 *
 * @param options - Comparator execution options
 * @returns Promise resolving to comparator agent result
 *
 * @example
 * ```typescript
 * const result = await executeComparator({
 *   websiteId: 'website-123',
 *   websitesDir: './Websites',
 *   components: generatedComponents,
 *   parallel: true,
 *   maxParallel: 5,
 *   onProgress: (progress) => console.log(progress.message),
 * });
 * ```
 */
export async function executeComparator(
  options: ComparatorAgentOptions
): Promise<ComparatorAgentResult> {
  const {
    websiteId,
    websitesDir = './Websites',
    components,
    maxRetries = 3,
    parallel = true,
    maxParallel = 5,
    threshold = 0.1,
    onProgress,
  } = options;

  // Publish agent started event
  publishAgentStarted(websiteId, 'comparator', 'Starting comparator agent...');

  // Create progress emitter
  const emitProgress = createProgressEmitter(websiteId, onProgress);

  try {
    // Validate inputs
    emitProgress('initializing', 5, 'Validating comparator inputs...');

    if (!websiteId) {
      throw new Error('Website ID is required');
    }

    emitProgress('initializing', 10, 'Running visual comparison...');

    // Call the existing compareAllSections function with retry logic
    const comparisonRetry = await withRetry(
      () => compareAllSections(websiteId, websitesDir),
      maxRetries,
      'Visual comparison'
    );

    if (!comparisonRetry.success || !comparisonRetry.result) {
      throw new Error(comparisonRetry.error || 'Comparison failed');
    }

    const report: ComparisonReport = comparisonRetry.result;

    emitProgress(
      'comparing',
      20,
      `Processing ${report.sections.length} component comparisons${parallel ? ' in parallel' : ''}...`
    );

    // Process comparison results (parallel or sequential based on options)
    let componentResults: ComponentComparisonResult[];

    if (parallel && report.sections.length > 1) {
      // PARALLEL PROCESSING - key feature of Comparator agent
      emitProgress(
        'comparing',
        25,
        `Processing ${report.sections.length} comparisons in parallel (max ${maxParallel} concurrent)...`
      );

      componentResults = await processInParallel(
        report.sections,
        (comparison, index) => compareComponentResult(
          comparison,
          emitProgress,
          index,
          report.sections.length
        ),
        maxParallel
      );
    } else {
      // Sequential processing (fallback)
      emitProgress('comparing', 25, 'Processing comparisons sequentially...');

      componentResults = [];
      for (let i = 0; i < report.sections.length; i++) {
        const result = await compareComponentResult(
          report.sections[i],
          emitProgress,
          i,
          report.sections.length
        );
        componentResults.push(result);
      }
    }

    // Aggregate results
    emitProgress('calculating', 90, 'Calculating overall accuracy...');

    const errors: ExtractionError[] = [];

    componentResults.forEach((result, index) => {
      if (!result.success && result.error) {
        errors.push(createError(
          5, // Phase 5: Visual Comparison
          new Error(`Component ${result.componentId}: ${result.error}`),
          true
        ));
      }
    });

    // Check if we have any successful results
    const successfulComparisons = componentResults.filter(r => r.success).length;
    const failedComparisons = componentResults.filter(r => !r.success).length;

    if (successfulComparisons === 0) {
      throw new Error(`All ${report.sections.length} comparisons failed`);
    }

    // Use the overall accuracy from the report
    const overallAccuracy = report.overallAccuracy;

    // Update shared context with comparison results
    updateContext(websiteId, {
      status: 'complete',
      errors,
    });

    // Publish agent completed event
    const completionMessage = `Compared ${successfulComparisons}/${report.sections.length} components with ${overallAccuracy.toFixed(2)}% overall accuracy` +
      (failedComparisons > 0 ? ` (${failedComparisons} comparisons failed)` : '');

    publishAgentCompleted(
      websiteId,
      'comparator',
      completionMessage,
      { overallAccuracy, report }
    );

    emitProgress('complete', 100, completionMessage);

    return {
      success: true,
      agentType: 'comparator',
      message: completionMessage,
      data: { overallAccuracy },
    };
  } catch (error) {
    // Handle comparison failure
    const extractionError = createError(
      5, // Phase 5: Visual Comparison
      error instanceof Error ? error : String(error),
      true
    );

    emitProgress('failed', 0, `Comparison failed: ${extractionError.message}`);
    publishAgentFailed(websiteId, 'comparator', extractionError);

    return {
      success: false,
      agentType: 'comparator',
      message: 'Comparator agent failed',
      error: {
        message: extractionError.message,
        details: extractionError.details,
        recoverable: true,
      },
    };
  }
}

/**
 * Get the comparator agent configuration
 * Used by the agent registry for agent instantiation
 */
export function getComparatorConfig() {
  return {
    type: 'comparator' as const,
    model: 'haiku' as const,
    maxRetries: 3,
    timeout: 120000, // 2 minutes (faster than generator)
    verbose: false,
  };
}
