'use client';

import React from 'react';
import type { Version } from '@/types';

interface VersionTimelineProps {
  versions: Version[];
  onVersionClick?: (versionId: string) => void;
}

export function VersionTimeline({ versions, onVersionClick }: VersionTimelineProps) {
  // Sort versions by created_at descending (newest first)
  const sortedVersions = [...versions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (sortedVersions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-12 h-12 mb-3 text-gray-300">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-500">No versions yet</p>
      </div>
    );
  }

  return (
    <div className="relative py-4 px-2">
      {/* Vertical timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

      {/* Version nodes */}
      <div className="space-y-6">
        {sortedVersions.map((version, index) => {
          const isActive = version.is_active === 1;
          const isRollback = version.parent_version_id !== null;
          const formattedDate = new Date(version.created_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div key={version.id} className="relative flex items-start gap-4">
              {/* Timeline node */}
              <div className="relative flex-shrink-0 z-10">
                <button
                  onClick={() => onVersionClick?.(version.id)}
                  className={`w-8 h-8 rounded-full border-4 transition-all ${
                    isActive
                      ? 'bg-blue-600 border-blue-200 ring-4 ring-blue-100'
                      : isRollback
                        ? 'bg-purple-500 border-purple-200 hover:ring-4 hover:ring-purple-100'
                        : 'bg-white border-gray-300 hover:border-gray-400 hover:ring-4 hover:ring-gray-100'
                  }`}
                  title={`v${version.version_number}`}
                >
                  {/* Inner dot for active version */}
                  {isActive && (
                    <div className="absolute inset-2 bg-white rounded-full" />
                  )}
                  {/* Rollback indicator */}
                  {isRollback && !isActive && (
                    <svg
                      className="absolute inset-1 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                      />
                    </svg>
                  )}
                </button>

                {/* Connection line to parent for rollback versions */}
                {isRollback && version.parent_version_id && (
                  <div className="absolute top-8 left-4 w-px h-12 bg-purple-300 border-l-2 border-dashed border-purple-400" />
                )}
              </div>

              {/* Version info */}
              <div className="flex-1 pb-6">
                <button
                  onClick={() => onVersionClick?.(version.id)}
                  className="text-left w-full group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`font-semibold transition-colors ${
                        isActive
                          ? 'text-blue-700'
                          : 'text-gray-900 group-hover:text-blue-600'
                      }`}
                    >
                      v{version.version_number}
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 text-xs font-medium text-white bg-blue-600 rounded">
                        Active
                      </span>
                    )}
                    {isRollback && (
                      <span className="px-2 py-0.5 text-xs font-medium text-purple-700 bg-purple-100 rounded">
                        Rollback
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{formattedDate}</p>
                  {version.changelog && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {version.changelog.split('\n')[0]}
                    </p>
                  )}
                  {version.accuracy_score !== null && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            version.accuracy_score >= 0.9
                              ? 'bg-green-500'
                              : version.accuracy_score >= 0.75
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${version.accuracy_score * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {(version.accuracy_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VersionTimeline;
