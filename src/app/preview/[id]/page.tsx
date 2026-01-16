'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  usePreviewStore,
  usePreviewComponents,
  useCurrentComponent,
  useCurrentComponentIndex,
  usePreviewLoading,
  usePreviewError,
  useApprovalProgress,
  useCurrentSelectedVariant,
  useCurrentHasCustomCode,
} from '@/store/usePreviewStore';
import {
  VariantSelector,
  ProgressTracker,
  ApprovalButtons,
  CodeViewer,
  CodeEditor,
  OriginalComparison,
} from '@/components/Preview';
import { cn } from '@/lib/utils';
import type { ComponentVariant } from '@/types';

/**
 * View mode for the code display panel
 */
type CodeViewMode = 'viewer' | 'editor' | 'comparison';

/**
 * Preview Page
 *
 * Features:
 * - Variant selector to choose between A/B/C variants
 * - Code viewer with syntax highlighting
 * - Code editor for inline modifications
 * - Original vs generated comparison view
 * - Approval workflow with progress tracking
 * - Navigation between components
 */
export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const websiteId = params.id as string;

  // Store state and actions
  const components = usePreviewComponents();
  const currentComponent = useCurrentComponent();
  const currentIndex = useCurrentComponentIndex();
  const isLoading = usePreviewLoading();
  const error = usePreviewError();
  const progress = useApprovalProgress();
  const selectedVariant = useCurrentSelectedVariant();
  const hasCustomCode = useCurrentHasCustomCode();

  const loadComponents = usePreviewStore((state) => state.loadComponents);
  const updateCustomCode = usePreviewStore((state) => state.updateCustomCode);
  const goToNext = usePreviewStore((state) => state.goToNext);
  const goToPrevious = usePreviewStore((state) => state.goToPrevious);
  const reset = usePreviewStore((state) => state.reset);

  // Local state
  const [codeViewMode, setCodeViewMode] = useState<CodeViewMode>('viewer');
  const [isEditorDirty, setIsEditorDirty] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isScaffolding, setIsScaffolding] = useState(false);
  const [scaffoldSuccess, setScaffoldSuccess] = useState(false);

  /**
   * Load components on mount
   */
  useEffect(() => {
    if (websiteId) {
      loadComponents(websiteId);
    }

    // Cleanup on unmount
    return () => {
      // Don't reset to preserve state when navigating back
    };
  }, [websiteId, loadComponents]);

  /**
   * Get the code to display based on current selection
   */
  const displayCode = useMemo(() => {
    if (!currentComponent) return '';

    // If there's custom code, show that
    if (currentComponent.customCode) {
      return currentComponent.customCode;
    }

    // Otherwise show the selected variant's code
    if (selectedVariant) {
      return selectedVariant.code;
    }

    // Default to first variant if nothing selected
    return currentComponent.variants[0]?.code || '';
  }, [currentComponent, selectedVariant]);

  /**
   * Handle code changes in the editor
   */
  const handleCodeChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setIsEditorDirty(true);
    }
  }, []);

  /**
   * Handle code save from editor
   */
  const handleCodeSave = useCallback((value: string) => {
    if (currentComponent) {
      updateCustomCode(currentComponent.id, value);
      setIsEditorDirty(false);
    }
  }, [currentComponent, updateCustomCode]);

  /**
   * Handle editor blur - auto-save if dirty
   */
  const handleEditorBlur = useCallback((value: string) => {
    if (currentComponent && isEditorDirty) {
      updateCustomCode(currentComponent.id, value);
      setIsEditorDirty(false);
    }
  }, [currentComponent, isEditorDirty, updateCustomCode]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if in editor mode or typing in input
      if (codeViewMode === 'editor') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [codeViewMode, goToNext, goToPrevious]);

  /**
   * Handle back to dashboard navigation
   */
  const handleBackToDashboard = useCallback(() => {
    reset();
    router.push('/');
  }, [reset, router]);

  /**
   * Handle generating components
   */
  const handleGenerateComponents = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await fetch(`/api/components/${websiteId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate components');
      }

      // Reload components after successful generation
      await loadComponents(websiteId);
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'Failed to generate components');
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, websiteId, loadComponents]);

  /**
   * Handle scaffolding the generated site
   */
  const handleScaffold = useCallback(async () => {
    if (isScaffolding) return;

    setIsScaffolding(true);
    setScaffoldSuccess(false);

    try {
      const response = await fetch('/api/scaffold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteId,
          siteName: 'Generated Site',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scaffold site');
      }

      setScaffoldSuccess(true);
    } catch (error) {
      console.error('Scaffold error:', error);
    } finally {
      setIsScaffolding(false);
    }
  }, [isScaffolding, websiteId]);

  /**
   * Render loading state
   */
  if (isLoading && components.length === 0) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))]">
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-[rgb(var(--muted-foreground))]">
            <svg
              className="animate-spin h-8 w-8"
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
            <span className="text-sm">Loading components...</span>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error && components.length === 0) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))]">
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4 p-8 max-w-md text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--destructive)/0.1)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[rgb(var(--destructive))]"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[rgb(var(--foreground))]">
              Failed to Load Components
            </h2>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              {error}
            </p>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => loadComponents(websiteId)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg',
                  'bg-[rgb(var(--accent))] text-white',
                  'hover:bg-[rgb(var(--accent)/0.9)]',
                  'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-2'
                )}
              >
                Try Again
              </button>
              <Link
                href="/"
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg',
                  'bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]',
                  'hover:bg-[rgb(var(--muted)/0.8)]',
                  'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--muted-foreground))] focus:ring-offset-2'
                )}
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render empty state
   */
  if (components.length === 0) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))]">
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4 p-8 max-w-md text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--muted)/0.3)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[rgb(var(--muted-foreground))]"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[rgb(var(--foreground))]">
              No Components Found
            </h2>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              This website doesn&apos;t have any generated components yet. Run the component
              detection process first.
            </p>
            {generateError && (
              <div className="mt-4 p-3 rounded-lg bg-[rgb(var(--destructive)/0.1)] text-sm text-[rgb(var(--destructive))]">
                {generateError}
              </div>
            )}
            <button
              type="button"
              onClick={handleGenerateComponents}
              disabled={isGenerating}
              className={cn(
                'mt-4 px-4 py-2 text-sm font-medium rounded-lg',
                'bg-[rgb(var(--accent))] text-white',
                'hover:bg-[rgb(var(--accent)/0.9)]',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {isGenerating ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
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
                  Generating...
                </>
              ) : (
                'Generate Components'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[rgb(var(--border))] bg-[rgb(var(--background)/0.95)] backdrop-blur supports-[backdrop-filter]:bg-[rgb(var(--background)/0.8)]">
        <div className="mx-auto flex h-16 max-w-[1920px] items-center justify-between px-4 lg:px-8">
          {/* Left: Navigation */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBackToDashboard}
              className={cn(
                'flex items-center gap-2 text-sm font-medium',
                'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] rounded-md p-1 -m-1'
              )}
              aria-label="Back to dashboard"
            >
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
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <div className="h-6 w-px bg-[rgb(var(--border))]" aria-hidden="true" />
            <h1 className="text-lg font-semibold text-[rgb(var(--foreground))]">
              Component Preview
            </h1>
          </div>

          {/* Center: Component Navigation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPrevious}
              disabled={components.length <= 1}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                'bg-[rgb(var(--muted)/0.3)] text-[rgb(var(--foreground))]',
                'hover:bg-[rgb(var(--muted)/0.5)]',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              aria-label="Previous component"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <span className="px-3 py-1 text-sm font-medium text-[rgb(var(--foreground))] bg-[rgb(var(--muted)/0.3)] rounded-lg tabular-nums">
              {currentIndex + 1} / {components.length}
            </span>

            <button
              type="button"
              onClick={goToNext}
              disabled={components.length <= 1}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                'bg-[rgb(var(--muted)/0.3)] text-[rgb(var(--foreground))]',
                'hover:bg-[rgb(var(--muted)/0.5)]',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              aria-label="Next component"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Right: Progress Summary & Actions */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-[rgb(var(--muted-foreground))]">
              <span className="font-medium text-[rgb(var(--foreground))]">{progress.approved}</span>
              {' / '}{progress.total} approved
            </span>
            {progress.isComplete && (
              <span className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-[rgb(var(--success)/0.1)] text-[rgb(var(--success))]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Complete
              </span>
            )}

            {/* Scaffold Button */}
            {components.length > 0 && (
              <button
                type="button"
                onClick={handleScaffold}
                disabled={isScaffolding}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-lg',
                  scaffoldSuccess
                    ? 'bg-[rgb(var(--success)/0.1)] text-[rgb(var(--success))]'
                    : 'bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.2)]',
                  'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center gap-1.5'
                )}
              >
                {isScaffolding ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Building...
                  </>
                ) : scaffoldSuccess ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Ready
                  </>
                ) : (
                  'Build Site'
                )}
              </button>
            )}

            {/* Compare Link */}
            {scaffoldSuccess && (
              <Link
                href={`/compare/${websiteId}`}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-lg',
                  'bg-[rgb(var(--accent))] text-white',
                  'hover:bg-[rgb(var(--accent)/0.9)]',
                  'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]'
                )}
              >
                Compare
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1920px] p-4 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_480px]">
          {/* Left Panel: Component Info & Code */}
          <div className="flex flex-col gap-6">
            {/* Component Header */}
            {currentComponent && (
              <div className="flex flex-col gap-4 rounded-lg bg-[rgb(var(--card))] p-6 border border-[rgb(var(--border))]">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold text-[rgb(var(--foreground))]">
                      {currentComponent.name}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
                        'bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--accent))]'
                      )}>
                        {currentComponent.type.charAt(0).toUpperCase() + currentComponent.type.slice(1)}
                      </span>
                      <span className="text-sm text-[rgb(var(--muted-foreground))]">
                        Order: {currentComponent.order + 1}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full',
                    {
                      'bg-[rgb(var(--muted)/0.3)] text-[rgb(var(--muted-foreground))]': currentComponent.status === 'pending',
                      'bg-[rgb(var(--success)/0.1)] text-[rgb(var(--success))]': currentComponent.status === 'approved',
                      'bg-[rgb(var(--destructive)/0.1)] text-[rgb(var(--destructive))]': currentComponent.status === 'rejected' || currentComponent.status === 'failed',
                      'bg-[rgb(var(--warning)/0.1)] text-[rgb(var(--warning))]': currentComponent.status === 'skipped',
                    }
                  )}>
                    {currentComponent.status.charAt(0).toUpperCase() + currentComponent.status.slice(1)}
                  </span>
                </div>

                {/* Error Message */}
                {currentComponent.errorMessage && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgb(var(--destructive)/0.1)] text-sm text-[rgb(var(--destructive))]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{currentComponent.errorMessage}</span>
                  </div>
                )}

                {/* Custom Code Indicator */}
                {hasCustomCode && (
                  <div className="flex items-center gap-2 text-sm text-[rgb(var(--accent))]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                    <span>Custom code applied</span>
                  </div>
                )}
              </div>
            )}

            {/* Code View Mode Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[rgb(var(--muted)/0.3)] rounded-lg w-fit">
              {(['viewer', 'editor', 'comparison'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCodeViewMode(mode)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                    codeViewMode === mode
                      ? 'bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-sm'
                      : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
                  )}
                >
                  {mode === 'viewer' && 'Code Viewer'}
                  {mode === 'editor' && 'Code Editor'}
                  {mode === 'comparison' && 'Comparison'}
                </button>
              ))}
            </div>

            {/* Code Display Panel */}
            <div className="flex-1">
              {codeViewMode === 'viewer' && (
                <CodeViewer
                  code={displayCode}
                  language="tsx"
                  title={currentComponent ? `${currentComponent.name}.tsx` : undefined}
                  showLineNumbers
                  showCopy
                  maxHeight={600}
                  theme="dark"
                />
              )}

              {codeViewMode === 'editor' && (
                <CodeEditor
                  code={displayCode}
                  language="typescript"
                  title={currentComponent ? `${currentComponent.name}.tsx` : undefined}
                  height={600}
                  onChange={handleCodeChange}
                  onSave={handleCodeSave}
                  onBlur={handleEditorBlur}
                  isDirty={isEditorDirty}
                  theme="vs-dark"
                />
              )}

              {codeViewMode === 'comparison' && (
                <OriginalComparison defaultViewMode="side-by-side" />
              )}
            </div>
          </div>

          {/* Right Panel: Variant Selection & Actions */}
          <div className="flex flex-col gap-6">
            {/* Progress Tracker */}
            <ProgressTracker showDetails showComponentDots />

            {/* Variant Selector */}
            <div className="rounded-lg bg-[rgb(var(--card))] p-6 border border-[rgb(var(--border))]">
              <VariantSelector showAccuracy />
            </div>

            {/* Approval Buttons */}
            <div className="rounded-lg bg-[rgb(var(--card))] p-6 border border-[rgb(var(--border))]">
              <ApprovalButtons autoAdvance confirmReject />
            </div>

            {/* Keyboard Shortcuts Help */}
            <div className="rounded-lg bg-[rgb(var(--muted)/0.2)] p-4">
              <h3 className="text-sm font-medium text-[rgb(var(--foreground))] mb-3">
                Keyboard Shortcuts
              </h3>
              <div className="grid gap-2 text-xs text-[rgb(var(--muted-foreground))]">
                <div className="flex items-center justify-between">
                  <span>Previous component</span>
                  <kbd className="px-2 py-0.5 rounded bg-[rgb(var(--muted))] font-mono">
                    &larr;
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Next component</span>
                  <kbd className="px-2 py-0.5 rounded bg-[rgb(var(--muted))] font-mono">
                    &rarr;
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Save code (in editor)</span>
                  <kbd className="px-2 py-0.5 rounded bg-[rgb(var(--muted))] font-mono">
                    Cmd/Ctrl + S
                  </kbd>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {progress.isComplete && (
              <div className="rounded-lg bg-[rgb(var(--success)/0.1)] p-4 border border-[rgb(var(--success)/0.3)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--success))]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[rgb(var(--success))]">
                      All Components Reviewed!
                    </h3>
                    <p className="text-xs text-[rgb(var(--success)/0.8)]">
                      Ready to proceed with page assembly
                    </p>
                  </div>
                </div>
                <Link
                  href={`/assemble/${websiteId}`}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg',
                    'bg-[rgb(var(--success))] text-white',
                    'hover:bg-[rgb(var(--success)/0.9)]',
                    'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--success))] focus:ring-offset-2'
                  )}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                  Continue to Page Assembly
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
