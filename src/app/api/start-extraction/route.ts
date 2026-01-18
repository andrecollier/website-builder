/**
 * Start Extraction API Route
 *
 * POST /api/start-extraction
 * Initiates the website extraction process by creating a new website record
 * and returning the websiteId for status tracking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createWebsite, initializeDatabase, updateWebsiteStatus, updateWebsiteProgress, clearWebsiteProgress } from '@/lib/db/client';
import { isValidUrl, getNameFromUrl } from '@/lib/utils';
import { publishCaptureProgress, captureProgressStore } from '@/lib/capture-progress';
import {
  generateTailwindConfigString,
  generateCSSVariables,
} from '@/lib/design-system';
import { setTokens } from '@/lib/cache';
import type { StartExtractionRequest, StartExtractionResponse, CaptureProgress, CapturePhase, DesignSystem } from '@/types';
import { executeOrchestrator } from '@/agents/orchestrator';
import path from 'path';
import fs from 'fs';

// captureProgressStore is imported from @/lib/capture-progress

/**
 * Get the base directory for website output
 */
function getWebsitesBaseDir(): string {
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
 * Save design system outputs to website folder.
 * Generates design-system.json, tailwind.config.js, and variables.css.
 *
 * @param websiteId - The website ID for folder naming
 * @param url - The source URL for meta information
 * @param designSystem - The design system object to save
 */
async function saveDesignSystemFiles(
  websiteId: string,
  url: string,
  designSystem: DesignSystem
): Promise<void> {
  // Get the website output directory
  const websiteDir = path.join(getWebsitesBaseDir(), websiteId);

  // Ensure directory exists
  if (!fs.existsSync(websiteDir)) {
    fs.mkdirSync(websiteDir, { recursive: true });
  }

  // Save design-system.json
  const designSystemPath = path.join(websiteDir, 'design-system.json');
  fs.writeFileSync(designSystemPath, JSON.stringify(designSystem, null, 2), 'utf-8');

  // Save tailwind.config.js
  const tailwindConfig = generateTailwindConfigString(designSystem);
  const tailwindPath = path.join(websiteDir, 'tailwind.config.js');
  fs.writeFileSync(tailwindPath, tailwindConfig, 'utf-8');

  // Save variables.css
  const cssVariables = generateCSSVariables(designSystem);
  const cssPath = path.join(websiteDir, 'variables.css');
  fs.writeFileSync(cssPath, cssVariables, 'utf-8');

  // Cache the design tokens for faster retrieval
  setTokens(url, designSystem);
}

/**
 * Helper to save progress to both in-memory store and database
 */
function saveProgress(websiteId: string, phase: CapturePhase, percent: number, message: string): void {
  const progress = { phase, percent, message };
  // Publish to SSE subscribers for real-time updates
  publishCaptureProgress(websiteId, progress);
  // Store in memory for polling fallback
  captureProgressStore.set(websiteId, progress);
  // Persist to database for recovery after refresh
  updateWebsiteProgress(websiteId, progress);
}

/**
 * Run the extraction pipeline using the Orchestrator Agent.
 * This function is fire-and-forget - it handles its own errors and updates the database.
 * Uses the agent-based architecture for capture, extraction, generation, and comparison.
 *
 * @param websiteId - The website ID
 * @param url - The URL to extract
 * @param requireApproval - If true, pause after component generation for approval
 */
async function runExtractionPipeline(websiteId: string, url: string, requireApproval: boolean = false): Promise<void> {
  try {
    // Initial progress
    saveProgress(websiteId, 'initializing', 0, 'Starting extraction pipeline...');

    // Execute the orchestrator agent which coordinates all pipeline phases
    const result = await executeOrchestrator({
      websiteId,
      url,
      requireApproval,
      onProgress: (progress) => {
        // Save to all stores (memory + database)
        saveProgress(websiteId, progress.phase, progress.percent, progress.message);
      },
    });

    if (result.success && result.data) {
      // Check if pipeline is awaiting approval
      if (result.data.status === 'awaiting_approval') {
        saveProgress(websiteId, 'awaiting_approval', 65, 'Scaffold complete - preview available. Awaiting approval.');
        updateWebsiteStatus(websiteId, 'awaiting_approval');
        return; // Don't clean up progress store yet - user needs to see the state
      }

      // Save design system files if extraction was successful
      if (result.data.designSystem) {
        try {
          await saveDesignSystemFiles(websiteId, url, result.data.designSystem);
        } catch (error) {
          // Log but don't fail - design system files are supplementary
        }
      }

      // Final completion status
      saveProgress(websiteId, 'complete', 100, 'Extraction complete');
      updateWebsiteStatus(websiteId, 'completed');
    } else {
      // Pipeline failed
      const errorMessage = result.error?.message || 'Pipeline failed';
      saveProgress(websiteId, 'failed', 0, errorMessage);
      updateWebsiteStatus(websiteId, 'failed');
    }
  } catch (error) {
    // Handle unexpected errors during pipeline execution
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    saveProgress(websiteId, 'failed', 0, `Error: ${errorMessage}`);
    updateWebsiteStatus(websiteId, 'failed');
  } finally {
    // Clean up in-memory progress store after a delay to allow final status poll
    // Database progress is kept for refresh recovery
    // Skip cleanup if awaiting approval
    const currentProgress = captureProgressStore.get(websiteId);
    if (currentProgress?.phase !== 'awaiting_approval') {
      setTimeout(() => {
        captureProgressStore.delete(websiteId);
      }, 30000);
    }
  }
}

/**
 * Validate the request body for start extraction
 */
function validateRequest(
  body: unknown
): { valid: true; data: StartExtractionRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const data = body as Record<string, unknown>;

  // Validate URL
  if (!data.url || typeof data.url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  if (!isValidUrl(data.url)) {
    return { valid: false, error: 'Invalid URL format. Must be a valid HTTP/HTTPS URL.' };
  }

  // Validate mode
  const mode = data.mode || 'single';
  if (mode !== 'single' && mode !== 'template') {
    return { valid: false, error: 'Mode must be either "single" or "template"' };
  }

  // Validate template config if mode is template
  if (mode === 'template') {
    if (!data.templateConfig || typeof data.templateConfig !== 'object') {
      return { valid: false, error: 'Template config is required for template mode' };
    }

    const templateConfig = data.templateConfig as Record<string, unknown>;

    if (!Array.isArray(templateConfig.urls) || templateConfig.urls.length === 0) {
      return { valid: false, error: 'At least one URL is required in template config' };
    }

    // Validate each URL in template config
    for (const urlItem of templateConfig.urls) {
      if (typeof urlItem === 'object' && urlItem !== null) {
        const refUrl = urlItem as Record<string, unknown>;
        if (refUrl.url && typeof refUrl.url === 'string' && !isValidUrl(refUrl.url)) {
          return { valid: false, error: `Invalid URL in template config: ${refUrl.url}` };
        }
      }
    }
  }

  return {
    valid: true,
    data: {
      url: data.url,
      mode: mode as 'single' | 'template',
      name: typeof data.name === 'string' ? data.name : undefined,
      templateConfig: data.templateConfig as StartExtractionRequest['templateConfig'],
      requireApproval: data.requireApproval === true,
    },
  };
}

/**
 * POST /api/start-extraction
 *
 * Request body:
 * {
 *   "url": "https://example.com",
 *   "mode": "single" | "template",
 *   "name": "optional display name",
 *   "templateConfig": {
 *     "urls": [{ "id": "...", "url": "...", "name": "...", "isValid": true }],
 *     "sections": [{ "sectionType": "header", "sourceId": "...", "order": 0 }]
 *   }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "websiteId": "website-001",
 *   "status": "started"
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse<StartExtractionResponse>> {
  try {
    // Ensure database is initialized
    initializeDatabase();

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          websiteId: '',
          status: 'error',
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      );
    }

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          websiteId: '',
          status: 'error',
          error: validation.error,
        },
        { status: 400 }
      );
    }

    const { url, name, requireApproval } = validation.data;

    // Generate display name from URL if not provided
    const displayName = name || getNameFromUrl(url);

    // Create website record in database
    const website = createWebsite({
      name: displayName,
      reference_url: url,
      status: 'pending',
    });

    // Update status to in_progress to indicate extraction has started
    updateWebsiteStatus(website.id, 'in_progress');

    // Start extraction pipeline asynchronously using Orchestrator Agent (fire-and-forget)
    // The process updates the database status on completion/failure
    // Progress can be polled via the /api/status endpoint
    // If requireApproval is true, pipeline will pause after component generation
    runExtractionPipeline(website.id, url, requireApproval).catch(() => {
      // Error handling is done inside runExtractionPipeline
      // This catch prevents unhandled promise rejection warnings
    });

    // Return success response immediately
    // Client should poll /api/status?websiteId=... for progress
    return NextResponse.json(
      {
        success: true,
        websiteId: website.id,
        status: 'started',
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      {
        success: false,
        websiteId: '',
        status: 'error',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
