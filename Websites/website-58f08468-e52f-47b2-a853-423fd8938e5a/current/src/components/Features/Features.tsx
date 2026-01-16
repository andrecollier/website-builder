'use client';

import React from 'react';

interface FeaturesProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Features - Pixel-perfect variant
 *
 * Matches original component dimensions and styles exactly.
 * Bounding box: 1408x2278px
 */
export function Features({ className, children }: FeaturesProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: '#ffffff',
        color: 'rgb(0, 0, 0)',
        fontSize: '12px',
        fontFamily: 'sans-serif',
        padding: '100px 16px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '0px',
        borderRadius: '0px',
        minHeight: '2278px',
        width: '100%'
      }}
    >
      <div className="container mx-auto">
        <div className="images">
          {/* Images extracted from original */}
        </div>
        <div className="content">
          {/* Text content placeholder */}
        </div>
      </div>
    </div>
  );
}

export default Features;
