/**
 * Status API Route
 *
 * GET /api/status
 * Returns the current extraction status for progress polling.
 * Supports optional websiteId query parameter to get status for a specific website.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWebsiteByIdWithProgress, initializeDatabase } from '@/lib/db/client';
import { PHASES } from '@/types';
import type { StatusResponse } from '@/types';
import { captureProgressStore } from '@/lib/capture-progress';

/**
 * Get the phase name for a given phase number
 */
function getPhaseName(phase: number): string {
  const phaseInfo = PHASES.find((p) => p.number === phase);
  return phaseInfo?.name ?? 'Unknown Phase';
}

/**
 * Get mock status for demonstration purposes (Phase 1)
 * This simulates an extraction in progress
 */
function getMockStatus(): StatusResponse {
  return {
    websiteId: null,
    phase: 0,
    totalPhases: 8,
    phaseName: 'Idle',
    subStatus: 'No extraction in progress',
    progress: 0,
    errors: [],
  };
}

/**
 * GET /api/status
 *
 * Query parameters:
 * - websiteId (optional): Get status for a specific website
 *
 * Response:
 * {
 *   "websiteId": "website-001" | null,
 *   "phase": 1,
 *   "totalPhases": 8,
 *   "phaseName": "Capturing Reference",
 *   "subStatus": "Scrolling page to load all content...",
 *   "progress": 12,
 *   "errors": []
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse<StatusResponse>> {
  try {
    // Ensure database is initialized
    initializeDatabase();

    // Get websiteId from query params
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');

    // If no websiteId provided, return mock idle status
    if (!websiteId) {
      return NextResponse.json(getMockStatus(), { status: 200 });
    }

    // Check if website exists in database (with progress info)
    const website = getWebsiteByIdWithProgress(websiteId);
    if (!website) {
      return NextResponse.json(
        {
          websiteId: websiteId,
          phase: 0,
          totalPhases: 8,
          phaseName: 'Error',
          subStatus: 'Website not found',
          progress: 0,
          errors: [
            {
              id: 'not-found',
              phase: 0,
              message: `Website with ID '${websiteId}' not found`,
              timestamp: new Date().toISOString(),
              recoverable: false,
            },
          ],
        },
        { status: 404 }
      );
    }

    // Check for active capture progress in memory first (most up-to-date)
    const activeProgress = captureProgressStore.get(websiteId);
    if (activeProgress) {
      // Convert CaptureProgress to StatusResponse format
      const phase = getPhaseFromProgressPhase(activeProgress.phase);
      return NextResponse.json(
        {
          websiteId: websiteId,
          phase: phase,
          totalPhases: 8,
          phaseName: getPhaseNameFromProgressPhase(activeProgress.phase),
          subStatus: activeProgress.message,
          progress: activeProgress.percent,
          errors: [],
        },
        { status: 200 }
      );
    }

    // Check for progress stored in database (persisted for refresh recovery)
    if (website.progress_phase && website.status === 'in_progress') {
      return NextResponse.json(
        {
          websiteId: website.id,
          phase: getPhaseFromProgressPhase(website.progress_phase),
          totalPhases: 8,
          phaseName: getPhaseNameFromProgressPhase(website.progress_phase),
          subStatus: website.progress_message || 'Processing...',
          progress: website.progress_percent ?? 0,
          errors: [],
        },
        { status: 200 }
      );
    }

    // Return status based on website database status (fallback)
    const statusResponse: StatusResponse = {
      websiteId: website.id,
      phase: getPhaseFromStatus(website.status),
      totalPhases: 8,
      phaseName: getPhaseNameFromStatus(website.status),
      subStatus: getSubStatusFromStatus(website.status),
      progress: getProgressFromStatus(website.status),
      errors: [],
    };

    return NextResponse.json(statusResponse, { status: 200 });
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      {
        websiteId: null,
        phase: 0,
        totalPhases: 8,
        phaseName: 'Error',
        subStatus: errorMessage,
        progress: 0,
        errors: [
          {
            id: 'server-error',
            phase: 0,
            message: errorMessage,
            timestamp: new Date().toISOString(),
            recoverable: true,
          },
        ],
      },
      { status: 500 }
    );
  }
}

/**
 * Helper functions to derive status information from website status
 * These are Phase 1 placeholders - real status would come from extraction events
 */

function getPhaseFromStatus(status: string): number {
  switch (status) {
    case 'pending':
      return 0;
    case 'in_progress':
      return 1;
    case 'completed':
      return 8;
    case 'failed':
      return 0;
    default:
      return 0;
  }
}

function getPhaseNameFromStatus(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'in_progress':
      return 'Capturing Reference';
    case 'completed':
      return 'Finalization';
    case 'failed':
      return 'Failed';
    default:
      return 'Unknown';
  }
}

function getSubStatusFromStatus(status: string): string {
  switch (status) {
    case 'pending':
      return 'Waiting to start extraction...';
    case 'in_progress':
      return 'Scrolling page to load all content...';
    case 'completed':
      return 'Extraction completed successfully';
    case 'failed':
      return 'Extraction failed';
    default:
      return 'Unknown status';
  }
}

function getProgressFromStatus(status: string): number {
  switch (status) {
    case 'pending':
      return 0;
    case 'in_progress':
      return 12;
    case 'completed':
      return 100;
    case 'failed':
      return 0;
    default:
      return 0;
  }
}

/**
 * Helper functions for progress_phase from database
 */
function getPhaseFromProgressPhase(progressPhase: string | null): number {
  if (!progressPhase) return 1;

  switch (progressPhase) {
    case 'capturing':
    case 'scrolling':
    case 'loading':
    case 'initializing':
    case 'waiting_images':
    case 'waiting_fonts':
    case 'sections':
      return 1;
    case 'extracting':
    case 'analyzing':
      return 2;
    case 'complete':
      return 8;
    case 'failed':
      return 0;
    default:
      return 1;
  }
}

function getPhaseNameFromProgressPhase(progressPhase: string | null): string {
  if (!progressPhase) return 'Capturing Reference';

  switch (progressPhase) {
    case 'capturing':
    case 'scrolling':
    case 'loading':
    case 'initializing':
    case 'waiting_images':
    case 'waiting_fonts':
    case 'sections':
      return 'Capturing Reference';
    case 'extracting':
    case 'analyzing':
      return 'Extracting Design';
    case 'complete':
      return 'Finalization';
    case 'failed':
      return 'Failed';
    default:
      return 'Capturing Reference';
  }
}
