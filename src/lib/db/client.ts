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

/**
 * Template project record from database
 */
export interface TemplateProjectRecord {
  id: string;
  name: string;
  primary_token_source: string | null;
  section_mapping_json: string | null;
  harmony_score: number | null;
  status: string;
  created_at: string;
}

/**
 * Template project insert data
 */
export interface TemplateProjectInsert {
  id?: string;
  name: string;
  primary_token_source?: string | null;
  section_mapping_json?: string | null;
  harmony_score?: number | null;
  status?: string;
}

/**
 * Template reference record from database
 */
export interface TemplateReferenceRecord {
  id: string;
  project_id: string;
  url: string;
  name: string | null;
  tokens_json: string | null;
  sections_json: string | null;
  created_at: string;
}

/**
 * Template reference insert data
 */
export interface TemplateReferenceInsert {
  id?: string;
  project_id: string;
  url: string;
  name?: string | null;
  tokens_json?: string | null;
  sections_json?: string | null;
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

/**
 * Create multiple components in a transaction
 */
export function createComponentsBatch(components: ComponentInsert[]): ComponentRecord[] {
  const database = getDb();
  const createdComponents: ComponentRecord[] = [];

  const insertStmt = database.prepare(`
    INSERT INTO components (id, website_id, version_id, name, type, order_index,
                            selected_variant, custom_code, approved, accuracy_score, error_message, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  database.transaction(() => {
    for (const data of components) {
      const id = data.id || `component-${randomUUID()}`;
      const status = data.status || 'pending';
      const approved = data.approved ? 1 : 0;

      insertStmt.run(
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
      if (component) {
        createdComponents.push(component);
      }
    }
  })();

  return createdComponents;
}

/**
 * Execute multiple operations in a single transaction
 * Useful for ensuring atomicity when multiple related writes need to happen together
 */
export function withTransaction<T>(fn: () => T): T {
  const database = getDb();
  return database.transaction(fn)();
}

/**
 * Execute an async operation with database transaction semantics
 * Note: better-sqlite3 is synchronous, so this wraps sync transaction around
 * the synchronous parts of an otherwise async operation
 */
export function withTransactionSync<T>(fn: () => T): T {
  const database = getDb();
  return database.transaction(fn)();
}

// ====================
// TEMPLATE PROJECT OPERATIONS
// ====================

/**
 * Get all template projects ordered by creation date (newest first)
 */
export function getTemplateProjects(): TemplateProjectRecord[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, name, primary_token_source, section_mapping_json, harmony_score, status, created_at
    FROM template_projects
    ORDER BY created_at DESC
  `);
  return stmt.all() as TemplateProjectRecord[];
}

/**
 * Get a single template project by ID
 */
export function getTemplateProjectById(id: string): TemplateProjectRecord | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, name, primary_token_source, section_mapping_json, harmony_score, status, created_at
    FROM template_projects
    WHERE id = ?
  `);
  const result = stmt.get(id);
  return (result as TemplateProjectRecord) || null;
}

/**
 * Get template projects by status
 */
export function getTemplateProjectsByStatus(status: string): TemplateProjectRecord[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, name, primary_token_source, section_mapping_json, harmony_score, status, created_at
    FROM template_projects
    WHERE status = ?
    ORDER BY created_at DESC
  `);
  return stmt.all(status) as TemplateProjectRecord[];
}

/**
 * Create a new template project record
 */
export function createTemplateProject(data: TemplateProjectInsert): TemplateProjectRecord {
  const database = getDb();
  const id = data.id || `template-${randomUUID()}`;
  const status = data.status || 'configuring';

  const stmt = database.prepare(`
    INSERT INTO template_projects (id, name, primary_token_source, section_mapping_json, harmony_score, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.name,
    data.primary_token_source ?? null,
    data.section_mapping_json ?? null,
    data.harmony_score ?? null,
    status
  );

  const project = getTemplateProjectById(id);
  if (!project) {
    throw new Error('Failed to create template project record');
  }
  return project;
}

/**
 * Update a template project's status
 */
export function updateTemplateProjectStatus(
  id: string,
  status: string
): TemplateProjectRecord | null {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE template_projects
    SET status = ?
    WHERE id = ?
  `);
  const result = stmt.run(status, id);

  if (result.changes === 0) {
    return null;
  }

  return getTemplateProjectById(id);
}

/**
 * Update a template project record
 */
export function updateTemplateProject(
  id: string,
  data: Partial<Omit<TemplateProjectInsert, 'id'>>
): TemplateProjectRecord | null {
  const database = getDb();
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.primary_token_source !== undefined) {
    updates.push('primary_token_source = ?');
    values.push(data.primary_token_source);
  }
  if (data.section_mapping_json !== undefined) {
    updates.push('section_mapping_json = ?');
    values.push(data.section_mapping_json);
  }
  if (data.harmony_score !== undefined) {
    updates.push('harmony_score = ?');
    values.push(data.harmony_score);
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
  }

  if (updates.length === 0) {
    return getTemplateProjectById(id);
  }

  values.push(id);

  const stmt = database.prepare(`
    UPDATE template_projects
    SET ${updates.join(', ')}
    WHERE id = ?
  `);
  const result = stmt.run(...values);

  if (result.changes === 0) {
    return null;
  }

  return getTemplateProjectById(id);
}

/**
 * Delete a template project by ID
 */
export function deleteTemplateProject(id: string): boolean {
  const database = getDb();
  const stmt = database.prepare('DELETE FROM template_projects WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Count total template projects
 */
export function countTemplateProjects(): number {
  const database = getDb();
  const stmt = database.prepare('SELECT COUNT(*) as count FROM template_projects');
  const result = stmt.get() as { count: number };
  return result.count;
}

/**
 * Count template projects by status
 */
export function countTemplateProjectsByStatus(status: string): number {
  const database = getDb();
  const stmt = database.prepare('SELECT COUNT(*) as count FROM template_projects WHERE status = ?');
  const result = stmt.get(status) as { count: number };
  return result.count;
}

// ====================
// TEMPLATE REFERENCE OPERATIONS
// ====================

/**
 * Get all template references for a project
 */
export function getTemplateReferencesByProject(projectId: string): TemplateReferenceRecord[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, project_id, url, name, tokens_json, sections_json, created_at
    FROM template_references
    WHERE project_id = ?
    ORDER BY created_at ASC
  `);
  return stmt.all(projectId) as TemplateReferenceRecord[];
}

/**
 * Get a single template reference by ID
 */
export function getTemplateReferenceById(id: string): TemplateReferenceRecord | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, project_id, url, name, tokens_json, sections_json, created_at
    FROM template_references
    WHERE id = ?
  `);
  const result = stmt.get(id);
  return (result as TemplateReferenceRecord) || null;
}

/**
 * Create a new template reference record
 */
export function createTemplateReference(data: TemplateReferenceInsert): TemplateReferenceRecord {
  const database = getDb();
  const id = data.id || `reference-${randomUUID()}`;

  const stmt = database.prepare(`
    INSERT INTO template_references (id, project_id, url, name, tokens_json, sections_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.project_id,
    data.url,
    data.name ?? null,
    data.tokens_json ?? null,
    data.sections_json ?? null
  );

  const reference = getTemplateReferenceById(id);
  if (!reference) {
    throw new Error('Failed to create template reference record');
  }
  return reference;
}

/**
 * Update a template reference record
 */
export function updateTemplateReference(
  id: string,
  data: Partial<Omit<TemplateReferenceInsert, 'id' | 'project_id'>>
): TemplateReferenceRecord | null {
  const database = getDb();
  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (data.url !== undefined) {
    updates.push('url = ?');
    values.push(data.url);
  }
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.tokens_json !== undefined) {
    updates.push('tokens_json = ?');
    values.push(data.tokens_json);
  }
  if (data.sections_json !== undefined) {
    updates.push('sections_json = ?');
    values.push(data.sections_json);
  }

  if (updates.length === 0) {
    return getTemplateReferenceById(id);
  }

  values.push(id);

  const stmt = database.prepare(`
    UPDATE template_references
    SET ${updates.join(', ')}
    WHERE id = ?
  `);
  const result = stmt.run(...values);

  if (result.changes === 0) {
    return null;
  }

  return getTemplateReferenceById(id);
}

/**
 * Delete a template reference by ID
 */
export function deleteTemplateReference(id: string): boolean {
  const database = getDb();
  const stmt = database.prepare('DELETE FROM template_references WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Delete all template references for a project
 */
export function deleteTemplateReferencesByProject(projectId: string): number {
  const database = getDb();
  const stmt = database.prepare('DELETE FROM template_references WHERE project_id = ?');
  const result = stmt.run(projectId);
  return result.changes;
}

/**
 * Count template references by project
 */
export function countTemplateReferencesByProject(projectId: string): number {
  const database = getDb();
  const stmt = database.prepare('SELECT COUNT(*) as count FROM template_references WHERE project_id = ?');
  const result = stmt.get(projectId) as { count: number };
  return result.count;
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
    database.exec('DROP TABLE IF EXISTS version_files');
    database.exec('DROP TABLE IF EXISTS versions');
    database.exec('DROP TABLE IF EXISTS websites');
  })();

  // Reinitialize
  initializeDatabase();
}

// ====================
// VERSION OPERATIONS
// ====================

export interface VersionRecord {
  id: string;
  website_id: string;
  version_number: string;
  created_at: string;
  tokens_json: string | null;
  accuracy_score: number | null;
  changelog: string | null;
  is_active: number;
  parent_version_id: string | null;
}

export interface VersionInsertData {
  id?: string;
  website_id: string;
  version_number: string;
  tokens_json?: string | null;
  accuracy_score?: number | null;
  changelog?: string | null;
  is_active?: boolean;
  parent_version_id?: string | null;
}

export interface VersionFileRecord {
  id: string;
  version_id: string;
  file_path: string;
  file_hash: string;
  file_size: number;
  created_at: string;
}

export interface VersionFileInsertData {
  id?: string;
  version_id: string;
  file_path: string;
  file_hash: string;
  file_size: number;
}

/**
 * Get all versions for a website
 */
export function getVersions(websiteId: string): VersionRecord[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT * FROM versions
    WHERE website_id = ?
    ORDER BY created_at DESC
  `);
  return stmt.all(websiteId) as VersionRecord[];
}

/**
 * Get a version by ID
 */
export function getVersionById(id: string): VersionRecord | null {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM versions WHERE id = ?');
  return (stmt.get(id) as VersionRecord) || null;
}

/**
 * Create a new version
 */
export function createVersion(data: VersionInsertData): VersionRecord {
  const database = getDb();
  const id = data.id || `version-${randomUUID()}`;
  const now = new Date().toISOString();

  const stmt = database.prepare(`
    INSERT INTO versions (id, website_id, version_number, created_at, tokens_json, accuracy_score, changelog, is_active, parent_version_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.website_id,
    data.version_number,
    now,
    data.tokens_json || null,
    data.accuracy_score || null,
    data.changelog || null,
    data.is_active ? 1 : 0,
    data.parent_version_id || null
  );

  return getVersionById(id)!;
}

/**
 * Set a version as active (deactivates all other versions for the website)
 */
export function setActiveVersion(versionId: string): VersionRecord | null {
  const database = getDb();
  const version = getVersionById(versionId);
  if (!version) return null;

  database.transaction(() => {
    // Deactivate all versions for this website
    const deactivateStmt = database.prepare(`
      UPDATE versions SET is_active = 0 WHERE website_id = ?
    `);
    deactivateStmt.run(version.website_id);

    // Activate the specified version
    const activateStmt = database.prepare(`
      UPDATE versions SET is_active = 1 WHERE id = ?
    `);
    activateStmt.run(versionId);
  })();

  return getVersionById(versionId);
}

/**
 * Get the active version for a website
 */
export function getActiveVersion(websiteId: string): VersionRecord | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT * FROM versions
    WHERE website_id = ? AND is_active = 1
    LIMIT 1
  `);
  return (stmt.get(websiteId) as VersionRecord) || null;
}

/**
 * Get all files for a version
 */
export function getVersionFiles(versionId: string): VersionFileRecord[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT * FROM version_files
    WHERE version_id = ?
    ORDER BY file_path
  `);
  return stmt.all(versionId) as VersionFileRecord[];
}

/**
 * Create a version file record
 */
export function createVersionFile(data: VersionFileInsertData): VersionFileRecord {
  const database = getDb();
  const id = data.id || `vf-${randomUUID()}`;
  const now = new Date().toISOString();

  const stmt = database.prepare(`
    INSERT INTO version_files (id, version_id, file_path, file_hash, file_size, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, data.version_id, data.file_path, data.file_hash, data.file_size, now);

  const getStmt = database.prepare('SELECT * FROM version_files WHERE id = ?');
  return getStmt.get(id) as VersionFileRecord;
}

/**
 * Batch create version files
 */
export function createVersionFilesBatch(files: VersionFileInsertData[]): VersionFileRecord[] {
  const database = getDb();
  const createdFiles: VersionFileRecord[] = [];
  const now = new Date().toISOString();

  const insertStmt = database.prepare(`
    INSERT INTO version_files (id, version_id, file_path, file_hash, file_size, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  database.transaction(() => {
    for (const data of files) {
      const id = data.id || `vf-${randomUUID()}`;
      insertStmt.run(id, data.version_id, data.file_path, data.file_hash, data.file_size, now);
      createdFiles.push({
        id,
        version_id: data.version_id,
        file_path: data.file_path,
        file_hash: data.file_hash,
        file_size: data.file_size,
        created_at: now,
      });
    }
  })();

  return createdFiles;
}

/**
 * Delete all files for a version
 */
export function deleteVersionFiles(versionId: string): number {
  const database = getDb();
  const stmt = database.prepare('DELETE FROM version_files WHERE version_id = ?');
  const result = stmt.run(versionId);
  return result.changes;
}
