/**
 * Pipeline Approve API Route
 *
 * POST /api/pipeline/approve
 * Continues a paused extraction pipeline after user approval.
 * Loads the saved checkpoint and resumes from scaffold phase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateWebsiteStatus, updateWebsiteProgress } from '@/lib/db/client';
import { publishCaptureProgress, captureProgressStore } from '@/lib/capture-progress';
import { continueOrchestrator, hasCheckpoint, getCheckpointInfo } from '@/agents/orchestrator';
import type { CapturePhase } from '@/types';

/**
 * Helper to save progress to both in-memory store and database
 */
function saveProgress(websiteId: string, phase: CapturePhase, percent: number, message: string): void {
  const progress = { phase, percent, message };
  publishCaptureProgress(websiteId, progress);
  captureProgressStore.set(websiteId, progress);
  updateWebsiteProgress(websiteId, progress);
}

/**
 * Run the continuation pipeline asynchronously
 */
async function runContinuationPipeline(websiteId: string): Promise<void> {
  try {
    saveProgress(websiteId, 'scaffolding', 55, 'Resuming pipeline after approval...');
    updateWebsiteStatus(websiteId, 'in_progress');

    const result = await continueOrchestrator(websiteId, (progress) => {
      saveProgress(websiteId, progress.phase, progress.percent, progress.message);
    });

    if (result.success) {
      saveProgress(websiteId, 'complete', 100, 'Pipeline completed successfully');
      updateWebsiteStatus(websiteId, 'completed');
    } else {
      const errorMessage = result.error?.message || 'Pipeline continuation failed';
      saveProgress(websiteId, 'failed', 0, errorMessage);
      updateWebsiteStatus(websiteId, 'failed');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    saveProgress(websiteId, 'failed', 0, `Error: ${errorMessage}`);
    updateWebsiteStatus(websiteId, 'failed');
  } finally {
    setTimeout(() => {
      captureProgressStore.delete(websiteId);
    }, 30000);
  }
}

/**
 * POST /api/pipeline/approve
 *
 * Request body:
 * {
 *   "websiteId": "website-xxx"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Pipeline continuation started"
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: { websiteId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { websiteId } = body;

    if (!websiteId || typeof websiteId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'websiteId is required' },
        { status: 400 }
      );
    }

    // Check if checkpoint exists
    const checkpointExists = await hasCheckpoint(websiteId);
    if (!checkpointExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'No pending checkpoint found for this website. Pipeline may have already completed or was not started with approval gate.',
        },
        { status: 404 }
      );
    }

    // Start continuation pipeline asynchronously
    runContinuationPipeline(websiteId).catch(() => {
      // Error handling is done inside runContinuationPipeline
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Pipeline continuation started',
        websiteId,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pipeline/approve?websiteId=xxx
 *
 * Check if a website has a pending checkpoint awaiting approval.
 *
 * Response:
 * {
 *   "websiteId": "website-xxx",
 *   "hasCheckpoint": true,
 *   "checkpointInfo": {
 *     "exists": true,
 *     "phase": "awaiting_approval",
 *     "savedAt": "2024-01-18T...",
 *     "componentCount": 5
 *   }
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');

    if (!websiteId) {
      return NextResponse.json(
        { success: false, error: 'websiteId query parameter is required' },
        { status: 400 }
      );
    }

    const checkpointInfo = await getCheckpointInfo(websiteId);

    return NextResponse.json({
      success: true,
      websiteId,
      hasCheckpoint: checkpointInfo?.exists ?? false,
      checkpointInfo,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
