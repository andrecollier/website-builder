'use client';

import { useState } from 'react';
import { FailedComponent, ComponentType } from '@/types';
import { cn, formatRelativeTime } from '@/lib/utils';

/**
 * Props for ManualReviewQueue component
 */
export interface ManualReviewQueueProps {
  failedComponents: FailedComponent[];
  onRetry: (componentId: string) => void;
  onSkip: (componentId: string) => void;
  onRetryAll: () => void;
  onSkipAll: () => void;
  isLoading?: boolean;
}

/**
 * ManualReviewQueue component for dashboard showing failed components
 * Displays a list of components that failed generation and require manual review.
 * Supports individual and bulk retry/skip actions with loading states.
 */
export function ManualReviewQueue({
  failedComponents,
  onRetry,
  onSkip,
  onRetryAll,
  onSkipAll,
  isLoading = false,
}: ManualReviewQueueProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  /**
   * Get human-readable name for component type
   */
  const getComponentTypeName = (type: ComponentType): string => {
    const names: Record<ComponentType, string> = {
      header: 'Header',
      hero: 'Hero Section',
      features: 'Features',
      testimonials: 'Testimonials',
      pricing: 'Pricing',
      cta: 'Call to Action',
      footer: 'Footer',
      cards: 'Cards',
      gallery: 'Gallery',
      contact: 'Contact Form',
      faq: 'FAQ',
      stats: 'Statistics',
      team: 'Team',
      logos: 'Logo Grid',
    };
    return names[type] ?? type;
  };

  /**
   * Get icon for component type
   */
  const getComponentIcon = (type: ComponentType): React.ReactNode => {
    // Use a generic component icon for all types
    return (
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
        className="text-[rgb(var(--muted-foreground))]"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    );
  };

  /**
   * Handle individual component retry
   */
  const handleRetry = (e: React.MouseEvent, componentId: string) => {
    e.stopPropagation();
    onRetry(componentId);
  };

  /**
   * Handle individual component skip
   */
  const handleSkip = (e: React.MouseEvent, componentId: string) => {
    e.stopPropagation();
    onSkip(componentId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl" role="status" aria-label="Loading failed components">
        <h2 className="text-lg font-semibold mb-4 text-[rgb(var(--foreground))]">
          Manual Review Queue
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg bg-[rgb(var(--muted)/0.3)] p-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[rgb(var(--muted)/0.5)] rounded w-1/3" />
                  <div className="h-3 bg-[rgb(var(--muted)/0.3)] rounded w-2/3" />
                </div>
                <div className="h-6 w-16 bg-[rgb(var(--muted)/0.5)] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (failedComponents.length === 0) {
    return (
      <div className="w-full max-w-2xl">
        <h2 className="text-lg font-semibold mb-4 text-[rgb(var(--foreground))]">
          Manual Review Queue
        </h2>
        <div
          className="rounded-lg bg-[rgb(var(--success)/0.1)] border border-dashed border-[rgb(var(--success)/0.3)] p-8 text-center"
          role="status"
        >
          {/* Success state icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-4 text-[rgb(var(--success))]"
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h3 className="text-[rgb(var(--success))] font-medium mb-1">
            All components generated successfully
          </h3>
          <p className="text-sm text-[rgb(var(--muted-foreground)/0.7)]">
            No components require manual review at this time
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-lg font-semibold mb-4 text-[rgb(var(--foreground))]">
        Manual Review Queue
      </h2>

      <div
        className="rounded-lg bg-[rgb(var(--warning)/0.1)] border border-[rgb(var(--warning)/0.3)]"
        role="region"
        aria-label={`${failedComponents.length} component${failedComponents.length === 1 ? '' : 's'} require review`}
      >
        {/* Header - Collapsible Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'w-full px-4 py-3 flex items-center justify-between',
            'hover:bg-[rgb(var(--warning)/0.05)] transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[rgb(var(--warning)/0.3)]'
          )}
          aria-expanded={isExpanded}
          aria-controls="review-queue-content"
        >
          <div className="flex items-center gap-3">
            {/* Warning Icon */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[rgb(var(--warning)/0.2)] flex items-center justify-center">
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
                className="text-[rgb(var(--warning))]"
                aria-hidden="true"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            {/* Count Info */}
            <div className="text-left">
              <h3 className="font-semibold text-[rgb(var(--warning))]">
                {failedComponents.length} Component{failedComponents.length === 1 ? '' : 's'} Failed
              </h3>
              <p className="text-xs text-[rgb(var(--muted-foreground))]">
                Review and retry or skip failed components
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
          id="review-queue-content"
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          {/* Bulk Actions */}
          <div className="px-4 py-2 border-t border-[rgb(var(--warning)/0.2)] bg-[rgb(var(--warning)/0.05)] flex items-center gap-2">
            {/* Retry All */}
            <button
              onClick={onRetryAll}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded',
                'bg-[rgb(var(--accent))] text-white',
                'hover:bg-[rgb(var(--accent)/0.9)]',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent)/0.3)]',
                'transition-colors duration-150'
              )}
              aria-label="Retry all failed components"
            >
              Retry All ({failedComponents.length})
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
              aria-label="Skip all failed components"
            >
              Skip All
            </button>
          </div>

          {/* Failed Component List */}
          <ul
            className="px-4 py-3 space-y-2 max-h-[350px] overflow-y-auto"
            role="list"
            aria-label="Failed components list"
          >
            {failedComponents.map((component) => (
              <FailedComponentItem
                key={component.id}
                component={component}
                typeName={getComponentTypeName(component.componentType)}
                typeIcon={getComponentIcon(component.componentType)}
                onRetry={handleRetry}
                onSkip={handleSkip}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual failed component item
 */
interface FailedComponentItemProps {
  component: FailedComponent;
  typeName: string;
  typeIcon: React.ReactNode;
  onRetry: (e: React.MouseEvent, componentId: string) => void;
  onSkip: (e: React.MouseEvent, componentId: string) => void;
}

function FailedComponentItem({
  component,
  typeName,
  typeIcon,
  onRetry,
  onSkip,
}: FailedComponentItemProps) {
  const [showError, setShowError] = useState(false);

  return (
    <li
      className={cn(
        'rounded-lg p-3',
        'bg-[rgb(var(--background)/0.5)] border border-[rgb(var(--warning)/0.3)]'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Component Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Type Icon */}
            {typeIcon}

            {/* Component Type Badge */}
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-[rgb(var(--muted)/0.5)] text-[rgb(var(--muted-foreground))]">
              {typeName}
            </span>

            {/* Retry Count Badge */}
            {component.retryCount > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-[rgb(var(--warning)/0.2)] text-[rgb(var(--warning))]">
                {component.retryCount} {component.retryCount === 1 ? 'retry' : 'retries'}
              </span>
            )}

            {/* Timestamp */}
            <span className="text-xs text-[rgb(var(--muted-foreground)/0.7)]">
              {formatRelativeTime(component.attemptedAt)}
            </span>
          </div>

          {/* Error Message Preview */}
          <p className="text-sm text-[rgb(var(--foreground))] mb-1 truncate">
            {component.error}
          </p>

          {/* Error Details (expandable) */}
          <button
            onClick={() => setShowError(!showError)}
            className="text-xs text-[rgb(var(--accent))] hover:underline focus:outline-none focus:underline"
          >
            {showError ? 'Hide details' : 'Show details'}
          </button>
          {showError && (
            <pre className="mt-2 p-2 rounded bg-[rgb(var(--muted)/0.3)] text-xs text-[rgb(var(--muted-foreground))] overflow-x-auto whitespace-pre-wrap font-mono">
              {component.error}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Retry Button */}
          <button
            onClick={(e) => onRetry(e, component.id)}
            className={cn(
              'p-1.5 rounded',
              'text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.1)]',
              'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent)/0.3)]',
              'transition-colors duration-150'
            )}
            aria-label={`Retry ${typeName} component`}
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

          {/* Skip Button */}
          <button
            onClick={(e) => onSkip(e, component.id)}
            className={cn(
              'p-1.5 rounded',
              'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]',
              'hover:bg-[rgb(var(--muted)/0.3)]',
              'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring)/0.3)]',
              'transition-colors duration-150'
            )}
            aria-label={`Skip ${typeName} component`}
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

export default ManualReviewQueue;
