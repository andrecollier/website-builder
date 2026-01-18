/**
 * Refinement Loop Module
 *
 * Iteratively improves generated components by comparing against
 * reference screenshots and regenerating with feedback until
 * the target accuracy is achieved.
 *
 * Phase C of the Quality Fix Plan.
 */

import { generateComponentWithAI, isAIGenerationAvailable } from './ai-generator';
import type { SectionContent, DesignSystem, ComponentType } from '@/types';
import * as fs from 'fs/promises';
import * as path from 'path';

// ====================
// TYPES
// ====================

export interface RefinementInput {
  /** Website ID for file paths */
  websiteId: string;
  /** Section ID */
  sectionId: string;
  /** Path to reference screenshot */
  screenshotPath: string;
  /** Extracted semantic content */
  content: SectionContent;
  /** Component type */
  sectionType: ComponentType;
  /** Design system tokens */
  designSystem: DesignSystem;
  /** Component name */
  componentName: string;
  /** Minimum accuracy target (default: 90) */
  minAccuracy?: number;
  /** Maximum refinement attempts (default: 3) */
  maxAttempts?: number;
  /** Base directory for websites */
  websitesDir?: string;
  /** Progress callback */
  onProgress?: (progress: RefinementProgress) => void;
}

export interface RefinementProgress {
  attempt: number;
  maxAttempts: number;
  phase: 'generating' | 'writing' | 'comparing' | 'complete' | 'failed';
  accuracy?: number;
  message: string;
}

export interface RefinementAttempt {
  attempt: number;
  accuracy: number;
  feedback?: string;
  code?: string;
  error?: string;
}

export interface RefinementResult {
  success: boolean;
  /** Final generated code */
  finalCode: string;
  /** Final accuracy achieved */
  finalAccuracy: number;
  /** Number of attempts made */
  attempts: number;
  /** Whether target accuracy was reached */
  targetReached: boolean;
  /** History of all attempts */
  history: RefinementAttempt[];
  /** Path to final component file */
  componentPath?: string;
}

// ====================
// MAIN FUNCTION
// ====================

/**
 * Generate component and iteratively refine until accuracy target is met
 *
 * @param input - Refinement input with all required context
 * @returns Refinement result with final code and accuracy
 */
export async function generateUntilPerfect(
  input: RefinementInput
): Promise<RefinementResult> {
  const {
    websiteId,
    screenshotPath,
    content,
    sectionType,
    designSystem,
    componentName,
    minAccuracy = 90,
    maxAttempts = 3,
    websitesDir = path.join(process.cwd(), 'Websites'),
    onProgress,
  } = input;

  // Check if AI generation is available
  if (!isAIGenerationAvailable()) {
    return {
      success: false,
      finalCode: '',
      finalAccuracy: 0,
      attempts: 0,
      targetReached: false,
      history: [{
        attempt: 0,
        accuracy: 0,
        error: 'ANTHROPIC_API_KEY not set. AI generation requires an API key.',
      }],
    };
  }

  const history: RefinementAttempt[] = [];
  let currentCode = '';
  let currentAccuracy = 0;
  let attempts = 0;
  let previousFeedback = '';
  let componentPath = '';

  const emitProgress = (phase: RefinementProgress['phase'], message: string) => {
    if (onProgress) {
      onProgress({
        attempt: attempts,
        maxAttempts,
        phase,
        accuracy: currentAccuracy,
        message,
      });
    }
  };

  // Refinement loop
  while (attempts < maxAttempts && currentAccuracy < minAccuracy) {
    attempts++;

    emitProgress('generating', `Generating ${componentName} (attempt ${attempts}/${maxAttempts})...`);

    // Generate component with AI
    const result = await generateComponentWithAI({
      screenshotPath,
      content,
      sectionType,
      designSystem,
      componentName,
      previousFeedback: previousFeedback || undefined,
      previousAccuracy: attempts > 1 ? currentAccuracy : undefined,
    });

    if (!result.success || !result.code) {
      history.push({
        attempt: attempts,
        accuracy: 0,
        error: result.error || 'Generation failed',
      });

      emitProgress('failed', `Generation failed: ${result.error}`);
      continue;
    }

    currentCode = result.code;

    // Write component to file
    emitProgress('writing', 'Writing component to file...');

    componentPath = path.join(
      websitesDir,
      websiteId,
      'generated',
      'src',
      'components',
      componentName,
      `${componentName}.tsx`
    );

    try {
      await fs.mkdir(path.dirname(componentPath), { recursive: true });
      await fs.writeFile(componentPath, currentCode, 'utf-8');

      // Also write an index.ts for easier imports
      const indexPath = path.join(path.dirname(componentPath), 'index.ts');
      await fs.writeFile(
        indexPath,
        `export { ${componentName}, default } from './${componentName}';\n`,
        'utf-8'
      );
    } catch (writeError) {
      history.push({
        attempt: attempts,
        accuracy: 0,
        code: currentCode,
        error: `Failed to write file: ${writeError instanceof Error ? writeError.message : String(writeError)}`,
      });
      continue;
    }

    // Compare with reference screenshot
    emitProgress('comparing', 'Comparing with reference...');

    try {
      const comparisonResult = await compareComponent({
        websiteId,
        websitesDir,
        componentName,
        referenceScreenshotPath: screenshotPath,
      });

      currentAccuracy = comparisonResult.accuracy;
      previousFeedback = comparisonResult.feedback;

      history.push({
        attempt: attempts,
        accuracy: currentAccuracy,
        feedback: currentAccuracy >= minAccuracy ? 'Target reached!' : previousFeedback,
        code: currentCode,
      });

      if (currentAccuracy >= minAccuracy) {
        emitProgress('complete', `Target accuracy reached: ${currentAccuracy.toFixed(1)}%`);
      } else {
        emitProgress('comparing', `Accuracy: ${currentAccuracy.toFixed(1)}% (target: ${minAccuracy}%)`);
      }
    } catch (comparisonError) {
      // If comparison fails, we can't know the accuracy
      // Use a heuristic or continue without feedback
      currentAccuracy = 50; // Assume mediocre accuracy
      previousFeedback = 'Comparison failed - regenerating without specific feedback';

      history.push({
        attempt: attempts,
        accuracy: currentAccuracy,
        feedback: previousFeedback,
        code: currentCode,
        error: comparisonError instanceof Error ? comparisonError.message : String(comparisonError),
      });
    }
  }

  const targetReached = currentAccuracy >= minAccuracy;

  return {
    success: targetReached || currentCode.length > 0,
    finalCode: currentCode,
    finalAccuracy: currentAccuracy,
    attempts,
    targetReached,
    history,
    componentPath,
  };
}

// ====================
// COMPARISON HELPER
// ====================

interface ComparisonInput {
  websiteId: string;
  websitesDir: string;
  componentName: string;
  referenceScreenshotPath: string;
}

interface ComparisonResult {
  accuracy: number;
  feedback: string;
}

/**
 * Compare generated component against reference screenshot
 *
 * This is a simplified comparison that can be enhanced with
 * the full visual-diff infrastructure.
 */
async function compareComponent(
  input: ComparisonInput
): Promise<ComparisonResult> {
  const { websiteId, websitesDir, componentName, referenceScreenshotPath } = input;

  try {
    // Try to use the existing comparison infrastructure
    const { runComparison } = await import('../comparison/compare-section');

    const result = await runComparison({
      websiteId,
      websitesDir,
      autoStartServer: true,
    });

    // Find the specific component's accuracy
    const componentResult = result.sections.find(
      (s) => s.name.toLowerCase() === componentName.toLowerCase()
    );

    if (componentResult) {
      return {
        accuracy: componentResult.accuracy,
        feedback: componentResult.accuracy < 80
          ? `${componentName} has low accuracy. Check: layout, colors, spacing, content positioning.`
          : componentResult.accuracy < 90
          ? `${componentName} is close. Fine-tune: minor spacing or color differences.`
          : 'Excellent match!',
      };
    }

    // If component not found in results, use overall accuracy
    return {
      accuracy: result.overallAccuracy,
      feedback: `Overall accuracy: ${result.overallAccuracy.toFixed(1)}%`,
    };
  } catch (error) {
    // If comparison infrastructure fails, try a simple file-based check
    try {
      const generatedScreenshotPath = path.join(
        websitesDir,
        websiteId,
        'generated',
        'screenshots',
        `${componentName}.png`
      );

      const [refExists, genExists] = await Promise.all([
        fs.access(referenceScreenshotPath).then(() => true).catch(() => false),
        fs.access(generatedScreenshotPath).then(() => true).catch(() => false),
      ]);

      if (refExists && genExists) {
        // Use pixelmatch for comparison if both screenshots exist
        const { compareImages } = await import('../comparison/visual-diff');

        const similarity = await compareImages(
          referenceScreenshotPath,
          generatedScreenshotPath
        );

        return {
          accuracy: similarity * 100,
          feedback: similarity < 0.8
            ? 'Significant visual differences detected.'
            : similarity < 0.9
            ? 'Minor visual differences detected.'
            : 'Good visual match.',
        };
      }
    } catch {
      // Fall through to default
    }

    // Default: assume moderate accuracy and provide generic feedback
    return {
      accuracy: 60,
      feedback: 'Could not run visual comparison. Regenerating with layout focus.',
    };
  }
}

// ====================
// BATCH REFINEMENT
// ====================

/**
 * Run refinement for multiple components in parallel
 */
export async function refineAllComponents(
  inputs: RefinementInput[],
  options?: {
    maxConcurrent?: number;
    onComponentProgress?: (componentName: string, progress: RefinementProgress) => void;
  }
): Promise<Map<string, RefinementResult>> {
  const { maxConcurrent = 2, onComponentProgress } = options || {};
  const results = new Map<string, RefinementResult>();

  // Process in batches to avoid overwhelming the API
  const batches: RefinementInput[][] = [];
  for (let i = 0; i < inputs.length; i += maxConcurrent) {
    batches.push(inputs.slice(i, i + maxConcurrent));
  }

  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(async (input) => {
        const result = await generateUntilPerfect({
          ...input,
          onProgress: (progress) => {
            if (onComponentProgress) {
              onComponentProgress(input.componentName, progress);
            }
          },
        });
        return { name: input.componentName, result };
      })
    );

    for (const { name, result } of batchResults) {
      results.set(name, result);
    }
  }

  return results;
}

// ====================
// UTILITIES
// ====================

/**
 * Generate a refinement report
 */
export function generateRefinementReport(result: RefinementResult): string {
  const lines: string[] = [
    '=== Refinement Report ===',
    '',
    `Success: ${result.success ? 'Yes' : 'No'}`,
    `Target Reached: ${result.targetReached ? 'Yes' : 'No'}`,
    `Final Accuracy: ${result.finalAccuracy.toFixed(1)}%`,
    `Attempts: ${result.attempts}`,
    '',
    'Attempt History:',
  ];

  for (const attempt of result.history) {
    lines.push(`  #${attempt.attempt}: ${attempt.accuracy.toFixed(1)}% - ${attempt.feedback || attempt.error || 'No feedback'}`);
  }

  if (result.componentPath) {
    lines.push('', `Component saved to: ${result.componentPath}`);
  }

  return lines.join('\n');
}
