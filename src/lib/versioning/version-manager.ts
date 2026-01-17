/**
 * Version Manager
 *
 * Handles version numbering, CRUD operations, and filesystem management
 * for website versions. Implements semantic versioning (1.0, 1.1, 2.0)
 * with automatic version directory management and current/ symlink updates.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  getVersions,
  getVersionById,
  createVersion,
  setActiveVersion as dbSetActiveVersion,
  getActiveVersion,
  createVersionFilesBatch,
  getVersionFiles,
} from '@/lib/db/client';
import type { Version, VersionInsert, VersionFileInsert } from '@/types';

// ====================
// INTERFACES
// ====================

/**
 * Change type for version numbering
 */
export type ChangeType = 'initial' | 'edit' | 'regeneration';

/**
 * Parsed semantic version
 */
export interface ParsedVersion {
  major: number;
  minor: number;
}

/**
 * Options for creating a new version
 */
export interface CreateVersionOptions {
  websiteId: string;
  versionNumber: string;
  sourceDir: string;
  tokensJson?: string;
  changelog?: string;
  accuracyScore?: number;
  parentVersionId?: string;
  setActive?: boolean;
}

/**
 * Result of version creation
 */
export interface CreateVersionResult {
  version: Version;
  versionPath: string;
  filesCopied: number;
}

// ====================
// CONFIGURATION
// ====================

/**
 * Get the base websites directory from environment or use default
 */
function getWebsitesDir(): string {
  return process.env.WEBSITES_DIR || path.resolve(process.cwd(), 'Websites');
}

/**
 * Get the base website directory for a given website ID
 */
export function getWebsiteDir(websiteId: string): string {
  return path.join(getWebsitesDir(), websiteId);
}

/**
 * Get the versions directory for a website
 */
function getVersionsDir(websiteId: string): string {
  return path.join(getWebsiteDir(websiteId), 'versions');
}

/**
 * Get the path to a specific version directory
 */
export function getVersionPath(websiteId: string, versionNumber: string): string {
  return path.join(getVersionsDir(websiteId), `v${versionNumber}`);
}

/**
 * Get the path to the current/ symlink
 */
export function getCurrentPath(websiteId: string): string {
  return path.join(getWebsiteDir(websiteId), 'current');
}

// ====================
// VERSION NUMBERING
// ====================

/**
 * Parse a semantic version string into major and minor components
 *
 * @param versionString - Version string like "1.0", "1.2", "2.0"
 * @returns Parsed version object
 */
export function parseVersion(versionString: string): ParsedVersion {
  const parts = versionString.split('.');
  if (parts.length !== 2) {
    throw new Error(`Invalid version format: ${versionString}`);
  }

  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1], 10);

  if (isNaN(major) || isNaN(minor)) {
    throw new Error(`Invalid version format: ${versionString}`);
  }

  return { major, minor };
}

/**
 * Format a version object into a string
 *
 * @param major - Major version number
 * @param minor - Minor version number
 * @returns Version string like "1.0"
 */
export function formatVersion(major: number, minor: number): string {
  return `${major}.${minor}`;
}

/**
 * Get the next version number based on change type
 *
 * @param websiteId - Website ID
 * @param changeType - Type of change: 'initial', 'edit', or 'regeneration'
 * @returns Next version number string
 */
export function getNextVersionNumber(
  websiteId: string,
  changeType: ChangeType
): string {
  const versions = getVersions(websiteId);

  // If no versions exist, start at 1.0
  if (versions.length === 0) {
    return '1.0';
  }

  // Get the latest version (versions are sorted by created_at DESC)
  const latestVersion = versions[0];
  const parsed = parseVersion(latestVersion.version_number);

  switch (changeType) {
    case 'initial':
      // Should only be used when no versions exist, but handle it
      return '1.0';

    case 'edit':
      // Increment minor version: 1.0 -> 1.1, 1.1 -> 1.2
      return formatVersion(parsed.major, parsed.minor + 1);

    case 'regeneration':
      // Increment major version, reset minor: 1.x -> 2.0, 2.x -> 3.0
      return formatVersion(parsed.major + 1, 0);

    default:
      throw new Error(`Unknown change type: ${changeType}`);
  }
}

// ====================
// FILESYSTEM OPERATIONS
// ====================

/**
 * Ensure the versions directory exists for a website
 *
 * @param websiteId - Website ID
 */
function ensureVersionsDirectory(websiteId: string): void {
  const versionsDir = getVersionsDir(websiteId);
  if (!fs.existsSync(versionsDir)) {
    fs.mkdirSync(versionsDir, { recursive: true });
  }
}

/**
 * Calculate file hash for version tracking
 *
 * @param filePath - Path to file
 * @returns SHA256 hash of file contents
 */
function calculateFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Copy all files from source directory to destination directory
 * Returns array of copied file paths relative to destination
 *
 * @param sourceDir - Source directory path
 * @param destDir - Destination directory path
 * @returns Array of relative file paths that were copied
 */
function copyVersionFiles(sourceDir: string, destDir: string): string[] {
  const copiedFiles: string[] = [];

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory does not exist: ${sourceDir}`);
  }

  // Create destination directory
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Recursively copy files
  function copyRecursive(src: string, dest: string, relativePath: string = '') {
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      const relPath = path.join(relativePath, entry.name);

      if (entry.isDirectory()) {
        // Create directory and recurse
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyRecursive(srcPath, destPath, relPath);
      } else if (entry.isFile()) {
        // Copy file
        fs.copyFileSync(srcPath, destPath);
        copiedFiles.push(relPath);
      }
    }
  }

  copyRecursive(sourceDir, destDir);
  return copiedFiles;
}

/**
 * Update the current/ symlink to point to a version
 * On Windows, uses junctions instead of symlinks (no admin rights required)
 *
 * @param websiteId - Website ID
 * @param versionNumber - Version number to point to
 */
export function updateCurrentSymlink(
  websiteId: string,
  versionNumber: string
): void {
  const currentPath = getCurrentPath(websiteId);
  const versionPath = getVersionPath(websiteId, versionNumber);
  const isWindows = process.platform === 'win32';

  // Remove existing symlink/junction if it exists
  if (fs.existsSync(currentPath)) {
    // Check if it's a symlink/junction before removing
    const stats = fs.lstatSync(currentPath);
    if (stats.isSymbolicLink()) {
      fs.unlinkSync(currentPath);
    } else if (isWindows) {
      // On Windows, junctions appear as directories, check for reparse point
      try {
        fs.rmSync(currentPath, { recursive: false });
      } catch {
        throw new Error(
          `current/ path exists but could not be removed: ${currentPath}`
        );
      }
    } else {
      // If it's a real directory, throw an error - we don't want to delete it
      throw new Error(
        `current/ path exists but is not a symlink: ${currentPath}`
      );
    }
  }

  if (isWindows) {
    // On Windows, use junction type which doesn't require admin privileges
    // Junctions require absolute paths
    fs.symlinkSync(versionPath, currentPath, 'junction');
  } else {
    // On Unix/macOS, use relative path for portability
    const relativeVersionPath = path.relative(
      path.dirname(currentPath),
      versionPath
    );
    fs.symlinkSync(relativeVersionPath, currentPath, 'dir');
  }
}

// ====================
// VERSION CRUD OPERATIONS
// ====================

/**
 * Create a new version with files and database record
 *
 * @param options - Version creation options
 * @returns Created version, path, and file count
 */
export function createNewVersion(
  options: CreateVersionOptions
): CreateVersionResult {
  const {
    websiteId,
    versionNumber,
    sourceDir,
    tokensJson,
    changelog,
    accuracyScore,
    parentVersionId,
    setActive = true,
  } = options;

  // Validate version number format
  parseVersion(versionNumber); // Will throw if invalid

  // Ensure versions directory exists
  ensureVersionsDirectory(websiteId);

  // Get version path
  const versionPath = getVersionPath(websiteId, versionNumber);

  // Check if version already exists
  if (fs.existsSync(versionPath)) {
    throw new Error(`Version ${versionNumber} already exists at ${versionPath}`);
  }

  // Copy files from source to version directory
  const copiedFiles = copyVersionFiles(sourceDir, versionPath);

  // Create version file records with hashes
  const versionFileInserts: VersionFileInsert[] = copiedFiles.map((filePath) => {
    const fullPath = path.join(versionPath, filePath);
    return {
      version_id: '', // Will be set after version is created
      file_path: filePath,
      file_hash: calculateFileHash(fullPath),
    };
  });

  // Create version database record
  const versionInsert: VersionInsert = {
    website_id: websiteId,
    version_number: versionNumber,
    tokens_json: tokensJson ?? null,
    changelog: changelog ?? null,
    accuracy_score: accuracyScore ?? null,
    parent_version_id: parentVersionId ?? null,
    is_active: setActive,
  };

  const version = createVersion(versionInsert);

  // Update version_id in file inserts and create records
  if (versionFileInserts.length > 0) {
    versionFileInserts.forEach((file) => {
      file.version_id = version.id;
    });
    createVersionFilesBatch(versionFileInserts);
  }

  // Update current/ symlink if this is the active version
  if (setActive) {
    updateCurrentSymlink(websiteId, versionNumber);
  }

  return {
    version,
    versionPath,
    filesCopied: copiedFiles.length,
  };
}

/**
 * List all versions for a website
 *
 * @param websiteId - Website ID
 * @returns Array of versions sorted by creation date (newest first)
 */
export function listVersions(websiteId: string): Version[] {
  return getVersions(websiteId);
}

/**
 * Activate a specific version
 * Updates database is_active flag and current/ symlink
 *
 * @param versionId - Version ID to activate
 * @param websiteId - Website ID (for symlink update)
 * @returns Updated version or null if not found
 */
export function activateVersion(
  versionId: string,
  websiteId: string
): Version | null {
  // Update database (deactivates others, activates this one)
  const version = dbSetActiveVersion(versionId);

  if (!version) {
    return null;
  }

  // Update symlink
  updateCurrentSymlink(websiteId, version.version_number);

  return version;
}

/**
 * Get the currently active version for a website
 *
 * @param websiteId - Website ID
 * @returns Active version or null if none active
 */
export function getCurrentVersion(websiteId: string): Version | null {
  return getActiveVersion(websiteId);
}

/**
 * Get a version by ID
 *
 * @param versionId - Version ID
 * @returns Version or null if not found
 */
export function getVersion(versionId: string): Version | null {
  return getVersionById(versionId);
}

/**
 * Get files for a version
 *
 * @param versionId - Version ID
 * @returns Array of version files
 */
export function getFilesForVersion(versionId: string) {
  return getVersionFiles(versionId);
}
