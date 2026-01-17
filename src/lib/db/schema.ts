/**
 * SQLite Database Schema Definitions
 *
 * This module exports SQL statements for creating the database schema
 * used by the Website Cooker application.
 */

// ====================
// TABLE DEFINITIONS
// ====================

/**
 * Websites table - Core table for tracking generated websites
 */
export const CREATE_TABLE_WEBSITES = `
CREATE TABLE websites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  reference_url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  current_version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'in_progress',
  progress_phase TEXT DEFAULT NULL,
  progress_percent INTEGER DEFAULT 0,
  progress_message TEXT DEFAULT NULL
)`;

/**
 * Versions table - Track version history for each website
 */
export const CREATE_TABLE_VERSIONS = `
CREATE TABLE versions (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL,
  version_number TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  tokens_json TEXT,
  accuracy_score REAL,
  changelog TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  parent_version_id TEXT,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_version_id) REFERENCES versions(id) ON DELETE SET NULL
)`;

/**
 * Version files table - Track files included in each version
 */
export const CREATE_TABLE_VERSION_FILES = `
CREATE TABLE version_files (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE
)`;

/**
 * Components table - Track individual components per website/version
 */
export const CREATE_TABLE_COMPONENTS = `
CREATE TABLE components (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL,
  version_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  selected_variant TEXT,
  custom_code TEXT,
  approved BOOLEAN DEFAULT FALSE,
  accuracy_score REAL,
  error_message TEXT,
  status TEXT DEFAULT 'pending',
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
  FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE
)`;

/**
 * Component variants table - Store generated variants for each component
 */
export const CREATE_TABLE_COMPONENT_VARIANTS = `
CREATE TABLE component_variants (
  id TEXT PRIMARY KEY,
  component_id TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  preview_image TEXT,
  accuracy_score REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE
)`;

/**
 * Cache table - Domain-based caching for tokens and screenshots
 */
export const CREATE_TABLE_CACHE = `
CREATE TABLE cache (
  domain TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
)`;

/**
 * Error log table - Track errors during extraction process
 */
export const CREATE_TABLE_ERROR_LOG = `
CREATE TABLE error_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  website_id TEXT,
  phase TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT,
  recovery_action TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE SET NULL
)`;

/**
 * Design tokens table - Store extracted design tokens per website
 */
export const CREATE_TABLE_DESIGN_TOKENS = `
CREATE TABLE design_tokens (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL,
  tokens_json TEXT NOT NULL,
  is_modified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
)`;

/**
 * Template projects table - Store multi-reference mixing projects
 */
export const CREATE_TABLE_TEMPLATE_PROJECTS = `
CREATE TABLE template_projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  primary_token_source TEXT,
  section_mapping_json TEXT,
  harmony_score REAL,
  status TEXT DEFAULT 'configuring',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

/**
 * Template references table - Store reference URLs for template projects
 */
export const CREATE_TABLE_TEMPLATE_REFERENCES = `
CREATE TABLE template_references (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  url TEXT NOT NULL,
  name TEXT,
  tokens_json TEXT,
  sections_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES template_projects(id) ON DELETE CASCADE
)`;

// ====================
// INDEX DEFINITIONS
// ====================

/**
 * Index for faster website lookups by status
 */
export const CREATE_INDEX_WEBSITES_STATUS = `
CREATE INDEX idx_websites_status ON websites(status)`;

/**
 * Index for faster version lookups by website
 */
export const CREATE_INDEX_VERSIONS_WEBSITE = `
CREATE INDEX idx_versions_website ON versions(website_id)`;

/**
 * Index for version files lookups by version
 */
export const CREATE_INDEX_VERSION_FILES_VERSION = `
CREATE INDEX idx_version_files_version ON version_files(version_id)`;

/**
 * Index for faster component lookups by website and version
 */
export const CREATE_INDEX_COMPONENTS_WEBSITE = `
CREATE INDEX idx_components_website ON components(website_id)`;

export const CREATE_INDEX_COMPONENTS_VERSION = `
CREATE INDEX idx_components_version ON components(version_id)`;

/**
 * Index for variant lookups by component
 */
export const CREATE_INDEX_VARIANTS_COMPONENT = `
CREATE INDEX idx_variants_component ON component_variants(component_id)`;

/**
 * Index for cache expiry cleanup
 */
export const CREATE_INDEX_CACHE_EXPIRES = `
CREATE INDEX idx_cache_expires ON cache(expires_at)`;

/**
 * Index for error log lookups by website and resolution status
 */
export const CREATE_INDEX_ERROR_LOG_WEBSITE = `
CREATE INDEX idx_error_log_website ON error_log(website_id)`;

export const CREATE_INDEX_ERROR_LOG_RESOLVED = `
CREATE INDEX idx_error_log_resolved ON error_log(resolved)`;

/**
 * Index for design tokens lookups by website
 */
export const CREATE_INDEX_DESIGN_TOKENS_WEBSITE = `
CREATE INDEX idx_design_tokens_website ON design_tokens(website_id)`;

/**
 * Index for template references lookups by project
 */
export const CREATE_INDEX_TEMPLATE_REFERENCES_PROJECT = `
CREATE INDEX idx_template_references_project ON template_references(project_id)`;

// ====================
// ALL STATEMENTS
// ====================

/**
 * All table creation statements in order of dependency
 */
export const ALL_TABLE_STATEMENTS = [
  CREATE_TABLE_WEBSITES,
  CREATE_TABLE_VERSIONS,
  CREATE_TABLE_VERSION_FILES,
  CREATE_TABLE_COMPONENTS,
  CREATE_TABLE_COMPONENT_VARIANTS,
  CREATE_TABLE_CACHE,
  CREATE_TABLE_ERROR_LOG,
  CREATE_TABLE_DESIGN_TOKENS,
  CREATE_TABLE_TEMPLATE_PROJECTS,
  CREATE_TABLE_TEMPLATE_REFERENCES,
] as const;

/**
 * All index creation statements
 */
export const ALL_INDEX_STATEMENTS = [
  CREATE_INDEX_WEBSITES_STATUS,
  CREATE_INDEX_VERSIONS_WEBSITE,
  CREATE_INDEX_VERSION_FILES_VERSION,
  CREATE_INDEX_COMPONENTS_WEBSITE,
  CREATE_INDEX_COMPONENTS_VERSION,
  CREATE_INDEX_VARIANTS_COMPONENT,
  CREATE_INDEX_CACHE_EXPIRES,
  CREATE_INDEX_ERROR_LOG_WEBSITE,
  CREATE_INDEX_ERROR_LOG_RESOLVED,
  CREATE_INDEX_DESIGN_TOKENS_WEBSITE,
  CREATE_INDEX_TEMPLATE_REFERENCES_PROJECT,
] as const;

/**
 * All schema statements (tables + indexes) in execution order
 */
export const ALL_SCHEMA_STATEMENTS = [
  ...ALL_TABLE_STATEMENTS,
  ...ALL_INDEX_STATEMENTS,
] as const;

// ====================
// SCHEMA INFO
// ====================

/**
 * Database schema version for migrations
 */
export const SCHEMA_VERSION = 1;

/**
 * Schema metadata
 */
export const SCHEMA_INFO = {
  version: SCHEMA_VERSION,
  tables: ['websites', 'versions', 'version_files', 'components', 'component_variants', 'cache', 'error_log', 'design_tokens', 'template_projects', 'template_references'],
  description: 'Website Cooker database schema for tracking generated websites, versions, and extraction state',
} as const;
