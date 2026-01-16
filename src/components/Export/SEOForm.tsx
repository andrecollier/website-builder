'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';

/**
 * SEO metadata configuration
 */
export interface SEOMetadata {
  /** Page title for SEO and browser tab */
  title: string;
  /** Meta description for search engines */
  description: string;
  /** Open Graph image URL for social media previews */
  ogImage?: string;
  /** Open Graph image alt text for accessibility */
  ogImageAlt?: string;
}

/**
 * Props for the SEOForm component
 */
export interface SEOFormProps {
  /** Current SEO metadata */
  metadata?: SEOMetadata;
  /** Callback when metadata changes */
  onChange?: (metadata: SEOMetadata) => void;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * Field configuration for SEO metadata inputs
 */
const FIELD_CONFIG = {
  title: {
    label: 'Page Title',
    placeholder: 'My Awesome Website',
    description: 'Appears in browser tabs and search results (50-60 characters recommended)',
    maxLength: 70,
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
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
  description: {
    label: 'Meta Description',
    placeholder: 'A brief description of your website...',
    description: 'Search engine description snippet (150-160 characters recommended)',
    maxLength: 200,
    rows: 3,
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
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
  ogImage: {
    label: 'Open Graph Image',
    placeholder: 'https://example.com/image.jpg',
    description: 'Social media preview image URL (1200x630px recommended)',
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
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  ogImageAlt: {
    label: 'Image Alt Text',
    placeholder: 'Description of the Open Graph image',
    description: 'Descriptive text for screen readers and when image fails to load',
    maxLength: 120,
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
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
} as const;

/**
 * Default SEO metadata
 */
export const DEFAULT_SEO_METADATA: SEOMetadata = {
  title: '',
  description: '',
  ogImage: '',
  ogImageAlt: '',
};

/**
 * SEOForm Component
 *
 * Provides input fields for configuring SEO metadata including page title,
 * meta description, and Open Graph image for social media previews.
 * Includes character count indicators and helpful validation hints.
 */
export function SEOForm({
  metadata = DEFAULT_SEO_METADATA,
  onChange,
  disabled = false,
  className,
}: SEOFormProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: keyof SEOMetadata, value: string) => {
    if (disabled) return;
    onChange?.({
      ...metadata,
      [field]: value,
    });
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getCharacterCount = (text: string, maxLength: number) => {
    const length = text.length;
    const isWarning = length > maxLength * 0.9;
    const isError = length > maxLength;
    return { length, isWarning, isError };
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[rgb(var(--foreground))]">
          SEO Metadata
        </h3>
        <span className="text-xs text-[rgb(var(--muted-foreground))]">
          Optimize for search engines
        </span>
      </div>

      {/* Title Field */}
      <div className="space-y-2">
        <label
          htmlFor="seo-title"
          className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--foreground))]"
        >
          <span className="text-[rgb(var(--muted-foreground))]">
            {FIELD_CONFIG.title.icon}
          </span>
          {FIELD_CONFIG.title.label}
        </label>
        <input
          id="seo-title"
          type="text"
          value={metadata.title}
          onChange={(e) => handleChange('title', e.target.value)}
          onBlur={() => handleBlur('title')}
          placeholder={FIELD_CONFIG.title.placeholder}
          disabled={disabled}
          maxLength={FIELD_CONFIG.title.maxLength}
          className={cn(
            'w-full px-3 py-2 rounded-lg border-2 transition-all duration-200',
            'text-sm text-[rgb(var(--foreground))] bg-[rgb(var(--background))]',
            'placeholder:text-[rgb(var(--muted-foreground)/0.5)]',
            'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            touched.title && !metadata.title
              ? 'border-[rgb(var(--destructive)/0.5)]'
              : 'border-[rgb(var(--border))]',
            !disabled && 'hover:border-[rgb(var(--foreground)/0.3)]'
          )}
          aria-required="true"
          aria-invalid={touched.title && !metadata.title}
          aria-describedby="seo-title-description seo-title-count"
        />
        <div className="flex items-start justify-between gap-2">
          <p
            id="seo-title-description"
            className="text-xs text-[rgb(var(--muted-foreground))] leading-relaxed"
          >
            {FIELD_CONFIG.title.description}
          </p>
          <span
            id="seo-title-count"
            className={cn('text-xs font-mono tabular-nums flex-shrink-0', {
              'text-[rgb(var(--muted-foreground))]': !getCharacterCount(
                metadata.title,
                FIELD_CONFIG.title.maxLength
              ).isWarning,
              'text-[rgb(var(--warning))]': getCharacterCount(
                metadata.title,
                FIELD_CONFIG.title.maxLength
              ).isWarning,
              'text-[rgb(var(--destructive))]': getCharacterCount(
                metadata.title,
                FIELD_CONFIG.title.maxLength
              ).isError,
            })}
            aria-live="polite"
          >
            {metadata.title.length}/{FIELD_CONFIG.title.maxLength}
          </span>
        </div>
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <label
          htmlFor="seo-description"
          className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--foreground))]"
        >
          <span className="text-[rgb(var(--muted-foreground))]">
            {FIELD_CONFIG.description.icon}
          </span>
          {FIELD_CONFIG.description.label}
        </label>
        <textarea
          id="seo-description"
          value={metadata.description}
          onChange={(e) => handleChange('description', e.target.value)}
          onBlur={() => handleBlur('description')}
          placeholder={FIELD_CONFIG.description.placeholder}
          disabled={disabled}
          maxLength={FIELD_CONFIG.description.maxLength}
          rows={FIELD_CONFIG.description.rows}
          className={cn(
            'w-full px-3 py-2 rounded-lg border-2 transition-all duration-200',
            'text-sm text-[rgb(var(--foreground))] bg-[rgb(var(--background))]',
            'placeholder:text-[rgb(var(--muted-foreground)/0.5)]',
            'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'resize-none',
            touched.description && !metadata.description
              ? 'border-[rgb(var(--destructive)/0.5)]'
              : 'border-[rgb(var(--border))]',
            !disabled && 'hover:border-[rgb(var(--foreground)/0.3)]'
          )}
          aria-required="true"
          aria-invalid={touched.description && !metadata.description}
          aria-describedby="seo-description-description seo-description-count"
        />
        <div className="flex items-start justify-between gap-2">
          <p
            id="seo-description-description"
            className="text-xs text-[rgb(var(--muted-foreground))] leading-relaxed"
          >
            {FIELD_CONFIG.description.description}
          </p>
          <span
            id="seo-description-count"
            className={cn('text-xs font-mono tabular-nums flex-shrink-0', {
              'text-[rgb(var(--muted-foreground))]': !getCharacterCount(
                metadata.description,
                FIELD_CONFIG.description.maxLength
              ).isWarning,
              'text-[rgb(var(--warning))]': getCharacterCount(
                metadata.description,
                FIELD_CONFIG.description.maxLength
              ).isWarning,
              'text-[rgb(var(--destructive))]': getCharacterCount(
                metadata.description,
                FIELD_CONFIG.description.maxLength
              ).isError,
            })}
            aria-live="polite"
          >
            {metadata.description.length}/{FIELD_CONFIG.description.maxLength}
          </span>
        </div>
      </div>

      {/* OG Image URL Field */}
      <div className="space-y-2">
        <label
          htmlFor="seo-og-image"
          className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--foreground))]"
        >
          <span className="text-[rgb(var(--muted-foreground))]">
            {FIELD_CONFIG.ogImage.icon}
          </span>
          {FIELD_CONFIG.ogImage.label}
          <span className="text-xs font-normal text-[rgb(var(--muted-foreground))]">
            (Optional)
          </span>
        </label>
        <input
          id="seo-og-image"
          type="url"
          value={metadata.ogImage || ''}
          onChange={(e) => handleChange('ogImage', e.target.value)}
          placeholder={FIELD_CONFIG.ogImage.placeholder}
          disabled={disabled}
          className={cn(
            'w-full px-3 py-2 rounded-lg border-2 transition-all duration-200',
            'text-sm text-[rgb(var(--foreground))] bg-[rgb(var(--background))]',
            'placeholder:text-[rgb(var(--muted-foreground)/0.5)]',
            'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'border-[rgb(var(--border))]',
            !disabled && 'hover:border-[rgb(var(--foreground)/0.3)]'
          )}
          aria-describedby="seo-og-image-description"
        />
        <p
          id="seo-og-image-description"
          className="text-xs text-[rgb(var(--muted-foreground))] leading-relaxed"
        >
          {FIELD_CONFIG.ogImage.description}
        </p>
      </div>

      {/* OG Image Alt Text Field */}
      {metadata.ogImage && (
        <div className="space-y-2">
          <label
            htmlFor="seo-og-image-alt"
            className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--foreground))]"
          >
            <span className="text-[rgb(var(--muted-foreground))]">
              {FIELD_CONFIG.ogImageAlt.icon}
            </span>
            {FIELD_CONFIG.ogImageAlt.label}
          </label>
          <input
            id="seo-og-image-alt"
            type="text"
            value={metadata.ogImageAlt || ''}
            onChange={(e) => handleChange('ogImageAlt', e.target.value)}
            placeholder={FIELD_CONFIG.ogImageAlt.placeholder}
            disabled={disabled}
            maxLength={FIELD_CONFIG.ogImageAlt.maxLength}
            className={cn(
              'w-full px-3 py-2 rounded-lg border-2 transition-all duration-200',
              'text-sm text-[rgb(var(--foreground))] bg-[rgb(var(--background))]',
              'placeholder:text-[rgb(var(--muted-foreground)/0.5)]',
              'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-1',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'border-[rgb(var(--border))]',
              !disabled && 'hover:border-[rgb(var(--foreground)/0.3)]'
            )}
            aria-describedby="seo-og-image-alt-description seo-og-image-alt-count"
          />
          <div className="flex items-start justify-between gap-2">
            <p
              id="seo-og-image-alt-description"
              className="text-xs text-[rgb(var(--muted-foreground))] leading-relaxed"
            >
              {FIELD_CONFIG.ogImageAlt.description}
            </p>
            <span
              id="seo-og-image-alt-count"
              className="text-xs font-mono tabular-nums text-[rgb(var(--muted-foreground))] flex-shrink-0"
              aria-live="polite"
            >
              {(metadata.ogImageAlt || '').length}/{FIELD_CONFIG.ogImageAlt.maxLength}
            </span>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="mt-4 p-3 rounded-lg bg-[rgb(var(--muted)/0.5)] border border-[rgb(var(--border))]">
        <div className="flex items-start gap-2">
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
            className="flex-shrink-0 mt-0.5 text-[rgb(var(--muted-foreground))]"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-xs text-[rgb(var(--muted-foreground))] leading-relaxed">
            SEO metadata will be included in the exported website&apos;s HTML head tags.
            This helps search engines understand your content and improves social media sharing.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SEOForm;
