/**
 * Compare API Route
 *
 * POST /api/compare
 * Runs visual comparison between reference and generated screenshots
 *
 * GET /api/compare?websiteId=xxx
 * Gets existing comparison report
 */

import { NextRequest, NextResponse } from 'next/server';
import { runComparison, getExistingReport, ComparisonReport } from '@/lib/comparison';
import path from 'path';

interface CompareRequest {
  websiteId: string;
  generatedSiteUrl?: string;
  forceRecapture?: boolean;
}

interface CompareResponse {
  success: boolean;
  report?: ComparisonReport;
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

/**
 * GET /api/compare?websiteId=xxx
 * Retrieve existing comparison report
 */
export async function GET(request: NextRequest): Promise<NextResponse<CompareResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const websiteId = searchParams.get('websiteId');

  if (!websiteId) {
    return NextResponse.json(
      { success: false, error: 'websiteId is required' },
      { status: 400 }
    );
  }

  try {
    const websitesDir = getWebsitesDir();
    const report = getExistingReport(websiteId, websitesDir);

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'No comparison report found. Run POST /api/compare first.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/compare
 * Run visual comparison
 *
 * Body: {
 *   websiteId: string,
 *   generatedSiteUrl?: string (default: http://localhost:3002, auto-started),
 *   forceRecapture?: boolean (default: false)
 * }
 *
 * The generated site will be automatically started on port 3002 if not running.
 */
export async function POST(request: NextRequest): Promise<NextResponse<CompareResponse>> {
  try {
    let body: CompareRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { websiteId, generatedSiteUrl, forceRecapture } = body;

    if (!websiteId) {
      return NextResponse.json(
        { success: false, error: 'websiteId is required' },
        { status: 400 }
      );
    }

    const websitesDir = getWebsitesDir();

    // Check for existing report if not forcing recapture
    if (!forceRecapture) {
      const existingReport = getExistingReport(websiteId, websitesDir);
      if (existingReport) {
        // Return cached report if less than 5 minutes old
        const reportAge = Date.now() - new Date(existingReport.timestamp).getTime();
        if (reportAge < 5 * 60 * 1000) {
          return NextResponse.json({
            success: true,
            report: existingReport,
          });
        }
      }
    }

    // Run comparison (auto-starts generated site if not running)
    const report = await runComparison({
      websiteId,
      websitesDir,
      generatedSiteUrl: generatedSiteUrl || undefined,
      autoStartServer: true,
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Comparison error:', error);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
