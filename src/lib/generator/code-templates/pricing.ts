/**
 * Pricing Component Code Templates
 *
 * Generates Pricing component code with three variant strategies:
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
 * Props extracted from detected pricing component
 */
export interface PricingTemplateProps {
  /** Component name (PascalCase) */
  componentName: string;
  /** Detected component data */
  component: DetectedComponent;
  /** Optional custom props to include */
  customProps?: Record<string, string>;
}

/**
 * Pricing tier structure
 */
interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  ctaText: string;
  isPopular: boolean;
}

/**
 * Parsed pricing content structure
 */
interface PricingContent {
  hasHeadline: boolean;
  hasSubheadline: boolean;
  hasBillingToggle: boolean;
  hasPopularBadge: boolean;
  hasFeatureComparison: boolean;
  headline: string;
  subheadline: string;
  tiers: PricingTier[];
}

// ====================
// CONTENT PARSER
// ====================

/**
 * Parse HTML snapshot to extract pricing-specific content
 *
 * @param htmlSnapshot - Raw HTML string from detected component
 * @returns Structured pricing content
 */
function parsePricingContent(htmlSnapshot: string): PricingContent {
  // Detect headline
  const hasHeadline = /<h[12]\b/i.test(htmlSnapshot) ||
    /class="[^"]*(?:headline|title|heading)[^"]*"/i.test(htmlSnapshot);

  // Detect subheadline
  const hasSubheadline = /<p[^>]*class="[^"]*(?:subtitle|description|lead)[^"]*"/i.test(htmlSnapshot) ||
    (/<h[12]\b/i.test(htmlSnapshot) && /<p\b/i.test(htmlSnapshot));

  // Detect billing toggle (monthly/annual)
  const hasBillingToggle = /(?:monthly|annual|yearly|billing|toggle)/i.test(htmlSnapshot) ||
    /<input[^>]*type=["']?(?:radio|checkbox)["']?/i.test(htmlSnapshot) ||
    /class="[^"]*(?:toggle|switch)[^"]*"/i.test(htmlSnapshot);

  // Detect popular badge
  const hasPopularBadge = /(?:popular|recommended|best|featured)/i.test(htmlSnapshot) ||
    /class="[^"]*(?:badge|tag|label)[^"]*"/i.test(htmlSnapshot);

  // Detect feature comparison table
  const hasFeatureComparison = /<table\b/i.test(htmlSnapshot) ||
    /class="[^"]*(?:comparison|feature-table)[^"]*"/i.test(htmlSnapshot);

  // Extract headline text
  const headlineMatch = htmlSnapshot.match(/<h[12][^>]*>([^<]+)</i) ||
    htmlSnapshot.match(/<[^>]*class="[^"]*headline[^"]*"[^>]*>([^<]+)</i);
  const headline = headlineMatch
    ? headlineMatch[1].trim()
    : 'Simple, transparent pricing';

  // Extract subheadline text
  const subheadlineMatch = htmlSnapshot.match(/<p[^>]*class="[^"]*(?:subtitle|description|lead)[^"]*"[^>]*>([^<]+)</i) ||
    htmlSnapshot.match(/<h[12][^>]*>[^<]*<\/h[12]>\s*<p[^>]*>([^<]+)</i);
  const subheadline = subheadlineMatch
    ? subheadlineMatch[1].trim()
    : 'Choose the plan that works best for you and your team.';

  // Extract pricing tiers
  const tiers: PricingTier[] = [];

  // Try to find pricing cards/tiers
  const tierMatches = htmlSnapshot.matchAll(/<(?:div|article)[^>]*class="[^"]*(?:pricing|plan|tier|card)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article)>/gi);

  for (const match of tierMatches) {
    const tierHtml = match[1];

    // Extract tier name
    const nameMatch = tierHtml.match(/<h[34][^>]*>([^<]+)</i) ||
      tierHtml.match(/<[^>]*class="[^"]*(?:plan-name|tier-name|title)[^"]*"[^>]*>([^<]+)</i);
    const name = nameMatch ? nameMatch[1].trim() : 'Plan';

    // Extract price
    const priceMatch = tierHtml.match(/\$(\d+(?:\.\d{2})?)/i) ||
      tierHtml.match(/(\d+(?:\.\d{2})?)\s*(?:\/|per)/i);
    const price = priceMatch ? `$${priceMatch[1]}` : '$29';

    // Extract period
    const periodMatch = tierHtml.match(/(?:\/|per)\s*(\w+)/i);
    const period = periodMatch ? periodMatch[1] : 'month';

    // Extract description
    const descMatch = tierHtml.match(/<p[^>]*>([^<]{10,100})</i);
    const description = descMatch ? descMatch[1].trim() : 'Perfect for getting started';

    // Extract features
    const features: string[] = [];
    const featureMatches = tierHtml.matchAll(/<li[^>]*>([^<]+)</gi);
    for (const fMatch of featureMatches) {
      const feature = fMatch[1].trim();
      if (feature && feature.length < 100) {
        features.push(feature);
      }
      if (features.length >= 6) break;
    }

    // Extract CTA text
    const ctaMatch = tierHtml.match(/<(?:button|a)[^>]*>([^<]+)</i);
    const ctaText = ctaMatch ? ctaMatch[1].trim() : 'Get Started';

    // Check if popular
    const isPopular = /(?:popular|recommended|best|featured)/i.test(tierHtml);

    tiers.push({
      name,
      price,
      period,
      description,
      features: features.length > 0 ? features : [
        'Core features included',
        'Email support',
        'API access',
        '1GB storage',
      ],
      ctaText,
      isPopular,
    });

    if (tiers.length >= 4) break;
  }

  // Fallback tiers if none found
  if (tiers.length === 0) {
    tiers.push(
      {
        name: 'Starter',
        price: '$9',
        period: 'month',
        description: 'Perfect for individuals and small projects',
        features: ['Up to 3 projects', 'Basic analytics', 'Email support', '1GB storage'],
        ctaText: 'Get Started',
        isPopular: false,
      },
      {
        name: 'Pro',
        price: '$29',
        period: 'month',
        description: 'Best for growing teams and businesses',
        features: ['Unlimited projects', 'Advanced analytics', 'Priority support', '10GB storage', 'Team collaboration', 'Custom integrations'],
        ctaText: 'Start Free Trial',
        isPopular: true,
      },
      {
        name: 'Enterprise',
        price: '$99',
        period: 'month',
        description: 'For large organizations with custom needs',
        features: ['Everything in Pro', 'Dedicated support', 'Unlimited storage', 'SSO & SAML', 'Custom contracts'],
        ctaText: 'Contact Sales',
        isPopular: false,
      }
    );
  }

  return {
    hasHeadline,
    hasSubheadline,
    hasBillingToggle,
    hasPopularBadge,
    hasFeatureComparison,
    headline,
    subheadline,
    tiers,
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
 * Generate pixel-perfect Pricing variant
 *
 * Focuses on exact visual reproduction using:
 * - Inline styles for precise control
 * - Exact dimensions from bounding box
 * - Original colors and spacing
 *
 * @param props - Template props
 * @returns Generated TypeScript/React code
 */
export function generatePixelPerfectPricing(props: PricingTemplateProps): string {
  const { componentName, component } = props;
  const { styles, boundingBox } = component;
  const content = parsePricingContent(component.htmlSnapshot);

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

  // Generate pricing tier cards
  const tiersCode = content.tiers
    .map((tier, index) => `        <div
          className="pricing-tier"
          style={{
            flex: '1',
            minWidth: '280px',
            maxWidth: '380px',
            padding: '32px',
            backgroundColor: ${tier.isPopular ? "'#f0f9ff'" : "'#ffffff'"},
            borderRadius: '${extractStyle(styles, 'borderRadius', '12px')}',
            border: ${tier.isPopular ? "'2px solid #3b82f6'" : "'1px solid #e5e7eb'"},
            position: 'relative' as const,
          }}
        >
          ${tier.isPopular ? `<div
            style={{
              position: 'absolute' as const,
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '4px 16px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            Most Popular
          </div>` : ''}
          <h3
            style={{
              fontSize: '${extractStyle(styles, 'fontSize', '20px')}',
              fontWeight: '600',
              marginBottom: '8px',
              color: '${textColor}',
            }}
          >
            ${tier.name}
          </h3>
          <p
            style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '16px',
            }}
          >
            ${tier.description}
          </p>
          <div
            style={{
              marginBottom: '24px',
            }}
          >
            <span
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '${textColor}',
              }}
            >
              ${tier.price}
            </span>
            <span
              style={{
                fontSize: '16px',
                color: '#6b7280',
              }}
            >
              /${tier.period}
            </span>
          </div>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 24px 0',
            }}
          >
            ${tier.features.map((feature) => `<li
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                fontSize: '14px',
                color: '#374151',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                style={{ flexShrink: 0 }}
              >
                <path
                  d="M13.5 4.5L6.5 11.5L3 8"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              ${feature}
            </li>`).join('\n            ')}
          </ul>
          <button
            type="button"
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: ${tier.isPopular ? "'#3b82f6'" : "'transparent'"},
              color: ${tier.isPopular ? "'#ffffff'" : `'${textColor}'`},
              border: ${tier.isPopular ? "'none'" : "'1px solid #e5e7eb'"},
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            ${tier.ctaText}
          </button>
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
        className="pricing-container"
        style={{
          maxWidth: '${boundingBox.width > 0 ? boundingBox.width : 1280}px',
          width: '100%',
          margin: '0 auto',
          padding: '${extractStyle(styles, 'padding', '64px 24px')}',
        }}
      >
        {/* Header */}
        <div
          className="pricing-header"
          style={{
            textAlign: 'center',
            marginBottom: '48px',
          }}
        >
          ${content.hasHeadline ? `<h2
            style={{
              fontSize: '${extractStyle(styles, 'fontSize', '36px')}',
              fontWeight: '${extractStyle(styles, 'fontWeight', 'bold')}',
              marginBottom: '16px',
              color: '${textColor}',
            }}
          >
            ${content.headline}
          </h2>` : ''}
          ${content.hasSubheadline ? `<p
            style={{
              fontSize: '18px',
              color: '#6b7280',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            ${content.subheadline}
          </p>` : ''}
        </div>

        {/* Pricing Tiers */}
        <div
          className="pricing-tiers"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '24px',
          }}
        >
${tiersCode}
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
 * Generate semantic Pricing variant
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
export function generateSemanticPricing(props: PricingTemplateProps): string {
  const { componentName, component } = props;
  const content = parsePricingContent(component.htmlSnapshot);

  // Generate pricing tier cards
  const tiersCode = content.tiers
    .map((tier) => `          <div
            className={\`flex flex-col p-8 rounded-xl \${${tier.isPopular} ? 'bg-blue-50 border-2 border-blue-500 relative' : 'bg-white border border-gray-200'}\`}
          >
            ${tier.isPopular ? `<div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
              Most Popular
            </div>` : ''}
            <h3 className="text-xl font-semibold text-gray-900">
              ${tier.name}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              ${tier.description}
            </p>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900">${tier.price}</span>
              <span className="text-gray-600">/${tier.period}</span>
            </div>
            <ul className="mt-6 space-y-3 flex-1">
              ${tier.features.map((feature) => `<li className="flex items-center gap-2 text-sm text-gray-700">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                  <path d="M13.5 4.5L6.5 11.5L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                ${feature}
              </li>`).join('\n              ')}
            </ul>
            <button
              type="button"
              className={\`mt-8 w-full py-3 px-6 rounded-lg font-semibold transition-colors \${${tier.isPopular} ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'}\`}
            >
              ${tier.ctaText}
            </button>
          </div>`)
    .join('\n');

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
        {/* Header */}
        <div className="text-center mb-12">
          ${content.hasHeadline ? `<h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
            ${content.headline}
          </h2>` : ''}
          ${content.hasSubheadline ? `<p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            ${content.subheadline}
          </p>` : ''}
        </div>

        {/* Pricing Tiers */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-${Math.min(content.tiers.length, 3)} max-w-6xl mx-auto">
${tiersCode}
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
 * Generate modernized Pricing variant
 *
 * Focuses on accessibility and performance with:
 * - Full ARIA attributes and roles
 * - Keyboard navigation support
 * - React.memo for performance
 * - Mobile-responsive design
 * - Interactive billing toggle
 * - Focus management
 *
 * @param props - Template props
 * @returns Generated TypeScript/React code
 */
export function generateModernizedPricing(props: PricingTemplateProps): string {
  const { componentName, component } = props;
  const content = parsePricingContent(component.htmlSnapshot);

  // Generate pricing tier cards with accessibility
  const tiersCode = content.tiers
    .map((tier, index) => `          <article
            key="${tier.name.toLowerCase()}"
            className={\`flex flex-col p-8 rounded-xl transition-shadow hover:shadow-lg \${${tier.isPopular} ? 'bg-blue-50 border-2 border-blue-500 relative ring-1 ring-blue-500' : 'bg-white border border-gray-200'}\`}
            aria-labelledby="${tier.name.toLowerCase()}-tier-heading"
          >
            ${tier.isPopular ? `<div
              className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full"
              role="status"
            >
              Most Popular
            </div>` : ''}
            <header>
              <h3
                id="${tier.name.toLowerCase()}-tier-heading"
                className="text-xl font-semibold text-gray-900"
              >
                ${tier.name}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                ${tier.description}
              </p>
            </header>
            <div className="mt-4" aria-label="Price: ${tier.price} per ${tier.period}">
              <span className="text-4xl font-bold text-gray-900">${tier.price}</span>
              <span className="text-gray-600">/${tier.period}</span>
            </div>
            <ul
              className="mt-6 space-y-3 flex-1"
              role="list"
              aria-label="Features included"
            >
              ${tier.features.map((feature) => `<li className="flex items-center gap-2 text-sm text-gray-700">
                <svg
                  className="w-4 h-4 text-green-500 flex-shrink-0"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M13.5 4.5L6.5 11.5L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>${feature}</span>
              </li>`).join('\n              ')}
            </ul>
            <a
              href="#"
              className={\`mt-8 w-full py-3 px-6 rounded-lg font-semibold text-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 \${${tier.isPopular} ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500'}\`}
              aria-describedby="${tier.name.toLowerCase()}-tier-heading"
            >
              ${tier.ctaText}
            </a>
          </article>`)
    .join('\n');

  return `'use client';

import React, { memo, useState, useCallback } from 'react';
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
 * - ARIA labels for pricing and features
 * - Proper heading hierarchy
 * - Focus indicators for interactive elements
 * - Keyboard-accessible billing toggle
 *
 * Performance:
 * - Memoized to prevent unnecessary re-renders
 * - Optimized for Core Web Vitals
 */
function ${componentName}Base({ className, id }: ${componentName}Props) {
  const [isAnnual, setIsAnnual] = useState(false);
  const headingId = id ? \`\${id}-heading\` : '${componentName.toLowerCase()}-heading';

  const toggleBilling = useCallback(() => {
    setIsAnnual((prev) => !prev);
  }, []);

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        'w-full bg-gray-50 py-16 sm:py-20 md:py-24',
        className
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="text-center mb-12">
          ${content.hasHeadline ? `<h2
            id={headingId}
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            ${content.headline}
          </h2>` : ''}
          ${content.hasSubheadline ? `<p className="mt-4 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            ${content.subheadline}
          </p>` : ''}

          ${content.hasBillingToggle ? `{/* Billing Toggle */}
          <div
            className="mt-8 flex items-center justify-center gap-4"
            role="group"
            aria-label="Billing frequency"
          >
            <span
              className={\`text-sm font-medium \${!isAnnual ? 'text-gray-900' : 'text-gray-500'}\`}
              id="monthly-label"
            >
              Monthly
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isAnnual}
              aria-labelledby="billing-toggle-label"
              onClick={toggleBilling}
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{ backgroundColor: isAnnual ? '#3b82f6' : '#e5e7eb' }}
            >
              <span className="sr-only" id="billing-toggle-label">Toggle annual billing</span>
              <span
                className={\`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out \${isAnnual ? 'translate-x-5' : 'translate-x-0'}\`}
                aria-hidden="true"
              />
            </button>
            <span
              className={\`text-sm font-medium \${isAnnual ? 'text-gray-900' : 'text-gray-500'}\`}
              id="annual-label"
            >
              Annual
              <span className="ml-1 text-green-600 text-xs font-semibold">Save 20%</span>
            </span>
          </div>` : ''}
        </header>

        {/* Pricing Tiers */}
        <div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-${Math.min(content.tiers.length, 3)} max-w-6xl mx-auto"
          role="list"
          aria-label="Pricing plans"
        >
${tiersCode}
        </div>

        {/* Trust indicators */}
        <div className="mt-12 text-center" aria-hidden="true">
          <p className="text-sm text-gray-500">
            30-day money-back guarantee. No credit card required to start.
          </p>
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
 * Pricing template generators mapped by variant strategy
 */
export const pricingTemplates = {
  'pixel-perfect': generatePixelPerfectPricing,
  'semantic': generateSemanticPricing,
  'modernized': generateModernizedPricing,
} as const;

/**
 * Get pricing template generator by strategy
 *
 * @param strategy - Variant strategy name
 * @returns Template generator function
 */
export function getPricingTemplate(
  strategy: keyof typeof pricingTemplates
): (props: PricingTemplateProps) => string {
  return pricingTemplates[strategy];
}

/**
 * Generate all pricing variants
 *
 * @param props - Template props
 * @returns Object with all variant codes
 */
export function generateAllPricingVariants(props: PricingTemplateProps): {
  pixelPerfect: string;
  semantic: string;
  modernized: string;
} {
  return {
    pixelPerfect: generatePixelPerfectPricing(props),
    semantic: generateSemanticPricing(props),
    modernized: generateModernizedPricing(props),
  };
}

// ====================
// TYPE EXPORTS
// ====================

export type PricingVariantStrategy = keyof typeof pricingTemplates;
