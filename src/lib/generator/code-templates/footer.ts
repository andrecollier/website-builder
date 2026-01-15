/**
 * Footer Component Code Templates
 *
 * Generates Footer component code with three variant strategies:
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
 * Props extracted from detected footer component
 */
export interface FooterTemplateProps {
  /** Component name (PascalCase) */
  componentName: string;
  /** Detected component data */
  component: DetectedComponent;
  /** Optional custom props to include */
  customProps?: Record<string, string>;
}

/**
 * Footer link group structure
 */
interface LinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

/**
 * Social link structure
 */
interface SocialLink {
  platform: string;
  href: string;
  icon: string;
}

/**
 * Parsed footer content structure
 */
interface FooterContent {
  hasLogo: boolean;
  hasDescription: boolean;
  hasLinkGroups: boolean;
  hasNewsletter: boolean;
  hasSocialLinks: boolean;
  hasCopyright: boolean;
  hasLegalLinks: boolean;
  logoText: string;
  description: string;
  linkGroups: LinkGroup[];
  socialLinks: SocialLink[];
  copyrightText: string;
  legalLinks: { label: string; href: string }[];
}

// ====================
// CONTENT PARSER
// ====================

/**
 * Parse HTML snapshot to extract footer-specific content
 *
 * @param htmlSnapshot - Raw HTML string from detected component
 * @returns Structured footer content
 */
function parseFooterContent(htmlSnapshot: string): FooterContent {
  // Detect logo presence
  const hasLogo = /<(img|svg)[^>]*(?:logo|brand|icon)/i.test(htmlSnapshot) ||
    /class="[^"]*logo[^"]*"/i.test(htmlSnapshot) ||
    /<a[^>]*href=["']?\/?["']?[^>]*>/i.test(htmlSnapshot);

  // Detect description/tagline
  const hasDescription = /<p[^>]*class="[^"]*(?:description|tagline|about)[^"]*"/i.test(htmlSnapshot) ||
    (hasLogo && /<p\b/i.test(htmlSnapshot));

  // Detect link groups/columns
  const hasLinkGroups = /<(?:nav|div)[^>]*class="[^"]*(?:links|column|group)[^"]*"/i.test(htmlSnapshot) ||
    (/<h[456]\b/i.test(htmlSnapshot) && /<ul\b/i.test(htmlSnapshot));

  // Detect newsletter signup
  const hasNewsletter = /<input[^>]*type=["']?email["']?/i.test(htmlSnapshot) ||
    /(?:newsletter|subscribe|signup)/i.test(htmlSnapshot) ||
    /<form\b/i.test(htmlSnapshot);

  // Detect social links
  const hasSocialLinks = /(?:facebook|twitter|instagram|linkedin|youtube|github|social)/i.test(htmlSnapshot) ||
    /class="[^"]*social[^"]*"/i.test(htmlSnapshot);

  // Detect copyright
  const hasCopyright = /(?:copyright|©|\(c\)|all rights reserved)/i.test(htmlSnapshot);

  // Detect legal links
  const hasLegalLinks = /(?:privacy|terms|cookie|legal|policy)/i.test(htmlSnapshot);

  // Extract logo text
  const logoMatch = htmlSnapshot.match(/<(?:span|div|a)[^>]*class="[^"]*logo[^"]*"[^>]*>([^<]+)</i) ||
    htmlSnapshot.match(/<img[^>]*alt="([^"]+)"/i);
  const logoText = logoMatch ? logoMatch[1].trim() : 'Company';

  // Extract description
  const descMatch = htmlSnapshot.match(/<p[^>]*class="[^"]*(?:description|tagline|about)[^"]*"[^>]*>([^<]+)</i) ||
    htmlSnapshot.match(/<footer[^>]*>[\s\S]*?<p[^>]*>([^<]{20,200})</i);
  const description = descMatch
    ? descMatch[1].trim()
    : 'Building the future of web development with innovative solutions and cutting-edge technology.';

  // Extract link groups
  const linkGroups: LinkGroup[] = [];
  const groupMatches = htmlSnapshot.matchAll(/<(?:div|nav)[^>]*class="[^"]*(?:column|group|links)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|nav)>/gi);

  for (const match of groupMatches) {
    const groupHtml = match[1];

    // Extract group title
    const titleMatch = groupHtml.match(/<h[3456][^>]*>([^<]+)</i) ||
      groupHtml.match(/<(?:span|div)[^>]*class="[^"]*(?:title|heading)[^"]*"[^>]*>([^<]+)</i);
    const title = titleMatch ? titleMatch[1].trim() : 'Links';

    // Extract links
    const links: { label: string; href: string }[] = [];
    const linkMatches = groupHtml.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)</gi);
    for (const linkMatch of linkMatches) {
      links.push({
        href: linkMatch[1] || '#',
        label: linkMatch[2].trim(),
      });
      if (links.length >= 6) break;
    }

    if (links.length > 0) {
      linkGroups.push({ title, links });
    }
    if (linkGroups.length >= 4) break;
  }

  // Fallback link groups if none found
  if (linkGroups.length === 0) {
    linkGroups.push(
      {
        title: 'Product',
        links: [
          { label: 'Features', href: '#' },
          { label: 'Pricing', href: '#' },
          { label: 'Integrations', href: '#' },
          { label: 'Changelog', href: '#' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About', href: '#' },
          { label: 'Blog', href: '#' },
          { label: 'Careers', href: '#' },
          { label: 'Contact', href: '#' },
        ],
      },
      {
        title: 'Resources',
        links: [
          { label: 'Documentation', href: '#' },
          { label: 'Help Center', href: '#' },
          { label: 'Community', href: '#' },
          { label: 'Status', href: '#' },
        ],
      }
    );
  }

  // Extract social links
  const socialLinks: SocialLink[] = [];
  const socialPatterns = [
    { platform: 'Twitter', pattern: /(?:twitter|x\.com)/i, icon: 'twitter' },
    { platform: 'Facebook', pattern: /facebook/i, icon: 'facebook' },
    { platform: 'Instagram', pattern: /instagram/i, icon: 'instagram' },
    { platform: 'LinkedIn', pattern: /linkedin/i, icon: 'linkedin' },
    { platform: 'GitHub', pattern: /github/i, icon: 'github' },
    { platform: 'YouTube', pattern: /youtube/i, icon: 'youtube' },
  ];

  for (const social of socialPatterns) {
    if (social.pattern.test(htmlSnapshot)) {
      const hrefMatch = htmlSnapshot.match(new RegExp(`href="([^"]*${social.pattern.source}[^"]*)"`, 'i'));
      socialLinks.push({
        platform: social.platform,
        href: hrefMatch ? hrefMatch[1] : '#',
        icon: social.icon,
      });
    }
  }

  // Fallback social links
  if (socialLinks.length === 0 && hasSocialLinks) {
    socialLinks.push(
      { platform: 'Twitter', href: '#', icon: 'twitter' },
      { platform: 'GitHub', href: '#', icon: 'github' },
      { platform: 'LinkedIn', href: '#', icon: 'linkedin' }
    );
  }

  // Extract copyright text
  const copyrightMatch = htmlSnapshot.match(/(?:©|copyright|&copy;)\s*(\d{4})?[^<]*/i);
  const currentYear = new Date().getFullYear();
  const copyrightText = copyrightMatch
    ? copyrightMatch[0].trim()
    : `© ${currentYear} ${logoText}. All rights reserved.`;

  // Extract legal links
  const legalLinks: { label: string; href: string }[] = [];
  const legalPatterns = [
    { pattern: /privacy/i, label: 'Privacy Policy' },
    { pattern: /terms/i, label: 'Terms of Service' },
    { pattern: /cookie/i, label: 'Cookie Policy' },
  ];

  for (const legal of legalPatterns) {
    if (legal.pattern.test(htmlSnapshot)) {
      const hrefMatch = htmlSnapshot.match(new RegExp(`<a[^>]*href="([^"]*)"[^>]*>[^<]*${legal.pattern.source}[^<]*</a>`, 'i'));
      legalLinks.push({
        label: legal.label,
        href: hrefMatch ? hrefMatch[1] : '#',
      });
    }
  }

  // Fallback legal links
  if (legalLinks.length === 0 && hasLegalLinks) {
    legalLinks.push(
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' }
    );
  }

  return {
    hasLogo,
    hasDescription,
    hasLinkGroups,
    hasNewsletter,
    hasSocialLinks,
    hasCopyright,
    hasLegalLinks,
    logoText,
    description,
    linkGroups,
    socialLinks,
    copyrightText,
    legalLinks,
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
 * Generate SVG icon for social platform
 */
function getSocialIcon(platform: string): string {
  const icons: Record<string, string> = {
    twitter: '<path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>',
    facebook: '<path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
    linkedin: '<path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>',
    youtube: '<path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>',
  };
  return icons[platform.toLowerCase()] || icons.twitter;
}

// ====================
// PIXEL-PERFECT VARIANT
// ====================

/**
 * Generate pixel-perfect Footer variant
 *
 * Focuses on exact visual reproduction using:
 * - Inline styles for precise control
 * - Exact dimensions from bounding box
 * - Original colors and spacing
 *
 * @param props - Template props
 * @returns Generated TypeScript/React code
 */
export function generatePixelPerfectFooter(props: FooterTemplateProps): string {
  const { componentName, component } = props;
  const { styles, boundingBox } = component;
  const content = parseFooterContent(component.htmlSnapshot);

  // Build inline styles from extracted component styles
  const containerStyles: string[] = [];
  const bgColor = extractStyle(styles, 'backgroundColor', '#111827');
  const textColor = extractStyle(styles, 'color', '#ffffff');

  containerStyles.push(`backgroundColor: '${bgColor}'`);
  containerStyles.push(`color: '${textColor}'`);

  if (styles.borderTop && styles.borderTop !== 'none') {
    containerStyles.push(`borderTop: '${styles.borderTop}'`);
  }
  if (styles.padding) {
    containerStyles.push(`padding: '${styles.padding}'`);
  }

  const inlineStylesStr = containerStyles.length > 0
    ? `\n      style={{
        ${containerStyles.join(',\n        ')},
      }}`
    : '';

  // Generate link groups
  const linkGroupsCode = content.linkGroups
    .map((group) => `          <div className="link-group">
            <h4
              style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '${textColor}',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              ${group.title}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              ${group.links.map((link) => `<li style={{ marginBottom: '12px' }}>
                <a
                  href="${link.href}"
                  style={{
                    color: '#9ca3af',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  ${link.label}
                </a>
              </li>`).join('\n              ')}
            </ul>
          </div>`)
    .join('\n');

  // Generate social links
  const socialLinksCode = content.socialLinks
    .map((social) => `            <a
              href="${social.href}"
              aria-label="${social.platform}"
              style={{
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                ${getSocialIcon(social.platform)}
              </svg>
            </a>`)
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
    <footer
      className={className}${inlineStylesStr}
    >
      <div
        className="footer-container"
        style={{
          maxWidth: '${boundingBox.width > 0 ? boundingBox.width : 1280}px',
          width: '100%',
          margin: '0 auto',
          padding: '${extractStyle(styles, 'padding', '64px 24px')}',
        }}
      >
        {/* Main Footer Content */}
        <div
          className="footer-main"
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr repeat(${content.linkGroups.length}, 1fr)',
            gap: '48px',
            marginBottom: '48px',
          }}
        >
          {/* Brand Column */}
          <div className="brand-column">
            ${content.hasLogo ? `<div
              className="logo"
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '16px',
              }}
            >
              ${content.logoText}
            </div>` : ''}
            ${content.hasDescription ? `<p
              style={{
                color: '#9ca3af',
                fontSize: '14px',
                lineHeight: '1.6',
                maxWidth: '300px',
                marginBottom: '24px',
              }}
            >
              ${content.description}
            </p>` : ''}
            ${content.hasSocialLinks ? `<div
              className="social-links"
              style={{
                display: 'flex',
                gap: '16px',
              }}
            >
${socialLinksCode}
            </div>` : ''}
          </div>

          {/* Link Groups */}
${linkGroupsCode}
        </div>

        {/* Footer Bottom */}
        <div
          className="footer-bottom"
          style={{
            borderTop: '1px solid #374151',
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          ${content.hasCopyright ? `<p
            style={{
              color: '#9ca3af',
              fontSize: '14px',
            }}
          >
            ${content.copyrightText}
          </p>` : ''}
          ${content.hasLegalLinks ? `<div
            className="legal-links"
            style={{
              display: 'flex',
              gap: '24px',
            }}
          >
            ${content.legalLinks.map((link) => `<a
              href="${link.href}"
              style={{
                color: '#9ca3af',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              ${link.label}
            </a>`).join('\n            ')}
          </div>` : ''}
        </div>
      </div>
    </footer>
  );
}

export default ${componentName};
`;
}

// ====================
// SEMANTIC VARIANT
// ====================

/**
 * Generate semantic Footer variant
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
export function generateSemanticFooter(props: FooterTemplateProps): string {
  const { componentName, component } = props;
  const content = parseFooterContent(component.htmlSnapshot);

  // Generate link groups
  const linkGroupsCode = content.linkGroups
    .map((group) => `          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              ${group.title}
            </h4>
            <ul className="space-y-3">
              ${group.links.map((link) => `<li>
                <a href="${link.href}" className="text-gray-400 hover:text-white transition-colors text-sm">
                  ${link.label}
                </a>
              </li>`).join('\n              ')}
            </ul>
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
 * Uses semantic <footer> element with role="contentinfo".
 */
export function ${componentName}({ className }: ${componentName}Props) {
  return (
    <footer
      role="contentinfo"
      className={cn(
        'bg-gray-900 text-white',
        className
      )}
    >
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-${content.linkGroups.length + 1}">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            ${content.hasLogo ? `<div className="text-2xl font-bold mb-4">
              ${content.logoText}
            </div>` : ''}
            ${content.hasDescription ? `<p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6">
              ${content.description}
            </p>` : ''}
            ${content.hasSocialLinks ? `<div className="flex gap-4">
              ${content.socialLinks.map((social) => `<a
                href="${social.href}"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="sr-only">${social.platform}</span>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  ${getSocialIcon(social.platform)}
                </svg>
              </a>`).join('\n              ')}
            </div>` : ''}
          </div>

          {/* Link Groups */}
${linkGroupsCode}
        </div>

        ${content.hasNewsletter ? `{/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="max-w-md">
            <h4 className="text-sm font-semibold text-white mb-4">
              Subscribe to our newsletter
            </h4>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>` : ''}

        {/* Footer Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-wrap justify-between items-center gap-4">
          ${content.hasCopyright ? `<p className="text-gray-400 text-sm">
            ${content.copyrightText}
          </p>` : ''}
          ${content.hasLegalLinks ? `<div className="flex gap-6">
            ${content.legalLinks.map((link) => `<a href="${link.href}" className="text-gray-400 hover:text-white transition-colors text-sm">
              ${link.label}
            </a>`).join('\n            ')}
          </div>` : ''}
        </div>
      </div>
    </footer>
  );
}

export default ${componentName};
`;
}

// ====================
// MODERNIZED VARIANT
// ====================

/**
 * Generate modernized Footer variant
 *
 * Focuses on accessibility and performance with:
 * - Full ARIA attributes and roles
 * - Keyboard navigation support
 * - React.memo for performance
 * - Mobile-responsive design
 * - Newsletter form validation
 * - Focus management
 *
 * @param props - Template props
 * @returns Generated TypeScript/React code
 */
export function generateModernizedFooter(props: FooterTemplateProps): string {
  const { componentName, component } = props;
  const content = parseFooterContent(component.htmlSnapshot);

  // Generate link groups with accessibility
  const linkGroupsCode = content.linkGroups
    .map((group, index) => `          <nav aria-labelledby="footer-nav-${index}">
            <h4
              id="footer-nav-${index}"
              className="text-sm font-semibold text-white uppercase tracking-wider mb-4"
            >
              ${group.title}
            </h4>
            <ul role="list" className="space-y-3">
              ${group.links.map((link) => `<li>
                <a
                  href="${link.href}"
                  className="text-gray-400 hover:text-white transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                >
                  ${link.label}
                </a>
              </li>`).join('\n              ')}
            </ul>
          </nav>`)
    .join('\n');

  return `'use client';

import React, { memo, useState, useCallback, FormEvent } from 'react';
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
 * - Proper landmark: <footer> with role="contentinfo"
 * - ARIA labels for navigation sections
 * - Screen reader text for social links
 * - Focus indicators for all interactive elements
 * - Form validation feedback
 *
 * Performance:
 * - Memoized to prevent unnecessary re-renders
 * - Optimized for Core Web Vitals
 */
function ${componentName}Base({ className, id }: ${componentName}Props) {
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubscribeStatus('error');
      return;
    }
    setSubscribeStatus('loading');
    // Simulate subscription
    setTimeout(() => {
      setSubscribeStatus('success');
      setEmail('');
    }, 1000);
  }, [email]);

  return (
    <footer
      id={id}
      role="contentinfo"
      aria-label="Site footer"
      className={cn(
        'bg-gray-900 text-white',
        className
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Main Footer Content */}
        <div className="grid gap-8 sm:gap-12 md:grid-cols-2 lg:grid-cols-${content.linkGroups.length + 1}">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            ${content.hasLogo ? `<a
              href="/"
              aria-label="Go to homepage - ${content.logoText}"
              className="inline-block text-2xl font-bold mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
            >
              ${content.logoText}
            </a>` : ''}
            ${content.hasDescription ? `<p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6">
              ${content.description}
            </p>` : ''}
            ${content.hasSocialLinks ? `<div
              className="flex gap-4"
              role="list"
              aria-label="Social media links"
            >
              ${content.socialLinks.map((social) => `<a
                href="${social.href}"
                aria-label="Follow us on ${social.platform}"
                className="text-gray-400 hover:text-white transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  ${getSocialIcon(social.platform)}
                </svg>
              </a>`).join('\n              ')}
            </div>` : ''}
          </div>

          {/* Link Groups */}
${linkGroupsCode}
        </div>

        ${content.hasNewsletter ? `{/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="max-w-md">
            <h4 className="text-sm font-semibold text-white mb-2">
              Subscribe to our newsletter
            </h4>
            <p className="text-gray-400 text-sm mb-4">
              Get the latest updates and news delivered to your inbox.
            </p>
            <form
              onSubmit={handleSubscribe}
              className="flex flex-col sm:flex-row gap-2"
              aria-label="Newsletter subscription"
            >
              <div className="flex-1">
                <label htmlFor="footer-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (subscribeStatus === 'error') setSubscribeStatus('idle');
                  }}
                  placeholder="Enter your email"
                  aria-invalid={subscribeStatus === 'error'}
                  aria-describedby={subscribeStatus === 'error' ? 'email-error' : undefined}
                  className={\`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 \${subscribeStatus === 'error' ? 'border-red-500' : 'border-gray-700'}\`}
                  disabled={subscribeStatus === 'loading'}
                />
                {subscribeStatus === 'error' && (
                  <p id="email-error" className="mt-1 text-red-400 text-xs" role="alert">
                    Please enter a valid email address.
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={subscribeStatus === 'loading'}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-busy={subscribeStatus === 'loading'}
              >
                {subscribeStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            {subscribeStatus === 'success' && (
              <p className="mt-2 text-green-400 text-sm" role="status">
                Thanks for subscribing!
              </p>
            )}
          </div>
        </div>` : ''}

        {/* Footer Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          ${content.hasCopyright ? `<p className="text-gray-400 text-sm">
            ${content.copyrightText}
          </p>` : ''}
          ${content.hasLegalLinks ? `<nav aria-label="Legal links">
            <ul role="list" className="flex flex-wrap gap-4 sm:gap-6">
              ${content.legalLinks.map((link) => `<li>
                <a
                  href="${link.href}"
                  className="text-gray-400 hover:text-white transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                >
                  ${link.label}
                </a>
              </li>`).join('\n              ')}
            </ul>
          </nav>` : ''}
        </div>
      </div>
    </footer>
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
 * Footer template generators mapped by variant strategy
 */
export const footerTemplates = {
  'pixel-perfect': generatePixelPerfectFooter,
  'semantic': generateSemanticFooter,
  'modernized': generateModernizedFooter,
} as const;

/**
 * Get footer template generator by strategy
 *
 * @param strategy - Variant strategy name
 * @returns Template generator function
 */
export function getFooterTemplate(
  strategy: keyof typeof footerTemplates
): (props: FooterTemplateProps) => string {
  return footerTemplates[strategy];
}

/**
 * Generate all footer variants
 *
 * @param props - Template props
 * @returns Object with all variant codes
 */
export function generateAllFooterVariants(props: FooterTemplateProps): {
  pixelPerfect: string;
  semantic: string;
  modernized: string;
} {
  return {
    pixelPerfect: generatePixelPerfectFooter(props),
    semantic: generateSemanticFooter(props),
    modernized: generateModernizedFooter(props),
  };
}

// ====================
// TYPE EXPORTS
// ====================

export type FooterVariantStrategy = keyof typeof footerTemplates;
