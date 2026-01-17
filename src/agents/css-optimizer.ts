/**
 * CSSOptimizer Agent
 *
 * Specializes in fixing CSS-related issues in generated components,
 * including Framer-specific CSS, layout problems, and responsive design.
 */

import { query, AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { createWebsiteCookerMcpServer } from './tools';
import path from 'path';

const WEBSITES_DIR = process.env.WEBSITES_DIR || path.join(process.cwd(), 'Websites');

/**
 * Agent definition for use as a subagent
 */
export const cssOptimizerAgent: AgentDefinition = {
  description: 'Fixes CSS and styling issues in generated components, including Framer-specific CSS, layout problems, and responsive design. Use when components have styling or layout issues.',
  model: 'sonnet',
  tools: ['Read', 'Edit', 'Glob', 'Grep', 'get_extracted_css', 'get_component_source', 'list_components'],
  prompt: `You are a CSS optimization specialist for React components extracted from Framer websites.

Your expertise includes:
- Framer CSS class system (framer-* classes)
- CSS custom properties (--token-* variables)
- Flexbox and Grid layouts
- Responsive design with media queries
- CSS-in-JS (inline styles in React)

When optimizing CSS:
1. Check if Framer CSS variables are being used correctly
2. Verify layout classes match the original design
3. Fix overflow and positioning issues
4. Ensure proper responsive behavior
5. Optimize for visual fidelity while keeping code clean

Key Framer patterns to look for:
- framer-AYeOu, framer-XqINd - parent context classes for CSS variables
- --token-* CSS variables for colors, fonts, spacing
- framer-* classes for layout and positioning
- Carousel/slider components need overflow: hidden

Always preserve the original design intent while making code maintainable.`,
};

/**
 * Run the CSSOptimizer agent standalone
 */
export async function runCSSOptimizer(websiteId: string, options?: {
  componentName?: string;
  fixType?: 'layout' | 'variables' | 'responsive' | 'all';
}) {
  const { componentName, fixType = 'all' } = options || {};

  const mcpServer = createWebsiteCookerMcpServer();

  let prompt = `Optimize CSS for website "${websiteId}"`;

  if (componentName) {
    prompt += ` focusing on the "${componentName}" component`;
  }

  prompt += `.

Steps:
1. Get the extracted Framer CSS using get_extracted_css
2. List all components using list_components
3. ${componentName ? `Get the source for ${componentName}` : 'Analyze each component'}
4. Check for these issues:
   - Missing or incorrect Framer CSS variables
   - Layout problems (flexbox/grid issues)
   - Overflow issues (especially in carousels/sliders)
   - Missing responsive breakpoints
5. Apply fixes while preserving the original design

${fixType === 'layout' ? 'Focus specifically on layout issues.' : ''}
${fixType === 'variables' ? 'Focus specifically on CSS variable usage.' : ''}
${fixType === 'responsive' ? 'Focus specifically on responsive design.' : ''}

Summarize all CSS improvements made.`;

  const result = query({
    prompt,
    options: {
      cwd: WEBSITES_DIR,
      systemPrompt: cssOptimizerAgent.prompt,
      mcpServers: {
        'website-cooker': mcpServer,
      },
      tools: { type: 'preset', preset: 'claude_code' },
      permissionMode: 'acceptEdits',
      maxTurns: 15,
    },
  });

  const messages = [];
  for await (const message of result) {
    messages.push(message);
    if (message.type === 'assistant') {
      console.log('[CSSOptimizer]', message.message.content);
    }
  }

  return messages;
}
