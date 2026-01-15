/**
 * Component Approval API Route
 *
 * POST /api/components/[websiteId]/approve
 * Approves a component with the selected variant and saves it to the filesystem.
 *
 * This endpoint handles the approval workflow:
 * 1. Validates the component and variant exist
 * 2. Updates the component status to 'approved' in the database
 * 3. Saves the component code to the structured filesystem
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getComponentById,
  getVariantById,
  getVariantsByComponent,
  getWebsiteById,
  updateComponent,
  initializeDatabase,
  countComponentsByWebsite,
  countComponentsByStatus,
} from '@/lib/db/client';
import type { ComponentRecord, VariantRecord } from '@/lib/db/client';
import type { GeneratedComponent, ComponentVariant } from '@/types';
import path from 'path';
import fs from 'fs';

/**
 * Response type for the approval endpoint
 */
interface ApprovalResponse {
  success: boolean;
  component?: GeneratedComponent;
  progress?: {
    approved: number;
    total: number;
    remaining: number;
    percentComplete: number;
  };
  savedPath?: string;
  error?: string;
}

/**
 * Request body for approving a component
 */
interface ApprovalRequest {
  componentId: string;
  variantId: string;
  customCode?: string;
}

/**
 * Get the base directory for website output
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
 * Transform database records to GeneratedComponent format
 */
function transformToGeneratedComponent(
  record: ComponentRecord,
  variants: VariantRecord[]
): GeneratedComponent {
  return {
    id: record.id,
    websiteId: record.website_id,
    name: record.name,
    type: record.type,
    order: record.order_index,
    variants: variants.map((v): ComponentVariant => ({
      id: v.id,
      name: v.variant_name as 'Variant A' | 'Variant B' | 'Variant C',
      description: v.description || '',
      code: v.code,
      previewImage: v.preview_image || undefined,
      accuracyScore: v.accuracy_score || undefined,
    })),
    selectedVariant: record.selected_variant,
    customCode: record.custom_code || undefined,
    status: record.status,
    errorMessage: record.error_message || undefined,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Format component name for filesystem (e.g., "header" -> "Header")
 */
function formatComponentName(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Get variant letter from variant name (e.g., "Variant A" -> "a")
 */
function getVariantLetter(variantName: string): string {
  const match = variantName.match(/Variant\s+([A-C])/i);
  return match ? match[1].toLowerCase() : 'a';
}

/**
 * Save approved component to the filesystem
 *
 * Output structure:
 * Websites/[websiteId]/current/src/components/[ComponentName]/
 * ├── [ComponentName].tsx      # Selected variant (main file)
 * ├── variants/
 * │   ├── variant-a.tsx
 * │   ├── variant-b.tsx
 * │   └── variant-c.tsx
 * └── index.ts                 # Export main component
 */
async function saveComponentToFilesystem(
  websiteId: string,
  componentName: string,
  variants: VariantRecord[],
  selectedVariantId: string,
  customCode?: string | null
): Promise<string> {
  const baseDir = getWebsitesBaseDir();
  const componentDir = path.join(
    baseDir,
    websiteId,
    'current',
    'src',
    'components',
    formatComponentName(componentName)
  );
  const variantsDir = path.join(componentDir, 'variants');

  // Ensure directories exist
  if (!fs.existsSync(variantsDir)) {
    fs.mkdirSync(variantsDir, { recursive: true });
  }

  // Find the selected variant
  const selectedVariant = variants.find(v => v.id === selectedVariantId);
  if (!selectedVariant) {
    throw new Error(`Selected variant '${selectedVariantId}' not found`);
  }

  // Save all variants to variants/ directory
  for (const variant of variants) {
    const variantLetter = getVariantLetter(variant.variant_name);
    const variantPath = path.join(variantsDir, `variant-${variantLetter}.tsx`);
    fs.writeFileSync(variantPath, variant.code, 'utf-8');
  }

  // Save main component file (selected variant or custom code)
  const formattedName = formatComponentName(componentName);
  const mainComponentPath = path.join(componentDir, `${formattedName}.tsx`);
  const mainCode = customCode || selectedVariant.code;
  fs.writeFileSync(mainComponentPath, mainCode, 'utf-8');

  // Generate and save index.ts
  const indexContent = `/**
 * ${formattedName} Component
 *
 * Auto-generated export file
 */

export { default } from './${formattedName}';
export { default as ${formattedName} } from './${formattedName}';
`;
  const indexPath = path.join(componentDir, 'index.ts');
  fs.writeFileSync(indexPath, indexContent, 'utf-8');

  return componentDir;
}

/**
 * Validate the approval request body
 */
function validateRequest(
  body: unknown
): { valid: true; data: ApprovalRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const data = body as Record<string, unknown>;

  // Validate componentId
  if (!data.componentId || typeof data.componentId !== 'string') {
    return { valid: false, error: 'componentId is required' };
  }

  // Validate variantId
  if (!data.variantId || typeof data.variantId !== 'string') {
    return { valid: false, error: 'variantId is required' };
  }

  // Validate optional customCode
  if (data.customCode !== undefined && data.customCode !== null && typeof data.customCode !== 'string') {
    return { valid: false, error: 'customCode must be a string if provided' };
  }

  return {
    valid: true,
    data: {
      componentId: data.componentId,
      variantId: data.variantId,
      customCode: data.customCode as string | undefined,
    },
  };
}

/**
 * POST /api/components/[websiteId]/approve
 *
 * Approves a component with the selected variant.
 *
 * Request body:
 * {
 *   "componentId": "component-001",
 *   "variantId": "variant-001",
 *   "customCode": "// optional custom code"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "component": {...},
 *   "progress": {
 *     "approved": 3,
 *     "total": 7,
 *     "remaining": 4,
 *     "percentComplete": 42.86
 *   },
 *   "savedPath": "/path/to/component"
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
): Promise<NextResponse<ApprovalResponse>> {
  try {
    // Ensure database is initialized
    initializeDatabase();

    const { websiteId } = await params;

    // Validate websiteId
    if (!websiteId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Website ID is required',
        },
        { status: 400 }
      );
    }

    // Check if website exists
    const website = getWebsiteById(websiteId);
    if (!website) {
      return NextResponse.json(
        {
          success: false,
          error: `Website with ID '${websiteId}' not found`,
        },
        { status: 404 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      );
    }

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    const { componentId, variantId, customCode } = validation.data;

    // Get the component
    const component = getComponentById(componentId);
    if (!component) {
      return NextResponse.json(
        {
          success: false,
          error: `Component with ID '${componentId}' not found`,
        },
        { status: 404 }
      );
    }

    // Verify component belongs to this website
    if (component.website_id !== websiteId) {
      return NextResponse.json(
        {
          success: false,
          error: `Component '${componentId}' does not belong to website '${websiteId}'`,
        },
        { status: 400 }
      );
    }

    // Verify the variant exists and belongs to this component
    const variant = getVariantById(variantId);
    if (!variant) {
      return NextResponse.json(
        {
          success: false,
          error: `Variant with ID '${variantId}' not found`,
        },
        { status: 404 }
      );
    }

    if (variant.component_id !== componentId) {
      return NextResponse.json(
        {
          success: false,
          error: `Variant '${variantId}' does not belong to component '${componentId}'`,
        },
        { status: 400 }
      );
    }

    // Get all variants for the component (needed for filesystem save)
    const allVariants = getVariantsByComponent(componentId);

    // Save component to filesystem
    let savedPath: string;
    try {
      savedPath = await saveComponentToFilesystem(
        websiteId,
        component.type,
        allVariants,
        variantId,
        customCode
      );
    } catch (fsError) {
      const fsErrorMessage = fsError instanceof Error ? fsError.message : 'Failed to save component to filesystem';
      return NextResponse.json(
        {
          success: false,
          error: fsErrorMessage,
        },
        { status: 500 }
      );
    }

    // Update component in database
    const updatedRecord = updateComponent(componentId, {
      selected_variant: variantId,
      custom_code: customCode || null,
      status: 'approved',
      approved: true,
    });

    if (!updatedRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update component status',
        },
        { status: 500 }
      );
    }

    // Get variants for the updated component
    const variants = getVariantsByComponent(updatedRecord.id);
    const generatedComponent = transformToGeneratedComponent(updatedRecord, variants);

    // Calculate progress
    const totalComponents = countComponentsByWebsite(websiteId);
    const approvedComponents = countComponentsByStatus(websiteId, 'approved');
    const skippedComponents = countComponentsByStatus(websiteId, 'skipped');
    const processedComponents = approvedComponents + skippedComponents;
    const remainingComponents = totalComponents - processedComponents;
    const percentComplete = totalComponents > 0
      ? Math.round((approvedComponents / totalComponents) * 10000) / 100
      : 0;

    return NextResponse.json(
      {
        success: true,
        component: generatedComponent,
        progress: {
          approved: approvedComponents,
          total: totalComponents,
          remaining: remainingComponents,
          percentComplete,
        },
        savedPath,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
