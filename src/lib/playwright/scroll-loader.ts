/**
 * Scroll Loader Module
 *
 * This module provides functions for triggering lazy-loaded content and ensuring
 * page completeness before screenshot capture. Handles scrolling, image loading,
 * font loading, and animation settling.
 */

import type { Page } from 'playwright';
import { CAPTURE_CONFIG } from '@/types';

// ====================
// AUTO SCROLL
// ====================

/**
 * Scrolls the entire page to trigger lazy-loaded content
 * CRITICAL: Must complete before taking fullPage screenshot
 *
 * @param page - Playwright Page instance
 * @param options - Optional scroll configuration
 * @returns Promise that resolves when scrolling is complete
 *
 * @example
 * ```typescript
 * await autoScroll(page);
 * // Page has been scrolled and returned to top
 * ```
 */
export async function autoScroll(
  page: Page,
  options?: {
    scrollDistance?: number;
    scrollDelay?: number;
    maxIterations?: number;
  }
): Promise<void> {
  const scrollDistance = options?.scrollDistance ?? CAPTURE_CONFIG.scrollDistance;
  const scrollDelay = options?.scrollDelay ?? CAPTURE_CONFIG.scrollDelay;
  const maxIterations = options?.maxIterations ?? 1000; // Prevent infinite scroll pages from hanging

  await page.evaluate(
    async ({ distance, delay, maxIter }) => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        let iterations = 0;
        let lastScrollHeight = 0;
        let stableCount = 0;

        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          iterations++;

          // Check if page height has stabilized (for dynamically loading content)
          if (scrollHeight === lastScrollHeight) {
            stableCount++;
          } else {
            stableCount = 0;
          }
          lastScrollHeight = scrollHeight;

          // Stop conditions:
          // 1. Scrolled past document height
          // 2. Reached max iterations (prevents infinite scroll hangs)
          // 3. Page height hasn't changed in 5 consecutive checks (content fully loaded)
          if (totalHeight >= scrollHeight || iterations >= maxIter || stableCount >= 5) {
            clearInterval(timer);
            // CRITICAL: Return to top before capture
            window.scrollTo(0, 0);
            resolve();
          }
        }, delay);
      });
    },
    { distance: scrollDistance, delay: scrollDelay, maxIter: maxIterations }
  );
}

// ====================
// WAIT FOR IMAGES
// ====================

/**
 * Wait for all images on the page to complete loading
 *
 * @param page - Playwright Page instance
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 * @returns Promise that resolves when all images are loaded or timeout is reached
 *
 * @example
 * ```typescript
 * await waitForImages(page);
 * // All images are now loaded
 * ```
 */
export async function waitForImages(page: Page, timeout: number = 10000): Promise<void> {
  try {
    await page.waitForFunction(
      () => {
        const images = document.querySelectorAll('img');
        if (images.length === 0) return true;

        return Array.from(images).every((img) => {
          // Consider image complete if:
          // 1. It has completed loading
          // 2. It has no src (placeholder)
          // 3. It's a data URI (already loaded)
          if (!img.src || img.src.startsWith('data:')) return true;
          return img.complete;
        });
      },
      { timeout }
    );
  } catch {
    // Continue even if some images fail to load - log warning but don't block capture
    // This handles cases where images may be blocked or take too long
  }
}

// ====================
// WAIT FOR FONTS
// ====================

/**
 * Wait for all fonts on the page to finish loading
 *
 * @param page - Playwright Page instance
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 * @returns Promise that resolves when fonts are ready or timeout is reached
 *
 * @example
 * ```typescript
 * await waitForFonts(page);
 * // All fonts are now loaded
 * ```
 */
export async function waitForFonts(page: Page, timeout: number = 5000): Promise<void> {
  try {
    await page.evaluate(() => document.fonts.ready);
    // Give a small buffer for fonts to render
    await page.waitForTimeout(100);
  } catch {
    // Continue even if font loading times out
    // Some sites may not use document.fonts API
  }
}

// ====================
// WAIT FOR ANIMATIONS
// ====================

/**
 * Wait for CSS animations and transitions to settle
 *
 * @param page - Playwright Page instance
 * @param duration - Time to wait in milliseconds (default: 2000)
 * @returns Promise that resolves after the specified duration
 *
 * @example
 * ```typescript
 * await waitForAnimations(page);
 * // Animations have had time to complete
 * ```
 */
export async function waitForAnimations(
  page: Page,
  duration: number = CAPTURE_CONFIG.animationWait
): Promise<void> {
  await page.waitForTimeout(duration);
}

// ====================
// COMPLETE LOADING SEQUENCE
// ====================

/**
 * Execute the complete content loading sequence in the correct order
 * This is the recommended way to ensure all page content is loaded before capture
 *
 * @param page - Playwright Page instance
 * @param options - Optional configuration for each step
 * @returns Promise that resolves when all content is loaded
 *
 * @example
 * ```typescript
 * await waitForContentComplete(page);
 * // Page is now ready for screenshot capture
 * ```
 */
export async function waitForContentComplete(
  page: Page,
  options?: {
    imageTimeout?: number;
    fontTimeout?: number;
    animationWait?: number;
    scrollOptions?: {
      scrollDistance?: number;
      scrollDelay?: number;
      maxIterations?: number;
    };
  }
): Promise<void> {
  // 1. Scroll to trigger lazy-loaded content
  await autoScroll(page, options?.scrollOptions);

  // 2. Wait for all images to complete
  await waitForImages(page, options?.imageTimeout);

  // 3. Wait for fonts to load
  await waitForFonts(page, options?.fontTimeout);

  // 4. Allow animations to settle
  await waitForAnimations(page, options?.animationWait);
}

// ====================
// COOKIE CONSENT HANDLING
// ====================

/**
 * Attempt to dismiss common cookie consent banners (best effort)
 * This is a helper function that tries common selectors for cookie popups
 *
 * @param page - Playwright Page instance
 * @returns Promise that resolves after attempting to dismiss
 *
 * @example
 * ```typescript
 * await dismissCookieConsent(page);
 * // Any cookie banners should be dismissed
 * ```
 */
export async function dismissCookieConsent(page: Page): Promise<void> {
  // Common cookie consent button selectors
  const consentSelectors = [
    // Generic accept buttons
    'button[id*="accept"]',
    'button[class*="accept"]',
    'button[id*="consent"]',
    'button[class*="consent"]',
    'button[id*="cookie"]',
    'button[class*="cookie"]',
    // Common button text patterns
    'button:has-text("Accept")',
    'button:has-text("Accept All")',
    'button:has-text("Accept Cookies")',
    'button:has-text("I Accept")',
    'button:has-text("OK")',
    'button:has-text("Agree")',
    // CMP providers
    '[id*="onetrust"] button[id*="accept"]',
    '[class*="gdpr"] button[class*="accept"]',
    '[class*="cookiebot"] button[id*="accept"]',
  ];

  for (const selector of consentSelectors) {
    try {
      const button = page.locator(selector).first();
      const isVisible = await button.isVisible({ timeout: 500 });
      if (isVisible) {
        await button.click({ timeout: 1000 });
        // Wait a moment for the banner to dismiss
        await page.waitForTimeout(500);
        break;
      }
    } catch {
      // Selector not found or not clickable, continue to next
      continue;
    }
  }
}
