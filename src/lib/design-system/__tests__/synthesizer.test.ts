/**
 * Synthesizer Tests
 *
 * Tests for the design system synthesizer including combining extractions,
 * handling missing data, validation utilities, meta generation,
 * merge and clone operations.
 */

import {
  hasValidColorData,
  hasValidTypographyData,
  hasValidSpacingData,
  hasValidEffectsData,
  validateRawPageData,
  generateMeta,
  synthesizeDesignSystem,
  combineExtractions,
  getDefaultDesignSystem,
  mergeDesignSystems,
  hasDesignSystemChanged,
  cloneDesignSystem,
  type RawPageData,
  type RawColorData,
  type RawTypographyData,
  type RawSpacingData,
  type RawEffectsData,
} from '../synthesizer';
import type { DesignSystem, ColorExtraction } from '@/types';

describe('Synthesizer', () => {
  // ====================
  // VALIDATION UTILITIES
  // ====================

  describe('hasValidColorData', () => {
    it('should return true for data with colors', () => {
      const data: RawColorData = {
        colors: ['#ff0000'],
        backgrounds: [],
        borders: [],
      };
      expect(hasValidColorData(data)).toBe(true);
    });

    it('should return true for data with backgrounds', () => {
      const data: RawColorData = {
        colors: [],
        backgrounds: ['#ffffff'],
        borders: [],
      };
      expect(hasValidColorData(data)).toBe(true);
    });

    it('should return true for data with borders', () => {
      const data: RawColorData = {
        colors: [],
        backgrounds: [],
        borders: ['#e5e7eb'],
      };
      expect(hasValidColorData(data)).toBe(true);
    });

    it('should return false for empty data', () => {
      const data: RawColorData = {
        colors: [],
        backgrounds: [],
        borders: [],
      };
      expect(hasValidColorData(data)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(hasValidColorData(null)).toBe(false);
      expect(hasValidColorData(undefined)).toBe(false);
    });
  });

  describe('hasValidTypographyData', () => {
    it('should return true for data with font families', () => {
      const data: RawTypographyData = {
        fontFamilies: ['Arial'],
        fontSizes: [],
        fontWeights: [],
        lineHeights: [],
        elementTypes: [],
      };
      expect(hasValidTypographyData(data)).toBe(true);
    });

    it('should return false for empty font families', () => {
      const data: RawTypographyData = {
        fontFamilies: [],
        fontSizes: [],
        fontWeights: [],
        lineHeights: [],
        elementTypes: [],
      };
      expect(hasValidTypographyData(data)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(hasValidTypographyData(null)).toBe(false);
      expect(hasValidTypographyData(undefined)).toBe(false);
    });
  });

  describe('hasValidSpacingData', () => {
    it('should return true for data with paddings', () => {
      const data: RawSpacingData = {
        paddings: ['16px'],
        margins: [],
        gaps: [],
        maxWidths: [],
        elementTypes: [],
      };
      expect(hasValidSpacingData(data)).toBe(true);
    });

    it('should return true for data with margins', () => {
      const data: RawSpacingData = {
        paddings: [],
        margins: ['16px'],
        gaps: [],
        maxWidths: [],
        elementTypes: [],
      };
      expect(hasValidSpacingData(data)).toBe(true);
    });

    it('should return true for data with gaps', () => {
      const data: RawSpacingData = {
        paddings: [],
        margins: [],
        gaps: ['16px'],
        maxWidths: [],
        elementTypes: [],
      };
      expect(hasValidSpacingData(data)).toBe(true);
    });

    it('should return false for empty spacing', () => {
      const data: RawSpacingData = {
        paddings: [],
        margins: [],
        gaps: [],
        maxWidths: [],
        elementTypes: [],
      };
      expect(hasValidSpacingData(data)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(hasValidSpacingData(null)).toBe(false);
      expect(hasValidSpacingData(undefined)).toBe(false);
    });
  });

  describe('hasValidEffectsData', () => {
    it('should return true for any effects data (min threshold is 0)', () => {
      const data: RawEffectsData = {
        boxShadows: [],
        borderRadii: [],
        transitions: [],
      };
      // Effects have 0 threshold so empty is valid
      expect(hasValidEffectsData(data)).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(hasValidEffectsData(null)).toBe(false);
      expect(hasValidEffectsData(undefined)).toBe(false);
    });
  });

  describe('validateRawPageData', () => {
    it('should return isValid true for complete data', () => {
      const data: RawPageData = {
        url: 'https://example.com',
        colors: { colors: ['#ff0000'], backgrounds: [], borders: [] },
        typography: { fontFamilies: ['Arial'], fontSizes: [], fontWeights: [], lineHeights: [], elementTypes: [] },
        spacing: { paddings: ['16px'], margins: [], gaps: [], maxWidths: [], elementTypes: [] },
        effects: { boxShadows: [], borderRadii: [], transitions: [] },
      };

      const result = validateRawPageData(data);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should return warnings for missing data categories', () => {
      const data: RawPageData = {
        url: 'https://example.com',
        colors: { colors: [], backgrounds: [], borders: [] },
        typography: { fontFamilies: [], fontSizes: [], fontWeights: [], lineHeights: [], elementTypes: [] },
        spacing: { paddings: [], margins: [], gaps: [], maxWidths: [], elementTypes: [] },
        effects: { boxShadows: [], borderRadii: [], transitions: [] },
      };

      const result = validateRawPageData(data);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should return error for null data', () => {
      const result = validateRawPageData(null);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return error for missing URL', () => {
      const data: RawPageData = {
        url: '',
        colors: { colors: ['#ff0000'], backgrounds: [], borders: [] },
        typography: { fontFamilies: ['Arial'], fontSizes: [], fontWeights: [], lineHeights: [], elementTypes: [] },
        spacing: { paddings: ['16px'], margins: [], gaps: [], maxWidths: [], elementTypes: [] },
        effects: { boxShadows: [], borderRadii: [], transitions: [] },
      };

      const result = validateRawPageData(data);
      expect(result.errors).toContain('Missing source URL in page data');
    });
  });

  // ====================
  // META GENERATION
  // ====================

  describe('generateMeta', () => {
    it('should generate meta with source URL', () => {
      const meta = generateMeta('https://example.com');
      expect(meta.sourceUrl).toBe('https://example.com');
    });

    it('should generate meta with extractedAt timestamp', () => {
      const meta = generateMeta('https://example.com');
      expect(meta.extractedAt).toBeDefined();
      expect(() => new Date(meta.extractedAt)).not.toThrow();
    });

    it('should use default version when not specified', () => {
      const meta = generateMeta('https://example.com');
      expect(meta.version).toBe(1);
    });

    it('should use custom version when specified', () => {
      const meta = generateMeta('https://example.com', 2);
      expect(meta.version).toBe(2);
    });

    it('should handle empty URL', () => {
      const meta = generateMeta('');
      expect(meta.sourceUrl).toBe('unknown');
    });
  });

  // ====================
  // MAIN SYNTHESIS
  // ====================

  describe('synthesizeDesignSystem', () => {
    it('should combine all extractions', () => {
      const rawData: RawPageData = {
        url: 'https://example.com',
        colors: { colors: ['#3b82f6'], backgrounds: ['#ffffff'], borders: ['#e5e7eb'] },
        typography: { fontFamilies: ['Inter'], fontSizes: ['16px'], fontWeights: ['400'], lineHeights: ['1.5'], elementTypes: ['p'] },
        spacing: { paddings: ['16px', '32px'], margins: ['8px'], gaps: ['16px'], maxWidths: ['1280px'], elementTypes: ['section'] },
        effects: { boxShadows: ['0 1px 2px rgba(0,0,0,0.05)'], borderRadii: ['4px', '8px'], transitions: ['all 200ms ease'] },
      };

      const result = synthesizeDesignSystem(rawData);
      expect(result.meta.sourceUrl).toBe('https://example.com');
      expect(result.colors).toBeDefined();
      expect(result.typography).toBeDefined();
      expect(result.spacing).toBeDefined();
      expect(result.effects).toBeDefined();
    });

    it('should handle missing data with defaults', () => {
      const rawData: RawPageData = {
        url: 'https://example.com',
        colors: { colors: [], backgrounds: [], borders: [] },
        typography: { fontFamilies: [], fontSizes: [], fontWeights: [], lineHeights: [], elementTypes: [] },
        spacing: { paddings: [], margins: [], gaps: [], maxWidths: [], elementTypes: [] },
        effects: { boxShadows: [], borderRadii: [], transitions: [] },
      };

      const result = synthesizeDesignSystem(rawData);
      // Should use defaults
      expect(result.colors.primary.length).toBeGreaterThan(0);
      expect(result.typography.fonts.body).toBeDefined();
    });

    it('should support skip options', () => {
      const rawData: RawPageData = {
        url: 'https://example.com',
        colors: { colors: ['#ff0000'], backgrounds: [], borders: [] },
        typography: { fontFamilies: ['Custom'], fontSizes: [], fontWeights: [], lineHeights: [], elementTypes: [] },
        spacing: { paddings: [], margins: [], gaps: [], maxWidths: [], elementTypes: [] },
        effects: { boxShadows: [], borderRadii: [], transitions: [] },
      };

      const result = synthesizeDesignSystem(rawData, { skipColors: true, skipTypography: true });
      // Should use defaults despite data being present
      expect(result.colors.primary).toContain('#3b82f6'); // Default blue
    });

    it('should support custom version', () => {
      const rawData: RawPageData = {
        url: 'https://example.com',
        colors: { colors: [], backgrounds: [], borders: [] },
        typography: { fontFamilies: [], fontSizes: [], fontWeights: [], lineHeights: [], elementTypes: [] },
        spacing: { paddings: [], margins: [], gaps: [], maxWidths: [], elementTypes: [] },
        effects: { boxShadows: [], borderRadii: [], transitions: [] },
      };

      const result = synthesizeDesignSystem(rawData, { version: 5 });
      expect(result.meta.version).toBe(5);
    });
  });

  describe('combineExtractions', () => {
    it('should combine individual extractions', () => {
      const colors: ColorExtraction = {
        primary: ['#ff0000'],
        secondary: ['#00ff00'],
        neutral: ['#808080'],
        semantic: { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' },
        palettes: {},
      };

      const result = combineExtractions('https://example.com', { colors });
      expect(result.colors).toEqual(colors);
      // Other categories should use defaults
      expect(result.typography).toBeDefined();
      expect(result.spacing).toBeDefined();
      expect(result.effects).toBeDefined();
    });

    it('should use defaults for missing extractions', () => {
      const result = combineExtractions('https://example.com', {});
      expect(result.colors).toBeDefined();
      expect(result.typography).toBeDefined();
      expect(result.spacing).toBeDefined();
      expect(result.effects).toBeDefined();
    });
  });

  // ====================
  // DEFAULT DESIGN SYSTEM
  // ====================

  describe('getDefaultDesignSystem', () => {
    it('should return complete default design system', () => {
      const defaults = getDefaultDesignSystem();

      expect(defaults.meta).toBeDefined();
      expect(defaults.colors).toBeDefined();
      expect(defaults.typography).toBeDefined();
      expect(defaults.spacing).toBeDefined();
      expect(defaults.effects).toBeDefined();
    });

    it('should use provided source URL', () => {
      const defaults = getDefaultDesignSystem('https://custom.com');
      expect(defaults.meta.sourceUrl).toBe('https://custom.com');
    });

    it('should use "default" as source URL when not provided', () => {
      const defaults = getDefaultDesignSystem();
      expect(defaults.meta.sourceUrl).toBe('default');
    });
  });

  // ====================
  // MERGE OPERATIONS
  // ====================

  describe('mergeDesignSystems', () => {
    it('should merge colors from override', () => {
      const base = getDefaultDesignSystem();
      const override: Partial<DesignSystem> = {
        colors: {
          ...base.colors,
          primary: ['#ff0000'],
        },
      };

      const result = mergeDesignSystems(base, override);
      expect(result.colors.primary).toContain('#ff0000');
    });

    it('should keep base values for non-overridden categories', () => {
      const base = getDefaultDesignSystem();
      const override: Partial<DesignSystem> = {
        colors: {
          ...base.colors,
          primary: ['#ff0000'],
        },
      };

      const result = mergeDesignSystems(base, override);
      expect(result.typography).toEqual(base.typography);
      expect(result.spacing).toEqual(base.spacing);
      expect(result.effects).toEqual(base.effects);
    });

    it('should update extractedAt timestamp', () => {
      const base = getDefaultDesignSystem();
      const baseMeta = base.meta.extractedAt;

      // Small delay to ensure different timestamp
      const result = mergeDesignSystems(base, {});
      expect(result.meta.extractedAt).not.toBe(baseMeta);
    });
  });

  // ====================
  // CHANGE DETECTION
  // ====================

  describe('hasDesignSystemChanged', () => {
    it('should return false for identical systems', () => {
      const original = getDefaultDesignSystem();
      const current = cloneDesignSystem(original);

      expect(hasDesignSystemChanged(original, current)).toBe(false);
    });

    it('should return true for changed colors', () => {
      const original = getDefaultDesignSystem();
      const current = cloneDesignSystem(original);
      current.colors.primary = ['#ff0000'];

      expect(hasDesignSystemChanged(original, current)).toBe(true);
    });

    it('should return true for changed typography', () => {
      const original = getDefaultDesignSystem();
      const current = cloneDesignSystem(original);
      current.typography.fonts.heading = 'Custom Font';

      expect(hasDesignSystemChanged(original, current)).toBe(true);
    });

    it('should return true for changed spacing', () => {
      const original = getDefaultDesignSystem();
      const current = cloneDesignSystem(original);
      current.spacing.baseUnit = 8;

      expect(hasDesignSystemChanged(original, current)).toBe(true);
    });

    it('should return true for changed effects', () => {
      const original = getDefaultDesignSystem();
      const current = cloneDesignSystem(original);
      current.effects.shadows.sm = 'custom shadow';

      expect(hasDesignSystemChanged(original, current)).toBe(true);
    });

    it('should ignore meta changes', () => {
      const original = getDefaultDesignSystem();
      const current = cloneDesignSystem(original);
      current.meta.sourceUrl = 'different-url';
      current.meta.extractedAt = 'different-date';
      current.meta.version = 999;

      expect(hasDesignSystemChanged(original, current)).toBe(false);
    });
  });

  // ====================
  // CLONE OPERATIONS
  // ====================

  describe('cloneDesignSystem', () => {
    it('should create a deep copy', () => {
      const original = getDefaultDesignSystem();
      const clone = cloneDesignSystem(original);

      // Modify clone
      clone.colors.primary.push('#ff0000');

      // Original should be unchanged
      expect(original.colors.primary).not.toContain('#ff0000');
    });

    it('should clone all nested objects', () => {
      const original = getDefaultDesignSystem();
      const clone = cloneDesignSystem(original);

      expect(clone.meta).toEqual(original.meta);
      expect(clone.colors).toEqual(original.colors);
      expect(clone.typography).toEqual(original.typography);
      expect(clone.spacing).toEqual(original.spacing);
      expect(clone.effects).toEqual(original.effects);
    });
  });
});
