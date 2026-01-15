/**
 * Hero Component Code Templates
 *
 * Generates Hero component code with three variant strategies:
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
 * Props extracted from detected hero component
 */
export interface HeroTemplateProps {
  /** Component name (PascalCase) */
  componentName: string;
  /** Detected component data */
  component: DetectedComponent;
  /** Optional custom props to include */
  customProps?: Record<string, string>;
}

/**
 * Parsed hero content structure
 */
interface HeroContent {
  hasHeadline: boolean;
  hasSubheadline: boolean;
  hasPrimaryCTA: boolean;
  hasSecondaryCTA: boolean;
  hasImage: boolean;
  hasBackgroundImage: boolean;
  hasVideo: boolean;
  hasTrustIndicators: boolean;
  hasStats: boolean;
  headline: string;
  subheadline: string;
  primaryCTAText: string;
  secondaryCTAText: string;
  imageAlt: string;
  stats: { value: string; label: string }[];
}

// ====================
// CONTENT PARSER
// ====================

/**
 * Parse HTML snapshot to extract hero-specific content
 *
 * @param htmlSnapshot - Raw HTML string from detected component
 * @returns Structured hero content
 */
function parseHeroContent(htmlSnapshot: string): HeroContent {
  // Detect headline (h1 or prominent heading)
  const hasHeadline = /<h1\b/i.test(htmlSnapshot) ||
    /class="[^"]*(?:headline|title|heading)[^"]*"/i.test(htmlSnapshot);

  // Detect subheadline (h2, p after h1, or description)
  const hasSubheadline = /<h2\b/i.test(htmlSnapshot) ||
    /<p[^>]*class="[^"]*(?:subtitle|description|tagline|lead)[^"]*"/i.test(htmlSnapshot) ||
    (/<h1\b/i.test(htmlSnapshot) && /<p\b/i.test(htmlSnapshot));

  // Detect CTA buttons
  const hasPrimaryCTA = /<(?:button|a)[^>]*class="[^"]*(?:btn|button|cta)[^"]*(?:primary)?[^"]*"/i.test(htmlSnapshot) ||
    /<button\b[^>]*>/i.test(htmlSnapshot);

  const hasSecondaryCTA = /<(?:button|a)[^>]*class="[^"]*(?:secondary|outline|ghost)[^"]*"/i.test(htmlSnapshot) ||
    (htmlSnapshot.match(/<button\b/gi) || []).length > 1 ||
    (htmlSnapshot.match(/<a[^>]*class="[^"]*btn[^"]*"/gi) || []).length > 1;

  // Detect hero image
  const hasImage = /<img[^>]*(?:hero|banner|featured)/i.test(htmlSnapshot) ||
    /class="[^"]*(?:hero-image|hero-img|banner-img)[^"]*"/i.test(htmlSnapshot) ||
    /<img\b[^>]*>/i.test(htmlSnapshot);

  // Detect background image
  const hasBackgroundImage = /background(?:-image)?:\s*url/i.test(htmlSnapshot) ||
    /class="[^"]*bg-[^"]*"/i.test(htmlSnapshot) ||
    /style="[^"]*background[^"]*"/i.test(htmlSnapshot);

  // Detect video
  const hasVideo = /<video\b/i.test(htmlSnapshot) ||
    /<iframe[^>]*(?:youtube|vimeo)/i.test(htmlSnapshot) ||
    /class="[^"]*video[^"]*"/i.test(htmlSnapshot);

  // Detect trust indicators (logos, badges)
  const hasTrustIndicators = /class="[^"]*(?:trust|logos|clients|partners|brands)[^"]*"/i.test(htmlSnapshot) ||
    /(?:trusted|featured|as seen)/i.test(htmlSnapshot);

  // Detect stats
  const hasStats = /class="[^"]*(?:stats|metrics|numbers|counters)[^"]*"/i.test(htmlSnapshot) ||
    /\d+[+%kKmM]?\s*<\/(?:span|div|strong)/i.test(htmlSnapshot);

  // Extract headline text
  const headlineMatch = htmlSnapshot.match(/<h1[^>]*>([^<]+)</i) ||
    htmlSnapshot.match(/<[^>]*class="[^"]*headline[^"]*"[^>]*>([^<]+)</i);
  const headline = headlineMatch
    ? headlineMatch[1].trim()
    : 'Welcome to Our Platform';

  // Extract subheadline text
  const subheadlineMatch = htmlSnapshot.match(/<h2[^>]*>([^<]+)</i) ||
    htmlSnapshot.match(/<p[^>]*class="[^"]*(?:subtitle|description|lead)[^"]*"[^>]*>([^<]+)</i) ||
    htmlSnapshot.match(/<h1[^>]*>[^<]*<\/h1>\s*<p[^>]*>([^<]+)</i);
  const subheadline = subheadlineMatch
    ? subheadlineMatch[1].trim()
    : 'Discover how we can help you achieve your goals with our innovative solutions.';

  // Extract primary CTA text
  const primaryCTAMatch = htmlSnapshot.match(/<(?:button|a)[^>]*class="[^"]*(?:btn|button|cta)[^"]*primary[^"]*"[^>]*>([^<]+)</i) ||
    htmlSnapshot.match(/<button[^>]*>([^<]+)</i) ||
    htmlSnapshot.match(/<a[^>]*class="[^"]*(?:btn|button|cta)[^"]*"[^>]*>([^<]+)</i);
  const primaryCTAText = primaryCTAMatch
    ? primaryCTAMatch[1].trim()
    : 'Get Started';

  // Extract secondary CTA text
  const secondaryCTAMatch = htmlSnapshot.match(/<(?:button|a)[^>]*class="[^"]*(?:secondary|outline|ghost)[^"]*"[^>]*>([^<]+)</i);
  const secondaryCTAText = secondaryCTAMatch
    ? secondaryCTAMatch[1].trim()
    : 'Learn More';

  // Extract image alt text
  const imageAltMatch = htmlSnapshot.match(/<img[^>]*alt="([^"]+)"/i);
  const imageAlt = imageAltMatch
    ? imageAltMatch[1].trim()
    : 'Hero illustration';

  // Extract stats (value + label pairs)
  const stats: { value: string; label: string }[] = [];
  const statsMatches = htmlSnapshot.matchAll(/<(?:div|span)[^>]*>\s*(\d+[+%kKmM]?)\s*<\/(?:div|span)>\s*<(?:div|span|p)[^>]*>([^<]+)</gi);
  for (const match of statsMatches) {
    stats.push({ value: match[1], label: match[2].trim() });
    if (stats.length >= 4) break;
  }

  // Fallback stats if none found
  if (stats.length === 0 && hasStats) {
    stats.push(
      { value: '10K+', label: 'Customers' },
      { value: '99%', label: 'Satisfaction' },
      { value: '24/7', label: 'Support' }
    );
  }

  return {
    hasHeadline,
    hasSubheadline,
    hasPrimaryCTA,
    hasSecondaryCTA,
    hasImage,
    hasBackgroundImage,
    hasVideo,
    hasTrustIndicators,
    hasStats,
    headline,
    subheadline,
    primaryCTAText,
    secondaryCTAText,
    imageAlt,
    stats,
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

// ====================
// PIXEL-PERFECT VARIANT
// ====================

/**
 * Generate pixel-perfect Hero variant
 *
 * Focuses on exact visual reproduction using:
 * - Inline styles for precise control
 * - Exact dimensions from bounding box
 * - Original colors and spacing
 *
 * @param props - Template props
 * @returns Generated TypeScript/React code
 */
export function generatePixelPerfectHero(props: HeroTemplateProps): string {
  const { componentName, component } = props;
  const { styles, boundingBox } = component;
  const content = parseHeroContent(component.htmlSnapshot);

  // Build inline styles from extracted component styles
  const containerStyles: string[] = [];
  const bgColor = extractStyle(styles, 'backgroundColor', '#ffffff');
  const textColor = extractStyle(styles, 'color', '#1f2937');

  if (bgColor !== '#ffffff') {
    containerStyles.push(`backgroundColor: '${bgColor}'`);
  }
  containerStyles.push(`color: '${textColor}'`);

  if (styles.backgroundImage && styles.backgroundImage !== 'none') {
    containerStyles.push(`backgroundImage: '${styles.backgroundImage}'`);
    containerStyles.push(`backgroundSize: 'cover'`);
    containerStyles.push(`backgroundPosition: 'center'`);
  }
  if (styles.padding) {
    containerStyles.push(`padding: '${styles.padding}'`);
  }
  if (styles.minHeight) {
    containerStyles.push(`minHeight: '${styles.minHeight}'`);
  } else if (boundingBox.height > 0) {
    containerStyles.push(`minHeight: '${boundingBox.height}px'`);
  }

  const inlineStylesStr = containerStyles.length > 0
    ? `\n      style={{
        ${containerStyles.join(',\n        ')},
      }}`
    : '';

  // Generate stats section
  const statsCode = content.hasStats && content.stats.length > 0
    ? `
        {/* Stats */}
        <div
          className="stats"
          style={{
            display: 'flex',
            gap: '48px',
            marginTop: '32px',
          }}
        >
          ${content.stats.map((stat) => `<div className="stat" style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '${extractStyle(styles, 'fontSize', '32px')}',
                fontWeight: 'bold',
                color: '${textColor}',
              }}
            >
              ${stat.value}
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '${extractStyle(styles, 'color', '#6b7280')}',
              }}
            >
              ${stat.label}
            </div>
          </div>`).join('\n          ')}
        </div>`
    : '';

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
        className="hero-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '${boundingBox.width > 0 ? boundingBox.width : 1280}px',
          width: '100%',
          margin: '0 auto',
          padding: '${extractStyle(styles, 'padding', '64px 24px')}',
          gap: '48px',
        }}
      >
        {/* Content */}
        <div
          className="hero-content"
          style={{
            flex: '1',
            maxWidth: '${content.hasImage ? '50%' : '100%'}',
          }}
        >
          ${content.hasHeadline ? `<h1
            style={{
              fontSize: '${extractStyle(styles, 'fontSize', '48px')}',
              fontWeight: '${extractStyle(styles, 'fontWeight', 'bold')}',
              lineHeight: '1.2',
              marginBottom: '24px',
              color: '${textColor}',
            }}
          >
            ${content.headline}
          </h1>` : ''}

          ${content.hasSubheadline ? `<p
            style={{
              fontSize: '${extractStyle(styles, 'fontSize', '18px')}',
              lineHeight: '1.6',
              marginBottom: '32px',
              color: '${extractStyle(styles, 'color', '#6b7280')}',
            }}
          >
            ${content.subheadline}
          </p>` : ''}

          {/* CTA Buttons */}
          <div
            className="cta-buttons"
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            ${content.hasPrimaryCTA ? `<button
              type="button"
              style={{
                backgroundColor: '${extractStyle(styles, 'backgroundColor', '#3b82f6')}',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              ${content.primaryCTAText}
            </button>` : ''}
            ${content.hasSecondaryCTA ? `<button
              type="button"
              style={{
                backgroundColor: 'transparent',
                color: '${textColor}',
                padding: '12px 24px',
                borderRadius: '8px',
                border: '1px solid ${extractStyle(styles, 'borderColor', '#e5e7eb')}',
                fontWeight: '600',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              ${content.secondaryCTAText}
            </button>` : ''}
          </div>
${statsCode}
        </div>

        ${content.hasImage ? `{/* Hero Image */}
        <div
          className="hero-image"
          style={{
            flex: '1',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <img
            src="/placeholder-hero.jpg"
            alt="${content.imageAlt}"
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '${extractStyle(styles, 'borderRadius', '12px')}',
            }}
          />
        </div>` : ''}
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
 * Generate semantic Hero variant
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
export function generateSemanticHero(props: HeroTemplateProps): string {
  const { componentName, component } = props;
  const content = parseHeroContent(component.htmlSnapshot);

  // Generate stats section
  const statsCode = content.hasStats && content.stats.length > 0
    ? `
          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-8 md:gap-12">
            ${content.stats.map((stat) => `<div className="text-center">
              <div className="text-2xl font-bold text-gray-900 md:text-3xl">
                ${stat.value}
              </div>
              <div className="text-sm text-gray-600">
                ${stat.label}
              </div>
            </div>`).join('\n            ')}
          </div>`
    : '';

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
        'relative w-full bg-white',
        className
      )}
    >
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          {/* Content */}
          <div className="${content.hasImage ? 'flex-1 text-center lg:text-left' : 'max-w-3xl mx-auto text-center'}">
            ${content.hasHeadline ? `<h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
              ${content.headline}
            </h1>` : ''}

            ${content.hasSubheadline ? `<p className="mt-6 text-lg text-gray-600 md:text-xl">
              ${content.subheadline}
            </p>` : ''}

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mt-8 lg:justify-start">
              ${content.hasPrimaryCTA ? `<a
                href="#"
                className="px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                ${content.primaryCTAText}
              </a>` : ''}
              ${content.hasSecondaryCTA ? `<a
                href="#"
                className="px-6 py-3 text-base font-semibold text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ${content.secondaryCTAText}
              </a>` : ''}
            </div>
${statsCode}
          </div>

          ${content.hasImage ? `{/* Hero Image */}
          <div className="flex-1 flex justify-center">
            <img
              src="/placeholder-hero.jpg"
              alt="${content.imageAlt}"
              className="w-full max-w-lg rounded-xl shadow-lg"
            />
          </div>` : ''}
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
 * Generate modernized Hero variant
 *
 * Focuses on accessibility and performance with:
 * - Full ARIA attributes and roles
 * - Keyboard navigation support
 * - React.memo for performance
 * - Mobile-responsive design
 * - Image optimization hints
 * - Focus management
 *
 * @param props - Template props
 * @returns Generated TypeScript/React code
 */
export function generateModernizedHero(props: HeroTemplateProps): string {
  const { componentName, component } = props;
  const content = parseHeroContent(component.htmlSnapshot);

  // Generate stats section with accessibility
  const statsCode = content.hasStats && content.stats.length > 0
    ? `
            {/* Stats */}
            <div
              className="flex flex-wrap gap-8 mt-10 md:gap-12"
              role="group"
              aria-label="Key statistics"
            >
              ${content.stats.map((stat) => `<div className="text-center">
                <div
                  className="text-2xl font-bold text-gray-900 md:text-3xl"
                  aria-label="${stat.value} ${stat.label}"
                >
                  ${stat.value}
                </div>
                <div className="text-sm text-gray-600" aria-hidden="true">
                  ${stat.label}
                </div>
              </div>`).join('\n              ')}
            </div>`
    : '';

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
 * - ARIA labels for all interactive elements
 * - Proper heading hierarchy
 * - Focus indicators for CTAs
 *
 * Performance:
 * - Memoized to prevent unnecessary re-renders
 * - Image loading optimization hints
 * - Optimized for Core Web Vitals
 */
function ${componentName}Base({ className, id }: ${componentName}Props) {
  const headingId = id ? \`\${id}-heading\` : '${componentName.toLowerCase()}-heading';

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        'relative w-full bg-white overflow-hidden',
        className
      )}
    >
      {/* Optional background overlay for accessibility */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none" aria-hidden="true" />

      <div className="relative container mx-auto px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          {/* Content */}
          <div className="${content.hasImage ? 'flex-1 text-center lg:text-left' : 'max-w-3xl mx-auto text-center'}">
            ${content.hasHeadline ? `<h1
              id={headingId}
              className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
            >
              ${content.headline}
            </h1>` : ''}

            ${content.hasSubheadline ? `<p className="mt-6 text-lg leading-8 text-gray-600 sm:text-xl">
              ${content.subheadline}
            </p>` : ''}

            {/* CTA Buttons */}
            <div
              className="flex flex-wrap justify-center gap-4 mt-10 lg:justify-start"
              role="group"
              aria-label="Call to action"
            >
              ${content.hasPrimaryCTA ? `<a
                href="#"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                ${content.primaryCTAText}
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>` : ''}
              ${content.hasSecondaryCTA ? `<a
                href="#"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                ${content.secondaryCTAText}
              </a>` : ''}
            </div>
${statsCode}
          </div>

          ${content.hasImage ? `{/* Hero Image */}
          <div className="flex-1 flex justify-center lg:justify-end" aria-hidden="true">
            <div className="relative">
              <img
                src="/placeholder-hero.jpg"
                alt="${content.imageAlt}"
                width="600"
                height="400"
                loading="eager"
                decoding="async"
                className="w-full max-w-lg rounded-xl shadow-xl ring-1 ring-gray-900/10"
              />
              {/* Decorative element */}
              <div
                className="absolute -bottom-4 -right-4 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-40 -z-10"
                aria-hidden="true"
              />
            </div>
          </div>` : ''}
        </div>
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
 * Hero template generators mapped by variant strategy
 */
export const heroTemplates = {
  'pixel-perfect': generatePixelPerfectHero,
  'semantic': generateSemanticHero,
  'modernized': generateModernizedHero,
} as const;

/**
 * Get hero template generator by strategy
 *
 * @param strategy - Variant strategy name
 * @returns Template generator function
 */
export function getHeroTemplate(
  strategy: keyof typeof heroTemplates
): (props: HeroTemplateProps) => string {
  return heroTemplates[strategy];
}

/**
 * Generate all hero variants
 *
 * @param props - Template props
 * @returns Object with all variant codes
 */
export function generateAllHeroVariants(props: HeroTemplateProps): {
  pixelPerfect: string;
  semantic: string;
  modernized: string;
} {
  return {
    pixelPerfect: generatePixelPerfectHero(props),
    semantic: generateSemanticHero(props),
    modernized: generateModernizedHero(props),
  };
}

// ====================
// TYPE EXPORTS
// ====================

export type HeroVariantStrategy = keyof typeof heroTemplates;
