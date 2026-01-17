/**
 * Framer Platform Adapter
 *
 * Handles Framer-specific transformations and configurations
 * for generating compatible React components.
 */

export interface FramerConfig {
  /** Classes required on the page wrapper for layout CSS to work */
  layoutWrapperClasses: string[];
  /** Classes required for font presets to work */
  fontPresetClasses: string[];
  /** Whether to preserve SSR variant classes */
  preserveSSRVariants: boolean;
  /** Breakpoint classes to preserve */
  breakpointClasses: string[];
  /** CSS tokens found in the stylesheet */
  cssTokens: string[];
}

/**
 * Extract Framer configuration from CSS content
 */
export function extractFramerConfig(css: string): FramerConfig {
  const config: FramerConfig = {
    layoutWrapperClasses: [],
    fontPresetClasses: [],
    preserveSSRVariants: false,
    breakpointClasses: [],
    cssTokens: [],
  };

  // Find the most common parent class used in layout selectors
  // Pattern: .framer-XXXXX .framer-YYYYY { ... }
  const layoutParentPattern = /\.framer-([a-zA-Z0-9]+)\s+\.framer-[a-zA-Z0-9]+\s*\{/g;
  const parentCounts = new Map<string, number>();

  let match;
  while ((match = layoutParentPattern.exec(css)) !== null) {
    const className = `framer-${match[1]}`;
    parentCounts.set(className, (parentCounts.get(className) || 0) + 1);
  }

  // Get the top parent classes (there might be more than one)
  const sortedParents = Array.from(parentCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .filter(([_, count]) => count > 10);

  config.layoutWrapperClasses = sortedParents.map(([className]) => className);

  // Find font preset parent class
  // Pattern: .framer-XXXXX .framer-styles-preset-YYYYY
  const fontPresetPattern = /\.framer-([a-zA-Z0-9]+)\s+\.framer-styles-preset/g;
  const fontParentCounts = new Map<string, number>();

  while ((match = fontPresetPattern.exec(css)) !== null) {
    const className = `framer-${match[1]}`;
    fontParentCounts.set(className, (fontParentCounts.get(className) || 0) + 1);
  }

  const sortedFontParents = Array.from(fontParentCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .filter(([_, count]) => count > 5);

  config.fontPresetClasses = sortedFontParents.map(([className]) => className);

  // Check for SSR variants
  config.preserveSSRVariants = css.includes('.ssr-variant');

  // Find breakpoint classes
  const breakpointMatches = css.match(/\.hidden-[a-z0-9]+/g);
  if (breakpointMatches) {
    config.breakpointClasses = Array.from(new Set(breakpointMatches));
  }

  // Extract CSS tokens
  const tokenMatches = css.match(/--token-[a-f0-9-]+/g);
  if (tokenMatches) {
    config.cssTokens = Array.from(new Set(tokenMatches));
  }

  return config;
}

/**
 * Get the combined wrapper classes needed for a Framer page
 */
export function getFramerWrapperClasses(config: FramerConfig): string {
  const allClasses = new Set<string>();

  config.layoutWrapperClasses.forEach(cls => allClasses.add(cls));
  config.fontPresetClasses.forEach(cls => allClasses.add(cls));

  return Array.from(allClasses).join(' ');
}

/**
 * Transform globals.css for Framer compatibility
 */
export function transformGlobalsCssForFramer(originalCss: string): string {
  // Remove Tailwind base that conflicts with Framer styles
  // Keep only utilities for additional styling
  let css = originalCss;

  // Replace @tailwind base and components with a comment
  css = css.replace(
    /@tailwind base;\s*@tailwind components;/,
    '/* Tailwind base/components removed to preserve Framer CSS layout */'
  );

  // If only @tailwind base, remove it
  css = css.replace(
    /@tailwind base;/,
    '/* Tailwind base removed to preserve Framer CSS layout */'
  );

  return css;
}

/**
 * Post-process component HTML to fix common Framer issues
 */
export function fixFramerComponentIssues(html: string): string {
  let fixed = html;

  // Fix 1: Add overflow:hidden to carousel/slider containers
  // Look for patterns like: <section style={{...}}><div style={{position: 'absolute'
  const carouselPattern = /(<section\s+style=\{\{[^}]*)(}}>[^<]*<div\s+style=\{\{[^}]*position:\s*['"]absolute['"])/g;
  fixed = fixed.replace(carouselPattern, (match, sectionStart, rest) => {
    // Check if overflow is already set
    if (sectionStart.includes('overflow')) {
      return match;
    }
    // Add position: relative and overflow: hidden to section
    return `${sectionStart}, position: 'relative', overflow: 'hidden'${rest}`;
  });

  // Fix 2: Add position:relative to containers with absolute children
  // This is a more general fix
  const absoluteChildPattern = /(<div\s+[^>]*style=\{\{)([^}]*)(}}>[\s\S]*?<(?:div|section|ul)\s+[^>]*style=\{\{[^}]*position:\s*['"]absolute['"])/g;
  fixed = fixed.replace(absoluteChildPattern, (match, divStart, styles, rest) => {
    if (styles.includes('position')) {
      return match;
    }
    return `${divStart}${styles}, position: 'relative'${rest}`;
  });

  return fixed;
}

/**
 * Detect if a component contains a carousel/slider
 */
export function isCarouselComponent(html: string): boolean {
  const carouselIndicators = [
    /transform:\s*['"]?translateX\([^)]+\)/i,
    /class="[^"]*(?:carousel|slider|swiper)[^"]*"/i,
    /data-framer-name="[^"]*(?:carousel|slider|gallery)[^"]*"/i,
    /<ul[^>]*style=\{\{[^}]*transform/i,
    /flexShrink:\s*['"]?0['"]?.*width:\s*['"]?100%['"]?/i,
  ];

  return carouselIndicators.some(pattern => pattern.test(html));
}

/**
 * Apply carousel-specific fixes
 */
export function fixCarouselComponent(componentCode: string): string {
  let fixed = componentCode;

  // Find the outermost wrapper div and ensure it has overflow:hidden and position:relative
  const wrapperPattern = /(<div\s+className=\{className\}\s+style=\{\{)([^}]*)(}})/;
  fixed = fixed.replace(wrapperPattern, (match, start, styles, end) => {
    let newStyles = styles;

    if (!styles.includes('overflow')) {
      newStyles += ", overflow: 'hidden'";
    }
    if (!styles.includes('position')) {
      newStyles += ", position: 'relative'";
    }

    return `${start}${newStyles}${end}`;
  });

  // Find section elements with absolute positioned children
  const sectionPattern = /(<section\s+style=\{\{)([^}]*)(}}>[^]*?position:\s*['"]absolute['"])/g;
  fixed = fixed.replace(sectionPattern, (match, start, styles, rest) => {
    if (styles.includes('position')) {
      return match;
    }
    return `${start}${styles}, position: 'relative'${rest}`;
  });

  return fixed;
}

// Re-export design context and component enhancements
export { FRAMER_DESIGN_CONTEXT, FRAMER_COLORS, FRAMER_GRADIENTS, FRAMER_FONTS } from './framer/context';
export { getAboutSectionStyles, generateAboutSectionTemplate } from './framer/component-enhancements/about-section';
export { getFooterSectionStyles, SOCIAL_ICONS } from './framer/component-enhancements/footer-section';

export default {
  extractFramerConfig,
  getFramerWrapperClasses,
  transformGlobalsCssForFramer,
  fixFramerComponentIssues,
  isCarouselComponent,
  fixCarouselComponent,
};
