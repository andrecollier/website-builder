'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for the PreviewButton component
 */
export interface PreviewButtonProps {
  /** Callback when the preview button is clicked */
  onPreview?: () => void | Promise<void>;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Optional className for custom styling */
  className?: string;
  /** Optional label override (defaults to "Preview") */
  label?: string;
  /** Whether to show the button in a compact size */
  compact?: boolean;
}

/**
 * Loading spinner component
 */
function LoadingSpinner() {
  return (
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
  );
}

/**
 * PreviewButton Component
 *
 * Action button for previewing the export result before downloading.
 * Opens a preview modal or window to show the exported content.
 *
 * Features:
 * - Loading state during preview generation
 * - Disabled state support
 * - Customizable label
 * - Compact size option
 * - Keyboard accessibility and ARIA attributes
 *
 * Usage:
 * ```tsx
 * // Basic usage
 * <PreviewButton onPreview={handlePreview} />
 *
 * // With loading state
 * <PreviewButton onPreview={handlePreview} loading={isLoading} />
 *
 * // Disabled
 * <PreviewButton onPreview={handlePreview} disabled={!canPreview} />
 *
 * // Custom label
 * <PreviewButton onPreview={handlePreview} label="Show Preview" />
 *
 * // Compact size
 * <PreviewButton onPreview={handlePreview} compact />
 * ```
 */
export function PreviewButton({
  onPreview,
  disabled = false,
  loading: externalLoading = false,
  className,
  label = 'Preview',
  compact = false,
}: PreviewButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading || internalLoading;

  const handleClick = async () => {
    if (disabled || isLoading || !onPreview) return;

    try {
      setInternalLoading(true);
      await onPreview();
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        'flex items-center justify-center gap-2',
        'font-medium rounded-lg',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[rgb(var(--background))] focus:ring-[rgb(var(--accent))]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]',
        'hover:bg-[rgb(var(--muted)/0.8)]',
        'border border-[rgb(var(--border))]',
        compact ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm',
        className
      )}
      aria-busy={isLoading}
      aria-disabled={disabled}
      aria-label={isLoading ? 'Generating preview' : label}
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={compact ? '14' : '18'}
            height={compact ? '14' : '18'}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

export default PreviewButton;
