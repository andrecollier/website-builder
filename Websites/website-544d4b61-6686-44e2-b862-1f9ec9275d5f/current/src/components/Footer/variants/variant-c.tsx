'use client';

import React, { memo } from 'react';

interface FooterProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
}

/**
 * Footer - Modernized variant
 *
 * Includes accessibility features (ARIA), performance optimizations,
 * and follows modern best practices.
 *
 * Accessibility:
 * - Proper landmark: <footer> with role="contentinfo"
 * - ARIA label: "Site footer"
 * - Semantic HTML structure
 * - Keyboard navigation support
 */
function FooterBase({ className, children, id }: FooterProps) {
  return (
    <footer
      id={id}
      aria-label="Site footer"
      className={`${className || ''}`}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            {/* Company info */}
          </div>
          <nav aria-label="Footer navigation - Products">
            <h3 className="font-bold mb-4">Products</h3>
            <ul role="list">
              {/* Product links */}
            </ul>
          </nav>
          <nav aria-label="Footer navigation - Company">
            <h3 className="font-bold mb-4">Company</h3>
            <ul role="list">
              {/* Company links */}
            </ul>
          </nav>
          <nav aria-label="Footer navigation - Legal">
            <h3 className="font-bold mb-4">Legal</h3>
            <ul role="list">
              {/* Legal links */}
            </ul>
          </nav>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-gray-500">
          <p>
            {/* Copyright with current year */}
          </p>
        </div>
      </div>
    </footer>
  );
}

// Memoized for performance - prevents unnecessary re-renders
export const Footer = memo(FooterBase);
Footer.displayName = 'Footer';

export default Footer;
