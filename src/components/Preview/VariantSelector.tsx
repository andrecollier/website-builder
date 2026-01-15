'use client';

import { usePreviewStore, useCurrentComponent } from '@/store/usePreviewStore';
import type { ComponentVariant, GeneratedComponent } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Props for the VariantSelector component
 */
export interface VariantSelectorProps {
  /** The component to display variants for (optional - uses current component from store if not provided) */
  component?: GeneratedComponent;
  /** Callback when a variant is selected (optional - uses store action if not provided) */
  onSelect?: (variantId: string) => void;
  /** Whether to show accuracy scores if available */
  showAccuracy?: boolean;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * Configuration for variant display styles
 */
const VARIANT_CONFIG: Record<
  ComponentVariant['name'],
  {
    badge: string;
    activeBg: string;
    activeRing: string;
    icon: React.ReactNode;
  }
> = {
  'Variant A': {
    badge: 'bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent))]',
    activeBg: 'bg-[rgb(var(--accent)/0.1)]',
    activeRing: 'ring-[rgb(var(--accent))]',
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
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 9h6v6H9z" />
      </svg>
    ),
  },
  'Variant B': {
    badge: 'bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))]',
    activeBg: 'bg-[rgb(var(--success)/0.1)]',
    activeRing: 'ring-[rgb(var(--success))]',
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
        <path d="M12 3v18" />
        <path d="M8 6h8" />
        <path d="M6 9h12" />
        <path d="M4 12h16" />
        <path d="M6 15h12" />
        <path d="M8 18h8" />
      </svg>
    ),
  },
  'Variant C': {
    badge: 'bg-[rgb(var(--warning)/0.2)] text-[rgb(var(--warning))]',
    activeBg: 'bg-[rgb(var(--warning)/0.1)]',
    activeRing: 'ring-[rgb(var(--warning))]',
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
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
};

/**
 * Variant descriptions for each strategy
 */
const VARIANT_DESCRIPTIONS: Record<ComponentVariant['name'], string> = {
  'Variant A': 'Pixel-perfect match prioritizing visual fidelity',
  'Variant B': 'Semantic match with cleaner code architecture',
  'Variant C': 'Modernized with ARIA and performance optimizations',
};

/**
 * VariantSelector component for selecting between A/B/C component variants
 *
 * Displays the three variant options (Pixel-perfect, Semantic, Modernized) as
 * selectable cards, with visual indicators for the currently selected variant
 * and optional accuracy scores.
 *
 * Usage:
 * ```tsx
 * // Using store integration
 * <VariantSelector />
 *
 * // With explicit component
 * <VariantSelector component={myComponent} onSelect={handleSelect} />
 * ```
 */
export function VariantSelector({
  component,
  onSelect,
  showAccuracy = true,
  disabled = false,
  className,
}: VariantSelectorProps) {
  // Get component from store if not provided via props
  const storeComponent = useCurrentComponent();
  const selectVariant = usePreviewStore((state) => state.selectVariant);

  // Use prop component or fall back to store component
  const currentComponent = component ?? storeComponent;

  // Handle selection
  const handleSelect = (variantId: string) => {
    if (disabled) return;

    if (onSelect) {
      onSelect(variantId);
    } else if (currentComponent) {
      selectVariant(currentComponent.id, variantId);
    }
  };

  // Show empty state if no component
  if (!currentComponent) {
    return (
      <div
        className={cn(
          'w-full rounded-lg bg-[rgb(var(--muted)/0.3)] p-4',
          className
        )}
        role="status"
        aria-label="No component selected"
      >
        <div className="flex items-center justify-center gap-3 text-[rgb(var(--muted-foreground))]">
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
          <span className="text-sm">No component selected</span>
        </div>
      </div>
    );
  }

  // Show error state if no variants
  if (!currentComponent.variants || currentComponent.variants.length === 0) {
    return (
      <div
        className={cn(
          'w-full rounded-lg bg-[rgb(var(--destructive)/0.1)] p-4',
          className
        )}
        role="alert"
        aria-label="No variants available"
      >
        <div className="flex items-center gap-3 text-[rgb(var(--destructive))]">
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
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-sm">No variants generated for this component</span>
        </div>
      </div>
    );
  }

  const selectedVariantId = currentComponent.selectedVariant;

  return (
    <div
      className={cn('w-full', className)}
      role="radiogroup"
      aria-label={`Select variant for ${currentComponent.name}`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-[rgb(var(--foreground))]">
          Select Variant
        </h3>
        <span className="text-xs text-[rgb(var(--muted-foreground))]">
          {currentComponent.variants.length} options
        </span>
      </div>

      {/* Variant Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {currentComponent.variants.map((variant) => {
          const isSelected = selectedVariantId === variant.id;
          const config = VARIANT_CONFIG[variant.name];
          const defaultDescription = VARIANT_DESCRIPTIONS[variant.name];

          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => handleSelect(variant.id)}
              className={cn(
                'relative flex flex-col gap-2 rounded-lg border p-4 text-left transition-all duration-200',
                'hover:border-[rgb(var(--foreground)/0.3)]',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                {
                  // Default state
                  'border-[rgb(var(--border))] bg-[rgb(var(--background))]':
                    !isSelected,
                  // Selected state
                  [`border-transparent ${config.activeBg} ring-2 ${config.activeRing}`]:
                    isSelected,
                  // Disabled state
                  'cursor-not-allowed opacity-50': disabled,
                  'cursor-pointer': !disabled,
                }
              )}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}

              {/* Variant Header */}
              <div className="flex items-center gap-2">
                {/* Icon */}
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md',
                    config.badge
                  )}
                >
                  {config.icon}
                </span>

                {/* Name */}
                <span
                  className={cn('text-sm font-semibold', {
                    'text-[rgb(var(--foreground))]': isSelected,
                    'text-[rgb(var(--muted-foreground))]': !isSelected,
                  })}
                >
                  {variant.name}
                </span>
              </div>

              {/* Description */}
              <p
                className={cn('text-xs leading-relaxed', {
                  'text-[rgb(var(--foreground)/0.8)]': isSelected,
                  'text-[rgb(var(--muted-foreground))]': !isSelected,
                })}
              >
                {variant.description || defaultDescription}
              </p>

              {/* Accuracy Score */}
              {showAccuracy && variant.accuracyScore !== undefined && (
                <div className="mt-auto flex items-center gap-1.5 pt-2">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgb(var(--muted))]"
                    role="progressbar"
                    aria-valuenow={variant.accuracyScore}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Accuracy: ${variant.accuracyScore}%`}
                  >
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        {
                          'bg-[rgb(var(--success))]': variant.accuracyScore >= 80,
                          'bg-[rgb(var(--warning))]':
                            variant.accuracyScore >= 50 && variant.accuracyScore < 80,
                          'bg-[rgb(var(--destructive))]': variant.accuracyScore < 50,
                        }
                      )}
                      style={{ width: `${variant.accuracyScore}%` }}
                    />
                  </div>
                  <span
                    className={cn('text-xs font-mono tabular-nums', {
                      'text-[rgb(var(--success))]': variant.accuracyScore >= 80,
                      'text-[rgb(var(--warning))]':
                        variant.accuracyScore >= 50 && variant.accuracyScore < 80,
                      'text-[rgb(var(--destructive))]': variant.accuracyScore < 50,
                    })}
                  >
                    {variant.accuracyScore}%
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Code Indicator */}
      {currentComponent.customCode && (
        <div
          className="mt-3 flex items-center gap-2 rounded-md bg-[rgb(var(--muted)/0.3)] px-3 py-2 text-xs text-[rgb(var(--muted-foreground))]"
          role="status"
        >
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
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span>Custom code has been applied to this component</span>
        </div>
      )}
    </div>
  );
}

export default VariantSelector;
