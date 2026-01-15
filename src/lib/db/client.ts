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
import type { Website, WebsiteInsert, WebsiteStatus } from '@/types';

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
    database.exec('DROP TABLE IF EXISTS components');
    database.exec('DROP TABLE IF EXISTS versions');
    database.exec('DROP TABLE IF EXISTS websites');
  })();

  // Reinitialize
  initializeDatabase();
}
