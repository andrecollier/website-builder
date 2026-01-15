/**
 * Color Extractor Tests
 *
 * Tests for color extraction, normalization, WCAG contrast calculation,
 * palette generation, and color categorization.
 */

import {
  normalizeColor,
  isNeutralColor,
  getColorHue,
  colorDistance,
  deduplicateColors,
  calculateContrast,
  checkWcagCompliance,
  getContrastResult,
  generatePalette,
  generateColorName,
  findSemanticColor,
  categorizeColors,
  extractColors,
  getDefaultColorExtraction,
  type RawColorData,
  type ColorWithFrequency,
} from '../color-extractor';

describe('Color Extractor', () => {
  // ====================
  // COLOR NORMALIZATION
  // ====================

  describe('normalizeColor', () => {
    it('should convert valid hex color to lowercase hex', () => {
      expect(normalizeColor('#FF0000')).toBe('#ff0000');
      expect(normalizeColor('#00ff00')).toBe('#00ff00');
    });

    it('should convert rgb color to hex', () => {
      expect(normalizeColor('rgb(255, 0, 0)')).toBe('#ff0000');
      expect(normalizeColor('rgb(0, 255, 0)')).toBe('#00ff00');
      expect(normalizeColor('rgb(0, 0, 255)')).toBe('#0000ff');
    });

    it('should convert rgba color to hex', () => {
      expect(normalizeColor('rgba(255, 0, 0, 1)')).toBe('#ff0000');
      expect(normalizeColor('rgba(0, 0, 0, 0.5)')).toBe('#000000');
    });

    it('should return null for transparent colors', () => {
      expect(normalizeColor('transparent')).toBeNull();
      expect(normalizeColor('rgba(0, 0, 0, 0)')).toBeNull();
    });

    it('should return null for invalid colors', () => {
      expect(normalizeColor('invalid')).toBeNull();
      expect(normalizeColor('')).toBeNull();
      expect(normalizeColor('inherit')).toBeNull();
    });

    it('should handle named colors', () => {
      expect(normalizeColor('red')).toBe('#ff0000');
      expect(normalizeColor('blue')).toBe('#0000ff');
    });
  });

  // ====================
  // NEUTRAL COLOR DETECTION
  // ====================

  describe('isNeutralColor', () => {
    it('should detect grayscale colors as neutral', () => {
      expect(isNeutralColor('#ffffff')).toBe(true);
      expect(isNeutralColor('#000000')).toBe(true);
      expect(isNeutralColor('#808080')).toBe(true);
    });

    it('should detect low saturation colors as neutral', () => {
      expect(isNeutralColor('#f5f5f5')).toBe(true);
      expect(isNeutralColor('#e0e0e0')).toBe(true);
    });

    it('should not detect saturated colors as neutral', () => {
      expect(isNeutralColor('#ff0000')).toBe(false);
      expect(isNeutralColor('#00ff00')).toBe(false);
      expect(isNeutralColor('#3b82f6')).toBe(false);
    });
  });

  // ====================
  // COLOR HUE
  // ====================

  describe('getColorHue', () => {
    it('should return correct hue for primary colors', () => {
      // Red is around 0/360
      const redHue = getColorHue('#ff0000');
      expect(redHue === 0 || redHue === 360).toBe(true);

      // Green is around 120
      expect(getColorHue('#00ff00')).toBeCloseTo(120, 0);

      // Blue is around 240
      expect(getColorHue('#0000ff')).toBeCloseTo(240, 0);
    });

    it('should return 0 for grayscale colors', () => {
      expect(getColorHue('#ffffff')).toBe(0);
      expect(getColorHue('#000000')).toBe(0);
    });
  });

  // ====================
  // COLOR DISTANCE
  // ====================

  describe('colorDistance', () => {
    it('should return 0 for identical colors', () => {
      expect(colorDistance('#ff0000', '#ff0000')).toBe(0);
    });

    it('should return high value for very different colors', () => {
      const distance = colorDistance('#ff0000', '#0000ff');
      expect(distance).toBeGreaterThan(50);
    });

    it('should return low value for similar colors', () => {
      const distance = colorDistance('#ff0000', '#fe0000');
      expect(distance).toBeLessThan(5);
    });
  });

  // ====================
  // DEDUPLICATION
  // ====================

  describe('deduplicateColors', () => {
    it('should merge similar colors', () => {
      const colors: ColorWithFrequency[] = [
        { color: '#ff0000', frequency: 5, normalized: '#ff0000' },
        { color: '#fe0101', frequency: 3, normalized: '#fe0101' },
      ];

      const result = deduplicateColors(colors);
      expect(result.length).toBe(1);
      expect(result[0].frequency).toBe(8);
    });

    it('should keep distinct colors separate', () => {
      const colors: ColorWithFrequency[] = [
        { color: '#ff0000', frequency: 5, normalized: '#ff0000' },
        { color: '#0000ff', frequency: 3, normalized: '#0000ff' },
      ];

      const result = deduplicateColors(colors);
      expect(result.length).toBe(2);
    });

    it('should sort by frequency descending', () => {
      const colors: ColorWithFrequency[] = [
        { color: '#ff0000', frequency: 1, normalized: '#ff0000' },
        { color: '#0000ff', frequency: 10, normalized: '#0000ff' },
      ];

      const result = deduplicateColors(colors);
      expect(result[0].normalized).toBe('#0000ff');
    });
  });

  // ====================
  // WCAG CONTRAST
  // ====================

  describe('calculateContrast', () => {
    it('should return 21 for black on white', () => {
      const contrast = calculateContrast('#000000', '#ffffff');
      expect(contrast).toBeCloseTo(21, 0);
    });

    it('should return 1 for same colors', () => {
      expect(calculateContrast('#ff0000', '#ff0000')).toBe(1);
    });
  });

  describe('checkWcagCompliance', () => {
    it('should pass AA for ratio >= 4.5', () => {
      const result = checkWcagCompliance(4.5);
      expect(result.aa).toBe(true);
      expect(result.aaa).toBe(false);
    });

    it('should pass AAA for ratio >= 7', () => {
      const result = checkWcagCompliance(7);
      expect(result.aa).toBe(true);
      expect(result.aaa).toBe(true);
    });

    it('should pass AA Large for ratio >= 3', () => {
      const result = checkWcagCompliance(3);
      expect(result.aaLarge).toBe(true);
      expect(result.aa).toBe(false);
    });

    it('should round ratio to 2 decimal places', () => {
      const result = checkWcagCompliance(4.5678);
      expect(result.ratio).toBe(4.57);
    });
  });

  describe('getContrastResult', () => {
    it('should return correct compliance for black/white', () => {
      const result = getContrastResult('#000000', '#ffffff');
      expect(result.aa).toBe(true);
      expect(result.aaa).toBe(true);
    });
  });

  // ====================
  // PALETTE GENERATION
  // ====================

  describe('generatePalette', () => {
    it('should generate all 11 shades (50-950)', () => {
      const palette = generatePalette('#3b82f6');
      const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

      for (const shade of shades) {
        expect(palette).toHaveProperty(shade);
        expect(palette[shade as keyof typeof palette]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it('should generate lighter colors for lower shades', () => {
      const palette = generatePalette('#3b82f6');
      // 50 should be lighter than 950
      const lightness50 = getLightness(palette['50']);
      const lightness950 = getLightness(palette['950']);
      expect(lightness50).toBeGreaterThan(lightness950);
    });

    it('should return grayscale palette for invalid color', () => {
      // Invalid colors should fall back to grayscale
      const palette = generatePalette('#808080');
      expect(palette).toHaveProperty('50');
      expect(palette).toHaveProperty('950');
    });
  });

  // ====================
  // COLOR NAMING
  // ====================

  describe('generateColorName', () => {
    it('should generate correct names based on hue', () => {
      expect(generateColorName('#ff0000', 0)).toBe('red');
      expect(generateColorName('#00ff00', 0)).toBe('green');
      expect(generateColorName('#0000ff', 0)).toBe('blue');
    });

    it('should generate gray for neutral colors', () => {
      expect(generateColorName('#808080', 0)).toBe('gray');
    });

    it('should append index for subsequent colors', () => {
      expect(generateColorName('#ff0000', 1)).toBe('red-2');
      expect(generateColorName('#ff0000', 2)).toBe('red-3');
    });
  });

  // ====================
  // SEMANTIC COLOR FINDING
  // ====================

  describe('findSemanticColor', () => {
    it('should find success color (green hues)', () => {
      const colors: ColorWithFrequency[] = [
        { color: '#22c55e', frequency: 5, normalized: '#22c55e' },
        { color: '#ff0000', frequency: 3, normalized: '#ff0000' },
      ];
      expect(findSemanticColor(colors, 'success')).toBe('#22c55e');
    });

    it('should find error color (red hues)', () => {
      const colors: ColorWithFrequency[] = [
        { color: '#ef4444', frequency: 5, normalized: '#ef4444' },
        { color: '#00ff00', frequency: 3, normalized: '#00ff00' },
      ];
      expect(findSemanticColor(colors, 'error')).toBe('#ef4444');
    });

    it('should return fallback if no match found', () => {
      const colors: ColorWithFrequency[] = [
        { color: '#808080', frequency: 5, normalized: '#808080' },
      ];
      expect(findSemanticColor(colors, 'success')).toBe('#22c55e');
    });
  });

  // ====================
  // COLOR CATEGORIZATION
  // ====================

  describe('categorizeColors', () => {
    it('should separate neutral colors', () => {
      const colors: ColorWithFrequency[] = [
        { color: '#808080', frequency: 5, normalized: '#808080' },
        { color: '#ffffff', frequency: 3, normalized: '#ffffff' },
        { color: '#3b82f6', frequency: 2, normalized: '#3b82f6' },
      ];

      const result = categorizeColors(colors);
      expect(result.neutral).toContain('#808080');
      expect(result.neutral).toContain('#ffffff');
      expect(result.primary).toContain('#3b82f6');
    });

    it('should put top accent colors in primary', () => {
      const colors: ColorWithFrequency[] = [
        { color: '#3b82f6', frequency: 10, normalized: '#3b82f6' },
        { color: '#ef4444', frequency: 8, normalized: '#ef4444' },
        { color: '#22c55e', frequency: 6, normalized: '#22c55e' },
        { color: '#f59e0b', frequency: 4, normalized: '#f59e0b' },
      ];

      const result = categorizeColors(colors);
      expect(result.primary.length).toBeLessThanOrEqual(3);
      expect(result.primary).toContain('#3b82f6');
    });

    it('should put remaining accent colors in secondary', () => {
      const colors: ColorWithFrequency[] = [
        { color: '#3b82f6', frequency: 10, normalized: '#3b82f6' },
        { color: '#ef4444', frequency: 8, normalized: '#ef4444' },
        { color: '#22c55e', frequency: 6, normalized: '#22c55e' },
        { color: '#f59e0b', frequency: 4, normalized: '#f59e0b' },
        { color: '#8b5cf6', frequency: 2, normalized: '#8b5cf6' },
      ];

      const result = categorizeColors(colors);
      expect(result.secondary.length).toBeGreaterThan(0);
    });
  });

  // ====================
  // MAIN EXTRACTION
  // ====================

  describe('extractColors', () => {
    it('should extract colors from raw data', () => {
      const rawData: RawColorData = {
        colors: ['#3b82f6', '#ef4444', '#22c55e'],
        backgrounds: ['#ffffff', '#f5f5f5'],
        borders: ['#e5e7eb'],
      };

      const result = extractColors(rawData);
      expect(result.primary.length).toBeGreaterThan(0);
      expect(result.semantic).toHaveProperty('success');
      expect(result.semantic).toHaveProperty('error');
      expect(result.palettes).toBeDefined();
    });

    it('should handle empty input data', () => {
      const rawData: RawColorData = {
        colors: [],
        backgrounds: [],
        borders: [],
      };

      const result = extractColors(rawData);
      expect(result.primary.length).toBeGreaterThan(0); // Should have defaults
      expect(result.semantic.success).toBeDefined();
    });

    it('should generate palettes for primary colors', () => {
      const rawData: RawColorData = {
        colors: ['#3b82f6'],
        backgrounds: [],
        borders: [],
      };

      const result = extractColors(rawData);
      expect(Object.keys(result.palettes).length).toBeGreaterThan(0);
    });

    it('should always include a gray palette', () => {
      const rawData: RawColorData = {
        colors: ['#3b82f6'],
        backgrounds: ['#f5f5f5'],
        borders: [],
      };

      const result = extractColors(rawData);
      expect(result.palettes).toHaveProperty('gray');
    });
  });

  // ====================
  // DEFAULT EXTRACTION
  // ====================

  describe('getDefaultColorExtraction', () => {
    it('should return valid default colors', () => {
      const defaults = getDefaultColorExtraction();

      expect(defaults.primary.length).toBeGreaterThan(0);
      expect(defaults.secondary.length).toBeGreaterThan(0);
      expect(defaults.neutral.length).toBeGreaterThan(0);
      expect(defaults.semantic.success).toBeDefined();
      expect(defaults.semantic.error).toBeDefined();
      expect(defaults.semantic.warning).toBeDefined();
      expect(defaults.semantic.info).toBeDefined();
      expect(Object.keys(defaults.palettes).length).toBeGreaterThan(0);
    });
  });
});

// Helper function for tests
function getLightness(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return (max + min) / 2;
}
