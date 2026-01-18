/**
 * Variant Generator Module
 *
 * Generates 3 distinct code variants per detected component with different
 * optimization strategies:
 * - Variant A: Pixel-perfect match prioritizing visual fidelity
 * - Variant B: Semantic match with cleaner code architecture
 * - Variant C: Modernized with accessibility (ARIA) and performance optimizations
 *
 * Each variant produces valid TypeScript/React code with proper props interfaces.
 */

import type { DetectedComponent, ComponentVariant, ComponentType, DesignSystem } from '@/types';
import { randomUUID } from 'crypto';
import { isCarouselComponent, fixCarouselComponent } from '../platform/adapters/framer';
import {
  type BuiltFramerContext,
  getComponentEnhancement,
  getGradientOrbs,
  shouldAddGradientOrbs,
} from '../platform/adapters/framer/context-builder';
import { generateGradientOrbCSS, FRAMER_COLORS } from '../platform/adapters/framer/context';
import {
  getSectionResponsiveClasses,
  type ResponsiveClasses,
} from './responsive-styles';
import type { ViewportStyles } from '../playwright/responsive-capture';
import { generateComponentWithAI, isAIGenerationAvailable } from './ai-generator';

// ====================
// TYPES
// ====================

/**
 * Variant strategy identifier
 */
export type VariantStrategy = 'pixel-perfect' | 'semantic' | 'modernized';

/**
 * Variant configuration for generation
 */
export interface VariantConfig {
  strategy: VariantStrategy;
  name: ComponentVariant['name'];
  description: string;
}

/**
 * Options for variant generation
 */
export interface GenerateVariantsOptions {
  /** Design system tokens to apply to generated code */
  designSystem?: DesignSystem;
  /** Skip specific strategies */
  skipStrategies?: VariantStrategy[];
  /** Component name override */
  componentName?: string;
  /** Framer-specific context with enhancements */
  framerContext?: BuiltFramerContext;
  /** Responsive styles from multi-viewport capture */
  responsiveStyles?: ViewportStyles[];
  /** Enable responsive Tailwind classes (default: true) */
  enableResponsive?: boolean;
  /** Enable AI generation for pixel-perfect variant (requires ANTHROPIC_API_KEY) */
  enableAIGeneration?: boolean;
  /** Path to section screenshot (required for AI generation) */
  screenshotPath?: string;
}

/**
 * Result of variant generation with metadata
 */
export interface VariantGenerationResult {
  variants: ComponentVariant[];
  metadata: {
    componentType: ComponentType;
    strategiesAttempted: VariantStrategy[];
    strategiesSucceeded: VariantStrategy[];
    errors: Array<{ strategy: VariantStrategy; error: string }>;
    generatedAt: string;
  };
}

// ====================
// CONFIGURATION
// ====================

/**
 * Variant configurations with strategy definitions
 */
const VARIANT_CONFIGS: VariantConfig[] = [
  {
    strategy: 'pixel-perfect',
    name: 'Variant A',
    description: 'Pixel-perfect match prioritizing visual fidelity with inline styles and exact measurements',
  },
  {
    strategy: 'semantic',
    name: 'Variant B',
    description: 'Semantic HTML with cleaner code architecture and better separation of concerns',
  },
  {
    strategy: 'modernized',
    name: 'Variant C',
    description: 'Modernized with accessibility (ARIA), performance optimizations, and best practices',
  },
];

/**
 * Default props interface template
 */
const DEFAULT_PROPS_INTERFACE = `interface Props {
  className?: string;
  children?: React.ReactNode;
}`;

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Convert component type to PascalCase component name
 *
 * @param type - ComponentType
 * @returns PascalCase component name
 */
export function componentTypeToName(type: ComponentType): string {
  const names: Record<ComponentType, string> = {
    header: 'Header',
    hero: 'Hero',
    features: 'Features',
    testimonials: 'Testimonials',
    pricing: 'Pricing',
    cta: 'CallToAction',
    footer: 'Footer',
    cards: 'Cards',
    gallery: 'Gallery',
    contact: 'Contact',
    faq: 'FAQ',
    stats: 'Stats',
    team: 'Team',
    logos: 'Logos',
  };
  return names[type];
}

/**
 * Extract color from styles with fallback
 *
 * @param styles - Styles record
 * @param key - Style property key
 * @param fallback - Fallback value
 * @returns Color value or fallback
 */
function extractStyleValue(
  styles: Record<string, string>,
  key: string,
  fallback: string
): string {
  const value = styles[key];
  if (!value || value === 'rgba(0, 0, 0, 0)' || value === 'transparent') {
    return fallback;
  }
  return value;
}

/**
 * Convert CSS property names to camelCase for React inline styles
 *
 * @param cssProperty - CSS property name (kebab-case)
 * @returns camelCase property name
 */
function toCamelCase(cssProperty: string): string {
  return cssProperty.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert HTML to JSX-compatible string
 * Handles attribute conversions and self-closing tags
 *
 * @param html - Raw HTML string
 * @returns JSX-compatible string
 */
function htmlToJsx(html: string): string {
  if (!html || html.trim().length === 0) {
    return '';
  }

  let jsx = html
    // Convert class to className (keep all classes including Framer)
    .replace(/\sclass=/g, ' className=')
    // Convert for to htmlFor
    .replace(/\sfor=/g, ' htmlFor=')
    // Convert style strings to objects (simplified)
    .replace(/style="([^"]*)"/g, (_, styleStr) => {
      const styles = styleStr.split(';')
        .filter((s: string) => s.trim())
        .map((s: string) => {
          const colonIndex = s.indexOf(':');
          if (colonIndex === -1) return '';
          const prop = s.slice(0, colonIndex).trim();
          const val = s.slice(colonIndex + 1).trim();
          if (!prop || !val) return '';
          // Skip Framer-specific custom properties (start with -)
          if (prop.startsWith('-')) return '';
          // Skip corner-shape (not valid CSS)
          if (prop === 'corner-shape') return '';
          // Skip corrupted properties (contain spaces or invalid chars)
          if (prop.includes(' ') || !/^[a-zA-Z-]+$/.test(prop)) return '';
          // Skip backdrop-filter (not well supported in JSX inline styles)
          if (prop === 'backdrop-filter') return '';
          // Skip mix-blend-mode: overlay (noise overlay effect - should be generated separately)
          if (prop === 'mix-blend-mode' && val === 'overlay') return '';
          const camelProp = prop.replace(/-([a-z])/g, (_: string, l: string) => l.toUpperCase());
          // Escape single quotes in values and remove var() tokens
          let escapedVal = val.replace(/'/g, "\\'");
          // Replace CSS variables with their fallback values
          escapedVal = escapedVal.replace(/var\([^,]+,\s*([^)]+)\)/g, '$1');
          return `${camelProp}: '${escapedVal}'`;
        })
        .filter((s: string) => s)
        .join(', ');
      if (!styles) return '';
      return `style={{${styles}}}`;
    })
    // Remove empty style attributes
    .replace(/\sstyle=\{\{\}\}/g, '')
    // Self-close void elements
    .replace(/<(img|br|hr|input|meta|link)([^>]*?)(?<!\/)>/gi, '<$1$2 />')
    // Remove event handlers (onclick, onmouseover, etc.)
    .replace(/\son\w+="[^"]*"/gi, '')
    // Remove srcset (causes issues)
    .replace(/\ssrcset="[^"]*"/gi, '')
    // Convert tabindex to tabIndex
    .replace(/\stabindex=/gi, ' tabIndex=')
    // Convert colspan to colSpan
    .replace(/\scolspan=/gi, ' colSpan=')
    // Convert rowspan to rowSpan
    .replace(/\srowspan=/gi, ' rowSpan=')
    // Remove xmlns attributes
    .replace(/\sxmlns[^=]*="[^"]*"/gi, '')
    // Remove Framer-specific attributes with invalid chars
    .replace(/\s_[a-zA-Z]+="[^"]*"/gi, '')
    // Remove parentsize attribute
    .replace(/\sparentsize="[^"]*"/gi, '')
    // Remove rotation attribute
    .replace(/\srotation="[^"]*"/gi, '')
    // Remove shadows attribute
    .replace(/\sshadows="[^"]*"/gi, '')
    // Clean up data attributes with special chars
    .replace(/data-[a-z-]+="[^"]*"/gi, (match) => {
      // Keep simple data attributes, remove complex ones
      if (match.includes('{') || match.includes('[')) return '';
      return match;
    });

  return jsx;
}

/**
 * Extract and clean content from HTML snapshot
 * Returns actual JSX content instead of placeholders
 *
 * @param htmlSnapshot - Raw HTML string
 * @returns Cleaned JSX content
 */
function extractContent(htmlSnapshot: string): string {
  if (!htmlSnapshot || htmlSnapshot.trim().length === 0) {
    return '{children}';
  }

  // Clean the HTML
  let content = htmlSnapshot
    // Remove script tags
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove style tags
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove SVG content (too complex, replace with placeholder)
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '<div className="svg-placeholder" />');

  // Limit size but don't cut mid-tag
  const maxSize = 15000;
  if (content.length > maxSize) {
    // Find a safe cut point (end of a tag)
    let cutPoint = maxSize;
    const lastCloseTag = content.lastIndexOf('>', cutPoint);
    if (lastCloseTag > maxSize * 0.7) {
      cutPoint = lastCloseTag + 1;
    }
    content = content.slice(0, cutPoint);

    // Try to close any unclosed tags
    const openTags: string[] = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();
      const isSelfClosing = fullTag.endsWith('/>') || ['br', 'hr', 'img', 'input', 'meta', 'link'].includes(tagName);
      const isClosing = fullTag.startsWith('</');

      if (!isSelfClosing) {
        if (isClosing) {
          // Remove from stack if matches
          const lastIndex = openTags.lastIndexOf(tagName);
          if (lastIndex !== -1) {
            openTags.splice(lastIndex, 1);
          }
        } else {
          openTags.push(tagName);
        }
      }
    }

    // Close unclosed tags in reverse order
    for (let i = openTags.length - 1; i >= 0; i--) {
      content += `</${openTags[i]}>`;
    }
  }

  // Convert to JSX
  const jsx = htmlToJsx(content);

  // If empty after cleaning, return children placeholder
  if (!jsx.trim()) {
    return '{children}';
  }

  return jsx;
}

/**
 * Parse and clean HTML snapshot to extract meaningful content
 *
 * @param htmlSnapshot - Raw HTML string
 * @returns Simplified content structure
 */
function parseHtmlContent(htmlSnapshot: string): {
  hasImages: boolean;
  hasLinks: boolean;
  hasForms: boolean;
  hasLists: boolean;
  textContent: string;
  jsxContent: string;
} {
  const hasImages = /<img\s/i.test(htmlSnapshot);
  const hasLinks = /<a\s/i.test(htmlSnapshot);
  const hasForms = /<form\s/i.test(htmlSnapshot) || /<input\s/i.test(htmlSnapshot);
  const hasLists = /<ul\s|<ol\s/i.test(htmlSnapshot);

  // Extract text content by removing tags
  const textContent = htmlSnapshot
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);

  // Extract actual JSX content
  const jsxContent = extractContent(htmlSnapshot);

  return {
    hasImages,
    hasLinks,
    hasForms,
    hasLists,
    textContent,
    jsxContent,
  };
}

// ====================
// STRATEGY GENERATORS
// ====================

/**
 * Generate gradient orbs JSX for dark sections
 */
function generateGradientOrbsJSX(
  framerContext: BuiltFramerContext | undefined,
  componentType: ComponentType
): string {
  if (!framerContext || !shouldAddGradientOrbs(framerContext, componentType)) {
    return '';
  }

  const orbs = getGradientOrbs(framerContext, componentType);
  if (!orbs || orbs.length === 0) {
    return '';
  }

  const orbsJSX = orbs.map((orb, index) => {
    const positionStyles: string[] = [];
    if (orb.position.top) positionStyles.push(`top: '${orb.position.top}'`);
    if (orb.position.bottom) positionStyles.push(`bottom: '${orb.position.bottom}'`);
    if (orb.position.left) positionStyles.push(`left: '${orb.position.left}'`);
    if (orb.position.right) positionStyles.push(`right: '${orb.position.right}'`);

    return `
      {/* Gradient Orb ${index + 1} */}
      <div style={{
        position: 'absolute',
        ${positionStyles.join(',\n        ')},
        width: '${orb.size.width}',
        height: '${orb.size.height}',
        backgroundImage: '${orb.gradient}',
        borderRadius: '50%',
        filter: 'blur(${orb.blur})',
        opacity: ${orb.opacity},
        pointerEvents: 'none'
      }}></div>`;
  }).join('\n');

  return orbsJSX;
}

/**
 * Generate pixel-perfect variant code
 * Focuses on exact visual reproduction using inline styles
 *
 * @param component - Detected component
 * @param componentName - Name for the component
 * @param framerContext - Optional Framer context for enhancements
 * @param enableResponsive - Whether to add responsive Tailwind classes
 * @returns Generated TypeScript/React code
 */
function generatePixelPerfectVariant(
  component: DetectedComponent,
  componentName: string,
  framerContext?: BuiltFramerContext,
  enableResponsive: boolean = true
): string {
  const { styles, boundingBox } = component;
  const content = parseHtmlContent(component.htmlSnapshot);

  // Build inline styles from extracted component styles
  const styleEntries: string[] = [];

  if (styles.backgroundColor) {
    styleEntries.push(`backgroundColor: '${extractStyleValue(styles, 'backgroundColor', '#ffffff')}'`);
  }
  if (styles.color) {
    styleEntries.push(`color: '${extractStyleValue(styles, 'color', '#000000')}'`);
  }
  if (styles.fontSize) {
    styleEntries.push(`fontSize: '${styles.fontSize}'`);
  }
  if (styles.fontFamily) {
    styleEntries.push(`fontFamily: '${styles.fontFamily}'`);
  }
  if (styles.padding) {
    styleEntries.push(`padding: '${styles.padding}'`);
  }
  if (styles.display) {
    styleEntries.push(`display: '${styles.display}'`);
  }
  if (styles.flexDirection) {
    styleEntries.push(`flexDirection: '${styles.flexDirection}'`);
  }
  if (styles.justifyContent) {
    styleEntries.push(`justifyContent: '${styles.justifyContent}'`);
  }
  if (styles.alignItems) {
    styleEntries.push(`alignItems: '${styles.alignItems}'`);
  }
  if (styles.gap) {
    styleEntries.push(`gap: '${styles.gap}'`);
  }
  if (styles.borderRadius) {
    styleEntries.push(`borderRadius: '${styles.borderRadius}'`);
  }
  if (styles.boxShadow && styles.boxShadow !== 'none') {
    styleEntries.push(`boxShadow: '${styles.boxShadow}'`);
  }

  // Add dimensions based on bounding box
  styleEntries.push(`minHeight: '${boundingBox.height}px'`);
  styleEntries.push(`width: '100%'`);

  // Detect carousel/slider components and add overflow:hidden to prevent visual bleed
  const hasCarousel = isCarouselComponent(component.htmlSnapshot);
  if (hasCarousel) {
    styleEntries.push(`overflow: 'hidden'`);
    styleEntries.push(`position: 'relative'`);
  }

  // Check for Framer enhancements (gradient orbs for dark sections)
  const enhancement = framerContext ? getComponentEnhancement(framerContext, component.type) : undefined;
  const hasGradientOrbs = framerContext && shouldAddGradientOrbs(framerContext, component.type);

  // Add position:relative and overflow:hidden for sections with gradient orbs
  if (hasGradientOrbs && !hasCarousel) {
    if (!styleEntries.some(s => s.includes('position'))) {
      styleEntries.push(`position: 'relative'`);
    }
    if (!styleEntries.some(s => s.includes('overflow'))) {
      styleEntries.push(`overflow: 'hidden'`);
    }
  }

  const inlineStyles = styleEntries.length > 0
    ? `style={{
        ${styleEntries.join(',\n        ')}
      }}`
    : '';

  // Use actual JSX content extracted from HTML
  let contentBlock = content.jsxContent || '{children}';

  // If carousel detected, fix section elements that contain absolute positioned children
  if (hasCarousel) {
    // Add position:relative to section elements that have absolute children
    contentBlock = contentBlock.replace(
      /(<section\s+style=\{\{)([^}]*)(}})/g,
      (match: string, start: string, styles: string, end: string) => {
        if (styles.includes('position')) {
          return match;
        }
        return `${start}${styles}, position: 'relative'${end}`;
      }
    );
  }

  // Generate gradient orbs if applicable
  const gradientOrbsJSX = generateGradientOrbsJSX(framerContext, component.type);

  // Wrap content with z-index if we have gradient orbs
  if (gradientOrbsJSX) {
    contentBlock = `
      {/* Content wrapper with z-index above gradient orbs */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        ${contentBlock}
      </div>`;
  }

  // Generate responsive Tailwind classes for common patterns
  const responsiveClasses = enableResponsive
    ? getSectionResponsiveClasses(component.type)
    : '';

  // Combine className with responsive classes
  const classNameExpression = responsiveClasses
    ? `{\`${responsiveClasses} \${className || ''}\`}`
    : '{className}';

  return `'use client';

import React from 'react';

export interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

/**
 * ${componentName} - Pixel-perfect variant
 *
 * Matches original component dimensions and styles exactly.
 * Bounding box: ${boundingBox.width}x${boundingBox.height}px
 * Responsive: Mobile-first with md: and lg: breakpoints
 */
export function ${componentName}({ className, children }: ${componentName}Props) {
  return (
    <div
      className=${classNameExpression}
      ${inlineStyles}
    >${gradientOrbsJSX}
      ${contentBlock}
    </div>
  );
}

export default ${componentName};
`;
}

/**
 * Escape text for use in JSX templates
 */
function escapeJsxText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Generate semantic variant code
 * Focuses on clean code architecture with proper HTML semantics
 * Uses extracted SectionContent when available
 *
 * @param component - Detected component
 * @param componentName - Name for the component
 * @returns Generated TypeScript/React code
 */
function generateSemanticVariant(
  component: DetectedComponent,
  componentName: string
): string {
  const { type, content: sectionContent } = component;

  // Select semantic HTML element based on component type
  const semanticElements: Record<ComponentType, { tag: string; role?: string }> = {
    header: { tag: 'header', role: 'banner' },
    hero: { tag: 'section' },
    features: { tag: 'section' },
    testimonials: { tag: 'section' },
    pricing: { tag: 'section' },
    cta: { tag: 'aside' },
    footer: { tag: 'footer', role: 'contentinfo' },
    cards: { tag: 'section' },
    gallery: { tag: 'section' },
    contact: { tag: 'section' },
    faq: { tag: 'section' },
    stats: { tag: 'section' },
    team: { tag: 'section' },
    logos: { tag: 'section' },
  };

  const { tag, role } = semanticElements[type];
  const roleAttr = role ? ` role="${role}"` : '';

  // Extract actual content from SectionContent
  const headings = sectionContent?.headings || [];
  const paragraphs = sectionContent?.paragraphs || [];
  const buttons = sectionContent?.buttons || [];
  const links = sectionContent?.links || [];

  // Get primary content
  const h1 = headings.find(h => h.level === 1)?.text || '';
  const h2 = headings.find(h => h.level === 2)?.text || headings[0]?.text || '';
  const firstParagraph = paragraphs[0] || '';

  // Use buttons if available, otherwise use links that look like CTAs
  const ctaLinks = links.filter(l =>
    l.text.toLowerCase().includes('start') ||
    l.text.toLowerCase().includes('get') ||
    l.text.toLowerCase().includes('book') ||
    l.text.toLowerCase().includes('try') ||
    l.text.toLowerCase().includes('sign') ||
    l.text.toLowerCase().includes('join') ||
    l.text.length < 30
  ).slice(0, 2);

  const primaryButton = buttons.find(b => b.isPrimary) || buttons[0] ||
    (ctaLinks[0] ? { text: ctaLinks[0].text, href: ctaLinks[0].href, isPrimary: true } : undefined);
  const secondaryButton = buttons.find(b => !b.isPrimary && b !== buttons[0]) || buttons[1] ||
    (ctaLinks[1] ? { text: ctaLinks[1].text, href: ctaLinks[1].href, isPrimary: false } : undefined);

  // Generate semantic structure with ACTUAL content
  let innerContent: string;

  switch (type) {
    case 'header':
      const navLinksHtml = links.slice(0, 5).map(l =>
        `<a href="${l.href}" className="text-gray-600 hover:text-gray-900 transition-colors">${escapeJsxText(l.text)}</a>`
      ).join('\n            ');
      const headerCtaHtml = primaryButton
        ? `<a href="${primaryButton.href || '#'}" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">${escapeJsxText(primaryButton.text)}</a>`
        : '{/* CTA button */}';

      innerContent = `<div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="logo font-bold text-xl">
          ${h1 ? escapeJsxText(h1) : 'Logo'}
        </div>
        <nav className="hidden md:flex items-center gap-6">
          ${navLinksHtml || '{/* Navigation links */}'}
        </nav>
        <div className="actions">
          ${headerCtaHtml}
        </div>
      </div>`;
      break;

    case 'hero':
      const heroButtonsHtml = buttons.slice(0, 2).map((b, i) => {
        const isPrimary = b.isPrimary || i === 0;
        const classes = isPrimary
          ? 'bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'
          : 'border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors';
        return `<a href="${b.href || '#'}" className="${classes}">${escapeJsxText(b.text)}</a>`;
      }).join('\n          ');

      innerContent = `<div className="container mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          ${h1 ? escapeJsxText(h1) : 'Your Headline Here'}
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          ${firstParagraph ? escapeJsxText(firstParagraph) : 'Your description text goes here'}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          ${heroButtonsHtml || '{/* Call to action buttons */}'}
        </div>
      </div>`;
      break;

    case 'features':
      innerContent = `<div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">
          ${h2 ? escapeJsxText(h2) : 'Features'}
        </h2>
        ${firstParagraph ? `<p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">${escapeJsxText(firstParagraph)}</p>` : ''}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {children}
        </div>
      </div>`;
      break;

    case 'testimonials':
      innerContent = `<div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          ${h2 ? escapeJsxText(h2) : 'What Our Customers Say'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {children}
        </div>
      </div>`;
      break;

    case 'pricing':
      innerContent = `<div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">
          ${h2 ? escapeJsxText(h2) : 'Pricing'}
        </h2>
        ${firstParagraph ? `<p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">${escapeJsxText(firstParagraph)}</p>` : ''}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {children}
        </div>
      </div>`;
      break;

    case 'cta':
      const ctaButtonHtml = primaryButton
        ? `<a href="${primaryButton.href || '#'}" className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg hover:bg-blue-700 transition-colors">${escapeJsxText(primaryButton.text)}</a>`
        : '{/* CTA button */}';

      innerContent = `<div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          ${h2 ? escapeJsxText(h2) : 'Ready to Get Started?'}
        </h2>
        ${firstParagraph ? `<p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">${escapeJsxText(firstParagraph)}</p>` : ''}
        <div className="flex justify-center">
          ${ctaButtonHtml}
        </div>
      </div>`;
      break;

    case 'footer':
      const footerLinksHtml = links.slice(0, 8).map(l =>
        `<a href="${l.href}" className="text-gray-400 hover:text-white transition-colors">${escapeJsxText(l.text)}</a>`
      ).join('\n            ');

      innerContent = `<div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="font-bold text-lg mb-4">${h2 ? escapeJsxText(h2) : 'Company'}</div>
            ${firstParagraph ? `<p className="text-gray-400 text-sm">${escapeJsxText(firstParagraph)}</p>` : ''}
          </div>
          <nav className="flex flex-col gap-2">
            ${footerLinksHtml || '{/* Footer links */}'}
          </nav>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>© ${new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>`;
      break;

    default:
      innerContent = `<div className="container mx-auto px-4 py-16">
        ${h2 ? `<h2 className="text-3xl font-bold text-center mb-8">${escapeJsxText(h2)}</h2>` : ''}
        ${firstParagraph ? `<p className="text-gray-600 text-center mb-8">${escapeJsxText(firstParagraph)}</p>` : ''}
        {children}
      </div>`;
  }

  // Content summary for docs
  const contentSummary = sectionContent
    ? `Content: ${headings.length} headings, ${paragraphs.length} paragraphs, ${buttons.length} buttons`
    : 'No content extracted';

  return `'use client';

import React from 'react';

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

/**
 * ${componentName} - Semantic variant
 *
 * Clean code architecture with proper HTML semantics.
 * Uses semantic <${tag}> element${role ? ` with role="${role}"` : ''}.
 * ${contentSummary}
 */
export function ${componentName}({ className, children }: ${componentName}Props) {
  return (
    <${tag}${roleAttr}
      className={\`\${className || ''}\`}
    >
      ${innerContent}
    </${tag}>
  );
}

export default ${componentName};
`;
}

/**
 * Generate modernized variant code
 * Focuses on accessibility, performance, and modern best practices
 * Uses extracted SectionContent when available
 *
 * @param component - Detected component
 * @param componentName - Name for the component
 * @returns Generated TypeScript/React code
 */
function generateModernizedVariant(
  component: DetectedComponent,
  componentName: string
): string {
  const { type, content: sectionContent } = component;

  // Map component types to ARIA landmarks and roles
  const ariaConfig: Record<ComponentType, {
    tag: string;
    role?: string;
    ariaLabel: string;
    landmark?: boolean;
  }> = {
    header: { tag: 'header', role: 'banner', ariaLabel: 'Site header', landmark: true },
    hero: { tag: 'section', ariaLabel: 'Hero section' },
    features: { tag: 'section', ariaLabel: 'Features' },
    testimonials: { tag: 'section', ariaLabel: 'Customer testimonials' },
    pricing: { tag: 'section', ariaLabel: 'Pricing plans' },
    cta: { tag: 'aside', role: 'complementary', ariaLabel: 'Call to action' },
    footer: { tag: 'footer', role: 'contentinfo', ariaLabel: 'Site footer', landmark: true },
    cards: { tag: 'section', ariaLabel: 'Content cards' },
    gallery: { tag: 'section', ariaLabel: 'Image gallery' },
    contact: { tag: 'section', ariaLabel: 'Contact form' },
    faq: { tag: 'section', ariaLabel: 'Frequently asked questions' },
    stats: { tag: 'section', ariaLabel: 'Statistics' },
    team: { tag: 'section', ariaLabel: 'Team members' },
    logos: { tag: 'section', ariaLabel: 'Partner logos' },
  };

  const { tag, role, ariaLabel, landmark } = ariaConfig[type];

  // Extract actual content from SectionContent
  const headings = sectionContent?.headings || [];
  const paragraphs = sectionContent?.paragraphs || [];
  const buttons = sectionContent?.buttons || [];
  const links = sectionContent?.links || [];

  // Get primary content
  const h1 = headings.find(h => h.level === 1)?.text || '';
  const h2 = headings.find(h => h.level === 2)?.text || headings[0]?.text || '';
  const firstParagraph = paragraphs[0] || '';

  // Use buttons if available, otherwise use links that look like CTAs
  const ctaLinks = links.filter(l =>
    l.text.toLowerCase().includes('start') ||
    l.text.toLowerCase().includes('get') ||
    l.text.toLowerCase().includes('book') ||
    l.text.toLowerCase().includes('try') ||
    l.text.toLowerCase().includes('sign') ||
    l.text.toLowerCase().includes('join') ||
    l.text.length < 30
  ).slice(0, 2);

  const primaryButton = buttons.find(b => b.isPrimary) || buttons[0] ||
    (ctaLinks[0] ? { text: ctaLinks[0].text, href: ctaLinks[0].href, isPrimary: true } : undefined);

  // Build ARIA attributes
  const ariaAttrs: string[] = [];
  if (role && !landmark) {
    ariaAttrs.push(`role="${role}"`);
  }
  ariaAttrs.push(`aria-label="${ariaLabel}"`);

  const ariaString = ariaAttrs.join('\n      ');

  // Generate modernized content with accessibility features and actual content
  let innerContent: string;

  switch (type) {
    case 'header':
      const headerNavLinks = links.slice(0, 5).map(l =>
        `<li><a href="${l.href}" className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors">${escapeJsxText(l.text)}</a></li>`
      ).join('\n              ');
      const headerCta = primaryButton
        ? `<a href="${primaryButton.href || '#'}" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">${escapeJsxText(primaryButton.text)}</a>`
        : '{/* CTA button */}';

      innerContent = `<div className="container mx-auto flex items-center justify-between px-4 py-4">
        <a href="/" aria-label="Go to homepage" className="logo font-bold text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
          ${h1 ? escapeJsxText(h1) : 'Logo'}
        </a>
        <nav aria-label="Main navigation" className="hidden md:block">
          <ul role="list" className="flex gap-6">
            ${headerNavLinks || '{/* Navigation items */}'}
          </ul>
        </nav>
        <div className="actions flex gap-4">
          ${headerCta}
        </div>
      </div>`;
      break;

    case 'hero':
      const heroButtons = buttons.slice(0, 2).map((b, i) => {
        const isPrimary = b.isPrimary || i === 0;
        const classes = isPrimary
          ? 'bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors'
          : 'border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors';
        return `<a href="${b.href || '#'}" className="${classes}">${escapeJsxText(b.text)}</a>`;
      }).join('\n          ');

      innerContent = `<div className="container mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          ${h1 ? escapeJsxText(h1) : 'Your Headline Here'}
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          ${firstParagraph ? escapeJsxText(firstParagraph) : 'Your description text goes here'}
        </p>
        <div className="cta-buttons flex flex-wrap justify-center gap-4" role="group" aria-label="Call to action">
          ${heroButtons || '{/* CTA buttons */}'}
        </div>
      </div>`;
      break;

    case 'features':
      innerContent = `<div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">
          ${h2 ? escapeJsxText(h2) : 'Features'}
        </h2>
        ${firstParagraph ? `<p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">${escapeJsxText(firstParagraph)}</p>` : ''}
        <ul role="list" className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {children}
        </ul>
      </div>`;
      break;

    case 'testimonials':
      innerContent = `<div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          ${h2 ? escapeJsxText(h2) : 'What Our Customers Say'}
        </h2>
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          role="region"
          aria-label="Customer testimonials"
        >
          {children}
        </div>
      </div>`;
      break;

    case 'pricing':
      innerContent = `<div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">
          ${h2 ? escapeJsxText(h2) : 'Pricing'}
        </h2>
        ${firstParagraph ? `<p className="text-gray-600 text-center mb-12">${escapeJsxText(firstParagraph)}</p>` : ''}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          role="list"
          aria-label="Pricing tiers"
        >
          {children}
        </div>
      </div>`;
      break;

    case 'cta':
      const ctaBtn = primaryButton
        ? `<a href="${primaryButton.href || '#'}" className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">${escapeJsxText(primaryButton.text)}</a>`
        : '{/* CTA button */}';

      innerContent = `<div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          ${h2 ? escapeJsxText(h2) : 'Ready to Get Started?'}
        </h2>
        ${firstParagraph ? `<p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">${escapeJsxText(firstParagraph)}</p>` : ''}
        <div className="flex justify-center">
          ${ctaBtn}
        </div>
      </div>`;
      break;

    case 'footer':
      const footerLinks = links.slice(0, 8).map(l =>
        `<li><a href="${l.href}" className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors">${escapeJsxText(l.text)}</a></li>`
      ).join('\n              ');

      innerContent = `<div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="font-bold text-lg mb-4">${h2 ? escapeJsxText(h2) : 'Company'}</div>
            ${firstParagraph ? `<p className="text-gray-400 text-sm">${escapeJsxText(firstParagraph)}</p>` : ''}
          </div>
          <nav aria-label="Footer navigation">
            <ul role="list" className="flex flex-col gap-2">
              ${footerLinks || '{/* Footer links */}'}
            </ul>
          </nav>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-500">
          <p>© ${new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>`;
      break;

    case 'faq':
      innerContent = `<div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          ${h2 ? escapeJsxText(h2) : 'Frequently Asked Questions'}
        </h2>
        <dl className="max-w-3xl mx-auto divide-y">
          {children}
        </dl>
      </div>`;
      break;

    default:
      innerContent = `<div className="container mx-auto px-4 py-16">
        ${h2 ? `<h2 className="text-3xl font-bold text-center mb-8">${escapeJsxText(h2)}</h2>` : ''}
        ${firstParagraph ? `<p className="text-gray-600 text-center mb-8">${escapeJsxText(firstParagraph)}</p>` : ''}
        {children}
      </div>`;
  }

  // Content summary for docs
  const contentSummary = sectionContent
    ? `Content: ${headings.length} headings, ${paragraphs.length} paragraphs, ${buttons.length} buttons`
    : 'No content extracted';

  // Generate component with performance optimizations
  return `'use client';

import React, { memo } from 'react';

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
  id?: string;
}

/**
 * ${componentName} - Modernized variant
 *
 * Includes accessibility features (ARIA), performance optimizations,
 * and follows modern best practices.
 *
 * Accessibility:
 * - Proper landmark: <${tag}>${role ? ` with role="${role}"` : ''}
 * - ARIA label: "${ariaLabel}"
 * - Semantic HTML structure
 * - Keyboard navigation support
 *
 * ${contentSummary}
 */
function ${componentName}Base({ className, children, id }: ${componentName}Props) {
  return (
    <${tag}
      id={id}
      ${ariaString}
      className={\`\${className || ''}\`}
    >
      ${innerContent}
    </${tag}>
  );
}

// Memoized for performance - prevents unnecessary re-renders
export const ${componentName} = memo(${componentName}Base);
${componentName}.displayName = '${componentName}';

export default ${componentName};
`;
}

// ====================
// STRATEGY DISPATCH
// ====================

/**
 * Generate code for a specific variant strategy
 *
 * @param component - Detected component
 * @param strategy - Variant strategy to use
 * @param componentName - Name for the component
 * @param framerContext - Optional Framer context for enhancements
 * @param enableResponsive - Whether to add responsive classes
 * @returns Generated code string
 */
function generateVariantCode(
  component: DetectedComponent,
  strategy: VariantStrategy,
  componentName: string,
  framerContext?: BuiltFramerContext,
  enableResponsive: boolean = true
): string {
  switch (strategy) {
    case 'pixel-perfect':
      return generatePixelPerfectVariant(component, componentName, framerContext, enableResponsive);
    case 'semantic':
      return generateSemanticVariant(component, componentName);
    case 'modernized':
      return generateModernizedVariant(component, componentName);
    default:
      throw new Error(`Unknown variant strategy: ${strategy}`);
  }
}

// ====================
// MAIN GENERATION FUNCTION
// ====================

/**
 * Generate 3 variant implementations for a detected component
 *
 * Each variant uses a different optimization strategy:
 * - Variant A (pixel-perfect): Exact visual reproduction (uses AI when enabled)
 * - Variant B (semantic): Clean code with proper HTML semantics
 * - Variant C (modernized): Accessibility and performance focused
 *
 * @param component - The detected component to generate variants for
 * @param options - Optional generation configuration
 * @returns Array of ComponentVariant objects
 *
 * @example
 * ```typescript
 * const variants = generateVariants(detectedComponent);
 * // Returns: [{ id: '...', name: 'Variant A', code: '...', ... }, ...]
 * ```
 */
export function generateVariants(
  component: DetectedComponent,
  options?: GenerateVariantsOptions
): ComponentVariant[] {
  const componentName = options?.componentName ?? componentTypeToName(component.type);
  const skipStrategies = options?.skipStrategies ?? [];
  const framerContext = options?.framerContext;
  const enableResponsive = options?.enableResponsive ?? true;

  const variants: ComponentVariant[] = [];

  for (const config of VARIANT_CONFIGS) {
    // Skip if strategy is excluded
    if (skipStrategies.includes(config.strategy)) {
      continue;
    }

    try {
      const code = generateVariantCode(component, config.strategy, componentName, framerContext, enableResponsive);

      variants.push({
        id: `variant-${randomUUID()}`,
        name: config.name,
        description: config.description,
        code,
        // accuracyScore will be calculated during visual comparison (Phase 5)
        accuracyScore: undefined,
        previewImage: undefined,
      });
    } catch {
      // If a strategy fails, continue with others
      // Error handling will be managed by the component-generator orchestrator
      continue;
    }
  }

  return variants;
}

/**
 * Generate variants with async AI support for pixel-perfect variant
 *
 * When enableAIGeneration is true and a screenshot path is provided,
 * the pixel-perfect variant (Variant A) will be generated using Claude's
 * vision capabilities for better visual accuracy.
 *
 * @param component - The detected component to generate variants for
 * @param options - Generation options including AI settings
 * @returns Promise resolving to array of ComponentVariant objects
 */
export async function generateVariantsAsync(
  component: DetectedComponent,
  options?: GenerateVariantsOptions
): Promise<ComponentVariant[]> {
  const componentName = options?.componentName ?? componentTypeToName(component.type);
  const skipStrategies = options?.skipStrategies ?? [];
  const framerContext = options?.framerContext;
  const enableResponsive = options?.enableResponsive ?? true;
  const enableAIGeneration = options?.enableAIGeneration ?? false;
  const screenshotPath = options?.screenshotPath;
  const designSystem = options?.designSystem;

  const variants: ComponentVariant[] = [];

  for (const config of VARIANT_CONFIGS) {
    // Skip if strategy is excluded
    if (skipStrategies.includes(config.strategy)) {
      continue;
    }

    try {
      let code: string;

      // Use AI generation for pixel-perfect variant if enabled
      if (
        config.strategy === 'pixel-perfect' &&
        enableAIGeneration &&
        screenshotPath &&
        component.content &&
        designSystem &&
        isAIGenerationAvailable()
      ) {
        console.log(`[VariantGenerator] Using AI generation for ${componentName} pixel-perfect variant`);

        const aiResult = await generateComponentWithAI({
          screenshotPath,
          content: component.content,
          sectionType: component.type,
          designSystem,
          componentName,
        });

        if (aiResult.success && aiResult.code) {
          code = aiResult.code;
          console.log(`[VariantGenerator] AI generation successful (${aiResult.tokensUsed} tokens)`);
        } else {
          // Fall back to template-based generation
          console.warn(`[VariantGenerator] AI generation failed: ${aiResult.error}, falling back to template`);
          code = generateVariantCode(component, config.strategy, componentName, framerContext, enableResponsive);
        }
      } else {
        // Use template-based generation
        code = generateVariantCode(component, config.strategy, componentName, framerContext, enableResponsive);
      }

      variants.push({
        id: `variant-${randomUUID()}`,
        name: config.name,
        description: config.description + (
          config.strategy === 'pixel-perfect' && enableAIGeneration
            ? ' (AI-enhanced)'
            : ''
        ),
        code,
        accuracyScore: undefined,
        previewImage: undefined,
      });
    } catch (err) {
      console.error(`[VariantGenerator] Error generating ${config.strategy} variant:`, err);
      continue;
    }
  }

  return variants;
}

/**
 * Generate variants with detailed result metadata
 *
 * Provides additional information about the generation process,
 * including which strategies succeeded or failed.
 *
 * @param component - The detected component to generate variants for
 * @param options - Optional generation configuration
 * @returns VariantGenerationResult with variants and metadata
 *
 * @example
 * ```typescript
 * const result = generateVariantsWithMetadata(detectedComponent);
 * if (result.metadata.errors.length > 0) {
 *   // Handle partial failure
 * }
 * ```
 */
export function generateVariantsWithMetadata(
  component: DetectedComponent,
  options?: GenerateVariantsOptions
): VariantGenerationResult {
  const componentName = options?.componentName ?? componentTypeToName(component.type);
  const skipStrategies = options?.skipStrategies ?? [];
  const framerContext = options?.framerContext;
  const enableResponsive = options?.enableResponsive ?? true;

  const variants: ComponentVariant[] = [];
  const strategiesAttempted: VariantStrategy[] = [];
  const strategiesSucceeded: VariantStrategy[] = [];
  const errors: Array<{ strategy: VariantStrategy; error: string }> = [];

  for (const config of VARIANT_CONFIGS) {
    // Skip if strategy is excluded
    if (skipStrategies.includes(config.strategy)) {
      continue;
    }

    strategiesAttempted.push(config.strategy);

    try {
      const code = generateVariantCode(component, config.strategy, componentName, framerContext, enableResponsive);

      variants.push({
        id: `variant-${randomUUID()}`,
        name: config.name,
        description: config.description,
        code,
        accuracyScore: undefined,
        previewImage: undefined,
      });

      strategiesSucceeded.push(config.strategy);
    } catch (err) {
      errors.push({
        strategy: config.strategy,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    variants,
    metadata: {
      componentType: component.type,
      strategiesAttempted,
      strategiesSucceeded,
      errors,
      generatedAt: new Date().toISOString(),
    },
  };
}

// ====================
// VALIDATION UTILITIES
// ====================

/**
 * Check if generated variants are valid
 *
 * @param variants - Array of generated variants
 * @returns Boolean indicating if variants are valid
 */
export function hasValidVariants(variants: ComponentVariant[]): boolean {
  return variants.length > 0 && variants.every((v) => v.code.length > 0);
}

/**
 * Get variant by name
 *
 * @param variants - Array of variants
 * @param name - Variant name to find
 * @returns Found variant or undefined
 */
export function getVariantByName(
  variants: ComponentVariant[],
  name: ComponentVariant['name']
): ComponentVariant | undefined {
  return variants.find((v) => v.name === name);
}

/**
 * Get variant by strategy
 *
 * @param variants - Array of variants
 * @param strategy - Strategy to find
 * @returns Found variant or undefined
 */
export function getVariantByStrategy(
  variants: ComponentVariant[],
  strategy: VariantStrategy
): ComponentVariant | undefined {
  const strategyToName: Record<VariantStrategy, ComponentVariant['name']> = {
    'pixel-perfect': 'Variant A',
    'semantic': 'Variant B',
    'modernized': 'Variant C',
  };
  return variants.find((v) => v.name === strategyToName[strategy]);
}

/**
 * Get available strategies
 *
 * @returns Array of all available variant strategies
 */
export function getAvailableStrategies(): VariantStrategy[] {
  return VARIANT_CONFIGS.map((c) => c.strategy);
}

/**
 * Get variant config by strategy
 *
 * @param strategy - Variant strategy
 * @returns Variant configuration
 */
export function getVariantConfig(strategy: VariantStrategy): VariantConfig | undefined {
  return VARIANT_CONFIGS.find((c) => c.strategy === strategy);
}
