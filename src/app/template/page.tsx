'use client';

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ReferenceList } from '@/components/Template/ReferenceList';
import { SectionPicker } from '@/components/Template/SectionPicker';
import { MixerCanvas } from '@/components/Template/MixerCanvas';
import { MixedPreview } from '@/components/Template/MixedPreview';
import { TokenSourceSelector } from '@/components/Template/TokenSourceSelector';
import { HarmonyIndicator } from '@/components/Template/HarmonyIndicator';
import { useStore } from '@/store/useStore';
import { cn, generateId, isValidUrl, getNameFromUrl } from '@/lib/utils';
import type {
  ReferenceUrl,
  SectionAssignment,
  SectionType,
  TemplateConfig,
  StartExtractionResponse,
  HarmonyResult,
} from '@/types';

/**
 * Default section order
 */
const DEFAULT_SECTION_ORDER: SectionType[] = [
  'header',
  'hero',
  'features',
  'testimonials',
  'pricing',
  'cta',
  'footer',
];

/**
 * Create initial section assignments
 */
function createInitialSections(): SectionAssignment[] {
  return DEFAULT_SECTION_ORDER.map((sectionType, index) => ({
    sectionType,
    sourceId: null,
    order: index,
  }));
}

/**
 * Create a new reference URL object
 */
function createReference(url: string = ''): ReferenceUrl {
  return {
    id: generateId(),
    url,
    name: url ? getNameFromUrl(url) : undefined,
    isValid: isValidUrl(url),
  };
}

/**
 * Loading fallback for Suspense
 */
function TemplatePageLoading() {
  return (
    <main className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
      <div className="animate-pulse text-[rgb(var(--muted-foreground))]">Loading...</div>
    </main>
  );
}

/**
 * Template Mode Page Content
 * Allows users to:
 * - Add multiple reference URLs
 * - Assign each section to a specific source
 * - Reorder sections via drag-and-drop
 * - Generate a mixed website from multiple sources
 */
function TemplatePageContent() {
  const searchParams = useSearchParams();
  const store = useStore();

  // Get initial URL from query params (if coming from dashboard)
  const initialUrl = searchParams.get('url') || '';

  // Reference URLs state
  const [references, setReferences] = useState<ReferenceUrl[]>(() => [
    createReference(initialUrl),
  ]);

  // Section assignments state
  const [sections, setSections] = useState<SectionAssignment[]>(createInitialSections);

  // Primary token source state
  const [primaryTokenSource, setPrimaryTokenSource] = useState<string | null>(null);

  // Harmony state
  const [harmonyResult, setHarmonyResult] = useState<HarmonyResult | null>(null);
  const [isCalculatingHarmony, setIsCalculatingHarmony] = useState(false);

  // Loading state
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Add a new reference URL
   */
  const handleAddReference = useCallback(() => {
    setReferences((prev) => [...prev, createReference()]);
  }, []);

  /**
   * Remove a reference URL
   */
  const handleRemoveReference = useCallback((id: string) => {
    setReferences((prev) => {
      // Don't allow removing if only one reference
      if (prev.length <= 1) return prev;
      return prev.filter((ref) => ref.id !== id);
    });

    // Also remove any section assignments using this reference
    setSections((prev) =>
      prev.map((section) =>
        section.sourceId === id ? { ...section, sourceId: null } : section
      )
    );

    // Clear primary token source if this reference was selected
    setPrimaryTokenSource((prev) => (prev === id ? null : prev));
  }, []);

  /**
   * Update a reference URL
   */
  const handleUpdateReference = useCallback((id: string, url: string) => {
    setReferences((prev) =>
      prev.map((ref) =>
        ref.id === id
          ? {
              ...ref,
              url,
              name: url ? getNameFromUrl(url) : undefined,
              isValid: isValidUrl(url),
            }
          : ref
      )
    );
  }, []);

  /**
   * Assign a source to a section
   */
  const handleAssignSection = useCallback((sectionType: SectionType, sourceId: string | null) => {
    setSections((prev) =>
      prev.map((section) =>
        section.sectionType === sectionType ? { ...section, sourceId } : section
      )
    );
  }, []);

  /**
   * Reorder sections
   */
  const handleReorderSections = useCallback((newSections: SectionAssignment[]) => {
    setSections(newSections);
  }, []);

  /**
   * Select primary token source
   */
  const handleSelectTokenSource = useCallback((sourceId: string | null) => {
    setPrimaryTokenSource(sourceId);
  }, []);

  /**
   * Calculate harmony when section mappings or references change
   */
  useEffect(() => {
    // Don't calculate if no valid references or no assigned sections
    const validRefs = references.filter((ref) => ref.isValid);
    const assignedSecs = sections.filter((sec) => sec.sourceId !== null);

    if (validRefs.length === 0 || assignedSecs.length === 0) {
      setHarmonyResult(null);
      return;
    }

    // Debounce harmony calculation
    const timeoutId = setTimeout(async () => {
      try {
        setIsCalculatingHarmony(true);

        // Build section mapping for harmony calculation
        const sectionMapping: Record<string, string> = {};
        sections.forEach((section) => {
          if (section.sourceId) {
            sectionMapping[section.sectionType] = section.sourceId;
          }
        });

        // Mock references structure for API (will be replaced with actual reference processing)
        const referencesForApi = validRefs.map((ref) => ({
          id: ref.id,
          name: ref.name || getNameFromUrl(ref.url),
          url: ref.url,
          status: 'ready' as const,
          tokens: {
            colors: { primary: '#000000' },
            typography: { fontFamily: 'Inter' },
            spacing: { base: 8 },
            effects: {},
          },
          sections: [],
        }));

        // Call harmony API
        const response = await fetch('/api/template/harmony', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            references: referencesForApi,
            sectionMapping,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setHarmonyResult(data);
        } else {
          setHarmonyResult(null);
        }
      } catch (error) {
        setHarmonyResult(null);
      } finally {
        setIsCalculatingHarmony(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [references, sections]);

  /**
   * Check if configuration is valid for generation
   */
  const isValidConfiguration = useMemo(() => {
    // Need at least one valid reference
    const hasValidReference = references.some((ref) => ref.isValid);
    // Need at least one section assigned
    const hasAssignedSection = sections.some((section) => section.sourceId !== null);
    return hasValidReference && hasAssignedSection;
  }, [references, sections]);

  /**
   * Get count of valid references
   */
  const validReferenceCount = useMemo(
    () => references.filter((ref) => ref.isValid).length,
    [references]
  );

  /**
   * Get count of assigned sections
   */
  const assignedSectionCount = useMemo(
    () => sections.filter((section) => section.sourceId !== null).length,
    [sections]
  );

  /**
   * Handle Generate Mixed Website button click
   */
  const handleGenerate = async () => {
    if (!isValidConfiguration || isGenerating) return;

    try {
      setIsGenerating(true);

      // Get valid references
      const validRefs = references.filter((ref) => ref.isValid);

      // Build reference URLs array
      const referenceUrls = validRefs.map((ref) => ref.url);

      // Build reference ID to index mapping
      const idToIndexMap = new Map<string, number>();
      validRefs.forEach((ref, index) => {
        idToIndexMap.set(ref.id, index);
      });

      // Build section mapping with indices as strings
      const sectionMapping: Record<string, string> = {};
      sections.forEach((section) => {
        if (section.sourceId !== null) {
          const index = idToIndexMap.get(section.sourceId);
          if (index !== undefined) {
            sectionMapping[section.sectionType] = String(index);
          }
        }
      });

      // Get primary token source index
      let primaryTokenSourceIndex: number | undefined;
      if (primaryTokenSource) {
        primaryTokenSourceIndex = idToIndexMap.get(primaryTokenSource);
      }

      // Generate project name
      const projectName = `Mixed Website - ${validRefs.length} sources`;

      // Call template generation API
      const response = await fetch('/api/template/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName,
          referenceUrls,
          sectionMapping,
          primaryTokenSourceIndex,
        }),
      });

      const data = await response.json();

      if (data.success && data.projectId) {
        // Redirect to preview page
        window.location.href = `/preview/${data.projectId}`;
      } else {
        // Show error message
        store.setError({
          id: `error-${Date.now()}`,
          phase: 0,
          message: data.error || 'Failed to generate template. Please try again.',
          timestamp: new Date().toISOString(),
          recoverable: true,
        });
      }
    } catch (error) {
      // Handle network or unexpected errors
      store.setError({
        id: `error-${Date.now()}`,
        phase: 0,
        message: error instanceof Error ? error.message : 'Network error. Please check your connection.',
        timestamp: new Date().toISOString(),
        recoverable: true,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Reset all configuration
   */
  const handleReset = useCallback(() => {
    setReferences([createReference()]);
    setSections(createInitialSections());
    setPrimaryTokenSource(null);
    setHarmonyResult(null);
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[rgb(var(--border)/0.3)] bg-[rgb(var(--background))]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back Link */}
            <Link
              href="/"
              className={cn(
                'p-2 rounded-lg',
                'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]',
                'hover:bg-[rgb(var(--muted)/0.3)]',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring)/0.3)]',
                'transition-colors duration-150'
              )}
              aria-label="Back to Dashboard"
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
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </Link>

            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">
                Template Mode
              </h1>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                Mix sections from multiple reference websites
              </p>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]',
              'hover:bg-[rgb(var(--muted)/0.3)]',
              'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring)/0.3)]',
              'transition-colors duration-150'
            )}
          >
            Reset All
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Progress Summary */}
          <div className="mb-8 p-4 rounded-lg bg-[rgb(var(--muted)/0.2)] border border-[rgb(var(--border))]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Valid References Count */}
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold',
                      validReferenceCount > 0
                        ? 'bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))]'
                        : 'bg-[rgb(var(--muted)/0.5)] text-[rgb(var(--muted-foreground))]'
                    )}
                  >
                    {validReferenceCount}
                  </div>
                  <span className="text-sm text-[rgb(var(--muted-foreground))]">
                    Valid {validReferenceCount === 1 ? 'Reference' : 'References'}
                  </span>
                </div>

                {/* Separator */}
                <div className="w-px h-6 bg-[rgb(var(--border))]" aria-hidden="true" />

                {/* Assigned Sections Count */}
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold',
                      assignedSectionCount > 0
                        ? 'bg-[rgb(var(--success)/0.2)] text-[rgb(var(--success))]'
                        : 'bg-[rgb(var(--muted)/0.5)] text-[rgb(var(--muted-foreground))]'
                    )}
                  >
                    {assignedSectionCount}/{sections.length}
                  </div>
                  <span className="text-sm text-[rgb(var(--muted-foreground))]">
                    Sections Assigned
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                {isValidConfiguration ? (
                  <>
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
                      className="text-[rgb(var(--success))]"
                      aria-hidden="true"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span className="text-sm text-[rgb(var(--success))]">
                      Ready to generate
                    </span>
                  </>
                ) : (
                  <>
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
                      className="text-[rgb(var(--warning))]"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span className="text-sm text-[rgb(var(--warning))]">
                      Add references and assign sections
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: Reference URLs */}
            <section className="lg:col-span-1">
              <ReferenceList
                references={references}
                onAdd={handleAddReference}
                onRemove={handleRemoveReference}
                onUpdate={handleUpdateReference}
              />
            </section>

            {/* Column 2: Section Picker */}
            <section className="lg:col-span-1">
              <SectionPicker
                sections={sections}
                references={references}
                onAssign={handleAssignSection}
              />
            </section>

            {/* Column 3: Mixer Canvas */}
            <section className="lg:col-span-1">
              <MixerCanvas
                sections={sections}
                references={references}
                onReorder={handleReorderSections}
              />
            </section>
          </div>

          {/* Mixed Preview Section */}
          <section className="mt-8">
            <MixedPreview
              sections={sections}
              references={references}
            />
          </section>

          {/* Token Source Selector */}
          <section className="mt-8 flex justify-center">
            <TokenSourceSelector
              references={references}
              primaryTokenSource={primaryTokenSource}
              onSelect={handleSelectTokenSource}
            />
          </section>

          {/* Harmony Indicator */}
          <section className="mt-8 flex justify-center">
            <HarmonyIndicator
              harmonyResult={harmonyResult}
              isCalculating={isCalculatingHarmony}
            />
          </section>

          {/* Generate Button */}
          <div className="mt-12 flex flex-col items-center">
            <button
              onClick={handleGenerate}
              disabled={!isValidConfiguration || isGenerating}
              className={cn(
                'px-8 py-4 rounded-lg font-semibold text-lg text-white',
                'bg-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.9)]',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent)/0.3)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200',
                'flex items-center gap-3',
                'shadow-lg shadow-[rgb(var(--accent)/0.3)]'
              )}
            >
              {isGenerating ? (
                <>
                  <svg
                    className="animate-spin h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
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
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Generate Mixed Website
                </>
              )}
            </button>

            {!isValidConfiguration && (
              <p className="mt-3 text-sm text-[rgb(var(--muted-foreground))]">
                Add at least one valid reference URL and assign it to a section to continue
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[rgb(var(--border)/0.3)] bg-[rgb(var(--background))]">
        <div className="max-w-5xl mx-auto px-6 py-4 text-center">
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Template Mode - Mix and match sections from multiple reference websites
          </p>
        </div>
      </footer>
    </main>
  );
}

/**
 * Template Mode Page with Suspense boundary for useSearchParams
 */
export default function TemplatePage() {
  return (
    <Suspense fallback={<TemplatePageLoading />}>
      <TemplatePageContent />
    </Suspense>
  );
}
