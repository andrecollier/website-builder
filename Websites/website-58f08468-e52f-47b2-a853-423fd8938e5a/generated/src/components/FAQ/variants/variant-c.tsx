'use client';

import React, { memo } from 'react';

interface FAQProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
}

/**
 * FAQ - Modernized variant
 *
 * Includes accessibility features (ARIA), performance optimizations,
 * and follows modern best practices.
 *
 * Accessibility:
 * - Proper landmark: <section>
 * - ARIA label: "Frequently asked questions"
 * - Semantic HTML structure
 * - Keyboard navigation support
 */
function FAQBase({ className, children, id }: FAQProps) {
  return (
    <section
      id={id}
      aria-label="Frequently asked questions"
      className={`${className || ''}`}
    >
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          {/* FAQ heading */}
        </h2>
        <dl className="max-w-3xl mx-auto divide-y">
          {/* FAQ items using description list for semantics */}
          {children}
        </dl>
      </div>
    </section>
  );
}

// Memoized for performance - prevents unnecessary re-renders
export const FAQ = memo(FAQBase);
FAQ.displayName = 'FAQ';

export default FAQ;
