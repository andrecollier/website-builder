'use client';

import { useCallback, useState, useEffect } from 'react';
import { UrlInputProps } from '@/types';
import { isValidUrl, cn } from '@/lib/utils';

/**
 * UrlInput component with validation and error state
 * Large, centered input for entering reference website URLs
 */
export function UrlInput({
  value,
  onChange,
  isValid,
  disabled = false,
  placeholder = 'Enter website URL to extract...',
}: UrlInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Reset interaction state when value is cleared
  useEffect(() => {
    if (value === '') {
      setHasInteracted(false);
    }
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
      if (!hasInteracted) {
        setHasInteracted(true);
      }
    },
    [onChange, hasInteracted]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (value.trim() !== '') {
      setHasInteracted(true);
    }
  }, [value]);

  // Determine if we should show validation state
  const showValidation = hasInteracted && value.trim() !== '';
  const showError = showValidation && !isValid;
  const showSuccess = showValidation && isValid;

  // Internal validation for display purposes
  const internallyValid = isValidUrl(value);
  const displayValid = showSuccess || (showValidation && internallyValid);
  const displayError = showError || (showValidation && !internallyValid);

  return (
    <div className="w-full max-w-2xl">
      <div className="relative">
        {/* URL Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
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
            className="text-muted"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>

        {/* Input Field */}
        <input
          type="url"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="url"
          spellCheck={false}
          className={cn(
            // Base styles
            'w-full py-4 pl-12 pr-12 text-lg rounded-lg',
            'bg-[rgb(var(--input))] border transition-all duration-200',
            'placeholder:text-[rgb(var(--muted-foreground))]',
            // Focus styles
            'focus:outline-none focus:ring-2',
            // Disabled styles
            disabled && 'opacity-50 cursor-not-allowed',
            // Validation states
            {
              // Default/neutral state
              'border-[rgb(var(--border))] focus:border-[rgb(var(--accent))] focus:ring-[rgb(var(--ring)/0.2)]':
                !displayError && !displayValid,
              // Error state
              'border-[rgb(var(--destructive))] focus:border-[rgb(var(--destructive))] focus:ring-[rgb(var(--destructive)/0.2)]':
                displayError,
              // Success state
              'border-[rgb(var(--success))] focus:border-[rgb(var(--success))] focus:ring-[rgb(var(--success)/0.2)]':
                displayValid,
            }
          )}
          aria-invalid={displayError}
          aria-describedby={displayError ? 'url-error' : undefined}
        />

        {/* Validation Icon */}
        {showValidation && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {displayValid ? (
              // Green checkmark
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
                className="text-[rgb(var(--success))]"
                aria-hidden="true"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              // Red X
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
      {displayError && (
        <p
          id="url-error"
          className="mt-2 text-sm text-[rgb(var(--destructive))] flex items-center gap-1"
          role="alert"
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
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Please enter a valid URL (e.g., https://example.com)
        </p>
      )}

      {/* Helper Text */}
      {!showValidation && !isFocused && value === '' && (
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          Enter the URL of the website you want to extract and replicate
        </p>
      )}
    </div>
  );
}

export default UrlInput;
