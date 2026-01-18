/**
 * Design System Injector Module
 *
 * Converts extracted design system tokens into usable CSS and
 * Tailwind configuration for consistent styling across generated components.
 *
 * Phase D of the Quality Fix Plan.
 */

import type { DesignSystem } from '@/types';

// ====================
// TYPES
// ====================

export interface CSSOutput {
  /** CSS custom properties in :root */
  rootVariables: string;
  /** CSS utility classes */
  utilityClasses: string;
  /** Complete CSS file content */
  fullCSS: string;
}

export interface TailwindConfigExtension {
  /** Colors extension */
  colors: Record<string, string>;
  /** Font family extension */
  fontFamily: Record<string, string[]>;
  /** Font size extension */
  fontSize: Record<string, string>;
  /** Spacing extension */
  spacing: Record<string, string>;
  /** Complete config object */
  fullConfig: string;
}

// ====================
// CSS GENERATION
// ====================

/**
 * Generate CSS custom properties from design system
 */
export function generateCSSVariables(designSystem: DesignSystem): string {
  const vars: string[] = [];

  // Primary and secondary colors
  if (designSystem.colors.primary) {
    vars.push(`  --color-primary: ${designSystem.colors.primary};`);
    vars.push(`  --color-primary-rgb: ${hexToRgb(designSystem.colors.primary)};`);
  }

  if (designSystem.colors.secondary) {
    vars.push(`  --color-secondary: ${designSystem.colors.secondary};`);
    vars.push(`  --color-secondary-rgb: ${hexToRgb(designSystem.colors.secondary)};`);
  }

  // Background colors
  if (designSystem.colors.backgrounds?.length) {
    designSystem.colors.backgrounds.forEach((bg, i) => {
      vars.push(`  --color-bg-${i + 1}: ${bg};`);
    });
  }

  // Text colors
  if (designSystem.colors.text?.length) {
    designSystem.colors.text.forEach((color, i) => {
      vars.push(`  --color-text-${i + 1}: ${color};`);
    });
  }

  // Accent colors
  if (designSystem.colors.accent?.length) {
    designSystem.colors.accent.forEach((color, i) => {
      vars.push(`  --color-accent-${i + 1}: ${color};`);
    });
  }

  // Border colors
  if (designSystem.colors.borders?.length) {
    designSystem.colors.borders.forEach((color, i) => {
      vars.push(`  --color-border-${i + 1}: ${color};`);
    });
  }

  // Typography
  if (designSystem.typography.fontFamily) {
    vars.push(`  --font-family: ${designSystem.typography.fontFamily};`);
  }

  if (designSystem.typography.headingFont) {
    vars.push(`  --font-heading: ${designSystem.typography.headingFont};`);
  }

  if (designSystem.typography.bodyFont) {
    vars.push(`  --font-body: ${designSystem.typography.bodyFont};`);
  }

  // Font sizes
  if (designSystem.typography.headingSizes) {
    Object.entries(designSystem.typography.headingSizes).forEach(([key, value]) => {
      vars.push(`  --font-size-${key}: ${value};`);
    });
  }

  if (designSystem.typography.baseFontSize) {
    vars.push(`  --font-size-base: ${designSystem.typography.baseFontSize};`);
  }

  // Line heights
  if (designSystem.typography.lineHeights) {
    Object.entries(designSystem.typography.lineHeights).forEach(([key, value]) => {
      vars.push(`  --line-height-${key}: ${value};`);
    });
  }

  // Spacing
  if (designSystem.spacing?.containerPadding) {
    vars.push(`  --spacing-container: ${designSystem.spacing.containerPadding};`);
  }

  if (designSystem.spacing?.sectionGap) {
    vars.push(`  --spacing-section: ${designSystem.spacing.sectionGap};`);
  }

  if (designSystem.spacing?.elementGap) {
    vars.push(`  --spacing-element: ${designSystem.spacing.elementGap};`);
  }

  // Border radius
  if (designSystem.borders?.radius) {
    Object.entries(designSystem.borders.radius).forEach(([key, value]) => {
      vars.push(`  --radius-${key}: ${value};`);
    });
  }

  return `:root {\n${vars.join('\n')}\n}`;
}

/**
 * Generate utility classes that use CSS variables
 */
export function generateUtilityClasses(designSystem: DesignSystem): string {
  const classes: string[] = [];

  // Color utilities
  classes.push(`
/* Primary color utilities */
.text-primary { color: var(--color-primary); }
.bg-primary { background-color: var(--color-primary); }
.border-primary { border-color: var(--color-primary); }

/* Secondary color utilities */
.text-secondary { color: var(--color-secondary); }
.bg-secondary { background-color: var(--color-secondary); }
.border-secondary { border-color: var(--color-secondary); }
`);

  // Background utilities
  if (designSystem.colors.backgrounds?.length) {
    classes.push('/* Background utilities */');
    designSystem.colors.backgrounds.forEach((_, i) => {
      classes.push(`.bg-custom-${i + 1} { background-color: var(--color-bg-${i + 1}); }`);
    });
  }

  // Text utilities
  if (designSystem.colors.text?.length) {
    classes.push('\n/* Text color utilities */');
    designSystem.colors.text.forEach((_, i) => {
      classes.push(`.text-custom-${i + 1} { color: var(--color-text-${i + 1}); }`);
    });
  }

  // Font utilities
  classes.push(`
/* Font utilities */
.font-primary { font-family: var(--font-family); }
.font-heading { font-family: var(--font-heading, var(--font-family)); }
.font-body { font-family: var(--font-body, var(--font-family)); }
`);

  return classes.join('\n');
}

/**
 * Generate complete CSS file from design system
 */
export function generateFullCSS(designSystem: DesignSystem): CSSOutput {
  const rootVariables = generateCSSVariables(designSystem);
  const utilityClasses = generateUtilityClasses(designSystem);

  const fullCSS = `/*
 * Design System CSS
 * Auto-generated from extracted design tokens
 */

/* CSS Custom Properties */
${rootVariables}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    /* Override with dark mode colors if available */
  }
}

/* Utility Classes */
${utilityClasses}

/* Base styles */
body {
  font-family: var(--font-body, var(--font-family, system-ui, sans-serif));
  font-size: var(--font-size-base, 16px);
  line-height: var(--line-height-base, 1.5);
  color: var(--color-text-1, #000);
  background-color: var(--color-bg-1, #fff);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading, var(--font-family, system-ui, sans-serif));
}
`;

  return {
    rootVariables,
    utilityClasses,
    fullCSS,
  };
}

// ====================
// TAILWIND CONFIGURATION
// ====================

/**
 * Generate Tailwind CSS configuration extension from design system
 */
export function generateTailwindConfig(designSystem: DesignSystem): TailwindConfigExtension {
  // Build colors object with proper structure
  const colors: Record<string, string | Record<string, string>> = {};

  // Primary color with shades
  if (designSystem.colors.primary) {
    colors.primary = {
      DEFAULT: designSystem.colors.primary[0] || designSystem.colors.primary as unknown as string,
      ...(Array.isArray(designSystem.colors.primary)
        ? generateColorShades(designSystem.colors.primary)
        : { DEFAULT: designSystem.colors.primary as unknown as string }),
    };
  }

  // Secondary color with shades
  if (designSystem.colors.secondary) {
    colors.secondary = {
      DEFAULT: designSystem.colors.secondary[0] || designSystem.colors.secondary as unknown as string,
      ...(Array.isArray(designSystem.colors.secondary)
        ? generateColorShades(designSystem.colors.secondary)
        : { DEFAULT: designSystem.colors.secondary as unknown as string }),
    };
  }

  // Neutral/gray colors
  if (designSystem.colors.neutral?.length) {
    colors.neutral = generateColorShades(designSystem.colors.neutral);
  }

  // Add background colors
  if (designSystem.colors.backgrounds?.length) {
    designSystem.colors.backgrounds.forEach((bg, i) => {
      colors[`surface-${i + 1}`] = bg;
    });
  }

  // Add text colors
  if (designSystem.colors.text?.length) {
    designSystem.colors.text.forEach((color, i) => {
      const names = ['primary', 'secondary', 'muted'];
      colors[`text-${names[i] || i + 1}`] = color;
    });
  }

  // Add accent colors
  if (designSystem.colors.accent?.length) {
    designSystem.colors.accent.forEach((color, i) => {
      colors[`accent-${i + 1}`] = color;
    });
  }

  // Build font family object
  const fontFamily: Record<string, string[]> = {};

  if (designSystem.typography.fonts?.heading) {
    fontFamily.heading = [designSystem.typography.fonts.heading, 'system-ui', 'sans-serif'];
  }
  if (designSystem.typography.fonts?.body) {
    fontFamily.body = [designSystem.typography.fonts.body, 'system-ui', 'sans-serif'];
  }
  if (designSystem.typography.fonts?.mono) {
    fontFamily.mono = [designSystem.typography.fonts.mono, 'monospace'];
  }
  // Fallback to legacy fields
  if (!fontFamily.heading && designSystem.typography.fontFamily) {
    fontFamily.sans = [designSystem.typography.fontFamily, 'system-ui', 'sans-serif'];
  }

  // Build font size object with line-height tuples
  const fontSize: Record<string, [string, { lineHeight: string }]> = {};

  if (designSystem.typography.scale) {
    Object.entries(designSystem.typography.scale).forEach(([key, value]) => {
      const lineHeight = getLineHeightForSize(key);
      fontSize[key] = [String(value), { lineHeight }];
    });
  }
  // Fallback to legacy headingSizes
  if (Object.keys(fontSize).length === 0 && designSystem.typography.headingSizes) {
    Object.entries(designSystem.typography.headingSizes).forEach(([key, value]) => {
      const lineHeight = getLineHeightForSize(key);
      fontSize[key] = [String(value), { lineHeight }];
    });
  }

  // Build spacing object
  const spacing: Record<string, string> = {};

  if (designSystem.spacing?.baseUnit) {
    // Generate spacing scale based on base unit
    const base = designSystem.spacing.baseUnit;
    spacing['0.5'] = `${base * 0.5}px`;
    spacing['1'] = `${base}px`;
    spacing['1.5'] = `${base * 1.5}px`;
    spacing['2'] = `${base * 2}px`;
    spacing['3'] = `${base * 3}px`;
    spacing['4'] = `${base * 4}px`;
    spacing['5'] = `${base * 5}px`;
    spacing['6'] = `${base * 6}px`;
    spacing['8'] = `${base * 8}px`;
    spacing['10'] = `${base * 10}px`;
    spacing['12'] = `${base * 12}px`;
    spacing['16'] = `${base * 16}px`;
    spacing['20'] = `${base * 20}px`;
    spacing['24'] = `${base * 24}px`;
  }

  if (designSystem.spacing?.containerMaxWidth) {
    spacing['container'] = designSystem.spacing.containerMaxWidth;
  }
  if (designSystem.spacing?.containerPadding) {
    spacing['container-padding'] = designSystem.spacing.containerPadding;
  }
  if (designSystem.spacing?.sectionGap) {
    spacing['section'] = designSystem.spacing.sectionGap;
  }

  // Build border radius object
  const borderRadius: Record<string, string> = {};

  if (designSystem.effects?.radii) {
    Object.entries(designSystem.effects.radii).forEach(([key, value]) => {
      borderRadius[key] = String(value);
    });
  }
  if (designSystem.borders?.radius) {
    Object.entries(designSystem.borders.radius).forEach(([key, value]) => {
      borderRadius[key] = String(value);
    });
  }

  // Build box shadow object
  const boxShadow: Record<string, string> = {};

  if (designSystem.effects?.shadows) {
    Object.entries(designSystem.effects.shadows).forEach(([key, value]) => {
      boxShadow[key] = String(value);
    });
  }

  // Build transitions
  const transitionDuration: Record<string, string> = {};

  if (designSystem.effects?.transitions) {
    Object.entries(designSystem.effects.transitions).forEach(([key, value]) => {
      // Extract duration from transition value (e.g., "all 0.2s ease" -> "200ms")
      const valueStr = String(value);
      const match = valueStr.match(/(\d+\.?\d*)s/);
      if (match) {
        transitionDuration[key] = `${parseFloat(match[1]) * 1000}ms`;
      }
    });
  }

  // Generate full config string
  const fullConfig = generateFullTailwindConfig({
    colors: colors as Record<string, string>,
    fontFamily,
    fontSize,
    spacing,
    borderRadius,
    boxShadow,
    transitionDuration,
  });

  return {
    colors: colors as Record<string, string>,
    fontFamily,
    fontSize: Object.fromEntries(
      Object.entries(fontSize).map(([k, v]) => [k, v[0]])
    ),
    spacing,
    fullConfig,
  };
}

/**
 * Generate color shades from an array of colors
 */
function generateColorShades(colors: string[]): Record<string, string> {
  const shadeNames = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
  const shades: Record<string, string> = {};

  if (colors.length === 1) {
    shades['DEFAULT'] = colors[0];
    shades['500'] = colors[0];
  } else {
    // Map colors to shade levels
    const step = Math.floor(shadeNames.length / colors.length);
    colors.forEach((color, i) => {
      const shadeIndex = Math.min(i * step, shadeNames.length - 1);
      shades[shadeNames[shadeIndex]] = color;
    });
  }

  return shades;
}

/**
 * Get appropriate line-height for font size key
 */
function getLineHeightForSize(sizeKey: string): string {
  const lineHeights: Record<string, string> = {
    display: '1.1',
    h1: '1.2',
    h2: '1.25',
    h3: '1.3',
    h4: '1.35',
    h5: '1.4',
    h6: '1.4',
    body: '1.5',
    small: '1.5',
    xs: '1.5',
  };

  return lineHeights[sizeKey] || '1.5';
}

/**
 * Generate the full Tailwind config string
 */
function generateFullTailwindConfig(config: {
  colors: Record<string, string>;
  fontFamily: Record<string, string[]>;
  fontSize: Record<string, [string, { lineHeight: string }]>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  boxShadow: Record<string, string>;
  transitionDuration: Record<string, string>;
}): string {
  const formatObject = (obj: Record<string, unknown>, indent = 8): string => {
    const spaces = ' '.repeat(indent);
    const entries = Object.entries(obj);

    if (entries.length === 0) return '{}';

    const lines = entries.map(([key, value]) => {
      const safeKey = key.includes('-') || key.includes('.') ? `'${key}'` : key;
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          return `${spaces}${safeKey}: ${JSON.stringify(value)},`;
        }
        return `${spaces}${safeKey}: ${formatObject(value as Record<string, unknown>, indent + 2)},`;
      }
      return `${spaces}${safeKey}: '${value}',`;
    });

    return `{\n${lines.join('\n')}\n${' '.repeat(indent - 2)}}`;
  };

  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: ${formatObject(config.colors)},
      fontFamily: ${formatObject(config.fontFamily)},
      fontSize: ${formatObject(config.fontSize as unknown as Record<string, unknown>)},
      spacing: ${formatObject(config.spacing)},
      borderRadius: ${formatObject(config.borderRadius)},
      boxShadow: ${formatObject(config.boxShadow)},
      transitionDuration: ${formatObject(config.transitionDuration)},
    },
  },
  plugins: [],
};
`;
}

// ====================
// CODE INJECTION
// ====================

/**
 * Replace hardcoded color values with design system tokens in generated code
 */
export function injectDesignTokens(
  code: string,
  designSystem: DesignSystem
): string {
  let result = code;

  // Replace hardcoded primary color with Tailwind class
  if (designSystem.colors.primary) {
    const primaryHex = designSystem.colors.primary.toLowerCase();

    // Replace in className strings
    result = result.replace(
      new RegExp(`bg-\\[${escapeRegex(primaryHex)}\\]`, 'gi'),
      'bg-primary'
    );
    result = result.replace(
      new RegExp(`text-\\[${escapeRegex(primaryHex)}\\]`, 'gi'),
      'text-primary'
    );
    result = result.replace(
      new RegExp(`border-\\[${escapeRegex(primaryHex)}\\]`, 'gi'),
      'border-primary'
    );

    // Replace in inline styles
    result = result.replace(
      new RegExp(`backgroundColor:\\s*['"]${escapeRegex(primaryHex)}['"]`, 'gi'),
      "backgroundColor: 'var(--color-primary)'"
    );
    result = result.replace(
      new RegExp(`color:\\s*['"]${escapeRegex(primaryHex)}['"]`, 'gi'),
      "color: 'var(--color-primary)'"
    );
  }

  // Replace hardcoded secondary color
  if (designSystem.colors.secondary) {
    const secondaryHex = designSystem.colors.secondary.toLowerCase();

    result = result.replace(
      new RegExp(`bg-\\[${escapeRegex(secondaryHex)}\\]`, 'gi'),
      'bg-secondary'
    );
    result = result.replace(
      new RegExp(`text-\\[${escapeRegex(secondaryHex)}\\]`, 'gi'),
      'text-secondary'
    );
    result = result.replace(
      new RegExp(`border-\\[${escapeRegex(secondaryHex)}\\]`, 'gi'),
      'border-secondary'
    );
  }

  // Replace font family if specified
  if (designSystem.typography.fontFamily) {
    const fontFamily = designSystem.typography.fontFamily;

    // Replace arbitrary font values
    result = result.replace(
      new RegExp(`font-\\[['"]?${escapeRegex(fontFamily)}['"]?\\]`, 'gi'),
      'font-sans'
    );
  }

  return result;
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if a color is dark (for contrast calculations)
 */
export function isColorDark(hex: string): boolean {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

/**
 * Get contrasting text color for a background
 */
export function getContrastingTextColor(bgHex: string): string {
  return isColorDark(bgHex) ? '#ffffff' : '#000000';
}

/**
 * Merge design system with defaults
 */
export function mergeWithDefaults(
  designSystem: Partial<DesignSystem>
): DesignSystem {
  return {
    colors: {
      primary: designSystem.colors?.primary || '#3b82f6',
      secondary: designSystem.colors?.secondary || '#6b7280',
      backgrounds: designSystem.colors?.backgrounds || ['#ffffff', '#f9fafb'],
      text: designSystem.colors?.text || ['#111827', '#4b5563', '#9ca3af'],
      accent: designSystem.colors?.accent || [],
      borders: designSystem.colors?.borders || ['#e5e7eb'],
    },
    typography: {
      fontFamily: designSystem.typography?.fontFamily || 'Inter, system-ui, sans-serif',
      headingFont: designSystem.typography?.headingFont,
      bodyFont: designSystem.typography?.bodyFont,
      baseFontSize: designSystem.typography?.baseFontSize || '16px',
      headingSizes: designSystem.typography?.headingSizes || {
        h1: '3rem',
        h2: '2.25rem',
        h3: '1.875rem',
        h4: '1.5rem',
        h5: '1.25rem',
        h6: '1rem',
      },
      lineHeights: designSystem.typography?.lineHeights || {
        tight: '1.25',
        base: '1.5',
        relaxed: '1.75',
      },
    },
    spacing: {
      containerPadding: designSystem.spacing?.containerPadding || '1rem',
      sectionGap: designSystem.spacing?.sectionGap || '4rem',
      elementGap: designSystem.spacing?.elementGap || '1rem',
    },
    borders: {
      radius: designSystem.borders?.radius || {
        none: '0',
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        full: '9999px',
      },
    },
  };
}
