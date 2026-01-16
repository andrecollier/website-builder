'use client';

import React from 'react';
import type { ChangelogEntry } from '@/types';

interface ChangelogViewProps {
  entries: ChangelogEntry[];
}

function getChangeIcon(type: ChangelogEntry['type']): string {
  switch (type) {
    case 'color':
      return '🎨';
    case 'typography':
      return '✍️';
    case 'spacing':
      return '📏';
    case 'effects':
      return '✨';
    case 'component':
      return '🧩';
    case 'layout':
      return '📐';
    case 'other':
    default:
      return '📝';
  }
}

function getChangeColor(type: ChangelogEntry['type']): string {
  switch (type) {
    case 'color':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'typography':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'spacing':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'effects':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'component':
      return 'bg-pink-100 text-pink-700 border-pink-200';
    case 'layout':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'other':
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ChangelogView({ entries }: ChangelogViewProps) {
  if (!entries || entries.length === 0) {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-600">Changelog</h4>
        <div className="flex items-center justify-center py-12 text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm">No changes recorded</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-600">Changelog</h4>
        <span className="text-xs text-gray-500">
          {entries.length} {entries.length === 1 ? 'change' : 'changes'}
        </span>
      </div>

      {/* Changelog Entries */}
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-3 rounded-lg border ${getChangeColor(entry.type)} transition-colors hover:shadow-sm`}
          >
            {/* Icon */}
            <div className="text-xl flex-shrink-0 mt-0.5">
              {getChangeIcon(entry.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-relaxed">
                {entry.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium capitalize">
                  {entry.type}
                </span>
                <span className="text-xs opacity-60">
                  {formatTimestamp(entry.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Changes are listed in chronological order
        </p>
      </div>
    </div>
  );
}

export default ChangelogView;
