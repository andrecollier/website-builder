'use client';

import React, { memo } from 'react';

interface PricingProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
}

/**
 * Pricing - Modernized variant
 *
 * Includes accessibility features (ARIA), performance optimizations,
 * and follows modern best practices.
 *
 * Accessibility:
 * - Proper landmark: <section>
 * - ARIA label: "Pricing plans"
 * - Semantic HTML structure
 * - Keyboard navigation support
 */
function PricingBase({ className, children, id }: PricingProps) {
  return (
    <section
      id={id}
      aria-label="Pricing plans"
      className={`${className || ''}`}
    >
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">
          {/* Pricing heading */}
        </h2>
        <p className="text-gray-600 text-center mb-12">
          {/* Pricing description */}
        </p>
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          role="list"
          aria-label="Pricing tiers"
        >
          {/* Pricing cards with clear price announcements */}
          {children}
        </div>
      </div>
    </section>
  );
}

// Memoized for performance - prevents unnecessary re-renders
export const Pricing = memo(PricingBase);
Pricing.displayName = 'Pricing';

export default Pricing;
