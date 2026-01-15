/**
 * Features Component Code Templates
 *
 * Generates Features component code with three variant strategies:
 * - Pixel-perfect: Exact visual reproduction with inline styles
 * - Semantic: Clean HTML architecture with proper semantics
 * - Modernized: Accessibility (ARIA), performance optimizations, and best practices
 *
 * Each template produces valid TypeScript/React code ready for use.
 */

import type { DetectedComponent } from '@/types';

// ====================
// TYPES
// ====================

/**
 * Props extracted from detected features component
 */
export interface FeaturesTemplateProps {
  /** Component name (PascalCase) */
  componentName: string;
  /** Detected component data */
  component: DetectedComponent;
  /** Optional custom props to include */
  customProps?: Record<string, string>;
}

/**
 * Individual feature item structure
 */
interface FeatureItem {
  title: string;
  description: string;
  hasIcon: boolean;
}

/**
 * Parsed features content structure
 */
interface FeaturesContent {
  hasSectionTitle: boolean;
  hasSectionSubtitle: boolean;
  hasIcons: boolean;
  hasImages: boolean;
  hasLinks: boolean;
  hasBadges: boolean;
  sectionTitle: string;
  sectionSubtitle: string;
  features: FeatureItem[];
  gridColumns: number;
}

// ====================
// CONTENT PARSER
// ====================

/**
 * Parse HTML snapshot to extract features-specific content
 *
 * @param htmlSnapshot - Raw HTML string from detected component
 * @returns Structured features content
 */
function parseFeaturesContent(htmlSnapshot: string): FeaturesContent {
  // Detect section title (h2 or prominent heading at start)
  const hasSectionTitle = /<h2\b/i.test(htmlSnapshot) ||
    /class="[^"]*(?:section-title|section-heading|features-title)[^"]*"/i.test(htmlSnapshot);

  // Detect section subtitle
  const hasSectionSubtitle = /<h2[^>]*>[\s\S]*?<\/h2>\s*<p\b/i.test(htmlSnapshot) ||
    /class="[^"]*(?:section-subtitle|section-description|features-subtitle)[^"]*"/i.test(htmlSnapshot);

  // Detect icons (svg or icon classes)
  const hasIcons = /<svg\b/i.test(htmlSnapshot) ||
    /class="[^"]*(?:icon|feature-icon)[^"]*"/i.test(htmlSnapshot) ||
    /<i\s+class="[^"]*(?:fa-|icon|bi-)[^"]*"/i.test(htmlSnapshot);

  // Detect images
  const hasImages = /<img[^>]*(?:feature|illustration)/i.test(htmlSnapshot) ||
    /class="[^"]*feature[^"]*img[^"]*"/i.test(htmlSnapshot);

  // Detect links
  const hasLinks = /<a[^>]*class="[^"]*(?:feature-link|learn-more|read-more)[^"]*"/i.test(htmlSnapshot) ||
    /(?:learn more|read more|get started)/i.test(htmlSnapshot);

  // Detect badges
  const hasBadges = /class="[^"]*(?:badge|tag|label|chip)[^"]*"/i.test(htmlSnapshot);

  // Extract section title
  const sectionTitleMatch = htmlSnapshot.match(/<h2[^>]*>([^<]+)</i) ||
    htmlSnapshot.match(/<[^>]*class="[^"]*section-title[^"]*"[^>]*>([^<]+)</i);
  const sectionTitle = sectionTitleMatch
    ? sectionTitleMatch[1].trim()
    : 'Our Features';

  // Extract section subtitle
  const sectionSubtitleMatch = htmlSnapshot.match(/<h2[^>]*>[\s\S]*?<\/h2>\s*<p[^>]*>([^<]+)</i) ||
    htmlSnapshot.match(/<[^>]*class="[^"]*(?:section-subtitle|section-description)[^"]*"[^>]*>([^<]+)</i);
  const sectionSubtitle = sectionSubtitleMatch
    ? sectionSubtitleMatch[1].trim()
    : 'Everything you need to succeed in one powerful platform.';

  // Extract feature items
  const features: FeatureItem[] = [];

  // Try to match feature cards/items
  const featureCardMatches = htmlSnapshot.matchAll(
    /<(?:div|article)[^>]*class="[^"]*(?:feature|card)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article)>/gi
  );

  for (const match of featureCardMatches) {
    const cardHtml = match[1];

    // Extract title from card
    const titleMatch = cardHtml.match(/<h[3-4][^>]*>([^<]+)</i) ||
      cardHtml.match(/<[^>]*class="[^"]*(?:feature-title|card-title)[^"]*"[^>]*>([^<]+)</i);

    // Extract description from card
    const descMatch = cardHtml.match(/<p[^>]*>([^<]+)</i) ||
      cardHtml.match(/<[^>]*class="[^"]*(?:feature-desc|card-text)[^"]*"[^>]*>([^<]+)</i);

    if (titleMatch) {
      features.push({
        title: titleMatch[1].trim(),
        description: descMatch ? descMatch[1].trim() : 'Feature description goes here.',
        hasIcon: /<svg\b/i.test(cardHtml) || /class="[^"]*icon[^"]*"/i.test(cardHtml),
      });
    }

    if (features.length >= 6) break;
  }

  // Fallback: try matching h3/h4 followed by p
  if (features.length === 0) {
    const headingMatches = htmlSnapshot.matchAll(/<h[3-4][^>]*>([^<]+)<\/h[3-4]>\s*<p[^>]*>([^<]+)</gi);
    for (const match of headingMatches) {
      features.push({
        title: match[1].trim(),
        description: match[2].trim(),
        hasIcon: hasIcons,
      });
      if (features.length >= 6) break;
    }
  }

  // Default features if none found
  if (features.length === 0) {
    features.push(
      { title: 'Lightning Fast', description: 'Optimized for speed and performance to deliver the best user experience.', hasIcon: true },
      { title: 'Secure by Default', description: 'Built with security in mind, protecting your data at every level.', hasIcon: true },
      { title: 'Easy Integration', description: 'Seamlessly integrates with your existing tools and workflows.', hasIcon: true },
      { title: 'Scalable', description: 'Grows with your business from startup to enterprise.', hasIcon: true },
      { title: '24/7 Support', description: 'Our dedicated team is always ready to help you succeed.', hasIcon: true },
      { title: 'Analytics', description: 'Deep insights and analytics to drive informed decisions.', hasIcon: true }
    );
  }

  // Determine grid columns based on feature count
  let gridColumns = 3;
  if (features.length <= 2) gridColumns = 2;
  else if (features.length === 4) gridColumns = 2;
  else if (features.length > 4) gridColumns = 3;

  return {
    hasSectionTitle,
    hasSectionSubtitle,
    hasIcons,
    hasImages,
    hasLinks,
    hasBadges,
    sectionTitle,
    sectionSubtitle,
    features,
    gridColumns,
  };
}

/**
 * Extract style value with fallback
 */
function extractStyle(
  styles: Record<string, string>,
  key: string,
  fallback: string
): string {
  const value = styles[key];
  if (!value || value === 'rgba(0, 0, 0, 0)' || value === 'transparent' || value === 'none') {
    return fallback;
  }
  return value;
}

/**
 * Generate a simple icon SVG for features
 */
function getFeatureIconSvg(index: number): string {
  const icons = [
    '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />', // Lightning
    '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />', // Lock
    '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />', // Puzzle
    '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />', // Refresh
    '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />', // Support
    '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />', // Chart
  ];
  return icons[index % icons.length];
}

// ====================
// PIXEL-PERFECT VARIANT
// ====================

/**
 * Generate pixel-perfect Features variant
 *
 * Focuses on exact visual reproduction using:
 * - Inline styles for precise control
 * - Exact dimensions from bounding box
 * - Original colors and spacing
 *
 * @param props - Template props
 * @returns Generated TypeScript/React code
 */
export function generatePixelPerfectFeatures(props: FeaturesTemplateProps): string {
  const { componentName, component } = props;
  const { styles, boundingBox } = component;
  const content = parseFeaturesContent(component.htmlSnapshot);

  // Build inline styles from extracted component styles
  const containerStyles: string[] = [];
  const bgColor = extractStyle(styles, 'backgroundColor', '#ffffff');
  const textColor = extractStyle(styles, 'color', '#1f2937');

  if (bgColor !== '#ffffff') {
    containerStyles.push(`backgroundColor: '${bgColor}'`);
  }
  containerStyles.push(`color: '${textColor}'`);

  if (styles.padding) {
    containerStyles.push(`padding: '${styles.padding}'`);
  }

  const inlineStylesStr = containerStyles.length > 0
    ? `\n      style={{
        ${containerStyles.join(',\n        ')},
      }}`
    : '';

  // Generate feature cards
  const featureCardsCode = content.features
    .map((feature, index) => `        <div
          className="feature-card"
          style={{
            backgroundColor: '${extractStyle(styles, 'backgroundColor', '#f9fafb')}',
            borderRadius: '${extractStyle(styles, 'borderRadius', '12px')}',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          ${feature.hasIcon ? `<div
            className="feature-icon"
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: '${extractStyle(styles, 'backgroundColor', '#3b82f6')}',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#ffffff"
            >
              ${getFeatureIconSvg(index)}
            </svg>
          </div>` : ''}
          <h3
            style={{
              fontSize: '${extractStyle(styles, 'fontSize', '18px')}',
              fontWeight: '600',
              marginBottom: '8px',
              color: '${textColor}',
            }}
          >
            ${feature.title}
          </h3>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.5',
              color: '${extractStyle(styles, 'color', '#6b7280')}',
              margin: '0',
            }}
          >
            ${feature.description}
          </p>
        </div>`)
    .join('\n');

  return `'use client';

import React from 'react';

interface ${componentName}Props {
  className?: string;
}

/**
 * ${componentName} - Pixel-perfect variant
 *
 * Matches original component dimensions and styles exactly.
 * Bounding box: ${boundingBox.width}x${boundingBox.height}px
 */
export function ${componentName}({ className }: ${componentName}Props) {
  return (
    <section
      className={className}${inlineStylesStr}
    >
      <div
        className="features-container"
        style={{
          maxWidth: '${boundingBox.width > 0 ? boundingBox.width : 1280}px',
          width: '100%',
          margin: '0 auto',
          padding: '${extractStyle(styles, 'padding', '64px 24px')}',
        }}
      >
        {/* Section Header */}
        ${content.hasSectionTitle ? `<div
          className="section-header"
          style={{
            textAlign: 'center',
            marginBottom: '48px',
          }}
        >
          <h2
            style={{
              fontSize: '${extractStyle(styles, 'fontSize', '36px')}',
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '${textColor}',
            }}
          >
            ${content.sectionTitle}
          </h2>
          ${content.hasSectionSubtitle ? `<p
            style={{
              fontSize: '${extractStyle(styles, 'fontSize', '18px')}',
              color: '${extractStyle(styles, 'color', '#6b7280')}',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            ${content.sectionSubtitle}
          </p>` : ''}
        </div>` : ''}

        {/* Features Grid */}
        <div
          className="features-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(${content.gridColumns}, 1fr)',
            gap: '24px',
          }}
        >
${featureCardsCode}
        </div>
      </div>
    </section>
  );
}

export default ${componentName};
`;
}

// ====================
// SEMANTIC VARIANT
// ====================

/**
 * Generate semantic Features variant
 *
 * Focuses on clean code architecture with:
 * - Proper HTML5 semantic elements
 * - Tailwind CSS classes for styling
 * - Clean separation of concerns
 * - Accessible markup structure
 *
 * @param props - Template props
 * @returns Generated TypeScript/React code
 */
export function generateSemanticFeatures(props: FeaturesTemplateProps): string {
  const { componentName, component } = props;
  const content = parseFeaturesContent(component.htmlSnapshot);

  // Generate feature cards with Tailwind
  const featureCardsCode = content.features
    .map((feature, index) => `          <div className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
            ${feature.hasIcon ? `<div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                ${getFeatureIconSvg(index)}
              </svg>
            </div>` : ''}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ${feature.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              ${feature.description}
            </p>
          </div>`)
    .join('\n');

  // Determine grid classes based on columns
  const gridClass = content.gridColumns === 2
    ? 'grid-cols-1 md:grid-cols-2'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return `'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ${componentName}Props {
  className?: string;
}

/**
 * ${componentName} - Semantic variant
 *
 * Clean code architecture with proper HTML5 semantics.
 * Uses semantic elements and Tailwind CSS for styling.
 */
export function ${componentName}({ className }: ${componentName}Props) {
  return (
    <section
      className={cn(
        'w-full bg-white py-16 md:py-24',
        className
      )}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        ${content.hasSectionTitle ? `<header className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
            ${content.sectionTitle}
          </h2>
          ${content.hasSectionSubtitle ? `<p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            ${content.sectionSubtitle}
          </p>` : ''}
        </header>` : ''}

        {/* Features Grid */}
        <div className="grid ${gridClass} gap-6">
${featureCardsCode}
        </div>
      </div>
    </section>
  );
}

export default ${componentName};
`;
}

// ====================
// MODERNIZED VARIANT
// ====================

/**
 * Generate modernized Features variant
 *
 * Focuses on accessibility and performance with:
 * - Full ARIA attributes and roles
 * - Proper list semantics for features
 * - React.memo for performance
 * - Mobile-responsive design
 * - Focus indicators
 *
 * @param props - Template props
 * @returns Generated TypeScript/React code
 */
export function generateModernizedFeatures(props: FeaturesTemplateProps): string {
  const { componentName, component } = props;
  const content = parseFeaturesContent(component.htmlSnapshot);

  // Generate feature cards with full accessibility
  const featureCardsCode = content.features
    .map((feature, index) => `            <li className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
              <article>
                ${feature.hasIcon ? `<div
                  className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4"
                  aria-hidden="true"
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    ${getFeatureIconSvg(index)}
                  </svg>
                </div>` : ''}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ${feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  ${feature.description}
                </p>
              </article>
            </li>`)
    .join('\n');

  // Determine grid classes based on columns
  const gridClass = content.gridColumns === 2
    ? 'grid-cols-1 md:grid-cols-2'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return `'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface ${componentName}Props {
  className?: string;
  id?: string;
}

/**
 * ${componentName} - Modernized variant
 *
 * Includes accessibility features (ARIA), performance optimizations,
 * and follows modern best practices.
 *
 * Accessibility:
 * - Proper landmark: <section> with aria-labelledby
 * - Features as list for screen readers
 * - ARIA labels for decorative elements
 * - Proper heading hierarchy
 *
 * Performance:
 * - Memoized to prevent unnecessary re-renders
 * - Optimized for Core Web Vitals
 */
function ${componentName}Base({ className, id }: ${componentName}Props) {
  const headingId = id ? \`\${id}-heading\` : '${componentName.toLowerCase()}-heading';

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        'w-full bg-white py-16 md:py-24',
        className
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        ${content.hasSectionTitle ? `<header className="text-center mb-12">
          <h2
            id={headingId}
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            ${content.sectionTitle}
          </h2>
          ${content.hasSectionSubtitle ? `<p className="mt-4 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            ${content.sectionSubtitle}
          </p>` : ''}
        </header>` : ''}

        {/* Features Grid */}
        <ul
          role="list"
          className="grid ${gridClass} gap-6"
          aria-label="Features"
        >
${featureCardsCode}
        </ul>
      </div>
    </section>
  );
}

// Memoized for performance - prevents unnecessary re-renders
export const ${componentName} = memo(${componentName}Base);
${componentName}.displayName = '${componentName}';

export default ${componentName};
`;
}

// ====================
// TEMPLATE REGISTRY
// ====================

/**
 * Features template generators mapped by variant strategy
 */
export const featuresTemplates = {
  'pixel-perfect': generatePixelPerfectFeatures,
  'semantic': generateSemanticFeatures,
  'modernized': generateModernizedFeatures,
} as const;

/**
 * Get features template generator by strategy
 *
 * @param strategy - Variant strategy name
 * @returns Template generator function
 */
export function getFeaturesTemplate(
  strategy: keyof typeof featuresTemplates
): (props: FeaturesTemplateProps) => string {
  return featuresTemplates[strategy];
}

/**
 * Generate all features variants
 *
 * @param props - Template props
 * @returns Object with all variant codes
 */
export function generateAllFeaturesVariants(props: FeaturesTemplateProps): {
  pixelPerfect: string;
  semantic: string;
  modernized: string;
} {
  return {
    pixelPerfect: generatePixelPerfectFeatures(props),
    semantic: generateSemanticFeatures(props),
    modernized: generateModernizedFeatures(props),
  };
}

// ====================
// TYPE EXPORTS
// ====================

export type FeaturesVariantStrategy = keyof typeof featuresTemplates;
