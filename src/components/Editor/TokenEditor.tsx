'use client';

import { useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  useEditorStore,
  useActivePanel,
  useIsDirty,
  useIsLoading,
  useEditorError,
  useEditorTokens,
} from '@/store/useEditorStore';
import { ColorEditor } from './ColorEditor';
import { TypographyEditor } from './TypographyEditor';
import { SpacingEditor } from './SpacingEditor';
import { EffectsEditor } from './EffectsEditor';
import type { EditorPanel } from '@/types';

// ====================
// TYPES
// ====================

interface TabConfig {
  id: EditorPanel;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface TabButtonProps {
  tab: TabConfig;
  isActive: boolean;
  onClick: () => void;
}

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  children: React.ReactNode;
}

// ====================
// CONFIGURATION
// ====================

const TABS: TabConfig[] = [
  {
    id: 'colors',
    label: 'Colors',
    description: 'Edit color palettes, semantic colors, and contrast',
    icon: (
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
        <circle cx="13.5" cy="6.5" r="2.5" />
        <circle cx="6.5" cy="13.5" r="2.5" />
        <circle cx="17.5" cy="17.5" r="2.5" />
        <path d="M10.5 8.5 8 11" />
        <path d="m15 15-2-2" />
      </svg>
    ),
  },
  {
    id: 'typography',
    label: 'Typography',
    description: 'Edit fonts, sizes, weights, and line heights',
    icon: (
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
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    ),
  },
  {
    id: 'spacing',
    label: 'Spacing',
    description: 'Edit spacing scale, containers, and padding',
    icon: (
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
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <rect x="7" y="7" width="10" height="10" rx="1" />
      </svg>
    ),
  },
  {
    id: 'effects',
    label: 'Effects',
    description: 'Edit shadows, border radii, and transitions',
    icon: (
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
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    ),
  },
];

// ====================
// SUB-COMPONENTS
// ====================

/**
 * Tab button component for panel navigation
 */
function TabButton({ tab, isActive, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      id={`tab-${tab.id}`}
      aria-selected={isActive}
      aria-controls={`panel-${tab.id}`}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200',
        'border-b-2 -mb-[2px]',
        'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[rgb(var(--accent))]',
        {
          'border-[rgb(var(--accent))] text-[rgb(var(--foreground))]': isActive,
          'border-transparent text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:border-[rgb(var(--border))]':
            !isActive,
        }
      )}
    >
      <span className={cn({ 'text-[rgb(var(--accent))]': isActive })}>{tab.icon}</span>
      <span>{tab.label}</span>
    </button>
  );
}

/**
 * Action button component for save/reset actions
 */
function ActionButton({
  onClick,
  disabled,
  variant,
  isLoading,
  children,
}: ActionButtonProps) {
  const variantClasses = {
    primary: cn(
      'bg-[rgb(var(--accent))] text-white',
      'hover:bg-[rgb(var(--accent)/0.9)]',
      'disabled:bg-[rgb(var(--accent)/0.5)]'
    ),
    secondary: cn(
      'bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]',
      'hover:bg-[rgb(var(--muted)/0.8)]',
      'disabled:bg-[rgb(var(--muted)/0.5)]'
    ),
    danger: cn(
      'bg-[rgb(var(--error))] text-white',
      'hover:bg-[rgb(var(--error)/0.9)]',
      'disabled:bg-[rgb(var(--error)/0.5)]'
    ),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--background))]',
        'disabled:cursor-not-allowed',
        variantClasses[variant]
      )}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
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
          Saving...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Empty state component when no tokens are loaded
 */
function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-[rgb(var(--muted-foreground))]"
      role="status"
      aria-label="No design tokens loaded"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mb-4 opacity-50"
        aria-hidden="true"
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        <path d="M19 3v4" />
        <path d="M21 5h-4" />
      </svg>
      <h3 className="text-lg font-medium text-[rgb(var(--foreground))] mb-2">
        No Design Tokens Loaded
      </h3>
      <p className="text-sm text-center max-w-md">
        Extract a website from the dashboard to generate design tokens, or load an existing
        design system to begin editing.
      </p>
    </div>
  );
}

/**
 * Error banner component
 */
function ErrorBanner({ error, onDismiss }: { error: string; onDismiss: () => void }) {
  return (
    <div
      className="flex items-center justify-between gap-4 p-3 rounded-lg bg-[rgb(var(--error)/0.1)] border border-[rgb(var(--error)/0.3)]"
      role="alert"
    >
      <div className="flex items-center gap-2">
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
          className="text-[rgb(var(--error))]"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span className="text-sm text-[rgb(var(--error))]">{error}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 rounded hover:bg-[rgb(var(--error)/0.2)] transition-colors"
        aria-label="Dismiss error"
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
          className="text-[rgb(var(--error))]"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Unsaved changes indicator
 */
function UnsavedIndicator() {
  return (
    <span className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-[rgb(var(--warning)/0.2)] text-[rgb(var(--warning))]">
      <span
        className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--warning))] animate-pulse"
        aria-hidden="true"
      />
      Unsaved changes
    </span>
  );
}

// ====================
// MAIN COMPONENT
// ====================

/**
 * TokenEditor orchestration component
 *
 * Provides tab navigation for all editor panels (Colors, Typography, Spacing, Effects)
 * and manages save/reset actions for design tokens.
 *
 * Features:
 * - Tab navigation with icons and descriptions
 * - Active tab state management via Zustand store
 * - Save and reset to original functionality
 * - Unsaved changes indicator
 * - Error handling and display
 * - Empty state when no tokens loaded
 */
export function TokenEditor() {
  const activePanel = useActivePanel();
  const isDirty = useIsDirty();
  const isLoading = useIsLoading();
  const error = useEditorError();
  const tokens = useEditorTokens();
  const setActivePanel = useEditorStore((state) => state.setActivePanel);
  const resetToOriginal = useEditorStore((state) => state.resetToOriginal);
  const saveTokens = useEditorStore((state) => state.saveTokens);

  // Get active tab configuration
  const activeTab = useMemo(
    () => TABS.find((tab) => tab.id === activePanel) ?? TABS[0],
    [activePanel]
  );

  // Handle tab change
  const handleTabChange = useCallback(
    (panelId: EditorPanel) => {
      setActivePanel(panelId);
    },
    [setActivePanel]
  );

  // Handle save
  const handleSave = useCallback(async () => {
    await saveTokens();
  }, [saveTokens]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (isDirty) {
      // Could add confirmation dialog here
      resetToOriginal();
    }
  }, [isDirty, resetToOriginal]);

  // Handle error dismiss
  const handleErrorDismiss = useCallback(() => {
    useEditorStore.setState({ error: null });
  }, []);

  // Render the appropriate editor panel
  const renderPanel = () => {
    switch (activePanel) {
      case 'colors':
        return <ColorEditor />;
      case 'typography':
        return <TypographyEditor />;
      case 'spacing':
        return <SpacingEditor />;
      case 'effects':
        return <EffectsEditor />;
      default:
        return <ColorEditor />;
    }
  };

  return (
    <div
      className="flex flex-col h-full"
      role="region"
      aria-label="Token editor"
    >
      {/* Header with tabs */}
      <div className="flex-shrink-0 border-b border-[rgb(var(--border))]">
        {/* Tab list */}
        <div
          className="flex items-center border-b border-[rgb(var(--border))]"
          role="tablist"
          aria-label="Editor panels"
        >
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activePanel === tab.id}
              onClick={() => handleTabChange(tab.id)}
            />
          ))}

          {/* Right side: unsaved indicator and actions */}
          <div className="ml-auto flex items-center gap-3 px-4">
            {isDirty && <UnsavedIndicator />}
          </div>
        </div>

        {/* Tab description and actions bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[rgb(var(--muted)/0.2)]">
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            {activeTab.description}
          </p>

          {/* Action buttons */}
          {tokens && (
            <div className="flex items-center gap-2">
              <ActionButton
                onClick={handleReset}
                disabled={!isDirty}
                variant="secondary"
              >
                Reset to Original
              </ActionButton>
              <ActionButton
                onClick={handleSave}
                disabled={!isDirty}
                variant="primary"
                isLoading={isLoading}
              >
                Save Changes
              </ActionButton>
            </div>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex-shrink-0 p-4 border-b border-[rgb(var(--border))]">
          <ErrorBanner error={error} onDismiss={handleErrorDismiss} />
        </div>
      )}

      {/* Main content area */}
      <div
        className="flex-1 overflow-auto p-4"
        role="tabpanel"
        id={`panel-${activePanel}`}
        aria-labelledby={`tab-${activePanel}`}
      >
        {tokens ? renderPanel() : <EmptyState />}
      </div>

      {/* Footer with meta information */}
      {tokens && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-[rgb(var(--border))] bg-[rgb(var(--muted)/0.1)]">
          <div className="flex items-center justify-between text-xs text-[rgb(var(--muted-foreground))]">
            <span>
              Source:{' '}
              <span className="font-mono text-[rgb(var(--foreground))]">
                {tokens.meta.sourceUrl}
              </span>
            </span>
            <span>
              Extracted:{' '}
              <span className="font-mono text-[rgb(var(--foreground))]">
                {new Date(tokens.meta.extractedAt).toLocaleDateString()}
              </span>
            </span>
            <span>
              Version:{' '}
              <span className="font-mono text-[rgb(var(--foreground))]">
                {tokens.meta.version}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TokenEditor;
