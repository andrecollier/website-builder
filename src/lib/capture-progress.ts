/**
 * Capture Progress Module
 *
 * Manages SSE subscribers and progress tracking for capture operations.
 * Separated from the route file to comply with Next.js export restrictions.
 */

import type { CaptureProgress, CapturePhase } from '@/types';

/**
 * In-memory store for tracking capture progress.
 * This can be accessed by the status endpoint for progress polling.
 */
export const captureProgressStore = new Map<string, CaptureProgress>();

/**
 * Progress event with timestamp for tracking
 */
interface ProgressEvent extends CaptureProgress {
  websiteId: string;
  timestamp: number;
}

/**
 * Subscriber callback type
 */
type ProgressSubscriber = (progress: CaptureProgress) => void;

/**
 * In-memory store for capture progress subscribers
 * Maps websiteId to set of subscriber callbacks
 */
const progressSubscribers = new Map<string, Set<ProgressSubscriber>>();

/**
 * In-memory store for latest progress by websiteId
 * Used to send initial state to new subscribers
 */
const latestProgress = new Map<string, ProgressEvent>();

/**
 * Subscribe to progress updates for a specific website
 */
export function subscribe(websiteId: string, callback: ProgressSubscriber): () => void {
  if (!progressSubscribers.has(websiteId)) {
    progressSubscribers.set(websiteId, new Set());
  }
  progressSubscribers.get(websiteId)!.add(callback);

  // Return unsubscribe function
  return () => {
    const subscribers = progressSubscribers.get(websiteId);
    if (subscribers) {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        progressSubscribers.delete(websiteId);
      }
    }
  };
}

/**
 * Publish progress update to all subscribers for a website
 * This is called by the capture process to emit progress events
 */
export function publishCaptureProgress(websiteId: string, progress: CaptureProgress): void {
  // Store latest progress
  latestProgress.set(websiteId, {
    ...progress,
    websiteId,
    timestamp: Date.now(),
  });

  // Notify all subscribers
  const subscribers = progressSubscribers.get(websiteId);
  if (subscribers) {
    subscribers.forEach((callback) => {
      try {
        callback(progress);
      } catch {
        // Ignore callback errors
      }
    });
  }

  // Clean up completed captures after a delay
  if (progress.phase === 'complete') {
    setTimeout(() => {
      latestProgress.delete(websiteId);
    }, 30000); // Keep for 30 seconds for late subscribers
  }
}

/**
 * Clear progress for a website (call on completion or error)
 */
export function clearCaptureProgress(websiteId: string): void {
  latestProgress.delete(websiteId);
  progressSubscribers.delete(websiteId);
}

/**
 * Get current progress for a website (if any)
 */
export function getCurrentProgress(websiteId: string): CaptureProgress | null {
  const progress = latestProgress.get(websiteId);
  if (!progress) return null;

  return {
    phase: progress.phase,
    percent: progress.percent,
    message: progress.message,
    currentSection: progress.currentSection,
    totalSections: progress.totalSections,
  };
}

/**
 * Create a progress callback that publishes to SSE subscribers
 * Use this when calling captureWebsite to enable SSE streaming
 */
export function createProgressPublisher(websiteId: string): (progress: CaptureProgress) => void {
  return (progress: CaptureProgress) => {
    publishCaptureProgress(websiteId, progress);
  };
}

/**
 * Get idle/initial progress state
 */
export function getIdleProgress(): CaptureProgress {
  return {
    phase: 'initializing' as CapturePhase,
    percent: 0,
    message: 'Waiting for capture to start...',
  };
}
