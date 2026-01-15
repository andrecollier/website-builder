'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { SectionPickerProps, SectionType, SectionAssignment, ReferenceUrl } from '@/types';
import { cn, getNameFromUrl } from '@/lib/utils';

/**
 * Section type display information
 */
const SECTION_INFO: Record<SectionType, { label: string; description: string; icon: JSX.Element }> = {
  header: {
    label: 'Header',
    description: 'Navigation and branding',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="5" rx="1" />
        <line x1="3" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },
  hero: {
    label: 'Hero',
    description: 'Main banner section',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  features: {
    label: 'Features',
    description: 'Product/service highlights',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  testimonials: {
    label: 'Testimonials',
    description: 'Customer reviews',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  pricing: {
    label: 'Pricing',
    description: 'Pricing plans and tiers',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  cta: {
    label: 'CTA',
    description: 'Call to action section',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  footer: {
    label: 'Footer',
    description: 'Site footer with links',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="16" width="18" height="5" rx="1" />
        <line x1="3" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },
};

/**
 * Get display name for a reference URL
 */
function getReferenceName(ref: ReferenceUrl): string {
  return ref.name || (ref.url ? getNameFromUrl(ref.url) : 'Unknown');
}

/**
 * SectionPicker component for Template Mode
 * Allows selecting which reference URL each section type should come from
 * Uses Radix UI DropdownMenu for accessible dropdown per section type
 */
export function SectionPicker({
  sections,
  references,
  onAssign,
}: SectionPickerProps) {
  // Only show valid references in dropdown
  const validReferences = references.filter((ref) => ref.isValid);

  /**
   * Get the assigned reference for a section
   */
  const getAssignedReference = (sectionType: SectionType): ReferenceUrl | null => {
    const assignment = sections.find((s) => s.sectionType === sectionType);
    if (!assignment?.sourceId) return null;
    return references.find((ref) => ref.id === assignment.sourceId) || null;
  };

  /**
   * Handle source selection for a section
   */
  const handleSelect = (sectionType: SectionType, sourceId: string | null) => {
    onAssign(sectionType, sourceId);
  };

  // Get all section types in order
  const sectionTypes: SectionType[] = ['header', 'hero', 'features', 'testimonials', 'pricing', 'cta', 'footer'];

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
          Section Sources
        </h2>
        <span className="text-sm text-[rgb(var(--muted-foreground))]">
          {validReferences.length} {validReferences.length === 1 ? 'source' : 'sources'} available
        </span>
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
            Add valid reference URLs to assign section sources.
          </p>
        </div>
      )}

      {/* Section List */}
      <ul className="space-y-2" role="list" aria-label="Section source assignments">
        {sectionTypes.map((sectionType) => {
          const info = SECTION_INFO[sectionType];
          const assignedRef = getAssignedReference(sectionType);

          return (
            <li key={sectionType}>
              <div
                className={cn(
                  'rounded-lg bg-[rgb(var(--muted)/0.2)] p-3',
                  'border border-[rgb(var(--border))]',
                  'flex items-center justify-between gap-4'
                )}
              >
                {/* Section Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Icon */}
                  <div
                    className={cn(
                      'w-8 h-8 flex items-center justify-center rounded-md flex-shrink-0',
                      'bg-[rgb(var(--muted)/0.5)] text-[rgb(var(--muted-foreground))]'
                    )}
                    aria-hidden="true"
                  >
                    {info.icon}
                  </div>
                  {/* Label and Description */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[rgb(var(--foreground))] truncate">
                      {info.label}
                    </p>
                    <p className="text-xs text-[rgb(var(--muted-foreground))] truncate">
                      {info.description}
                    </p>
                  </div>
                </div>

                {/* Dropdown Menu */}
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                        'bg-[rgb(var(--input))] border border-[rgb(var(--border))]',
                        'hover:bg-[rgb(var(--accent)/0.1)] hover:border-[rgb(var(--accent)/0.5)]',
                        'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring)/0.3)]',
                        'transition-all duration-150',
                        'min-w-[140px] justify-between',
                        validReferences.length === 0 && 'opacity-50 cursor-not-allowed'
                      )}
                      disabled={validReferences.length === 0}
                      aria-label={`Select source for ${info.label} section`}
                    >
                      <span
                        className={cn(
                          'truncate',
                          assignedRef
                            ? 'text-[rgb(var(--foreground))]'
                            : 'text-[rgb(var(--muted-foreground))]'
                        )}
                      >
                        {assignedRef ? getReferenceName(assignedRef) : 'Select source'}
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
                        'min-w-[180px] max-w-[280px] p-1 rounded-lg',
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
                        onSelect={() => handleSelect(sectionType, null)}
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
                        {!assignedRef && (
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
                          onSelect={() => handleSelect(sectionType, ref.id)}
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
                          {assignedRef?.id === ref.id && (
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
            </li>
          );
        })}
      </ul>

      {/* Helper Text */}
      <p className="mt-3 text-xs text-[rgb(var(--muted-foreground))] text-center">
        Select which reference website each section should be sourced from
      </p>
    </div>
  );
}

export default SectionPicker;
