/**
 * Template Generation API Route
 *
 * POST /api/template/generate
 * Generates a complete website from multiple reference sources.
 * This is the main entry point for Template Mode generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateTemplate, type GenerateTemplateOptions, type TemplateGenerationProgress } from '@/lib/template';
import { isValidUrl } from '@/lib/utils';
import type { SectionMapping } from '@/types';

/**
 * Request body for template generation
 */
interface GenerateTemplateRequest {
  projectName: string;
  referenceUrls: string[];
  sectionMapping: SectionMapping;
  primaryTokenSourceIndex?: number;
  forceReprocess?: boolean;
  skipHarmonyCheck?: boolean;
  minHarmonyScore?: number;
}

/**
 * Response body for template generation
 */
interface GenerateTemplateResponse {
  success: boolean;
  projectId?: string;
  projectName?: string;
  harmonyScore?: number | null;
  outputPath?: string;
  errors?: string[];
  warnings?: string[];
  metadata?: {
    totalReferences: number;
    totalSections: number;
    processingTimeMs: number;
    generatedAt: string;
  };
  error?: string;
}

/**
 * Validate the request body for template generation
 */
function validateRequest(
  body: unknown
): { valid: true; data: GenerateTemplateRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const data = body as Record<string, unknown>;

  // Validate projectName
  if (!data.projectName || typeof data.projectName !== 'string' || data.projectName.trim().length === 0) {
    return { valid: false, error: 'Project name is required' };
  }

  // Validate referenceUrls
  if (!Array.isArray(data.referenceUrls) || data.referenceUrls.length === 0) {
    return { valid: false, error: 'At least one reference URL is required' };
  }

  // Validate each URL
  for (const url of data.referenceUrls) {
    if (typeof url !== 'string' || !isValidUrl(url)) {
      return { valid: false, error: `Invalid URL format: ${url}` };
    }
  }

  // Validate sectionMapping
  if (!data.sectionMapping || typeof data.sectionMapping !== 'object' || Array.isArray(data.sectionMapping)) {
    return { valid: false, error: 'Section mapping is required and must be an object' };
  }

  // Validate primaryTokenSourceIndex
  if (data.primaryTokenSourceIndex !== undefined) {
    if (typeof data.primaryTokenSourceIndex !== 'number' || data.primaryTokenSourceIndex < 0 || data.primaryTokenSourceIndex >= data.referenceUrls.length) {
      return { valid: false, error: 'Primary token source index is invalid or out of bounds' };
    }
  }

  // Validate minHarmonyScore
  if (data.minHarmonyScore !== undefined) {
    if (typeof data.minHarmonyScore !== 'number' || data.minHarmonyScore < 0 || data.minHarmonyScore > 100) {
      return { valid: false, error: 'Minimum harmony score must be between 0 and 100' };
    }
  }

  return {
    valid: true,
    data: {
      projectName: data.projectName as string,
      referenceUrls: data.referenceUrls as string[],
      sectionMapping: data.sectionMapping as SectionMapping,
      primaryTokenSourceIndex: data.primaryTokenSourceIndex as number | undefined,
      forceReprocess: Boolean(data.forceReprocess),
      skipHarmonyCheck: Boolean(data.skipHarmonyCheck),
      minHarmonyScore: data.minHarmonyScore as number | undefined,
    },
  };
}

/**
 * POST /api/template/generate
 * Generate a template website from multiple reference sources
 */
export async function POST(request: NextRequest): Promise<NextResponse<GenerateTemplateResponse>> {
  try {
    // Parse request body
    const body = await request.json();

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

    const { data } = validation;

    // Prepare generation options
    const options: GenerateTemplateOptions = {
      projectName: data.projectName,
      referenceUrls: data.referenceUrls,
      sectionMapping: data.sectionMapping,
      primaryTokenSourceIndex: data.primaryTokenSourceIndex,
      forceReprocess: data.forceReprocess,
      skipHarmonyCheck: data.skipHarmonyCheck,
      minHarmonyScore: data.minHarmonyScore,
      onProgress: (progress: TemplateGenerationProgress) => {
        // Progress updates could be sent via SSE or stored for polling
        // For now, we just log them
        console.log(`[Template Generation] ${progress.phase}: ${progress.percent}% - ${progress.message}`);
      },
    };

    // Generate template
    const result = await generateTemplate(options);

    // Return result
    if (result.success) {
      return NextResponse.json({
        success: true,
        projectId: result.projectId,
        projectName: result.projectName,
        harmonyScore: result.harmonyScore,
        outputPath: result.outputPath,
        errors: result.errors.map((e) => e.message),
        warnings: result.warnings,
        metadata: result.metadata,
      });
    } else {
      // Generation failed but we have detailed error information
      return NextResponse.json(
        {
          success: false,
          projectId: result.projectId,
          projectName: result.projectName,
          errors: result.errors.map((e) => e.message),
          warnings: result.warnings,
          metadata: result.metadata,
          error: result.errors.length > 0 ? result.errors[0].message : 'Template generation failed',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
