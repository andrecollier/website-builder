'use client';

import { useMemo } from 'react';
import { cn, getNameFromUrl } from '@/lib/utils';
import type { SectionAssignment, ReferenceUrl, SectionType } from '@/types';

// ====================
// TYPES
// ====================

export interface MixedPreviewProps {
  sections: SectionAssignment[];
  references: ReferenceUrl[];
  className?: string;
}

// ====================
// CONFIGURATION
// ====================

/**
 * Section type display information
 */
const SECTION_INFO: Record<SectionType, { label: string; color: string; icon: JSX.Element }> = {
  header: {
    label: 'Header',
    color: 'bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="5" rx="1" />
        <line x1="3" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },
  hero: {
    label: 'Hero',
    color: 'bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  features: {
    label: 'Features',
    color: 'bg-[rgb(var(--warning)/0.2)] text-[rgb(var(--warning))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  testimonials: {
    label: 'Testimonials',
    color: 'bg-[rgb(var(--info)/0.2)] text-[rgb(var(--info))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  pricing: {
    label: 'Pricing',
    color: 'bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  cta: {
    label: 'CTA',
    color: 'bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  footer: {
    label: 'Footer',
    color: 'bg-[rgb(var(--muted-foreground)/0.2)] text-[rgb(var(--muted-foreground))]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="16" width="18" height="5" rx="1" />
        <line x1="3" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },
};

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Get reference by ID
 */
function getReference(references: ReferenceUrl[], sourceId: string | null): ReferenceUrl | undefined {
  if (!sourceId) return undefined;
  return references.find((ref) => ref.id === sourceId);
}

/**
 * Get display name for a reference
 */
function getReferenceName(ref: ReferenceUrl | undefined): string {
  if (!ref) return 'Not assigned';
  return ref.name || (ref.url ? getNameFromUrl(ref.url) : 'Unnamed source');
}

/**
 * Get display URL for a reference
 */
function getReferenceUrl(ref: ReferenceUrl | undefined): string {
  if (!ref || !ref.url) return '';
  try {
    const url = new URL(ref.url);
    return url.hostname;
  } catch {
    return ref.url;
  }
}

// ====================
// SUB-COMPONENTS
// ====================

/**
 * Preview section item component
 */
interface PreviewSectionItemProps {
  section: SectionAssignment;
  reference: ReferenceUrl | undefined;
  index: number;
  totalSections: number;
}

function PreviewSectionItem({ section, reference, index, totalSections }: PreviewSectionItemProps) {
  const info = SECTION_INFO[section.sectionType];
  const hasSource = section.sourceId !== null;
  const referenceName = getReferenceName(reference);
  const referenceUrl = getReferenceUrl(reference);

  return (
    <div
      className={cn(
        'relative rounded-lg border transition-all duration-200',
        {
          'border-[rgb(var(--border))] bg-[rgb(var(--muted)/0.1)]': hasSource,
          'border-[rgb(var(--border)/0.5)] bg-[rgb(var(--muted)/0.05)] opacity-60': !hasSource,
        }
      )}
    >
      {/* Section Content */}
      <div className="p-4">
        {/* Section Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Section Icon & Label */}
            <div className={cn('flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium', info.color)}>
              {info.icon}
              <span>{info.label}</span>
            </div>

            {/* Order Badge */}
            <span className="text-xs font-mono text-[rgb(var(--muted-foreground))] px-2 py-0.5 rounded bg-[rgb(var(--muted)/0.3)]">
              #{index + 1}
            </span>
          </div>

          {/* Status Indicator */}
          {hasSource ? (
            <div className="flex items-center gap-1 text-[rgb(var(--success))]" title="Assigned">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[rgb(var(--muted-foreground))]" title="Not assigned">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          )}
        </div>

        {/* Reference Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[rgb(var(--muted-foreground))]" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span className={cn('text-xs font-medium truncate', hasSource ? 'text-[rgb(var(--foreground))]' : 'text-[rgb(var(--muted-foreground))]')}>
              {referenceName}
            </span>
          </div>
          {hasSource && referenceUrl && (
            <p className="text-xs text-[rgb(var(--muted-foreground))] truncate pl-5">
              {referenceUrl}
            </p>
          )}
        </div>
      </div>

      {/* Visual Mockup Area */}
      <div
        className={cn(
          'h-20 border-t overflow-hidden',
          {
            'border-[rgb(var(--border))] bg-[rgb(var(--muted)/0.05)]': hasSource,
            'border-[rgb(var(--border)/0.3)] bg-[rgb(var(--muted)/0.02)]': !hasSource,
          }
        )}
        aria-hidden="true"
      >
        {hasSource ? (
          <div className="h-full flex items-center justify-center p-3">
            <div className="w-full space-y-1.5">
              <div className="h-2 bg-[rgb(var(--foreground)/0.15)] rounded-full w-3/4" />
              <div className="h-2 bg-[rgb(var(--foreground)/0.1)] rounded-full w-1/2" />
              <div className="h-2 bg-[rgb(var(--foreground)/0.08)] rounded-full w-2/3" />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <span className="text-xs text-[rgb(var(--muted-foreground)/0.5)]">No preview</span>
          </div>
        )}
      </div>

      {/* Connection Line (not for last item) */}
      {index < totalSections - 1 && (
        <div
          className="absolute left-1/2 -bottom-4 w-px h-4 bg-[rgb(var(--border)/0.5)]"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// ====================
// MAIN COMPONENT
// ====================

/**
 * MixedPreview component for displaying live preview of combined sections
 *
 * Features:
 * - Shows sections in their assigned order
 * - Displays source reference for each section
 * - Visual mockup representation of each section
 * - Status indicators for assigned/unassigned sections
 * - Real-time updates when section assignments change
 *
 * Usage:
 * ```tsx
 * <MixedPreview
 *   sections={sections}
 *   references={references}
 * />
 * ```
 */
export function MixedPreview({ sections, references, className }: MixedPreviewProps) {
  // Sort sections by order
  const sortedSections = useMemo(() => {
    return [...sections].sort((a, b) => a.order - b.order);
  }, [sections]);

  // Count assigned sections
  const assignedCount = useMemo(() => {
    return sections.filter((s) => s.sourceId !== null).length;
  }, [sections]);

  // Check if preview is ready
  const hasPreview = assignedCount > 0;

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
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
              className="text-[rgb(var(--accent))]"
              aria-hidden="true"
            >
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <h3 className="text-sm font-semibold text-[rgb(var(--foreground))]">
              Mixed Preview
            </h3>
          </div>
          <span className="text-xs text-[rgb(var(--muted-foreground))]">
            {assignedCount}/{sections.length} assigned
          </span>
        </div>
        <p className="text-xs text-[rgb(var(--muted-foreground))]">
          Preview of your combined website sections
        </p>
      </div>

      {/* Preview Container */}
      <div
        className="flex-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--muted)/0.05)] overflow-hidden"
        role="region"
        aria-label="Mixed preview panel"
        aria-live="polite"
      >
        {hasPreview ? (
          <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
            {sortedSections.map((section, index) => (
              <PreviewSectionItem
                key={section.sectionType}
                section={section}
                reference={getReference(references, section.sourceId)}
                index={index}
                totalSections={sortedSections.length}
              />
            ))}
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[rgb(var(--muted)/0.3)] flex items-center justify-center mb-4">
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
                className="text-[rgb(var(--muted-foreground))]"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-[rgb(var(--foreground))] mb-2">
              No Sections Assigned
            </h4>
            <p className="text-xs text-[rgb(var(--muted-foreground))] max-w-[250px]">
              Assign reference sources to sections to see a preview of your mixed website
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {hasPreview && (
        <div className="mt-3 flex items-center gap-2 text-xs text-[rgb(var(--muted-foreground))]">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <span>Preview updates in real-time as you make changes</span>
        </div>
      )}
    </div>
  );
}

export default MixedPreview;
