/**
 * Playwright Module Exports
 *
 * This module provides a unified export point for all Playwright-related
 * functionality including capture, scrolling, section detection, and caching.
 */

// ====================
// MAIN CAPTURE
// ====================

export {
  captureWebsite,
  getReferenceDir,
  getSectionsDir,
  type CaptureOptions,
} from './capture';

// ====================
// SCROLL LOADER
// ====================

export {
  autoScroll,
  waitForImages,
  waitForFonts,
  waitForAnimations,
  waitForContentComplete,
  dismissCookieConsent,
} from './scroll-loader';

// ====================
// SECTION DETECTOR
// ====================

export {
  detectSections,
  detectGenericSections,
  detectAllSections,
  getPageDimensions,
  isInViewport,
} from './section-detector';

// ====================
// CACHE RE-EXPORTS
// ====================

export {
  getCached,
  setCache,
  isCacheValid,
  clearCache,
  extractDomain,
  clearAllCache,
  getCacheStats,
  copyCacheToWebsite,
} from '@/lib/cache';

// ====================
// TYPE RE-EXPORTS
// ====================

export type {
  CaptureProgress,
  CaptureResult,
  CapturePhase,
  SectionInfo,
  SectionType,
  CacheEntry,
  CacheConfig,
} from '@/types';
