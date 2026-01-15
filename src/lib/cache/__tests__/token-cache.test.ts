/**
 * Token Cache Tests
 *
 * Tests for domain-based token caching including TTL handling,
 * domain extraction, cache validity checking, and cache operations.
 */

import path from 'path';
import fs from 'fs';
import {
  extractDomain,
  isCacheValid,
  getTokens,
  setTokens,
  clearTokens,
  clearAllTokens,
  getTokenCacheStats,
} from '../token-cache';
import { getDefaultDesignSystem } from '@/lib/design-system/synthesizer';

// Use a test cache directory
const TEST_CACHE_DIR = path.join(process.cwd(), 'test-cache-tokens');

describe('Token Cache', () => {
  // Setup and teardown for tests
  beforeAll(() => {
    // Set environment variable for test cache directory
    process.env.TOKEN_CACHE_DIR = TEST_CACHE_DIR;
  });

  afterAll(() => {
    // Clean up test cache directory
    if (fs.existsSync(TEST_CACHE_DIR)) {
      fs.rmSync(TEST_CACHE_DIR, { recursive: true, force: true });
    }
    delete process.env.TOKEN_CACHE_DIR;
  });

  beforeEach(() => {
    // Clear test cache before each test
    if (fs.existsSync(TEST_CACHE_DIR)) {
      fs.rmSync(TEST_CACHE_DIR, { recursive: true, force: true });
    }
  });

  // ====================
  // DOMAIN EXTRACTION
  // ====================

  describe('extractDomain', () => {
    it('should extract domain from full URL', () => {
      expect(extractDomain('https://example.com/page')).toBe('example.com');
      expect(extractDomain('https://example.com')).toBe('example.com');
    });

    it('should remove www. prefix', () => {
      expect(extractDomain('https://www.example.com')).toBe('example.com');
      expect(extractDomain('http://www.example.com/path')).toBe('example.com');
    });

    it('should handle subdomains', () => {
      expect(extractDomain('https://blog.example.com')).toBe('blog.example.com');
      expect(extractDomain('https://app.subdomain.example.com')).toBe('app.subdomain.example.com');
    });

    it('should handle URLs with ports', () => {
      expect(extractDomain('https://example.com:3000')).toBe('example.com');
    });

    it('should handle URLs without protocol', () => {
      expect(extractDomain('example.com/path')).toBe('example.com');
    });

    it('should return input for invalid URLs', () => {
      expect(extractDomain('not-a-url')).toBe('not-a-url');
    });
  });

  // ====================
  // CACHE VALIDITY
  // ====================

  describe('isCacheValid', () => {
    it('should return false for non-existent cache', () => {
      expect(isCacheValid('non-existent-domain.com')).toBe(false);
    });

    it('should return true for valid cache', () => {
      const url = 'https://valid-cache.com';
      const tokens = getDefaultDesignSystem(url);

      // Create a cache entry
      setTokens(url, tokens, { ttlHours: 24 });

      expect(isCacheValid(extractDomain(url))).toBe(true);
    });

    it('should return false for expired cache', () => {
      const url = 'https://expired-cache.com';
      const domain = extractDomain(url);
      const tokens = getDefaultDesignSystem(url);

      // Create cache manually with expired timestamp
      const cacheDir = path.join(TEST_CACHE_DIR, domain);
      fs.mkdirSync(cacheDir, { recursive: true });

      const tokensPath = path.join(cacheDir, 'tokens.json');
      const expiresPath = path.join(cacheDir, 'expires_at.txt');

      fs.writeFileSync(tokensPath, JSON.stringify(tokens), 'utf-8');
      // Set expiration in the past
      const pastDate = new Date(Date.now() - 1000).toISOString();
      fs.writeFileSync(expiresPath, pastDate, 'utf-8');

      expect(isCacheValid(domain)).toBe(false);
    });

    it('should return false for invalid JSON in cache', () => {
      const domain = 'invalid-json.com';
      const cacheDir = path.join(TEST_CACHE_DIR, domain);
      fs.mkdirSync(cacheDir, { recursive: true });

      const tokensPath = path.join(cacheDir, 'tokens.json');
      const expiresPath = path.join(cacheDir, 'expires_at.txt');

      fs.writeFileSync(tokensPath, 'not valid json', 'utf-8');
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      fs.writeFileSync(expiresPath, futureDate, 'utf-8');

      expect(isCacheValid(domain)).toBe(false);
    });
  });

  // ====================
  // GET TOKENS
  // ====================

  describe('getTokens', () => {
    it('should return null for non-existent cache', () => {
      expect(getTokens('https://no-cache.com')).toBeNull();
    });

    it('should return cached tokens', () => {
      const url = 'https://cached.com';
      const tokens = getDefaultDesignSystem(url);

      setTokens(url, tokens);

      const result = getTokens(url);
      expect(result).not.toBeNull();
      expect(result?.tokens.meta.sourceUrl).toBe(url);
    });

    it('should return cache entry with metadata', () => {
      const url = 'https://with-metadata.com';
      const tokens = getDefaultDesignSystem(url);

      setTokens(url, tokens);

      const result = getTokens(url);
      expect(result?.domain).toBe('with-metadata.com');
      expect(result?.extractedAt).toBeDefined();
      expect(result?.expiresAt).toBeDefined();
    });

    it('should return null for expired cache', () => {
      const url = 'https://expired.com';
      const domain = extractDomain(url);
      const tokens = getDefaultDesignSystem(url);

      // Create expired cache
      const cacheDir = path.join(TEST_CACHE_DIR, domain);
      fs.mkdirSync(cacheDir, { recursive: true });

      fs.writeFileSync(
        path.join(cacheDir, 'tokens.json'),
        JSON.stringify(tokens),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(cacheDir, 'expires_at.txt'),
        new Date(Date.now() - 1000).toISOString(),
        'utf-8'
      );

      expect(getTokens(url)).toBeNull();
    });
  });

  // ====================
  // SET TOKENS
  // ====================

  describe('setTokens', () => {
    it('should store tokens in cache', () => {
      const url = 'https://store-test.com';
      const tokens = getDefaultDesignSystem(url);

      const result = setTokens(url, tokens);

      expect(result.domain).toBe('store-test.com');
      expect(result.tokens).toBeDefined();
    });

    it('should create cache directory if not exists', () => {
      const url = 'https://new-domain.com';
      const tokens = getDefaultDesignSystem(url);

      setTokens(url, tokens);

      const cacheDir = path.join(TEST_CACHE_DIR, 'new-domain.com');
      expect(fs.existsSync(cacheDir)).toBe(true);
    });

    it('should set correct expiration time', () => {
      const url = 'https://ttl-test.com';
      const tokens = getDefaultDesignSystem(url);
      const ttlHours = 48;

      const result = setTokens(url, tokens, { ttlHours });

      const expiresAt = new Date(result.expiresAt);
      const now = new Date();
      const expectedExpiry = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

      // Allow 1 minute tolerance
      expect(Math.abs(expiresAt.getTime() - expectedExpiry.getTime())).toBeLessThan(60000);
    });

    it('should overwrite existing cache', () => {
      const url = 'https://overwrite-test.com';
      const tokens1 = getDefaultDesignSystem(url);
      tokens1.colors.primary = ['#ff0000'];

      const tokens2 = getDefaultDesignSystem(url);
      tokens2.colors.primary = ['#00ff00'];

      setTokens(url, tokens1);
      setTokens(url, tokens2);

      const result = getTokens(url);
      expect(result?.tokens.colors.primary).toContain('#00ff00');
    });
  });

  // ====================
  // CLEAR TOKENS
  // ====================

  describe('clearTokens', () => {
    it('should clear cache for specific domain', () => {
      const url = 'https://clear-specific.com';
      const tokens = getDefaultDesignSystem(url);

      setTokens(url, tokens);
      expect(getTokens(url)).not.toBeNull();

      const result = clearTokens(url);
      expect(result).toBe(true);
      expect(getTokens(url)).toBeNull();
    });

    it('should return false for non-existent cache', () => {
      const result = clearTokens('https://no-cache-to-clear.com');
      expect(result).toBe(false);
    });

    it('should not affect other domains', () => {
      const url1 = 'https://domain1.com';
      const url2 = 'https://domain2.com';
      const tokens = getDefaultDesignSystem();

      setTokens(url1, tokens);
      setTokens(url2, tokens);

      clearTokens(url1);

      expect(getTokens(url1)).toBeNull();
      expect(getTokens(url2)).not.toBeNull();
    });
  });

  describe('clearAllTokens', () => {
    it('should clear all cached tokens', () => {
      const urls = [
        'https://domain1.com',
        'https://domain2.com',
        'https://domain3.com',
      ];
      const tokens = getDefaultDesignSystem();

      urls.forEach(url => setTokens(url, tokens));

      const result = clearAllTokens();
      expect(result).toBe(true);

      urls.forEach(url => {
        expect(getTokens(url)).toBeNull();
      });
    });

    it('should return false when cache directory does not exist', () => {
      // Make sure cache directory doesn't exist
      if (fs.existsSync(TEST_CACHE_DIR)) {
        fs.rmSync(TEST_CACHE_DIR, { recursive: true, force: true });
      }

      const result = clearAllTokens();
      expect(result).toBe(false);
    });
  });

  // ====================
  // CACHE STATS
  // ====================

  describe('getTokenCacheStats', () => {
    it('should return correct stats for empty cache', () => {
      const stats = getTokenCacheStats();

      expect(stats.totalDomains).toBe(0);
      expect(stats.validDomains).toBe(0);
      expect(stats.expiredDomains).toBe(0);
    });

    it('should count valid domains', () => {
      const urls = ['https://valid1.com', 'https://valid2.com'];
      const tokens = getDefaultDesignSystem();

      urls.forEach(url => setTokens(url, tokens, { ttlHours: 24 }));

      const stats = getTokenCacheStats();
      expect(stats.totalDomains).toBe(2);
      expect(stats.validDomains).toBe(2);
      expect(stats.expiredDomains).toBe(0);
    });

    it('should count expired domains', () => {
      const url = 'https://will-expire.com';
      const domain = extractDomain(url);
      const tokens = getDefaultDesignSystem(url);

      // Create expired cache
      const cacheDir = path.join(TEST_CACHE_DIR, domain);
      fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(
        path.join(cacheDir, 'tokens.json'),
        JSON.stringify(tokens),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(cacheDir, 'expires_at.txt'),
        new Date(Date.now() - 1000).toISOString(),
        'utf-8'
      );

      const stats = getTokenCacheStats();
      expect(stats.totalDomains).toBe(1);
      expect(stats.validDomains).toBe(0);
      expect(stats.expiredDomains).toBe(1);
    });

    it('should include cache directory path', () => {
      const stats = getTokenCacheStats();
      expect(stats.cacheDir).toBe(TEST_CACHE_DIR);
    });

    it('should handle mixed valid and expired domains', () => {
      // Create valid cache
      setTokens('https://valid.com', getDefaultDesignSystem(), { ttlHours: 24 });

      // Create expired cache
      const expiredDomain = 'expired.com';
      const cacheDir = path.join(TEST_CACHE_DIR, expiredDomain);
      fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(
        path.join(cacheDir, 'tokens.json'),
        JSON.stringify(getDefaultDesignSystem()),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(cacheDir, 'expires_at.txt'),
        new Date(Date.now() - 1000).toISOString(),
        'utf-8'
      );

      const stats = getTokenCacheStats();
      expect(stats.totalDomains).toBe(2);
      expect(stats.validDomains).toBe(1);
      expect(stats.expiredDomains).toBe(1);
    });
  });
});
