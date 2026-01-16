/**
 * Image API Route
 *
 * GET /api/image?path=xxx
 * Serves images from the Websites folder
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imagePath = searchParams.get('path');

  if (!imagePath) {
    return new NextResponse('Missing path parameter', { status: 400 });
  }

  // Sanitize path to prevent directory traversal
  const sanitizedPath = imagePath.replace(/\.\./g, '');
  const fullPath = path.join(getWebsitesDir(), sanitizedPath);

  // Ensure path is within Websites directory
  const websitesDir = getWebsitesDir();
  if (!fullPath.startsWith(websitesDir)) {
    return new NextResponse('Invalid path', { status: 403 });
  }

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    return new NextResponse('Image not found', { status: 404 });
  }

  // Read file
  const imageBuffer = fs.readFileSync(fullPath);

  // Determine content type
  const ext = path.extname(fullPath).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };

  const contentType = contentTypes[ext] || 'application/octet-stream';

  return new NextResponse(imageBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
