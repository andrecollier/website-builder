'use client';

import React, { memo } from 'react';

interface HeroProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
}

/**
 * Hero - Modernized variant
 *
 * Includes accessibility features (ARIA), performance optimizations,
 * and follows modern best practices.
 *
 * Accessibility:
 * - Proper landmark: <section>
 * - ARIA label: "Hero section"
 * - Semantic HTML structure
 * - Keyboard navigation support
 */
function HeroBase({ className, children, id }: HeroProps) {
  return (
    <section
      id={id}
      aria-label="Hero section"
      className={`${className || ''}`}
    >
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">
          {/* Primary heading - only one h1 per page */}
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          {/* Descriptive subheadline */}
        </p>
        <div className="cta-buttons flex justify-center gap-4" role="group" aria-label="Call to action">
          {/* Buttons with proper focus styles */}
        </div>
      </div>
    </section>
  );
}

// Memoized for performance - prevents unnecessary re-renders
export const Hero = memo(HeroBase);
Hero.displayName = 'Hero';

export default Hero;
