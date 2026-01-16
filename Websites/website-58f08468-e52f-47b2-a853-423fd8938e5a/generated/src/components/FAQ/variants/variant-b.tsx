'use client';

import React from 'react';

interface FAQProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * FAQ - Semantic variant
 *
 * Clean code architecture with proper HTML semantics.
 * Uses semantic <section> element.
 */
export function FAQ({ className, children }: FAQProps) {
  return (
    <section
      className={`${className || ''}`}
    >
      <div className="container mx-auto px-4 py-16">
        {children}
      </div>
    </section>
  );
}

export default FAQ;
