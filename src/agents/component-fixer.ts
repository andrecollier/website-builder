/**
 * ComponentFixer Agent
 *
 * Analyzes comparison reports to identify components with low accuracy,
 * then fixes them by examining the reference screenshots and adjusting
 * the component code to better match the original.
 */

import { query, AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { createWebsiteCookerMcpServer } from './tools';
import path from 'path';

const WEBSITES_DIR = process.env.WEBSITES_DIR || path.join(process.cwd(), 'Websites');

/**
 * Agent definition for use as a subagent
 */
export const componentFixerAgent: AgentDefinition = {
  description: 'Fixes React components that have low visual accuracy compared to reference screenshots. Use this agent when comparison shows components below 80% accuracy.',
  model: 'sonnet',
  tools: ['Read', 'Edit', 'Glob', 'Grep', 'get_comparison_report', 'get_component_source', 'get_diff_image', 'get_reference_screenshot'],
  prompt: `You are a specialized agent for fixing React components to match reference designs more closely.

Your job is to:
1. Analyze comparison reports to find components with low accuracy (below 80%)
2. Examine the diff images and reference screenshots to understand what's different
3. Read the component source code
4. Make targeted fixes to improve visual accuracy

When fixing components, focus on:
- Layout issues (flexbox, grid, positioning)
- Spacing (margins, paddings, gaps)
- Typography (font sizes, weights, line heights)
- Colors (background, text, borders)
- Dimensions (widths, heights, aspect ratios)
- Border radius and shadows

Always make minimal, targeted changes. Don't rewrite entire components unless absolutely necessary.

After making fixes, explain what you changed and why it should improve accuracy.`,
};

/**
 * Run the ComponentFixer agent standalone
 */
export async function runComponentFixer(websiteId: string, options?: {
  targetAccuracy?: number;
  maxComponents?: number;
}) {
  const { targetAccuracy = 80, maxComponents = 5 } = options || {};

  const mcpServer = createWebsiteCookerMcpServer();

  const prompt = `Analyze the comparison report for website "${websiteId}" and fix components that have accuracy below ${targetAccuracy}%.

Steps:
1. First, get the comparison report using get_comparison_report
2. Identify the ${maxComponents} lowest-scoring components
3. For each component:
   - Get the component source code
   - Look at the diff image to understand what's wrong
   - Read the reference screenshot for context
   - Make targeted fixes to the component code
4. Summarize what you fixed

Focus on the most impactful fixes first. Prioritize layout and spacing issues as they often have the biggest visual impact.`;

  const result = query({
    prompt,
    options: {
      cwd: WEBSITES_DIR,
      systemPrompt: componentFixerAgent.prompt,
      mcpServers: {
        'website-cooker': mcpServer,
      },
      tools: { type: 'preset', preset: 'claude_code' },
      permissionMode: 'acceptEdits',
      maxTurns: 20,
    },
  });

  const messages = [];
  for await (const message of result) {
    messages.push(message);
    if (message.type === 'assistant') {
      console.log('[ComponentFixer]', message.message.content);
    }
  }

  return messages;
}
