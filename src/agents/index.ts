/**
 * Website Cooker Agents
 *
 * Specialized AI agents for improving generated websites.
 * Uses Claude Agent SDK for autonomous task execution.
 *
 * Agents:
 * - ComponentFixer: Fixes low-accuracy components
 * - CSSOptimizer: Fixes CSS and styling issues
 * - QualityChecker: Validates builds and types
 * - Orchestrator: Coordinates all agents
 *
 * Usage:
 *   import { improveWebsite, runOrchestrator } from '@/agents';
 *   await improveWebsite('website-abc123');
 */

// Agent exports
export { componentFixerAgent, runComponentFixer } from './component-fixer';
export { cssOptimizerAgent, runCSSOptimizer } from './css-optimizer';
export { qualityCheckerAgent, runQualityChecker } from './quality-checker';
export { orchestratorAgent, runOrchestrator, improveWebsite } from './improvement-orchestrator';

// Pipeline orchestrator
export { executeOrchestrator } from './orchestrator';

// Tools export
export { createWebsiteCookerMcpServer } from './tools';

// Types
export type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
