'use client';

import { Reference } from '@/types';
import { cn, getNameFromUrl, truncate } from '@/lib/utils';

/**
 * Props for the ReferenceCard component
 */
export interface ReferenceCardProps {
  reference: Reference;
  index?: number;
  onRetry?: (id: string) => void;
  onRemove?: (id: string) => void;
}

/**
 * Status configuration for visual representation
 */
const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'text-[rgb(var(--muted-foreground))]',
    bgColor: 'bg-[rgb(var(--muted)/0.2)]',
    borderColor: 'border-[rgb(var(--border))]',
    icon: (
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
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  processing: {
    label: 'Processing',
    color: 'text-[rgb(var(--accent))]',
    bgColor: 'bg-[rgb(var(--accent)/0.1)]',
    borderColor: 'border-[rgb(var(--accent)/0.3)]',
    icon: (
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
        className="animate-spin"
        aria-hidden="true"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    ),
  },
  ready: {
    label: 'Ready',
    color: 'text-[rgb(var(--success))]',
    bgColor: 'bg-[rgb(var(--success)/0.1)]',
    borderColor: 'border-[rgb(var(--success)/0.3)]',
    icon: (
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
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  error: {
    label: 'Error',
    color: 'text-[rgb(var(--destructive))]',
    bgColor: 'bg-[rgb(var(--destructive)/0.1)]',
    borderColor: 'border-[rgb(var(--destructive)/0.3)]',
    icon: (
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
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
} as const;

/**
 * ReferenceCard component for displaying individual reference with processing status
 * Shows URL, name, processing status, and section count
 * Supports retry action for failed references and remove action
 */
export function ReferenceCard({
  reference,
  index,
  onRetry,
  onRemove,
}: ReferenceCardProps) {
  const statusConfig = STATUS_CONFIG[reference.status];
  const displayName = reference.name || getNameFromUrl(reference.url);
  const sectionCount = reference.sections?.length || 0;

  /**
   * Handle retry action
   */
  const handleRetry = () => {
    if (onRetry) {
      onRetry(reference.id);
    }
  };

  /**
   * Handle remove action
   */
  const handleRemove = () => {
    if (onRemove) {
      onRemove(reference.id);
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg p-4 transition-all duration-200',
        'border',
        statusConfig.borderColor,
        statusConfig.bgColor
      )}
      role="article"
      aria-label={`Reference: ${displayName}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Index Badge (if provided) */}
          {index !== undefined && (
            <span
              className={cn(
                'w-8 h-8 flex items-center justify-center text-sm font-medium rounded-full flex-shrink-0 mt-0.5',
                {
                  'bg-[rgb(var(--muted)/0.5)] text-[rgb(var(--muted-foreground))]':
                    reference.status === 'pending',
                  'bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent))]':
                    reference.status === 'processing',
                  'bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))]':
                    reference.status === 'ready',
                  'bg-[rgb(var(--destructive)/0.2)] text-[rgb(var(--destructive))]':
                    reference.status === 'error',
                }
              )}
              aria-hidden="true"
            >
              {index + 1}
            </span>
          )}

          {/* Name and URL */}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-[rgb(var(--foreground))] mb-1">
              {displayName}
            </h3>
            <p
              className="text-xs text-[rgb(var(--muted-foreground))] truncate"
              title={reference.url}
            >
              {truncate(reference.url, 60)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Retry Button (only for error status) */}
          {reference.status === 'error' && onRetry && (
            <button
              onClick={handleRetry}
              className={cn(
                'p-1.5 rounded transition-all duration-150',
                'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--accent))]',
                'hover:bg-[rgb(var(--accent)/0.1)]',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring)/0.3)]'
              )}
              aria-label={`Retry processing ${displayName}`}
              title="Retry processing"
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
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
            </button>
          )}

          {/* Remove Button */}
          {onRemove && (
            <button
              onClick={handleRemove}
              className={cn(
                'p-1.5 rounded transition-all duration-150',
                'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--destructive))]',
                'hover:bg-[rgb(var(--destructive)/0.1)]',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring)/0.3)]'
              )}
              aria-label={`Remove reference ${displayName}`}
              title={`Remove ${displayName}`}
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
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Status and Info */}
      <div className="flex items-center justify-between gap-4 pt-3 border-t border-[rgb(var(--border)/0.5)]">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={cn('flex-shrink-0', statusConfig.color)}>
            {statusConfig.icon}
          </span>
          <span className={cn('text-sm font-medium', statusConfig.color)}>
            {statusConfig.label}
          </span>
        </div>

        {/* Section Count (only for ready status) */}
        {reference.status === 'ready' && (
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-foreground))]">
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
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>
              {sectionCount} {sectionCount === 1 ? 'section' : 'sections'}
            </span>
          </div>
        )}

        {/* Token Count (only for ready status) */}
        {reference.status === 'ready' && reference.tokens && (
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-foreground))]">
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
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
            </svg>
            <span>Design tokens</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReferenceCard;
