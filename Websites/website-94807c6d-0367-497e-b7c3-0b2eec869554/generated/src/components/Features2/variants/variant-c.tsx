'use client';

import React, { memo } from 'react';

interface Features2Props {
  className?: string;
  children?: React.ReactNode;
  id?: string;
}

/**
 * Features - Modernized variant
 *
 * Includes accessibility features (ARIA), performance optimizations,
 * and follows modern best practices.
 *
 * Accessibility:
 * - Proper landmark: <section>
 * - ARIA label: "Features"
 * - Semantic HTML structure
 * - Keyboard navigation support
 */
function Features2Base({ className, children, id }: Features2Props) {
  return (
    <section
      id={id}
      aria-label="Features"
      className={`${className || ''}`}
    >
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">
          {/* Section heading */}
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          {/* Section description */}
        </p>
        <ul role="list" className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature items with proper list semantics */}
          {children}
        </ul>
      </div>
    </section>
  );
}

// Memoized for performance - prevents unnecessary re-renders
export const Features2 = memo(Features2Base);
Features2.displayName = 'Features2';

export default Features2;
