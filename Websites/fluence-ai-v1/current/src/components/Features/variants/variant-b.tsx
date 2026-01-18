'use client';

import React from 'react';

interface FeaturesProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Features - Semantic variant
 *
 * Clean code architecture with proper HTML semantics.
 * Uses semantic <section> element.
 */
export function Features({ className, children }: FeaturesProps) {
  return (
    <section
      className={`${className || ''}`}
    >
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          {/* Section title */}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature cards */}
          {children}
        </div>
      </div>
    </section>
  );
}

export default Features;
