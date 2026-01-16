/**
 * Reference Processor Module
 *
 * This module processes and caches reference websites for Template Mode.
 * It captures website screenshots, extracts design tokens, detects sections,
 * and caches the results for efficient reuse across template projects.
 */

import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { Reference, DesignSystem, SectionInfo, RawPageData } from '@/types';
import { captureWebsite, extractDomain } from '@/lib/playwright';
import { synthesizeDesignSystem } from '@/lib/design-system/synthesizer';
import { getTokens, setTokens, isTokenCacheValid } from '@/lib/cache/token-cache';

// ====================
// TYPES
// ====================

/**
 * Configuration for reference processing
 */
export interface ReferenceProcessorConfig {
  /** Cache TTL in hours (default: 24) */
  ttlHours?: number;
  /** Force reprocess even if cache exists */
  forceReprocess?: boolean;
  /** Cache directory override */
  cacheDir?: string;
}

/**
 * Result of reference processing
 */
export interface ProcessReferenceResult {
  reference: Reference;
  cacheHit: boolean;
  processingTimeMs?: number;
}

/**
 * Cached reference data structure
 */
export interface ReferenceCacheEntry {
  id: string;
  url: string;
  domain: string;
  name: string;
  tokens: DesignSystem;
  sections: SectionInfo[];
  cachedAt: string;
  expiresAt: string;
}

// ====================
// CONFIGURATION
// ====================

const PROCESSOR_CONFIG = {
  /** Default cache TTL in hours */
  defaultTtlHours: 24,
  /** Reference cache subdirectory */
  referenceCacheSubdir: 'references',
  /** Reference data filename */
  referenceDataFile: 'reference.json',
  /** Expiry filename */
  expiryFile: 'expires_at.txt',
} as const;

// ====================
// CACHE UTILITIES
// ====================

/**
 * Get the base cache directory for references
 */
function getReferenceCacheBaseDir(): string {
  const envPath = process.env.TOKEN_CACHE_DIR;
  const baseDir = envPath
    ? envPath.startsWith('./')
      ? path.resolve(process.cwd(), envPath)
      : envPath
    : path.resolve(process.cwd(), 'cache');

  return path.join(baseDir, PROCESSOR_CONFIG.referenceCacheSubdir);
}

/**
 * Get the cache directory for a specific domain
 */
function getReferenceCacheDir(domain: string): string {
  return path.join(getReferenceCacheBaseDir(), domain);
}

/**
 * Get the reference data file path
 */
function getReferenceDataPath(domain: string): string {
  return path.join(getReferenceCacheDir(domain), PROCESSOR_CONFIG.referenceDataFile);
}

/**
 * Get the expiry file path
 */
function getReferenceExpiryPath(domain: string): string {
  return path.join(getReferenceCacheDir(domain), PROCESSOR_CONFIG.expiryFile);
}

/**
 * Ensure directory exists
 */
function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Generate a friendly name from URL
 */
export function generateReferenceName(url: string): string {
  try {
    const domain = extractDomain(url);
    // Capitalize first letter of domain name
    const parts = domain.split('.');
    const name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    return name;
  } catch {
    return 'Reference Site';
  }
}

// ====================
// CACHE VALIDATION
// ====================

/**
 * Check if a reference cache entry is valid
 */
export function isReferenceCacheValid(url: string): boolean {
  const domain = extractDomain(url);
  const dataPath = getReferenceDataPath(domain);
  const expiryPath = getReferenceExpiryPath(domain);

  // Check if files exist
  if (!fs.existsSync(dataPath) || !fs.existsSync(expiryPath)) {
    return false;
  }

  try {
    // Check expiration
    const expiresAt = fs.readFileSync(expiryPath, 'utf-8').trim();
    const expiresDate = new Date(expiresAt);
    const now = new Date();

    if (now >= expiresDate) {
      return false;
    }

    // Validate data file is parseable
    const data = fs.readFileSync(dataPath, 'utf-8');
    JSON.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get cached reference data
 */
export function getCachedReference(url: string): ReferenceCacheEntry | null {
  const domain = extractDomain(url);

  if (!isReferenceCacheValid(url)) {
    return null;
  }

  try {
    const dataPath = getReferenceDataPath(domain);
    const expiryPath = getReferenceExpiryPath(domain);

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as ReferenceCacheEntry;
    const expiresAt = fs.readFileSync(expiryPath, 'utf-8').trim();

    return {
      ...data,
      expiresAt,
    };
  } catch {
    return null;
  }
}

/**
 * Store reference data in cache
 */
function setCachedReference(
  url: string,
  reference: Reference,
  config?: ReferenceProcessorConfig
): ReferenceCacheEntry {
  const domain = extractDomain(url);
  const ttlHours = config?.ttlHours ?? PROCESSOR_CONFIG.defaultTtlHours;
  const cacheDir = getReferenceCacheDir(domain);

  // Ensure cache directory exists
  ensureDirectory(cacheDir);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

  const cacheEntry: ReferenceCacheEntry = {
    id: reference.id,
    url: reference.url,
    domain,
    name: reference.name,
    tokens: reference.tokens,
    sections: reference.sections,
    cachedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  // Write data file
  const dataPath = getReferenceDataPath(domain);
  fs.writeFileSync(dataPath, JSON.stringify(cacheEntry, null, 2), 'utf-8');

  // Write expiry file
  const expiryPath = getReferenceExpiryPath(domain);
  fs.writeFileSync(expiryPath, expiresAt.toISOString(), 'utf-8');

  return cacheEntry;
}

// ====================
// REFERENCE PROCESSING
// ====================

/**
 * Process a reference website and extract design tokens and sections
 */
export async function processReference(
  url: string,
  config?: ReferenceProcessorConfig
): Promise<ProcessReferenceResult> {
  const startTime = Date.now();
  const domain = extractDomain(url);

  // Check cache first (unless force reprocess)
  if (!config?.forceReprocess && isReferenceCacheValid(url)) {
    const cached = getCachedReference(url);
    if (cached) {
      const reference: Reference = {
        id: cached.id,
        url: cached.url,
        name: cached.name,
        tokens: cached.tokens,
        sections: cached.sections,
        status: 'ready',
      };

      return {
        reference,
        cacheHit: true,
      };
    }
  }

  // Process the reference website
  try {
    // Capture website (screenshots + sections + raw data)
    const captureResult = await captureWebsite({
      url,
      outputDir: getReferenceCacheDir(domain),
      forceRecapture: config?.forceReprocess ?? false,
    });

    if (captureResult.error) {
      throw new Error(captureResult.error);
    }

    // Extract design tokens from raw data
    let tokens: DesignSystem;

    // First check if tokens are already cached
    if (!config?.forceReprocess && isTokenCacheValid(url)) {
      const cachedTokens = getTokens(url);
      if (cachedTokens) {
        tokens = cachedTokens.tokens;
      } else {
        // Fallback: synthesize from raw data
        tokens = synthesizeDesignSystem(captureResult.rawData || undefined, url);
      }
    } else {
      // Synthesize design system from raw data
      tokens = synthesizeDesignSystem(captureResult.rawData || undefined, url);

      // Cache the tokens for future use
      setTokens(url, tokens, { ttlHours: config?.ttlHours });
    }

    // Create reference object
    const reference: Reference = {
      id: uuidv4(),
      url,
      name: generateReferenceName(url),
      tokens,
      sections: captureResult.sections,
      status: 'ready',
    };

    // Cache the complete reference
    setCachedReference(url, reference, config);

    const processingTimeMs = Date.now() - startTime;

    return {
      reference,
      cacheHit: false,
      processingTimeMs,
    };
  } catch (error) {
    // Return error reference
    const reference: Reference = {
      id: uuidv4(),
      url,
      name: generateReferenceName(url),
      tokens: {} as DesignSystem, // Empty tokens on error
      sections: [],
      status: 'error',
    };

    return {
      reference,
      cacheHit: false,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Process multiple references in parallel
 */
export async function processReferences(
  urls: string[],
  config?: ReferenceProcessorConfig
): Promise<ProcessReferenceResult[]> {
  const promises = urls.map((url) => processReference(url, config));
  return Promise.all(promises);
}

/**
 * Clear cached reference data for a specific URL
 */
export function clearReferenceCache(url: string): boolean {
  const domain = extractDomain(url);
  const cacheDir = getReferenceCacheDir(domain);

  try {
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Clear all cached references
 */
export function clearAllReferenceCaches(): number {
  const baseDir = getReferenceCacheBaseDir();
  let clearedCount = 0;

  try {
    if (fs.existsSync(baseDir)) {
      const domains = fs.readdirSync(baseDir);
      for (const domain of domains) {
        const domainDir = path.join(baseDir, domain);
        if (fs.statSync(domainDir).isDirectory()) {
          fs.rmSync(domainDir, { recursive: true, force: true });
          clearedCount++;
        }
      }
    }
    return clearedCount;
  } catch {
    return clearedCount;
  }
}

/**
 * Get cache statistics
 */
export function getReferenceCacheStats(): {
  totalCached: number;
  totalSizeBytes: number;
  domains: string[];
} {
  const baseDir = getReferenceCacheBaseDir();
  let totalCached = 0;
  let totalSizeBytes = 0;
  const domains: string[] = [];

  try {
    if (fs.existsSync(baseDir)) {
      const entries = fs.readdirSync(baseDir);
      for (const entry of entries) {
        const entryPath = path.join(baseDir, entry);
        if (fs.statSync(entryPath).isDirectory()) {
          totalCached++;
          domains.push(entry);

          // Calculate directory size
          const files = fs.readdirSync(entryPath);
          for (const file of files) {
            const filePath = path.join(entryPath, file);
            if (fs.statSync(filePath).isFile()) {
              totalSizeBytes += fs.statSync(filePath).size;
            }
          }
        }
      }
    }
  } catch {
    // Return defaults on error
  }

  return {
    totalCached,
    totalSizeBytes,
    domains,
  };
}

// ====================
// EXPORTS
// ====================

export {
  extractDomain,
};
