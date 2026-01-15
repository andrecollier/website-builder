'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  useColorTokens,
  useTypographyTokens,
  useSpacingTokens,
  useEffectsTokens,
  useEditorTokens,
} from '@/store/useEditorStore';
import type { DesignSystem } from '@/types';

// ====================
// TYPES
// ====================

interface PreviewSectionProps {
  title: string;
  children: React.ReactNode;
}

interface SampleButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

interface SampleCardProps {
  title: string;
  description: string;
  style?: React.CSSProperties;
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Generates CSS custom properties object from design tokens
 * This allows preview components to use tokens as CSS variables
 */
function generatePreviewStyles(tokens: DesignSystem | null): React.CSSProperties {
  if (!tokens) return {};

  const styles: Record<string, string> = {};

  // Colors
  if (tokens.colors.primary.length > 0) {
    styles['--preview-primary'] = tokens.colors.primary[0];
  }
  if (tokens.colors.secondary.length > 0) {
    styles['--preview-secondary'] = tokens.colors.secondary[0];
  }
  if (tokens.colors.neutral.length > 0) {
    styles['--preview-bg'] = tokens.colors.neutral[0];
    styles['--preview-text'] = tokens.colors.neutral[tokens.colors.neutral.length - 1];
  }
  if (tokens.colors.neutral.length > 2) {
    styles['--preview-border'] = tokens.colors.neutral[2];
    styles['--preview-muted'] = tokens.colors.neutral[1];
  }

  // Semantic colors
  styles['--preview-success'] = tokens.colors.semantic.success;
  styles['--preview-error'] = tokens.colors.semantic.error;
  styles['--preview-warning'] = tokens.colors.semantic.warning;
  styles['--preview-info'] = tokens.colors.semantic.info;

  // Typography
  styles['--preview-font-heading'] = tokens.typography.fonts.heading;
  styles['--preview-font-body'] = tokens.typography.fonts.body;
  if (tokens.typography.fonts.mono) {
    styles['--preview-font-mono'] = tokens.typography.fonts.mono;
  }

  // Effects
  styles['--preview-shadow-sm'] = tokens.effects.shadows.sm;
  styles['--preview-shadow-md'] = tokens.effects.shadows.md;
  styles['--preview-shadow-lg'] = tokens.effects.shadows.lg;
  styles['--preview-radius-sm'] = tokens.effects.radii.sm;
  styles['--preview-radius-md'] = tokens.effects.radii.md;
  styles['--preview-radius-lg'] = tokens.effects.radii.lg;
  styles['--preview-transition-fast'] = tokens.effects.transitions.fast;
  styles['--preview-transition-normal'] = tokens.effects.transitions.normal;

  return styles as React.CSSProperties;
}

// ====================
// SUB-COMPONENTS
// ====================

/**
 * Section wrapper for preview groups
 */
function PreviewSection({ title, children }: PreviewSectionProps) {
  return (
    <div className="mb-6 last:mb-0">
      <h4 className="text-xs font-medium text-[rgb(var(--muted-foreground))] uppercase tracking-wide mb-3">
        {title}
      </h4>
      {children}
    </div>
  );
}

/**
 * Sample button component using design tokens
 */
function SampleButton({ variant, size = 'md', children, style }: SampleButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantStyles: Record<typeof variant, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--preview-primary)',
      color: '#ffffff',
      border: 'none',
      boxShadow: 'var(--preview-shadow-sm)',
      borderRadius: 'var(--preview-radius-md)',
      transition: `all var(--preview-transition-fast)`,
    },
    secondary: {
      backgroundColor: 'var(--preview-secondary)',
      color: '#ffffff',
      border: 'none',
      boxShadow: 'var(--preview-shadow-sm)',
      borderRadius: 'var(--preview-radius-md)',
      transition: `all var(--preview-transition-fast)`,
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--preview-primary)',
      border: '2px solid var(--preview-primary)',
      borderRadius: 'var(--preview-radius-md)',
      transition: `all var(--preview-transition-fast)`,
    },
  };

  return (
    <button
      type="button"
      className={cn(
        sizeClasses[size],
        'font-medium cursor-pointer hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2'
      )}
      style={{
        ...variantStyles[variant],
        fontFamily: 'var(--preview-font-body)',
        ...style,
      }}
      aria-label={`Sample ${variant} button`}
    >
      {children}
    </button>
  );
}

/**
 * Sample card component using design tokens
 */
function SampleCard({ title, description, style }: SampleCardProps) {
  return (
    <div
      className="p-4"
      style={{
        backgroundColor: 'var(--preview-bg)',
        border: '1px solid var(--preview-border)',
        borderRadius: 'var(--preview-radius-lg)',
        boxShadow: 'var(--preview-shadow-md)',
        ...style,
      }}
    >
      <h5
        className="font-semibold mb-2"
        style={{
          fontFamily: 'var(--preview-font-heading)',
          color: 'var(--preview-text)',
        }}
      >
        {title}
      </h5>
      <p
        className="text-sm"
        style={{
          fontFamily: 'var(--preview-font-body)',
          color: 'var(--preview-text)',
          opacity: 0.8,
        }}
      >
        {description}
      </p>
    </div>
  );
}

/**
 * Typography preview showing heading and body text styles
 */
function TypographyPreview() {
  const typography = useTypographyTokens();

  if (!typography) return null;

  return (
    <div className="space-y-3">
      {/* Display */}
      <div
        style={{
          fontFamily: typography.fonts.heading,
          fontSize: typography.scale.display,
          fontWeight: Math.max(...(typography.weights || [700])),
          lineHeight: typography.lineHeights.tight,
          color: 'var(--preview-text)',
        }}
      >
        Display
      </div>
      {/* Headings */}
      <div className="space-y-1">
        <div
          style={{
            fontFamily: typography.fonts.heading,
            fontSize: typography.scale.h1,
            fontWeight: Math.max(...(typography.weights || [700])),
            lineHeight: typography.lineHeights.tight,
            color: 'var(--preview-text)',
          }}
        >
          Heading 1
        </div>
        <div
          style={{
            fontFamily: typography.fonts.heading,
            fontSize: typography.scale.h2,
            fontWeight: 600,
            lineHeight: typography.lineHeights.tight,
            color: 'var(--preview-text)',
          }}
        >
          Heading 2
        </div>
        <div
          style={{
            fontFamily: typography.fonts.heading,
            fontSize: typography.scale.h3,
            fontWeight: 600,
            lineHeight: typography.lineHeights.normal,
            color: 'var(--preview-text)',
          }}
        >
          Heading 3
        </div>
      </div>
      {/* Body */}
      <div
        style={{
          fontFamily: typography.fonts.body,
          fontSize: typography.scale.body,
          fontWeight: 400,
          lineHeight: typography.lineHeights.relaxed,
          color: 'var(--preview-text)',
          opacity: 0.9,
        }}
      >
        Body text looks like this. It uses the body font family with relaxed line height for better readability.
      </div>
      {/* Small */}
      <div
        style={{
          fontFamily: typography.fonts.body,
          fontSize: typography.scale.small,
          fontWeight: 400,
          lineHeight: typography.lineHeights.normal,
          color: 'var(--preview-text)',
          opacity: 0.7,
        }}
      >
        Small text for captions and metadata
      </div>
      {/* Mono (if available) */}
      {typography.fonts.mono && (
        <div
          style={{
            fontFamily: typography.fonts.mono,
            fontSize: typography.scale.body,
            lineHeight: typography.lineHeights.normal,
            color: 'var(--preview-text)',
            opacity: 0.8,
            padding: '0.5rem',
            backgroundColor: 'var(--preview-muted)',
            borderRadius: 'var(--preview-radius-sm)',
          }}
        >
          <code>const code = &apos;monospace&apos;;</code>
        </div>
      )}
    </div>
  );
}

/**
 * Spacing preview showing padding and gap examples
 */
function SpacingPreview() {
  const spacing = useSpacingTokens();

  if (!spacing) return null;

  // Show a visual representation of the spacing scale
  const scaleToShow = spacing.scale.slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Spacing scale visualization */}
      <div className="flex items-end gap-2 flex-wrap">
        {scaleToShow.map((size, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <div
              style={{
                width: `${Math.min(size, 48)}px`,
                height: `${Math.min(size, 48)}px`,
                backgroundColor: 'var(--preview-primary)',
                borderRadius: 'var(--preview-radius-sm)',
                opacity: 0.7,
              }}
              aria-hidden="true"
            />
            <span
              className="text-xs font-mono"
              style={{ color: 'var(--preview-text)', opacity: 0.6 }}
            >
              {size}
            </span>
          </div>
        ))}
      </div>

      {/* Container width indicator */}
      <div
        className="p-3 text-center text-xs"
        style={{
          border: '2px dashed var(--preview-border)',
          borderRadius: 'var(--preview-radius-md)',
          color: 'var(--preview-text)',
          opacity: 0.8,
        }}
      >
        Container: {spacing.containerMaxWidth}
      </div>

      {/* Section padding indicator */}
      <div className="flex gap-4 text-xs">
        <div
          className="flex-1 p-2 text-center"
          style={{
            backgroundColor: 'var(--preview-muted)',
            borderRadius: 'var(--preview-radius-sm)',
            color: 'var(--preview-text)',
          }}
        >
          Mobile: {spacing.sectionPadding.mobile}
        </div>
        <div
          className="flex-1 p-2 text-center"
          style={{
            backgroundColor: 'var(--preview-muted)',
            borderRadius: 'var(--preview-radius-sm)',
            color: 'var(--preview-text)',
          }}
        >
          Desktop: {spacing.sectionPadding.desktop}
        </div>
      </div>
    </div>
  );
}

/**
 * Effects preview showing shadows, radii, and transitions
 */
function EffectsPreview() {
  const effects = useEffectsTokens();

  if (!effects) return null;

  return (
    <div className="space-y-4">
      {/* Shadow examples */}
      <div className="grid grid-cols-4 gap-3">
        {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <div key={size} className="flex flex-col items-center gap-2">
            <div
              className="w-12 h-12"
              style={{
                backgroundColor: 'var(--preview-bg)',
                boxShadow: effects.shadows[size],
                borderRadius: 'var(--preview-radius-md)',
              }}
              aria-hidden="true"
            />
            <span
              className="text-xs font-mono"
              style={{ color: 'var(--preview-text)', opacity: 0.6 }}
            >
              {size}
            </span>
          </div>
        ))}
      </div>

      {/* Radius examples */}
      <div className="grid grid-cols-4 gap-3">
        {(['sm', 'md', 'lg', 'full'] as const).map((size) => (
          <div key={size} className="flex flex-col items-center gap-2">
            <div
              className="w-12 h-12"
              style={{
                backgroundColor: 'var(--preview-primary)',
                borderRadius: effects.radii[size],
                opacity: 0.6,
              }}
              aria-hidden="true"
            />
            <span
              className="text-xs font-mono"
              style={{ color: 'var(--preview-text)', opacity: 0.6 }}
            >
              {size}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Alert/notification preview using semantic colors
 */
function AlertsPreview() {
  const colors = useColorTokens();

  if (!colors) return null;

  const alerts = [
    { type: 'success', label: 'Success', color: colors.semantic.success },
    { type: 'error', label: 'Error', color: colors.semantic.error },
    { type: 'warning', label: 'Warning', color: colors.semantic.warning },
    { type: 'info', label: 'Info', color: colors.semantic.info },
  ];

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.type}
          className="px-3 py-2 text-sm flex items-center gap-2"
          style={{
            backgroundColor: `${alert.color}20`,
            borderLeft: `3px solid ${alert.color}`,
            borderRadius: 'var(--preview-radius-sm)',
            color: 'var(--preview-text)',
            fontFamily: 'var(--preview-font-body)',
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: alert.color }}
            aria-hidden="true"
          />
          {alert.label} alert message
        </div>
      ))}
    </div>
  );
}

// ====================
// MAIN COMPONENT
// ====================

/**
 * LivePreview component that renders sample UI elements using current design tokens
 *
 * Features:
 * - Real-time updates when any token is modified in the editor
 * - Sample buttons, cards, typography, spacing, and effects
 * - Semantic color alerts demonstration
 * - Responsive layout that works within the editor panel
 */
export function LivePreview() {
  const tokens = useEditorTokens();

  // Generate CSS custom properties from tokens
  const previewStyles = useMemo(() => generatePreviewStyles(tokens), [tokens]);

  // If no tokens loaded, show empty state
  if (!tokens) {
    return (
      <div
        className="w-full rounded-lg bg-[rgb(var(--muted)/0.3)] p-6"
        role="region"
        aria-label="Live preview empty state"
      >
        <div className="flex flex-col items-center justify-center gap-3 text-[rgb(var(--muted-foreground))]">
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
            aria-hidden="true"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          <p className="text-sm">No tokens loaded</p>
          <p className="text-xs">Extract a website to see the live preview</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full rounded-lg bg-[rgb(var(--muted)/0.3)] p-4 overflow-auto"
      role="region"
      aria-label="Live preview panel"
      aria-live="polite"
      style={previewStyles}
    >
      {/* Preview Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgb(var(--border)/0.5)]">
        <div className="flex items-center gap-2">
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
            className="text-[rgb(var(--accent))]"
            aria-hidden="true"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <h3 className="text-sm font-semibold text-[rgb(var(--foreground))]">
            Live Preview
          </h3>
        </div>
        <span className="text-xs text-[rgb(var(--muted-foreground))]">
          Updates in real-time
        </span>
      </div>

      {/* Preview Content */}
      <div
        className="rounded-lg p-4"
        style={{
          backgroundColor: 'var(--preview-bg)',
          border: '1px solid var(--preview-border)',
        }}
      >
        {/* Buttons Section */}
        <PreviewSection title="Buttons">
          <div className="flex flex-wrap gap-3">
            <SampleButton variant="primary">Primary</SampleButton>
            <SampleButton variant="secondary">Secondary</SampleButton>
            <SampleButton variant="outline">Outline</SampleButton>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            <SampleButton variant="primary" size="sm">Small</SampleButton>
            <SampleButton variant="primary" size="md">Medium</SampleButton>
            <SampleButton variant="primary" size="lg">Large</SampleButton>
          </div>
        </PreviewSection>

        {/* Cards Section */}
        <PreviewSection title="Cards">
          <div className="grid gap-3">
            <SampleCard
              title="Feature Card"
              description="This card demonstrates the design tokens including colors, typography, shadows, and border radius."
            />
          </div>
        </PreviewSection>

        {/* Typography Section */}
        <PreviewSection title="Typography">
          <TypographyPreview />
        </PreviewSection>

        {/* Spacing Section */}
        <PreviewSection title="Spacing">
          <SpacingPreview />
        </PreviewSection>

        {/* Effects Section */}
        <PreviewSection title="Effects">
          <EffectsPreview />
        </PreviewSection>

        {/* Alerts Section */}
        <PreviewSection title="Alerts">
          <AlertsPreview />
        </PreviewSection>
      </div>

      {/* Token Summary Footer */}
      <div className="mt-4 pt-3 border-t border-[rgb(var(--border)/0.5)]">
        <div className="flex flex-wrap gap-4 text-xs text-[rgb(var(--muted-foreground))]">
          <div className="flex items-center gap-1">
            <span className="font-medium">Colors:</span>
            <span>
              {tokens.colors.primary.length + tokens.colors.secondary.length + tokens.colors.neutral.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Fonts:</span>
            <span>{Object.keys(tokens.typography.fonts).length}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Base unit:</span>
            <span>{tokens.spacing.baseUnit}px</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Source:</span>
            <span className="truncate max-w-[150px]" title={tokens.meta.sourceUrl}>
              {new URL(tokens.meta.sourceUrl).hostname}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LivePreview;
