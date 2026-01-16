/**
 * Version Rollback API Route
 *
 * POST /api/versions/[id]/rollback
 * Performs non-destructive rollback to a specific version by creating
 * a NEW version based on the target version's state. The target version
 * and all other versions remain unchanged (append-only history).
 */

import { NextRequest, NextResponse } from 'next/server';
import { rollbackToVersion, canRollback, getVersion } from '@/lib/versioning';
import type { Version } from '@/types';

interface RollbackRequest {
  changelog?: string;
}

interface RollbackResponse {
  success: boolean;
  newVersion?: Version;
  targetVersion?: Version;
  error?: string;
}

/**
 * POST /api/versions/[id]/rollback
 * Roll back to a specific version (creates new version, non-destructive)
 *
 * Body: {
 *   changelog?: string (optional custom changelog)
 * }
 *
 * Returns the newly created version and the target version that was rolled back to
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<RollbackResponse>> {
  const targetVersionId = params.id;

  if (!targetVersionId) {
    return NextResponse.json(
      { success: false, error: 'Version ID is required' },
      { status: 400 }
    );
  }

  try {
    // Parse request body for optional changelog
    let body: RollbackRequest = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional, ignore parse errors
      body = {};
    }

    // Get the target version to retrieve its websiteId
    const targetVersion = getVersion(targetVersionId);

    if (!targetVersion) {
      return NextResponse.json(
        { success: false, error: `Version not found: ${targetVersionId}` },
        { status: 404 }
      );
    }

    // Check if rollback is possible
    const rollbackCheck = canRollback(targetVersion.website_id, targetVersionId);
    if (!rollbackCheck.canRollback) {
      return NextResponse.json(
        {
          success: false,
          error: rollbackCheck.reason || 'Cannot rollback to this version'
        },
        { status: 400 }
      );
    }

    // Perform the rollback (creates new version)
    const result = rollbackToVersion({
      websiteId: targetVersion.website_id,
      targetVersionId,
      changelog: body.changelog,
    });

    return NextResponse.json({
      success: true,
      newVersion: result.newVersion,
      targetVersion: result.targetVersion,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
