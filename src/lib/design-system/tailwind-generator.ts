/**
 * Tailwind Configuration Generator Module
 *
 * Generates valid tailwind.config.js content from a DesignSystem object.
 * The output follows Tailwind's theme.extend structure and can be written
 * directly to a tailwind.config.js file for use in generated projects.
 */

import type {
  DesignSystem,
  ColorExtraction,
  TypographyExtraction,
  SpacingExtraction,
  EffectsExtraction,
} from '@/types';

// ====================
// TYPES
// ====================

/**
 * Configuration for Tailwind generation
 */
export interface TailwindGeneratorConfig {
  /** Include dark mode configuration */
  includeDarkMode?: boolean;
  /** Dark mode strategy: 'class' or 'media' */
  darkModeStrategy?: 'class' | 'media';
  /** Content paths for Tailwind to scan */
  contentPaths?: string[];
  /** Include all extracted palettes in colors */
  includeFullPalettes?: boolean;
  /** Include plugins array (empty by default) */
  includePlugins?: boolean;
}

/**
 * Tailwind theme.extend colors structure
 */
export interface TailwindColors {
  [key: string]: string | Record<string, string>;
}

/**
 * Tailwind theme.extend structure
 */
export interface TailwindThemeExtend {
  colors?: TailwindColors;
  fontFamily?: Record<string, string[]>;
  fontSize?: Record<string, string>;
  fontWeight?: Record<string, number>;
  lineHeight?: Record<string, string>;
  spacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
  boxShadow?: Record<string, string>;
  transitionDuration?: Record<string, string>;
}

/**
 * Complete Tailwind config structure
 */
export interface TailwindConfig {
  darkMode?: 'class' | 'media';
  content?: string[];
  theme?: {
    extend?: TailwindThemeExtend;
  };
  plugins?: unknown[];
}

// ====================
// CONFIGURATION
// ====================

const DEFAULT_CONFIG: Required<TailwindGeneratorConfig> = {
  includeDarkMode: true,
  darkModeStrategy: 'class',
  contentPaths: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  includeFullPalettes: true,
  includePlugins: true,
} as const;

// ====================
// COLOR GENERATION
// ====================

/**
 * Generate Tailwind colors configuration from ColorExtraction
 */
export function generateColors(
  colors: ColorExtraction,
  includeFullPalettes: boolean = true
): TailwindColors {
  const tailwindColors: TailwindColors = {};

  // Add primary color(s)
  if (colors.primary.length > 0) {
    tailwindColors.primary = colors.primary[0];
    // If multiple primaries, add them with suffixes
    if (colors.primary.length > 1) {
      colors.primary.forEach((color, index) => {
        if (index > 0) {
          tailwindColors[`primary-${index + 1}`] = color;
        }
      });
    }
  }

  // Add secondary color(s)
  if (colors.secondary.length > 0) {
    tailwindColors.secondary = colors.secondary[0];
    if (colors.secondary.length > 1) {
      colors.secondary.forEach((color, index) => {
        if (index > 0) {
          tailwindColors[`secondary-${index + 1}`] = color;
        }
      });
    }
  }

  // Add neutral colors as background/foreground/muted
  if (colors.neutral.length > 0) {
    // Find darkest for background, lightest for foreground
    const sortedNeutrals = [...colors.neutral].sort((a, b) => {
      const lightnessA = getLightness(a);
      const lightnessB = getLightness(b);
      return lightnessA - lightnessB;
    });

    tailwindColors.background = sortedNeutrals[0] || '#0a0a0a';
    tailwindColors.foreground = sortedNeutrals[sortedNeutrals.length - 1] || '#fafafa';

    // Middle neutral for muted
    if (sortedNeutrals.length > 2) {
      tailwindColors.muted = sortedNeutrals[Math.floor(sortedNeutrals.length / 2)];
    }
  }

  // Add semantic colors
  tailwindColors.success = colors.semantic.success;
  tailwindColors.error = colors.semantic.error;
  tailwindColors.warning = colors.semantic.warning;
  tailwindColors.info = colors.semantic.info;

  // Add full palettes if configured
  if (includeFullPalettes && colors.palettes) {
    for (const [paletteName, palette] of Object.entries(colors.palettes)) {
      tailwindColors[paletteName] = palette;
    }
  }

  return tailwindColors;
}

/**
 * Get lightness of a hex color (0-1)
 */
function getLightness(hex: string): number {
  try {
    // Convert hex to RGB
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    // Calculate relative luminance
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return (max + min) / 2;
  } catch {
    return 0.5;
  }
}

// ====================
// TYPOGRAPHY GENERATION
// ====================

/**
 * Generate Tailwind fontFamily configuration from TypographyExtraction
 */
export function generateFontFamily(
  typography: TypographyExtraction
): Record<string, string[]> {
  const fontFamily: Record<string, string[]> = {};

  // Add heading font with fallback stack
  if (typography.fonts.heading) {
    fontFamily.heading = [
      typography.fonts.heading,
      'system-ui',
      'sans-serif',
    ];
  }

  // Add body font with fallback stack
  if (typography.fonts.body) {
    fontFamily.body = [
      typography.fonts.body,
      'system-ui',
      'sans-serif',
    ];
    // Also set as sans default
    fontFamily.sans = [
      typography.fonts.body,
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'sans-serif',
    ];
  }

  // Add mono font if present
  if (typography.fonts.mono) {
    fontFamily.mono = [
      typography.fonts.mono,
      'ui-monospace',
      'SFMono-Regular',
      'monospace',
    ];
  }

  return fontFamily;
}

/**
 * Generate Tailwind fontSize configuration from TypographyExtraction
 */
export function generateFontSize(
  typography: TypographyExtraction
): Record<string, string> {
  const fontSize: Record<string, string> = {};

  // Map scale names to Tailwind-style names
  const scaleMapping: Record<string, string> = {
    display: 'display',
    h1: '5xl',
    h2: '4xl',
    h3: '3xl',
    h4: '2xl',
    h5: 'xl',
    h6: 'lg',
    body: 'base',
    small: 'sm',
    xs: 'xs',
  };

  for (const [key, size] of Object.entries(typography.scale)) {
    const tailwindKey = scaleMapping[key] || key;
    fontSize[tailwindKey] = size;
  }

  return fontSize;
}

/**
 * Generate Tailwind fontWeight configuration from TypographyExtraction
 */
export function generateFontWeight(
  typography: TypographyExtraction
): Record<string, number> {
  const fontWeight: Record<string, number> = {};

  // Map common weights to names
  const weightMapping: Record<number, string> = {
    100: 'thin',
    200: 'extralight',
    300: 'light',
    400: 'normal',
    500: 'medium',
    600: 'semibold',
    700: 'bold',
    800: 'extrabold',
    900: 'black',
  };

  for (const weight of typography.weights) {
    const name = weightMapping[weight] || `weight-${weight}`;
    fontWeight[name] = weight;
  }

  return fontWeight;
}

/**
 * Generate Tailwind lineHeight configuration from TypographyExtraction
 */
export function generateLineHeight(
  typography: TypographyExtraction
): Record<string, string> {
  return {
    tight: String(typography.lineHeights.tight),
    normal: String(typography.lineHeights.normal),
    relaxed: String(typography.lineHeights.relaxed),
  };
}

// ====================
// SPACING GENERATION
// ====================

/**
 * Generate Tailwind spacing configuration from SpacingExtraction
 */
export function generateSpacing(
  spacing: SpacingExtraction
): Record<string, string> {
  const tailwindSpacing: Record<string, string> = {};

  // Convert scale values to rem with numeric keys
  for (const value of spacing.scale) {
    // Use pixel value as key, rem as value
    tailwindSpacing[String(value)] = `${value / 16}rem`;
  }

  // Add container max width
  tailwindSpacing['container'] = spacing.containerMaxWidth;

  return tailwindSpacing;
}

// ====================
// EFFECTS GENERATION
// ====================

/**
 * Generate Tailwind borderRadius configuration from EffectsExtraction
 */
export function generateBorderRadius(
  effects: EffectsExtraction
): Record<string, string> {
  return {
    sm: effects.radii.sm,
    md: effects.radii.md,
    lg: effects.radii.lg,
    full: effects.radii.full,
  };
}

/**
 * Generate Tailwind boxShadow configuration from EffectsExtraction
 */
export function generateBoxShadow(
  effects: EffectsExtraction
): Record<string, string> {
  return {
    sm: effects.shadows.sm,
    md: effects.shadows.md,
    lg: effects.shadows.lg,
    xl: effects.shadows.xl,
  };
}

/**
 * Generate Tailwind transitionDuration configuration from EffectsExtraction
 */
export function generateTransitionDuration(
  effects: EffectsExtraction
): Record<string, string> {
  return {
    fast: effects.transitions.fast,
    normal: effects.transitions.normal,
    slow: effects.transitions.slow,
  };
}

// ====================
// CONFIG OBJECT GENERATION
// ====================

/**
 * Generate complete Tailwind theme.extend object from DesignSystem
 */
export function generateThemeExtend(
  designSystem: DesignSystem,
  config: TailwindGeneratorConfig = {}
): TailwindThemeExtend {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return {
    colors: generateColors(designSystem.colors, mergedConfig.includeFullPalettes),
    fontFamily: generateFontFamily(designSystem.typography),
    fontSize: generateFontSize(designSystem.typography),
    fontWeight: generateFontWeight(designSystem.typography),
    lineHeight: generateLineHeight(designSystem.typography),
    spacing: generateSpacing(designSystem.spacing),
    borderRadius: generateBorderRadius(designSystem.effects),
    boxShadow: generateBoxShadow(designSystem.effects),
    transitionDuration: generateTransitionDuration(designSystem.effects),
  };
}

/**
 * Generate complete Tailwind config object from DesignSystem
 */
export function generateTailwindConfig(
  designSystem: DesignSystem,
  config: TailwindGeneratorConfig = {}
): TailwindConfig {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const tailwindConfig: TailwindConfig = {};

  // Add dark mode if configured
  if (mergedConfig.includeDarkMode) {
    tailwindConfig.darkMode = mergedConfig.darkModeStrategy;
  }

  // Add content paths
  tailwindConfig.content = mergedConfig.contentPaths;

  // Add theme with extend
  tailwindConfig.theme = {
    extend: generateThemeExtend(designSystem, config),
  };

  // Add empty plugins array if configured
  if (mergedConfig.includePlugins) {
    tailwindConfig.plugins = [];
  }

  return tailwindConfig;
}

// ====================
// STRING OUTPUT GENERATION
// ====================

/**
 * Serialize a value to valid JavaScript string representation
 */
function serializeValue(value: unknown, indent: number = 0): string {
  const spaces = '  '.repeat(indent);
  const innerSpaces = '  '.repeat(indent + 1);

  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "\\'")}'`;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    const items = value.map((item) => `${innerSpaces}${serializeValue(item, indent + 1)}`);
    return `[\n${items.join(',\n')},\n${spaces}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return '{}';
    }

    const props = entries.map(([key, val]) => {
      // Use quotes for keys with special characters
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
      return `${innerSpaces}${safeKey}: ${serializeValue(val, indent + 1)}`;
    });

    return `{\n${props.join(',\n')},\n${spaces}}`;
  }

  return String(value);
}

/**
 * Generate tailwind.config.js file content as a string
 *
 * @param designSystem - The design system to generate config from
 * @param config - Optional configuration for generation
 * @returns Valid JavaScript string for tailwind.config.js
 */
export function generateTailwindConfigString(
  designSystem: DesignSystem,
  config: TailwindGeneratorConfig = {}
): string {
  const tailwindConfig = generateTailwindConfig(designSystem, config);

  const lines: string[] = [
    `/** @type {import('tailwindcss').Config} */`,
    `const config = ${serializeValue(tailwindConfig)}`,
    `module.exports = config`,
    '', // Trailing newline
  ];

  return lines.join('\n');
}

/**
 * Generate tailwind.config.ts file content as a string (TypeScript version)
 *
 * @param designSystem - The design system to generate config from
 * @param config - Optional configuration for generation
 * @returns Valid TypeScript string for tailwind.config.ts
 */
export function generateTailwindConfigTsString(
  designSystem: DesignSystem,
  config: TailwindGeneratorConfig = {}
): string {
  const tailwindConfig = generateTailwindConfig(designSystem, config);

  const lines: string[] = [
    `import type { Config } from 'tailwindcss'`,
    ``,
    `const config: Config = ${serializeValue(tailwindConfig)}`,
    `export default config`,
    '', // Trailing newline
  ];

  return lines.join('\n');
}

// ====================
// EXPORTS
// ====================

export {
  // Re-export for convenience
  DEFAULT_CONFIG as TAILWIND_GENERATOR_DEFAULTS,
};
