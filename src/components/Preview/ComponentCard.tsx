'use client';

import { usePreviewStore, useCurrentComponent } from '@/store/usePreviewStore';
import type { ComponentVariant, GeneratedComponent, ComponentType } from '@/types';
import { cn, truncate } from '@/lib/utils';

/**
 * Props for the ComponentCard component
 */
export interface ComponentCardProps {
  /** The variant to display */
  variant?: ComponentVariant;
  /** The parent component (optional - uses current component from store if not provided) */
  component?: GeneratedComponent;
  /** Whether this variant is selected */
  isSelected?: boolean;
  /** Callback when the card is clicked (optional - uses store action if not provided) */
  onSelect?: (variantId: string) => void;
  /** Whether to show the preview image */
  showPreview?: boolean;
  /** Whether to show accuracy score */
  showAccuracy?: boolean;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * Configuration for component type display
 */
const COMPONENT_TYPE_CONFIG: Record<
  ComponentType,
  {
    label: string;
    color: string;
    icon: React.ReactNode;
  }
> = {
  header: {
    label: 'Header',
    color: 'bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
      </svg>
    ),
  },
  hero: {
    label: 'Hero',
    color: 'bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    ),
  },
  features: {
    label: 'Features',
    color: 'bg-[rgb(var(--warning)/0.2)] text-[rgb(var(--warning))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  testimonials: {
    label: 'Testimonials',
    color: 'bg-[rgb(var(--info)/0.2)] text-[rgb(var(--info))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  pricing: {
    label: 'Pricing',
    color: 'bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  cta: {
    label: 'CTA',
    color: 'bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  footer: {
    label: 'Footer',
    color: 'bg-[rgb(var(--muted-foreground)/0.2)] text-[rgb(var(--muted-foreground))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 15h18" />
      </svg>
    ),
  },
  cards: {
    label: 'Cards',
    color: 'bg-[rgb(var(--warning)/0.2)] text-[rgb(var(--warning))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    ),
  },
  gallery: {
    label: 'Gallery',
    color: 'bg-[rgb(var(--info)/0.2)] text-[rgb(var(--info))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    ),
  },
  contact: {
    label: 'Contact',
    color: 'bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  faq: {
    label: 'FAQ',
    color: 'bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  stats: {
    label: 'Stats',
    color: 'bg-[rgb(var(--warning)/0.2)] text-[rgb(var(--warning))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  team: {
    label: 'Team',
    color: 'bg-[rgb(var(--info)/0.2)] text-[rgb(var(--info))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  logos: {
    label: 'Logos',
    color: 'bg-[rgb(var(--muted-foreground)/0.2)] text-[rgb(var(--muted-foreground))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
};

/**
 * Configuration for variant type display
 */
const VARIANT_TYPE_CONFIG: Record<
  ComponentVariant['name'],
  {
    badge: string;
    description: string;
  }
> = {
  'Variant A': {
    badge: 'bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent))]',
    description: 'Pixel-perfect match',
  },
  'Variant B': {
    badge: 'bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))]',
    description: 'Semantic structure',
  },
  'Variant C': {
    badge: 'bg-[rgb(var(--warning)/0.2)] text-[rgb(var(--warning))]',
    description: 'Modernized + A11y',
  },
};

/**
 * ComponentCard component for displaying a single variant with preview
 *
 * Shows a variant card with optional preview image, description, accuracy score,
 * and selection state. Can be used standalone or integrated with the preview store.
 *
 * Usage:
 * ```tsx
 * // Standalone usage
 * <ComponentCard
 *   variant={variant}
 *   component={component}
 *   isSelected={true}
 *   onSelect={handleSelect}
 * />
 *
 * // Using store integration
 * <ComponentCard variant={variant} />
 * ```
 */
export function ComponentCard({
  variant,
  component,
  isSelected,
  onSelect,
  showPreview = true,
  showAccuracy = true,
  disabled = false,
  className,
}: ComponentCardProps) {
  // Get component from store if not provided via props
  const storeComponent = useCurrentComponent();
  const selectVariant = usePreviewStore((state) => state.selectVariant);

  // Use prop component or fall back to store component
  const currentComponent = component ?? storeComponent;

  // Determine if this variant is selected
  const isVariantSelected =
    isSelected ?? (currentComponent?.selectedVariant === variant?.id);

  // Handle selection
  const handleSelect = () => {
    if (disabled || !variant) return;

    if (onSelect) {
      onSelect(variant.id);
    } else if (currentComponent) {
      selectVariant(currentComponent.id, variant.id);
    }
  };

  // Handle keyboard selection (Enter/Space)
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect();
    }
  };

  // Show empty state if no variant
  if (!variant) {
    return (
      <div
        className={cn(
          'w-full rounded-lg bg-[rgb(var(--muted)/0.3)] p-4',
          className
        )}
        role="status"
        aria-label="No variant available"
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
          <span className="text-sm">No variant available</span>
        </div>
      </div>
    );
  }

  const variantConfig = VARIANT_TYPE_CONFIG[variant.name];
  const componentTypeConfig = currentComponent
    ? COMPONENT_TYPE_CONFIG[currentComponent.type]
    : null;

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isVariantSelected}
      aria-disabled={disabled}
      aria-label={`${variant.name}: ${variant.description || variantConfig.description}`}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-2',
        {
          // Default state
          'border-[rgb(var(--border))] bg-[rgb(var(--background))]': !isVariantSelected,
          'hover:border-[rgb(var(--foreground)/0.3)] hover:shadow-md': !isVariantSelected && !disabled,
          // Selected state
          'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.05)] ring-2 ring-[rgb(var(--accent))]':
            isVariantSelected,
          // Disabled state
          'cursor-not-allowed opacity-50': disabled,
          'cursor-pointer': !disabled,
        },
        className
      )}
    >
      {/* Selection Indicator */}
      {isVariantSelected && (
        <div
          className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]"
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

      {/* Preview Image */}
      {showPreview && (
        <div className="relative aspect-video w-full overflow-hidden bg-[rgb(var(--muted)/0.3)]">
          {variant.previewImage ? (
            <img
              src={variant.previewImage}
              alt={`Preview of ${variant.name}`}
              className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[rgb(var(--muted-foreground))]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}

          {/* Component Type Badge (on preview) */}
          {componentTypeConfig && (
            <div
              className={cn(
                'absolute left-2 top-2 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
                componentTypeConfig.color
              )}
            >
              {componentTypeConfig.icon}
              <span>{componentTypeConfig.label}</span>
            </div>
          )}
        </div>
      )}

      {/* Card Content */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          {/* Variant Name Badge */}
          <span
            className={cn(
              'inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold',
              variantConfig.badge
            )}
          >
            {variant.name}
          </span>

          {/* Accuracy Score Badge */}
          {showAccuracy && variant.accuracyScore !== undefined && (
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
          )}
        </div>

        {/* Description */}
        <p
          className={cn('text-xs leading-relaxed', {
            'text-[rgb(var(--foreground)/0.8)]': isVariantSelected,
            'text-[rgb(var(--muted-foreground))]': !isVariantSelected,
          })}
        >
          {truncate(variant.description || variantConfig.description, 80)}
        </p>

        {/* Accuracy Progress Bar */}
        {showAccuracy && variant.accuracyScore !== undefined && (
          <div className="mt-auto pt-2">
            <div
              className="h-1 w-full overflow-hidden rounded-full bg-[rgb(var(--muted))]"
              role="progressbar"
              aria-valuenow={variant.accuracyScore}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Accuracy: ${variant.accuracyScore}%`}
            >
              <div
                className={cn('h-full rounded-full transition-all duration-300', {
                  'bg-[rgb(var(--success))]': variant.accuracyScore >= 80,
                  'bg-[rgb(var(--warning))]':
                    variant.accuracyScore >= 50 && variant.accuracyScore < 80,
                  'bg-[rgb(var(--destructive))]': variant.accuracyScore < 50,
                })}
                style={{ width: `${variant.accuracyScore}%` }}
              />
            </div>
          </div>
        )}

        {/* Component Info Footer (when no preview) */}
        {!showPreview && componentTypeConfig && (
          <div className="mt-auto flex items-center gap-1.5 pt-2 text-xs text-[rgb(var(--muted-foreground))]">
            <span className={cn('flex items-center gap-1 rounded px-1.5 py-0.5', componentTypeConfig.color)}>
              {componentTypeConfig.icon}
              <span>{componentTypeConfig.label}</span>
            </span>
            {currentComponent && (
              <span className="text-[rgb(var(--border))]">&bull;</span>
            )}
            {currentComponent && (
              <span className="truncate">{currentComponent.name}</span>
            )}
          </div>
        )}
      </div>

      {/* Hover Overlay */}
      {!disabled && !isVariantSelected && (
        <div
          className="absolute inset-0 bg-[rgb(var(--accent)/0.05)] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default ComponentCard;
