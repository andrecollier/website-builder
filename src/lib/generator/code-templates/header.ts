/**
 * Header Component Code Templates
 *
 * Generates Header component code with three variant strategies:
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
 * Props extracted from detected header component
 */
export interface HeaderTemplateProps {
  /** Component name (PascalCase) */
  componentName: string;
  /** Detected component data */
  component: DetectedComponent;
  /** Optional custom props to include */
  customProps?: Record<string, string>;
}

/**
 * Parsed header content structure
 */
interface HeaderContent {
  hasLogo: boolean;
  hasNavigation: boolean;
  hasSearch: boolean;
  hasCTA: boolean;
  hasDropdown: boolean;
  hasMobileMenu: boolean;
  logoText: string;
  navItems: string[];
  ctaText: string;
}

// ====================
// CONTENT PARSER
// ====================

/**
 * Parse HTML snapshot to extract header-specific content
 *
 * @param htmlSnapshot - Raw HTML string from detected component
 * @returns Structured header content
 */
function parseHeaderContent(htmlSnapshot: string): HeaderContent {
  // Detect logo presence
  const hasLogo = /<(img|svg)[^>]*(?:logo|brand|icon)/i.test(htmlSnapshot) ||
    /class="[^"]*logo[^"]*"/i.test(htmlSnapshot) ||
    /<a[^>]*href=["']?\/?["']?[^>]*>/i.test(htmlSnapshot);

  // Detect navigation
  const hasNavigation = /<nav\b/i.test(htmlSnapshot) ||
    /<ul[^>]*(?:nav|menu)[^>]*>/i.test(htmlSnapshot) ||
    /class="[^"]*(?:nav|menu)[^"]*"/i.test(htmlSnapshot);

  // Detect search
  const hasSearch = /<input[^>]*type=["']?search["']?/i.test(htmlSnapshot) ||
    /class="[^"]*search[^"]*"/i.test(htmlSnapshot) ||
    /<svg[^>]*(?:search|magnify)/i.test(htmlSnapshot);

  // Detect CTA buttons
  const hasCTA = /<button\b/i.test(htmlSnapshot) ||
    /<a[^>]*class="[^"]*(?:btn|button|cta)[^"]*"/i.test(htmlSnapshot);

  // Detect dropdowns
  const hasDropdown = /dropdown|submenu|chevron|arrow/i.test(htmlSnapshot);

  // Detect mobile menu indicators
  const hasMobileMenu = /hamburger|mobile-menu|menu-toggle|burger/i.test(htmlSnapshot) ||
    /<svg[^>]*(?:menu|bars)/i.test(htmlSnapshot);

  // Extract logo text (company name)
  const logoMatch = htmlSnapshot.match(/<(?:span|div|a)[^>]*class="[^"]*logo[^"]*"[^>]*>([^<]+)</i) ||
    htmlSnapshot.match(/<img[^>]*alt="([^"]+)"/i);
  const logoText = logoMatch ? logoMatch[1].trim() : 'Company';

  // Extract navigation items
  const navItemsMatches = htmlSnapshot.matchAll(/<a[^>]*>([^<]+)</gi);
  const navItems: string[] = [];
  for (const match of navItemsMatches) {
    const text = match[1].trim();
    if (text && text.length < 30 && !text.includes('\n')) {
      navItems.push(text);
    }
    if (navItems.length >= 6) break;
  }

  // Extract CTA text
  const ctaMatch = htmlSnapshot.match(/<(?:button|a)[^>]*class="[^"]*(?:btn|button|cta)[^"]*"[^>]*>([^<]+)</i);
  const ctaText = ctaMatch ? ctaMatch[1].trim() : 'Get Started';

  return {
    hasLogo,
    hasNavigation,
    hasSearch,
    hasCTA,
    hasDropdown,
    hasMobileMenu,
    logoText,
    navItems: navItems.length > 0 ? navItems : ['Home', 'Features', 'Pricing', 'About', 'Contact'],
    ctaText,
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
 * Generate pixel-perfect Header variant
 *
 * Focuses on exact visual reproduction using:
 * - Inline styles for precise control
 * - Exact dimensions from bounding box
 * - Original colors and spacing
 *
 * @param props - Template props
 * @returns Generated TypeScript/React code
 */
export function generatePixelPerfectHeader(props: HeaderTemplateProps): string {
  const { componentName, component } = props;
  const { styles, boundingBox } = component;
  const content = parseHeaderContent(component.htmlSnapshot);

  // Build inline styles from extracted component styles
  const containerStyles: string[] = [];
  const bgColor = extractStyle(styles, 'backgroundColor', '#ffffff');
  const textColor = extractStyle(styles, 'color', '#1f2937');

  if (bgColor !== '#ffffff') {
    containerStyles.push(`backgroundColor: '${bgColor}'`);
  }
  containerStyles.push(`color: '${textColor}'`);

  if (styles.borderBottom && styles.borderBottom !== 'none') {
    containerStyles.push(`borderBottom: '${styles.borderBottom}'`);
  }
  if (styles.boxShadow && styles.boxShadow !== 'none') {
    containerStyles.push(`boxShadow: '${styles.boxShadow}'`);
  }
  if (styles.padding) {
    containerStyles.push(`padding: '${styles.padding}'`);
  }
  if (styles.position) {
    containerStyles.push(`position: '${styles.position}' as const`);
  }
  if (styles.zIndex) {
    containerStyles.push(`zIndex: ${parseInt(styles.zIndex, 10) || 50}`);
  }

  // Height from bounding box
  if (boundingBox.height > 0) {
    containerStyles.push(`height: '${boundingBox.height}px'`);
  }

  const inlineStylesStr = containerStyles.length > 0
    ? `\n      style={{
        ${containerStyles.join(',\n        ')},
      }}`
    : '';

  // Generate nav items
  const navItemsCode = content.navItems
    .map((item) => `          <a
            href="#"
            className="nav-link"
            style={{
              color: '${textColor}',
              textDecoration: 'none',
              fontSize: '${extractStyle(styles, 'fontSize', '16px')}',
              fontWeight: '${extractStyle(styles, 'fontWeight', '500')}',
            }}
          >
            ${item}
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
    <header
      className={className}${inlineStylesStr}
    >
      <div
        className="header-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '${boundingBox.width}px',
          width: '100%',
          margin: '0 auto',
          padding: '${extractStyle(styles, 'padding', '0 24px')}',
          height: '100%',
        }}
      >
        {/* Logo */}
        <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '${extractStyle(styles, 'fontSize', '24px')}',
              fontWeight: 'bold',
              color: '${textColor}',
            }}
          >
            ${content.logoText}
          </span>
        </div>

        {/* Navigation */}
        ${content.hasNavigation ? `<nav className="navigation" style={{ display: 'flex', gap: '24px' }}>
${navItemsCode}
        </nav>` : ''}

        {/* Actions */}
        <div className="actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          ${content.hasSearch ? `<button
            type="button"
            aria-label="Search"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>` : ''}
          ${content.hasCTA ? `<button
            type="button"
            style={{
              backgroundColor: '${extractStyle(styles, 'backgroundColor', '#3b82f6')}',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            ${content.ctaText}
          </button>` : ''}
        </div>
      </div>
    </header>
  );
}

export default ${componentName};
`;
}

// ====================
// SEMANTIC VARIANT
// ====================

/**
 * Generate semantic Header variant
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
export function generateSemanticHeader(props: HeaderTemplateProps): string {
  const { componentName, component } = props;
  const content = parseHeaderContent(component.htmlSnapshot);

  // Generate nav items with Tailwind classes
  const navItemsCode = content.navItems
    .map((item) => `            <a
              href="#"
              className="text-gray-700 hover:text-gray-900 transition-colors"
            >
              ${item}
            </a>`)
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
 * Uses semantic <header> element with role="banner".
 */
export function ${componentName}({ className }: ${componentName}Props) {
  return (
    <header
      role="banner"
      className={cn(
        'w-full bg-white border-b border-gray-200',
        className
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <div className="logo flex items-center">
          <a href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
            ${content.logoText}
          </a>
        </div>

        {/* Navigation */}
        ${content.hasNavigation ? `<nav className="hidden md:flex items-center gap-6">
${navItemsCode}
        </nav>` : ''}

        {/* Actions */}
        <div className="actions flex items-center gap-4">
          ${content.hasSearch ? `<button
            type="button"
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="sr-only">Search</span>
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>` : ''}
          ${content.hasCTA ? `<button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            ${content.ctaText}
          </button>` : ''}
          ${content.hasMobileMenu ? `<button
            type="button"
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="sr-only">Toggle menu</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>` : ''}
        </div>
      </div>
    </header>
  );
}

export default ${componentName};
`;
}

// ====================
// MODERNIZED VARIANT
// ====================

/**
 * Generate modernized Header variant
 *
 * Focuses on accessibility and performance with:
 * - Full ARIA attributes and roles
 * - Keyboard navigation support
 * - React.memo for performance
 * - Mobile-responsive design
 * - Skip link for accessibility
 * - Focus management
 *
 * @param props - Template props
 * @returns Generated TypeScript/React code
 */
export function generateModernizedHeader(props: HeaderTemplateProps): string {
  const { componentName, component } = props;
  const content = parseHeaderContent(component.htmlSnapshot);

  // Generate nav items with full accessibility
  const navItemsCode = content.navItems
    .map((item) => `              <li>
                <a
                  href="#"
                  className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  ${item}
                </a>
              </li>`)
    .join('\n');

  return `'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
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
 * - Proper landmark: <header> with role="banner"
 * - ARIA labels for all interactive elements
 * - Keyboard navigation support
 * - Focus management for mobile menu
 * - Skip link for keyboard users
 *
 * Performance:
 * - Memoized to prevent unnecessary re-renders
 * - Event handlers optimized with useCallback
 */
function ${componentName}Base({ className, id }: ${componentName}Props) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen, closeMobileMenu]);

  // Focus trap for mobile menu
  useEffect(() => {
    if (isMobileMenuOpen && mobileMenuRef.current) {
      const focusableElements = mobileMenuRef.current.querySelectorAll(
        'a[href], button:not([disabled])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      firstElement?.focus();
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md"
      >
        Skip to main content
      </a>

      <header
        id={id}
        role="banner"
        aria-label="Site header"
        className={cn(
          'sticky top-0 z-40 w-full bg-white border-b border-gray-200',
          className
        )}
      >
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          {/* Logo */}
          <div className="logo flex items-center">
            <a
              href="/"
              aria-label="Go to homepage - ${content.logoText}"
              className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
            >
              ${content.logoText}
            </a>
          </div>

          {/* Desktop Navigation */}
          ${content.hasNavigation ? `<nav aria-label="Main navigation" className="hidden md:block">
            <ul role="list" className="flex items-center gap-2">
${navItemsCode}
            </ul>
          </nav>` : ''}

          {/* Actions */}
          <div className="actions flex items-center gap-4" role="group" aria-label="Header actions">
            ${content.hasSearch ? `<button
              type="button"
              aria-label="Open search"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>` : ''}
            ${content.hasCTA ? `<a
              href="#"
              className="hidden sm:inline-flex px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              ${content.ctaText}
            </a>` : ''}

            {/* Mobile menu button */}
            <button
              ref={menuButtonRef}
              type="button"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        ${content.hasNavigation ? `{isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            id="mobile-menu"
            role="dialog"
            aria-label="Mobile navigation"
            aria-modal="true"
            className="md:hidden border-t border-gray-200 bg-white"
          >
            <nav aria-label="Mobile navigation">
              <ul role="list" className="px-4 py-2 space-y-1">
                ${content.navItems.map((item) => `<li>
                  <a
                    href="#"
                    className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={closeMobileMenu}
                  >
                    ${item}
                  </a>
                </li>`).join('\n                ')}
              </ul>
            </nav>
            ${content.hasCTA ? `<div className="px-4 py-4 border-t border-gray-100">
              <a
                href="#"
                className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-md font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={closeMobileMenu}
              >
                ${content.ctaText}
              </a>
            </div>` : ''}
          </div>
        )}` : ''}
      </header>
    </>
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
 * Header template generators mapped by variant strategy
 */
export const headerTemplates = {
  'pixel-perfect': generatePixelPerfectHeader,
  'semantic': generateSemanticHeader,
  'modernized': generateModernizedHeader,
} as const;

/**
 * Get header template generator by strategy
 *
 * @param strategy - Variant strategy name
 * @returns Template generator function
 */
export function getHeaderTemplate(
  strategy: keyof typeof headerTemplates
): (props: HeaderTemplateProps) => string {
  return headerTemplates[strategy];
}

/**
 * Generate all header variants
 *
 * @param props - Template props
 * @returns Object with all variant codes
 */
export function generateAllHeaderVariants(props: HeaderTemplateProps): {
  pixelPerfect: string;
  semantic: string;
  modernized: string;
} {
  return {
    pixelPerfect: generatePixelPerfectHeader(props),
    semantic: generateSemanticHeader(props),
    modernized: generateModernizedHeader(props),
  };
}

// ====================
// TYPE EXPORTS
// ====================

export type HeaderVariantStrategy = keyof typeof headerTemplates;
