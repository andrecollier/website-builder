/**
 * Asset Extractor Module
 *
 * Downloads and catalogs all assets (images, fonts, icons) from the reference page.
 * Stores them locally to ensure reliable rendering in generated components.
 *
 * Benefits:
 * - No broken images from external URLs
 * - Consistent rendering regardless of network
 * - Can generate AI replacement prompts for images
 * - Fonts are captured for accurate typography
 */

import type { Page } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';

// ====================
// TYPE DEFINITIONS
// ====================

export interface ImageAsset {
  id: string;
  originalUrl: string;
  localPath: string;
  filename: string;
  width: number;
  height: number;
  format: string;
  size: number;
  alt?: string;
  role: 'hero' | 'content' | 'icon' | 'logo' | 'background' | 'decorative';
  sectionId?: string;
  aiPrompt?: string; // Generated description for AI image generation
}

export interface FontAsset {
  family: string;
  weights: string[];
  styles: string[];
  source: 'google' | 'local' | 'system' | 'custom';
  url?: string;
  localPath?: string;
}

export interface IconAsset {
  id: string;
  type: 'svg' | 'font-icon' | 'image';
  content?: string; // SVG content
  className?: string; // For font icons
  localPath?: string;
  name?: string;
}

export interface AssetManifest {
  extractedAt: string;
  sourceUrl: string;
  websiteId: string;
  images: ImageAsset[];
  fonts: FontAsset[];
  icons: IconAsset[];
  totalSize: number;
  summary: {
    imageCount: number;
    fontCount: number;
    iconCount: number;
    downloadedSize: string;
  };
}

// ====================
// IMAGE EXTRACTION
// ====================

/**
 * Extract all images from the page
 */
async function extractImages(page: Page): Promise<Array<{
  url: string;
  width: number;
  height: number;
  alt?: string;
  role: ImageAsset['role'];
  isBackground: boolean;
}>> {
  return page.evaluate(() => {
    const images: Array<{
      url: string;
      width: number;
      height: number;
      alt?: string;
      role: 'hero' | 'content' | 'icon' | 'logo' | 'background' | 'decorative';
      isBackground: boolean;
    }> = [];

    const seenUrls = new Set<string>();

    // Helper to determine image role
    const determineRole = (
      el: Element,
      width: number,
      height: number,
      alt?: string
    ): 'hero' | 'content' | 'icon' | 'logo' | 'background' | 'decorative' => {
      const altLower = (alt || '').toLowerCase();

      if (altLower.includes('logo')) return 'logo';
      if (width > 800 && height > 400) return 'hero';
      if (width < 64 && height < 64) return 'icon';
      if (!alt || alt === '') return 'decorative';

      // Check parent for clues
      const parent = el.parentElement;
      if (parent) {
        const parentClasses = parent.className?.toString().toLowerCase() || '';
        if (parentClasses.includes('hero') || parentClasses.includes('banner')) return 'hero';
        if (parentClasses.includes('logo')) return 'logo';
        if (parentClasses.includes('icon')) return 'icon';
      }

      return 'content';
    };

    // Extract img elements
    document.querySelectorAll('img').forEach((img) => {
      const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
      if (!src || seenUrls.has(src)) return;
      if (src.startsWith('data:')) return; // Skip data URIs for now

      const rect = img.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      seenUrls.add(src);
      images.push({
        url: src,
        width: Math.round(rect.width) || img.naturalWidth,
        height: Math.round(rect.height) || img.naturalHeight,
        alt: img.alt,
        role: determineRole(img, rect.width, rect.height, img.alt),
        isBackground: false,
      });
    });

    // Extract background images
    const allElements = document.querySelectorAll('*');
    allElements.forEach((el) => {
      const style = getComputedStyle(el);
      const bgImage = style.backgroundImage;

      if (bgImage && bgImage !== 'none') {
        // Extract URL from background-image
        const urlMatch = bgImage.match(/url\(['"]?([^'"()]+)['"]?\)/);
        if (urlMatch && urlMatch[1]) {
          const url = urlMatch[1];
          if (seenUrls.has(url)) return;
          if (url.startsWith('data:')) return;

          const rect = el.getBoundingClientRect();
          seenUrls.add(url);

          images.push({
            url,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            role: 'background',
            isBackground: true,
          });
        }
      }
    });

    // Extract from srcset
    document.querySelectorAll('[srcset]').forEach((el) => {
      const srcset = el.getAttribute('srcset');
      if (!srcset) return;

      // Parse srcset and get highest resolution
      const sources = srcset.split(',').map(s => s.trim().split(' ')[0]);
      sources.forEach(src => {
        if (!src || seenUrls.has(src)) return;
        if (src.startsWith('data:')) return;

        seenUrls.add(src);
        const rect = el.getBoundingClientRect();

        images.push({
          url: src,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          role: 'content',
          isBackground: false,
        });
      });
    });

    // Extract from picture sources
    document.querySelectorAll('picture source').forEach((source) => {
      const srcset = source.getAttribute('srcset');
      if (!srcset) return;

      const src = srcset.split(',')[0].trim().split(' ')[0];
      if (!src || seenUrls.has(src)) return;
      if (src.startsWith('data:')) return;

      seenUrls.add(src);
      images.push({
        url: src,
        width: 0,
        height: 0,
        role: 'content',
        isBackground: false,
      });
    });

    return images;
  });
}

/**
 * Download an image and return its local path
 */
async function downloadImage(
  url: string,
  assetsDir: string,
  timeout = 30000
): Promise<{ localPath: string; filename: string; size: number; format: string } | null> {
  try {
    // Generate unique filename from URL hash
    const urlHash = createHash('md5').update(url).digest('hex').substring(0, 12);
    const urlObj = new URL(url);
    const ext = path.extname(urlObj.pathname).toLowerCase() || '.jpg';
    const filename = `${urlHash}${ext}`;
    const localPath = path.join(assetsDir, 'images', filename);

    // Check if already downloaded
    try {
      const stats = await fs.stat(localPath);
      return {
        localPath: `assets/images/${filename}`,
        filename,
        size: stats.size,
        format: ext.replace('.', ''),
      };
    } catch {
      // File doesn't exist, download it
    }

    // Ensure directory exists
    await fs.mkdir(path.join(assetsDir, 'images'), { recursive: true });

    // Download the image
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Failed to download image: ${url} (${response.status})`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(localPath, buffer);

    // Detect actual format from content-type
    const contentType = response.headers.get('content-type');
    let format = ext.replace('.', '');
    if (contentType) {
      if (contentType.includes('jpeg') || contentType.includes('jpg')) format = 'jpg';
      else if (contentType.includes('png')) format = 'png';
      else if (contentType.includes('webp')) format = 'webp';
      else if (contentType.includes('gif')) format = 'gif';
      else if (contentType.includes('svg')) format = 'svg';
    }

    return {
      localPath: `assets/images/${filename}`,
      filename,
      size: buffer.length,
      format,
    };
  } catch (error) {
    console.warn(`Error downloading image ${url}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Generate AI prompt for image replacement
 */
function generateImagePrompt(image: {
  alt?: string;
  role: ImageAsset['role'];
  width: number;
  height: number;
}): string {
  const aspectRatio = image.width / image.height;
  const orientation = aspectRatio > 1.2 ? 'landscape' : aspectRatio < 0.8 ? 'portrait' : 'square';

  let prompt = '';

  // Use alt text as base
  if (image.alt && image.alt.length > 3) {
    prompt = image.alt;
  } else {
    // Generate based on role
    switch (image.role) {
      case 'hero':
        prompt = `Professional ${orientation} hero image for website header`;
        break;
      case 'logo':
        prompt = 'Company logo, clean modern design';
        break;
      case 'icon':
        prompt = 'Simple icon illustration';
        break;
      case 'background':
        prompt = `Abstract ${orientation} background texture or pattern`;
        break;
      case 'content':
        prompt = `Professional ${orientation} content image`;
        break;
      default:
        prompt = `${orientation} decorative image`;
    }
  }

  // Add dimensions hint
  prompt += `. Dimensions: ${image.width}x${image.height}px`;

  return prompt;
}

// ====================
// FONT EXTRACTION
// ====================

/**
 * Extract fonts used on the page
 */
async function extractFonts(page: Page): Promise<FontAsset[]> {
  const fontData = await page.evaluate(() => {
    const fonts = new Map<string, { weights: Set<string>; styles: Set<string> }>();

    // Get all computed styles
    const allElements = document.querySelectorAll('*');
    allElements.forEach((el) => {
      const style = getComputedStyle(el);
      const family = style.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
      const weight = style.fontWeight;
      const fontStyle = style.fontStyle;

      if (!fonts.has(family)) {
        fonts.set(family, { weights: new Set(), styles: new Set() });
      }

      const fontInfo = fonts.get(family)!;
      fontInfo.weights.add(weight);
      fontInfo.styles.add(fontStyle);
    });

    // Convert to array
    return Array.from(fonts.entries()).map(([family, info]) => ({
      family,
      weights: Array.from(info.weights),
      styles: Array.from(info.styles),
    }));
  });

  // Determine font source
  const fontsWithSource: FontAsset[] = [];

  for (const font of fontData) {
    // Check if it's a system font
    const systemFonts = [
      'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',
      'Roboto', 'Helvetica', 'Arial', 'sans-serif', 'serif', 'monospace',
      'Times New Roman', 'Georgia', 'Courier New', 'Verdana', 'Tahoma',
    ];

    const isSystem = systemFonts.some(
      sf => font.family.toLowerCase() === sf.toLowerCase()
    );

    fontsWithSource.push({
      family: font.family,
      weights: font.weights,
      styles: font.styles,
      source: isSystem ? 'system' : 'custom',
    });
  }

  return fontsWithSource;
}

// ====================
// ICON EXTRACTION
// ====================

/**
 * Extract SVG icons from the page
 */
async function extractIcons(page: Page): Promise<IconAsset[]> {
  return page.evaluate(() => {
    const icons: Array<{
      id: string;
      type: 'svg' | 'font-icon' | 'image';
      content?: string;
      className?: string;
      name?: string;
    }> = [];

    let iconIndex = 0;

    // Extract inline SVGs
    document.querySelectorAll('svg').forEach((svg) => {
      const rect = svg.getBoundingClientRect();
      // Only consider small SVGs as icons
      if (rect.width > 100 || rect.height > 100) return;
      if (rect.width === 0 || rect.height === 0) return;

      const content = svg.outerHTML;
      // Skip very large SVGs (probably decorative)
      if (content.length > 10000) return;

      const id = `icon-${iconIndex++}`;
      const ariaLabel = svg.getAttribute('aria-label');
      const title = svg.querySelector('title')?.textContent;

      icons.push({
        id,
        type: 'svg',
        content,
        name: ariaLabel || title || undefined,
      });
    });

    // Extract font icons (common patterns)
    document.querySelectorAll('[class*="icon"], [class*="fa-"], [class*="material-icon"]').forEach((el) => {
      if (el.tagName.toLowerCase() === 'svg') return; // Already captured

      const className = el.className?.toString();
      if (!className) return;

      const id = `font-icon-${iconIndex++}`;
      icons.push({
        id,
        type: 'font-icon',
        className,
      });
    });

    return icons.slice(0, 100); // Limit to 100 icons
  });
}

// ====================
// MAIN EXTRACTION
// ====================

/**
 * Extract all assets from a page
 */
export async function extractAssets(
  page: Page,
  websiteId: string,
  websitesDir: string,
  options: {
    downloadImages?: boolean;
    maxImages?: number;
    timeout?: number;
  } = {}
): Promise<AssetManifest> {
  const {
    downloadImages = true,
    maxImages = 50,
    timeout = 30000,
  } = options;

  const assetsDir = path.join(websitesDir, websiteId, 'assets');
  await fs.mkdir(assetsDir, { recursive: true });

  console.log('[AssetExtractor] Extracting images...');
  const rawImages = await extractImages(page);
  console.log(`[AssetExtractor] Found ${rawImages.length} images`);

  console.log('[AssetExtractor] Extracting fonts...');
  const fonts = await extractFonts(page);
  console.log(`[AssetExtractor] Found ${fonts.length} font families`);

  console.log('[AssetExtractor] Extracting icons...');
  const icons = await extractIcons(page);
  console.log(`[AssetExtractor] Found ${icons.length} icons`);

  // Process and download images
  const images: ImageAsset[] = [];
  let totalSize = 0;

  // Prioritize by role: hero > logo > content > background > decorative > icon
  const priorityOrder: ImageAsset['role'][] = ['hero', 'logo', 'content', 'background', 'decorative', 'icon'];
  const sortedImages = [...rawImages].sort((a, b) => {
    return priorityOrder.indexOf(a.role) - priorityOrder.indexOf(b.role);
  });

  const imagesToProcess = sortedImages.slice(0, maxImages);

  if (downloadImages) {
    console.log(`[AssetExtractor] Downloading ${imagesToProcess.length} images...`);

    for (let i = 0; i < imagesToProcess.length; i++) {
      const img = imagesToProcess[i];
      const progress = Math.round((i / imagesToProcess.length) * 100);

      if (i % 5 === 0) {
        console.log(`[AssetExtractor] Download progress: ${progress}%`);
      }

      const downloaded = await downloadImage(img.url, assetsDir, timeout);

      const id = `img-${i}`;
      const aiPrompt = generateImagePrompt(img);

      if (downloaded) {
        totalSize += downloaded.size;
        images.push({
          id,
          originalUrl: img.url,
          localPath: downloaded.localPath,
          filename: downloaded.filename,
          width: img.width,
          height: img.height,
          format: downloaded.format,
          size: downloaded.size,
          alt: img.alt,
          role: img.role,
          aiPrompt,
        });
      } else {
        // Keep reference even if download failed
        images.push({
          id,
          originalUrl: img.url,
          localPath: '', // Empty = not downloaded
          filename: '',
          width: img.width,
          height: img.height,
          format: 'unknown',
          size: 0,
          alt: img.alt,
          role: img.role,
          aiPrompt,
        });
      }
    }
  }

  // Save icons to files
  const iconsDir = path.join(assetsDir, 'icons');
  await fs.mkdir(iconsDir, { recursive: true });

  const processedIcons: IconAsset[] = [];
  for (const icon of icons) {
    if (icon.type === 'svg' && icon.content) {
      const filename = `${icon.id}.svg`;
      const localPath = path.join(iconsDir, filename);
      await fs.writeFile(localPath, icon.content);

      processedIcons.push({
        ...icon,
        localPath: `assets/icons/${filename}`,
      });
    } else {
      processedIcons.push(icon);
    }
  }

  // Format size for display
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const manifest: AssetManifest = {
    extractedAt: new Date().toISOString(),
    sourceUrl: page.url(),
    websiteId,
    images,
    fonts,
    icons: processedIcons,
    totalSize,
    summary: {
      imageCount: images.length,
      fontCount: fonts.length,
      iconCount: processedIcons.length,
      downloadedSize: formatSize(totalSize),
    },
  };

  // Save manifest
  const manifestPath = path.join(assetsDir, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`[AssetExtractor] Manifest saved to ${manifestPath}`);

  return manifest;
}

/**
 * Get local image path for a URL
 */
export function getLocalImagePath(
  manifest: AssetManifest,
  originalUrl: string
): string | null {
  const image = manifest.images.find(img => img.originalUrl === originalUrl);
  return image?.localPath || null;
}

/**
 * Replace external URLs with local paths in component code
 */
export function replaceImageUrls(
  code: string,
  manifest: AssetManifest,
  baseUrl: string = '/assets/images/'
): string {
  let result = code;

  for (const image of manifest.images) {
    if (image.localPath && image.originalUrl) {
      // Replace the URL in various formats
      const localUrl = baseUrl + image.filename;

      // Direct URL
      result = result.replace(new RegExp(escapeRegex(image.originalUrl), 'g'), localUrl);

      // URL-encoded version
      const encodedUrl = encodeURI(image.originalUrl);
      result = result.replace(new RegExp(escapeRegex(encodedUrl), 'g'), localUrl);
    }
  }

  return result;
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Format asset manifest as human-readable report
 */
export function formatAssetReport(manifest: AssetManifest): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('                    ASSET EXTRACTION REPORT');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push(`Source: ${manifest.sourceUrl}`);
  lines.push(`Extracted: ${new Date(manifest.extractedAt).toLocaleString()}`);
  lines.push('');
  lines.push(`Summary: ${manifest.summary.imageCount} images | ${manifest.summary.fontCount} fonts | ${manifest.summary.iconCount} icons`);
  lines.push(`Total Size: ${manifest.summary.downloadedSize}`);
  lines.push('───────────────────────────────────────────────────────────');

  // Images by role
  lines.push('');
  lines.push('## IMAGES');
  const byRole = new Map<string, ImageAsset[]>();
  for (const img of manifest.images) {
    if (!byRole.has(img.role)) byRole.set(img.role, []);
    byRole.get(img.role)!.push(img);
  }

  for (const [role, imgs] of Array.from(byRole.entries())) {
    lines.push(`  ${role.toUpperCase()} (${imgs.length}):`);
    for (const img of imgs.slice(0, 5)) {
      const status = img.localPath ? '✅' : '❌';
      lines.push(`    ${status} ${img.width}x${img.height} - ${img.filename || 'not downloaded'}`);
      if (img.aiPrompt) {
        lines.push(`       AI: "${img.aiPrompt.substring(0, 60)}..."`);
      }
    }
    if (imgs.length > 5) {
      lines.push(`    ... and ${imgs.length - 5} more`);
    }
  }

  // Fonts
  lines.push('');
  lines.push('## FONTS');
  for (const font of manifest.fonts.slice(0, 10)) {
    const source = font.source === 'system' ? '(system)' : '(custom)';
    lines.push(`  • ${font.family} ${source}`);
    lines.push(`    Weights: ${font.weights.join(', ')}`);
  }

  // Icons
  lines.push('');
  lines.push('## ICONS');
  const svgIcons = manifest.icons.filter(i => i.type === 'svg');
  const fontIcons = manifest.icons.filter(i => i.type === 'font-icon');
  lines.push(`  SVG Icons: ${svgIcons.length}`);
  lines.push(`  Font Icons: ${fontIcons.length}`);

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');

  return lines.join('\n');
}
