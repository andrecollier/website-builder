'use client';

import React from 'react';

interface HeaderProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Header - Semantic variant
 *
 * Clean code architecture with proper HTML semantics.
 * Uses semantic <header> element with role="banner".
 */
export function Header({ className, children }: HeaderProps) {
  return (
    <header role="banner"
      className={`${className || ''}`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="logo">
          {/* Logo */}
        </div>
        <nav className="navigation">
          {/* Navigation links */}
        </nav>
        <div className="actions">
          {/* CTA buttons */}
        </div>
      </div>
    </header>
  );
}

export default Header;
