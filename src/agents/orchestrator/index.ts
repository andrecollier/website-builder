/**
 * Orchestrator Agent Module
 *
 * Main orchestrator agent that coordinates the entire extraction pipeline.
 * Delegates to specialist agents: Capture → Extract → Generate → Compare.
 * Handles error recovery, progress tracking, and pipeline coordination.
 *
 * Model: Sonnet (complex planning and coordination)
 */

// Claude Agent SDK imports
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentDefinition, SDKMessage } from '@anthropic-ai/claude-agent-sdk';

import type {
  OrchestratorAgentResult,
  AgentContext,
  CaptureAgentResult,
  ExtractorAgentResult,
  GeneratorAgentResult,
  ComparatorAgentResult,
  RetryResult,
} from '../types';
import type {
  CaptureProgress,
  ExtractionError,
  CaptureResult,
  DesignSystem,
  GeneratedComponent,
} from '@/types';
import {
  getContext,
  updateContext,
  updateProgress,
  addError,
  completeContext,
  failContext,
} from '../shared/context';
import {
  publishPipelineStarted,
  publishPipelineCompleted,
  publishPipelineFailed,
  publishAgentStarted,
  publishAgentCompleted,
  publishAgentFailed,
  createProgressPublisher,
} from '../shared/messages';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Options for the orchestrator execution
 */
export interface OrchestratorOptions {
  /** Website ID for tracking */
  websiteId: string;
  /** URL to extract */
  url: string;
  /** Maximum retry attempts per agent (default: 3) */
  maxRetries?: number;
  /** Skip cache lookup (default: false) */
  skipCache?: boolean;
  /** Callback for progress updates */
  onProgress?: (progress: CaptureProgress) => void;
}

/**
 * Pipeline phase identifier
 */
type PipelinePhase = 'capture' | 'extract' | 'generate' | 'compare';

/**
 * Result of a pipeline phase execution
 */
interface PhaseResult {
  phase: PipelinePhase;
  success: boolean;
  error?: ExtractionError;
  data?: unknown;
}

// ====================
// AGENT DEFINITION (Claude SDK)
// ====================

/**
 * Orchestrator Agent Definition for Claude SDK
 *
 * This agent coordinates the entire extraction pipeline by delegating
 * to specialist agents (Capture, Extractor, Generator, Comparator) and
 * ensuring correct phase execution order.
 */
export const orchestratorAgentDef: AgentDefinition = {
  description: 'Orchestrator agent that coordinates the entire extraction pipeline (Capture → Extract → Generate → Compare)',
  prompt: `You are the Orchestrator Agent for the Website Cooker extraction pipeline. Your role is to:

1. Coordinate the extraction pipeline phases in correct order:
   - Phase 1: Capture (screenshots and page data)
   - Phase 2: Extract (design system tokens)
   - Phase 3: Generate (React components)
   - Phase 4: Compare (visual comparison)

2. Delegate tasks to specialist agents:
   - Capture Agent (model: haiku) - Playwright operations
   - Extractor Agent (model: sonnet) - Design token extraction
   - Generator Agent (model: sonnet) - Component generation
   - Comparator Agent (model: haiku) - Visual comparison

3. Track progress and handle errors:
   - Monitor each phase completion
   - Catch and report errors
   - Continue pipeline if possible after errors

4. Ensure data flows correctly:
   - Capture result → Extractor
   - Capture result + Design system → Generator
   - Generated components → Comparator

Use the Task tool to spawn specialist agents as needed.`,
  tools: ['Task'], // Enable subagent spawning
  model: 'sonnet'
};

// ====================
// UTILITY FUNCTIONS
// ====================

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

/**
 * Create progress emitter helper
 */
function createProgressEmitter(
  websiteId: string,
  onProgress?: (progress: CaptureProgress) => void
) {
  const progressPublisher = createProgressPublisher(websiteId, 'orchestrator');

  return (phase: CaptureProgress['phase'], percent: number, message: string) => {
    const progress: CaptureProgress = {
      phase,
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
 * Create AgentContext for delegated agents
 */
function createAgentContext(websiteId: string, url: string): AgentContext {
  return {
    websiteId,
    url,
    getState: () => {
      const state = getContext(websiteId);
      if (!state) {
        throw new Error(`Context not found for website ${websiteId}`);
      }
      return state;
    },
    updateState: (updates) => {
      updateContext(websiteId, updates);
    },
    updateProgress: (progress) => {
      updateProgress(websiteId, progress);
    },
    addError: (error) => {
      addError(websiteId, error);
    },
    complete: () => {
      completeContext(websiteId);
    },
    fail: (error) => {
      failContext(websiteId, error);
    },
  };
}

// ====================
// AGENT DELEGATION (Stubs for now - will be implemented with actual agents)
// ====================

/**
 * Delegate to Capture Agent
 * TODO: Replace with actual Claude SDK agent invocation when Capture agent is implemented
 */
async function delegateToCaptureAgent(
  context: AgentContext,
  options: OrchestratorOptions
): Promise<CaptureAgentResult> {
  // Stub implementation - will be replaced with actual agent
  publishAgentStarted(options.websiteId, 'capture', 'Starting capture agent...');

  try {
    // Import and call the existing capture functionality
    const { captureWebsite } = await import('@/lib/playwright/capture');

    const result = await captureWebsite({
      websiteId: options.websiteId,
      url: options.url,
      skipCache: options.skipCache,
      onProgress: (progress) => {
        // Forward progress to orchestrator callback
        if (options.onProgress) {
          options.onProgress(progress);
        }
        // Update context
        context.updateProgress(progress);
      },
    });

    // Update context with capture result
    if (result.success) {
      context.updateState({
        status: 'capturing',
        captureResult: result,
      });
    }

    publishAgentCompleted(options.websiteId, 'capture', 'Capture completed successfully', result);

    return {
      success: result.success,
      agentType: 'capture',
      message: result.success ? 'Capture completed successfully' : 'Capture failed',
      data: result,
      error: result.error
        ? {
            message: result.error,
            recoverable: true,
          }
        : undefined,
    };
  } catch (error) {
    const extractionError = createError(1, error instanceof Error ? error : String(error), true);
    publishAgentFailed(options.websiteId, 'capture', extractionError);

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
 * Delegate to Extractor Agent
 * TODO: Replace with actual Claude SDK agent invocation when Extractor agent is implemented
 */
async function delegateToExtractorAgent(
  context: AgentContext,
  captureResult: CaptureResult
): Promise<ExtractorAgentResult> {
  publishAgentStarted(context.websiteId, 'extractor', 'Starting extractor agent...');

  try {
    // Import and call the existing design system synthesis
    const { synthesizeDesignSystem, getDefaultDesignSystem } = await import(
      '@/lib/design-system'
    );

    // Generate design system from raw data or use defaults
    const designSystem = captureResult.rawData
      ? synthesizeDesignSystem(captureResult.rawData)
      : getDefaultDesignSystem(context.url);

    // Update context with design system
    context.updateState({
      status: 'extracting',
      designSystem,
    });

    publishAgentCompleted(
      context.websiteId,
      'extractor',
      'Extraction completed successfully',
      designSystem
    );

    return {
      success: true,
      agentType: 'extractor',
      message: 'Design system extracted successfully',
      data: designSystem,
    };
  } catch (error) {
    const extractionError = createError(2, error instanceof Error ? error : String(error), true);
    publishAgentFailed(context.websiteId, 'extractor', extractionError);

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
 * Delegate to Generator Agent
 * Launches a browser, navigates to the URL, and generates real components
 * using the component-generator module.
 */
async function delegateToGeneratorAgent(
  context: AgentContext,
  captureResult: CaptureResult,
  designSystem: DesignSystem
): Promise<GeneratorAgentResult> {
  publishAgentStarted(context.websiteId, 'generator', 'Starting generator agent...');

  // Import necessary modules
  const { chromium } = await import('playwright');
  const { generateComponents } = await import('@/lib/generator/component-generator');
  const { CAPTURE_CONFIG } = await import('@/types');

  let browser = null;

  try {
    // Launch browser for component generation
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    await page.setViewportSize({
      width: CAPTURE_CONFIG.viewport.width,
      height: CAPTURE_CONFIG.viewport.height,
    });

    // Navigate to the URL
    await page.goto(context.url, {
      waitUntil: 'domcontentloaded',
      timeout: CAPTURE_CONFIG.pageTimeout,
    });

    // Wait for initial render
    await page.waitForTimeout(1000);

    // Generate components using the real generator
    const result = await generateComponents(page, {
      websiteId: context.websiteId,
      versionId: 'v1',
      designSystem,
      onProgress: (progress) => {
        context.updateProgress({
          phase: 'capturing',
          percent: 60 + (progress.percent * 0.2), // Map to 60-80% range
          message: progress.message,
        });
      },
    });

    // Close browser
    await browser.close();
    browser = null;

    if (!result.success) {
      throw new Error(result.errors[0]?.message || 'Component generation failed');
    }

    // Update context with generated components
    context.updateState({
      status: 'generating',
      components: result.components,
    });

    publishAgentCompleted(
      context.websiteId,
      'generator',
      `Generated ${result.components.length} components successfully`,
      result.components
    );

    return {
      success: true,
      agentType: 'generator',
      message: `Generated ${result.metadata.generatedCount} components (${result.metadata.failedCount} failed)`,
      data: result.components,
    };
  } catch (error) {
    // Ensure browser is closed on error
    if (browser) {
      await browser.close();
    }

    const extractionError = createError(4, error instanceof Error ? error : String(error), true);
    publishAgentFailed(context.websiteId, 'generator', extractionError);

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
 * Delegate to Scaffold Agent
 * Creates a runnable Next.js project from generated components
 */
async function delegateToScaffoldAgent(
  context: AgentContext
): Promise<{ success: boolean; error?: string }> {
  publishAgentStarted(context.websiteId, 'scaffold', 'Scaffolding generated site...');

  try {
    const { scaffoldGeneratedSite } = await import('@/lib/scaffold');
    const path = await import('path');

    const websitesDir = process.env.WEBSITES_DIR || path.join(process.cwd(), 'Websites');

    const result = await scaffoldGeneratedSite({
      websiteId: context.websiteId,
      websitesDir,
      siteName: 'Generated Site',
    });

    if (!result.success) {
      throw new Error(result.error || 'Scaffold failed');
    }

    publishAgentCompleted(
      context.websiteId,
      'scaffold',
      'Scaffold completed successfully',
      { generatedPath: result.generatedPath }
    );

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    publishAgentFailed(context.websiteId, 'scaffold', createError(5, error instanceof Error ? error : String(error), true));
    return { success: false, error: errorMsg };
  }
}

/**
 * Delegate to Comparator Agent
 * Starts the generated site, captures screenshots, and runs visual comparison
 */
async function delegateToComparatorAgent(
  context: AgentContext,
  components: GeneratedComponent[]
): Promise<ComparatorAgentResult> {
  publishAgentStarted(context.websiteId, 'comparator', 'Starting comparator agent...');

  try {
    // Import comparison module that handles full workflow
    const { runComparison } = await import('@/lib/comparison/compare-section');
    const path = await import('path');

    // Get websites base directory
    const websitesDir = process.env.WEBSITES_DIR || path.join(process.cwd(), 'Websites');

    // Run full comparison: start server → capture screenshots → compare
    const comparisonResult = await runComparison({
      websiteId: context.websiteId,
      websitesDir,
      autoStartServer: true,
    });

    // Update context with comparison results
    context.updateState({
      status: 'comparing',
    });

    publishAgentCompleted(
      context.websiteId,
      'comparator',
      'Comparison completed successfully',
      comparisonResult
    );

    return {
      success: true,
      agentType: 'comparator',
      message: `Comparison completed with ${comparisonResult.overallAccuracy.toFixed(1)}% accuracy`,
      data: { overallAccuracy: comparisonResult.overallAccuracy },
    };
  } catch (error) {
    const extractionError = createError(6, error instanceof Error ? error : String(error), true);
    publishAgentFailed(context.websiteId, 'comparator', extractionError);

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

// ====================
// MAIN ORCHESTRATOR
// ====================

/**
 * Execute the complete extraction pipeline
 *
 * Coordinates the following phases:
 * 1. Capture: Screenshot and page data collection
 * 2. Extract: Design system token extraction
 * 3. Generate: Component generation with variants (parallel)
 * 4. Compare: Visual comparison with reference (parallel)
 *
 * @param options - Orchestrator execution options
 * @returns Promise resolving to orchestrator result
 */
export async function executeOrchestrator(
  options: OrchestratorOptions
): Promise<OrchestratorAgentResult> {
  const { websiteId, url, maxRetries = 3 } = options;

  // Initialize shared context
  const { initializeContext } = await import('../shared/context');
  initializeContext(websiteId, url);

  // Create agent context for delegation
  const agentContext = createAgentContext(websiteId, url);

  // Create progress emitter
  const emitProgress = createProgressEmitter(websiteId, options.onProgress);

  // Publish pipeline started event
  publishPipelineStarted(websiteId, 'Starting extraction pipeline');
  emitProgress('initializing', 0, 'Starting extraction pipeline...');

  // Pipeline result accumulator
  const pipelineResult: {
    captureResult?: CaptureResult;
    designSystem?: DesignSystem;
    components?: GeneratedComponent[];
    overallAccuracy?: number;
  } = {};

  try {
    // ========================================
    // PHASE 1: CAPTURE
    // ========================================
    emitProgress('capturing', 10, 'Phase 1/4: Capturing website...');

    const captureRetry = await withRetry(
      async () => {
        const result = await delegateToCaptureAgent(agentContext, options);
        if (!result.success || !result.data) {
          throw new Error(result.error?.message || 'Capture failed');
        }
        return result;
      },
      maxRetries,
      'Capture phase'
    );

    if (!captureRetry.success || !captureRetry.result?.data) {
      throw new Error(captureRetry.error || 'Capture phase failed');
    }

    pipelineResult.captureResult = captureRetry.result.data;
    emitProgress('capturing', 30, 'Capture completed successfully');

    // ========================================
    // PHASE 2: EXTRACT
    // ========================================
    emitProgress('extracting', 40, 'Phase 2/4: Extracting design system...');

    const extractorRetry = await withRetry(
      async () => {
        const result = await delegateToExtractorAgent(
          agentContext,
          captureRetry.result!.data!
        );
        if (!result.success || !result.data) {
          throw new Error(result.error?.message || 'Extraction failed');
        }
        return result;
      },
      maxRetries,
      'Extract phase'
    );

    if (!extractorRetry.success || !extractorRetry.result?.data) {
      throw new Error(extractorRetry.error || 'Extract phase failed');
    }

    pipelineResult.designSystem = extractorRetry.result.data;
    emitProgress('extracting', 55, 'Design system extracted successfully');

    // ========================================
    // PHASE 3: GENERATE
    // ========================================
    emitProgress('capturing', 60, 'Phase 3/4: Generating components...');

    const generatorRetry = await withRetry(
      async () => {
        const result = await delegateToGeneratorAgent(
          agentContext,
          captureRetry.result!.data!,
          extractorRetry.result!.data!
        );
        if (!result.success || !result.data) {
          throw new Error(result.error?.message || 'Generation failed');
        }
        return result;
      },
      maxRetries,
      'Generate phase'
    );

    if (!generatorRetry.success || !generatorRetry.result?.data) {
      throw new Error(generatorRetry.error || 'Generate phase failed');
    }

    pipelineResult.components = generatorRetry.result.data;
    emitProgress('capturing', 75, 'Components generated successfully');

    // ========================================
    // PHASE 3.5: SCAFFOLD
    // ========================================
    emitProgress('capturing', 78, 'Phase 3.5/4: Scaffolding generated site...');

    const scaffoldResult = await delegateToScaffoldAgent(agentContext);
    if (!scaffoldResult.success) {
      // Scaffold failure is non-fatal - continue with comparison (will have 0% accuracy)
      console.warn('Scaffold failed, comparison will have limited accuracy:', scaffoldResult.error);
    } else {
      emitProgress('capturing', 82, 'Scaffold completed successfully');
    }

    // ========================================
    // PHASE 4: COMPARE
    // ========================================
    emitProgress('capturing', 85, 'Phase 4/4: Comparing components...');

    const comparatorRetry = await withRetry(
      async () => {
        const result = await delegateToComparatorAgent(
          agentContext,
          generatorRetry.result!.data!
        );
        if (!result.success || !result.data) {
          throw new Error(result.error?.message || 'Comparison failed');
        }
        return result;
      },
      maxRetries,
      'Compare phase'
    );

    if (!comparatorRetry.success || !comparatorRetry.result?.data) {
      throw new Error(comparatorRetry.error || 'Compare phase failed');
    }

    pipelineResult.overallAccuracy = comparatorRetry.result.data.overallAccuracy;

    // ========================================
    // PIPELINE COMPLETE
    // ========================================
    emitProgress('complete', 100, 'Extraction pipeline completed successfully');
    agentContext.complete();
    publishPipelineCompleted(websiteId, 'Pipeline completed successfully');

    return {
      success: true,
      agentType: 'orchestrator',
      message: 'Extraction pipeline completed successfully',
      data: pipelineResult,
    };
  } catch (error) {
    // Handle pipeline failure
    const extractionError = createError(
      0,
      error instanceof Error ? error : String(error),
      false
    );

    emitProgress('failed', 0, `Pipeline failed: ${extractionError.message}`);
    agentContext.fail(extractionError);
    publishPipelineFailed(websiteId, extractionError);

    return {
      success: false,
      agentType: 'orchestrator',
      message: 'Extraction pipeline failed',
      data: pipelineResult,
      error: {
        message: extractionError.message,
        details: extractionError.details,
        recoverable: false,
      },
    };
  }
}

/**
 * Get the orchestrator agent configuration
 * Used by the agent registry for agent instantiation
 */
export function getOrchestratorConfig() {
  return {
    type: 'orchestrator' as const,
    model: 'sonnet' as const,
    maxRetries: 3,
    timeout: 300000, // 5 minutes
    verbose: false,
  };
}
