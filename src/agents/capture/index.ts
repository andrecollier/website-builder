/**
 * Capture Agent Module
 *
 * Handles all Playwright operations for website capture including:
 * - Browser lifecycle management
 * - Page navigation and content loading
 * - Full-page and section screenshots
 * - Section detection
 * - Design data extraction
 *
 * Model: Haiku (fast, simple Playwright operations)
 */

// Claude Agent SDK imports
import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';

import type {
  CaptureAgentResult,
  AgentContext,
  RetryResult,
} from '../types';
import type {
  CaptureProgress,
  CaptureResult,
  ExtractionError,
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
import { captureWebsite } from '@/lib/playwright/capture';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Options for the capture agent execution
 */
export interface CaptureOptions {
  /** Website ID for output directory naming */
  websiteId: string;
  /** URL to capture */
  url: string;
  /** Viewport width (default: from CAPTURE_CONFIG) */
  viewportWidth?: number;
  /** Viewport height (default: from CAPTURE_CONFIG) */
  viewportHeight?: number;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Page load timeout in ms (default: 30000) */
  pageTimeout?: number;
  /** Skip cache lookup (default: false) */
  skipCache?: boolean;
  /** Headless mode (default: true) */
  headless?: boolean;
  /** Callback for progress updates */
  onProgress?: (progress: CaptureProgress) => void;
}

// ====================
// AGENT DEFINITION (Claude SDK)
// ====================

/**
 * Capture Agent Definition for Claude SDK
 *
 * This agent handles all Playwright operations for website capture,
 * including browser automation, screenshot capture, and section detection.
 */
export const captureAgentDef: AgentDefinition = {
  description: 'Capture agent that handles Playwright operations for website capture',
  prompt: `You are the Capture Agent for the Website Cooker extraction pipeline. Your role is to:

1. Browser Operations:
   - Launch and manage Playwright browser instances
   - Navigate to target URLs
   - Handle lazy-loaded content by scrolling
   - Manage page timeouts and retries

2. Screenshot Capture:
   - Capture full-page screenshots
   - Detect and capture individual page sections
   - Save screenshots to the filesystem

3. Section Detection:
   - Identify distinct UI sections (header, hero, features, etc.)
   - Extract section metadata (type, position, dimensions)
   - Generate section-specific screenshots

4. Data Extraction:
   - Extract raw page data (styles, fonts, images)
   - Prepare data for the Extractor Agent

Output: CaptureResult with screenshots, sections, and raw data.`,
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
  const progressPublisher = createProgressPublisher(websiteId, 'capture');

  return (phase: CaptureProgress['phase'], percent: number, message: string, sectionInfo?: { current: number; total: number }) => {
    const progress: CaptureProgress = {
      phase,
      percent,
      message,
      currentSection: sectionInfo?.current,
      totalSections: sectionInfo?.total,
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

// ====================
// MAIN CAPTURE FUNCTION
// ====================

/**
 * Execute the capture agent
 *
 * Wraps the existing captureWebsite() function from lib/playwright/capture.ts
 * with agent infrastructure (progress tracking, message bus, error handling).
 *
 * @param options - Capture execution options
 * @returns Promise resolving to capture agent result
 *
 * @example
 * ```typescript
 * const result = await executeCapture({
 *   websiteId: 'website-123',
 *   url: 'https://example.com',
 *   onProgress: (progress) => console.log(progress.message),
 * });
 * ```
 */
export async function executeCapture(
  options: CaptureOptions
): Promise<CaptureAgentResult> {
  const {
    websiteId,
    url,
    viewportWidth,
    viewportHeight,
    maxRetries = 3,
    pageTimeout,
    skipCache = false,
    headless = true,
    onProgress,
  } = options;

  // Publish agent started event
  publishAgentStarted(websiteId, 'capture', 'Starting capture agent...');

  // Create progress emitter
  const emitProgress = createProgressEmitter(websiteId, onProgress);

  try {
    // Execute capture with retry logic
    emitProgress('initializing', 5, 'Initializing capture agent...');

    const captureRetry = await withRetry(
      async () => {
        const result = await captureWebsite({
          websiteId,
          url,
          viewportWidth,
          viewportHeight,
          maxRetries,
          pageTimeout,
          skipCache,
          headless,
          onProgress: (progress) => {
            // Forward progress updates through the agent's progress emitter
            emitProgress(
              progress.phase,
              progress.percent,
              progress.message,
              progress.currentSection && progress.totalSections
                ? { current: progress.currentSection, total: progress.totalSections }
                : undefined
            );
          },
        });

        if (!result.success) {
          throw new Error(result.error || 'Capture failed');
        }

        return result;
      },
      maxRetries,
      'Website capture'
    );

    if (!captureRetry.success || !captureRetry.result) {
      throw new Error(captureRetry.error || 'Capture failed');
    }

    const captureResult = captureRetry.result;

    // Update shared context with capture result
    updateContext(websiteId, {
      status: 'capturing',
      captureResult: captureResult,
    });

    // Publish agent completed event
    publishAgentCompleted(
      websiteId,
      'capture',
      `Capture completed: ${captureResult.sections.length} sections captured`,
      captureResult
    );

    emitProgress('complete', 100, 'Capture completed successfully');

    return {
      success: true,
      agentType: 'capture',
      message: `Capture completed successfully: ${captureResult.sections.length} sections captured`,
      data: captureResult,
    };
  } catch (error) {
    // Handle capture failure
    const extractionError = createError(
      1,
      error instanceof Error ? error : String(error),
      true
    );

    emitProgress('failed', 0, `Capture failed: ${extractionError.message}`);
    publishAgentFailed(websiteId, 'capture', extractionError);

    return {
      success: false,
      agentType: 'capture',
      message: 'Capture agent failed',
      error: {
        message: extractionError.message,
        details: extractionError.details,
        recoverable: true,
      },
    };
  }
}

/**
 * Get the capture agent configuration
 * Used by the agent registry for agent instantiation
 */
export function getCaptureConfig() {
  return {
    type: 'capture' as const,
    model: 'haiku' as const,
    maxRetries: 3,
    timeout: 120000, // 2 minutes
    verbose: false,
  };
}
