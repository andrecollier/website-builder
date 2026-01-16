/**
 * Scaffold API Route
 *
 * POST /api/scaffold
 * Creates a runnable Next.js project from generated components
 */

import { NextRequest, NextResponse } from 'next/server';
import { scaffoldGeneratedSite } from '@/lib/scaffold';
import path from 'path';

interface ScaffoldRequest {
  websiteId: string;
  siteName?: string;
}

interface ScaffoldResponse {
  success: boolean;
  generatedPath?: string;
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
      return NextResponse.json({
        success: true,
        generatedPath: result.generatedPath,
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
