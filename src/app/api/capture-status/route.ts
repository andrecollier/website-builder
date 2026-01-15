/**
 * Capture Status SSE API Route
 *
 * GET /api/capture-status?websiteId=xxx
 * Server-Sent Events endpoint for streaming real-time capture progress.
 * Provides live updates during screenshot capture process.
 */

import { NextRequest } from 'next/server';
import type { CaptureProgress, CapturePhase } from '@/types';

/**
 * REQUIRED: Force dynamic rendering for streaming
 * Without this, Next.js may try to statically generate the route
 */
export const dynamic = 'force-dynamic';

// ====================
// PROGRESS TRACKING
// ====================

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
function subscribe(websiteId: string, callback: ProgressSubscriber): () => void {
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

// ====================
// SSE UTILITIES
// ====================

/**
 * Get idle/initial progress state
 */
function getIdleProgress(): CaptureProgress {
  return {
    phase: 'initializing' as CapturePhase,
    percent: 0,
    message: 'Waiting for capture to start...',
  };
}

/**
 * Format SSE message
 * SSE format requires: data: {content}\n\n (double newline mandatory)
 */
function formatSSEMessage(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// ====================
// ROUTE HANDLER
// ====================

/**
 * GET /api/capture-status
 *
 * Query parameters:
 * - websiteId (required): The website ID to stream progress for
 *
 * Response:
 * Server-Sent Events stream with progress updates:
 * data: {"phase":"scrolling","percent":25,"message":"Scrolling page..."}
 *
 * Event types:
 * - progress: Regular progress update with phase, percent, message
 * - complete: Final event when capture is complete
 * - error: Error event if capture fails
 * - heartbeat: Keep-alive event every 15 seconds
 */
export async function GET(request: NextRequest): Promise<Response> {
  // Get websiteId from query params
  const { searchParams } = new URL(request.url);
  const websiteId = searchParams.get('websiteId');

  // Validate websiteId
  if (!websiteId) {
    return new Response(
      JSON.stringify({
        error: 'Missing required parameter: websiteId',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Create ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let isActive = true;
      let heartbeatInterval: NodeJS.Timeout | null = null;

      /**
       * Send data to the client
       */
      const send = (data: object) => {
        if (!isActive) return;
        try {
          controller.enqueue(encoder.encode(formatSSEMessage(data)));
        } catch {
          // Stream may be closed
          isActive = false;
        }
      };

      /**
       * Handle progress updates
       */
      const handleProgress = (progress: CaptureProgress) => {
        send({
          type: 'progress',
          ...progress,
        });

        // Close stream on completion
        if (progress.phase === 'complete') {
          send({ type: 'complete', message: 'Capture completed successfully' });

          // Clean up and close
          setTimeout(() => {
            if (isActive) {
              isActive = false;
              if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
              }
              unsubscribe();
              controller.close();
            }
          }, 100);
        }
      };

      // Subscribe to progress updates
      const unsubscribe = subscribe(websiteId, handleProgress);

      // Send initial state
      const currentProgress = getCurrentProgress(websiteId);
      if (currentProgress) {
        send({
          type: 'progress',
          ...currentProgress,
        });
      } else {
        send({
          type: 'progress',
          ...getIdleProgress(),
        });
      }

      // Set up heartbeat to keep connection alive
      heartbeatInterval = setInterval(() => {
        if (isActive) {
          send({ type: 'heartbeat', timestamp: Date.now() });
        }
      }, 15000); // Every 15 seconds

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        isActive = false;
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
        unsubscribe();
      });
    },
  });

  // Return SSE response with proper headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
