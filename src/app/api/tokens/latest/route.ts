/**
 * Latest Token API Endpoint
 *
 * Provides endpoint for getting the most recently cached tokens
 * or generating default tokens for immediate use.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenCacheStats, getTokens, extractDomain } from '@/lib/cache/token-cache';
import { getDefaultDesignSystem } from '@/lib/design-system/synthesizer';
import fs from 'fs';
import path from 'path';

// ====================
// GET /api/tokens/latest
// ====================

/**
 * Get the most recently cached tokens
 *
 * Query parameters:
 * - fallbackUrl: URL to use if no cached tokens exist (optional)
 *
 * Returns:
 * - 200: Latest tokens (from cache or defaults)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fallbackUrl = searchParams.get('fallbackUrl') || 'default';

    // Get cache stats to find domains
    const stats = getTokenCacheStats();

    if (stats.validDomains > 0) {
      // Find the most recently cached tokens
      const latestEntry = findLatestCachedTokens(stats.cacheDir);

      if (latestEntry) {
        return NextResponse.json({
          success: true,
          source: 'cache',
          domain: latestEntry.domain,
          extractedAt: latestEntry.extractedAt,
          expiresAt: latestEntry.expiresAt,
          tokens: latestEntry.tokens,
        });
      }
    }

    // No cached tokens, return defaults
    const defaultTokens = getDefaultDesignSystem(fallbackUrl);

    return NextResponse.json({
      success: true,
      source: 'default',
      domain: 'default',
      extractedAt: defaultTokens.meta.extractedAt,
      expiresAt: null,
      tokens: defaultTokens,
    });
  } catch (error) {
    console.error('Error getting latest tokens:', error);

    // Even on error, return defaults
    const defaultTokens = getDefaultDesignSystem('default');

    return NextResponse.json({
      success: true,
      source: 'default',
      domain: 'default',
      extractedAt: defaultTokens.meta.extractedAt,
      expiresAt: null,
      tokens: defaultTokens,
    });
  }
}

// ====================
// HELPERS
// ====================

interface CachedEntry {
  domain: string;
  extractedAt: string;
  expiresAt: string;
  tokens: unknown;
}

/**
 * Find the most recently cached tokens from the cache directory
 */
function findLatestCachedTokens(cacheDir: string): CachedEntry | null {
  try {
    if (!fs.existsSync(cacheDir)) {
      return null;
    }

    const entries = fs.readdirSync(cacheDir, { withFileTypes: true });
    let latestEntry: CachedEntry | null = null;
    let latestTime = 0;

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const domain = entry.name;
      const tokensPath = path.join(cacheDir, domain, 'tokens.json');
      const expiresPath = path.join(cacheDir, domain, 'expires_at.txt');

      if (!fs.existsSync(tokensPath) || !fs.existsSync(expiresPath)) {
        continue;
      }

      try {
        // Check if not expired
        const expiresAt = fs.readFileSync(expiresPath, 'utf-8').trim();
        const expiresDate = new Date(expiresAt);
        const now = new Date();

        if (now >= expiresDate) {
          continue; // Expired
        }

        // Check modification time
        const stat = fs.statSync(tokensPath);
        const modTime = stat.mtimeMs;

        if (modTime > latestTime) {
          const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
          latestTime = modTime;
          latestEntry = {
            domain,
            extractedAt: tokens.meta?.extractedAt || new Date().toISOString(),
            expiresAt,
            tokens,
          };
        }
      } catch {
        // Skip invalid entries
        continue;
      }
    }

    return latestEntry;
  } catch {
    return null;
  }
}
