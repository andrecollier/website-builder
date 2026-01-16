# Website Cooker - Project Plan

## Project Overview

En localhost-basert website builder som tar en referanse-URL, ekstraherer design systemet, og genererer en pixel-perfekt kopi med kontinuerlig visuell sammenligning.

---

## Tech Stack

- **Frontend:** Next.js 14 + React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Screenshot/Scraping:** Playwright
- **Visual Comparison:** Pixelmatch / Resemble.js
- **State Management:** Zustand
- **UI Components:** Radix UI (for dashboard)
- **Database:** SQLite (for history/versioning - lokal)
- **Cache:** File-based cache system

---

## Folder Structure

```
website-builder/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Dashboard (URL input + status)
│   │   ├── editor/
│   │   │   └── page.tsx        # Design Token Editor
│   │   ├── preview/
│   │   │   └── [id]/page.tsx   # Component preview + variants
│   │   ├── history/
│   │   │   └── page.tsx        # Version history
│   │   ├── template/
│   │   │   └── page.tsx        # Template Mode (multi-reference)
│   │   ├── api/
│   │   │   ├── start-extraction/
│   │   │   ├── status/
│   │   │   ├── compare/
│   │   │   ├── save-version/
│   │   │   ├── rollback/
│   │   │   └── cache/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── Dashboard/
│   │   │   ├── UrlInput.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   ├── PhaseIndicator.tsx
│   │   │   ├── ProjectList.tsx
│   │   │   └── ErrorRecoveryPanel.tsx
│   │   ├── Editor/
│   │   │   ├── TokenEditor.tsx
│   │   │   ├── ColorPicker.tsx
│   │   │   ├── TypographyEditor.tsx
│   │   │   ├── SpacingEditor.tsx
│   │   │   └── LivePreview.tsx
│   │   ├── Preview/
│   │   │   ├── ComponentCard.tsx
│   │   │   ├── VariantSelector.tsx
│   │   │   ├── ApprovalButtons.tsx
│   │   │   └── SideBySide.tsx
│   │   ├── Template/
│   │   │   ├── ReferenceList.tsx
│   │   │   ├── SectionPicker.tsx
│   │   │   └── MixerCanvas.tsx
│   │   ├── History/
│   │   │   ├── VersionList.tsx
│   │   │   ├── DiffViewer.tsx
│   │   │   └── RollbackButton.tsx
│   │   └── ui/
│   ├── lib/
│   │   ├── playwright/
│   │   │   ├── capture.ts
│   │   │   ├── extract-styles.ts
│   │   │   └── scroll-loader.ts
│   │   ├── design-system/
│   │   │   ├── extractor.ts
│   │   │   ├── synthesizer.ts
│   │   │   └── tokens.ts
│   │   ├── generator/
│   │   │   ├── components.ts
│   │   │   ├── variants.ts      # Variant generation
│   │   │   └── pages.ts
│   │   ├── comparison/
│   │   │   ├── visual-diff.ts
│   │   │   └── accuracy-score.ts
│   │   ├── cache/
│   │   │   ├── token-cache.ts
│   │   │   └── screenshot-cache.ts
│   │   ├── versioning/
│   │   │   ├── history.ts
│   │   │   ├── snapshot.ts
│   │   │   └── rollback.ts
│   │   └── error-recovery/
│   │       ├── recovery-manager.ts
│   │       └── manual-review-queue.ts
│   ├── db/
│   │   ├── schema.ts            # SQLite schema
│   │   └── client.ts
│   └── types/
├── scripts/
│   └── playwright-setup.ts
├── cache/                       # Cached design tokens per domain
│   ├── example.com/
│   │   ├── tokens.json
│   │   └── screenshots/
│   └── ...
├── Websites/                    # Generated websites
│   ├── website-001/
│   │   ├── versions/            # Version history
│   │   │   ├── v1/
│   │   │   ├── v2/
│   │   │   └── ...
│   │   ├── current/             # Current active version
│   │   └── metadata.json
│   ├── website-002/
│   └── ...
├── context/
│   └── visual-references/
├── data/
│   └── history.db               # SQLite database
└── package.json
```

---

## Multi-Phase Plan

### PHASE 1: Project Setup & Dashboard (Del 1)

**1.1 Initialize Next.js Project**
- Next.js 14 med App Router
- TypeScript konfigurasjon
- Tailwind CSS setup
- ESLint + Prettier
- SQLite database setup

**1.2 Dashboard UI**
- Minimalistisk dark-mode interface
- URL input felt (stor, sentrert)
- "Start Extraction" knapp
- "Template Mode" toggle (for multi-reference)
- Liste over tidligere genererte websites med versjonsnummer

**1.3 Status Bar System**
- Real-time progress indicator
- Faser vises som steg (1/8, 2/8, etc.)
- Detaljert sub-status for hver fase
- Estimert tid gjenstående
- Feilhåndtering med tydelige meldinger
- Error Recovery panel (viser failed sections)

**1.4 Template Mode UI**
- Legg til flere referanse-URLer
- Per-seksjon valg (header fra site A, hero fra site B)
- Visual mixer canvas
- Drag-and-drop section reordering

**Deliverables:**
- [x] Fungerende dashboard på localhost:3000
- [x] URL validering
- [x] Status bar komponent
- [x] Template Mode interface
- [x] API routes struktur
- [x] SQLite database initialized

**Status:** ✅ COMPLETE

---

### PHASE 2: Playwright Integration & Anti-Lazy-Load (Del 2)

**2.1 Playwright Setup**
```typescript
// Anti lazy-load strategi
async function captureFullPage(url: string) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // KRITISK: Scroll hele siden for å trigge lazy-load
  await autoScroll(page);

  // Vent på alle bilder
  await page.waitForFunction(() => {
    const images = document.querySelectorAll('img');
    return Array.from(images).every(img => img.complete);
  });

  // Vent på fonts
  await page.evaluate(() => document.fonts.ready);

  // Vent på animasjoner
  await page.waitForTimeout(2000);

  // Ta full-page screenshot
  await page.screenshot({ path: 'full-page.png', fullPage: true });
}

async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0); // Tilbake til toppen
          resolve();
        }
      }, 100);
    });
  });
}
```

**2.2 Section Detection**
- Automatisk identifisering av seksjoner (header, hero, features, etc.)
- Individuelle screenshots per seksjon
- Bounding box koordinater lagret

**2.3 Screenshot Storage & Caching**
```
cache/example.com/
├── tokens.json              # Cached design tokens
├── screenshots/
│   ├── full-page.png
│   └── sections/
│       ├── 01-header.png
│       └── ...
└── metadata.json            # Cache timestamp, expiry

Websites/website-001/
├── reference/
│   ├── full-page.png
│   ├── sections/
│   │   ├── 01-header.png
│   │   ├── 02-hero.png
│   │   ├── 03-features.png
│   │   └── ...
│   └── metadata.json
```

**2.4 Caching System**
- Check cache før nye screenshots tas
- Cache invalidation basert på tid (24 timer default)
- Manual cache clear option
- Cache hit/miss logging

**2.5 Error Recovery - Screenshot Phase**
- Retry logic for failed page loads
- Partial capture (continue if one section fails)
- Mark failed sections for manual review
- Detailed error logging

**Deliverables:**
- [x] Playwright script med anti-lazy-load
- [x] Automatisk section detection
- [x] Screenshot storage system
- [x] Domain-based caching system
- [x] Error recovery for failed captures

**Status:** ✅ COMPLETE

---

### PHASE 3: Design System Extraction & Token Editor (Del 3)

**3.1 Color Extraction**
- Alle farger fra computed styles
- Gruppering i primary/secondary/neutral
- Automatisk palette generering
- Kontrast-ratio beregning (WCAG)

**3.2 Typography Extraction**
- Font families (med fallbacks)
- Font sizes (px → rem konvertering)
- Font weights
- Line heights
- Letter spacing

**3.3 Spacing & Layout**
- Padding/margin patterns
- Grid system detection
- Container max-widths
- Gap values

**3.4 Effects Extraction**
- Border radius values
- Box shadows
- Transitions/animations
- Opacity values

**3.5 Design Token Editor UI**
```typescript
interface TokenEditorState {
  originalTokens: DesignSystem;
  modifiedTokens: DesignSystem;
  previewComponent: string | null;
  isDirty: boolean;
}
```

**Token Editor Features:**
- Visual color picker med palette suggestions
- Typography preview med live text
- Spacing visualizer (box model display)
- Effects preview (shadows, radius)
- Real-time preview av endringer
- Reset to original button
- Save & continue button

**3.6 Live Preview Panel**
- Viser en sample komponent med current tokens
- Updates instantly on token change
- Toggle between light/dark mode preview
- Responsive preview (mobile/tablet/desktop)

**3.7 Cache Token Results**
- Lagre ekstraherte tokens per domene
- Skip extraction hvis cache finnes
- Option til å force re-extract

**3.8 Error Recovery - Extraction Phase**
- Fallback values for missing tokens
- Partial extraction (continue if some values fail)
- Manual override option

**Deliverables:**
- [x] design-system.json for hver website
- [x] Tailwind config generert fra tokens
- [x] CSS variables fil
- [x] Token Editor UI med live preview
- [x] Token caching per domain
- [x] Error recovery for failed extractions

**Status:** ✅ COMPLETE

---

### PHASE 4: Component Detection & Generation with Variants (Del 4)

**4.1 Component Identification**
- Header/Navigation
- Hero sections
- Feature grids
- Testimonials
- Pricing tables
- Footer
- CTAs/Buttons
- Cards

**4.2 Component Generation with Variants**
```typescript
interface ComponentGeneration {
  name: string;
  variants: ComponentVariant[];
  selectedVariant: number;
  approved: boolean;
}

interface ComponentVariant {
  id: string;
  code: string;
  description: string;
  previewImage: string;
  accuracyScore: number;
}
```

**Variant Generation Strategy:**
1. **Variant A:** Eksakt match (pixel-perfect forsøk)
2. **Variant B:** Semantisk match (samme struktur, litt frihet)
3. **Variant C:** Modernisert (forbedret accessibility/performance)

**4.3 Incremental Generation & Approval**
- Generer én komponent om gangen
- Vis komponent i dashboard umiddelbart
- Bruker kan:
  - Velge mellom varianter
  - Godkjenne og fortsette
  - Avvise og re-generere
  - Manuelt redigere kode
- Neste komponent starter kun etter approval

**4.4 Incremental Preview UI**
```
┌─────────────────────────────────────────────────────┐
│  Component: Hero Section          [2/7 components]  │
├─────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │ Variant │  │ Variant │  │ Variant │             │
│  │    A    │  │    B    │  │    C    │             │
│  │  98.2%  │  │  94.7%  │  │  91.3%  │             │
│  └─────────┘  └─────────┘  └─────────┘             │
│       ✓                                             │
│                                                     │
│  [View Code]  [Edit]  [Regenerate]                 │
│                                                     │
│         [ Approve & Continue → ]                    │
└─────────────────────────────────────────────────────┘
```

**4.5 Error Recovery - Generation Phase**
- If component generation fails:
  - Log error med context
  - Mark as "needs manual review"
  - Continue with next component
  - Queue for retry later
- Manual Review Queue UI
- Bulk retry option

**4.6 Component Library Structure**
```
Websites/website-001/
├── current/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── variants/
│   │   │   │   │   ├── variant-a.tsx
│   │   │   │   │   ├── variant-b.tsx
│   │   │   │   │   └── variant-c.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Hero/
│   │   │   └── ...
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── tailwind.config.js
│   │   └── pages/
│   │       └── index.tsx
│   └── package.json
├── failed-components/           # Failed generations for review
│   ├── Testimonials.error.json
│   └── ...
└── metadata.json
```

**Deliverables:**
- [x] Automatisk komponent-generering
- [ ] 3 varianter per komponent (delvis - 1 variant generert)
- [ ] Incremental preview UI
- [ ] Approval workflow
- [ ] Error recovery + manual review queue
- [x] Props interface for hver komponent

**Status:** ✅ CORE COMPLETE (komponent-generering fungerer)

---

### PHASE 5: Visual Comparison System (Del 5)

**5.1 Comparison Engine**
```typescript
interface ComparisonResult {
  sectionName: string;
  accuracy: number;        // 0-100%
  diffImage: string;       // Path til diff visualization
  mismatches: Mismatch[];
}

interface Mismatch {
  type: 'color' | 'spacing' | 'typography' | 'layout';
  expected: string;
  actual: string;
  location: BoundingBox;
  severity: 'low' | 'medium' | 'high';
}
```

**5.2 Comparison Process**
1. Render generert komponent
2. Ta screenshot av rendret komponent
3. Sammenlign med original section screenshot
4. Generer diff-bilde med markerte forskjeller
5. Beregn accuracy score

**5.3 Iterative Improvement**
- Hvis accuracy < 95%, foreslå justeringer
- Automatisk tweaking av spacing/colors
- Re-render og re-compare
- Logg alle iterasjoner
- Max 5 iterasjoner før manual review

**5.4 Comparison Dashboard**
- Side-by-side view (original vs generert)
- Overlay mode (toggle mellom)
- Diff highlighting
- Per-section accuracy scores
- Overall project accuracy
- Iteration history

**Deliverables:**
- [ ] Visual diff engine
- [ ] Accuracy scoring system
- [ ] Comparison UI i dashboard
- [ ] Iterativ forbedring loop

---

### PHASE 6: History & Versioning System (Del 6)

**6.1 Version Management**
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
```

**6.2 Automatic Versioning**
- Ny versjon opprettes ved:
  - Første generering (v1)
  - Token editor endringer (v1.1, v1.2...)
  - Component regenerering (v2)
  - Manual save
- Automatisk changelog generering

**6.3 Version Storage**
```
Websites/website-001/
├── versions/
│   ├── v1/
│   │   ├── src/
│   │   ├── tokens.json
│   │   ├── accuracy-report.json
│   │   └── metadata.json
│   ├── v2/
│   │   └── ...
│   └── v3/
│       └── ...
├── current/              # Symlink eller kopi av active version
└── metadata.json         # Active version, creation date, etc.
```

**6.4 History UI**
```
┌──────────────────────────────────────────────────────┐
│  Version History: Website 001                        │
├──────────────────────────────────────────────────────┤
│  v3 (current)     2024-01-15 14:32    96.2%         │
│  └─ Changed primary color, regenerated Hero          │
│                                                      │
│  v2               2024-01-15 12:15    94.7%         │
│  └─ Approved all components, minor spacing fixes     │
│                                                      │
│  v1               2024-01-15 10:00    89.3%         │
│  └─ Initial generation                               │
│                                                      │
│  [View v2]  [Compare v2 ↔ v3]  [Rollback to v2]     │
└──────────────────────────────────────────────────────┘
```

**6.5 Rollback Functionality**
- One-click rollback til previous version
- Confirmation dialog med diff preview
- Rollback creates new version (non-destructive)
- Audit log of all rollbacks

**6.6 Diff Between Versions**
- Visual diff of rendered pages
- Code diff of components
- Token diff (color, typography changes)
- Accuracy score comparison

**Deliverables:**
- [ ] SQLite version storage
- [ ] Automatic version creation
- [ ] History UI
- [ ] Rollback functionality
- [ ] Version diff viewer
- [ ] Changelog generation

---

### PHASE 7: Template Mode - Multi-Reference Mixing (Del 7)

**7.1 Multi-Reference Input**
- Add multiple reference URLs
- Each URL gets full extraction
- Cached tokens used when available

**7.2 Section Picker UI**
```
┌─────────────────────────────────────────────────────────┐
│  Template Mode: Mix & Match                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  HEADER         [ Site A ▼ ]   [preview]               │
│  ─────────────────────────────                         │
│  HERO           [ Site B ▼ ]   [preview]               │
│  ─────────────────────────────                         │
│  FEATURES       [ Site A ▼ ]   [preview]               │
│  ─────────────────────────────                         │
│  TESTIMONIALS   [ Site C ▼ ]   [preview]               │
│  ─────────────────────────────                         │
│  FOOTER         [ Site B ▼ ]   [preview]               │
│                                                         │
│  Design Tokens: [ Site A (primary) ▼ ]                 │
│                                                         │
│         [ Generate Mixed Website → ]                    │
└─────────────────────────────────────────────────────────┘
```

**7.3 Token Merging Strategy**
- Velg én primary reference for base tokens
- Override specific tokens from other references
- Automatic harmony checking (colors that work together)
- Conflict resolution UI

**7.4 Mixed Preview**
- Live preview av combined sections
- Consistency score (do sections look cohesive?)
- Suggestions for better combinations

**Deliverables:**
- [ ] Multi-URL input
- [ ] Section picker UI
- [ ] Token merging logic
- [ ] Harmony/consistency checker
- [ ] Mixed preview

---

### PHASE 8: Final Assembly & Export (Del 8)

**8.1 Page Assembly**
- Kombiner alle godkjente komponenter
- Riktig rekkefølge basert på original/template
- Responsive layout verification

**8.2 Asset Handling**
- Last ned og optimaliser bilder
- Generer placeholder for stock photos
- Icon extraction/replacement

**8.3 Export Options**
- Standalone Next.js prosjekt
- Static HTML/CSS export
- Tailwind config + komponenter

**8.4 Quality Report**
```
Website Generation Report
========================
Reference: https://example.com
Generated: Websites/website-001/
Version: v3

Overall Accuracy: 96.2%

Section Scores:
- Header:      98.2%  ✓
- Hero:        96.1%  ✓
- Features:    95.4%  ✓
- Testimonials: 94.8%  ✓
- Footer:      96.5%  ✓

Components Approved: 5/5
Components Failed: 0
Manual Reviews: 0

Versions Created: 3
Total Iterations: 12

Issues Found: 2
- [Low] Footer spacing 2px difference
- [Low] Feature card shadow opacity

Export Ready: ✓
```

**Deliverables:**
- [ ] Komplett generert website
- [ ] Quality report
- [ ] One-click preview
- [ ] Multiple export formats

---

## Status Bar Phases (Updated)

```
[1/8] Capturing Reference    ██░░░░░░░░░░░░░░ 12%
      └─ Scrolling page to load all content...

[2/8] Extracting Design      ████░░░░░░░░░░░░ 25%
      └─ Analyzing typography...

[3/8] Token Editor           ████░░░░░░░░░░░░ 25%
      └─ Waiting for user approval...

[4/8] Generating Components  ████████░░░░░░░░ 50%
      └─ Hero section (variant A: 98.2%)
      └─ Awaiting approval...

[5/8] Comparing Results      ██████████░░░░░░ 65%
      └─ Section 3/5: Features (94.2%)

[6/8] Refining Accuracy      ████████████░░░░ 78%
      └─ Iteration 2/5: Adjusting spacing...

[7/8] Versioning             ██████████████░░ 90%
      └─ Creating version v1...

[8/8] Finalizing             ████████████████ 100%
      └─ Generating export files...
```

---

## Error Recovery Summary

Hver fase har innebygd error recovery:

| Phase | Error Type | Recovery Action |
|-------|------------|-----------------|
| 2 - Capture | Page load timeout | Retry 3x, then mark failed |
| 2 - Capture | Section not found | Skip section, continue |
| 3 - Extract | Missing font | Use system fallback |
| 3 - Extract | Color parse error | Use closest valid color |
| 4 - Generate | Component failed | Queue for manual review |
| 4 - Generate | Variant failed | Try simpler variant |
| 5 - Compare | Screenshot failed | Retry with different viewport |
| 6 - Version | Save failed | Retry, alert user |

**Manual Review Queue:**
- Accessible from dashboard
- Shows all failed items
- Bulk retry option
- Manual fix option
- Skip and continue option

---

## Caching Strategy

```typescript
interface CacheConfig {
  tokenCacheTTL: number;      // 24 hours default
  screenshotCacheTTL: number; // 12 hours default
  maxCacheSize: string;       // "1GB" default
}

interface CacheEntry {
  domain: string;
  type: 'tokens' | 'screenshots';
  createdAt: Date;
  expiresAt: Date;
  data: any;
}
```

**Cache Benefits:**
- Re-running same URL: Skip capture & extraction
- Same domain, different page: Reuse tokens
- Faster iteration cycles
- Reduced bandwidth

**Cache UI:**
- View cached domains
- Manual cache clear per domain
- Global cache clear
- Cache statistics (hits/misses)

---

## Database Schema (SQLite)

```sql
-- Websites table
CREATE TABLE websites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  reference_url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  current_version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'in_progress'
);

-- Versions table
CREATE TABLE versions (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  tokens_json TEXT,
  accuracy_score REAL,
  changelog TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (website_id) REFERENCES websites(id)
);

-- Components table
CREATE TABLE components (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL,
  version_id TEXT NOT NULL,
  name TEXT NOT NULL,
  selected_variant TEXT,
  approved BOOLEAN DEFAULT FALSE,
  accuracy_score REAL,
  error_message TEXT,
  FOREIGN KEY (website_id) REFERENCES websites(id),
  FOREIGN KEY (version_id) REFERENCES versions(id)
);

-- Cache table
CREATE TABLE cache (
  domain TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

-- Error log table
CREATE TABLE error_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  website_id TEXT,
  phase TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT,
  recovery_action TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Neste Steg

### Fullførte Faser
- ✅ **Phase 1:** Project Setup & Dashboard
- ✅ **Phase 2:** Playwright Integration & Anti-Lazy-Load
- ✅ **Phase 3:** Design System Extraction & Token Editor
- ✅ **Phase 4:** Component Generation (6 komponenter generert fra Fluence)
- ✅ **Phase 4.5:** E2E Testing & Bug Fixes (2026-01-16)
  - Fixed progress bar to use correct progress store (`captureProgressStore`)
  - Fixed project list refresh timing after extraction completes
  - Added proper phase mapping for capture progress phases
  - Tested with multiple sites (fluence.framer.website, awwwards.com, vg.no, linear.app)

### Neste Fase
**→ Phase 5: Visual Comparison System**

Se PROMPTS/phase-5.md for detaljert prompt til auto-claude.

---

## Beslutninger

1. **Bildehåndtering:** Last ned og inkluder alle bilder (optimalisert)

2. **Interaktivitet:** Ja - full JavaScript-funksjonalitet (dropdowns, modals, accordions, tabs, etc.)

3. **Fler-sides støtte:** Hele websites med flere sider (ikke kun landingssider)
