import { create } from 'zustand';
import type { PreviewState, GeneratedComponent } from '@/types';

/**
 * Initial state for the preview store
 */
const initialState = {
  websiteId: null as string | null,
  components: [] as GeneratedComponent[],
  currentIndex: 0,
  isLoading: false,
  error: null as string | null,
};

/**
 * Deep clone a GeneratedComponent array
 * Used to create independent copies to avoid mutation
 */
function cloneComponents(components: GeneratedComponent[]): GeneratedComponent[] {
  return JSON.parse(JSON.stringify(components));
}

/**
 * Zustand store for managing component preview and approval workflow state
 *
 * Tracks the current website's generated components, selected variants,
 * approval status, and provides actions for navigating and approving
 * components in the preview workflow.
 */
export const usePreviewStore = create<PreviewState>((set, get) => ({
  // State
  websiteId: initialState.websiteId,
  components: initialState.components,
  currentIndex: initialState.currentIndex,
  isLoading: initialState.isLoading,
  error: initialState.error,

  // Actions

  /**
   * Load components for a website from the API
   * Fetches generated components and their variants
   * @param websiteId - The website ID to load components for
   */
  loadComponents: async (websiteId: string) => {
    set({ isLoading: true, error: null, websiteId });

    try {
      const response = await fetch(`/api/components/${websiteId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load components');
      }

      const data = await response.json();
      const components: GeneratedComponent[] = data.components || [];

      set({
        components: cloneComponents(components),
        currentIndex: 0,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load components',
        isLoading: false,
      });
    }
  },

  /**
   * Select a variant for a component
   * Updates the component's selectedVariant field
   * @param componentId - The component ID
   * @param variantId - The variant ID to select
   */
  selectVariant: (componentId: string, variantId: string) =>
    set((state) => {
      const componentIndex = state.components.findIndex((c) => c.id === componentId);
      if (componentIndex === -1) return state;

      const updatedComponents = cloneComponents(state.components);
      updatedComponents[componentIndex].selectedVariant = variantId;
      // Clear custom code when selecting a new variant
      updatedComponents[componentIndex].customCode = undefined;

      return { components: updatedComponents };
    }),

  /**
   * Update the custom code for a component
   * Sets custom code that overrides the selected variant
   * @param componentId - The component ID
   * @param code - The custom code to set
   */
  updateCustomCode: (componentId: string, code: string) =>
    set((state) => {
      const componentIndex = state.components.findIndex((c) => c.id === componentId);
      if (componentIndex === -1) return state;

      const updatedComponents = cloneComponents(state.components);
      updatedComponents[componentIndex].customCode = code;

      return { components: updatedComponents };
    }),

  /**
   * Approve a component with its selected variant or custom code
   * Persists the approval to the API and updates local state
   * @param componentId - The component ID to approve
   */
  approveComponent: async (componentId: string) => {
    const state = get();
    const component = state.components.find((c) => c.id === componentId);

    if (!component) {
      set({ error: 'Component not found' });
      return;
    }

    if (!component.selectedVariant && !component.customCode) {
      set({ error: 'Please select a variant or provide custom code before approving' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/components/${state.websiteId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentId,
          selectedVariant: component.selectedVariant,
          customCode: component.customCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to approve component');
      }

      // Update local state
      set((currentState) => {
        const componentIndex = currentState.components.findIndex((c) => c.id === componentId);
        if (componentIndex === -1) return { isLoading: false };

        const updatedComponents = cloneComponents(currentState.components);
        updatedComponents[componentIndex].status = 'approved';

        return {
          components: updatedComponents,
          isLoading: false,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to approve component',
        isLoading: false,
      });
    }
  },

  /**
   * Reject a component
   * Marks the component as rejected in local state
   * @param componentId - The component ID to reject
   */
  rejectComponent: (componentId: string) =>
    set((state) => {
      const componentIndex = state.components.findIndex((c) => c.id === componentId);
      if (componentIndex === -1) return state;

      const updatedComponents = cloneComponents(state.components);
      updatedComponents[componentIndex].status = 'rejected';
      updatedComponents[componentIndex].selectedVariant = null;
      updatedComponents[componentIndex].customCode = undefined;

      return { components: updatedComponents };
    }),

  /**
   * Skip a component
   * Marks the component as skipped to address later
   * @param componentId - The component ID to skip
   */
  skipComponent: (componentId: string) =>
    set((state) => {
      const componentIndex = state.components.findIndex((c) => c.id === componentId);
      if (componentIndex === -1) return state;

      const updatedComponents = cloneComponents(state.components);
      updatedComponents[componentIndex].status = 'skipped';

      return { components: updatedComponents };
    }),

  /**
   * Retry generating a failed component
   * Calls the API to regenerate variants for the component
   * @param componentId - The component ID to retry
   */
  retryComponent: async (componentId: string) => {
    const state = get();
    const component = state.components.find((c) => c.id === componentId);

    if (!component) {
      set({ error: 'Component not found' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/components/${state.websiteId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentId,
          retry: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to retry component generation');
      }

      const data = await response.json();
      const regeneratedComponent: GeneratedComponent = data.component;

      // Update local state with regenerated component
      set((currentState) => {
        const componentIndex = currentState.components.findIndex((c) => c.id === componentId);
        if (componentIndex === -1) return { isLoading: false };

        const updatedComponents = cloneComponents(currentState.components);
        updatedComponents[componentIndex] = {
          ...regeneratedComponent,
          status: 'pending',
          selectedVariant: null,
          customCode: undefined,
          errorMessage: undefined,
        };

        return {
          components: updatedComponents,
          isLoading: false,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to retry component generation',
        isLoading: false,
      });
    }
  },

  /**
   * Navigate to the next component in the list
   * Wraps around to the first component if at the end
   */
  goToNext: () =>
    set((state) => {
      if (state.components.length === 0) return state;

      const nextIndex = (state.currentIndex + 1) % state.components.length;
      return { currentIndex: nextIndex };
    }),

  /**
   * Navigate to the previous component in the list
   * Wraps around to the last component if at the beginning
   */
  goToPrevious: () =>
    set((state) => {
      if (state.components.length === 0) return state;

      const prevIndex = (state.currentIndex - 1 + state.components.length) % state.components.length;
      return { currentIndex: prevIndex };
    }),

  /**
   * Reset the store to its initial state
   * Call this when navigating away from the preview page or starting fresh
   */
  reset: () =>
    set({
      websiteId: initialState.websiteId,
      components: initialState.components,
      currentIndex: initialState.currentIndex,
      isLoading: initialState.isLoading,
      error: initialState.error,
    }),
}));

/**
 * Selector hooks for common state access patterns
 */

/**
 * Get the current website ID being previewed
 */
export const usePreviewWebsiteId = () => usePreviewStore((state) => state.websiteId);

/**
 * Get all components for the current website
 */
export const usePreviewComponents = () => usePreviewStore((state) => state.components);

/**
 * Get the current component index
 */
export const useCurrentComponentIndex = () => usePreviewStore((state) => state.currentIndex);

/**
 * Get the currently selected component
 */
export const useCurrentComponent = () =>
  usePreviewStore((state) =>
    state.components.length > 0 ? state.components[state.currentIndex] : null
  );

/**
 * Get the loading state
 */
export const usePreviewLoading = () => usePreviewStore((state) => state.isLoading);

/**
 * Get the current error
 */
export const usePreviewError = () => usePreviewStore((state) => state.error);

/**
 * Get preview status (loading and error state)
 */
export const usePreviewStatus = () =>
  usePreviewStore((state) => ({
    isLoading: state.isLoading,
    error: state.error,
  }));

/**
 * Get approval progress (completed/total)
 */
export const useApprovalProgress = () =>
  usePreviewStore((state) => {
    const total = state.components.length;
    const completed = state.components.filter(
      (c) => c.status === 'approved' || c.status === 'rejected' || c.status === 'skipped'
    ).length;
    const approved = state.components.filter((c) => c.status === 'approved').length;
    const pending = state.components.filter((c) => c.status === 'pending').length;
    const failed = state.components.filter((c) => c.status === 'failed').length;

    return {
      total,
      completed,
      approved,
      pending,
      failed,
      isComplete: completed === total && total > 0,
      progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

/**
 * Get components that need manual review (failed status)
 */
export const useFailedComponents = () =>
  usePreviewStore((state) => state.components.filter((c) => c.status === 'failed'));

/**
 * Get components that are pending approval
 */
export const usePendingComponents = () =>
  usePreviewStore((state) => state.components.filter((c) => c.status === 'pending'));

/**
 * Get approved components
 */
export const useApprovedComponents = () =>
  usePreviewStore((state) => state.components.filter((c) => c.status === 'approved'));

/**
 * Get skipped components
 */
export const useSkippedComponents = () =>
  usePreviewStore((state) => state.components.filter((c) => c.status === 'skipped'));

/**
 * Check if there are any failed components
 */
export const useHasFailedComponents = () =>
  usePreviewStore((state) => state.components.some((c) => c.status === 'failed'));

/**
 * Get a specific component by ID
 */
export const useComponentById = (componentId: string) =>
  usePreviewStore((state) => state.components.find((c) => c.id === componentId) ?? null);

/**
 * Get the selected variant for the current component
 */
export const useCurrentSelectedVariant = () =>
  usePreviewStore((state) => {
    const currentComponent = state.components[state.currentIndex];
    if (!currentComponent) return null;

    const variantId = currentComponent.selectedVariant;
    if (!variantId) return null;

    return currentComponent.variants.find((v) => v.id === variantId) ?? null;
  });

/**
 * Check if the current component has custom code
 */
export const useCurrentHasCustomCode = () =>
  usePreviewStore((state) => {
    const currentComponent = state.components[state.currentIndex];
    return currentComponent?.customCode !== undefined && currentComponent.customCode !== '';
  });

/**
 * Check if all components are approved
 */
export const useAllComponentsApproved = () =>
  usePreviewStore((state) =>
    state.components.length > 0 && state.components.every((c) => c.status === 'approved')
  );

export default usePreviewStore;
