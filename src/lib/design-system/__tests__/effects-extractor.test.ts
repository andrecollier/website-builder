/**
 * Effects Extractor Tests
 *
 * Tests for effects extraction including box shadow parsing,
 * border radius parsing, transition duration parsing, and
 * effect categorization (sm/md/lg/xl).
 */

import {
  parseShadowBlurRadius,
  normalizeShadow,
  parseRadius,
  parseTransitionDuration,
  extractTransitionDuration,
  formatDuration,
  formatRadius,
  categorizeShadows,
  categorizeRadii,
  categorizeTransitions,
  extractEffects,
  getDefaultEffectsExtraction,
  type RawEffectsData,
  type ShadowValue,
  type RadiusValue,
  type TransitionValue,
} from '../effects-extractor';

describe('Effects Extractor', () => {
  // ====================
  // BOX SHADOW PARSING
  // ====================

  describe('parseShadowBlurRadius', () => {
    it('should extract blur radius from standard box-shadow', () => {
      // offset-x offset-y blur-radius
      expect(parseShadowBlurRadius('0 4px 6px rgba(0,0,0,0.1)')).toBe(6);
      expect(parseShadowBlurRadius('2px 2px 10px #000')).toBe(10);
    });

    it('should return 0 for shadows without blur', () => {
      // Only offset-x and offset-y
      expect(parseShadowBlurRadius('2px 2px')).toBe(0);
    });

    it('should handle rem units', () => {
      expect(parseShadowBlurRadius('0 0 1rem rgba(0,0,0,0.1)')).toBe(16);
    });

    it('should return null for "none"', () => {
      expect(parseShadowBlurRadius('none')).toBeNull();
    });

    it('should return null for invalid shadows', () => {
      expect(parseShadowBlurRadius('')).toBeNull();
      expect(parseShadowBlurRadius('inherit')).toBeNull();
    });

    it('should handle inset shadows', () => {
      expect(parseShadowBlurRadius('inset 0 2px 4px rgba(0,0,0,0.1)')).toBe(4);
    });
  });

  describe('normalizeShadow', () => {
    it('should trim and return shadow string', () => {
      expect(normalizeShadow('  0 4px 6px rgba(0,0,0,0.1)  ')).toBe('0 4px 6px rgba(0,0,0,0.1)');
    });

    it('should return null for "none"', () => {
      expect(normalizeShadow('none')).toBeNull();
      expect(normalizeShadow('NONE')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(normalizeShadow('')).toBeNull();
    });

    it('should return null for invalid input', () => {
      expect(normalizeShadow('inherit')).toBeNull();
    });
  });

  // ====================
  // BORDER RADIUS PARSING
  // ====================

  describe('parseRadius', () => {
    it('should parse px values', () => {
      expect(parseRadius('4px')).toBe(4);
      expect(parseRadius('8px')).toBe(8);
      expect(parseRadius('16px')).toBe(16);
    });

    it('should parse rem values', () => {
      expect(parseRadius('0.25rem')).toBe(4);
      expect(parseRadius('0.5rem')).toBe(8);
      expect(parseRadius('1rem')).toBe(16);
    });

    it('should parse em values', () => {
      expect(parseRadius('0.5em')).toBe(8);
    });

    it('should return 0 for "0" and "none"', () => {
      expect(parseRadius('0')).toBe(0);
      expect(parseRadius('none')).toBe(0);
    });

    it('should return 9999 for 50% or higher (full radius)', () => {
      expect(parseRadius('50%')).toBe(9999);
      expect(parseRadius('100%')).toBe(9999);
    });

    it('should return null for percentages below 50%', () => {
      expect(parseRadius('25%')).toBeNull();
    });

    it('should return null for invalid values', () => {
      expect(parseRadius('')).toBeNull();
      expect(parseRadius('invalid')).toBeNull();
    });
  });

  // ====================
  // TRANSITION DURATION PARSING
  // ====================

  describe('parseTransitionDuration', () => {
    it('should parse ms values', () => {
      expect(parseTransitionDuration('200ms')).toBe(200);
      expect(parseTransitionDuration('150ms')).toBe(150);
    });

    it('should parse s values and convert to ms', () => {
      expect(parseTransitionDuration('0.2s')).toBe(200);
      expect(parseTransitionDuration('0.3s')).toBe(300);
      expect(parseTransitionDuration('1s')).toBe(1000);
    });

    it('should return 0 for zero duration', () => {
      expect(parseTransitionDuration('0')).toBe(0);
      expect(parseTransitionDuration('0s')).toBe(0);
      expect(parseTransitionDuration('0ms')).toBe(0);
    });

    it('should return null for "none"', () => {
      expect(parseTransitionDuration('none')).toBeNull();
    });

    it('should return null for invalid values', () => {
      expect(parseTransitionDuration('')).toBeNull();
      expect(parseTransitionDuration('invalid')).toBeNull();
    });
  });

  describe('extractTransitionDuration', () => {
    it('should extract duration from transition shorthand', () => {
      expect(extractTransitionDuration('all 200ms ease')).toBe(200);
      expect(extractTransitionDuration('opacity 0.3s linear')).toBe(300);
    });

    it('should handle complex transitions', () => {
      expect(extractTransitionDuration('transform 150ms ease-in-out, opacity 200ms')).toBe(150);
    });

    it('should return null for "none"', () => {
      expect(extractTransitionDuration('none')).toBeNull();
    });

    it('should return null for empty', () => {
      expect(extractTransitionDuration('')).toBeNull();
      expect(extractTransitionDuration('all')).toBeNull();
    });
  });

  // ====================
  // FORMATTING
  // ====================

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(200)).toBe('200ms');
      expect(formatDuration(150)).toBe('150ms');
    });
  });

  describe('formatRadius', () => {
    it('should format to rem for standard values', () => {
      expect(formatRadius(8)).toBe('0.5rem');
      expect(formatRadius(4)).toBe('0.25rem');
    });

    it('should return 9999px for full radius', () => {
      expect(formatRadius(9999)).toBe('9999px');
      expect(formatRadius(100)).toBe('9999px');
    });

    it('should format to px for non-standard values', () => {
      // Values that don't convert to nice rem
      const result = formatRadius(5);
      expect(result).toMatch(/px$|rem$/);
    });
  });

  // ====================
  // SHADOW CATEGORIZATION
  // ====================

  describe('categorizeShadows', () => {
    it('should categorize shadows by blur radius', () => {
      const shadows: ShadowValue[] = [
        { shadow: '0 1px 2px rgba(0,0,0,0.05)', blurRadius: 2, frequency: 5 },
        { shadow: '0 4px 6px rgba(0,0,0,0.1)', blurRadius: 6, frequency: 5 },
        { shadow: '0 10px 15px rgba(0,0,0,0.1)', blurRadius: 15, frequency: 5 },
        { shadow: '0 25px 50px rgba(0,0,0,0.1)', blurRadius: 50, frequency: 5 },
      ];

      const result = categorizeShadows(shadows);
      expect(result.sm).toBe('0 1px 2px rgba(0,0,0,0.05)');
      expect(result.md).toBe('0 4px 6px rgba(0,0,0,0.1)');
      expect(result.lg).toBe('0 10px 15px rgba(0,0,0,0.1)');
      expect(result.xl).toBe('0 25px 50px rgba(0,0,0,0.1)');
    });

    it('should select most frequent shadow in each category', () => {
      const shadows: ShadowValue[] = [
        { shadow: '0 1px 2px black', blurRadius: 2, frequency: 1 },
        { shadow: '0 2px 3px black', blurRadius: 3, frequency: 10 },
      ];

      const result = categorizeShadows(shadows);
      expect(result.sm).toBe('0 2px 3px black');
    });

    it('should return defaults for empty shadows', () => {
      const result = categorizeShadows([]);
      expect(result.sm).toBeDefined();
      expect(result.md).toBeDefined();
      expect(result.lg).toBeDefined();
      expect(result.xl).toBeDefined();
    });
  });

  // ====================
  // RADIUS CATEGORIZATION
  // ====================

  describe('categorizeRadii', () => {
    it('should categorize radii by size', () => {
      const radii: RadiusValue[] = [
        { radiusPx: 2, frequency: 5, original: '2px' },
        { radiusPx: 6, frequency: 5, original: '6px' },
        { radiusPx: 12, frequency: 5, original: '12px' },
        { radiusPx: 9999, frequency: 5, original: '9999px' },
      ];

      const result = categorizeRadii(radii);
      expect(result.sm).toBeDefined();
      expect(result.md).toBeDefined();
      expect(result.lg).toBeDefined();
      expect(result.full).toBe('9999px');
    });

    it('should skip 0 values', () => {
      const radii: RadiusValue[] = [
        { radiusPx: 0, frequency: 10, original: '0' },
        { radiusPx: 4, frequency: 5, original: '4px' },
      ];

      const result = categorizeRadii(radii);
      expect(result.sm).not.toBe('0');
    });

    it('should return defaults for empty radii', () => {
      const result = categorizeRadii([]);
      expect(result.sm).toBeDefined();
      expect(result.md).toBeDefined();
      expect(result.lg).toBeDefined();
      expect(result.full).toBeDefined();
    });
  });

  // ====================
  // TRANSITION CATEGORIZATION
  // ====================

  describe('categorizeTransitions', () => {
    it('should categorize transitions by duration', () => {
      const transitions: TransitionValue[] = [
        { durationMs: 100, frequency: 5, original: '100ms' },
        { durationMs: 200, frequency: 5, original: '200ms' },
        { durationMs: 400, frequency: 5, original: '400ms' },
      ];

      const result = categorizeTransitions(transitions);
      expect(result.fast).toBe('100ms');
      expect(result.normal).toBe('200ms');
      expect(result.slow).toBe('400ms');
    });

    it('should skip 0 duration', () => {
      const transitions: TransitionValue[] = [
        { durationMs: 0, frequency: 10, original: '0ms' },
        { durationMs: 150, frequency: 5, original: '150ms' },
      ];

      const result = categorizeTransitions(transitions);
      expect(result.fast).not.toBe('0ms');
    });

    it('should return defaults for empty transitions', () => {
      const result = categorizeTransitions([]);
      expect(result.fast).toBe('150ms');
      expect(result.normal).toBe('200ms');
      expect(result.slow).toBe('300ms');
    });
  });

  // ====================
  // MAIN EXTRACTION
  // ====================

  describe('extractEffects', () => {
    it('should combine all effect extractions', () => {
      const rawData: RawEffectsData = {
        boxShadows: ['0 1px 2px rgba(0,0,0,0.05)', '0 4px 6px rgba(0,0,0,0.1)'],
        borderRadii: ['4px', '8px', '16px'],
        transitions: ['all 200ms ease', 'opacity 300ms linear'],
      };

      const result = extractEffects(rawData);
      expect(result.shadows).toBeDefined();
      expect(result.radii).toBeDefined();
      expect(result.transitions).toBeDefined();
    });

    it('should handle empty data', () => {
      const rawData: RawEffectsData = {
        boxShadows: [],
        borderRadii: [],
        transitions: [],
      };

      const result = extractEffects(rawData);
      expect(result.shadows.sm).toBeDefined();
      expect(result.radii.sm).toBeDefined();
      expect(result.transitions.fast).toBeDefined();
    });

    it('should handle malformed CSS values', () => {
      const rawData: RawEffectsData = {
        boxShadows: ['invalid', 'none', ''],
        borderRadii: ['invalid', 'auto'],
        transitions: ['invalid'],
      };

      // Should not throw, returns defaults
      const result = extractEffects(rawData);
      expect(result.shadows).toBeDefined();
      expect(result.radii).toBeDefined();
      expect(result.transitions).toBeDefined();
    });

    it('should handle shorthand border-radius', () => {
      const rawData: RawEffectsData = {
        boxShadows: [],
        borderRadii: ['4px 8px'], // shorthand - takes first value
        transitions: [],
      };

      const result = extractEffects(rawData);
      // Should parse first value (4px)
      expect(result.radii.sm).toBeDefined();
    });
  });

  // ====================
  // DEFAULT EXTRACTION
  // ====================

  describe('getDefaultEffectsExtraction', () => {
    it('should return valid default effects', () => {
      const defaults = getDefaultEffectsExtraction();

      // Shadows
      expect(defaults.shadows.sm).toBeDefined();
      expect(defaults.shadows.md).toBeDefined();
      expect(defaults.shadows.lg).toBeDefined();
      expect(defaults.shadows.xl).toBeDefined();

      // Radii
      expect(defaults.radii.sm).toBeDefined();
      expect(defaults.radii.md).toBeDefined();
      expect(defaults.radii.lg).toBeDefined();
      expect(defaults.radii.full).toBe('9999px');

      // Transitions
      expect(defaults.transitions.fast).toBeDefined();
      expect(defaults.transitions.normal).toBeDefined();
      expect(defaults.transitions.slow).toBeDefined();
    });
  });
});
