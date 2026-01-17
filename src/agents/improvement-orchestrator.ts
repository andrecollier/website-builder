/**
 * Orchestrator Agent
 *
 * Coordinates multiple sub-agents to improve website quality.
 * Analyzes the current state, decides which agents to deploy,
 * and tracks overall progress.
 */

import { query, AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { createWebsiteCookerMcpServer } from './tools';
import { componentFixerAgent } from './component-fixer';
import { cssOptimizerAgent } from './css-optimizer';
import { qualityCheckerAgent } from './quality-checker';
import path from 'path';

const WEBSITES_DIR = process.env.WEBSITES_DIR || path.join(process.cwd(), 'Websites');

/**
 * Orchestrator agent definition
 */
export const orchestratorAgent: AgentDefinition = {
  description: 'Coordinates website improvement by analyzing comparison reports and delegating tasks to specialized agents (ComponentFixer, CSSOptimizer, QualityChecker).',
  model: 'sonnet',
  tools: ['Task', 'get_comparison_report', 'list_components', 'list_websites'],
  prompt: `You are the orchestrator for Website Cooker's improvement system.

Your role is to:
1. Analyze the current state of generated websites
2. Identify what needs improvement based on comparison reports
3. Delegate tasks to specialized sub-agents
4. Track progress and coordinate multiple improvements

Available sub-agents:
- ComponentFixer: Fixes components with low visual accuracy (<80%)
- CSSOptimizer: Fixes CSS and styling issues, Framer-specific problems
- QualityChecker: Runs type checks and build validation

Workflow:
1. First, get the comparison report to understand current quality
2. Identify the biggest issues (lowest accuracy sections)
3. Decide which agent(s) to use based on the problem type:
   - Layout/positioning issues → CSSOptimizer
   - Content/structure issues → ComponentFixer
   - Build errors → QualityChecker
4. Run agents in parallel when possible
5. After fixes, run QualityChecker to validate

Always start with an analysis, then make a plan, then execute.
Report progress after each agent completes.`,
};

/**
 * Run the Orchestrator agent
 */
export async function runOrchestrator(websiteId: string, options?: {
  targetAccuracy?: number;
  maxIterations?: number;
  autoFix?: boolean;
}) {
  const { targetAccuracy = 85, maxIterations = 3, autoFix = true } = options || {};

  const mcpServer = createWebsiteCookerMcpServer();

  const prompt = `Improve website "${websiteId}" to achieve at least ${targetAccuracy}% overall accuracy.

Steps:
1. Get the comparison report using get_comparison_report
2. Analyze which sections need the most improvement
3. Create an improvement plan
4. ${autoFix ? 'Execute the plan by delegating to sub-agents' : 'Report the plan without executing'}
5. ${autoFix ? 'After fixes, verify quality with QualityChecker' : ''}

Target: ${targetAccuracy}% accuracy
Max iterations: ${maxIterations}

Available sub-agents to delegate to:
- component-fixer: For fixing low-accuracy components
- css-optimizer: For CSS and styling fixes
- quality-checker: For type checking and build validation

Report your analysis, plan, and ${autoFix ? 'results' : 'recommendations'}.`;

  const result = query({
    prompt,
    options: {
      cwd: WEBSITES_DIR,
      systemPrompt: orchestratorAgent.prompt,
      mcpServers: {
        'website-cooker': mcpServer,
      },
      agents: {
        'component-fixer': componentFixerAgent,
        'css-optimizer': cssOptimizerAgent,
        'quality-checker': qualityCheckerAgent,
      },
      tools: { type: 'preset', preset: 'claude_code' },
      permissionMode: autoFix ? 'acceptEdits' : 'default',
      maxTurns: maxIterations * 10,
    },
  });

  const messages = [];
  for await (const message of result) {
    messages.push(message);

    if (message.type === 'assistant') {
      // Log assistant messages for visibility
      const content = message.message.content;
      if (Array.isArray(content)) {
        content.forEach(block => {
          if (block.type === 'text') {
            console.log('[Orchestrator]', block.text);
          }
        });
      }
    }

    if (message.type === 'result') {
      console.log('[Orchestrator] Complete:', message.subtype);
      return {
        messages,
        result: message,
        success: message.subtype === 'success',
      };
    }
  }

  return { messages, success: false };
}

/**
 * Quick improvement function - runs orchestrator with sensible defaults
 */
export async function improveWebsite(websiteId: string) {
  console.log(`Starting improvement for ${websiteId}...`);
  return runOrchestrator(websiteId, {
    targetAccuracy: 85,
    maxIterations: 3,
    autoFix: true,
  });
}
