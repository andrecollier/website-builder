/**
 * Capture Status SSE API Route
 *
 * GET /api/capture-status?websiteId=xxx
 * Server-Sent Events endpoint for streaming real-time capture progress.
 * Provides live updates during screenshot capture process.
 */

import { NextRequest } from 'next/server';
import type { CaptureProgress } from '@/types';
import {
  subscribe,
  getCurrentProgress,
  getIdleProgress,
} from '@/lib/capture-progress';

/**
 * REQUIRED: Force dynamic rendering for streaming
 * Without this, Next.js may try to statically generate the route
 */
export const dynamic = 'force-dynamic';

/**
 * Format SSE message
 * SSE format requires: data: {content}\n\n (double newline mandatory)
 */
function formatSSEMessage(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

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
