'use client';

import React from 'react';
import Image from 'next/image';

interface DiffViewProps {
  diffImage: string;
  sectionName: string;
  mismatchedPixels: number;
  totalPixels: number;
}

export function DiffView({
  diffImage,
  sectionName,
  mismatchedPixels,
  totalPixels,
}: DiffViewProps) {
  const mismatchPercentage = totalPixels > 0
    ? ((mismatchedPixels / totalPixels) * 100).toFixed(2)
    : '0';

  return (
    <div className="space-y-4">
      {/* Diff Image */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-600">
          Difference Map
          <span className="ml-2 text-red-500 text-xs">
            (Red = different pixels)
          </span>
        </h4>
        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
          {diffImage ? (
            <Image
              src={diffImage}
              alt={`Diff: ${sectionName}`}
              fill
              className="object-contain"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No diff image available
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-6 text-sm">
        <div>
          <span className="text-gray-500">Mismatched pixels:</span>{' '}
          <span className="font-mono text-red-500">
            {mismatchedPixels.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Total pixels:</span>{' '}
          <span className="font-mono">
            {totalPixels.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Mismatch rate:</span>{' '}
          <span className="font-mono text-red-500">
            {mismatchPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default DiffView;
