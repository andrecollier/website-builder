/**
 * Component Validator Module
 *
 * Uses Playwright to validate generated components for:
 * - Blank/empty content
 * - Missing or broken images
 * - Layout issues (elements outside viewport)
 * - Content comparison with reference
 */

import type { Page } from 'playwright';

export interface ComponentIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  details?: string;
}

export interface ComponentValidation {
  component: string;
  status: 'ok' | 'warning' | 'error';
  issues: ComponentIssue[];
  suggestions: string[];
  metrics: {
    height: number;
    width: number;
    textLength: number;
    imageCount: number;
    brokenImages: number;
    elementsOutsideViewport: number;
  };
}

export interface ValidationReport {
  previewUrl: string;
  validatedAt: string;
  components: ComponentValidation[];
  summary: {
    total: number;
    ok: number;
    warnings: number;
    errors: number;
  };
}

/**
 * Validate a single component
 */
export async function validateComponent(
  page: Page,
  previewUrl: string,
  componentName: string
): Promise<ComponentValidation> {
  const issues: ComponentIssue[] = [];
  const suggestions: string[] = [];

  const componentUrl = `${previewUrl}/preview/${componentName.toLowerCase()}`;

  try {
    const response = await page.goto(componentUrl, { timeout: 15000 });

    // Check for 404
    if (response?.status() === 404) {
      return {
        component: componentName,
        status: 'error',
        issues: [{
          type: 'error',
          code: 'NOT_FOUND',
          message: `Component route not found: ${componentUrl}`,
        }],
        suggestions: ['Check if component is exported in index.ts', 'Verify component name matches route'],
        metrics: { height: 0, width: 0, textLength: 0, imageCount: 0, brokenImages: 0, elementsOutsideViewport: 0 },
      };
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Extract component metrics and check for issues
    const analysis = await page.evaluate(() => {
      const element = document.querySelector('[data-component-name]');
      if (!element) {
        return { error: 'NO_WRAPPER' };
      }
      const wrapper = element as HTMLElement;

      const rect = wrapper.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // Get all text content
      const text = wrapper.innerText?.trim() || '';

      // Check images
      const images = wrapper.querySelectorAll('img');
      let brokenImages = 0;
      const imageDetails: Array<{ src: string; loaded: boolean; width: number; height: number }> = [];

      images.forEach((img) => {
        const imgEl = img as HTMLImageElement;
        const imgRect = imgEl.getBoundingClientRect();
        const isLoaded = imgEl.complete && imgEl.naturalWidth > 0;

        if (!isLoaded) {
          brokenImages++;
        }

        imageDetails.push({
          src: imgEl.src?.substring(0, 100),
          loaded: isLoaded,
          width: imgRect.width,
          height: imgRect.height,
        });
      });

      // Check for elements outside viewport
      const allElements = wrapper.querySelectorAll('*');
      let elementsOutsideViewport = 0;
      const outsideElements: string[] = [];

      allElements.forEach((el) => {
        const elRect = el.getBoundingClientRect();
        // Check if element is significantly outside the viewport width
        if (elRect.right < -100 || elRect.left > viewportWidth + 100) {
          elementsOutsideViewport++;
          const tag = el.tagName.toLowerCase();
          const classes = el.className?.toString().substring(0, 30) || '';
          outsideElements.push(`${tag}${classes ? '.' + classes : ''}`);
        }
      });

      // Check for empty sections (large areas with no content)
      const sections = wrapper.querySelectorAll('section, div');
      let emptySections = 0;
      sections.forEach((section) => {
        const sectionRect = section.getBoundingClientRect();
        const sectionText = section.textContent?.trim() || '';
        const sectionImages = section.querySelectorAll('img').length;

        // Large section with no content
        if (sectionRect.height > 200 && sectionRect.width > 200 && sectionText.length < 5 && sectionImages === 0) {
          const bg = getComputedStyle(section).backgroundColor;
          // Ignore if it has a background color (might be decorative)
          if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
            emptySections++;
          }
        }
      });

      return {
        height: Math.round(rect.height),
        width: Math.round(rect.width),
        textLength: text.length,
        textPreview: text.substring(0, 200),
        imageCount: images.length,
        brokenImages,
        imageDetails: imageDetails.slice(0, 5),
        elementsOutsideViewport,
        outsideElements: outsideElements.slice(0, 5),
        emptySections,
      };
    });

    if ('error' in analysis) {
      return {
        component: componentName,
        status: 'error',
        issues: [{
          type: 'error',
          code: analysis.error || 'UNKNOWN_ERROR',
          message: 'Component wrapper not found',
        }],
        suggestions: ['Ensure component renders a data-component-name wrapper'],
        metrics: { height: 0, width: 0, textLength: 0, imageCount: 0, brokenImages: 0, elementsOutsideViewport: 0 },
      };
    }

    // Analyze results and generate issues

    // Check for blank component
    if (analysis.textLength < 10 && analysis.imageCount === 0) {
      issues.push({
        type: 'error',
        code: 'BLANK_COMPONENT',
        message: 'Component appears to be blank (no text or images)',
        details: `Text length: ${analysis.textLength}, Images: ${analysis.imageCount}`,
      });
      suggestions.push('Check section bounding box alignment with actual content');
      suggestions.push('Verify style extraction is capturing correct elements');
    } else if (analysis.textLength < 50 && analysis.imageCount === 0) {
      issues.push({
        type: 'warning',
        code: 'LOW_CONTENT',
        message: 'Component has very little visible content',
        details: `Text length: ${analysis.textLength}`,
      });
      suggestions.push('Review if all content from reference is being extracted');
    }

    // Check for broken images
    if (analysis.brokenImages > 0) {
      issues.push({
        type: 'warning',
        code: 'BROKEN_IMAGES',
        message: `${analysis.brokenImages} image(s) failed to load`,
        details: analysis.imageDetails
          .filter(img => !img.loaded)
          .map(img => img.src)
          .join(', '),
      });
      suggestions.push('Check if image URLs are accessible');
      suggestions.push('Consider downloading and hosting images locally');
    }

    // Check for elements outside viewport
    if (analysis.elementsOutsideViewport > 5) {
      issues.push({
        type: 'warning',
        code: 'ELEMENTS_OUTSIDE_VIEWPORT',
        message: `${analysis.elementsOutsideViewport} elements positioned outside viewport`,
        details: analysis.outsideElements?.join(', '),
      });
      suggestions.push('Review absolute positioning in extracted styles');
      suggestions.push('Check if parent container has correct width');
    }

    // Check for empty sections
    if (analysis.emptySections > 2) {
      issues.push({
        type: 'info',
        code: 'EMPTY_SECTIONS',
        message: `${analysis.emptySections} empty section(s) detected`,
      });
      suggestions.push('These may be layout spacers or missing content');
    }

    // Check component height
    if (analysis.height < 50) {
      issues.push({
        type: 'warning',
        code: 'VERY_SHORT',
        message: 'Component height is very small',
        details: `Height: ${analysis.height}px`,
      });
      suggestions.push('Check if content is rendering correctly');
    }

    // Determine overall status
    const hasErrors = issues.some(i => i.type === 'error');
    const hasWarnings = issues.some(i => i.type === 'warning');
    const status = hasErrors ? 'error' : hasWarnings ? 'warning' : 'ok';

    return {
      component: componentName,
      status,
      issues,
      suggestions: Array.from(new Set(suggestions)), // Remove duplicates
      metrics: {
        height: analysis.height,
        width: analysis.width,
        textLength: analysis.textLength,
        imageCount: analysis.imageCount,
        brokenImages: analysis.brokenImages,
        elementsOutsideViewport: analysis.elementsOutsideViewport,
      },
    };

  } catch (error) {
    return {
      component: componentName,
      status: 'error',
      issues: [{
        type: 'error',
        code: 'VALIDATION_FAILED',
        message: `Failed to validate component: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      suggestions: ['Check if preview server is running', 'Verify component compiles without errors'],
      metrics: { height: 0, width: 0, textLength: 0, imageCount: 0, brokenImages: 0, elementsOutsideViewport: 0 },
    };
  }
}

/**
 * Validate all components in a generated site
 */
export async function validateAllComponents(
  page: Page,
  previewUrl: string,
  componentNames: string[]
): Promise<ValidationReport> {
  const components: ComponentValidation[] = [];

  for (const name of componentNames) {
    const validation = await validateComponent(page, previewUrl, name);
    components.push(validation);
  }

  const summary = {
    total: components.length,
    ok: components.filter(c => c.status === 'ok').length,
    warnings: components.filter(c => c.status === 'warning').length,
    errors: components.filter(c => c.status === 'error').length,
  };

  return {
    previewUrl,
    validatedAt: new Date().toISOString(),
    components,
    summary,
  };
}

/**
 * Generate a human-readable validation report
 */
export function formatValidationReport(report: ValidationReport): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('                    COMPONENT VALIDATION REPORT');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push(`Preview URL: ${report.previewUrl}`);
  lines.push(`Validated: ${new Date(report.validatedAt).toLocaleString()}`);
  lines.push('');
  lines.push(`Summary: ${report.summary.ok}/${report.summary.total} OK | ${report.summary.warnings} warnings | ${report.summary.errors} errors`);
  lines.push('───────────────────────────────────────────────────────────');

  for (const comp of report.components) {
    const icon = comp.status === 'ok' ? '✅' : comp.status === 'warning' ? '⚠️' : '❌';
    lines.push('');
    lines.push(`${icon} ${comp.component}`);
    lines.push(`   Height: ${comp.metrics.height}px | Text: ${comp.metrics.textLength} chars | Images: ${comp.metrics.imageCount}`);

    if (comp.issues.length > 0) {
      lines.push('   Issues:');
      for (const issue of comp.issues) {
        const issueIcon = issue.type === 'error' ? '🔴' : issue.type === 'warning' ? '🟡' : '🔵';
        lines.push(`     ${issueIcon} [${issue.code}] ${issue.message}`);
        if (issue.details) {
          lines.push(`        ${issue.details}`);
        }
      }
    }

    if (comp.suggestions.length > 0) {
      lines.push('   Suggestions:');
      for (const suggestion of comp.suggestions) {
        lines.push(`     💡 ${suggestion}`);
      }
    }
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');

  return lines.join('\n');
}
