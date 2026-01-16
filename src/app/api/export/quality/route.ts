/**
 * Quality Report API Route
 *
 * GET /api/export/quality?websiteId=xxx - Generate quality report for a website
 *
 * Provides quality assessment metrics, component status, issues, and
 * recommendations for a website export.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  initializeDatabase,
  getWebsiteById,
  getComponentsByWebsite,
  getVariantsByComponent,
  getDesignTokensByWebsite,
} from '@/lib/db/client';
import { generateQualityReport, type QualityReport } from '@/lib/export/quality-report';

/**
 * Response type for the GET /api/export/quality endpoint
 */
interface QualityReportResponse {
  success: boolean;
  report?: QualityReport;
  error?: string;
}

/**
 * GET /api/export/quality?websiteId=xxx
 *
 * Generates a comprehensive quality report for a website including:
 * - Component status breakdown
 * - Accuracy metrics
 * - Detected issues
 * - Actionable recommendations
 *
 * Query Parameters:
 * - websiteId (required): The ID of the website to analyze
 *
 * Response:
 * {
 *   "success": true,
 *   "report": {
 *     "websiteId": "website-001",
 *     "websiteName": "Example Site",
 *     "componentStatus": {...},
 *     "accuracy": {...},
 *     "issues": [...],
 *     "recommendations": [...]
 *   }
 * }
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<QualityReportResponse>> {
  try {
    // Ensure database is initialized
    initializeDatabase();

    // Get websiteId from query parameters
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');

    // Validate websiteId
    if (!websiteId) {
      return NextResponse.json(
        {
          success: false,
          error: 'websiteId query parameter is required',
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

    // Get components and their variants
    const componentRecords = getComponentsByWebsite(websiteId);

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
    const tokensRecord = getDesignTokensByWebsite(websiteId);
    const designTokens = tokensRecord?.tokens_json
      ? JSON.parse(tokensRecord.tokens_json)
      : null;

    // Generate quality report
    const report = generateQualityReport(websiteId, website.url, components, designTokens);

    return NextResponse.json(
      {
        success: true,
        report,
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
