'use client';

import { useState, useCallback, useMemo } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';
import { useEffectsTokens, useEditorStore } from '@/store/useEditorStore';
import type { EffectsExtraction } from '@/types';

// ====================
// TYPES
// ====================

type EffectsCategory = 'shadows' | 'radii' | 'transitions';

type ShadowSize = 'sm' | 'md' | 'lg' | 'xl';
type RadiusSize = 'sm' | 'md' | 'lg' | 'full';
type TransitionSpeed = 'fast' | 'normal' | 'slow';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

interface SectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

interface ShadowPreviewProps {
  shadow: string;
  size: ShadowSize;
  isSelected: boolean;
  onClick: () => void;
}

interface RadiusPreviewProps {
  radius: string;
  size: RadiusSize;
  isSelected: boolean;
  onClick: () => void;
}

interface TransitionPreviewProps {
  duration: string;
  speed: TransitionSpeed;
  isActive: boolean;
}

// ====================
// CONFIGURATION
// ====================

const SHADOW_SIZES: ShadowSize[] = ['sm', 'md', 'lg', 'xl'];
const RADIUS_SIZES: RadiusSize[] = ['sm', 'md', 'lg', 'full'];
const TRANSITION_SPEEDS: TransitionSpeed[] = ['fast', 'normal', 'slow'];

const SHADOW_SIZE_LABELS: Record<ShadowSize, string> = {
  sm: 'Small',
  md: 'Medium',
  lg: 'Large',
  xl: 'Extra Large',
};

const RADIUS_SIZE_LABELS: Record<RadiusSize, string> = {
  sm: 'Small',
  md: 'Medium',
  lg: 'Large',
  full: 'Full',
};

const TRANSITION_SPEED_LABELS: Record<TransitionSpeed, string> = {
  fast: 'Fast',
  normal: 'Normal',
  slow: 'Slow',
};

const DEFAULT_SHADOWS: Record<ShadowSize, string> = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
};

const DEFAULT_RADII: Record<RadiusSize, string> = {
  sm: '0.125rem',
  md: '0.375rem',
  lg: '0.5rem',
  full: '9999px',
};

const DEFAULT_TRANSITIONS: Record<TransitionSpeed, string> = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
};

const RADIUS_PRESETS = [
  { label: 'None', value: '0' },
  { label: '2px', value: '2px' },
  { label: '4px', value: '4px' },
  { label: '6px', value: '6px' },
  { label: '8px', value: '8px' },
  { label: '12px', value: '12px' },
  { label: '16px', value: '16px' },
  { label: '24px', value: '24px' },
  { label: 'Full', value: '9999px' },
];

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Parse a duration string to milliseconds
 * Handles formats like "150ms", "0.15s", "150"
 */
function parseDuration(value: string): number {
  const trimmed = value.trim().toLowerCase();

  if (trimmed.endsWith('ms')) {
    return parseFloat(trimmed.slice(0, -2)) || 0;
  }
  if (trimmed.endsWith('s')) {
    return (parseFloat(trimmed.slice(0, -1)) || 0) * 1000;
  }
  // Assume milliseconds if no unit
  return parseFloat(trimmed) || 0;
}

/**
 * Format milliseconds to a duration string
 */
function formatDuration(ms: number): string {
  return `${ms}ms`;
}

/**
 * Parse a radius string to pixels
 * Handles formats like "8px", "0.5rem", "50%"
 */
function parseRadius(value: string): number {
  const trimmed = value.trim().toLowerCase();

  if (trimmed === '9999px' || trimmed === 'full') {
    return 9999;
  }
  if (trimmed.endsWith('px')) {
    return parseFloat(trimmed.slice(0, -2)) || 0;
  }
  if (trimmed.endsWith('rem')) {
    return (parseFloat(trimmed.slice(0, -3)) || 0) * 16;
  }
  if (trimmed.endsWith('em')) {
    return (parseFloat(trimmed.slice(0, -2)) || 0) * 16;
  }
  if (trimmed.endsWith('%')) {
    return 50; // Default to 50% for percentage values
  }
  return parseFloat(trimmed) || 0;
}

/**
 * Format pixels to a radius string
 */
function formatRadius(px: number): string {
  if (px >= 9999) return '9999px';
  return `${px}px`;
}

// ====================
// SUB-COMPONENTS
// ====================

/**
 * Section wrapper component for effects categories
 */
function Section({ title, description, children }: SectionProps) {
  return (
    <section className="mb-6" aria-labelledby={`section-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="mb-3">
        <h3
          id={`section-${title.toLowerCase().replace(/\s/g, '-')}`}
          className="text-sm font-semibold text-[rgb(var(--foreground))]"
        >
          {title}
        </h3>
        <p className="text-xs text-[rgb(var(--muted-foreground))]">{description}</p>
      </div>
      {children}
    </section>
  );
}

/**
 * Slider control component for numeric values
 */
function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  formatValue,
}: SliderControlProps) {
  const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm text-[rgb(var(--foreground))]">{label}</label>
        <span className="text-sm font-mono text-[rgb(var(--muted-foreground))] tabular-nums">
          {displayValue}
        </span>
      </div>
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([newValue]) => onChange(newValue)}
        aria-label={label}
      >
        <Slider.Track className="bg-[rgb(var(--muted))] relative grow rounded-full h-2">
          <Slider.Range className="absolute bg-[rgb(var(--accent))] rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb
          className={cn(
            'block w-5 h-5 bg-[rgb(var(--background))] shadow-md rounded-full',
            'border-2 border-[rgb(var(--accent))]',
            'hover:bg-[rgb(var(--accent)/0.1)]',
            'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--background))]',
            'transition-colors duration-150'
          )}
        />
      </Slider.Root>
    </div>
  );
}

/**
 * Shadow preview card component
 */
function ShadowPreview({ shadow, size, isSelected, onClick }: ShadowPreviewProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-3 p-4 rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]',
        {
          'bg-[rgb(var(--accent)/0.1)] border-2 border-[rgb(var(--accent))]': isSelected,
          'bg-[rgb(var(--muted)/0.3)] border-2 border-transparent hover:border-[rgb(var(--border))]':
            !isSelected,
        }
      )}
      aria-pressed={isSelected}
      aria-label={`${SHADOW_SIZE_LABELS[size]} shadow`}
    >
      {/* Shadow Preview Box */}
      <div
        className="w-16 h-16 bg-[rgb(var(--background))] rounded-lg"
        style={{ boxShadow: shadow }}
        aria-hidden="true"
      />

      {/* Label */}
      <div className="text-center">
        <span className="text-xs font-medium text-[rgb(var(--foreground))]">
          {SHADOW_SIZE_LABELS[size]}
        </span>
        <span className="block text-[10px] text-[rgb(var(--muted-foreground))] font-mono mt-0.5">
          {size}
        </span>
      </div>
    </button>
  );
}

/**
 * Radius preview card component
 */
function RadiusPreview({ radius, size, isSelected, onClick }: RadiusPreviewProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-3 p-4 rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]',
        {
          'bg-[rgb(var(--accent)/0.1)] border-2 border-[rgb(var(--accent))]': isSelected,
          'bg-[rgb(var(--muted)/0.3)] border-2 border-transparent hover:border-[rgb(var(--border))]':
            !isSelected,
        }
      )}
      aria-pressed={isSelected}
      aria-label={`${RADIUS_SIZE_LABELS[size]} radius`}
    >
      {/* Radius Preview Box */}
      <div
        className="w-16 h-16 bg-[rgb(var(--accent))] border-2 border-[rgb(var(--accent))]"
        style={{ borderRadius: radius }}
        aria-hidden="true"
      />

      {/* Label */}
      <div className="text-center">
        <span className="text-xs font-medium text-[rgb(var(--foreground))]">
          {RADIUS_SIZE_LABELS[size]}
        </span>
        <span className="block text-[10px] text-[rgb(var(--muted-foreground))] font-mono mt-0.5">
          {radius}
        </span>
      </div>
    </button>
  );
}

/**
 * Transition preview component with animation
 */
function TransitionPreview({ duration, speed, isActive }: TransitionPreviewProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = useCallback(() => {
    setIsAnimating(true);
    const ms = parseDuration(duration);
    setTimeout(() => setIsAnimating(false), ms);
  }, [duration]);

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 p-4 rounded-lg',
        'bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]',
        { 'ring-2 ring-[rgb(var(--accent))]': isActive }
      )}
    >
      {/* Animation Preview */}
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'w-16 h-16 bg-[rgb(var(--accent))] rounded-lg transition-transform',
          { 'scale-110': isAnimating }
        )}
        style={{ transitionDuration: duration }}
        aria-label={`Preview ${TRANSITION_SPEED_LABELS[speed]} transition`}
      >
        <span className="sr-only">Click to animate</span>
      </button>

      {/* Label */}
      <div className="text-center">
        <span className="text-xs font-medium text-[rgb(var(--foreground))]">
          {TRANSITION_SPEED_LABELS[speed]}
        </span>
        <span className="block text-[10px] text-[rgb(var(--muted-foreground))] font-mono mt-0.5">
          {duration}
        </span>
      </div>

      {/* Click hint */}
      <span className="text-[10px] text-[rgb(var(--muted-foreground))]">Click to preview</span>
    </div>
  );
}

/**
 * Shadow input with text field
 */
function ShadowInput({
  size,
  value,
  onChange,
}: {
  size: ShadowSize;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">
            {SHADOW_SIZE_LABELS[size]} Shadow ({size})
          </h4>
          <p className="text-xs text-[rgb(var(--muted-foreground))] mt-0.5">
            CSS box-shadow value
          </p>
        </div>
        {/* Preview */}
        <div
          className="w-12 h-12 bg-[rgb(var(--background))] rounded-lg flex-shrink-0"
          style={{ boxShadow: value }}
          aria-hidden="true"
        />
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className={cn(
          'w-full px-3 py-2 rounded-md text-sm font-mono resize-none',
          'bg-[rgb(var(--background))] border border-[rgb(var(--border))]',
          'text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted-foreground))]',
          'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent'
        )}
        placeholder="e.g., 0 4px 6px -1px rgb(0 0 0 / 0.1)"
        aria-label={`${SHADOW_SIZE_LABELS[size]} shadow value`}
      />
    </div>
  );
}

/**
 * Combined shadow preview with all sizes
 */
function ShadowGallery({ shadows }: { shadows: EffectsExtraction['shadows'] }) {
  return (
    <div className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
      <h4 className="text-xs font-medium text-[rgb(var(--muted-foreground))] mb-4">
        Shadow Comparison
      </h4>
      <div className="flex items-end justify-center gap-6">
        {SHADOW_SIZES.map((size) => (
          <div key={size} className="flex flex-col items-center gap-2">
            <div
              className="w-20 h-20 bg-[rgb(var(--background))] rounded-lg"
              style={{ boxShadow: shadows[size] }}
              aria-hidden="true"
            />
            <span className="text-xs font-mono text-[rgb(var(--muted-foreground))]">{size}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Combined radius preview with all sizes
 */
function RadiusGallery({ radii }: { radii: EffectsExtraction['radii'] }) {
  return (
    <div className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
      <h4 className="text-xs font-medium text-[rgb(var(--muted-foreground))] mb-4">
        Radius Comparison
      </h4>
      <div className="flex items-end justify-center gap-6">
        {RADIUS_SIZES.map((size) => (
          <div key={size} className="flex flex-col items-center gap-2">
            <div
              className="w-20 h-20 bg-[rgb(var(--accent))]"
              style={{ borderRadius: radii[size] }}
              aria-hidden="true"
            />
            <span className="text-xs font-mono text-[rgb(var(--muted-foreground))]">{size}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ====================
// MAIN COMPONENT
// ====================

/**
 * EffectsEditor component for editing design system effects tokens
 *
 * Features:
 * - Shadow preview with visual boxes showing different shadow levels
 * - Radius sliders with live preview
 * - Transition duration controls with animation preview
 * - Tabbed interface for shadows, radii, and transitions
 */
export function EffectsEditor() {
  const effects = useEffectsTokens();
  const updateEffects = useEditorStore((state) => state.updateEffects);
  const [activeCategory, setActiveCategory] = useState<EffectsCategory>('shadows');
  const [selectedShadow, setSelectedShadow] = useState<ShadowSize>('md');
  const [selectedRadius, setSelectedRadius] = useState<RadiusSize>('md');

  // Get parsed duration values for sliders
  const durationValues = useMemo(() => {
    if (!effects) {
      return { fast: 150, normal: 300, slow: 500 };
    }
    return {
      fast: parseDuration(effects.transitions.fast),
      normal: parseDuration(effects.transitions.normal),
      slow: parseDuration(effects.transitions.slow),
    };
  }, [effects]);

  // Get parsed radius values for sliders
  const radiusValues = useMemo(() => {
    if (!effects) {
      return { sm: 2, md: 6, lg: 8, full: 9999 };
    }
    return {
      sm: parseRadius(effects.radii.sm),
      md: parseRadius(effects.radii.md),
      lg: parseRadius(effects.radii.lg),
      full: parseRadius(effects.radii.full),
    };
  }, [effects]);

  // Handler for updating shadow value
  const handleShadowChange = useCallback(
    (size: ShadowSize, value: string) => {
      if (!effects) return;
      updateEffects({
        shadows: {
          ...effects.shadows,
          [size]: value,
        },
      });
    },
    [effects, updateEffects]
  );

  // Handler for updating radius value
  const handleRadiusChange = useCallback(
    (size: RadiusSize, value: string) => {
      if (!effects) return;
      updateEffects({
        radii: {
          ...effects.radii,
          [size]: value,
        },
      });
    },
    [effects, updateEffects]
  );

  // Handler for updating radius via slider
  const handleRadiusSliderChange = useCallback(
    (size: RadiusSize, px: number) => {
      handleRadiusChange(size, formatRadius(px));
    },
    [handleRadiusChange]
  );

  // Handler for updating transition duration
  const handleTransitionChange = useCallback(
    (speed: TransitionSpeed, ms: number) => {
      if (!effects) return;
      updateEffects({
        transitions: {
          ...effects.transitions,
          [speed]: formatDuration(ms),
        },
      });
    },
    [effects, updateEffects]
  );

  // Handler for applying shadow preset
  const handleApplyShadowPreset = useCallback(
    (size: ShadowSize) => {
      handleShadowChange(size, DEFAULT_SHADOWS[size]);
    },
    [handleShadowChange]
  );

  // Handler for applying radius preset
  const handleApplyRadiusPreset = useCallback(
    (size: RadiusSize) => {
      handleRadiusChange(size, DEFAULT_RADII[size]);
    },
    [handleRadiusChange]
  );

  // Handler for applying transition preset
  const handleApplyTransitionPreset = useCallback(
    (speed: TransitionSpeed) => {
      if (!effects) return;
      updateEffects({
        transitions: {
          ...effects.transitions,
          [speed]: DEFAULT_TRANSITIONS[speed],
        },
      });
    },
    [effects, updateEffects]
  );

  // If no effects loaded, show empty state
  if (!effects) {
    return (
      <div
        className="w-full rounded-lg bg-[rgb(var(--muted)/0.3)] p-6"
        role="status"
        aria-label="Effects editor empty state"
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
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
            <path d="M12 8v8" />
          </svg>
          <p className="text-sm">No effects tokens loaded</p>
          <p className="text-xs">Extract a website to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" role="region" aria-label="Effects editor">
      {/* Category Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg bg-[rgb(var(--muted)/0.3)]" role="tablist">
        {(['shadows', 'radii', 'transitions'] as EffectsCategory[]).map((category) => {
          const labels: Record<EffectsCategory, string> = {
            shadows: 'Shadows',
            radii: 'Radii',
            transitions: 'Transitions',
          };

          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-inset',
                {
                  'bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-sm':
                    activeCategory === category,
                  'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]':
                    activeCategory !== category,
                }
              )}
            >
              {labels[category]}
            </button>
          );
        })}
      </div>

      {/* Category Content */}
      <div role="tabpanel" aria-label={`${activeCategory} panel`}>
        {/* Shadows */}
        {activeCategory === 'shadows' && (
          <Section
            title="Box Shadows"
            description="Shadow effects for elevation and depth"
          >
            <div className="space-y-6">
              {/* Shadow Gallery */}
              <ShadowGallery shadows={effects.shadows} />

              {/* Shadow Selection */}
              <div className="grid grid-cols-4 gap-3">
                {SHADOW_SIZES.map((size) => (
                  <ShadowPreview
                    key={size}
                    shadow={effects.shadows[size]}
                    size={size}
                    isSelected={selectedShadow === size}
                    onClick={() => setSelectedShadow(size)}
                  />
                ))}
              </div>

              {/* Selected Shadow Editor */}
              <ShadowInput
                size={selectedShadow}
                value={effects.shadows[selectedShadow]}
                onChange={(value) => handleShadowChange(selectedShadow, value)}
              />

              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-[rgb(var(--muted-foreground))] self-center mr-2">
                  Reset to default:
                </span>
                {SHADOW_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleApplyShadowPreset(size)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200',
                      'bg-[rgb(var(--muted)/0.5)] text-[rgb(var(--muted-foreground))]',
                      'hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
                      'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]'
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* Radii */}
        {activeCategory === 'radii' && (
          <Section
            title="Border Radius"
            description="Corner rounding values for elements"
          >
            <div className="space-y-6">
              {/* Radius Gallery */}
              <RadiusGallery radii={effects.radii} />

              {/* Radius Selection */}
              <div className="grid grid-cols-4 gap-3">
                {RADIUS_SIZES.map((size) => (
                  <RadiusPreview
                    key={size}
                    radius={effects.radii[size]}
                    size={size}
                    isSelected={selectedRadius === size}
                    onClick={() => setSelectedRadius(size)}
                  />
                ))}
              </div>

              {/* Selected Radius Editor */}
              <div className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">
                    {RADIUS_SIZE_LABELS[selectedRadius]} Radius ({selectedRadius})
                  </h4>
                  <span className="text-sm font-mono text-[rgb(var(--accent))]">
                    {effects.radii[selectedRadius]}
                  </span>
                </div>

                {/* Slider */}
                {selectedRadius !== 'full' && (
                  <SliderControl
                    label="Radius"
                    value={radiusValues[selectedRadius]}
                    min={0}
                    max={48}
                    step={1}
                    unit="px"
                    onChange={(px) => handleRadiusSliderChange(selectedRadius, px)}
                  />
                )}

                {/* Input */}
                <div className="mt-4">
                  <input
                    type="text"
                    value={effects.radii[selectedRadius]}
                    onChange={(e) => handleRadiusChange(selectedRadius, e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 rounded-md text-sm font-mono',
                      'bg-[rgb(var(--background))] border border-[rgb(var(--border))]',
                      'text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted-foreground))]',
                      'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent'
                    )}
                    placeholder="e.g., 8px, 0.5rem"
                    aria-label={`${RADIUS_SIZE_LABELS[selectedRadius]} radius value`}
                  />
                </div>
              </div>

              {/* Radius Presets */}
              <div className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
                <h4 className="text-xs font-medium text-[rgb(var(--muted-foreground))] mb-3">
                  Quick Presets
                </h4>
                <div className="flex flex-wrap gap-2">
                  {RADIUS_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleRadiusChange(selectedRadius, preset.value)}
                      className={cn(
                        'px-3 py-2 text-sm font-mono rounded-md transition-colors duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]',
                        {
                          'bg-[rgb(var(--accent))] text-white':
                            effects.radii[selectedRadius] === preset.value,
                          'bg-[rgb(var(--muted)/0.5)] text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))]':
                            effects.radii[selectedRadius] !== preset.value,
                        }
                      )}
                      aria-pressed={effects.radii[selectedRadius] === preset.value}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* Transitions */}
        {activeCategory === 'transitions' && (
          <Section
            title="Transition Durations"
            description="Animation timing for interactive elements"
          >
            <div className="space-y-6">
              {/* Transition Previews */}
              <div className="grid grid-cols-3 gap-4">
                {TRANSITION_SPEEDS.map((speed) => (
                  <TransitionPreview
                    key={speed}
                    duration={effects.transitions[speed]}
                    speed={speed}
                    isActive={false}
                  />
                ))}
              </div>

              {/* Transition Sliders */}
              <div className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))] space-y-4">
                <h4 className="text-xs font-medium text-[rgb(var(--muted-foreground))]">
                  Duration Controls
                </h4>

                <SliderControl
                  label="Fast"
                  value={durationValues.fast}
                  min={50}
                  max={300}
                  step={10}
                  unit="ms"
                  onChange={(ms) => handleTransitionChange('fast', ms)}
                />

                <SliderControl
                  label="Normal"
                  value={durationValues.normal}
                  min={150}
                  max={500}
                  step={10}
                  unit="ms"
                  onChange={(ms) => handleTransitionChange('normal', ms)}
                />

                <SliderControl
                  label="Slow"
                  value={durationValues.slow}
                  min={300}
                  max={1000}
                  step={25}
                  unit="ms"
                  onChange={(ms) => handleTransitionChange('slow', ms)}
                />
              </div>

              {/* Transition Presets */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-[rgb(var(--muted-foreground))] self-center mr-2">
                  Reset to defaults:
                </span>
                {TRANSITION_SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => handleApplyTransitionPreset(speed)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200',
                      'bg-[rgb(var(--muted)/0.5)] text-[rgb(var(--muted-foreground))]',
                      'hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
                      'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]'
                    )}
                  >
                    {speed} ({DEFAULT_TRANSITIONS[speed]})
                  </button>
                ))}
              </div>

              {/* Usage Tips */}
              <div className="p-3 rounded-lg bg-[rgb(var(--info)/0.1)] border border-[rgb(var(--info)/0.3)]">
                <p className="text-xs text-[rgb(var(--foreground))]">
                  <strong>Tip:</strong> Use <code className="font-mono bg-[rgb(var(--muted))] px-1 rounded">fast</code> for
                  micro-interactions, <code className="font-mono bg-[rgb(var(--muted))] px-1 rounded">normal</code> for
                  standard UI feedback, and <code className="font-mono bg-[rgb(var(--muted))] px-1 rounded">slow</code> for
                  emphasis or modal transitions.
                </p>
              </div>
            </div>
          </Section>
        )}
      </div>

      {/* Summary Section */}
      <div className="mt-6 pt-6 border-t border-[rgb(var(--border))]">
        <Section title="Effects Summary" description="Current effects configuration overview">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-[rgb(var(--muted)/0.3)]">
              <span className="text-xs text-[rgb(var(--muted-foreground))]">Shadows</span>
              <p className="font-medium text-[rgb(var(--foreground))]">
                {SHADOW_SIZES.length} sizes
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[rgb(var(--muted)/0.3)]">
              <span className="text-xs text-[rgb(var(--muted-foreground))]">Radii</span>
              <p className="font-medium text-[rgb(var(--foreground))]">
                {RADIUS_SIZES.length} sizes
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[rgb(var(--muted)/0.3)]">
              <span className="text-xs text-[rgb(var(--muted-foreground))]">Transitions</span>
              <p className="font-medium font-mono text-[rgb(var(--foreground))]">
                {effects.transitions.fast} - {effects.transitions.slow}
              </p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

export default EffectsEditor;
