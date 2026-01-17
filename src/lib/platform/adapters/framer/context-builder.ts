/**
 * Framer Context Builder
 *
 * Builds a dynamic design context from extracted data:
 * - Reference screenshots
 * - Extracted CSS tokens
 * - Detected components
 * - Design system tokens
 *
 * Combines extracted data with Framer-specific patterns and enhancements.
 */

import type { DesignSystem, DetectedComponent, ComponentType } from '@/types';
import {
  FRAMER_DESIGN_CONTEXT,
  FRAMER_COLORS,
  FRAMER_GRADIENTS,
  FRAMER_FONTS,
  FRAMER_ANIMATIONS,
  type FramerDesignContext,
  type GradientOrb,
} from './context';

/**
 * Extracted data from reference site
 */
export interface ExtractedSiteData {
  /** Reference URL */
  url: string;
  /** Extracted design system tokens */
  designSystem?: DesignSystem;
  /** Detected components with their data */
  components: DetectedComponent[];
  /** Raw CSS from the page */
  cssContent?: string;
  /** Extracted color palette */
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    /** All unique colors found on the page */
    allColors?: string[];
  };
  /** Extracted fonts */
  fonts?: {
    primary?: string;
    secondary?: string;
  };
  /** Extracted spacing values */
  spacing?: {
    /** Common padding values */
    paddings?: string[];
    /** Common margin values */
    margins?: string[];
    /** Common gap values */
    gaps?: string[];
    /** Container max-widths */
    maxWidths?: string[];
  };
  /** Extracted effects */
  effects?: {
    /** Box shadows found */
    shadows?: string[];
    /** Border radii found */
    borderRadii?: string[];
    /** Transitions/animations */
    transitions?: string[];
  };
  /** Typography scale */
  typography?: {
    /** Font sizes used (h1 to body) */
    fontSizes?: string[];
    /** Line heights */
    lineHeights?: string[];
    /** Font weights */
    fontWeights?: string[];
  };
  /** Responsive breakpoints detected */
  breakpoints?: {
    /** Mobile styles changed at these widths */
    detected?: number[];
  };
}

/**
 * Built context ready for component generation
 */
export interface BuiltFramerContext extends FramerDesignContext {
  /** Source data used to build this context */
  source: {
    url: string;
    extractedAt: string;
  };
  /** Component-specific overrides based on extracted data */
  componentOverrides: Map<ComponentType, ComponentEnhancement>;
  /** Whether this is a dark-themed site */
  isDarkTheme: boolean;
  /** Detected primary color (for accents) */
  detectedPrimaryColor?: string;
  /** Extracted spacing tokens */
  extractedSpacing?: {
    containerMaxWidth?: string;
    sectionPadding?: string;
    cardPadding?: string;
    gap?: string;
  };
  /** Extracted typography tokens */
  extractedTypography?: {
    h1Size?: string;
    h2Size?: string;
    h3Size?: string;
    bodySize?: string;
    smallSize?: string;
  };
  /** Extracted effects */
  extractedEffects?: {
    cardShadow?: string;
    buttonShadow?: string;
    primaryRadius?: string;
    cardRadius?: string;
  };
  /** Responsive breakpoints (widths in px) */
  breakpoints?: number[];
}

/**
 * Enhancement to apply to a specific component type
 */
export interface ComponentEnhancement {
  /** Whether to add gradient orbs */
  addGradientOrbs: boolean;
  /** Custom gradient orbs (if different from defaults) */
  customGradients?: GradientOrb[];
  /** Background color override */
  backgroundColor?: string;
  /** Text color override */
  textColor?: string;
  /** Whether this is a dark section */
  isDarkSection: boolean;
  /** Additional CSS to inject */
  additionalStyles?: Record<string, string>;
}

/**
 * Detect primary color from extracted data
 */
function detectPrimaryColor(data: ExtractedSiteData): string | undefined {
  // Check extracted colors first
  if (data.colors?.primary) {
    return data.colors.primary;
  }

  // Check design system
  if (data.designSystem?.colors?.primary) {
    return data.designSystem.colors.primary;
  }

  // Try to extract from CSS
  if (data.cssContent) {
    // Look for common accent color patterns
    const accentPatterns = [
      /--accent[^:]*:\s*([^;]+)/i,
      /--primary[^:]*:\s*([^;]+)/i,
      /--brand[^:]*:\s*([^;]+)/i,
    ];

    for (const pattern of accentPatterns) {
      const match = data.cssContent.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }

  return undefined;
}

/**
 * Detect if site uses dark theme
 */
function detectDarkTheme(data: ExtractedSiteData): boolean {
  // Check background colors
  if (data.colors?.background) {
    const bg = data.colors.background.toLowerCase();
    // Dark backgrounds typically have low RGB values
    if (bg.includes('rgb')) {
      const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        const brightness = (r + g + b) / 3;
        return brightness < 128;
      }
    }
  }

  // Check CSS for dark mode indicators
  if (data.cssContent) {
    return data.cssContent.includes('dark-mode') ||
           data.cssContent.includes('theme-dark') ||
           data.cssContent.includes('color-scheme: dark');
  }

  return false;
}

/**
 * Detect which component types should be dark sections
 */
function detectDarkSections(components: DetectedComponent[]): ComponentType[] {
  const darkSections: ComponentType[] = [];

  for (const component of components) {
    if (!component.styles) continue;

    const bg = component.styles.backgroundColor || component.styles['background-color'];
    if (bg) {
      const bgLower = bg.toLowerCase();
      // Check for dark backgrounds
      if (bgLower.includes('rgb')) {
        const match = bgLower.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          const r = parseInt(match[1]);
          const g = parseInt(match[2]);
          const b = parseInt(match[3]);
          const brightness = (r + g + b) / 3;
          if (brightness < 80) {
            darkSections.push(component.type);
          }
        }
      }
    }
  }

  return darkSections;
}

/**
 * Build component enhancements based on extracted data
 */
function buildComponentEnhancements(
  data: ExtractedSiteData,
  darkSections: ComponentType[]
): Map<ComponentType, ComponentEnhancement> {
  const enhancements = new Map<ComponentType, ComponentEnhancement>();

  // Default enhancements for common dark sections
  const defaultDarkTypes: ComponentType[] = ['footer', 'cta'];

  for (const component of data.components) {
    const isDark = darkSections.includes(component.type) ||
                   defaultDarkTypes.includes(component.type);

    const enhancement: ComponentEnhancement = {
      addGradientOrbs: isDark, // Add gradient orbs to dark sections
      isDarkSection: isDark,
      backgroundColor: isDark ? FRAMER_COLORS.dark.primary : undefined,
      textColor: isDark ? FRAMER_COLORS.dark.text : undefined,
    };

    // Special handling for about sections (often dark with gradients)
    if (component.type === 'pricing' || component.type === 'cta') {
      // Check if this looks like the "About" section (dark bg, large text)
      const html = component.htmlSnapshot || '';
      if (html.toLowerCase().includes('about') ||
          (component.styles?.backgroundColor?.includes('27, 12, 37'))) {
        enhancement.addGradientOrbs = true;
        enhancement.isDarkSection = true;
        enhancement.customGradients = [
          FRAMER_GRADIENTS.aboutSection.topLeft,
          FRAMER_GRADIENTS.aboutSection.bottomRight,
        ];
      }
    }

    // Footer always gets gradient orbs
    if (component.type === 'footer') {
      enhancement.addGradientOrbs = true;
      enhancement.customGradients = [
        FRAMER_GRADIENTS.footer.topRight,
        FRAMER_GRADIENTS.footer.bottomLeft,
      ];
    }

    enhancements.set(component.type, enhancement);
  }

  return enhancements;
}

/**
 * Extract font family from CSS or design system
 */
function extractFontFamily(data: ExtractedSiteData): string {
  // Check design system first
  if (data.designSystem?.typography?.fontFamily) {
    return data.designSystem.typography.fontFamily;
  }

  // Check extracted fonts
  if (data.fonts?.primary) {
    return data.fonts.primary;
  }

  // Try to extract from CSS
  if (data.cssContent) {
    // Look for font-family in body or root
    const fontMatch = data.cssContent.match(/body\s*\{[^}]*font-family:\s*['"]?([^'";,]+)/i);
    if (fontMatch && fontMatch[1]) {
      return fontMatch[1].trim();
    }
  }

  // Default to General Sans (common in Framer sites)
  return FRAMER_FONTS.primary;
}

/**
 * Extract most common value from array
 */
function getMostCommon(values: string[] | undefined): string | undefined {
  if (!values || values.length === 0) return undefined;
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  let maxCount = 0;
  let mostCommon: string | undefined;
  for (const [value, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = value;
    }
  }
  return mostCommon;
}

/**
 * Extract spacing tokens from extracted data
 */
function extractSpacingTokens(data: ExtractedSiteData) {
  if (!data.spacing) return undefined;

  return {
    containerMaxWidth: getMostCommon(data.spacing.maxWidths) || '1200px',
    sectionPadding: getMostCommon(data.spacing.paddings) || '80px',
    cardPadding: '24px', // Default card padding
    gap: getMostCommon(data.spacing.gaps) || '24px',
  };
}

/**
 * Extract typography tokens from extracted data
 */
function extractTypographyTokens(data: ExtractedSiteData) {
  if (!data.typography?.fontSizes) return undefined;

  // Sort font sizes to determine scale
  const sizes = data.typography.fontSizes
    .map((s) => parseFloat(s))
    .filter((s) => !isNaN(s))
    .sort((a, b) => b - a);

  if (sizes.length < 3) return undefined;

  return {
    h1Size: `${sizes[0]}px`,
    h2Size: sizes.length > 1 ? `${sizes[1]}px` : undefined,
    h3Size: sizes.length > 2 ? `${sizes[2]}px` : undefined,
    bodySize: sizes.length > 3 ? `${sizes[Math.floor(sizes.length / 2)]}px` : '16px',
    smallSize: sizes.length > 4 ? `${sizes[sizes.length - 1]}px` : '14px',
  };
}

/**
 * Extract effect tokens from extracted data
 */
function extractEffectTokens(data: ExtractedSiteData) {
  if (!data.effects) return undefined;

  return {
    cardShadow: getMostCommon(data.effects.shadows),
    buttonShadow: undefined, // Would need more specific extraction
    primaryRadius: getMostCommon(data.effects.borderRadii) || '8px',
    cardRadius: getMostCommon(data.effects.borderRadii) || '12px',
  };
}

/**
 * Build complete Framer context from extracted data
 *
 * @param data - Extracted site data from reference URL
 * @returns Built context ready for component generation
 */
export function buildFramerContext(data: ExtractedSiteData): BuiltFramerContext {
  const darkSections = detectDarkSections(data.components);
  const isDarkTheme = detectDarkTheme(data);
  const primaryColor = detectPrimaryColor(data);
  const fontFamily = extractFontFamily(data);

  // Start with default Framer context
  const baseContext = { ...FRAMER_DESIGN_CONTEXT };

  // Override fonts if we detected different ones
  if (fontFamily !== FRAMER_FONTS.primary) {
    baseContext.fonts = {
      ...baseContext.fonts,
      primary: fontFamily,
    };
  }

  // Build component-specific enhancements
  const componentOverrides = buildComponentEnhancements(data, darkSections);

  // Extract additional design tokens
  const extractedSpacing = extractSpacingTokens(data);
  const extractedTypography = extractTypographyTokens(data);
  const extractedEffects = extractEffectTokens(data);

  return {
    ...baseContext,
    source: {
      url: data.url,
      extractedAt: new Date().toISOString(),
    },
    componentOverrides,
    isDarkTheme,
    detectedPrimaryColor: primaryColor,
    extractedSpacing,
    extractedTypography,
    extractedEffects,
    breakpoints: data.breakpoints?.detected || [768, 1024, 1280],
  };
}

/**
 * Get enhancement for a specific component type
 */
export function getComponentEnhancement(
  context: BuiltFramerContext,
  componentType: ComponentType
): ComponentEnhancement | undefined {
  return context.componentOverrides.get(componentType);
}

/**
 * Check if a component should have gradient orbs
 */
export function shouldAddGradientOrbs(
  context: BuiltFramerContext,
  componentType: ComponentType
): boolean {
  const enhancement = context.componentOverrides.get(componentType);
  return enhancement?.addGradientOrbs ?? false;
}

/**
 * Get gradient orbs for a component type
 */
export function getGradientOrbs(
  context: BuiltFramerContext,
  componentType: ComponentType
): GradientOrb[] | undefined {
  const enhancement = context.componentOverrides.get(componentType);
  if (!enhancement?.addGradientOrbs) {
    return undefined;
  }

  // Return custom gradients if specified, otherwise use defaults based on type
  if (enhancement.customGradients) {
    return enhancement.customGradients;
  }

  // Default gradients based on component type
  if (componentType === 'footer' || componentType === 'cta') {
    return [
      FRAMER_GRADIENTS.footer.topRight,
      FRAMER_GRADIENTS.footer.bottomLeft,
    ];
  }

  return [
    FRAMER_GRADIENTS.aboutSection.topLeft,
    FRAMER_GRADIENTS.aboutSection.bottomRight,
  ];
}

export default buildFramerContext;
