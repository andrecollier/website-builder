/**
 * Websites API Route
 *
 * GET /api/websites - List all websites
 * DELETE /api/websites?id={websiteId} - Delete a website by ID
 *
 * Provides CRUD operations for website records in the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getWebsites,
  getWebsiteById,
  deleteWebsite,
  searchWebsites,
  getWebsitesByStatus,
  initializeDatabase,
} from '@/lib/db/client';
import type { Website, WebsiteStatus } from '@/types';

/**
 * Response type for the GET /api/websites endpoint
 */
interface WebsitesListResponse {
  success: boolean;
  websites: Website[];
  total: number;
  error?: string;
}

/**
 * Response type for the DELETE /api/websites endpoint
 */
interface WebsiteDeleteResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * GET /api/websites
 *
 * Query parameters:
 * - search (optional): Search websites by name or URL
 * - status (optional): Filter by status (pending, in_progress, completed, failed)
 *
 * Response:
 * {
 *   "success": true,
 *   "websites": [...],
 *   "total": 10
 * }
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<WebsitesListResponse>> {
  try {
    // Ensure database is initialized
    initializeDatabase();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status') as WebsiteStatus | null;

    let websites: Website[];

    // Apply filters based on query parameters
    if (search) {
      // Search by name or URL
      websites = searchWebsites(search);
    } else if (status) {
      // Validate status parameter
      const validStatuses: WebsiteStatus[] = ['pending', 'in_progress', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            websites: [],
            total: 0,
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          },
          { status: 400 }
        );
      }
      // Filter by status
      websites = getWebsitesByStatus(status);
    } else {
      // Get all websites
      websites = getWebsites();
    }

    return NextResponse.json(
      {
        success: true,
        websites,
        total: websites.length,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      {
        success: false,
        websites: [],
        total: 0,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/websites
 *
 * Query parameters:
 * - id (required): The ID of the website to delete
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Website deleted successfully"
 * }
 */
export async function DELETE(
  request: NextRequest
): Promise<NextResponse<WebsiteDeleteResponse>> {
  try {
    // Ensure database is initialized
    initializeDatabase();

    // Get website ID from query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Website ID is required',
          error: 'Missing required query parameter: id',
        },
        { status: 400 }
      );
    }

    // Check if website exists
    const website = getWebsiteById(id);
    if (!website) {
      return NextResponse.json(
        {
          success: false,
          message: 'Website not found',
          error: `Website with ID '${id}' does not exist`,
        },
        { status: 404 }
      );
    }

    // Delete the website
    const deleted = deleteWebsite(id);
    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to delete website',
          error: 'Database operation failed',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Website '${website.name}' deleted successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete website',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
