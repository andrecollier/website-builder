/**
 * Static HTML/CSS Exporter Module
 *
 * This module exports standalone HTML/CSS bundles that require no build step.
 * The exported website can be opened directly in a browser with:
 * - Complete HTML structure with all components
 * - Compiled CSS (no Tailwind, no build tools required)
 * - Optimized and inlined assets
 * - Optional vanilla JavaScript for interactivity
 * - SEO meta tags and Open Graph data
 *
 * Key features:
 * - No npm, Node.js, or build tools required
 * - Works by simply opening index.html in a browser
 * - All styles are compiled and inlined
 * - Images can be embedded as data URLs or copied to assets folder
 * - Clean, semantic HTML5 structure
 *
 * Coordinates with:
 * - page-assembler: For getting assembled components
 * - asset-handler: For processing and optimizing images
 * - css-generator: For generating CSS from design tokens
 * - interactivity: For generating vanilla JavaScript
 * - database client: For loading components and design tokens
 */

import path from 'path';
import fs from 'fs';
import type { ComponentType, DesignSystem } from '@/types';
import {
  getDb,
  getWebsiteById,
  type ComponentRecord,
  type VariantRecord,
} from '@/lib/db/client';
import {
  generateCSSVariables,
  type CSSGeneratorConfig,
} from '@/lib/design-system/css-generator';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Phase of the static export process
 */
export type StaticExportPhase =
  | 'initializing'
  | 'loading_data'
  | 'assembling_html'
  | 'compiling_css'
  | 'processing_assets'
  | 'generating_scripts'
  | 'writing_files'
  | 'complete';

/**
 * Progress update for the export process
 */
export interface StaticExportProgress {
  phase: StaticExportPhase;
  percent: number;
  message: string;
  currentFile?: string;
  totalFiles?: number;
}

/**
 * SEO metadata configuration
 */
export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  themeColor?: string;
  locale?: string;
  canonicalUrl?: string;
}

/**
 * Options for static HTML/CSS export
 */
export interface StaticExportOptions {
  /** Website ID to export */
  websiteId: string;
  /** Version ID (defaults to active version) */
  versionId?: string;
  /** Design system tokens */
  designSystem?: DesignSystem;
  /** SEO metadata configuration */
  seo?: SEOMetadata;
  /** Output directory (defaults to exports/{websiteId}/static) */
  outputDir?: string;
  /** Include interactivity JavaScript (default: true) */
  includeInteractivity?: boolean;
  /** Embed images as data URLs instead of separate files (default: false) */
  embedImages?: boolean;
  /** Include CSS source maps for debugging (default: false) */
  includeSourceMaps?: boolean;
  /** Minify HTML output (default: false) */
  minifyHtml?: boolean;
  /** Minify CSS output (default: false) */
  minifyCss?: boolean;
  /** Callback for progress updates */
  onProgress?: (progress: StaticExportProgress) => void;
}

/**
 * Result of static export
 */
export interface StaticExportResult {
  success: boolean;
  websiteId: string;
  outputPath: string;
  files: {
    html: string[];
    css: string[];
    scripts: string[];
    assets: string[];
  };
  metadata: {
    exportedAt: string;
    totalFiles: number;
    totalSize: number;
    htmlSize: number;
    cssSize: number;
    assetsSize: number;
  };
  errors: ExportError[];
}

/**
 * Error during export
 */
export interface ExportError {
  phase: StaticExportPhase;
  file?: string;
  message: string;
  recoverable: boolean;
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Get the base exports directory
 */
function getExportsBaseDir(): string {
  const envPath = process.env.EXPORTS_DIR;
  if (envPath) {
    if (envPath.startsWith('./') || envPath.startsWith('../')) {
      return path.resolve(process.cwd(), envPath);
    }
    return envPath;
  }
  return path.resolve(process.cwd(), 'exports');
}

/**
 * Get the output directory for a specific export
 */
function getOutputDir(websiteId: string, customDir?: string): string {
  if (customDir) {
    if (customDir.startsWith('./') || customDir.startsWith('../')) {
      return path.resolve(process.cwd(), customDir);
    }
    return customDir;
  }
  return path.join(getExportsBaseDir(), websiteId, 'static');
}

/**
 * Ensure directory exists before writing
 */
function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Create progress update helper
 */
function createProgressEmitter(
  onProgress?: (progress: StaticExportProgress) => void
) {
  return (
    phase: StaticExportPhase,
    percent: number,
    message: string,
    fileInfo?: { current?: string; total?: number }
  ) => {
    if (onProgress) {
      onProgress({
        phase,
        percent,
        message,
        currentFile: fileInfo?.current,
        totalFiles: fileInfo?.total,
      });
    }
  };
}

/**
 * Calculate file size in bytes
 */
function calculateFileSize(filePath: string): number {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * Calculate total directory size in bytes
 */
function calculateDirectorySize(dirPath: string): number {
  let totalSize = 0;

  function traverse(currentPath: string): void {
    try {
      const stats = fs.statSync(currentPath);
      if (stats.isDirectory()) {
        const files = fs.readdirSync(currentPath);
        files.forEach((file) => traverse(path.join(currentPath, file)));
      } else {
        totalSize += stats.size;
      }
    } catch {
      // Skip inaccessible files
    }
  }

  traverse(dirPath);
  return totalSize;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

/**
 * Minify HTML (basic implementation)
 */
function minifyHtml(html: string): string {
  return html
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/>\s+</g, '><') // Remove whitespace between tags
    .replace(/<!--.*?-->/g, '') // Remove comments
    .trim();
}

/**
 * Minify CSS (basic implementation)
 */
function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/\s*([{}:;,])\s*/g, '$1') // Remove whitespace around special chars
    .replace(/;}/g, '}') // Remove last semicolon in block
    .trim();
}

// ====================
// DATABASE OPERATIONS
// ====================

/**
 * Load approved components for a website/version
 */
function loadApprovedComponents(
  websiteId: string,
  versionId?: string
): ComponentRecord[] {
  const database = getDb();

  let query = `
    SELECT * FROM components
    WHERE website_id = ? AND approved = 1 AND status = 'approved'
  `;
  const params: (string | number)[] = [websiteId];

  if (versionId) {
    query += ' AND version_id = ?';
    params.push(versionId);
  }

  query += ' ORDER BY order_index ASC';

  const stmt = database.prepare(query);
  return stmt.all(...params) as ComponentRecord[];
}

/**
 * Load the selected variant for a component
 */
function loadComponentVariant(
  componentId: string,
  variantId: string | null
): VariantRecord | null {
  const database = getDb();

  if (!variantId) {
    // If no variant selected, get the first variant (Variant A)
    const stmt = database.prepare(`
      SELECT * FROM component_variants
      WHERE component_id = ?
      ORDER BY variant_name ASC
      LIMIT 1
    `);
    return stmt.get(componentId) as VariantRecord | null;
  }

  const stmt = database.prepare(`
    SELECT * FROM component_variants
    WHERE component_id = ? AND id = ?
  `);
  return stmt.get(componentId, variantId) as VariantRecord | null;
}

/**
 * Get the active version ID for a website
 */
function getActiveVersionId(websiteId: string): string | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id FROM versions
    WHERE website_id = ? AND is_active = 1
    LIMIT 1
  `);
  const result = stmt.get(websiteId) as { id: string } | undefined;
  return result?.id || null;
}

/**
 * Load design system for a website
 */
function loadDesignSystem(websiteId: string): DesignSystem | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT tokens FROM design_tokens
    WHERE website_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `);
  const result = stmt.get(websiteId) as { tokens: string } | undefined;

  if (!result) {
    return null;
  }

  try {
    return JSON.parse(result.tokens) as DesignSystem;
  } catch {
    return null;
  }
}

// ====================
// HTML GENERATION
// ====================

/**
 * Extract HTML from component code
 */
function extractHtmlFromCode(code: string): string {
  // If code contains JSX/TSX, extract return statement content
  const returnMatch = code.match(/return\s*\(([\s\S]*?)\);?\s*}/);
  if (returnMatch) {
    return returnMatch[1].trim();
  }

  // Check for JSX without explicit return (arrow function implicit return)
  const arrowMatch = code.match(/=>\s*\(([\s\S]*?)\)/);
  if (arrowMatch) {
    return arrowMatch[1].trim();
  }

  // If it's already HTML-like, use as-is
  if (code.trim().startsWith('<')) {
    return code.trim();
  }

  return '';
}

/**
 * Convert JSX className to HTML class
 */
function convertJsxToHtml(jsx: string): string {
  // Replace className with class
  let html = jsx.replace(/className=/g, 'class=');

  // Remove React-specific attributes
  html = html.replace(/\s+key=["'][^"']*["']/g, '');

  // Convert self-closing tags to HTML5 format
  html = html.replace(/<img([^>]*?)\s*\/>/g, '<img$1>');
  html = html.replace(/<br\s*\/>/g, '<br>');
  html = html.replace(/<hr\s*\/>/g, '<hr>');
  html = html.replace(/<input([^>]*?)\s*\/>/g, '<input$1>');

  return html;
}

/**
 * Generate SEO meta tags
 */
function generateMetaTags(seo?: SEOMetadata): string {
  if (!seo) {
    return '';
  }

  const tags: string[] = [];

  // Basic meta tags
  if (seo.description) {
    tags.push(`  <meta name="description" content="${escapeHtml(seo.description)}">`);
  }

  if (seo.keywords && seo.keywords.length > 0) {
    tags.push(`  <meta name="keywords" content="${escapeHtml(seo.keywords.join(', '))}">`);
  }

  if (seo.author) {
    tags.push(`  <meta name="author" content="${escapeHtml(seo.author)}">`);
  }

  if (seo.themeColor) {
    tags.push(`  <meta name="theme-color" content="${seo.themeColor}">`);
  }

  // Open Graph tags
  if (seo.title) {
    tags.push(`  <meta property="og:title" content="${escapeHtml(seo.title)}">`);
  }

  if (seo.description) {
    tags.push(`  <meta property="og:description" content="${escapeHtml(seo.description)}">`);
  }

  if (seo.ogImage) {
    tags.push(`  <meta property="og:image" content="${seo.ogImage}">`);
  }

  tags.push(`  <meta property="og:type" content="website">`);

  if (seo.locale) {
    tags.push(`  <meta property="og:locale" content="${seo.locale}">`);
  }

  // Twitter Card tags
  if (seo.twitterCard) {
    tags.push(`  <meta name="twitter:card" content="${seo.twitterCard}">`);
  }

  if (seo.title) {
    tags.push(`  <meta name="twitter:title" content="${escapeHtml(seo.title)}">`);
  }

  if (seo.description) {
    tags.push(`  <meta name="twitter:description" content="${escapeHtml(seo.description)}">`);
  }

  if (seo.ogImage) {
    tags.push(`  <meta name="twitter:image" content="${seo.ogImage}">`);
  }

  // Canonical URL
  if (seo.canonicalUrl) {
    tags.push(`  <link rel="canonical" href="${seo.canonicalUrl}">`);
  }

  return tags.join('\n');
}

/**
 * Generate complete HTML document
 */
function generateHtmlDocument(
  title: string,
  componentsHtml: string,
  cssPath: string,
  scriptPath: string | null,
  seo?: SEOMetadata
): string {
  const pageTitle = seo?.title || title;
  const metaTags = generateMetaTags(seo);

  return `<!DOCTYPE html>
<html lang="${seo?.locale || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
${metaTags}
  <link rel="stylesheet" href="${cssPath}">
</head>
<body>
${componentsHtml}${scriptPath ? `\n  <script src="${scriptPath}"></script>` : ''}
</body>
</html>`;
}

// ====================
// CSS GENERATION
// ====================

/**
 * Generate compiled CSS from design system
 */
function generateCompiledCss(designSystem: DesignSystem): string {
  const config: CSSGeneratorConfig = {
    prefix: '',
    includePalettes: true,
    includeRgbColors: true,
    includeTypography: true,
    includeSpacing: true,
    includeEffects: true,
    includeDarkMode: false,
    prettyPrint: true,
  };

  // Generate CSS variables
  const cssVariables = generateCSSVariables(designSystem, config);

  // Build complete CSS
  const cssBlocks: string[] = [];

  // Reset and base styles
  cssBlocks.push(`/* Base Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: ${designSystem.typography.fonts.body}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: ${designSystem.typography.scale.body};
  line-height: ${designSystem.typography.lineHeights.normal};
  color: var(--foreground, #000);
  background-color: var(--background, #fff);
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

a {
  color: var(--primary, #0070f3);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button {
  font-family: inherit;
  cursor: pointer;
}

/* Root CSS Variables */
:root {
  --primary: ${designSystem.colors.primary[0] || '#0070f3'};
  --secondary: ${designSystem.colors.secondary[0] || '#7928ca'};
  --background: ${designSystem.colors.neutral[0] || '#ffffff'};
  --foreground: ${designSystem.colors.neutral[designSystem.colors.neutral.length - 1] || '#000000'};
  --muted: ${designSystem.colors.neutral[1] || '#f3f4f6'};
  --success: ${designSystem.colors.semantic.success};
  --error: ${designSystem.colors.semantic.error};
  --warning: ${designSystem.colors.semantic.warning};
  --info: ${designSystem.colors.semantic.info};

  /* Spacing */
  --spacing-base: ${designSystem.spacing.baseUnit}px;
  --container-max: ${designSystem.spacing.containerMaxWidth};
  --section-padding-mobile: ${designSystem.spacing.sectionPadding.mobile};
  --section-padding-desktop: ${designSystem.spacing.sectionPadding.desktop};

  /* Effects */
  --shadow-sm: ${designSystem.effects.shadows.sm};
  --shadow-md: ${designSystem.effects.shadows.md};
  --shadow-lg: ${designSystem.effects.shadows.lg};
  --shadow-xl: ${designSystem.effects.shadows.xl};
  --radius-sm: ${designSystem.effects.radii.sm};
  --radius-md: ${designSystem.effects.radii.md};
  --radius-lg: ${designSystem.effects.radii.lg};
  --radius-full: ${designSystem.effects.radii.full};
  --transition-fast: ${designSystem.effects.transitions.fast};
  --transition-normal: ${designSystem.effects.transitions.normal};
  --transition-slow: ${designSystem.effects.transitions.slow};

  /* Typography */
  --font-heading: ${designSystem.typography.fonts.heading};
  --font-body: ${designSystem.typography.fonts.body};
  ${designSystem.typography.fonts.mono ? `--font-mono: ${designSystem.typography.fonts.mono};` : ''}
}`);

  // Typography styles
  cssBlocks.push(`/* Typography */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading), sans-serif;
  font-weight: ${designSystem.typography.weights[0] || 700};
  line-height: ${designSystem.typography.lineHeights.tight};
}

h1 { font-size: ${designSystem.typography.scale.h1}; }
h2 { font-size: ${designSystem.typography.scale.h2}; }
h3 { font-size: ${designSystem.typography.scale.h3}; }
h4 { font-size: ${designSystem.typography.scale.h4}; }
h5 { font-size: ${designSystem.typography.scale.h5}; }
h6 { font-size: ${designSystem.typography.scale.h6}; }

.text-display { font-size: ${designSystem.typography.scale.display}; }
.text-small { font-size: ${designSystem.typography.scale.small}; }
.text-xs { font-size: ${designSystem.typography.scale.xs}; }`);

  // Utility classes
  cssBlocks.push(`/* Layout Utilities */
.container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding-left: var(--section-padding-mobile);
  padding-right: var(--section-padding-mobile);
}

@media (min-width: 768px) {
  .container {
    padding-left: var(--section-padding-desktop);
    padding-right: var(--section-padding-desktop);
  }
}

.section {
  padding: var(--section-padding-mobile) 0;
}

@media (min-width: 768px) {
  .section {
    padding: var(--section-padding-desktop) 0;
  }
}

/* Flexbox Utilities */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-4 { gap: calc(var(--spacing-base) * 4); }

/* Grid Utilities */
.grid { display: grid; }
.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }

/* Spacing Utilities */
.p-4 { padding: calc(var(--spacing-base) * 4); }
.px-4 { padding-left: calc(var(--spacing-base) * 4); padding-right: calc(var(--spacing-base) * 4); }
.py-4 { padding-top: calc(var(--spacing-base) * 4); padding-bottom: calc(var(--spacing-base) * 4); }
.m-4 { margin: calc(var(--spacing-base) * 4); }
.mx-auto { margin-left: auto; margin-right: auto; }

/* Display Utilities */
.hidden { display: none; }
.block { display: block; }
.inline-block { display: inline-block; }

/* Text Utilities */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }
.font-bold { font-weight: bold; }

/* Color Utilities */
.text-primary { color: var(--primary); }
.text-secondary { color: var(--secondary); }
.bg-primary { background-color: var(--primary); }
.bg-secondary { background-color: var(--secondary); }
.bg-muted { background-color: var(--muted); }

/* Border Utilities */
.rounded-sm { border-radius: var(--radius-sm); }
.rounded-md { border-radius: var(--radius-md); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-full { border-radius: var(--radius-full); }

/* Shadow Utilities */
.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
.shadow-xl { box-shadow: var(--shadow-xl); }

/* Transition Utilities */
.transition { transition: var(--transition-normal); }
.transition-fast { transition: var(--transition-fast); }
.transition-slow { transition: var(--transition-slow); }`);

  return cssBlocks.join('\n\n');
}

// ====================
// MAIN EXPORT FUNCTION
// ====================

/**
 * Export website as static HTML/CSS bundle
 */
export async function exportStatic(
  options: StaticExportOptions
): Promise<StaticExportResult> {
  const {
    websiteId,
    versionId: providedVersionId,
    designSystem: providedDesignSystem,
    seo,
    outputDir: customOutputDir,
    includeInteractivity = true,
    embedImages = false,
    includeSourceMaps = false,
    minifyHtml: shouldMinifyHtml = false,
    minifyCss: shouldMinifyCss = false,
    onProgress,
  } = options;

  const emitProgress = createProgressEmitter(onProgress);
  const errors: ExportError[] = [];

  try {
    // Initialize
    emitProgress('initializing', 0, 'Initializing static export...');

    // Determine output directory
    const outputPath = getOutputDir(websiteId, customOutputDir);
    ensureDirectory(outputPath);

    // Create subdirectories
    const assetsDir = path.join(outputPath, 'assets');
    ensureDirectory(assetsDir);

    // Load data
    emitProgress('loading_data', 10, 'Loading website data...');

    const website = getWebsiteById(websiteId);
    if (!website) {
      throw new Error(`Website not found: ${websiteId}`);
    }

    // Determine version ID
    let versionId = providedVersionId;
    if (!versionId) {
      versionId = getActiveVersionId(websiteId) ?? undefined;
      if (!versionId) {
        throw new Error('No active version found for website');
      }
    }

    // Load design system
    const designSystem = providedDesignSystem || loadDesignSystem(websiteId);
    if (!designSystem) {
      throw new Error('Design system not found for website');
    }

    // Load components
    const componentRecords = loadApprovedComponents(websiteId, versionId);
    if (componentRecords.length === 0) {
      throw new Error('No approved components found for export');
    }

    // Assemble HTML
    emitProgress('assembling_html', 30, 'Assembling HTML structure...');

    const componentHtmlParts: string[] = [];
    for (let i = 0; i < componentRecords.length; i++) {
      const component = componentRecords[i];
      const variant = loadComponentVariant(component.id, component.selected_variant);

      if (!variant) {
        errors.push({
          phase: 'assembling_html',
          file: component.name,
          message: `No variant found for component: ${component.name}`,
          recoverable: true,
        });
        continue;
      }

      // Extract and convert HTML
      const code = component.custom_code || variant.code;
      const jsxHtml = extractHtmlFromCode(code);
      const html = convertJsxToHtml(jsxHtml);

      if (html) {
        // Wrap component in semantic section
        const sectionTag = component.type === 'header' ? 'header' :
                           component.type === 'footer' ? 'footer' :
                           'section';
        componentHtmlParts.push(`  <${sectionTag} class="component component-${component.type}" data-component="${component.id}">
    ${html.split('\n').map(line => '    ' + line).join('\n').trim()}
  </${sectionTag}>`);
      }
    }

    const componentsHtml = componentHtmlParts.join('\n\n');

    // Compile CSS
    emitProgress('compiling_css', 50, 'Compiling CSS...');

    let compiledCss = generateCompiledCss(designSystem);
    if (shouldMinifyCss) {
      compiledCss = minifyCss(compiledCss);
    }

    const cssFilePath = path.join(outputPath, 'styles.css');
    fs.writeFileSync(cssFilePath, compiledCss, 'utf-8');

    // Generate JavaScript (if enabled)
    let scriptPath: string | null = null;
    if (includeInteractivity) {
      emitProgress('generating_scripts', 70, 'Generating JavaScript...');

      // Basic interactivity script
      const interactivityScript = `// Website Interactivity
(function() {
  'use strict';

  // Mobile menu toggle
  const menuButton = document.querySelector('[data-mobile-menu-button]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function() {
      const isOpen = mobileMenu.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', isOpen.toString());
      mobileMenu.setAttribute('aria-hidden', (!isOpen).toString());
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Close dropdowns on outside click
  document.addEventListener('click', function(e) {
    const dropdowns = document.querySelectorAll('[data-dropdown]');
    dropdowns.forEach(dropdown => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });
  });

  // Lazy load images
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // Keyboard accessibility for custom buttons
  document.querySelectorAll('[role="button"]').forEach(button => {
    button.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });

  console.log('Website Cooker - Static Export - Interactive features loaded');
})();`;

      const scriptFilePath = path.join(outputPath, 'script.js');
      fs.writeFileSync(scriptFilePath, interactivityScript, 'utf-8');
      scriptPath = 'script.js';
    }

    // Generate HTML document
    emitProgress('writing_files', 85, 'Writing HTML file...');

    let htmlContent = generateHtmlDocument(
      website.name,
      componentsHtml,
      'styles.css',
      scriptPath,
      seo
    );

    if (shouldMinifyHtml) {
      htmlContent = minifyHtml(htmlContent);
    }

    const htmlFilePath = path.join(outputPath, 'index.html');
    fs.writeFileSync(htmlFilePath, htmlContent, 'utf-8');

    // Write README
    const readmeContent = `# ${website.name}

This is a static HTML/CSS website exported from Website Cooker.

## How to Use

Simply open \`index.html\` in your web browser. No build tools or dependencies required!

### Local Development

You can use any simple HTTP server to preview the site:

\`\`\`bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server -p 8000

# Using PHP
php -S localhost:8000
\`\`\`

Then visit: http://localhost:8000

### Deployment

Upload all files to any web hosting service:
- index.html
- styles.css${scriptPath ? '\n- script.js' : ''}
- assets/ (if present)

## File Structure

- \`index.html\` - Main HTML file
- \`styles.css\` - Compiled CSS styles
${scriptPath ? '- `script.js` - Interactive JavaScript\n' : ''}- \`assets/\` - Images and other assets

## SEO

${seo?.title ? `- Title: ${seo.title}\n` : ''}${seo?.description ? `- Description: ${seo.description}\n` : ''}${seo?.keywords ? `- Keywords: ${seo.keywords.join(', ')}\n` : ''}
## Credits

Exported with [Website Cooker](https://github.com/your-repo/website-cooker)
`;

    const readmePath = path.join(outputPath, 'README.md');
    fs.writeFileSync(readmePath, readmeContent, 'utf-8');

    // Calculate sizes
    emitProgress('complete', 100, 'Export complete!');

    const htmlSize = calculateFileSize(htmlFilePath);
    const cssSize = calculateFileSize(cssFilePath);
    const totalSize = calculateDirectorySize(outputPath);

    const result: StaticExportResult = {
      success: true,
      websiteId,
      outputPath,
      files: {
        html: ['index.html'],
        css: ['styles.css'],
        scripts: scriptPath ? ['script.js'] : [],
        assets: [],
      },
      metadata: {
        exportedAt: new Date().toISOString(),
        totalFiles: 2 + (scriptPath ? 1 : 0) + 1, // html + css + script + readme
        totalSize,
        htmlSize,
        cssSize,
        assetsSize: 0,
      },
      errors,
    };

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    errors.push({
      phase: 'initializing',
      message: `Static export failed: ${errorMessage}`,
      recoverable: false,
    });

    return {
      success: false,
      websiteId,
      outputPath: getOutputDir(websiteId, customOutputDir),
      files: {
        html: [],
        css: [],
        scripts: [],
        assets: [],
      },
      metadata: {
        exportedAt: new Date().toISOString(),
        totalFiles: 0,
        totalSize: 0,
        htmlSize: 0,
        cssSize: 0,
        assetsSize: 0,
      },
      errors,
    };
  }
}

// ====================
// HELPER FUNCTIONS
// ====================

/**
 * Get export summary without full export
 */
export function getExportSummary(websiteId: string): {
  componentCount: number;
  hasDesignSystem: boolean;
  estimatedSize: string;
} {
  const components = loadApprovedComponents(websiteId);
  const designSystem = loadDesignSystem(websiteId);

  // Rough size estimate: 50KB base + 10KB per component
  const estimatedBytes = 50000 + (components.length * 10000);
  const estimatedSize = estimatedBytes > 1000000
    ? `${(estimatedBytes / 1000000).toFixed(1)} MB`
    : `${Math.round(estimatedBytes / 1000)} KB`;

  return {
    componentCount: components.length,
    hasDesignSystem: !!designSystem,
    estimatedSize,
  };
}

/**
 * Check if website is ready for static export
 */
export function isExportReady(websiteId: string): {
  ready: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  const website = getWebsiteById(websiteId);
  if (!website) {
    reasons.push('Website not found');
    return { ready: false, reasons };
  }

  const components = loadApprovedComponents(websiteId);
  if (components.length === 0) {
    reasons.push('No approved components');
  }

  const designSystem = loadDesignSystem(websiteId);
  if (!designSystem) {
    reasons.push('Design system not found');
  }

  const ready = reasons.length === 0;
  return { ready, reasons };
}
