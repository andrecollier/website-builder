'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProjectListProps, Website, WebsiteStatus } from '@/types';
import { cn, formatRelativeTime, truncate } from '@/lib/utils';

/**
 * ProjectList component for displaying website history
 * Card-based list showing previously generated websites with status badges.
 * Supports selection, deletion with confirmation, and loading states.
 */
export function ProjectList({
  projects,
  onSelect,
  onDelete,
  isLoading = false,
}: ProjectListProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  /**
   * Handle delete button click - show confirmation
   */
  const handleDeleteClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setDeleteConfirmId(projectId);
  };

  /**
   * Confirm deletion
   */
  const handleConfirmDelete = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    onDelete(projectId);
    setDeleteConfirmId(null);
  };

  /**
   * Cancel deletion
   */
  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  /**
   * Get status badge styling based on status
   */
  const getStatusBadgeStyles = (status: WebsiteStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))]';
      case 'in_progress':
        return 'bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent))]';
      case 'failed':
        return 'bg-[rgb(var(--destructive)/0.2)] text-[rgb(var(--destructive))]';
      case 'pending':
      default:
        return 'bg-[rgb(var(--muted)/0.5)] text-[rgb(var(--muted-foreground))]';
    }
  };

  /**
   * Get human-readable status label
   */
  const getStatusLabel = (status: WebsiteStatus) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'failed':
        return 'Failed';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl" role="status" aria-label="Loading projects">
        <h2 className="text-lg font-semibold mb-4 text-[rgb(var(--foreground))]">
          Recent Projects
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
  if (projects.length === 0) {
    return (
      <div className="w-full max-w-2xl">
        <h2 className="text-lg font-semibold mb-4 text-[rgb(var(--foreground))]">
          Recent Projects
        </h2>
        <div
          className="rounded-lg bg-[rgb(var(--muted)/0.2)] border border-dashed border-[rgb(var(--border))] p-8 text-center"
          role="status"
        >
          {/* Empty state icon */}
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
            className="mx-auto mb-4 text-[rgb(var(--muted-foreground))]"
            aria-hidden="true"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <h3 className="text-[rgb(var(--muted-foreground))] font-medium mb-1">
            No websites generated yet
          </h3>
          <p className="text-sm text-[rgb(var(--muted-foreground)/0.7)]">
            Enter a URL above to start extracting your first website
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-lg font-semibold mb-4 text-[rgb(var(--foreground))]">
        Recent Projects
      </h2>
      <ul className="space-y-3" role="list" aria-label="Project list">
        {projects.map((project) => (
          <li key={project.id}>
            <button
              onClick={() => onSelect(project)}
              className={cn(
                'w-full text-left rounded-lg bg-[rgb(var(--muted)/0.3)] p-4',
                'border border-transparent transition-all duration-200',
                'hover:bg-[rgb(var(--muted)/0.5)] hover:border-[rgb(var(--border))]',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring)/0.3)]',
                'group'
              )}
              aria-label={`Select project: ${project.name}`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Project Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    {/* Project Name */}
                    <h3 className="font-medium text-[rgb(var(--foreground))] truncate">
                      {project.name}
                    </h3>
                    {/* Status Badge */}
                    <span
                      className={cn(
                        'flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded',
                        getStatusBadgeStyles(project.status)
                      )}
                    >
                      {getStatusLabel(project.status)}
                    </span>
                  </div>

                  {/* Reference URL */}
                  <p className="text-sm text-[rgb(var(--muted-foreground))] truncate mb-2">
                    {truncate(project.reference_url, 50)}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-[rgb(var(--muted-foreground)/0.7)]">
                    {/* Created At */}
                    <span className="flex items-center gap-1">
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
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {formatRelativeTime(project.created_at)}
                    </span>

                    {/* Version */}
                    <span className="flex items-center gap-1">
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
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      v{project.current_version}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {deleteConfirmId === project.id ? (
                    <>
                      {/* Confirm Delete */}
                      <button
                        onClick={(e) => handleConfirmDelete(e, project.id)}
                        className={cn(
                          'px-3 py-1.5 text-xs font-medium rounded',
                          'bg-[rgb(var(--destructive))] text-white',
                          'hover:bg-[rgb(var(--destructive)/0.9)]',
                          'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--destructive)/0.3)]',
                          'transition-colors duration-150'
                        )}
                        aria-label="Confirm delete"
                      >
                        Delete
                      </button>
                      {/* Cancel Delete */}
                      <button
                        onClick={handleCancelDelete}
                        className={cn(
                          'px-3 py-1.5 text-xs font-medium rounded',
                          'bg-[rgb(var(--muted)/0.5)] text-[rgb(var(--muted-foreground))]',
                          'hover:bg-[rgb(var(--muted))]',
                          'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring)/0.3)]',
                          'transition-colors duration-150'
                        )}
                        aria-label="Cancel delete"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Compare Button - only for completed projects */}
                      {project.status === 'completed' && (
                        <Link
                          href={`/compare/${project.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            'px-2 py-1 text-xs font-medium rounded',
                            'bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--accent))]',
                            'hover:bg-[rgb(var(--accent)/0.2)]',
                            'opacity-0 group-hover:opacity-100',
                            'focus:outline-none focus:opacity-100 focus:ring-2 focus:ring-[rgb(var(--accent)/0.3)]',
                            'transition-all duration-150'
                          )}
                          aria-label={`Compare project: ${project.name}`}
                        >
                          Compare
                        </Link>
                      )}
                      {/* View Arrow */}
                      <span
                        className="text-[rgb(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-hidden="true"
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
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </span>
                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteClick(e, project.id)}
                        className={cn(
                          'p-1.5 rounded opacity-0 group-hover:opacity-100',
                          'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--destructive))]',
                          'hover:bg-[rgb(var(--destructive)/0.1)]',
                          'focus:outline-none focus:opacity-100 focus:ring-2 focus:ring-[rgb(var(--ring)/0.3)]',
                          'transition-all duration-150'
                        )}
                        aria-label={`Delete project: ${project.name}`}
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
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProjectList;
