'use client';

import React, { useState } from 'react';
import { AccuracyBadge } from './AccuracyBadge';
import { SideBySideView } from './SideBySideView';
import { OverlayView } from './OverlayView';
import { DiffView } from './DiffView';

type ViewMode = 'side-by-side' | 'overlay' | 'diff';

interface SectionComparisonProps {
  sectionName: string;
  sectionType: string;
  accuracy: number;
  referenceImage: string;
  generatedImage: string;
  diffImage: string;
  mismatchedPixels: number;
  totalPixels: number;
  defaultExpanded?: boolean;
}

export function SectionComparison({
  sectionName,
  sectionType,
  accuracy,
  referenceImage,
  generatedImage,
  diffImage,
  mismatchedPixels,
  totalPixels,
  defaultExpanded = false,
}: SectionComparisonProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');

  const viewModes: { id: ViewMode; label: string }[] = [
    { id: 'side-by-side', label: 'Side-by-Side' },
    { id: 'overlay', label: 'Overlay' },
    { id: 'diff', label: 'Diff' },
  ];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-medium text-gray-900">
            {sectionName}
          </span>
          <span className="text-sm text-gray-500 capitalize">
            ({sectionType})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <AccuracyBadge accuracy={accuracy} />
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* View Mode Tabs */}
          <div className="flex gap-2 border-b border-gray-200 pb-2">
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
                  viewMode === mode.id
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* View Content */}
          <div className="pt-2">
            {viewMode === 'side-by-side' && (
              <SideBySideView
                referenceImage={referenceImage}
                generatedImage={generatedImage}
                sectionName={sectionName}
              />
            )}
            {viewMode === 'overlay' && (
              <OverlayView
                referenceImage={referenceImage}
                generatedImage={generatedImage}
                sectionName={sectionName}
              />
            )}
            {viewMode === 'diff' && (
              <DiffView
                diffImage={diffImage}
                sectionName={sectionName}
                mismatchedPixels={mismatchedPixels}
                totalPixels={totalPixels}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SectionComparison;
