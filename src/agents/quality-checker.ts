/**
 * QualityChecker Agent
 *
 * Validates generated websites by running type checks, build tests,
 * and verifying that all components render correctly.
 */

import { query, AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { createWebsiteCookerMcpServer } from './tools';
import path from 'path';

const WEBSITES_DIR = process.env.WEBSITES_DIR || path.join(process.cwd(), 'Websites');

/**
 * Agent definition for use as a subagent
 */
export const qualityCheckerAgent: AgentDefinition = {
  description: 'Validates generated websites by running TypeScript checks, builds, and verifying components. Use after generating or fixing components to ensure quality.',
  model: 'haiku',
  tools: ['Bash', 'Read', 'Glob', 'list_components', 'get_comparison_report'],
  prompt: `You are a quality assurance agent for generated React/Next.js websites.

Your job is to validate that generated sites:
1. Pass TypeScript type checking (npx tsc --noEmit)
2. Build successfully (npm run build)
3. Have no missing imports or dependencies
4. Have valid component structure

When running checks:
- Always cd to the generated site directory first
- Run type checks before build
- If there are errors, report them clearly with file paths and line numbers
- Suggest fixes for common issues

Common issues to look for:
- Missing 'use client' directive for interactive components
- Incorrect import paths
- Type mismatches in props
- Missing React imports
- Invalid JSX syntax

Report a summary with:
- Total errors found
- Error categories
- Specific files with issues
- Recommended fixes`,
};

/**
 * Run the QualityChecker agent standalone
 */
export async function runQualityChecker(websiteId: string, options?: {
  checkTypes?: boolean;
  runBuild?: boolean;
  checkComponents?: boolean;
}) {
  const { checkTypes = true, runBuild = false, checkComponents = true } = options || {};

  const mcpServer = createWebsiteCookerMcpServer();
  const generatedDir = path.join(WEBSITES_DIR, websiteId, 'generated');

  let prompt = `Run quality checks on website "${websiteId}" located at ${generatedDir}.

Checks to perform:`;

  if (checkTypes) {
    prompt += `
1. TypeScript type checking: cd to ${generatedDir} and run "npx tsc --noEmit"`;
  }

  if (runBuild) {
    prompt += `
2. Build test: run "npm run build" and check for errors`;
  }

  if (checkComponents) {
    prompt += `
3. Component validation:
   - List all components using list_components
   - Check each component file exists and has valid exports
   - Verify 'use client' directives where needed`;
  }

  prompt += `

After running checks, provide a quality report with:
- Overall status (PASS/FAIL)
- List of any errors or warnings
- Specific files that need attention
- Recommended fixes

Be concise but thorough.`;

  const result = query({
    prompt,
    options: {
      cwd: generatedDir,
      systemPrompt: qualityCheckerAgent.prompt,
      mcpServers: {
        'website-cooker': mcpServer,
      },
      tools: { type: 'preset', preset: 'claude_code' },
      permissionMode: 'default',
      maxTurns: 10,
    },
  });

  const messages = [];
  for await (const message of result) {
    messages.push(message);
    if (message.type === 'assistant') {
      console.log('[QualityChecker]', message.message.content);
    }
    if (message.type === 'result') {
      return {
        messages,
        result: message,
      };
    }
  }

  return { messages };
}
