'use client';

import React from 'react';
import type { Version } from '@/types';

interface VersionCardProps {
  version: Version;
  onActivate?: (versionId: string) => void;
  onRollback?: (versionId: string) => void;
  showActions?: boolean;
}

export function VersionCard({
  version,
  onActivate,
  onRollback,
  showActions = true,
}: VersionCardProps) {
  const isActive = version.is_active === 1;
  const formattedDate = new Date(version.created_at).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Parse changelog summary (first line only)
  const changelogSummary = version.changelog
    ? version.changelog.split('\n')[0]
    : 'No changelog available';

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all ${
        isActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-900">
            v{version.version_number}
          </span>
          {isActive && (
            <span className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded">
              Active
            </span>
          )}
          {version.parent_version_id && (
            <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
              Rollback
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">{formattedDate}</span>
      </div>

      {/* Content */}
      <div className="px-4 py-3 border-t border-gray-200">
        {/* Changelog Summary */}
        <p className="text-sm text-gray-700 mb-3">{changelogSummary}</p>

        {/* Accuracy Score */}
        {version.accuracy_score !== null && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500">Accuracy:</span>
            <div className="flex items-center gap-1">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
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
              <span className="text-xs font-medium text-gray-700">
                {(version.accuracy_score * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2">
            {!isActive && onActivate && (
              <button
                onClick={() => onActivate(version.id)}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
              >
                Activate
              </button>
            )}
            {onRollback && (
              <button
                onClick={() => onRollback(version.id)}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Rollback to this
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VersionCard;
