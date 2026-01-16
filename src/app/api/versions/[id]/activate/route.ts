/**
 * Version Activation API Route
 *
 * POST /api/versions/[id]/activate
 * Activates a specific version by updating is_active flag in database
 * and updating the current/ symlink to point to this version
 */

import { NextRequest, NextResponse } from 'next/server';
import { activateVersion, getVersion } from '@/lib/versioning';
import type { Version } from '@/types';

interface ActivateResponse {
  success: boolean;
  version?: Version;
  error?: string;
}

/**
 * POST /api/versions/[id]/activate
 * Activate a version (updates database and current/ symlink)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ActivateResponse>> {
  const versionId = params.id;

  if (!versionId) {
    return NextResponse.json(
      { success: false, error: 'Version ID is required' },
      { status: 400 }
    );
  }

  try {
    // First, get the version to retrieve its websiteId
    const versionToActivate = getVersion(versionId);

    if (!versionToActivate) {
      return NextResponse.json(
        { success: false, error: `Version not found: ${versionId}` },
        { status: 404 }
      );
    }

    // Activate the version (updates database and symlink)
    const activatedVersion = activateVersion(versionId, versionToActivate.website_id);

    if (!activatedVersion) {
      return NextResponse.json(
        { success: false, error: 'Failed to activate version' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      version: activatedVersion,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
