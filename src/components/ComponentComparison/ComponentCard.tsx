'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { AccuracyBadge } from '@/components/Comparison';

type ViewMode = 'side-by-side' | 'overlay' | 'diff';

export interface ComponentData {
  sectionName: string;
  sectionType: string;
  accuracy: number;
  mismatchedPixels?: number;
  totalPixels?: number;
  diffImagePath: string;
  referenceImagePath: string;
  generatedImagePath: string;
}

interface ComponentCardProps {
  component: ComponentData;
  referenceImage: string;
  generatedImage: string;
  diffImage: string;
  defaultExpanded?: boolean;
  rank?: number;
}

export function ComponentCard({
  component,
  referenceImage,
  generatedImage,
  diffImage,
  defaultExpanded = false,
  rank,
}: ComponentCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [overlayOpacity, setOverlayOpacity] = useState(50);

  const viewModes: { id: ViewMode; label: string; icon: string }[] = [
    { id: 'side-by-side', label: 'Side-by-Side', icon: '⬛⬛' },
    { id: 'overlay', label: 'Overlay', icon: '◐' },
    { id: 'diff', label: 'Diff', icon: '△' },
  ];

  const getStatusColor = (accuracy: number) => {
    if (accuracy >= 90) return 'border-l-green-500';
    if (accuracy >= 80) return 'border-l-yellow-500';
    return 'border-l-red-500';
  };

  const getStatusBg = (accuracy: number) => {
    if (accuracy >= 90) return 'bg-green-50';
    if (accuracy >= 80) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const formatSectionName = (name: string) => {
    // Convert "01-header" to "Header" or "03-features" to "Features"
    return name
      .replace(/^\d+-/, '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div
      className={`border border-gray-200 rounded-lg overflow-hidden border-l-4 ${getStatusColor(component.accuracy)} transition-all duration-200 hover:shadow-md`}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-3 flex items-center justify-between ${getStatusBg(component.accuracy)} hover:brightness-95 transition-all`}
      >
        <div className="flex items-center gap-3">
          {rank !== undefined && (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-xs font-bold text-gray-600">
              {rank}
            </span>
          )}
          <div className="flex flex-col items-start">
            <span className="text-lg font-medium text-gray-900">
              {formatSectionName(component.sectionName)}
            </span>
            <span className="text-xs text-gray-500 capitalize">
              {component.sectionType} - {component.sectionName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {component.accuracy < 80 && (
            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
              Needs attention
            </span>
          )}
          <AccuracyBadge accuracy={component.accuracy} />
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
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
        <div className="p-4 space-y-4 bg-white">
          {/* View Mode Tabs */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <div className="flex gap-1">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    viewMode === mode.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="opacity-60">{mode.icon}</span>
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Stats summary */}
            <div className="text-sm text-gray-500">
              {component.mismatchedPixels !== undefined && component.totalPixels !== undefined && (
                <span>
                  {component.mismatchedPixels.toLocaleString()} / {component.totalPixels.toLocaleString()} pixels differ
                </span>
              )}
            </div>
          </div>

          {/* View Content */}
          <div className="pt-2">
            {viewMode === 'side-by-side' && (
              <div className="grid grid-cols-3 gap-4">
                {/* Reference Image */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Reference
                  </h4>
                  <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {referenceImage ? (
                      <Image
                        src={referenceImage}
                        alt={`Reference: ${component.sectionName}`}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        No reference image
                      </div>
                    )}
                  </div>
                </div>

                {/* Generated Image */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Generated
                  </h4>
                  <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {generatedImage ? (
                      <Image
                        src={generatedImage}
                        alt={`Generated: ${component.sectionName}`}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        No generated image
                      </div>
                    )}
                  </div>
                </div>

                {/* Diff Image */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Difference
                  </h4>
                  <div className="relative aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                    {diffImage ? (
                      <Image
                        src={diffImage}
                        alt={`Diff: ${component.sectionName}`}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                        No diff image
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'overlay' && (
              <div className="space-y-4">
                {/* Overlay Container */}
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  {/* Reference (bottom layer) */}
                  {referenceImage && (
                    <Image
                      src={referenceImage}
                      alt={`Reference: ${component.sectionName}`}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  )}

                  {/* Generated (top layer with opacity) */}
                  {generatedImage && (
                    <div
                      className="absolute inset-0"
                      style={{ opacity: overlayOpacity / 100 }}
                    >
                      <Image
                        src={generatedImage}
                        alt={`Generated: ${component.sectionName}`}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  )}

                  {/* Labels */}
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    Reference
                  </div>
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    Generated: {overlayOpacity}%
                  </div>
                </div>

                {/* Opacity Slider */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-24">Reference</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-sm text-gray-600 w-24 text-right">Generated</span>
                </div>

                {/* Quick buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setOverlayOpacity(0)}
                    className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    Show Reference
                  </button>
                  <button
                    onClick={() => setOverlayOpacity(50)}
                    className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    50/50
                  </button>
                  <button
                    onClick={() => setOverlayOpacity(100)}
                    className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    Show Generated
                  </button>
                </div>
              </div>
            )}

            {viewMode === 'diff' && (
              <div className="space-y-4">
                {/* Full-width Diff Image */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-600">
                    Difference Map
                    <span className="ml-2 text-red-500 text-xs font-normal">
                      (Red/magenta = different pixels)
                    </span>
                  </h4>
                  <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                    {diffImage ? (
                      <Image
                        src={diffImage}
                        alt={`Diff: ${component.sectionName}`}
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
                {component.mismatchedPixels !== undefined && component.totalPixels !== undefined && (
                  <div className="flex gap-6 text-sm bg-gray-50 p-3 rounded-lg">
                    <div>
                      <span className="text-gray-500">Mismatched pixels:</span>{' '}
                      <span className="font-mono text-red-600 font-medium">
                        {component.mismatchedPixels.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Total pixels:</span>{' '}
                      <span className="font-mono font-medium">
                        {component.totalPixels.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Match rate:</span>{' '}
                      <span className={`font-mono font-medium ${component.accuracy >= 90 ? 'text-green-600' : component.accuracy >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {component.accuracy.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ComponentCard;
