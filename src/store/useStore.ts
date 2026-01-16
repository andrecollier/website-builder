import { create } from 'zustand';
import type { ExtractionState, ExtractionError } from '@/types';

/**
 * Initial state for the extraction store
 */
const initialState = {
  currentPhase: 0,
  totalPhases: 8,
  subStatus: '',
  progress: 0,
  isRunning: false,
  errors: [] as ExtractionError[],
  currentWebsiteId: null as string | null,
};

/**
 * Zustand store for managing extraction state
 *
 * Tracks the current phase progress, sub-status messages, errors,
 * and provides actions for updating the extraction workflow state.
 */
export const useStore = create<ExtractionState>((set) => ({
  // State
  currentPhase: initialState.currentPhase,
  totalPhases: initialState.totalPhases,
  subStatus: initialState.subStatus,
  progress: initialState.progress,
  isRunning: initialState.isRunning,
  errors: initialState.errors,
  currentWebsiteId: initialState.currentWebsiteId,

  // Actions

  /**
   * Update the current phase and sub-status message
   * @param phase - Phase number (1-8)
   * @param subStatus - Status message describing current activity
   */
  setPhase: (phase: number, subStatus: string) =>
    set({
      currentPhase: phase,
      subStatus,
      // Reset progress when moving to a new phase
      progress: 0,
    }),

  /**
   * Update the progress percentage for the current phase
   * @param progress - Progress percentage (0-100)
   */
  setProgress: (progress: number) => set({ progress: Math.min(100, Math.max(0, progress)) }),

  /**
   * Start the extraction process for a given URL
   * Initializes state for a new extraction workflow
   * @param _url - The URL being extracted (stored for reference, actual extraction happens via API)
   */
  startExtraction: (_url: string) =>
    set({
      isRunning: true,
      currentPhase: 1,
      subStatus: 'Initializing extraction...',
      progress: 0,
      errors: [],
    }),

  /**
   * Add an error to the errors array
   * @param error - The extraction error to add
   */
  setError: (error: ExtractionError) =>
    set((state) => ({
      errors: [...state.errors, error],
    })),

  /**
   * Remove an error from the errors array by ID
   * @param errorId - The ID of the error to remove
   */
  clearError: (errorId: string) =>
    set((state) => ({
      errors: state.errors.filter((e) => e.id !== errorId),
    })),

  /**
   * Reset the store to its initial state
   * Call this when canceling extraction or starting a new one
   */
  reset: () =>
    set({
      currentPhase: initialState.currentPhase,
      subStatus: initialState.subStatus,
      progress: initialState.progress,
      isRunning: initialState.isRunning,
      errors: initialState.errors,
      currentWebsiteId: initialState.currentWebsiteId,
    }),

  /**
   * Set the current website ID being processed
   * @param id - The website ID or null if no website is being processed
   */
  setWebsiteId: (id: string | null) => set({ currentWebsiteId: id }),

  /**
   * Update the store from an API status response
   * Used for polling status updates
   */
  updateFromStatus: (status: {
    phase: number;
    subStatus: string;
    progress: number;
    isRunning: boolean;
    errors?: ExtractionError[];
  }) =>
    set({
      currentPhase: status.phase,
      subStatus: status.subStatus,
      progress: status.progress,
      isRunning: status.isRunning,
      errors: status.errors || [],
    }),

  /**
   * Mark extraction as complete
   */
  completeExtraction: () =>
    set({
      isRunning: false,
      currentPhase: 8,
      progress: 100,
      subStatus: 'Extraction complete',
    }),
}));

/**
 * Selector hooks for common state access patterns
 */

/**
 * Get individual extraction status values
 */
export const useCurrentPhase = () => useStore((state) => state.currentPhase);
export const useTotalPhases = () => useStore((state) => state.totalPhases);
export const useSubStatus = () => useStore((state) => state.subStatus);
export const useProgress = () => useStore((state) => state.progress);
export const useIsRunning = () => useStore((state) => state.isRunning);

/**
 * Get the current extraction status (combined for convenience)
 * Note: Uses individual selectors to avoid re-render issues
 */
export function useExtractionStatus() {
  const currentPhase = useCurrentPhase();
  const totalPhases = useTotalPhases();
  const subStatus = useSubStatus();
  const progress = useProgress();
  const isRunning = useIsRunning();

  return { currentPhase, totalPhases, subStatus, progress, isRunning };
}

/**
 * Get the current errors
 */
export const useExtractionErrors = () => useStore((state) => state.errors);

/**
 * Check if there are any errors
 */
export const useHasErrors = () => useStore((state) => state.errors.length > 0);

/**
 * Get the current website ID
 */
export const useCurrentWebsiteId = () => useStore((state) => state.currentWebsiteId);
