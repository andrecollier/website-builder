/**
 * Design System Preview Module
 *
 * Generates a visual preview of the extracted design system tokens.
 * Allows users to verify colors, typography, and spacing before generation.
 */

import type { DesignSystem } from '@/types';

// ====================
// TYPE DEFINITIONS
// ====================

export interface DesignSystemPreview {
  colors: {
    primary: ColorSwatch[];
    secondary: ColorSwatch[];
    neutral: ColorSwatch[];
    semantic: ColorSwatch[];
  };
  typography: {
    headings: TypographyPreview[];
    body: TypographyPreview[];
    fonts: FontPreview[];
  };
  spacing: {
    scale: SpacingPreview[];
    containers: ContainerPreview[];
  };
  summary: {
    colorCount: number;
    fontCount: number;
    spacingSteps: number;
  };
}

export interface ColorSwatch {
  name: string;
  value: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  contrast: {
    onWhite: number;
    onBlack: number;
  };
  usage?: string;
}

export interface TypographyPreview {
  name: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  sample: string;
}

export interface FontPreview {
  family: string;
  weights: string[];
  source: 'google' | 'system' | 'custom';
  fallback: string;
}

export interface SpacingPreview {
  name: string;
  value: string;
  pixels: number;
  usage?: string;
}

export interface ContainerPreview {
  name: string;
  maxWidth: string;
  padding: string;
}

// ====================
// HELPER FUNCTIONS
// ====================

/**
 * Convert any color format to hex
 */
function toHex(color: string): string {
  // Already hex
  if (color.startsWith('#')) {
    return color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;
  }

  // RGB/RGBA
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  return color;
}

/**
 * Convert color to RGB object
 */
function toRgb(color: string): { r: number; g: number; b: number } {
  const hex = toHex(color).replace('#', '');
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

/**
 * Calculate relative luminance
 */
function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrast(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Create a color swatch from a color value
 */
function createSwatch(name: string, value: string, usage?: string): ColorSwatch {
  const hex = toHex(value);
  const rgb = toRgb(value);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  return {
    name,
    value,
    hex,
    rgb,
    contrast: {
      onWhite: Math.round(getContrast(rgb, white) * 10) / 10,
      onBlack: Math.round(getContrast(rgb, black) * 10) / 10,
    },
    usage,
  };
}

// ====================
// MAIN PREVIEW FUNCTION
// ====================

/**
 * Generate a design system preview from extracted tokens
 */
export function generateDesignSystemPreview(
  designSystem: DesignSystem
): DesignSystemPreview {
  const { colors, typography, spacing } = designSystem;

  // Build color swatches
  const colorSwatches: DesignSystemPreview['colors'] = {
    primary: [],
    secondary: [],
    neutral: [],
    semantic: [],
  };

  // Primary colors
  if (colors.primary && colors.primary.length > 0) {
    colors.primary.forEach((color, i) => {
      colorSwatches.primary.push(createSwatch(`Primary${i > 0 ? ` ${i + 1}` : ''}`, color, i === 0 ? 'Buttons, links, accents' : undefined));
    });
  }

  // Secondary colors
  if (colors.secondary && colors.secondary.length > 0) {
    colors.secondary.forEach((color, i) => {
      colorSwatches.secondary.push(createSwatch(`Secondary${i > 0 ? ` ${i + 1}` : ''}`, color, i === 0 ? 'Secondary buttons' : undefined));
    });
  }

  // Neutral colors
  if (colors.neutral && colors.neutral.length > 0) {
    colors.neutral.forEach((color, i) => {
      const labels = ['Background', 'Text', 'Text Muted', 'Border'];
      const usages = ['Page background', 'Body text', 'Secondary text', 'Borders, dividers'];
      colorSwatches.neutral.push(createSwatch(labels[i] || `Neutral ${i + 1}`, color, usages[i]));
    });
  }

  // Semantic colors
  if (colors.semantic) {
    if (colors.semantic.success) {
      colorSwatches.semantic.push(createSwatch('Success', colors.semantic.success, 'Success states'));
    }
    if (colors.semantic.error) {
      colorSwatches.semantic.push(createSwatch('Error', colors.semantic.error, 'Error states'));
    }
    if (colors.semantic.warning) {
      colorSwatches.semantic.push(createSwatch('Warning', colors.semantic.warning, 'Warning states'));
    }
    if (colors.semantic.info) {
      colorSwatches.semantic.push(createSwatch('Info', colors.semantic.info, 'Info states'));
    }
  }

  // Build typography preview
  const typographyPreview: DesignSystemPreview['typography'] = {
    headings: [],
    body: [],
    fonts: [],
  };

  // Heading styles
  const headingNames = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
  const headingSamples = [
    'Main Headline',
    'Section Title',
    'Card Title',
    'Subsection',
    'Small Title',
    'Tiny Title',
  ];
  const scaleKeys = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

  for (let i = 0; i < 6; i++) {
    const fontSize = typography.scale?.[scaleKeys[i]];
    if (fontSize) {
      typographyPreview.headings.push({
        name: headingNames[i],
        fontFamily: typography.fonts?.heading || 'sans-serif',
        fontSize: fontSize,
        fontWeight: 'bold',
        lineHeight: '1.2',
        sample: headingSamples[i],
      });
    }
  }

  // Body styles
  typographyPreview.body.push({
    name: 'Body',
    fontFamily: typography.fonts?.body || 'sans-serif',
    fontSize: typography.scale?.body || '16px',
    fontWeight: '400',
    lineHeight: '1.5',
    sample: 'The quick brown fox jumps over the lazy dog.',
  });

  // Font information
  if (typography.fonts?.heading) {
    typographyPreview.fonts.push({
      family: typography.fonts.heading,
      weights: ['400', '500', '600', '700'],
      source: 'google',
      fallback: 'sans-serif',
    });
  }

  if (typography.fonts?.body && typography.fonts.body !== typography.fonts.heading) {
    typographyPreview.fonts.push({
      family: typography.fonts.body,
      weights: ['400', '500', '600'],
      source: 'google',
      fallback: 'sans-serif',
    });
  }

  // Build spacing preview
  const spacingPreview: DesignSystemPreview['spacing'] = {
    scale: [],
    containers: [],
  };

  // Spacing scale
  const spacingNames = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
  const spacingUsages = [
    'Tight spacing',
    'Small gaps',
    'Default spacing',
    'Section padding',
    'Large gaps',
    'Section margins',
    'Hero spacing',
  ];

  // Use scale array if available, otherwise use defaults
  const scaleValues = spacing.scale && spacing.scale.length > 0
    ? spacing.scale
    : [4, 8, 16, 24, 32, 48, 64];

  for (let i = 0; i < Math.min(spacingNames.length, scaleValues.length); i++) {
    const pixels = scaleValues[i];
    spacingPreview.scale.push({
      name: spacingNames[i],
      value: `${pixels}px`,
      pixels,
      usage: spacingUsages[i],
    });
  }

  // Container widths
  spacingPreview.containers.push({
    name: 'Container',
    maxWidth: spacing.containerMaxWidth || '1280px',
    padding: spacing.sectionPadding?.desktop || '16px',
  });

  // Build summary
  const totalColors = Object.values(colorSwatches).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return {
    colors: colorSwatches,
    typography: typographyPreview,
    spacing: spacingPreview,
    summary: {
      colorCount: totalColors,
      fontCount: typographyPreview.fonts.length,
      spacingSteps: spacingPreview.scale.length,
    },
  };
}

/**
 * Generate HTML preview of design system
 */
export function generatePreviewHtml(preview: DesignSystemPreview): string {
  const colorSection = (title: string, swatches: ColorSwatch[]) => {
    if (swatches.length === 0) return '';

    const swatchHtml = swatches
      .map(
        (s) => `
      <div class="swatch">
        <div class="swatch-color" style="background-color: ${s.hex}"></div>
        <div class="swatch-info">
          <div class="swatch-name">${s.name}</div>
          <div class="swatch-value">${s.hex}</div>
          ${s.usage ? `<div class="swatch-usage">${s.usage}</div>` : ''}
        </div>
      </div>
    `
      )
      .join('');

    return `
      <div class="color-group">
        <h3>${title}</h3>
        <div class="swatches">${swatchHtml}</div>
      </div>
    `;
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Design System Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; padding: 40px; background: #f5f5f5; }
    h1 { margin-bottom: 32px; }
    h2 { margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #ddd; }
    h3 { margin-bottom: 12px; color: #666; font-size: 14px; text-transform: uppercase; }

    .section { background: white; padding: 24px; margin-bottom: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

    .swatches { display: flex; flex-wrap: wrap; gap: 16px; }
    .swatch { display: flex; align-items: center; gap: 12px; }
    .swatch-color { width: 48px; height: 48px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); }
    .swatch-name { font-weight: 600; }
    .swatch-value { font-family: monospace; font-size: 12px; color: #666; }
    .swatch-usage { font-size: 11px; color: #999; }

    .typography-sample { margin-bottom: 24px; padding: 16px; background: #fafafa; border-radius: 4px; }
    .typography-meta { font-size: 12px; color: #666; margin-top: 8px; font-family: monospace; }

    .spacing-scale { display: flex; gap: 8px; align-items: flex-end; }
    .spacing-item { text-align: center; }
    .spacing-bar { background: #4f46e5; border-radius: 2px; margin-bottom: 8px; }
    .spacing-label { font-size: 11px; color: #666; }
    .spacing-value { font-size: 10px; color: #999; font-family: monospace; }

    .summary { display: flex; gap: 32px; }
    .summary-stat { text-align: center; }
    .summary-number { font-size: 32px; font-weight: 700; color: #4f46e5; }
    .summary-label { font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h1>Design System Preview</h1>

  <div class="section">
    <h2>Summary</h2>
    <div class="summary">
      <div class="summary-stat">
        <div class="summary-number">${preview.summary.colorCount}</div>
        <div class="summary-label">Colors</div>
      </div>
      <div class="summary-stat">
        <div class="summary-number">${preview.summary.fontCount}</div>
        <div class="summary-label">Fonts</div>
      </div>
      <div class="summary-stat">
        <div class="summary-number">${preview.summary.spacingSteps}</div>
        <div class="summary-label">Spacing Steps</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Colors</h2>
    ${colorSection('Primary', preview.colors.primary)}
    ${colorSection('Secondary', preview.colors.secondary)}
    ${colorSection('Neutral', preview.colors.neutral)}
    ${colorSection('Semantic', preview.colors.semantic)}
  </div>

  <div class="section">
    <h2>Typography</h2>
    ${preview.typography.headings
      .map(
        (h) => `
      <div class="typography-sample">
        <div style="font-family: ${h.fontFamily}; font-size: ${h.fontSize}; font-weight: ${h.fontWeight}; line-height: ${h.lineHeight};">
          ${h.sample}
        </div>
        <div class="typography-meta">${h.name}: ${h.fontFamily} / ${h.fontSize} / ${h.fontWeight}</div>
      </div>
    `
      )
      .join('')}
    ${preview.typography.body
      .map(
        (b) => `
      <div class="typography-sample">
        <div style="font-family: ${b.fontFamily}; font-size: ${b.fontSize}; font-weight: ${b.fontWeight}; line-height: ${b.lineHeight};">
          ${b.sample}
        </div>
        <div class="typography-meta">${b.name}: ${b.fontFamily} / ${b.fontSize}</div>
      </div>
    `
      )
      .join('')}
  </div>

  <div class="section">
    <h2>Spacing</h2>
    <div class="spacing-scale">
      ${preview.spacing.scale
        .map(
          (s) => `
        <div class="spacing-item">
          <div class="spacing-bar" style="width: ${Math.max(8, s.pixels / 2)}px; height: ${s.pixels}px;"></div>
          <div class="spacing-label">${s.name}</div>
          <div class="spacing-value">${s.value}</div>
        </div>
      `
        )
        .join('')}
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Format design system preview as text report
 */
export function formatDesignSystemReport(preview: DesignSystemPreview): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('                 DESIGN SYSTEM PREVIEW');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push(`Colors: ${preview.summary.colorCount} | Fonts: ${preview.summary.fontCount} | Spacing: ${preview.summary.spacingSteps} steps`);
  lines.push('───────────────────────────────────────────────────────────');

  // Colors
  lines.push('\n## COLORS\n');
  const allColors = [
    ...preview.colors.primary,
    ...preview.colors.secondary,
    ...preview.colors.neutral,
    ...preview.colors.semantic,
  ];
  for (const color of allColors) {
    lines.push(`  ${color.name.padEnd(15)} ${color.hex}  ${color.usage || ''}`);
  }

  // Typography
  lines.push('\n## TYPOGRAPHY\n');
  for (const font of preview.typography.fonts) {
    lines.push(`  ${font.family} (${font.source})`);
    lines.push(`    Weights: ${font.weights.join(', ')}`);
  }

  // Spacing
  lines.push('\n## SPACING\n');
  for (const space of preview.spacing.scale) {
    const bar = '█'.repeat(Math.ceil(space.pixels / 8));
    lines.push(`  ${space.name.padEnd(4)} ${space.value.padEnd(6)} ${bar}`);
  }

  lines.push('\n═══════════════════════════════════════════════════════════');

  return lines.join('\n');
}
