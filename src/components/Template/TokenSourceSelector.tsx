'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { TokenSourceSelectorProps, ReferenceUrl } from '@/types';
import { cn, getNameFromUrl } from '@/lib/utils';

/**
 * Get display name for a reference URL
 */
function getReferenceName(ref: ReferenceUrl): string {
  return ref.name || (ref.url ? getNameFromUrl(ref.url) : 'Unknown');
}

/**
 * TokenSourceSelector component for Template Mode
 * Allows selecting which reference provides the primary design tokens (colors, fonts, spacing)
 * Uses Radix UI DropdownMenu for accessible dropdown selection
 */
export function TokenSourceSelector({
  references,
  primaryTokenSource,
  onSelect,
}: TokenSourceSelectorProps) {
  // Only show valid references in dropdown
  const validReferences = references.filter((ref) => ref.isValid);

  /**
   * Get the selected reference
   */
  const selectedReference = primaryTokenSource
    ? references.find((ref) => ref.id === primaryTokenSource) || null
    : null;

  /**
   * Handle source selection
   */
  const handleSelect = (sourceId: string | null) => {
    onSelect(sourceId);
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
            Primary Design Tokens
          </h2>
          <p className="text-sm text-[rgb(var(--muted-foreground))] mt-1">
            Choose which reference provides the base colors, fonts, and spacing
          </p>
        </div>
      </div>

      {/* No valid references warning */}
      {validReferences.length === 0 && (
        <div
          className="mb-4 p-3 rounded-lg bg-[rgb(var(--warning)/0.1)] border border-[rgb(var(--warning)/0.3)] flex items-start gap-2"
          role="alert"
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
            className="text-[rgb(var(--warning))] flex-shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-sm text-[rgb(var(--warning))]">
            Add valid reference URLs to select a primary token source.
          </p>
        </div>
      )}

      {/* Token Source Selector */}
      <div
        className={cn(
          'rounded-lg bg-[rgb(var(--muted)/0.2)] p-4',
          'border border-[rgb(var(--border))]',
          'flex items-center justify-between gap-4'
        )}
      >
        {/* Icon and Label */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Design Token Icon */}
          <div
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-md flex-shrink-0',
              'bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent))]'
            )}
            aria-hidden="true"
          >
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
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
            </svg>
          </div>
          {/* Label and Description */}
          <div className="min-w-0">
            <p className="text-sm font-medium text-[rgb(var(--foreground))]">
              Token Source
            </p>
            <p className="text-xs text-[rgb(var(--muted-foreground))]">
              {validReferences.length} {validReferences.length === 1 ? 'source' : 'sources'} available
            </p>
          </div>
        </div>

        {/* Dropdown Menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-md text-sm',
                'bg-[rgb(var(--input))] border border-[rgb(var(--border))]',
                'hover:bg-[rgb(var(--accent)/0.1)] hover:border-[rgb(var(--accent)/0.5)]',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring)/0.3)]',
                'transition-all duration-150',
                'min-w-[180px] justify-between',
                validReferences.length === 0 && 'opacity-50 cursor-not-allowed'
              )}
              disabled={validReferences.length === 0}
              aria-label="Select primary design token source"
            >
              <span
                className={cn(
                  'truncate font-medium',
                  selectedReference
                    ? 'text-[rgb(var(--foreground))]'
                    : 'text-[rgb(var(--muted-foreground))]'
                )}
              >
                {selectedReference ? getReferenceName(selectedReference) : 'Select source'}
              </span>
              {/* Chevron Icon */}
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
                className="text-[rgb(var(--muted-foreground))] flex-shrink-0"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className={cn(
                'min-w-[220px] max-w-[320px] p-1 rounded-lg',
                'bg-[rgb(var(--popover))] border border-[rgb(var(--border))]',
                'shadow-lg shadow-black/20',
                'animate-in fade-in-0 zoom-in-95',
                'data-[side=bottom]:slide-in-from-top-2',
                'data-[side=top]:slide-in-from-bottom-2'
              )}
              sideOffset={4}
              align="end"
            >
              {/* None option */}
              <DropdownMenu.Item
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer',
                  'text-[rgb(var(--muted-foreground))]',
                  'hover:bg-[rgb(var(--accent)/0.1)] hover:text-[rgb(var(--foreground))]',
                  'focus:bg-[rgb(var(--accent)/0.1)] focus:text-[rgb(var(--foreground))]',
                  'focus:outline-none',
                  'transition-colors duration-150'
                )}
                onSelect={() => handleSelect(null)}
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
                  className="flex-shrink-0 opacity-50"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
                <span>None</span>
                {!selectedReference && (
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
                    className="ml-auto text-[rgb(var(--accent))]"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px my-1 bg-[rgb(var(--border))]" />

              {/* Reference options */}
              {validReferences.map((ref, index) => (
                <DropdownMenu.Item
                  key={ref.id}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer',
                    'text-[rgb(var(--foreground))]',
                    'hover:bg-[rgb(var(--accent)/0.1)]',
                    'focus:bg-[rgb(var(--accent)/0.1)]',
                    'focus:outline-none',
                    'transition-colors duration-150'
                  )}
                  onSelect={() => handleSelect(ref.id)}
                >
                  {/* Index Badge */}
                  <span
                    className={cn(
                      'w-5 h-5 flex items-center justify-center text-xs font-medium rounded-full flex-shrink-0',
                      'bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent))]'
                    )}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  {/* Reference Name */}
                  <span className="truncate">{getReferenceName(ref)}</span>
                  {/* Check mark for selected */}
                  {selectedReference?.id === ref.id && (
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
                      className="ml-auto text-[rgb(var(--accent))]"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Info Card */}
      <div className="mt-4 p-3 rounded-lg bg-[rgb(var(--muted)/0.1)] border border-[rgb(var(--border)/0.5)]">
        <div className="flex items-start gap-2">
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
            className="text-[rgb(var(--muted-foreground))] flex-shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div className="text-xs text-[rgb(var(--muted-foreground))] space-y-1">
            <p>
              The primary token source provides the foundation for your website&apos;s design system,
              including color palette, typography, and spacing values.
            </p>
            <p>
              Sections from other references will be adapted to match these tokens for visual consistency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TokenSourceSelector;
