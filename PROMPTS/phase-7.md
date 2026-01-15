# Auto Claude Prompt - Phase 7

## Oppgave: Implementer Phase 7 av Website Cooker

Les først PROJECT_PLAN.md for full kontekst.

Phase 1-6 er ferdige.

---

## Din oppgave: Phase 7 - Template Mode (Multi-Reference Mixing)

### 7.1 Multi-Reference Input
Oppdater dashboard til å støtte flere URLer:

```typescript
interface TemplateProject {
  id: string;
  name: string;
  references: Reference[];
  sectionMapping: SectionMapping;
  primaryTokenSource: string;  // reference ID for base tokens
  status: 'configuring' | 'processing' | 'complete';
}

interface Reference {
  id: string;
  url: string;
  name: string;           // "Site A", "Site B", etc.
  screenshots: ScreenshotSet;
  designTokens: DesignSystem;
  sections: DetectedSection[];
}

interface SectionMapping {
  header: string;         // reference ID
  hero: string;
  features: string;
  testimonials: string;
  footer: string;
  // ... etc
}
```

### 7.2 Template Mode UI
Lag `src/app/template/page.tsx` (oppdater eksisterende):

```
┌─────────────────────────────────────────────────────────────┐
│  Template Mode: Mix & Match                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  References:                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Site A: https://fluence.framer.website/    [Remove] │   │
│  │ Site B: https://linear.app/                [Remove] │   │
│  │ Site C: https://stripe.com/                [Remove] │   │
│  │                                                     │   │
│  │ [+ Add another reference URL]                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Section Mapping:                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  HEADER         [ Site A ▼ ]   [👁 Preview]        │   │
│  │  ─────────────────────────────────────────         │   │
│  │  HERO           [ Site B ▼ ]   [👁 Preview]        │   │
│  │  ─────────────────────────────────────────         │   │
│  │  FEATURES       [ Site A ▼ ]   [👁 Preview]        │   │
│  │  ─────────────────────────────────────────         │   │
│  │  TESTIMONIALS   [ Site C ▼ ]   [👁 Preview]        │   │
│  │  ─────────────────────────────────────────         │   │
│  │  FOOTER         [ Site B ▼ ]   [👁 Preview]        │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Design Tokens Source: [ Site A (primary) ▼ ]              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Mixed Preview                          Harmony: 87% │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │                                             │   │   │
│  │  │    [Live preview of combined sections]      │   │   │
│  │  │                                             │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│         [ Generate Mixed Website → ]                        │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Reference Processing
Lag `src/lib/template/reference-processor.ts`:

```typescript
async function processReference(url: string): Promise<Reference> {
  // 1. Check cache (reuse if same domain processed before)
  const cached = await checkCache(url);
  if (cached) return cached;

  // 2. Capture screenshots
  const screenshots = await captureAgent.capture(url);

  // 3. Extract design tokens
  const tokens = await extractorAgent.extract(url);

  // 4. Detect sections
  const sections = await detectSections(screenshots);

  // 5. Cache results
  await cacheReference({ url, screenshots, tokens, sections });

  return { id: generateId(), url, screenshots, tokens, sections };
}
```

### 7.4 Section Picker Component
Lag `src/components/Template/SectionPicker.tsx`:

```typescript
interface SectionPickerProps {
  sectionType: SectionType;
  references: Reference[];
  selectedReferenceId: string;
  onSelect: (referenceId: string) => void;
}

// Features:
// - Dropdown med alle references
// - Thumbnail preview av section fra hver reference
// - Quick preview on hover
// - Visual indicator for selected
```

### 7.5 Token Merging
Lag `src/lib/template/token-merger.ts`:

```typescript
interface MergeStrategy {
  base: string;              // Primary reference ID
  overrides: TokenOverride[];
}

interface TokenOverride {
  referenceId: string;
  path: string;              // e.g., "colors.primary"
  value: any;
}

async function mergeTokens(
  references: Reference[],
  strategy: MergeStrategy
): Promise<DesignSystem> {
  // 1. Start with base reference tokens
  let merged = deepClone(references.find(r => r.id === strategy.base).tokens);

  // 2. Apply overrides
  for (const override of strategy.overrides) {
    const sourceRef = references.find(r => r.id === override.referenceId);
    const value = get(sourceRef.tokens, override.path);
    set(merged, override.path, value);
  }

  // 3. Validate merged tokens (no conflicts)
  await validateTokens(merged);

  return merged;
}
```

### 7.6 Harmony Checker
Lag `src/lib/template/harmony-checker.ts`:

```typescript
interface HarmonyResult {
  score: number;              // 0-100
  issues: HarmonyIssue[];
  suggestions: string[];
}

interface HarmonyIssue {
  type: 'color_clash' | 'typography_mismatch' | 'spacing_inconsistent';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedSections: string[];
}

async function checkHarmony(
  sectionMapping: SectionMapping,
  references: Reference[],
  mergedTokens: DesignSystem
): Promise<HarmonyResult> {
  const issues: HarmonyIssue[] = [];

  // 1. Check color harmony across sections
  // - Do primary colors from different refs clash?
  // - Is there enough contrast?

  // 2. Check typography consistency
  // - Are font pairings compatible?
  // - Is the scale consistent?

  // 3. Check spacing consistency
  // - Do sections use similar spacing scales?
  // - Are there jarring transitions?

  // 4. Calculate overall score
  const score = calculateHarmonyScore(issues);

  // 5. Generate suggestions
  const suggestions = generateSuggestions(issues);

  return { score, issues, suggestions };
}
```

### 7.7 Mixed Preview
Lag `src/components/Template/MixedPreview.tsx`:

```typescript
interface MixedPreviewProps {
  sectionMapping: SectionMapping;
  references: Reference[];
  mergedTokens: DesignSystem;
}

// Features:
// - Live preview of all sections combined
// - Shows section boundaries
// - Highlights potential issues
// - Responsive preview (mobile/tablet/desktop)
// - Real-time updates when mapping changes
```

### 7.8 Template Generation
Lag `src/lib/template/template-generator.ts`:

```typescript
async function generateFromTemplate(
  project: TemplateProject
): Promise<GeneratedWebsite> {
  const { references, sectionMapping, primaryTokenSource } = project;

  // 1. Merge tokens
  const tokens = await mergeTokens(references, {
    base: primaryTokenSource,
    overrides: []
  });

  // 2. Generate each section from its mapped reference
  const components = [];
  for (const [sectionType, refId] of Object.entries(sectionMapping)) {
    const reference = references.find(r => r.id === refId);
    const section = reference.sections.find(s => s.type === sectionType);

    const component = await generateComponent({
      screenshot: section.screenshot,
      tokens: tokens,  // Use merged tokens, not reference tokens
      type: sectionType
    });

    components.push(component);
  }

  // 3. Assemble page
  const page = await assemblePage(components);

  // 4. Save to Websites folder
  await saveWebsite(project.id, { tokens, components, page });

  return { id: project.id, components, tokens };
}
```

### 7.9 Drag-and-Drop Reordering
Lag `src/components/Template/SectionReorder.tsx`:

```typescript
// Allow users to:
// - Drag sections to reorder
// - Add new sections
// - Remove sections
// - Duplicate sections

interface SectionReorderProps {
  sections: SectionConfig[];
  onReorder: (newOrder: SectionConfig[]) => void;
}

// Use @dnd-kit/core for drag-and-drop
```

---

## Filer som skal lages/oppdateres

```
src/app/template/
└── page.tsx                    # Oppdater med full Template Mode UI

src/components/Template/
├── ReferenceList.tsx           # Liste over references
├── ReferenceCard.tsx           # Enkelt reference entry
├── SectionPicker.tsx           # Velg reference per section
├── SectionReorder.tsx          # Drag-and-drop reordering
├── TokenSourceSelector.tsx     # Velg primary token source
├── MixedPreview.tsx            # Live preview
├── HarmonyIndicator.tsx        # Viser harmony score
└── index.ts

src/lib/template/
├── reference-processor.ts
├── token-merger.ts
├── harmony-checker.ts
├── template-generator.ts
└── index.ts
```

---

## Database Update

```sql
CREATE TABLE template_projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  primary_token_source TEXT,
  section_mapping_json TEXT,
  harmony_score REAL,
  status TEXT DEFAULT 'configuring',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE template_references (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  url TEXT NOT NULL,
  name TEXT,
  tokens_json TEXT,
  sections_json TEXT,
  FOREIGN KEY (project_id) REFERENCES template_projects(id)
);
```

---

## Deliverables

- [ ] Multi-reference URL input
- [ ] Section picker per reference
- [ ] Token merging system
- [ ] Harmony checker with score
- [ ] Mixed preview (live)
- [ ] Drag-and-drop section reordering
- [ ] Template generation from mixed sources
- [ ] Caching for processed references

---

## Test når ferdig

1. Gå til Template Mode
2. Legg til 2-3 referanse-URLer:
   - https://fluence.framer.website/
   - https://linear.app/
   - https://stripe.com/
3. Map seksjoner fra forskjellige kilder
4. Verifiser:
   - Preview viser kombinerte seksjoner
   - Harmony score beregnes
   - Generation produserer fungerende website
5. Sjekk at output bruker merged tokens, ikke blandede

---

## Viktig

- Gjenbruk cache fra tidligere extractions
- Harmony score er veiledende, ikke blokkerende
- Brukeren har siste ord på section mapping
- Merged tokens må være konsistente
