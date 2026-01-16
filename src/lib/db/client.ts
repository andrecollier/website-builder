/**
 * SQLite Database Client
 *
 * This module provides a typed database client for the Website Cooker application
 * using better-sqlite3 for synchronous SQLite operations.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { ALL_SCHEMA_STATEMENTS } from './schema';
import type {
  Website,
  WebsiteInsert,
  WebsiteStatus,
  ComponentType,
  Version,
  VersionInsert,
  VersionFile,
  VersionFileInsert,
} from '@/types';

// ====================
// DATABASE TYPES
// ====================

/**
 * Component record from database
 */
export interface ComponentRecord {
  id: string;
  website_id: string;
  version_id: string;
  name: string;
  type: ComponentType;
  order_index: number;
  selected_variant: string | null;
  custom_code: string | null;
  approved: number; // SQLite boolean as 0/1
  accuracy_score: number | null;
  error_message: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'skipped' | 'failed';
}

/**
 * Component insert data
 */
export interface ComponentInsert {
  id?: string;
  website_id: string;
  version_id: string;
  name: string;
  type: ComponentType;
  order_index: number;
  selected_variant?: string | null;
  custom_code?: string | null;
  approved?: boolean;
  accuracy_score?: number | null;
  error_message?: string | null;
  status?: 'pending' | 'approved' | 'rejected' | 'skipped' | 'failed';
}

/**
 * Component variant record from database
 */
export interface VariantRecord {
  id: string;
  component_id: string;
  variant_name: string;
  description: string | null;
  code: string;
  preview_image: string | null;
  accuracy_score: number | null;
  created_at: string;
}

/**
 * Variant insert data
 */
export interface VariantInsert {
  id?: string;
  component_id: string;
  variant_name: string;
  description?: string | null;
  code: string;
  preview_image?: string | null;
  accuracy_score?: number | null;
}

// ====================
// DATABASE SINGLETON
// ====================

let db: Database.Database | null = null;

/**
 * Get the database file path from environment or use default
 */
function getDatabasePath(): string {
  const envPath = process.env.DATABASE_PATH;
  if (envPath) {
    // Handle relative paths
    if (envPath.startsWith('./') || envPath.startsWith('../')) {
      return path.resolve(process.cwd(), envPath);
    }
    return envPath;
  }
  return path.resolve(process.cwd(), 'data', 'history.db');
}

/**
 * Ensure the data directory exists
 */
function ensureDataDirectory(dbPath: string): void {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Get or create the database connection
 */
export function getDb(): Database.Database {
  if (!db) {
    const dbPath = getDatabasePath();
    ensureDataDirectory(dbPath);

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// ====================
// SCHEMA INITIALIZATION
// ====================

/**
 * Check if the database has been initialized
 */
export function isDatabaseInitialized(): boolean {
  const database = getDb();
  const result = database
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='websites'")
    .get();
  return !!result;
}

/**
 * Initialize the database schema
 */
export function initializeDatabase(): void {
  const database = getDb();

  if (isDatabaseInitialized()) {
    return;
  }

  database.transaction(() => {
    for (const statement of ALL_SCHEMA_STATEMENTS) {
      database.exec(statement);
    }
  })();
}

// ====================
// WEBSITE OPERATIONS
// ====================

/**
 * Get all websites ordered by creation date (newest first)
 */
export function getWebsites(): Website[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, name, reference_url, created_at, updated_at, current_version, status
    FROM websites
    ORDER BY created_at DESC
  `);
  return stmt.all() as Website[];
}

/**
 * Get a single website by ID
 */
export function getWebsiteById(id: string): Website | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, name, reference_url, created_at, updated_at, current_version, status
    FROM websites
    WHERE id = ?
  `);
  const result = stmt.get(id);
  return (result as Website) || null;
}

/**
 * Get websites by status
 */
export function getWebsitesByStatus(status: WebsiteStatus): Website[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, name, reference_url, created_at, updated_at, current_version, status
    FROM websites
    WHERE status = ?
    ORDER BY created_at DESC
  `);
  return stmt.all(status) as Website[];
}

/**
 * Create a new website record
 */
export function createWebsite(data: WebsiteInsert): Website {
  const database = getDb();
  const id = data.id || `website-${randomUUID()}`;
  const status = data.status || 'pending';

  const stmt = database.prepare(`
    INSERT INTO websites (id, name, reference_url, status)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(id, data.name, data.reference_url, status);

  const website = getWebsiteById(id);
  if (!website) {
    throw new Error('Failed to create website record');
  }
  return website;
}

/**
 * Update a website's status
 */
export function updateWebsiteStatus(id: string, status: WebsiteStatus): Website | null {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE websites
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const result = stmt.run(status, id);

  if (result.changes === 0) {
    return null;
  }

  return getWebsiteById(id);
}

/**
 * Progress data for a website extraction
 */
export interface WebsiteProgress {
  phase: string | null;
  percent: number;
  message: string | null;
}

/**
 * Update a website's progress
 */
export function updateWebsiteProgress(
  id: string,
  progress: WebsiteProgress
): boolean {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE websites
    SET progress_phase = ?, progress_percent = ?, progress_message = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const result = stmt.run(progress.phase, progress.percent, progress.message, id);
  return result.changes > 0;
}

/**
 * Get a website's progress
 */
export function getWebsiteProgress(id: string): WebsiteProgress | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT progress_phase, progress_percent, progress_message
    FROM websites
    WHERE id = ?
  `);
  const result = stmt.get(id) as { progress_phase: string | null; progress_percent: number; progress_message: string | null } | undefined;

  if (!result) {
    return null;
  }

  return {
    phase: result.progress_phase,
    percent: result.progress_percent,
    message: result.progress_message,
  };
}

/**
 * Get website with progress info
 */
export interface WebsiteWithProgress extends Website {
  progress_phase: string | null;
  progress_percent: number;
  progress_message: string | null;
}

/**
 * Get a single website by ID with progress
 */
export function getWebsiteByIdWithProgress(id: string): WebsiteWithProgress | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, name, reference_url, created_at, updated_at, current_version, status,
           progress_phase, progress_percent, progress_message
    FROM websites
    WHERE id = ?
  `);
  const result = stmt.get(id);
  return (result as WebsiteWithProgress) || null;
}

/**
 * Clear a website's progress (set to null/0)
 */
export function clearWebsiteProgress(id: string): boolean {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE websites
    SET progress_phase = NULL, progress_percent = 0, progress_message = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Update a website's version
 */
export function updateWebsiteVersion(id: string, version: number): Website | null {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE websites
    SET current_version = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const result = stmt.run(version, id);

  if (result.changes === 0) {
    return null;
  }

  return getWebsiteById(id);
}

/**
 * Update a website record
 */
export function updateWebsite(
  id: string,
  data: Partial<Omit<WebsiteInsert, 'id'>>
): Website | null {
  const database = getDb();
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.reference_url !== undefined) {
    updates.push('reference_url = ?');
    values.push(data.reference_url);
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
  }

  if (updates.length === 0) {
    return getWebsiteById(id);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const stmt = database.prepare(`
    UPDATE websites
    SET ${updates.join(', ')}
    WHERE id = ?
  `);
  const result = stmt.run(...values);

  if (result.changes === 0) {
    return null;
  }

  return getWebsiteById(id);
}

/**
 * Delete a website by ID
 */
export function deleteWebsite(id: string): boolean {
  const database = getDb();
  const stmt = database.prepare('DELETE FROM websites WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Count total websites
 */
export function countWebsites(): number {
  const database = getDb();
  const stmt = database.prepare('SELECT COUNT(*) as count FROM websites');
  const result = stmt.get() as { count: number };
  return result.count;
}

/**
 * Count websites by status
 */
export function countWebsitesByStatus(status: WebsiteStatus): number {
  const database = getDb();
  const stmt = database.prepare('SELECT COUNT(*) as count FROM websites WHERE status = ?');
  const result = stmt.get(status) as { count: number };
  return result.count;
}

// ====================
// VERSION OPERATIONS
// ====================

/**
 * Get all versions for a website ordered by creation date (newest first)
 */
export function getVersions(websiteId: string): Version[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, website_id, version_number, created_at, tokens_json,
           accuracy_score, changelog, is_active, parent_version_id
    FROM versions
    WHERE website_id = ?
    ORDER BY created_at DESC
  `);
  return stmt.all(websiteId) as Version[];
}

/**
 * Get a single version by ID
 */
export function getVersionById(id: string): Version | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, website_id, version_number, created_at, tokens_json,
           accuracy_score, changelog, is_active, parent_version_id
    FROM versions
    WHERE id = ?
  `);
  const result = stmt.get(id);
  return (result as Version) || null;
}

/**
 * Get the active version for a website
 */
export function getActiveVersion(websiteId: string): Version | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, website_id, version_number, created_at, tokens_json,
           accuracy_score, changelog, is_active, parent_version_id
    FROM versions
    WHERE website_id = ? AND is_active = 1
    LIMIT 1
  `);
  const result = stmt.get(websiteId);
  return (result as Version) || null;
}

/**
 * Create a new version record
 */
export function createVersion(data: VersionInsert): Version {
  const database = getDb();
  const id = data.id || `version-${randomUUID()}`;
  const isActive = data.is_active ? 1 : 0;

  const stmt = database.prepare(`
    INSERT INTO versions (id, website_id, version_number, tokens_json,
                          accuracy_score, changelog, is_active, parent_version_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.website_id,
    data.version_number,
    data.tokens_json ?? null,
    data.accuracy_score ?? null,
    data.changelog ?? null,
    isActive,
    data.parent_version_id ?? null
  );

  const version = getVersionById(id);
  if (!version) {
    throw new Error('Failed to create version record');
  }
  return version;
}

/**
 * Set a version as active and deactivate all others for the website
 */
export function setActiveVersion(versionId: string): Version | null {
  const database = getDb();

  // First get the version to find the website_id
  const version = getVersionById(versionId);
  if (!version) {
    return null;
  }

  // Use a transaction to ensure consistency
  database.transaction(() => {
    // Deactivate all versions for this website
    const deactivateStmt = database.prepare(`
      UPDATE versions
      SET is_active = 0
      WHERE website_id = ?
    `);
    deactivateStmt.run(version.website_id);

    // Activate the target version
    const activateStmt = database.prepare(`
      UPDATE versions
      SET is_active = 1
      WHERE id = ?
    `);
    activateStmt.run(versionId);
  })();

  return getVersionById(versionId);
}

/**
 * Update a version record
 */
export function updateVersion(
  id: string,
  data: Partial<Omit<VersionInsert, 'id' | 'website_id' | 'version_number'>>
): Version | null {
  const database = getDb();
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.tokens_json !== undefined) {
    updates.push('tokens_json = ?');
    values.push(data.tokens_json);
  }
  if (data.accuracy_score !== undefined) {
    updates.push('accuracy_score = ?');
    values.push(data.accuracy_score);
  }
  if (data.changelog !== undefined) {
    updates.push('changelog = ?');
    values.push(data.changelog);
  }
  if (data.is_active !== undefined) {
    updates.push('is_active = ?');
    values.push(data.is_active ? 1 : 0);
  }
  if (data.parent_version_id !== undefined) {
    updates.push('parent_version_id = ?');
    values.push(data.parent_version_id);
  }

  if (updates.length === 0) {
    return getVersionById(id);
  }

  values.push(id);

  const stmt = database.prepare(`
    UPDATE versions
    SET ${updates.join(', ')}
    WHERE id = ?
  `);
  const result = stmt.run(...values);

  if (result.changes === 0) {
    return null;
  }

  return getVersionById(id);
}

/**
 * Delete a version by ID
 */
export function deleteVersion(id: string): boolean {
  const database = getDb();
  const stmt = database.prepare('DELETE FROM versions WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Count versions by website
 */
export function countVersionsByWebsite(websiteId: string): number {
  const database = getDb();
  const stmt = database.prepare('SELECT COUNT(*) as count FROM versions WHERE website_id = ?');
  const result = stmt.get(websiteId) as { count: number };
  return result.count;
}

// ====================
// VERSION FILE OPERATIONS
// ====================

/**
 * Get all files for a version
 */
export function getVersionFiles(versionId: string): VersionFile[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, version_id, file_path, file_hash, created_at
    FROM version_files
    WHERE version_id = ?
    ORDER BY file_path ASC
  `);
  return stmt.all(versionId) as VersionFile[];
}

/**
 * Get a single version file by ID
 */
export function getVersionFileById(id: string): VersionFile | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, version_id, file_path, file_hash, created_at
    FROM version_files
    WHERE id = ?
  `);
  const result = stmt.get(id);
  return (result as VersionFile) || null;
}

/**
 * Create a new version file record
 */
export function createVersionFile(data: VersionFileInsert): VersionFile {
  const database = getDb();
  const id = data.id || `version-file-${randomUUID()}`;

  const stmt = database.prepare(`
    INSERT INTO version_files (id, version_id, file_path, file_hash)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(id, data.version_id, data.file_path, data.file_hash);

  const versionFile = getVersionFileById(id);
  if (!versionFile) {
    throw new Error('Failed to create version file record');
  }
  return versionFile;
}

/**
 * Create multiple version files in a transaction
 */
export function createVersionFilesBatch(files: VersionFileInsert[]): VersionFile[] {
  const database = getDb();
  const createdFiles: VersionFile[] = [];

  const insertStmt = database.prepare(`
    INSERT INTO version_files (id, version_id, file_path, file_hash)
    VALUES (?, ?, ?, ?)
  `);

  database.transaction(() => {
    for (const data of files) {
      const id = data.id || `version-file-${randomUUID()}`;
      insertStmt.run(id, data.version_id, data.file_path, data.file_hash);
      const versionFile = getVersionFileById(id);
      if (versionFile) {
        createdFiles.push(versionFile);
      }
    }
  })();

  return createdFiles;
}

/**
 * Delete a version file by ID
 */
export function deleteVersionFile(id: string): boolean {
  const database = getDb();
  const stmt = database.prepare('DELETE FROM version_files WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Delete all files for a version
 */
export function deleteVersionFilesByVersion(versionId: string): number {
  const database = getDb();
  const stmt = database.prepare('DELETE FROM version_files WHERE version_id = ?');
  const result = stmt.run(versionId);
  return result.changes;
}

/**
 * Count files by version
 */
export function countVersionFiles(versionId: string): number {
  const database = getDb();
  const stmt = database.prepare('SELECT COUNT(*) as count FROM version_files WHERE version_id = ?');
  const result = stmt.get(versionId) as { count: number };
  return result.count;
}

// ====================
// COMPONENT OPERATIONS
// ====================

/**
 * Get all components for a website
 */
export function getComponentsByWebsite(websiteId: string): ComponentRecord[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, website_id, version_id, name, type, order_index,
           selected_variant, custom_code, approved, accuracy_score, error_message, status
    FROM components
    WHERE website_id = ?
    ORDER BY order_index ASC
  `);
  return stmt.all(websiteId) as ComponentRecord[];
}

/**
 * Get all components for a specific version
 */
export function getComponentsByVersion(versionId: string): ComponentRecord[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, website_id, version_id, name, type, order_index,
           selected_variant, custom_code, approved, accuracy_score, error_message, status
    FROM components
    WHERE version_id = ?
    ORDER BY order_index ASC
  `);
  return stmt.all(versionId) as ComponentRecord[];
}

/**
 * Get a single component by ID
 */
export function getComponentById(id: string): ComponentRecord | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, website_id, version_id, name, type, order_index,
           selected_variant, custom_code, approved, accuracy_score, error_message, status
    FROM components
    WHERE id = ?
  `);
  const result = stmt.get(id);
  return (result as ComponentRecord) || null;
}

/**
 * Create a new component record
 */
export function createComponent(data: ComponentInsert): ComponentRecord {
  const database = getDb();
  const id = data.id || `component-${randomUUID()}`;
  const status = data.status || 'pending';
  const approved = data.approved ? 1 : 0;

  const stmt = database.prepare(`
    INSERT INTO components (id, website_id, version_id, name, type, order_index,
                            selected_variant, custom_code, approved, accuracy_score, error_message, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.website_id,
    data.version_id,
    data.name,
    data.type,
    data.order_index,
    data.selected_variant ?? null,
    data.custom_code ?? null,
    approved,
    data.accuracy_score ?? null,
    data.error_message ?? null,
    status
  );

  const component = getComponentById(id);
  if (!component) {
    throw new Error('Failed to create component record');
  }
  return component;
}

/**
 * Update a component's status
 */
export function updateComponentStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected' | 'skipped' | 'failed'
): ComponentRecord | null {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE components
    SET status = ?
    WHERE id = ?
  `);
  const result = stmt.run(status, id);

  if (result.changes === 0) {
    return null;
  }

  return getComponentById(id);
}

/**
 * Update a component's selected variant
 */
export function updateComponentSelectedVariant(
  id: string,
  variantId: string | null
): ComponentRecord | null {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE components
    SET selected_variant = ?
    WHERE id = ?
  `);
  const result = stmt.run(variantId, id);

  if (result.changes === 0) {
    return null;
  }

  return getComponentById(id);
}

/**
 * Update a component's custom code
 */
export function updateComponentCustomCode(
  id: string,
  customCode: string | null
): ComponentRecord | null {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE components
    SET custom_code = ?
    WHERE id = ?
  `);
  const result = stmt.run(customCode, id);

  if (result.changes === 0) {
    return null;
  }

  return getComponentById(id);
}

/**
 * Update a component record
 */
export function updateComponent(
  id: string,
  data: Partial<Omit<ComponentInsert, 'id' | 'website_id' | 'version_id'>>
): ComponentRecord | null {
  const database = getDb();
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.type !== undefined) {
    updates.push('type = ?');
    values.push(data.type);
  }
  if (data.order_index !== undefined) {
    updates.push('order_index = ?');
    values.push(data.order_index);
  }
  if (data.selected_variant !== undefined) {
    updates.push('selected_variant = ?');
    values.push(data.selected_variant);
  }
  if (data.custom_code !== undefined) {
    updates.push('custom_code = ?');
    values.push(data.custom_code);
  }
  if (data.approved !== undefined) {
    updates.push('approved = ?');
    values.push(data.approved ? 1 : 0);
  }
  if (data.accuracy_score !== undefined) {
    updates.push('accuracy_score = ?');
    values.push(data.accuracy_score);
  }
  if (data.error_message !== undefined) {
    updates.push('error_message = ?');
    values.push(data.error_message);
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
  }

  if (updates.length === 0) {
    return getComponentById(id);
  }

  values.push(id);

  const stmt = database.prepare(`
    UPDATE components
    SET ${updates.join(', ')}
    WHERE id = ?
  `);
  const result = stmt.run(...values);

  if (result.changes === 0) {
    return null;
  }

  return getComponentById(id);
}

/**
 * Delete a component by ID
 */
export function deleteComponent(id: string): boolean {
  const database = getDb();
  const stmt = database.prepare('DELETE FROM components WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Delete all components for a website
 */
export function deleteComponentsByWebsite(websiteId: string): number {
  const database = getDb();
  const stmt = database.prepare('DELETE FROM components WHERE website_id = ?');
  const result = stmt.run(websiteId);
  return result.changes;
}

/**
 * Count components by website
 */
export function countComponentsByWebsite(websiteId: string): number {
  const database = getDb();
  const stmt = database.prepare('SELECT COUNT(*) as count FROM components WHERE website_id = ?');
  const result = stmt.get(websiteId) as { count: number };
  return result.count;
}

/**
 * Count components by status for a website
 */
export function countComponentsByStatus(
  websiteId: string,
  status: 'pending' | 'approved' | 'rejected' | 'skipped' | 'failed'
): number {
  const database = getDb();
  const stmt = database.prepare(
    'SELECT COUNT(*) as count FROM components WHERE website_id = ? AND status = ?'
  );
  const result = stmt.get(websiteId, status) as { count: number };
  return result.count;
}

// ====================
// VARIANT OPERATIONS
// ====================

/**
 * Get all variants for a component
 */
export function getVariantsByComponent(componentId: string): VariantRecord[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, component_id, variant_name, description, code, preview_image, accuracy_score, created_at
    FROM component_variants
    WHERE component_id = ?
    ORDER BY created_at ASC
  `);
  return stmt.all(componentId) as VariantRecord[];
}

/**
 * Get a single variant by ID
 */
export function getVariantById(id: string): VariantRecord | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, component_id, variant_name, description, code, preview_image, accuracy_score, created_at
    FROM component_variants
    WHERE id = ?
  `);
  const result = stmt.get(id);
  return (result as VariantRecord) || null;
}

/**
 * Create a new variant record
 */
export function createVariant(data: VariantInsert): VariantRecord {
  const database = getDb();
  const id = data.id || `variant-${randomUUID()}`;

  const stmt = database.prepare(`
    INSERT INTO component_variants (id, component_id, variant_name, description, code, preview_image, accuracy_score)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.component_id,
    data.variant_name,
    data.description ?? null,
    data.code,
    data.preview_image ?? null,
    data.accuracy_score ?? null
  );

  const variant = getVariantById(id);
  if (!variant) {
    throw new Error('Failed to create variant record');
  }
  return variant;
}

/**
 * Update a variant's code
 */
export function updateVariantCode(id: string, code: string): VariantRecord | null {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE component_variants
    SET code = ?
    WHERE id = ?
  `);
  const result = stmt.run(code, id);

  if (result.changes === 0) {
    return null;
  }

  return getVariantById(id);
}

/**
 * Update a variant's accuracy score
 */
export function updateVariantAccuracyScore(
  id: string,
  accuracyScore: number | null
): VariantRecord | null {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE component_variants
    SET accuracy_score = ?
    WHERE id = ?
  `);
  const result = stmt.run(accuracyScore, id);

  if (result.changes === 0) {
    return null;
  }

  return getVariantById(id);
}

/**
 * Update a variant record
 */
export function updateVariant(
  id: string,
  data: Partial<Omit<VariantInsert, 'id' | 'component_id'>>
): VariantRecord | null {
  const database = getDb();
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.variant_name !== undefined) {
    updates.push('variant_name = ?');
    values.push(data.variant_name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.code !== undefined) {
    updates.push('code = ?');
    values.push(data.code);
  }
  if (data.preview_image !== undefined) {
    updates.push('preview_image = ?');
    values.push(data.preview_image);
  }
  if (data.accuracy_score !== undefined) {
    updates.push('accuracy_score = ?');
    values.push(data.accuracy_score);
  }

  if (updates.length === 0) {
    return getVariantById(id);
  }

  values.push(id);

  const stmt = database.prepare(`
    UPDATE component_variants
    SET ${updates.join(', ')}
    WHERE id = ?
  `);
  const result = stmt.run(...values);

  if (result.changes === 0) {
    return null;
  }

  return getVariantById(id);
}

/**
 * Delete a variant by ID
 */
export function deleteVariant(id: string): boolean {
  const database = getDb();
  const stmt = database.prepare('DELETE FROM component_variants WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Delete all variants for a component
 */
export function deleteVariantsByComponent(componentId: string): number {
  const database = getDb();
  const stmt = database.prepare('DELETE FROM component_variants WHERE component_id = ?');
  const result = stmt.run(componentId);
  return result.changes;
}

/**
 * Count variants by component
 */
export function countVariantsByComponent(componentId: string): number {
  const database = getDb();
  const stmt = database.prepare('SELECT COUNT(*) as count FROM component_variants WHERE component_id = ?');
  const result = stmt.get(componentId) as { count: number };
  return result.count;
}

/**
 * Create multiple variants in a transaction
 */
export function createVariantsBatch(variants: VariantInsert[]): VariantRecord[] {
  const database = getDb();
  const createdVariants: VariantRecord[] = [];

  const insertStmt = database.prepare(`
    INSERT INTO component_variants (id, component_id, variant_name, description, code, preview_image, accuracy_score)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  database.transaction(() => {
    for (const data of variants) {
      const id = data.id || `variant-${randomUUID()}`;
      insertStmt.run(
        id,
        data.component_id,
        data.variant_name,
        data.description ?? null,
        data.code,
        data.preview_image ?? null,
        data.accuracy_score ?? null
      );
      const variant = getVariantById(id);
      if (variant) {
        createdVariants.push(variant);
      }
    }
  })();

  return createdVariants;
}

// ====================
// SEARCH OPERATIONS
// ====================

/**
 * Search websites by name or URL
 */
export function searchWebsites(query: string): Website[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, name, reference_url, created_at, updated_at, current_version, status
    FROM websites
    WHERE name LIKE ? OR reference_url LIKE ?
    ORDER BY created_at DESC
  `);
  const searchTerm = `%${query}%`;
  return stmt.all(searchTerm, searchTerm) as Website[];
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Check database health
 */
export function checkDatabaseHealth(): { healthy: boolean; error?: string } {
  try {
    const database = getDb();
    database.prepare('SELECT 1').get();
    return { healthy: true };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

/**
 * Reset the database (for testing purposes)
 * WARNING: This will delete all data
 */
export function resetDatabase(): void {
  const database = getDb();

  database.transaction(() => {
    // Drop all tables in reverse order of dependencies
    database.exec('DROP TABLE IF EXISTS error_log');
    database.exec('DROP TABLE IF EXISTS cache');
    database.exec('DROP TABLE IF EXISTS design_tokens');
    database.exec('DROP TABLE IF EXISTS component_variants');
    database.exec('DROP TABLE IF EXISTS components');
    database.exec('DROP TABLE IF EXISTS versions');
    database.exec('DROP TABLE IF EXISTS websites');
  })();

  // Reinitialize
  initializeDatabase();
}
