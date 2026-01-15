/**
 * Cache Module Exports
 *
 * Domain-based screenshot caching with configurable TTL.
 */

export {
  extractDomain,
  isCacheValid,
  getCached,
  setCache,
  clearCache,
  clearAllCache,
  getCacheStats,
  copyCacheToWebsite,
} from './screenshot-cache';
