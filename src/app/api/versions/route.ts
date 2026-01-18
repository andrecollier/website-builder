/**
 * Versions API Route
 *
 * GET /api/versions?websiteId=xxx
 * Lists all versions for a website
 *
 * POST /api/versions
 * Creates a new version (for manual version creation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { listVersions, createNewVersion, type CreateVersionOptions } from '@/lib/versioning';
import type { VersionRecord } from '@/lib/db/client';

interface VersionsListResponse {
  success: boolean;
  versions?: VersionRecord[];
  error?: string;
}

interface CreateVersionRequest {
  websiteId: string;
  versionNumber: string;
  sourceDir: string;
  tokensJson?: string;
  changelog?: string;
  accuracyScore?: number;
  parentVersionId?: string;
  setActive?: boolean;
}

interface CreateVersionResponse {
  success: boolean;
  version?: VersionRecord;
  versionPath?: string;
  filesCopied?: number;
  error?: string;
}

/**
 * GET /api/versions?websiteId=xxx
 * Retrieve all versions for a website
 */
export async function GET(request: NextRequest): Promise<NextResponse<VersionsListResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const websiteId = searchParams.get('websiteId');

  if (!websiteId) {
    return NextResponse.json(
      { success: false, error: 'websiteId is required' },
      { status: 400 }
    );
  }

  try {
    const versions = listVersions(websiteId);

    return NextResponse.json({ success: true, versions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/versions
 * Create a new version manually
 *
 * Body: {
 *   websiteId: string,
 *   versionNumber: string,
 *   sourceDir: string,
 *   tokensJson?: string,
 *   changelog?: string,
 *   accuracyScore?: number,
 *   parentVersionId?: string,
 *   setActive?: boolean
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreateVersionResponse>> {
  try {
    let body: CreateVersionRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const {
      websiteId,
      versionNumber,
      sourceDir,
      tokensJson,
      changelog,
      accuracyScore,
      parentVersionId,
      setActive,
    } = body;

    // Validate required fields
    if (!websiteId) {
      return NextResponse.json(
        { success: false, error: 'websiteId is required' },
        { status: 400 }
      );
    }

    if (!versionNumber) {
      return NextResponse.json(
        { success: false, error: 'versionNumber is required' },
        { status: 400 }
      );
    }

    if (!sourceDir) {
      return NextResponse.json(
        { success: false, error: 'sourceDir is required' },
        { status: 400 }
      );
    }

    // Create version
    const options: CreateVersionOptions = {
      websiteId,
      versionNumber,
      sourceDir,
      tokensJson,
      changelog,
      accuracyScore,
      parentVersionId,
      setActive: setActive ?? true,
    };

    const result = await createNewVersion(options);

    return NextResponse.json({
      success: true,
      version: result.version,
      versionPath: result.versionPath,
      filesCopied: result.filesCopied,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
