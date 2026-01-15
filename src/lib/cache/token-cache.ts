/**
 * Token Cache Module
 *
 * This module provides domain-based caching for design system tokens
 * with configurable TTL (default 24 hours) to avoid redundant extractions.
 */

import path from 'path';
import fs from 'fs';
import type { DesignSystem } from '@/types';
import { TOKEN_CACHE_CONFIG } from '@/types';

// ====================
// TYPES
// ====================

export interface TokenCacheEntry {
  domain: string;
  extractedAt: string;
  expiresAt: string;
  tokens: DesignSystem;
}

export interface TokenCacheConfig {
  ttlHours: number;
  cacheDir: string;
}

// ====================
// CONFIGURATION
// ====================

/**
 * Get the cache directory path from environment or use default
 */
function getCacheBaseDir(): string {
  const envPath = process.env.TOKEN_CACHE_DIR;
  if (envPath) {
    if (envPath.startsWith('./') || envPath.startsWith('../')) {
      return path.resolve(process.cwd(), envPath);
    }
    return envPath;
  }
  return path.resolve(process.cwd(), TOKEN_CACHE_CONFIG.baseDir);
}

/**
 * Get TTL in hours from environment or use default
 */
function getTtlHours(): number {
  const envTtl = process.env.TOKEN_CACHE_TTL_HOURS;
  if (envTtl) {
    const parsed = parseInt(envTtl, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return TOKEN_CACHE_CONFIG.ttlHours;
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove www. prefix for consistency
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    // If URL parsing fails, try to extract domain from string
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
    return match ? match[1] : url;
  }
}

/**
 * Ensure directory exists before writing
 */
function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Get the cache directory path for a domain
 */
function getDomainCacheDir(domain: string): string {
  return path.join(getCacheBaseDir(), domain);
}

/**
 * Get the tokens file path for a domain
 */
function getTokensPath(domain: string): string {
  return path.join(getDomainCacheDir(domain), 'tokens.json');
}

/**
 * Get the expires_at file path for a domain
 */
function getExpiresPath(domain: string): string {
  return path.join(getDomainCacheDir(domain), 'expires_at.txt');
}

// ====================
// CACHE VALIDATION
// ====================

/**
 * Check if a cache entry is still valid (not expired)
 */
export function isCacheValid(domain: string): boolean {
  const cacheDir = getDomainCacheDir(domain);
  const expiresPath = getExpiresPath(domain);
  const tokensPath = getTokensPath(domain);

  // Check if cache directory and required files exist
  if (!fs.existsSync(cacheDir) || !fs.existsSync(expiresPath) || !fs.existsSync(tokensPath)) {
    return false;
  }

  try {
    // Check expiration time
    const expiresAt = fs.readFileSync(expiresPath, 'utf-8').trim();
    const expiresDate = new Date(expiresAt);
    const now = new Date();

    if (now >= expiresDate) {
      return false;
    }

    // Validate tokens file is valid JSON
    const tokensContent = fs.readFileSync(tokensPath, 'utf-8');
    JSON.parse(tokensContent);
    return true;
  } catch {
    return false;
  }
}

// ====================
// CACHE OPERATIONS
// ====================

/**
 * Get cached token data for a domain
 * Returns null if cache is invalid or doesn't exist
 */
export function getTokens(url: string): TokenCacheEntry | null {
  const domain = extractDomain(url);

  if (!isCacheValid(domain)) {
    return null;
  }

  try {
    const tokensPath = getTokensPath(domain);
    const expiresPath = getExpiresPath(domain);

    const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8')) as DesignSystem;
    const expiresAt = fs.readFileSync(expiresPath, 'utf-8').trim();

    return {
      domain,
      extractedAt: tokens.meta.extractedAt,
      expiresAt,
      tokens,
    };
  } catch {
    return null;
  }
}

/**
 * Store token data in cache for a domain
 */
export function setTokens(
  url: string,
  tokens: DesignSystem,
  config?: Partial<TokenCacheConfig>
): TokenCacheEntry {
  const domain = extractDomain(url);
  const ttlHours = config?.ttlHours ?? getTtlHours();
  const cacheDir = getDomainCacheDir(domain);

  // Ensure cache directory exists
  ensureDirectory(cacheDir);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

  // Update tokens meta if not already set
  const tokensWithMeta: DesignSystem = {
    ...tokens,
    meta: {
      ...tokens.meta,
      extractedAt: tokens.meta.extractedAt || now.toISOString(),
    },
  };

  // Write tokens
  const tokensPath = getTokensPath(domain);
  fs.writeFileSync(tokensPath, JSON.stringify(tokensWithMeta, null, 2), 'utf-8');

  // Write expires_at
  const expiresPath = getExpiresPath(domain);
  fs.writeFileSync(expiresPath, expiresAt.toISOString(), 'utf-8');

  return {
    domain,
    extractedAt: tokensWithMeta.meta.extractedAt,
    expiresAt: expiresAt.toISOString(),
    tokens: tokensWithMeta,
  };
}

/**
 * Clear cache for a specific domain
 */
export function clearTokens(url: string): boolean {
  const domain = extractDomain(url);
  const cacheDir = getDomainCacheDir(domain);

  if (!fs.existsSync(cacheDir)) {
    return false;
  }

  try {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear all cached token data
 */
export function clearAllTokens(): boolean {
  const baseDir = getCacheBaseDir();

  if (!fs.existsSync(baseDir)) {
    return false;
  }

  try {
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const domainDir = path.join(baseDir, entry.name);
        fs.rmSync(domainDir, { recursive: true, force: true });
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get token cache statistics
 */
export function getTokenCacheStats(): {
  totalDomains: number;
  validDomains: number;
  expiredDomains: number;
  cacheDir: string;
} {
  const baseDir = getCacheBaseDir();
  let totalDomains = 0;
  let validDomains = 0;
  let expiredDomains = 0;

  if (fs.existsSync(baseDir)) {
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        totalDomains++;
        if (isCacheValid(entry.name)) {
          validDomains++;
        } else {
          expiredDomains++;
        }
      }
    }
  }

  return {
    totalDomains,
    validDomains,
    expiredDomains,
    cacheDir: baseDir,
  };
}
