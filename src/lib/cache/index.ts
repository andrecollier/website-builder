/**
 * Cache Module Exports
 *
 * Domain-based caching for screenshots and design tokens with configurable TTL.
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

export {
  extractDomain as extractTokenDomain,
  isCacheValid as isTokenCacheValid,
  getTokens,
  setTokens,
  clearTokens,
  clearAllTokens,
  getTokenCacheStats,
} from './token-cache';

export type { TokenCacheEntry, TokenCacheConfig } from './token-cache';
