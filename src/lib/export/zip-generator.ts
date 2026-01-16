/**
 * ZIP Generator Module
 *
 * This module packages export files into downloadable ZIP archives using archiver.
 * It supports both file-based and streaming ZIP generation for efficient handling
 * of large export packages.
 *
 * Features:
 * - Stream-based ZIP creation for memory efficiency
 * - Progress tracking for large archives
 * - Recursive directory packaging
 * - File path sanitization for cross-platform compatibility
 * - Compression level control
 * - Size estimation and reporting
 *
 * Coordinates with:
 * - nextjs-exporter: For packaging Next.js projects
 * - static-exporter: For packaging static HTML/CSS bundles
 * - components-exporter: For packaging React component libraries
 */

import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Phase of the ZIP generation process
 */
export type ZipPhase =
  | 'initializing'
  | 'scanning_files'
  | 'creating_archive'
  | 'compressing'
  | 'finalizing'
  | 'complete';

/**
 * Progress update for the ZIP generation process
 */
export interface ZipProgress {
  phase: ZipPhase;
  percent: number;
  message: string;
  currentFile?: string;
  totalFiles?: number;
  processedFiles?: number;
  bytesProcessed?: number;
  totalBytes?: number;
}

/**
 * Options for ZIP generation
 */
export interface ZipOptions {
  /** Input directory to package */
  sourceDir: string;
  /** Output ZIP file path */
  outputPath: string;
  /** Compression level (0-9, default: 9) */
  compressionLevel?: number;
  /** Include hidden files (default: false) */
  includeHidden?: boolean;
  /** Callback for progress updates */
  onProgress?: (progress: ZipProgress) => void;
  /** Files/directories to exclude (glob patterns) */
  exclude?: string[];
  /** Custom archive name (defaults to directory name) */
  archiveName?: string;
}

/**
 * Result of ZIP generation
 */
export interface ZipResult {
  success: boolean;
  outputPath: string;
  fileCount: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  duration: number;
  error?: string;
}

/**
 * Options for streaming ZIP generation
 */
export interface StreamZipOptions {
  /** Input directory to package */
  sourceDir: string;
  /** Compression level (0-9, default: 9) */
  compressionLevel?: number;
  /** Include hidden files (default: false) */
  includeHidden?: boolean;
  /** Callback for progress updates */
  onProgress?: (progress: ZipProgress) => void;
  /** Files/directories to exclude (glob patterns) */
  exclude?: string[];
}

/**
 * File entry information
 */
interface FileEntry {
  path: string;
  size: number;
  isDirectory: boolean;
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Create progress update helper
 */
function createProgressEmitter(onProgress?: (progress: ZipProgress) => void) {
  return (
    phase: ZipPhase,
    percent: number,
    message: string,
    fileInfo?: {
      current?: string;
      total?: number;
      processed?: number;
      bytesProcessed?: number;
      totalBytes?: number;
    }
  ) => {
    if (onProgress) {
      onProgress({
        phase,
        percent,
        message,
        currentFile: fileInfo?.current,
        totalFiles: fileInfo?.total,
        processedFiles: fileInfo?.processed,
        bytesProcessed: fileInfo?.bytesProcessed,
        totalBytes: fileInfo?.totalBytes,
      });
    }
  };
}

/**
 * Validate source directory exists
 */
function validateSourceDirectory(sourceDir: string): void {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory does not exist: ${sourceDir}`);
  }

  const stats = fs.statSync(sourceDir);
  if (!stats.isDirectory()) {
    throw new Error(`Source path is not a directory: ${sourceDir}`);
  }
}

/**
 * Ensure output directory exists
 */
function ensureOutputDirectory(outputPath: string): void {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

/**
 * Sanitize file path for cross-platform compatibility
 */
function sanitizeFilePath(filePath: string): string {
  return filePath
    .replace(/\\/g, '/')
    .replace(/[<>:"|?*]/g, '_')
    .replace(/\.+\//g, './');
}

/**
 * Check if file should be excluded
 */
function shouldExclude(filePath: string, excludePatterns: string[]): boolean {
  if (excludePatterns.length === 0) return false;

  const normalizedPath = filePath.replace(/\\/g, '/');

  return excludePatterns.some((pattern) => {
    const normalizedPattern = pattern.replace(/\\/g, '/');

    // Handle glob-style patterns
    if (pattern.includes('*')) {
      const regexPattern = normalizedPattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');
      return new RegExp(regexPattern).test(normalizedPath);
    }

    // Handle exact matches
    return normalizedPath.includes(normalizedPattern);
  });
}

/**
 * Recursively scan directory and collect file entries
 */
function scanDirectory(
  dirPath: string,
  includeHidden: boolean = false,
  excludePatterns: string[] = []
): FileEntry[] {
  const entries: FileEntry[] = [];

  function traverse(currentPath: string, relativePath: string = ''): void {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      // Skip hidden files if not included
      if (!includeHidden && item.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(currentPath, item);
      const relPath = path.join(relativePath, item);

      // Skip excluded files
      if (shouldExclude(relPath, excludePatterns)) {
        continue;
      }

      const stats = fs.statSync(fullPath);

      entries.push({
        path: relPath,
        size: stats.size,
        isDirectory: stats.isDirectory(),
      });

      if (stats.isDirectory()) {
        traverse(fullPath, relPath);
      }
    }
  }

  traverse(dirPath);
  return entries;
}

/**
 * Calculate total size of files to be archived
 */
function calculateTotalSize(entries: FileEntry[]): number {
  return entries.reduce((total, entry) => {
    return entry.isDirectory ? total : total + entry.size;
  }, 0);
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ====================
// CORE FUNCTIONS
// ====================

/**
 * Generate a ZIP archive from a directory
 *
 * This function packages an entire directory structure into a ZIP file with
 * progress tracking and error handling. Suitable for server-side generation
 * where the output is written to disk.
 *
 * @param options - ZIP generation options
 * @returns Promise resolving to ZIP generation result
 *
 * @example
 * ```typescript
 * const result = await generateZip({
 *   sourceDir: './exports/my-website/nextjs',
 *   outputPath: './downloads/my-website.zip',
 *   compressionLevel: 9,
 *   onProgress: (progress) => {
 *     console.log(`${progress.phase}: ${progress.percent}%`);
 *   }
 * });
 * ```
 */
export async function generateZip(options: ZipOptions): Promise<ZipResult> {
  const {
    sourceDir,
    outputPath,
    compressionLevel = 9,
    includeHidden = false,
    onProgress,
    exclude = [],
  } = options;

  const startTime = Date.now();
  const emitProgress = createProgressEmitter(onProgress);

  try {
    // Phase 1: Initialization
    emitProgress('initializing', 0, 'Initializing ZIP generation');

    validateSourceDirectory(sourceDir);
    ensureOutputDirectory(outputPath);

    // Phase 2: Scan files
    emitProgress('scanning_files', 10, 'Scanning directory structure');

    const entries = scanDirectory(sourceDir, includeHidden, exclude);
    const fileEntries = entries.filter((e) => !e.isDirectory);
    const totalSize = calculateTotalSize(entries);

    emitProgress('scanning_files', 20, `Found ${fileEntries.length} files (${formatBytes(totalSize)})`);

    // Phase 3: Create archive
    emitProgress('creating_archive', 25, 'Creating ZIP archive');

    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: compressionLevel },
    });

    let processedFiles = 0;
    let bytesProcessed = 0;

    // Track progress during archiving
    archive.on('entry', (entry) => {
      if (entry.stats?.size) {
        bytesProcessed += entry.stats.size;
        processedFiles++;

        const percent = 25 + Math.floor((bytesProcessed / totalSize) * 65);

        emitProgress('compressing', percent, `Compressing files (${processedFiles}/${fileEntries.length})`, {
          current: entry.name,
          total: fileEntries.length,
          processed: processedFiles,
          bytesProcessed,
          totalBytes: totalSize,
        });
      }
    });

    // Handle archive errors
    archive.on('error', (err) => {
      throw err;
    });

    // Pipe archive to output stream
    archive.pipe(output);

    // Add directory to archive with base path
    const baseName = path.basename(sourceDir);
    archive.directory(sourceDir, baseName);

    // Phase 4: Finalize
    emitProgress('finalizing', 90, 'Finalizing ZIP archive');

    await archive.finalize();

    // Wait for stream to finish
    await new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      output.on('error', reject);
    });

    // Calculate final statistics
    const compressedSize = fs.statSync(outputPath).size;
    const compressionRatio = totalSize > 0 ? (1 - compressedSize / totalSize) * 100 : 0;
    const duration = Date.now() - startTime;

    // Phase 5: Complete
    emitProgress('complete', 100, `ZIP created successfully (${formatBytes(compressedSize)})`);

    return {
      success: true,
      outputPath,
      fileCount: fileEntries.length,
      originalSize: totalSize,
      compressedSize,
      compressionRatio,
      duration,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      outputPath,
      fileCount: 0,
      originalSize: 0,
      compressedSize: 0,
      compressionRatio: 0,
      duration: Date.now() - startTime,
      error: `ZIP generation failed: ${errorMessage}`,
    };
  }
}

/**
 * Package an export directory into a ZIP archive
 *
 * Convenience wrapper around generateZip with sensible defaults for export packaging.
 * Automatically names the ZIP based on the source directory and places it in the
 * standard downloads location.
 *
 * @param sourceDir - Directory containing export files
 * @param exportType - Type of export (nextjs, static, components)
 * @param websiteId - Website identifier for naming
 * @param onProgress - Optional progress callback
 * @returns Promise resolving to ZIP generation result
 *
 * @example
 * ```typescript
 * const result = await packageExport(
 *   './exports/my-site/nextjs',
 *   'nextjs',
 *   'my-site',
 *   (progress) => console.log(progress.percent)
 * );
 * ```
 */
export async function packageExport(
  sourceDir: string,
  exportType: 'nextjs' | 'static' | 'components',
  websiteId: string,
  onProgress?: (progress: ZipProgress) => void
): Promise<ZipResult> {
  const sanitizedId = websiteId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const timestamp = new Date().toISOString().split('T')[0];
  const zipName = `${sanitizedId}-${exportType}-${timestamp}.zip`;

  const downloadsDir = path.join(process.cwd(), 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  const outputPath = path.join(downloadsDir, zipName);

  // Exclude common development artifacts
  const defaultExcludes = [
    'node_modules',
    '.next',
    '.git',
    '.DS_Store',
    'Thumbs.db',
    '*.log',
    '.env.local',
  ];

  return generateZip({
    sourceDir,
    outputPath,
    compressionLevel: 9,
    includeHidden: false,
    exclude: defaultExcludes,
    onProgress,
  });
}

/**
 * Create a streaming ZIP archive
 *
 * Generates a ZIP archive and returns a readable stream instead of writing to disk.
 * Useful for serving downloads directly through HTTP responses without intermediate
 * disk storage.
 *
 * @param options - Stream ZIP options
 * @returns Readable stream of ZIP data
 *
 * @example
 * ```typescript
 * // In an API route or server action
 * const stream = await streamZip({
 *   sourceDir: './exports/my-website/nextjs',
 *   compressionLevel: 6, // Faster for streaming
 *   onProgress: (progress) => {
 *     // Send progress via SSE or WebSocket
 *   }
 * });
 *
 * // Pipe to HTTP response
 * response.setHeader('Content-Type', 'application/zip');
 * response.setHeader('Content-Disposition', 'attachment; filename="export.zip"');
 * stream.pipe(response);
 * ```
 */
export async function streamZip(
  options: StreamZipOptions
): Promise<archiver.Archiver> {
  const {
    sourceDir,
    compressionLevel = 6, // Lower compression for faster streaming
    includeHidden = false,
    onProgress,
    exclude = [],
  } = options;

  const emitProgress = createProgressEmitter(onProgress);

  // Validate source
  validateSourceDirectory(sourceDir);

  emitProgress('initializing', 0, 'Preparing ZIP stream');

  // Scan files for progress tracking
  const entries = scanDirectory(sourceDir, includeHidden, exclude);
  const fileEntries = entries.filter((e) => !e.isDirectory);
  const totalSize = calculateTotalSize(entries);

  emitProgress('scanning_files', 10, `Found ${fileEntries.length} files`);

  // Create archive
  const archive = archiver('zip', {
    zlib: { level: compressionLevel },
  });

  let processedFiles = 0;
  let bytesProcessed = 0;

  // Track progress
  archive.on('entry', (entry) => {
    if (entry.stats?.size) {
      bytesProcessed += entry.stats.size;
      processedFiles++;

      const percent = 10 + Math.floor((bytesProcessed / totalSize) * 80);

      emitProgress('compressing', percent, `Streaming ${processedFiles}/${fileEntries.length} files`, {
        current: entry.name,
        total: fileEntries.length,
        processed: processedFiles,
        bytesProcessed,
        totalBytes: totalSize,
      });
    }
  });

  // Handle errors
  archive.on('error', (err) => {
    throw err;
  });

  // Track finalization
  archive.on('end', () => {
    emitProgress('complete', 100, 'Stream complete');
  });

  emitProgress('creating_archive', 15, 'Building archive');

  // Add directory to archive
  const baseName = path.basename(sourceDir);
  archive.directory(sourceDir, baseName);

  // Finalize (this triggers the streaming)
  archive.finalize();

  return archive;
}

/**
 * Get ZIP generation summary
 *
 * Generates a human-readable summary of ZIP generation results for logging
 * or user feedback.
 *
 * @param result - ZIP generation result
 * @returns Formatted summary string
 */
export function getZipSummary(result: ZipResult): string {
  if (!result.success) {
    return `ZIP generation failed: ${result.error}`;
  }

  const lines = [
    'ZIP Generation Summary:',
    `- Output: ${result.outputPath}`,
    `- Files: ${result.fileCount}`,
    `- Original size: ${formatBytes(result.originalSize)}`,
    `- Compressed size: ${formatBytes(result.compressedSize)}`,
    `- Compression ratio: ${result.compressionRatio.toFixed(2)}%`,
    `- Duration: ${(result.duration / 1000).toFixed(2)}s`,
  ];

  return lines.join('\n');
}

/**
 * Check if a directory is ready for ZIP packaging
 *
 * Validates that a directory exists, is not empty, and contains valid files.
 *
 * @param dirPath - Directory path to check
 * @returns True if directory is ready for packaging
 */
export function isReadyForZip(dirPath: string): boolean {
  try {
    validateSourceDirectory(dirPath);

    const entries = scanDirectory(dirPath, false, []);
    const fileEntries = entries.filter((e) => !e.isDirectory);

    return fileEntries.length > 0;
  } catch {
    return false;
  }
}
