'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface OverlayViewProps {
  referenceImage: string;
  generatedImage: string;
  sectionName: string;
}

export function OverlayView({
  referenceImage,
  generatedImage,
  sectionName,
}: OverlayViewProps) {
  const [opacity, setOpacity] = useState(50);

  return (
    <div className="space-y-4">
      {/* Overlay Container */}
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
        {/* Reference (bottom layer) */}
        {referenceImage && (
          <Image
            src={referenceImage}
            alt={`Reference: ${sectionName}`}
            fill
            className="object-contain"
            unoptimized
          />
        )}

        {/* Generated (top layer with opacity) */}
        {generatedImage && (
          <div
            className="absolute inset-0"
            style={{ opacity: opacity / 100 }}
          >
            <Image
              src={generatedImage}
              alt={`Generated: ${sectionName}`}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        )}

        {/* Labels */}
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          Reference (bottom)
        </div>
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          Generated (top): {opacity}%
        </div>
      </div>

      {/* Opacity Slider */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 w-20">Reference</span>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <span className="text-sm text-gray-600 w-20 text-right">Generated</span>
      </div>

      {/* Quick buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setOpacity(0)}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          Show Reference
        </button>
        <button
          onClick={() => setOpacity(50)}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          50/50
        </button>
        <button
          onClick={() => setOpacity(100)}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          Show Generated
        </button>
      </div>
    </div>
  );
}

export default OverlayView;
