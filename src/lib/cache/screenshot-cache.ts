/**
 * Screenshot Cache Module
 *
 * This module provides domain-based caching for website screenshots
 * with configurable TTL (default 12 hours) to avoid redundant captures.
 */

import path from 'path';
import fs from 'fs';
import type { CacheEntry, SectionInfo, CacheConfig } from '@/types';
import { CACHE_CONFIG } from '@/types';

// ====================
// CONFIGURATION
// ====================

/**
 * Get the cache directory path from environment or use default
 */
function getCacheBaseDir(): string {
  const envPath = process.env.CACHE_DIR;
  if (envPath) {
    if (envPath.startsWith('./') || envPath.startsWith('../')) {
      return path.resolve(process.cwd(), envPath);
    }
    return envPath;
  }
  return path.resolve(process.cwd(), CACHE_CONFIG.baseDir);
}

/**
 * Get TTL in hours from environment or use default
 */
function getTtlHours(): number {
  const envTtl = process.env.CACHE_TTL_HOURS;
  if (envTtl) {
    const parsed = parseInt(envTtl, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return CACHE_CONFIG.ttlHours;
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
 * Get the metadata file path for a domain
 */
function getMetadataPath(domain: string): string {
  return path.join(getDomainCacheDir(domain), 'metadata.json');
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
 * Check if cached files exist and are valid
 */
function validateCachedFiles(entry: CacheEntry, cacheDir: string): boolean {
  // Check full page screenshot exists
  const fullPagePath = path.join(cacheDir, 'screenshots', 'full-page.png');
  if (!fs.existsSync(fullPagePath)) {
    return false;
  }

  // Check section screenshots exist
  const sectionsDir = path.join(cacheDir, 'screenshots', 'sections');
  for (const section of entry.sections) {
    const sectionFileName = path.basename(section.screenshotPath);
    const sectionPath = path.join(sectionsDir, sectionFileName);
    if (!fs.existsSync(sectionPath)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a cache entry is still valid (not expired)
 */
export function isCacheValid(domain: string): boolean {
  const cacheDir = getDomainCacheDir(domain);
  const expiresPath = getExpiresPath(domain);
  const metadataPath = getMetadataPath(domain);

  // Check if cache directory and required files exist
  if (!fs.existsSync(cacheDir) || !fs.existsSync(expiresPath) || !fs.existsSync(metadataPath)) {
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

    // Validate cached files exist
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8')) as CacheEntry;
    return validateCachedFiles(metadata, cacheDir);
  } catch {
    return false;
  }
}

// ====================
// CACHE OPERATIONS
// ====================

/**
 * Get cached screenshot data for a domain
 * Returns null if cache is invalid or doesn't exist
 */
export function getCached(url: string): CacheEntry | null {
  const domain = extractDomain(url);

  if (!isCacheValid(domain)) {
    return null;
  }

  try {
    const metadataPath = getMetadataPath(domain);
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8')) as CacheEntry;
    return metadata;
  } catch {
    return null;
  }
}

/**
 * Store screenshot data in cache for a domain
 */
export function setCache(
  url: string,
  fullPagePath: string,
  sections: SectionInfo[],
  config?: Partial<CacheConfig>
): CacheEntry {
  const domain = extractDomain(url);
  const ttlHours = config?.ttlHours ?? getTtlHours();
  const cacheDir = getDomainCacheDir(domain);
  const screenshotsDir = path.join(cacheDir, 'screenshots');
  const sectionsDir = path.join(screenshotsDir, 'sections');

  // Ensure cache directories exist
  ensureDirectory(cacheDir);
  ensureDirectory(screenshotsDir);
  ensureDirectory(sectionsDir);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

  // Copy full page screenshot to cache
  const cachedFullPagePath = path.join(screenshotsDir, 'full-page.png');
  if (fs.existsSync(fullPagePath)) {
    fs.copyFileSync(fullPagePath, cachedFullPagePath);
  }

  // Copy section screenshots to cache and update paths
  const cachedSections: SectionInfo[] = sections.map((section) => {
    const sectionFileName = path.basename(section.screenshotPath);
    const cachedSectionPath = path.join(sectionsDir, sectionFileName);

    if (fs.existsSync(section.screenshotPath)) {
      fs.copyFileSync(section.screenshotPath, cachedSectionPath);
    }

    return {
      ...section,
      screenshotPath: cachedSectionPath,
    };
  });

  // Create cache entry
  const entry: CacheEntry = {
    domain,
    capturedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    fullPagePath: cachedFullPagePath,
    sections: cachedSections,
  };

  // Write metadata
  const metadataPath = getMetadataPath(domain);
  fs.writeFileSync(metadataPath, JSON.stringify(entry, null, 2), 'utf-8');

  // Write expires_at
  const expiresPath = getExpiresPath(domain);
  fs.writeFileSync(expiresPath, expiresAt.toISOString(), 'utf-8');

  return entry;
}

/**
 * Clear cache for a specific domain
 */
export function clearCache(url: string): boolean {
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
 * Clear all cached data
 */
export function clearAllCache(): boolean {
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
 * Get cache statistics
 */
export function getCacheStats(): {
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

/**
 * Copy cached screenshots to a target website directory
 * Useful for reusing cached screenshots when creating new website entries
 */
export function copyCacheToWebsite(
  url: string,
  websiteDir: string
): { fullPagePath: string; sections: SectionInfo[] } | null {
  const cachedEntry = getCached(url);

  if (!cachedEntry) {
    return null;
  }

  const referenceDir = path.join(websiteDir, 'reference');
  const sectionsDir = path.join(referenceDir, 'sections');

  // Ensure directories exist
  ensureDirectory(referenceDir);
  ensureDirectory(sectionsDir);

  // Copy full page screenshot
  const targetFullPagePath = path.join(referenceDir, 'full-page.png');
  if (fs.existsSync(cachedEntry.fullPagePath)) {
    fs.copyFileSync(cachedEntry.fullPagePath, targetFullPagePath);
  }

  // Copy section screenshots and update paths
  const targetSections: SectionInfo[] = cachedEntry.sections.map((section) => {
    const sectionFileName = path.basename(section.screenshotPath);
    const targetSectionPath = path.join(sectionsDir, sectionFileName);

    if (fs.existsSync(section.screenshotPath)) {
      fs.copyFileSync(section.screenshotPath, targetSectionPath);
    }

    return {
      ...section,
      screenshotPath: targetSectionPath,
    };
  });

  return {
    fullPagePath: targetFullPagePath,
    sections: targetSections,
  };
}
