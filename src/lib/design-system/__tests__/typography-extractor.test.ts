/**
 * Typography Extractor Tests
 *
 * Tests for typography extraction including px-to-rem conversion,
 * font family normalization, font weight parsing, size scale extraction,
 * and line height parsing.
 */

import {
  pxToRem,
  remToPx,
  parseFontSize,
  parseLineHeight,
  parseFontWeight,
  normalizeFontFamily,
  isMonospaceFont,
  isHeadingTag,
  isBodyTag,
  extractFonts,
  extractSizeScale,
  extractWeights,
  extractLineHeights,
  extractTypography,
  getDefaultTypographyExtraction,
  type RawTypographyData,
} from '../typography-extractor';

describe('Typography Extractor', () => {
  // ====================
  // PX TO REM CONVERSION
  // ====================

  describe('pxToRem', () => {
    it('should convert pixels to rem with base 16px', () => {
      expect(pxToRem(16)).toBe('1rem');
      expect(pxToRem(32)).toBe('2rem');
      expect(pxToRem(8)).toBe('0.5rem');
    });

    it('should round to 3 decimal places', () => {
      expect(pxToRem(14)).toBe('0.875rem');
      expect(pxToRem(15)).toBe('0.938rem');
    });

    it('should handle 0', () => {
      expect(pxToRem(0)).toBe('0rem');
    });
  });

  describe('remToPx', () => {
    it('should convert rem to pixels with base 16px', () => {
      expect(remToPx(1)).toBe(16);
      expect(remToPx(2)).toBe(32);
      expect(remToPx(0.5)).toBe(8);
    });
  });

  // ====================
  // FONT SIZE PARSING
  // ====================

  describe('parseFontSize', () => {
    it('should parse px values', () => {
      expect(parseFontSize('16px')).toBe(16);
      expect(parseFontSize('24px')).toBe(24);
    });

    it('should parse rem values', () => {
      expect(parseFontSize('1rem')).toBe(16);
      expect(parseFontSize('1.5rem')).toBe(24);
    });

    it('should parse em values', () => {
      expect(parseFontSize('1em')).toBe(16);
      expect(parseFontSize('2em')).toBe(32);
    });

    it('should parse pt values', () => {
      // 12pt = 16px (96/72 ratio)
      expect(parseFontSize('12pt')).toBeCloseTo(16, 0);
    });

    it('should parse percentage values', () => {
      expect(parseFontSize('100%')).toBe(16);
      expect(parseFontSize('50%')).toBe(8);
    });

    it('should parse unitless values as px', () => {
      expect(parseFontSize('16')).toBe(16);
    });

    it('should return null for invalid values', () => {
      expect(parseFontSize('invalid')).toBeNull();
      expect(parseFontSize('')).toBeNull();
      expect(parseFontSize('auto')).toBeNull();
    });
  });

  // ====================
  // LINE HEIGHT PARSING
  // ====================

  describe('parseLineHeight', () => {
    it('should parse unitless values as ratios', () => {
      expect(parseLineHeight('1.5')).toBe(1.5);
      expect(parseLineHeight('1.25')).toBe(1.25);
    });

    it('should handle "normal" keyword', () => {
      expect(parseLineHeight('normal')).toBe(1.5);
    });

    it('should convert px line-height to ratio when font size provided', () => {
      expect(parseLineHeight('24px', 16)).toBe(1.5);
      expect(parseLineHeight('32px', 16)).toBe(2);
    });

    it('should convert percentage to ratio', () => {
      expect(parseLineHeight('150%')).toBe(1.5);
      expect(parseLineHeight('100%')).toBe(1);
    });

    it('should return null for invalid values', () => {
      expect(parseLineHeight('')).toBeNull();
      expect(parseLineHeight('invalid')).toBeNull();
    });
  });

  // ====================
  // FONT WEIGHT PARSING
  // ====================

  describe('parseFontWeight', () => {
    it('should parse numeric weights', () => {
      expect(parseFontWeight('400')).toBe(400);
      expect(parseFontWeight('700')).toBe(700);
    });

    it('should round to nearest standard weight', () => {
      expect(parseFontWeight('450')).toBe(400);
      expect(parseFontWeight('550')).toBe(600);
    });

    it('should parse named weights', () => {
      expect(parseFontWeight('normal')).toBe(400);
      expect(parseFontWeight('bold')).toBe(700);
      expect(parseFontWeight('light')).toBe(300);
    });

    it('should parse various named weight variants', () => {
      expect(parseFontWeight('thin')).toBe(100);
      expect(parseFontWeight('extralight')).toBe(200);
      expect(parseFontWeight('extra-light')).toBe(200);
      expect(parseFontWeight('medium')).toBe(500);
      expect(parseFontWeight('semibold')).toBe(600);
      expect(parseFontWeight('semi-bold')).toBe(600);
      expect(parseFontWeight('extrabold')).toBe(800);
      expect(parseFontWeight('black')).toBe(900);
    });

    it('should return null for invalid values', () => {
      expect(parseFontWeight('')).toBeNull();
      expect(parseFontWeight('invalid')).toBeNull();
    });
  });

  // ====================
  // FONT FAMILY NORMALIZATION
  // ====================

  describe('normalizeFontFamily', () => {
    it('should extract primary font from stack', () => {
      expect(normalizeFontFamily('Arial, sans-serif')).toBe('Arial');
      expect(normalizeFontFamily('Roboto, Arial, sans-serif')).toBe('Roboto');
    });

    it('should remove quotes from font names', () => {
      expect(normalizeFontFamily('"Helvetica Neue"')).toBe('Helvetica Neue');
      expect(normalizeFontFamily("'Open Sans'")).toBe('Open Sans');
    });

    it('should handle empty or invalid input', () => {
      expect(normalizeFontFamily('')).toBe('');
      expect(normalizeFontFamily(null as unknown as string)).toBe('');
    });
  });

  describe('isMonospaceFont', () => {
    it('should detect monospace fonts', () => {
      expect(isMonospaceFont('Menlo')).toBe(true);
      expect(isMonospaceFont('Monaco')).toBe(true);
      expect(isMonospaceFont('Consolas')).toBe(true);
      expect(isMonospaceFont('Courier New')).toBe(true);
    });

    it('should not detect regular fonts as monospace', () => {
      expect(isMonospaceFont('Arial')).toBe(false);
      expect(isMonospaceFont('Roboto')).toBe(false);
    });
  });

  // ====================
  // TAG DETECTION
  // ====================

  describe('isHeadingTag', () => {
    it('should detect heading tags', () => {
      expect(isHeadingTag('h1')).toBe(true);
      expect(isHeadingTag('h2')).toBe(true);
      expect(isHeadingTag('H3')).toBe(true);
    });

    it('should not detect non-heading tags', () => {
      expect(isHeadingTag('p')).toBe(false);
      expect(isHeadingTag('div')).toBe(false);
    });
  });

  describe('isBodyTag', () => {
    it('should detect body text tags', () => {
      expect(isBodyTag('p')).toBe(true);
      expect(isBodyTag('span')).toBe(true);
      expect(isBodyTag('div')).toBe(true);
    });

    it('should not detect heading tags as body', () => {
      expect(isBodyTag('h1')).toBe(false);
      expect(isBodyTag('h2')).toBe(false);
    });
  });

  // ====================
  // FONT EXTRACTION
  // ====================

  describe('extractFonts', () => {
    it('should extract heading font from h1-h6 elements', () => {
      const fontFamilies = ['Poppins', 'Inter', 'Inter'];
      const elementTypes = ['h1', 'p', 'span'];

      const result = extractFonts(fontFamilies, elementTypes);
      expect(result.heading).toBe('Poppins');
    });

    it('should extract body font from body elements', () => {
      const fontFamilies = ['Poppins', 'Inter', 'Inter'];
      const elementTypes = ['h1', 'p', 'span'];

      const result = extractFonts(fontFamilies, elementTypes);
      expect(result.body).toBe('Inter');
    });

    it('should extract mono font', () => {
      const fontFamilies = ['Inter', 'Menlo'];
      const elementTypes = ['p', 'code'];

      const result = extractFonts(fontFamilies, elementTypes);
      expect(result.mono).toBe('Menlo');
    });

    it('should handle missing font families with fallbacks', () => {
      const fontFamilies: string[] = [];
      const elementTypes: string[] = [];

      const result = extractFonts(fontFamilies, elementTypes);
      expect(result.heading).toContain('system-ui');
      expect(result.body).toContain('system-ui');
    });
  });

  // ====================
  // SIZE SCALE EXTRACTION
  // ====================

  describe('extractSizeScale', () => {
    it('should extract sizes for heading levels', () => {
      const fontSizes = ['48px', '36px', '24px', '20px', '18px', '16px', '16px', '14px'];
      const elementTypes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'small'];

      const result = extractSizeScale(fontSizes, elementTypes);
      expect(result.h1).toBe('3rem'); // 48px
      expect(result.h2).toBe('2.25rem'); // 36px
      expect(result.body).toBeDefined();
    });

    it('should return defaults for empty data', () => {
      const result = extractSizeScale([], []);
      expect(result.h1).toBeDefined();
      expect(result.body).toBeDefined();
    });
  });

  // ====================
  // WEIGHT EXTRACTION
  // ====================

  describe('extractWeights', () => {
    it('should extract unique weights', () => {
      const fontWeights = ['400', '400', '700', '700', '600'];
      const result = extractWeights(fontWeights);

      expect(result).toContain(400);
      expect(result).toContain(600);
      expect(result).toContain(700);
    });

    it('should ensure 400 and 700 are included', () => {
      const fontWeights = ['300', '500'];
      const result = extractWeights(fontWeights);

      expect(result).toContain(400);
      expect(result).toContain(700);
    });

    it('should sort weights ascending', () => {
      const fontWeights = ['700', '300', '500'];
      const result = extractWeights(fontWeights);

      expect(result[0]).toBeLessThan(result[result.length - 1]);
    });

    it('should return defaults for empty data', () => {
      const result = extractWeights([]);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain(400);
    });
  });

  // ====================
  // LINE HEIGHT EXTRACTION
  // ====================

  describe('extractLineHeights', () => {
    it('should categorize line heights into tight, normal, relaxed', () => {
      const lineHeights = ['1.2', '1.4', '1.5', '1.7', '1.8'];
      const fontSizes = ['16px', '16px', '16px', '16px', '16px'];

      const result = extractLineHeights(lineHeights, fontSizes);
      expect(result.tight).toBeLessThan(result.normal);
      expect(result.normal).toBeLessThan(result.relaxed);
    });

    it('should return defaults for empty data', () => {
      const result = extractLineHeights([], []);

      expect(result.tight).toBe(1.25);
      expect(result.normal).toBe(1.5);
      expect(result.relaxed).toBe(1.75);
    });
  });

  // ====================
  // MAIN EXTRACTION
  // ====================

  describe('extractTypography', () => {
    it('should combine all typography extractions', () => {
      const rawData: RawTypographyData = {
        fontFamilies: ['Poppins', 'Inter'],
        fontSizes: ['32px', '16px'],
        fontWeights: ['700', '400'],
        lineHeights: ['1.25', '1.5'],
        elementTypes: ['h1', 'p'],
      };

      const result = extractTypography(rawData);
      expect(result.fonts).toBeDefined();
      expect(result.scale).toBeDefined();
      expect(result.weights).toBeDefined();
      expect(result.lineHeights).toBeDefined();
    });
  });

  // ====================
  // DEFAULT EXTRACTION
  // ====================

  describe('getDefaultTypographyExtraction', () => {
    it('should return valid default typography', () => {
      const defaults = getDefaultTypographyExtraction();

      expect(defaults.fonts.heading).toBeDefined();
      expect(defaults.fonts.body).toBeDefined();
      expect(defaults.fonts.mono).toBeDefined();
      expect(defaults.scale.h1).toBeDefined();
      expect(defaults.scale.body).toBeDefined();
      expect(defaults.weights.length).toBeGreaterThan(0);
      expect(defaults.lineHeights.tight).toBeLessThan(defaults.lineHeights.relaxed);
    });
  });
});
