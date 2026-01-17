/**
 * Unit tests for Shared Context
 *
 * Tests context initialization, updates, and isolation between websiteIds.
 */

import { describe, test, expect, beforeEach } from '@playwright/test';
import {
  initializeContext,
  getContext,
  updateContext,
  updateProgress,
  addError,
  completeContext,
  failContext,
  clearContext,
} from '../context';

describe('Shared Context', () => {
  beforeEach(() => {
    // Clear contexts before each test
    clearContext('test-website-1');
    clearContext('test-website-2');
    clearContext('test-website-3');
  });

  test('initialize context creates new context', () => {
    initializeContext('test-website-1', 'https://example.com');
    const ctx = getContext('test-website-1');

    expect(ctx).toBeDefined();
    expect(ctx?.websiteId).toBe('test-website-1');
    expect(ctx?.url).toBe('https://example.com');
    expect(ctx?.status).toBe('initializing');
    expect(ctx?.progress).toBeDefined();
    expect(ctx?.errors).toEqual([]);
  });

  test('getContext returns undefined for non-existent context', () => {
    const ctx = getContext('non-existent');
    expect(ctx).toBeUndefined();
  });

  test('update context modifies state', () => {
    initializeContext('test-website-1', 'https://example.com');

    updateContext('test-website-1', { status: 'capturing' });
    let ctx = getContext('test-website-1');
    expect(ctx?.status).toBe('capturing');

    updateContext('test-website-1', { status: 'extracting' });
    ctx = getContext('test-website-1');
    expect(ctx?.status).toBe('extracting');
  });

  test('updateProgress updates progress field', () => {
    initializeContext('test-website-1', 'https://example.com');

    updateProgress('test-website-1', {
      phase: 'capturing',
      percent: 50,
      message: 'Capturing sections...',
    });

    const ctx = getContext('test-website-1');
    expect(ctx?.progress).toBeDefined();
    expect(ctx?.progress?.phase).toBe('capturing');
    expect(ctx?.progress?.percent).toBe(50);
    expect(ctx?.progress?.message).toBe('Capturing sections...');
  });

  test('addError appends to errors array', () => {
    initializeContext('test-website-1', 'https://example.com');

    const error1 = {
      id: 'error-1',
      phase: 1,
      message: 'Capture failed',
      timestamp: new Date().toISOString(),
      recoverable: true,
    };

    const error2 = {
      id: 'error-2',
      phase: 2,
      message: 'Extraction failed',
      timestamp: new Date().toISOString(),
      recoverable: true,
    };

    addError('test-website-1', error1);
    addError('test-website-1', error2);

    const ctx = getContext('test-website-1');
    expect(ctx?.errors).toHaveLength(2);
    expect(ctx?.errors?.[0].id).toBe('error-1');
    expect(ctx?.errors?.[1].id).toBe('error-2');
  });

  test('completeContext sets status to complete', () => {
    initializeContext('test-website-1', 'https://example.com');

    completeContext('test-website-1');

    const ctx = getContext('test-website-1');
    expect(ctx?.status).toBe('complete');
  });

  test('failContext sets status to failed and adds error', () => {
    initializeContext('test-website-1', 'https://example.com');

    const error = {
      id: 'error-fatal',
      phase: 0,
      message: 'Pipeline failed',
      timestamp: new Date().toISOString(),
      recoverable: false,
    };

    failContext('test-website-1', error);

    const ctx = getContext('test-website-1');
    expect(ctx?.status).toBe('failed');
    expect(ctx?.errors).toHaveLength(1);
    expect(ctx?.errors?.[0].recoverable).toBe(false);
  });

  test('contexts are isolated by websiteId', () => {
    initializeContext('website-1', 'https://example1.com');
    initializeContext('website-2', 'https://example2.com');

    updateContext('website-1', { status: 'complete' });
    updateContext('website-2', { status: 'capturing' });

    const ctx1 = getContext('website-1');
    const ctx2 = getContext('website-2');

    expect(ctx1?.status).toBe('complete');
    expect(ctx1?.url).toBe('https://example1.com');

    expect(ctx2?.status).toBe('capturing');
    expect(ctx2?.url).toBe('https://example2.com');
  });

  test('clearContext removes context', () => {
    initializeContext('test-website-1', 'https://example.com');

    let ctx = getContext('test-website-1');
    expect(ctx).toBeDefined();

    clearContext('test-website-1');

    ctx = getContext('test-website-1');
    expect(ctx).toBeUndefined();
  });

  test('updateContext preserves existing fields when updating partial state', () => {
    initializeContext('test-website-1', 'https://example.com');

    updateContext('test-website-1', { status: 'capturing' });
    updateContext('test-website-1', {
      captureResult: {
        success: true,
        sections: [],
        fullPageScreenshot: '/path/to/screenshot.png'
      } as any
    });

    const ctx = getContext('test-website-1');
    expect(ctx?.status).toBe('capturing'); // Status preserved
    expect(ctx?.captureResult).toBeDefined(); // New field added
    expect(ctx?.url).toBe('https://example.com'); // Original field preserved
  });

  test('multiple operations on same context work correctly', () => {
    initializeContext('test-website-1', 'https://example.com');

    // Simulate a full pipeline execution
    updateContext('test-website-1', { status: 'capturing' });
    updateProgress('test-website-1', { phase: 'capturing', percent: 25, message: 'Capturing...' });

    updateContext('test-website-1', { status: 'extracting' });
    updateProgress('test-website-1', { phase: 'extracting', percent: 50, message: 'Extracting...' });

    updateContext('test-website-1', { status: 'generating' });
    updateProgress('test-website-1', { phase: 'capturing', percent: 75, message: 'Generating...' });

    updateContext('test-website-1', { status: 'comparing' });
    updateProgress('test-website-1', { phase: 'sections', percent: 90, message: 'Comparing...' });

    completeContext('test-website-1');

    const ctx = getContext('test-website-1');
    expect(ctx?.status).toBe('complete');
    expect(ctx?.progress?.percent).toBe(90);
  });

  test('concurrent updates to different contexts work correctly', () => {
    initializeContext('website-1', 'https://example1.com');
    initializeContext('website-2', 'https://example2.com');
    initializeContext('website-3', 'https://example3.com');

    updateContext('website-1', { status: 'capturing' });
    updateContext('website-2', { status: 'extracting' });
    updateContext('website-3', { status: 'generating' });

    const ctx1 = getContext('website-1');
    const ctx2 = getContext('website-2');
    const ctx3 = getContext('website-3');

    expect(ctx1?.status).toBe('capturing');
    expect(ctx2?.status).toBe('extracting');
    expect(ctx3?.status).toBe('generating');
  });
});
