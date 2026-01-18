/**
 * Changelog Generator
 *
 * Generates human-readable changelog entries from version differences.
 * Compares tokens (design system), files, and components between versions
 * to create understandable descriptions of changes.
 */

import { getVersionById, getVersionFiles } from '@/lib/db/client';
import type {
  Version,
  VersionFile,
  ChangelogEntry,
  Change,
  DesignSystem,
  ColorExtraction,
  TypographyExtraction,
  SpacingExtraction,
  EffectsExtraction,
} from '@/types';

// ====================
// INTERFACES
// ====================

/**
 * Changelog generation result
 */
export interface ChangelogResult {
  entries: ChangelogEntry[];
  changes: Change[];
  summary: string;
}

/**
 * Token comparison result
 */
interface TokenDiff {
  colorChanges: Change[];
  typographyChanges: Change[];
  spacingChanges: Change[];
  effectsChanges: Change[];
}

/**
 * File comparison result
 */
interface FileDiff {
  added: VersionFile[];
  removed: VersionFile[];
  modified: VersionFile[];
}

// ====================
// MAIN CHANGELOG FUNCTIONS
// ====================

/**
 * Generate changelog between two versions
 *
 * @param fromVersionId - Source version ID (older)
 * @param toVersionId - Target version ID (newer)
 * @returns Changelog result with entries, changes, and summary
 */
export function generateChangelog(
  fromVersionId: string,
  toVersionId: string
): ChangelogResult {
  const fromVersion = getVersionById(fromVersionId);
  const toVersion = getVersionById(toVersionId);

  if (!fromVersion) {
    throw new Error(`Source version not found: ${fromVersionId}`);
  }

  if (!toVersion) {
    throw new Error(`Target version not found: ${toVersionId}`);
  }

  const entries: ChangelogEntry[] = [];
  const changes: Change[] = [];

  // Compare tokens if both versions have them
  if (fromVersion.tokens_json && toVersion.tokens_json) {
    const fromTokens = JSON.parse(fromVersion.tokens_json) as DesignSystem;
    const toTokens = JSON.parse(toVersion.tokens_json) as DesignSystem;
    const tokenDiff = compareTokens(fromTokens, toTokens);

    // Generate entries for token changes
    const tokenEntries = generateTokenEntries(tokenDiff);
    entries.push(...tokenEntries);

    // Collect all changes
    changes.push(
      ...tokenDiff.colorChanges,
      ...tokenDiff.typographyChanges,
      ...tokenDiff.spacingChanges,
      ...tokenDiff.effectsChanges
    );
  }

  // Compare files
  const fromFiles = getVersionFiles(fromVersionId);
  const toFiles = getVersionFiles(toVersionId);
  const fileDiff = compareFiles(fromFiles, toFiles);

  // Generate entries for file changes
  const fileEntries = generateFileEntries(fileDiff);
  entries.push(...fileEntries);

  // Generate file change records
  const fileChanges = generateFileChanges(fileDiff);
  changes.push(...fileChanges);

  // Generate summary
  const summary = generateSummary(entries, toVersion);

  return {
    entries,
    changes,
    summary,
  };
}

/**
 * Generate changelog for a single version (compared to its parent)
 *
 * @param versionId - Version ID
 * @returns Changelog result or null if no parent version
 */
export function generateVersionChangelog(versionId: string): ChangelogResult | null {
  const version = getVersionById(versionId);

  if (!version || !version.parent_version_id) {
    return null;
  }

  return generateChangelog(version.parent_version_id, versionId);
}

// ====================
// TOKEN COMPARISON
// ====================

/**
 * Compare design system tokens between two versions
 *
 * @param oldTokens - Old design system
 * @param newTokens - New design system
 * @returns Token differences categorized by type
 */
function compareTokens(
  oldTokens: DesignSystem,
  newTokens: DesignSystem
): TokenDiff {
  return {
    colorChanges: compareColors(oldTokens.colors, newTokens.colors),
    typographyChanges: compareTypography(oldTokens.typography, newTokens.typography),
    spacingChanges: compareSpacing(oldTokens.spacing, newTokens.spacing),
    effectsChanges: compareEffects(oldTokens.effects, newTokens.effects),
  };
}

/**
 * Compare color tokens
 */
function compareColors(
  oldColors: ColorExtraction,
  newColors: ColorExtraction
): Change[] {
  const changes: Change[] = [];

  // Compare primary colors
  if (JSON.stringify(oldColors.primary) !== JSON.stringify(newColors.primary)) {
    changes.push({
      field: 'colors.primary',
      oldValue: oldColors.primary.join(', '),
      newValue: newColors.primary.join(', '),
      changeType: 'modified',
    });
  }

  // Compare secondary colors
  if (JSON.stringify(oldColors.secondary) !== JSON.stringify(newColors.secondary)) {
    changes.push({
      field: 'colors.secondary',
      oldValue: oldColors.secondary.join(', '),
      newValue: newColors.secondary.join(', '),
      changeType: 'modified',
    });
  }

  // Compare neutral colors
  if (JSON.stringify(oldColors.neutral) !== JSON.stringify(newColors.neutral)) {
    changes.push({
      field: 'colors.neutral',
      oldValue: oldColors.neutral.join(', '),
      newValue: newColors.neutral.join(', '),
      changeType: 'modified',
    });
  }

  // Compare semantic colors
  const semanticKeys: Array<keyof typeof oldColors.semantic> = ['success', 'error', 'warning', 'info'];
  for (const key of semanticKeys) {
    if (oldColors.semantic[key] !== newColors.semantic[key]) {
      changes.push({
        field: `colors.semantic.${key}`,
        oldValue: oldColors.semantic[key],
        newValue: newColors.semantic[key],
        changeType: 'modified',
      });
    }
  }

  return changes;
}

/**
 * Compare typography tokens
 */
function compareTypography(
  oldTypo: TypographyExtraction,
  newTypo: TypographyExtraction
): Change[] {
  const changes: Change[] = [];

  // Compare fonts
  const fontKeys: Array<keyof typeof oldTypo.fonts> = ['heading', 'body', 'mono'];
  for (const key of fontKeys) {
    if (oldTypo.fonts[key] !== newTypo.fonts[key]) {
      changes.push({
        field: `typography.fonts.${key}`,
        oldValue: oldTypo.fonts[key] || null,
        newValue: newTypo.fonts[key] || null,
        changeType: 'modified',
      });
    }
  }

  // Compare scale
  const scaleKeys: Array<keyof typeof oldTypo.scale> = [
    'display', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'small', 'xs'
  ];
  for (const key of scaleKeys) {
    if (oldTypo.scale[key] !== newTypo.scale[key]) {
      changes.push({
        field: `typography.scale.${key}`,
        oldValue: oldTypo.scale[key],
        newValue: newTypo.scale[key],
        changeType: 'modified',
      });
    }
  }

  // Compare weights
  if (JSON.stringify(oldTypo.weights) !== JSON.stringify(newTypo.weights)) {
    changes.push({
      field: 'typography.weights',
      oldValue: oldTypo.weights.join(', '),
      newValue: newTypo.weights.join(', '),
      changeType: 'modified',
    });
  }

  return changes;
}

/**
 * Compare spacing tokens
 */
function compareSpacing(
  oldSpacing: SpacingExtraction,
  newSpacing: SpacingExtraction
): Change[] {
  const changes: Change[] = [];

  if (oldSpacing.baseUnit !== newSpacing.baseUnit) {
    changes.push({
      field: 'spacing.baseUnit',
      oldValue: String(oldSpacing.baseUnit),
      newValue: String(newSpacing.baseUnit),
      changeType: 'modified',
    });
  }

  if (JSON.stringify(oldSpacing.scale) !== JSON.stringify(newSpacing.scale)) {
    changes.push({
      field: 'spacing.scale',
      oldValue: oldSpacing.scale.join(', '),
      newValue: newSpacing.scale.join(', '),
      changeType: 'modified',
    });
  }

  if (oldSpacing.containerMaxWidth !== newSpacing.containerMaxWidth) {
    changes.push({
      field: 'spacing.containerMaxWidth',
      oldValue: oldSpacing.containerMaxWidth,
      newValue: newSpacing.containerMaxWidth,
      changeType: 'modified',
    });
  }

  return changes;
}

/**
 * Compare effects tokens
 */
function compareEffects(
  oldEffects: EffectsExtraction,
  newEffects: EffectsExtraction
): Change[] {
  const changes: Change[] = [];

  // Compare shadows
  const shadowKeys: Array<keyof typeof oldEffects.shadows> = ['sm', 'md', 'lg', 'xl'];
  for (const key of shadowKeys) {
    if (oldEffects.shadows[key] !== newEffects.shadows[key]) {
      changes.push({
        field: `effects.shadows.${key}`,
        oldValue: oldEffects.shadows[key],
        newValue: newEffects.shadows[key],
        changeType: 'modified',
      });
    }
  }

  // Compare radii
  const radiiKeys: Array<keyof typeof oldEffects.radii> = ['sm', 'md', 'lg', 'full'];
  for (const key of radiiKeys) {
    if (oldEffects.radii[key] !== newEffects.radii[key]) {
      changes.push({
        field: `effects.radii.${key}`,
        oldValue: oldEffects.radii[key],
        newValue: newEffects.radii[key],
        changeType: 'modified',
      });
    }
  }

  // Compare transitions
  const transitionKeys: Array<keyof typeof oldEffects.transitions> = ['fast', 'normal', 'slow'];
  for (const key of transitionKeys) {
    if (oldEffects.transitions[key] !== newEffects.transitions[key]) {
      changes.push({
        field: `effects.transitions.${key}`,
        oldValue: oldEffects.transitions[key],
        newValue: newEffects.transitions[key],
        changeType: 'modified',
      });
    }
  }

  return changes;
}

// ====================
// FILE COMPARISON
// ====================

/**
 * Compare files between two versions
 *
 * @param oldFiles - Old version files
 * @param newFiles - New version files
 * @returns File differences
 */
function compareFiles(oldFiles: VersionFile[], newFiles: VersionFile[]): FileDiff {
  const oldFileMap = new Map(oldFiles.map(f => [f.file_path, f]));
  const newFileMap = new Map(newFiles.map(f => [f.file_path, f]));

  const added: VersionFile[] = [];
  const removed: VersionFile[] = [];
  const modified: VersionFile[] = [];

  // Find added and modified files
  for (const [path, newFile] of newFileMap) {
    const oldFile = oldFileMap.get(path);
    if (!oldFile) {
      added.push(newFile);
    } else if (oldFile.file_hash !== newFile.file_hash) {
      modified.push(newFile);
    }
  }

  // Find removed files
  for (const [path, oldFile] of oldFileMap) {
    if (!newFileMap.has(path)) {
      removed.push(oldFile);
    }
  }

  return { added, removed, modified };
}

// ====================
// ENTRY GENERATION
// ====================

/**
 * Generate changelog entries from token differences
 *
 * @param tokenDiff - Token differences
 * @returns Array of changelog entries
 */
function generateTokenEntries(tokenDiff: TokenDiff): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const timestamp = new Date().toISOString();

  // Color changes
  if (tokenDiff.colorChanges.length > 0) {
    for (const change of tokenDiff.colorChanges) {
      entries.push({
        type: 'color',
        description: formatColorChange(change),
        timestamp,
      });
    }
  }

  // Typography changes
  if (tokenDiff.typographyChanges.length > 0) {
    for (const change of tokenDiff.typographyChanges) {
      entries.push({
        type: 'typography',
        description: formatTypographyChange(change),
        timestamp,
      });
    }
  }

  // Spacing changes
  if (tokenDiff.spacingChanges.length > 0) {
    for (const change of tokenDiff.spacingChanges) {
      entries.push({
        type: 'spacing',
        description: formatSpacingChange(change),
        timestamp,
      });
    }
  }

  // Effects changes
  if (tokenDiff.effectsChanges.length > 0) {
    for (const change of tokenDiff.effectsChanges) {
      entries.push({
        type: 'effects',
        description: formatEffectsChange(change),
        timestamp,
      });
    }
  }

  return entries;
}

/**
 * Generate changelog entries from file differences
 *
 * @param fileDiff - File differences
 * @returns Array of changelog entries
 */
function generateFileEntries(fileDiff: FileDiff): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const timestamp = new Date().toISOString();

  if (fileDiff.added.length > 0) {
    entries.push({
      type: 'other',
      description: `Added ${fileDiff.added.length} file${fileDiff.added.length > 1 ? 's' : ''}`,
      timestamp,
    });
  }

  if (fileDiff.removed.length > 0) {
    entries.push({
      type: 'other',
      description: `Removed ${fileDiff.removed.length} file${fileDiff.removed.length > 1 ? 's' : ''}`,
      timestamp,
    });
  }

  if (fileDiff.modified.length > 0) {
    entries.push({
      type: 'other',
      description: `Modified ${fileDiff.modified.length} file${fileDiff.modified.length > 1 ? 's' : ''}`,
      timestamp,
    });
  }

  return entries;
}

/**
 * Generate file change records
 *
 * @param fileDiff - File differences
 * @returns Array of changes
 */
function generateFileChanges(fileDiff: FileDiff): Change[] {
  const changes: Change[] = [];

  for (const file of fileDiff.added) {
    changes.push({
      field: `file.${file.file_path}`,
      oldValue: null,
      newValue: file.file_hash,
      changeType: 'added',
    });
  }

  for (const file of fileDiff.removed) {
    changes.push({
      field: `file.${file.file_path}`,
      oldValue: file.file_hash,
      newValue: null,
      changeType: 'removed',
    });
  }

  for (const file of fileDiff.modified) {
    changes.push({
      field: `file.${file.file_path}`,
      oldValue: null, // We don't track old hash in modified files
      newValue: file.file_hash,
      changeType: 'modified',
    });
  }

  return changes;
}

// ====================
// FORMATTING FUNCTIONS
// ====================

/**
 * Format a color change into human-readable text
 */
function formatColorChange(change: Change): string {
  const field = change.field.replace('colors.', '');

  if (field === 'primary') {
    return `Updated primary color palette`;
  }
  if (field === 'secondary') {
    return `Updated secondary color palette`;
  }
  if (field === 'neutral') {
    return `Updated neutral color palette`;
  }
  if (field.startsWith('semantic.')) {
    const semanticType = field.replace('semantic.', '');
    return `Changed ${semanticType} color from ${change.oldValue} to ${change.newValue}`;
  }

  return `Modified ${field} colors`;
}

/**
 * Format a typography change into human-readable text
 */
function formatTypographyChange(change: Change): string {
  const field = change.field.replace('typography.', '');

  if (field.startsWith('fonts.')) {
    const fontType = field.replace('fonts.', '');
    return `Changed ${fontType} font from "${change.oldValue}" to "${change.newValue}"`;
  }

  if (field.startsWith('scale.')) {
    const scaleLevel = field.replace('scale.', '');
    return `Updated ${scaleLevel} font size from ${change.oldValue} to ${change.newValue}`;
  }

  if (field === 'weights') {
    return `Updated font weight scale`;
  }

  return `Modified ${field} typography`;
}

/**
 * Format a spacing change into human-readable text
 */
function formatSpacingChange(change: Change): string {
  const field = change.field.replace('spacing.', '');

  if (field === 'baseUnit') {
    return `Changed base spacing unit from ${change.oldValue}px to ${change.newValue}px`;
  }

  if (field === 'scale') {
    return `Updated spacing scale`;
  }

  if (field === 'containerMaxWidth') {
    return `Changed container max width from ${change.oldValue} to ${change.newValue}`;
  }

  return `Modified ${field} spacing`;
}

/**
 * Format an effects change into human-readable text
 */
function formatEffectsChange(change: Change): string {
  const field = change.field.replace('effects.', '');

  if (field.startsWith('shadows.')) {
    const size = field.replace('shadows.', '');
    return `Updated ${size} shadow effect`;
  }

  if (field.startsWith('radii.')) {
    const size = field.replace('radii.', '');
    return `Changed ${size} border radius`;
  }

  if (field.startsWith('transitions.')) {
    const speed = field.replace('transitions.', '');
    return `Updated ${speed} transition timing`;
  }

  return `Modified ${field} effects`;
}

/**
 * Generate a summary of changes
 *
 * @param entries - Changelog entries
 * @param version - Version being described
 * @returns Summary text
 */
function generateSummary(entries: ChangelogEntry[], version: Version): string {
  if (entries.length === 0) {
    return 'No changes detected';
  }

  const changeTypes = new Set(entries.map(e => e.type));
  const types = Array.from(changeTypes);

  if (types.length === 1) {
    const type = types[0];
    if (type === 'other') {
      return `File changes in version ${version.version_number}`;
    }
    return `${capitalize(type)} updates in version ${version.version_number}`;
  }

  const typeLabels = types.map(t => t === 'other' ? 'file' : t);
  return `Updated ${typeLabels.join(', ')} in version ${version.version_number}`;
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ====================
// EXPORTS (types only - functions exported inline)
// ====================

export type { ChangelogResult, TokenDiff, FileDiff };
