# Auto Claude Prompt - Phase 6

## Oppgave: Implementer Phase 6 av Website Cooker

Les først PROJECT_PLAN.md for full kontekst.

Phase 1-5 er ferdige og testet med Fluence (Phase 4.5).

---

## Din oppgave: Phase 6 - History & Versioning System

### 6.1 Version Management
Lag `src/lib/versioning/version-manager.ts`:

```typescript
interface Version {
  id: string;
  websiteId: string;
  versionNumber: number;
  createdAt: Date;
  tokens: DesignSystem;
  components: string[];      // Component file paths
  accuracyScore: number;
  changelog: string;
  isActive: boolean;
}

interface VersionManager {
  createVersion(websiteId: string, changes: string): Promise<Version>;
  getVersions(websiteId: string): Promise<Version[]>;
  getVersion(versionId: string): Promise<Version>;
  setActiveVersion(versionId: string): Promise<void>;
  rollback(websiteId: string, targetVersionId: string): Promise<Version>;
  compareVersions(v1: string, v2: string): Promise<VersionDiff>;
}
```

### 6.2 Automatic Versioning Triggers

Ny versjon opprettes automatisk ved:
- Første generering (v1.0)
- Token editor endringer (v1.1, v1.2...)
- Component regenerering (v2.0)
- Manual save
- After auto-refinement

```typescript
// Eksempel: Auto-increment logic
function getNextVersion(current: string, changeType: ChangeType): string {
  const [major, minor] = current.split('.').map(Number);

  switch (changeType) {
    case 'initial':
      return '1.0';
    case 'token_edit':
    case 'minor_fix':
      return `${major}.${minor + 1}`;
    case 'regenerate':
    case 'major_change':
      return `${major + 1}.0`;
  }
}
```

### 6.3 Version Storage Structure

```
Websites/website-001/
├── versions/
│   ├── v1.0/
│   │   ├── src/
│   │   │   └── components/
│   │   ├── design-system.json
│   │   ├── tailwind.config.js
│   │   ├── accuracy-report.json
│   │   └── metadata.json
│   ├── v1.1/
│   │   └── ...
│   └── v2.0/
│       └── ...
├── current/              # Symlink til active version
└── metadata.json         # Active version, timestamps
```

### 6.4 Changelog Generator
Lag `src/lib/versioning/changelog-generator.ts`:

```typescript
interface ChangelogEntry {
  version: string;
  date: Date;
  changes: Change[];
  accuracyDelta: number;  // +2.3% improvement
}

interface Change {
  type: 'added' | 'modified' | 'removed' | 'fixed';
  component?: string;
  description: string;
}

// Auto-generate changelog fra diffs
function generateChangelog(
  oldVersion: Version,
  newVersion: Version
): ChangelogEntry {
  // Compare tokens, components, accuracy
  // Generate human-readable description
}
```

### 6.5 Database Schema Update

```sql
-- Versions table
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
  FOREIGN KEY (website_id) REFERENCES websites(id),
  FOREIGN KEY (parent_version_id) REFERENCES versions(id)
);

-- Version files table (track which files belong to version)
CREATE TABLE version_files (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  FOREIGN KEY (version_id) REFERENCES versions(id)
);
```

### 6.6 History UI
Lag `src/app/history/[id]/page.tsx`:

```
┌──────────────────────────────────────────────────────────┐
│  Version History: Website 001                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  v2.0 (current)     Jan 15, 14:32    96.2%  ✓          │
│  ├─ Regenerated Hero section                            │
│  └─ Fixed button colors                                 │
│                                                          │
│  v1.2               Jan 15, 13:15    94.7%              │
│  └─ Adjusted typography scale                           │
│                                                          │
│  v1.1               Jan 15, 12:30    93.1%              │
│  └─ Modified primary color palette                      │
│                                                          │
│  v1.0               Jan 15, 10:00    89.3%              │
│  └─ Initial generation                                  │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  Selected: v1.2                                         │
│  [View] [Compare with current] [Rollback to this]      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 6.7 Version Components
Lag `src/components/History/`:

```
src/components/History/
├── VersionList.tsx          # Liste over alle versjoner
├── VersionCard.tsx          # Enkelt version entry
├── VersionTimeline.tsx      # Visual timeline
├── ChangelogView.tsx        # Viser changes for version
├── DiffViewer.tsx           # Side-by-side diff
├── RollbackDialog.tsx       # Confirmation dialog
├── CompareSelector.tsx      # Velg to versjoner å compare
└── index.ts
```

### 6.8 Diff Viewer
Lag `src/components/History/DiffViewer.tsx`:

Støtte for:
- **Code diff:** Side-by-side kode-sammenligning
- **Visual diff:** Screenshot comparison
- **Token diff:** Highlight endrede design tokens
- **Accuracy diff:** Viser accuracy endring

```typescript
interface DiffViewerProps {
  versionA: Version;
  versionB: Version;
  mode: 'code' | 'visual' | 'tokens' | 'accuracy';
}
```

### 6.9 Rollback Functionality
Lag `src/lib/versioning/rollback.ts`:

```typescript
async function rollbackToVersion(
  websiteId: string,
  targetVersionId: string
): Promise<Version> {
  // 1. Get target version
  const target = await getVersion(targetVersionId);

  // 2. Create new version from target (non-destructive)
  const newVersion = await createVersion(websiteId, {
    basedOn: targetVersionId,
    changelog: `Rollback to v${target.versionNumber}`
  });

  // 3. Copy files from target to new version
  await copyVersionFiles(targetVersionId, newVersion.id);

  // 4. Set new version as active
  await setActiveVersion(newVersion.id);

  // 5. Update current/ symlink
  await updateCurrentSymlink(websiteId, newVersion.id);

  return newVersion;
}
```

**Viktig:** Rollback er non-destructive - den lager en NY versjon basert på gammel.

### 6.10 API Routes

```
src/app/api/
├── versions/
│   ├── route.ts              # GET all, POST new
│   └── [id]/
│       ├── route.ts          # GET one, DELETE
│       ├── activate/
│       │   └── route.ts      # POST activate
│       └── rollback/
│           └── route.ts      # POST rollback
└── compare/
    └── route.ts              # POST compare two versions
```

---

## Deliverables

- [ ] Version manager med CRUD operations
- [ ] Automatic versioning on changes
- [ ] Version storage structure
- [ ] Changelog auto-generation
- [ ] History UI med timeline
- [ ] Diff viewer (code, visual, tokens)
- [ ] Rollback functionality (non-destructive)
- [ ] API routes for version management
- [ ] Database tables updated

---

## Test når ferdig

1. Generer en website (skal lage v1.0)
2. Endre tokens i editor (skal lage v1.1)
3. Gå til `/history/[id]`
4. Verifiser:
   - Alle versjoner vises
   - Changelog er korrekt
   - Diff viewer fungerer
   - Rollback lager ny versjon
5. Rollback til v1.0, verifiser at v1.2 (eller v2.0) opprettes

---

## Viktig

- Aldri slett gamle versjoner
- Rollback = ny versjon, ikke overskriving
- Symlink `current/` skal alltid peke på aktiv versjon
- Changelog skal være lesbar for mennesker
