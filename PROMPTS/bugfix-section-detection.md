# Bugfix: Screenshot & Section Detection for Framer Sites

## Priority: High

## Problem Summary
Three critical issues when capturing Framer websites:

1. **Design extraction NOT IMPLEMENTED** - Uses hardcoded defaults instead of extracting from page
2. **Incomplete screenshots** - Many sections appear white/empty because lazy-loaded content doesn't render in time
3. **Section detection fails** - Only 1 section detected instead of ~6

## Test Case
- **URL:** https://fluence.framer.website/
- **Expected:** ~6 sections (header, hero, features, testimonials, CTA, footer)
- **Actual:** 1 section (header only), many sections white/empty in screenshot

---

## Bug 1: Design Extraction Not Implemented (CRITICAL)

### Root Cause
The design system extraction uses **hardcoded defaults** instead of actually extracting from the page.

See `src/app/api/start-extraction/route.ts` line 58:
```typescript
// Generate design system with default values
// TODO: Replace with actual raw data extraction from Playwright when implemented
const designSystem = getDefaultDesignSystem(url);  // ← Uses defaults!
```

**Result:** All colors, fonts, spacing are placeholder values, not from Fluence.

### Affected Files
- `src/app/api/start-extraction/route.ts` - Line 52-86 `synthesizeAndSaveDesignSystem()`

### Suggested Fix
Implement actual extraction using Playwright's `page.evaluate()`:

```typescript
async function extractRawPageData(page: Page, url: string): Promise<RawPageData> {
  const rawData = await page.evaluate(() => {
    const colors: string[] = [];
    const backgrounds: string[] = [];
    const borders: string[] = [];
    const fontFamilies: string[] = [];
    const fontSizes: string[] = [];
    // ... more arrays for typography, spacing, effects

    // Get all visible elements
    const elements = document.querySelectorAll('*');

    elements.forEach(el => {
      const style = getComputedStyle(el);

      // Colors
      if (style.color && style.color !== 'rgba(0, 0, 0, 0)') {
        colors.push(style.color);
      }
      if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        backgrounds.push(style.backgroundColor);
      }
      if (style.borderColor && style.borderColor !== 'rgba(0, 0, 0, 0)') {
        borders.push(style.borderColor);
      }

      // Typography
      if (style.fontFamily) fontFamilies.push(style.fontFamily);
      if (style.fontSize) fontSizes.push(style.fontSize);

      // ... extract more properties
    });

    return {
      colors: { colors, backgrounds, borders },
      typography: { fontFamilies, fontSizes, fontWeights: [], lineHeights: [] },
      spacing: { paddings: [], margins: [], gaps: [], containerWidths: [] },
      effects: { boxShadows: [], borderRadii: [], transitions: [] },
    };
  });

  return { url, ...rawData };
}
```

Then update `synthesizeAndSaveDesignSystem`:
```typescript
async function synthesizeAndSaveDesignSystem(
  websiteId: string,
  url: string,
  page: Page  // Pass Playwright page
): Promise<DesignSystem> {
  // Extract actual data from page
  const rawData = await extractRawPageData(page, url);

  // Synthesize using real data
  const designSystem = synthesizeDesignSystem(rawData);

  // ... save files
}
```

### Impact
Without this fix, ALL design tokens are wrong - colors, fonts, spacing, everything.

---

## Bug 2: Scroll Too Fast (Incomplete Screenshots)

### Root Cause
Current scroll configuration in `src/types/index.ts`:

```typescript
CAPTURE_CONFIG = {
  scrollDistance: 300,   // 300px per scroll
  scrollDelay: 100,      // Only 100ms between scrolls!
  animationWait: 2000,   // Only waits at the end
}
```

**Problem:** Framer sites use intersection observer and fade-in animations. With only 100ms between scrolls, content doesn't have time to render before we scroll past it.

### Affected Files
- `src/types/index.ts` - CAPTURE_CONFIG values
- `src/lib/playwright/scroll-loader.ts` - autoScroll function

### Suggested Fix

**Option 1: Increase scroll delay** (simple)
```typescript
CAPTURE_CONFIG = {
  scrollDistance: 300,
  scrollDelay: 500,      // Increase to 500ms
  animationWait: 2000,
}
```

**Option 2: Smart scroll with render wait** (better)
Update `autoScroll` in `src/lib/playwright/scroll-loader.ts`:

```typescript
export async function autoScroll(page: Page, options?: ScrollOptions): Promise<void> {
  await page.evaluate(async ({ distance, delay }) => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;

      const scroll = async () => {
        const scrollHeight = document.body.scrollHeight;

        if (totalHeight >= scrollHeight) {
          window.scrollTo(0, 0);
          resolve();
          return;
        }

        window.scrollBy(0, distance);
        totalHeight += distance;

        // Wait for intersection observer callbacks and animations
        await new Promise(r => setTimeout(r, delay));

        // Wait for any pending images in viewport
        await Promise.race([
          Promise.all(
            Array.from(document.querySelectorAll('img'))
              .filter(img => {
                const rect = img.getBoundingClientRect();
                return rect.top < window.innerHeight && rect.bottom > 0;
              })
              .map(img => img.complete ? Promise.resolve() :
                new Promise(r => img.onload = r))
          ),
          new Promise(r => setTimeout(r, 1000)) // Max 1s per scroll
        ]);

        requestAnimationFrame(() => scroll());
      };

      scroll();
    });
  }, { distance: scrollDistance, delay: scrollDelay });
}
```

**Option 3: Multiple scroll passes** (most thorough)
Scroll down once fast, then scroll back up slowly to let everything render:

```typescript
// First pass: trigger all lazy loading
await autoScroll(page, { scrollDelay: 100 });

// Second pass: slow scroll to let content render
await autoScroll(page, { scrollDelay: 500 });

// Extra wait for Framer animations
await page.waitForTimeout(3000);
```

---

## Bug 3: Section Detection Fails

### Root Cause
The section detector in `src/lib/playwright/section-detector.ts` uses CSS class-based selectors:
- `[class*="hero"]`
- `[class*="features"]`
- `[class*="testimonials"]`

**Problem:** Framer generates obfuscated class names like `framer-xyz123` instead of semantic names like `hero-section`.

The generic fallback looks for `<section>` and `<article>` tags, but Framer only uses `<div>` elements.

## Affected File
`src/lib/playwright/section-detector.ts`

## Current Metadata Output
```json
{
  "fullPageHeight": 14394,
  "sectionCount": 1,
  "sections": [
    {
      "type": "header",
      "boundingBox": { "height": 1236 }
    }
  ]
}
```

## Suggested Fix

### Option 1: Viewport-based Splitting (Recommended)
Add a fallback that divides the page into sections based on viewport height when semantic detection fails:

```typescript
async function viewportBasedSplitting(page: Page): Promise<DetectedSection[]> {
  const viewportHeight = 900; // Standard viewport
  const fullHeight = await page.evaluate(() => document.body.scrollHeight);

  const sections: DetectedSection[] = [];
  let currentY = 0;
  let index = 0;

  while (currentY < fullHeight) {
    const sectionHeight = Math.min(viewportHeight, fullHeight - currentY);
    sections.push({
      id: `viewport-section-${index}`,
      type: index === 0 ? 'header' : 'content',
      boundingBox: {
        x: 0,
        y: currentY,
        width: 1440,
        height: sectionHeight
      }
    });
    currentY += sectionHeight;
    index++;
  }

  return sections;
}
```

### Option 2: Heuristic-based Detection
Analyze visual breaks in the page:
- Look for large gaps in background color
- Detect full-width elements that span the viewport
- Use intersection observer patterns

### Option 3: Framer-specific Selectors
Add selectors that work with Framer's structure:
- `[data-framer-name]` - Framer often adds data attributes
- `.framer-*` patterns for known Framer components
- Direct child divs of main content area

## Implementation Steps

1. **Add viewport fallback** to `detectSections()` function:
   ```typescript
   const semanticSections = await detectSemanticSections(page);

   if (semanticSections.length <= 1) {
     // Fallback to viewport-based splitting
     return await viewportBasedSplitting(page);
   }

   return semanticSections;
   ```

2. **Update screenshot capture** to handle viewport-split sections

3. **Test with Fluence URL** to verify fix works

## Acceptance Criteria

### Bug 1 (Design Extraction) - CRITICAL
- [ ] Colors extracted match actual page colors (purple for Fluence, not blue)
- [ ] Fonts extracted match actual page fonts
- [ ] design-system.json contains real values from page
- [ ] variables.css uses actual extracted colors

### Bug 2 (Screenshots)
- [ ] Full-page screenshot shows ALL content (no white/empty sections)
- [ ] All images and text visible in screenshot
- [ ] Framer animations have completed before capture

### Bug 3 (Section Detection)
- [ ] Running extraction on https://fluence.framer.website/ detects 5+ sections
- [ ] Each section gets its own screenshot in `reference/sections/`
- [ ] metadata.json shows correct section count and bounding boxes
- [ ] Existing semantic detection still works for non-Framer sites

## Test Command
```bash
curl -X POST http://localhost:3000/api/start-extraction \
  -H "Content-Type: application/json" \
  -d '{"url": "https://fluence.framer.website/"}'

# Then check:
# Websites/website-{id}/reference/metadata.json
# Websites/website-{id}/reference/sections/
```

## Notes
- Full-page screenshot (2.4MB) confirms Playwright and lazy-load handling work correctly
- Design system extraction works perfectly
- This is the only blocking issue found in Phase 4.5 testing
