'use client';

import { useCallback, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MixerCanvasProps, SectionAssignment, SectionType, ReferenceUrl } from '@/types';
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
function getReferenceName(ref: ReferenceUrl | undefined): string {
  if (!ref) return 'Not assigned';
  return ref.name || (ref.url ? getNameFromUrl(ref.url) : 'Unknown');
}

/**
 * Sortable section item props
 */
interface SortableSectionItemProps {
  section: SectionAssignment;
  reference: ReferenceUrl | undefined;
  index: number;
  isDragging?: boolean;
}

/**
 * Sortable section item component
 */
function SortableSectionItem({ section, reference, index, isDragging }: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlyDragging,
  } = useSortable({ id: section.sectionType });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const info = SECTION_INFO[section.sectionType];
  const hasSource = section.sourceId !== null;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'touch-none',
        isCurrentlyDragging && 'z-50'
      )}
    >
      <SectionItemContent
        section={section}
        reference={reference}
        index={index}
        info={info}
        hasSource={hasSource}
        isDragging={isDragging || isCurrentlyDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </li>
  );
}

/**
 * Section item content props
 */
interface SectionItemContentProps {
  section: SectionAssignment;
  reference: ReferenceUrl | undefined;
  index: number;
  info: { label: string; description: string; icon: JSX.Element };
  hasSource: boolean;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

/**
 * Section item content component (used for both sortable and overlay)
 */
function SectionItemContent({
  section,
  reference,
  index,
  info,
  hasSource,
  isDragging,
  dragHandleProps,
}: SectionItemContentProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-[rgb(var(--muted)/0.2)] p-3',
        'border transition-all duration-200',
        {
          'border-[rgb(var(--border))]': !isDragging,
          'border-[rgb(var(--accent))] shadow-lg shadow-[rgb(var(--accent)/0.2)]': !!isDragging,
          'opacity-90': !hasSource,
        }
      )}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <button
          {...dragHandleProps}
          className={cn(
            'p-1.5 rounded cursor-grab active:cursor-grabbing',
            'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]',
            'hover:bg-[rgb(var(--muted)/0.5)]',
            'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring)/0.3)]',
            'transition-colors duration-150'
          )}
          aria-label={`Drag to reorder ${info.label} section`}
          aria-describedby="drag-instructions"
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
            aria-hidden="true"
          >
            <circle cx="9" cy="5" r="1" />
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
        </button>

        {/* Order Badge */}
        <span
          className={cn(
            'w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full flex-shrink-0',
            'bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent))]'
          )}
          aria-hidden="true"
        >
          {index + 1}
        </span>

        {/* Section Icon */}
        <div
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-md flex-shrink-0',
            hasSource
              ? 'bg-[rgb(var(--success)/0.15)] text-[rgb(var(--success))]'
              : 'bg-[rgb(var(--muted)/0.5)] text-[rgb(var(--muted-foreground))]'
          )}
          aria-hidden="true"
        >
          {info.icon}
        </div>

        {/* Section Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[rgb(var(--foreground))] truncate">
            {info.label}
          </p>
          <p className="text-xs text-[rgb(var(--muted-foreground))] truncate">
            {hasSource ? (
              <span className="flex items-center gap-1">
                <span className="text-[rgb(var(--success))]">Source:</span>
                {getReferenceName(reference)}
              </span>
            ) : (
              <span className="text-[rgb(var(--warning))]">No source assigned</span>
            )}
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex-shrink-0">
          {hasSource ? (
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
              className="text-[rgb(var(--success))]"
              aria-label="Section has source assigned"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
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
              aria-label="Section needs source"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * MixerCanvas component for Template Mode
 * Provides drag-and-drop reordering of website sections using @dnd-kit
 * Displays sections with their assigned sources and allows visual reordering
 */
export function MixerCanvas({
  sections,
  references,
  onReorder,
}: MixerCanvasProps) {
  const [activeId, setActiveId] = useState<SectionType | null>(null);

  // Configure sensors for both pointer (mouse/touch) and keyboard interaction
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Get reference for a section assignment
   */
  const getReferenceForSection = useCallback(
    (sourceId: string | null): ReferenceUrl | undefined => {
      if (!sourceId) return undefined;
      return references.find((ref) => ref.id === sourceId);
    },
    [references]
  );

  /**
   * Get active section for drag overlay
   */
  const getActiveSection = useCallback((): SectionAssignment | undefined => {
    if (!activeId) return undefined;
    return sections.find((s) => s.sectionType === activeId);
  }, [activeId, sections]);

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as SectionType);
  }, []);

  /**
   * Handle drag end - reorder sections
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);

      if (over && active.id !== over.id) {
        const oldIndex = sections.findIndex((s) => s.sectionType === active.id);
        const newIndex = sections.findIndex((s) => s.sectionType === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newSections = arrayMove(sections, oldIndex, newIndex);
          // Update order values
          const reorderedSections = newSections.map((section, index) => ({
            ...section,
            order: index,
          }));
          onReorder(reorderedSections);
        }
      }
    },
    [sections, onReorder]
  );

  // Sort sections by order for display
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  // Count sections with sources
  const assignedCount = sections.filter((s) => s.sourceId !== null).length;

  // Get active section for overlay
  const activeSection = getActiveSection();
  const activeSectionIndex = activeSection
    ? sortedSections.findIndex((s) => s.sectionType === activeSection.sectionType)
    : -1;

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
          Section Order
        </h2>
        <span className="text-sm text-[rgb(var(--muted-foreground))]">
          {assignedCount}/{sections.length} assigned
        </span>
      </div>

      {/* Instructions */}
      <div
        className="mb-4 p-3 rounded-lg bg-[rgb(var(--muted)/0.2)] border border-[rgb(var(--border))]"
        role="note"
      >
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
            className="text-[rgb(var(--accent))] flex-shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <polyline points="5 9 2 12 5 15" />
            <polyline points="9 5 12 2 15 5" />
            <polyline points="15 19 12 22 9 19" />
            <polyline points="19 9 22 12 19 15" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="12" y1="2" x2="12" y2="22" />
          </svg>
          <p id="drag-instructions" className="text-sm text-[rgb(var(--muted-foreground))]">
            Drag sections to reorder them. The order shown here will be the final layout of your generated website.
          </p>
        </div>
      </div>

      {/* Sortable Section List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedSections.map((s) => s.sectionType)}
          strategy={verticalListSortingStrategy}
        >
          <ul
            className="space-y-2"
            role="list"
            aria-label="Reorderable section list"
          >
            {sortedSections.map((section, index) => (
              <SortableSectionItem
                key={section.sectionType}
                section={section}
                reference={getReferenceForSection(section.sourceId)}
                index={index}
              />
            ))}
          </ul>
        </SortableContext>

        {/* Drag Overlay - shows the item being dragged */}
        <DragOverlay>
          {activeSection && activeSectionIndex !== -1 ? (
            <div className="w-full max-w-2xl">
              <SectionItemContent
                section={activeSection}
                reference={getReferenceForSection(activeSection.sourceId)}
                index={activeSectionIndex}
                info={SECTION_INFO[activeSection.sectionType]}
                hasSource={activeSection.sourceId !== null}
                isDragging={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Preview Footer */}
      <div className="mt-4 pt-4 border-t border-[rgb(var(--border))]">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[rgb(var(--muted-foreground))]">
            Final section order from top to bottom
          </p>
          {assignedCount < sections.length && (
            <p className="text-xs text-[rgb(var(--warning))] flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {sections.length - assignedCount} section{sections.length - assignedCount !== 1 ? 's' : ''} need sources
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MixerCanvas;
