/**
 * Template Process API Route
 *
 * POST /api/template/process
 * Processes reference URLs to extract design tokens and sections.
 * Used in Template Mode to prepare references for mixing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processReferences, type ReferenceProcessorConfig, type ProcessReferenceResult } from '@/lib/template/reference-processor';
import { isValidUrl } from '@/lib/utils';
import type { Reference } from '@/types';

// ====================
// TYPES
// ====================

/**
 * Request body for processing references
 */
interface ProcessReferencesRequest {
  urls: string[];
  config?: ReferenceProcessorConfig;
}

/**
 * Response body for reference processing
 */
interface ProcessReferencesResponse {
  success: boolean;
  references: Reference[];
  errors?: string[];
  processingTimeMs?: number;
}

// ====================
// VALIDATION
// ====================

/**
 * Validate the request body for processing references
 */
function validateRequest(
  body: unknown
): { valid: true; data: ProcessReferencesRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const data = body as Record<string, unknown>;

  // Validate URLs array
  if (!data.urls || !Array.isArray(data.urls)) {
    return { valid: false, error: 'URLs array is required' };
  }

  if (data.urls.length === 0) {
    return { valid: false, error: 'At least one URL is required' };
  }

  // Validate each URL
  for (const url of data.urls) {
    if (typeof url !== 'string') {
      return { valid: false, error: 'All URLs must be strings' };
    }

    if (!isValidUrl(url)) {
      return { valid: false, error: `Invalid URL format: ${url}` };
    }
  }

  // Validate config if provided
  if (data.config !== undefined) {
    if (typeof data.config !== 'object' || data.config === null) {
      return { valid: false, error: 'Config must be an object' };
    }

    const config = data.config as Record<string, unknown>;

    if (config.ttlHours !== undefined && typeof config.ttlHours !== 'number') {
      return { valid: false, error: 'Config ttlHours must be a number' };
    }

    if (config.forceReprocess !== undefined && typeof config.forceReprocess !== 'boolean') {
      return { valid: false, error: 'Config forceReprocess must be a boolean' };
    }

    if (config.cacheDir !== undefined && typeof config.cacheDir !== 'string') {
      return { valid: false, error: 'Config cacheDir must be a string' };
    }
  }

  return {
    valid: true,
    data: {
      urls: data.urls as string[],
      config: data.config as ReferenceProcessorConfig | undefined,
    },
  };
}

// ====================
// ROUTE HANDLER
// ====================

/**
 * POST /api/template/process
 *
 * Request body:
 * {
 *   "urls": ["https://example.com", "https://example2.com"],
 *   "config": {
 *     "forceReprocess": false,
 *     "ttlHours": 24,
 *     "cacheDir": "/path/to/cache"
 *   }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "references": [
 *     {
 *       "id": "ref-001",
 *       "url": "https://example.com",
 *       "name": "Example",
 *       "tokens": { ... },
 *       "sections": [ ... ],
 *       "status": "ready"
 *     }
 *   ],
 *   "errors": [],
 *   "processingTimeMs": 1234
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse<ProcessReferencesResponse>> {
  const startTime = Date.now();

  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          references: [],
          errors: ['Invalid JSON in request body'],
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
          references: [],
          errors: [validation.error],
        },
        { status: 400 }
      );
    }

    const { urls, config } = validation.data;

    // Process all references
    const results: ProcessReferenceResult[] = await processReferences(urls, config);

    // Extract references and collect errors
    const references: Reference[] = [];
    const errors: string[] = [];

    for (const result of results) {
      references.push(result.reference);

      // Track errors for failed references
      if (result.reference.status === 'error') {
        errors.push(`Failed to process ${result.reference.url}`);
      }
    }

    const processingTimeMs = Date.now() - startTime;

    // Return success response with all references
    // Note: Even if some references failed, we return success: true
    // Client should check individual reference.status for errors
    return NextResponse.json(
      {
        success: true,
        references,
        errors: errors.length > 0 ? errors : undefined,
        processingTimeMs,
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        references: [],
        errors: [errorMessage],
      },
      { status: 500 }
    );
  }
}
