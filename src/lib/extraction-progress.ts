/**
 * Extraction Progress Module
 *
 * Manages extraction progress tracking.
 * Separated from the route file to comply with Next.js export restrictions.
 */

import type { ExtractionError } from '@/types';

/**
 * In-memory status store for tracking extraction progress.
 */
export interface ExtractionProgress {
  websiteId: string;
  phase: number;
  subStatus: string;
  progress: number;
  errors: ExtractionError[];
  updatedAt: number;
}

// In-memory store for active extractions
const activeExtractions = new Map<string, ExtractionProgress>();

/**
 * Update extraction progress
 */
export function updateExtractionProgress(
  websiteId: string,
  phase: number,
  subStatus: string,
  progress: number,
  errors: ExtractionError[] = []
): void {
  activeExtractions.set(websiteId, {
    websiteId,
    phase,
    subStatus,
    progress,
    errors,
    updatedAt: Date.now(),
  });
}

/**
 * Clear extraction progress (call when extraction completes or fails)
 */
export function clearExtractionProgress(websiteId: string): void {
  activeExtractions.delete(websiteId);
}

/**
 * Get all active extractions (useful for debugging/admin)
 */
export function getActiveExtractions(): Map<string, ExtractionProgress> {
  return activeExtractions;
}

/**
 * Get extraction progress for a specific website
 */
export function getExtractionProgress(websiteId: string): ExtractionProgress | undefined {
  return activeExtractions.get(websiteId);
}
