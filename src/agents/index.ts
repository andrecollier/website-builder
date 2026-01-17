/**
 * Agent Registry
 *
 * Central registry for all agents in the system.
 * Provides the getAgent() function to retrieve agent definitions by name.
 *
 * Agents:
 * - Orchestrator: Coordinates the entire pipeline (Model: Sonnet)
 * - Capture: Handles Playwright operations (Model: Haiku)
 * - Extractor: Extracts design tokens (Model: Sonnet)
 * - Generator: Generates React components with parallelization (Model: Sonnet)
 * - Comparator: Visual comparison with parallelization (Model: Haiku)
 */

import type { AgentType, AgentConfig } from './types';

// ====================
// AGENT IMPORTS
// ====================

import { getOrchestratorConfig } from './orchestrator';
import { getCaptureConfig } from './capture';
import { getExtractorConfig } from './extractor';
import { getGeneratorConfig } from './generator';
import { getComparatorConfig } from './comparator';

// ====================
// AGENT REGISTRY
// ====================

/**
 * Agent configuration registry
 * Maps agent type to its configuration
 */
const agentRegistry: Record<AgentType, () => AgentConfig> = {
  orchestrator: getOrchestratorConfig,
  capture: getCaptureConfig,
  extractor: getExtractorConfig,
  generator: getGeneratorConfig,
  comparator: getComparatorConfig,
};

/**
 * Get an agent definition by name
 * @param agentName The name of the agent to retrieve
 * @returns The agent configuration
 * @throws Error if agent not found
 */
export function getAgent(agentName: AgentType): AgentConfig {
  const configFn = agentRegistry[agentName];

  if (!configFn) {
    throw new Error(`Agent ${agentName} not found in registry`);
  }

  return configFn();
}

// ====================
// RE-EXPORTS
// ====================

// Re-export types for convenience
export type { AgentType, AgentContext, AgentResult, AgentMessage } from './types';

// Re-export agent execution functions
export { executeOrchestrator } from './orchestrator';
export { executeCapture } from './capture';
export { executeExtractor } from './extractor';
export { executeGenerator } from './generator';
export { executeComparator } from './comparator';

// Re-export agent configuration functions
export { getOrchestratorConfig } from './orchestrator';
export { getCaptureConfig } from './capture';
export { getExtractorConfig } from './extractor';
export { getGeneratorConfig } from './generator';
export { getComparatorConfig } from './comparator';

// Re-export agent options types for convenience
export type { OrchestratorOptions } from './orchestrator';
export type { CaptureOptions } from './capture';
export type { ExtractorOptions } from './extractor';
export type { GeneratorAgentOptions } from './generator';
export type { ComparatorAgentOptions } from './comparator';
