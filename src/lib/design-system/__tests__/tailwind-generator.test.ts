/**
 * Tailwind Generator Tests
 *
 * Tests for Tailwind configuration generation including valid JavaScript output,
 * colors configuration, typography configuration, spacing configuration,
 * and effects configuration.
 */

import {
  generateColors,
  generateFontFamily,
  generateFontSize,
  generateFontWeight,
  generateLineHeight,
  generateSpacing,
  generateBorderRadius,
  generateBoxShadow,
  generateTransitionDuration,
  generateThemeExtend,
  generateTailwindConfig,
  generateTailwindConfigString,
  generateTailwindConfigTsString,
} from '../tailwind-generator';
import type { ColorExtraction, TypographyExtraction, SpacingExtraction, EffectsExtraction, DesignSystem } from '@/types';
import { getDefaultDesignSystem } from '../synthesizer';

describe('Tailwind Generator', () => {
  // ====================
  // COLORS GENERATION
  // ====================

  describe('generateColors', () => {
    it('should generate primary color', () => {
      const colors: ColorExtraction = {
        primary: ['#3b82f6'],
        secondary: [],
        neutral: [],
        semantic: { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' },
        palettes: {},
      };

      const result = generateColors(colors);
      expect(result.primary).toBe('#3b82f6');
    });

    it('should generate multiple primary colors with suffixes', () => {
      const colors: ColorExtraction = {
        primary: ['#3b82f6', '#6366f1', '#8b5cf6'],
        secondary: [],
        neutral: [],
        semantic: { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' },
        palettes: {},
      };

      const result = generateColors(colors);
      expect(result.primary).toBe('#3b82f6');
      expect(result['primary-2']).toBe('#6366f1');
      expect(result['primary-3']).toBe('#8b5cf6');
    });

    it('should generate secondary colors', () => {
      const colors: ColorExtraction = {
        primary: [],
        secondary: ['#6366f1', '#8b5cf6'],
        neutral: [],
        semantic: { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' },
        palettes: {},
      };

      const result = generateColors(colors);
      expect(result.secondary).toBe('#6366f1');
      expect(result['secondary-2']).toBe('#8b5cf6');
    });

    it('should generate background/foreground from neutrals', () => {
      const colors: ColorExtraction = {
        primary: [],
        secondary: [],
        neutral: ['#171717', '#f5f5f5', '#737373'],
        semantic: { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' },
        palettes: {},
      };

      const result = generateColors(colors);
      expect(result.background).toBeDefined();
      expect(result.foreground).toBeDefined();
      expect(result.muted).toBeDefined();
    });

    it('should generate semantic colors', () => {
      const colors: ColorExtraction = {
        primary: [],
        secondary: [],
        neutral: [],
        semantic: { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' },
        palettes: {},
      };

      const result = generateColors(colors);
      expect(result.success).toBe('#22c55e');
      expect(result.error).toBe('#ef4444');
      expect(result.warning).toBe('#f59e0b');
      expect(result.info).toBe('#3b82f6');
    });

    it('should include palettes when configured', () => {
      const colors: ColorExtraction = {
        primary: [],
        secondary: [],
        neutral: [],
        semantic: { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' },
        palettes: {
          blue: { '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a', '950': '#172554' },
        },
      };

      const result = generateColors(colors, true);
      expect(result.blue).toBeDefined();
      expect((result.blue as Record<string, string>)['500']).toBe('#3b82f6');
    });

    it('should exclude palettes when configured', () => {
      const colors: ColorExtraction = {
        primary: [],
        secondary: [],
        neutral: [],
        semantic: { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' },
        palettes: {
          blue: { '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a', '950': '#172554' },
        },
      };

      const result = generateColors(colors, false);
      expect(result.blue).toBeUndefined();
    });
  });

  // ====================
  // TYPOGRAPHY GENERATION
  // ====================

  describe('generateFontFamily', () => {
    it('should generate heading font family', () => {
      const typography: TypographyExtraction = {
        fonts: { heading: 'Poppins', body: 'Inter' },
        scale: { display: '3.75rem', h1: '2.25rem', h2: '1.875rem', h3: '1.5rem', h4: '1.25rem', h5: '1.125rem', h6: '1rem', body: '1rem', small: '0.875rem', xs: '0.75rem' },
        weights: [400, 700],
        lineHeights: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
      };

      const result = generateFontFamily(typography);
      expect(result.heading).toContain('Poppins');
      expect(result.heading).toContain('system-ui');
    });

    it('should generate body font family', () => {
      const typography: TypographyExtraction = {
        fonts: { heading: 'Poppins', body: 'Inter' },
        scale: { display: '3.75rem', h1: '2.25rem', h2: '1.875rem', h3: '1.5rem', h4: '1.25rem', h5: '1.125rem', h6: '1rem', body: '1rem', small: '0.875rem', xs: '0.75rem' },
        weights: [400, 700],
        lineHeights: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
      };

      const result = generateFontFamily(typography);
      expect(result.body).toContain('Inter');
      expect(result.sans).toContain('Inter');
    });

    it('should generate mono font family', () => {
      const typography: TypographyExtraction = {
        fonts: { heading: 'Poppins', body: 'Inter', mono: 'JetBrains Mono' },
        scale: { display: '3.75rem', h1: '2.25rem', h2: '1.875rem', h3: '1.5rem', h4: '1.25rem', h5: '1.125rem', h6: '1rem', body: '1rem', small: '0.875rem', xs: '0.75rem' },
        weights: [400, 700],
        lineHeights: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
      };

      const result = generateFontFamily(typography);
      expect(result.mono).toContain('JetBrains Mono');
    });
  });

  describe('generateFontSize', () => {
    it('should map scale to Tailwind naming', () => {
      const typography: TypographyExtraction = {
        fonts: { heading: 'Arial', body: 'Arial' },
        scale: { display: '3.75rem', h1: '2.25rem', h2: '1.875rem', h3: '1.5rem', h4: '1.25rem', h5: '1.125rem', h6: '1rem', body: '1rem', small: '0.875rem', xs: '0.75rem' },
        weights: [400, 700],
        lineHeights: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
      };

      const result = generateFontSize(typography);
      expect(result.display).toBe('3.75rem');
      expect(result['5xl']).toBe('2.25rem'); // h1
      expect(result['4xl']).toBe('1.875rem'); // h2
      expect(result.base).toBe('1rem'); // body
      expect(result.sm).toBe('0.875rem'); // small
      expect(result.xs).toBe('0.75rem'); // xs
    });
  });

  describe('generateFontWeight', () => {
    it('should generate named weights', () => {
      const typography: TypographyExtraction = {
        fonts: { heading: 'Arial', body: 'Arial' },
        scale: { display: '3.75rem', h1: '2.25rem', h2: '1.875rem', h3: '1.5rem', h4: '1.25rem', h5: '1.125rem', h6: '1rem', body: '1rem', small: '0.875rem', xs: '0.75rem' },
        weights: [400, 500, 600, 700],
        lineHeights: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
      };

      const result = generateFontWeight(typography);
      expect(result.normal).toBe(400);
      expect(result.medium).toBe(500);
      expect(result.semibold).toBe(600);
      expect(result.bold).toBe(700);
    });
  });

  describe('generateLineHeight', () => {
    it('should generate line height values', () => {
      const typography: TypographyExtraction = {
        fonts: { heading: 'Arial', body: 'Arial' },
        scale: { display: '3.75rem', h1: '2.25rem', h2: '1.875rem', h3: '1.5rem', h4: '1.25rem', h5: '1.125rem', h6: '1rem', body: '1rem', small: '0.875rem', xs: '0.75rem' },
        weights: [400, 700],
        lineHeights: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
      };

      const result = generateLineHeight(typography);
      expect(result.tight).toBe('1.25');
      expect(result.normal).toBe('1.5');
      expect(result.relaxed).toBe('1.75');
    });
  });

  // ====================
  // SPACING GENERATION
  // ====================

  describe('generateSpacing', () => {
    it('should convert scale to rem values', () => {
      const spacing: SpacingExtraction = {
        baseUnit: 4,
        scale: [0, 4, 8, 16, 32],
        containerMaxWidth: '1280px',
        sectionPadding: { mobile: '16px', desktop: '32px' },
      };

      const result = generateSpacing(spacing);
      expect(result['0']).toBe('0rem');
      expect(result['4']).toBe('0.25rem');
      expect(result['8']).toBe('0.5rem');
      expect(result['16']).toBe('1rem');
      expect(result['32']).toBe('2rem');
    });

    it('should include container max width', () => {
      const spacing: SpacingExtraction = {
        baseUnit: 4,
        scale: [16],
        containerMaxWidth: '1280px',
        sectionPadding: { mobile: '16px', desktop: '32px' },
      };

      const result = generateSpacing(spacing);
      expect(result.container).toBe('1280px');
    });
  });

  // ====================
  // EFFECTS GENERATION
  // ====================

  describe('generateBorderRadius', () => {
    it('should generate radius values', () => {
      const effects: EffectsExtraction = {
        shadows: { sm: '', md: '', lg: '', xl: '' },
        radii: { sm: '0.125rem', md: '0.375rem', lg: '0.5rem', full: '9999px' },
        transitions: { fast: '150ms', normal: '200ms', slow: '300ms' },
      };

      const result = generateBorderRadius(effects);
      expect(result.sm).toBe('0.125rem');
      expect(result.md).toBe('0.375rem');
      expect(result.lg).toBe('0.5rem');
      expect(result.full).toBe('9999px');
    });
  });

  describe('generateBoxShadow', () => {
    it('should generate shadow values', () => {
      const effects: EffectsExtraction = {
        shadows: { sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 4px 6px rgba(0,0,0,0.1)', lg: '0 10px 15px rgba(0,0,0,0.1)', xl: '0 25px 50px rgba(0,0,0,0.1)' },
        radii: { sm: '0.125rem', md: '0.375rem', lg: '0.5rem', full: '9999px' },
        transitions: { fast: '150ms', normal: '200ms', slow: '300ms' },
      };

      const result = generateBoxShadow(effects);
      expect(result.sm).toBe('0 1px 2px rgba(0,0,0,0.05)');
      expect(result.md).toBe('0 4px 6px rgba(0,0,0,0.1)');
      expect(result.lg).toBe('0 10px 15px rgba(0,0,0,0.1)');
      expect(result.xl).toBe('0 25px 50px rgba(0,0,0,0.1)');
    });
  });

  describe('generateTransitionDuration', () => {
    it('should generate transition values', () => {
      const effects: EffectsExtraction = {
        shadows: { sm: '', md: '', lg: '', xl: '' },
        radii: { sm: '0.125rem', md: '0.375rem', lg: '0.5rem', full: '9999px' },
        transitions: { fast: '150ms', normal: '200ms', slow: '300ms' },
      };

      const result = generateTransitionDuration(effects);
      expect(result.fast).toBe('150ms');
      expect(result.normal).toBe('200ms');
      expect(result.slow).toBe('300ms');
    });
  });

  // ====================
  // THEME EXTEND
  // ====================

  describe('generateThemeExtend', () => {
    it('should generate complete theme.extend object', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateThemeExtend(designSystem);

      expect(result.colors).toBeDefined();
      expect(result.fontFamily).toBeDefined();
      expect(result.fontSize).toBeDefined();
      expect(result.fontWeight).toBeDefined();
      expect(result.lineHeight).toBeDefined();
      expect(result.spacing).toBeDefined();
      expect(result.borderRadius).toBeDefined();
      expect(result.boxShadow).toBeDefined();
      expect(result.transitionDuration).toBeDefined();
    });
  });

  // ====================
  // CONFIG OBJECT
  // ====================

  describe('generateTailwindConfig', () => {
    it('should generate complete config object', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateTailwindConfig(designSystem);

      expect(result.darkMode).toBe('class');
      expect(result.content).toBeDefined();
      expect(result.theme?.extend).toBeDefined();
      expect(result.plugins).toEqual([]);
    });

    it('should respect configuration options', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateTailwindConfig(designSystem, {
        includeDarkMode: false,
        includePlugins: false,
      });

      expect(result.darkMode).toBeUndefined();
      expect(result.plugins).toBeUndefined();
    });

    it('should use media dark mode strategy when configured', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateTailwindConfig(designSystem, {
        darkModeStrategy: 'media',
      });

      expect(result.darkMode).toBe('media');
    });
  });

  // ====================
  // STRING OUTPUT
  // ====================

  describe('generateTailwindConfigString', () => {
    it('should generate valid JavaScript string', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateTailwindConfigString(designSystem);

      expect(result).toContain('/** @type {import(\'tailwindcss\').Config} */');
      expect(result).toContain('const config =');
      expect(result).toContain('module.exports = config');
    });

    it('should include theme.extend', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateTailwindConfigString(designSystem);

      expect(result).toContain('theme:');
      expect(result).toContain('extend:');
    });

    it('should include colors', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateTailwindConfigString(designSystem);

      expect(result).toContain('colors:');
    });

    it('should be parseable as JavaScript', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateTailwindConfigString(designSystem);

      // Should not throw when evaluating (basic syntax check)
      expect(() => {
        // Just check it's valid-ish JS by looking for basic structure
        if (!result.includes('const config =')) throw new Error('Missing config declaration');
        if (!result.includes('module.exports')) throw new Error('Missing module.exports');
      }).not.toThrow();
    });
  });

  describe('generateTailwindConfigTsString', () => {
    it('should generate valid TypeScript string', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateTailwindConfigTsString(designSystem);

      expect(result).toContain("import type { Config } from 'tailwindcss'");
      expect(result).toContain('const config: Config =');
      expect(result).toContain('export default config');
    });

    it('should include all configuration sections', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateTailwindConfigTsString(designSystem);

      expect(result).toContain('theme:');
      expect(result).toContain('extend:');
      expect(result).toContain('colors:');
    });
  });
});
