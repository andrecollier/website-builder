/**
 * Components API Route
 *
 * GET /api/components/[websiteId] - Get all components for a website
 * PUT /api/components/[websiteId] - Update a component
 *
 * Provides operations for fetching and updating generated components
 * for a specific website.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getComponentsByWebsite,
  getVariantsByComponent,
  getWebsiteById,
  updateComponent,
  initializeDatabase,
} from '@/lib/db/client';
import type { ComponentRecord, VariantRecord } from '@/lib/db/client';
import type { GeneratedComponent, ComponentVariant } from '@/types';

/**
 * Response type for the GET /api/components/[websiteId] endpoint
 */
interface ComponentsListResponse {
  success: boolean;
  websiteId: string;
  components: GeneratedComponent[];
  total: number;
  error?: string;
}

/**
 * Response type for the PUT /api/components/[websiteId] endpoint
 */
interface ComponentUpdateResponse {
  success: boolean;
  component?: GeneratedComponent;
  error?: string;
}

/**
 * Request body for updating a component
 */
interface ComponentUpdateRequest {
  componentId: string;
  selectedVariant?: string | null;
  customCode?: string | null;
  status?: 'pending' | 'approved' | 'rejected' | 'skipped' | 'failed';
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
    createdAt: new Date().toISOString(), // Note: DB doesn't store created_at for components
  };
}

/**
 * GET /api/components/[websiteId]
 *
 * Fetches all components for a website with their variants.
 *
 * Response:
 * {
 *   "success": true,
 *   "websiteId": "website-001",
 *   "components": [...],
 *   "total": 5
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
): Promise<NextResponse<ComponentsListResponse>> {
  try {
    // Ensure database is initialized
    initializeDatabase();

    const { websiteId } = await params;

    // Validate websiteId
    if (!websiteId) {
      return NextResponse.json(
        {
          success: false,
          websiteId: '',
          components: [],
          total: 0,
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
          websiteId,
          components: [],
          total: 0,
          error: `Website with ID '${websiteId}' not found`,
        },
        { status: 404 }
      );
    }

    // Get all components for the website
    const componentRecords = getComponentsByWebsite(websiteId);

    // Transform records to GeneratedComponent format with variants
    const components: GeneratedComponent[] = componentRecords.map((record) => {
      const variants = getVariantsByComponent(record.id);
      return transformToGeneratedComponent(record, variants);
    });

    return NextResponse.json(
      {
        success: true,
        websiteId,
        components,
        total: components.length,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      {
        success: false,
        websiteId: '',
        components: [],
        total: 0,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/components/[websiteId]
 *
 * Updates a component's properties (selected variant, custom code, status).
 *
 * Request body:
 * {
 *   "componentId": "component-001",
 *   "selectedVariant": "variant-001",
 *   "customCode": "...",
 *   "status": "approved"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "component": {...}
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
): Promise<NextResponse<ComponentUpdateResponse>> {
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

    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Request body is required',
        },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    // Validate componentId
    if (!data.componentId || typeof data.componentId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'componentId is required',
        },
        { status: 400 }
      );
    }

    const updateData: ComponentUpdateRequest = {
      componentId: data.componentId,
    };

    // Validate and extract optional fields
    if (data.selectedVariant !== undefined) {
      if (data.selectedVariant !== null && typeof data.selectedVariant !== 'string') {
        return NextResponse.json(
          {
            success: false,
            error: 'selectedVariant must be a string or null',
          },
          { status: 400 }
        );
      }
      updateData.selectedVariant = data.selectedVariant as string | null;
    }

    if (data.customCode !== undefined) {
      if (data.customCode !== null && typeof data.customCode !== 'string') {
        return NextResponse.json(
          {
            success: false,
            error: 'customCode must be a string or null',
          },
          { status: 400 }
        );
      }
      updateData.customCode = data.customCode as string | null;
    }

    if (data.status !== undefined) {
      const validStatuses = ['pending', 'approved', 'rejected', 'skipped', 'failed'];
      if (typeof data.status !== 'string' || !validStatuses.includes(data.status)) {
        return NextResponse.json(
          {
            success: false,
            error: `status must be one of: ${validStatuses.join(', ')}`,
          },
          { status: 400 }
        );
      }
      updateData.status = data.status as ComponentUpdateRequest['status'];
    }

    // Build update object for database
    const dbUpdate: Parameters<typeof updateComponent>[1] = {};

    if (updateData.selectedVariant !== undefined) {
      dbUpdate.selected_variant = updateData.selectedVariant;
    }
    if (updateData.customCode !== undefined) {
      dbUpdate.custom_code = updateData.customCode;
    }
    if (updateData.status !== undefined) {
      dbUpdate.status = updateData.status;
    }

    // Check if there's anything to update
    if (Object.keys(dbUpdate).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid update fields provided',
        },
        { status: 400 }
      );
    }

    // Update the component
    const updatedRecord = updateComponent(updateData.componentId, dbUpdate);

    if (!updatedRecord) {
      return NextResponse.json(
        {
          success: false,
          error: `Component with ID '${updateData.componentId}' not found`,
        },
        { status: 404 }
      );
    }

    // Verify the component belongs to this website
    if (updatedRecord.website_id !== websiteId) {
      return NextResponse.json(
        {
          success: false,
          error: `Component '${updateData.componentId}' does not belong to website '${websiteId}'`,
        },
        { status: 400 }
      );
    }

    // Get variants for the updated component
    const variants = getVariantsByComponent(updatedRecord.id);
    const component = transformToGeneratedComponent(updatedRecord, variants);

    return NextResponse.json(
      {
        success: true,
        component,
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
