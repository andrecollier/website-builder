/**
 * Extractor Agent Module
 *
 * Handles design token extraction from captured website data including:
 * - Color extraction from screenshots and styles
 * - Typography analysis from fonts and text
 * - Spacing pattern detection
 * - Visual effects extraction (shadows, borders, transitions)
 *
 * Model: Sonnet (analysis of design patterns requires sophisticated reasoning)
 */

// Claude Agent SDK imports
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';

import type {
  ExtractorAgentResult,
  AgentContext,
  RetryResult,
} from '../types';
import type {
  CaptureProgress,
  DesignSystem,
  ExtractionError,
  CaptureResult,
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
  synthesizeDesignSystem,
  validateRawPageData,
  type RawPageData,
  type SynthesizeOptions,
} from '@/lib/design-system/synthesizer';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Options for the extractor agent execution
 */
export interface ExtractorOptions {
  /** Website ID for context tracking */
  websiteId: string;
  /** URL of the website being extracted */
  url: string;
  /** Raw page data from capture phase */
  rawData: RawPageData;
  /** Synthesis configuration options */
  synthesizeOptions?: SynthesizeOptions;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Callback for progress updates */
  onProgress?: (progress: CaptureProgress) => void;
}

/**
 * Extractor progress phase
 */
type ExtractorPhase = 'initializing' | 'extracting' | 'complete' | 'failed';

// ====================
// AGENT DEFINITION (Claude SDK)
// ====================

/**
 * Extractor Agent Definition for Claude SDK
 *
 * This agent extracts design tokens (colors, typography, spacing, effects)
 * from captured website data for use in component generation.
 */
export const extractorAgentDef: AgentDefinition = {
  description: 'Extractor agent that extracts design tokens (colors, typography, spacing, effects) from captured website data',
  prompt: `You are the Extractor Agent for the Website Cooker extraction pipeline. Your role is to:

1. Color Extraction:
   - Analyze screenshots to detect color palette
   - Extract primary, secondary, accent colors
   - Identify background and text colors
   - Detect color usage patterns

2. Typography Analysis:
   - Identify font families used
   - Extract font sizes, weights, and line heights
   - Analyze heading hierarchy
   - Detect letter spacing and text transforms

3. Spacing Pattern Detection:
   - Analyze margins and padding patterns
   - Identify consistent spacing scales
   - Detect gap and grid patterns
   - Extract container widths

4. Visual Effects Extraction:
   - Identify shadows (box-shadow, text-shadow)
   - Extract border styles and radii
   - Detect transitions and animations
   - Analyze opacity and backdrop effects

Input: CaptureResult with raw page data
Output: DesignSystem with all extracted tokens`,
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
  const progressPublisher = createProgressPublisher(websiteId, 'extractor');

  return (phase: ExtractorPhase, percent: number, message: string) => {
    // Map extractor phases to CaptureProgress phases
    const capturePhase: CaptureProgress['phase'] = phase === 'extracting'
      ? 'extracting'
      : phase === 'complete'
      ? 'complete'
      : phase === 'failed'
      ? 'failed'
      : 'initializing';

    const progress: CaptureProgress = {
      phase: capturePhase,
      percent,
      message,
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
 * Validate that capture result has raw data
 */
function validateCaptureResult(captureResult: CaptureResult | undefined): RawPageData | null {
  if (!captureResult) {
    return null;
  }

  if (!captureResult.rawData) {
    return null;
  }

  return captureResult.rawData;
}

// ====================
// MAIN EXTRACTION FUNCTION
// ====================

/**
 * Execute the extractor agent
 *
 * Wraps the synthesizeDesignSystem() function from lib/design-system/synthesizer.ts
 * with agent infrastructure (progress tracking, message bus, error handling).
 *
 * @param options - Extractor execution options
 * @returns Promise resolving to extractor agent result
 *
 * @example
 * ```typescript
 * const result = await executeExtractor({
 *   websiteId: 'website-123',
 *   url: 'https://example.com',
 *   rawData: captureResult.rawData,
 *   onProgress: (progress) => console.log(progress.message),
 * });
 * ```
 */
export async function executeExtractor(
  options: ExtractorOptions
): Promise<ExtractorAgentResult> {
  const {
    websiteId,
    url,
    rawData,
    synthesizeOptions = {},
    maxRetries = 3,
    onProgress,
  } = options;

  // Publish agent started event
  publishAgentStarted(websiteId, 'extractor', 'Starting extractor agent...');

  // Create progress emitter
  const emitProgress = createProgressEmitter(websiteId, onProgress);

  try {
    // Validate raw data
    emitProgress('initializing', 5, 'Validating extracted data...');

    const validation = validateRawPageData(rawData);
    if (!validation.isValid) {
      throw new Error(`Invalid raw data: ${validation.errors.join(', ')}`);
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => {
        emitProgress('initializing', 10, `Warning: ${warning}`);
      });
    }

    // Execute extraction with retry logic
    emitProgress('extracting', 20, 'Extracting design tokens...');

    const extractionRetry = await withRetry(
      async () => {
        emitProgress('extracting', 30, 'Extracting colors...');

        emitProgress('extracting', 45, 'Extracting typography...');

        emitProgress('extracting', 60, 'Extracting spacing patterns...');

        emitProgress('extracting', 75, 'Extracting visual effects...');

        // Synthesize the design system
        const designSystem = synthesizeDesignSystem(rawData, synthesizeOptions);

        emitProgress('extracting', 90, 'Synthesizing design system...');

        return designSystem;
      },
      maxRetries,
      'Design token extraction'
    );

    if (!extractionRetry.success || !extractionRetry.result) {
      throw new Error(extractionRetry.error || 'Extraction failed');
    }

    const designSystem = extractionRetry.result;

    // Update shared context with extraction result
    updateContext(websiteId, {
      status: 'extracting',
      designSystem: designSystem,
    });

    // Publish agent completed event
    publishAgentCompleted(
      websiteId,
      'extractor',
      `Design system extracted successfully`,
      designSystem
    );

    emitProgress('complete', 100, 'Design system extraction completed');

    return {
      success: true,
      agentType: 'extractor',
      message: 'Design system extracted successfully',
      data: designSystem,
    };
  } catch (error) {
    // Handle extraction failure
    const extractionError = createError(
      2,
      error instanceof Error ? error : String(error),
      true
    );

    emitProgress('failed', 0, `Extraction failed: ${extractionError.message}`);
    publishAgentFailed(websiteId, 'extractor', extractionError);

    return {
      success: false,
      agentType: 'extractor',
      message: 'Extractor agent failed',
      error: {
        message: extractionError.message,
        details: extractionError.details,
        recoverable: true,
      },
    };
  }
}

/**
 * Get the extractor agent configuration
 * Used by the agent registry for agent instantiation
 */
export function getExtractorConfig() {
  return {
    type: 'extractor' as const,
    model: 'sonnet' as const,
    maxRetries: 3,
    timeout: 180000, // 3 minutes
    verbose: false,
  };
}
