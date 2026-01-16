# Auto Claude Prompt - Phase 5

## Oppgave: Implementer Phase 5 av Website Cooker

Les først disse filene for full kontekst:
- PROJECT_PLAN.md - Se Phase 5 seksjonen
- ROADMAP.md - Versjonsoversikt

### Nåværende Status (2026-01-16)
- ✅ Phase 1: Dashboard & UI - FERDIG
- ✅ Phase 2: Playwright Integration - FERDIG
- ✅ Phase 3: Design System Extraction - FERDIG
- ✅ Phase 4: Component Generation - FERDIG
- ✅ Phase 4.5: E2E Testing - FERDIG

### Hva som er tilgjengelig

**Reference screenshots (original):**
```
Websites/website-7f967219-b93c-41b7-bdbf-2aab3a7fc868/reference/
├── full-page.png           # Komplett side (14394px høyde)
├── metadata.json           # 10 seksjoner med boundingBox
└── sections/
    ├── 01-header.png
    ├── 02-hero.png
    ├── 03-features.png
    ├── 04-testimonials.png
    ├── 05-pricing.png
    ├── 06-features.png
    ├── 07-testimonials.png
    ├── 08-pricing.png
    ├── 09-cta.png
    └── 10-footer.png
```

**Genererte React-komponenter:**
```
Websites/website-7f967219-b93c-41b7-bdbf-2aab3a7fc868/generated/
├── src/
│   ├── components/
│   │   ├── Header/Header.tsx
│   │   ├── Hero/Hero.tsx
│   │   ├── Features/Features.tsx
│   │   ├── About/About.tsx
│   │   ├── CTA/CTA.tsx
│   │   └── Footer/Footer.tsx
│   ├── pages/
│   │   ├── index.tsx
│   │   └── _app.tsx
│   └── styles/globals.css
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

**Design tokens:**
```
Websites/website-7f967219-b93c-41b7-bdbf-2aab3a7fc868/
├── design-system.json      # Ekstraherte farger, fonts, spacing
├── tailwind.config.js      # Tailwind config med tokens
└── variables.css           # CSS custom properties
```

---

## Din oppgave: Phase 5 - Visual Comparison System

### 5.1 Install Dependencies

```bash
cd /Users/andrecollier/Personal/website-builder
npm install pixelmatch pngjs sharp
npm install -D @types/pngjs
```

### 5.2 Comparison Engine

Lag `src/lib/comparison/visual-diff.ts`:

```typescript
import Pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import sharp from 'sharp';

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
  severity: 'low' | 'medium' | 'high';
}
```

### 5.3 Comparison Process

Lag `src/lib/comparison/compare-section.ts`:

1. **Ta screenshot av generert komponent:**
   - Start Playwright
   - Naviger til `http://localhost:3000` (generert site)
   - Ta screenshot av hver seksjon
   - Lagre i `generated/screenshots/`

2. **Sammenlign med original:**
   - Last reference screenshot fra `reference/sections/`
   - Last generated screenshot
   - Resize til samme dimensjoner hvis nødvendig
   - Kjør Pixelmatch

3. **Generer diff-bilde:**
   ```typescript
   const diff = new PNG({ width, height });
   const mismatchedPixels = pixelmatch(
     img1.data, img2.data, diff.data,
     width, height,
     { threshold: 0.1 }
   );
   ```

4. **Beregn accuracy:**
   ```typescript
   const accuracy = 100 - (mismatchedPixels / totalPixels * 100);
   ```

### 5.4 API Endpoint

Lag `src/app/api/compare/route.ts`:

```typescript
// POST /api/compare
// Body: { websiteId: string }
// Returns: { sections: ComparisonResult[], overallAccuracy: number }
```

### 5.5 Comparison Dashboard UI

Lag `src/app/compare/[id]/page.tsx`:

```
┌─────────────────────────────────────────────────────────────┐
│  Visual Comparison: Fluence AI Clone      Overall: 87.3%    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Section: Header                                   92.1% ✓  │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │     Original       │  │    Generated       │            │
│  └────────────────────┘  └────────────────────┘            │
│                                                             │
│  View: [Side-by-Side ●] [Overlay] [Diff]                   │
│                                                             │
│  Issues Found:                                              │
│  ├─ [Medium] Logo size differs by 4px                      │
│  └─ [Low] Nav spacing 8px → 6px                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Section: Hero                                     85.4%    │
│  ... (expand for details)                                   │
└─────────────────────────────────────────────────────────────┘
```

### 5.6 View Modes

Lag `src/components/Comparison/`:

1. **SideBySideView.tsx** - Original og generert side ved side
2. **OverlayView.tsx** - Generert over original med opacity slider
3. **DiffView.tsx** - Viser kun forskjeller (røde pixels)

### 5.7 Storage Structure

```
Websites/website-XXX/
├── reference/
│   └── sections/           # Original screenshots
├── generated/
│   └── screenshots/        # Screenshots av genererte komponenter
│       ├── 01-header.png
│       ├── 02-hero.png
│       └── ...
├── comparison/
│   ├── diffs/              # Diff-bilder
│   │   ├── 01-header-diff.png
│   │   └── ...
│   └── report.json         # Comparison results
└── metadata.json
```

---

## Filer som skal lages

```
src/lib/comparison/
├── visual-diff.ts           # Pixelmatch integration
├── compare-section.ts       # Screenshot + compare logic
├── accuracy-score.ts        # Calculate scores
└── index.ts

src/app/api/compare/
└── route.ts                 # POST endpoint

src/app/compare/
└── [id]/
    └── page.tsx             # Dashboard UI

src/components/Comparison/
├── ComparisonDashboard.tsx
├── SectionComparison.tsx
├── SideBySideView.tsx
├── OverlayView.tsx
├── DiffView.tsx
├── AccuracyBadge.tsx
└── index.ts
```

---

## Test når ferdig

1. Start generated site: `cd Websites/website-7f967219-.../generated && npm run dev`
2. Kjør comparison: `curl -X POST http://localhost:3000/api/compare -d '{"websiteId":"website-7f967219-b93c-41b7-bdbf-2aab3a7fc868"}'`
3. Åpne dashboard: `http://localhost:3000/compare/website-7f967219-b93c-41b7-bdbf-2aab3a7fc868`
4. Verifiser:
   - Accuracy scores vises per seksjon
   - Side-by-side view fungerer
   - Diff view highlighter forskjeller
   - Diff-bilder lagres i `comparison/diffs/`

---

## Viktig

- Target accuracy: Start med å måle, forbedring kommer i Phase 6
- Diff-bilder skal være lesbare (tydelig markering av forskjeller)
- Må håndtere ulike bildestørrelser (resize før compare)
- Bruk Playwright for å ta screenshots av generert site

---

## Deliverables

- [ ] Pixelmatch integration fungerer
- [ ] Screenshots tas av genererte komponenter
- [ ] Section-by-section comparison
- [ ] Accuracy score beregnes korrekt
- [ ] Diff-bilder genereres og lagres
- [ ] Comparison Dashboard UI viser resultater
- [ ] Side-by-side og diff view modes
