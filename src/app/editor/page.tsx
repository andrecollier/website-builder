'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TokenEditor, LivePreview } from '@/components/Editor';
import {
  useEditorStore,
  useEditorTokens,
  useIsLoading,
  useEditorError,
} from '@/store/useEditorStore';
import { cn } from '@/lib/utils';
import type { DesignSystem } from '@/types';

/**
 * Token Editor Page
 * Features:
 * - Split layout with TokenEditor and LivePreview panels
 * - Load tokens from store or API on mount
 * - Real-time preview updates as tokens are modified
 * - Resizable panels (future enhancement)
 */
export default function EditorPage() {
  // Loading state for initial token fetch
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Store state and actions
  const tokens = useEditorTokens();
  const isLoading = useIsLoading();
  const error = useEditorError();
  const loadTokens = useEditorStore((state) => state.loadTokens);
  const reset = useEditorStore((state) => state.reset);

  /**
   * Load tokens from API or use existing store data
   */
  const fetchTokens = useCallback(async () => {
    try {
      setIsInitialLoading(true);
      setLoadError(null);

      // Check URL params for websiteId
      const urlParams = new URLSearchParams(window.location.search);
      const websiteId = urlParams.get('websiteId');

      if (websiteId) {
        // Fetch tokens for specific website
        const response = await fetch(`/api/tokens?websiteId=${websiteId}`);

        if (response.ok) {
          const data = await response.json();
          if (data.tokens) {
            loadTokens(data.tokens);
          } else {
            setLoadError('No design tokens found for this website');
          }
        } else if (response.status === 404) {
          setLoadError('Website not found. Please extract a website first.');
        } else {
          setLoadError('Failed to load design tokens');
        }
      } else {
        // Try to load most recent tokens or use default demo tokens
        const response = await fetch('/api/tokens/latest');

        if (response.ok) {
          const data = await response.json();
          if (data.tokens) {
            loadTokens(data.tokens);
          } else {
            // No tokens available - show empty state with demo option
            loadDemoTokens();
          }
        } else {
          // API doesn't exist yet or no tokens - load demo tokens
          loadDemoTokens();
        }
      }
    } catch (err) {
      // Network error - try demo tokens
      loadDemoTokens();
    } finally {
      setIsInitialLoading(false);
    }
  }, [loadTokens]);

  /**
   * Load demo tokens for demonstration purposes
   */
  const loadDemoTokens = useCallback(() => {
    const demoTokens: DesignSystem = {
      meta: {
        sourceUrl: 'https://demo.example.com',
        extractedAt: new Date().toISOString(),
        version: 1,
      },
      colors: {
        primary: ['#3B82F6', '#2563EB', '#1D4ED8'],
        secondary: ['#8B5CF6', '#7C3AED', '#6D28D9'],
        neutral: ['#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937', '#111827'],
        semantic: {
          success: '#10B981',
          error: '#EF4444',
          warning: '#F59E0B',
          info: '#3B82F6',
        },
        palettes: {
          blue: {
            50: '#EFF6FF',
            100: '#DBEAFE',
            200: '#BFDBFE',
            300: '#93C5FD',
            400: '#60A5FA',
            500: '#3B82F6',
            600: '#2563EB',
            700: '#1D4ED8',
            800: '#1E40AF',
            900: '#1E3A8A',
            950: '#172554',
          },
        },
      },
      typography: {
        fonts: {
          heading: 'Inter, system-ui, sans-serif',
          body: 'Inter, system-ui, sans-serif',
          mono: 'JetBrains Mono, monospace',
        },
        scale: {
          display: '4.5rem',
          h1: '3rem',
          h2: '2.25rem',
          h3: '1.875rem',
          h4: '1.5rem',
          h5: '1.25rem',
          h6: '1rem',
          body: '1rem',
          small: '0.875rem',
          xs: '0.75rem',
        },
        weights: [400, 500, 600, 700],
        lineHeights: {
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.75,
        },
      },
      spacing: {
        baseUnit: 4,
        scale: [4, 8, 12, 16, 24, 32, 48, 64, 96, 128],
        containerMaxWidth: '1280px',
        sectionPadding: {
          mobile: '16px',
          desktop: '64px',
        },
      },
      effects: {
        shadows: {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        },
        radii: {
          sm: '0.25rem',
          md: '0.375rem',
          lg: '0.5rem',
          full: '9999px',
        },
        transitions: {
          fast: '150ms',
          normal: '300ms',
          slow: '500ms',
        },
      },
    };

    loadTokens(demoTokens);
    setLoadError(null);
  }, [loadTokens]);

  /**
   * Fetch tokens on mount
   */
  useEffect(() => {
    fetchTokens();

    // Cleanup on unmount
    return () => {
      // Don't reset on unmount to preserve state when navigating back
    };
  }, [fetchTokens]);

  /**
   * Handle back to dashboard navigation
   */
  const handleBackToDashboard = useCallback(() => {
    // Optionally warn about unsaved changes
    reset();
  }, [reset]);

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-[rgb(var(--border)/0.3)] bg-[rgb(var(--background))]">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Left: Back button and title */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              onClick={handleBackToDashboard}
              className={cn(
                'flex items-center gap-2 text-sm text-[rgb(var(--muted-foreground))]',
                'hover:text-[rgb(var(--foreground))] transition-colors duration-200'
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
                <path d="m15 18-6-6 6-6" />
              </svg>
              <span>Back to Dashboard</span>
            </Link>

            <div className="h-6 w-px bg-[rgb(var(--border)/0.5)]" aria-hidden="true" />

            <h1 className="text-lg font-semibold text-[rgb(var(--foreground))]">
              Token Editor
            </h1>
          </div>

          {/* Right: Token source info */}
          {tokens && (
            <div className="flex items-center gap-4 text-sm text-[rgb(var(--muted-foreground))]">
              <span className="hidden md:inline">
                Editing tokens from{' '}
                <span className="font-mono text-[rgb(var(--foreground))]">
                  {new URL(tokens.meta.sourceUrl).hostname}
                </span>
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Loading State */}
        {isInitialLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <svg
                className="animate-spin h-8 w-8 text-[rgb(var(--accent))]"
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
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                Loading design tokens...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isInitialLoading && loadError && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
              <div className="w-16 h-16 rounded-full bg-[rgb(var(--error)/0.1)] flex items-center justify-center">
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
                  className="text-[rgb(var(--error))]"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
                Unable to Load Tokens
              </h2>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                {loadError}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={fetchTokens}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg',
                    'bg-[rgb(var(--accent))] text-white',
                    'hover:bg-[rgb(var(--accent)/0.9)]',
                    'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent)/0.3)]',
                    'transition-colors duration-200'
                  )}
                >
                  Try Again
                </button>
                <button
                  onClick={loadDemoTokens}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg',
                    'bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]',
                    'hover:bg-[rgb(var(--muted)/0.8)]',
                    'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent)/0.3)]',
                    'transition-colors duration-200'
                  )}
                >
                  Load Demo Tokens
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Editor Layout */}
        {!isInitialLoading && !loadError && (
          <>
            {/* Left Panel: Token Editor */}
            <div
              className="w-1/2 lg:w-3/5 flex flex-col border-r border-[rgb(var(--border)/0.3)] bg-[rgb(var(--background))]"
              role="region"
              aria-label="Token editor panel"
            >
              <TokenEditor />
            </div>

            {/* Right Panel: Live Preview */}
            <div
              className="w-1/2 lg:w-2/5 flex flex-col bg-[rgb(var(--muted)/0.1)] overflow-auto"
              role="region"
              aria-label="Live preview panel"
            >
              {/* Preview Header */}
              <div className="flex-shrink-0 px-4 py-3 border-b border-[rgb(var(--border)/0.3)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[rgb(var(--foreground))]">
                    Live Preview
                  </h2>
                  <span className="text-xs text-[rgb(var(--muted-foreground))]">
                    Auto-updates
                  </span>
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 p-4 overflow-auto">
                <LivePreview />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="flex-shrink-0 border-t border-[rgb(var(--border)/0.3)] bg-[rgb(var(--background))]">
        <div className="px-4 py-2 flex items-center justify-between text-xs text-[rgb(var(--muted-foreground))]">
          <span>
            Token Editor - Design System Extraction & Customization
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">
              Tip: Changes are applied instantly in the preview
            </span>
            <Link
              href="/"
              className="text-[rgb(var(--accent))] hover:underline"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
