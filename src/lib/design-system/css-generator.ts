/**
 * CSS Variables Generator Module
 *
 * Generates valid CSS custom properties (:root variables) from a DesignSystem object.
 * The output follows CSS custom property conventions and can be written
 * directly to a variables.css file for use in generated projects.
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
 * Configuration for CSS generation
 */
export interface CSSGeneratorConfig {
  /** Prefix for all CSS variables (e.g., 'ds' produces --ds-primary) */
  prefix?: string;
  /** Include color palettes in output */
  includePalettes?: boolean;
  /** Include RGB versions of colors for alpha manipulation */
  includeRgbColors?: boolean;
  /** Include typography scale */
  includeTypography?: boolean;
  /** Include spacing scale */
  includeSpacing?: boolean;
  /** Include effects (shadows, radii, transitions) */
  includeEffects?: boolean;
  /** Generate dark mode variables */
  includeDarkMode?: boolean;
  /** Format output with extra spacing */
  prettyPrint?: boolean;
}

/**
 * Grouped CSS variables for organization
 */
export interface CSSVariableGroup {
  name: string;
  comment?: string;
  variables: CSSVariable[];
}

/**
 * Single CSS variable
 */
export interface CSSVariable {
  name: string;
  value: string;
  comment?: string;
}

// ====================
// CONFIGURATION
// ====================

const DEFAULT_CONFIG: Required<CSSGeneratorConfig> = {
  prefix: '',
  includePalettes: true,
  includeRgbColors: true,
  includeTypography: true,
  includeSpacing: true,
  includeEffects: true,
  includeDarkMode: false,
  prettyPrint: true,
} as const;

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Convert a key to a valid CSS variable name
 * Handles special characters and camelCase to kebab-case conversion
 */
export function toVariableName(key: string, prefix: string = ''): string {
  // Convert camelCase to kebab-case
  const kebabKey = key
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([0-9])([a-zA-Z])/g, '$1-$2')
    .toLowerCase();

  // Build variable name with optional prefix
  const parts = ['--'];
  if (prefix) {
    parts.push(prefix, '-');
  }
  parts.push(kebabKey);

  return parts.join('');
}

/**
 * Convert hex color to RGB values (for alpha manipulation in CSS)
 */
export function hexToRgb(hex: string): string | null {
  // Handle shorthand hex
  const fullHex = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (_, r, g, b) => {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  if (!result) {
    return null;
  }

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `${r} ${g} ${b}`;
}

/**
 * Escape CSS string value if needed
 */
export function escapeCssValue(value: string): string {
  // Most values don't need escaping, but handle edge cases
  return value;
}

// ====================
// COLOR GENERATION
// ====================

/**
 * Generate CSS variables for colors
 */
export function generateColorVariables(
  colors: ColorExtraction,
  config: CSSGeneratorConfig = {}
): CSSVariableGroup[] {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const prefix = mergedConfig.prefix;
  const groups: CSSVariableGroup[] = [];

  // Primary colors
  const primaryVars: CSSVariable[] = [];
  colors.primary.forEach((color, index) => {
    const suffix = index === 0 ? '' : `-${index + 1}`;
    primaryVars.push({
      name: toVariableName(`primary${suffix}`, prefix),
      value: color,
    });
    if (mergedConfig.includeRgbColors) {
      const rgb = hexToRgb(color);
      if (rgb) {
        primaryVars.push({
          name: toVariableName(`primary${suffix}-rgb`, prefix),
          value: rgb,
        });
      }
    }
  });
  if (primaryVars.length > 0) {
    groups.push({
      name: 'Primary Colors',
      variables: primaryVars,
    });
  }

  // Secondary colors
  const secondaryVars: CSSVariable[] = [];
  colors.secondary.forEach((color, index) => {
    const suffix = index === 0 ? '' : `-${index + 1}`;
    secondaryVars.push({
      name: toVariableName(`secondary${suffix}`, prefix),
      value: color,
    });
    if (mergedConfig.includeRgbColors) {
      const rgb = hexToRgb(color);
      if (rgb) {
        secondaryVars.push({
          name: toVariableName(`secondary${suffix}-rgb`, prefix),
          value: rgb,
        });
      }
    }
  });
  if (secondaryVars.length > 0) {
    groups.push({
      name: 'Secondary Colors',
      variables: secondaryVars,
    });
  }

  // Neutral colors (background, foreground, muted)
  const neutralVars: CSSVariable[] = [];
  if (colors.neutral.length > 0) {
    // Sort by lightness to assign background/foreground
    const sortedNeutrals = [...colors.neutral].sort((a, b) => {
      return getLightness(a) - getLightness(b);
    });

    // Darkest for background, lightest for foreground
    const background = sortedNeutrals[0];
    const foreground = sortedNeutrals[sortedNeutrals.length - 1];
    const muted = sortedNeutrals[Math.floor(sortedNeutrals.length / 2)];

    neutralVars.push({ name: toVariableName('background', prefix), value: background });
    if (mergedConfig.includeRgbColors) {
      const rgb = hexToRgb(background);
      if (rgb) {
        neutralVars.push({ name: toVariableName('background-rgb', prefix), value: rgb });
      }
    }

    neutralVars.push({ name: toVariableName('foreground', prefix), value: foreground });
    if (mergedConfig.includeRgbColors) {
      const rgb = hexToRgb(foreground);
      if (rgb) {
        neutralVars.push({ name: toVariableName('foreground-rgb', prefix), value: rgb });
      }
    }

    if (sortedNeutrals.length > 2) {
      neutralVars.push({ name: toVariableName('muted', prefix), value: muted });
      if (mergedConfig.includeRgbColors) {
        const rgb = hexToRgb(muted);
        if (rgb) {
          neutralVars.push({ name: toVariableName('muted-rgb', prefix), value: rgb });
        }
      }
    }
  }
  if (neutralVars.length > 0) {
    groups.push({
      name: 'Neutral Colors',
      variables: neutralVars,
    });
  }

  // Semantic colors
  const semanticVars: CSSVariable[] = [];
  for (const [key, value] of Object.entries(colors.semantic)) {
    semanticVars.push({
      name: toVariableName(key, prefix),
      value: value,
    });
    if (mergedConfig.includeRgbColors) {
      const rgb = hexToRgb(value);
      if (rgb) {
        semanticVars.push({
          name: toVariableName(`${key}-rgb`, prefix),
          value: rgb,
        });
      }
    }
  }
  groups.push({
    name: 'Semantic Colors',
    variables: semanticVars,
  });

  // Color palettes
  if (mergedConfig.includePalettes && colors.palettes) {
    for (const [paletteName, palette] of Object.entries(colors.palettes)) {
      const paletteVars: CSSVariable[] = [];
      for (const [shade, color] of Object.entries(palette)) {
        paletteVars.push({
          name: toVariableName(`${paletteName}-${shade}`, prefix),
          value: color,
        });
      }
      groups.push({
        name: `${capitalizeFirst(paletteName)} Palette`,
        variables: paletteVars,
      });
    }
  }

  return groups;
}

/**
 * Get lightness of a hex color (0-1)
 */
function getLightness(hex: string): number {
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return (max + min) / 2;
  } catch {
    return 0.5;
  }
}

/**
 * Capitalize first letter of a string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ====================
// TYPOGRAPHY GENERATION
// ====================

/**
 * Generate CSS variables for typography
 */
export function generateTypographyVariables(
  typography: TypographyExtraction,
  config: CSSGeneratorConfig = {}
): CSSVariableGroup[] {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const prefix = mergedConfig.prefix;
  const groups: CSSVariableGroup[] = [];

  // Font families
  const fontVars: CSSVariable[] = [];
  if (typography.fonts.heading) {
    fontVars.push({
      name: toVariableName('font-heading', prefix),
      value: `"${typography.fonts.heading}", system-ui, sans-serif`,
    });
  }
  if (typography.fonts.body) {
    fontVars.push({
      name: toVariableName('font-body', prefix),
      value: `"${typography.fonts.body}", system-ui, sans-serif`,
    });
    fontVars.push({
      name: toVariableName('font-sans', prefix),
      value: `"${typography.fonts.body}", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    });
  }
  if (typography.fonts.mono) {
    fontVars.push({
      name: toVariableName('font-mono', prefix),
      value: `"${typography.fonts.mono}", ui-monospace, SFMono-Regular, monospace`,
    });
  }
  if (fontVars.length > 0) {
    groups.push({
      name: 'Font Families',
      variables: fontVars,
    });
  }

  // Font sizes
  const sizeVars: CSSVariable[] = [];
  const scaleMapping: Record<string, string> = {
    display: 'text-display',
    h1: 'text-5xl',
    h2: 'text-4xl',
    h3: 'text-3xl',
    h4: 'text-2xl',
    h5: 'text-xl',
    h6: 'text-lg',
    body: 'text-base',
    small: 'text-sm',
    xs: 'text-xs',
  };

  for (const [key, size] of Object.entries(typography.scale)) {
    const varName = scaleMapping[key] || `text-${key}`;
    sizeVars.push({
      name: toVariableName(varName, prefix),
      value: size,
    });
  }
  if (sizeVars.length > 0) {
    groups.push({
      name: 'Font Sizes',
      variables: sizeVars,
    });
  }

  // Font weights
  const weightVars: CSSVariable[] = [];
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
    weightVars.push({
      name: toVariableName(`font-weight-${name}`, prefix),
      value: String(weight),
    });
  }
  if (weightVars.length > 0) {
    groups.push({
      name: 'Font Weights',
      variables: weightVars,
    });
  }

  // Line heights
  const lineHeightVars: CSSVariable[] = [
    {
      name: toVariableName('leading-tight', prefix),
      value: String(typography.lineHeights.tight),
    },
    {
      name: toVariableName('leading-normal', prefix),
      value: String(typography.lineHeights.normal),
    },
    {
      name: toVariableName('leading-relaxed', prefix),
      value: String(typography.lineHeights.relaxed),
    },
  ];
  groups.push({
    name: 'Line Heights',
    variables: lineHeightVars,
  });

  return groups;
}

// ====================
// SPACING GENERATION
// ====================

/**
 * Generate CSS variables for spacing
 */
export function generateSpacingVariables(
  spacing: SpacingExtraction,
  config: CSSGeneratorConfig = {}
): CSSVariableGroup[] {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const prefix = mergedConfig.prefix;
  const groups: CSSVariableGroup[] = [];

  // Base unit
  const baseVars: CSSVariable[] = [
    {
      name: toVariableName('spacing-unit', prefix),
      value: `${spacing.baseUnit}px`,
    },
  ];
  groups.push({
    name: 'Spacing Base',
    variables: baseVars,
  });

  // Spacing scale
  const scaleVars: CSSVariable[] = [];
  for (const value of spacing.scale) {
    scaleVars.push({
      name: toVariableName(`spacing-${value}`, prefix),
      value: `${value / 16}rem`,
    });
  }
  if (scaleVars.length > 0) {
    groups.push({
      name: 'Spacing Scale',
      variables: scaleVars,
    });
  }

  // Container and section
  const containerVars: CSSVariable[] = [
    {
      name: toVariableName('container-max-width', prefix),
      value: spacing.containerMaxWidth,
    },
    {
      name: toVariableName('section-padding-mobile', prefix),
      value: spacing.sectionPadding.mobile,
    },
    {
      name: toVariableName('section-padding-desktop', prefix),
      value: spacing.sectionPadding.desktop,
    },
  ];
  groups.push({
    name: 'Container & Section',
    variables: containerVars,
  });

  return groups;
}

// ====================
// EFFECTS GENERATION
// ====================

/**
 * Generate CSS variables for effects
 */
export function generateEffectsVariables(
  effects: EffectsExtraction,
  config: CSSGeneratorConfig = {}
): CSSVariableGroup[] {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const prefix = mergedConfig.prefix;
  const groups: CSSVariableGroup[] = [];

  // Box shadows
  const shadowVars: CSSVariable[] = [
    { name: toVariableName('shadow-sm', prefix), value: effects.shadows.sm },
    { name: toVariableName('shadow-md', prefix), value: effects.shadows.md },
    { name: toVariableName('shadow-lg', prefix), value: effects.shadows.lg },
    { name: toVariableName('shadow-xl', prefix), value: effects.shadows.xl },
  ];
  groups.push({
    name: 'Box Shadows',
    variables: shadowVars,
  });

  // Border radii
  const radiusVars: CSSVariable[] = [
    { name: toVariableName('radius-sm', prefix), value: effects.radii.sm },
    { name: toVariableName('radius-md', prefix), value: effects.radii.md },
    { name: toVariableName('radius-lg', prefix), value: effects.radii.lg },
    { name: toVariableName('radius-full', prefix), value: effects.radii.full },
  ];
  groups.push({
    name: 'Border Radii',
    variables: radiusVars,
  });

  // Transitions
  const transitionVars: CSSVariable[] = [
    { name: toVariableName('transition-fast', prefix), value: effects.transitions.fast },
    { name: toVariableName('transition-normal', prefix), value: effects.transitions.normal },
    { name: toVariableName('transition-slow', prefix), value: effects.transitions.slow },
  ];
  groups.push({
    name: 'Transitions',
    variables: transitionVars,
  });

  return groups;
}

// ====================
// VARIABLE GROUPS ASSEMBLY
// ====================

/**
 * Generate all CSS variable groups from a DesignSystem
 */
export function generateAllVariableGroups(
  designSystem: DesignSystem,
  config: CSSGeneratorConfig = {}
): CSSVariableGroup[] {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const groups: CSSVariableGroup[] = [];

  // Colors (always included)
  groups.push(...generateColorVariables(designSystem.colors, mergedConfig));

  // Typography
  if (mergedConfig.includeTypography) {
    groups.push(...generateTypographyVariables(designSystem.typography, mergedConfig));
  }

  // Spacing
  if (mergedConfig.includeSpacing) {
    groups.push(...generateSpacingVariables(designSystem.spacing, mergedConfig));
  }

  // Effects
  if (mergedConfig.includeEffects) {
    groups.push(...generateEffectsVariables(designSystem.effects, mergedConfig));
  }

  return groups;
}

// ====================
// STRING OUTPUT GENERATION
// ====================

/**
 * Format a single CSS variable declaration
 */
function formatVariable(variable: CSSVariable, indent: string = '  '): string {
  return `${indent}${variable.name}: ${variable.value};`;
}

/**
 * Format a group of CSS variables with optional comment header
 */
function formatGroup(
  group: CSSVariableGroup,
  config: CSSGeneratorConfig,
  indent: string = '  '
): string {
  const lines: string[] = [];

  if (config.prettyPrint && group.name) {
    lines.push(`${indent}/* ${group.name} */`);
  }

  for (const variable of group.variables) {
    lines.push(formatVariable(variable, indent));
  }

  return lines.join('\n');
}

/**
 * Generate CSS custom properties file content as a string
 *
 * @param designSystem - The design system to generate CSS from
 * @param config - Optional configuration for generation
 * @returns Valid CSS string with :root custom properties
 */
export function generateCSSVariables(
  designSystem: DesignSystem,
  config: CSSGeneratorConfig = {}
): string {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const groups = generateAllVariableGroups(designSystem, mergedConfig);

  const lines: string[] = [];

  // Header comment
  if (mergedConfig.prettyPrint) {
    lines.push('/**');
    lines.push(' * Design System CSS Variables');
    lines.push(` * Generated from: ${designSystem.meta.sourceUrl}`);
    lines.push(` * Generated at: ${designSystem.meta.extractedAt}`);
    lines.push(` * Version: ${designSystem.meta.version}`);
    lines.push(' */');
    lines.push('');
  }

  // Open :root
  lines.push(':root {');

  // Add all groups
  for (let i = 0; i < groups.length; i++) {
    if (mergedConfig.prettyPrint && i > 0) {
      lines.push(''); // Blank line between groups
    }
    lines.push(formatGroup(groups[i], mergedConfig));
  }

  // Close :root
  lines.push('}');
  lines.push(''); // Trailing newline

  return lines.join('\n');
}

/**
 * Generate CSS with dark mode support using prefers-color-scheme
 *
 * @param designSystem - The design system for light mode
 * @param darkDesignSystem - The design system for dark mode
 * @param config - Optional configuration for generation
 * @returns Valid CSS string with :root and @media (prefers-color-scheme: dark)
 */
export function generateCSSVariablesWithDarkMode(
  designSystem: DesignSystem,
  darkDesignSystem: DesignSystem,
  config: CSSGeneratorConfig = {}
): string {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Generate light mode
  const lightCSS = generateCSSVariables(designSystem, mergedConfig);

  // Generate dark mode variables
  const darkGroups = generateAllVariableGroups(darkDesignSystem, mergedConfig);

  const lines: string[] = [lightCSS];

  // Add dark mode media query
  if (mergedConfig.prettyPrint) {
    lines.push('/* Dark Mode */');
  }
  lines.push('@media (prefers-color-scheme: dark) {');
  lines.push('  :root {');

  for (let i = 0; i < darkGroups.length; i++) {
    if (mergedConfig.prettyPrint && i > 0) {
      lines.push(''); // Blank line between groups
    }
    lines.push(formatGroup(darkGroups[i], mergedConfig, '    '));
  }

  lines.push('  }');
  lines.push('}');
  lines.push(''); // Trailing newline

  return lines.join('\n');
}

/**
 * Generate CSS with class-based dark mode support (for Tailwind dark: prefix)
 *
 * @param designSystem - The design system for light mode
 * @param darkDesignSystem - The design system for dark mode
 * @param config - Optional configuration for generation
 * @returns Valid CSS string with :root and .dark :root selectors
 */
export function generateCSSVariablesWithClassDarkMode(
  designSystem: DesignSystem,
  darkDesignSystem: DesignSystem,
  config: CSSGeneratorConfig = {}
): string {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Generate light mode
  const lightCSS = generateCSSVariables(designSystem, mergedConfig);

  // Generate dark mode variables
  const darkGroups = generateAllVariableGroups(darkDesignSystem, mergedConfig);

  const lines: string[] = [lightCSS];

  // Add class-based dark mode
  if (mergedConfig.prettyPrint) {
    lines.push('/* Dark Mode (class-based) */');
  }
  lines.push('.dark {');

  for (let i = 0; i < darkGroups.length; i++) {
    if (mergedConfig.prettyPrint && i > 0) {
      lines.push(''); // Blank line between groups
    }
    lines.push(formatGroup(darkGroups[i], mergedConfig));
  }

  lines.push('}');
  lines.push(''); // Trailing newline

  return lines.join('\n');
}

/**
 * Generate a minimal CSS reset with design system variables applied
 *
 * @param designSystem - The design system to apply
 * @param config - Optional configuration for generation
 * @returns CSS with variables and basic reset styles
 */
export function generateCSSVariablesWithReset(
  designSystem: DesignSystem,
  config: CSSGeneratorConfig = {}
): string {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const prefix = mergedConfig.prefix;

  const variablesCSS = generateCSSVariables(designSystem, mergedConfig);

  const resetCSS = `
/* Base Styles */
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  font-family: var(${toVariableName('font-sans', prefix)}, system-ui, sans-serif);
  font-size: var(${toVariableName('text-base', prefix)}, 1rem);
  line-height: var(${toVariableName('leading-normal', prefix)}, 1.5);
  color: var(${toVariableName('foreground', prefix)}, #171717);
  background-color: var(${toVariableName('background', prefix)}, #fafafa);
}

body {
  margin: 0;
  min-height: 100vh;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(${toVariableName('font-heading', prefix)}, inherit);
  line-height: var(${toVariableName('leading-tight', prefix)}, 1.25);
}

h1 { font-size: var(${toVariableName('text-5xl', prefix)}, 3rem); }
h2 { font-size: var(${toVariableName('text-4xl', prefix)}, 2.25rem); }
h3 { font-size: var(${toVariableName('text-3xl', prefix)}, 1.875rem); }
h4 { font-size: var(${toVariableName('text-2xl', prefix)}, 1.5rem); }
h5 { font-size: var(${toVariableName('text-xl', prefix)}, 1.25rem); }
h6 { font-size: var(${toVariableName('text-lg', prefix)}, 1.125rem); }

code, pre {
  font-family: var(${toVariableName('font-mono', prefix)}, ui-monospace, monospace);
}

.container {
  max-width: var(${toVariableName('container-max-width', prefix)}, 1280px);
  margin-inline: auto;
  padding-inline: var(${toVariableName('section-padding-mobile', prefix)}, 1rem);
}

@media (min-width: 768px) {
  .container {
    padding-inline: var(${toVariableName('section-padding-desktop', prefix)}, 2rem);
  }
}
`;

  return variablesCSS + resetCSS;
}

// ====================
// EXPORTS
// ====================

export {
  DEFAULT_CONFIG as CSS_GENERATOR_DEFAULTS,
};
