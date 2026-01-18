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
  /** Auto-improve if accuracy below target (default: false) */
  autoImprove?: boolean;
  /** Target accuracy for auto-improve (default: 80) */
  targetAccuracy?: number;
  /** Enable responsive capture at multiple viewports (default: true) */
  enableResponsive?: boolean;
  /** Enable component validation step (default: true) */
  enableComponentValidation?: boolean;
  /** Threshold for component validation pass (default: 80) */
  componentValidationThreshold?: number;
  /** Pause after component generation for user approval (default: false) */
  requireApproval?: boolean;
}

/**
 * State saved when pipeline pauses for approval
 */
export interface PipelineCheckpoint {
  websiteId: string;
  url: string;
  phase: 'awaiting_approval';
  savedAt: string;
  captureResult: CaptureResult;
  responsiveData?: {
    fullPagePaths: Record<string, string>;
    sections: any[];
    viewports: any[];
  };
  designSystem: DesignSystem;
  components: GeneratedComponent[];
  options: Omit<OrchestratorOptions, 'onProgress'>;
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
  description: 'Orchestrator agent that coordinates the entire extraction pipeline (Capture → Extract → Generate → Scaffold → Validate → Compare)',
  prompt: `You are the Orchestrator Agent for the Website Cooker extraction pipeline. Your role is to:

1. Coordinate the extraction pipeline phases in correct order:
   - Phase 1: Capture (screenshots and page data)
   - Phase 1.5: Responsive Capture (mobile, tablet viewports)
   - Phase 2: Extract (design system tokens)
   - Phase 3: Generate (React components)
   - Phase 4: Scaffold (Next.js project)
   - Phase 5: Component Validation (per-component accuracy check)
   - Phase 6: Compare (full-page visual comparison)
   - Phase 7: Improve (optional, if accuracy below target)

2. Delegate tasks to specialist agents:
   - Capture Agent (model: haiku) - Playwright operations
   - Extractor Agent (model: sonnet) - Design token extraction
   - Generator Agent (model: sonnet) - Component generation
   - Scaffold Agent - Next.js project scaffolding
   - Component Validator - Individual component accuracy validation
   - Comparator Agent (model: haiku) - Full-page visual comparison

3. Track progress and handle errors:
   - Monitor each phase completion
   - Catch and report errors
   - Continue pipeline if possible after errors
   - Flag components with <80% accuracy for review

4. Ensure data flows correctly:
   - Capture result → Extractor
   - Capture result + Design system → Generator
   - Generated components → Scaffold → Component Validation → Comparator

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
// CHECKPOINT MANAGEMENT
// ====================

/**
 * Save pipeline checkpoint for later resumption
 */
async function saveCheckpoint(checkpoint: PipelineCheckpoint): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const websitesDir = process.env.WEBSITES_DIR || path.join(process.cwd(), 'Websites');
  const checkpointDir = path.join(websitesDir, checkpoint.websiteId);
  const checkpointPath = path.join(checkpointDir, 'checkpoint.json');

  // Ensure directory exists
  await fs.mkdir(checkpointDir, { recursive: true });

  await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2), 'utf-8');
}

/**
 * Load pipeline checkpoint for resumption
 */
async function loadCheckpoint(websiteId: string): Promise<PipelineCheckpoint | null> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const websitesDir = process.env.WEBSITES_DIR || path.join(process.cwd(), 'Websites');
  const checkpointPath = path.join(websitesDir, websiteId, 'checkpoint.json');

  try {
    const data = await fs.readFile(checkpointPath, 'utf-8');
    return JSON.parse(data) as PipelineCheckpoint;
  } catch {
    return null;
  }
}

/**
 * Delete checkpoint after successful completion
 */
async function deleteCheckpoint(websiteId: string): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const websitesDir = process.env.WEBSITES_DIR || path.join(process.cwd(), 'Websites');
  const checkpointPath = path.join(websitesDir, websiteId, 'checkpoint.json');

  try {
    await fs.unlink(checkpointPath);
  } catch {
    // Ignore if file doesn't exist
  }
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
        // Map capture progress (0-100%) to orchestrator range (5-20%)
        const mappedProgress = {
          ...progress,
          percent: 5 + (progress.percent * 0.15), // 0% -> 5%, 100% -> 20%
        };
        // Forward mapped progress to orchestrator callback
        if (options.onProgress) {
          options.onProgress(mappedProgress);
        }
        // Update context with mapped progress
        context.updateProgress(mappedProgress);
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
 * Delegate to Responsive Capture
 * Captures at multiple viewports (mobile, tablet, desktop) for responsive generation
 */
async function delegateToResponsiveCapture(
  context: AgentContext,
  options: OrchestratorOptions
): Promise<{ success: boolean; responsiveData?: any; error?: string }> {
  publishAgentStarted(options.websiteId, 'responsive-capture', 'Starting responsive capture...');

  try {
    const { captureResponsive } = await import('@/lib/playwright/responsive-capture');

    const result = await captureResponsive({
      websiteId: options.websiteId,
      url: options.url,
      onProgress: (progress) => {
        // Map responsive capture progress to orchestrator range (20-28%)
        const mappedProgress = {
          ...progress,
          percent: 20 + (progress.percent * 0.08), // 0% -> 20%, 100% -> 28%
        };
        if (options.onProgress) {
          options.onProgress(mappedProgress);
        }
        context.updateProgress(mappedProgress);
      },
    });

    if (result.success) {
      publishAgentCompleted(
        options.websiteId,
        'responsive-capture',
        `Responsive capture complete: ${result.sections.length} sections at 3 viewports`,
        { sectionCount: result.sections.length }
      );

      return {
        success: true,
        responsiveData: {
          fullPagePaths: result.fullPagePaths,
          sections: result.sections,
          viewports: result.metadata.viewports,
        },
      };
    }

    return { success: false, error: result.error };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn('[Orchestrator] Responsive capture failed (non-fatal):', errorMsg);
    return { success: false, error: errorMsg };
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

    // Get reference sections from capture result to ensure section types match
    const referenceSections = captureResult.sections?.map((s) => ({
      id: s.id,
      type: s.type,
      boundingBox: s.boundingBox,
    }));

    // Generate components using the real generator with reference sections
    const result = await generateComponents(page, {
      websiteId: context.websiteId,
      versionId: 'v1',
      designSystem,
      referenceSections, // Pass reference sections to use correct types
      onProgress: (progress) => {
        context.updateProgress({
          phase: 'generating',
          percent: 38 + (progress.percent * 0.27), // Map to 38-65% range
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

/**
 * Component Validation Result type
 */
interface ComponentValidationAgentResult {
  success: boolean;
  totalComponents: number;
  passedComponents: number;
  failedComponents: number;
  averageAccuracy: number;
  flaggedComponents: string[];
  reportPath?: string;
}

/**
 * Delegate to Component Validation Agent
 * Validates each generated component against its reference screenshot
 */
async function delegateToComponentValidationAgent(
  context: AgentContext,
  options: {
    threshold?: number;
    onProgress?: (progress: { current: number; total: number; componentName: string }) => void;
  }
): Promise<ComponentValidationAgentResult> {
  publishAgentStarted(context.websiteId, 'component-validation', 'Starting component validation...');

  try {
    const { validateAllComponents } = await import('@/lib/comparison/component-validation');
    const path = await import('path');

    const websitesDir = process.env.WEBSITES_DIR || path.join(process.cwd(), 'Websites');
    const threshold = options.threshold ?? 80;

    const result = await validateAllComponents({
      websiteId: context.websiteId,
      websitesDir,
      autoStartServer: true,
      onProgress: options.onProgress,
    });

    // Identify components that failed validation (below threshold)
    const flaggedComponents = result.results
      .filter(r => r.accuracy < threshold)
      .map(r => `${r.componentName} (${r.accuracy.toFixed(1)}%)`);

    const reportPath = path.join(
      websitesDir,
      context.websiteId,
      'comparison',
      'component-validation',
      'report.json'
    );

    publishAgentCompleted(
      context.websiteId,
      'component-validation',
      `Component validation completed: ${result.passedComponents}/${result.totalComponents} passed (avg ${result.averageAccuracy.toFixed(1)}%)`,
      result
    );

    return {
      success: true,
      totalComponents: result.totalComponents,
      passedComponents: result.passedComponents,
      failedComponents: result.failedComponents,
      averageAccuracy: result.averageAccuracy,
      flaggedComponents,
      reportPath,
    };
  } catch (error) {
    const extractionError = createError(5.5, error instanceof Error ? error : String(error), true);
    publishAgentFailed(context.websiteId, 'component-validation', extractionError);

    return {
      success: false,
      totalComponents: 0,
      passedComponents: 0,
      failedComponents: 0,
      averageAccuracy: 0,
      flaggedComponents: [],
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
 * 1.5. Responsive Capture: Multi-viewport screenshots (mobile, tablet, desktop)
 * 2. Extract: Design system token extraction
 * 3. Generate: Component generation with variants
 * 4. Scaffold: Create runnable Next.js project
 * 5. Component Validation: Per-component accuracy check against reference
 * 6. Compare: Full-page visual comparison
 * 7. Improve: Optional auto-improvement if accuracy below target
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
    responsiveData?: {
      fullPagePaths: Record<string, string>;
      sections: any[];
      viewports: any[];
    };
    designSystem?: DesignSystem;
    components?: GeneratedComponent[];
    componentValidation?: {
      totalComponents: number;
      passedComponents: number;
      failedComponents: number;
      averageAccuracy: number;
      flaggedComponents: string[];
    };
    overallAccuracy?: number;
  } = {};

  try {
    // ========================================
    // PHASE 1: CAPTURE (5-20%)
    // ========================================
    emitProgress('capturing', 5, 'Phase 1/7: Capturing website sections...');

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
    emitProgress('capturing', 20, 'Desktop capture completed');

    // ========================================
    // PHASE 1.5: RESPONSIVE CAPTURE (20-28%)
    // ========================================
    const { enableResponsive = true } = options;
    let responsiveData: any = null;

    if (enableResponsive) {
      emitProgress('capturing', 20, 'Phase 1.5/7: Capturing responsive viewports (mobile, tablet)...');

      const responsiveResult = await delegateToResponsiveCapture(agentContext, options);

      if (responsiveResult.success) {
        responsiveData = responsiveResult.responsiveData;
        pipelineResult.responsiveData = responsiveData;
        emitProgress('capturing', 28, 'Responsive capture completed (3 viewports)');
      } else {
        // Responsive capture failure is non-fatal - continue with desktop-only
        console.warn('[Orchestrator] Responsive capture failed, continuing with desktop-only:', responsiveResult.error);
        emitProgress('capturing', 28, 'Responsive capture skipped (using desktop-only)');
      }
    } else {
      emitProgress('capturing', 28, 'Responsive capture disabled');
    }

    // ========================================
    // PHASE 2: EXTRACT (28-38%)
    // ========================================
    emitProgress('extracting', 30, 'Phase 2/7: Analyzing design system...');

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
    emitProgress('extracting', 38, 'Design tokens extracted successfully');

    // ========================================
    // PHASE 3: GENERATE (38-55%)
    // ========================================
    emitProgress('generating', 40, 'Phase 3/7: Generating React components (with responsive classes)...');

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
    emitProgress('generating', 55, 'Components generated successfully (with responsive Tailwind classes)');

    // ========================================
    // PHASE 4: SCAFFOLD (55-65%)
    // ========================================
    emitProgress('scaffolding', 57, 'Phase 4/7: Building Next.js project...');

    const scaffoldResult = await delegateToScaffoldAgent(agentContext);
    if (!scaffoldResult.success) {
      // Scaffold failure is non-fatal - continue with validation (will have 0% accuracy)
      console.warn('Scaffold failed, component validation will have limited accuracy:', scaffoldResult.error);
    } else {
      emitProgress('scaffolding', 65, 'Project scaffolded successfully');
    }

    // ========================================
    // APPROVAL GATE (if enabled) - After scaffold so user can preview
    // ========================================
    const { requireApproval = false } = options;

    if (requireApproval && scaffoldResult.success) {
      // Save checkpoint for later resumption
      const checkpoint: PipelineCheckpoint = {
        websiteId,
        url,
        phase: 'awaiting_approval',
        savedAt: new Date().toISOString(),
        captureResult: pipelineResult.captureResult!,
        responsiveData: pipelineResult.responsiveData,
        designSystem: pipelineResult.designSystem!,
        components: pipelineResult.components!,
        options: {
          websiteId: options.websiteId,
          url: options.url,
          maxRetries: options.maxRetries,
          skipCache: options.skipCache,
          autoImprove: options.autoImprove,
          targetAccuracy: options.targetAccuracy,
          enableResponsive: options.enableResponsive,
          enableComponentValidation: options.enableComponentValidation,
          componentValidationThreshold: options.componentValidationThreshold,
          requireApproval: false, // Don't require approval again on resume
        },
      };

      await saveCheckpoint(checkpoint);

      emitProgress('awaiting_approval', 65, 'Scaffold complete - preview available. Awaiting approval to continue validation.');

      // Update context to awaiting_approval status
      agentContext.updateState({
        status: 'awaiting_approval' as any,
      });

      return {
        success: true,
        agentType: 'orchestrator',
        message: 'Pipeline paused - scaffold complete, preview available. Awaiting user approval to continue.',
        data: {
          ...pipelineResult,
          status: 'awaiting_approval',
          checkpointSaved: true,
          scaffoldPath: scaffoldResult,
        },
      };
    }

    // ========================================
    // PHASE 5: COMPONENT VALIDATION (65-80%)
    // ========================================
    const { enableComponentValidation = true, componentValidationThreshold = 80 } = options;

    if (enableComponentValidation && scaffoldResult.success) {
      emitProgress('validating', 67, 'Phase 5/7: Validating individual components...');

      const validationResult = await delegateToComponentValidationAgent(agentContext, {
        threshold: componentValidationThreshold,
        onProgress: (progress) => {
          // Map validation progress to 67-80%
          const percent = 67 + ((progress.current / progress.total) * 13);
          emitProgress('validating', percent, `Validating ${progress.componentName}...`);
        },
      });

      if (validationResult.success) {
        pipelineResult.componentValidation = {
          totalComponents: validationResult.totalComponents,
          passedComponents: validationResult.passedComponents,
          failedComponents: validationResult.failedComponents,
          averageAccuracy: validationResult.averageAccuracy,
          flaggedComponents: validationResult.flaggedComponents,
        };

        const flaggedMsg = validationResult.flaggedComponents.length > 0
          ? ` | Flagged (<${componentValidationThreshold}%): ${validationResult.flaggedComponents.join(', ')}`
          : '';
        emitProgress(
          'validating',
          80,
          `Component validation: ${validationResult.passedComponents}/${validationResult.totalComponents} passed (${validationResult.averageAccuracy.toFixed(1)}% avg)${flaggedMsg}`
        );
      } else {
        console.warn('[Orchestrator] Component validation failed (non-fatal), continuing...');
        emitProgress('validating', 80, 'Component validation skipped due to error');
      }
    } else {
      if (!scaffoldResult.success) {
        emitProgress('validating', 80, 'Component validation skipped (scaffold failed)');
      } else {
        emitProgress('validating', 80, 'Component validation disabled');
      }
    }

    // ========================================
    // PHASE 6: COMPARE (80-95%)
    // ========================================
    emitProgress('comparing', 82, 'Phase 6/7: Running full-page comparison...');

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
    emitProgress('comparing', 95, `Full-page comparison complete: ${pipelineResult.overallAccuracy?.toFixed(1)}% accuracy`);

    // ========================================
    // PHASE 7 (OPTIONAL): IMPROVE (95-100%)
    // ========================================
    const { autoImprove = false, targetAccuracy = 80 } = options;

    if (autoImprove && pipelineResult.overallAccuracy < targetAccuracy) {
      emitProgress('improving', 96, 'Running improvement agents...');

      // Check if API key is available
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const { improveWebsite } = await import('../improvement-orchestrator');
          const improvementResult = await improveWebsite(websiteId);

          if (improvementResult.success) {
            emitProgress('improving', 98, 'Improvements applied, re-comparing...');

            // Re-run comparison to get updated accuracy
            const recompareResult = await delegateToComparatorAgent(
              agentContext,
              generatorRetry.result!.data!
            );

            if (recompareResult.success && recompareResult.data) {
              pipelineResult.overallAccuracy = recompareResult.data.overallAccuracy;
            }
          }
        } catch (improvementError) {
          // Log but don't fail - improvement is optional
          console.warn('[Orchestrator] Improvement phase failed:', improvementError);
        }
      } else {
        console.warn('[Orchestrator] Skipping improvement: ANTHROPIC_API_KEY not set');
      }
    }

    // ========================================
    // PIPELINE COMPLETE
    // ========================================
    const finalMessage = autoImprove
      ? `Extraction pipeline completed with ${pipelineResult.overallAccuracy?.toFixed(1)}% accuracy`
      : 'Extraction pipeline completed successfully';

    emitProgress('complete', 100, finalMessage);
    agentContext.complete();
    publishPipelineCompleted(websiteId, finalMessage);

    return {
      success: true,
      agentType: 'orchestrator',
      message: finalMessage,
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

/**
 * Continue a paused pipeline from checkpoint
 *
 * Resumes execution from the scaffold phase after user approval.
 * Loads saved state and continues with phases 4-7.
 *
 * @param websiteId - Website ID to resume
 * @param onProgress - Optional progress callback
 * @returns Promise resolving to orchestrator result
 */
export async function continueOrchestrator(
  websiteId: string,
  onProgress?: (progress: CaptureProgress) => void
): Promise<OrchestratorAgentResult> {
  // Load checkpoint
  const checkpoint = await loadCheckpoint(websiteId);

  if (!checkpoint) {
    return {
      success: false,
      agentType: 'orchestrator',
      message: 'No checkpoint found for this website',
      error: {
        message: `No checkpoint found for website ${websiteId}. Cannot continue pipeline.`,
        recoverable: false,
      },
    };
  }

  if (checkpoint.phase !== 'awaiting_approval') {
    return {
      success: false,
      agentType: 'orchestrator',
      message: `Invalid checkpoint phase: ${checkpoint.phase}`,
      error: {
        message: `Expected checkpoint phase 'awaiting_approval', got '${checkpoint.phase}'`,
        recoverable: false,
      },
    };
  }

  const { url, captureResult, responsiveData, designSystem, components, options } = checkpoint;

  // Reinitialize context
  const { initializeContext } = await import('../shared/context');
  initializeContext(websiteId, url);

  // Create agent context
  const agentContext = createAgentContext(websiteId, url);

  // Create progress emitter
  const emitProgress = createProgressEmitter(websiteId, onProgress);

  // Publish pipeline resumed event
  publishPipelineStarted(websiteId, 'Resuming extraction pipeline after approval');
  emitProgress('scaffolding', 55, 'Resuming pipeline after approval...');

  // Pipeline result accumulator with restored state
  const pipelineResult: {
    captureResult?: CaptureResult;
    responsiveData?: {
      fullPagePaths: Record<string, string>;
      sections: any[];
      viewports: any[];
    };
    designSystem?: DesignSystem;
    components?: GeneratedComponent[];
    componentValidation?: {
      totalComponents: number;
      passedComponents: number;
      failedComponents: number;
      averageAccuracy: number;
      flaggedComponents: string[];
    };
    overallAccuracy?: number;
  } = {
    captureResult,
    responsiveData,
    designSystem,
    components,
  };

  // Update context with restored state
  agentContext.updateState({
    status: 'scaffolding',
    captureResult,
    designSystem,
    components,
  });

  const maxRetries = options.maxRetries ?? 3;

  try {
    // ========================================
    // PHASE 4: SCAFFOLD (55-65%)
    // ========================================
    emitProgress('scaffolding', 57, 'Phase 4/7: Building Next.js project...');

    const scaffoldResult = await delegateToScaffoldAgent(agentContext);
    if (!scaffoldResult.success) {
      console.warn('Scaffold failed, component validation will have limited accuracy:', scaffoldResult.error);
    } else {
      emitProgress('scaffolding', 65, 'Project scaffolded successfully');
    }

    // ========================================
    // PHASE 5: COMPONENT VALIDATION (65-80%)
    // ========================================
    const { enableComponentValidation = true, componentValidationThreshold = 80 } = options;

    if (enableComponentValidation && scaffoldResult.success) {
      emitProgress('validating', 67, 'Phase 5/7: Validating individual components...');

      const validationResult = await delegateToComponentValidationAgent(agentContext, {
        threshold: componentValidationThreshold,
        onProgress: (progress) => {
          const percent = 67 + ((progress.current / progress.total) * 13);
          emitProgress('validating', percent, `Validating ${progress.componentName}...`);
        },
      });

      if (validationResult.success) {
        pipelineResult.componentValidation = {
          totalComponents: validationResult.totalComponents,
          passedComponents: validationResult.passedComponents,
          failedComponents: validationResult.failedComponents,
          averageAccuracy: validationResult.averageAccuracy,
          flaggedComponents: validationResult.flaggedComponents,
        };

        const flaggedMsg = validationResult.flaggedComponents.length > 0
          ? ` | Flagged (<${componentValidationThreshold}%): ${validationResult.flaggedComponents.join(', ')}`
          : '';
        emitProgress(
          'validating',
          80,
          `Component validation: ${validationResult.passedComponents}/${validationResult.totalComponents} passed (${validationResult.averageAccuracy.toFixed(1)}% avg)${flaggedMsg}`
        );
      } else {
        console.warn('[Orchestrator] Component validation failed (non-fatal), continuing...');
        emitProgress('validating', 80, 'Component validation skipped due to error');
      }
    } else {
      if (!scaffoldResult.success) {
        emitProgress('validating', 80, 'Component validation skipped (scaffold failed)');
      } else {
        emitProgress('validating', 80, 'Component validation disabled');
      }
    }

    // ========================================
    // PHASE 6: COMPARE (80-95%)
    // ========================================
    emitProgress('comparing', 82, 'Phase 6/7: Running full-page comparison...');

    const comparatorRetry = await withRetry(
      async () => {
        const result = await delegateToComparatorAgent(agentContext, components);
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
    emitProgress('comparing', 95, `Full-page comparison complete: ${pipelineResult.overallAccuracy?.toFixed(1)}% accuracy`);

    // ========================================
    // PHASE 7 (OPTIONAL): IMPROVE (95-100%)
    // ========================================
    const { autoImprove = false, targetAccuracy = 80 } = options;

    if (autoImprove && pipelineResult.overallAccuracy < targetAccuracy) {
      emitProgress('improving', 96, 'Running improvement agents...');

      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const { improveWebsite } = await import('../improvement-orchestrator');
          const improvementResult = await improveWebsite(websiteId);

          if (improvementResult.success) {
            emitProgress('improving', 98, 'Improvements applied, re-comparing...');

            const recompareResult = await delegateToComparatorAgent(agentContext, components);

            if (recompareResult.success && recompareResult.data) {
              pipelineResult.overallAccuracy = recompareResult.data.overallAccuracy;
            }
          }
        } catch (improvementError) {
          console.warn('[Orchestrator] Improvement phase failed:', improvementError);
        }
      } else {
        console.warn('[Orchestrator] Skipping improvement: ANTHROPIC_API_KEY not set');
      }
    }

    // ========================================
    // PIPELINE COMPLETE - Delete checkpoint
    // ========================================
    await deleteCheckpoint(websiteId);

    const finalMessage = autoImprove
      ? `Extraction pipeline completed with ${pipelineResult.overallAccuracy?.toFixed(1)}% accuracy`
      : 'Extraction pipeline completed successfully';

    emitProgress('complete', 100, finalMessage);
    agentContext.complete();
    publishPipelineCompleted(websiteId, finalMessage);

    return {
      success: true,
      agentType: 'orchestrator',
      message: finalMessage,
      data: pipelineResult,
    };
  } catch (error) {
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
 * Check if a website has a pending checkpoint awaiting approval
 */
export async function hasCheckpoint(websiteId: string): Promise<boolean> {
  const checkpoint = await loadCheckpoint(websiteId);
  return checkpoint !== null && checkpoint.phase === 'awaiting_approval';
}

/**
 * Get checkpoint details for a website
 */
export async function getCheckpointInfo(websiteId: string): Promise<{
  exists: boolean;
  phase?: string;
  savedAt?: string;
  componentCount?: number;
} | null> {
  const checkpoint = await loadCheckpoint(websiteId);
  if (!checkpoint) {
    return { exists: false };
  }
  return {
    exists: true,
    phase: checkpoint.phase,
    savedAt: checkpoint.savedAt,
    componentCount: checkpoint.components.length,
  };
}
