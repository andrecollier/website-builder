import { create } from 'zustand';
import type {
  EditorState,
  EditorPanel,
  DesignSystem,
  ColorExtraction,
  TypographyExtraction,
  SpacingExtraction,
  EffectsExtraction,
} from '@/types';

/**
 * Initial state for the editor store
 */
const initialState = {
  originalTokens: null as DesignSystem | null,
  modifiedTokens: null as DesignSystem | null,
  activePanel: 'colors' as EditorPanel,
  isDirty: false,
  isLoading: false,
  error: null as string | null,
};

/**
 * Deep clone a DesignSystem object
 * Used to create independent copies of tokens to avoid mutation
 */
function cloneDesignSystem(tokens: DesignSystem): DesignSystem {
  return JSON.parse(JSON.stringify(tokens));
}

/**
 * Zustand store for managing token editor state
 *
 * Tracks the original and modified design tokens, active editing panel,
 * dirty state for unsaved changes, and provides actions for updating
 * individual token categories.
 */
export const useEditorStore = create<EditorState>((set, get) => ({
  // State
  originalTokens: initialState.originalTokens,
  modifiedTokens: initialState.modifiedTokens,
  activePanel: initialState.activePanel,
  isDirty: initialState.isDirty,
  isLoading: initialState.isLoading,
  error: initialState.error,

  // Actions

  /**
   * Load design tokens into the editor
   * Sets both original and modified tokens to the same value
   * @param tokens - The design system tokens to load
   */
  loadTokens: (tokens: DesignSystem) =>
    set({
      originalTokens: cloneDesignSystem(tokens),
      modifiedTokens: cloneDesignSystem(tokens),
      isDirty: false,
      error: null,
    }),

  /**
   * Update color tokens in the modified design system
   * Merges partial updates with existing color values
   * @param colors - Partial color extraction updates
   */
  updateColors: (colors: Partial<ColorExtraction>) =>
    set((state) => {
      if (!state.modifiedTokens) return state;

      const updatedTokens = cloneDesignSystem(state.modifiedTokens);
      updatedTokens.colors = {
        ...updatedTokens.colors,
        ...colors,
        // Handle nested semantic object separately
        semantic: colors.semantic
          ? { ...updatedTokens.colors.semantic, ...colors.semantic }
          : updatedTokens.colors.semantic,
        // Handle nested palettes object separately
        palettes: colors.palettes
          ? { ...updatedTokens.colors.palettes, ...colors.palettes }
          : updatedTokens.colors.palettes,
      };

      return {
        modifiedTokens: updatedTokens,
        isDirty: true,
      };
    }),

  /**
   * Update typography tokens in the modified design system
   * Merges partial updates with existing typography values
   * @param typography - Partial typography extraction updates
   */
  updateTypography: (typography: Partial<TypographyExtraction>) =>
    set((state) => {
      if (!state.modifiedTokens) return state;

      const updatedTokens = cloneDesignSystem(state.modifiedTokens);
      updatedTokens.typography = {
        ...updatedTokens.typography,
        ...typography,
        // Handle nested fonts object separately
        fonts: typography.fonts
          ? { ...updatedTokens.typography.fonts, ...typography.fonts }
          : updatedTokens.typography.fonts,
        // Handle nested scale object separately
        scale: typography.scale
          ? { ...updatedTokens.typography.scale, ...typography.scale }
          : updatedTokens.typography.scale,
        // Handle nested lineHeights object separately
        lineHeights: typography.lineHeights
          ? { ...updatedTokens.typography.lineHeights, ...typography.lineHeights }
          : updatedTokens.typography.lineHeights,
      };

      return {
        modifiedTokens: updatedTokens,
        isDirty: true,
      };
    }),

  /**
   * Update spacing tokens in the modified design system
   * Merges partial updates with existing spacing values
   * @param spacing - Partial spacing extraction updates
   */
  updateSpacing: (spacing: Partial<SpacingExtraction>) =>
    set((state) => {
      if (!state.modifiedTokens) return state;

      const updatedTokens = cloneDesignSystem(state.modifiedTokens);
      updatedTokens.spacing = {
        ...updatedTokens.spacing,
        ...spacing,
        // Handle nested sectionPadding object separately
        sectionPadding: spacing.sectionPadding
          ? { ...updatedTokens.spacing.sectionPadding, ...spacing.sectionPadding }
          : updatedTokens.spacing.sectionPadding,
      };

      return {
        modifiedTokens: updatedTokens,
        isDirty: true,
      };
    }),

  /**
   * Update effects tokens in the modified design system
   * Merges partial updates with existing effects values
   * @param effects - Partial effects extraction updates
   */
  updateEffects: (effects: Partial<EffectsExtraction>) =>
    set((state) => {
      if (!state.modifiedTokens) return state;

      const updatedTokens = cloneDesignSystem(state.modifiedTokens);
      updatedTokens.effects = {
        ...updatedTokens.effects,
        ...effects,
        // Handle nested shadows object separately
        shadows: effects.shadows
          ? { ...updatedTokens.effects.shadows, ...effects.shadows }
          : updatedTokens.effects.shadows,
        // Handle nested radii object separately
        radii: effects.radii
          ? { ...updatedTokens.effects.radii, ...effects.radii }
          : updatedTokens.effects.radii,
        // Handle nested transitions object separately
        transitions: effects.transitions
          ? { ...updatedTokens.effects.transitions, ...effects.transitions }
          : updatedTokens.effects.transitions,
      };

      return {
        modifiedTokens: updatedTokens,
        isDirty: true,
      };
    }),

  /**
   * Set the active editor panel
   * @param panel - The panel to activate ('colors' | 'typography' | 'spacing' | 'effects')
   */
  setActivePanel: (panel: EditorPanel) => set({ activePanel: panel }),

  /**
   * Reset modified tokens to the original extracted values
   * Clears dirty state and any errors
   */
  resetToOriginal: () =>
    set((state) => {
      if (!state.originalTokens) return state;

      return {
        modifiedTokens: cloneDesignSystem(state.originalTokens),
        isDirty: false,
        error: null,
      };
    }),

  /**
   * Save the modified tokens to the server
   * Sets loading state during the operation and handles errors
   */
  saveTokens: async () => {
    const state = get();
    if (!state.modifiedTokens) {
      set({ error: 'No tokens to save' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/tokens', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: state.modifiedTokens.meta.sourceUrl,
          tokens: state.modifiedTokens,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save tokens');
      }

      // After successful save, update original to match modified
      set({
        originalTokens: cloneDesignSystem(state.modifiedTokens),
        isDirty: false,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save tokens',
        isLoading: false,
      });
    }
  },

  /**
   * Reset the store to its initial state
   * Call this when navigating away from the editor or starting fresh
   */
  reset: () =>
    set({
      originalTokens: initialState.originalTokens,
      modifiedTokens: initialState.modifiedTokens,
      activePanel: initialState.activePanel,
      isDirty: initialState.isDirty,
      isLoading: initialState.isLoading,
      error: initialState.error,
    }),
}));

/**
 * Selector hooks for common state access patterns
 */

/**
 * Get the current modified tokens
 */
export const useEditorTokens = () => useEditorStore((state) => state.modifiedTokens);

/**
 * Get the original tokens
 */
export const useOriginalTokens = () => useEditorStore((state) => state.originalTokens);

/**
 * Get the current active panel
 */
export const useActivePanel = () => useEditorStore((state) => state.activePanel);

/**
 * Check if there are unsaved changes
 */
export const useIsDirty = () => useEditorStore((state) => state.isDirty);

/**
 * Get the loading state
 */
export const useIsLoading = () => useEditorStore((state) => state.isLoading);

/**
 * Get the current error
 */
export const useEditorError = () => useEditorStore((state) => state.error);

/**
 * Get the color tokens from the modified design system
 */
export const useColorTokens = () => useEditorStore((state) => state.modifiedTokens?.colors ?? null);

/**
 * Get the typography tokens from the modified design system
 */
export const useTypographyTokens = () =>
  useEditorStore((state) => state.modifiedTokens?.typography ?? null);

/**
 * Get the spacing tokens from the modified design system
 */
export const useSpacingTokens = () =>
  useEditorStore((state) => state.modifiedTokens?.spacing ?? null);

/**
 * Get the effects tokens from the modified design system
 */
export const useEffectsTokens = () =>
  useEditorStore((state) => state.modifiedTokens?.effects ?? null);

/**
 * Get individual editor status values
 */
export const useEditorIsLoading = () => useEditorStore((state) => state.isLoading);
export const useEditorIsDirty = () => useEditorStore((state) => state.isDirty);

/**
 * Get editor status (loading, dirty, error)
 */
export function useEditorStatus() {
  const isLoading = useEditorIsLoading();
  const isDirty = useEditorIsDirty();
  const error = useEditorError();
  return { isLoading, isDirty, error };
}
