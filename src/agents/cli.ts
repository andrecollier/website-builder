#!/usr/bin/env npx ts-node
/**
 * CLI for Website Cooker Agents
 *
 * Usage:
 *   npx ts-node src/agents/cli.ts improve <websiteId>
 *   npx ts-node src/agents/cli.ts fix-component <websiteId> [componentName]
 *   npx ts-node src/agents/cli.ts optimize-css <websiteId>
 *   npx ts-node src/agents/cli.ts check-quality <websiteId>
 */

import { improveWebsite } from './improvement-orchestrator';
import { runComponentFixer } from './component-fixer';
import { runCSSOptimizer } from './css-optimizer';
import { runQualityChecker } from './quality-checker';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const websiteId = args[1];

  if (!command) {
    console.log(`
Website Cooker Agents CLI

Commands:
  improve <websiteId>              Run full improvement workflow
  fix-component <websiteId>        Fix low-accuracy components
  optimize-css <websiteId>         Optimize CSS and styling
  check-quality <websiteId>        Run quality checks

Examples:
  npx ts-node src/agents/cli.ts improve website-abc123
  npx ts-node src/agents/cli.ts check-quality website-abc123
`);
    process.exit(0);
  }

  if (!websiteId) {
    console.error('Error: websiteId is required');
    process.exit(1);
  }

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required');
    console.error('Set it with: export ANTHROPIC_API_KEY=your_key_here');
    process.exit(1);
  }

  console.log(`Running ${command} for ${websiteId}...`);
  console.log('---');

  try {
    switch (command) {
      case 'improve':
        await improveWebsite(websiteId);
        break;

      case 'fix-component':
        await runComponentFixer(websiteId, {
          targetAccuracy: 80,
          maxComponents: 5,
        });
        break;

      case 'optimize-css':
        await runCSSOptimizer(websiteId, {
          fixType: 'all',
        });
        break;

      case 'check-quality':
        const result = await runQualityChecker(websiteId, {
          checkTypes: true,
          runBuild: false,
          checkComponents: true,
        });
        if (result.result) {
          console.log('---');
          console.log('Quality check complete');
        }
        break;

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }

    console.log('---');
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
