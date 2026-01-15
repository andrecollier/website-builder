'use client';

import { useState } from 'react';
import { ErrorRecoveryPanelProps, ExtractionError, PHASES } from '@/types';
import { cn, formatRelativeTime } from '@/lib/utils';

/**
 * ErrorRecoveryPanel component for failed section handling
 * Collapsible panel that displays errors with individual retry/skip actions
 * and bulk actions (Retry All, Skip All).
 */
export function ErrorRecoveryPanel({
  errors,
  onRetry,
  onSkip,
  onRetryAll,
  onSkipAll,
  onDismiss,
}: ErrorRecoveryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Don't render if there are no errors
  if (errors.length === 0) {
    return null;
  }

  // Get recoverable errors count
  const recoverableErrors = errors.filter((e) => e.recoverable);
  const nonRecoverableErrors = errors.filter((e) => !e.recoverable);

  /**
   * Get phase name from phase number
   */
  const getPhaseName = (phaseNumber: number): string => {
    const phase = PHASES.find((p) => p.number === phaseNumber);
    return phase?.name ?? `Phase ${phaseNumber}`;
  };

  /**
   * Handle individual error retry
   */
  const handleRetry = (e: React.MouseEvent, errorId: string) => {
    e.stopPropagation();
    onRetry(errorId);
  };

  /**
   * Handle individual error skip
   */
  const handleSkip = (e: React.MouseEvent, errorId: string) => {
    e.stopPropagation();
    onSkip(errorId);
  };

  return (
    <div
      className="w-full max-w-2xl rounded-lg bg-[rgb(var(--destructive)/0.1)] border border-[rgb(var(--destructive)/0.3)]"
      role="alert"
      aria-label={`${errors.length} error${errors.length === 1 ? '' : 's'} occurred during extraction`}
    >
      {/* Header - Collapsible Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full px-4 py-3 flex items-center justify-between',
          'hover:bg-[rgb(var(--destructive)/0.05)] transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[rgb(var(--destructive)/0.3)]'
        )}
        aria-expanded={isExpanded}
        aria-controls="error-panel-content"
      >
        <div className="flex items-center gap-3">
          {/* Error Icon */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[rgb(var(--destructive)/0.2)] flex items-center justify-center">
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
              className="text-[rgb(var(--destructive))]"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          {/* Error Count */}
          <div className="text-left">
            <h3 className="font-semibold text-[rgb(var(--destructive))]">
              {errors.length} Error{errors.length === 1 ? '' : 's'} Occurred
            </h3>
            <p className="text-xs text-[rgb(var(--muted-foreground))]">
              {recoverableErrors.length} recoverable, {nonRecoverableErrors.length} non-recoverable
            </p>
          </div>
        </div>

        {/* Expand/Collapse Icon */}
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
          className={cn(
            'text-[rgb(var(--muted-foreground))] transition-transform duration-200',
            isExpanded ? 'rotate-180' : ''
          )}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Collapsible Content */}
      <div
        id="error-panel-content"
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {/* Bulk Actions */}
        <div className="px-4 py-2 border-t border-[rgb(var(--destructive)/0.2)] bg-[rgb(var(--destructive)/0.05)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Retry All */}
            <button
              onClick={onRetryAll}
              disabled={recoverableErrors.length === 0}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded',
                'bg-[rgb(var(--accent))] text-white',
                'hover:bg-[rgb(var(--accent)/0.9)]',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent)/0.3)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-150'
              )}
              aria-label="Retry all recoverable errors"
            >
              Retry All ({recoverableErrors.length})
            </button>

            {/* Skip All */}
            <button
              onClick={onSkipAll}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded',
                'bg-[rgb(var(--muted)/0.5)] text-[rgb(var(--muted-foreground))]',
                'hover:bg-[rgb(var(--muted))]',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring)/0.3)]',
                'transition-colors duration-150'
              )}
              aria-label="Skip all errors"
            >
              Skip All
            </button>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={onDismiss}
            className={cn(
              'p-1.5 rounded',
              'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]',
              'hover:bg-[rgb(var(--muted)/0.3)]',
              'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring)/0.3)]',
              'transition-colors duration-150'
            )}
            aria-label="Dismiss error panel"
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
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Error List */}
        <ul
          className="px-4 py-3 space-y-2 max-h-[350px] overflow-y-auto"
          role="list"
          aria-label="Error list"
        >
          {errors.map((error) => (
            <ErrorItem
              key={error.id}
              error={error}
              phaseName={getPhaseName(error.phase)}
              onRetry={handleRetry}
              onSkip={handleSkip}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Individual error item component
 */
interface ErrorItemProps {
  error: ExtractionError;
  phaseName: string;
  onRetry: (e: React.MouseEvent, errorId: string) => void;
  onSkip: (e: React.MouseEvent, errorId: string) => void;
}

function ErrorItem({ error, phaseName, onRetry, onSkip }: ErrorItemProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <li
      className={cn(
        'rounded-lg p-3',
        'bg-[rgb(var(--background)/0.5)] border',
        error.recoverable
          ? 'border-[rgb(var(--warning)/0.3)]'
          : 'border-[rgb(var(--destructive)/0.3)]'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Error Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Status Icon */}
            {error.recoverable ? (
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
                className="text-[rgb(var(--warning))] flex-shrink-0"
                aria-hidden="true"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ) : (
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
                className="text-[rgb(var(--destructive))] flex-shrink-0"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}

            {/* Phase Badge */}
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-[rgb(var(--muted)/0.5)] text-[rgb(var(--muted-foreground))]">
              {phaseName}
            </span>

            {/* Timestamp */}
            <span className="text-xs text-[rgb(var(--muted-foreground)/0.7)]">
              {formatRelativeTime(error.timestamp)}
            </span>
          </div>

          {/* Error Message */}
          <p className="text-sm text-[rgb(var(--foreground))] mb-1">{error.message}</p>

          {/* Error Details (expandable) */}
          {error.details && (
            <>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-[rgb(var(--accent))] hover:underline focus:outline-none focus:underline"
              >
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
              {showDetails && (
                <pre className="mt-2 p-2 rounded bg-[rgb(var(--muted)/0.3)] text-xs text-[rgb(var(--muted-foreground))] overflow-x-auto whitespace-pre-wrap font-mono">
                  {error.details}
                </pre>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Retry Button (only for recoverable errors) */}
          {error.recoverable && (
            <button
              onClick={(e) => onRetry(e, error.id)}
              className={cn(
                'p-1.5 rounded',
                'text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.1)]',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent)/0.3)]',
                'transition-colors duration-150'
              )}
              aria-label={`Retry: ${error.message}`}
              title="Retry"
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
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          )}

          {/* Skip Button */}
          <button
            onClick={(e) => onSkip(e, error.id)}
            className={cn(
              'p-1.5 rounded',
              'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]',
              'hover:bg-[rgb(var(--muted)/0.3)]',
              'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring)/0.3)]',
              'transition-colors duration-150'
            )}
            aria-label={`Skip: ${error.message}`}
            title="Skip"
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
            >
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" />
            </svg>
          </button>
        </div>
      </div>
    </li>
  );
}

export default ErrorRecoveryPanel;
