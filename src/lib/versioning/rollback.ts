/**
 * Rollback Operations
 *
 * Implements non-destructive rollback functionality for website versions.
 * Rolling back creates a new version based on a previous version's state
 * rather than modifying or deleting existing versions. This ensures complete
 * version history is preserved.
 */

import fs from 'fs';
import { getVersionById, getVersions } from '@/lib/db/client';
import type { Version } from '@/types';
import {
  getVersionPath,
  getNextVersionNumber,
  createNewVersion,
  type CreateVersionResult,
} from './version-manager';

// ====================
// INTERFACES
// ====================

/**
 * Options for rolling back to a previous version
 */
export interface RollbackOptions {
  websiteId: string;
  targetVersionId: string;
  changelog?: string;
}

/**
 * Result of a rollback operation
 */
export interface RollbackResult {
  newVersion: Version;
  targetVersion: Version;
  versionPath: string;
  filesCopied: number;
}

// ====================
// VALIDATION
// ====================

/**
 * Validate that a version exists and its files are accessible
 *
 * @param versionId - Version ID to validate
 * @param websiteId - Website ID for path validation
 * @returns Version record if valid
 * @throws Error if version not found or files missing
 */
function validateRollbackTarget(
  versionId: string,
  websiteId: string
): Version {
  // Get version from database
  const version = getVersionById(versionId);
  if (!version) {
    throw new Error(`Version not found: ${versionId}`);
  }

  // Verify it belongs to the correct website
  if (version.website_id !== websiteId) {
    throw new Error(
      `Version ${versionId} does not belong to website ${websiteId}`
    );
  }

  // Check if version directory exists
  const versionPath = getVersionPath(websiteId, version.version_number);
  if (!fs.existsSync(versionPath)) {
    throw new Error(
      `Version directory does not exist: ${versionPath}`
    );
  }

  return version;
}

// ====================
// ROLLBACK OPERATIONS
// ====================

/**
 * Perform a non-destructive rollback to a previous version
 *
 * Creates a new version based on the target version's files and state.
 * The new version is marked as active and the current/ symlink is updated.
 * The target version and all intermediate versions remain unchanged.
 *
 * Example: Rolling back from v1.3 to v1.0 creates v1.4 with v1.0's contents
 *
 * @param options - Rollback options
 * @returns Rollback result with new version info
 * @throws Error if target version invalid or rollback fails
 */
export function rollbackToVersion(
  options: RollbackOptions
): RollbackResult {
  const { websiteId, targetVersionId, changelog } = options;

  // Validate target version exists and is accessible
  const targetVersion = validateRollbackTarget(targetVersionId, websiteId);

  // Get the source directory (target version's directory)
  const sourceDir = getVersionPath(websiteId, targetVersion.version_number);

  // Determine next version number (always increment minor version for rollbacks)
  // This keeps rollbacks as edits in the version history
  const newVersionNumber = getNextVersionNumber(websiteId, 'edit');

  // Generate changelog if not provided
  const rollbackChangelog =
    changelog ||
    `Rolled back to version ${targetVersion.version_number}`;

  // Create new version from target version's files
  const createResult: CreateVersionResult = createNewVersion({
    websiteId,
    versionNumber: newVersionNumber,
    sourceDir,
    tokensJson: targetVersion.tokens_json ?? undefined,
    changelog: rollbackChangelog,
    accuracyScore: targetVersion.accuracy_score ?? undefined,
    parentVersionId: targetVersionId, // Link to the rollback target
    setActive: true, // Make this the active version
  });

  return {
    newVersion: createResult.version,
    targetVersion,
    versionPath: createResult.versionPath,
    filesCopied: createResult.filesCopied,
  };
}

/**
 * Check if a rollback can be performed to a specific version
 *
 * @param websiteId - Website ID
 * @param targetVersionId - Version ID to check
 * @returns Object with canRollback flag and reason if not possible
 */
export function canRollback(
  websiteId: string,
  targetVersionId: string
): { canRollback: boolean; reason?: string } {
  try {
    // Validate target version
    validateRollbackTarget(targetVersionId, websiteId);

    // Check if there are any versions (need at least one to rollback from)
    const versions = getVersions(websiteId);
    if (versions.length === 0) {
      return { canRollback: false, reason: 'No versions available' };
    }

    // Check if trying to rollback to the current active version
    const activeVersion = versions.find((v) => v.is_active === 1);
    if (activeVersion && activeVersion.id === targetVersionId) {
      return {
        canRollback: false,
        reason: 'Target version is already active',
      };
    }

    return { canRollback: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { canRollback: false, reason: message };
  }
}

/**
 * Get rollback preview information
 *
 * Shows what would happen if rollback is performed without actually doing it
 *
 * @param websiteId - Website ID
 * @param targetVersionId - Version ID to rollback to
 * @returns Preview information
 */
export function getRollbackPreview(
  websiteId: string,
  targetVersionId: string
): {
  targetVersion: Version;
  newVersionNumber: string;
  affectedVersions: Version[];
} {
  // Validate target version
  const targetVersion = validateRollbackTarget(targetVersionId, websiteId);

  // Get what the new version number would be
  const newVersionNumber = getNextVersionNumber(websiteId, 'edit');

  // Get all versions that came after the target
  // (these won't be affected, but useful for display)
  const allVersions = getVersions(websiteId);
  const targetIndex = allVersions.findIndex((v) => v.id === targetVersionId);
  const affectedVersions = targetIndex >= 0 ? allVersions.slice(0, targetIndex) : [];

  return {
    targetVersion,
    newVersionNumber,
    affectedVersions,
  };
}
