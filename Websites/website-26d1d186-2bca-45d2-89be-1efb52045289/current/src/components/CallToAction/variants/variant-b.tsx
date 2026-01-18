'use client';

import React from 'react';

interface CallToActionProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * CallToAction - Semantic variant
 *
 * Clean code architecture with proper HTML semantics.
 * Uses semantic <aside> element.
 */
export function CallToAction({ className, children }: CallToActionProps) {
  return (
    <aside
      className={`${className || ''}`}
    >
      <div className="container mx-auto px-4 py-16">
        {children}
      </div>
    </aside>
  );
}

export default CallToAction;
