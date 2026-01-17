/**
 * Unit tests for Extractor Tools
 *
 * Tests the extractor agent tools: extractColors, extractTypography, extractSpacing, extractEffects.
 */

import { describe, test, expect } from '@playwright/test';
import {
  extractColorsTool,
  extractTypographyTool,
  extractSpacingTool,
  extractEffectsTool,
  createToolContext,
} from '../tools';

describe('Extractor Tools', () => {
  test('createToolContext creates valid context', () => {
    const context = createToolContext('test-website-1');

    expect(context).toBeDefined();
    expect(context.websiteId).toBe('test-website-1');
  });

  test('extractColorsTool has required interface', () => {
    expect(typeof extractColorsTool).toBe('function');
    expect(extractColorsTool.length).toBe(2); // Takes 2 parameters: input and context
  });

  test('extractTypographyTool has required interface', () => {
    expect(typeof extractTypographyTool).toBe('function');
    expect(extractTypographyTool.length).toBe(2);
  });

  test('extractSpacingTool has required interface', () => {
    expect(typeof extractSpacingTool).toBe('function');
    expect(extractSpacingTool.length).toBe(2);
  });

  test('extractEffectsTool has required interface', () => {
    expect(typeof extractEffectsTool).toBe('function');
    expect(extractEffectsTool.length).toBe(2);
  });

  test('extractColorsTool returns valid color tokens', async () => {
    const mockRawData = {
      colors: ['#3b82f6', '#1e40af', '#ffffff', '#000000'],
      backgrounds: ['#ffffff', '#f3f4f6'],
      borders: ['#e5e7eb', '#d1d5db'],
    };

    const context = createToolContext('test-website');
    const result = await extractColorsTool({ rawData: mockRawData }, context);

    expect(result.success).toBe(true);
    expect(result.colors).toBeDefined();
    expect(result.colors).toHaveProperty('primary');
    expect(result.colors).toHaveProperty('secondary');
    expect(result.colors).toHaveProperty('neutral');
    expect(result.colors).toHaveProperty('semantic');
  });

  test('extractColorsTool handles missing rawData', async () => {
    const context = createToolContext('test-website');
    const result = await extractColorsTool({ rawData: null as any }, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing rawData');
    expect(result.colors).toBeDefined(); // Should return defaults
  });

  test('extractColorsTool handles invalid rawData structure', async () => {
    const mockInvalidData = {
      colors: ['#3b82f6'],
      // Missing backgrounds and borders
    } as any;

    const context = createToolContext('test-website');
    const result = await extractColorsTool({ rawData: mockInvalidData }, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid rawData structure');
    expect(result.colors).toBeDefined(); // Should return defaults
  });

  test('extractTypographyTool returns valid typography tokens', async () => {
    const mockRawData = {
      fontFamilies: ['Inter', 'System UI', 'Arial'],
      fontSizes: ['16px', '20px', '24px', '32px', '48px'],
      fontWeights: ['400', '600', '700'],
      lineHeights: ['1.5', '1.6', '1.2'],
      elementTypes: ['p', 'h3', 'h2', 'h1', 'h1'],
    };

    const context = createToolContext('test-website');
    const result = await extractTypographyTool({ rawData: mockRawData }, context);

    expect(result.success).toBe(true);
    expect(result.typography).toBeDefined();
    expect(result.typography).toHaveProperty('fonts');
    expect(result.typography).toHaveProperty('scale');
    expect(result.typography).toHaveProperty('weights');
    expect(result.typography).toHaveProperty('lineHeights');
  });

  test('extractTypographyTool handles missing rawData', async () => {
    const context = createToolContext('test-website');
    const result = await extractTypographyTool({ rawData: null as any }, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing rawData');
    expect(result.typography).toBeDefined(); // Should return defaults
  });

  test('extractTypographyTool handles invalid rawData structure', async () => {
    const mockInvalidData = {
      fontFamilies: ['Inter'],
      // Missing other required fields
    } as any;

    const context = createToolContext('test-website');
    const result = await extractTypographyTool({ rawData: mockInvalidData }, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid rawData structure');
    expect(result.typography).toBeDefined(); // Should return defaults
  });

  test('extractSpacingTool returns valid spacing tokens', async () => {
    const mockRawData = {
      paddings: ['16px', '24px', '32px', '48px'],
      margins: ['8px', '16px', '24px'],
      gaps: ['12px', '16px', '24px'],
      maxWidths: ['1280px', '1024px', '768px'],
      elementTypes: ['section', 'div', 'div', 'main'],
    };

    const context = createToolContext('test-website');
    const result = await extractSpacingTool({ rawData: mockRawData }, context);

    expect(result.success).toBe(true);
    expect(result.spacing).toBeDefined();
    expect(result.spacing).toHaveProperty('baseUnit');
    expect(result.spacing).toHaveProperty('scale');
    expect(result.spacing).toHaveProperty('containerMaxWidths');
  });

  test('extractSpacingTool handles missing rawData', async () => {
    const context = createToolContext('test-website');
    const result = await extractSpacingTool({ rawData: null as any }, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing rawData');
    expect(result.spacing).toBeDefined(); // Should return defaults
  });

  test('extractSpacingTool handles invalid rawData structure', async () => {
    const mockInvalidData = {
      paddings: ['16px'],
      // Missing other required fields
    } as any;

    const context = createToolContext('test-website');
    const result = await extractSpacingTool({ rawData: mockInvalidData }, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid rawData structure');
    expect(result.spacing).toBeDefined(); // Should return defaults
  });

  test('extractEffectsTool returns valid effect tokens', async () => {
    const mockRawData = {
      boxShadows: ['0 1px 3px rgba(0,0,0,0.12)', '0 4px 6px rgba(0,0,0,0.1)'],
      borderRadii: ['4px', '8px', '12px', '9999px'],
      transitions: ['150ms', '200ms', '300ms'],
    };

    const context = createToolContext('test-website');
    const result = await extractEffectsTool({ rawData: mockRawData }, context);

    expect(result.success).toBe(true);
    expect(result.effects).toBeDefined();
    expect(result.effects).toHaveProperty('shadows');
    expect(result.effects).toHaveProperty('radii');
    expect(result.effects).toHaveProperty('transitions');
  });

  test('extractEffectsTool handles missing rawData', async () => {
    const context = createToolContext('test-website');
    const result = await extractEffectsTool({ rawData: null as any }, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing rawData');
    expect(result.effects).toBeDefined(); // Should return defaults
  });

  test('extractEffectsTool handles invalid rawData structure', async () => {
    const mockInvalidData = {
      boxShadows: ['0 1px 3px rgba(0,0,0,0.12)'],
      // Missing other required fields
    } as any;

    const context = createToolContext('test-website');
    const result = await extractEffectsTool({ rawData: mockInvalidData }, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid rawData structure');
    expect(result.effects).toBeDefined(); // Should return defaults
  });

  test('all extractor tools accept ToolContext parameter', () => {
    const context = createToolContext('test-website');

    // Verify context has expected shape
    expect(context).toHaveProperty('websiteId');

    // Verify context is accepted by tools (type check at compile time)
    const mockColors = { colors: [], backgrounds: [], borders: [] };
    const mockTypography = {
      fontFamilies: [],
      fontSizes: [],
      fontWeights: [],
      lineHeights: [],
      elementTypes: [],
    };
    const mockSpacing = {
      paddings: [],
      margins: [],
      gaps: [],
      maxWidths: [],
      elementTypes: [],
    };
    const mockEffects = { boxShadows: [], borderRadii: [], transitions: [] };

    expect(() => {
      extractColorsTool({ rawData: mockColors }, context);
      extractTypographyTool({ rawData: mockTypography }, context);
      extractSpacingTool({ rawData: mockSpacing }, context);
      extractEffectsTool({ rawData: mockEffects }, context);
    }).not.toThrow();
  });

  test('all extractor tools return promises', () => {
    const context = createToolContext('test-website');

    const mockColors = { colors: ['#fff'], backgrounds: ['#fff'], borders: ['#eee'] };
    const mockTypography = {
      fontFamilies: ['Arial'],
      fontSizes: ['16px'],
      fontWeights: ['400'],
      lineHeights: ['1.5'],
      elementTypes: ['p'],
    };
    const mockSpacing = {
      paddings: ['16px'],
      margins: ['8px'],
      gaps: ['12px'],
      maxWidths: ['1280px'],
      elementTypes: ['div'],
    };
    const mockEffects = { boxShadows: ['none'], borderRadii: ['4px'], transitions: ['200ms'] };

    const colorsPromise = extractColorsTool({ rawData: mockColors }, context);
    expect(colorsPromise).toBeInstanceOf(Promise);

    const typographyPromise = extractTypographyTool({ rawData: mockTypography }, context);
    expect(typographyPromise).toBeInstanceOf(Promise);

    const spacingPromise = extractSpacingTool({ rawData: mockSpacing }, context);
    expect(spacingPromise).toBeInstanceOf(Promise);

    const effectsPromise = extractEffectsTool({ rawData: mockEffects }, context);
    expect(effectsPromise).toBeInstanceOf(Promise);
  });

  test('extractor tools handle errors gracefully', async () => {
    const context = createToolContext('test-website');

    // Test with data that might cause errors in extraction logic
    const emptyData = {
      colors: [],
      backgrounds: [],
      borders: [],
    };

    const result = await extractColorsTool({ rawData: emptyData }, context);

    // Should still succeed with empty arrays (will use defaults)
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('colors');
  });
});
