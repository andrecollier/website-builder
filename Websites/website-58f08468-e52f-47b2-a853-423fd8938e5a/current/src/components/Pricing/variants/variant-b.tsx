'use client';

import React from 'react';

interface PricingProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Pricing - Semantic variant
 *
 * Clean code architecture with proper HTML semantics.
 * Uses semantic <section> element.
 */
export function Pricing({ className, children }: PricingProps) {
  return (
    <section
      className={`${className || ''}`}
    >
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          {/* Pricing title */}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pricing cards */}
          {children}
        </div>
      </div>
    </section>
  );
}

export default Pricing;
