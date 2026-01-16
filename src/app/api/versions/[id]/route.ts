/**
 * Single Version API Route
 *
 * GET /api/versions/[id]
 * Retrieve a single version by ID with files and changelog
 *
 * DELETE /api/versions/[id]
 * Returns 405 - versions are immutable and cannot be deleted
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVersion, getFilesForVersion } from '@/lib/versioning';
import type { Version, VersionFile } from '@/types';

interface VersionResponse {
  success: boolean;
  version?: Version;
  files?: VersionFile[];
  error?: string;
}

interface DeleteResponse {
  success: boolean;
  error: string;
}

/**
 * GET /api/versions/[id]
 * Retrieve a single version with its files
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<VersionResponse>> {
  const versionId = params.id;

  if (!versionId) {
    return NextResponse.json(
      { success: false, error: 'Version ID is required' },
      { status: 400 }
    );
  }

  try {
    const version = getVersion(versionId);

    if (!version) {
      return NextResponse.json(
        { success: false, error: `Version not found: ${versionId}` },
        { status: 404 }
      );
    }

    // Get files for this version
    const files = getFilesForVersion(versionId);

    return NextResponse.json({
      success: true,
      version,
      files,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/versions/[id]
 * Versions are immutable - deletion is not allowed
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<DeleteResponse>> {
  return NextResponse.json(
    {
      success: false,
      error: 'Versions are immutable and cannot be deleted. This preserves complete version history.',
    },
    { status: 405 }
  );
}
