'use client';

import { useCallback, useState } from 'react';
import { ReferenceListProps, ReferenceUrl } from '@/types';
import { cn, isValidUrl, getNameFromUrl } from '@/lib/utils';

/**
 * ReferenceList component for multi-URL input management in Template Mode
 * Allows adding, removing, and editing multiple reference URLs.
 * Each URL shows validation status and can be individually managed.
 */
export function ReferenceList({
  references,
  onAdd,
  onRemove,
  onUpdate,
}: ReferenceListProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [interactedIds, setInteractedIds] = useState<Set<string>>(new Set());

  /**
   * Handle URL change for a reference
   */
  const handleUrlChange = useCallback(
    (id: string, url: string) => {
      onUpdate(id, url);
      if (!interactedIds.has(id)) {
        setInteractedIds((prev) => new Set(prev).add(id));
      }
    },
    [onUpdate, interactedIds]
  );

  /**
   * Handle focus on an input
   */
  const handleFocus = useCallback((id: string) => {
    setFocusedId(id);
  }, []);

  /**
   * Handle blur on an input
   */
  const handleBlur = useCallback(
    (id: string, url: string) => {
      setFocusedId(null);
      if (url.trim() !== '') {
        setInteractedIds((prev) => new Set(prev).add(id));
      }
    },
    []
  );

  /**
   * Get validation state for a reference
   */
  const getValidationState = (ref: ReferenceUrl) => {
    const hasInteracted = interactedIds.has(ref.id);
    const hasValue = ref.url.trim() !== '';
    const showValidation = hasInteracted && hasValue;
    const isValid = isValidUrl(ref.url);

    return {
      showValidation,
      isValid: showValidation && isValid,
      isError: showValidation && !isValid,
    };
  };

  /**
   * Single URL warning - only one URL doesn't require template mode
   */
  const showSingleUrlWarning = references.length === 1;

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
          Reference URLs
        </h2>
        <span className="text-sm text-[rgb(var(--muted-foreground))]">
          {references.length} {references.length === 1 ? 'URL' : 'URLs'}
        </span>
      </div>

      {/* Single URL Warning */}
      {showSingleUrlWarning && (
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
            Template Mode works best with multiple URLs. Add another reference to mix sections from different sites.
          </p>
        </div>
      )}

      {/* Reference List */}
      <ul className="space-y-3" role="list" aria-label="Reference URL list">
        {references.map((ref, index) => {
          const { showValidation, isValid, isError } = getValidationState(ref);
          const displayName = ref.name || (ref.url ? getNameFromUrl(ref.url) : `Reference ${index + 1}`);
          const isFocused = focusedId === ref.id;

          return (
            <li key={ref.id}>
              <div
                className={cn(
                  'rounded-lg bg-[rgb(var(--muted)/0.2)] p-4',
                  'border transition-all duration-200',
                  {
                    'border-[rgb(var(--border))]': !isError && !isValid,
                    'border-[rgb(var(--destructive))]': isError,
                    'border-[rgb(var(--success))]': isValid,
                  }
                )}
              >
                {/* Reference Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {/* Index Badge */}
                    <span
                      className={cn(
                        'w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full',
                        {
                          'bg-[rgb(var(--muted)/0.5)] text-[rgb(var(--muted-foreground))]': !isValid && !isError,
                          'bg-[rgb(var(--destructive)/0.2)] text-[rgb(var(--destructive))]': isError,
                          'bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))]': isValid,
                        }
                      )}
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    {/* Display Name */}
                    <span className="text-sm font-medium text-[rgb(var(--foreground))]">
                      {displayName}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => onRemove(ref.id)}
                    disabled={references.length <= 1}
                    className={cn(
                      'p-1.5 rounded transition-all duration-150',
                      'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--destructive))]',
                      'hover:bg-[rgb(var(--destructive)/0.1)]',
                      'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring)/0.3)]',
                      'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[rgb(var(--muted-foreground))]'
                    )}
                    aria-label={`Remove reference ${index + 1}`}
                    title={references.length <= 1 ? 'Cannot remove the only reference' : `Remove ${displayName}`}
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
                    </svg>
                  </button>
                </div>

                {/* URL Input */}
                <div className="relative">
                  {/* URL Icon */}
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
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
                      className="text-[rgb(var(--muted-foreground))]"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </div>

                  {/* Input Field */}
                  <input
                    type="url"
                    value={ref.url}
                    onChange={(e) => handleUrlChange(ref.id, e.target.value)}
                    onFocus={() => handleFocus(ref.id)}
                    onBlur={() => handleBlur(ref.id, ref.url)}
                    placeholder="https://example.com"
                    autoComplete="url"
                    spellCheck={false}
                    className={cn(
                      'w-full py-2.5 pl-10 pr-10 text-sm rounded-md',
                      'bg-[rgb(var(--input))] border transition-all duration-200',
                      'placeholder:text-[rgb(var(--muted-foreground))]',
                      'focus:outline-none focus:ring-2',
                      {
                        'border-[rgb(var(--border))] focus:border-[rgb(var(--accent))] focus:ring-[rgb(var(--ring)/0.2)]':
                          !isError && !isValid,
                        'border-[rgb(var(--destructive))] focus:border-[rgb(var(--destructive))] focus:ring-[rgb(var(--destructive)/0.2)]':
                          isError,
                        'border-[rgb(var(--success))] focus:border-[rgb(var(--success))] focus:ring-[rgb(var(--success)/0.2)]':
                          isValid,
                      }
                    )}
                    aria-invalid={isError}
                    aria-describedby={isError ? `url-error-${ref.id}` : undefined}
                    aria-label={`URL for reference ${index + 1}`}
                  />

                  {/* Validation Icon */}
                  {showValidation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {isValid ? (
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
                          aria-hidden="true"
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
                          className="text-[rgb(var(--destructive))]"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {isError && (
                  <p
                    id={`url-error-${ref.id}`}
                    className="mt-2 text-xs text-[rgb(var(--destructive))] flex items-center gap-1"
                    role="alert"
                  >
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
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Please enter a valid URL (e.g., https://example.com)
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Add Reference Button */}
      <button
        onClick={onAdd}
        className={cn(
          'mt-4 w-full py-3 px-4 rounded-lg',
          'border-2 border-dashed border-[rgb(var(--border))]',
          'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]',
          'hover:border-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.05)]',
          'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring)/0.3)]',
          'transition-all duration-200',
          'flex items-center justify-center gap-2'
        )}
        aria-label="Add another reference URL"
      >
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
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span className="font-medium">Add Reference URL</span>
      </button>

      {/* Helper Text */}
      <p className="mt-3 text-xs text-[rgb(var(--muted-foreground))] text-center">
        Add multiple websites to mix and match sections from different designs
      </p>
    </div>
  );
}

export default ReferenceList;
