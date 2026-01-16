/**
 * Versioning Module
 *
 * Exports all versioning-related functions for version management,
 * changelog generation, and rollback operations.
 */

export {
  getWebsiteDir,
  getVersionPath,
  getCurrentPath,
  parseVersion,
  formatVersion,
  getNextVersionNumber,
  updateCurrentSymlink,
  createNewVersion,
  listVersions,
  activateVersion,
  getCurrentVersion,
  getVersion,
  getFilesForVersion,
  type ChangeType,
  type ParsedVersion,
  type CreateVersionOptions,
  type CreateVersionResult,
} from './version-manager';

export {
  generateChangelog,
  generateVersionChangelog,
  type ChangelogResult,
  type TokenDiff,
  type FileDiff,
} from './changelog-generator';

export {
  rollbackToVersion,
  canRollback,
  getRollbackPreview,
  type RollbackOptions,
  type RollbackResult,
} from './rollback';
