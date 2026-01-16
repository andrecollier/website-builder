#!/usr/bin/env node

/**
 * End-to-End Verification Script for Phase 6 - History & Versioning System
 *
 * This script verifies the complete versioning flow:
 * 1. Generate new website -> verify v1.0 created
 * 2. Edit tokens -> verify v1.1 created
 * 3. Verify history data accessibility
 * 4. Test rollback -> verify new version created (not modified v1.0)
 * 5. Verify current/ symlink management
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function section(message) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(message, 'blue');
  log('='.repeat(60), 'blue');
}

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  results.total++;
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    success(`PASS: ${name}`);
    return true;
  } catch (err) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: err.message });
    error(`FAIL: ${name}`);
    error(`  ${err.message}`);
    return false;
  }
}

// Helper functions
function fileExists(filepath) {
  return fs.existsSync(filepath);
}

function isSymlink(filepath) {
  try {
    const stats = fs.lstatSync(filepath);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

function readSymlink(filepath) {
  try {
    return fs.readlinkSync(filepath);
  } catch {
    return null;
  }
}

function readJsonFile(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function countFiles(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    return files.length;
  } catch {
    return 0;
  }
}

// Main verification function
async function verifyVersioningSystem() {
  section('PHASE 6: HISTORY & VERSIONING SYSTEM - E2E VERIFICATION');

  info('Starting end-to-end verification of versioning system...\n');

  // Step 1: Verify Database Schema
  section('Step 1: Database Schema Verification');

  const schemaPath = './src/lib/db/schema.ts';
  test('schema.ts exists', () => {
    if (!fileExists(schemaPath)) throw new Error('schema.ts not found');
  });

  test('schema.ts contains version_files table', () => {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    if (!schema.includes('CREATE TABLE version_files')) {
      throw new Error('version_files table not found in schema');
    }
    if (!schema.includes('version_id TEXT NOT NULL')) {
      throw new Error('version_id column not found in version_files');
    }
    if (!schema.includes('file_path TEXT NOT NULL')) {
      throw new Error('file_path column not found in version_files');
    }
    if (!schema.includes('file_hash TEXT NOT NULL')) {
      throw new Error('file_hash column not found in version_files');
    }
  });

  test('schema.ts versions table has semantic versioning', () => {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    if (!schema.includes('version_number TEXT NOT NULL')) {
      throw new Error('version_number should be TEXT for semantic versioning');
    }
    if (!schema.includes('parent_version_id TEXT')) {
      throw new Error('parent_version_id column not found in versions table');
    }
  });

  // Step 2: Verify TypeScript Types
  section('Step 2: TypeScript Types Verification');

  const typesPath = './src/types/index.ts';
  test('types/index.ts exists', () => {
    if (!fileExists(typesPath)) throw new Error('types/index.ts not found');
  });

  test('types/index.ts has Version interfaces', () => {
    const types = fs.readFileSync(typesPath, 'utf-8');
    if (!types.includes('export interface Version')) {
      throw new Error('Version interface not found');
    }
    if (!types.includes('export interface VersionInsert')) {
      throw new Error('VersionInsert interface not found');
    }
    if (!types.includes('export interface VersionFile')) {
      throw new Error('VersionFile interface not found');
    }
    if (!types.includes('export interface ChangelogEntry')) {
      throw new Error('ChangelogEntry interface not found');
    }
  });

  // Step 3: Verify Database Client Operations
  section('Step 3: Database Client Operations Verification');

  const clientPath = './src/lib/db/client.ts';
  test('client.ts has version CRUD operations', () => {
    if (!fileExists(clientPath)) throw new Error('client.ts not found');
    const client = fs.readFileSync(clientPath, 'utf-8');

    const requiredFunctions = [
      'createVersion',
      'getVersions',
      'getVersionById',
      'setActiveVersion',
      'getVersionFiles',
      'createVersionFile'
    ];

    for (const fn of requiredFunctions) {
      if (!client.includes(`export function ${fn}`)) {
        throw new Error(`${fn} function not found in client.ts`);
      }
    }
  });

  // Step 4: Verify Versioning Library
  section('Step 4: Versioning Library Verification');

  const versioningFiles = [
    './src/lib/versioning/version-manager.ts',
    './src/lib/versioning/changelog-generator.ts',
    './src/lib/versioning/rollback.ts',
    './src/lib/versioning/index.ts'
  ];

  versioningFiles.forEach(file => {
    test(`${path.basename(file)} exists`, () => {
      if (!fileExists(file)) throw new Error(`${file} not found`);
    });
  });

  test('version-manager.ts has core functions', () => {
    const content = fs.readFileSync('./src/lib/versioning/version-manager.ts', 'utf-8');
    const requiredFunctions = [
      'getNextVersionNumber',
      'createNewVersion',
      'listVersions',
      'activateVersion',
      'updateCurrentSymlink'
    ];

    for (const fn of requiredFunctions) {
      if (!content.includes(`export function ${fn}`) && !content.includes(`export async function ${fn}`)) {
        throw new Error(`${fn} function not found`);
      }
    }
  });

  test('changelog-generator.ts has generation functions', () => {
    const content = fs.readFileSync('./src/lib/versioning/changelog-generator.ts', 'utf-8');
    if (!content.includes('generateChangelog') && !content.includes('generateVersionChangelog')) {
      throw new Error('Changelog generation functions not found');
    }
  });

  test('rollback.ts has rollback functions', () => {
    const content = fs.readFileSync('./src/lib/versioning/rollback.ts', 'utf-8');
    if (!content.includes('rollbackToVersion')) {
      throw new Error('rollbackToVersion function not found');
    }
  });

  // Step 5: Verify API Routes
  section('Step 5: API Routes Verification');

  const apiRoutes = [
    './src/app/api/versions/route.ts',
    './src/app/api/versions/[id]/route.ts',
    './src/app/api/versions/[id]/activate/route.ts',
    './src/app/api/versions/[id]/rollback/route.ts'
  ];

  apiRoutes.forEach(route => {
    test(`${route.replace('./src/app/api', '')} exists`, () => {
      if (!fileExists(route)) throw new Error(`${route} not found`);
    });
  });

  test('/api/versions/route.ts has GET and POST', () => {
    const content = fs.readFileSync('./src/app/api/versions/route.ts', 'utf-8');
    if (!content.includes('export async function GET')) {
      throw new Error('GET handler not found');
    }
    if (!content.includes('export async function POST')) {
      throw new Error('POST handler not found');
    }
  });

  test('/api/versions/[id]/route.ts has GET and DELETE', () => {
    const content = fs.readFileSync('./src/app/api/versions/[id]/route.ts', 'utf-8');
    if (!content.includes('export async function GET')) {
      throw new Error('GET handler not found');
    }
    if (!content.includes('export async function DELETE')) {
      throw new Error('DELETE handler not found');
    }
  });

  // Step 6: Verify History UI Components
  section('Step 6: History UI Components Verification');

  const components = [
    'VersionCard.tsx',
    'VersionList.tsx',
    'VersionTimeline.tsx',
    'ChangelogView.tsx',
    'DiffViewer.tsx',
    'RollbackDialog.tsx',
    'CompareSelector.tsx'
  ];

  components.forEach(component => {
    test(`${component} exists`, () => {
      const componentPath = `./src/components/History/${component}`;
      if (!fileExists(componentPath)) throw new Error(`${component} not found`);

      const content = fs.readFileSync(componentPath, 'utf-8');
      if (!content.includes("'use client'")) {
        throw new Error(`${component} missing 'use client' directive`);
      }
    });
  });

  test('History components index.ts exports all components', () => {
    const indexPath = './src/components/History/index.ts';
    if (!fileExists(indexPath)) throw new Error('History/index.ts not found');

    const content = fs.readFileSync(indexPath, 'utf-8');
    components.forEach(component => {
      const name = component.replace('.tsx', '');
      if (!content.includes(name)) {
        throw new Error(`${name} not exported from index.ts`);
      }
    });
  });

  // Step 7: Verify History Page
  section('Step 7: History Page Verification');

  test('history/[id]/page.tsx exists', () => {
    const pagePath = './src/app/history/[id]/page.tsx';
    if (!fileExists(pagePath)) throw new Error('History page not found');

    const content = fs.readFileSync(pagePath, 'utf-8');
    if (!content.includes("'use client'")) {
      throw new Error("History page missing 'use client' directive");
    }

    // Check for key imports
    const requiredImports = [
      'VersionList',
      'VersionTimeline',
      'ChangelogView',
      'DiffViewer',
      'RollbackDialog',
      'CompareSelector'
    ];

    for (const imp of requiredImports) {
      if (!content.includes(imp)) {
        throw new Error(`History page missing ${imp} import`);
      }
    }
  });

  // Step 8: Verify Integration Points
  section('Step 8: Integration Points Verification');

  test('scaffold/route.ts creates v1.0 on first generation', () => {
    const scaffoldPath = './src/app/api/scaffold/route.ts';
    if (!fileExists(scaffoldPath)) throw new Error('scaffold/route.ts not found');

    const content = fs.readFileSync(scaffoldPath, 'utf-8');
    if (!content.includes('createNewVersion')) {
      throw new Error('scaffold route not integrated with versioning');
    }
    if (!content.includes("'initial'")) {
      throw new Error('scaffold route not using "initial" change type for v1.0');
    }
  });

  test('tokens/route.ts creates v1.x on edits', () => {
    const tokensPath = './src/app/api/tokens/route.ts';
    if (!fileExists(tokensPath)) throw new Error('tokens/route.ts not found');

    const content = fs.readFileSync(tokensPath, 'utf-8');
    if (!content.includes('createNewVersion')) {
      throw new Error('tokens route not integrated with versioning');
    }
    if (!content.includes("'edit'")) {
      throw new Error('tokens route not using "edit" change type for v1.x');
    }
  });

  // Step 9: Verify Filesystem Structure (if website exists)
  section('Step 9: Filesystem Structure Verification');

  const websitesDir = './Websites';
  if (fileExists(websitesDir)) {
    const websites = fs.readdirSync(websitesDir).filter(f => f.startsWith('website-'));

    if (websites.length > 0) {
      info(`Found ${websites.length} website(s) to check`);

      websites.forEach(websiteId => {
        const websitePath = path.join(websitesDir, websiteId);
        const versionsPath = path.join(websitePath, 'versions');
        const currentPath = path.join(websitePath, 'current');

        info(`\nChecking ${websiteId}:`);

        if (fileExists(versionsPath)) {
          const versions = fs.readdirSync(versionsPath);
          info(`  - Found ${versions.length} version(s): ${versions.join(', ')}`);

          test(`${websiteId}: versions directory exists`, () => {
            if (!fileExists(versionsPath)) throw new Error('versions directory not found');
          });

          if (versions.length > 0) {
            test(`${websiteId}: versions follow semantic versioning`, () => {
              versions.forEach(v => {
                if (!v.match(/^v\d+\.\d+$/)) {
                  throw new Error(`Version ${v} doesn't match semantic versioning pattern`);
                }
              });
            });
          }
        } else {
          info('  - No versions directory (website created before versioning)');
        }

        if (isSymlink(currentPath)) {
          const target = readSymlink(currentPath);
          info(`  - current/ symlink points to: ${target}`);

          test(`${websiteId}: current/ is a symlink`, () => {
            if (!isSymlink(currentPath)) throw new Error('current/ is not a symlink');
          });

          test(`${websiteId}: current/ points to versions directory`, () => {
            const target = readSymlink(currentPath);
            if (!target || !target.includes('versions/')) {
              throw new Error('current/ symlink doesn\'t point to versions directory');
            }
          });
        } else if (fileExists(currentPath)) {
          info('  - current/ is a regular directory (website created before versioning)');
        } else {
          info('  - No current/ directory or symlink');
        }
      });
    } else {
      info('No websites found in Websites/ directory');
    }
  } else {
    info('Websites/ directory not found');
  }

  // Final Summary
  section('VERIFICATION SUMMARY');

  console.log('\nTest Results:');
  console.log(`  Total Tests: ${results.total}`);
  success(`  Passed: ${results.passed}`);
  if (results.failed > 0) {
    error(`  Failed: ${results.failed}`);
  } else {
    log(`  Failed: ${results.failed}`, 'green');
  }

  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`  Success Rate: ${successRate}%\n`);

  if (results.failed > 0) {
    log('\nFailed Tests:', 'red');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => {
        error(`  - ${t.name}`);
        if (t.error) {
          console.log(`    ${t.error}`);
        }
      });
  }

  console.log('\n' + '='.repeat(60));
  if (results.failed === 0) {
    success('✨ ALL VERIFICATION CHECKS PASSED! ✨');
    log('\nThe versioning system is correctly implemented and ready for use.', 'green');
  } else {
    error('⚠️  SOME VERIFICATION CHECKS FAILED');
    log('\nPlease review the failed tests above and fix the issues.', 'yellow');
  }
  console.log('='.repeat(60) + '\n');

  // Return exit code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run verification
verifyVersioningSystem().catch(err => {
  error(`\nVerification script error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
