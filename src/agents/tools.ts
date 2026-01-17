/**
 * Custom MCP Tools for Website Cooker Agents
 *
 * These tools give agents access to website-specific functionality
 * like reading comparison reports, modifying components, etc.
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const WEBSITES_DIR = process.env.WEBSITES_DIR || path.join(process.cwd(), 'Websites');

/**
 * Get comparison report for a website
 */
const getComparisonReport = tool(
  'get_comparison_report',
  'Get the visual comparison report for a website, showing accuracy scores for each section',
  {
    websiteId: z.string().describe('The website ID to get the comparison report for'),
  },
  async ({ websiteId }) => {
    const reportPath = path.join(WEBSITES_DIR, websiteId, 'comparison', 'report.json');

    if (!fs.existsSync(reportPath)) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: 'No comparison report found. Run comparison first.' }) }],
      };
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(report, null, 2) }],
    };
  }
);

/**
 * Get list of components for a website
 */
const listComponents = tool(
  'list_components',
  'List all generated components for a website with their file paths',
  {
    websiteId: z.string().describe('The website ID'),
  },
  async ({ websiteId }) => {
    const componentsDir = path.join(WEBSITES_DIR, websiteId, 'generated', 'src', 'components');

    if (!fs.existsSync(componentsDir)) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: 'No components directory found' }) }],
      };
    }

    const components = fs.readdirSync(componentsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => ({
        name: d.name,
        path: path.join(componentsDir, d.name),
        files: fs.readdirSync(path.join(componentsDir, d.name)),
      }));

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(components, null, 2) }],
    };
  }
);

/**
 * Get component source code
 */
const getComponentSource = tool(
  'get_component_source',
  'Get the source code of a specific component',
  {
    websiteId: z.string().describe('The website ID'),
    componentName: z.string().describe('The component name (e.g., "Header", "Hero")'),
  },
  async ({ websiteId, componentName }) => {
    const componentPath = path.join(
      WEBSITES_DIR, websiteId, 'generated', 'src', 'components',
      componentName, `${componentName}.tsx`
    );

    if (!fs.existsSync(componentPath)) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: `Component not found: ${componentName}` }) }],
      };
    }

    const source = fs.readFileSync(componentPath, 'utf-8');
    return {
      content: [{ type: 'text' as const, text: source }],
    };
  }
);

/**
 * Get reference screenshot path
 */
const getReferenceScreenshot = tool(
  'get_reference_screenshot',
  'Get the path to a reference screenshot for visual comparison',
  {
    websiteId: z.string().describe('The website ID'),
    sectionName: z.string().describe('The section name (e.g., "01-header", "02-hero")'),
  },
  async ({ websiteId, sectionName }) => {
    const screenshotPath = path.join(
      WEBSITES_DIR, websiteId, 'reference', 'sections', `${sectionName}.png`
    );

    if (!fs.existsSync(screenshotPath)) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: `Screenshot not found: ${sectionName}` }) }],
      };
    }

    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ path: screenshotPath }) }],
    };
  }
);

/**
 * Get diff image path
 */
const getDiffImage = tool(
  'get_diff_image',
  'Get the path to a diff image showing visual differences',
  {
    websiteId: z.string().describe('The website ID'),
    sectionName: z.string().describe('The section name'),
  },
  async ({ websiteId, sectionName }) => {
    const diffPath = path.join(
      WEBSITES_DIR, websiteId, 'comparison', 'diffs', `${sectionName}-diff.png`
    );

    if (!fs.existsSync(diffPath)) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: `Diff image not found: ${sectionName}` }) }],
      };
    }

    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ path: diffPath }) }],
    };
  }
);

/**
 * Get extracted CSS for a website
 */
const getExtractedCSS = tool(
  'get_extracted_css',
  'Get the extracted Framer CSS styles for a website',
  {
    websiteId: z.string().describe('The website ID'),
  },
  async ({ websiteId }) => {
    const cssPath = path.join(WEBSITES_DIR, websiteId, 'framer-styles.css');

    if (!fs.existsSync(cssPath)) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: 'No Framer CSS found' }) }],
      };
    }

    const css = fs.readFileSync(cssPath, 'utf-8');
    return {
      content: [{ type: 'text' as const, text: css }],
    };
  }
);

/**
 * List all websites
 */
const listWebsites = tool(
  'list_websites',
  'List all websites in the Websites directory',
  {},
  async () => {
    if (!fs.existsSync(WEBSITES_DIR)) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Websites directory not found' }) }],
      };
    }

    const websites = fs.readdirSync(WEBSITES_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name.startsWith('website-'))
      .map(d => {
        const metadataPath = path.join(WEBSITES_DIR, d.name, 'reference', 'metadata.json');
        let metadata = null;
        if (fs.existsSync(metadataPath)) {
          try {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          } catch {
            // Ignore parse errors
          }
        }
        return {
          id: d.name,
          url: metadata?.url || 'Unknown',
          sectionsCount: metadata?.sections?.length || 0,
        };
      });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(websites, null, 2) }],
    };
  }
);

/**
 * Create the MCP server with all website cooker tools
 */
export function createWebsiteCookerMcpServer() {
  return createSdkMcpServer({
    name: 'website-cooker-tools',
    version: '1.0.0',
    tools: [
      getComparisonReport,
      listComponents,
      getComponentSource,
      getReferenceScreenshot,
      getDiffImage,
      getExtractedCSS,
      listWebsites,
    ],
  });
}
