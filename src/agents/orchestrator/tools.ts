/**
 * Orchestrator Agent Tools Module
 *
 * Tool functions for the orchestrator agent to coordinate the pipeline.
 * Provides tools for delegation, progress tracking, and error handling.
 *
 * These tools can be used by the orchestrator agent directly or exposed
 * to the Claude Agent SDK when migrating to full SDK-based orchestration.
 */

import type {
  DelegateToolInput,
  DelegateToolOutput,
  TrackProgressToolInput,
  TrackProgressToolOutput,
  HandleErrorToolInput,
  HandleErrorToolOutput,
  AgentContext,
  AgentResult,
} from '../types';
import type { CaptureProgress, ExtractionError } from '@/types';
import { updateProgress, addError } from '../shared/context';
import { publishAgentStarted, publishError, createProgressPublisher } from '../shared/messages';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Tool execution context
 * Provides access to shared state for tools
 */
interface ToolContext {
  websiteId: string;
  agentContext: AgentContext;
}

// ====================
// DELEGATION TOOL
// ====================

/**
 * Delegate Tool
 *
 * Delegates a task to a specialist agent (Capture, Extractor, Generator, Comparator).
 * This is the primary coordination mechanism for the orchestrator.
 *
 * NOTE: This tool currently serves as a stub/interface. The actual delegation logic
 * is implemented in the orchestrator's internal delegation functions. This tool
 * can be fully implemented when integrating with the Claude Agent SDK.
 *
 * @param input - Delegation parameters (target agent, task, params)
 * @param context - Tool execution context
 * @returns Promise resolving to delegation result
 *
 * @example
 * ```typescript
 * const result = await delegateTool({
 *   targetAgent: 'capture',
 *   task: 'Capture website screenshots and sections',
 *   params: { url: 'https://example.com', skipCache: false }
 * }, context);
 * ```
 */
export async function delegateTool(
  input: DelegateToolInput,
  context: ToolContext
): Promise<DelegateToolOutput> {
  const { targetAgent, task, params = {} } = input;
  const { websiteId } = context;

  // Publish agent delegation start event
  publishAgentStarted(websiteId, targetAgent, `Delegating to ${targetAgent} agent: ${task}`);

  // NOTE: This is a stub implementation that publishes events.
  // The actual agent execution happens via the orchestrator's delegation functions.
  // When migrating to full Claude Agent SDK integration, this would invoke the SDK.

  // For now, return a pending result that indicates delegation was initiated
  const result: AgentResult = {
    success: true,
    agentType: targetAgent,
    message: `Delegation to ${targetAgent} agent initiated`,
    data: { delegated: true, task, params },
  };

  return {
    success: true,
    agentType: targetAgent,
    result,
  };
}

// ====================
// PROGRESS TRACKING TOOL
// ====================

/**
 * Track Progress Tool
 *
 * Updates pipeline progress and notifies subscribers.
 * Used by the orchestrator to communicate progress through the extraction pipeline.
 *
 * @param input - Progress tracking parameters (phase, percent, message)
 * @param context - Tool execution context
 * @returns Promise resolving to tracking result
 *
 * @example
 * ```typescript
 * await trackProgressTool({
 *   phase: 1,
 *   percent: 25,
 *   message: 'Capture phase 25% complete'
 * }, context);
 * ```
 */
export async function trackProgressTool(
  input: TrackProgressToolInput,
  context: ToolContext
): Promise<TrackProgressToolOutput> {
  const { phase, percent, message } = input;
  const { websiteId } = context;

  try {
    // Map phase number to phase name
    const phaseName = getPhaseNameFromNumber(phase);

    // Create progress object
    const progress: CaptureProgress = {
      phase: phaseName,
      percent,
      message,
    };

    // Update shared context
    const updated = updateProgress(websiteId, progress);

    // Publish progress event
    const progressPublisher = createProgressPublisher(websiteId, 'orchestrator');
    progressPublisher(progress);

    return {
      success: true,
      updated: updated !== null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      updated: false,
    };
  }
}

// ====================
// ERROR HANDLING TOOL
// ====================

/**
 * Handle Error Tool
 *
 * Handles errors during pipeline execution, logs them to shared context,
 * and determines whether the pipeline should continue.
 *
 * @param input - Error handling parameters (error, continueOnError)
 * @param context - Tool execution context
 * @returns Promise resolving to error handling result
 *
 * @example
 * ```typescript
 * const result = await handleErrorTool({
 *   error: extractionError,
 *   continueOnError: true
 * }, context);
 *
 * if (result.shouldContinue) {
 *   // Continue with next phase
 * }
 * ```
 */
export async function handleErrorTool(
  input: HandleErrorToolInput,
  context: ToolContext
): Promise<HandleErrorToolOutput> {
  const { error, continueOnError = false } = input;
  const { websiteId } = context;

  try {
    // Add error to shared context
    const updated = addError(websiteId, error);

    // Determine if pipeline should continue
    // Continue only if:
    // 1. continueOnError is true AND
    // 2. error is marked as recoverable
    const shouldContinue = continueOnError && error.recoverable;

    // Publish error event
    publishError(websiteId, 'orchestrator', error, !shouldContinue);

    return {
      success: true,
      shouldContinue,
      errorLogged: updated !== null,
    };
  } catch (handlingError) {
    // Error while handling error - always stop
    return {
      success: false,
      shouldContinue: false,
      errorLogged: false,
    };
  }
}

// ====================
// HELPER FUNCTIONS
// ====================

/**
 * Map phase number to phase name for progress tracking
 */
function getPhaseNameFromNumber(phase: number): CaptureProgress['phase'] {
  switch (phase) {
    case 0:
      return 'initializing';
    case 1:
      return 'capturing';
    case 2:
      return 'extracting';
    case 3:
    case 4:
      return 'capturing'; // Generator uses 'capturing' as phase
    case 5:
    case 6:
      return 'capturing'; // Comparator uses 'capturing' as phase
    default:
      return 'initializing';
  }
}

/**
 * Create a tool context from an agent context
 * Convenience function for creating tool execution contexts
 *
 * @param websiteId - Website identifier
 * @param agentContext - Agent context for shared state access
 * @returns Tool context
 */
export function createToolContext(websiteId: string, agentContext: AgentContext): ToolContext {
  return {
    websiteId,
    agentContext,
  };
}
