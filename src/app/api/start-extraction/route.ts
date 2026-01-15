/**
 * Start Extraction API Route
 *
 * POST /api/start-extraction
 * Initiates the website extraction process by creating a new website record
 * and returning the websiteId for status tracking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createWebsite, initializeDatabase, updateWebsiteStatus } from '@/lib/db/client';
import { isValidUrl, getNameFromUrl } from '@/lib/utils';
import type { StartExtractionRequest, StartExtractionResponse } from '@/types';

/**
 * Validate the request body for start extraction
 */
function validateRequest(
  body: unknown
): { valid: true; data: StartExtractionRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const data = body as Record<string, unknown>;

  // Validate URL
  if (!data.url || typeof data.url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  if (!isValidUrl(data.url)) {
    return { valid: false, error: 'Invalid URL format. Must be a valid HTTP/HTTPS URL.' };
  }

  // Validate mode
  const mode = data.mode || 'single';
  if (mode !== 'single' && mode !== 'template') {
    return { valid: false, error: 'Mode must be either "single" or "template"' };
  }

  // Validate template config if mode is template
  if (mode === 'template') {
    if (!data.templateConfig || typeof data.templateConfig !== 'object') {
      return { valid: false, error: 'Template config is required for template mode' };
    }

    const templateConfig = data.templateConfig as Record<string, unknown>;

    if (!Array.isArray(templateConfig.urls) || templateConfig.urls.length === 0) {
      return { valid: false, error: 'At least one URL is required in template config' };
    }

    // Validate each URL in template config
    for (const urlItem of templateConfig.urls) {
      if (typeof urlItem === 'object' && urlItem !== null) {
        const refUrl = urlItem as Record<string, unknown>;
        if (refUrl.url && typeof refUrl.url === 'string' && !isValidUrl(refUrl.url)) {
          return { valid: false, error: `Invalid URL in template config: ${refUrl.url}` };
        }
      }
    }
  }

  return {
    valid: true,
    data: {
      url: data.url,
      mode: mode as 'single' | 'template',
      name: typeof data.name === 'string' ? data.name : undefined,
      templateConfig: data.templateConfig as StartExtractionRequest['templateConfig'],
    },
  };
}

/**
 * POST /api/start-extraction
 *
 * Request body:
 * {
 *   "url": "https://example.com",
 *   "mode": "single" | "template",
 *   "name": "optional display name",
 *   "templateConfig": {
 *     "urls": [{ "id": "...", "url": "...", "name": "...", "isValid": true }],
 *     "sections": [{ "sectionType": "header", "sourceId": "...", "order": 0 }]
 *   }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "websiteId": "website-001",
 *   "status": "started"
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse<StartExtractionResponse>> {
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
          websiteId: '',
          status: 'error',
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
          websiteId: '',
          status: 'error',
          error: validation.error,
        },
        { status: 400 }
      );
    }

    const { url, name } = validation.data;

    // Generate display name from URL if not provided
    const displayName = name || getNameFromUrl(url);

    // Create website record in database
    const website = createWebsite({
      name: displayName,
      reference_url: url,
      status: 'pending',
    });

    // Update status to in_progress to indicate extraction has started
    updateWebsiteStatus(website.id, 'in_progress');

    // Return success response
    // Note: Actual extraction logic will be implemented in Phase 2+
    return NextResponse.json(
      {
        success: true,
        websiteId: website.id,
        status: 'started',
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      {
        success: false,
        websiteId: '',
        status: 'error',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
