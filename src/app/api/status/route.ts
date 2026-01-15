/**
 * Status API Route
 *
 * GET /api/status
 * Returns the current extraction status for progress polling.
 * Supports optional websiteId query parameter to get status for a specific website.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWebsiteById, initializeDatabase } from '@/lib/db/client';
import { PHASES } from '@/types';
import type { StatusResponse, ExtractionError } from '@/types';

/**
 * In-memory status store for tracking extraction progress.
 * In Phase 1, this serves as a placeholder. In later phases,
 * this would be replaced with persistent storage or event-driven updates.
 */
interface ExtractionProgress {
  websiteId: string;
  phase: number;
  subStatus: string;
  progress: number;
  errors: ExtractionError[];
  updatedAt: number;
}

// In-memory store for active extractions (Phase 1 placeholder)
const activeExtractions = new Map<string, ExtractionProgress>();

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

    // Check if website exists in database
    const website = getWebsiteById(websiteId);
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

    // Check for active extraction progress in memory
    const activeProgress = activeExtractions.get(websiteId);
    if (activeProgress) {
      return NextResponse.json(
        {
          websiteId: activeProgress.websiteId,
          phase: activeProgress.phase,
          totalPhases: 8,
          phaseName: getPhaseName(activeProgress.phase),
          subStatus: activeProgress.subStatus,
          progress: activeProgress.progress,
          errors: activeProgress.errors,
        },
        { status: 200 }
      );
    }

    // Return status based on website database status
    // In Phase 1, we return simulated status based on the website's status field
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
 * Exported helper for other modules to update extraction progress
 * This allows the start-extraction route or background jobs to update status
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
