'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ApprovalGateProps {
  websiteId: string;
  websiteName: string;
  componentCount?: number;
  onApprove: () => void;
  onReject: () => void;
}

/**
 * ApprovalGate component
 * Displays when pipeline is paused after component generation, awaiting user approval.
 * Shows a link to preview components and buttons to approve or reject.
 */
export function ApprovalGate({
  websiteId,
  websiteName,
  componentCount,
  onApprove,
  onReject,
}: ApprovalGateProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const response = await fetch('/api/pipeline/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId }),
      });

      if (response.ok) {
        onApprove();
      } else {
        const data = await response.json();
        console.error('Approval failed:', data.error);
      }
    } catch (error) {
      console.error('Approval error:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      // For now, rejecting just deletes the website
      const response = await fetch(`/api/websites?id=${websiteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onReject();
      }
    } catch (error) {
      console.error('Rejection error:', error);
    } finally {
      setIsRejecting(false);
    }
  };

  // Construct the preview URL - assuming generated site runs on port 3002
  const previewUrl = `http://localhost:3002/preview/components`;

  return (
    <div className="w-full rounded-lg bg-[rgb(var(--warning)/0.1)] border border-[rgb(var(--warning)/0.3)] p-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[rgb(var(--warning)/0.2)] flex items-center justify-center">
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
            className="text-[rgb(var(--warning))]"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">
            Awaiting Approval
          </h3>
          <p className="text-sm text-[rgb(var(--muted-foreground))] mt-1">
            Component generation complete for <span className="font-medium">{websiteName}</span>.
            {componentCount && ` ${componentCount} components generated.`}
          </p>
        </div>
      </div>

      {/* Preview Link */}
      <div className="mb-6 p-4 rounded-lg bg-[rgb(var(--background))] border border-[rgb(var(--border)/0.3)]">
        <p className="text-sm text-[rgb(var(--muted-foreground))] mb-2">
          Review the generated components before continuing:
        </p>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex items-center gap-2 text-[rgb(var(--accent))] hover:underline font-medium'
          )}
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
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          View Components Gallery
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
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleApprove}
          disabled={isApproving || isRejecting}
          className={cn(
            'flex-1 py-2.5 px-4 rounded-lg font-medium text-white',
            'bg-[rgb(var(--success))] hover:bg-[rgb(var(--success)/0.9)]',
            'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--success)/0.3)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200',
            'flex items-center justify-center gap-2'
          )}
        >
          {isApproving ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
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
              Approving...
            </>
          ) : (
            <>
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
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Approve & Continue
            </>
          )}
        </button>

        <button
          onClick={handleReject}
          disabled={isApproving || isRejecting}
          className={cn(
            'py-2.5 px-4 rounded-lg font-medium',
            'bg-[rgb(var(--destructive)/0.1)] text-[rgb(var(--destructive))]',
            'hover:bg-[rgb(var(--destructive)/0.2)]',
            'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--destructive)/0.3)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200',
            'flex items-center justify-center gap-2'
          )}
        >
          {isRejecting ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
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
            </>
          ) : (
            <>
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Reject
            </>
          )}
        </button>
      </div>

      {/* Info text */}
      <p className="mt-4 text-xs text-[rgb(var(--muted-foreground))]">
        Approving will continue the pipeline with scaffolding, validation, and comparison.
        Rejecting will delete this extraction.
      </p>
    </div>
  );
}

export default ApprovalGate;
