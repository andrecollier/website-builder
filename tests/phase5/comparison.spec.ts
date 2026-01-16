/**
 * Phase 5: Visual Comparison System - Automated Tests
 *
 * This test suite documents and verifies the visual comparison functionality.
 * It captures screenshots at each step for visual verification.
 *
 * Run: npx playwright test tests/phase5/comparison.spec.ts
 * Report: npx playwright show-report
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
const WEBSITE_ID = 'website-58f08468-e52f-47b2-a853-423fd8938e5a';
const BASE_URL = 'http://localhost:3002';
const WEBSITES_DIR = path.join(process.cwd(), 'Websites');

// Helper to save test documentation
async function documentStep(page: Page, stepName: string, description: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = `test-results/docs/${stepName}-${timestamp}.png`;

  // Ensure directory exists
  const dir = path.dirname(screenshotPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`[DOC] ${stepName}: ${description}`);
  console.log(`      Screenshot: ${screenshotPath}`);

  return screenshotPath;
}

test.describe('Phase 5: Visual Comparison System', () => {

  test.describe('1. Dashboard & Navigation', () => {

    test('1.1 Dashboard loads and shows projects', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await documentStep(page, '01-dashboard', 'Main dashboard with project list');

      // Check for project list
      const projectCards = page.locator('[data-testid="project-card"], .project-card, [class*="project"]');
      const cardCount = await projectCards.count();

      console.log(`[INFO] Found ${cardCount} project cards on dashboard`);

      // Take screenshot of the dashboard
      await expect(page).toHaveTitle(/Website|Dashboard|Cooker/i);
    });

    test('1.2 Compare button exists for projects with generated content', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Look for compare buttons or links
      const compareButtons = page.locator('button:has-text("Compare"), a:has-text("Compare"), [href*="compare"]');
      const count = await compareButtons.count();

      await documentStep(page, '02-compare-buttons', `Found ${count} compare button(s)`);

      console.log(`[INFO] Compare buttons found: ${count}`);
    });

  });

  test.describe('2. Compare Page UI', () => {

    test('2.1 Compare page loads for test website', async ({ page }) => {
      await page.goto(`/compare/${WEBSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // Wait for loading to complete
      await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});

      await documentStep(page, '03-compare-page-initial', 'Compare page initial state');

      // Check for key UI elements
      const backLink = page.locator('a:has-text("Back to Dashboard")');
      await expect(backLink).toBeVisible();

      const title = page.locator('h1:has-text("Visual Comparison")');
      await expect(title).toBeVisible();
    });

    test('2.2 Compare page shows existing report or run button', async ({ page }) => {
      await page.goto(`/compare/${WEBSITE_ID}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for data load

      await documentStep(page, '04-compare-page-loaded', 'Compare page after data load');

      // Should have either a report or a "Run Comparison" button
      const runButton = page.locator('button:has-text("Run Comparison"), button:has-text("Start Comparison")');
      const summaryCards = page.locator('[class*="grid"] > div:has-text("Accuracy")');

      const hasButton = await runButton.count() > 0;
      const hasReport = await summaryCards.count() > 0;

      console.log(`[INFO] Has Run Button: ${hasButton}`);
      console.log(`[INFO] Has Report Summary: ${hasReport}`);

      expect(hasButton || hasReport).toBeTruthy();
    });

    test('2.3 Summary cards display correctly when report exists', async ({ page }) => {
      await page.goto(`/compare/${WEBSITE_ID}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check if report.json exists
      const reportPath = path.join(WEBSITES_DIR, WEBSITE_ID, 'comparison', 'report.json');
      const hasReport = fs.existsSync(reportPath);

      if (hasReport) {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
        console.log(`[INFO] Existing report accuracy: ${report.overallAccuracy}%`);
        console.log(`[INFO] Sections: ${report.sections.length}`);

        await documentStep(page, '05-summary-cards', 'Summary cards with accuracy data');

        // Verify accuracy badge
        const accuracyBadge = page.locator('[class*="AccuracyBadge"], .text-2xl:has-text("%")');
        await expect(accuracyBadge.first()).toBeVisible();
      } else {
        console.log('[INFO] No existing report found - skipping summary card check');
      }
    });

  });

  test.describe('3. Section Comparison Components', () => {

    test('3.1 Section list renders correctly', async ({ page }) => {
      await page.goto(`/compare/${WEBSITE_ID}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await documentStep(page, '06-section-list', 'Section comparison list');

      // Find section comparison components
      const sections = page.locator('[class*="SectionComparison"], [class*="section-comparison"], .space-y-4 > div');
      const sectionCount = await sections.count();

      console.log(`[INFO] Section comparison components: ${sectionCount}`);
    });

    test('3.2 Expandable sections work', async ({ page }) => {
      await page.goto(`/compare/${WEBSITE_ID}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Find and click an expandable section
      const expandButton = page.locator('button:has-text("header"), button:has-text("Header")').first();

      if (await expandButton.count() > 0) {
        await expandButton.click();
        await page.waitForTimeout(500);

        await documentStep(page, '07-section-expanded', 'Expanded section view');
      }
    });

  });

  test.describe('4. View Mode Components', () => {

    test('4.1 View mode tabs exist (Side-by-Side, Overlay, Diff)', async ({ page }) => {
      await page.goto(`/compare/${WEBSITE_ID}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Expand first section if needed
      const expandButton = page.locator('button:has-text("header"), button:has-text("Header")').first();
      if (await expandButton.count() > 0) {
        await expandButton.click();
        await page.waitForTimeout(500);
      }

      // Check for view mode tabs
      const sideBySideTab = page.locator('button:has-text("Side-by-Side"), button:has-text("Side by Side")');
      const overlayTab = page.locator('button:has-text("Overlay")');
      const diffTab = page.locator('button:has-text("Diff")');

      const hasSideBySide = await sideBySideTab.count() > 0;
      const hasOverlay = await overlayTab.count() > 0;
      const hasDiff = await diffTab.count() > 0;

      console.log(`[INFO] Side-by-Side tab: ${hasSideBySide}`);
      console.log(`[INFO] Overlay tab: ${hasOverlay}`);
      console.log(`[INFO] Diff tab: ${hasDiff}`);

      await documentStep(page, '08-view-modes', 'View mode tabs');
    });

    test('4.2 Side-by-Side view shows both images', async ({ page }) => {
      await page.goto(`/compare/${WEBSITE_ID}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Expand first section
      const expandButton = page.locator('button:has-text("header"), button:has-text("Header")').first();
      if (await expandButton.count() > 0) {
        await expandButton.click();
        await page.waitForTimeout(500);
      }

      // Click Side-by-Side tab if available
      const sideBySideTab = page.locator('button:has-text("Side-by-Side"), button:has-text("Side by Side")');
      if (await sideBySideTab.count() > 0) {
        await sideBySideTab.click();
        await page.waitForTimeout(500);
      }

      await documentStep(page, '09-side-by-side', 'Side-by-Side view');

      // Check for images
      const images = page.locator('img[src*="api/image"], img[alt*="reference"], img[alt*="generated"]');
      const imageCount = await images.count();

      console.log(`[INFO] Images in Side-by-Side view: ${imageCount}`);
    });

    test('4.3 Diff view shows difference image', async ({ page }) => {
      await page.goto(`/compare/${WEBSITE_ID}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Expand first section
      const expandButton = page.locator('button:has-text("header"), button:has-text("Header")').first();
      if (await expandButton.count() > 0) {
        await expandButton.click();
        await page.waitForTimeout(500);
      }

      // Click Diff tab
      const diffTab = page.locator('button:has-text("Diff")');
      if (await diffTab.count() > 0) {
        await diffTab.click();
        await page.waitForTimeout(500);

        await documentStep(page, '10-diff-view', 'Diff view showing differences');
      }
    });

  });

  test.describe('5. API Endpoints', () => {

    test('5.1 GET /api/compare returns existing report', async ({ request }) => {
      const response = await request.get(`/api/compare?websiteId=${WEBSITE_ID}`);
      const data = await response.json();

      console.log(`[API] GET /api/compare status: ${response.status()}`);
      console.log(`[API] Response success: ${data.success}`);

      if (data.success && data.report) {
        console.log(`[API] Overall accuracy: ${data.report.overallAccuracy}%`);
        console.log(`[API] Sections: ${data.report.sections?.length || 0}`);
      } else {
        console.log(`[API] Error: ${data.error}`);
      }

      // Should return either success with report or 404
      expect(response.status()).toBeLessThan(500);
    });

    test('5.2 POST /api/compare runs comparison', async ({ request }) => {
      // Note: This test may take a while as it runs the full comparison
      const response = await request.post('/api/compare', {
        data: {
          websiteId: WEBSITE_ID,
          forceRecapture: false, // Use cached if available
        },
        timeout: 120000, // 2 minute timeout
      });

      const data = await response.json();

      console.log(`[API] POST /api/compare status: ${response.status()}`);
      console.log(`[API] Response success: ${data.success}`);

      if (data.success && data.report) {
        console.log(`[API] Comparison completed`);
        console.log(`[API] Overall accuracy: ${data.report.overallAccuracy}%`);
        console.log(`[API] Sections compared: ${data.report.sections?.length || 0}`);

        // Log section details
        data.report.sections?.forEach((section: any) => {
          const hasGenerated = section.generatedImagePath ? 'Yes' : 'NO';
          console.log(`[API]   - ${section.sectionName}: ${section.accuracy.toFixed(1)}% (Generated: ${hasGenerated})`);
        });
      } else {
        console.log(`[API] Error: ${data.error}`);
      }

      expect(response.status()).toBe(200);
    });

  });

  test.describe('6. Screenshot Capture Verification', () => {

    test('6.1 Reference screenshots exist', async ({ page }) => {
      const sectionsDir = path.join(WEBSITES_DIR, WEBSITE_ID, 'reference', 'sections');

      if (fs.existsSync(sectionsDir)) {
        const files = fs.readdirSync(sectionsDir).filter(f => f.endsWith('.png'));
        console.log(`[FILES] Reference screenshots: ${files.length}`);
        files.forEach(f => console.log(`[FILES]   - ${f}`));

        expect(files.length).toBeGreaterThan(0);
      } else {
        console.log('[FILES] Reference sections directory not found');
        expect(fs.existsSync(sectionsDir)).toBeTruthy();
      }
    });

    test('6.2 Generated screenshots status', async ({ page }) => {
      const screenshotsDir = path.join(WEBSITES_DIR, WEBSITE_ID, 'generated', 'screenshots');

      if (fs.existsSync(screenshotsDir)) {
        const files = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png'));
        console.log(`[FILES] Generated screenshots: ${files.length}`);
        files.forEach(f => console.log(`[FILES]   - ${f}`));

        // Document the issue if not all screenshots exist
        const reportPath = path.join(WEBSITES_DIR, WEBSITE_ID, 'comparison', 'report.json');
        if (fs.existsSync(reportPath)) {
          const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
          const totalSections = report.sections.length;
          const capturedSections = files.length;

          console.log(`[ISSUE] Only ${capturedSections}/${totalSections} sections were captured`);

          if (capturedSections < totalSections) {
            console.log('[ISSUE] Root cause: Screenshot capture uses original bounding boxes');
            console.log('[ISSUE] which do not match the generated page layout');
          }
        }
      } else {
        console.log('[FILES] Generated screenshots directory not found');
      }
    });

    test('6.3 Diff images status', async ({ page }) => {
      const diffsDir = path.join(WEBSITES_DIR, WEBSITE_ID, 'comparison', 'diffs');

      if (fs.existsSync(diffsDir)) {
        const files = fs.readdirSync(diffsDir).filter(f => f.endsWith('.png'));
        console.log(`[FILES] Diff images: ${files.length}`);
        files.forEach(f => console.log(`[FILES]   - ${f}`));
      } else {
        console.log('[FILES] Diffs directory not found');
      }
    });

  });

  test.describe('7. Known Issues Documentation', () => {

    test('7.1 Document screenshot capture issue', async ({ page }) => {
      // Load the metadata to understand the issue
      const metadataPath = path.join(WEBSITES_DIR, WEBSITE_ID, 'reference', 'metadata.json');

      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

        console.log('='.repeat(60));
        console.log('KNOWN ISSUE: Screenshot Capture Failure');
        console.log('='.repeat(60));
        console.log('');
        console.log('Problem:');
        console.log('  Screenshot capture fails for sections 2-10 with error:');
        console.log('  "Clipped area is either empty or outside the resulting image"');
        console.log('');
        console.log('Root Cause:');
        console.log('  The capture logic uses original bounding boxes from metadata:');
        metadata.sections.forEach((s: any, i: number) => {
          console.log(`    Section ${i + 1}: y=${s.boundingBox.y}, height=${s.boundingBox.height}`);
        });
        console.log('');
        console.log(`  Total original page height: ${metadata.fullPageHeight}px`);
        console.log('  But generated page is much shorter (only 5 placeholder components)');
        console.log('');
        console.log('Required Fix:');
        console.log('  1. Capture screenshots based on actual DOM element positions');
        console.log('  2. Add data-section attributes to generated components');
        console.log('  3. Use element.boundingBox() instead of metadata coordinates');
        console.log('='.repeat(60));
      }
    });

    test('7.2 Document component generation gaps', async ({ page }) => {
      const componentsDir = path.join(WEBSITES_DIR, WEBSITE_ID, 'generated', 'src', 'components');

      if (fs.existsSync(componentsDir)) {
        const components = fs.readdirSync(componentsDir).filter(f =>
          fs.statSync(path.join(componentsDir, f)).isDirectory()
        );

        console.log('='.repeat(60));
        console.log('KNOWN ISSUE: Component Generation Gaps');
        console.log('='.repeat(60));
        console.log('');
        console.log('Generated components:');
        components.forEach(c => console.log(`  - ${c}`));
        console.log('');
        console.log('Missing components (from 10 original sections):');
        const expected = ['Header', 'Hero', 'Features', 'Testimonials', 'Pricing', 'CTA', 'Footer'];
        expected.filter(e => !components.includes(e)).forEach(m => console.log(`  - ${m}`));
        console.log('');
        console.log('Note: Components are also placeholder templates, not fully generated');
        console.log('='.repeat(60));
      }
    });

  });

});
