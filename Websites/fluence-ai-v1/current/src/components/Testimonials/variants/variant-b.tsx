'use client';

import React from 'react';

interface TestimonialsProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Testimonials - Semantic variant
 *
 * Clean code architecture with proper HTML semantics.
 * Uses semantic <section> element.
 */
export function Testimonials({ className, children }: TestimonialsProps) {
  return (
    <section
      className={`${className || ''}`}
    >
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          {/* Section title */}
        </h2>
        <div className="testimonials-grid">
          {/* Testimonial cards */}
          {children}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
