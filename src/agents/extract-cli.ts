#!/usr/bin/env npx tsx
/**
 * Quick extraction CLI
 *
 * Usage:
 *   npx tsx src/agents/extract-cli.ts <url>
 *   npx tsx src/agents/extract-cli.ts https://example.framer.website
 */

import { executeOrchestrator } from './orchestrator';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  const url = process.argv[2];

  if (!url) {
    console.log(`
Website Extraction CLI

Usage:
  npx tsx src/agents/extract-cli.ts <url>

Examples:
  npx tsx src/agents/extract-cli.ts https://clearpath-template.framer.website
`);
    process.exit(0);
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    console.error('Error: Invalid URL provided');
    process.exit(1);
  }

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required');
    console.error('Set it with: export ANTHROPIC_API_KEY=your_key_here');
    process.exit(1);
  }

  const websiteId = `website-${uuidv4()}`;

  console.log(`\n🚀 Starting extraction`);
  console.log(`   URL: ${url}`);
  console.log(`   Website ID: ${websiteId}`);
  console.log(`---\n`);

  try {
    const result = await executeOrchestrator({
      websiteId,
      url,
      maxRetries: 3,
      skipCache: false,
      enableResponsive: true,
      enableComponentValidation: true,
      componentValidationThreshold: 80,
      onProgress: (progress) => {
        const percent = Math.round(progress.progress);
        const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
        console.log(`[${bar}] ${percent}% - ${progress.status}`);
      },
    });

    console.log(`\n---`);
    console.log(`✅ Extraction complete!`);
    console.log(`   Website ID: ${websiteId}`);
    console.log(`   Success: ${result.success}`);

    if (result.accuracy !== undefined) {
      console.log(`   Overall Accuracy: ${result.accuracy.toFixed(1)}%`);
    }

    if (result.componentValidation) {
      console.log(`\n📊 Component Validation:`);
      console.log(`   Total: ${result.componentValidation.totalComponents}`);
      console.log(`   Passed: ${result.componentValidation.passedComponents}`);
      console.log(`   Failed: ${result.componentValidation.failedComponents}`);
      console.log(`   Avg Accuracy: ${result.componentValidation.averageAccuracy.toFixed(1)}%`);

      if (result.componentValidation.flaggedComponents.length > 0) {
        console.log(`\n⚠️  Flagged components (< 80%):`);
        result.componentValidation.flaggedComponents.forEach(c => {
          console.log(`   - ${c}`);
        });
      }
    }

    console.log(`\n📁 Output: Websites/${websiteId}/generated/`);
    console.log(`🔗 Preview: cd Websites/${websiteId}/generated && npm run dev`);

  } catch (error) {
    console.error('\n❌ Extraction failed:', error);
    process.exit(1);
  }
}

main();
