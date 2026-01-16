/**
 * Export Download API Route
 *
 * POST /api/export/download - Generate and download website export
 *
 * Generates a complete website export in the selected format (Next.js,
 * Static HTML/CSS, or React Components) and returns it as a ZIP file.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  initializeDatabase,
  getWebsiteById,
  getComponentsByWebsite,
  getVariantsByComponent,
  getDesignTokensByWebsite,
} from '@/lib/db/client';
import { exportNextJS } from '@/lib/export/nextjs-exporter';
import { exportStatic } from '@/lib/export/static-exporter';
import { exportComponents } from '@/lib/export/components-exporter';
import { generateZip } from '@/lib/export/zip-generator';
import fs from 'fs';
import path from 'path';

/**
 * Request body type for POST /api/export/download
 */
interface ExportDownloadRequest {
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
 * POST /api/export/download
 *
 * Generates a website export in the specified format and returns it as a
 * downloadable ZIP file.
 *
 * Request body:
 * {
 *   "websiteId": "website-001",
 *   "format": "nextjs",
 *   "options": {
 *     "enableInteractivity": true,
 *     "optimizeImages": true,
 *     "generateSitemap": true
 *   },
 *   "seoMetadata": {
 *     "title": "My Website",
 *     "description": "Website description",
 *     "ogImage": "https://example.com/og.jpg",
 *     "ogImageAlt": "OG image description"
 *   }
 * }
 *
 * Response: ZIP file stream (application/zip)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let exportDir: string | null = null;
  let zipPath: string | null = null;

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

    if (!data.format || typeof data.format !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'format is required',
        },
        { status: 400 }
      );
    }

    const validFormats = ['nextjs', 'static', 'components'];
    if (!validFormats.includes(data.format)) {
      return NextResponse.json(
        {
          success: false,
          error: `format must be one of: ${validFormats.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const exportRequest: ExportDownloadRequest = {
      websiteId: data.websiteId,
      format: data.format as 'nextjs' | 'static' | 'components',
      options: {
        enableInteractivity: true,
        optimizeImages: true,
        generateSitemap: true,
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
        exportRequest.options.enableInteractivity = opts.enableInteractivity;
      }
      if (typeof opts.optimizeImages === 'boolean') {
        exportRequest.options.optimizeImages = opts.optimizeImages;
      }
      if (typeof opts.generateSitemap === 'boolean') {
        exportRequest.options.generateSitemap = opts.generateSitemap;
      }
    }

    // Parse SEO metadata if provided
    if (data.seoMetadata && typeof data.seoMetadata === 'object') {
      const seo = data.seoMetadata as Record<string, unknown>;
      if (typeof seo.title === 'string') {
        exportRequest.seoMetadata.title = seo.title;
      }
      if (typeof seo.description === 'string') {
        exportRequest.seoMetadata.description = seo.description;
      }
      if (typeof seo.ogImage === 'string') {
        exportRequest.seoMetadata.ogImage = seo.ogImage;
      }
      if (typeof seo.ogImageAlt === 'string') {
        exportRequest.seoMetadata.ogImageAlt = seo.ogImageAlt;
      }
    }

    // Check if website exists
    const website = getWebsiteById(exportRequest.websiteId);
    if (!website) {
      return NextResponse.json(
        {
          success: false,
          error: `Website with ID '${exportRequest.websiteId}' not found`,
        },
        { status: 404 }
      );
    }

    // Get components and their variants
    const componentRecords = getComponentsByWebsite(exportRequest.websiteId);

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
    const tokensRecord = getDesignTokensByWebsite(exportRequest.websiteId);
    const designTokens = tokensRecord?.tokens_json
      ? JSON.parse(tokensRecord.tokens_json)
      : null;

    // Create temporary exports directory
    const exportsBaseDir = path.resolve(process.cwd(), 'exports');
    if (!fs.existsSync(exportsBaseDir)) {
      fs.mkdirSync(exportsBaseDir, { recursive: true });
    }

    // Generate export based on format
    const timestamp = Date.now();
    let result;

    switch (exportRequest.format) {
      case 'nextjs':
        exportDir = path.join(exportsBaseDir, `nextjs-${exportRequest.websiteId}-${timestamp}`);
        result = await exportNextJS(components, designTokens, {
          outputDir: exportDir,
          seoMetadata: exportRequest.seoMetadata,
          projectName: exportRequest.seoMetadata.title || website.url.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '-'),
        });
        break;

      case 'static':
        exportDir = path.join(exportsBaseDir, `static-${exportRequest.websiteId}-${timestamp}`);
        result = await exportStatic(components, designTokens, {
          outputDir: exportDir,
          seoMetadata: exportRequest.seoMetadata,
          includeInteractivity: exportRequest.options.enableInteractivity,
        });
        break;

      case 'components':
        exportDir = path.join(exportsBaseDir, `components-${exportRequest.websiteId}-${timestamp}`);
        result = await exportComponents(components, designTokens, {
          outputDir: exportDir,
          packageName: exportRequest.seoMetadata.title?.toLowerCase().replace(/\s+/g, '-') || 'website-components',
        });
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown export format: ${exportRequest.format}`,
          },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Export failed',
        },
        { status: 500 }
      );
    }

    // Generate ZIP file
    zipPath = path.join(exportsBaseDir, `${exportRequest.websiteId}-${exportRequest.format}-${timestamp}.zip`);
    const zipResult = await generateZip(exportDir, zipPath, {
      compressionLevel: 9,
      exclude: ['node_modules', '.git', '.DS_Store'],
    });

    if (!zipResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: zipResult.error || 'ZIP generation failed',
        },
        { status: 500 }
      );
    }

    // Read ZIP file
    const zipBuffer = fs.readFileSync(zipPath);

    // Clean up temporary files
    try {
      if (exportDir && fs.existsSync(exportDir)) {
        fs.rmSync(exportDir, { recursive: true, force: true });
      }
      if (zipPath && fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }
    } catch (cleanupError) {
      // Log cleanup error but don't fail the request
      console.warn('Failed to clean up temporary files:', cleanupError);
    }

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${exportRequest.websiteId}-${exportRequest.format}-export.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    // Clean up on error
    try {
      if (exportDir && fs.existsSync(exportDir)) {
        fs.rmSync(exportDir, { recursive: true, force: true });
      }
      if (zipPath && fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary files after error:', cleanupError);
    }

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
