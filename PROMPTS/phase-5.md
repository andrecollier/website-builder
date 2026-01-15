# Auto Claude Prompt - Phase 5

## Oppgave: Implementer Phase 5 av Website Cooker

Les først disse filene for full kontekst:
- PROJECT_PLAN.md (hovedplan med alle 8 faser)

Phase 1-4 er ferdige (Dashboard, Playwright, Design System, Component Generation).

---

## Din oppgave: Phase 5 - Visual Comparison System

### 5.1 Comparison Engine
Lag `src/lib/comparison/visual-diff.ts`:

```typescript
import Pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

interface ComparisonResult {
  sectionName: string;
  accuracy: number;           // 0-100%
  diffImagePath: string;      // Path til diff visualization
  mismatchedPixels: number;
  totalPixels: number;
  mismatches: Mismatch[];
}

interface Mismatch {
  type: 'color' | 'spacing' | 'typography' | 'layout' | 'missing';
  description: string;
  expected: string;
  actual: string;
  location: BoundingBox;
  severity: 'low' | 'medium' | 'high';
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### 5.2 Install Dependencies

```bash
npm install pixelmatch pngjs sharp
npm install -D @types/pngjs
```

### 5.3 Comparison Process
Lag `src/lib/comparison/compare-section.ts`:

1. **Render generert komponent:**
   - Start lokal dev server for generated website
   - Bruk Playwright til å ta screenshot

2. **Sammenlign med original:**
   - Last original section screenshot
   - Last generated section screenshot
   - Kjør Pixelmatch for pixel-diff

3. **Generer diff-bilde:**
   - Lag visuelt diff-bilde (røde pixels = forskjell)
   - Lagre i `Websites/website-XXX/comparison/`

4. **Beregn accuracy score:**
   ```typescript
   const accuracy = 100 - (mismatchedPixels / totalPixels * 100);
   ```

5. **Identifiser mismatch-typer:**
   - Analyser diff-regioner
   - Kategoriser som color/spacing/typography/layout

### 5.4 Iterative Improvement
Lag `src/lib/comparison/auto-refine.ts`:

```typescript
interface RefinementAttempt {
  iteration: number;
  changes: string[];
  accuracyBefore: number;
  accuracyAfter: number;
}

async function autoRefine(
  componentPath: string,
  targetAccuracy: number = 95,
  maxIterations: number = 5
): Promise<RefinementResult> {
  // 1. Compare current state
  // 2. Identify issues
  // 3. Apply fixes (spacing, colors, etc.)
  // 4. Re-compare
  // 5. Repeat until accuracy >= target or max iterations
}
```

Auto-refinement strategies:
- **Color mismatch:** Juster farge-verdier i Tailwind classes
- **Spacing mismatch:** Juster padding/margin/gap
- **Typography mismatch:** Juster font-size/weight/line-height
- **Layout mismatch:** Juster flex/grid properties

### 5.5 Comparison Dashboard UI
Lag `src/app/compare/[id]/page.tsx`:

```
┌─────────────────────────────────────────────────────────────┐
│  Visual Comparison: Website 001            Overall: 94.7%   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Section: Hero                                    96.2% ✓   │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │                    │  │                    │            │
│  │     Original       │  │    Generated       │            │
│  │                    │  │                    │            │
│  └────────────────────┘  └────────────────────┘            │
│                                                             │
│  View: [Side-by-Side ●] [Overlay] [Diff] [Slider]          │
│                                                             │
│  Issues Found (2):                                          │
│  ├─ [Medium] Button color #3B82F6 → #2563EB               │
│  └─ [Low] Padding-bottom 48px → 44px                       │
│                                                             │
│  [Auto-Fix Issues]  [Manual Edit]  [Accept as-is]          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Section: Features                                91.4%     │
│  ... (collapsed)                                            │
└─────────────────────────────────────────────────────────────┘
```

### 5.6 View Modes
Lag `src/components/Comparison/`:

**Side-by-Side View:**
- Original til venstre, generated til høyre
- Synkronisert scroll
- Zoom controls

**Overlay View:**
- Generated over original
- Opacity slider (0-100%)
- Toggle visibility

**Diff View:**
- Viser kun forskjeller (rødt highlight)
- Mismatch areas markert
- Click to see details

**Slider View:**
- Drag-slider for å veksle mellom original/generated
- Smooth transition
- Good for spotting differences

### 5.7 Iteration History
Lag `src/components/Comparison/IterationHistory.tsx`:

```
┌─────────────────────────────────────────┐
│  Refinement History: Hero Section       │
├─────────────────────────────────────────┤
│  Iteration 3 (current)         96.2%    │
│  └─ Fixed button color                  │
│                                         │
│  Iteration 2                   94.1%    │
│  └─ Adjusted heading size               │
│                                         │
│  Iteration 1                   89.7%    │
│  └─ Initial generation                  │
│                                         │
│  [Revert to iteration 2]               │
└─────────────────────────────────────────┘
```

### 5.8 Per-Section Actions

For hver seksjon:
- **Auto-Fix:** Kjør auto-refine
- **Manual Edit:** Åpne code editor
- **Accept:** Godkjenn selv om < 95%
- **Regenerate:** Start helt på nytt

### 5.9 Overall Report
Lag `src/lib/comparison/report-generator.ts`:

```typescript
interface ComparisonReport {
  websiteId: string;
  generatedAt: Date;
  overallAccuracy: number;
  sections: SectionReport[];
  totalIssues: number;
  issuesByType: {
    color: number;
    spacing: number;
    typography: number;
    layout: number;
  };
  iterationsUsed: number;
  recommendations: string[];
}
```

---

## Filer som skal lages

```
src/lib/comparison/
├── visual-diff.ts           # Pixelmatch integration
├── compare-section.ts       # Section comparison logic
├── accuracy-score.ts        # Calculate accuracy
├── auto-refine.ts           # Iterative improvement
├── mismatch-detector.ts     # Categorize mismatches
├── report-generator.ts      # Generate reports
└── index.ts

src/app/compare/
└── [id]/
    └── page.tsx             # Comparison dashboard

src/components/Comparison/
├── ComparisonDashboard.tsx
├── SectionComparison.tsx
├── SideBySideView.tsx
├── OverlayView.tsx
├── DiffView.tsx
├── SliderView.tsx
├── MismatchList.tsx
├── IterationHistory.tsx
├── AccuracyBadge.tsx
├── ViewModeToggle.tsx
└── index.ts
```

---

## Storage Structure

```
Websites/website-001/
├── reference/
│   └── sections/
│       ├── 01-header.png
│       └── ...
├── generated/
│   └── sections/
│       ├── 01-header.png      # Screenshot of generated
│       └── ...
├── comparison/
│   ├── diffs/
│   │   ├── 01-header-diff.png
│   │   └── ...
│   ├── iterations/
│   │   ├── header-v1.png
│   │   ├── header-v2.png
│   │   └── ...
│   └── report.json
└── metadata.json
```

---

## Database Update

```sql
CREATE TABLE comparisons (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL,
  section_name TEXT NOT NULL,
  accuracy_score REAL NOT NULL,
  diff_image_path TEXT,
  mismatches_json TEXT,
  iteration_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (website_id) REFERENCES websites(id)
);

CREATE TABLE refinement_history (
  id TEXT PRIMARY KEY,
  comparison_id TEXT NOT NULL,
  iteration INTEGER NOT NULL,
  accuracy_before REAL,
  accuracy_after REAL,
  changes_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comparison_id) REFERENCES comparisons(id)
);
```

---

## Deliverables

- [ ] Pixelmatch integration fungerer
- [ ] Section-by-section comparison
- [ ] Accuracy score beregnes korrekt
- [ ] Diff-bilder genereres
- [ ] Mismatch categorization fungerer
- [ ] Auto-refine forbedrer accuracy
- [ ] Comparison Dashboard UI komplett
- [ ] Alle view modes (side-by-side, overlay, diff, slider)
- [ ] Iteration history vises
- [ ] Comparison report genereres

---

## Test når ferdig

1. Generer komponenter for en website (Phase 4)
2. Gå til `/compare/[website-id]`
3. Verifiser:
   - Accuracy scores vises per section
   - Side-by-side view fungerer
   - Diff view highlighter forskjeller
   - Auto-fix forbedrer accuracy
   - Iteration history oppdateres
4. Sjekk at diff-bilder lagres i `comparison/diffs/`

---

## Viktig

- Target accuracy: 95% eller høyere
- Max 5 iterasjoner før manual review
- Diff-bilder skal være lesbare (tydelig rødt for forskjeller)
- Behold alle iterasjoner for rollback
