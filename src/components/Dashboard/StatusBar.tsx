'use client';

import { useExtractionStatus, useStore } from '@/store/useStore';
import { PHASES } from '@/types';
import { cn, calculateOverallProgress } from '@/lib/utils';

/**
 * StatusBar component with phase progress and sub-status
 * Displays real-time extraction progress with phase indicators, progress bar,
 * and detailed sub-status messages.
 *
 * Display Format:
 * [1/8] Capturing Reference    ██░░░░░░░░░░░░░░ 12%
 *       └─ Scrolling page to load all content...
 */
export function StatusBar() {
  const { currentPhase, totalPhases, subStatus, progress, isRunning } = useExtractionStatus();

  // Get the current phase info
  const currentPhaseInfo = PHASES.find((p) => p.number === currentPhase);
  const phaseName = currentPhaseInfo?.name ?? 'Initializing';
  const phaseDescription = currentPhaseInfo?.description ?? '';

  // Calculate overall progress across all phases
  const overallProgress = calculateOverallProgress(currentPhase, totalPhases, progress);

  // Determine display status text - use subStatus if available, otherwise use phase description
  const displayStatus = subStatus || phaseDescription;

  // If not running and no phase, show idle state
  if (!isRunning && currentPhase === 0) {
    return (
      <div
        className="w-full max-w-2xl rounded-lg bg-[rgb(var(--muted)/0.3)] p-4"
        role="status"
        aria-label="Extraction status"
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
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-sm">Ready to start extraction</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-2xl rounded-lg bg-[rgb(var(--muted)/0.3)] p-4"
      role="status"
      aria-label="Extraction progress"
      aria-live="polite"
    >
      {/* Phase Header */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Phase Indicator Badge */}
          <span
            className={cn(
              'flex-shrink-0 text-sm font-mono px-2 py-0.5 rounded',
              isRunning
                ? 'bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent))]'
                : 'bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))]'
            )}
          >
            [{currentPhase}/{totalPhases}]
          </span>

          {/* Phase Name */}
          <h3
            className={cn('font-semibold truncate', {
              'text-[rgb(var(--foreground))]': isRunning,
              'text-[rgb(var(--success))]': !isRunning && currentPhase === totalPhases,
            })}
          >
            {phaseName}
          </h3>

          {/* Animated Spinner (only when running) */}
          {isRunning && (
            <div className="flex-shrink-0" aria-hidden="true">
              <svg
                className="animate-spin h-4 w-4 text-[rgb(var(--accent))]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
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
            </div>
          )}
        </div>

        {/* Progress Percentage */}
        <span className="flex-shrink-0 text-sm font-mono tabular-nums text-[rgb(var(--muted-foreground))]">
          {overallProgress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-2 w-full bg-[rgb(var(--muted))] rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              isRunning
                ? 'bg-[rgb(var(--accent))]'
                : 'bg-[rgb(var(--success))]'
            )}
            style={{ width: `${overallProgress}%` }}
            role="progressbar"
            aria-valuenow={overallProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Overall extraction progress"
          />
        </div>
      </div>

      {/* Sub-status */}
      {displayStatus && (
        <div className="flex items-start gap-2 text-sm text-[rgb(var(--muted-foreground))]">
          <span className="flex-shrink-0 text-[rgb(var(--border))]" aria-hidden="true">
            └─
          </span>
          <span className="truncate">{displayStatus}...</span>
        </div>
      )}

      {/* Phase Progress Dots (Optional - shows completion of each phase) */}
      <div className="mt-3 pt-3 border-t border-[rgb(var(--border)/0.3)]">
        <div className="flex items-center justify-between gap-1" role="list" aria-label="Phase completion">
          {PHASES.map((phase) => {
            const isCompleted = phase.number < currentPhase;
            const isActive = phase.number === currentPhase;

            return (
              <div
                key={phase.number}
                className="flex flex-col items-center gap-1 flex-1"
                role="listitem"
                aria-label={`Phase ${phase.number}: ${phase.name} - ${isCompleted ? 'completed' : isActive ? 'in progress' : 'pending'}`}
              >
                {/* Phase Dot */}
                <div
                  className={cn('w-2 h-2 rounded-full transition-all duration-300', {
                    'bg-[rgb(var(--success))]': isCompleted,
                    'bg-[rgb(var(--accent))] ring-2 ring-[rgb(var(--accent)/0.3)]': isActive,
                    'bg-[rgb(var(--border))]': !isCompleted && !isActive,
                  })}
                />
                {/* Phase Number (only visible on hover or for active) */}
                <span
                  className={cn('text-[10px] font-mono', {
                    'text-[rgb(var(--success))]': isCompleted,
                    'text-[rgb(var(--accent))]': isActive,
                    'text-[rgb(var(--border))]': !isCompleted && !isActive,
                  })}
                >
                  {phase.number}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StatusBar;
