/**
 * Component Fixer Module
 *
 * Automatically fixes components that fail structural validation.
 * Analyzes validation issues and regenerates components with targeted improvements.
 *
 * Flow:
 * 1. Receive failed component with issues
 * 2. Analyze root cause (blank, broken images, layout)
 * 3. Apply automatic fixes where possible
 * 4. Regenerate component if needed
 * 5. Validate fix
 */

import type { Page } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';

// ====================
// TYPE DEFINITIONS
// ====================

export interface ComponentIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  details?: string;
}

export interface FailedComponent {
  name: string;
  componentPath: string;
  status: 'error' | 'warning';
  issues: ComponentIssue[];
  suggestions: string[];
}

export interface FixResult {
  component: string;
  fixed: boolean;
  fixesApplied: string[];
  newStatus: 'ok' | 'warning' | 'error';
  remainingIssues: ComponentIssue[];
}

export interface IterativeFixResult {
  success: boolean;
  totalAttempts: number;
  componentsFixed: number;
  componentsRemaining: number;
  results: FixResult[];
}

// ====================
// FIX STRATEGIES
// ====================

/**
 * Fix broken images by replacing with local paths or placeholders
 */
async function fixBrokenImages(
  componentPath: string,
  assetManifest?: { images: Array<{ originalUrl: string; localPath: string }> }
): Promise<{ fixed: boolean; fixesApplied: string[] }> {
  const fixes: string[] = [];

  try {
    let code = await fs.readFile(componentPath, 'utf-8');
    let modified = false;

    // If we have asset manifest, replace remote URLs with local paths
    if (assetManifest?.images) {
      for (const image of assetManifest.images) {
        if (image.localPath && image.originalUrl) {
          const localUrl = `/assets/images/${path.basename(image.localPath)}`;
          if (code.includes(image.originalUrl)) {
            code = code.replace(new RegExp(escapeRegex(image.originalUrl), 'g'), localUrl);
            fixes.push(`Replaced ${image.originalUrl.substring(0, 50)}... with local path`);
            modified = true;
          }
        }
      }
    }

    // Replace any remaining framerusercontent URLs with placeholder
    const framerRegex = /https:\/\/framerusercontent\.com\/images\/[^"'\s)]+/g;
    const framerMatches = code.match(framerRegex);
    if (framerMatches) {
      for (const url of Array.from(new Set(framerMatches))) {
        // Extract dimensions from URL if possible
        const widthMatch = url.match(/width=(\d+)/);
        const heightMatch = url.match(/height=(\d+)/);
        const width = widthMatch ? widthMatch[1] : '800';
        const height = heightMatch ? heightMatch[1] : '600';

        // Use a reliable placeholder service
        const placeholder = `https://placehold.co/${width}x${height}/1a1a2e/eee?text=Image`;
        code = code.replace(new RegExp(escapeRegex(url), 'g'), placeholder);
        fixes.push(`Replaced Framer image with placeholder (${width}x${height})`);
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(componentPath, code);
    }

    return { fixed: modified, fixesApplied: fixes };
  } catch (error) {
    console.error(`Error fixing broken images in ${componentPath}:`, error);
    return { fixed: false, fixesApplied: [] };
  }
}

/**
 * Fix blank component by checking for missing content wrapper
 */
async function fixBlankComponent(
  componentPath: string
): Promise<{ fixed: boolean; fixesApplied: string[] }> {
  const fixes: string[] = [];

  try {
    let code = await fs.readFile(componentPath, 'utf-8');
    let modified = false;

    // Check for components that render nothing visible
    // Common issues: absolute positioning with wrong offsets

    // Fix: bottom: -2700px or similar extreme positioning
    const extremePositionRegex = /(bottom|top|left|right):\s*['"]?-?\d{3,}px['"]?/g;
    const extremeMatches = code.match(extremePositionRegex);
    if (extremeMatches) {
      for (const match of extremeMatches) {
        const value = parseInt(match.match(/-?\d+/)?.[0] || '0');
        if (Math.abs(value) > 500) {
          code = code.replace(match, match.replace(/-?\d+/, '0'));
          fixes.push(`Fixed extreme positioning: ${match} → 0px`);
          modified = true;
        }
      }
    }

    // Fix: minHeight that's way too large
    const minHeightRegex = /minHeight:\s*['"]?\d{4,}px['"]?/g;
    const minHeightMatches = code.match(minHeightRegex);
    if (minHeightMatches) {
      for (const match of minHeightMatches) {
        code = code.replace(match, "minHeight: 'auto'");
        fixes.push(`Fixed extreme minHeight: ${match} → auto`);
        modified = true;
      }
    }

    // Fix: visibility hidden or opacity 0 on main container
    if (code.includes("visibility: 'hidden'") || code.includes('visibility: hidden')) {
      code = code.replace(/visibility:\s*['"]?hidden['"]?/g, "visibility: 'visible'");
      fixes.push('Fixed hidden visibility');
      modified = true;
    }

    if (code.includes("opacity: '0'") || code.includes('opacity: 0,')) {
      code = code.replace(/opacity:\s*['"]?0['"]?,/g, "opacity: '1',");
      fixes.push('Fixed zero opacity');
      modified = true;
    }

    // Fix: display none on main container
    if (code.includes("display: 'none'") || code.includes('display: none')) {
      code = code.replace(/display:\s*['"]?none['"]?/g, "display: 'flex'");
      fixes.push('Fixed display none');
      modified = true;
    }

    if (modified) {
      await fs.writeFile(componentPath, code);
    }

    return { fixed: modified, fixesApplied: fixes };
  } catch (error) {
    console.error(`Error fixing blank component ${componentPath}:`, error);
    return { fixed: false, fixesApplied: [] };
  }
}

/**
 * Fix elements outside viewport
 */
async function fixOutsideViewport(
  componentPath: string
): Promise<{ fixed: boolean; fixesApplied: string[] }> {
  const fixes: string[] = [];

  try {
    let code = await fs.readFile(componentPath, 'utf-8');
    let modified = false;

    // Fix absolute positioning that pushes content off-screen
    // Look for left/right values that are too large

    // Fix elements positioned way off to the right
    const rightPositionRegex = /right:\s*['"]?-\d{3,}\.?\d*px['"]?/g;
    const rightMatches = code.match(rightPositionRegex);
    if (rightMatches) {
      for (const match of rightMatches) {
        code = code.replace(match, "right: '0px'");
        fixes.push(`Fixed off-screen right position: ${match}`);
        modified = true;
      }
    }

    // Fix elements positioned way off to the left
    const leftPositionRegex = /left:\s*['"]?\d{4,}\.?\d*px['"]?/g;
    const leftMatches = code.match(leftPositionRegex);
    if (leftMatches) {
      for (const match of leftMatches) {
        const value = parseInt(match.match(/\d+/)?.[0] || '0');
        if (value > 1500) {
          code = code.replace(match, "left: '0px'");
          fixes.push(`Fixed off-screen left position: ${match}`);
          modified = true;
        }
      }
    }

    // Fix transform translations that push content off-screen
    const transformRegex = /transform:\s*['"]?matrix\([^)]+\)['"]?/g;
    const transformMatches = code.match(transformRegex);
    if (transformMatches) {
      for (const match of transformMatches) {
        // Extract translation values from matrix
        const matrixMatch = match.match(/matrix\(([^)]+)\)/);
        if (matrixMatch) {
          const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()));
          // Matrix: [a, b, c, d, tx, ty] - tx and ty are translations
          if (values.length >= 6) {
            const tx = values[4];
            const ty = values[5];
            if (Math.abs(tx) > 500 || Math.abs(ty) > 500) {
              code = code.replace(match, "transform: 'none'");
              fixes.push(`Fixed extreme transform: tx=${tx}, ty=${ty}`);
              modified = true;
            }
          }
        }
      }
    }

    if (modified) {
      await fs.writeFile(componentPath, code);
    }

    return { fixed: modified, fixesApplied: fixes };
  } catch (error) {
    console.error(`Error fixing outside viewport in ${componentPath}:`, error);
    return { fixed: false, fixesApplied: [] };
  }
}

/**
 * Fix very short component (likely has collapsed content)
 */
async function fixVeryShortComponent(
  componentPath: string
): Promise<{ fixed: boolean; fixesApplied: string[] }> {
  const fixes: string[] = [];

  try {
    let code = await fs.readFile(componentPath, 'utf-8');
    let modified = false;

    // Fix height: 0 or similar
    const zeroHeightRegex = /height:\s*['"]?0(px)?['"]?[,}]/g;
    if (zeroHeightRegex.test(code)) {
      code = code.replace(zeroHeightRegex, "height: 'auto',");
      fixes.push('Fixed zero height');
      modified = true;
    }

    // Fix maxHeight that's too restrictive
    const maxHeightRegex = /maxHeight:\s*['"]?\d{1,2}px['"]?/g;
    const maxHeightMatches = code.match(maxHeightRegex);
    if (maxHeightMatches) {
      for (const match of maxHeightMatches) {
        code = code.replace(match, "maxHeight: 'none'");
        fixes.push(`Fixed restrictive maxHeight: ${match}`);
        modified = true;
      }
    }

    // Fix overflow: hidden that might be clipping content incorrectly
    // Only fix if component also has height issues
    if (modified && code.includes("overflow: 'hidden'")) {
      code = code.replace("overflow: 'hidden'", "overflow: 'visible'");
      fixes.push('Changed overflow from hidden to visible');
    }

    if (modified) {
      await fs.writeFile(componentPath, code);
    }

    return { fixed: modified, fixesApplied: fixes };
  } catch (error) {
    console.error(`Error fixing short component ${componentPath}:`, error);
    return { fixed: false, fixesApplied: [] };
  }
}

// ====================
// MAIN FIX FUNCTION
// ====================

/**
 * Attempt to fix a single component
 */
export async function fixComponent(
  component: FailedComponent,
  assetManifest?: { images: Array<{ originalUrl: string; localPath: string }> }
): Promise<FixResult> {
  const allFixes: string[] = [];
  let anyFixed = false;

  for (const issue of component.issues) {
    let result: { fixed: boolean; fixesApplied: string[] };

    switch (issue.code) {
      case 'BROKEN_IMAGES':
        result = await fixBrokenImages(component.componentPath, assetManifest);
        break;

      case 'BLANK_COMPONENT':
      case 'LOW_CONTENT':
        result = await fixBlankComponent(component.componentPath);
        break;

      case 'ELEMENTS_OUTSIDE_VIEWPORT':
        result = await fixOutsideViewport(component.componentPath);
        break;

      case 'VERY_SHORT':
        result = await fixVeryShortComponent(component.componentPath);
        break;

      default:
        result = { fixed: false, fixesApplied: [] };
    }

    if (result.fixed) {
      anyFixed = true;
      allFixes.push(...result.fixesApplied);
    }
  }

  // Determine new status
  // We won't know for sure until validation runs again
  const newStatus = anyFixed ? 'warning' : component.status;

  return {
    component: component.name,
    fixed: anyFixed,
    fixesApplied: allFixes,
    newStatus,
    remainingIssues: anyFixed ? [] : component.issues,
  };
}

/**
 * Run iterative fixes on all failed components
 */
export async function runIterativeFixes(
  failedComponents: FailedComponent[],
  options: {
    maxAttempts?: number;
    assetManifest?: { images: Array<{ originalUrl: string; localPath: string }> };
    onProgress?: (progress: { current: number; total: number; component: string }) => void;
  } = {}
): Promise<IterativeFixResult> {
  const { maxAttempts = 3, assetManifest, onProgress } = options;

  const results: FixResult[] = [];
  let componentsFixed = 0;
  let totalAttempts = 0;

  for (let i = 0; i < failedComponents.length; i++) {
    const component = failedComponents[i];

    onProgress?.({
      current: i + 1,
      total: failedComponents.length,
      component: component.name,
    });

    // Try to fix the component
    let attempts = 0;
    let lastResult: FixResult | null = null;

    while (attempts < maxAttempts) {
      attempts++;
      totalAttempts++;

      const result = await fixComponent(component, assetManifest);
      lastResult = result;

      if (result.fixed) {
        componentsFixed++;
        console.log(`[ComponentFixer] Fixed ${component.name}: ${result.fixesApplied.join(', ')}`);
        break;
      }

      if (!result.fixed && attempts < maxAttempts) {
        console.log(`[ComponentFixer] Attempt ${attempts} failed for ${component.name}, retrying...`);
      }
    }

    if (lastResult) {
      results.push(lastResult);
    }
  }

  return {
    success: componentsFixed > 0,
    totalAttempts,
    componentsFixed,
    componentsRemaining: failedComponents.length - componentsFixed,
    results,
  };
}

/**
 * Format fix results as human-readable report
 */
export function formatFixReport(result: IterativeFixResult): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('                  COMPONENT FIX REPORT');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push(`Fixed: ${result.componentsFixed} | Remaining: ${result.componentsRemaining} | Attempts: ${result.totalAttempts}`);
  lines.push('───────────────────────────────────────────────────────────');

  for (const fix of result.results) {
    const icon = fix.fixed ? '✅' : '❌';
    lines.push('');
    lines.push(`${icon} ${fix.component}`);

    if (fix.fixed && fix.fixesApplied.length > 0) {
      lines.push('   Fixes applied:');
      for (const applied of fix.fixesApplied) {
        lines.push(`     • ${applied}`);
      }
    } else if (!fix.fixed && fix.remainingIssues.length > 0) {
      lines.push('   Remaining issues:');
      for (const issue of fix.remainingIssues) {
        lines.push(`     • [${issue.code}] ${issue.message}`);
      }
    }
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');

  return lines.join('\n');
}

// ====================
// HELPERS
// ====================

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
