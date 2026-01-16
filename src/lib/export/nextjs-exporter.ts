/**
 * Next.js Project Exporter Module
 *
 * This module exports complete, production-ready Next.js 14 projects with:
 * - Full App Router structure (app directory, layouts, pages)
 * - Package.json with all necessary dependencies
 * - Tailwind CSS configuration with extracted design tokens
 * - TypeScript configuration with path aliases
 * - PostCSS and Next.js configuration files
 * - Component directory structure with approved variants
 * - Public assets directory with optimized images
 * - README.md with setup and deployment instructions
 * - SEO metadata and Open Graph configuration
 *
 * The exported project can be run immediately with:
 * npm install && npm run dev
 *
 * Coordinates with:
 * - page-assembler: For getting assembled components
 * - asset-handler: For processing and copying assets
 * - tailwind-generator: For generating Tailwind config
 * - database client: For loading components and design tokens
 */

import path from 'path';
import fs from 'fs';
import type { ComponentType, DesignSystem } from '@/types';
import {
  getDb,
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
 * Phase of the Next.js export process
 */
export type NextJSExportPhase =
  | 'initializing'
  | 'loading_data'
  | 'creating_structure'
  | 'generating_configs'
  | 'writing_components'
  | 'copying_assets'
  | 'generating_pages'
  | 'writing_readme'
  | 'complete';

/**
 * Progress update for the export process
 */
export interface NextJSExportProgress {
  phase: NextJSExportPhase;
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
}

/**
 * Options for Next.js export
 */
export interface NextJSExportOptions {
  /** Website ID to export */
  websiteId: string;
  /** Version ID (defaults to active version) */
  versionId?: string;
  /** Design system tokens */
  designSystem?: DesignSystem;
  /** SEO metadata configuration */
  seo?: SEOMetadata;
  /** Custom project name (defaults to website name) */
  projectName?: string;
  /** Output directory (defaults to exports/{websiteId}/nextjs) */
  outputDir?: string;
  /** Include TypeScript (default: true) */
  useTypeScript?: boolean;
  /** Include ESLint config (default: true) */
  includeESLint?: boolean;
  /** Include example .env file (default: true) */
  includeEnvExample?: boolean;
  /** Custom port for dev server (default: 3000) */
  devPort?: number;
  /** Callback for progress updates */
  onProgress?: (progress: NextJSExportProgress) => void;
}

/**
 * Result of Next.js export
 */
export interface NextJSExportResult {
  success: boolean;
  websiteId: string;
  projectName: string;
  outputPath: string;
  files: {
    configs: string[];
    components: string[];
    pages: string[];
    assets: string[];
  };
  metadata: {
    exportedAt: string;
    totalFiles: number;
    totalSize: number;
  };
  errors: ExportError[];
}

/**
 * Error during export
 */
export interface ExportError {
  phase: NextJSExportPhase;
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
  return path.join(getExportsBaseDir(), websiteId, 'nextjs');
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
  onProgress?: (progress: NextJSExportProgress) => void
) {
  return (
    phase: NextJSExportPhase,
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
 * Sanitize project name for package.json
 */
function sanitizeProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Get component display name from type
 */
function getComponentDisplayName(type: ComponentType): string {
  const names: Record<ComponentType, string> = {
    header: 'Header',
    hero: 'Hero',
    features: 'Features',
    testimonials: 'Testimonials',
    pricing: 'Pricing',
    cta: 'CTA',
    footer: 'Footer',
    cards: 'Cards',
    gallery: 'Gallery',
    contact: 'Contact',
    faq: 'FAQ',
    stats: 'Stats',
    team: 'Team',
    logos: 'Logos',
  };
  return names[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Calculate total directory size in bytes
 */
function calculateDirectorySize(dirPath: string): number {
  let totalSize = 0;

  function traverse(currentPath: string): void {
    const stats = fs.statSync(currentPath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach((file) => traverse(path.join(currentPath, file)));
    } else {
      totalSize += stats.size;
    }
  }

  traverse(dirPath);
  return totalSize;
}

// ====================
// CONFIG FILE GENERATORS
// ====================

/**
 * Generate package.json content
 */
function generatePackageJson(
  projectName: string,
  devPort: number = 3000
): string {
  const sanitizedName = sanitizeProjectName(projectName);
  const pkg = {
    name: sanitizedName,
    version: '1.0.0',
    private: true,
    scripts: {
      dev: `next dev${devPort !== 3000 ? ` -p ${devPort}` : ''}`,
      build: 'next build',
      start: `next start${devPort !== 3000 ? ` -p ${devPort}` : ''}`,
      lint: 'next lint',
    },
    dependencies: {
      next: '14.2.21',
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    },
    devDependencies: {
      '@types/node': '^20',
      '@types/react': '^18',
      '@types/react-dom': '^18',
      autoprefixer: '^10.4.20',
      postcss: '^8.5.3',
      tailwindcss: '^3.4.17',
      typescript: '^5',
      eslint: '^8',
      'eslint-config-next': '14.2.21',
    },
  };

  return JSON.stringify(pkg, null, 2) + '\n';
}

/**
 * Generate next.config.js content
 */
function generateNextConfig(): string {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [],
  },
};

module.exports = nextConfig;
`;
}

/**
 * Generate tsconfig.json content
 */
function generateTsConfig(): string {
  const config = {
    compilerOptions: {
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [
        {
          name: 'next',
        },
      ],
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  };

  return JSON.stringify(config, null, 2) + '\n';
}

/**
 * Generate postcss.config.js content
 */
function generatePostCSSConfig(): string {
  return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
}

/**
 * Generate .eslintrc.json content
 */
function generateESLintConfig(): string {
  const config = {
    extends: 'next/core-web-vitals',
  };

  return JSON.stringify(config, null, 2) + '\n';
}

/**
 * Generate .gitignore content
 */
function generateGitIgnore(): string {
  return `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;
}

/**
 * Generate .env.example content
 */
function generateEnvExample(): string {
  return `# Environment Variables
# Copy this file to .env.local and fill in your values

# Example API endpoints
# NEXT_PUBLIC_API_URL=https://api.example.com

# Example feature flags
# NEXT_PUBLIC_ENABLE_ANALYTICS=false
`;
}

// ====================
// APP ROUTER FILE GENERATORS
// ====================

/**
 * Generate globals.css content
 */
function generateGlobalCSS(designSystem?: DesignSystem): string {
  let css = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;

  // Add CSS custom properties for design tokens
  if (designSystem) {
    css += `
:root {
  /* Colors */
`;
    if (designSystem.colors.primary[0]) {
      const primary = designSystem.colors.primary[0];
      const rgb = hexToRgb(primary);
      css += `  --primary: ${rgb};\n`;
    }

    if (designSystem.colors.neutral[0]) {
      const background = designSystem.colors.neutral[0];
      const rgb = hexToRgb(background);
      css += `  --background: ${rgb};\n`;
    }

    if (designSystem.colors.neutral[designSystem.colors.neutral.length - 1]) {
      const foreground =
        designSystem.colors.neutral[designSystem.colors.neutral.length - 1];
      const rgb = hexToRgb(foreground);
      css += `  --foreground: ${rgb};\n`;
    }

    css += `}
`;
  }

  return css;
}

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0 0';
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `${r} ${g} ${b}`;
}

/**
 * Generate layout.tsx content
 */
function generateLayout(seo?: SEOMetadata): string {
  const title = seo?.title || 'My Website';
  const description = seo?.description || 'Generated by Website Cooker';

  return `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '${title}',
  description: '${description}',${
    seo?.keywords
      ? `\n  keywords: ${JSON.stringify(seo.keywords)},`
      : ''
  }${
    seo?.author
      ? `\n  authors: [{ name: '${seo.author}' }],`
      : ''
  }${
    seo?.themeColor
      ? `\n  themeColor: '${seo.themeColor}',`
      : ''
  }
  openGraph: {
    title: '${title}',
    description: '${description}',${
    seo?.ogImage
      ? `\n    images: ['${seo.ogImage}'],`
      : ''
  }${
    seo?.locale
      ? `\n    locale: '${seo.locale}',`
      : ''
  }
  },
  twitter: {
    card: '${seo?.twitterCard || 'summary_large_image'}',
    title: '${title}',
    description: '${description}',${
    seo?.ogImage
      ? `\n    images: ['${seo.ogImage}'],`
      : ''
  }
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="${seo?.locale || 'en'}">
      <body>{children}</body>
    </html>
  );
}
`;
}

/**
 * Generate page.tsx content with imported components
 */
function generatePage(components: ComponentRecord[]): string {
  const sortedComponents = [...components].sort(
    (a, b) => a.order_index - b.order_index
  );

  // Generate imports
  const imports = sortedComponents
    .map((comp) => {
      const displayName = getComponentDisplayName(comp.type);
      return `import { ${displayName} } from '@/components/${displayName}';`;
    })
    .join('\n');

  // Generate component usage
  const componentUsage = sortedComponents
    .map((comp) => {
      const displayName = getComponentDisplayName(comp.type);
      return `      <${displayName} />`;
    })
    .join('\n');

  return `${imports}

export default function Home() {
  return (
    <main>
${componentUsage}
    </main>
  );
}
`;
}

// ====================
// COMPONENT FILE GENERATORS
// ====================

/**
 * Generate component index.ts file
 */
function generateComponentIndex(componentName: string): string {
  return `export { default as ${componentName}, ${componentName} } from './${componentName}';
export type { ${componentName}Props } from './${componentName}';
`;
}

/**
 * Generate main component file that exports the selected variant
 */
function generateComponentFile(
  componentName: string,
  selectedVariantCode: string
): string {
  // The variant code is already complete TSX, just need to wrap it
  return selectedVariantCode;
}

// ====================
// README GENERATOR
// ====================

/**
 * Generate comprehensive README.md
 */
function generateReadme(
  projectName: string,
  devPort: number,
  seo?: SEOMetadata
): string {
  return `# ${projectName}

This is a [Next.js](https://nextjs.org/) project generated by [Website Cooker](https://github.com/yourusername/website-cooker).

## Getting Started

First, install the dependencies:

\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

Then, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:${devPort}](http://localhost:${devPort}) with your browser to see the result.

## Project Structure

\`\`\`
.
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx      # Root layout with metadata
│   │   ├── page.tsx        # Home page
│   │   └── globals.css     # Global styles
│   └── components/         # React components
│       └── [Component]/    # Each component has its own directory
├── public/                 # Static assets
├── package.json           # Dependencies and scripts
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
\`\`\`

## Customization

### Styling

This project uses [Tailwind CSS](https://tailwindcss.com/). The design system has been extracted from the reference website and configured in \`tailwind.config.js\`.

You can customize the design tokens by editing:
- \`tailwind.config.js\` - Color palette, fonts, spacing, etc.
- \`src/app/globals.css\` - Global CSS and custom properties

### Components

All components are located in \`src/components/\`. Each component is a self-contained React component that you can:
- Modify the styling
- Add props and interactivity
- Extend with additional features

### SEO

SEO metadata is configured in \`src/app/layout.tsx\`. Current settings:
- **Title:** ${seo?.title || 'My Website'}
- **Description:** ${seo?.description || 'Generated by Website Cooker'}${
  seo?.keywords
    ? `\n- **Keywords:** ${seo.keywords.join(', ')}`
    : ''
}

You can update these values to match your needs.

## Deployment

### Vercel (Recommended)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

1. Push your code to GitHub
2. Import your repository on Vercel
3. Vercel will automatically detect Next.js and configure the build
4. Deploy!

### Other Platforms

This project can be deployed to any platform that supports Next.js:
- [Netlify](https://docs.netlify.com/frameworks/next-js/)
- [AWS Amplify](https://aws.amazon.com/amplify/)
- [Digital Ocean App Platform](https://www.digitalocean.com/products/app-platform)
- [Railway](https://railway.app/)

## Learn More

To learn more about Next.js and the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - Interactive Next.js tutorial
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Learn about Tailwind CSS
- [React Documentation](https://react.dev/) - Learn about React

## Support

If you have questions or need help:
- Check the [Next.js documentation](https://nextjs.org/docs)
- Visit the [Next.js GitHub repository](https://github.com/vercel/next.js/)
- Join the [Next.js Discord](https://discord.gg/nextjs)

---

Generated by **Website Cooker** on ${new Date().toISOString()}
`;
}

// ====================
// MAIN EXPORT FUNCTION
// ====================

/**
 * Export a complete Next.js 14 project with App Router
 *
 * Creates a production-ready Next.js project that can be run immediately
 * with npm install && npm run dev
 */
export async function exportNextJS(
  options: NextJSExportOptions
): Promise<NextJSExportResult> {
  const emit = createProgressEmitter(options.onProgress);
  const errors: ExportError[] = [];
  const files = {
    configs: [] as string[],
    components: [] as string[],
    pages: [] as string[],
    assets: [] as string[],
  };

  try {
    // Phase 1: Initialize
    emit('initializing', 0, 'Initializing Next.js export...');

    const outputDir = getOutputDir(options.websiteId, options.outputDir);
    const useTypeScript = options.useTypeScript !== false;
    const includeESLint = options.includeESLint !== false;
    const includeEnvExample = options.includeEnvExample !== false;
    const devPort = options.devPort || 3000;

    // Phase 2: Load data from database
    emit('loading_data', 10, 'Loading components and design tokens...');

    const database = getDb();

    // Get website info
    const website = database
      .prepare('SELECT * FROM websites WHERE id = ?')
      .get(options.websiteId) as { name: string } | undefined;

    if (!website) {
      throw new Error(`Website not found: ${options.websiteId}`);
    }

    const projectName = options.projectName || website.name;

    // Get active version
    let versionId = options.versionId;
    if (!versionId) {
      const activeVersion = database
        .prepare(
          'SELECT id FROM versions WHERE website_id = ? AND is_active = 1'
        )
        .get(options.websiteId) as { id: string } | undefined;
      versionId = activeVersion?.id;
    }

    if (!versionId) {
      throw new Error('No active version found for website');
    }

    // Get approved components
    const components = database
      .prepare(
        `SELECT * FROM components
         WHERE website_id = ? AND version_id = ? AND approved = 1
         ORDER BY order_index ASC`
      )
      .all(options.websiteId, versionId) as ComponentRecord[];

    if (components.length === 0) {
      throw new Error('No approved components found for export');
    }

    // Get design system
    let designSystem = options.designSystem;
    if (!designSystem) {
      const tokensRow = database
        .prepare('SELECT tokens_json FROM design_tokens WHERE website_id = ?')
        .get(options.websiteId) as { tokens_json: string } | undefined;

      if (tokensRow) {
        designSystem = JSON.parse(tokensRow.tokens_json) as DesignSystem;
      }
    }

    // Phase 3: Create directory structure
    emit('creating_structure', 20, 'Creating project directory structure...');

    ensureDirectory(outputDir);
    ensureDirectory(path.join(outputDir, 'src'));
    ensureDirectory(path.join(outputDir, 'src', 'app'));
    ensureDirectory(path.join(outputDir, 'src', 'components'));
    ensureDirectory(path.join(outputDir, 'public'));

    // Phase 4: Generate configuration files
    emit('generating_configs', 30, 'Generating configuration files...');

    // package.json
    const packageJsonPath = path.join(outputDir, 'package.json');
    fs.writeFileSync(packageJsonPath, generatePackageJson(projectName, devPort));
    files.configs.push(packageJsonPath);

    // next.config.js
    const nextConfigPath = path.join(outputDir, 'next.config.js');
    fs.writeFileSync(nextConfigPath, generateNextConfig());
    files.configs.push(nextConfigPath);

    // tsconfig.json
    if (useTypeScript) {
      const tsConfigPath = path.join(outputDir, 'tsconfig.json');
      fs.writeFileSync(tsConfigPath, generateTsConfig());
      files.configs.push(tsConfigPath);
    }

    // postcss.config.js
    const postcssConfigPath = path.join(outputDir, 'postcss.config.js');
    fs.writeFileSync(postcssConfigPath, generatePostCSSConfig());
    files.configs.push(postcssConfigPath);

    // tailwind.config.js
    if (designSystem) {
      const tailwindConfigPath = path.join(outputDir, 'tailwind.config.js');
      const tailwindConfig = generateTailwindConfigString(designSystem, {
        contentPaths: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
        includeDarkMode: true,
        includeFullPalettes: true,
      } as TailwindGeneratorConfig);
      fs.writeFileSync(tailwindConfigPath, tailwindConfig);
      files.configs.push(tailwindConfigPath);
    }

    // .eslintrc.json
    if (includeESLint) {
      const eslintConfigPath = path.join(outputDir, '.eslintrc.json');
      fs.writeFileSync(eslintConfigPath, generateESLintConfig());
      files.configs.push(eslintConfigPath);
    }

    // .gitignore
    const gitignorePath = path.join(outputDir, '.gitignore');
    fs.writeFileSync(gitignorePath, generateGitIgnore());
    files.configs.push(gitignorePath);

    // .env.example
    if (includeEnvExample) {
      const envExamplePath = path.join(outputDir, '.env.example');
      fs.writeFileSync(envExamplePath, generateEnvExample());
      files.configs.push(envExamplePath);
    }

    // Phase 5: Write components
    emit('writing_components', 50, 'Writing component files...');

    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      const componentName = getComponentDisplayName(component.type);

      emit(
        'writing_components',
        50 + (i / components.length) * 20,
        `Writing ${componentName} component...`,
        { current: componentName, total: components.length }
      );

      // Get selected variant
      const variantId =
        component.custom_code && component.custom_code.trim()
          ? null
          : component.selected_variant;

      let componentCode: string;

      if (component.custom_code && component.custom_code.trim()) {
        // Use custom code
        componentCode = component.custom_code;
      } else if (variantId) {
        // Get variant code
        const variant = database
          .prepare('SELECT * FROM component_variants WHERE id = ?')
          .get(variantId) as VariantRecord | undefined;

        if (!variant) {
          errors.push({
            phase: 'writing_components',
            file: componentName,
            message: `Variant not found: ${variantId}`,
            recoverable: true,
          });
          continue;
        }

        componentCode = variant.code;
      } else {
        errors.push({
          phase: 'writing_components',
          file: componentName,
          message: `No variant selected for ${componentName}`,
          recoverable: true,
        });
        continue;
      }

      // Create component directory
      const componentDir = path.join(outputDir, 'src', 'components', componentName);
      ensureDirectory(componentDir);

      // Write main component file
      const ext = useTypeScript ? 'tsx' : 'jsx';
      const componentFilePath = path.join(
        componentDir,
        `${componentName}.${ext}`
      );
      fs.writeFileSync(componentFilePath, generateComponentFile(componentName, componentCode));
      files.components.push(componentFilePath);

      // Write component index
      const indexFilePath = path.join(componentDir, `index.ts`);
      fs.writeFileSync(indexFilePath, generateComponentIndex(componentName));
      files.components.push(indexFilePath);
    }

    // Phase 6: Copy assets (placeholder for now)
    emit('copying_assets', 70, 'Copying assets to public directory...');
    // Assets will be handled by asset-handler in future integration

    // Phase 7: Generate pages
    emit('generating_pages', 80, 'Generating app router pages...');

    // globals.css
    const globalsCSSPath = path.join(outputDir, 'src', 'app', 'globals.css');
    fs.writeFileSync(globalsCSSPath, generateGlobalCSS(designSystem));
    files.pages.push(globalsCSSPath);

    // layout.tsx
    const ext = useTypeScript ? 'tsx' : 'jsx';
    const layoutPath = path.join(outputDir, 'src', 'app', `layout.${ext}`);
    fs.writeFileSync(layoutPath, generateLayout(options.seo));
    files.pages.push(layoutPath);

    // page.tsx
    const pagePath = path.join(outputDir, 'src', 'app', `page.${ext}`);
    fs.writeFileSync(pagePath, generatePage(components));
    files.pages.push(pagePath);

    // Phase 8: Write README
    emit('writing_readme', 90, 'Generating README.md...');

    const readmePath = path.join(outputDir, 'README.md');
    fs.writeFileSync(readmePath, generateReadme(projectName, devPort, options.seo));
    files.configs.push(readmePath);

    // Phase 9: Complete
    emit('complete', 100, 'Next.js project export complete!');

    const totalFiles =
      files.configs.length +
      files.components.length +
      files.pages.length +
      files.assets.length;

    const totalSize = calculateDirectorySize(outputDir);

    return {
      success: true,
      websiteId: options.websiteId,
      projectName,
      outputPath: outputDir,
      files,
      metadata: {
        exportedAt: new Date().toISOString(),
        totalFiles,
        totalSize,
      },
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push({
      phase: 'initializing',
      message: errorMessage,
      recoverable: false,
    });

    return {
      success: false,
      websiteId: options.websiteId,
      projectName: options.projectName || 'unknown',
      outputPath: '',
      files,
      metadata: {
        exportedAt: new Date().toISOString(),
        totalFiles: 0,
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
 * Get a summary of the export result
 */
export function getExportSummary(result: NextJSExportResult): string {
  if (!result.success) {
    return `Export failed: ${result.errors.map((e) => e.message).join(', ')}`;
  }

  return `Successfully exported Next.js project "${result.projectName}" with ${
    result.metadata.totalFiles
  } files (${formatBytes(result.metadata.totalSize)})`;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if the export is ready to run
 */
export function isExportReady(outputPath: string): boolean {
  try {
    const packageJsonPath = path.join(outputPath, 'package.json');
    const nextConfigPath = path.join(outputPath, 'next.config.js');
    const appDirPath = path.join(outputPath, 'src', 'app');

    return (
      fs.existsSync(packageJsonPath) &&
      fs.existsSync(nextConfigPath) &&
      fs.existsSync(appDirPath)
    );
  } catch {
    return false;
  }
}
