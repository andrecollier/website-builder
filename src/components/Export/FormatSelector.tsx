'use client';

import { cn } from '@/lib/utils';

/**
 * Available export formats
 */
export type ExportFormat = 'nextjs' | 'static' | 'components';

/**
 * Props for the FormatSelector component
 */
export interface FormatSelectorProps {
  /** Currently selected format */
  selectedFormat?: ExportFormat;
  /** Callback when a format is selected */
  onSelect?: (format: ExportFormat) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * Configuration for export format display
 */
const EXPORT_FORMAT_CONFIG: Record<
  ExportFormat,
  {
    label: string;
    description: string;
    color: string;
    icon: React.ReactNode;
    features: string[];
  }
> = {
  nextjs: {
    label: 'Next.js Project',
    description: 'Complete Next.js 14 app with App Router, TypeScript, and Tailwind CSS',
    color: 'bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent))] border-[rgb(var(--accent)/0.3)]',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    features: ['npm install && npm run dev', 'Full TypeScript support', 'Server Components', 'Hot module reload'],
  },
  static: {
    label: 'Static HTML/CSS',
    description: 'Standalone website with no build step required - open directly in browser',
    color: 'bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))] border-[rgb(var(--success)/0.3)]',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    features: ['No build step', 'Vanilla JavaScript', 'Optimized assets', 'SEO ready'],
  },
  components: {
    label: 'React Components',
    description: 'Standalone React components with Tailwind config and design tokens',
    color: 'bg-[rgb(var(--info)/0.2)] text-[rgb(var(--info))] border-[rgb(var(--info)/0.3)]',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <rect x="7" y="7" width="3" height="9" />
        <rect x="14" y="7" width="3" height="5" />
      </svg>
    ),
    features: ['TSX components', 'Design tokens JSON', 'Tailwind config', 'Easy integration'],
  },
};

/**
 * FormatSelector Component
 *
 * Allows users to select between Next.js, Static HTML/CSS, and React Components export formats.
 * Displays each format as a card with icon, label, description, and key features.
 */
export function FormatSelector({
  selectedFormat,
  onSelect,
  disabled = false,
  className,
}: FormatSelectorProps) {
  const formats: ExportFormat[] = ['nextjs', 'static', 'components'];

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[rgb(var(--foreground))]">
          Export Format
        </h3>
        <span className="text-xs text-[rgb(var(--muted-foreground))]">
          Choose your preferred format
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {formats.map((format) => {
          const config = EXPORT_FORMAT_CONFIG[format];
          const isSelected = selectedFormat === format;

          return (
            <button
              key={format}
              type="button"
              onClick={() => !disabled && onSelect?.(format)}
              disabled={disabled}
              className={cn(
                'relative flex flex-col items-start p-4 rounded-lg border-2 transition-all duration-200',
                'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected
                  ? cn(
                      'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.05)]',
                      'shadow-sm'
                    )
                  : 'border-[rgb(var(--border))] bg-[rgb(var(--background))]',
                !disabled && 'hover:border-[rgb(var(--accent)/0.5)]'
              )}
              aria-pressed={isSelected}
              aria-label={`Select ${config.label} format`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-5 h-5 rounded-full bg-[rgb(var(--accent))] flex items-center justify-center">
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
                  </div>
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-lg mb-3',
                  config.color
                )}
              >
                {config.icon}
              </div>

              {/* Label */}
              <h4 className="text-sm font-semibold text-[rgb(var(--foreground))] mb-1">
                {config.label}
              </h4>

              {/* Description */}
              <p className="text-xs text-[rgb(var(--muted-foreground))] mb-3 leading-relaxed">
                {config.description}
              </p>

              {/* Features */}
              <div className="space-y-1 w-full">
                {config.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start text-xs text-[rgb(var(--muted-foreground))]"
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
                      className="mr-1.5 mt-0.5 flex-shrink-0"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
