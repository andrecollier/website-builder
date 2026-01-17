/**
 * Unit tests for Capture Tools
 *
 * Tests the capture agent tools: navigate, scroll, screenshot, detectSections.
 */

import { describe, test, expect } from '@playwright/test';
import {
  navigateTool,
  scrollTool,
  screenshotTool,
  detectSectionsTool,
  createToolContext,
} from '../tools';

describe('Capture Tools', () => {
  test('createToolContext creates valid context', () => {
    const mockPage = {} as any; // Mock page
    const context = createToolContext(mockPage, 'test-website-1');

    expect(context).toBeDefined();
    expect(context.page).toBe(mockPage);
    expect(context.websiteId).toBe('test-website-1');
  });

  test('navigateTool has required interface', () => {
    expect(typeof navigateTool).toBe('function');
    expect(navigateTool.length).toBe(2); // Takes 2 parameters: input and context
  });

  test('scrollTool has required interface', () => {
    expect(typeof scrollTool).toBe('function');
    expect(scrollTool.length).toBe(2);
  });

  test('screenshotTool has required interface', () => {
    expect(typeof screenshotTool).toBe('function');
    expect(screenshotTool.length).toBe(2);
  });

  test('detectSectionsTool has required interface', () => {
    expect(typeof detectSectionsTool).toBe('function');
    expect(detectSectionsTool.length).toBe(2);
  });

  // NOTE: The following tests would require actual Playwright page instances
  // and are better suited for integration tests. These are interface-level
  // tests to verify the tools exist and have the correct signatures.

  test('navigateTool returns success: false for invalid input', async () => {
    const mockPage = {
      goto: async () => {
        throw new Error('Navigation failed');
      },
      waitForTimeout: async () => {},
      url: () => '',
      title: async () => '',
    } as any;

    const context = createToolContext(mockPage, 'test-website');
    const result = await navigateTool(
      { url: 'invalid-url', timeout: 1000 },
      context
    );

    expect(result.success).toBe(false);
  });

  test('scrollTool handles error gracefully', async () => {
    const mockPage = {
      evaluate: async () => {
        throw new Error('Scroll failed');
      },
    } as any;

    const context = createToolContext(mockPage, 'test-website');
    const result = await scrollTool({ amount: 100 }, context);

    expect(result.success).toBe(false);
    expect(result.scrolledAmount).toBe(0);
    expect(result.reachedBottom).toBe(false);
  });

  test('screenshotTool handles error gracefully', async () => {
    const mockPage = {
      screenshot: async () => {
        throw new Error('Screenshot failed');
      },
    } as any;

    const context = createToolContext(mockPage, 'test-website');
    const result = await screenshotTool(
      { fullPage: true, outputPath: '/tmp/test.png' },
      context
    );

    expect(result.success).toBe(false);
    expect(result.filePath).toBe('');
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
  });

  test('detectSectionsTool handles error gracefully', async () => {
    const mockPage = {
      evaluate: async () => {
        throw new Error('Detection failed');
      },
    } as any;

    const context = createToolContext(mockPage, 'test-website');
    const result = await detectSectionsTool({ minHeight: 100 }, context);

    expect(result.success).toBe(false);
    expect(result.sections).toEqual([]);
  });

  test('tools accept ToolContext parameter', () => {
    const mockPage = {} as any;
    const context = createToolContext(mockPage, 'test-website');

    // Verify context has expected shape
    expect(context).toHaveProperty('page');
    expect(context).toHaveProperty('websiteId');

    // Verify context is accepted by tools (type check at compile time)
    expect(() => {
      navigateTool({ url: 'https://example.com' }, context);
      scrollTool({ amount: 100 }, context);
      screenshotTool({ fullPage: true, outputPath: '/tmp/test.png' }, context);
      detectSectionsTool({ minHeight: 100 }, context);
    }).not.toThrow();
  });

  test('tool functions return promises', () => {
    const mockPage = {
      goto: async () => {},
      waitForTimeout: async () => {},
      url: () => 'https://example.com',
      title: async () => 'Example',
    } as any;

    const context = createToolContext(mockPage, 'test-website');

    const navigatePromise = navigateTool({ url: 'https://example.com' }, context);
    expect(navigatePromise).toBeInstanceOf(Promise);

    const scrollPromise = scrollTool({ amount: 100 }, context);
    expect(scrollPromise).toBeInstanceOf(Promise);

    const screenshotPromise = screenshotTool(
      { fullPage: true, outputPath: '/tmp/test.png' },
      context
    );
    expect(screenshotPromise).toBeInstanceOf(Promise);

    const detectPromise = detectSectionsTool({ minHeight: 100 }, context);
    expect(detectPromise).toBeInstanceOf(Promise);
  });
});
