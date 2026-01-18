/**
 * Test the full extraction pipeline with responsive capture
 */

import { executeOrchestrator } from './src/agents/orchestrator';
import { randomUUID } from 'crypto';

async function main() {
  const websiteId = `website-${randomUUID()}`;

  console.log('🚀 Starting extraction pipeline...');
  console.log(`Website ID: ${websiteId}`);
  console.log(`URL: https://fluence.framer.website/`);
  console.log('');

  const result = await executeOrchestrator({
    websiteId,
    url: 'https://fluence.framer.website/',
    enableResponsive: true,
    onProgress: (progress) => {
      const bar = '█'.repeat(Math.floor(progress.percent / 5)) + '░'.repeat(20 - Math.floor(progress.percent / 5));
      console.log(`[${bar}] ${progress.percent.toFixed(0).padStart(3)}% | ${progress.phase.padEnd(12)} | ${progress.message}`);
    },
  });

  console.log('');
  if (result.success) {
    console.log('✅ Pipeline completed successfully!');
    console.log(`   Components: ${result.data?.components?.length || 0}`);
    console.log(`   Accuracy: ${result.data?.overallAccuracy?.toFixed(1) || 'N/A'}%`);
  } else {
    console.log('❌ Pipeline failed:', result.error?.message);
  }
}

main().catch(console.error);
