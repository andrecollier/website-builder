'use client';

import { useState, useCallback, useMemo } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';
import { useSpacingTokens, useEditorStore } from '@/store/useEditorStore';
import type { SpacingExtraction } from '@/types';

// ====================
// TYPES
// ====================

type SpacingCategory = 'baseUnit' | 'scale' | 'container' | 'padding';

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

interface ScaleValueProps {
  value: number;
  index: number;
  onRemove: () => void;
  onChange: (value: number) => void;
  canRemove: boolean;
}

// ====================
// CONFIGURATION
// ====================

const BASE_UNIT_OPTIONS = [4, 8] as const;

const DEFAULT_SCALE = [4, 8, 12, 16, 24, 32, 48, 64, 96];

const SCALE_PRESETS = {
  '4px': [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96],
  '8px': [8, 16, 24, 32, 40, 48, 64, 80, 96, 128],
  'Tailwind': [4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128],
} as const;

const COMMON_MAX_WIDTHS = [
  '640px',
  '768px',
  '1024px',
  '1280px',
  '1440px',
  '1536px',
  '1920px',
];

// ====================
// SUB-COMPONENTS
// ====================

/**
 * Section wrapper component for spacing categories
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
 * Visual box model display component
 * Shows margin, padding, border, and content areas
 */
function BoxModelDisplay({
  margin,
  padding,
  baseUnit,
}: {
  margin: number;
  padding: number;
  baseUnit: number;
}) {
  return (
    <div
      className="relative flex items-center justify-center bg-[rgb(var(--warning)/0.2)] p-4 rounded-lg"
      style={{ padding: `${margin}px` }}
      aria-label="Box model visualization"
    >
      {/* Margin label */}
      <span className="absolute top-1 left-1 text-[10px] font-mono text-[rgb(var(--warning))]">
        margin: {margin}px
      </span>

      {/* Padding box */}
      <div
        className="relative flex items-center justify-center bg-[rgb(var(--success)/0.2)] w-full rounded"
        style={{ padding: `${padding}px` }}
      >
        {/* Padding label */}
        <span className="absolute top-1 left-1 text-[10px] font-mono text-[rgb(var(--success))]">
          padding: {padding}px
        </span>

        {/* Content box */}
        <div className="w-full min-h-[60px] bg-[rgb(var(--accent)/0.2)] rounded flex items-center justify-center">
          <span className="text-xs font-mono text-[rgb(var(--accent))]">content</span>
        </div>
      </div>

      {/* Base unit indicator */}
      <div className="absolute bottom-1 right-1 text-[10px] font-mono text-[rgb(var(--muted-foreground))]">
        base: {baseUnit}px
      </div>
    </div>
  );
}

/**
 * Interactive scale value display
 */
function ScaleValue({ value, index, onRemove, onChange, canRemove }: ScaleValueProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const handleBlur = useCallback(() => {
    const parsed = parseInt(editValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
    } else {
      setEditValue(value.toString());
    }
    setIsEditing(false);
  }, [editValue, onChange, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleBlur();
      } else if (e.key === 'Escape') {
        setEditValue(value.toString());
        setIsEditing(false);
      }
    },
    [handleBlur, value]
  );

  return (
    <div className="relative group">
      {isEditing ? (
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-16 h-10 text-center text-sm font-mono rounded-md',
            'bg-[rgb(var(--background))] border border-[rgb(var(--accent))]',
            'text-[rgb(var(--foreground))]',
            'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]'
          )}
          autoFocus
          min={1}
          aria-label={`Edit spacing value ${index + 1}`}
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className={cn(
            'w-16 h-10 rounded-md transition-colors duration-200',
            'bg-[rgb(var(--muted)/0.5)] border border-[rgb(var(--border))]',
            'hover:border-[rgb(var(--accent))] hover:bg-[rgb(var(--muted))]',
            'flex flex-col items-center justify-center gap-0.5',
            'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]'
          )}
          aria-label={`Spacing value: ${value}px - click to edit`}
        >
          <span className="text-sm font-mono text-[rgb(var(--foreground))]">{value}</span>
          <span className="text-[10px] text-[rgb(var(--muted-foreground))]">px</span>
        </button>
      )}

      {/* Remove button */}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[rgb(var(--error))] text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
          aria-label={`Remove spacing value ${value}px`}
        >
          ×
        </button>
      )}
    </div>
  );
}

/**
 * Scale bar visualization showing proportions
 */
function ScaleBar({ scale, maxValue }: { scale: number[]; maxValue: number }) {
  return (
    <div className="space-y-1" role="img" aria-label="Spacing scale visualization">
      {scale.map((value, index) => (
        <div key={`${value}-${index}`} className="flex items-center gap-2">
          <span className="w-12 text-right text-xs font-mono text-[rgb(var(--muted-foreground))]">
            {value}px
          </span>
          <div className="flex-1 h-3 bg-[rgb(var(--muted)/0.3)] rounded overflow-hidden">
            <div
              className="h-full bg-[rgb(var(--accent))] rounded transition-all duration-300"
              style={{ width: `${(value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Padding input component with text input
 */
function PaddingInput({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">{label}</h4>
          <p className="text-xs text-[rgb(var(--muted-foreground))] mt-0.5">{description}</p>
        </div>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full px-3 py-2 rounded-md text-sm font-mono',
          'bg-[rgb(var(--background))] border border-[rgb(var(--border))]',
          'text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted-foreground))]',
          'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent'
        )}
        placeholder="e.g., 1rem 2rem or 16px 32px"
        aria-label={label}
      />
    </div>
  );
}

// ====================
// MAIN COMPONENT
// ====================

/**
 * SpacingEditor component for editing design system spacing tokens
 *
 * Features:
 * - Visual box model display showing margin/padding/content areas
 * - Base unit selection (4px or 8px grid)
 * - Editable spacing scale with add/remove functionality
 * - Container max-width configuration
 * - Section padding for mobile and desktop breakpoints
 */
export function SpacingEditor() {
  const spacing = useSpacingTokens();
  const updateSpacing = useEditorStore((state) => state.updateSpacing);
  const [activeCategory, setActiveCategory] = useState<SpacingCategory>('baseUnit');
  const [previewMargin, setPreviewMargin] = useState(16);
  const [previewPadding, setPreviewPadding] = useState(16);

  // Get the maximum scale value for bar visualization
  const maxScaleValue = useMemo(() => {
    if (!spacing) return 128;
    return Math.max(...spacing.scale, 128);
  }, [spacing]);

  // Handler for changing base unit
  const handleBaseUnitChange = useCallback(
    (unit: number) => {
      if (!spacing) return;
      updateSpacing({ baseUnit: unit });
    },
    [spacing, updateSpacing]
  );

  // Handler for updating scale value
  const handleScaleValueChange = useCallback(
    (index: number, value: number) => {
      if (!spacing) return;
      const newScale = [...spacing.scale];
      newScale[index] = value;
      // Sort the scale after update
      newScale.sort((a, b) => a - b);
      updateSpacing({ scale: newScale });
    },
    [spacing, updateSpacing]
  );

  // Handler for adding scale value
  const handleAddScaleValue = useCallback(() => {
    if (!spacing) return;
    // Add a new value between the last two values or double the last
    const lastValue = spacing.scale[spacing.scale.length - 1] || 4;
    const newValue = lastValue + spacing.baseUnit;
    const newScale = [...spacing.scale, newValue].sort((a, b) => a - b);
    updateSpacing({ scale: newScale });
  }, [spacing, updateSpacing]);

  // Handler for removing scale value
  const handleRemoveScaleValue = useCallback(
    (index: number) => {
      if (!spacing || spacing.scale.length <= 1) return;
      const newScale = spacing.scale.filter((_, i) => i !== index);
      updateSpacing({ scale: newScale });
    },
    [spacing, updateSpacing]
  );

  // Handler for applying scale preset
  const handleApplyPreset = useCallback(
    (presetKey: keyof typeof SCALE_PRESETS) => {
      if (!spacing) return;
      updateSpacing({ scale: [...SCALE_PRESETS[presetKey]] });
    },
    [spacing, updateSpacing]
  );

  // Handler for updating container max width
  const handleContainerMaxWidthChange = useCallback(
    (value: string) => {
      if (!spacing) return;
      updateSpacing({ containerMaxWidth: value });
    },
    [spacing, updateSpacing]
  );

  // Handler for updating section padding
  const handleSectionPaddingChange = useCallback(
    (type: 'mobile' | 'desktop', value: string) => {
      if (!spacing) return;
      updateSpacing({
        sectionPadding: {
          ...spacing.sectionPadding,
          [type]: value,
        },
      });
    },
    [spacing, updateSpacing]
  );

  // If no spacing loaded, show empty state
  if (!spacing) {
    return (
      <div
        className="w-full rounded-lg bg-[rgb(var(--muted)/0.3)] p-6"
        role="status"
        aria-label="Spacing editor empty state"
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
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <rect x="7" y="7" width="10" height="10" rx="1" />
          </svg>
          <p className="text-sm">No spacing tokens loaded</p>
          <p className="text-xs">Extract a website to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full"
      role="region"
      aria-label="Spacing editor"
    >
      {/* Category Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg bg-[rgb(var(--muted)/0.3)]" role="tablist">
        {(['baseUnit', 'scale', 'container', 'padding'] as SpacingCategory[]).map((category) => {
          const labels: Record<SpacingCategory, string> = {
            baseUnit: 'Base Unit',
            scale: 'Scale',
            container: 'Container',
            padding: 'Padding',
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
        {/* Base Unit */}
        {activeCategory === 'baseUnit' && (
          <Section
            title="Base Unit"
            description="The fundamental spacing unit that all other values are based on"
          >
            <div className="space-y-6">
              {/* Base Unit Selection */}
              <div className="flex gap-3">
                {BASE_UNIT_OPTIONS.map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => handleBaseUnitChange(unit)}
                    className={cn(
                      'flex-1 p-4 rounded-lg border-2 transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]',
                      {
                        'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.1)]':
                          spacing.baseUnit === unit,
                        'border-[rgb(var(--border))] hover:border-[rgb(var(--accent))]':
                          spacing.baseUnit !== unit,
                      }
                    )}
                    aria-pressed={spacing.baseUnit === unit}
                  >
                    <div className="text-2xl font-bold text-[rgb(var(--foreground))] mb-1">
                      {unit}px
                    </div>
                    <div className="text-xs text-[rgb(var(--muted-foreground))]">
                      {unit === 4 ? 'Material Design' : 'iOS/Tailwind'} grid
                    </div>
                  </button>
                ))}
              </div>

              {/* Visual Box Model */}
              <div className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
                <h4 className="text-xs font-medium text-[rgb(var(--muted-foreground))] mb-4">
                  Box Model Preview
                </h4>
                <BoxModelDisplay
                  margin={previewMargin}
                  padding={previewPadding}
                  baseUnit={spacing.baseUnit}
                />

                {/* Preview Controls */}
                <div className="mt-4 pt-4 border-t border-[rgb(var(--border))] grid grid-cols-2 gap-4">
                  <SliderControl
                    label="Preview Margin"
                    value={previewMargin}
                    min={0}
                    max={64}
                    step={spacing.baseUnit}
                    unit="px"
                    onChange={setPreviewMargin}
                  />
                  <SliderControl
                    label="Preview Padding"
                    value={previewPadding}
                    min={0}
                    max={64}
                    step={spacing.baseUnit}
                    unit="px"
                    onChange={setPreviewPadding}
                  />
                </div>
              </div>

              {/* Grid alignment info */}
              <div className="p-3 rounded-lg bg-[rgb(var(--info)/0.1)] border border-[rgb(var(--info)/0.3)]">
                <p className="text-xs text-[rgb(var(--foreground))]">
                  <strong>Tip:</strong> The {spacing.baseUnit}px base unit means all spacing values
                  should be multiples of {spacing.baseUnit} for consistent visual rhythm.
                </p>
              </div>
            </div>
          </Section>
        )}

        {/* Scale */}
        {activeCategory === 'scale' && (
          <Section
            title="Spacing Scale"
            description="The predefined spacing values available in your design system"
          >
            <div className="space-y-6">
              {/* Scale Presets */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-[rgb(var(--muted-foreground))] self-center mr-2">
                  Presets:
                </span>
                {(Object.keys(SCALE_PRESETS) as Array<keyof typeof SCALE_PRESETS>).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200',
                      'bg-[rgb(var(--muted)/0.5)] text-[rgb(var(--muted-foreground))]',
                      'hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
                      'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]'
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Scale Values Grid */}
              <div className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
                <h4 className="text-xs font-medium text-[rgb(var(--muted-foreground))] mb-3">
                  Scale Values
                </h4>
                <div className="flex flex-wrap gap-2">
                  {spacing.scale.map((value, index) => (
                    <ScaleValue
                      key={`${value}-${index}`}
                      value={value}
                      index={index}
                      onChange={(newValue) => handleScaleValueChange(index, newValue)}
                      onRemove={() => handleRemoveScaleValue(index)}
                      canRemove={spacing.scale.length > 1}
                    />
                  ))}

                  {/* Add button */}
                  <button
                    type="button"
                    onClick={handleAddScaleValue}
                    className={cn(
                      'w-16 h-10 rounded-md border-2 border-dashed transition-colors duration-200',
                      'border-[rgb(var(--border))] hover:border-[rgb(var(--accent))]',
                      'flex items-center justify-center text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--accent))]',
                      'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]'
                    )}
                    aria-label="Add spacing value"
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
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Scale Visualization */}
              <div className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
                <h4 className="text-xs font-medium text-[rgb(var(--muted-foreground))] mb-3">
                  Scale Visualization
                </h4>
                <ScaleBar scale={spacing.scale} maxValue={maxScaleValue} />
              </div>

              {/* Scale Info */}
              <p className="text-xs text-[rgb(var(--muted-foreground))]">
                Click any value to edit it. Values are automatically sorted after editing.
              </p>
            </div>
          </Section>
        )}

        {/* Container */}
        {activeCategory === 'container' && (
          <Section
            title="Container Max Width"
            description="The maximum width for content containers and layout wrappers"
          >
            <div className="space-y-6">
              {/* Current Value */}
              <div className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">
                    Current Max Width
                  </h4>
                  <span className="text-lg font-mono text-[rgb(var(--accent))]">
                    {spacing.containerMaxWidth}
                  </span>
                </div>

                {/* Input */}
                <input
                  type="text"
                  value={spacing.containerMaxWidth}
                  onChange={(e) => handleContainerMaxWidthChange(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 rounded-md text-sm font-mono',
                    'bg-[rgb(var(--background))] border border-[rgb(var(--border))]',
                    'text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted-foreground))]',
                    'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent'
                  )}
                  placeholder="e.g., 1280px or 80rem"
                  aria-label="Container max width"
                />
              </div>

              {/* Common Presets */}
              <div className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
                <h4 className="text-xs font-medium text-[rgb(var(--muted-foreground))] mb-3">
                  Common Widths
                </h4>
                <div className="flex flex-wrap gap-2">
                  {COMMON_MAX_WIDTHS.map((width) => (
                    <button
                      key={width}
                      type="button"
                      onClick={() => handleContainerMaxWidthChange(width)}
                      className={cn(
                        'px-3 py-2 text-sm font-mono rounded-md transition-colors duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]',
                        {
                          'bg-[rgb(var(--accent))] text-white': spacing.containerMaxWidth === width,
                          'bg-[rgb(var(--muted)/0.5)] text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))]':
                            spacing.containerMaxWidth !== width,
                        }
                      )}
                      aria-pressed={spacing.containerMaxWidth === width}
                    >
                      {width}
                    </button>
                  ))}
                </div>
              </div>

              {/* Container Preview */}
              <div className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
                <h4 className="text-xs font-medium text-[rgb(var(--muted-foreground))] mb-3">
                  Container Preview
                </h4>
                <div className="relative h-16 bg-[rgb(var(--background))] rounded overflow-hidden">
                  <div
                    className="absolute left-1/2 transform -translate-x-1/2 h-full bg-[rgb(var(--accent)/0.2)] border-x-2 border-[rgb(var(--accent))]"
                    style={{
                      width: `min(${spacing.containerMaxWidth}, 100%)`,
                      maxWidth: '100%',
                    }}
                  >
                    <div className="flex items-center justify-center h-full">
                      <span className="text-xs font-mono text-[rgb(var(--accent))]">
                        {spacing.containerMaxWidth}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* Section Padding */}
        {activeCategory === 'padding' && (
          <Section
            title="Section Padding"
            description="Default padding for page sections across different breakpoints"
          >
            <div className="space-y-4">
              <PaddingInput
                label="Mobile Padding"
                value={spacing.sectionPadding.mobile}
                onChange={(value) => handleSectionPaddingChange('mobile', value)}
                description="Padding applied to sections on mobile devices (< 768px)"
              />

              <PaddingInput
                label="Desktop Padding"
                value={spacing.sectionPadding.desktop}
                onChange={(value) => handleSectionPaddingChange('desktop', value)}
                description="Padding applied to sections on desktop devices (>= 768px)"
              />

              {/* Padding Preview */}
              <div className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
                <h4 className="text-xs font-medium text-[rgb(var(--muted-foreground))] mb-3">
                  Preview
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Mobile Preview */}
                  <div>
                    <span className="text-[10px] text-[rgb(var(--muted-foreground))] mb-1 block">
                      Mobile
                    </span>
                    <div className="bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))] overflow-hidden">
                      <div
                        className="bg-[rgb(var(--accent)/0.1)] border border-dashed border-[rgb(var(--accent)/0.3)] min-h-[60px] flex items-center justify-center"
                        style={{ padding: spacing.sectionPadding.mobile }}
                      >
                        <span className="text-[10px] font-mono text-[rgb(var(--accent))]">
                          {spacing.sectionPadding.mobile}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Preview */}
                  <div>
                    <span className="text-[10px] text-[rgb(var(--muted-foreground))] mb-1 block">
                      Desktop
                    </span>
                    <div className="bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))] overflow-hidden">
                      <div
                        className="bg-[rgb(var(--accent)/0.1)] border border-dashed border-[rgb(var(--accent)/0.3)] min-h-[60px] flex items-center justify-center"
                        style={{ padding: spacing.sectionPadding.desktop }}
                      >
                        <span className="text-[10px] font-mono text-[rgb(var(--accent))]">
                          {spacing.sectionPadding.desktop}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        )}
      </div>

      {/* Summary Section */}
      <div className="mt-6 pt-6 border-t border-[rgb(var(--border))]">
        <Section
          title="Spacing Summary"
          description="Current spacing configuration overview"
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-[rgb(var(--muted)/0.3)]">
              <span className="text-xs text-[rgb(var(--muted-foreground))]">Base Unit</span>
              <p className="font-medium font-mono text-[rgb(var(--foreground))]">
                {spacing.baseUnit}px
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[rgb(var(--muted)/0.3)]">
              <span className="text-xs text-[rgb(var(--muted-foreground))]">Scale Steps</span>
              <p className="font-medium text-[rgb(var(--foreground))]">
                {spacing.scale.length} values
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[rgb(var(--muted)/0.3)]">
              <span className="text-xs text-[rgb(var(--muted-foreground))]">Container Width</span>
              <p className="font-medium font-mono text-[rgb(var(--foreground))] truncate">
                {spacing.containerMaxWidth}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[rgb(var(--muted)/0.3)]">
              <span className="text-xs text-[rgb(var(--muted-foreground))]">Scale Range</span>
              <p className="font-medium font-mono text-[rgb(var(--foreground))]">
                {spacing.scale[0]}px - {spacing.scale[spacing.scale.length - 1]}px
              </p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

export default SpacingEditor;
