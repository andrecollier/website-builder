# Auto Claude Prompt - Phase 4

## Oppgave: Implementer Phase 4 av Website Cooker

Les først disse filene for full kontekst:
- PROJECT_PLAN.md (hovedplan med alle 8 faser)
- DESIGN_SYSTEM_EXTRACTION.md (detaljert bakgrunn)

Phase 1 (Dashboard), Phase 2 (Playwright), og Phase 3 (Design System Extraction) er ferdige.

---

## Din oppgave: Phase 4 - Component Detection & Generation with Variants

### 4.1 Component Detection
Lag `src/lib/generator/component-detector.ts`:

Identifiser disse komponenttypene automatisk:

```typescript
type ComponentType =
  | 'header'
  | 'hero'
  | 'features'
  | 'testimonials'
  | 'pricing'
  | 'cta'
  | 'footer'
  | 'cards'
  | 'gallery'
  | 'contact'
  | 'faq'
  | 'stats'
  | 'team'
  | 'logos';

interface DetectedComponent {
  type: ComponentType;
  order: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  screenshotPath: string;
  htmlSnapshot: string;    // Relevant HTML fra siden
  styles: ExtractedStyles; // Computed styles
}
```

Detection-logikk:
- Bruk semantiske HTML-tags (`<header>`, `<nav>`, `<section>`, `<footer>`)
- Analyser class names (hero, features, pricing, etc.)
- Bruk heuristikk basert på innhold og layout
- Match mot screenshot sections fra Phase 2

### 4.2 Component Generator
Lag `src/lib/generator/component-generator.ts`:

```typescript
interface GeneratedComponent {
  name: string;
  type: ComponentType;
  variants: ComponentVariant[];
  selectedVariant: number;
  approved: boolean;
}

interface ComponentVariant {
  id: string;
  name: string;              // "Variant A", "Variant B", "Variant C"
  description: string;
  code: string;              // Full React/TSX kode
  previewImage?: string;
  accuracyScore?: number;
}
```

### 4.3 Variant Generation Strategy

**Variant A - Pixel Perfect:**
- Eksakt match av layout og spacing
- Samme farger, fonts, sizes som original
- Fokus på visuell nøyaktighet

**Variant B - Semantisk Match:**
- Samme struktur og hierarki
- Litt frihet i spacing/proportions
- Cleaner kode, bedre patterns

**Variant C - Modernisert:**
- Forbedret accessibility (ARIA, keyboard nav)
- Bedre performance patterns
- Modern React best practices

### 4.4 Code Generation
Hver komponent skal genereres med:

```typescript
// Eksempel output: Hero.tsx
import React from 'react';

interface HeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage?: string;
}

export const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  ctaText,
  ctaLink,
  backgroundImage,
}) => {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center bg-primary-900">
      {/* Component content using design tokens */}
    </section>
  );
};
```

Krav:
- TypeScript med proper interfaces
- Tailwind classes fra design tokens
- Props for alt dynamisk innhold
- Responsive (mobile-first)
- Accessibility attributes

### 4.5 Incremental Generation UI
Lag `src/app/preview/[id]/page.tsx`:

```
┌─────────────────────────────────────────────────────────┐
│  Component: Hero Section              [2/7 components]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ │
│  │   Variant A   │ │   Variant B   │ │   Variant C   │ │
│  │               │ │               │ │               │ │
│  │  [Preview]    │ │  [Preview]    │ │  [Preview]    │ │
│  │               │ │               │ │               │ │
│  │   ● 98.2%     │ │     94.7%     │ │     91.3%     │ │
│  └───────────────┘ └───────────────┘ └───────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ // Hero.tsx                                         ││
│  │ import React from 'react';                          ││
│  │ ...                                                 ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  [View Original]  [Edit Code]  [Regenerate]            │
│                                                         │
│              [ ← Previous ]  [ Approve & Next → ]       │
└─────────────────────────────────────────────────────────┘
```

### 4.6 Preview Components
Lag `src/components/Preview/`:

```
src/components/Preview/
├── ComponentCard.tsx        # Viser én variant
├── VariantSelector.tsx      # Velg mellom A/B/C
├── CodeViewer.tsx           # Syntax highlighted kode
├── CodeEditor.tsx           # Editer kode inline
├── OriginalComparison.tsx   # Side-by-side med original
├── ApprovalButtons.tsx      # Approve/Reject/Skip
└── ProgressTracker.tsx      # 2/7 components done
```

### 4.7 Approval Workflow

```typescript
interface ApprovalState {
  websiteId: string;
  components: {
    [componentId: string]: {
      status: 'pending' | 'approved' | 'rejected' | 'skipped';
      selectedVariant: string;
      customCode?: string;  // Hvis manuelt redigert
    };
  };
  currentIndex: number;
}
```

Workflow:
1. Vis første komponent med 3 varianter
2. Bruker velger variant (eller editer)
3. Klikk "Approve & Next"
4. Neste komponent vises
5. Repeat til alle er godkjent
6. "Complete" knapp når ferdig

### 4.8 Error Recovery
Lag `src/lib/error-recovery/component-errors.ts`:

```typescript
interface FailedComponent {
  componentType: ComponentType;
  error: string;
  attemptedAt: Date;
  retryCount: number;
}
```

Ved feil:
- Logg error med context
- Mark som "needs manual review"
- Continue med neste komponent
- Vis i Error Recovery panel
- Bulk retry option

### 4.9 Manual Review Queue
Lag `src/components/Dashboard/ManualReviewQueue.tsx`:

```
┌─────────────────────────────────────────────────┐
│  Manual Review Required                    (2)  │
├─────────────────────────────────────────────────┤
│  ⚠ Testimonials - Generation failed            │
│    Error: Could not detect testimonial layout   │
│    [Retry] [Skip] [Create Manually]            │
│                                                 │
│  ⚠ Pricing - Low accuracy (72%)                │
│    Complex table layout detected                │
│    [Retry] [Edit] [Skip]                       │
└─────────────────────────────────────────────────┘
```

### 4.10 Output Structure

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
│   │   │   │   ├── Hero.tsx        # Selected variant
│   │   │   │   └── variants/
│   │   │   ├── Features/
│   │   │   ├── Footer/
│   │   │   └── index.ts            # Export all
│   │   └── pages/
│   │       └── index.tsx           # Assembled page
│   └── package.json
├── failed-components/
│   └── Testimonials.error.json
└── metadata.json
```

---

## Database Update

Legg til i schema:

```sql
CREATE TABLE components (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL,
  version_id TEXT,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  selected_variant TEXT,
  custom_code TEXT,
  status TEXT DEFAULT 'pending',
  accuracy_score REAL,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (website_id) REFERENCES websites(id)
);

CREATE TABLE component_variants (
  id TEXT PRIMARY KEY,
  component_id TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  accuracy_score REAL,
  FOREIGN KEY (component_id) REFERENCES components(id)
);
```

---

## Filer som skal lages

```
src/lib/generator/
├── component-detector.ts
├── component-generator.ts
├── variant-generator.ts
├── code-templates/
│   ├── header.ts
│   ├── hero.ts
│   ├── features.ts
│   ├── testimonials.ts
│   ├── pricing.ts
│   ├── footer.ts
│   └── index.ts
└── index.ts

src/app/preview/
└── [id]/
    └── page.tsx

src/components/Preview/
├── ComponentCard.tsx
├── VariantSelector.tsx
├── CodeViewer.tsx
├── CodeEditor.tsx
├── OriginalComparison.tsx
├── ApprovalButtons.tsx
├── ProgressTracker.tsx
└── index.ts

src/components/Dashboard/
└── ManualReviewQueue.tsx    # Legg til

src/lib/error-recovery/
├── component-errors.ts
└── index.ts
```

---

## Deliverables

- [ ] Component detector identifiserer alle seksjoner
- [ ] 3 varianter genereres per komponent
- [ ] Preview UI viser varianter side-by-side
- [ ] Code viewer med syntax highlighting
- [ ] Inline code editor fungerer
- [ ] Approval workflow komplett
- [ ] Error recovery med manual review queue
- [ ] Komponenter lagres i riktig mappestruktur
- [ ] Database oppdatert med component tables

---

## Test når ferdig

1. Kjør full extraction + design system på en URL
2. Gå til `/preview/[website-id]`
3. Verifiser:
   - Alle seksjoner er detektert
   - 3 varianter vises per komponent
   - Kan velge variant og approve
   - Kode kan editeres inline
   - Failed components vises i review queue
4. Sjekk at komponenter lagres i `Websites/website-XXX/current/src/components/`

---

## Viktig

- Generer EKTE React-kode, ikke placeholders
- Bruk design tokens fra Phase 3
- Hver variant må være renderbar
- Props interface for alt dynamisk innhold
- Tailwind classes, ikke inline styles
