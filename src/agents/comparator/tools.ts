/**
 * Comparator Agent Tools Module
 *
 * Tool functions for the comparator agent to perform visual comparison operations.
 * Provides tools for comparing images and calculating accuracy metrics.
 *
 * These tools can be used by the comparator agent directly or exposed
 * to the Claude Agent SDK when migrating to full SDK-based comparison operations.
 */

import type {
  CompareImagesToolInput,
  CompareImagesToolOutput,
  CalculateAccuracyToolInput,
  CalculateAccuracyToolOutput,
} from '../types';
import { compareImages } from '@/lib/comparison/visual-diff';
import path from 'path';
import fs from 'fs';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Tool execution context
 * Provides access to website-specific paths and configuration
 */
export interface ToolContext {
  websiteId: string;
  websitesDir: string;
}

// ====================
// COMPARE IMAGES TOOL
// ====================

/**
 * Compare Images Tool
 *
 * Compares a reference image with a generated component screenshot
 * using pixel-level visual diff analysis.
 *
 * @param input - Comparison parameters (referencePath, generatedPath, threshold)
 * @param context - Tool execution context
 * @returns Promise resolving to comparison result
 *
 * @example
 * ```typescript
 * const result = await compareImagesTool({
 *   referencePath: '/path/to/reference.png',
 *   generatedPath: '/path/to/generated.png',
 *   threshold: 0.1
 * }, context);
 *
 * if (result.success) {
 *   console.log(`Accuracy: ${result.accuracy}%`);
 *   console.log(`Diff pixels: ${result.diffPixels}`);
 * }
 * ```
 */
export async function compareImagesTool(
  input: CompareImagesToolInput,
  context: ToolContext
): Promise<CompareImagesToolOutput> {
  const { referencePath, generatedPath, threshold = 0.1 } = input;
  const { websiteId, websitesDir } = context;

  try {
    // Validate input paths
    if (!fs.existsSync(referencePath)) {
      return {
        success: false,
        accuracy: 0,
        diffPixels: 0,
      };
    }

    if (!fs.existsSync(generatedPath)) {
      return {
        success: false,
        accuracy: 0,
        diffPixels: 0,
      };
    }

    // Generate diff output path
    const websiteDir = path.join(websitesDir, websiteId);
    const diffDir = path.join(websiteDir, 'comparison', 'diffs');
    const refFilename = path.basename(referencePath);
    const diffFilename = refFilename.replace('.png', '-diff.png');
    const diffOutputPath = path.join(diffDir, diffFilename);

    // Ensure diff directory exists
    if (!fs.existsSync(diffDir)) {
      fs.mkdirSync(diffDir, { recursive: true });
    }

    // Perform comparison using visual-diff module
    const comparison = await compareImages(
      referencePath,
      generatedPath,
      diffOutputPath
    );

    return {
      success: true,
      accuracy: comparison.accuracy,
      diffPixels: comparison.mismatchedPixels,
      diffImagePath: comparison.diffImagePath,
    };
  } catch (error) {
    return {
      success: false,
      accuracy: 0,
      diffPixels: 0,
    };
  }
}

// ====================
// CALCULATE ACCURACY TOOL
// ====================

/**
 * Calculate Accuracy Tool
 *
 * Calculates overall accuracy from multiple comparison results
 * and categorizes each component by quality status.
 *
 * @param input - Array of component comparisons
 * @param context - Tool execution context
 * @returns Promise resolving to accuracy calculation result
 *
 * @example
 * ```typescript
 * const result = await calculateAccuracyTool({
 *   comparisons: [
 *     { componentId: 'hero', accuracy: 95 },
 *     { componentId: 'features', accuracy: 87 },
 *     { componentId: 'cta', accuracy: 92 }
 *   ]
 * }, context);
 *
 * if (result.success) {
 *   console.log(`Overall accuracy: ${result.overallAccuracy}%`);
 *   result.breakdown.forEach(item => {
 *     console.log(`${item.componentId}: ${item.accuracy}% (${item.status})`);
 *   });
 * }
 * ```
 */
export async function calculateAccuracyTool(
  input: CalculateAccuracyToolInput,
  context: ToolContext
): Promise<CalculateAccuracyToolOutput> {
  const { comparisons } = input;

  try {
    // Handle empty comparisons array
    if (comparisons.length === 0) {
      return {
        success: true,
        overallAccuracy: 0,
        breakdown: [],
      };
    }

    // Calculate overall accuracy (simple average)
    const totalAccuracy = comparisons.reduce((sum, comp) => sum + comp.accuracy, 0);
    const overallAccuracy = Math.round((totalAccuracy / comparisons.length) * 100) / 100;

    // Categorize each component by status
    const breakdown = comparisons.map((comp) => {
      let status: 'excellent' | 'good' | 'fair' | 'poor';

      if (comp.accuracy >= 90) {
        status = 'excellent';
      } else if (comp.accuracy >= 80) {
        status = 'good';
      } else if (comp.accuracy >= 70) {
        status = 'fair';
      } else {
        status = 'poor';
      }

      return {
        componentId: comp.componentId,
        accuracy: comp.accuracy,
        status,
      };
    });

    return {
      success: true,
      overallAccuracy,
      breakdown,
    };
  } catch (error) {
    return {
      success: false,
      overallAccuracy: 0,
      breakdown: [],
    };
  }
}

// ====================
// TOOL CONTEXT CREATION
// ====================

/**
 * Create a tool context for comparator operations
 * Convenience function for creating tool execution contexts
 *
 * @param websiteId - Website identifier
 * @param websitesDir - Base directory for website data
 * @returns Tool context
 */
export function createToolContext(websiteId: string, websitesDir: string): ToolContext {
  return {
    websiteId,
    websitesDir,
  };
}
