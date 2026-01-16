'use client';

import React from 'react';
import Image from 'next/image';

interface SideBySideViewProps {
  referenceImage: string;
  generatedImage: string;
  sectionName: string;
}

export function SideBySideView({
  referenceImage,
  generatedImage,
  sectionName,
}: SideBySideViewProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Reference Image */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-600">Original (Reference)</h4>
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
          {referenceImage ? (
            <Image
              src={referenceImage}
              alt={`Reference: ${sectionName}`}
              fill
              className="object-contain"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No reference image
            </div>
          )}
        </div>
      </div>

      {/* Generated Image */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-600">Generated</h4>
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
          {generatedImage ? (
            <Image
              src={generatedImage}
              alt={`Generated: ${sectionName}`}
              fill
              className="object-contain"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No generated image
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SideBySideView;
