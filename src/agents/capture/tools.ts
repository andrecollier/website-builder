/**
 * Capture Agent Tools Module
 *
 * Tool functions for the capture agent to perform Playwright operations.
 * Provides tools for navigation, scrolling, screenshots, and section detection.
 *
 * These tools can be used by the capture agent directly or exposed
 * to the Claude Agent SDK when migrating to full SDK-based capture operations.
 */

import type { Page } from 'playwright';
import type {
  NavigateToolInput,
  NavigateToolOutput,
  ScrollToolInput,
  ScrollToolOutput,
  ScreenshotToolInput,
  ScreenshotToolOutput,
  DetectSectionsToolInput,
  DetectSectionsToolOutput,
} from '../types';
import {
  autoScroll,
  waitForImages,
  waitForFonts,
  waitForAnimations,
  dismissCookieConsent,
} from '@/lib/playwright/scroll-loader';
import {
  detectAllSections,
  getPageDimensions,
} from '@/lib/playwright/section-detector';
import fs from 'fs';
import path from 'path';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Tool execution context
 * Provides access to the active Playwright page
 */
export interface ToolContext {
  page: Page;
  websiteId: string;
}

// ====================
// NAVIGATION TOOL
// ====================

/**
 * Navigate Tool
 *
 * Navigates to a URL and waits for the page to load.
 * Handles initial page loading, cookie consent dismissal, and optional selector waiting.
 *
 * @param input - Navigation parameters (url, waitForSelector, timeout)
 * @param context - Tool execution context
 * @returns Promise resolving to navigation result
 *
 * @example
 * ```typescript
 * const result = await navigateTool({
 *   url: 'https://example.com',
 *   timeout: 30000
 * }, context);
 *
 * if (result.success) {
 *   console.log(`Navigated to: ${result.finalUrl}`);
 *   console.log(`Page title: ${result.title}`);
 * }
 * ```
 */
export async function navigateTool(
  input: NavigateToolInput,
  context: ToolContext
): Promise<NavigateToolOutput> {
  const { url, waitForSelector, timeout = 30000 } = input;
  const { page } = context;

  try {
    // Navigate to URL using domcontentloaded (more reliable than networkidle)
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout,
    });

    // Wait for initial page render
    await page.waitForTimeout(500);

    // Try to dismiss cookie consent banners
    await dismissCookieConsent(page);

    // Wait for specific selector if provided
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 5000 }).catch(() => {
        // Continue even if selector not found
      });
    }

    // Get final URL and title
    const finalUrl = page.url();
    const title = await page.title();

    return {
      success: true,
      finalUrl,
      title,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      finalUrl: '',
      title: '',
    };
  }
}

// ====================
// SCROLL TOOL
// ====================

/**
 * Scroll Tool
 *
 * Scrolls the page to trigger lazy-loaded content and waits for content to load.
 * Can scroll by a specific amount or auto-scroll through the entire page.
 *
 * @param input - Scroll parameters (amount, waitForContent)
 * @param context - Tool execution context
 * @returns Promise resolving to scroll result
 *
 * @example
 * ```typescript
 * // Auto-scroll entire page
 * const result = await scrollTool({
 *   waitForContent: true
 * }, context);
 *
 * console.log(`Reached bottom: ${result.reachedBottom}`);
 * ```
 */
export async function scrollTool(
  input: ScrollToolInput,
  context: ToolContext
): Promise<ScrollToolOutput> {
  const { amount, waitForContent = true } = input;
  const { page } = context;

  try {
    let scrolledAmount = 0;
    let reachedBottom = false;

    if (amount === undefined) {
      // Auto-scroll entire page
      await autoScroll(page);

      // Get total scroll height
      const dimensions = await getPageDimensions(page);
      scrolledAmount = dimensions.scrollHeight;
      reachedBottom = true;

      // Wait for content to load after scrolling
      if (waitForContent) {
        await waitForImages(page);
        await waitForFonts(page);
        await waitForAnimations(page);
      }
    } else {
      // Scroll by specific amount
      const beforeScroll = await page.evaluate(() => window.scrollY);

      await page.evaluate((scrollAmount) => {
        window.scrollBy(0, scrollAmount);
      }, amount);

      // Wait for scroll to complete
      await page.waitForTimeout(300);

      const afterScroll = await page.evaluate(() => window.scrollY);
      scrolledAmount = afterScroll - beforeScroll;

      // Check if reached bottom
      const dimensions = await page.evaluate(() => ({
        scrollY: window.scrollY,
        scrollHeight: document.body.scrollHeight,
        viewportHeight: window.innerHeight,
      }));

      reachedBottom = dimensions.scrollY + dimensions.viewportHeight >= dimensions.scrollHeight;

      // Wait for content if requested
      if (waitForContent) {
        await waitForImages(page, 5000);
      }
    }

    return {
      success: true,
      scrolledAmount,
      reachedBottom,
    };
  } catch (error) {
    return {
      success: false,
      scrolledAmount: 0,
      reachedBottom: false,
    };
  }
}

// ====================
// SCREENSHOT TOOL
// ====================

/**
 * Screenshot Tool
 *
 * Captures a screenshot of the full page or a specific section.
 * Handles directory creation and file output.
 *
 * @param input - Screenshot parameters (sectionId, fullPage, outputPath)
 * @param context - Tool execution context
 * @returns Promise resolving to screenshot result
 *
 * @example
 * ```typescript
 * // Capture full page
 * const result = await screenshotTool({
 *   fullPage: true,
 *   outputPath: '/path/to/screenshot.png'
 * }, context);
 *
 * console.log(`Screenshot saved: ${result.filePath}`);
 * console.log(`Size: ${result.width}x${result.height}`);
 * ```
 */
export async function screenshotTool(
  input: ScreenshotToolInput,
  context: ToolContext
): Promise<ScreenshotToolOutput> {
  const { sectionId, fullPage = false, outputPath } = input;
  const { page } = context;

  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    if (fullPage) {
      // Capture full page screenshot
      await page.screenshot({
        path: outputPath,
        fullPage: true,
        type: 'png',
      });

      // Get page dimensions
      const dimensions = await getPageDimensions(page);

      return {
        success: true,
        filePath: outputPath,
        width: dimensions.width,
        height: dimensions.scrollHeight,
      };
    } else if (sectionId) {
      // Capture section screenshot
      // NOTE: This assumes sections have been detected first and stored in context
      // For now, return error as section capture requires bounding box data
      return {
        success: false,
        filePath: '',
        width: 0,
        height: 0,
      };
    } else {
      // Capture viewport screenshot
      await page.screenshot({
        path: outputPath,
        type: 'png',
      });

      // Get viewport dimensions
      const dimensions = await getPageDimensions(page);

      return {
        success: true,
        filePath: outputPath,
        width: dimensions.width,
        height: dimensions.height,
      };
    }
  } catch (error) {
    return {
      success: false,
      filePath: '',
      width: 0,
      height: 0,
    };
  }
}

// ====================
// SECTION DETECTION TOOL
// ====================

/**
 * Detect Sections Tool
 *
 * Detects page sections (header, hero, features, testimonials, pricing, cta, footer)
 * using semantic HTML selectors and viewport-based fallback.
 *
 * @param input - Detection parameters (minHeight)
 * @param context - Tool execution context
 * @returns Promise resolving to detection result
 *
 * @example
 * ```typescript
 * const result = await detectSectionsTool({
 *   minHeight: 100
 * }, context);
 *
 * if (result.success) {
 *   console.log(`Detected ${result.sections.length} sections`);
 *   result.sections.forEach(section => {
 *     console.log(`- ${section.type} at y=${section.bounds.y}`);
 *   });
 * }
 * ```
 */
export async function detectSectionsTool(
  input: DetectSectionsToolInput,
  context: ToolContext
): Promise<DetectSectionsToolOutput> {
  const { minHeight = 50 } = input;
  const { page } = context;

  try {
    // Detect all sections using the comprehensive detection algorithm
    const sections = await detectAllSections(page, {
      minHeight,
      useGenericFallback: true,
    });

    // Convert to tool output format
    const outputSections = sections.map((section) => ({
      id: section.id,
      type: section.type,
      bounds: {
        x: section.boundingBox.x,
        y: section.boundingBox.y,
        width: section.boundingBox.width,
        height: section.boundingBox.height,
      },
    }));

    return {
      success: true,
      sections: outputSections,
    };
  } catch (error) {
    return {
      success: false,
      sections: [],
    };
  }
}

// ====================
// TOOL CONTEXT CREATION
// ====================

/**
 * Create a tool context from a Playwright page
 * Convenience function for creating tool execution contexts
 *
 * @param page - Playwright Page instance
 * @param websiteId - Website identifier
 * @returns Tool context
 */
export function createToolContext(page: Page, websiteId: string): ToolContext {
  return {
    page,
    websiteId,
  };
}
