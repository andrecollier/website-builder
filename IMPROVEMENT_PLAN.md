# Component Generation Improvement Plan

## Current Status (2026-01-18)

### What's Working
- Screenshot capture with improved timing for Framer animations
- Section detection (header, hero, features, etc.)
- Basic scaffold generation (Next.js project structure)
- Dashboard preview with comparison view

### Core Problem
The generated components are **unusable**. Example Hero component issues:
- No text content extracted (H1 "A Path That Shapes Your Future." is missing)
- Hardcoded pixel values (minHeight: '3600px', width: '1440px')
- Duplicated/overlapping images
- No semantic HTML structure
- Not responsive
- Inline styles chaos

---

## Complete Phase Roadmap

Based on documentation in `/PROMPTS/`, here are ALL phases that affect quality:

### CRITICAL FOR QUALITY

#### Phase 0: Smart Content Extraction (NEW - MUST DO FIRST)
**Problem:** Current extraction copies DOM structure but loses text content.

**Solution:** Add `extractSectionContent()` to section-detector.ts:
```typescript
interface SectionContent {
  headings: { level: 1-6, text: string }[];
  paragraphs: string[];
  buttons: { text: string, href?: string }[];
  links: { text: string, href: string }[];
  images: { src: string, alt: string, role: 'hero'|'icon'|'decorative' }[];
  layout: 'centered' | 'split' | 'grid' | 'cards';
}
```

**Files to modify:**
- `src/lib/playwright/section-detector.ts` - Add content extraction
- `src/lib/generator/variant-generator.ts` - Use extracted content

---

#### Phase 3.5: Responsive Design (CRITICAL)
**From:** `docs/Roadmap.md`

**Problem:** Components are fixed-width (1440px), not responsive.

**Solution:**
1. Capture at multiple viewports (mobile, tablet, desktop)
2. Extract responsive styles at each breakpoint
3. Generate Tailwind responsive classes (sm:, md:, lg:)

**Breakpoints:**
| Breakpoint | Width | Device |
|------------|-------|--------|
| xs | < 480px | Mobile small |
| sm | 480-640px | Mobile large |
| md | 640-768px | Tablet |
| lg | 768-1024px | Tablet landscape |
| xl | 1024-1280px | Desktop |
| 2xl | > 1280px | Large desktop |

**Files to create/modify:**
- `src/lib/playwright/responsive-capture.ts` - Multi-viewport capture
- `src/lib/generator/responsive-styles.ts` - Map styles to breakpoints

---

#### Phase 5: Visual Comparison System (EXISTS - NEEDS IMPROVEMENT)
**From:** `PROMPTS/phase-5.md`

**Status:** Partially implemented

**What's needed:**
1. Take screenshots of generated components
2. Compare with reference using Pixelmatch
3. Calculate accuracy score per section
4. Generate diff images showing mismatches

**Files:**
- `src/lib/comparison/visual-diff.ts` - Exists but needs fixing
- `src/lib/comparison/compare-section.ts` - Screenshot comparison

---

### MEDIUM PRIORITY

#### Phase 4: AI Asset Generation (PLANNED)
**From:** `docs/Roadmap.md`

Use AI (Claude/Gemini) to generate:
- Custom SVG icons
- Illustrations
- Placeholder images
- Background patterns

**Benefit:** Replace stock images with appropriate alternatives.

---

#### Phase 6: History & Versioning (EXISTS)
**From:** `PROMPTS/phase-6.md`

**Status:** Partially implemented

Track versions of generated components:
- Auto-version on changes
- Changelog generation
- Rollback capability
- Compare versions

---

#### Phase 7: Template Mode (FUTURE)
**From:** `PROMPTS/phase-7.md`

Mix sections from multiple reference sites:
- Use header from Site A
- Use hero from Site B
- Merge design tokens

---

#### Phase 8: Final Assembly & Export (FUTURE)
**From:** `PROMPTS/phase-8.md`

- Asset optimization (WebP, lazy loading)
- Interactivity (dropdowns, modals, mobile menu)
- Export options (Next.js, Static HTML, Components only)
- Quality report generation

---

#### Phase 9: Agent SDK Refactor (FUTURE)
**From:** `PROMPTS/phase-9.md`

Refactor to multi-agent architecture:
- Orchestrator Agent - Coordinates pipeline
- Capture Agent - Screenshots
- Extractor Agent - Design tokens
- Generator Agent - Components (parallel)
- Comparator Agent - Visual comparison (parallel)

---

## Implementation Priority Order

### Sprint 1: Fix Core Quality Issues
1. **Phase 0: Content Extraction** - Extract actual text, not just DOM
2. **Variant Generator Fix** - Use AI to generate from screenshot + text

### Sprint 2: Responsive & Validation
3. **Phase 3.5: Responsive** - Multi-viewport capture and responsive classes
4. **Phase 5: Comparison** - Fix visual comparison to validate accuracy

### Sprint 3: Polish & Iterate
5. **Iteration Loop** - Re-generate components below 80% accuracy
6. **Phase 6: Versioning** - Track improvements

### Sprint 4: Advanced Features (Optional)
7. Phase 4: AI Assets
8. Phase 7: Template Mode
9. Phase 8: Export
10. Phase 9: Agent Architecture

---

## Quick Wins (Can do immediately)

1. **Fix text extraction** - Add `innerText` capture to section detection
2. **Use screenshot in generation** - Pass base64 image to Claude for component generation
3. **Remove pixel-perfect variant** - Variant A (pixel-perfect) produces unusable code

---

## Test Case

Website: https://clearpath-template.framer.website
Website ID: website-a08e766a-90a6-4382-a503-750bed981de5

**Expected Hero output should include:**
- H1: "A Path That Shapes Your Future."
- Subheading with description text
- CTA button: "START YOUR JOURNEY"
- Background image with proper sizing
- Responsive layout (not fixed 1440px)

---

## Session Summary (2026-01-18)

Changes made:
1. Improved capture timing for Framer animations
2. Added `waitForFramerAnimations()` and `waitForHeroContent()`
3. Updated GeneratedPanel with Preview/Code toggle
4. Added "Open Site" button for live preview
5. Fixed screenshot API caching
6. Identified root cause of poor component quality
7. Created comprehensive improvement plan

---

## Next Session Prompt

```
Les IMPROVEMENT_PLAN.md og start med Phase 0: Smart Content Extraction.

Oppgave:
1. Legg til extractSectionContent() i section-detector.ts
2. Ekstraher: headings, paragraphs, buttons, links, images
3. Oppdater variant-generator.ts til å bruke ekstrahert innhold
4. Test på https://clearpath-template.framer.website

Mål: Hero-komponenten skal inkludere H1 "A Path That Shapes Your Future."
```
