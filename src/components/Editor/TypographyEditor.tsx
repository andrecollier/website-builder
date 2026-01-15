'use client';

import { useState, useCallback, useMemo } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';
import { useTypographyTokens, useEditorStore } from '@/store/useEditorStore';
import type { TypographyExtraction } from '@/types';

// ====================
// TYPES
// ====================

type FontCategory = 'fonts' | 'scale' | 'weights' | 'lineHeights';
type FontRole = keyof TypographyExtraction['fonts'];
type ScaleKey = keyof TypographyExtraction['scale'];
type LineHeightKey = keyof TypographyExtraction['lineHeights'];

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

interface FontSelectProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}

interface SectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

// ====================
// CONFIGURATION
// ====================

const FONT_ROLES: Record<FontRole, { label: string; description: string }> = {
  heading: { label: 'Heading Font', description: 'Used for h1-h6 and display text' },
  body: { label: 'Body Font', description: 'Used for paragraphs and general content' },
  mono: { label: 'Monospace Font', description: 'Used for code and technical content' },
};

const SCALE_KEYS: ScaleKey[] = ['display', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'small', 'xs'];

const SCALE_LABELS: Record<ScaleKey, { label: string; description: string }> = {
  display: { label: 'Display', description: 'Hero headlines and large text' },
  h1: { label: 'Heading 1', description: 'Primary page headings' },
  h2: { label: 'Heading 2', description: 'Section headings' },
  h3: { label: 'Heading 3', description: 'Sub-section headings' },
  h4: { label: 'Heading 4', description: 'Card and component titles' },
  h5: { label: 'Heading 5', description: 'Small headings' },
  h6: { label: 'Heading 6', description: 'Smallest headings' },
  body: { label: 'Body', description: 'Main content text' },
  small: { label: 'Small', description: 'Secondary and helper text' },
  xs: { label: 'Extra Small', description: 'Labels and captions' },
};

const LINE_HEIGHT_LABELS: Record<LineHeightKey, { label: string; description: string }> = {
  tight: { label: 'Tight', description: 'Headings and display text' },
  normal: { label: 'Normal', description: 'Body text and paragraphs' },
  relaxed: { label: 'Relaxed', description: 'Large text blocks' },
};

const COMMON_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

const WEIGHT_LABELS: Record<number, string> = {
  100: 'Thin',
  200: 'Extra Light',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'Semi Bold',
  700: 'Bold',
  800: 'Extra Bold',
  900: 'Black',
};

// Common font families for suggestions
const FONT_SUGGESTIONS = [
  'system-ui, sans-serif',
  'Inter, sans-serif',
  'Roboto, sans-serif',
  'Open Sans, sans-serif',
  'Lato, sans-serif',
  'Montserrat, sans-serif',
  'Poppins, sans-serif',
  'Source Sans Pro, sans-serif',
  'Playfair Display, serif',
  'Merriweather, serif',
  'Georgia, serif',
  'Fira Code, monospace',
  'JetBrains Mono, monospace',
  'Source Code Pro, monospace',
];

// ====================
// SUB-COMPONENTS
// ====================

/**
 * Section wrapper component for typography categories
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
 * Font family selector with dropdown
 */
function FontSelect({ label, description, value, onChange }: FontSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState(value);

  const handleCustomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setCustomValue(newValue);
      onChange(newValue);
    },
    [onChange]
  );

  const handleSuggestionClick = useCallback(
    (font: string) => {
      setCustomValue(font);
      onChange(font);
      setIsOpen(false);
    },
    [onChange]
  );

  return (
    <div className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">{label}</h4>
          <p className="text-xs text-[rgb(var(--muted-foreground))] mt-0.5">{description}</p>
        </div>
      </div>

      {/* Current Font Preview */}
      <div
        className="mb-3 p-3 rounded border border-[rgb(var(--border))] bg-[rgb(var(--background))]"
        style={{ fontFamily: value }}
      >
        <p className="text-lg text-[rgb(var(--foreground))]">The quick brown fox jumps</p>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">abcdefghijklmnopqrstuvwxyz</p>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">0123456789</p>
      </div>

      {/* Font Input */}
      <div className="relative">
        <input
          type="text"
          value={customValue}
          onChange={handleCustomChange}
          onFocus={() => setIsOpen(true)}
          className={cn(
            'w-full px-3 py-2 rounded-md text-sm',
            'bg-[rgb(var(--background))] border border-[rgb(var(--border))]',
            'text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted-foreground))]',
            'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent'
          )}
          placeholder="Enter font family..."
          aria-label={`${label} font family`}
        />

        {/* Font Suggestions Dropdown */}
        {isOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div
              className={cn(
                'absolute z-20 w-full mt-1 py-1 rounded-md shadow-lg',
                'bg-[rgb(var(--background))] border border-[rgb(var(--border))]',
                'max-h-48 overflow-y-auto'
              )}
              role="listbox"
              aria-label="Font suggestions"
            >
              {FONT_SUGGESTIONS.map((font) => (
                <button
                  key={font}
                  type="button"
                  role="option"
                  aria-selected={font === value}
                  onClick={() => handleSuggestionClick(font)}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm transition-colors duration-150',
                    'hover:bg-[rgb(var(--muted)/0.5)]',
                    {
                      'bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--accent))]': font === value,
                      'text-[rgb(var(--foreground))]': font !== value,
                    }
                  )}
                  style={{ fontFamily: font }}
                >
                  {font.split(',')[0]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
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
 * Type scale preview component
 */
function TypeScalePreview({
  scaleKey,
  fontSize,
  fontFamily,
  lineHeight,
}: {
  scaleKey: ScaleKey;
  fontSize: string;
  fontFamily: string;
  lineHeight: number;
}) {
  const info = SCALE_LABELS[scaleKey];

  return (
    <div className="flex items-center gap-4 py-2 border-b border-[rgb(var(--border)/0.3)] last:border-0">
      <div className="w-20 flex-shrink-0">
        <span className="text-xs font-medium text-[rgb(var(--muted-foreground))]">{info.label}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[rgb(var(--foreground))] truncate"
          style={{
            fontSize,
            fontFamily,
            lineHeight,
          }}
        >
          The quick brown fox
        </p>
      </div>
      <div className="w-16 flex-shrink-0 text-right">
        <span className="text-xs font-mono text-[rgb(var(--muted-foreground))]">{fontSize}</span>
      </div>
    </div>
  );
}

/**
 * Weight chip component for selecting font weights
 */
function WeightChip({
  weight,
  isActive,
  onClick,
}: {
  weight: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-1',
        {
          'bg-[rgb(var(--accent))] text-white': isActive,
          'bg-[rgb(var(--muted)/0.5)] text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))]':
            !isActive,
        }
      )}
      style={{ fontWeight: weight }}
      aria-pressed={isActive}
    >
      {weight} {WEIGHT_LABELS[weight] && `(${WEIGHT_LABELS[weight]})`}
    </button>
  );
}

// ====================
// MAIN COMPONENT
// ====================

/**
 * TypographyEditor component for editing design system typography tokens
 *
 * Features:
 * - Edit font families for heading, body, and mono text
 * - Adjust type scale sizes (display, h1-h6, body, small, xs)
 * - Toggle font weights with visual preview
 * - Adjust line heights with slider controls
 * - Live preview of all typography changes
 */
export function TypographyEditor() {
  const typography = useTypographyTokens();
  const updateTypography = useEditorStore((state) => state.updateTypography);
  const [activeCategory, setActiveCategory] = useState<FontCategory>('fonts');

  // Parse font size to number for slider (convert rem to px for display)
  const parseFontSize = useCallback((size: string): number => {
    if (size.endsWith('rem')) {
      return parseFloat(size) * 16;
    }
    if (size.endsWith('px')) {
      return parseFloat(size);
    }
    return parseFloat(size) || 16;
  }, []);

  // Format font size from px to rem
  const formatFontSize = useCallback((px: number): string => {
    return `${(px / 16).toFixed(3).replace(/\.?0+$/, '')}rem`;
  }, []);

  // Handler for updating font family
  const handleFontChange = useCallback(
    (role: FontRole, value: string) => {
      if (!typography) return;
      updateTypography({
        fonts: {
          ...typography.fonts,
          [role]: value,
        },
      });
    },
    [typography, updateTypography]
  );

  // Handler for updating scale value
  const handleScaleChange = useCallback(
    (key: ScaleKey, pxValue: number) => {
      if (!typography) return;
      updateTypography({
        scale: {
          ...typography.scale,
          [key]: formatFontSize(pxValue),
        },
      });
    },
    [typography, updateTypography, formatFontSize]
  );

  // Handler for toggling weight
  const handleWeightToggle = useCallback(
    (weight: number) => {
      if (!typography) return;
      const currentWeights = [...typography.weights];
      const index = currentWeights.indexOf(weight);

      if (index > -1) {
        // Don't remove if it's the only weight
        if (currentWeights.length > 1) {
          currentWeights.splice(index, 1);
        }
      } else {
        currentWeights.push(weight);
        currentWeights.sort((a, b) => a - b);
      }

      updateTypography({ weights: currentWeights });
    },
    [typography, updateTypography]
  );

  // Handler for updating line height
  const handleLineHeightChange = useCallback(
    (key: LineHeightKey, value: number) => {
      if (!typography) return;
      updateTypography({
        lineHeights: {
          ...typography.lineHeights,
          [key]: value,
        },
      });
    },
    [typography, updateTypography]
  );

  // Get the heading font for previews
  const headingFont = useMemo(() => typography?.fonts.heading || 'system-ui, sans-serif', [typography]);
  const bodyFont = useMemo(() => typography?.fonts.body || 'system-ui, sans-serif', [typography]);
  const normalLineHeight = useMemo(() => typography?.lineHeights.normal || 1.5, [typography]);

  // If no typography loaded, show empty state
  if (!typography) {
    return (
      <div
        className="w-full rounded-lg bg-[rgb(var(--muted)/0.3)] p-6"
        role="status"
        aria-label="Typography editor empty state"
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
            <polyline points="4 7 4 4 20 4 20 7" />
            <line x1="9" x2="15" y1="20" y2="20" />
            <line x1="12" x2="12" y1="4" y2="20" />
          </svg>
          <p className="text-sm">No typography tokens loaded</p>
          <p className="text-xs">Extract a website to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full"
      role="region"
      aria-label="Typography editor"
    >
      {/* Category Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg bg-[rgb(var(--muted)/0.3)]" role="tablist">
        {(['fonts', 'scale', 'weights', 'lineHeights'] as FontCategory[]).map((category) => {
          const labels: Record<FontCategory, string> = {
            fonts: 'Fonts',
            scale: 'Scale',
            weights: 'Weights',
            lineHeights: 'Line Heights',
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
        {/* Fonts */}
        {activeCategory === 'fonts' && (
          <Section
            title="Font Families"
            description="Configure the primary typefaces for headings, body text, and code"
          >
            <div className="space-y-4">
              {(Object.keys(FONT_ROLES) as FontRole[]).map((role) => {
                const fontValue = typography.fonts[role];
                // Skip mono if not defined
                if (role === 'mono' && !fontValue) return null;

                return (
                  <FontSelect
                    key={role}
                    label={FONT_ROLES[role].label}
                    description={FONT_ROLES[role].description}
                    value={fontValue || ''}
                    onChange={(value) => handleFontChange(role, value)}
                  />
                );
              })}

              {/* Add mono font if not present */}
              {!typography.fonts.mono && (
                <button
                  type="button"
                  onClick={() => handleFontChange('mono', 'Fira Code, monospace')}
                  className={cn(
                    'w-full p-4 rounded-lg border-2 border-dashed transition-colors duration-200',
                    'border-[rgb(var(--border))] hover:border-[rgb(var(--accent))]',
                    'flex items-center justify-center gap-2 text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--accent))]',
                    'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]'
                  )}
                  aria-label="Add monospace font"
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
                  <span className="text-sm">Add Monospace Font</span>
                </button>
              )}
            </div>
          </Section>
        )}

        {/* Scale */}
        {activeCategory === 'scale' && (
          <Section
            title="Type Scale"
            description="Adjust font sizes for the typography hierarchy"
          >
            {/* Scale Preview */}
            <div className="mb-6 p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
              <h4 className="text-xs font-medium text-[rgb(var(--muted-foreground))] mb-3">Preview</h4>
              {SCALE_KEYS.map((key) => (
                <TypeScalePreview
                  key={key}
                  scaleKey={key}
                  fontSize={typography.scale[key]}
                  fontFamily={key === 'body' || key === 'small' || key === 'xs' ? bodyFont : headingFont}
                  lineHeight={normalLineHeight}
                />
              ))}
            </div>

            {/* Scale Sliders */}
            <div className="space-y-6">
              {SCALE_KEYS.map((key) => {
                const currentPx = parseFontSize(typography.scale[key]);
                const info = SCALE_LABELS[key];

                // Define reasonable min/max based on scale key
                let min = 10;
                let max = 120;
                if (key === 'display' || key === 'h1') {
                  min = 24;
                  max = 120;
                } else if (key === 'h2' || key === 'h3') {
                  min = 18;
                  max = 72;
                } else if (key === 'h4' || key === 'h5' || key === 'h6') {
                  min = 14;
                  max = 48;
                } else if (key === 'body') {
                  min = 14;
                  max = 24;
                } else {
                  min = 10;
                  max = 18;
                }

                return (
                  <div
                    key={key}
                    className="p-3 rounded-lg bg-[rgb(var(--muted)/0.2)] border border-[rgb(var(--border)/0.5)]"
                  >
                    <div className="mb-2">
                      <span className="text-xs text-[rgb(var(--muted-foreground))]">{info.description}</span>
                    </div>
                    <SliderControl
                      label={info.label}
                      value={currentPx}
                      min={min}
                      max={max}
                      step={1}
                      unit="px"
                      onChange={(px) => handleScaleChange(key, px)}
                      formatValue={(px) => `${px}px (${formatFontSize(px)})`}
                    />
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Weights */}
        {activeCategory === 'weights' && (
          <Section
            title="Font Weights"
            description="Select the font weights available in your design system"
          >
            {/* Weight Preview */}
            <div className="mb-6 p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
              <h4 className="text-xs font-medium text-[rgb(var(--muted-foreground))] mb-3">Active Weights</h4>
              <div className="space-y-2">
                {typography.weights.map((weight) => (
                  <p
                    key={weight}
                    className="text-[rgb(var(--foreground))]"
                    style={{ fontWeight: weight, fontFamily: bodyFont }}
                  >
                    {weight} - {WEIGHT_LABELS[weight] || 'Custom'}: The quick brown fox jumps over the lazy dog
                  </p>
                ))}
              </div>
            </div>

            {/* Weight Selection */}
            <div className="flex flex-wrap gap-2">
              {COMMON_WEIGHTS.map((weight) => (
                <WeightChip
                  key={weight}
                  weight={weight}
                  isActive={typography.weights.includes(weight)}
                  onClick={() => handleWeightToggle(weight)}
                />
              ))}
            </div>

            <p className="mt-4 text-xs text-[rgb(var(--muted-foreground))]">
              Click to toggle weights. At least one weight must remain selected.
            </p>
          </Section>
        )}

        {/* Line Heights */}
        {activeCategory === 'lineHeights' && (
          <Section
            title="Line Heights"
            description="Adjust line heights for different text contexts"
          >
            <div className="space-y-6">
              {(Object.keys(LINE_HEIGHT_LABELS) as LineHeightKey[]).map((key) => {
                const info = LINE_HEIGHT_LABELS[key];
                const value = typography.lineHeights[key];

                return (
                  <div
                    key={key}
                    className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]"
                  >
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">{info.label}</h4>
                      <p className="text-xs text-[rgb(var(--muted-foreground))]">{info.description}</p>
                    </div>

                    {/* Preview */}
                    <div
                      className="mb-4 p-3 rounded border border-[rgb(var(--border))] bg-[rgb(var(--background))]"
                      style={{ lineHeight: value, fontFamily: bodyFont }}
                    >
                      <p className="text-sm text-[rgb(var(--foreground))]">
                        Typography is the art and technique of arranging type to make written language
                        legible, readable, and appealing when displayed. The arrangement of type involves
                        selecting typefaces, point sizes, line lengths, line-spacing, and letter-spacing.
                      </p>
                    </div>

                    {/* Slider */}
                    <SliderControl
                      label={`${info.label} Line Height`}
                      value={value}
                      min={1}
                      max={2.5}
                      step={0.05}
                      unit=""
                      onChange={(v) => handleLineHeightChange(key, v)}
                      formatValue={(v) => v.toFixed(2)}
                    />
                  </div>
                );
              })}
            </div>
          </Section>
        )}
      </div>

      {/* Summary Section */}
      <div className="mt-6 pt-6 border-t border-[rgb(var(--border))]">
        <Section
          title="Typography Summary"
          description="Current typography configuration overview"
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-[rgb(var(--muted)/0.3)]">
              <span className="text-xs text-[rgb(var(--muted-foreground))]">Heading Font</span>
              <p className="font-medium text-[rgb(var(--foreground))] truncate">{typography.fonts.heading}</p>
            </div>
            <div className="p-3 rounded-lg bg-[rgb(var(--muted)/0.3)]">
              <span className="text-xs text-[rgb(var(--muted-foreground))]">Body Font</span>
              <p className="font-medium text-[rgb(var(--foreground))] truncate">{typography.fonts.body}</p>
            </div>
            <div className="p-3 rounded-lg bg-[rgb(var(--muted)/0.3)]">
              <span className="text-xs text-[rgb(var(--muted-foreground))]">Active Weights</span>
              <p className="font-medium text-[rgb(var(--foreground))]">{typography.weights.join(', ')}</p>
            </div>
            <div className="p-3 rounded-lg bg-[rgb(var(--muted)/0.3)]">
              <span className="text-xs text-[rgb(var(--muted-foreground))]">Base Size</span>
              <p className="font-medium text-[rgb(var(--foreground))]">{typography.scale.body}</p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

export default TypographyEditor;
