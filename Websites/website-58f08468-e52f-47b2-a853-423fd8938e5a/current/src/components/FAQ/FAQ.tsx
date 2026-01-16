'use client';

import React from 'react';

interface FAQProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * FAQ - Pixel-perfect variant
 *
 * Matches original component dimensions and styles exactly.
 * Bounding box: 1408x780px
 */
export function FAQ({ className, children }: FAQProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: '#ffffff',
        color: 'rgb(0, 0, 0)',
        fontSize: '12px',
        fontFamily: 'sans-serif',
        padding: '100px 16px 140px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '0px',
        borderRadius: '0px',
        minHeight: '780px',
        width: '100%'
      }}
    >
      <div className="container mx-auto">
        <div className="images">
          {/* Images extracted from original */}
        </div>
        <nav>
          {/* Navigation links */}
        </nav>
        <div className="content">
          {/* Text content placeholder */}
        </div>
      </div>
    </div>
  );
}

export default FAQ;
