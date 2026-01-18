'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { UrlInput } from '@/components/Dashboard/UrlInput';
import { StatusBar } from '@/components/Dashboard/StatusBar';
import { ProjectList } from '@/components/Dashboard/ProjectList';
import { ErrorRecoveryPanel } from '@/components/Dashboard/ErrorRecoveryPanel';
import { ApprovalGate } from '@/components/Dashboard/ApprovalGate';
import { useStore, useExtractionErrors, useExtractionStatus, useCurrentWebsiteId } from '@/store/useStore';
import { isValidUrl, cn } from '@/lib/utils';
import type { Website, StartExtractionResponse } from '@/types';

/**
 * Main Dashboard Page
 * Features:
 * - URL input with validation
 * - Template Mode toggle
 * - Start Extraction button
 * - Real-time status bar
 * - Error recovery panel
 * - Project history list
 */
export default function Home() {
  // URL input state
  const [url, setUrl] = useState('');
  const [isUrlValid, setIsUrlValid] = useState(false);

  // Template Mode toggle
  const [isTemplateMode, setIsTemplateMode] = useState(false);

  // Approval gate toggle - pause after component generation for review
  const [requireApproval, setRequireApproval] = useState(true);

  // Projects state
  const [projects, setProjects] = useState<Website[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Loading state for extraction
  const [isStarting, setIsStarting] = useState(false);

  // Approval gate state
  const [awaitingApprovalWebsite, setAwaitingApprovalWebsite] = useState<Website | null>(null);

  // Store state and actions
  const { isRunning } = useExtractionStatus();
  const errors = useExtractionErrors();
  const store = useStore();
  const currentWebsiteId = useCurrentWebsiteId();

  /**
   * Validate URL when input changes
   */
  useEffect(() => {
    setIsUrlValid(isValidUrl(url));
  }, [url]);

  /**
   * Fetch projects on mount
   */
  useEffect(() => {
    fetchProjects();
  }, []);

  /**
   * Poll for status updates when extraction is running
   */
  useEffect(() => {
    if (!isRunning || !currentWebsiteId) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/status?websiteId=${currentWebsiteId}`);
        if (response.ok) {
          const data = await response.json();

          // Check if extraction is complete
          if (data.phase === 8 || data.progress === 100) {
            store.completeExtraction();
            // Refresh project list after a small delay to ensure database is updated
            setTimeout(() => {
              fetchProjects();
            }, 500);
          } else {
            // Update store with current progress
            store.updateFromStatus({
              phase: data.phase,
              subStatus: data.subStatus,
              progress: data.progress,
              isRunning: true,
              errors: data.errors,
            });
          }
        }
      } catch {
        // Silently fail - will retry on next poll
      }
    };

    // Poll immediately
    pollStatus();

    // Then poll every 1 second
    const interval = setInterval(pollStatus, 1000);

    return () => clearInterval(interval);
  }, [isRunning, currentWebsiteId, store]);

  /**
   * Fetch project history from API
   * Also checks for in-progress or awaiting_approval extractions
   */
  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const response = await fetch('/api/websites');
      if (response.ok) {
        const data = await response.json();
        const websites = data.websites || [];
        setProjects(websites);

        // Check for awaiting_approval extractions
        const awaitingApproval = websites.find((w: Website) => w.status === 'awaiting_approval');
        if (awaitingApproval) {
          setAwaitingApprovalWebsite(awaitingApproval);
        } else {
          setAwaitingApprovalWebsite(null);
        }

        // Check for in-progress extractions to resume polling after refresh
        const inProgressWebsite = websites.find((w: Website) => w.status === 'in_progress');
        if (inProgressWebsite && !isRunning) {
          // Resume extraction polling
          store.setWebsiteId(inProgressWebsite.id);
          store.startExtraction(inProgressWebsite.reference_url);
        }
      }
    } catch {
      // Silently fail - empty project list is acceptable
    } finally {
      setIsLoadingProjects(false);
    }
  };

  /**
   * Handle Start Extraction button click
   */
  const handleStartExtraction = async () => {
    if (!isUrlValid || isStarting || isRunning) return;

    try {
      setIsStarting(true);

      // If template mode is enabled, redirect to template page
      if (isTemplateMode) {
        window.location.href = `/template?url=${encodeURIComponent(url)}`;
        return;
      }

      // Start extraction via API
      const response = await fetch('/api/start-extraction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          mode: 'single',
          requireApproval, // Pause after component generation for review
        }),
      });

      const data: StartExtractionResponse = await response.json();

      if (data.success) {
        // Update store with extraction state
        store.startExtraction(url);
        store.setWebsiteId(data.websiteId);

        // Refresh project list
        await fetchProjects();

        // Clear URL input
        setUrl('');
      } else {
        // Show error in store
        store.setError({
          id: `error-${Date.now()}`,
          phase: 0,
          message: data.error || 'Failed to start extraction',
          timestamp: new Date().toISOString(),
          recoverable: true,
        });
      }
    } catch (error) {
      store.setError({
        id: `error-${Date.now()}`,
        phase: 0,
        message: 'Network error. Please check your connection.',
        timestamp: new Date().toISOString(),
        recoverable: true,
      });
    } finally {
      setIsStarting(false);
    }
  };

  /**
   * Handle project selection - navigate to preview page
   */
  const handleSelectProject = useCallback((project: Website) => {
    window.location.href = `/preview/${project.id}`;
  }, []);

  /**
   * Handle project deletion
   */
  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      const response = await fetch(`/api/websites?id=${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      }
    } catch (error) {
      // Silently fail - project may already be deleted
    }
  }, []);

  /**
   * Handle error retry
   */
  const handleRetryError = useCallback(
    (errorId: string) => {
      store.clearError(errorId);
      // Future: Implement actual retry logic
    },
    [store]
  );

  /**
   * Handle error skip
   */
  const handleSkipError = useCallback(
    (errorId: string) => {
      store.clearError(errorId);
    },
    [store]
  );

  /**
   * Handle retry all errors
   */
  const handleRetryAll = useCallback(() => {
    errors.forEach((error) => {
      if (error.recoverable) {
        store.clearError(error.id);
      }
    });
    // Future: Implement actual retry logic
  }, [errors, store]);

  /**
   * Handle skip all errors
   */
  const handleSkipAll = useCallback(() => {
    errors.forEach((error) => {
      store.clearError(error.id);
    });
  }, [errors, store]);

  /**
   * Handle dismiss error panel
   */
  const handleDismissErrors = useCallback(() => {
    store.reset();
  }, [store]);

  /**
   * Handle approval gate - approve and continue pipeline
   */
  const handleApproveExtraction = useCallback(() => {
    // Clear the awaiting approval state and resume polling
    if (awaitingApprovalWebsite) {
      store.setWebsiteId(awaitingApprovalWebsite.id);
      store.startExtraction(awaitingApprovalWebsite.reference_url);
    }
    setAwaitingApprovalWebsite(null);
    fetchProjects();
  }, [awaitingApprovalWebsite, store]);

  /**
   * Handle approval gate - reject extraction
   */
  const handleRejectExtraction = useCallback(() => {
    setAwaitingApprovalWebsite(null);
    fetchProjects();
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[rgb(var(--border)/0.3)] bg-[rgb(var(--background))]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">
            Website Cooker
          </h1>

          {/* Template Mode Toggle */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="template-mode"
              className="text-sm text-[rgb(var(--muted-foreground))]"
            >
              Template Mode
            </label>
            <button
              id="template-mode"
              type="button"
              role="switch"
              aria-checked={isTemplateMode}
              onClick={() => setIsTemplateMode(!isTemplateMode)}
              className={cn(
                'w-11 h-6 rounded-full relative',
                isTemplateMode ? 'bg-[rgb(var(--accent))]' : 'bg-[rgb(var(--muted))]',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring)/0.3)]',
                'transition-colors duration-200'
              )}
            >
              <span
                className={cn(
                  'block w-5 h-5 rounded-full bg-white shadow-md',
                  'absolute top-0.5 transition-transform duration-200',
                  isTemplateMode ? 'translate-x-[22px]' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start py-12 px-6">
        {/* URL Input Section */}
        <section className="w-full max-w-2xl mb-8">
          <UrlInput
            value={url}
            onChange={setUrl}
            isValid={isUrlValid}
            disabled={isRunning || isStarting}
          />

          {/* Template Mode Info */}
          {isTemplateMode && (
            <div className="mt-4 p-4 rounded-lg bg-[rgb(var(--accent)/0.1)] border border-[rgb(var(--accent)/0.3)]">
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[rgb(var(--accent))] flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div>
                  <p className="text-sm text-[rgb(var(--foreground))]">
                    Template Mode is enabled
                  </p>
                  <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                    Add multiple reference URLs and mix sections from different websites.{' '}
                    <Link
                      href="/template"
                      className="text-[rgb(var(--accent))] hover:underline"
                    >
                      Go to Template Mode →
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Approval Gate Option */}
          {!isTemplateMode && (
            <div className="mt-4 flex items-center gap-3">
              <input
                type="checkbox"
                id="require-approval"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                disabled={isRunning || isStarting}
                className={cn(
                  'w-4 h-4 rounded border-[rgb(var(--border))]',
                  'text-[rgb(var(--accent))] focus:ring-[rgb(var(--accent)/0.3)]',
                  'disabled:opacity-50'
                )}
              />
              <label
                htmlFor="require-approval"
                className="text-sm text-[rgb(var(--muted-foreground))]"
              >
                Pause for approval after component generation
              </label>
            </div>
          )}

          {/* Start Extraction Button */}
          <button
            onClick={handleStartExtraction}
            disabled={!isUrlValid || isRunning || isStarting}
            className={cn(
              'w-full mt-4 py-3 px-6 rounded-lg font-medium text-white',
              'bg-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.9)]',
              'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent)/0.3)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-200',
              'flex items-center justify-center gap-2'
            )}
          >
            {isStarting || isRunning ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
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
                {isRunning ? 'Extracting...' : 'Starting...'}
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                {isTemplateMode ? 'Configure Template' : 'Start Extraction'}
              </>
            )}
          </button>
        </section>

        {/* Status Bar */}
        <section className="w-full max-w-2xl mb-8">
          <StatusBar />
        </section>

        {/* Approval Gate */}
        {awaitingApprovalWebsite && (
          <section className="w-full max-w-2xl mb-8">
            <ApprovalGate
              websiteId={awaitingApprovalWebsite.id}
              websiteName={awaitingApprovalWebsite.name}
              onApprove={handleApproveExtraction}
              onReject={handleRejectExtraction}
            />
          </section>
        )}

        {/* Error Recovery Panel */}
        {errors.length > 0 && (
          <section className="w-full max-w-2xl mb-8">
            <ErrorRecoveryPanel
              errors={errors}
              onRetry={handleRetryError}
              onSkip={handleSkipError}
              onRetryAll={handleRetryAll}
              onSkipAll={handleSkipAll}
              onDismiss={handleDismissErrors}
            />
          </section>
        )}

        {/* Project List */}
        <section className="w-full max-w-2xl">
          <ProjectList
            projects={projects}
            onSelect={handleSelectProject}
            onDelete={handleDeleteProject}
            isLoading={isLoadingProjects}
          />
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-[rgb(var(--border)/0.3)] bg-[rgb(var(--background))]">
        <div className="max-w-5xl mx-auto px-6 py-4 text-center">
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Website Cooker - Extract, replicate, and customize any website design
          </p>
        </div>
      </footer>
    </main>
  );
}
