'use client';

import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  usePreviewStore,
  useCurrentComponent,
  usePreviewLoading,
} from '@/store/usePreviewStore';
import type { GeneratedComponent } from '@/types';

// ====================
// TYPES
// ====================

/**
 * Props for the ApprovalButtons component
 */
export interface ApprovalButtonsProps {
  /** Optional component to operate on (uses current component from store if not provided) */
  component?: GeneratedComponent;
  /** Whether to automatically advance to next component after action */
  autoAdvance?: boolean;
  /** Whether to show confirmation dialog for reject action */
  confirmReject?: boolean;
  /** Optional className for custom styling */
  className?: string;
  /** Callback fired after successful approval */
  onApprove?: (componentId: string) => void;
  /** Callback fired after reject action */
  onReject?: (componentId: string) => void;
  /** Callback fired after skip action */
  onSkip?: (componentId: string) => void;
}

/**
 * Button variant configuration
 */
type ButtonVariant = 'approve' | 'reject' | 'skip';

interface ButtonConfig {
  label: string;
  icon: React.ReactNode;
  loadingLabel: string;
  variant: ButtonVariant;
  className: string;
  hoverClassName: string;
  disabledClassName: string;
}

// ====================
// CONFIGURATION
// ====================

/**
 * Button configuration for each action type
 */
const BUTTON_CONFIG: Record<ButtonVariant, ButtonConfig> = {
  approve: {
    label: 'Approve',
    loadingLabel: 'Approving...',
    variant: 'approve',
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
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    className: 'bg-[rgb(var(--success))] text-white',
    hoverClassName: 'hover:bg-[rgb(var(--success)/0.9)]',
    disabledClassName: 'disabled:bg-[rgb(var(--success)/0.5)]',
  },
  reject: {
    label: 'Reject',
    loadingLabel: 'Rejecting...',
    variant: 'reject',
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
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    className: 'bg-[rgb(var(--destructive))] text-white',
    hoverClassName: 'hover:bg-[rgb(var(--destructive)/0.9)]',
    disabledClassName: 'disabled:bg-[rgb(var(--destructive)/0.5)]',
  },
  skip: {
    label: 'Skip',
    loadingLabel: 'Skipping...',
    variant: 'skip',
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
        <polygon points="5 4 15 12 5 20 5 4" />
        <line x1="19" y1="5" x2="19" y2="19" />
      </svg>
    ),
    className: 'bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]',
    hoverClassName: 'hover:bg-[rgb(var(--muted)/0.8)]',
    disabledClassName: 'disabled:bg-[rgb(var(--muted)/0.5)]',
  },
};

// ====================
// SUB-COMPONENTS
// ====================

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
 * Individual action button component
 */
interface ActionButtonProps {
  config: ButtonConfig;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

function ActionButton({ config, onClick, disabled, isLoading }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'flex items-center justify-center gap-2',
        'px-5 py-2.5 text-sm font-medium rounded-lg',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[rgb(var(--background))]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        config.className,
        config.hoverClassName,
        config.disabledClassName,
        {
          'focus:ring-[rgb(var(--success))]': config.variant === 'approve',
          'focus:ring-[rgb(var(--destructive))]': config.variant === 'reject',
          'focus:ring-[rgb(var(--muted-foreground))]': config.variant === 'skip',
        }
      )}
      aria-busy={isLoading}
      aria-disabled={disabled}
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          <span>{config.loadingLabel}</span>
        </>
      ) : (
        <>
          {config.icon}
          <span>{config.label}</span>
        </>
      )}
    </button>
  );
}

/**
 * Reject confirmation dialog
 */
interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  componentName: string;
}

function ConfirmDialog({ isOpen, onConfirm, onCancel, componentName }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onClick={onCancel}
    >
      <div
        className="bg-[rgb(var(--card))] rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-[rgb(var(--border))]"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[rgb(var(--destructive)/0.1)] flex items-center justify-center">
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
              className="text-[rgb(var(--destructive))]"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h2
              id="confirm-dialog-title"
              className="text-lg font-semibold text-[rgb(var(--foreground))]"
            >
              Reject Component?
            </h2>
            <p
              id="confirm-dialog-description"
              className="text-sm text-[rgb(var(--muted-foreground))]"
            >
              Are you sure you want to reject &quot;{componentName}&quot;?
            </p>
          </div>
        </div>
        <p className="text-sm text-[rgb(var(--muted-foreground))] mb-6">
          This will mark the component as rejected and clear any selected variant.
          You can retry or skip the component later.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg',
              'bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]',
              'hover:bg-[rgb(var(--muted)/0.8)]',
              'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--muted-foreground))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--background))]',
              'transition-colors duration-200'
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg',
              'bg-[rgb(var(--destructive))] text-white',
              'hover:bg-[rgb(var(--destructive)/0.9)]',
              'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--destructive))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--background))]',
              'transition-colors duration-200'
            )}
          >
            Yes, Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ====================
// MAIN COMPONENT
// ====================

/**
 * ApprovalButtons component for component approval workflow
 *
 * Provides Approve, Reject, and Skip buttons for the component approval workflow.
 * Integrates with usePreviewStore for state management and supports
 * auto-advancing to the next component after actions.
 *
 * Features:
 * - Approve button (requires variant selection or custom code)
 * - Reject button (marks component as rejected, clears selection)
 * - Skip button (marks component as skipped for later review)
 * - Loading states during async operations
 * - Optional confirmation dialog for reject action
 * - Auto-advance to next component after action
 * - Keyboard accessibility and ARIA attributes
 *
 * Usage:
 * ```tsx
 * // Basic usage with store integration
 * <ApprovalButtons />
 *
 * // With auto-advance and reject confirmation
 * <ApprovalButtons autoAdvance confirmReject />
 *
 * // With callbacks
 * <ApprovalButtons
 *   onApprove={(id) => console.log('Approved:', id)}
 *   onReject={(id) => console.log('Rejected:', id)}
 *   onSkip={(id) => console.log('Skipped:', id)}
 * />
 *
 * // With explicit component
 * <ApprovalButtons component={myComponent} />
 * ```
 */
export function ApprovalButtons({
  component: propComponent,
  autoAdvance = true,
  confirmReject = false,
  className,
  onApprove,
  onReject,
  onSkip,
}: ApprovalButtonsProps) {
  // Store integration
  const storeComponent = useCurrentComponent();
  const isLoading = usePreviewLoading();
  const approveComponent = usePreviewStore((state) => state.approveComponent);
  const rejectComponent = usePreviewStore((state) => state.rejectComponent);
  const skipComponent = usePreviewStore((state) => state.skipComponent);
  const goToNext = usePreviewStore((state) => state.goToNext);

  // Local state for confirmation dialog
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState<ButtonVariant | null>(null);

  // Use prop component or fall back to store
  const component = propComponent ?? storeComponent;

  // Check if approve is allowed (variant selected or custom code)
  const canApprove =
    component &&
    (component.selectedVariant !== null || (component.customCode && component.customCode.trim() !== ''));

  // Check if component is already processed
  const isProcessed =
    component?.status === 'approved' ||
    component?.status === 'rejected' ||
    component?.status === 'skipped';

  // Handle approve action
  const handleApprove = useCallback(async () => {
    if (!component || !canApprove || actionLoading) return;

    setActionLoading('approve');
    try {
      await approveComponent(component.id);
      onApprove?.(component.id);
      if (autoAdvance) {
        goToNext();
      }
    } finally {
      setActionLoading(null);
    }
  }, [component, canApprove, actionLoading, approveComponent, onApprove, autoAdvance, goToNext]);

  // Handle reject action (with optional confirmation)
  const handleReject = useCallback(() => {
    if (!component || actionLoading) return;

    if (confirmReject) {
      setShowRejectConfirm(true);
    } else {
      executeReject();
    }
  }, [component, actionLoading, confirmReject]);

  // Execute reject after confirmation
  const executeReject = useCallback(() => {
    if (!component) return;

    setActionLoading('reject');
    setShowRejectConfirm(false);
    try {
      rejectComponent(component.id);
      onReject?.(component.id);
      if (autoAdvance) {
        goToNext();
      }
    } finally {
      setActionLoading(null);
    }
  }, [component, rejectComponent, onReject, autoAdvance, goToNext]);

  // Handle skip action
  const handleSkip = useCallback(() => {
    if (!component || actionLoading) return;

    setActionLoading('skip');
    try {
      skipComponent(component.id);
      onSkip?.(component.id);
      if (autoAdvance) {
        goToNext();
      }
    } finally {
      setActionLoading(null);
    }
  }, [component, actionLoading, skipComponent, onSkip, autoAdvance, goToNext]);

  // Cancel reject confirmation
  const handleCancelReject = useCallback(() => {
    setShowRejectConfirm(false);
  }, []);

  // Show empty state if no component
  if (!component) {
    return (
      <div
        className={cn(
          'flex items-center justify-center p-4 rounded-lg',
          'bg-[rgb(var(--muted)/0.3)] text-[rgb(var(--muted-foreground))]',
          className
        )}
        role="status"
        aria-label="No component selected"
      >
        <span className="text-sm">No component selected</span>
      </div>
    );
  }

  // Show processed state with status indicator
  if (isProcessed) {
    const statusConfig = {
      approved: {
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
            className="text-[rgb(var(--success))]"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ),
        label: 'Approved',
        bgClass: 'bg-[rgb(var(--success)/0.1)]',
        textClass: 'text-[rgb(var(--success))]',
      },
      rejected: {
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
            className="text-[rgb(var(--destructive))]"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ),
        label: 'Rejected',
        bgClass: 'bg-[rgb(var(--destructive)/0.1)]',
        textClass: 'text-[rgb(var(--destructive))]',
      },
      skipped: {
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
            className="text-[rgb(var(--warning))]"
            aria-hidden="true"
          >
            <polygon points="5 4 15 12 5 20 5 4" />
            <line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        ),
        label: 'Skipped',
        bgClass: 'bg-[rgb(var(--warning)/0.1)]',
        textClass: 'text-[rgb(var(--warning))]',
      },
    };

    const config = statusConfig[component.status as keyof typeof statusConfig];

    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 p-4 rounded-lg',
          config.bgClass,
          className
        )}
        role="status"
        aria-label={`Component ${config.label}`}
      >
        {config.icon}
        <span className={cn('text-sm font-medium', config.textClass)}>
          {config.label}
        </span>
      </div>
    );
  }

  // Determine if actions are disabled
  const isDisabled = isLoading || actionLoading !== null;

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-center gap-3 p-4 rounded-lg',
          'bg-[rgb(var(--muted)/0.2)]',
          className
        )}
        role="group"
        aria-label="Component approval actions"
      >
        {/* Approve Button */}
        <ActionButton
          config={BUTTON_CONFIG.approve}
          onClick={handleApprove}
          disabled={isDisabled || !canApprove}
          isLoading={actionLoading === 'approve'}
        />

        {/* Reject Button */}
        <ActionButton
          config={BUTTON_CONFIG.reject}
          onClick={handleReject}
          disabled={isDisabled}
          isLoading={actionLoading === 'reject'}
        />

        {/* Skip Button */}
        <ActionButton
          config={BUTTON_CONFIG.skip}
          onClick={handleSkip}
          disabled={isDisabled}
          isLoading={actionLoading === 'skip'}
        />
      </div>

      {/* Helper text for approve disabled state */}
      {!canApprove && !isProcessed && (
        <p className="text-center text-xs text-[rgb(var(--muted-foreground))] mt-2">
          Select a variant or add custom code to enable approval
        </p>
      )}

      {/* Reject Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRejectConfirm}
        onConfirm={executeReject}
        onCancel={handleCancelReject}
        componentName={component.name}
      />
    </>
  );
}

export default ApprovalButtons;
