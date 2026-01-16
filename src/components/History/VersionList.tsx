'use client';

import React from 'react';
import type { Version } from '@/types';
import { VersionCard } from './VersionCard';

interface VersionListProps {
  versions: Version[];
  onActivate?: (versionId: string) => void;
  onRollback?: (versionId: string) => void;
  showActions?: boolean;
}

export function VersionList({
  versions,
  onActivate,
  onRollback,
  showActions = true,
}: VersionListProps) {
  // Sort versions by created_at descending (newest first)
  const sortedVersions = [...versions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Empty state
  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-16 h-16 mb-4 text-gray-300">
          <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-full h-full"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No versions yet
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Versions will appear here automatically when you generate or modify your website.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Version History
        </h2>
        <span className="text-sm text-gray-500">
          {versions.length} {versions.length === 1 ? 'version' : 'versions'}
        </span>
      </div>

      {/* Version List */}
      <div className="space-y-3">
        {sortedVersions.map((version) => (
          <VersionCard
            key={version.id}
            version={version}
            onActivate={onActivate}
            onRollback={onRollback}
            showActions={showActions}
          />
        ))}
      </div>
    </div>
  );
}

export default VersionList;
