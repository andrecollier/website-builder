/**
 * Screenshot API Route
 *
 * Serves screenshot files from the Websites directory.
 *
 * GET /api/screenshots/[websiteId]/reference/sections/[filename]
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const pathSegments = params.path;

  if (!pathSegments || pathSegments.length === 0) {
    return NextResponse.json(
      { error: 'Path is required' },
      { status: 400 }
    );
  }

  // Construct the file path
  const filePath = path.join(
    process.cwd(),
    'Websites',
    ...pathSegments
  );

  // Security: Ensure path is within Websites directory
  const websitesDir = path.join(process.cwd(), 'Websites');
  const resolvedPath = path.resolve(filePath);

  if (!resolvedPath.startsWith(websitesDir)) {
    return NextResponse.json(
      { error: 'Invalid path' },
      { status: 403 }
    );
  }

  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }

  // Read the file
  const fileBuffer = fs.readFileSync(resolvedPath);

  // Determine content type based on extension
  const ext = path.extname(resolvedPath).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };

  const contentType = contentTypes[ext] || 'application/octet-stream';

  // Get file stats for ETag
  const stats = fs.statSync(resolvedPath);
  const etag = `"${stats.mtime.getTime()}-${stats.size}"`;

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, must-revalidate',
      'ETag': etag,
    },
  });
}
