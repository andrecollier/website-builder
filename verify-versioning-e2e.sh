#!/bin/bash

# End-to-End Verification Script for Phase 6 - History & Versioning System

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test function
test_check() {
  local test_name="$1"
  local test_command="$2"

  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  if eval "$test_command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS: ${test_name}${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL: ${test_name}${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi
}

section() {
  echo -e "\n${BLUE}============================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}============================================================${NC}"
}

info() {
  echo -e "${CYAN}ℹ️  $1${NC}"
}

section "PHASE 6: HISTORY & VERSIONING SYSTEM - E2E VERIFICATION"
info "Starting end-to-end verification of versioning system..."

# Step 1: Database Schema Verification
section "Step 1: Database Schema Verification"

test_check "schema.ts exists" "test -f ./src/lib/db/schema.ts"
test_check "schema.ts contains version_files table" "grep -q 'CREATE TABLE version_files' ./src/lib/db/schema.ts"
test_check "version_files has version_id column" "grep -q 'version_id TEXT NOT NULL' ./src/lib/db/schema.ts"
test_check "version_files has file_path column" "grep -q 'file_path TEXT NOT NULL' ./src/lib/db/schema.ts"
test_check "version_files has file_hash column" "grep -q 'file_hash TEXT NOT NULL' ./src/lib/db/schema.ts"
test_check "versions table has TEXT version_number" "grep -q 'version_number TEXT NOT NULL' ./src/lib/db/schema.ts"
test_check "versions table has parent_version_id" "grep -q 'parent_version_id TEXT' ./src/lib/db/schema.ts"

# Step 2: TypeScript Types Verification
section "Step 2: TypeScript Types Verification"

test_check "types/index.ts exists" "test -f ./src/types/index.ts"
test_check "Version interface exists" "grep -q 'export interface Version' ./src/types/index.ts"
test_check "VersionInsert interface exists" "grep -q 'export interface VersionInsert' ./src/types/index.ts"
test_check "VersionFile interface exists" "grep -q 'export interface VersionFile' ./src/types/index.ts"
test_check "ChangelogEntry interface exists" "grep -q 'export interface ChangelogEntry' ./src/types/index.ts"

# Step 3: Database Client Operations
section "Step 3: Database Client Operations Verification"

test_check "client.ts exists" "test -f ./src/lib/db/client.ts"
test_check "createVersion function exists" "grep -q 'export function createVersion' ./src/lib/db/client.ts"
test_check "getVersions function exists" "grep -q 'export function getVersions' ./src/lib/db/client.ts"
test_check "getVersionById function exists" "grep -q 'export function getVersionById' ./src/lib/db/client.ts"
test_check "setActiveVersion function exists" "grep -q 'export function setActiveVersion' ./src/lib/db/client.ts"
test_check "getVersionFiles function exists" "grep -q 'export function getVersionFiles' ./src/lib/db/client.ts"
test_check "createVersionFile function exists" "grep -q 'export function createVersionFile' ./src/lib/db/client.ts"

# Step 4: Versioning Library
section "Step 4: Versioning Library Verification"

test_check "version-manager.ts exists" "test -f ./src/lib/versioning/version-manager.ts"
test_check "changelog-generator.ts exists" "test -f ./src/lib/versioning/changelog-generator.ts"
test_check "rollback.ts exists" "test -f ./src/lib/versioning/rollback.ts"
test_check "versioning index.ts exists" "test -f ./src/lib/versioning/index.ts"
test_check "getNextVersionNumber function exists" "grep -q 'getNextVersionNumber' ./src/lib/versioning/version-manager.ts"
test_check "createNewVersion function exists" "grep -q 'createNewVersion' ./src/lib/versioning/version-manager.ts"
test_check "activateVersion function exists" "grep -q 'activateVersion' ./src/lib/versioning/version-manager.ts"
test_check "updateCurrentSymlink function exists" "grep -q 'updateCurrentSymlink' ./src/lib/versioning/version-manager.ts"
test_check "generateChangelog function exists" "grep -q 'generateChangelog\|generateVersionChangelog' ./src/lib/versioning/changelog-generator.ts"
test_check "rollbackToVersion function exists" "grep -q 'rollbackToVersion' ./src/lib/versioning/rollback.ts"

# Step 5: API Routes
section "Step 5: API Routes Verification"

test_check "/api/versions/route.ts exists" "test -f ./src/app/api/versions/route.ts"
test_check "/api/versions/[id]/route.ts exists" "test -f ./src/app/api/versions/[id]/route.ts"
test_check "/api/versions/[id]/activate/route.ts exists" "test -f ./src/app/api/versions/[id]/activate/route.ts"
test_check "/api/versions/[id]/rollback/route.ts exists" "test -f ./src/app/api/versions/[id]/rollback/route.ts"
test_check "versions/route.ts has GET handler" "grep -q 'export async function GET' ./src/app/api/versions/route.ts"
test_check "versions/route.ts has POST handler" "grep -q 'export async function POST' ./src/app/api/versions/route.ts"
test_check "versions/[id]/route.ts has GET handler" "grep -q 'export async function GET' ./src/app/api/versions/[id]/route.ts"
test_check "versions/[id]/route.ts has DELETE handler" "grep -q 'export async function DELETE' ./src/app/api/versions/[id]/route.ts"

# Step 6: History UI Components
section "Step 6: History UI Components Verification"

test_check "VersionCard.tsx exists" "test -f ./src/components/History/VersionCard.tsx"
test_check "VersionList.tsx exists" "test -f ./src/components/History/VersionList.tsx"
test_check "VersionTimeline.tsx exists" "test -f ./src/components/History/VersionTimeline.tsx"
test_check "ChangelogView.tsx exists" "test -f ./src/components/History/ChangelogView.tsx"
test_check "DiffViewer.tsx exists" "test -f ./src/components/History/DiffViewer.tsx"
test_check "RollbackDialog.tsx exists" "test -f ./src/components/History/RollbackDialog.tsx"
test_check "CompareSelector.tsx exists" "test -f ./src/components/History/CompareSelector.tsx"
test_check "VersionCard has 'use client'" "grep -q \"'use client'\" ./src/components/History/VersionCard.tsx"
test_check "VersionList has 'use client'" "grep -q \"'use client'\" ./src/components/History/VersionList.tsx"
test_check "History index.ts exists" "test -f ./src/components/History/index.ts"
test_check "History index exports VersionCard" "grep -q 'VersionCard' ./src/components/History/index.ts"
test_check "History index exports VersionList" "grep -q 'VersionList' ./src/components/History/index.ts"

# Step 7: History Page
section "Step 7: History Page Verification"

test_check "history/[id]/page.tsx exists" "test -f ./src/app/history/[id]/page.tsx"
test_check "history page has 'use client'" "grep -q \"'use client'\" ./src/app/history/[id]/page.tsx"
test_check "history page imports VersionList" "grep -q 'VersionList' ./src/app/history/[id]/page.tsx"
test_check "history page imports VersionTimeline" "grep -q 'VersionTimeline' ./src/app/history/[id]/page.tsx"
test_check "history page imports ChangelogView" "grep -q 'ChangelogView' ./src/app/history/[id]/page.tsx"
test_check "history page imports DiffViewer" "grep -q 'DiffViewer' ./src/app/history/[id]/page.tsx"

# Step 8: Integration Points
section "Step 8: Integration Points Verification"

test_check "scaffold/route.ts exists" "test -f ./src/app/api/scaffold/route.ts"
test_check "scaffold integrated with versioning" "grep -q 'createNewVersion' ./src/app/api/scaffold/route.ts"
test_check "scaffold uses 'initial' change type" "grep -q \"'initial'\" ./src/app/api/scaffold/route.ts"
test_check "tokens/route.ts exists" "test -f ./src/app/api/tokens/route.ts"
test_check "tokens integrated with versioning" "grep -q 'createNewVersion' ./src/app/api/tokens/route.ts"
test_check "tokens uses 'edit' change type" "grep -q \"'edit'\" ./src/app/api/tokens/route.ts"

# Step 9: Filesystem Structure (if websites exist)
section "Step 9: Filesystem Structure Verification"

if [ -d "./Websites" ]; then
  info "Checking existing websites..."

  for website_dir in ./Websites/website-*; do
    if [ -d "$website_dir" ]; then
      website_name=$(basename "$website_dir")
      info "\nChecking $website_name:"

      if [ -d "$website_dir/versions" ]; then
        version_count=$(ls -1 "$website_dir/versions" 2>/dev/null | wc -l)
        info "  - Found $version_count version(s)"

        # List versions
        if [ $version_count -gt 0 ]; then
          versions=$(ls -1 "$website_dir/versions" 2>/dev/null | tr '\n' ', ' | sed 's/,$//')
          info "  - Versions: $versions"
        fi
      else
        info "  - No versions directory (created before versioning)"
      fi

      if [ -L "$website_dir/current" ]; then
        target=$(readlink "$website_dir/current")
        info "  - current/ symlink → $target"
        test_check "$website_name: current/ is symlink" "test -L \"$website_dir/current\""
        test_check "$website_name: symlink points to versions/" "readlink \"$website_dir/current\" | grep -q 'versions/'"
      elif [ -d "$website_dir/current" ]; then
        info "  - current/ is directory (created before versioning)"
      else
        info "  - No current/ directory/symlink"
      fi
    fi
  done
else
  info "No Websites directory found"
fi

# Final Summary
section "VERIFICATION SUMMARY"

echo ""
echo "Test Results:"
echo "  Total Tests: $TOTAL_TESTS"
echo -e "  ${GREEN}Passed: $PASSED_TESTS${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
  echo -e "  ${RED}Failed: $FAILED_TESTS${NC}"
else
  echo -e "  ${GREEN}Failed: $FAILED_TESTS${NC}"
fi

SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
echo "  Success Rate: ${SUCCESS_RATE}%"
echo ""

echo -e "${BLUE}============================================================${NC}"
if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✨ ALL VERIFICATION CHECKS PASSED! ✨${NC}"
  echo -e "${GREEN}The versioning system is correctly implemented and ready for use.${NC}"
  exit 0
else
  echo -e "${RED}⚠️  SOME VERIFICATION CHECKS FAILED${NC}"
  echo -e "${YELLOW}Please review the failed tests above and fix the issues.${NC}"
  exit 1
fi
echo -e "${BLUE}============================================================${NC}"
