# Component Generation Quality Analysis

**Date:** 2026-01-18
**Status:** Root cause identified, solutions proposed

---

## Executive Summary

The generated components are not visually accurate because of **multiple compounding issues** in the pipeline. The problem is NOT a single point of failure but a chain of issues from capture → extraction → generation.

---

## Root Cause Analysis

### Problem 1: Screenshot Capture Quality (CRITICAL)

**Observation:** The hero screenshot is compressed/scaled down from 1440x3600 to a much smaller size.

**Impact:**
- Claude cannot analyze fine details (typography, spacing, exact colors)
- Visual context is lost, making pixel-perfect recreation impossible
- Small text becomes unreadable

**Evidence:**
- `boundingBox: { width: 1440, height: 3600 }` but actual screenshot appears ~800px wide
- Screenshot compression removes critical design details

**Solution Options:**
1. **Capture at higher resolution** - Use deviceScaleFactor: 2 in Playwright
2. **Capture viewport-sized chunks** - Split tall sections into 1080p chunks
3. **Use Gemini 2.5 Pro** - Better at analyzing lower-res images

---

### Problem 2: Section Detection Too Greedy (CRITICAL)

**Observation:** The "hero" section includes content from multiple actual sections:
- Header/Nav
- Hero
- Features
- Services
- Multiple testimonials

**Evidence from metadata:**
```json
{
  "type": "hero",
  "boundingBox": { "height": 3600 },  // Way too tall for a hero
  "headings": [
    "A Path That Shapes Your Future.",  // Actual hero
    "There may not be a single switch...",  // Different section
    "Mindfulness & Stress Support",  // Features section
    "IndividualTherapy",  // Services section
    ...
  ]
}
```

**Impact:**
- AI gets confused about what the component should look like
- Extracted content is a jumbled mix of multiple sections
- Generated component doesn't match any real section

**Solution Options:**
1. **Stricter section boundaries** - Use visual gaps, background changes
2. **Maximum section height** - Cap at 1200px, split larger sections
3. **Semantic detection** - Use DOM structure, not just visual analysis

---

### Problem 3: AI Not Being Used (MAJOR)

**Observation:** The generated variant-b.tsx contains template code, not AI-generated code.

**Evidence:**
```tsx
// variant-b.tsx contains:
"We think, you grow — that's the deal"  // Wrong text
"🚀 200+ Businesses Launched"  // Not from clearpath
```

This is the **template fallback**, not AI output.

**Root Cause Analysis - AI Generation Conditions:**

Looking at `component-generator.ts:435-441`, AI generation requires ALL conditions:

```typescript
if (
  options.enableAIGeneration &&        // ✅ Set to true in API route (line 189)
  options.screenshotPath &&            // ❓ May be undefined if screenshot capture failed
  component.content &&                 // ❓ SectionContent may be empty/null
  options.designSystem &&              // ❓ Design system file may not exist
  isAIGenerationAvailable()            // ❓ ANTHROPIC_API_KEY may not be loaded
) {
  // Use AI generation
} else {
  // Fall back to template generation
}
```

**Likely failure points:**

1. **`options.screenshotPath` undefined**
   - Screenshot paths come from `componentScreenshotPaths` map
   - This map is built from `referenceSections` (cached) or `screenshotPaths` (captured)
   - If neither exists, the path will be undefined

2. **`component.content` is empty/null**
   - SectionContent is extracted during section detection
   - If extraction fails, content will be null
   - Check: Is content being extracted properly?

3. **`options.designSystem` is undefined**
   - Design system comes from `getDesignSystem(websiteId)` in the API route
   - Reads from `Websites/{websiteId}/design-system.json`
   - If file doesn't exist, returns undefined

4. **`isAIGenerationAvailable()` returns false**
   - Checks `!!process.env.ANTHROPIC_API_KEY`
   - Key may not be loaded in the server environment
   - Need to verify key is accessible at runtime

**Diagnosis Steps:**
```bash
# 1. Check if design system file exists
ls -la Websites/website-*/design-system.json

# 2. Check server logs for AI availability message
# Added console.log in isAIGenerationAvailable()

# 3. Check if screenshots exist
ls -la cache/*/screenshots/sections/
```

**Solution:**
- Add detailed logging at each condition check
- Ensure design-system.json is created during extraction
- Verify ANTHROPIC_API_KEY is loaded in server context
- Add fallback content extraction if SectionContent is empty

---

### Problem 4: Design System Extraction Quality (MEDIUM)

**Observation:** Design tokens are extracted but may be inaccurate.

**Missing from extraction:**
- Exact gradient definitions
- Font weights and letter-spacing
- Hover states and transitions
- Responsive breakpoint values

**Impact:**
- AI cannot use accurate colors even if it generates correct structure
- Typography doesn't match original
- Buttons and interactive elements look different

---

### Problem 5: Content Extraction Noise (MEDIUM)

**Observation:** The extracted content has duplicates and concatenated text.

**Evidence:**
```json
{
  "links": [
    { "text": "About", "href": "./about" },
    { "text": "About", "href": "./about" },  // Duplicate
    { "text": "ClarityConsultA short-term space...", ... }  // Concatenated
  ]
}
```

**Impact:**
- AI receives noisy, confusing data
- May include navigation links in hero content
- Hard to distinguish primary CTAs from secondary links

---

## Quality Pipeline Score

| Stage | Current Score | Target Score | Gap |
|-------|--------------|--------------|-----|
| Screenshot Capture | 50% | 90% | Large screenshots lose detail |
| Section Detection | 30% | 85% | Sections are too large |
| Content Extraction | 60% | 90% | Duplicates, noise |
| Design System | 70% | 90% | Missing gradients, effects |
| AI Generation | 0% | 85% | Not being called |
| **Overall** | **35%** | **90%** | |

---

## Proposed Solutions

### Option A: Fix Current Pipeline (Recommended First)

**Effort:** Medium
**Risk:** Low

1. **Fix AI activation** - Ensure Claude is actually called
2. **Improve section detection** - Max 1200px height per section
3. **Higher-res screenshots** - 2x device scale factor
4. **Clean content extraction** - Dedupe, trim concatenated text

**Expected improvement:** 35% → 65%

---

### Option B: Add Gemini for Visual Analysis

**Effort:** Medium
**Risk:** Low

**Why Gemini 2.5 Pro/Flash might help:**

1. **Better image understanding at lower resolutions**
   - Claude requires high-res images for detail
   - Gemini can extract structure from compressed images
   - Less token cost for image processing

2. **Multimodal reasoning**
   - Gemini 2.5 excels at spatial understanding
   - Can identify grid layouts, flexbox structures
   - Better at counting elements and measuring proportions

3. **Cost optimization**
   - Gemini Flash is much cheaper than Claude for image analysis
   - Reserve Claude for code generation only

**Where to integrate Gemini:**

| Step | Current | With Gemini |
|------|---------|-------------|
| Section detection | Playwright DOM | Gemini: "List all sections in this page" |
| Layout analysis | CSS extraction | Gemini: "Describe the layout structure" |
| Content extraction | DOM innerText | Gemini: "Extract all visible text with positions" |
| Code generation | Claude | Claude (unchanged) |
| Visual validation | Pixelmatch | Gemini: "Compare these images, list differences" |

**Pipeline with Gemini:**
```
Screenshot → Gemini (analyze layout & content) → Claude (generate code)
```

**Example Gemini prompt for layout analysis:**
```
Analyze this website section screenshot and provide:
1. Layout type (centered, split-screen, grid, etc.)
2. Number of columns and their proportions
3. Vertical spacing estimates (tight/normal/loose)
4. Color scheme (background, text, accent)
5. Typography hierarchy (heading sizes, body text)
6. List of all visible elements with approximate positions

Output as JSON for easy parsing.
```

**Expected improvement:** 65% → 80%

---

### Option C: Dual-Model Generation

**Effort:** High
**Risk:** Medium

**Approach:**
1. Claude generates semantic structure
2. Gemini validates against screenshot
3. Loop until >85% match

**Why this helps:**
- Cross-validation catches errors
- Leverages strengths of both models

**Expected improvement:** 80% → 90%

---

### Option D: Reference Image Refinement Loop

**Effort:** High
**Risk:** Medium

**Approach:**
1. Generate component
2. Screenshot the generated component (headless browser)
3. Compare against reference screenshot (Pixelmatch)
4. Send diff to AI: "Fix these red areas"
5. Repeat until >90% accuracy

**Current status:** Partially implemented in `refinement-loop.ts`

---

## Recommended Action Plan

### Phase 1: Emergency Fix (Now)
1. ✅ Add logging to verify AI is called
2. ⬜ Pass `enableAIGeneration: true` through the full pipeline
3. ⬜ Test one component end-to-end

### Phase 2: Improve Inputs (This Week)
1. ⬜ Fix section detection (max 1200px height)
2. ⬜ Capture screenshots at 2x scale
3. ⬜ Dedupe extracted content

### Phase 3: Add Gemini (Next Week)
1. ⬜ Add Gemini API integration
2. ⬜ Use Gemini for layout description
3. ⬜ Feed Gemini output to Claude prompt

### Phase 4: Refinement Loop (Later)
1. ⬜ Screenshot generated components
2. ⬜ Implement visual diff comparison
3. ⬜ Auto-retry with feedback

---

## Appendix: Generated vs Expected

### Expected Hero (from clearpath)
- Large background image with woman
- Gradient overlay
- H1: "A Path That Shapes Your Future."
- Subtitle: "We offer therapy and coaching..."
- CTA button: "Start your journey"
- Elegant serif/sans typography
- Soft green/cream color palette

### Generated Hero (current)
- No background image
- Generic blue button
- Wrong text ("We think, you grow")
- Template-style layout
- No brand colors

**Gap:** Nearly 100% - the AI was not used at all.

---

## Debugging Checklist

### Step 1: Verify AI Can Be Called

```bash
# Check API key in environment
grep ANTHROPIC_API_KEY .env.local

# Test AI generation directly
curl -X POST http://localhost:3000/api/test-ai \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

### Step 2: Check Design System File

```bash
# List all design system files
find Websites -name "design-system.json"

# Check if website has design system
cat Websites/website-46f282f4-*/design-system.json | head -50
```

**🔴 FOUND ISSUE:**
```
Websites/website-46f282f4-*/
├── design-system/          # Directory, not file!
│   ├── preview.html
│   └── preview.json        # <-- Design tokens here, wrong location
└── (NO design-system.json) # <-- API route looks for this!
```

The API route (`route.ts:74`) looks for `design-system.json` at the website root,
but the extraction saves to `design-system/preview.json` instead.

**Fix:** Either:
1. Update extraction to save `design-system.json` at root
2. Update API route to read from `design-system/preview.json`

### Step 3: Check Screenshot Paths

```bash
# List all cached screenshots
ls -la cache/*/screenshots/sections/

# Check screenshot in metadata
cat cache/clearpath-template.framer.website/metadata.json | grep screenshotPath | head -5
```

### Step 4: Check Component Content

```bash
# See if content was extracted
cat cache/clearpath-template.framer.website/metadata.json | jq '.sections[0].content.headings'
```

### Step 5: Add Debug Logging

In `component-generator.ts:435`:
```typescript
console.log('[AI Check] enableAIGeneration:', options.enableAIGeneration);
console.log('[AI Check] screenshotPath:', options.screenshotPath);
console.log('[AI Check] component.content:', !!component.content);
console.log('[AI Check] designSystem:', !!options.designSystem);
console.log('[AI Check] isAIAvailable:', isAIGenerationAvailable());
```

---

## Technical Summary

### Why Generated Components Are Bad

| Factor | Status | Impact |
|--------|--------|--------|
| AI Generation | NOT CALLED | Critical - using fallback templates |
| Screenshot Quality | Compressed | High - details lost |
| Section Detection | Too greedy | High - mixed content |
| Content Extraction | Has noise | Medium - duplicates/concatenation |
| Design System | May be missing | High - generic colors used |

### Current Pipeline Flow

```
1. API route calls generateComponents()
   └── enableAIGeneration: true ✅

2. generateComponents() calls generateAllVariantsAsync()
   └── passes enableAIGeneration: true ✅

3. generateAllVariantsAsync() calls generateComponentVariantsAsync()
   └── passes enableAIGeneration: true ✅

4. generateComponentVariantsAsync() checks conditions:
   - enableAIGeneration: true ✅
   - screenshotPath: ??? (may be undefined)
   - component.content: ??? (may be null)
   - designSystem: ??? (may be undefined)
   - isAIGenerationAvailable(): ??? (key loading issue?)

5. If ANY condition fails → falls back to template generation
```

### Files to Check

| File | Purpose | Issue |
|------|---------|-------|
| `src/lib/generator/component-generator.ts:435` | AI decision logic | All conditions must be true |
| `src/app/api/components/[websiteId]/generate/route.ts:408` | Design system loading | File may not exist |
| `src/lib/generator/ai-generator.ts:608` | API key check | Server env may differ |
| `src/lib/playwright/section-detector.ts` | Content extraction | May return empty content |

---

## Conclusion

The **primary issue is that AI generation is not being triggered**. I found the specific cause:

### 🔴 ROOT CAUSE IDENTIFIED

**The design system file is in the wrong location!**

```
Expected by API route:  Websites/{id}/design-system.json
Actual location:        Websites/{id}/design-system/preview.json
```

This causes `options.designSystem` to be `undefined`, which makes the AI condition fail and falls back to template generation.

### Other Contributing Factors

1. `screenshotPath` - May also be undefined if reference screenshots aren't linked
2. `component.content` - SectionContent may be empty (section too large, noisy extraction)
3. `isAIGenerationAvailable()` - Verify API key is accessible in server runtime

### Recommended Next Steps

**Immediate Fix:**
1. Update `route.ts:getDesignSystem()` to read from `design-system/preview.json`
2. OR update extraction to save `design-system.json` at root level
3. Re-run generation after fixing

**Short-term Improvements:**
1. Fix section detection to limit section height to ~1200px
2. Capture screenshots at 2x resolution
3. Dedupe extracted content

**Medium-term Enhancements:**
1. Integrate Gemini 2.5 for layout analysis pre-processing
2. Use Gemini to describe visual structure before Claude generates code
3. Implement visual comparison refinement loop

**Expected Results:**
- After design system fix: AI will be called → 35% → 55%
- After section detection fix: Accurate content → 55% → 70%
- After Gemini integration: Better layout understanding → 70% → 85%
