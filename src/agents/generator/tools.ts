/**
 * Generator Agent Tools Module
 *
 * Tool functions for the generator agent to create React component code
 * from detected page sections. Provides tools for generating base components
 * and creating multiple code variants with different optimization strategies.
 *
 * These tools wrap the component-generator and variant-generator modules
 * and provide a consistent tool interface for use by the generator agent.
 */

import type {
  DetectedComponent,
  ComponentVariant,
  DesignSystem,
} from '@/types';
import {
  generateVariantsWithMetadata,
  componentTypeToName,
  type VariantGenerationResult,
} from '@/lib/generator/variant-generator';
import type {
  GenerateComponentToolInput,
  GenerateComponentToolOutput,
  GenerateVariantsToolInput,
  GenerateVariantsToolOutput,
} from '../types';
import path from 'path';
import fs from 'fs';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Tool execution context
 * Provides access to shared state and metadata
 */
export interface ToolContext {
  websiteId: string;
  versionId: string;
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Get the base directory for website outputs
 */
function getWebsitesBaseDir(): string {
  const envPath = process.env.WEBSITES_DIR;
  if (envPath) {
    if (envPath.startsWith('./') || envPath.startsWith('../')) {
      return path.resolve(process.cwd(), envPath);
    }
    return envPath;
  }
  return path.resolve(process.cwd(), 'Websites');
}

/**
 * Get the components directory path for a website
 */
function getComponentsDir(websiteId: string): string {
  return path.join(getWebsitesBaseDir(), websiteId, 'current', 'src', 'components');
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
 * Save component variant to filesystem
 */
function saveVariantFile(
  websiteId: string,
  componentName: string,
  variant: ComponentVariant,
  isMainVariant: boolean = false
): string {
  const componentsDir = getComponentsDir(websiteId);
  const componentDir = path.join(componentsDir, componentName);
  const variantsDir = path.join(componentDir, 'variants');

  ensureDirectory(componentDir);
  ensureDirectory(variantsDir);

  // Save variant file
  const variantFileName = `${variant.name.toLowerCase().replace(' ', '-')}.tsx`;
  const variantPath = path.join(variantsDir, variantFileName);
  fs.writeFileSync(variantPath, variant.code, 'utf-8');

  // If this is the main variant, also save as the default component
  if (isMainVariant) {
    const mainComponentPath = path.join(componentDir, `${componentName}.tsx`);
    fs.writeFileSync(mainComponentPath, variant.code, 'utf-8');

    // Create index.ts export file
    const indexContent = `export { default as ${componentName} } from './${componentName}';
export type { ${componentName}Props } from './${componentName}';
`;
    const indexPath = path.join(componentDir, 'index.ts');
    fs.writeFileSync(indexPath, indexContent, 'utf-8');
  }

  return variantPath;
}

// ====================
// GENERATE COMPONENT TOOL
// ====================

/**
 * Generate Component Tool
 *
 * Generates a React component from a detected page section.
 * Creates a base component with appropriate props, styling, and structure
 * based on the section type and detected content.
 *
 * This tool generates a single base component variant which can then be
 * used with generateVariantsTool to create multiple optimization strategies.
 *
 * @param input - Component generation parameters (sectionId, screenshotPath, designSystem, componentType)
 * @param context - Tool execution context
 * @returns Promise resolving to component generation result
 *
 * @example
 * ```typescript
 * const result = await generateComponentTool({
 *   sectionId: 'section-123',
 *   screenshotPath: '/path/to/screenshot.png',
 *   designSystem: { colors: {...}, typography: {...} },
 *   componentType: 'hero'
 * }, context);
 *
 * if (result.success) {
 *   console.log('Component code:', result.componentCode);
 *   console.log('Saved to:', result.componentPath);
 * }
 * ```
 */
export async function generateComponentTool(
  input: GenerateComponentToolInput,
  context: ToolContext
): Promise<GenerateComponentToolOutput> {
  try {
    // Validate input
    if (!input.sectionId || !input.componentType) {
      return {
        success: false,
        componentCode: '',
        componentPath: '',
      };
    }

    const { sectionId, screenshotPath, designSystem, componentType } = input;
    const { websiteId } = context;

    // Create a mock DetectedComponent for variant generation
    // In a real scenario, this would come from the component-detector
    const detectedComponent: DetectedComponent = {
      id: sectionId,
      type: componentType as DetectedComponent['type'],
      order: 0,
      boundingBox: {
        x: 0,
        y: 0,
        width: 1280,
        height: 600,
      },
      htmlSnapshot: '<div></div>',
      styles: {
        backgroundColor: designSystem.colors?.primary?.[0] || '#ffffff',
        color: designSystem.colors?.neutral?.[0] || '#000000',
        padding: String(designSystem.spacing?.scale?.[4] ?? '1rem'),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      },
      screenshotPath,
    };

    // Generate the component name
    const componentName = componentTypeToName(detectedComponent.type);

    // Generate variants (we'll use the first one as the base component)
    const variantResult = generateVariantsWithMetadata(detectedComponent, {
      componentName,
      designSystem,
    });

    if (!variantResult.variants || variantResult.variants.length === 0) {
      return {
        success: false,
        componentCode: '',
        componentPath: '',
      };
    }

    // Use the first variant (pixel-perfect) as the base component
    const baseVariant = variantResult.variants[0];

    // Save the component file
    const componentPath = saveVariantFile(websiteId, componentName, baseVariant, true);

    return {
      success: true,
      componentCode: baseVariant.code,
      componentPath,
    };
  } catch (error) {
    return {
      success: false,
      componentCode: '',
      componentPath: '',
    };
  }
}

// ====================
// GENERATE VARIANTS TOOL
// ====================

/**
 * Generate Variants Tool
 *
 * Generates multiple code variants for a component with different
 * optimization strategies:
 * - Variant A (pixel-perfect): Exact visual reproduction with inline styles
 * - Variant B (semantic): Clean code with proper HTML semantics
 * - Variant C (modernized): Accessibility and performance optimizations
 *
 * Each variant is a complete, standalone implementation that can be
 * used interchangeably with different trade-offs.
 *
 * @param input - Variant generation parameters (baseComponent, designSystem, variantCount)
 * @param context - Tool execution context
 * @returns Promise resolving to variant generation result
 *
 * @example
 * ```typescript
 * const result = await generateVariantsTool({
 *   baseComponent: componentCode,
 *   designSystem: { colors: {...}, typography: {...} },
 *   variantCount: 3
 * }, context);
 *
 * if (result.success) {
 *   result.variants.forEach((v, i) => {
 *     console.log(`Variant ${i + 1}: ${v.description}`);
 *   });
 * }
 * ```
 */
export async function generateVariantsTool(
  input: GenerateVariantsToolInput,
  context: ToolContext
): Promise<GenerateVariantsToolOutput> {
  try {
    // Validate input
    if (!input.baseComponent || !input.designSystem) {
      return {
        success: false,
        variants: [],
      };
    }

    const { baseComponent, designSystem, variantCount = 3 } = input;
    const { websiteId } = context;

    // Parse component name from base component code
    // Extract component name from function/class declaration
    const componentNameMatch = baseComponent.match(
      /(?:export\s+(?:default\s+)?(?:function|const|class)\s+)(\w+)/
    );
    const componentName = componentNameMatch?.[1] || 'Component';

    // Create a mock DetectedComponent for variant generation
    // Extract any inline styles or props from base component
    const detectedComponent: DetectedComponent = {
      id: `component-${componentName}`,
      type: 'hero', // Default type - this should be inferred from context
      order: 0,
      boundingBox: {
        x: 0,
        y: 0,
        width: 1280,
        height: 600,
      },
      htmlSnapshot: baseComponent,
      styles: {
        backgroundColor: designSystem.colors?.primary?.[0] || '#ffffff',
        color: designSystem.colors?.neutral?.[0] || '#000000',
        padding: String(designSystem.spacing?.scale?.[4] ?? '1rem'),
      },
      screenshotPath: '',
    };

    // Generate all variants using the variant generator
    const variantResult = generateVariantsWithMetadata(detectedComponent, {
      componentName,
      designSystem,
    });

    if (!variantResult.variants || variantResult.variants.length === 0) {
      return {
        success: false,
        variants: [],
      };
    }

    // Save all variants to filesystem
    const componentDir = getComponentsDir(websiteId);
    const componentPath = path.join(componentDir, componentName);
    ensureDirectory(componentPath);

    // Limit to requested variant count
    const selectedVariants = variantResult.variants.slice(0, variantCount);

    // Save each variant
    selectedVariants.forEach((variant) => {
      saveVariantFile(websiteId, componentName, variant, false);
    });

    // Convert to tool output format
    const outputVariants = selectedVariants.map((variant) => ({
      code: variant.code,
      description: variant.description,
    }));

    return {
      success: true,
      variants: outputVariants,
    };
  } catch (error) {
    return {
      success: false,
      variants: [],
    };
  }
}

// ====================
// TOOL CONTEXT CREATION
// ====================

/**
 * Create a tool context for generator agent tools
 * Convenience function for creating tool execution contexts
 *
 * @param websiteId - Website identifier
 * @param versionId - Version identifier
 * @returns Tool context
 */
export function createToolContext(websiteId: string, versionId: string): ToolContext {
  return {
    websiteId,
    versionId,
  };
}
