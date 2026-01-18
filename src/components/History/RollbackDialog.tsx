'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Version } from '@/types';

interface RollbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetVersion: Version | null;
  currentVersion: Version | null;
  isLoading?: boolean;
}

export function RollbackDialog({
  isOpen,
  onClose,
  onConfirm,
  targetVersion,
  currentVersion,
  isLoading = false,
}: RollbackDialogProps) {
  if (!targetVersion) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-50">
          {/* Header */}
          <Dialog.Title className="text-xl font-semibold text-gray-900 mb-2">
            Confirm Rollback
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 mb-6">
            This will create a new version based on the selected version&apos;s state
          </Dialog.Description>

          {/* Non-Destructive Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Non-Destructive Rollback
                </p>
                <p className="text-sm text-blue-700">
                  This operation creates a <strong>new version</strong> with the content from version{' '}
                  <strong>v{targetVersion.version_number}</strong>. Your version history will be preserved.
                </p>
              </div>
            </div>
          </div>

          {/* Version Info */}
          <div className="space-y-4 mb-6">
            {/* Current Version */}
            {currentVersion && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    Current Version
                  </span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                    Active
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-semibold text-gray-900">
                    v{currentVersion.version_number}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(currentVersion.created_at)}
                  </span>
                </div>
                {currentVersion.changelog && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {currentVersion.changelog.split('\n')[0]}
                  </p>
                )}
              </div>
            )}

            {/* Arrow */}
            <div className="flex justify-center">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>

            {/* Target Version */}
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-purple-700 uppercase">
                  Rolling Back To
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-purple-900">
                  v{targetVersion.version_number}
                </span>
                <span className="text-sm text-purple-600">
                  {formatDate(targetVersion.created_at)}
                </span>
              </div>
              {targetVersion.changelog && (
                <p className="text-sm text-purple-700 mt-2 line-clamp-2">
                  {targetVersion.changelog.split('\n')[0]}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Rolling Back...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
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
                  Confirm Rollback
                </>
              )}
            </button>
          </div>

          {/* Close Button */}
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
              disabled={isLoading}
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default RollbackDialog;
