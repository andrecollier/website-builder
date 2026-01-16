/**
 * Testimonials Component Code Templates
 *
 * Generates Testimonials component code with three variant strategies:
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
 * Props extracted from detected testimonials component
 */
export interface TestimonialsTemplateProps {
  /** Component name (PascalCase) */
  componentName: string;
  /** Detected component data */
  component: DetectedComponent;
  /** Optional custom props to include */
  customProps?: Record<string, string>;
}

/**
 * Individual testimonial item structure
 */
interface TestimonialItem {
  quote: string;
  authorName: string;
  authorRole: string;
  authorCompany: string;
  hasAvatar: boolean;
  hasRating: boolean;
  rating: number;
}

/**
 * Parsed testimonials content structure
 */
interface TestimonialsContent {
  hasSectionTitle: boolean;
  hasSectionSubtitle: boolean;
  hasAvatars: boolean;
  hasRatings: boolean;
  hasCompanyLogos: boolean;
  isCarousel: boolean;
  sectionTitle: string;
  sectionSubtitle: string;
  testimonials: TestimonialItem[];
  gridColumns: number;
}

// ====================
// CONTENT PARSER
// ====================

/**
 * Parse HTML snapshot to extract testimonials-specific content
 *
 * @param htmlSnapshot - Raw HTML string from detected component
 * @returns Structured testimonials content
 */
function parseTestimonialsContent(htmlSnapshot: string): TestimonialsContent {
  // Detect section title
  const hasSectionTitle = /<h2\b/i.test(htmlSnapshot) ||
    /class="[^"]*(?:section-title|testimonials-title)[^"]*"/i.test(htmlSnapshot);

  // Detect section subtitle
  const hasSectionSubtitle = /<h2[^>]*>[\s\S]*?<\/h2>\s*<p\b/i.test(htmlSnapshot) ||
    /class="[^"]*(?:section-subtitle|testimonials-subtitle)[^"]*"/i.test(htmlSnapshot);

  // Detect avatars
  const hasAvatars = /<img[^>]*(?:avatar|profile|author)/i.test(htmlSnapshot) ||
    /class="[^"]*(?:avatar|profile-img|author-img)[^"]*"/i.test(htmlSnapshot);

  // Detect ratings (stars)
  const hasRatings = /class="[^"]*(?:rating|stars)[^"]*"/i.test(htmlSnapshot) ||
    /★|⭐|star/i.test(htmlSnapshot) ||
    /<svg[^>]*(?:star)/i.test(htmlSnapshot);

  // Detect company logos
  const hasCompanyLogos = /<img[^>]*(?:logo|company)/i.test(htmlSnapshot) ||
    /class="[^"]*(?:company-logo|client-logo)[^"]*"/i.test(htmlSnapshot);

  // Detect carousel indicators
  const isCarousel = /class="[^"]*(?:carousel|slider|swiper)[^"]*"/i.test(htmlSnapshot) ||
    /(?:prev|next|dot|indicator)/i.test(htmlSnapshot);

  // Extract section title
  const sectionTitleMatch = htmlSnapshot.match(/<h2[^>]*>([^<]+)</i) ||
    htmlSnapshot.match(/<[^>]*class="[^"]*section-title[^"]*"[^>]*>([^<]+)</i);
  const sectionTitle = sectionTitleMatch
    ? sectionTitleMatch[1].trim()
    : 'What Our Customers Say';

  // Extract section subtitle
  const sectionSubtitleMatch = htmlSnapshot.match(/<h2[^>]*>[\s\S]*?<\/h2>\s*<p[^>]*>([^<]+)</i) ||
    htmlSnapshot.match(/<[^>]*class="[^"]*(?:section-subtitle|section-description)[^"]*"[^>]*>([^<]+)</i);
  const sectionSubtitle = sectionSubtitleMatch
    ? sectionSubtitleMatch[1].trim()
    : 'Trusted by thousands of satisfied customers worldwide.';

  // Extract testimonial items
  const testimonials: TestimonialItem[] = [];

  // Try to match testimonial cards
  const testimonialMatches = Array.from(htmlSnapshot.matchAll(
    /<(?:div|article|blockquote)[^>]*class="[^"]*(?:testimonial|review|quote)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article|blockquote)>/gi
  ));

  for (const match of testimonialMatches) {
    const cardHtml = match[1];

    // Extract quote
    const quoteMatch = cardHtml.match(/<blockquote[^>]*>([^<]+)</i) ||
      cardHtml.match(/<p[^>]*class="[^"]*(?:quote|testimonial-text)[^"]*"[^>]*>([^<]+)</i) ||
      cardHtml.match(/<p[^>]*>([^<]{20,})</i);

    // Extract author name
    const nameMatch = cardHtml.match(/<[^>]*class="[^"]*(?:author-name|name|reviewer)[^"]*"[^>]*>([^<]+)</i) ||
      cardHtml.match(/<strong[^>]*>([^<]+)</i) ||
      cardHtml.match(/<cite[^>]*>([^<]+)</i);

    // Extract author role/title
    const roleMatch = cardHtml.match(/<[^>]*class="[^"]*(?:author-role|title|position)[^"]*"[^>]*>([^<]+)</i) ||
      cardHtml.match(/<span[^>]*>([^<]*(?:CEO|CTO|Manager|Director|Engineer|Designer|Founder)[^<]*)</i);

    // Extract company
    const companyMatch = cardHtml.match(/<[^>]*class="[^"]*(?:company|organization)[^"]*"[^>]*>([^<]+)</i) ||
      cardHtml.match(/(?:at|@)\s*([A-Z][a-zA-Z0-9\s]+)/);

    // Count stars for rating
    const starCount = (cardHtml.match(/★|⭐|star-filled/gi) || []).length;

    if (quoteMatch || nameMatch) {
      testimonials.push({
        quote: quoteMatch
          ? quoteMatch[1].trim()
          : 'This product has transformed our workflow completely.',
        authorName: nameMatch ? nameMatch[1].trim() : 'Jane Smith',
        authorRole: roleMatch ? roleMatch[1].trim() : 'Product Manager',
        authorCompany: companyMatch ? companyMatch[1].trim() : 'Acme Inc',
        hasAvatar: /<img\b/i.test(cardHtml),
        hasRating: starCount > 0 || /rating|star/i.test(cardHtml),
        rating: starCount > 0 ? Math.min(starCount, 5) : 5,
      });
    }

    if (testimonials.length >= 6) break;
  }

  // Fallback: try matching blockquotes
  if (testimonials.length === 0) {
    const blockquoteMatches = Array.from(htmlSnapshot.matchAll(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi));
    for (const match of blockquoteMatches) {
      const quoteHtml = match[1];
      const textMatch = quoteHtml.match(/<p[^>]*>([^<]+)</i) ||
        quoteHtml.match(/([^<]+)/);

      if (textMatch && textMatch[1].trim().length > 20) {
        testimonials.push({
          quote: textMatch[1].trim(),
          authorName: 'Customer',
          authorRole: 'Verified Buyer',
          authorCompany: '',
          hasAvatar: hasAvatars,
          hasRating: hasRatings,
          rating: 5,
        });
      }

      if (testimonials.length >= 3) break;
    }
  }

  // Default testimonials if none found
  if (testimonials.length === 0) {
    testimonials.push(
      {
        quote: 'This platform has completely transformed how we work. The efficiency gains have been remarkable.',
        authorName: 'Sarah Johnson',
        authorRole: 'CEO',
        authorCompany: 'TechStart Inc',
        hasAvatar: true,
        hasRating: true,
        rating: 5,
      },
      {
        quote: 'Outstanding support and an intuitive interface. Our team was up and running within hours.',
        authorName: 'Michael Chen',
        authorRole: 'Engineering Manager',
        authorCompany: 'CloudFlow',
        hasAvatar: true,
        hasRating: true,
        rating: 5,
      },
      {
        quote: 'The best investment we have made this year. ROI exceeded our expectations within the first month.',
        authorName: 'Emily Rodriguez',
        authorRole: 'Operations Director',
        authorCompany: 'GrowthLabs',
        hasAvatar: true,
        hasRating: true,
        rating: 5,
      }
    );
  }

  // Determine grid columns based on testimonial count
  let gridColumns = 3;
  if (testimonials.length <= 2) gridColumns = testimonials.length;
  else if (testimonials.length === 4) gridColumns = 2;

  return {
    hasSectionTitle,
    hasSectionSubtitle,
    hasAvatars,
    hasRatings,
    hasCompanyLogos,
    isCarousel,
    sectionTitle,
    sectionSubtitle,
    testimonials,
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
 * Generate star rating SVG string
 */
function generateStarsSvg(rating: number, filled: boolean): string {
  return `<svg
              className="w-5 h-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>`;
}

// ====================
// PIXEL-PERFECT VARIANT
// ====================

/**
 * Generate pixel-perfect Testimonials variant
 *
 * Focuses on exact visual reproduction using:
 * - Inline styles for precise control
 * - Exact dimensions from bounding box
 * - Original colors and spacing
 *
 * @param props - Template props
 * @returns Generated TypeScript/React code
 */
export function generatePixelPerfectTestimonials(props: TestimonialsTemplateProps): string {
  const { componentName, component } = props;
  const { styles, boundingBox } = component;
  const content = parseTestimonialsContent(component.htmlSnapshot);

  // Build inline styles from extracted component styles
  const containerStyles: string[] = [];
  const bgColor = extractStyle(styles, 'backgroundColor', '#f9fafb');
  const textColor = extractStyle(styles, 'color', '#1f2937');

  containerStyles.push(`backgroundColor: '${bgColor}'`);
  containerStyles.push(`color: '${textColor}'`);

  if (styles.padding) {
    containerStyles.push(`padding: '${styles.padding}'`);
  }

  const inlineStylesStr = `\n      style={{
        ${containerStyles.join(',\n        ')},
      }}`;

  // Generate testimonial cards
  const testimonialCardsCode = content.testimonials
    .map((testimonial, index) => `        <div
          className="testimonial-card"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '${extractStyle(styles, 'borderRadius', '12px')}',
            padding: '24px',
            boxShadow: '${extractStyle(styles, 'boxShadow', '0 1px 3px rgba(0,0,0,0.1)')}',
          }}
        >
          ${testimonial.hasRating ? `<div
            className="rating"
            style={{
              display: 'flex',
              gap: '4px',
              marginBottom: '16px',
            }}
          >
            ${Array.from({ length: 5 }, (_, i) => `<svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="${i < testimonial.rating ? '#fbbf24' : '#d1d5db'}"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>`).join('\n            ')}
          </div>` : ''}
          <blockquote
            style={{
              fontSize: '${extractStyle(styles, 'fontSize', '16px')}',
              lineHeight: '1.6',
              color: '${extractStyle(styles, 'color', '#374151')}',
              marginBottom: '16px',
              fontStyle: 'italic',
            }}
          >
            "${testimonial.quote}"
          </blockquote>
          <div
            className="author"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            ${testimonial.hasAvatar ? `<div
              className="avatar"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '${extractStyle(styles, 'backgroundColor', '#e5e7eb')}',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '${extractStyle(styles, 'color', '#6b7280')}',
              }}
            >
              ${testimonial.authorName.charAt(0)}
            </div>` : ''}
            <div className="author-info">
              <div
                style={{
                  fontWeight: '600',
                  color: '${textColor}',
                }}
              >
                ${testimonial.authorName}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: '${extractStyle(styles, 'color', '#6b7280')}',
                }}
              >
                ${testimonial.authorRole}${testimonial.authorCompany ? ` at ${testimonial.authorCompany}` : ''}
              </div>
            </div>
          </div>
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
        className="testimonials-container"
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

        {/* Testimonials Grid */}
        <div
          className="testimonials-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(${content.gridColumns}, 1fr)',
            gap: '24px',
          }}
        >
${testimonialCardsCode}
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
 * Generate semantic Testimonials variant
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
export function generateSemanticTestimonials(props: TestimonialsTemplateProps): string {
  const { componentName, component } = props;
  const content = parseTestimonialsContent(component.htmlSnapshot);

  // Generate testimonial cards with Tailwind
  const testimonialCardsCode = content.testimonials
    .map((testimonial) => `          <article className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            ${testimonial.hasRating ? `<div className="flex gap-1 mb-4">
              ${Array.from({ length: 5 }, (_, i) => `<svg
                className="w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>`).join('\n              ')}
            </div>` : ''}
            <blockquote className="text-gray-700 leading-relaxed mb-4 italic">
              "${testimonial.quote}"
            </blockquote>
            <footer className="flex items-center gap-3">
              ${testimonial.hasAvatar ? `<div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600">
                ${testimonial.authorName.charAt(0)}
              </div>` : ''}
              <div>
                <cite className="not-italic font-semibold text-gray-900">
                  ${testimonial.authorName}
                </cite>
                <p className="text-sm text-gray-600">
                  ${testimonial.authorRole}${testimonial.authorCompany ? ` at ${testimonial.authorCompany}` : ''}
                </p>
              </div>
            </footer>
          </article>`)
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
        'w-full bg-gray-50 py-16 md:py-24',
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

        {/* Testimonials Grid */}
        <div className="grid ${gridClass} gap-6">
${testimonialCardsCode}
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
 * Generate modernized Testimonials variant
 *
 * Focuses on accessibility and performance with:
 * - Full ARIA attributes and roles
 * - Proper figure/figcaption for testimonials
 * - React.memo for performance
 * - Mobile-responsive design
 * - Screen reader support for ratings
 *
 * @param props - Template props
 * @returns Generated TypeScript/React code
 */
export function generateModernizedTestimonials(props: TestimonialsTemplateProps): string {
  const { componentName, component } = props;
  const content = parseTestimonialsContent(component.htmlSnapshot);

  // Generate testimonial cards with full accessibility
  const testimonialCardsCode = content.testimonials
    .map((testimonial) => `            <li>
              <figure className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                ${testimonial.hasRating ? `<div
                  className="flex gap-1 mb-4"
                  role="img"
                  aria-label="${testimonial.rating} out of 5 stars"
                >
                  ${Array.from({ length: 5 }, (_, i) => `<svg
                    className="w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>`).join('\n                  ')}
                </div>` : ''}
                <blockquote className="text-gray-700 leading-relaxed mb-4 italic flex-grow">
                  <p>"${testimonial.quote}"</p>
                </blockquote>
                <figcaption className="flex items-center gap-3 mt-auto">
                  ${testimonial.hasAvatar ? `<div
                    className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600"
                    aria-hidden="true"
                  >
                    ${testimonial.authorName.charAt(0)}
                  </div>` : ''}
                  <div>
                    <cite className="not-italic font-semibold text-gray-900">
                      ${testimonial.authorName}
                    </cite>
                    <p className="text-sm text-gray-600">
                      <span className="sr-only">Role: </span>${testimonial.authorRole}${testimonial.authorCompany ? `<span className="sr-only">, Company: </span> at ${testimonial.authorCompany}` : ''}
                    </p>
                  </div>
                </figcaption>
              </figure>
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
 * - Figure/figcaption for testimonial semantics
 * - Screen reader support for star ratings
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
        'w-full bg-gray-50 py-16 md:py-24',
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

        {/* Testimonials Grid */}
        <ul
          role="list"
          className="grid ${gridClass} gap-6"
          aria-label="Customer testimonials"
        >
${testimonialCardsCode}
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
 * Testimonials template generators mapped by variant strategy
 */
export const testimonialsTemplates = {
  'pixel-perfect': generatePixelPerfectTestimonials,
  'semantic': generateSemanticTestimonials,
  'modernized': generateModernizedTestimonials,
} as const;

/**
 * Get testimonials template generator by strategy
 *
 * @param strategy - Variant strategy name
 * @returns Template generator function
 */
export function getTestimonialsTemplate(
  strategy: keyof typeof testimonialsTemplates
): (props: TestimonialsTemplateProps) => string {
  return testimonialsTemplates[strategy];
}

/**
 * Generate all testimonials variants
 *
 * @param props - Template props
 * @returns Object with all variant codes
 */
export function generateAllTestimonialsVariants(props: TestimonialsTemplateProps): {
  pixelPerfect: string;
  semantic: string;
  modernized: string;
} {
  return {
    pixelPerfect: generatePixelPerfectTestimonials(props),
    semantic: generateSemanticTestimonials(props),
    modernized: generateModernizedTestimonials(props),
  };
}

// ====================
// TYPE EXPORTS
// ====================

export type TestimonialsVariantStrategy = keyof typeof testimonialsTemplates;
