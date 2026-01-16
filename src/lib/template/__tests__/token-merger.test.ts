/**
 * Token Merger Tests
 *
 * Tests for design token merging including validation utilities,
 * path operations, override application, and main merge functions.
 */

import {
  validateReferenceExists,
  validateMergeStrategy,
  validateReferencesReady,
  parseTokenPath,
  getValueAtPath,
  setValueAtPath,
  deepClone,
  applyOverride,
  mergeTokens,
  mergeTokensFromMap,
  createSimpleMergeStrategy,
  type MergeTokensInput,
  type MergeTokensResult,
  type MergeOptions,
} from '../token-merger';
import type { Reference, MergeStrategy, TokenOverride, DesignSystem } from '@/types';

describe('Token Merger', () => {
  // ====================
  // TEST DATA SETUP
  // ====================

  const mockReference1: Reference = {
    id: 'ref1',
    url: 'https://example.com/ref1',
    status: 'ready',
    tokens: {
      meta: { sourceUrl: 'https://example.com/ref1', extractedAt: '2024-01-01', version: 1 },
      colors: {
        primary: ['#3b82f6'],
        secondary: ['#8b5cf6'],
        neutral: ['#64748b'],
        semantic: { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' },
        palettes: {},
      },
      typography: {
        fonts: { heading: 'Inter', body: 'Inter', mono: 'Fira Code' },
        scale: { xs: '12px', sm: '14px', base: '16px', lg: '18px', xl: '20px' },
        weights: { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700' },
        lineHeights: { tight: '1.25', normal: '1.5', relaxed: '1.75' },
      },
      spacing: {
        baseUnit: 4,
        scale: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
        containerMaxWidth: '1280px',
        sectionPadding: { mobile: '32px', desktop: '64px' },
      },
      effects: {
        shadows: { sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 4px 6px rgba(0,0,0,0.1)' },
        radii: { sm: '4px', md: '8px', lg: '12px', full: '9999px' },
        transitions: { fast: '150ms', base: '200ms', slow: '300ms' },
      },
    },
  };

  const mockReference2: Reference = {
    id: 'ref2',
    url: 'https://example.com/ref2',
    status: 'ready',
    tokens: {
      meta: { sourceUrl: 'https://example.com/ref2', extractedAt: '2024-01-02', version: 1 },
      colors: {
        primary: ['#ef4444'],
        secondary: ['#f59e0b'],
        neutral: ['#737373'],
        semantic: { success: '#10b981', error: '#dc2626', warning: '#f59e0b', info: '#06b6d4' },
        palettes: {},
      },
      typography: {
        fonts: { heading: 'Roboto', body: 'Open Sans', mono: 'Source Code Pro' },
        scale: { xs: '11px', sm: '13px', base: '15px', lg: '17px', xl: '19px' },
        weights: { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700' },
        lineHeights: { tight: '1.2', normal: '1.6', relaxed: '1.8' },
      },
      spacing: {
        baseUnit: 8,
        scale: { xs: '8px', sm: '16px', md: '24px', lg: '32px', xl: '48px' },
        containerMaxWidth: '1440px',
        sectionPadding: { mobile: '24px', desktop: '48px' },
      },
      effects: {
        shadows: { sm: '0 2px 4px rgba(0,0,0,0.1)', md: '0 8px 16px rgba(0,0,0,0.15)' },
        radii: { sm: '2px', md: '6px', lg: '10px', full: '9999px' },
        transitions: { fast: '100ms', base: '250ms', slow: '400ms' },
      },
    },
  };

  const mockReference3: Reference = {
    id: 'ref3',
    url: 'https://example.com/ref3',
    status: 'processing',
    tokens: null,
  };

  // ====================
  // VALIDATION UTILITIES
  // ====================

  describe('validateReferenceExists', () => {
    it('should return true for existing reference ID', () => {
      expect(validateReferenceExists([mockReference1, mockReference2], 'ref1')).toBe(true);
      expect(validateReferenceExists([mockReference1, mockReference2], 'ref2')).toBe(true);
    });

    it('should return false for non-existing reference ID', () => {
      expect(validateReferenceExists([mockReference1, mockReference2], 'ref999')).toBe(false);
    });

    it('should return false for empty reference list', () => {
      expect(validateReferenceExists([], 'ref1')).toBe(false);
    });
  });

  describe('validateMergeStrategy', () => {
    it('should validate correct merge strategy', () => {
      const strategy: MergeStrategy = {
        base: 'ref1',
        overrides: [
          { referenceId: 'ref2', path: 'colors.primary', value: undefined },
        ],
      };

      const result = validateMergeStrategy(strategy, [mockReference1, mockReference2]);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should fail when base reference is missing', () => {
      const strategy: MergeStrategy = {
        base: '',
        overrides: [],
      };

      const result = validateMergeStrategy(strategy, [mockReference1]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Merge strategy must specify a base reference ID');
    });

    it('should fail when base reference does not exist', () => {
      const strategy: MergeStrategy = {
        base: 'ref999',
        overrides: [],
      };

      const result = validateMergeStrategy(strategy, [mockReference1]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('ref999'))).toBe(true);
    });

    it('should fail when overrides is not an array', () => {
      const strategy: any = {
        base: 'ref1',
        overrides: null,
      };

      const result = validateMergeStrategy(strategy, [mockReference1]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Merge strategy must include an overrides array');
    });

    it('should fail when override is missing referenceId', () => {
      const strategy: MergeStrategy = {
        base: 'ref1',
        overrides: [
          { referenceId: '', path: 'colors.primary', value: undefined },
        ],
      };

      const result = validateMergeStrategy(strategy, [mockReference1]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('missing referenceId'))).toBe(true);
    });

    it('should fail when override references non-existent reference', () => {
      const strategy: MergeStrategy = {
        base: 'ref1',
        overrides: [
          { referenceId: 'ref999', path: 'colors.primary', value: undefined },
        ],
      };

      const result = validateMergeStrategy(strategy, [mockReference1]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('ref999'))).toBe(true);
    });

    it('should fail when override is missing path', () => {
      const strategy: MergeStrategy = {
        base: 'ref1',
        overrides: [
          { referenceId: 'ref2', path: '', value: undefined },
        ],
      };

      const result = validateMergeStrategy(strategy, [mockReference1, mockReference2]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('missing path'))).toBe(true);
    });
  });

  describe('validateReferencesReady', () => {
    it('should pass for all ready references', () => {
      const result = validateReferencesReady([mockReference1, mockReference2]);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should fail for non-ready reference', () => {
      const result = validateReferencesReady([mockReference1, mockReference3]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('ref3') && e.includes('processing'))).toBe(true);
    });

    it('should fail for reference without tokens', () => {
      const result = validateReferencesReady([mockReference3]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('ref3') && e.includes('no tokens'))).toBe(true);
    });

    it('should pass for empty reference list', () => {
      const result = validateReferencesReady([]);
      expect(result.isValid).toBe(true);
    });
  });

  // ====================
  // PATH UTILITIES
  // ====================

  describe('parseTokenPath', () => {
    it('should parse simple path', () => {
      expect(parseTokenPath('colors')).toEqual(['colors']);
    });

    it('should parse nested path', () => {
      expect(parseTokenPath('colors.primary')).toEqual(['colors', 'primary']);
    });

    it('should parse deeply nested path', () => {
      expect(parseTokenPath('typography.fonts.heading')).toEqual(['typography', 'fonts', 'heading']);
    });

    it('should filter out empty segments', () => {
      expect(parseTokenPath('colors..primary')).toEqual(['colors', 'primary']);
      expect(parseTokenPath('.colors.primary.')).toEqual(['colors', 'primary']);
    });

    it('should return empty array for empty string', () => {
      expect(parseTokenPath('')).toEqual([]);
    });
  });

  describe('getValueAtPath', () => {
    const testObj = {
      colors: {
        primary: ['#3b82f6'],
        secondary: {
          main: '#8b5cf6',
          hover: '#7c3aed',
        },
      },
      typography: {
        fonts: {
          heading: 'Inter',
        },
      },
    };

    it('should get value at simple path', () => {
      expect(getValueAtPath(testObj, ['colors'])).toEqual(testObj.colors);
    });

    it('should get value at nested path', () => {
      expect(getValueAtPath(testObj, ['colors', 'primary'])).toEqual(['#3b82f6']);
    });

    it('should get value at deeply nested path', () => {
      expect(getValueAtPath(testObj, ['typography', 'fonts', 'heading'])).toBe('Inter');
    });

    it('should return undefined for non-existent path', () => {
      expect(getValueAtPath(testObj, ['colors', 'tertiary'])).toBeUndefined();
    });

    it('should return undefined for path through null', () => {
      expect(getValueAtPath(testObj, ['colors', 'primary', 'nested'])).toBeUndefined();
    });

    it('should return object itself for empty path', () => {
      expect(getValueAtPath(testObj, [])).toEqual(testObj);
    });
  });

  describe('setValueAtPath', () => {
    it('should set value at simple path', () => {
      const obj = { colors: {} };
      const result = setValueAtPath(obj, ['colors'], { primary: '#ff0000' });
      expect(result).toBe(true);
      expect(obj.colors).toEqual({ primary: '#ff0000' });
    });

    it('should set value at nested path', () => {
      const obj: any = { colors: {} };
      const result = setValueAtPath(obj, ['colors', 'primary'], '#ff0000');
      expect(result).toBe(true);
      expect(obj.colors.primary).toBe('#ff0000');
    });

    it('should set value at deeply nested path', () => {
      const obj: any = {};
      const result = setValueAtPath(obj, ['typography', 'fonts', 'heading'], 'Roboto');
      expect(result).toBe(true);
      expect(obj.typography.fonts.heading).toBe('Roboto');
    });

    it('should create intermediate objects as needed', () => {
      const obj: any = {};
      setValueAtPath(obj, ['a', 'b', 'c'], 'value');
      expect(obj.a.b.c).toBe('value');
    });

    it('should overwrite existing values', () => {
      const obj: any = { colors: { primary: '#3b82f6' } };
      setValueAtPath(obj, ['colors', 'primary'], '#ff0000');
      expect(obj.colors.primary).toBe('#ff0000');
    });

    it('should return false for empty path', () => {
      const obj = {};
      const result = setValueAtPath(obj, [], 'value');
      expect(result).toBe(false);
    });
  });

  describe('deepClone', () => {
    it('should clone simple object', () => {
      const original = { a: 1, b: 2 };
      const clone = deepClone(original);
      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
    });

    it('should clone nested object', () => {
      const original = { a: { b: { c: 1 } } };
      const clone = deepClone(original);
      expect(clone).toEqual(original);
      expect(clone.a).not.toBe(original.a);
    });

    it('should clone arrays', () => {
      const original = { colors: ['#ff0000', '#00ff00'] };
      const clone = deepClone(original);
      clone.colors.push('#0000ff');
      expect(original.colors.length).toBe(2);
      expect(clone.colors.length).toBe(3);
    });

    it('should handle null and undefined', () => {
      expect(deepClone(null)).toBeNull();
      expect(deepClone(undefined)).toBeUndefined();
    });

    it('should handle primitives', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(true)).toBe(true);
    });
  });

  // ====================
  // OVERRIDE APPLICATION
  // ====================

  describe('applyOverride', () => {
    it('should apply override with value from source reference', () => {
      const designSystem: DesignSystem = deepClone(mockReference1.tokens!);
      const override: TokenOverride = {
        referenceId: 'ref2',
        path: 'colors.primary',
        value: undefined,
      };

      const result = applyOverride(designSystem, override, [mockReference1, mockReference2], {});
      expect(result.success).toBe(true);
      expect(designSystem.colors.primary).toEqual(mockReference2.tokens!.colors.primary);
    });

    it('should apply override with explicit value', () => {
      const designSystem: DesignSystem = deepClone(mockReference1.tokens!);
      const override: TokenOverride = {
        referenceId: 'ref2',
        path: 'colors.primary',
        value: ['#custom'],
      };

      const result = applyOverride(designSystem, override, [mockReference1, mockReference2], {});
      expect(result.success).toBe(true);
      expect(designSystem.colors.primary).toEqual(['#custom']);
    });

    it('should apply deeply nested override', () => {
      const designSystem: DesignSystem = deepClone(mockReference1.tokens!);
      const override: TokenOverride = {
        referenceId: 'ref2',
        path: 'typography.fonts.heading',
        value: undefined,
      };

      const result = applyOverride(designSystem, override, [mockReference1, mockReference2], {});
      expect(result.success).toBe(true);
      expect(designSystem.typography.fonts.heading).toBe(mockReference2.tokens!.typography.fonts.heading);
    });

    it('should fail for non-existent reference', () => {
      const designSystem: DesignSystem = deepClone(mockReference1.tokens!);
      const override: TokenOverride = {
        referenceId: 'ref999',
        path: 'colors.primary',
        value: undefined,
      };

      const result = applyOverride(designSystem, override, [mockReference1, mockReference2], {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('ref999');
    });

    it('should fail for invalid path', () => {
      const designSystem: DesignSystem = deepClone(mockReference1.tokens!);
      const override: TokenOverride = {
        referenceId: 'ref2',
        path: '',
        value: undefined,
      };

      const result = applyOverride(designSystem, override, [mockReference1, mockReference2], {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid path');
    });

    it('should fail for non-existent path in source reference', () => {
      const designSystem: DesignSystem = deepClone(mockReference1.tokens!);
      const override: TokenOverride = {
        referenceId: 'ref2',
        path: 'nonexistent.path',
        value: undefined,
      };

      const result = applyOverride(designSystem, override, [mockReference1, mockReference2], {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Value not found');
    });
  });

  // ====================
  // MAIN MERGE FUNCTION
  // ====================

  describe('mergeTokens', () => {
    it('should merge tokens with valid strategy', () => {
      const input: MergeTokensInput = {
        references: [mockReference1, mockReference2],
        strategy: {
          base: 'ref1',
          overrides: [
            { referenceId: 'ref2', path: 'colors.primary', value: undefined },
          ],
        },
      };

      const result = mergeTokens(input);
      expect(result.designSystem).toBeDefined();
      expect(result.appliedOverrides).toContain('colors.primary');
      expect(result.failedOverrides.length).toBe(0);
      expect(result.designSystem.colors.primary).toEqual(mockReference2.tokens!.colors.primary);
    });

    it('should use base reference as foundation', () => {
      const input: MergeTokensInput = {
        references: [mockReference1, mockReference2],
        strategy: {
          base: 'ref1',
          overrides: [],
        },
      };

      const result = mergeTokens(input);
      expect(result.designSystem.typography.fonts.heading).toBe(mockReference1.tokens!.typography.fonts.heading);
      expect(result.designSystem.spacing.baseUnit).toBe(mockReference1.tokens!.spacing.baseUnit);
    });

    it('should apply multiple overrides', () => {
      const input: MergeTokensInput = {
        references: [mockReference1, mockReference2],
        strategy: {
          base: 'ref1',
          overrides: [
            { referenceId: 'ref2', path: 'colors.primary', value: undefined },
            { referenceId: 'ref2', path: 'typography.fonts.heading', value: undefined },
            { referenceId: 'ref2', path: 'spacing.baseUnit', value: undefined },
          ],
        },
      };

      const result = mergeTokens(input);
      expect(result.appliedOverrides.length).toBe(3);
      expect(result.designSystem.colors.primary).toEqual(mockReference2.tokens!.colors.primary);
      expect(result.designSystem.typography.fonts.heading).toBe(mockReference2.tokens!.typography.fonts.heading);
      expect(result.designSystem.spacing.baseUnit).toBe(mockReference2.tokens!.spacing.baseUnit);
    });

    it('should update meta with merged sourceUrl', () => {
      const input: MergeTokensInput = {
        references: [mockReference1, mockReference2],
        strategy: {
          base: 'ref1',
          overrides: [],
        },
      };

      const result = mergeTokens(input);
      expect(result.designSystem.meta.sourceUrl).toContain('merged');
      expect(result.designSystem.meta.sourceUrl).toContain('ref1');
      expect(result.designSystem.meta.sourceUrl).toContain('ref2');
    });

    it('should use custom timestamp when provided', () => {
      const customTimestamp = '2024-12-01T00:00:00Z';
      const input: MergeTokensInput = {
        references: [mockReference1, mockReference2],
        strategy: {
          base: 'ref1',
          overrides: [],
        },
      };

      const result = mergeTokens(input, { timestamp: customTimestamp });
      expect(result.designSystem.meta.extractedAt).toBe(customTimestamp);
    });

    it('should handle failed overrides gracefully in non-strict mode', () => {
      const input: MergeTokensInput = {
        references: [mockReference1, mockReference2],
        strategy: {
          base: 'ref1',
          overrides: [
            { referenceId: 'ref2', path: 'colors.primary', value: undefined },
            { referenceId: 'ref2', path: 'invalid.path', value: undefined },
          ],
        },
      };

      const result = mergeTokens(input, { strict: false });
      expect(result.appliedOverrides).toContain('colors.primary');
      expect(result.failedOverrides.length).toBe(1);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should throw error for failed overrides in strict mode', () => {
      const input: MergeTokensInput = {
        references: [mockReference1, mockReference2],
        strategy: {
          base: 'ref1',
          overrides: [
            { referenceId: 'ref2', path: 'invalid.path', value: undefined },
          ],
        },
      };

      expect(() => mergeTokens(input, { strict: true })).toThrow();
    });

    it('should throw error for invalid merge strategy', () => {
      const input: MergeTokensInput = {
        references: [mockReference1, mockReference2],
        strategy: {
          base: '',
          overrides: [],
        },
      };

      expect(() => mergeTokens(input)).toThrow('Invalid merge strategy');
    });

    it('should throw error for missing base reference', () => {
      const input: MergeTokensInput = {
        references: [mockReference1, mockReference2],
        strategy: {
          base: 'ref999',
          overrides: [],
        },
      };

      expect(() => mergeTokens(input)).toThrow();
    });

    it('should throw error for base reference without tokens', () => {
      const input: MergeTokensInput = {
        references: [mockReference3],
        strategy: {
          base: 'ref3',
          overrides: [],
        },
      };

      expect(() => mergeTokens(input)).toThrow('has no tokens');
    });

    it('should add warnings for non-ready references in non-strict mode', () => {
      const input: MergeTokensInput = {
        references: [mockReference1, mockReference3],
        strategy: {
          base: 'ref1',
          overrides: [],
        },
      };

      const result = mergeTokens(input, { strict: false });
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('ref3'))).toBe(true);
    });

    it('should throw error for non-ready references in strict mode', () => {
      const input: MergeTokensInput = {
        references: [mockReference1, mockReference3],
        strategy: {
          base: 'ref1',
          overrides: [],
        },
      };

      expect(() => mergeTokens(input, { strict: true })).toThrow('References not ready');
    });
  });

  describe('mergeTokensFromMap', () => {
    it('should merge tokens from references map', () => {
      const referencesMap: Record<string, Reference> = {
        ref1: mockReference1,
        ref2: mockReference2,
      };
      const strategy: MergeStrategy = {
        base: 'ref1',
        overrides: [
          { referenceId: 'ref2', path: 'colors.primary', value: undefined },
        ],
      };

      const result = mergeTokensFromMap(referencesMap, strategy);
      expect(result.designSystem).toBeDefined();
      expect(result.appliedOverrides).toContain('colors.primary');
    });

    it('should handle empty references map', () => {
      const referencesMap: Record<string, Reference> = {};
      const strategy: MergeStrategy = {
        base: 'ref1',
        overrides: [],
      };

      expect(() => mergeTokensFromMap(referencesMap, strategy)).toThrow();
    });
  });

  describe('createSimpleMergeStrategy', () => {
    it('should create strategy with only base', () => {
      const strategy = createSimpleMergeStrategy('ref1');
      expect(strategy.base).toBe('ref1');
      expect(strategy.overrides.length).toBe(0);
    });

    it('should create strategy with colors override', () => {
      const strategy = createSimpleMergeStrategy('ref1', { colors: 'ref2' });
      expect(strategy.base).toBe('ref1');
      expect(strategy.overrides.length).toBe(1);
      expect(strategy.overrides[0].path).toBe('colors');
      expect(strategy.overrides[0].referenceId).toBe('ref2');
    });

    it('should create strategy with typography override', () => {
      const strategy = createSimpleMergeStrategy('ref1', { typography: 'ref2' });
      expect(strategy.overrides.some((o) => o.path === 'typography')).toBe(true);
    });

    it('should create strategy with spacing override', () => {
      const strategy = createSimpleMergeStrategy('ref1', { spacing: 'ref2' });
      expect(strategy.overrides.some((o) => o.path === 'spacing')).toBe(true);
    });

    it('should create strategy with effects override', () => {
      const strategy = createSimpleMergeStrategy('ref1', { effects: 'ref2' });
      expect(strategy.overrides.some((o) => o.path === 'effects')).toBe(true);
    });

    it('should create strategy with multiple overrides', () => {
      const strategy = createSimpleMergeStrategy('ref1', {
        colors: 'ref2',
        typography: 'ref3',
        spacing: 'ref2',
        effects: 'ref3',
      });
      expect(strategy.base).toBe('ref1');
      expect(strategy.overrides.length).toBe(4);
    });

    it('should set value to undefined for all overrides', () => {
      const strategy = createSimpleMergeStrategy('ref1', {
        colors: 'ref2',
        typography: 'ref2',
      });
      strategy.overrides.forEach((override) => {
        expect(override.value).toBeUndefined();
      });
    });
  });
});
