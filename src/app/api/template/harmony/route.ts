/**
 * Harmony Calculation API Endpoint
 *
 * Provides endpoint for calculating visual harmony scores between multiple
 * reference websites. Analyzes color compatibility, typography consistency,
 * and spacing alignment.
 *
 * POST: Calculate harmony score for given references and section mapping
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateHarmony, canCalculateHarmony, type HarmonyCheckOptions } from '@/lib/template/harmony-checker';
import type { Reference, SectionMapping } from '@/types';

// ====================
// POST /api/template/harmony
// ====================

/**
 * Calculate visual harmony score between references
 *
 * Request body:
 * - references: Array of Reference objects (required, min 2)
 * - sectionMapping: Optional mapping of sections to references
 * - options: Optional HarmonyCheckOptions for custom thresholds/weights
 *
 * Returns:
 * - 200: Harmony calculated successfully
 * - 400: Invalid request body
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { references, sectionMapping, options } = body;

    // Validate required fields
    if (!references) {
      return NextResponse.json(
        { error: 'Missing required field: references' },
        { status: 400 }
      );
    }

    if (!Array.isArray(references)) {
      return NextResponse.json(
        { error: 'Invalid references: must be an array' },
        { status: 400 }
      );
    }

    if (references.length < 2) {
      return NextResponse.json(
        { error: 'Invalid references: must provide at least 2 references' },
        { status: 400 }
      );
    }

    // Validate references are properly structured
    if (!isValidReferencesArray(references)) {
      return NextResponse.json(
        { error: 'Invalid references structure: each reference must have id, name, tokens, sections, and status' },
        { status: 400 }
      );
    }

    // Check if references are ready for harmony calculation
    if (!canCalculateHarmony(references)) {
      return NextResponse.json(
        {
          success: false,
          error: 'References not ready for harmony analysis',
          details: 'Ensure all references have status "ready" with complete token data',
          score: 0,
        },
        { status: 400 }
      );
    }

    // Validate section mapping if provided
    if (sectionMapping !== undefined && !isValidSectionMapping(sectionMapping)) {
      return NextResponse.json(
        { error: 'Invalid sectionMapping: must be an object mapping section types to reference IDs' },
        { status: 400 }
      );
    }

    // Validate options if provided
    if (options !== undefined && !isValidHarmonyOptions(options)) {
      return NextResponse.json(
        { error: 'Invalid options: check threshold and weight values' },
        { status: 400 }
      );
    }

    // Calculate harmony
    const result = calculateHarmony(
      references as Reference[],
      sectionMapping as SectionMapping | undefined,
      options as HarmonyCheckOptions | undefined
    );

    return NextResponse.json({
      success: true,
      result: {
        score: result.score,
        breakdown: result.breakdown,
        issues: result.issues,
        suggestions: result.suggestions,
        referencesAnalyzed: result.referencesAnalyzed,
        sectionsAnalyzed: result.sectionsAnalyzed,
      },
    });
  } catch (error) {
    console.error('Error calculating harmony:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate harmony',
      },
      { status: 500 }
    );
  }
}

// ====================
// VALIDATION
// ====================

/**
 * Validate that an array contains valid Reference objects
 */
function isValidReferencesArray(arr: unknown): arr is Reference[] {
  if (!Array.isArray(arr)) {
    return false;
  }

  return arr.every(ref => {
    if (!ref || typeof ref !== 'object') {
      return false;
    }

    const r = ref as Record<string, unknown>;

    // Check required properties
    if (typeof r.id !== 'string') return false;
    if (typeof r.name !== 'string') return false;
    if (typeof r.url !== 'string') return false;
    if (typeof r.status !== 'string') return false;

    // Check tokens structure
    if (!r.tokens || typeof r.tokens !== 'object') return false;
    const tokens = r.tokens as Record<string, unknown>;
    if (!tokens.colors || typeof tokens.colors !== 'object') return false;
    if (!tokens.typography || typeof tokens.typography !== 'object') return false;
    if (!tokens.spacing || typeof tokens.spacing !== 'object') return false;

    // Check sections array
    if (!Array.isArray(r.sections)) return false;

    return true;
  });
}

/**
 * Validate that an object is a valid SectionMapping
 */
function isValidSectionMapping(obj: unknown): obj is SectionMapping {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // All values should be strings (reference IDs)
  return Object.values(obj).every(value => typeof value === 'string');
}

/**
 * Validate that an object is valid HarmonyCheckOptions
 */
function isValidHarmonyOptions(obj: unknown): obj is HarmonyCheckOptions {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const opts = obj as Record<string, unknown>;

  // Check thresholds are numbers between 0-100
  if (opts.colorThreshold !== undefined) {
    if (typeof opts.colorThreshold !== 'number' || opts.colorThreshold < 0 || opts.colorThreshold > 100) {
      return false;
    }
  }

  if (opts.typographyThreshold !== undefined) {
    if (typeof opts.typographyThreshold !== 'number' || opts.typographyThreshold < 0 || opts.typographyThreshold > 100) {
      return false;
    }
  }

  if (opts.spacingThreshold !== undefined) {
    if (typeof opts.spacingThreshold !== 'number' || opts.spacingThreshold < 0 || opts.spacingThreshold > 100) {
      return false;
    }
  }

  // Check weights are numbers between 0-1
  if (opts.colorWeight !== undefined) {
    if (typeof opts.colorWeight !== 'number' || opts.colorWeight < 0 || opts.colorWeight > 1) {
      return false;
    }
  }

  if (opts.typographyWeight !== undefined) {
    if (typeof opts.typographyWeight !== 'number' || opts.typographyWeight < 0 || opts.typographyWeight > 1) {
      return false;
    }
  }

  if (opts.spacingWeight !== undefined) {
    if (typeof opts.spacingWeight !== 'number' || opts.spacingWeight < 0 || opts.spacingWeight > 1) {
      return false;
    }
  }

  return true;
}
