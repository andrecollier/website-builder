/**
 * React Components Exporter Module
 *
 * This module exports standalone React components with design tokens and configuration.
 * Ideal for integrating generated components into existing React/Next.js projects.
 *
 * Exported bundle includes:
 * - React .tsx component files with TypeScript types
 * - tailwind.config.js with extracted design tokens
 * - design-tokens.json with full DesignSystem data
 * - package.json with minimal peer dependencies
 * - README.md with integration instructions
 * - types.ts with shared TypeScript interfaces
 *
 * Usage: Import components into any React project with Tailwind CSS configured.
 *
 * Coordinates with:
 * - tailwind-generator: For generating Tailwind config
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
  generateTailwindConfigString,
  type TailwindGeneratorConfig,
} from '@/lib/design-system/tailwind-generator';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Phase of the components export process
 */
export type ComponentsExportPhase =
  | 'initializing'
  | 'loading_data'
  | 'creating_structure'
  | 'writing_components'
  | 'generating_config'
  | 'writing_tokens'
  | 'writing_readme'
  | 'complete';

/**
 * Progress update for the export process
 */
export interface ComponentsExportProgress {
  phase: ComponentsExportPhase;
  percent: number;
  message: string;
  currentFile?: string;
  totalFiles?: number;
}

/**
 * Options for components export
 */
export interface ComponentsExportOptions {
  /** Website ID to export */
  websiteId: string;
  /** Version ID (defaults to active version) */
  versionId?: string;
  /** Design system tokens */
  designSystem?: DesignSystem;
  /** Output directory (defaults to exports/{websiteId}/components) */
  outputDir?: string;
  /** Include types.ts file (default: true) */
  includeTypes?: boolean;
  /** Include README.md with instructions (default: true) */
  includeReadme?: boolean;
  /** Include package.json (default: true) */
  includePackageJson?: boolean;
  /** Custom package name (defaults to website name) */
  packageName?: string;
  /** Callback for progress updates */
  onProgress?: (progress: ComponentsExportProgress) => void;
}

/**
 * Result of components export
 */
export interface ComponentsExportResult {
  success: boolean;
  websiteId: string;
  outputPath: string;
  files: {
    components: string[];
    configs: string[];
    docs: string[];
  };
  metadata: {
    exportedAt: string;
    totalFiles: number;
    totalComponents: number;
    totalSize: number;
  };
  errors: ExportError[];
}

/**
 * Error during export
 */
export interface ExportError {
  phase: ComponentsExportPhase;
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
 * Ensure directory exists (create if needed)
 */
function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Sanitize filename to be filesystem-safe
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Convert component name to PascalCase for React component
 */
function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Calculate directory size in bytes
 */
function calculateDirectorySize(dirPath: string): number {
  let totalSize = 0;

  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        totalSize += calculateDirectorySize(filePath);
      } else {
        totalSize += fs.statSync(filePath).size;
      }
    }
  } catch {
    // Ignore errors
  }

  return totalSize;
}

/**
 * Create progress emitter helper
 */
function createProgressEmitter(onProgress?: (progress: ComponentsExportProgress) => void) {
  return (
    phase: ComponentsExportPhase,
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

// ====================
// FILE GENERATORS
// ====================

/**
 * Generate package.json content
 */
function generatePackageJson(projectName: string, websiteName: string): string {
  const sanitizedName = sanitizeFilename(projectName || websiteName);

  return JSON.stringify({
    name: `@${sanitizedName}/components`,
    version: '1.0.0',
    description: `React components extracted from ${websiteName}`,
    main: 'index.ts',
    type: 'module',
    scripts: {
      typecheck: 'tsc --noEmit',
    },
    peerDependencies: {
      react: '^18.0.0',
      'react-dom': '^18.0.0',
      tailwindcss: '^3.4.0',
    },
    devDependencies: {
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      typescript: '^5.3.0',
    },
    keywords: [
      'react',
      'components',
      'tailwindcss',
      'typescript',
    ],
  }, null, 2);
}

/**
 * Generate README.md content
 */
function generateReadme(websiteName: string, components: ComponentRecord[]): string {
  const componentList = components
    .map((c) => `- **${toPascalCase(c.name)}** - ${c.type} component`)
    .join('\n');

  return `# ${websiteName} - React Components

This package contains React components extracted from ${websiteName}.

## Installation

1. Copy this directory into your React/Next.js project
2. Install peer dependencies:

\`\`\`bash
npm install react react-dom tailwindcss
\`\`\`

3. Configure Tailwind CSS to use the included \`tailwind.config.js\`

## Usage

Import components into your React application:

\`\`\`tsx
import { Hero, Features, Footer } from './components';

export default function Page() {
  return (
    <>
      <Hero />
      <Features />
      <Footer />
    </>
  );
}
\`\`\`

## Available Components

${componentList}

## Tailwind Configuration

The included \`tailwind.config.js\` contains all design tokens (colors, typography, spacing).

Merge it with your existing Tailwind config:

\`\`\`javascript
// tailwind.config.js
import componentsConfig from './components/tailwind.config.js';

export default {
  ...componentsConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
};
\`\`\`

## Design Tokens

The \`design-tokens.json\` file contains the complete design system extracted from the source website:

- Color palettes
- Typography scales
- Spacing system
- Effects (shadows, borders, transitions)

You can use these tokens programmatically in your application.

## TypeScript Support

All components include TypeScript type definitions. The \`types.ts\` file contains shared interfaces.

## Customization

Components use Tailwind CSS utility classes. You can customize them by:

1. Editing the Tailwind config
2. Modifying component classes directly
3. Using the \`className\` prop to override styles

## License

Generated with Website Cooker - https://github.com/your-org/website-cooker

Components extracted from: ${websiteName}
`;
}

/**
 * Generate types.ts file with shared interfaces
 */
function generateTypesFile(): string {
  return `/**
 * Shared TypeScript types for components
 */

export interface BaseComponentProps {
  /** Optional className for custom styling */
  className?: string;
}

export interface ButtonProps extends BaseComponentProps {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Child content */
  children: React.ReactNode;
}

export interface LinkProps extends BaseComponentProps {
  /** Link destination */
  href: string;
  /** Link target */
  target?: '_blank' | '_self';
  /** Rel attribute */
  rel?: string;
  /** Child content */
  children: React.ReactNode;
}

export interface ImageProps extends BaseComponentProps {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Image width */
  width?: number;
  /** Image height */
  height?: number;
  /** Loading strategy */
  loading?: 'lazy' | 'eager';
}
`;
}

/**
 * Generate index.ts barrel export
 */
function generateIndexFile(components: ComponentRecord[]): string {
  const exports = components
    .map((c) => {
      const componentName = toPascalCase(c.name);
      const filename = sanitizeFilename(c.name);
      return `export { ${componentName} } from './${filename}';`;
    })
    .join('\n');

  return `/**
 * Component exports
 * Generated from ${components.length} components
 */

${exports}

export type { BaseComponentProps, ButtonProps, LinkProps, ImageProps } from './types';
`;
}

/**
 * Generate component .tsx file
 */
function generateComponentFile(
  component: ComponentRecord,
  variant: VariantRecord
): string {
  const componentName = toPascalCase(component.name);
  const code = variant.custom_code || variant.code;

  // Extract imports and code
  const lines = code.split('\n');
  const imports: string[] = [];
  const codeLines: string[] = [];
  let inImports = true;

  for (const line of lines) {
    if (inImports && (line.startsWith('import ') || line.startsWith('from ') || line.trim() === '')) {
      if (line.trim() !== '') imports.push(line);
    } else {
      inImports = false;
      codeLines.push(line);
    }
  }

  // Clean up the code
  let cleanCode = codeLines.join('\n').trim();

  // If code already has 'use client' directive, keep it
  const hasUseClient = cleanCode.startsWith("'use client'") || cleanCode.startsWith('"use client"');

  return `'use client';

import type { BaseComponentProps } from './types';
${imports.length > 0 ? '\n' + imports.join('\n') : ''}

export interface ${componentName}Props extends BaseComponentProps {
  // Add custom props here
}

${cleanCode}

export default ${componentName};
`;
}

// ====================
// MAIN EXPORT FUNCTION
// ====================

/**
 * Export React components with design tokens and configuration
 *
 * @param options - Export configuration
 * @returns Export result with file paths and metadata
 */
export async function exportComponents(
  options: ComponentsExportOptions
): Promise<ComponentsExportResult> {
  const {
    websiteId,
    versionId,
    designSystem,
    outputDir,
    includeTypes = true,
    includeReadme = true,
    includePackageJson = true,
    packageName,
    onProgress,
  } = options;

  const emit = createProgressEmitter(onProgress);
  const errors: ExportError[] = [];
  const files: ComponentsExportResult['files'] = {
    components: [],
    configs: [],
    docs: [],
  };

  try {
    // Phase 1: Initialize
    emit('initializing', 0, 'Initializing components export...');

    const db = getDb();
    const website = getWebsiteById(websiteId);
    if (!website) {
      throw new Error(`Website not found: ${websiteId}`);
    }

    const baseDir = outputDir || path.join(getExportsBaseDir(), websiteId, 'components');
    ensureDirectory(baseDir);

    // Phase 2: Load data
    emit('loading_data', 10, 'Loading components and design tokens...');

    // Load approved components
    const components = db
      .prepare(
        `SELECT * FROM components
         WHERE website_id = ?
         AND status = 'approved'
         ORDER BY "order" ASC`
      )
      .all(websiteId) as ComponentRecord[];

    if (components.length === 0) {
      throw new Error('No approved components found for export');
    }

    // Load design system if not provided
    let tokens = designSystem;
    if (!tokens) {
      const tokensRow = db
        .prepare('SELECT design_system FROM websites WHERE id = ?')
        .get(websiteId) as { design_system: string } | undefined;

      if (tokensRow?.design_system) {
        tokens = JSON.parse(tokensRow.design_system) as DesignSystem;
      }
    }

    if (!tokens) {
      errors.push({
        phase: 'loading_data',
        message: 'Design tokens not found, using defaults',
        recoverable: true,
      });
    }

    // Phase 3: Create structure
    emit('creating_structure', 20, 'Creating directory structure...');

    const componentsDir = path.join(baseDir, 'components');
    ensureDirectory(componentsDir);

    // Phase 4: Write components
    emit('writing_components', 30, `Writing ${components.length} components...`);

    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      const componentName = toPascalCase(component.name);
      const filename = sanitizeFilename(component.name);

      emit(
        'writing_components',
        30 + (40 * (i / components.length)),
        `Writing ${componentName}...`,
        { current: `${filename}.tsx`, total: components.length }
      );

      try {
        // Get approved variant
        const variant = db
          .prepare(
            `SELECT * FROM variants
             WHERE component_id = ?
             AND (id = ? OR selected = 1)
             LIMIT 1`
          )
          .get(component.id, component.selected_variant_id) as VariantRecord | undefined;

        if (!variant) {
          throw new Error(`No approved variant found for ${component.name}`);
        }

        // Generate component file
        const componentCode = generateComponentFile(component, variant);
        const componentPath = path.join(componentsDir, `${filename}.tsx`);
        fs.writeFileSync(componentPath, componentCode, 'utf-8');
        files.components.push(componentPath);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({
          phase: 'writing_components',
          file: `${filename}.tsx`,
          message: `Failed to write component: ${message}`,
          recoverable: true,
        });
      }
    }

    // Phase 5: Generate configuration files
    emit('generating_config', 70, 'Generating Tailwind configuration...');

    // Write tailwind.config.js
    if (tokens) {
      try {
        const tailwindConfig = generateTailwindConfigString(tokens, {
          includeDarkMode: true,
          darkModeStrategy: 'class',
          contentPaths: ['./**/*.{js,ts,jsx,tsx}'],
          includeFullPalettes: true,
          includePlugins: true,
        } as TailwindGeneratorConfig);

        const configPath = path.join(baseDir, 'tailwind.config.js');
        fs.writeFileSync(configPath, tailwindConfig, 'utf-8');
        files.configs.push(configPath);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({
          phase: 'generating_config',
          file: 'tailwind.config.js',
          message: `Failed to generate Tailwind config: ${message}`,
          recoverable: true,
        });
      }
    }

    // Phase 6: Write design tokens
    emit('writing_tokens', 80, 'Writing design tokens...');

    if (tokens) {
      try {
        const tokensPath = path.join(baseDir, 'design-tokens.json');
        fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2), 'utf-8');
        files.configs.push(tokensPath);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({
          phase: 'writing_tokens',
          file: 'design-tokens.json',
          message: `Failed to write design tokens: ${message}`,
          recoverable: true,
        });
      }
    }

    // Write types.ts
    if (includeTypes) {
      try {
        const typesPath = path.join(componentsDir, 'types.ts');
        fs.writeFileSync(typesPath, generateTypesFile(), 'utf-8');
        files.components.push(typesPath);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({
          phase: 'writing_tokens',
          file: 'types.ts',
          message: `Failed to write types file: ${message}`,
          recoverable: true,
        });
      }
    }

    // Write index.ts
    try {
      const indexPath = path.join(componentsDir, 'index.ts');
      fs.writeFileSync(indexPath, generateIndexFile(components), 'utf-8');
      files.components.push(indexPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({
        phase: 'writing_tokens',
        file: 'index.ts',
        message: `Failed to write index file: ${message}`,
        recoverable: true,
      });
    }

    // Write package.json
    if (includePackageJson) {
      try {
        const packageJsonPath = path.join(baseDir, 'package.json');
        fs.writeFileSync(
          packageJsonPath,
          generatePackageJson(packageName || website.name, website.name),
          'utf-8'
        );
        files.configs.push(packageJsonPath);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({
          phase: 'generating_config',
          file: 'package.json',
          message: `Failed to write package.json: ${message}`,
          recoverable: true,
        });
      }
    }

    // Phase 7: Write README
    if (includeReadme) {
      emit('writing_readme', 90, 'Writing README.md...');

      try {
        const readmePath = path.join(baseDir, 'README.md');
        fs.writeFileSync(readmePath, generateReadme(website.name, components), 'utf-8');
        files.docs.push(readmePath);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({
          phase: 'writing_readme',
          file: 'README.md',
          message: `Failed to write README: ${message}`,
          recoverable: true,
        });
      }
    }

    // Phase 8: Complete
    emit('complete', 100, 'Components export complete!');

    const totalSize = calculateDirectorySize(baseDir);

    return {
      success: true,
      websiteId,
      outputPath: baseDir,
      files,
      metadata: {
        exportedAt: new Date().toISOString(),
        totalFiles: files.components.length + files.configs.length + files.docs.length,
        totalComponents: components.length,
        totalSize,
      },
      errors,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push({
      phase: 'initializing',
      message: `Export failed: ${message}`,
      recoverable: false,
    });

    return {
      success: false,
      websiteId,
      outputPath: '',
      files,
      metadata: {
        exportedAt: new Date().toISOString(),
        totalFiles: 0,
        totalComponents: 0,
        totalSize: 0,
      },
      errors,
    };
  }
}

// ====================
// HELPER FUNCTIONS
// ====================

/**
 * Get export summary for pre-export validation
 *
 * @param websiteId - Website ID to check
 * @returns Summary of what will be exported
 */
export function getExportSummary(websiteId: string): {
  ready: boolean;
  componentCount: number;
  hasDesignTokens: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const db = getDb();

  // Check website exists
  const website = getWebsiteById(websiteId);
  if (!website) {
    issues.push('Website not found');
    return { ready: false, componentCount: 0, hasDesignTokens: false, issues };
  }

  // Count approved components
  const componentCount = db
    .prepare('SELECT COUNT(*) as count FROM components WHERE website_id = ? AND status = ?')
    .get(websiteId, 'approved') as { count: number };

  if (componentCount.count === 0) {
    issues.push('No approved components found');
  }

  // Check design tokens
  const tokensRow = db
    .prepare('SELECT design_system FROM websites WHERE id = ?')
    .get(websiteId) as { design_system: string | null } | undefined;

  const hasDesignTokens = !!(tokensRow?.design_system);
  if (!hasDesignTokens) {
    issues.push('Design tokens not found');
  }

  return {
    ready: issues.length === 0,
    componentCount: componentCount.count,
    hasDesignTokens,
    issues,
  };
}

/**
 * Check if website is ready for component export
 *
 * @param websiteId - Website ID to check
 * @returns True if ready for export
 */
export function isExportReady(websiteId: string): boolean {
  const summary = getExportSummary(websiteId);
  return summary.ready;
}
