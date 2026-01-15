'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useCurrentComponent, usePreviewStore } from '@/store/usePreviewStore';
import type { GeneratedComponent, ComponentVariant } from '@/types';

// ====================
// TYPES
// ====================

export type ComparisonViewMode = 'side-by-side' | 'overlay' | 'slider';

interface OriginalComparisonProps {
  /** Initial view mode for comparison */
  defaultViewMode?: ComparisonViewMode;
  /** Optional class name for the container */
  className?: string;
  /** Optional component override (uses current component from store if not provided) */
  component?: GeneratedComponent;
}

interface ViewModeToggleProps {
  mode: ComparisonViewMode;
  onChange: (mode: ComparisonViewMode) => void;
}

interface OriginalPanelProps {
  screenshotPath: string;
  componentType: string;
  boundingBox?: {
    width: number;
    height: number;
  };
}

interface GeneratedPanelProps {
  variant: ComponentVariant | null;
  customCode?: string;
  componentName: string;
}

interface SliderComparisonProps {
  screenshotPath: string;
  variant: ComponentVariant | null;
  sliderPosition: number;
  onSliderChange: (position: number) => void;
}

interface OverlayComparisonProps {
  screenshotPath: string;
  variant: ComponentVariant | null;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Formats a component type into a display-friendly name
 * @param type - The component type (e.g., 'hero', 'features')
 * @returns Formatted display name (e.g., 'Hero', 'Features')
 */
function formatComponentType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
}

/**
 * Builds the URL for accessing a screenshot
 * Screenshots are stored in the public directory structure
 */
function getScreenshotUrl(screenshotPath: string): string {
  // If path already starts with /, it's already a URL path
  if (screenshotPath.startsWith('/')) {
    return screenshotPath;
  }
  // Otherwise, construct the path from the Websites directory
  return `/${screenshotPath}`;
}

// ====================
// SUB-COMPONENTS
// ====================

/**
 * Toggle buttons for switching between comparison view modes
 */
function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  const modes: { value: ComparisonViewMode; label: string; icon: React.ReactNode }[] = [
    {
      value: 'side-by-side',
      label: 'Side by Side',
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
          <rect x="3" y="3" width="7" height="18" rx="1" />
          <rect x="14" y="3" width="7" height="18" rx="1" />
        </svg>
      ),
    },
    {
      value: 'slider',
      label: 'Slider',
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
          <line x1="12" y1="3" x2="12" y2="21" />
          <polyline points="8 8 12 4 16 8" />
          <polyline points="8 16 12 20 16 16" />
        </svg>
      ),
    },
    {
      value: 'overlay',
      label: 'Overlay',
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
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <rect x="7" y="7" width="10" height="10" rx="1" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="flex items-center gap-1 p-1 bg-[rgb(var(--muted)/0.3)] rounded-lg"
      role="tablist"
      aria-label="Comparison view mode"
    >
      {modes.map(({ value, label, icon }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={mode === value}
          aria-controls={`comparison-${value}`}
          onClick={() => onChange(value)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors',
            mode === value
              ? 'bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-sm'
              : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
          )}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Panel displaying the original captured screenshot
 */
function OriginalPanel({ screenshotPath, componentType, boundingBox }: OriginalPanelProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 px-1">
        <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">
          Original
        </h4>
        {boundingBox && (
          <span className="text-xs text-[rgb(var(--muted-foreground))]">
            {boundingBox.width}×{boundingBox.height}px
          </span>
        )}
      </div>
      <div
        className="flex-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--muted)/0.2)] overflow-hidden"
        role="img"
        aria-label={`Original ${componentType} component screenshot`}
      >
        {!imageError && screenshotPath ? (
          <img
            src={getScreenshotUrl(screenshotPath)}
            alt={`Original ${componentType} screenshot`}
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-[rgb(var(--muted-foreground))]">
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
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="mt-2 text-sm">Screenshot unavailable</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Panel displaying the generated component preview
 */
function GeneratedPanel({ variant, customCode, componentName }: GeneratedPanelProps) {
  const code = customCode || variant?.code;
  const variantName = variant?.name || 'Custom Code';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 px-1">
        <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">
          Generated
        </h4>
        <span className="text-xs text-[rgb(var(--muted-foreground))]">
          {variantName}
        </span>
      </div>
      <div
        className="flex-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--muted)/0.2)] overflow-hidden"
        role="region"
        aria-label={`Generated ${componentName} component preview`}
      >
        {code ? (
          <div className="w-full h-full min-h-[200px] p-4 overflow-auto">
            {/* Render a preview of the generated component */}
            <div className="flex flex-col items-center justify-center h-full text-[rgb(var(--muted-foreground))]">
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
                className="text-[rgb(var(--accent))]"
                aria-hidden="true"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <p className="mt-2 text-sm font-medium">
                {componentName}
              </p>
              <p className="text-xs mt-1">
                {variant?.description || 'Custom implementation'}
              </p>
              {variant?.accuracyScore !== undefined && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 w-24 bg-[rgb(var(--muted))] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[rgb(var(--accent))] rounded-full transition-all"
                      style={{ width: `${variant.accuracyScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono">
                    {variant.accuracyScore}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-[rgb(var(--muted-foreground))]">
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
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="mt-2 text-sm">No variant selected</p>
            <p className="text-xs mt-1">Select a variant to preview</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Slider comparison mode - drag to reveal original/generated
 */
function SliderComparison({
  screenshotPath,
  variant,
  sliderPosition,
  onSliderChange,
}: SliderComparisonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      onSliderChange(percentage);
    },
    [isDragging, onSliderChange]
  );

  return (
    <div
      className="relative w-full h-full min-h-[300px] rounded-lg border border-[rgb(var(--border))] overflow-hidden cursor-ew-resize"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      role="slider"
      aria-label="Drag to compare original and generated"
      aria-valuenow={sliderPosition}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Original image (full width, clipped) */}
      <div className="absolute inset-0 bg-[rgb(var(--muted)/0.2)]">
        {!imageError && screenshotPath ? (
          <img
            src={getScreenshotUrl(screenshotPath)}
            alt="Original"
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[rgb(var(--muted-foreground))]">
            Screenshot unavailable
          </div>
        )}
      </div>

      {/* Generated preview (clipped from left) */}
      <div
        className="absolute inset-0 bg-[rgb(var(--background))] overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
        <div className="flex items-center justify-center h-full text-[rgb(var(--muted-foreground))]">
          <div className="text-center">
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
              className="mx-auto text-[rgb(var(--accent))]"
              aria-hidden="true"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <p className="mt-2 text-sm">
              {variant?.name || 'Generated'}
            </p>
          </div>
        </div>
      </div>

      {/* Slider handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-[rgb(var(--accent))] cursor-ew-resize"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[rgb(var(--accent))] flex items-center justify-center shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-2 left-2 px-2 py-1 bg-[rgb(var(--background)/0.8)] rounded text-xs font-medium">
        Original
      </div>
      <div className="absolute top-2 right-2 px-2 py-1 bg-[rgb(var(--background)/0.8)] rounded text-xs font-medium">
        Generated
      </div>
    </div>
  );
}

/**
 * Overlay comparison mode - adjust opacity to blend views
 */
function OverlayComparison({
  screenshotPath,
  variant,
  opacity,
  onOpacityChange,
}: OverlayComparisonProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Opacity control */}
      <div className="flex items-center gap-3 mb-3 px-1">
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Original</span>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => onOpacityChange(Number(e.target.value))}
          className="flex-1 h-2 bg-[rgb(var(--muted))] rounded-lg appearance-none cursor-pointer"
          aria-label="Adjust overlay opacity"
        />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Generated</span>
      </div>

      {/* Layered view */}
      <div className="relative flex-1 rounded-lg border border-[rgb(var(--border))] overflow-hidden min-h-[300px]">
        {/* Original layer */}
        <div
          className="absolute inset-0 bg-[rgb(var(--muted)/0.2)]"
          style={{ opacity: (100 - opacity) / 100 }}
        >
          {!imageError && screenshotPath ? (
            <img
              src={getScreenshotUrl(screenshotPath)}
              alt="Original"
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[rgb(var(--muted-foreground))]">
              Screenshot unavailable
            </div>
          )}
        </div>

        {/* Generated layer */}
        <div
          className="absolute inset-0 bg-[rgb(var(--background))] flex items-center justify-center"
          style={{ opacity: opacity / 100 }}
        >
          <div className="text-center text-[rgb(var(--muted-foreground))]">
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
              className="mx-auto text-[rgb(var(--accent))]"
              aria-hidden="true"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <p className="mt-2 text-sm font-medium">
              {variant?.name || 'Generated'}
            </p>
            {variant?.description && (
              <p className="text-xs mt-1">{variant.description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================
// MAIN COMPONENT
// ====================

/**
 * OriginalComparison component for side-by-side comparison of original
 * captured screenshots with generated component previews.
 *
 * Features:
 * - Three view modes: side-by-side, slider, and overlay
 * - Shows original screenshot from captured data
 * - Displays selected variant or custom code preview
 * - Responsive layout that adapts to container size
 * - Accessible with proper ARIA attributes
 */
export function OriginalComparison({
  defaultViewMode = 'side-by-side',
  className,
  component: componentProp,
}: OriginalComparisonProps) {
  const storeComponent = useCurrentComponent();
  const component = componentProp || storeComponent;

  const [viewMode, setViewMode] = useState<ComparisonViewMode>(defaultViewMode);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [overlayOpacity, setOverlayOpacity] = useState(50);

  // Get the selected variant for the current component
  const selectedVariant = useMemo(() => {
    if (!component) return null;
    if (!component.selectedVariant) return null;
    return component.variants.find((v) => v.id === component.selectedVariant) ?? null;
  }, [component]);

  // If no component loaded, show empty state
  if (!component) {
    return (
      <div
        className={cn(
          'w-full rounded-lg bg-[rgb(var(--muted)/0.3)] p-6',
          className
        )}
        role="region"
        aria-label="Original comparison empty state"
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
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <p className="text-sm">No component selected</p>
          <p className="text-xs">Select a component to compare</p>
        </div>
      </div>
    );
  }

  // Mock screenshot path from component data
  // In real implementation, this would come from the detected component data
  const screenshotPath = `/Websites/website-${component.websiteId}/screenshots/${component.type}.png`;

  return (
    <div
      className={cn(
        'w-full rounded-lg bg-[rgb(var(--muted)/0.3)] p-4',
        className
      )}
      role="region"
      aria-label="Original vs generated comparison"
    >
      {/* Header with view mode toggle */}
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
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
          <h3 className="text-sm font-semibold text-[rgb(var(--foreground))]">
            Compare: {formatComponentType(component.type)}
          </h3>
        </div>
        <ViewModeToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {/* Comparison content */}
      <div id={`comparison-${viewMode}`} role="tabpanel">
        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <OriginalPanel
              screenshotPath={screenshotPath}
              componentType={component.type}
              boundingBox={{ width: 1440, height: 600 }}
            />
            <GeneratedPanel
              variant={selectedVariant}
              customCode={component.customCode}
              componentName={component.name}
            />
          </div>
        )}

        {viewMode === 'slider' && (
          <SliderComparison
            screenshotPath={screenshotPath}
            variant={selectedVariant}
            sliderPosition={sliderPosition}
            onSliderChange={setSliderPosition}
          />
        )}

        {viewMode === 'overlay' && (
          <OverlayComparison
            screenshotPath={screenshotPath}
            variant={selectedVariant}
            opacity={overlayOpacity}
            onOpacityChange={setOverlayOpacity}
          />
        )}
      </div>

      {/* Component info footer */}
      <div className="mt-4 pt-3 border-t border-[rgb(var(--border)/0.5)]">
        <div className="flex flex-wrap gap-4 text-xs text-[rgb(var(--muted-foreground))]">
          <div className="flex items-center gap-1">
            <span className="font-medium">Type:</span>
            <span>{formatComponentType(component.type)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Variants:</span>
            <span>{component.variants.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Status:</span>
            <span
              className={cn({
                'text-green-500': component.status === 'approved',
                'text-yellow-500': component.status === 'pending',
                'text-red-500': component.status === 'failed' || component.status === 'rejected',
                'text-gray-500': component.status === 'skipped',
              })}
            >
              {component.status.charAt(0).toUpperCase() + component.status.slice(1)}
            </span>
          </div>
          {selectedVariant && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Selected:</span>
              <span>{selectedVariant.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OriginalComparison;
