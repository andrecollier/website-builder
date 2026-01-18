/**
 * Component Generation API Route
 *
 * POST /api/components/[websiteId]/generate
 * Triggers component detection and variant generation for a website.
 *
 * This endpoint initiates the component generation pipeline:
 * 1. Validates the website exists and has completed extraction
 * 2. Launches a browser and navigates to the website URL
 * 3. Detects page components (Header, Hero, Features, etc.)
 * 4. Generates 3 code variants per component (pixel-perfect, semantic, modernized)
 * 5. Saves components to filesystem and database
 *
 * The process runs asynchronously - poll /api/components/[websiteId] for results.
 */

import { NextRequest, NextResponse } from 'next/server';
import { chromium, type Browser, type Page } from 'playwright';
import {
  getWebsiteById,
  updateWebsiteStatus,
  initializeDatabase,
  getComponentsByWebsite,
  deleteComponentsByWebsite,
} from '@/lib/db/client';
import {
  generateComponents,
  type GeneratorResult,
  type GenerationProgress,
} from '@/lib/generator';
import { CAPTURE_CONFIG } from '@/types';
import { generationProgressStore, activeGenerations } from '@/lib/generation-progress';
import path from 'path';
import fs from 'fs';

/**
 * Response type for the generation endpoint
 */
interface GenerationResponse {
  success: boolean;
  websiteId: string;
  status: 'started' | 'already_running' | 'error';
  message?: string;
  error?: string;
}

/**
 * Request body for triggering generation
 */
interface GenerationRequest {
  /** Force regeneration even if components exist (default: false) */
  force?: boolean;
  /** Skip screenshot capture (default: false) */
  skipScreenshots?: boolean;
}

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
 * Check if a website has a design system file
 */
function getDesignSystem(websiteId: string): object | undefined {
  const designSystemPath = path.join(
    getWebsitesBaseDir(),
    websiteId,
    'design-system.json'
  );

  if (fs.existsSync(designSystemPath)) {
    try {
      const content = fs.readFileSync(designSystemPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      // Return undefined if parsing fails
      return undefined;
    }
  }

  return undefined;
}

/**
 * Launch a browser instance
 */
async function launchBrowser(headless: boolean = true): Promise<Browser> {
  return await chromium.launch({
    headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  });
}

/**
 * Create a page with the specified viewport
 */
async function createPage(
  browser: Browser,
  viewportWidth: number,
  viewportHeight: number
): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewportSize({
    width: viewportWidth,
    height: viewportHeight,
  });
  return page;
}

/**
 * Navigate to a URL and wait for content to load
 */
async function navigateAndWait(
  page: Page,
  url: string,
  timeout: number
): Promise<void> {
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout,
  });

  // Wait for initial page render
  await page.waitForTimeout(1000);
}

/**
 * Run the component generation process asynchronously.
 * This function is fire-and-forget - it handles its own errors.
 */
async function runGenerationProcess(
  websiteId: string,
  url: string,
  options: {
    skipScreenshots?: boolean;
    designSystem?: object;
  }
): Promise<void> {
  let browser: Browser | null = null;

  try {
    // Update progress
    generationProgressStore.set(websiteId, {
      phase: 'initializing',
      percent: 5,
      message: 'Launching browser...',
    });

    // Launch browser
    browser = await launchBrowser();

    // Create page
    const page = await createPage(
      browser,
      CAPTURE_CONFIG.viewport.width,
      CAPTURE_CONFIG.viewport.height
    );

    // Navigate to URL
    generationProgressStore.set(websiteId, {
      phase: 'initializing',
      percent: 10,
      message: 'Loading page...',
    });

    await navigateAndWait(page, url, CAPTURE_CONFIG.pageTimeout);

    // Generate components with AI-enhanced pixel-perfect generation
    const result = await generateComponents(page, {
      websiteId,
      versionId: 'v1', // Default version
      designSystem: options.designSystem as Parameters<typeof generateComponents>[1]['designSystem'],
      enableAIGeneration: true, // Use Claude Vision for pixel-perfect variant (Phase B)
      onProgress: (progress) => {
        generationProgressStore.set(websiteId, progress);
      },
      skipScreenshots: options.skipScreenshots,
    });

    if (result.success) {
      // Update final progress
      generationProgressStore.set(websiteId, {
        phase: 'complete',
        percent: 100,
        message: `Generated ${result.metadata.generatedCount} components`,
        totalComponents: result.metadata.generatedCount,
      });
    } else {
      // Handle generation failure
      generationProgressStore.set(websiteId, {
        phase: 'complete',
        percent: 100,
        message: `Generation completed with ${result.errors.length} errors`,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    generationProgressStore.set(websiteId, {
      phase: 'complete',
      percent: 100,
      message: `Generation failed: ${errorMessage}`,
    });
  } finally {
    // Always close browser to prevent memory leaks
    if (browser) {
      await browser.close();
    }

    // Remove from active generations
    activeGenerations.delete(websiteId);

    // Clean up progress store after a delay to allow final status poll
    setTimeout(() => {
      generationProgressStore.delete(websiteId);
    }, 60000); // Keep for 1 minute
  }
}

/**
 * Validate the generation request body
 */
function validateRequest(
  body: unknown
): { valid: true; data: GenerationRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    // Body is optional, return defaults
    return {
      valid: true,
      data: {
        force: false,
        skipScreenshots: false,
      },
    };
  }

  const data = body as Record<string, unknown>;

  // Validate optional fields
  const force = data.force !== undefined ? Boolean(data.force) : false;
  const skipScreenshots = data.skipScreenshots !== undefined ? Boolean(data.skipScreenshots) : false;

  return {
    valid: true,
    data: {
      force,
      skipScreenshots,
    },
  };
}

/**
 * POST /api/components/[websiteId]/generate
 *
 * Triggers component generation for a website.
 *
 * Request body (optional):
 * {
 *   "force": false,        // Regenerate even if components exist
 *   "skipScreenshots": false  // Skip screenshot capture
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "websiteId": "website-001",
 *   "status": "started",
 *   "message": "Component generation started"
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
): Promise<NextResponse<GenerationResponse>> {
  try {
    // Ensure database is initialized
    initializeDatabase();

    const { websiteId } = await params;

    // Validate websiteId
    if (!websiteId) {
      return NextResponse.json(
        {
          success: false,
          websiteId: '',
          status: 'error',
          error: 'Website ID is required',
        },
        { status: 400 }
      );
    }

    // Check if website exists
    const website = getWebsiteById(websiteId);
    if (!website) {
      return NextResponse.json(
        {
          success: false,
          websiteId,
          status: 'error',
          error: `Website with ID '${websiteId}' not found`,
        },
        { status: 404 }
      );
    }

    // Check if website has completed extraction
    if (website.status !== 'completed' && website.status !== 'in_progress') {
      return NextResponse.json(
        {
          success: false,
          websiteId,
          status: 'error',
          error: `Website extraction not completed. Current status: ${website.status}`,
        },
        { status: 400 }
      );
    }

    // Check if generation is already running for this website
    if (activeGenerations.has(websiteId)) {
      return NextResponse.json(
        {
          success: false,
          websiteId,
          status: 'already_running',
          error: 'Component generation is already in progress for this website',
        },
        { status: 409 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      // Body is optional, use defaults
      body = {};
    }

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          websiteId,
          status: 'error',
          error: validation.error,
        },
        { status: 400 }
      );
    }

    const { force, skipScreenshots } = validation.data;

    // Check if components already exist (unless force is true)
    if (!force) {
      const existingComponents = getComponentsByWebsite(websiteId);
      if (existingComponents.length > 0) {
        return NextResponse.json(
          {
            success: true,
            websiteId,
            status: 'started',
            message: `Components already exist (${existingComponents.length} found). Use force=true to regenerate.`,
          },
          { status: 200 }
        );
      }
    } else {
      // Delete existing components if forcing regeneration
      deleteComponentsByWebsite(websiteId);
    }

    // Get website URL
    const url = website.reference_url;
    if (!url) {
      return NextResponse.json(
        {
          success: false,
          websiteId,
          status: 'error',
          error: 'Website has no reference URL',
        },
        { status: 400 }
      );
    }

    // Get design system if available
    const designSystem = getDesignSystem(websiteId);

    // Mark generation as active
    activeGenerations.add(websiteId);

    // Initialize progress
    generationProgressStore.set(websiteId, {
      phase: 'initializing',
      percent: 0,
      message: 'Starting component generation...',
    });

    // Start generation process asynchronously (fire-and-forget)
    runGenerationProcess(websiteId, url, {
      skipScreenshots,
      designSystem,
    }).catch(() => {
      // Error handling is done inside runGenerationProcess
      // This catch prevents unhandled promise rejection warnings
      activeGenerations.delete(websiteId);
    });

    // Return success response immediately
    return NextResponse.json(
      {
        success: true,
        websiteId,
        status: 'started',
        message: 'Component generation started. Poll /api/components/[websiteId] for results.',
      },
      { status: 202 }
    );
  } catch (error) {
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

/**
 * GET /api/components/[websiteId]/generate
 *
 * Get the current generation progress for a website.
 *
 * Response:
 * {
 *   "success": true,
 *   "websiteId": "website-001",
 *   "progress": {
 *     "phase": "generating_variants",
 *     "percent": 45,
 *     "message": "Generating variants for Hero"
 *   },
 *   "isRunning": true
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
): Promise<NextResponse> {
  try {
    const { websiteId } = await params;

    if (!websiteId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Website ID is required',
        },
        { status: 400 }
      );
    }

    const progress = generationProgressStore.get(websiteId);
    const isRunning = activeGenerations.has(websiteId);

    return NextResponse.json(
      {
        success: true,
        websiteId,
        progress: progress || null,
        isRunning,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
