/**
 * Generation Progress Module
 *
 * Manages generation progress tracking.
 * Separated from the route file to comply with Next.js export restrictions.
 */

import type { GenerationProgress } from '@/lib/generator';

/**
 * In-memory store for tracking generation progress.
 * This can be accessed by status endpoints for progress polling.
 */
export const generationProgressStore = new Map<string, GenerationProgress>();

/**
 * In-memory store for tracking active generation processes.
 * Prevents duplicate generation runs for the same website.
 * Includes timestamp to auto-expire stale locks.
 */
const activeGenerationsWithTimestamp = new Map<string, number>();

// Lock timeout: 5 minutes (in milliseconds)
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Check if a generation is actively running (with auto-expiry)
 */
export function isGenerationActive(websiteId: string): boolean {
  const startTime = activeGenerationsWithTimestamp.get(websiteId);
  if (!startTime) return false;

  // Auto-expire locks older than LOCK_TIMEOUT_MS
  if (Date.now() - startTime > LOCK_TIMEOUT_MS) {
    activeGenerationsWithTimestamp.delete(websiteId);
    return false;
  }
  return true;
}

/**
 * Mark a generation as started
 */
export function markGenerationStarted(websiteId: string): void {
  activeGenerationsWithTimestamp.set(websiteId, Date.now());
}

/**
 * Mark a generation as completed (or failed)
 */
export function markGenerationCompleted(websiteId: string): void {
  activeGenerationsWithTimestamp.delete(websiteId);
}

/**
 * Legacy: In-memory set for backwards compatibility
 * @deprecated Use isGenerationActive/markGenerationStarted/markGenerationCompleted instead
 */
export const activeGenerations = {
  has: (id: string) => isGenerationActive(id),
  add: (id: string) => markGenerationStarted(id),
  delete: (id: string) => markGenerationCompleted(id),
};
