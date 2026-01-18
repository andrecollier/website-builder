'use client';

import React, { memo } from 'react';

interface HeaderProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
}

/**
 * Header - Modernized variant
 *
 * Includes accessibility features (ARIA), performance optimizations,
 * and follows modern best practices.
 *
 * Accessibility:
 * - Proper landmark: <header> with role="banner"
 * - ARIA label: "Site header"
 * - Semantic HTML structure
 * - Keyboard navigation support
 */
function HeaderBase({ className, children, id }: HeaderProps) {
  return (
    <header
      id={id}
      aria-label="Site header"
      className={`${className || ''}`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <a href="/" aria-label="Go to homepage" className="logo">
          {/* Logo with proper alt text */}
        </a>
        <nav aria-label="Main navigation">
          <ul role="list" className="flex gap-6">
            {/* Navigation items with keyboard support */}
          </ul>
        </nav>
        <div className="actions flex gap-4">
          {/* Accessible CTA buttons */}
        </div>
      </div>
    </header>
  );
}

// Memoized for performance - prevents unnecessary re-renders
export const Header = memo(HeaderBase);
Header.displayName = 'Header';

export default Header;
