/**
 * Component Validation Module
 *
 * Validates individual generated components against reference screenshots.
 * Each component is rendered in isolation and compared with the corresponding
 * reference section screenshot.
 */

import { chromium, Browser, Page } from 'playwright';
import fs from 'fs';
import path from 'path';
import { compareImages } from './visual-diff';
import { startGeneratedSite, checkGeneratedSiteStatus, stopGeneratedSite } from './server-manager';

// ====================
// INTERFACES
// ====================

export interface ComponentValidationResult {
  componentName: string;
  componentType: string;
  accuracy: number;
  passed: boolean; // accuracy >= 80
  screenshotPath: string;
  referencePath: string;
  diffPath: string;
  dimensions?: {
    width: number;
    height: number;
  };
  error?: string;
}

export interface ComponentValidationReport {
  websiteId: string;
  timestamp: string;
  totalComponents: number;
  passedComponents: number;
  failedComponents: number;
  averageAccuracy: number;
  results: ComponentValidationResult[];
}

interface ComponentInfo {
  name: string;
  type: string;
  dir: string;
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Extract base section type from component name (e.g., "Features2" -> "features")
 */
function getBaseType(componentName: string): string {
  return componentName.replace(/\d+$/, '').toLowerCase();
}

/**
 * Normalize type names to handle aliases
 */
function normalizeType(type: string): string {
  const typeAliases: Record<string, string> = {
    'calltoaction': 'cta',
    'call-to-action': 'cta',
    'contactform': 'contact',
    'featurelist': 'features',
  };
  return typeAliases[type.toLowerCase()] || type.toLowerCase();
}

/**
 * Get list of generated components from the website
 */
function getGeneratedComponents(generatedDir: string): ComponentInfo[] {
  const componentsDir = path.join(generatedDir, 'src', 'components');

  if (!fs.existsSync(componentsDir)) {
    return [];
  }

  return fs.readdirSync(componentsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => ({
      name: entry.name,
      type: normalizeType(getBaseType(entry.name)),
      dir: path.join(componentsDir, entry.name),
    }));
}

/**
 * Build a map of reference screenshots by type
 * e.g., { header: ['01-header.png'], features: ['03-features.png', '06-features.png'] }
 */
function buildReferenceMap(referenceDir: string): Map<string, string[]> {
  const referenceMap = new Map<string, string[]>();

  if (!fs.existsSync(referenceDir)) {
    return referenceMap;
  }

  const files = fs.readdirSync(referenceDir)
    .filter(f => f.endsWith('.png'))
    .sort();

  for (const file of files) {
    // Extract type from filename (e.g., "03-features.png" -> "features")
    const match = file.match(/^\d+-([a-z]+)(?:\d+)?\.png$/i);
    if (match) {
      const type = normalizeType(match[1]);
      if (!referenceMap.has(type)) {
        referenceMap.set(type, []);
      }
      referenceMap.get(type)!.push(file);
    }
  }

  return referenceMap;
}

// ====================
// MAIN FUNCTIONS
// ====================

/**
 * Capture a single component in isolation and compare with reference
 *
 * @param websiteId - The website ID
 * @param componentName - Component name (e.g., "Header", "Features2")
 * @param referencePath - Path to reference screenshot
 * @param options - Additional options
 * @returns ComponentValidationResult
 */
export async function captureAndCompareComponent(
  websiteId: string,
  componentName: string,
  referencePath: string,
  options: {
    websitesDir: string;
    generatedSiteUrl: string;
    viewportWidth?: number;
  }
): Promise<ComponentValidationResult> {
  const {
    websitesDir,
    generatedSiteUrl,
    viewportWidth = 1440,
  } = options;

  const componentType = normalizeType(getBaseType(componentName));
  const websiteDir = path.join(websitesDir, websiteId);
  const validationDir = path.join(websiteDir, 'comparison', 'component-validation');

  // Ensure validation directory exists
  if (!fs.existsSync(validationDir)) {
    fs.mkdirSync(validationDir, { recursive: true });
  }

  const screenshotPath = path.join(validationDir, `${componentName.toLowerCase()}.png`);
  const diffPath = path.join(validationDir, `${componentName.toLowerCase()}-diff.png`);

  // Check if reference exists
  if (!fs.existsSync(referencePath)) {
    return {
      componentName,
      componentType,
      accuracy: 0,
      passed: false,
      screenshotPath: '',
      referencePath,
      diffPath: '',
      error: `Reference screenshot not found: ${referencePath}`,
    };
  }

  let browser: Browser | null = null;

  try {
    // Launch browser
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: viewportWidth, height: 900 },
    });
    const page = await context.newPage();

    // Navigate to component preview route
    const previewUrl = `${generatedSiteUrl}/preview/${componentName.toLowerCase()}`;
    let isPreviewRoute = false;

    try {
      await page.goto(previewUrl, {
        waitUntil: 'load',
        timeout: 30000,
      });
      isPreviewRoute = true;
    } catch (navError) {
      // Preview route might not exist - fall back to main page and capture specific component
      await page.goto(generatedSiteUrl, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
    }

    // Wait for React to hydrate and render client components
    // Use a selector-based wait with polling for reliability
    let elementHandle = null;

    if (isPreviewRoute) {
      // Wait for any data-component-name attribute to appear (indicates hydration complete)
      try {
        await page.waitForSelector('[data-component-name]', { timeout: 10000 });
        elementHandle = await page.$(`[data-component-name="${componentName}"]`);
      } catch {
        // Fallback: wait for any div with 1440px width
        try {
          await page.waitForFunction(
            () => {
              const divs = document.querySelectorAll('div');
              return Array.from(divs).some(div =>
                div.style.width === '1440px' ||
                getComputedStyle(div).width === '1440px'
              );
            },
            { timeout: 10000 }
          );
          elementHandle = await page.$('div[style*="1440"]');
        } catch {
          // Last resort: just wait for body to have substantial content
          await page.waitForTimeout(5000);
        }
      }
    } else {
      await page.waitForTimeout(2000);
      elementHandle = await page.$(`[data-component-name="${componentName}"]`);
    }

    if (!elementHandle) {
      // Try case-insensitive match
      elementHandle = await page.$(`[data-component-name="${componentName.toLowerCase()}"]`);
    }

    if (!elementHandle) {
      // Fallback: find by data-component-type
      const componentTypeForQuery = getBaseType(componentName).toLowerCase();
      const elements = await page.$$(`[data-component-type="${componentTypeForQuery}"]`);

      // If multiple elements of same type, match by index (Features vs Features2)
      const suffix = componentName.match(/(\d+)$/)?.[1];
      const index = suffix ? parseInt(suffix, 10) - 1 : 0;

      if (elements.length > index) {
        elementHandle = elements[index];
      } else if (elements.length > 0) {
        elementHandle = elements[0];
      }
    }

    if (!elementHandle) {
      await browser.close();
      return {
        componentName,
        componentType,
        accuracy: 0,
        passed: false,
        screenshotPath: '',
        referencePath,
        diffPath: '',
        error: `Component not found in page: ${componentName}`,
      };
    }

    // Scroll into view and wait for lazy content
    await elementHandle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Wait for images to load
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      await Promise.all(
        images
          .filter(img => {
            const rect = img.getBoundingClientRect();
            return rect.top < window.innerHeight && rect.bottom > 0;
          })
          .map(img =>
            img.complete
              ? Promise.resolve()
              : new Promise(resolve => {
                  img.onload = resolve;
                  img.onerror = resolve;
                  setTimeout(resolve, 2000);
                })
          )
      );
    });

    // Take screenshot of the component
    await elementHandle.screenshot({
      path: screenshotPath,
      type: 'png',
    });

    await browser.close();
    browser = null;

    // Compare with reference
    const comparison = await compareImages(referencePath, screenshotPath, diffPath);
    const passed = comparison.accuracy >= 80;

    return {
      componentName,
      componentType,
      accuracy: comparison.accuracy,
      passed,
      screenshotPath,
      referencePath,
      diffPath: comparison.diffImagePath,
      dimensions: comparison.dimensions,
    };
  } catch (error) {
    if (browser) {
      await browser.close();
    }

    return {
      componentName,
      componentType,
      accuracy: 0,
      passed: false,
      screenshotPath,
      referencePath,
      diffPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate all components for a website
 *
 * 1. Gets list of components from generated site
 * 2. Matches each to reference screenshot by type (header, hero, features, etc.)
 * 3. Captures isolated preview screenshot
 * 4. Runs pixelmatch comparison
 * 5. Returns per-component results
 *
 * @param options - Validation options
 * @returns ComponentValidationReport with per-component results
 */
export async function validateAllComponents(options: {
  websiteId: string;
  websitesDir: string;
  generatedSiteUrl?: string;
  autoStartServer?: boolean;
  port?: number;
  viewportWidth?: number;
  onProgress?: (progress: { current: number; total: number; componentName: string }) => void;
}): Promise<ComponentValidationReport> {
  const {
    websiteId,
    websitesDir,
    autoStartServer = true,
    port = 3002,
    viewportWidth = 1440,
    onProgress,
  } = options;

  const websiteDir = path.join(websitesDir, websiteId);
  const generatedDir = path.join(websiteDir, 'generated');
  const referenceDir = path.join(websiteDir, 'reference', 'sections');
  const validationDir = path.join(websiteDir, 'comparison', 'component-validation');

  // Ensure output directory exists
  if (!fs.existsSync(validationDir)) {
    fs.mkdirSync(validationDir, { recursive: true });
  }

  // Get generated components
  const components = getGeneratedComponents(generatedDir);

  if (components.length === 0) {
    return {
      websiteId,
      timestamp: new Date().toISOString(),
      totalComponents: 0,
      passedComponents: 0,
      failedComponents: 0,
      averageAccuracy: 0,
      results: [],
    };
  }

  // Build reference screenshot map by type
  const referenceMap = buildReferenceMap(referenceDir);

  // Track which reference of each type has been used
  const usedReferencesByType = new Map<string, number>();

  // Determine site URL
  let siteUrl = options.generatedSiteUrl || `http://localhost:${port}`;

  // Auto-start server if needed
  if (autoStartServer && !options.generatedSiteUrl) {
    const status = await checkGeneratedSiteStatus(port);

    if (!status.running) {
      console.log('[ComponentValidation] Starting generated site...');
      const startResult = await startGeneratedSite({
        websiteId,
        websitesDir,
        port,
      });

      if (!startResult.success) {
        throw new Error(`Failed to start generated site: ${startResult.error}`);
      }

      siteUrl = startResult.url || siteUrl;
    } else {
      siteUrl = status.url || siteUrl;
    }
  }

  const results: ComponentValidationResult[] = [];

  // Validate each component
  for (let i = 0; i < components.length; i++) {
    const component = components[i];

    // Report progress
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: components.length,
        componentName: component.name,
      });
    }

    // Find matching reference screenshot
    const typeReferences = referenceMap.get(component.type) || [];
    const typeIndex = usedReferencesByType.get(component.type) || 0;

    if (typeIndex >= typeReferences.length) {
      // No reference found for this component type
      results.push({
        componentName: component.name,
        componentType: component.type,
        accuracy: 0,
        passed: false,
        screenshotPath: '',
        referencePath: '',
        diffPath: '',
        error: `No reference screenshot found for type: ${component.type}`,
      });
      continue;
    }

    const referenceFile = typeReferences[typeIndex];
    const referencePath = path.join(referenceDir, referenceFile);
    usedReferencesByType.set(component.type, typeIndex + 1);

    console.log(`[ComponentValidation] Validating ${component.name} against ${referenceFile}`);

    const result = await captureAndCompareComponent(
      websiteId,
      component.name,
      referencePath,
      {
        websitesDir,
        generatedSiteUrl: siteUrl,
        viewportWidth,
      }
    );

    results.push(result);
  }

  // Calculate summary statistics
  const passedComponents = results.filter(r => r.passed).length;
  const failedComponents = results.filter(r => !r.passed).length;
  const totalAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0);
  const averageAccuracy = results.length > 0
    ? Math.round((totalAccuracy / results.length) * 100) / 100
    : 0;

  const report: ComponentValidationReport = {
    websiteId,
    timestamp: new Date().toISOString(),
    totalComponents: results.length,
    passedComponents,
    failedComponents,
    averageAccuracy,
    results,
  };

  // Save report
  const reportPath = path.join(validationDir, 'report.json');
  await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log(`[ComponentValidation] Complete: ${passedComponents}/${results.length} passed (avg ${averageAccuracy}%)`);

  return report;
}

/**
 * Get existing component validation report if available
 */
export function getExistingValidationReport(
  websiteId: string,
  websitesDir: string
): ComponentValidationReport | null {
  const reportPath = path.join(
    websitesDir,
    websiteId,
    'comparison',
    'component-validation',
    'report.json'
  );

  if (fs.existsSync(reportPath)) {
    try {
      return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    } catch {
      return null;
    }
  }

  return null;
}
