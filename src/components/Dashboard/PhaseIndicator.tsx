'use client';

import { PhaseIndicatorProps } from '@/types';
import { cn } from '@/lib/utils';

/**
 * PhaseIndicator component for displaying individual phase status
 * Shows phase number, name, progress percentage, and visual state indicator
 *
 * States:
 * - Completed: Phase number < currentPhase (green checkmark)
 * - Active: Phase number === currentPhase (pulsing blue indicator)
 * - Pending: Phase number > currentPhase (gray circle)
 */
export function PhaseIndicator({ phase, currentPhase, progress }: PhaseIndicatorProps) {
  const isCompleted = phase.number < currentPhase;
  const isActive = phase.number === currentPhase;
  const isPending = phase.number > currentPhase;

  // Calculate display progress for this phase
  const displayProgress = isCompleted ? 100 : isActive ? progress : 0;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-all duration-300',
        {
          // Completed state - subtle success background
          'bg-[rgb(var(--success)/0.1)]': isCompleted,
          // Active state - highlighted accent background
          'bg-[rgb(var(--accent)/0.15)] ring-1 ring-[rgb(var(--accent)/0.3)]': isActive,
          // Pending state - muted background
          'bg-[rgb(var(--muted)/0.3)] opacity-60': isPending,
        }
      )}
      role="listitem"
      aria-current={isActive ? 'step' : undefined}
    >
      {/* Phase Status Indicator */}
      <div className="flex-shrink-0 relative">
        {isCompleted ? (
          // Completed checkmark
          <div className="w-8 h-8 rounded-full bg-[rgb(var(--success))] flex items-center justify-center">
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
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        ) : isActive ? (
          // Active pulsing indicator
          <div className="w-8 h-8 rounded-full bg-[rgb(var(--accent))] flex items-center justify-center relative">
            {/* Pulsing ring animation */}
            <span className="absolute inset-0 rounded-full bg-[rgb(var(--accent))] animate-ping opacity-25" />
            <span className="relative text-white font-semibold text-sm">{phase.number}</span>
          </div>
        ) : (
          // Pending circle
          <div className="w-8 h-8 rounded-full border-2 border-[rgb(var(--border))] flex items-center justify-center">
            <span className="text-[rgb(var(--muted-foreground))] font-medium text-sm">
              {phase.number}
            </span>
          </div>
        )}
      </div>

      {/* Phase Content */}
      <div className="flex-1 min-w-0">
        {/* Phase Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Phase Number Badge */}
            <span
              className={cn('text-xs font-mono px-1.5 py-0.5 rounded', {
                'bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))]': isCompleted,
                'bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent))]': isActive,
                'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]': isPending,
              })}
            >
              [{phase.number}/5]
            </span>
            {/* Phase Name */}
            <h4
              className={cn('font-medium truncate', {
                'text-[rgb(var(--success))]': isCompleted,
                'text-[rgb(var(--foreground))]': isActive,
                'text-[rgb(var(--muted-foreground))]': isPending,
              })}
            >
              {phase.name}
            </h4>
          </div>

          {/* Progress Percentage */}
          {(isCompleted || isActive) && (
            <span
              className={cn('text-sm font-mono tabular-nums flex-shrink-0', {
                'text-[rgb(var(--success))]': isCompleted,
                'text-[rgb(var(--accent))]': isActive,
              })}
            >
              {displayProgress}%
            </span>
          )}
        </div>

        {/* Phase Description */}
        <p
          className={cn('text-sm mt-1', {
            'text-[rgb(var(--success)/0.8)]': isCompleted,
            'text-[rgb(var(--muted-foreground))]': isActive || isPending,
          })}
        >
          {isActive ? (
            <span className="flex items-center gap-1">
              <span className="text-[rgb(var(--muted-foreground))]">└─</span>
              {phase.description}...
            </span>
          ) : (
            phase.description
          )}
        </p>

        {/* Progress Bar (only for active phase) */}
        {isActive && (
          <div className="mt-2">
            <div className="h-1.5 w-full bg-[rgb(var(--muted))] rounded-full overflow-hidden">
              <div
                className="h-full bg-[rgb(var(--accent))] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${displayProgress}%` }}
                role="progressbar"
                aria-valuenow={displayProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${phase.name} progress`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PhaseIndicator;
