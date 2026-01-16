'use client';

import React from 'react';
import Image from 'next/image';

interface DiffViewerProps {
  previousImage: string;
  currentImage: string;
  sectionName: string;
  previousLabel?: string;
  currentLabel?: string;
}

export function DiffViewer({
  previousImage,
  currentImage,
  sectionName,
  previousLabel = 'Previous Version',
  currentLabel = 'Current Version',
}: DiffViewerProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Previous Version Image */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-600">{previousLabel}</h4>
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
          {previousImage ? (
            <Image
              src={previousImage}
              alt={`${previousLabel}: ${sectionName}`}
              fill
              className="object-contain"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No previous version
            </div>
          )}
        </div>
      </div>

      {/* Current Version Image */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-600">{currentLabel}</h4>
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
          {currentImage ? (
            <Image
              src={currentImage}
              alt={`${currentLabel}: ${sectionName}`}
              fill
              className="object-contain"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No current version
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DiffViewer;
