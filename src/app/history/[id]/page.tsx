'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  VersionList,
  VersionTimeline,
  CompareSelector,
  DiffViewer,
  RollbackDialog,
  ChangelogView,
} from '@/components/History';
import type { Version, ChangelogEntry } from '@/types';

interface VersionsResponse {
  success: boolean;
  versions?: Version[];
  error?: string;
}

interface ActivateResponse {
  success: boolean;
  version?: Version;
  error?: string;
}

interface RollbackResponse {
  success: boolean;
  newVersion?: Version;
  targetVersion?: Version;
  error?: string;
}

export default function HistoryPage() {
  const params = useParams();
  const websiteId = params.id as string;

  // State
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<Version | null>(null);
  const [compareVersionA, setCompareVersionA] = useState<string | null>(null);
  const [compareVersionB, setCompareVersionB] = useState<string | null>(null);

  // Derived state
  const selectedVersion = versions.find((v) => v.id === selectedVersionId) || null;
  const currentVersion = versions.find((v) => v.is_active === 1) || null;
  const changelogEntries: ChangelogEntry[] = selectedVersion?.changelog
    ? parseChangelog(selectedVersion.changelog)
    : [];

  /**
   * Parse changelog string into ChangelogEntry array
   */
  function parseChangelog(changelog: string): ChangelogEntry[] {
    if (!changelog) return [];

    const lines = changelog.split('\n').filter((line) => line.trim());
    return lines.map((line) => ({
      type: detectChangeType(line),
      description: line.trim(),
      timestamp: selectedVersion?.created_at || new Date().toISOString(),
    }));
  }

  /**
   * Detect change type from description
   */
  function detectChangeType(description: string): ChangelogEntry['type'] {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('color') || lowerDesc.includes('palette')) return 'color';
    if (lowerDesc.includes('font') || lowerDesc.includes('typography') || lowerDesc.includes('text')) return 'typography';
    if (lowerDesc.includes('spacing') || lowerDesc.includes('padding') || lowerDesc.includes('margin')) return 'spacing';
    if (lowerDesc.includes('shadow') || lowerDesc.includes('effect') || lowerDesc.includes('border')) return 'effects';
    if (lowerDesc.includes('component')) return 'component';
    if (lowerDesc.includes('layout') || lowerDesc.includes('structure')) return 'layout';
    return 'other';
  }

  /**
   * Fetch versions on mount
   */
  useEffect(() => {
    async function fetchVersions() {
      try {
        const response = await fetch(`/api/versions?websiteId=${websiteId}`);
        const data: VersionsResponse = await response.json();

        if (data.success && data.versions) {
          setVersions(data.versions);
          // Auto-select active version
          const active = data.versions.find((v) => v.is_active === 1);
          if (active) {
            setSelectedVersionId(active.id);
          }
        } else {
          setError(data.error || 'Failed to load versions');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchVersions();
  }, [websiteId]);

  /**
   * Handle version activation
   */
  const handleActivate = useCallback(async (versionId: string) => {
    setIsActivating(true);
    setError(null);

    try {
      const response = await fetch(`/api/versions/${versionId}/activate`, {
        method: 'POST',
      });

      const data: ActivateResponse = await response.json();

      if (data.success && data.version) {
        // Update versions in state
        setVersions((prev) =>
          prev.map((v) => ({
            ...v,
            is_active: v.id === versionId ? 1 : 0,
          }))
        );
      } else {
        setError(data.error || 'Failed to activate version');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsActivating(false);
    }
  }, []);

  /**
   * Handle rollback initiation
   */
  const handleRollback = useCallback((versionId: string) => {
    const target = versions.find((v) => v.id === versionId);
    if (target) {
      setRollbackTarget(target);
    }
  }, [versions]);

  /**
   * Handle rollback confirmation
   */
  const handleRollbackConfirm = useCallback(async () => {
    if (!rollbackTarget) return;

    setIsRollingBack(true);
    setError(null);

    try {
      const response = await fetch(`/api/versions/${rollbackTarget.id}/rollback`, {
        method: 'POST',
      });

      const data: RollbackResponse = await response.json();

      if (data.success && data.newVersion) {
        // Add new version to list and set as active
        setVersions((prev) => [
          ...prev.map((v) => ({ ...v, is_active: 0 })),
          data.newVersion!,
        ]);
        setSelectedVersionId(data.newVersion.id);
        setRollbackTarget(null);
      } else {
        setError(data.error || 'Failed to rollback version');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRollingBack(false);
    }
  }, [rollbackTarget]);

  /**
   * Handle version comparison
   */
  const handleCompare = useCallback((versionAId: string, versionBId: string) => {
    setCompareVersionA(versionAId);
    setCompareVersionB(versionBId);
  }, []);

  /**
   * Handle version selection from timeline
   */
  const handleVersionClick = useCallback((versionId: string) => {
    setSelectedVersionId(versionId);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading version history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">
                Version History
              </h1>
            </div>

            {currentVersion && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Current:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg">
                  v{currentVersion.version_number}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Three Column Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: Timeline */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
              <VersionTimeline
                versions={versions}
                onVersionClick={handleVersionClick}
              />
            </div>
          </div>

          {/* Middle Column: Version List & Changelog */}
          <div className="col-span-5">
            <div className="space-y-6">
              {/* Version List */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <VersionList
                  versions={versions}
                  onActivate={handleActivate}
                  onRollback={handleRollback}
                  showActions={!isActivating}
                />
              </div>

              {/* Selected Version Details */}
              {selectedVersion && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        v{selectedVersion.version_number}
                      </h2>
                      {selectedVersion.is_active === 1 && (
                        <span className="px-2 py-0.5 text-xs font-medium text-white bg-blue-600 rounded">
                          Active
                        </span>
                      )}
                      {selectedVersion.parent_version_id && (
                        <span className="px-2 py-0.5 text-xs font-medium text-purple-700 bg-purple-100 rounded">
                          Rollback
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedVersion.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Accuracy Score */}
                  {selectedVersion.accuracy_score !== null && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Accuracy Score
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {(selectedVersion.accuracy_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            selectedVersion.accuracy_score >= 0.9
                              ? 'bg-green-500'
                              : selectedVersion.accuracy_score >= 0.75
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${selectedVersion.accuracy_score * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Changelog */}
                  <ChangelogView entries={changelogEntries} />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Compare & Diff Viewer */}
          <div className="col-span-4">
            <div className="space-y-6 sticky top-4">
              {/* Compare Selector */}
              <CompareSelector
                versions={versions}
                onCompare={handleCompare}
              />

              {/* Diff Viewer */}
              {compareVersionA && compareVersionB && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Visual Comparison
                  </h3>
                  <DiffViewer
                    previousImage=""
                    currentImage=""
                    sectionName="Version Comparison"
                    previousLabel={`v${versions.find((v) => v.id === compareVersionA)?.version_number || '?'}`}
                    currentLabel={`v${versions.find((v) => v.id === compareVersionB)?.version_number || '?'}`}
                  />
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Visual comparison feature coming soon
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Rollback Dialog */}
      <RollbackDialog
        isOpen={rollbackTarget !== null}
        onClose={() => setRollbackTarget(null)}
        onConfirm={handleRollbackConfirm}
        targetVersion={rollbackTarget}
        currentVersion={currentVersion}
        isLoading={isRollingBack}
      />
    </div>
  );
}
