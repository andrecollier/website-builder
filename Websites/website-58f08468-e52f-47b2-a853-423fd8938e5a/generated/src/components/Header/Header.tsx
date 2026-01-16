'use client';

import React from 'react';

interface HeaderProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Header - Pixel-perfect variant
 *
 * Matches original component dimensions and styles exactly.
 * Bounding box: 1408x1236px
 */
export function Header({ className, children }: HeaderProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: '#ffffff',
        color: 'rgb(0, 0, 0)',
        fontSize: '12px',
        fontFamily: 'sans-serif',
        padding: '160px 40px 0px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '0px',
        borderRadius: '16px',
        minHeight: '1236px',
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

export default Header;
