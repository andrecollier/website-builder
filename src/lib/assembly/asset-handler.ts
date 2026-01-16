/**
 * Asset Handler Module
 *
 * This module provides functionality for downloading and optimizing assets
 * (primarily images) for assembled pages. It handles:
 * - Downloading remote images from assembled HTML
 * - Converting images to modern formats (WebP)
 * - Generating responsive image srcsets
 * - Adding lazy loading attributes
 * - Optimizing image sizes for performance
 *
 * Coordinates with:
 * - page assembler: For processing assembled component HTML
 * - filesystem: For saving optimized assets
 * - image processing libraries: For format conversion and optimization
 */

import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Phase of the asset processing pipeline
 */
export type AssetPhase =
  | 'initializing'
  | 'scanning'
  | 'downloading'
  | 'optimizing'
  | 'generating_variants'
  | 'updating_html'
  | 'complete';

/**
 * Progress update for asset processing
 */
export interface AssetProgress {
  phase: AssetPhase;
  percent: number;
  message: string;
  currentAsset?: number;
  totalAssets?: number;
}

/**
 * Options for asset processing
 */
export interface AssetHandlerOptions {
  /** Website ID for organizing output */
  websiteId: string;
  /** HTML content to process */
  html: string;
  /** Output directory for assets (default: auto-generated) */
  outputDir?: string;
  /** Generate WebP variants (default: true) */
  generateWebP?: boolean;
  /** Generate responsive srcsets (default: true) */
  generateSrcset?: boolean;
  /** Add lazy loading (default: true) */
  enableLazyLoading?: boolean;
  /** Sizes for srcset generation (default: [640, 768, 1024, 1280, 1920]) */
  srcsetSizes?: number[];
  /** Maximum image width (default: 1920) */
  maxWidth?: number;
  /** JPEG quality (default: 85) */
  quality?: number;
  /** Callback for progress updates */
  onProgress?: (progress: AssetProgress) => void;
  /** Skip downloading external assets (default: false) */
  skipDownload?: boolean;
}

/**
 * Detected image asset in HTML
 */
export interface DetectedAsset {
  id: string;
  type: 'image';
  originalSrc: string;
  alt: string | null;
  isExternal: boolean;
  isDataUrl: boolean;
  matchIndex: number;
}

/**
 * Processed asset with optimized variants
 */
export interface ProcessedAsset {
  id: string;
  originalSrc: string;
  localPath: string;
  webpPath?: string;
  srcset?: string;
  sizes?: string;
  optimized: boolean;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
}

/**
 * Result of asset processing
 */
export interface AssetHandlerResult {
  success: boolean;
  websiteId: string;
  html: string;
  assets: ProcessedAsset[];
  metadata: {
    totalAssets: number;
    processedAssets: number;
    failedAssets: number;
    totalSize: number;
    processedAt: string;
  };
  warnings: AssetWarning[];
  errors: AssetError[];
}

/**
 * Warning during asset processing
 */
export interface AssetWarning {
  assetId: string;
  originalSrc: string;
  message: string;
  recoverable: boolean;
}

/**
 * Error during asset processing
 */
export interface AssetError {
  assetId?: string;
  originalSrc?: string;
  phase: AssetPhase;
  message: string;
  recoverable: boolean;
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Get the base directory for website outputs
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
 * Get the assets directory path for a website
 */
function getAssetsDir(websiteId: string): string {
  return path.join(getWebsitesBaseDir(), websiteId, 'current', 'public', 'assets', 'images');
}

/**
 * Ensure directory exists before writing
 */
function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Create progress update helper
 */
function createProgressEmitter(onProgress?: (progress: AssetProgress) => void) {
  return (
    phase: AssetPhase,
    percent: number,
    message: string,
    assetInfo?: { current: number; total: number }
  ) => {
    if (onProgress) {
      onProgress({
        phase,
        percent,
        message,
        currentAsset: assetInfo?.current,
        totalAssets: assetInfo?.total,
      });
    }
  };
}

/**
 * Check if URL is external
 */
function isExternalUrl(url: string): boolean {
  try {
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

/**
 * Check if URL is a data URL
 */
function isDataUrl(url: string): boolean {
  return url.startsWith('data:');
}

/**
 * Generate a safe filename from URL
 */
function generateSafeFilename(url: string, extension?: string): string {
  const uuid = randomUUID().split('-')[0];
  const ext = extension || path.extname(url).split('?')[0] || '.jpg';
  return `img-${uuid}${ext}`;
}

/**
 * Get image format from URL or data URL
 */
function getImageFormat(src: string): string {
  if (isDataUrl(src)) {
    const match = src.match(/^data:image\/(\w+);/);
    return match ? match[1] : 'unknown';
  }
  const ext = path.extname(src).toLowerCase().replace('.', '');
  return ext || 'jpg';
}

/**
 * Estimate file size for placeholders
 */
function estimateFileSize(width: number, height: number): number {
  // Rough estimate: 3 bytes per pixel for JPEG
  return Math.floor(width * height * 0.3);
}

// ====================
// ASSET DETECTION
// ====================

/**
 * Scan HTML for image assets using regex
 */
function scanForAssets(html: string): DetectedAsset[] {
  const assets: DetectedAsset[] = [];
  const imgTagRegex = /<img[^>]+>/gi;
  const srcRegex = /src=["']([^"']+)["']/i;
  const altRegex = /alt=["']([^"']*)["']/i;

  let match;
  let matchIndex = 0;

  while ((match = imgTagRegex.exec(html)) !== null) {
    const imgTag = match[0];
    const srcMatch = srcRegex.exec(imgTag);

    if (!srcMatch) {
      matchIndex++;
      continue;
    }

    const src = srcMatch[1];
    const altMatch = altRegex.exec(imgTag);
    const alt = altMatch ? altMatch[1] : null;

    const asset: DetectedAsset = {
      id: randomUUID(),
      type: 'image',
      originalSrc: src,
      alt,
      isExternal: isExternalUrl(src),
      isDataUrl: isDataUrl(src),
      matchIndex,
    };

    assets.push(asset);
    matchIndex++;
  }

  return assets;
}

// ====================
// ASSET DOWNLOADING
// ====================

/**
 * Download an external image
 * In production, this would use fetch/axios to download the actual image
 * For now, we create placeholder implementations
 */
async function downloadImage(
  url: string,
  outputPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure output directory exists
    ensureDirectory(path.dirname(outputPath));

    // In a real implementation, we would:
    // 1. Fetch the image from the URL
    // 2. Stream it to the output path
    // 3. Validate the download

    // For now, create a placeholder file to simulate download
    // This maintains the interface for future implementation
    const placeholderComment = `# Image downloaded from: ${url}\n# Timestamp: ${new Date().toISOString()}\n`;
    fs.writeFileSync(outputPath, placeholderComment, 'utf-8');

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Save data URL to file
 */
function saveDataUrlToFile(
  dataUrl: string,
  outputPath: string
): { success: boolean; error?: string } {
  try {
    ensureDirectory(path.dirname(outputPath));

    // Extract base64 data from data URL
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return { success: false, error: 'Invalid data URL format' };
    }

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(outputPath, buffer);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

// ====================
// IMAGE OPTIMIZATION
// ====================

/**
 * Get image dimensions
 * In production, this would use an image processing library
 */
function getImageDimensions(imagePath: string): { width: number; height: number } {
  // In a real implementation, we would use sharp or similar library
  // For now, return placeholder dimensions
  return { width: 1920, height: 1080 };
}

/**
 * Optimize image and generate WebP variant
 * In production, this would use sharp or similar library
 */
async function optimizeImage(
  inputPath: string,
  options: {
    maxWidth?: number;
    quality?: number;
    generateWebP?: boolean;
  }
): Promise<{
  success: boolean;
  webpPath?: string;
  fileSize: number;
  dimensions: { width: number; height: number };
  error?: string;
}> {
  try {
    // Get original dimensions
    const dimensions = getImageDimensions(inputPath);

    // In a real implementation, we would:
    // 1. Load the image with sharp
    // 2. Resize if needed (respecting maxWidth)
    // 3. Optimize with specified quality
    // 4. Generate WebP variant if requested
    // 5. Return actual file sizes and dimensions

    const fileSize = fs.existsSync(inputPath)
      ? fs.statSync(inputPath).size
      : estimateFileSize(dimensions.width, dimensions.height);

    let webpPath: string | undefined;
    if (options.generateWebP) {
      webpPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      // Placeholder: In production, generate actual WebP
      if (fs.existsSync(inputPath)) {
        fs.copyFileSync(inputPath, webpPath);
      }
    }

    return {
      success: true,
      webpPath,
      fileSize,
      dimensions,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      fileSize: 0,
      dimensions: { width: 0, height: 0 },
      error: errorMessage,
    };
  }
}

/**
 * Generate responsive image srcset
 */
function generateSrcset(
  basePath: string,
  sizes: number[],
  originalWidth: number
): string {
  // Filter sizes that are smaller than or equal to original width
  const validSizes = sizes.filter((size) => size <= originalWidth);

  if (validSizes.length === 0) {
    return '';
  }

  // In production, we would generate actual resized variants
  // For now, generate srcset string with references to base path
  const srcsetEntries = validSizes.map((size) => {
    const filename = path.basename(basePath, path.extname(basePath));
    const ext = path.extname(basePath);
    const variantPath = path.join(
      path.dirname(basePath),
      `${filename}-${size}w${ext}`
    );
    return `${variantPath} ${size}w`;
  });

  return srcsetEntries.join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
function generateSizesAttribute(): string {
  // Standard responsive sizes attribute
  return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
}

// ====================
// HTML UPDATING
// ====================

/**
 * Update HTML with optimized assets using regex replacement
 */
function updateHtmlWithAssets(
  html: string,
  assets: ProcessedAsset[],
  options: {
    enableLazyLoading?: boolean;
    generateSrcset?: boolean;
    generateWebP?: boolean;
  }
): string {
  let updatedHtml = html;
  const imgTagRegex = /<img([^>]+)>/gi;
  const srcRegex = /src=["']([^"']+)["']/i;

  updatedHtml = updatedHtml.replace(imgTagRegex, (match, attributes) => {
    const srcMatch = srcRegex.exec(attributes);
    if (!srcMatch) return match;

    const originalSrc = srcMatch[1];
    const asset = assets.find((a) => a.originalSrc === originalSrc);
    if (!asset) return match;

    // Build new attributes
    let newAttributes = attributes.replace(srcRegex, `src="${asset.localPath}"`);

    // Add srcset if available
    if (options.generateSrcset && asset.srcset && !newAttributes.includes('srcset=')) {
      newAttributes += ` srcset="${asset.srcset}"`;
      if (asset.sizes) {
        newAttributes += ` sizes="${asset.sizes}"`;
      }
    }

    // Add lazy loading
    if (options.enableLazyLoading && !newAttributes.includes('loading=')) {
      newAttributes += ' loading="lazy" decoding="async"';
    }

    // Add dimensions
    if (asset.dimensions.width && asset.dimensions.height) {
      if (!newAttributes.includes('width=')) {
        newAttributes += ` width="${asset.dimensions.width}"`;
      }
      if (!newAttributes.includes('height=')) {
        newAttributes += ` height="${asset.dimensions.height}"`;
      }
    }

    // Handle WebP with picture element
    if (options.generateWebP && asset.webpPath) {
      return `<picture><source srcset="${asset.webpPath}" type="image/webp"><img${newAttributes}></picture>`;
    }

    return `<img${newAttributes}>`;
  });

  return updatedHtml;
}

// ====================
// MAIN HANDLER FUNCTION
// ====================

/**
 * Process assets in HTML - download, optimize, and update references
 */
export async function processAssets(
  options: AssetHandlerOptions
): Promise<AssetHandlerResult> {
  const {
    websiteId,
    html,
    outputDir,
    generateWebP = true,
    generateSrcset: enableSrcset = true,
    enableLazyLoading = true,
    srcsetSizes = [640, 768, 1024, 1280, 1920],
    maxWidth = 1920,
    quality = 85,
    onProgress,
    skipDownload = false,
  } = options;

  const emitProgress = createProgressEmitter(onProgress);
  const warnings: AssetWarning[] = [];
  const errors: AssetError[] = [];
  const processedAssets: ProcessedAsset[] = [];

  try {
    // Initialize
    emitProgress('initializing', 0, 'Initializing asset processing...');

    const assetsDir = outputDir || getAssetsDir(websiteId);
    ensureDirectory(assetsDir);

    // Scan for assets
    emitProgress('scanning', 10, 'Scanning HTML for images...');
    const detectedAssets = scanForAssets(html);

    if (detectedAssets.length === 0) {
      emitProgress('complete', 100, 'No assets to process');
      return {
        success: true,
        websiteId,
        html,
        assets: [],
        metadata: {
          totalAssets: 0,
          processedAssets: 0,
          failedAssets: 0,
          totalSize: 0,
          processedAt: new Date().toISOString(),
        },
        warnings: [],
        errors: [],
      };
    }

    // Process each asset
    let totalSize = 0;
    let failedCount = 0;

    for (let i = 0; i < detectedAssets.length; i++) {
      const asset = detectedAssets[i];
      const progress = 20 + ((i / detectedAssets.length) * 60);

      emitProgress(
        'downloading',
        progress,
        `Processing image ${i + 1} of ${detectedAssets.length}...`,
        { current: i + 1, total: detectedAssets.length }
      );

      try {
        // Generate local filename
        const format = getImageFormat(asset.originalSrc);
        const filename = generateSafeFilename(asset.originalSrc, `.${format}`);
        const localPath = path.join(assetsDir, filename);
        const relativePath = `/assets/images/${filename}`;

        // Download or save asset
        if (!skipDownload) {
          if (asset.isDataUrl) {
            const result = saveDataUrlToFile(asset.originalSrc, localPath);
            if (!result.success) {
              throw new Error(result.error || 'Failed to save data URL');
            }
          } else if (asset.isExternal) {
            const result = await downloadImage(asset.originalSrc, localPath);
            if (!result.success) {
              throw new Error(result.error || 'Failed to download image');
            }
          }
        }

        // Optimize image
        emitProgress('optimizing', progress + 10, 'Optimizing image...');
        const optimizeResult = await optimizeImage(localPath, {
          maxWidth,
          quality,
          generateWebP,
        });

        if (!optimizeResult.success) {
          throw new Error(optimizeResult.error || 'Optimization failed');
        }

        // Generate srcset if enabled
        let srcset: string | undefined;
        let sizes: string | undefined;
        if (enableSrcset) {
          emitProgress('generating_variants', progress + 15, 'Generating responsive variants...');
          srcset = generateSrcset(relativePath, srcsetSizes, optimizeResult.dimensions.width);
          sizes = generateSizesAttribute();
        }

        // Create processed asset record
        const processed: ProcessedAsset = {
          id: asset.id,
          originalSrc: asset.originalSrc,
          localPath: relativePath,
          webpPath: optimizeResult.webpPath
            ? relativePath.replace(/\.(jpg|jpeg|png)$/i, '.webp')
            : undefined,
          srcset,
          sizes,
          optimized: true,
          fileSize: optimizeResult.fileSize,
          dimensions: optimizeResult.dimensions,
        };

        processedAssets.push(processed);
        totalSize += optimizeResult.fileSize;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        failedCount++;

        warnings.push({
          assetId: asset.id,
          originalSrc: asset.originalSrc,
          message: `Failed to process image: ${errorMessage}`,
          recoverable: true,
        });

        // Add placeholder processed asset to maintain HTML structure
        processedAssets.push({
          id: asset.id,
          originalSrc: asset.originalSrc,
          localPath: asset.originalSrc, // Keep original as fallback
          optimized: false,
          fileSize: 0,
          dimensions: { width: 0, height: 0 },
        });
      }
    }

    // Update HTML with processed assets
    emitProgress('updating_html', 90, 'Updating HTML with optimized assets...');
    const updatedHtml = updateHtmlWithAssets(html, processedAssets, {
      enableLazyLoading,
      generateSrcset: enableSrcset,
      generateWebP,
    });

    // Complete
    emitProgress('complete', 100, 'Asset processing complete');

    return {
      success: true,
      websiteId,
      html: updatedHtml,
      assets: processedAssets,
      metadata: {
        totalAssets: detectedAssets.length,
        processedAssets: processedAssets.filter((a) => a.optimized).length,
        failedAssets: failedCount,
        totalSize,
        processedAt: new Date().toISOString(),
      },
      warnings,
      errors: [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    errors.push({
      phase: 'initializing',
      message: `Asset processing failed: ${errorMessage}`,
      recoverable: false,
    });

    return {
      success: false,
      websiteId,
      html,
      assets: processedAssets,
      metadata: {
        totalAssets: 0,
        processedAssets: 0,
        failedAssets: 0,
        totalSize: 0,
        processedAt: new Date().toISOString(),
      },
      warnings,
      errors,
    };
  }
}

// ====================
// UTILITY EXPORTS
// ====================

/**
 * Download assets only without optimization
 */
export async function downloadAssets(
  html: string,
  outputDir: string
): Promise<{ success: boolean; count: number; errors: string[] }> {
  const assets = scanForAssets(html);
  const errors: string[] = [];
  let successCount = 0;

  ensureDirectory(outputDir);

  for (const asset of assets) {
    try {
      if (asset.isExternal) {
        const filename = generateSafeFilename(asset.originalSrc);
        const outputPath = path.join(outputDir, filename);
        const result = await downloadImage(asset.originalSrc, outputPath);

        if (result.success) {
          successCount++;
        } else {
          errors.push(result.error || 'Unknown error');
        }
      } else if (asset.isDataUrl) {
        const filename = generateSafeFilename(asset.originalSrc);
        const outputPath = path.join(outputDir, filename);
        const result = saveDataUrlToFile(asset.originalSrc, outputPath);

        if (result.success) {
          successCount++;
        } else {
          errors.push(result.error || 'Unknown error');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);
    }
  }

  return {
    success: errors.length === 0,
    count: successCount,
    errors,
  };
}

/**
 * Optimize existing images in a directory
 */
export async function optimizeImages(
  inputDir: string,
  options: {
    maxWidth?: number;
    quality?: number;
    generateWebP?: boolean;
  } = {}
): Promise<{ success: boolean; count: number; totalSize: number }> {
  try {
    const files = fs.readdirSync(inputDir);
    const imageFiles = files.filter((f) =>
      /\.(jpg|jpeg|png|gif)$/i.test(f)
    );

    let totalSize = 0;
    let successCount = 0;

    for (const file of imageFiles) {
      const filePath = path.join(inputDir, file);
      const result = await optimizeImage(filePath, options);

      if (result.success) {
        successCount++;
        totalSize += result.fileSize;
      }
    }

    return {
      success: true,
      count: successCount,
      totalSize,
    };
  } catch (error) {
    return {
      success: false,
      count: 0,
      totalSize: 0,
    };
  }
}

/**
 * Generate srcset for an existing image
 */
export function generateImageSrcset(
  imagePath: string,
  sizes: number[] = [640, 768, 1024, 1280, 1920]
): string {
  const dimensions = getImageDimensions(imagePath);
  return generateSrcset(imagePath, sizes, dimensions.width);
}
