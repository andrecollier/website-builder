# Quality Fix Plan: World-Class Component Generation

## Executive Summary

The current system captures screenshots and detects sections correctly, but the **component generation is fundamentally broken**. Generated components are unusable because:

1. **Text content is NOT extracted** - H1, paragraphs, buttons are missing
2. **Variant generator doesn't use AI** - Just parses raw HTML or uses templates
3. **Semantic content never reaches the generator** - Pipeline gap

## Root Cause Analysis

### Pipeline Gap Visualization

```
CURRENT (BROKEN):
Screenshot → Section Detection → HTML Snapshot → Parse HTML → Template Code
                                       ↓
                         (Text content LOST here)

NEEDED:
Screenshot → Section Detection → Content Extraction → AI Generation → Perfect Code
                                       ↓
                         (headings, paragraphs, buttons, images)
```

### Problem 1: Content Extraction Exists But Not Used

We added `extractSectionContent()` in `section-detector.ts` that extracts:
- Headings (H1-H6 with text)
- Paragraphs
- Buttons (text, href, isPrimary)
- Links
- Images (with role classification)
- Lists
- Layout type

**BUT** this content is saved to `metadata.json` but **never passed to the component generator**.

### Problem 2: DetectedComponent Missing Content

The `DetectedComponent` type only has:
```typescript
interface DetectedComponent {
  id: string;
  type: ComponentType;
  order: number;
  boundingBox: {...};
  screenshotPath: string;
  htmlSnapshot: string;  // Raw HTML - loses text in Framer
  styles: Record<string, string>;
}
```

Missing:
```typescript
content?: SectionContent;  // The extracted semantic content
```

### Problem 3: Variant Generator is Template-Based, Not AI

The `variant-generator.ts` generates 3 variants:
- **Variant A (pixel-perfect)**: Parses raw HTML with inline styles
- **Variant B (semantic)**: Static template with `{/* Headline */}` placeholders
- **Variant C (modernized)**: Static template with ARIA attributes

**None of these use:**
- The screenshot (visual reference)
- The extracted content (actual text)
- AI (Claude) for intelligent generation

## The Fix: AI-Powered Component Generation

### Solution Overview

```
New Pipeline:
1. Capture screenshot ✓
2. Detect sections ✓
3. Extract semantic content ✓ (just added)
4. Generate components with AI:
   - Input: Screenshot (base64) + SectionContent + DesignSystem
   - Output: Perfect React component with actual content
5. Visual comparison for accuracy score
6. Re-generate if accuracy < 90%
```

### Implementation Tasks

#### Task 1: Update DetectedComponent Type
**File**: `src/types/index.ts`

Add `content?: SectionContent` to DetectedComponent.

#### Task 2: Pass Content to Generator
**File**: `src/lib/generator/component-generator.ts`

When building DetectedComponent from reference sections, include the extracted content from metadata.

#### Task 3: Create AI-Powered Generator
**File**: `src/lib/generator/ai-generator.ts` (NEW)

```typescript
interface AIGenerationInput {
  screenshot: string; // base64
  content: SectionContent;
  sectionType: SectionType;
  designSystem: DesignSystem;
}

async function generateWithAI(input: AIGenerationInput): Promise<string> {
  // Use Claude to generate perfect component
}
```

#### Task 4: Update Variant Generator
**File**: `src/lib/generator/variant-generator.ts`

- Replace template-based generation with AI generation
- Pass screenshot + content to AI
- Generate components with actual text

#### Task 5: Add Refinement Loop
**Files**: `src/lib/comparison/`, `src/lib/orchestrator/`

```typescript
async function generateUntilPerfect(
  section: SectionInfo,
  minAccuracy: number = 90
): Promise<GeneratedComponent> {
  let attempts = 0;
  let component = await generateWithAI(section);

  while (attempts < 3) {
    const accuracy = await compareVisually(component, section.screenshotPath);
    if (accuracy >= minAccuracy) break;

    // Re-generate with feedback
    component = await regenerateWithFeedback(component, accuracy);
    attempts++;
  }

  return component;
}
```

## Implementation Priority

### Phase A: Fix Content Flow (Critical - Do First)
1. Update DetectedComponent type to include content
2. Pass extracted content through the pipeline
3. Update metadata loading to include content

### Phase B: AI Generation (Critical - Main Fix)
1. Create AI generator with Claude
2. Use screenshot + content as input
3. Generate proper React components with actual text

### Phase C: Refinement Loop (Important)
1. Visual comparison of generated vs reference
2. Re-generation with accuracy feedback
3. Auto-iterate until accuracy > 90%

### Phase D: Design System Integration (Polish)
1. Use extracted design tokens in generated CSS
2. Validate colors match reference
3. Ensure typography is consistent

---

## Prompts for Implementation

### Prompt 1: Fix Content Flow

```
Oppgave: Fikse innholdsflyten i component-generator.ts

Problemet:
- extractSectionContent() lagrer content i metadata.json
- component-generator.ts laster reference sections men inkluderer IKKE content
- DetectedComponent mangler content feltet

Løsning:
1. Oppdater DetectedComponent interface i src/types/index.ts:
   - Legg til: content?: SectionContent

2. Oppdater component-generator.ts generateComponents():
   - Når referenceSections lastes, les også content fra metadata
   - Legg content til i DetectedComponent objekter

3. Verifiser at content flyter til variant-generator

Test: Kjør capture på Clearpath og sjekk at content er tilgjengelig i generator.
```

### Prompt 2: Create AI Generator

```
Oppgave: Lag AI-basert komponent-generator med Claude

Krav:
1. Opprett src/lib/generator/ai-generator.ts
2. Implementer generateComponentWithAI():
   - Input: screenshot (base64), SectionContent, DesignSystem
   - Bruk Claude API til å generere React-komponent
   - Output: Komplett TypeScript/React kode med faktisk innhold

3. Claude prompt skal inkludere:
   - Screenshot som visuell referanse
   - Ekstrahert innhold (headings, paragraphs, buttons)
   - Design system tokens (farger, fonts, spacing)
   - Seksjontype for semantisk HTML

4. Generated code skal:
   - Inneholde faktisk tekst fra content
   - Bruke Tailwind CSS
   - Være responsive
   - Ha semantic HTML

Test: Generer Hero-komponent med "A Path That Shapes Your Future." heading.
```

### Prompt 3: Add Visual Refinement

```
Oppgave: Implementer visual refinement loop

Krav:
1. Bruk visual-diff.ts for sammenligning
2. Etter AI-generering:
   - Ta screenshot av generert komponent
   - Sammenlign med referanse
   - Beregn accuracy score

3. Hvis accuracy < 90%:
   - Generer diff-analyse
   - Send til Claude med feedback
   - Re-generer komponenten
   - Maks 3 forsøk

4. Logg fremgang og accuracy for hver iterasjon

Test: Generer komponent, sammenlign, forbedre til >90% accuracy.
```

---

## Quick Win: Immediate Fix

For å se rask forbedring UTEN full AI-integrasjon:

1. **Oppdater semantic/modernized variants** til å bruke ekstrahert innhold:

```typescript
// I generateSemanticVariant():
const { headings, paragraphs, buttons } = content;

innerContent = `
  <div className="container mx-auto px-4 py-16 text-center">
    <h1 className="text-4xl font-bold mb-4">
      ${headings[0]?.text || 'Headline'}
    </h1>
    <p className="text-xl text-gray-600 mb-8">
      ${paragraphs[0] || 'Description'}
    </p>
    <div className="cta-buttons">
      ${buttons.map(b => `<button>${b.text}</button>`).join('\n')}
    </div>
  </div>`;
```

Dette gir umiddelbar forbedring uten å vente på full AI-integrasjon.

---

## Agent Strategy

Anbefalt agent-struktur for parallell utvikling:

| Agent | Oppgave | Filer |
|-------|---------|-------|
| Agent 1 | Fix content flow | types/index.ts, component-generator.ts |
| Agent 2 | Create AI generator | ai-generator.ts (new) |
| Agent 3 | Update variant generator | variant-generator.ts |
| Agent 4 | Add refinement loop | comparison/, orchestrator/ |

Disse kan kjøres parallelt da de jobber på forskjellige filer.

---

## Success Criteria

Systemet er "verdensklasse" når:

1. **Hero-komponent inkluderer faktisk H1**: "A Path That Shapes Your Future."
2. **Alle knapper har korrekt tekst**: "START YOUR JOURNEY"
3. **Layout matcher referanse**: Responsive, centered, proper spacing
4. **Farger matcher design system**: Primary, secondary, backgrounds
5. **Visual accuracy > 90%**: Pixelmatch sammenligning
6. **Koden er produksjonsklar**: TypeScript, semantic HTML, Tailwind

---

## Start Prompt (Copy This)

```
Les QUALITY_FIX_PLAN.md og start med Phase A: Fix Content Flow.

Konkrete oppgaver:
1. Oppdater DetectedComponent i src/types/index.ts med content?: SectionContent
2. Oppdater component-generator.ts til å inkludere content når den laster reference sections
3. Oppdater variant-generator.ts til å motta og bruke content

Deretter Phase B:
4. Opprett src/lib/generator/ai-generator.ts
5. Implementer generateComponentWithAI() som bruker Claude
6. Integrer AI-generator i variant-generator.ts

Test på https://clearpath-template.framer.website

Mål: Hero-komponenten skal inneholde "A Path That Shapes Your Future."
```
