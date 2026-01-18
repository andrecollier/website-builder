'use client';

import React, { memo } from 'react';

interface CallToActionProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
}

/**
 * CallToAction - Modernized variant
 *
 * Includes accessibility features (ARIA), performance optimizations,
 * and follows modern best practices.
 *
 * Accessibility:
 * - Proper landmark: <aside> with role="complementary"
 * - ARIA label: "Call to action"
 * - Semantic HTML structure
 * - Keyboard navigation support
 */
function CallToActionBase({ className, children, id }: CallToActionProps) {
  return (
    <aside
      id={id}
      role="complementary"
      aria-label="Call to action"
      className={`${className || ''}`}
    >
      <div className="container mx-auto px-4 py-16">
        {children}
      </div>
    </aside>
  );
}

// Memoized for performance - prevents unnecessary re-renders
export const CallToAction = memo(CallToActionBase);
CallToAction.displayName = 'CallToAction';

export default CallToAction;
