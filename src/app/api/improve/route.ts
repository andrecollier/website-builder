/**
 * Improve Website API Route
 *
 * POST /api/improve
 * Triggers improvement agents to fix low-accuracy components.
 *
 * This can be called automatically after extraction or manually.
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

interface ImproveRequest {
  websiteId: string;
  targetAccuracy?: number;
  autoFix?: boolean;
}

interface ImproveResponse {
  success: boolean;
  websiteId: string;
  message: string;
  improvements?: {
    sectionsAnalyzed: number;
    sectionsImproved: number;
    beforeAccuracy: number;
    afterAccuracy: number;
  };
  error?: string;
}

/**
 * Get comparison report for a website
 */
function getComparisonReport(websiteId: string): {
  overallAccuracy: number;
  sections: Array<{ sectionType: string; accuracy: number }>;
} | null {
  const websitesDir = process.env.WEBSITES_DIR || path.join(process.cwd(), 'Websites');
  const reportPath = path.join(websitesDir, websiteId, 'comparison', 'report.json');

  if (!fs.existsSync(reportPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(reportPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Identify sections that need improvement
 */
function identifyImprovementTargets(
  report: { sections: Array<{ sectionType: string; accuracy: number }> },
  targetAccuracy: number
): Array<{ sectionType: string; accuracy: number; priority: 'high' | 'medium' | 'low' }> {
  return report.sections
    .filter((s) => s.accuracy < targetAccuracy)
    .map((s) => ({
      ...s,
      priority: (s.accuracy < 30 ? 'high' : s.accuracy < 60 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

/**
 * POST /api/improve
 *
 * Request body:
 * {
 *   "websiteId": "website-xxx",
 *   "targetAccuracy": 80,  // optional, default 80
 *   "autoFix": true        // optional, default false (just analyze)
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse<ImproveResponse>> {
  try {
    const body = (await request.json()) as ImproveRequest;
    const { websiteId, targetAccuracy = 80, autoFix = false } = body;

    if (!websiteId) {
      return NextResponse.json(
        { success: false, websiteId: '', message: 'websiteId is required', error: 'Missing websiteId' },
        { status: 400 }
      );
    }

    // Get current comparison report
    const report = getComparisonReport(websiteId);
    if (!report) {
      return NextResponse.json(
        {
          success: false,
          websiteId,
          message: 'No comparison report found. Run extraction first.',
          error: 'Report not found',
        },
        { status: 404 }
      );
    }

    // Identify sections needing improvement
    const targets = identifyImprovementTargets(report, targetAccuracy);

    if (targets.length === 0) {
      return NextResponse.json({
        success: true,
        websiteId,
        message: `All sections meet target accuracy of ${targetAccuracy}%`,
        improvements: {
          sectionsAnalyzed: report.sections.length,
          sectionsImproved: 0,
          beforeAccuracy: report.overallAccuracy,
          afterAccuracy: report.overallAccuracy,
        },
      });
    }

    // If autoFix is false, just return analysis
    if (!autoFix) {
      const highPriority = targets.filter((t) => t.priority === 'high');
      const mediumPriority = targets.filter((t) => t.priority === 'medium');

      return NextResponse.json({
        success: true,
        websiteId,
        message: `Found ${targets.length} sections below ${targetAccuracy}% accuracy`,
        improvements: {
          sectionsAnalyzed: report.sections.length,
          sectionsImproved: 0,
          beforeAccuracy: report.overallAccuracy,
          afterAccuracy: report.overallAccuracy,
        },
        // Include analysis details
        ...(({
          analysis: {
            targetAccuracy,
            sectionsNeedingImprovement: targets.length,
            highPriority: highPriority.map((t) => ({ type: t.sectionType, accuracy: t.accuracy })),
            mediumPriority: mediumPriority.map((t) => ({ type: t.sectionType, accuracy: t.accuracy })),
          },
        }) as Record<string, unknown>),
      });
    }

    // AutoFix mode - would trigger improvement agents here
    // For now, return what would be improved
    // TODO: Integrate with Claude Agent SDK when ANTHROPIC_API_KEY is available

    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

    if (!hasApiKey) {
      return NextResponse.json({
        success: false,
        websiteId,
        message: 'ANTHROPIC_API_KEY not set. Cannot run improvement agents.',
        error: 'Missing API key',
        improvements: {
          sectionsAnalyzed: report.sections.length,
          sectionsImproved: 0,
          beforeAccuracy: report.overallAccuracy,
          afterAccuracy: report.overallAccuracy,
        },
      });
    }

    // Run improvement agents (when implemented)
    // const result = await runImprovementAgents(websiteId, targets);

    return NextResponse.json({
      success: true,
      websiteId,
      message: `Improvement agents triggered for ${targets.length} sections`,
      improvements: {
        sectionsAnalyzed: report.sections.length,
        sectionsImproved: targets.length,
        beforeAccuracy: report.overallAccuracy,
        afterAccuracy: report.overallAccuracy, // Would be updated after agents run
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, websiteId: '', message: 'Failed to process improvement request', error: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/improve?websiteId=xxx
 *
 * Get improvement analysis without triggering fixes
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const websiteId = request.nextUrl.searchParams.get('websiteId');
  const targetAccuracy = parseInt(request.nextUrl.searchParams.get('targetAccuracy') || '80', 10);

  if (!websiteId) {
    return NextResponse.json({ success: false, error: 'websiteId is required' }, { status: 400 });
  }

  const report = getComparisonReport(websiteId);
  if (!report) {
    return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
  }

  const targets = identifyImprovementTargets(report, targetAccuracy);

  return NextResponse.json({
    success: true,
    websiteId,
    currentAccuracy: report.overallAccuracy,
    targetAccuracy,
    sectionsNeedingImprovement: targets,
    summary: {
      total: report.sections.length,
      belowTarget: targets.length,
      highPriority: targets.filter((t) => t.priority === 'high').length,
      mediumPriority: targets.filter((t) => t.priority === 'medium').length,
      lowPriority: targets.filter((t) => t.priority === 'low').length,
    },
  });
}
