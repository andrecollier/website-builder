/**
 * CSS Generator Tests
 *
 * Tests for CSS custom properties generation including :root variables,
 * color variables with RGB values, typography variables, spacing variables,
 * and effects variables.
 */

import {
  toVariableName,
  hexToRgb,
  escapeCssValue,
  generateColorVariables,
  generateTypographyVariables,
  generateSpacingVariables,
  generateEffectsVariables,
  generateAllVariableGroups,
  generateCSSVariables,
  generateCSSVariablesWithDarkMode,
  generateCSSVariablesWithClassDarkMode,
  generateCSSVariablesWithReset,
} from '../css-generator';
import type { ColorExtraction, TypographyExtraction, SpacingExtraction, EffectsExtraction } from '@/types';
import { getDefaultDesignSystem } from '../synthesizer';

describe('CSS Generator', () => {
  // ====================
  // UTILITY FUNCTIONS
  // ====================

  describe('toVariableName', () => {
    it('should convert simple key to CSS variable', () => {
      expect(toVariableName('primary')).toBe('--primary');
      expect(toVariableName('background')).toBe('--background');
    });

    it('should convert camelCase to kebab-case', () => {
      expect(toVariableName('primaryColor')).toBe('--primary-color');
      expect(toVariableName('backgroundColor')).toBe('--background-color');
    });

    it('should handle numbers in keys', () => {
      expect(toVariableName('spacing4')).toBe('--spacing-4');
      expect(toVariableName('primary2')).toBe('--primary-2');
    });

    it('should add prefix when provided', () => {
      expect(toVariableName('primary', 'ds')).toBe('--ds-primary');
      expect(toVariableName('background', 'theme')).toBe('--theme-background');
    });
  });

  describe('hexToRgb', () => {
    it('should convert hex to RGB values', () => {
      expect(hexToRgb('#ff0000')).toBe('255 0 0');
      expect(hexToRgb('#00ff00')).toBe('0 255 0');
      expect(hexToRgb('#0000ff')).toBe('0 0 255');
    });

    it('should handle shorthand hex', () => {
      expect(hexToRgb('#f00')).toBe('255 0 0');
      expect(hexToRgb('#0f0')).toBe('0 255 0');
    });

    it('should return null for invalid hex', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('')).toBeNull();
    });

    it('should handle uppercase hex', () => {
      expect(hexToRgb('#FF0000')).toBe('255 0 0');
    });
  });

  describe('escapeCssValue', () => {
    it('should return value unchanged for simple values', () => {
      expect(escapeCssValue('#ff0000')).toBe('#ff0000');
      expect(escapeCssValue('16px')).toBe('16px');
    });
  });

  // ====================
  // COLOR VARIABLES
  // ====================

  describe('generateColorVariables', () => {
    it('should generate primary color variables', () => {
      const colors: ColorExtraction = {
        primary: ['#3b82f6'],
        secondary: [],
        neutral: [],
        semantic: { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' },
        palettes: {},
      };

      const result = generateColorVariables(colors);
      const primaryGroup = result.find(g => g.name === 'Primary Colors');
      expect(primaryGroup).toBeDefined();
      expect(primaryGroup?.variables.some(v => v.name === '--primary')).toBe(true);
    });

    it('should generate RGB versions when configured', () => {
      const colors: ColorExtraction = {
        primary: ['#3b82f6'],
        secondary: [],
        neutral: [],
        semantic: { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' },
        palettes: {},
      };

      const result = generateColorVariables(colors, { includeRgbColors: true });
      const primaryGroup = result.find(g => g.name === 'Primary Colors');
      expect(primaryGroup?.variables.some(v => v.name === '--primary-rgb')).toBe(true);
    });

    it('should generate semantic color variables', () => {
      const colors: ColorExtraction = {
        primary: [],
        secondary: [],
        neutral: [],
        semantic: { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' },
        palettes: {},
      };

      const result = generateColorVariables(colors);
      const semanticGroup = result.find(g => g.name === 'Semantic Colors');
      expect(semanticGroup).toBeDefined();
      expect(semanticGroup?.variables.some(v => v.name === '--success')).toBe(true);
      expect(semanticGroup?.variables.some(v => v.name === '--error')).toBe(true);
    });

    it('should generate background/foreground from neutrals', () => {
      const colors: ColorExtraction = {
        primary: [],
        secondary: [],
        neutral: ['#171717', '#f5f5f5', '#737373'],
        semantic: { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' },
        palettes: {},
      };

      const result = generateColorVariables(colors);
      const neutralGroup = result.find(g => g.name === 'Neutral Colors');
      expect(neutralGroup?.variables.some(v => v.name === '--background')).toBe(true);
      expect(neutralGroup?.variables.some(v => v.name === '--foreground')).toBe(true);
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

      const result = generateColorVariables(colors, { includePalettes: true });
      const paletteGroup = result.find(g => g.name.includes('Blue'));
      expect(paletteGroup).toBeDefined();
    });
  });

  // ====================
  // TYPOGRAPHY VARIABLES
  // ====================

  describe('generateTypographyVariables', () => {
    const typography: TypographyExtraction = {
      fonts: { heading: 'Poppins', body: 'Inter', mono: 'JetBrains Mono' },
      scale: { display: '3.75rem', h1: '2.25rem', h2: '1.875rem', h3: '1.5rem', h4: '1.25rem', h5: '1.125rem', h6: '1rem', body: '1rem', small: '0.875rem', xs: '0.75rem' },
      weights: [400, 500, 600, 700],
      lineHeights: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
    };

    it('should generate font family variables', () => {
      const result = generateTypographyVariables(typography);
      const fontGroup = result.find(g => g.name === 'Font Families');
      expect(fontGroup).toBeDefined();
      expect(fontGroup?.variables.some(v => v.name === '--font-heading')).toBe(true);
      expect(fontGroup?.variables.some(v => v.name === '--font-body')).toBe(true);
      expect(fontGroup?.variables.some(v => v.name === '--font-mono')).toBe(true);
    });

    it('should generate font size variables', () => {
      const result = generateTypographyVariables(typography);
      const sizeGroup = result.find(g => g.name === 'Font Sizes');
      expect(sizeGroup).toBeDefined();
      expect(sizeGroup?.variables.some(v => v.name === '--text-5xl')).toBe(true); // h1
      expect(sizeGroup?.variables.some(v => v.name === '--text-base')).toBe(true); // body
    });

    it('should generate font weight variables', () => {
      const result = generateTypographyVariables(typography);
      const weightGroup = result.find(g => g.name === 'Font Weights');
      expect(weightGroup).toBeDefined();
      expect(weightGroup?.variables.some(v => v.name === '--font-weight-normal')).toBe(true);
      expect(weightGroup?.variables.some(v => v.name === '--font-weight-bold')).toBe(true);
    });

    it('should generate line height variables', () => {
      const result = generateTypographyVariables(typography);
      const lineHeightGroup = result.find(g => g.name === 'Line Heights');
      expect(lineHeightGroup).toBeDefined();
      expect(lineHeightGroup?.variables.some(v => v.name === '--leading-tight')).toBe(true);
      expect(lineHeightGroup?.variables.some(v => v.name === '--leading-normal')).toBe(true);
      expect(lineHeightGroup?.variables.some(v => v.name === '--leading-relaxed')).toBe(true);
    });
  });

  // ====================
  // SPACING VARIABLES
  // ====================

  describe('generateSpacingVariables', () => {
    const spacing: SpacingExtraction = {
      baseUnit: 4,
      scale: [0, 4, 8, 16, 32],
      containerMaxWidth: '1280px',
      sectionPadding: { mobile: '16px', desktop: '32px' },
    };

    it('should generate spacing unit variable', () => {
      const result = generateSpacingVariables(spacing);
      const baseGroup = result.find(g => g.name === 'Spacing Base');
      expect(baseGroup?.variables.some(v => v.name === '--spacing-unit')).toBe(true);
    });

    it('should generate spacing scale variables', () => {
      const result = generateSpacingVariables(spacing);
      const scaleGroup = result.find(g => g.name === 'Spacing Scale');
      expect(scaleGroup?.variables.some(v => v.name === '--spacing-0')).toBe(true);
      expect(scaleGroup?.variables.some(v => v.name === '--spacing-16')).toBe(true);
    });

    it('should generate container and section variables', () => {
      const result = generateSpacingVariables(spacing);
      const containerGroup = result.find(g => g.name === 'Container & Section');
      expect(containerGroup?.variables.some(v => v.name === '--container-max-width')).toBe(true);
      expect(containerGroup?.variables.some(v => v.name === '--section-padding-mobile')).toBe(true);
      expect(containerGroup?.variables.some(v => v.name === '--section-padding-desktop')).toBe(true);
    });
  });

  // ====================
  // EFFECTS VARIABLES
  // ====================

  describe('generateEffectsVariables', () => {
    const effects: EffectsExtraction = {
      shadows: { sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 4px 6px rgba(0,0,0,0.1)', lg: '0 10px 15px rgba(0,0,0,0.1)', xl: '0 25px 50px rgba(0,0,0,0.1)' },
      radii: { sm: '0.125rem', md: '0.375rem', lg: '0.5rem', full: '9999px' },
      transitions: { fast: '150ms', normal: '200ms', slow: '300ms' },
    };

    it('should generate shadow variables', () => {
      const result = generateEffectsVariables(effects);
      const shadowGroup = result.find(g => g.name === 'Box Shadows');
      expect(shadowGroup?.variables.some(v => v.name === '--shadow-sm')).toBe(true);
      expect(shadowGroup?.variables.some(v => v.name === '--shadow-xl')).toBe(true);
    });

    it('should generate radius variables', () => {
      const result = generateEffectsVariables(effects);
      const radiusGroup = result.find(g => g.name === 'Border Radii');
      expect(radiusGroup?.variables.some(v => v.name === '--radius-sm')).toBe(true);
      expect(radiusGroup?.variables.some(v => v.name === '--radius-full')).toBe(true);
    });

    it('should generate transition variables', () => {
      const result = generateEffectsVariables(effects);
      const transitionGroup = result.find(g => g.name === 'Transitions');
      expect(transitionGroup?.variables.some(v => v.name === '--transition-fast')).toBe(true);
      expect(transitionGroup?.variables.some(v => v.name === '--transition-slow')).toBe(true);
    });
  });

  // ====================
  // FULL CSS OUTPUT
  // ====================

  describe('generateCSSVariables', () => {
    it('should generate valid CSS with :root', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateCSSVariables(designSystem);

      expect(result).toContain(':root {');
      expect(result).toContain('}');
    });

    it('should include header comment when prettyPrint is true', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateCSSVariables(designSystem, { prettyPrint: true });

      expect(result).toContain('Design System CSS Variables');
      expect(result).toContain('Generated from:');
    });

    it('should include color variables', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateCSSVariables(designSystem);

      expect(result).toContain('--primary');
    });

    it('should include typography variables', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateCSSVariables(designSystem, { includeTypography: true });

      expect(result).toContain('--font-');
    });

    it('should include spacing variables', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateCSSVariables(designSystem, { includeSpacing: true });

      expect(result).toContain('--spacing-');
    });

    it('should include effects variables', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateCSSVariables(designSystem, { includeEffects: true });

      expect(result).toContain('--shadow-');
      expect(result).toContain('--radius-');
    });

    it('should use prefix when provided', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateCSSVariables(designSystem, { prefix: 'ds' });

      expect(result).toContain('--ds-primary');
    });
  });

  describe('generateCSSVariablesWithDarkMode', () => {
    it('should include media query for dark mode', () => {
      const designSystem = getDefaultDesignSystem();
      const darkDesignSystem = getDefaultDesignSystem();
      const result = generateCSSVariablesWithDarkMode(designSystem, darkDesignSystem);

      expect(result).toContain('@media (prefers-color-scheme: dark)');
      expect(result).toContain(':root {');
    });
  });

  describe('generateCSSVariablesWithClassDarkMode', () => {
    it('should include .dark class for dark mode', () => {
      const designSystem = getDefaultDesignSystem();
      const darkDesignSystem = getDefaultDesignSystem();
      const result = generateCSSVariablesWithClassDarkMode(designSystem, darkDesignSystem);

      expect(result).toContain('.dark {');
    });
  });

  describe('generateCSSVariablesWithReset', () => {
    it('should include base reset styles', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateCSSVariablesWithReset(designSystem);

      expect(result).toContain('*, *::before, *::after');
      expect(result).toContain('box-sizing: border-box');
      expect(result).toContain('html {');
      expect(result).toContain('body {');
    });

    it('should reference CSS variables in reset', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateCSSVariablesWithReset(designSystem);

      expect(result).toContain('var(--font-sans');
      expect(result).toContain('var(--background');
      expect(result).toContain('var(--foreground');
    });
  });

  // ====================
  // ALL VARIABLE GROUPS
  // ====================

  describe('generateAllVariableGroups', () => {
    it('should combine all variable groups', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateAllVariableGroups(designSystem);

      // Should have multiple groups
      expect(result.length).toBeGreaterThan(5);

      // Should have color, typography, spacing, and effects groups
      const groupNames = result.map(g => g.name);
      expect(groupNames.some(n => n.includes('Color'))).toBe(true);
      expect(groupNames.some(n => n.includes('Font'))).toBe(true);
      expect(groupNames.some(n => n.includes('Spacing'))).toBe(true);
      expect(groupNames.some(n => n.includes('Shadow') || n.includes('Radi'))).toBe(true);
    });

    it('should respect configuration options', () => {
      const designSystem = getDefaultDesignSystem();
      const result = generateAllVariableGroups(designSystem, {
        includeTypography: false,
        includeSpacing: false,
        includeEffects: false,
      });

      // Should only have color groups
      const groupNames = result.map(g => g.name);
      expect(groupNames.some(n => n.includes('Font'))).toBe(false);
      expect(groupNames.some(n => n.includes('Spacing'))).toBe(false);
    });
  });
});
