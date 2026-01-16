/**
 * Token API Endpoints
 *
 * Provides endpoints for getting and updating design tokens.
 * GET: Retrieve current design tokens for a URL
 * PUT: Update/save modified design tokens
 * Automatically creates v1.x versions when tokens are edited for a website
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokens, setTokens, extractDomain } from '@/lib/cache/token-cache';
import { getDefaultDesignSystem } from '@/lib/design-system/synthesizer';
import {
  createNewVersion,
  getNextVersionNumber,
  getCurrentPath,
  listVersions
} from '@/lib/versioning';
import fs from 'fs';
import path from 'path';
import type { DesignSystem } from '@/types';

// ====================
// GET /api/tokens
// ====================

/**
 * Get design tokens for a given URL
 *
 * Query parameters:
 * - url: The URL to get tokens for (required)
 *
 * Returns:
 * - 200: Tokens found in cache
 * - 400: Missing URL parameter
 * - 404: No tokens found for URL
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'Missing required parameter: url' },
        { status: 400 }
      );
    }

    // Try to get cached tokens
    const cached = getTokens(url);

    if (cached) {
      return NextResponse.json({
        success: true,
        source: 'cache',
        domain: cached.domain,
        extractedAt: cached.extractedAt,
        expiresAt: cached.expiresAt,
        tokens: cached.tokens,
      });
    }

    // No cached tokens found
    return NextResponse.json(
      {
        success: false,
        error: 'No tokens found for URL',
        domain: extractDomain(url),
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error getting tokens:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tokens',
      },
      { status: 500 }
    );
  }
}

// ====================
// PUT /api/tokens
// ====================

/**
 * Save/update design tokens
 *
 * Request body:
 * - url: The source URL for these tokens (required)
 * - tokens: The DesignSystem object to save (required)
 * - ttlHours: Optional TTL in hours (default: 24)
 * - websiteId: Optional website ID for automatic version creation
 *
 * Returns:
 * - 200: Tokens saved successfully
 * - 400: Invalid request body
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, tokens, ttlHours, websiteId } = body;

    // Validate required fields
    if (!url) {
      return NextResponse.json(
        { error: 'Missing required field: url' },
        { status: 400 }
      );
    }

    if (!tokens) {
      return NextResponse.json(
        { error: 'Missing required field: tokens' },
        { status: 400 }
      );
    }

    // Validate tokens structure
    if (!isValidDesignSystem(tokens)) {
      return NextResponse.json(
        { error: 'Invalid tokens structure' },
        { status: 400 }
      );
    }

    // Save tokens to cache
    const cacheEntry = setTokens(url, tokens as DesignSystem, {
      ttlHours: ttlHours ?? 24,
    });

    // If websiteId is provided, create a new version automatically
    let versionCreated = false;
    let versionNumber: string | undefined;
    let versionError: string | undefined;

    if (websiteId) {
      try {
        // Check if versions exist (we should have at least v1.0)
        const existingVersions = listVersions(websiteId);

        if (existingVersions.length === 0) {
          // No versions exist yet - skip version creation
          // This shouldn't happen in normal flow, but handle gracefully
          versionError = 'No initial version exists for this website';
        } else {
          // Get the current/ directory as the source
          const currentPath = getCurrentPath(websiteId);

          // Verify current/ exists
          if (!fs.existsSync(currentPath)) {
            throw new Error('Current version directory not found');
          }

          // Get next version number with 'edit' change type (1.0 -> 1.1, 1.1 -> 1.2, etc.)
          versionNumber = getNextVersionNumber(websiteId, 'edit');

          // Create new version from current/ directory
          const versionResult = createNewVersion({
            websiteId,
            versionNumber,
            sourceDir: currentPath,
            tokensJson: JSON.stringify(tokens),
            changelog: 'Updated design tokens',
            setActive: true,
          });

          // Update the design-system.json file in the new version directory
          const designSystemPath = path.join(
            versionResult.versionPath,
            'design-system.json'
          );
          fs.writeFileSync(
            designSystemPath,
            JSON.stringify(tokens, null, 2),
            'utf-8'
          );

          versionCreated = true;
        }
      } catch (error) {
        // Log error but don't fail the token save
        // The cache update succeeded, version creation is supplementary
        versionError = error instanceof Error
          ? error.message
          : 'Unknown version creation error';
      }
    }

    return NextResponse.json({
      success: true,
      domain: cacheEntry.domain,
      extractedAt: cacheEntry.extractedAt,
      expiresAt: cacheEntry.expiresAt,
      versionCreated,
      versionNumber,
      versionError,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save tokens',
      },
      { status: 500 }
    );
  }
}

// ====================
// VALIDATION
// ====================

/**
 * Validate that an object is a valid DesignSystem
 */
function isValidDesignSystem(obj: unknown): obj is DesignSystem {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const ds = obj as Record<string, unknown>;

  // Check required top-level properties
  if (!ds.meta || typeof ds.meta !== 'object') {
    return false;
  }

  if (!ds.colors || typeof ds.colors !== 'object') {
    return false;
  }

  if (!ds.typography || typeof ds.typography !== 'object') {
    return false;
  }

  if (!ds.spacing || typeof ds.spacing !== 'object') {
    return false;
  }

  if (!ds.effects || typeof ds.effects !== 'object') {
    return false;
  }

  return true;
}
