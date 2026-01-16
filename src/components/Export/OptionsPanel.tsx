'use client';

import { cn } from '@/lib/utils';

/**
 * Export options configuration
 */
export interface ExportOptions {
  /** Enable JavaScript for interactive elements (dropdowns, modals, mobile menus) */
  enableInteractivity: boolean;
  /** Optimize images (WebP conversion, srcset, lazy loading) */
  optimizeImages: boolean;
  /** Generate sitemap.xml for SEO */
  generateSitemap: boolean;
}

/**
 * Props for the OptionsPanel component
 */
export interface OptionsPanelProps {
  /** Current export options */
  options?: ExportOptions;
  /** Callback when options change */
  onChange?: (options: ExportOptions) => void;
  /** Whether the panel is disabled */
  disabled?: boolean;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * Configuration for export options display
 */
const OPTION_CONFIG: Record<
  keyof ExportOptions,
  {
    label: string;
    description: string;
    icon: React.ReactNode;
    recommended?: boolean;
  }
> = {
  enableInteractivity: {
    label: 'Enable Interactivity',
    description: 'Add JavaScript for dropdowns, modals, mobile menus, and accordions',
    recommended: true,
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
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  optimizeImages: {
    label: 'Optimize Images',
    description: 'Convert to WebP, generate srcset for responsive images, add lazy loading',
    recommended: true,
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
  generateSitemap: {
    label: 'Generate Sitemap',
    description: 'Create sitemap.xml for better search engine indexing and SEO',
    recommended: true,
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
      </svg>
    ),
  },
};

/**
 * Default export options
 */
export const DEFAULT_OPTIONS: ExportOptions = {
  enableInteractivity: true,
  optimizeImages: true,
  generateSitemap: true,
};

/**
 * OptionsPanel Component
 *
 * Provides configuration options for the export process including interactivity,
 * image optimization, and sitemap generation. All options are enabled by default
 * and can be toggled individually.
 */
export function OptionsPanel({
  options = DEFAULT_OPTIONS,
  onChange,
  disabled = false,
  className,
}: OptionsPanelProps) {
  const handleToggle = (key: keyof ExportOptions) => {
    if (disabled) return;
    onChange?.({
      ...options,
      [key]: !options[key],
    });
  };

  const optionKeys = Object.keys(OPTION_CONFIG) as Array<keyof ExportOptions>;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[rgb(var(--foreground))]">
          Export Options
        </h3>
        <span className="text-xs text-[rgb(var(--muted-foreground))]">
          Configure your export
        </span>
      </div>

      <div className="space-y-3">
        {optionKeys.map((key) => {
          const config = OPTION_CONFIG[key];
          const isEnabled = options[key];

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleToggle(key)}
              disabled={disabled}
              role="checkbox"
              aria-checked={isEnabled}
              aria-label={config.label}
              className={cn(
                'w-full flex items-start p-4 rounded-lg border-2 transition-all duration-200 text-left',
                'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isEnabled
                  ? 'border-[rgb(var(--accent)/0.3)] bg-[rgb(var(--accent)/0.05)]'
                  : 'border-[rgb(var(--border))] bg-[rgb(var(--background))]',
                !disabled && 'hover:border-[rgb(var(--accent)/0.5)]'
              )}
            >
              {/* Checkbox */}
              <div
                className={cn(
                  'flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-200 mr-3 mt-0.5',
                  'flex items-center justify-center',
                  isEnabled
                    ? 'bg-[rgb(var(--accent))] border-[rgb(var(--accent))]'
                    : 'bg-[rgb(var(--background))] border-[rgb(var(--muted-foreground)/0.3)]'
                )}
              >
                {isEnabled && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                {/* Label and badge */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="text-[rgb(var(--muted-foreground))]">
                      {config.icon}
                    </div>
                    <h4 className="text-sm font-semibold text-[rgb(var(--foreground))]">
                      {config.label}
                    </h4>
                  </div>
                  {config.recommended && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))]">
                      Recommended
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-[rgb(var(--muted-foreground))] leading-relaxed">
                  {config.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary */}
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
            {options.enableInteractivity && options.optimizeImages && options.generateSitemap
              ? 'All recommended options enabled for optimal performance and SEO'
              : 'Consider enabling all options for best results'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default OptionsPanel;
