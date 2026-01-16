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
 */
export const activeGenerations = new Set<string>();
