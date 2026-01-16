'use client';

import React, { useState } from 'react';
import type { Version } from '@/types';

interface CompareSelectorProps {
  versions: Version[];
  onCompare: (versionAId: string, versionBId: string) => void;
}

export function CompareSelector({ versions, onCompare }: CompareSelectorProps) {
  const [versionAId, setVersionAId] = useState<string>('');
  const [versionBId, setVersionBId] = useState<string>('');

  const versionA = versions.find((v) => v.id === versionAId);
  const versionB = versions.find((v) => v.id === versionBId);

  const handleSwap = () => {
    const tempId = versionAId;
    setVersionAId(versionBId);
    setVersionBId(tempId);
  };

  const handleCompare = () => {
    if (versionAId && versionBId) {
      onCompare(versionAId, versionBId);
    }
  };

  const canCompare = versionAId && versionBId && versionAId !== versionBId;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Compare Versions</h3>
        <p className="text-sm text-gray-500 mt-1">
          Select two versions to compare side-by-side
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Version Selectors */}
        <div className="space-y-3">
          {/* Version A Selector */}
          <div>
            <label
              htmlFor="version-a"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Version A
            </label>
            <select
              id="version-a"
              value={versionAId}
              onChange={(e) => setVersionAId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a version...</option>
              {versions.map((version) => (
                <option key={version.id} value={version.id}>
                  v{version.version_number} -{' '}
                  {new Date(version.created_at).toLocaleDateString()}
                  {version.is_active === 1 ? ' (Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwap}
              disabled={!versionAId && !versionBId}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Swap versions"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </button>
          </div>

          {/* Version B Selector */}
          <div>
            <label
              htmlFor="version-b"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Version B
            </label>
            <select
              id="version-b"
              value={versionBId}
              onChange={(e) => setVersionBId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a version...</option>
              {versions.map((version) => (
                <option key={version.id} value={version.id}>
                  v{version.version_number} -{' '}
                  {new Date(version.created_at).toLocaleDateString()}
                  {version.is_active === 1 ? ' (Active)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Versions Preview */}
        {(versionA || versionB) && (
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700">
              Selected Versions
            </h4>

            {/* Version A Preview */}
            {versionA && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-blue-900">
                    Version A: v{versionA.version_number}
                  </span>
                  {versionA.is_active === 1 && (
                    <span className="px-2 py-0.5 text-xs font-medium text-white bg-blue-600 rounded">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-blue-700">
                  {new Date(versionA.created_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {versionA.changelog && (
                  <p className="text-xs text-blue-600 mt-2">
                    {versionA.changelog.split('\n')[0]}
                  </p>
                )}
              </div>
            )}

            {/* Version B Preview */}
            {versionB && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-purple-900">
                    Version B: v{versionB.version_number}
                  </span>
                  {versionB.is_active === 1 && (
                    <span className="px-2 py-0.5 text-xs font-medium text-white bg-purple-600 rounded">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-purple-700">
                  {new Date(versionB.created_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {versionB.changelog && (
                  <p className="text-xs text-purple-600 mt-2">
                    {versionB.changelog.split('\n')[0]}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Compare Button */}
        <button
          onClick={handleCompare}
          disabled={!canCompare}
          className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {!versionAId || !versionBId
            ? 'Select two versions to compare'
            : versionAId === versionBId
              ? 'Please select different versions'
              : 'Compare Versions'}
        </button>
      </div>
    </div>
  );
}

export default CompareSelector;
