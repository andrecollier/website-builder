'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useColorTokens, useEditorStore } from '@/store/useEditorStore';
import { ColorPicker } from './ColorPicker';
import { calculateContrast, checkWcagCompliance, type ContrastResult } from '@/lib/design-system/color-extractor';
import type { ColorExtraction } from '@/types';

// ====================
// TYPES
// ====================

type ColorCategory = 'primary' | 'secondary' | 'neutral' | 'semantic';
type SemanticColorKey = keyof ColorExtraction['semantic'];
type PaletteShade = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950';

interface ColorSwatchProps {
  color: string;
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  isSelected?: boolean;
  contrastInfo?: ContrastResult | null;
}

interface CategorySectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

// ====================
// CONFIGURATION
// ====================

const SEMANTIC_LABELS: Record<SemanticColorKey, { label: string; description: string }> = {
  success: { label: 'Success', description: 'Positive actions and states' },
  error: { label: 'Error', description: 'Errors and destructive actions' },
  warning: { label: 'Warning', description: 'Caution and alerts' },
  info: { label: 'Info', description: 'Informational messages' },
};

const PALETTE_SHADES: PaletteShade[] = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

// ====================
// SUB-COMPONENTS
// ====================

/**
 * Color swatch component for displaying a single color
 */
function ColorSwatch({
  color,
  label,
  showLabel = false,
  size = 'md',
  onClick,
  isSelected,
  contrastInfo,
}: ColorSwatchProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={cn(
          sizeClasses[size],
          'rounded-lg border-2 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--background))]',
          {
            'border-[rgb(var(--accent))] ring-2 ring-[rgb(var(--accent)/0.3)]': !!isSelected,
            'border-[rgb(var(--border))] hover:border-[rgb(var(--accent))]': !isSelected && !!onClick,
            'border-transparent cursor-default': !onClick,
          }
        )}
        style={{ backgroundColor: color }}
        aria-label={label ? `Color: ${label} - ${color}` : `Color: ${color}`}
      />
      {showLabel && label && (
        <span className="text-xs text-[rgb(var(--muted-foreground))] font-mono">
          {label}
        </span>
      )}
      {contrastInfo && (
        <span
          className={cn('text-[10px] font-mono', {
            'text-[rgb(var(--success))]': contrastInfo.aa,
            'text-[rgb(var(--warning))]': contrastInfo.aaLarge && !contrastInfo.aa,
            'text-[rgb(var(--error))]': !contrastInfo.aaLarge,
          })}
          title={`Contrast ratio: ${contrastInfo.ratio}:1`}
        >
          {contrastInfo.ratio}:1
        </span>
      )}
    </div>
  );
}

/**
 * Section wrapper for color categories
 */
function CategorySection({ title, description, children }: CategorySectionProps) {
  return (
    <section className="mb-6" aria-labelledby={`section-${title.toLowerCase()}`}>
      <div className="mb-3">
        <h3
          id={`section-${title.toLowerCase()}`}
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
 * Contrast display component showing WCAG compliance levels
 */
function ContrastDisplay({
  foreground,
  background,
  label,
}: {
  foreground: string;
  background: string;
  label: string;
}) {
  const contrast = useMemo(() => {
    const ratio = calculateContrast(foreground, background);
    return checkWcagCompliance(ratio);
  }, [foreground, background]);

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[rgb(var(--muted-foreground))]">{label}:</span>
      <div className="flex items-center gap-1">
        {/* Color preview */}
        <div className="flex rounded overflow-hidden border border-[rgb(var(--border))]">
          <div
            className="w-4 h-4"
            style={{ backgroundColor: foreground }}
            aria-hidden="true"
          />
          <div
            className="w-4 h-4"
            style={{ backgroundColor: background }}
            aria-hidden="true"
          />
        </div>

        {/* Ratio */}
        <span className="font-mono text-[rgb(var(--foreground))]">
          {contrast.ratio}:1
        </span>

        {/* Badges */}
        <div className="flex gap-0.5">
          {contrast.aaa && (
            <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))]">
              AAA
            </span>
          )}
          {contrast.aa && !contrast.aaa && (
            <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))]">
              AA
            </span>
          )}
          {contrast.aaLarge && !contrast.aa && (
            <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-[rgb(var(--warning)/0.2)] text-[rgb(var(--warning))]">
              AA Large
            </span>
          )}
          {!contrast.aaLarge && (
            <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-[rgb(var(--error)/0.2)] text-[rgb(var(--error))]">
              Fail
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Palette editor component for displaying and editing color palettes
 */
function PaletteEditor({
  paletteName,
  palette,
  onColorChange,
  backgroundForContrast,
}: {
  paletteName: string;
  palette: Record<PaletteShade, string>;
  onColorChange: (shade: PaletteShade, color: string) => void;
  backgroundForContrast: string;
}) {
  const [expandedShade, setExpandedShade] = useState<PaletteShade | null>(null);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-[rgb(var(--foreground))] capitalize">
          {paletteName}
        </h4>
        <ContrastDisplay
          foreground={palette['500']}
          background={backgroundForContrast}
          label="500 on bg"
        />
      </div>

      {/* Palette grid */}
      <div className="flex gap-1 mb-2" role="group" aria-label={`${paletteName} color palette`}>
        {PALETTE_SHADES.map((shade) => (
          <ColorSwatch
            key={shade}
            color={palette[shade]}
            label={shade}
            showLabel
            size="sm"
            onClick={() => setExpandedShade(expandedShade === shade ? null : shade)}
            isSelected={expandedShade === shade}
          />
        ))}
      </div>

      {/* Expanded color picker */}
      {expandedShade && (
        <div className="p-3 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
          <ColorPicker
            value={palette[expandedShade]}
            onChange={(color) => onColorChange(expandedShade, color)}
            label={`${paletteName} ${expandedShade}`}
          />
        </div>
      )}
    </div>
  );
}

// ====================
// MAIN COMPONENT
// ====================

/**
 * ColorEditor component for editing design system color tokens
 *
 * Features:
 * - Edit primary, secondary, neutral, and semantic colors
 * - View and edit full color palettes with all shades (50-950)
 * - WCAG contrast ratio display for accessibility validation
 * - Real-time preview of all color changes
 */
export function ColorEditor() {
  const colors = useColorTokens();
  const updateColors = useEditorStore((state) => state.updateColors);
  const [activeCategory, setActiveCategory] = useState<ColorCategory>('primary');
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);

  // Get background color for contrast calculations
  const backgroundForContrast = useMemo(() => {
    return colors?.neutral?.[1] || '#ffffff';
  }, [colors]);

  // Handler for updating a specific color in an array category
  const handleArrayColorChange = useCallback(
    (category: 'primary' | 'secondary' | 'neutral', index: number, newColor: string) => {
      if (!colors) return;
      const newColors = [...colors[category]];
      newColors[index] = newColor;
      updateColors({ [category]: newColors });
    },
    [colors, updateColors]
  );

  // Handler for updating semantic colors
  const handleSemanticColorChange = useCallback(
    (key: SemanticColorKey, newColor: string) => {
      if (!colors) return;
      updateColors({
        semantic: {
          ...colors.semantic,
          [key]: newColor,
        },
      });
    },
    [colors, updateColors]
  );

  // Handler for updating palette colors
  const handlePaletteColorChange = useCallback(
    (paletteName: string, shade: PaletteShade, newColor: string) => {
      if (!colors) return;
      updateColors({
        palettes: {
          ...colors.palettes,
          [paletteName]: {
            ...colors.palettes[paletteName],
            [shade]: newColor,
          },
        },
      });
    },
    [colors, updateColors]
  );

  // Handler for adding a new color to a category
  const handleAddColor = useCallback(
    (category: 'primary' | 'secondary' | 'neutral') => {
      if (!colors) return;
      const defaultColor = category === 'neutral' ? '#71717a' : '#3b82f6';
      updateColors({ [category]: [...colors[category], defaultColor] });
    },
    [colors, updateColors]
  );

  // Handler for removing a color from a category
  const handleRemoveColor = useCallback(
    (category: 'primary' | 'secondary' | 'neutral', index: number) => {
      if (!colors || colors[category].length <= 1) return;
      const newColors = colors[category].filter((_, i) => i !== index);
      updateColors({ [category]: newColors });
      setSelectedColorIndex(null);
    },
    [colors, updateColors]
  );

  // If no colors loaded, show empty state
  if (!colors) {
    return (
      <div
        className="w-full rounded-lg bg-[rgb(var(--muted)/0.3)] p-6"
        role="status"
        aria-label="Color editor empty state"
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
            <circle cx="13.5" cy="6.5" r="2.5" />
            <circle cx="6.5" cy="13.5" r="2.5" />
            <circle cx="17.5" cy="17.5" r="2.5" />
            <path d="M10.5 8.5 8 11" />
            <path d="m15 15-2-2" />
          </svg>
          <p className="text-sm">No color tokens loaded</p>
          <p className="text-xs">Extract a website to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full"
      role="region"
      aria-label="Color editor"
    >
      {/* Category Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg bg-[rgb(var(--muted)/0.3)]" role="tablist">
        {(['primary', 'secondary', 'neutral', 'semantic'] as ColorCategory[]).map((category) => (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={activeCategory === category}
            onClick={() => {
              setActiveCategory(category);
              setSelectedColorIndex(null);
            }}
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
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Category Content */}
      <div role="tabpanel" aria-label={`${activeCategory} colors panel`}>
        {/* Primary Colors */}
        {activeCategory === 'primary' && (
          <CategorySection
            title="Primary Colors"
            description="Main brand colors used for key UI elements and CTAs"
          >
            <div className="space-y-4">
              {/* Color swatches */}
              <div className="flex flex-wrap gap-3">
                {colors.primary.map((color, index) => (
                  <div key={`primary-${index}`} className="relative group">
                    <ColorSwatch
                      color={color}
                      label={`Primary ${index + 1}`}
                      size="lg"
                      onClick={() => setSelectedColorIndex(index)}
                      isSelected={selectedColorIndex === index}
                      contrastInfo={checkWcagCompliance(calculateContrast(color, backgroundForContrast))}
                    />
                    {/* Remove button */}
                    {colors.primary.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveColor('primary', index)}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[rgb(var(--error))] text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                        aria-label={`Remove primary color ${index + 1}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                {/* Add color button */}
                <button
                  type="button"
                  onClick={() => handleAddColor('primary')}
                  className={cn(
                    'w-14 h-14 rounded-lg border-2 border-dashed transition-colors duration-200',
                    'border-[rgb(var(--border))] hover:border-[rgb(var(--accent))]',
                    'flex items-center justify-center text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--accent))]',
                    'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]'
                  )}
                  aria-label="Add primary color"
                >
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
                    aria-hidden="true"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </button>
              </div>

              {/* Color picker for selected color */}
              {selectedColorIndex !== null && colors.primary[selectedColorIndex] && (
                <div className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
                  <ColorPicker
                    value={colors.primary[selectedColorIndex]}
                    onChange={(color) => handleArrayColorChange('primary', selectedColorIndex, color)}
                    label={`Primary Color ${selectedColorIndex + 1}`}
                  />
                  <div className="mt-3 pt-3 border-t border-[rgb(var(--border))]">
                    <ContrastDisplay
                      foreground={colors.primary[selectedColorIndex]}
                      background={backgroundForContrast}
                      label="On background"
                    />
                  </div>
                </div>
              )}
            </div>
          </CategorySection>
        )}

        {/* Secondary Colors */}
        {activeCategory === 'secondary' && (
          <CategorySection
            title="Secondary Colors"
            description="Supporting colors for accents and secondary UI elements"
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {colors.secondary.map((color, index) => (
                  <div key={`secondary-${index}`} className="relative group">
                    <ColorSwatch
                      color={color}
                      label={`Secondary ${index + 1}`}
                      size="lg"
                      onClick={() => setSelectedColorIndex(index)}
                      isSelected={selectedColorIndex === index}
                      contrastInfo={checkWcagCompliance(calculateContrast(color, backgroundForContrast))}
                    />
                    {colors.secondary.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveColor('secondary', index)}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[rgb(var(--error))] text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                        aria-label={`Remove secondary color ${index + 1}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddColor('secondary')}
                  className={cn(
                    'w-14 h-14 rounded-lg border-2 border-dashed transition-colors duration-200',
                    'border-[rgb(var(--border))] hover:border-[rgb(var(--accent))]',
                    'flex items-center justify-center text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--accent))]',
                    'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]'
                  )}
                  aria-label="Add secondary color"
                >
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
                    aria-hidden="true"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </button>
              </div>

              {selectedColorIndex !== null && colors.secondary[selectedColorIndex] && (
                <div className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
                  <ColorPicker
                    value={colors.secondary[selectedColorIndex]}
                    onChange={(color) => handleArrayColorChange('secondary', selectedColorIndex, color)}
                    label={`Secondary Color ${selectedColorIndex + 1}`}
                  />
                  <div className="mt-3 pt-3 border-t border-[rgb(var(--border))]">
                    <ContrastDisplay
                      foreground={colors.secondary[selectedColorIndex]}
                      background={backgroundForContrast}
                      label="On background"
                    />
                  </div>
                </div>
              )}
            </div>
          </CategorySection>
        )}

        {/* Neutral Colors */}
        {activeCategory === 'neutral' && (
          <CategorySection
            title="Neutral Colors"
            description="Grays and backgrounds used for text, borders, and surfaces"
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {colors.neutral.map((color, index) => (
                  <div key={`neutral-${index}`} className="relative group">
                    <ColorSwatch
                      color={color}
                      label={`Neutral ${index + 1}`}
                      size="lg"
                      onClick={() => setSelectedColorIndex(index)}
                      isSelected={selectedColorIndex === index}
                    />
                    {colors.neutral.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveColor('neutral', index)}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[rgb(var(--error))] text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                        aria-label={`Remove neutral color ${index + 1}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddColor('neutral')}
                  className={cn(
                    'w-14 h-14 rounded-lg border-2 border-dashed transition-colors duration-200',
                    'border-[rgb(var(--border))] hover:border-[rgb(var(--accent))]',
                    'flex items-center justify-center text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--accent))]',
                    'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]'
                  )}
                  aria-label="Add neutral color"
                >
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
                    aria-hidden="true"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </button>
              </div>

              {selectedColorIndex !== null && colors.neutral[selectedColorIndex] && (
                <div className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
                  <ColorPicker
                    value={colors.neutral[selectedColorIndex]}
                    onChange={(color) => handleArrayColorChange('neutral', selectedColorIndex, color)}
                    label={`Neutral Color ${selectedColorIndex + 1}`}
                  />
                </div>
              )}
            </div>
          </CategorySection>
        )}

        {/* Semantic Colors */}
        {activeCategory === 'semantic' && (
          <CategorySection
            title="Semantic Colors"
            description="Colors with specific meanings for feedback and states"
          >
            <div className="grid gap-4">
              {(Object.keys(SEMANTIC_LABELS) as SemanticColorKey[]).map((key) => (
                <div
                  key={key}
                  className="p-4 rounded-lg bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">
                        {SEMANTIC_LABELS[key].label}
                      </h4>
                      <p className="text-xs text-[rgb(var(--muted-foreground))] mt-0.5">
                        {SEMANTIC_LABELS[key].description}
                      </p>
                    </div>
                    <ColorPicker
                      value={colors.semantic[key]}
                      onChange={(color) => handleSemanticColorChange(key, color)}
                    />
                  </div>
                  <div className="mt-3 pt-3 border-t border-[rgb(var(--border))]">
                    <div className="flex flex-col gap-2">
                      <ContrastDisplay
                        foreground={colors.semantic[key]}
                        background="#ffffff"
                        label="On white"
                      />
                      <ContrastDisplay
                        foreground="#ffffff"
                        background={colors.semantic[key]}
                        label="White on color"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CategorySection>
        )}
      </div>

      {/* Color Palettes Section */}
      <div className="mt-6 pt-6 border-t border-[rgb(var(--border))]">
        <CategorySection
          title="Color Palettes"
          description="Full shade ranges for primary colors (50-950)"
        >
          {Object.entries(colors.palettes).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(colors.palettes).map(([paletteName, palette]) => (
                <PaletteEditor
                  key={paletteName}
                  paletteName={paletteName}
                  palette={palette}
                  onColorChange={(shade, color) => handlePaletteColorChange(paletteName, shade, color)}
                  backgroundForContrast={backgroundForContrast}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              No palettes generated. Add primary colors to generate palettes.
            </p>
          )}
        </CategorySection>
      </div>
    </div>
  );
}

export default ColorEditor;
