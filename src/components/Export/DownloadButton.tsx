'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for the DownloadButton component
 */
export interface DownloadButtonProps {
  /** Callback when the download button is clicked */
  onDownload?: () => void | Promise<void>;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Optional className for custom styling */
  className?: string;
  /** Optional label override (defaults to "Download") */
  label?: string;
  /** Whether to show the button in a compact size */
  compact?: boolean;
  /** Optional variant style ('primary' | 'secondary') */
  variant?: 'primary' | 'secondary';
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
 * DownloadButton Component
 *
 * Action button for downloading the exported content.
 * Triggers the export and download process for the user's website.
 *
 * Features:
 * - Loading state during download preparation
 * - Disabled state support
 * - Customizable label
 * - Compact size option
 * - Primary/secondary variant styles
 * - Keyboard accessibility and ARIA attributes
 *
 * Usage:
 * ```tsx
 * // Basic usage
 * <DownloadButton onDownload={handleDownload} />
 *
 * // With loading state
 * <DownloadButton onDownload={handleDownload} loading={isLoading} />
 *
 * // Disabled
 * <DownloadButton onDownload={handleDownload} disabled={!canDownload} />
 *
 * // Custom label
 * <DownloadButton onDownload={handleDownload} label="Export Website" />
 *
 * // Compact size
 * <DownloadButton onDownload={handleDownload} compact />
 *
 * // Secondary variant
 * <DownloadButton onDownload={handleDownload} variant="secondary" />
 * ```
 */
export function DownloadButton({
  onDownload,
  disabled = false,
  loading: externalLoading = false,
  className,
  label = 'Download',
  compact = false,
  variant = 'primary',
}: DownloadButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading || internalLoading;

  const handleClick = async () => {
    if (disabled || isLoading || !onDownload) return;

    try {
      setInternalLoading(true);
      await onDownload();
    } finally {
      setInternalLoading(false);
    }
  };

  // Variant-specific styles
  const variantStyles =
    variant === 'primary'
      ? 'bg-[rgb(var(--accent))] text-white hover:bg-[rgb(var(--accent)/0.9)] disabled:bg-[rgb(var(--accent)/0.5)]'
      : 'bg-[rgb(var(--muted))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted)/0.8)] border border-[rgb(var(--border))]';

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
        variantStyles,
        compact ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm',
        className
      )}
      aria-busy={isLoading}
      aria-disabled={disabled}
      aria-label={isLoading ? 'Preparing download' : label}
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          <span>Preparing...</span>
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

export default DownloadButton;
