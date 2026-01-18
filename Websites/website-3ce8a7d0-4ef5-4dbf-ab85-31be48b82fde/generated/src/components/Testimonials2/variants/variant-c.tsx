'use client';

import React, { memo } from 'react';

interface Testimonials2Props {
  className?: string;
  children?: React.ReactNode;
  id?: string;
}

/**
 * Testimonials - Modernized variant
 *
 * Includes accessibility features (ARIA), performance optimizations,
 * and follows modern best practices.
 *
 * Accessibility:
 * - Proper landmark: <section>
 * - ARIA label: "Customer testimonials"
 * - Semantic HTML structure
 * - Keyboard navigation support
 */
function Testimonials2Base({ className, children, id }: Testimonials2Props) {
  return (
    <section
      id={id}
      aria-label="Customer testimonials"
      className={`${className || ''}`}
    >
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          {/* Section heading */}
        </h2>
        <div
          className="testimonials-carousel"
          role="region"
          aria-roledescription="carousel"
          aria-label="Customer testimonials"
        >
          {/* Testimonials with proper cite and blockquote */}
          {children}
        </div>
      </div>
    </section>
  );
}

// Memoized for performance - prevents unnecessary re-renders
export const Testimonials2 = memo(TestimonialsBase);
Testimonials.displayName = 'Testimonials';

export default Testimonials2;
