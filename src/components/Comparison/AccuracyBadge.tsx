'use client';

import React from 'react';

interface AccuracyBadgeProps {
  accuracy: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AccuracyBadge({ accuracy, size = 'md' }: AccuracyBadgeProps) {
  const getColor = () => {
    if (accuracy >= 90) return 'bg-green-500/10 text-green-600 border-green-500/20';
    if (accuracy >= 80) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  };

  const getIcon = () => {
    if (accuracy >= 90) return '✓';
    if (accuracy >= 80) return '~';
    return '✗';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${getColor()} ${sizeClasses[size]}`}
    >
      <span>{getIcon()}</span>
      <span>{accuracy.toFixed(1)}%</span>
    </span>
  );
}

export default AccuracyBadge;
