/**
 * Phase 5: Screenshot Capture Diagnostic Script
 *
 * This script diagnoses why screenshot capture fails for sections 2-10.
 * It captures the actual state of the generated site and compares with metadata.
 *
 * Run: npx ts-node tests/phase5/diagnose-capture.ts
 * Or: npx tsx tests/phase5/diagnose-capture.ts
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const WEBSITE_ID = 'website-58f08468-e52f-47b2-a853-423fd8938e5a';
const WEBSITES_DIR = path.join(process.cwd(), 'Websites');
const GENERATED_SITE_URL = 'http://localhost:3003'; // Port for generated site

interface DiagnosticReport {
  timestamp: string;
  websiteId: string;
  originalMetadata: {
    fullPageHeight: number;
    sectionCount: number;
    sections: Array<{
      type: string;
      y: number;
      height: number;
    }>;
  };
  generatedSite: {
    reachable: boolean;
    actualPageHeight: number;
    components: string[];
    componentPositions: Array<{
      name: string;
      y: number;
      height: number;
    }>;
  };
  issues: string[];
  recommendations: string[];
}

async function diagnose(): Promise<DiagnosticReport> {
  const report: DiagnosticReport = {
    timestamp: new Date().toISOString(),
    websiteId: WEBSITE_ID,
    originalMetadata: {
      fullPageHeight: 0,
      sectionCount: 0,
      sections: [],
    },
    generatedSite: {
      reachable: false,
      actualPageHeight: 0,
      components: [],
      componentPositions: [],
    },
    issues: [],
    recommendations: [],
  };

  console.log('='.repeat(60));
  console.log('Phase 5 Screenshot Capture Diagnostic');
  console.log('='.repeat(60));
  console.log('');

  // Step 1: Load original metadata
  console.log('[1/4] Loading original metadata...');
  const metadataPath = path.join(WEBSITES_DIR, WEBSITE_ID, 'reference', 'metadata.json');

  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    report.originalMetadata.fullPageHeight = metadata.fullPageHeight;
    report.originalMetadata.sectionCount = metadata.sections.length;
    report.originalMetadata.sections = metadata.sections.map((s: any) => ({
      type: s.type,
      y: s.boundingBox.y,
      height: s.boundingBox.height,
    }));

    console.log(`   Original page height: ${metadata.fullPageHeight}px`);
    console.log(`   Sections: ${metadata.sections.length}`);
  } else {
    report.issues.push('Metadata file not found');
    console.log('   ERROR: Metadata file not found');
  }

  // Step 2: Check generated site components
  console.log('');
  console.log('[2/4] Checking generated components...');
  const componentsDir = path.join(WEBSITES_DIR, WEBSITE_ID, 'generated', 'src', 'components');

  if (fs.existsSync(componentsDir)) {
    const components = fs.readdirSync(componentsDir).filter((f) =>
      fs.statSync(path.join(componentsDir, f)).isDirectory()
    );
    report.generatedSite.components = components;
    console.log(`   Found ${components.length} components: ${components.join(', ')}`);

    if (components.length < report.originalMetadata.sectionCount) {
      report.issues.push(
        `Only ${components.length} components generated vs ${report.originalMetadata.sectionCount} original sections`
      );
    }
  } else {
    report.issues.push('Components directory not found');
    console.log('   ERROR: Components directory not found');
  }

  // Step 3: Check generated site page.tsx order
  console.log('');
  console.log('[3/4] Checking page.tsx component order...');
  const pagePath = path.join(WEBSITES_DIR, WEBSITE_ID, 'generated', 'src', 'app', 'page.tsx');

  if (fs.existsSync(pagePath)) {
    const pageContent = fs.readFileSync(pagePath, 'utf-8');
    console.log('   Page content:');
    console.log('   ' + '-'.repeat(40));

    // Extract component usage
    const componentMatches = pageContent.match(/<(\w+)\s*\/>/g) || [];
    componentMatches.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c}`);
    });

    // Check if Header is first
    if (componentMatches.length > 0 && !componentMatches[0].includes('Header')) {
      report.issues.push('Header is not the first component - page order is wrong');
    }
  }

  // Step 4: Try to reach generated site and measure
  console.log('');
  console.log('[4/4] Checking generated site...');

  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    // Try to connect to generated site
    try {
      await page.goto(GENERATED_SITE_URL, {
        waitUntil: 'networkidle',
        timeout: 10000,
      });
      report.generatedSite.reachable = true;

      // Get actual page height
      const pageHeight = await page.evaluate(() => {
        return Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        );
      });
      report.generatedSite.actualPageHeight = pageHeight;

      console.log(`   Generated site reachable at ${GENERATED_SITE_URL}`);
      console.log(`   Actual page height: ${pageHeight}px`);

      // Try to find component positions
      const positions = await page.evaluate(() => {
        const components: Array<{ name: string; y: number; height: number }> = [];
        const mainChildren = document.querySelector('main')?.children || [];

        Array.from(mainChildren).forEach((el, i) => {
          const rect = el.getBoundingClientRect();
          const scrollY = window.scrollY;
          components.push({
            name: el.tagName.toLowerCase() + '-' + i,
            y: rect.top + scrollY,
            height: rect.height,
          });
        });

        return components;
      });

      report.generatedSite.componentPositions = positions;
      positions.forEach((p) => {
        console.log(`   Component at y=${p.y}, height=${p.height}`);
      });

      // Take a full page screenshot for reference
      const outputDir = path.join(process.cwd(), 'test-results', 'diagnostic');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      await page.screenshot({
        path: path.join(outputDir, 'generated-site-full.png'),
        fullPage: true,
      });
      console.log(`   Full page screenshot saved to test-results/diagnostic/`);

    } catch (error) {
      report.generatedSite.reachable = false;
      report.issues.push(`Cannot reach generated site at ${GENERATED_SITE_URL}`);
      console.log(`   ERROR: Cannot reach generated site at ${GENERATED_SITE_URL}`);
      console.log(`   Make sure to start it: cd Websites/${WEBSITE_ID}/generated && npm run dev`);
    }

  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Generate recommendations
  console.log('');
  console.log('='.repeat(60));
  console.log('DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));
  console.log('');

  console.log('Issues Found:');
  if (report.issues.length === 0) {
    console.log('  None');
  } else {
    report.issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  }

  // Add recommendations
  if (report.originalMetadata.fullPageHeight > report.generatedSite.actualPageHeight * 2) {
    report.recommendations.push(
      'Generated page is much shorter than original. Screenshot capture needs to use actual DOM positions instead of metadata bounding boxes.'
    );
  }

  if (report.generatedSite.components.length < report.originalMetadata.sectionCount) {
    report.recommendations.push(
      'Not all sections have corresponding components. Component generation (Phase 4) needs improvement.'
    );
  }

  report.recommendations.push(
    'Add data-section="header" etc. attributes to generated components for reliable element targeting.'
  );
  report.recommendations.push(
    'Modify compare-section.ts to find elements by selector instead of using metadata Y positions.'
  );

  console.log('');
  console.log('Recommendations:');
  report.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });

  // Save report
  const reportPath = path.join(process.cwd(), 'test-results', 'diagnostic', 'report.json');
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('');
  console.log(`Full report saved to: ${reportPath}`);

  return report;
}

// Run diagnostic
diagnose().catch(console.error);
