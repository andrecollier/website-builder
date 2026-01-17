/**
 * Shared Context Module
 *
 * Manages shared state across all agents in the agent system.
 * Provides cross-agent state management with type-safe read/write operations.
 * Separated to enable isolated agent execution while maintaining shared context.
 */

import type {
  CaptureProgress,
  CaptureResult,
  DesignSystem,
  GeneratedComponent,
  ExtractionError,
} from '@/types';

/**
 * Shared context state for a single website extraction
 * All agents can read and write to this context via the AgentContext API
 */
export interface SharedContextState {
  websiteId: string;
  url: string;
  status: 'initializing' | 'capturing' | 'extracting' | 'generating' | 'comparing' | 'complete' | 'failed';

  // Capture phase results
  captureResult?: CaptureResult;

  // Extractor phase results
  designSystem?: DesignSystem;

  // Generator phase results
  components: GeneratedComponent[];

  // Comparator phase results (stored in component.accuracyScore)

  // Error tracking
  errors: ExtractionError[];

  // Progress tracking
  progress: CaptureProgress;

  // Timestamps
  startedAt: number;
  updatedAt: number;
  completedAt?: number;
}

/**
 * Context update with timestamp for tracking
 */
interface ContextUpdate {
  websiteId: string;
  state: SharedContextState;
  timestamp: number;
}

/**
 * Context subscriber callback type
 */
type ContextSubscriber = (state: SharedContextState) => void;

/**
 * In-memory store for shared context state
 * Maps websiteId to current state
 */
const contextStore = new Map<string, SharedContextState>();

/**
 * In-memory store for context subscribers
 * Maps websiteId to set of subscriber callbacks
 */
const contextSubscribers = new Map<string, Set<ContextSubscriber>>();

/**
 * Initialize a new shared context for a website extraction
 * Call this at the start of an extraction pipeline
 */
export function initializeContext(websiteId: string, url: string): SharedContextState {
  const initialState: SharedContextState = {
    websiteId,
    url,
    status: 'initializing',
    components: [],
    errors: [],
    progress: {
      phase: 'initializing',
      percent: 0,
      message: 'Initializing extraction pipeline...',
    },
    startedAt: Date.now(),
    updatedAt: Date.now(),
  };

  contextStore.set(websiteId, initialState);
  return initialState;
}

/**
 * Get the current context state for a website
 * Returns null if context not found
 */
export function getContext(websiteId: string): SharedContextState | null {
  return contextStore.get(websiteId) || null;
}

/**
 * Update the shared context for a website
 * Notifies all subscribers of the change
 */
export function updateContext(
  websiteId: string,
  updates: Partial<Omit<SharedContextState, 'websiteId' | 'url' | 'startedAt'>>
): SharedContextState | null {
  const currentState = contextStore.get(websiteId);
  if (!currentState) {
    return null;
  }

  const updatedState: SharedContextState = {
    ...currentState,
    ...updates,
    updatedAt: Date.now(),
  };

  contextStore.set(websiteId, updatedState);

  // Notify all subscribers
  notifySubscribers(websiteId, updatedState);

  return updatedState;
}

/**
 * Update progress in the shared context
 * Convenience method for progress updates
 */
export function updateProgress(websiteId: string, progress: CaptureProgress): SharedContextState | null {
  return updateContext(websiteId, { progress });
}

/**
 * Add an error to the shared context
 * Appends to the errors array without overwriting existing errors
 */
export function addError(websiteId: string, error: ExtractionError): SharedContextState | null {
  const currentState = contextStore.get(websiteId);
  if (!currentState) {
    return null;
  }

  const updatedErrors = [...currentState.errors, error];
  return updateContext(websiteId, { errors: updatedErrors });
}

/**
 * Mark context as complete
 * Sets completion timestamp and updates status
 */
export function completeContext(websiteId: string): SharedContextState | null {
  return updateContext(websiteId, {
    status: 'complete',
    completedAt: Date.now(),
    progress: {
      phase: 'complete',
      percent: 100,
      message: 'Extraction complete',
    },
  });
}

/**
 * Mark context as failed
 * Sets status and preserves error information
 */
export function failContext(websiteId: string, error: ExtractionError): SharedContextState | null {
  const currentState = contextStore.get(websiteId);
  if (!currentState) {
    return null;
  }

  return updateContext(websiteId, {
    status: 'failed',
    errors: [...currentState.errors, error],
    progress: {
      phase: 'failed',
      percent: currentState.progress.percent,
      message: error.message,
    },
  });
}

/**
 * Clear context for a website
 * Call this after completion or on cleanup
 */
export function clearContext(websiteId: string): void {
  contextStore.delete(websiteId);
  contextSubscribers.delete(websiteId);
}

/**
 * Subscribe to context updates for a specific website
 * Returns unsubscribe function
 */
export function subscribe(websiteId: string, callback: ContextSubscriber): () => void {
  if (!contextSubscribers.has(websiteId)) {
    contextSubscribers.set(websiteId, new Set());
  }
  contextSubscribers.get(websiteId)!.add(callback);

  // Send initial state to new subscriber
  const currentState = contextStore.get(websiteId);
  if (currentState) {
    try {
      callback(currentState);
    } catch {
      // Ignore callback errors
    }
  }

  // Return unsubscribe function
  return () => {
    const subscribers = contextSubscribers.get(websiteId);
    if (subscribers) {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        contextSubscribers.delete(websiteId);
      }
    }
  };
}

/**
 * Notify all subscribers of a context update
 * Internal helper function
 */
function notifySubscribers(websiteId: string, state: SharedContextState): void {
  const subscribers = contextSubscribers.get(websiteId);
  if (subscribers) {
    subscribers.forEach((callback) => {
      try {
        callback(state);
      } catch {
        // Ignore callback errors
      }
    });
  }
}

/**
 * Get all active contexts
 * Useful for monitoring and debugging
 */
export function getAllContexts(): Map<string, SharedContextState> {
  return new Map(contextStore);
}

/**
 * Clear all contexts
 * Useful for testing and cleanup
 */
export function clearAllContexts(): void {
  contextStore.clear();
  contextSubscribers.clear();
}
