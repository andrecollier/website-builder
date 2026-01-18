/**
 * Export Preview API Route
 *
 * POST /api/export/preview - Generate preview of website export
 *
 * Generates a temporary preview of the website export that can be viewed
 * in the browser before downloading.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  initializeDatabase,
  getWebsiteById,
  getComponentsByWebsite,
  getVariantsByComponent,
  getDesignTokensByWebsite,
} from '@/lib/db/client';
import { exportStatic } from '@/lib/export/static-exporter';
import fs from 'fs';
import path from 'path';

/**
 * Response type for POST /api/export/preview
 */
interface PreviewResponse {
  success: boolean;
  previewUrl?: string;
  error?: string;
}

/**
 * Request body type for POST /api/export/preview
 */
interface PreviewRequest {
  websiteId: string;
  format: 'nextjs' | 'static' | 'components';
  options: {
    enableInteractivity: boolean;
    optimizeImages: boolean;
    generateSitemap: boolean;
  };
  seoMetadata: {
    title: string;
    description: string;
    ogImage: string;
    ogImageAlt: string;
  };
}

/**
 * POST /api/export/preview
 *
 * Generates a temporary static preview of the website that can be viewed
 * in the browser. The preview is always generated as static HTML regardless
 * of the selected export format.
 *
 * Request body:
 * {
 *   "websiteId": "website-001",
 *   "format": "nextjs",
 *   "options": {...},
 *   "seoMetadata": {...}
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "previewUrl": "/exports/preview-website-001-1234567890/index.html"
 * }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<PreviewResponse>> {
  try {
    // Ensure database is initialized
    initializeDatabase();

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

    // Validate required fields
    if (!data.websiteId || typeof data.websiteId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'websiteId is required',
        },
        { status: 400 }
      );
    }

    const previewRequest: PreviewRequest = {
      websiteId: data.websiteId,
      format: ((data.format as string) || 'static') as 'nextjs' | 'components' | 'static',
      options: {
        enableInteractivity: true,
        optimizeImages: false, // Disable for faster preview generation
        generateSitemap: false,
      },
      seoMetadata: {
        title: '',
        description: '',
        ogImage: '',
        ogImageAlt: '',
      },
    };

    // Parse options if provided
    if (data.options && typeof data.options === 'object') {
      const opts = data.options as Record<string, unknown>;
      if (typeof opts.enableInteractivity === 'boolean') {
        previewRequest.options.enableInteractivity = opts.enableInteractivity;
      }
    }

    // Parse SEO metadata if provided
    if (data.seoMetadata && typeof data.seoMetadata === 'object') {
      const seo = data.seoMetadata as Record<string, unknown>;
      if (typeof seo.title === 'string') {
        previewRequest.seoMetadata.title = seo.title;
      }
      if (typeof seo.description === 'string') {
        previewRequest.seoMetadata.description = seo.description;
      }
      if (typeof seo.ogImage === 'string') {
        previewRequest.seoMetadata.ogImage = seo.ogImage;
      }
      if (typeof seo.ogImageAlt === 'string') {
        previewRequest.seoMetadata.ogImageAlt = seo.ogImageAlt;
      }
    }

    // Check if website exists
    const website = getWebsiteById(previewRequest.websiteId);
    if (!website) {
      return NextResponse.json(
        {
          success: false,
          error: `Website with ID '${previewRequest.websiteId}' not found`,
        },
        { status: 404 }
      );
    }

    // Get components and their variants
    const componentRecords = getComponentsByWebsite(previewRequest.websiteId);

    // Transform to GeneratedComponent format
    const components = componentRecords.map((record) => {
      const variants = getVariantsByComponent(record.id);

      return {
        id: record.id,
        websiteId: record.website_id,
        name: record.name,
        type: record.type,
        order: record.order_index,
        variants: variants.map((v) => ({
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
    });

    // Get design tokens
    const tokensRecord = getDesignTokensByWebsite(previewRequest.websiteId);
    const designTokens = tokensRecord?.tokens_json
      ? JSON.parse(tokensRecord.tokens_json)
      : null;

    // Create preview in public directory for serving
    const publicDir = path.resolve(process.cwd(), 'public', 'exports');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Generate preview directory name
    const timestamp = Date.now();
    const previewDir = path.join(publicDir, `preview-${previewRequest.websiteId}-${timestamp}`);

    // Generate static export for preview (always use static format for preview)
    const result = await exportStatic({
      websiteId: previewRequest.websiteId,
      designSystem: designTokens,
      outputDir: previewDir,
      seo: previewRequest.seoMetadata,
      includeInteractivity: previewRequest.options.enableInteractivity,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.errors?.[0]?.message || 'Preview generation failed',
        },
        { status: 500 }
      );
    }

    // Clean up old previews (keep only last 5)
    try {
      const previewDirs = fs.readdirSync(publicDir)
        .filter(dir => dir.startsWith('preview-'))
        .map(dir => ({
          name: dir,
          path: path.join(publicDir, dir),
          mtime: fs.statSync(path.join(publicDir, dir)).mtime.getTime(),
        }))
        .sort((a, b) => b.mtime - a.mtime);

      // Remove old previews (keep last 5)
      if (previewDirs.length > 5) {
        for (let i = 5; i < previewDirs.length; i++) {
          fs.rmSync(previewDirs[i].path, { recursive: true, force: true });
        }
      }
    } catch (cleanupError) {
      console.warn('Failed to clean up old previews:', cleanupError);
    }

    // Return preview URL (relative to public directory)
    const previewUrl = `/exports/preview-${previewRequest.websiteId}-${timestamp}/index.html`;

    return NextResponse.json(
      {
        success: true,
        previewUrl,
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
