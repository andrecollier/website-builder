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

## Root Cause Analysis

The current extraction pipeline (`component-detector.ts`) only extracts:
- Raw DOM structure
- Computed CSS styles

It does NOT extract:
- **Text content** (headings, paragraphs, buttons)
- **Semantic meaning** (what is a heading vs body text)
- **Layout intent** (flexbox purpose, grid structure)
- **Interactive elements** (links, buttons with actions)

## Proposed Solution: 3-Phase Improvement

### Phase 1: Smart Content Extraction
**File to modify:** `src/lib/playwright/section-detector.ts`

Add new function `extractSectionContent()` that returns:
```typescript
interface SectionContent {
  // Text content
  headings: { level: 1-6, text: string, styles: object }[];
  paragraphs: string[];
  buttons: { text: string, href?: string, isPrimary: boolean }[];
  links: { text: string, href: string }[];

  // Media
  images: { src: string, alt: string, role: 'hero' | 'icon' | 'avatar' | 'decorative' }[];

  // Layout hints
  layout: 'centered' | 'split' | 'grid' | 'cards';
  columns?: number;

  // Raw styles for design system
  dominantColors: string[];
  fontFamilies: string[];
}
```

### Phase 2: AI-Powered Component Generation
**File to modify:** `src/lib/generator/variant-generator.ts`

Instead of copying DOM structure, use Claude to generate components:

**Input to AI:**
1. Screenshot of section (base64)
2. Extracted `SectionContent`
3. Design system tokens
4. Component type (hero, features, etc.)

**Prompt structure:**
```
You are generating a React component for a {type} section.

Screenshot: [attached]

Content to include:
- Heading: "{heading}"
- Subheading: "{subheading}"
- CTA Button: "{buttonText}" -> {buttonHref}
- Background image: {imageSrc}

Design tokens:
- Primary color: {primary}
- Font: {fontFamily}
- Spacing: {baseSpacing}

Generate a responsive React component using Tailwind CSS that:
1. Matches the visual layout in the screenshot
2. Uses semantic HTML (h1, p, button, etc.)
3. Is fully responsive (mobile-first)
4. Uses the provided design tokens
```

### Phase 3: Visual Validation Loop
**New file:** `src/lib/comparison/component-validator.ts`

After generating component:
1. Render component in headless browser
2. Take screenshot
3. Compare with original using pixelmatch
4. If accuracy < 80%, regenerate with feedback

## Implementation Priority

1. **Phase 1: Content Extraction** (Critical)
   - Without text content, components are useless
   - Estimated changes: ~200 lines in section-detector.ts

2. **Phase 2: AI Generation** (High)
   - Replace DOM copying with intelligent generation
   - Requires Claude API integration in variant-generator
   - Estimated changes: ~300 lines

3. **Phase 3: Validation** (Medium)
   - Quality assurance loop
   - Can be added incrementally
   - Estimated changes: ~150 lines

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `src/lib/playwright/section-detector.ts` | Add `extractSectionContent()` | P1 |
| `src/lib/generator/component-detector.ts` | Use new content extraction | P1 |
| `src/lib/generator/variant-generator.ts` | AI-based generation | P2 |
| `src/lib/generator/component-generator.ts` | Pass content to variant generator | P2 |
| `src/lib/comparison/component-validator.ts` | New validation loop | P3 |

## Quick Wins (Can do immediately)

1. Fix `extractRawPageData` TypeScript compilation error in capture.ts
2. Add text extraction to existing section detection
3. Update variant generator prompt to use extracted text

## Test Case

Website: https://clearpath-template.framer.website
Website ID: website-a08e766a-90a6-4382-a503-750bed981de5

Expected Hero output should include:
- H1: "A Path That Shapes Your Future."
- Subheading with description text
- CTA button: "START YOUR JOURNEY"
- Background image with proper sizing
- Responsive layout

## Commands to Resume Work

```bash
# Start dashboard
cd /Users/andrecollier/Personal/website-builder
npm run dev

# Start preview server for test website
cd Websites/website-a08e766a-90a6-4382-a503-750bed981de5/generated
npm run dev -- -p 3001

# Re-run extraction after changes
# (use dashboard or create test script)
```

## Session Summary

Changes made in this session:
1. Improved capture timing for Framer animations
2. Added `waitForFramerAnimations()` and `waitForHeroContent()`
3. Updated GeneratedPanel with Preview/Code toggle
4. Added "Open Site" button for live preview
5. Fixed screenshot API caching
6. Identified root cause of poor component quality
