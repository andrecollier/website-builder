'use client';

import { useApprovalProgress, usePreviewComponents, usePreviewLoading } from '@/store/usePreviewStore';
import { cn } from '@/lib/utils';
import type { GeneratedComponent } from '@/types';

/**
 * Props for the ProgressTracker component
 */
export interface ProgressTrackerProps {
  /** Optional components array (uses store if not provided) */
  components?: GeneratedComponent[];
  /** Whether to show the detailed breakdown */
  showDetails?: boolean;
  /** Whether to show individual component dots */
  showComponentDots?: boolean;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * Status configuration for component states
 */
const STATUS_CONFIG: Record<
  GeneratedComponent['status'],
  {
    color: string;
    bgColor: string;
    label: string;
  }
> = {
  pending: {
    color: 'text-[rgb(var(--muted-foreground))]',
    bgColor: 'bg-[rgb(var(--border))]',
    label: 'Pending',
  },
  approved: {
    color: 'text-[rgb(var(--success))]',
    bgColor: 'bg-[rgb(var(--success))]',
    label: 'Approved',
  },
  rejected: {
    color: 'text-[rgb(var(--destructive))]',
    bgColor: 'bg-[rgb(var(--destructive))]',
    label: 'Rejected',
  },
  skipped: {
    color: 'text-[rgb(var(--warning))]',
    bgColor: 'bg-[rgb(var(--warning))]',
    label: 'Skipped',
  },
  failed: {
    color: 'text-[rgb(var(--destructive))]',
    bgColor: 'bg-[rgb(var(--destructive))]',
    label: 'Failed',
  },
};

/**
 * ProgressTracker component for showing component approval progress
 *
 * Displays a progress bar and completion status (e.g., "2/7 components")
 * with optional detailed breakdown by status and component dots visualization.
 *
 * Usage:
 * ```tsx
 * // Using store integration
 * <ProgressTracker />
 *
 * // With options
 * <ProgressTracker showDetails showComponentDots />
 *
 * // With explicit components
 * <ProgressTracker components={myComponents} />
 * ```
 */
export function ProgressTracker({
  components: propComponents,
  showDetails = false,
  showComponentDots = true,
  className,
}: ProgressTrackerProps) {
  // Get components and progress from store if not provided via props
  const storeComponents = usePreviewComponents();
  const storeProgress = useApprovalProgress();
  const isLoading = usePreviewLoading();

  // Use prop components or fall back to store components
  const components = propComponents ?? storeComponents;

  // Calculate progress from props if provided, otherwise use store
  const progress = propComponents
    ? calculateProgressFromComponents(propComponents)
    : storeProgress;

  // Show loading state
  if (isLoading && components.length === 0) {
    return (
      <div
        className={cn(
          'w-full rounded-lg bg-[rgb(var(--muted)/0.3)] p-4',
          className
        )}
        role="status"
        aria-label="Loading progress"
      >
        <div className="flex items-center gap-3 text-[rgb(var(--muted-foreground))]">
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
          <span className="text-sm">Loading components...</span>
        </div>
      </div>
    );
  }

  // Show empty state if no components
  if (components.length === 0) {
    return (
      <div
        className={cn(
          'w-full rounded-lg bg-[rgb(var(--muted)/0.3)] p-4',
          className
        )}
        role="status"
        aria-label="No components"
      >
        <div className="flex items-center gap-3 text-[rgb(var(--muted-foreground))]">
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
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M8 12h8" />
          </svg>
          <span className="text-sm">No components to review</span>
        </div>
      </div>
    );
  }

  const { total, completed, approved, pending, failed, isComplete, progressPercent } = progress;

  return (
    <div
      className={cn(
        'w-full rounded-lg bg-[rgb(var(--muted)/0.3)] p-4',
        className
      )}
      role="status"
      aria-label="Component approval progress"
      aria-live="polite"
    >
      {/* Progress Header */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Status Icon */}
          {isComplete ? (
            <div
              className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--success))]"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ) : (
            <div
              className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--accent))] relative"
              aria-hidden="true"
            >
              {/* Pulsing ring animation */}
              <span className="absolute inset-0 rounded-full bg-[rgb(var(--accent))] animate-ping opacity-25" />
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
                className="relative text-white"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </div>
          )}

          {/* Progress Text */}
          <div className="min-w-0">
            <h3
              className={cn('font-semibold', {
                'text-[rgb(var(--success))]': isComplete,
                'text-[rgb(var(--foreground))]': !isComplete,
              })}
            >
              {isComplete ? 'All Components Reviewed' : 'Component Review'}
            </h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              {isComplete
                ? `${approved} of ${total} components approved`
                : `${completed} of ${total} components reviewed`}
            </p>
          </div>
        </div>

        {/* Progress Badge */}
        <span
          className={cn(
            'flex-shrink-0 text-sm font-mono tabular-nums px-2 py-0.5 rounded',
            {
              'bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))]': isComplete,
              'bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent))]': !isComplete,
            }
          )}
        >
          [{completed}/{total}]
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-2 w-full bg-[rgb(var(--muted))] rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              {
                'bg-[rgb(var(--success))]': isComplete,
                'bg-[rgb(var(--accent))]': !isComplete,
              }
            )}
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Component review progress"
          />
        </div>
      </div>

      {/* Status Breakdown (optional) */}
      {showDetails && (
        <div className="flex items-center gap-4 text-xs text-[rgb(var(--muted-foreground))]">
          {approved > 0 && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full bg-[rgb(var(--success))]"
                aria-hidden="true"
              />
              <span>{approved} approved</span>
            </div>
          )}
          {pending > 0 && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full bg-[rgb(var(--border))]"
                aria-hidden="true"
              />
              <span>{pending} pending</span>
            </div>
          )}
          {failed > 0 && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full bg-[rgb(var(--destructive))]"
                aria-hidden="true"
              />
              <span>{failed} failed</span>
            </div>
          )}
        </div>
      )}

      {/* Component Dots (optional) */}
      {showComponentDots && components.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[rgb(var(--border)/0.3)]">
          <div
            className="flex items-center justify-between gap-1"
            role="list"
            aria-label="Component status"
          >
            {components.map((component, index) => {
              const config = STATUS_CONFIG[component.status];

              return (
                <div
                  key={component.id}
                  className="flex flex-col items-center gap-1 flex-1"
                  role="listitem"
                  aria-label={`${component.name}: ${config.label}`}
                >
                  {/* Component Dot */}
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-300',
                      config.bgColor,
                      {
                        'ring-2 ring-[rgb(var(--accent)/0.3)]':
                          component.status === 'pending',
                      }
                    )}
                  />
                  {/* Component Number */}
                  <span
                    className={cn('text-[10px] font-mono', config.color)}
                  >
                    {index + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completion Message */}
      {isComplete && (
        <div className="mt-3 pt-3 border-t border-[rgb(var(--border)/0.3)]">
          <div className="flex items-start gap-2 text-sm text-[rgb(var(--success))]">
            <span className="flex-shrink-0" aria-hidden="true">
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
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <span>
              All components have been reviewed. Ready to proceed with generation.
            </span>
          </div>
        </div>
      )}

      {/* Failed Components Warning */}
      {failed > 0 && (
        <div className="mt-3 pt-3 border-t border-[rgb(var(--border)/0.3)]">
          <div className="flex items-start gap-2 text-sm text-[rgb(var(--destructive))]">
            <span className="flex-shrink-0" aria-hidden="true">
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
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <span>
              {failed} component{failed === 1 ? '' : 's'} failed to generate.
              Check the manual review queue.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Helper function to calculate progress from components array
 */
function calculateProgressFromComponents(components: GeneratedComponent[]) {
  const total = components.length;
  const completed = components.filter(
    (c) => c.status === 'approved' || c.status === 'rejected' || c.status === 'skipped'
  ).length;
  const approved = components.filter((c) => c.status === 'approved').length;
  const pending = components.filter((c) => c.status === 'pending').length;
  const failed = components.filter((c) => c.status === 'failed').length;

  return {
    total,
    completed,
    approved,
    pending,
    failed,
    isComplete: completed === total && total > 0,
    progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export default ProgressTracker;
