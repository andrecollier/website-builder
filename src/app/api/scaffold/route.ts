/**
 * Scaffold API Route
 *
 * POST /api/scaffold
 * Creates a runnable Next.js project from generated components
 * Automatically creates v1.0 version on first website generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { scaffoldGeneratedSite } from '@/lib/scaffold';
import {
  createNewVersion,
  getNextVersionNumber,
  listVersions
} from '@/lib/versioning';
import path from 'path';

interface ScaffoldRequest {
  websiteId: string;
  siteName?: string;
}

interface ScaffoldResponse {
  success: boolean;
  generatedPath?: string;
  versionCreated?: boolean;
  versionNumber?: string;
  error?: string;
}

/**
 * Get the websites base directory
 */
function getWebsitesDir(): string {
  const envPath = process.env.WEBSITES_DIR;
  if (envPath) {
    if (envPath.startsWith('./') || envPath.startsWith('../')) {
      return path.resolve(process.cwd(), envPath);
    }
    return envPath;
  }
  return path.resolve(process.cwd(), 'Websites');
}

export async function POST(request: NextRequest): Promise<NextResponse<ScaffoldResponse>> {
  try {
    let body: ScaffoldRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { websiteId, siteName } = body;

    if (!websiteId) {
      return NextResponse.json(
        { success: false, error: 'websiteId is required' },
        { status: 400 }
      );
    }

    const websitesDir = getWebsitesDir();

    const result = await scaffoldGeneratedSite({
      websiteId,
      websitesDir,
      siteName,
    });

    if (result.success) {
      // Check if this is the first website generation (no versions exist yet)
      const existingVersions = listVersions(websiteId);
      let versionCreated = false;
      let versionNumber: string | undefined;

      if (existingVersions.length === 0) {
        // First generation - create v1.0 automatically
        try {
          versionNumber = getNextVersionNumber(websiteId, 'initial');
          const versionResult = createNewVersion({
            websiteId,
            versionNumber,
            sourceDir: result.generatedPath,
            changelog: 'Initial version',
            setActive: true,
          });
          versionCreated = true;
        } catch (versionError) {
          // Log error but don't fail the scaffold request
          // The generated/ folder is still valid even if versioning fails
          const versionMessage = versionError instanceof Error
            ? versionError.message
            : 'Unknown error';
          return NextResponse.json({
            success: true,
            generatedPath: result.generatedPath,
            versionCreated: false,
            error: `Scaffolding succeeded but version creation failed: ${versionMessage}`,
          });
        }
      }

      return NextResponse.json({
        success: true,
        generatedPath: result.generatedPath,
        versionCreated,
        versionNumber,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
