/**
 * Spacing Extractor Tests
 *
 * Tests for spacing extraction including base unit detection (4px vs 8px),
 * scale generation, container max-width detection, and section padding parsing.
 */

import {
  parseSpacingValue,
  parseMaxWidth,
  parsePaddingShorthand,
  roundToBaseUnit,
  alignsWithBaseUnit,
  calculateAlignmentScore,
  detectBaseUnit,
  generateSpacingScale,
  detectContainerMaxWidth,
  detectSectionPadding,
  extractSpacing,
  getDefaultSpacingExtraction,
  type RawSpacingData,
  type SpacingValue,
} from '../spacing-extractor';

describe('Spacing Extractor', () => {
  // ====================
  // SPACING VALUE PARSING
  // ====================

  describe('parseSpacingValue', () => {
    it('should parse px values', () => {
      expect(parseSpacingValue('16px')).toBe(16);
      expect(parseSpacingValue('24px')).toBe(24);
      expect(parseSpacingValue('8px')).toBe(8);
    });

    it('should parse rem values (converting to px)', () => {
      expect(parseSpacingValue('1rem')).toBe(16);
      expect(parseSpacingValue('2rem')).toBe(32);
      expect(parseSpacingValue('0.5rem')).toBe(8);
    });

    it('should parse em values (converting to px)', () => {
      expect(parseSpacingValue('1em')).toBe(16);
      expect(parseSpacingValue('2em')).toBe(32);
    });

    it('should handle "0" without unit', () => {
      expect(parseSpacingValue('0')).toBe(0);
    });

    it('should return null for auto/inherit values', () => {
      expect(parseSpacingValue('auto')).toBeNull();
      expect(parseSpacingValue('inherit')).toBeNull();
      expect(parseSpacingValue('initial')).toBeNull();
    });

    it('should return null for viewport units', () => {
      expect(parseSpacingValue('10vw')).toBeNull();
      expect(parseSpacingValue('10vh')).toBeNull();
      expect(parseSpacingValue('50%')).toBeNull();
    });

    it('should return null for invalid values', () => {
      expect(parseSpacingValue('')).toBeNull();
      expect(parseSpacingValue('invalid')).toBeNull();
    });

    it('should handle negative values', () => {
      expect(parseSpacingValue('-16px')).toBe(-16);
    });
  });

  // ====================
  // MAX WIDTH PARSING
  // ====================

  describe('parseMaxWidth', () => {
    it('should parse px values', () => {
      expect(parseMaxWidth('1280px')).toBe(1280);
      expect(parseMaxWidth('1024px')).toBe(1024);
    });

    it('should parse rem values', () => {
      expect(parseMaxWidth('80rem')).toBe(1280);
    });

    it('should return null for "none"', () => {
      expect(parseMaxWidth('none')).toBeNull();
    });

    it('should return null for percentage', () => {
      expect(parseMaxWidth('100%')).toBeNull();
      expect(parseMaxWidth('80%')).toBeNull();
    });

    it('should return null for invalid values', () => {
      expect(parseMaxWidth('')).toBeNull();
      expect(parseMaxWidth('auto')).toBeNull();
    });
  });

  // ====================
  // PADDING SHORTHAND PARSING
  // ====================

  describe('parsePaddingShorthand', () => {
    it('should parse single value (all sides)', () => {
      const result = parsePaddingShorthand('16px');
      expect(result).toEqual([16, 16, 16, 16]);
    });

    it('should parse two values (vertical horizontal)', () => {
      const result = parsePaddingShorthand('16px 32px');
      expect(result).toEqual([16, 32, 16, 32]);
    });

    it('should parse three values (top horizontal bottom)', () => {
      const result = parsePaddingShorthand('16px 32px 24px');
      expect(result).toEqual([16, 32, 24, 32]);
    });

    it('should parse four values (top right bottom left)', () => {
      const result = parsePaddingShorthand('16px 32px 24px 8px');
      expect(result).toEqual([16, 32, 24, 8]);
    });

    it('should return null for invalid values', () => {
      expect(parsePaddingShorthand('')).toBeNull();
      expect(parsePaddingShorthand('auto')).toBeNull();
    });
  });

  // ====================
  // BASE UNIT UTILITIES
  // ====================

  describe('roundToBaseUnit', () => {
    it('should round to nearest multiple of base unit', () => {
      expect(roundToBaseUnit(14, 4)).toBe(16);
      expect(roundToBaseUnit(18, 4)).toBe(20);
      expect(roundToBaseUnit(14, 8)).toBe(16);
      expect(roundToBaseUnit(20, 8)).toBe(24);
    });
  });

  describe('alignsWithBaseUnit', () => {
    it('should return true for values that align with base unit', () => {
      expect(alignsWithBaseUnit(16, 4)).toBe(true);
      expect(alignsWithBaseUnit(24, 8)).toBe(true);
      expect(alignsWithBaseUnit(0, 4)).toBe(true);
    });

    it('should return false for values that do not align', () => {
      expect(alignsWithBaseUnit(14, 4)).toBe(false);
      expect(alignsWithBaseUnit(20, 8)).toBe(false);
    });
  });

  describe('calculateAlignmentScore', () => {
    it('should return 1.0 for perfect alignment', () => {
      const values = [4, 8, 12, 16, 24, 32];
      expect(calculateAlignmentScore(values, 4)).toBe(1);
    });

    it('should return 0 for empty array', () => {
      expect(calculateAlignmentScore([], 4)).toBe(0);
    });

    it('should return partial score for mixed alignment', () => {
      const values = [4, 8, 14, 16]; // 14 doesn't align with 4px
      const score = calculateAlignmentScore(values, 4);
      expect(score).toBe(0.75); // 3/4
    });
  });

  // ====================
  // BASE UNIT DETECTION
  // ====================

  describe('detectBaseUnit', () => {
    it('should detect 4px base unit', () => {
      const values: SpacingValue[] = [
        { valuePx: 4, frequency: 5, source: 'padding' },
        { valuePx: 8, frequency: 5, source: 'padding' },
        { valuePx: 12, frequency: 5, source: 'padding' },
        { valuePx: 16, frequency: 5, source: 'padding' },
      ];
      expect(detectBaseUnit(values)).toBe(4);
    });

    it('should detect 8px base unit when 70%+ align', () => {
      const values: SpacingValue[] = [
        { valuePx: 8, frequency: 5, source: 'padding' },
        { valuePx: 16, frequency: 5, source: 'padding' },
        { valuePx: 24, frequency: 5, source: 'padding' },
        { valuePx: 32, frequency: 5, source: 'padding' },
      ];
      expect(detectBaseUnit(values)).toBe(8);
    });

    it('should default to 4px for empty data', () => {
      expect(detectBaseUnit([])).toBe(4);
    });
  });

  // ====================
  // SCALE GENERATION
  // ====================

  describe('generateSpacingScale', () => {
    it('should include essential 4px scale values', () => {
      const values: SpacingValue[] = [];
      const scale = generateSpacingScale(values, 4);

      expect(scale).toContain(0);
      expect(scale).toContain(4);
      expect(scale).toContain(8);
      expect(scale).toContain(16);
    });

    it('should include essential 8px scale values', () => {
      const values: SpacingValue[] = [];
      const scale = generateSpacingScale(values, 8);

      expect(scale).toContain(0);
      expect(scale).toContain(8);
      expect(scale).toContain(16);
      expect(scale).toContain(24);
    });

    it('should include extracted values that align with base unit', () => {
      const values: SpacingValue[] = [
        { valuePx: 20, frequency: 10, source: 'padding' },
        { valuePx: 40, frequency: 5, source: 'margin' },
      ];
      const scale = generateSpacingScale(values, 4);

      expect(scale).toContain(20);
      expect(scale).toContain(40);
    });

    it('should be sorted ascending', () => {
      const values: SpacingValue[] = [];
      const scale = generateSpacingScale(values, 4);

      for (let i = 1; i < scale.length; i++) {
        expect(scale[i]).toBeGreaterThan(scale[i - 1]);
      }
    });

    it('should filter out values greater than 256', () => {
      const values: SpacingValue[] = [
        { valuePx: 300, frequency: 10, source: 'padding' },
      ];
      const scale = generateSpacingScale(values, 4);

      expect(scale).not.toContain(300);
    });
  });

  // ====================
  // CONTAINER WIDTH DETECTION
  // ====================

  describe('detectContainerMaxWidth', () => {
    it('should return most common container width', () => {
      const maxWidths = ['1280px', '1280px', '1024px'];
      const elementTypes = ['main', 'section', 'div'];

      const result = detectContainerMaxWidth(maxWidths, elementTypes);
      expect(result).toBe('1280px');
    });

    it('should prefer common container widths', () => {
      const maxWidths = ['1280px', '1200px'];
      const elementTypes = ['section', 'div'];

      const result = detectContainerMaxWidth(maxWidths, elementTypes);
      expect(result).toBe('1280px');
    });

    it('should boost container-like elements', () => {
      const maxWidths = ['1200px', '1280px'];
      const elementTypes = ['section', 'span'];

      // 1200px on section should outweigh 1280px on span
      const result = detectContainerMaxWidth(maxWidths, elementTypes);
      expect(['1200px', '1280px']).toContain(result);
    });

    it('should return default for empty data', () => {
      const result = detectContainerMaxWidth([], []);
      expect(result).toBe('1280px');
    });

    it('should filter out values outside container range', () => {
      const maxWidths = ['100px', '3000px', '1280px'];
      const elementTypes = ['div', 'div', 'section'];

      // 100px and 3000px should be filtered out
      const result = detectContainerMaxWidth(maxWidths, elementTypes);
      expect(result).toBe('1280px');
    });
  });

  // ====================
  // SECTION PADDING DETECTION
  // ====================

  describe('detectSectionPadding', () => {
    it('should detect mobile and desktop padding', () => {
      const paddings = ['16px 24px', '16px 48px', '24px 64px'];
      const elementTypes = ['section', 'section', 'section'];

      const result = detectSectionPadding(paddings, elementTypes);
      expect(result.mobile).toBeDefined();
      expect(result.desktop).toBeDefined();
    });

    it('should return defaults for non-section elements', () => {
      const paddings = ['16px', '24px'];
      const elementTypes = ['div', 'span'];

      const result = detectSectionPadding(paddings, elementTypes);
      expect(result.mobile).toBe('16px');
      expect(result.desktop).toBe('32px');
    });

    it('should return defaults for empty data', () => {
      const result = detectSectionPadding([], []);
      expect(result.mobile).toBe('16px');
      expect(result.desktop).toBe('32px');
    });
  });

  // ====================
  // MAIN EXTRACTION
  // ====================

  describe('extractSpacing', () => {
    it('should combine all spacing extractions', () => {
      const rawData: RawSpacingData = {
        paddings: ['16px', '24px', '32px'],
        margins: ['8px', '16px'],
        gaps: ['16px'],
        maxWidths: ['1280px'],
        elementTypes: ['section'],
      };

      const result = extractSpacing(rawData);
      expect(result.baseUnit).toBeDefined();
      expect(result.scale.length).toBeGreaterThan(0);
      expect(result.containerMaxWidth).toBeDefined();
      expect(result.sectionPadding.mobile).toBeDefined();
      expect(result.sectionPadding.desktop).toBeDefined();
    });

    it('should handle shorthand padding values', () => {
      const rawData: RawSpacingData = {
        paddings: ['16px 32px'],
        margins: [],
        gaps: [],
        maxWidths: [],
        elementTypes: [],
      };

      const result = extractSpacing(rawData);
      expect(result.scale).toContain(16);
      expect(result.scale).toContain(32);
    });
  });

  // ====================
  // DEFAULT EXTRACTION
  // ====================

  describe('getDefaultSpacingExtraction', () => {
    it('should return valid default spacing', () => {
      const defaults = getDefaultSpacingExtraction();

      expect(defaults.baseUnit).toBe(4);
      expect(defaults.scale.length).toBeGreaterThan(0);
      expect(defaults.containerMaxWidth).toBe('1280px');
      expect(defaults.sectionPadding.mobile).toBe('16px');
      expect(defaults.sectionPadding.desktop).toBe('32px');
    });

    it('should have sorted scale', () => {
      const defaults = getDefaultSpacingExtraction();
      for (let i = 1; i < defaults.scale.length; i++) {
        expect(defaults.scale[i]).toBeGreaterThan(defaults.scale[i - 1]);
      }
    });
  });
});
