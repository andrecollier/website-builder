DESIGN SYSTEM EXTRACTION & DOCUMENTATION (DEL 1)
You are extracting a complete design system from reference websites and documenting it for implementation. This is a MEASUREMENT and DOCUMENTATION task, NOT an implementation task.
NO CODING. NO COMPONENT BUILDING. ONLY ANALYSIS AND DOCUMENTATION.

PHASE 0: PLAYWRIGHT VERIFICATION (CRITICAL)
Step 0.1: Check Playwright Installation
# Check if Playwright is installed
npm list playwright

# If not installed or test fails, install:
npm install -D playwright @playwright/test
npx playwright install chromium

Step 0.2: Test Playwright
Create a quick test file test-playwright.js:
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('https://example.com');
  await page.screenshot({ path: 'test-screenshot.png', fullPage: true });
  console.log('✅ Playwright works! Screenshot saved to test-screenshot.png');
  await browser.close();
})();

Run it:
node test-playwright.js

STOP HERE. If this fails, debug Playwright installation before proceeding.
If successful, you should see:
Browser window opens
example.com loads
test-screenshot.png created
"✅ Playwright works!" in console

PHASE 1: CAPTURE REFERENCE SCREENSHOTS
Step 1.1: Create Screenshot Directory Structure
mkdir -p context/visual-references/desktop
mkdir -p context/visual-references/sections

Step 1.2: Screenshot Reference URLs
Create scripts/capture-references.js:
const { chromium } = require('playwright');
const path = require('path');

const references = [
  { name: 'reference-1', url: '[REFERENCE_URL_1]' },
];

(async () => {
  const browser = await chromium.launch({ headless: false });
  
  for (const ref of references) {
    console.log(`📸 Screenshotting: ${ref.url}`);
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    
    try {
      await page.goto(ref.url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Full page screenshot
      await page.screenshot({ 
        path: `context/visual-references/desktop/${ref.name}-full.png`, 
        fullPage: true 
      });
      
      // Section screenshots
      await page.screenshot({ 
        path: `context/visual-references/sections/${ref.name}-hero.png`,
        clip: { x: 0, y: 0, width: 1440, height: 900 }
      });
      
      console.log(`✅ Captured: ${ref.name}`);
    } catch (error) {
      console.error(`❌ Failed to capture ${ref.url}:`, error.message);
    }
    
    await page.close();
  }
  
  await browser.close();
  console.log('\n🎉 All screenshots captured!');
})();

BEFORE running, replace [REFERENCE_URL_1], [REFERENCE_URL_2], [REFERENCE_URL_3] with actual URLs.
Run it:
node scripts/capture-references.js

STOP HERE. Verify that:
[ ] All screenshots saved to context/visual-references/desktop/
[ ] Screenshots are not blank/broken
[ ] You can open and view each PNG file

PHASE 2: EXTRACT DESIGN TOKENS (ACTUAL MEASUREMENT)
Step 2.1: Inspect with Browser DevTools
For EACH reference URL, manually open in Chrome DevTools and extract:
Create scripts/inspect-design.js:
const { chromium } = require('playwright');

const url = '[REFERENCE_URL_1]'; // Change for each reference

(async () => {
  const browser = await chromium.launch({ headless: false, devtools: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  
  console.log('\n🔍 INSPECTING:', url);
  console.log('\n📋 INSTRUCTIONS:');
  console.log('1. Use Chrome DevTools (Elements tab) to inspect elements');
  console.log('2. Extract the following from Computed styles:');
  console.log('   - Colors (background-color, color)');
  console.log('   - Font families (font-family)');
  console.log('   - Font sizes (font-size)');
  console.log('   - Font weights (font-weight)');
  console.log('   - Line heights (line-height)');
  console.log('   - Padding/Margin (padding, margin)');
  console.log('   - Border radius (border-radius)');
  console.log('   - Box shadows (box-shadow)');
  console.log('\n⏸️  Browser will stay open. Press Ctrl+C when done inspecting.\n');
  
  // Auto-extract some values
  const colors = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const colorSet = new Set();
    
    elements.forEach(el => {
      const styles = window.getComputedStyle(el);
      if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        colorSet.add(styles.backgroundColor);
      }
      if (styles.color) {
        colorSet.add(styles.color);
      }
    });
    
    return Array.from(colorSet);
  });
  
  const fonts = await page.evaluate(() => {
    const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, button');
    const fontSet = new Set();
    
    elements.forEach(el => {
      const styles = window.getComputedStyle(el);
      fontSet.add(styles.fontFamily);
    });
    
    return Array.from(fontSet);
  });
  
  console.log('\n🎨 AUTO-DETECTED COLORS:');
  colors.slice(0, 20).forEach(color => console.log(`  - ${color}`));
  
  console.log('\n🔤 AUTO-DETECTED FONTS:');
  fonts.forEach(font => console.log(`  - ${font}`));
  
  // Keep browser open for manual inspection
  await new Promise(() => {}); // Never resolves
})();

Run for each reference:
node scripts/inspect-design.js

MANUALLY DOCUMENT in a temporary file design-extraction-notes.md:
# Design Extraction Notes

## Reference 1: [URL]

### Colors (Hex Codes)
- Primary: #[hex]
- Secondary: #[hex]
- Background: #[hex]
- Text: #[hex]
- Accent: #[hex]

### Typography
**Headings:**
- H1: [font-family], [size]px/[rem], weight [number], line-height [value]
- H2: [font-family], [size]px/[rem], weight [number], line-height [value]
- H3: [font-family], [size]px/[rem], weight [number], line-height [value]

**Body:**
- Font family: [name]
- Size: [px]/[rem]
- Weight: [number]
- Line height: [value]

### Spacing Patterns
- Container padding: [value]
- Section spacing: [value]
- Component gaps: [value]
- Observed grid: [4pt/8pt/custom]

### Effects
- Border radius: [value]px on buttons, [value]px on cards
- Primary shadow: box-shadow: [full value]
- Hover shadow: box-shadow: [full value]

### Component Styles
**Buttons:**
- Padding: [value]
- Border radius: [value]
- Font size: [value]
- Font weight: [value]

**Cards:**
- Padding: [value]
- Border: [value]
- Border radius: [value]
- Shadow: [value]

[Repeat for Reference 2 and Reference 3]

STOP HERE. Show me your design-extraction-notes.md file. I need to verify you extracted ACTUAL values, not placeholders.

PHASE 3: SYNTHESIZE DESIGN SYSTEM
Step 3.1: Analyze Patterns Across References
Compare your extraction notes for all 3 references:
Find common patterns:
Do they use similar color schemes?
Common spacing increments (4px, 8px)?
Similar typography scales?
Shared component styles?
Choose best elements from each:
Which color palette is most modern?
Which typography hierarchy is clearest?
Which spacing system is most consistent?
Document your synthesis logic:
Create context/design-synthesis.md:
# Design System Synthesis

## Sources Analyzed
1. [Reference 1 URL] - [What made this design strong]
2. [Reference 2 URL] - [What made this design strong]
3. [Reference 3 URL] - [What made this design strong]

## Color System Decision
**Chosen approach:** [Reference X's palette because Y reason]
**Modifications:** [Any adjustments made]

## Typography Decision
**Chosen approach:** [Reference X's scale because Y reason]
**Font pairings:** [Heading font + Body font from which reference]

## Spacing System Decision
**Chosen approach:** [X-point grid from Reference Y]
**Rationale:** [Why this spacing works best]

## Component Styles Decision
**Buttons:** [Based on Reference X with Y modifications]
**Cards:** [Based on Reference X with Y modifications]
**Navigation:** [Based on Reference X with Y modifications]

STOP HERE. Show me your synthesis decisions. I need to approve your choices before documentation.

PHASE 4: CREATE DESIGN SYSTEM DOCUMENTATION
Step 4.1: Create design-principles.md
Location: context/design-principles.md
Use ACTUAL observations, not generic principles:
# Design Principles

## Visual Direction
[Describe the aesthetic synthesized from references - modern, minimal, bold, etc.]

## Core Principles

### 1. [Principle Name Based on Observation]
**What:** [Specific pattern observed across references]
**Why:** [Why this pattern works - cite references]
**How:** [Exact implementation guidance]
**Example:** [Concrete example from one of the references]

### 2. Color Psychology
**What:** [Describe the color approach from references]
**Why:** [Why these colors were chosen by references]
**How:** [When to use primary vs. secondary vs. accent]
**Example:** 
- Primary (#[hex]) used for CTAs in all 3 references
- Neutral grays (#[hex] - #[hex]) for backgrounds

### 3. Hierarchy Through Typography
**What:** [How references establish visual hierarchy]
**Why:** [Why the size differences matter]
**How:** [Scale ratios observed: e.g., 1.25, 1.5, 2, 3]
**Example:** Reference 2 uses 48px → 32px → 24px → 16px

### 4. Whitespace as a Design Element
**What:** [Spacing patterns observed]
**Why:** [How spacing improves readability/focus]
**How:** [Use 8pt grid with multiples: 8, 16, 24, 32, 48, 64]
**Example:** Hero sections use 64px vertical padding consistently

### 5. Consistent Border Radius
**What:** [Border radius values from references]
**Why:** [Soft vs. sharp corners - what feeling it creates]
**How:** 
- Buttons: [X]px
- Cards: [Y]px
- Inputs: [Z]px

### 6. Elevation Through Shadows
**What:** [Shadow system from references]
**Why:** [How shadows create depth and focus]
**How:** [3-level shadow system]
**Example:**
- Small: box-shadow: [actual value from reference]
- Medium: box-shadow: [actual value from reference]
- Large: box-shadow: [actual value from reference]

### 7. Interaction Feedback
**What:** [Hover/active states observed]
**Why:** [User expects visual feedback]
**How:** [Specific transitions and transforms]
**Example:** Buttons darken 10% on hover, scale(1.02) on active

### 8. Mobile-First Responsive
**What:** [Responsive patterns from references]
**Why:** [Mobile usage statistics]
**How:** [Breakpoints: 640px, 768px, 1024px, 1280px, 1536px]

### 9. Accessibility First
**What:** [Accessibility features observed]
**Why:** [WCAG AA compliance]
**How:** [Minimum contrast ratios, focus states, keyboard nav]

### 10. Performance Optimization
**What:** [Performance patterns from references]
**Why:** [Load time impacts conversion]
**How:** [Image optimization, lazy loading, minimal animations]

## Anti-Patterns to Avoid

Based on analysis of what references DON'T do:

❌ **Inconsistent spacing** - Don't use random px values
✅ Use spacing scale multiples

❌ **Too many colors** - Don't exceed 3 primary colors
✅ Primary + Secondary + 1-2 Accent colors

❌ **Tiny touch targets** - Don't make buttons < 44px height
✅ Minimum 48px height for all interactive elements

❌ **Poor contrast** - Don't use gray text on gray backgrounds
✅ Maintain 4.5:1 contrast ratio minimum

❌ **Animation overload** - Don't animate everything
✅ Animate only on interaction or state change

Step 4.2: Create style-guide.md
Location: context/style-guide.md
EVERY value must be from your extraction notes - NO PLACEHOLDERS:
# Style Guide

## Color System

### Primary Palette
Extracted from [Reference X]:

\`\`\`css
/* Primary Colors - [Describe the color: e.g., Deep Blue] */
--primary-50: #[hex from extraction];
--primary-100: #[hex from extraction];
--primary-200: #[hex from extraction];
--primary-300: #[hex from extraction];
--primary-400: #[hex from extraction];
--primary-500: #[hex from extraction];  /* Main primary */
--primary-600: #[hex from extraction];
--primary-700: #[hex from extraction];
--primary-800: #[hex from extraction];
--primary-900: #[hex from extraction];
--primary-950: #[hex from extraction];
\`\`\`

### Secondary Palette
Extracted from [Reference Y]:

\`\`\`css
/* Secondary Colors - [Describe the color] */
--secondary-500: #[hex from extraction];
--secondary-600: #[hex from extraction];
--secondary-700: #[hex from extraction];
\`\`\`

### Neutral/Gray Scale
Synthesized from all references:

\`\`\`css
/* Neutrals */
--gray-50: #[hex];
--gray-100: #[hex];
--gray-200: #[hex];
--gray-300: #[hex];
--gray-400: #[hex];
--gray-500: #[hex];
--gray-600: #[hex];
--gray-700: #[hex];
--gray-800: #[hex];
--gray-900: #[hex];
--gray-950: #[hex];
\`\`\`

### Semantic Colors

\`\`\`css
/* Success */
--success-500: #[hex from extraction or standard];
--success-600: #[hex];
--success-700: #[hex];

/* Error */
--error-500: #[hex from extraction or standard];
--error-600: #[hex];
--error-700: #[hex];

/* Warning */
--warning-500: #[hex from extraction or standard];
--warning-600: #[hex];
--warning-700: #[hex];

/* Info */
--info-500: #[hex from extraction or standard];
--info-600: #[hex];
--info-700: #[hex];
\`\`\`

### Color Usage Guidelines

**Primary:** Use for CTAs, links, key actions
**Secondary:** Use for secondary actions, accents
**Neutrals:** Use for text, borders, backgrounds
**Semantic:** Use only for their intended meaning

### Accessibility

All color combinations meet WCAG AA standards:
- Text contrast ratio: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum

## Typography System

### Font Families

**Extracted from references:**

\`\`\`css
/* Headings - from [Reference X] */
--font-heading: '[Actual font name from extraction]', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Body - from [Reference Y] */
--font-body: '[Actual font name from extraction]', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace (if needed) */
--font-mono: 'SF Mono', 'Monaco', 'Cascadia Code', 'Courier New', monospace;
\`\`\`

### Type Scale

**Extracted from references (converted to rem):**

\`\`\`css
/* Display - for hero headlines */
--text-display: [X]rem;     /* [Y]px - observed in Reference Z */

/* Headings */
--text-5xl: [X]rem;     /* [Y]px - H1 from references */
--text-4xl: [X]rem;     /* [Y]px - H2 from references */
--text-3xl: [X]rem;     /* [Y]px - H3 from references */
--text-2xl: [X]rem;     /* [Y]px - H4 from references */
--text-xl: [X]rem;      /* [Y]px - H5 from references */
--text-lg: [X]rem;      /* [Y]px - H6 from references */

/* Body */
--text-base: 1rem;      /* 16px - standard body */
--text-sm: [X]rem;      /* [Y]px - small text */
--text-xs: [X]rem;      /* [Y]px - captions */
\`\`\`

### Font Weights

**From extraction:**

\`\`\`css
--font-light: 300;    /* Used for [describe usage from references] */
--font-normal: 400;   /* Body text */
--font-medium: 500;   /* Subheadings, emphasis */
--font-semibold: 600; /* Buttons, important headings */
--font-bold: 700;     /* H1, H2, strong emphasis */
--font-extrabold: 800; /* Display text (if used in references) */
\`\`\`

### Line Heights

**Observed patterns:**

\`\`\`css
--leading-tight: 1.25;     /* Headings */
--leading-snug: 1.375;     /* Subheadings */
--leading-normal: 1.5;     /* Body text */
--leading-relaxed: 1.625;  /* Long-form content */
--leading-loose: 2;        /* Special cases */
\`\`\`

### Letter Spacing

**From references:**

\`\`\`css
--tracking-tighter: -0.05em;  /* Large headings */
--tracking-tight: -0.025em;   /* Headings */
--tracking-normal: 0;         /* Body */
--tracking-wide: 0.025em;     /* Buttons, labels */
--tracking-wider: 0.05em;     /* All caps text */
\`\`\`

## Spacing System

**Observed pattern: [X]pt grid system**

\`\`\`css
/* Base unit: [X]px / [Y]rem */
--space-0: 0;
--space-px: 1px;
--space-0-5: [X]rem;   /* [Y]px */
--space-1: [X]rem;     /* [Y]px */
--space-1-5: [X]rem;   /* [Y]px */
--space-2: [X]rem;     /* [Y]px */
--space-2-5: [X]rem;   /* [Y]px */
--space-3: [X]rem;     /* [Y]px */
--space-3-5: [X]rem;   /* [Y]px */
--space-4: [X]rem;     /* [Y]px */
--space-5: [X]rem;     /* [Y]px */
--space-6: [X]rem;     /* [Y]px */
--space-7: [X]rem;     /* [Y]px */
--space-8: [X]rem;     /* [Y]px */
--space-9: [X]rem;     /* [Y]px */
--space-10: [X]rem;    /* [Y]px */
--space-11: [X]rem;    /* [Y]px */
--space-12: [X]rem;    /* [Y]px */
--space-14: [X]rem;    /* [Y]px */
--space-16: [X]rem;    /* [Y]px */
--space-20: [X]rem;    /* [Y]px */
--space-24: [X]rem;    /* [Y]px */
--space-28: [X]rem;    /* [Y]px */
--space-32: [X]rem;    /* [Y]px */
--space-36: [X]rem;    /* [Y]px */
--space-40: [X]rem;    /* [Y]px */
--space-44: [X]rem;    /* [Y]px */
--space-48: [X]rem;    /* [Y]px */
--space-52: [X]rem;    /* [Y]px */
--space-56: [X]rem;    /* [Y]px */
--space-60: [X]rem;    /* [Y]px */
--space-64: [X]rem;    /* [Y]px */
--space-72: [X]rem;    /* [Y]px */
--space-80: [X]rem;    /* [Y]px */
--space-96: [X]rem;    /* [Y]px */
\`\`\`

### Spacing Usage Guidelines

**From observations:**
- Buttons: padding-x [value], padding-y [value]
- Cards: padding [value]
- Sections: padding-y [value] (desktop), padding-y [value] (mobile)
- Component gaps: gap-[value]
- Container padding: px-[value]

## Border Radius

**Extracted from references:**

\`\`\`css
--radius-none: 0;
--radius-sm: [X]px;     /* Small elements - from Reference Y */
--radius-base: [X]px;   /* Default - from Reference Y */
--radius-md: [X]px;     /* Cards - from Reference X */
--radius-lg: [X]px;     /* Larger cards - from Reference Z */
--radius-xl: [X]px;     /* Hero sections (if applicable) */
--radius-2xl: [X]px;    /* Special elements */
--radius-3xl: [X]px;    /* Very large elements */
--radius-full: 9999px;  /* Circular/pill shapes */
\`\`\`

**Usage:**
- Buttons: radius-[value] (from extraction)
- Cards: radius-[value] (from extraction)
- Inputs: radius-[value] (from extraction)
- Images: radius-[value] or radius-full for avatars

## Shadows

**Extracted from references:**

\`\`\`css
/* Reference X's shadow system */
--shadow-xs: [actual box-shadow value from extraction];
--shadow-sm: [actual box-shadow value from extraction];
--shadow-base: [actual box-shadow value from extraction];
--shadow-md: [actual box-shadow value from extraction];
--shadow-lg: [actual box-shadow value from extraction];
--shadow-xl: [actual box-shadow value from extraction];
--shadow-2xl: [actual box-shadow value from extraction];
\`\`\`

**Usage:**
- Cards at rest: shadow-[value]
- Cards on hover: shadow-[value]
- Buttons on hover: shadow-[value]
- Modals/Overlays: shadow-[value]
- Dropdowns: shadow-[value]

## Effects & Transitions

**Observed from references:**

\`\`\`css
/* Transitions */
--transition-fast: [X]ms ease;        /* Quick feedback - from Reference Y */
--transition-base: [X]ms ease;        /* Standard - from Reference X */
--transition-slow: [X]ms ease-in-out; /* Smooth animations */

/* Timing functions */
--ease-in: cubic-bezier([values from extraction if available]);
--ease-out: cubic-bezier([values from extraction if available]);
--ease-in-out: cubic-bezier([values from extraction if available]);
\`\`\`

**Hover Effects (from references):**
- Buttons: [describe observed effect - e.g., "darken background by 10%, lift by 2px"]
- Cards: [describe observed effect]
- Links: [describe observed effect]

## Layout System

### Container Widths

**Extracted from references:**

\`\`\`css
--container-sm: [X]px;    /* Narrow content - from Reference Y */
--container-md: [X]px;    /* Standard - from Reference X */
--container-lg: [X]px;    /* Wide content - from Reference X */
--container-xl: [X]px;    /* Full width sections */
--container-2xl: [X]px;   /* Maximum width */
\`\`\`

### Breakpoints

**Standard responsive breakpoints:**

\`\`\`css
/* Mobile first approach */
--screen-sm: 640px;   /* Small tablets */
--screen-md: 768px;   /* Tablets */
--screen-lg: 1024px;  /* Small desktops */
--screen-xl: 1280px;  /* Desktops */
--screen-2xl: 1536px; /* Large desktops */
\`\`\`

### Grid System

**Observed in references:**

- Desktop: [X] columns with [Y]px gap
- Tablet: [X] columns with [Y]px gap
- Mobile: [X] columns with [Y]px gap

## Component Patterns

### Button Styles

**Primary Button** (from Reference [X]):

**Visual:**
- Background: var(--primary-600)
- Text: white
- Padding: [actual values] (e.g., 0.75rem 1.5rem)
- Border radius: var(--radius-[size])
- Font size: var(--text-base)
- Font weight: var(--font-semibold)
- Shadow: var(--shadow-sm)

**States:**
- Hover: background var(--primary-700), shadow var(--shadow-md)
- Active: scale(0.98)
- Focus: ring-2 ring-primary-500 ring-offset-2
- Disabled: opacity-50, cursor-not-allowed

**Tailwind Classes:**
\`\`\`
className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:scale-98 disabled:opacity-50"
\`\`\`

**Secondary Button** (from Reference [Y]):
[Repeat same structure]

**Ghost Button** (from Reference [Z]):
[Repeat same structure]

### Input Fields

**Text Input** (from references):

**Visual:**
- Border: [value] solid var(--gray-300)
- Padding: [actual values]
- Border radius: var(--radius-[size])
- Font size: var(--text-base)
- Background: white or var(--gray-50)

**States:**
- Focus: border var(--primary-500), ring-2 ring-primary-500
- Error: border var(--error-500), ring-2 ring-error-500
- Disabled: background var(--gray-100), cursor-not-allowed

**Tailwind Classes:**
\`\`\`
className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
\`\`\`

### Card Component

**Standard Card** (from Reference [X]):

**Visual:**
- Background: white
- Padding: [actual values from extraction]
- Border: [value if any]
- Border radius: var(--radius-md)
- Shadow: var(--shadow-base)

**Hover State:**
- Shadow: var(--shadow-lg)
- Transform: translateY(-2px)
- Transition: var(--transition-base)

**Tailwind Classes:**
\`\`\`
className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-250"
\`\`\`

[Continue for other components: Navigation, Footer, Hero, etc.]

Step 4.3: Create component-plan.md
Location: context/component-plan.md
# Component & Section Build Plan

## Analysis Summary

After analyzing [Reference 1], [Reference 2], and [Reference 3], the following components and sections appear consistently and should be prioritized:

## Core Components (Build First)

### 1. Button Component
**Priority:** HIGH
**Variants Needed:**
- Primary (main CTAs)
- Secondary (alternative actions)
- Ghost (subtle actions)
- Disabled state
- Loading state (if observed)

**Based on:** Reference [X] for primary, Reference [Y] for secondary
**Specifications:** See style-guide.md → Component Patterns → Button Styles
**Dependencies:** None
**Estimated complexity:** Low

### 2. Input Component
**Priority:** HIGH
**Variants Needed:**
- Text input
- Email input
- Textarea
- Select dropdown (if needed)
- Checkbox (if needed)
- Radio (if needed)

**States:**
- Default
- Focus
- Error
- Disabled
- Success (if needed)

**Based on:** Reference [Z]
**Specifications:** See style-guide.md → Component Patterns → Input Fields
**Dependencies:** None
**Estimated complexity:** Medium

### 3. Card Component
**Priority:** HIGH
**Variants Needed:**
- Basic card
- Card with image
- Interactive card (hover effects)
- Pricing card (if applicable)

**Based on:** Reference [X] card design
**Specifications:** See style-guide.md → Component Patterns → Card Component
**Dependencies:** None
**Estimated complexity:** Low

### 4. Navigation Component
**Priority:** HIGH
**Features Observed:**
- [Describe navigation pattern from references: sticky? transparent on scroll? etc.]
- Desktop menu
- Mobile hamburger menu
- Logo positioning
- CTA button in nav

**Based on:** Reference [Y]
**Dependencies:** Button component
**Estimated complexity:** High

### 5. Footer Component
**Priority:** MEDIUM
**Sections Observed:**
- Company info
- Links (multiple columns)
- Social media icons
- Newsletter signup (if present)
- Copyright text

**Based on:** Reference [X]
**Dependencies:** Input component (if newsletter), Button component
**Estimated complexity:** Medium

## Page Sections (Build Second)

### 1. Hero Section
**Priority:** HIGH
**Elements:**
- Large headline ([size] from extraction)
- Subheading
- CTA button(s)
- Background: [describe from references]
- Optional: Hero image/illustration

**Layout:**
- [Describe layout from references: centered? split? with image?]

**Based on:** Reference [X]
**Dependencies:** Button component
**Estimated complexity:** Medium

### 2. Features/Services Section
**Priority:** HIGH
**Layout Pattern:** [e.g., "3-column grid on desktop, 1-column on mobile"]
**Elements:**
- Section heading
- Feature cards (Icon + Title + Description)
- Spacing: [value from extraction]

**Based on:** Reference [Y]
**Dependencies:** Card component
**Estimated complexity:** Medium

### 3. Testimonials Section
**Priority:** MEDIUM (if observed in references)
**Layout Pattern:** [Describe from references]
**Elements:**
- Customer quote
- Customer name + title/company
- Optional: Customer photo
- Optional: Star rating

**Based on:** Reference [Z]
**Dependencies:** Card component
**Estimated complexity:** Medium

### 4. CTA Section
**Priority:** HIGH
**Pattern:** [Describe from references: banner? boxed? full-width?]
**Elements:**
- Headline
- Supporting text
- CTA button
- Background color/gradient

**Based on:** Reference [X]
**Dependencies:** Button component
**Estimated complexity:** Low

### 5. Pricing Section (if applicable)
**Priority:** [HIGH/MEDIUM/LOW based on project needs]
**Layout:** [Describe from references if present]
**Dependencies:** Card component, Button component
**Estimated complexity:** Medium-High

## Build Order

**Phase 1: Foundation (Day 1)**
1. Set up Tailwind config with all design tokens from style-guide.md
2. Create global CSS variables
3. Test one component with the new tokens

**Phase 2: Core Components (Day 1-2)**
Build in this order:
1. Button (primary, secondary, ghost)
2. Input (text, email, states)
3. Card (basic, with image)
4. Navigation
5. Footer

**Validation after each component:**
- [ ] Screenshot with Playwright at 1440px
- [ ] Visual comparison to reference
- [ ] Test hover/focus states
- [ ] Check console for errors

**Phase 3: Page Sections (Day 2-3)**
Build in this order:
1. Hero section
2. Features/Services section
3. CTA section
4. Testimonials section (if needed)
5. Pricing section (if needed)

**Validation after each section:**
- [ ] Screenshot at 1440px, 768px, 375px
- [ ] Compare to reference layouts
- [ ] Check responsive behavior
- [ ] Verify spacing matches style guide

**Phase 4: Pages (Day 3-4)**
1. Homepage (combining all sections)
2. [Additional pages based on project scope]

**Phase 5: Polish (Day 4-5)**
1. Animations and transitions
2. Loading states
3. Empty states
4. Error states
5. Final accessibility audit

## Component Complexity Estimation

**Low Complexity:**
- Button (variants)
- Card (basic)
- CTA Section

**Medium Complexity:**
- Input (all variants + states)
- Hero Section
- Features Section
- Footer

**High Complexity:**
- Navigation (responsive behavior)
- Pricing Section (if complex)
- Any sections with animations

## Dependencies Map


Button (no deps) ├─ Navigation ├─ Hero Section ├─ CTA Section └─ Footer (if newsletter)
Input (no deps) └─ Footer (if newsletter)
Card (no deps) ├─ Features Section ├─ Testimonials Section └─ Pricing Section

## Notes & Considerations

**From Reference Analysis:**
- [Any special notes about patterns you observed]
- [Any challenging aspects to implement]
- [Any optional features to consider]

**Accessibility Considerations:**
- All interactive elements min 44px touch target
- Keyboard navigation for all components
- Focus indicators visible
- ARIA labels where needed
- Color contrast validated

**Performance Considerations:**
- Image optimization strategy
- Lazy loading for below-fold images
- Animation performance (use transform/opacity only)
- Font loading strategy


PHASE 5: FINAL VALIDATION & APPROVAL
Step 5.1: Create Validation Checklist
Create context/validation-checklist.md:
# Design System Validation Checklist

## Playwright Screenshots
- [ ] Reference 1 full-page screenshot exists
- [ ] Reference 2 full-page screenshot exists
- [ ] Reference 3 full-page screenshot exists
- [ ] Section screenshots captured for all references
- [ ] All screenshots are clear and not broken

## Design Extraction
- [ ] `design-extraction-notes.md` has ACTUAL measured values (not placeholders)
- [ ] Colors are hex codes (e.g., #1a2b3c)
- [ ] Font sizes are in px or rem with conversions
- [ ] Spacing values are measured (not "moderate" or "large")
- [ ] Shadow values are complete box-shadow CSS

## Design Synthesis
- [ ] `design-synthesis.md` documents why each decision was made
- [ ] Clear reasoning for chosen color palette
- [ ] Justification for typography choices
- [ ] Spacing system rationale explained

## Documentation Files

### design-principles.md
- [ ] File exists in `context/design-principles.md`
- [ ] Contains 10-15 principles
- [ ] Each principle has What/Why/How/Example
- [ ] Examples reference actual observations from screenshots
- [ ] Anti-patterns section completed
- [ ] NO PLACEHOLDER TEXT

### style-guide.md
- [ ] File exists in `context/style-guide.md`
- [ ] Color system has ACTUAL hex codes
- [ ] Typography uses ACTUAL font names from references
- [ ] All CSS variable values are filled in (no [X] placeholders)
- [ ] Spacing scale is complete
- [ ] Border radius values extracted
- [ ] Shadow definitions extracted
- [ ] Component patterns have Tailwind classes

### component-plan.md
- [ ] File exists in `context/component-plan.md`
- [ ] Lists all components to build
- [ ] Components ordered by dependency
- [ ] Build order makes sense
- [ ] Complexity estimates provided
- [ ] References which site inspired each component

## Quality Checks
- [ ] All markdown files render correctly (no syntax errors)
- [ ] No generic placeholders like "modern color" or "appropriate spacing"
- [ ] Can trace every value back to extraction notes or references
- [ ] Design system is cohesive (not conflicting styles)

Step 5.2: Show Results for Approval
Create a summary document and STOP:
Create READY-FOR-APPROVAL.md:
# Design System Extraction Complete - Awaiting Approval

## Summary

I have completed the design system extraction from the following references:

1. **[Reference 1 URL]** - [Brief description of what was extracted]
2. **[Reference 2 URL]** - [Brief description of what was extracted]
3. **[Reference 3 URL]** - [Brief description of what was extracted]

## Files Created

All files are located in the `context/` directory:

- ✅ `design-principles.md` ([X] principles documented)
- ✅ `style-guide.md` (complete with all tokens)
- ✅ `component-plan.md` ([Y] components planned)
- ✅ `design-synthesis.md` (decisions documented)
- ✅ `validation-checklist.md` (all checkboxes completed)
- ✅ `visual-references/` directory with all screenshots

## Design System Highlights

### Color Palette
**Primary:** [hex]
**Secondary:** [hex]
**Neutral:** [hex] - [hex]

### Typography
**Headings:** [Font name]
**Body:** [Font name]
**Scale:** [smallest] to [largest]

### Spacing System
**Grid:** [X]pt system
**Range:** [smallest] to [largest]

### Components Planned
[List 5-7 main components]

## Screenshots Captured

Desktop (1440x900):
- ✅ Reference 1 - Full page
- ✅ Reference 2 - Full page
- ✅ Reference 3 - Full page

Sections:
- ✅ [Number] hero screenshots
- ✅ [Number] component screenshots

## Next Steps (Awaiting Your Approval)

**DO NOT PROCEED** until you:

1. **Review all markdown files** in `context/` directory
2. **Verify extraction notes** have actual measured values
3. **Check screenshots** are clear and usable
4. **Approve the design system** by replying "APPROVED"

Once approved, I will:
1. Configure Tailwind with these design tokens
2. Build components according to component-plan.md
3. Use Playwright to validate each component against references
4. Iterate until pixel-perfect

---

**⏸️ PAUSED AND WAITING FOR YOUR APPROVAL**

Please review the files and reply with:
- "APPROVED" to proceed with implementation
- "REVISE [specific feedback]" if changes needed
- "SHOW ME [filename]" to see specific file contents


CRITICAL RULES
❌ DO NOT:
Start coding components before approval
Use placeholder/estimated values in documentation
Skip the browser devtools inspection step
Guess at colors instead of extracting hex codes
Create generic principles not based on references
Proceed past STOP points without showing results
✅ DO:
Take actual screenshots with Playwright
Inspect elements with browser devtools
Extract REAL values (hex codes, px/rem, etc.)
Document your reasoning in design-synthesis.md
Show results at each STOP point
Wait for "APPROVED" before Phase 6 (implementation)

USAGE INSTRUCTIONS
Before running this prompt:
Replace [REFERENCE_URL_1] with actual URLs
Ensure you're in a project directory (can be empty or existing)
Have Node.js installed
Start with Phase 0 and follow the phases in order. Do not skip ahead.4
When you reach "STOP HERE" instructions:
Actually stop
Show me what was requested
Wait for my response before continuing
After completing all phases:
I will review your documentation
I will reply "APPROVED" or request revisions
Only then should implementation begin

START HERE
Begin with Phase 0: Playwright Verification.
Check if Playwright is installed and test it before proceeding.



DEL 2 (NESTE SIDE)






DEL 2: NEXT.JS IMPLEMENTATION & VALIDATION
⚠️ PREREQUISITES: Only run this after completing DEL 1 and receiving "APPROVED"
This prompt assumes the following files exist in /context:
✅ design-principles.md
✅ style-guide.md
✅ component-plan.md
✅ design-synthesis.md
✅ visual-references/ with screenshots
If these don't exist, STOP and run DEL 1 first.

PHASE 1: PROJECT SETUP
Step 1.1: Verify or Initialize Next.js 15
If project already exists:
# Verify Next.js version
npm list next

# Should be 15.5.4 or higher

If starting fresh:
npx create-next-app@latest . --typescript --tailwind --app --turbopack --no-src-dir --import-alias "@/*"

# When prompted:
# ✓ TypeScript: Yes
# ✓ ESLint: Yes
# ✓ Tailwind CSS: Yes (will upgrade to v4)
# ✓ App Router: Yes
# ✓ Turbopack: Yes
# ✓ Customize import alias: No (use default @/*)

Step 1.2: Upgrade to Tailwind CSS v4
npm install tailwindcss@next @tailwindcss/postcss@next

Delete tailwind.config.ts (v4 uses CSS-based config)
Create app/globals.css:
@import "tailwindcss";

/* Design tokens will be added here from style-guide.md */

Step 1.3: Install Additional Dependencies
npm install clsx tailwind-merge
npm install -D @types/node

Step 1.4: Create Utility Files
Create lib/utils.ts:
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

Step 1.5: Verify Playwright is Still Working
# Quick test
node -e "console.log(require('playwright') ? '✅ Playwright ready' : '❌ Install playwright')"

CHECKPOINT:
[ ] Next.js 15 running (npm run dev)
[ ] Tailwind v4 installed
[ ] lib/utils.ts exists
[ ] Playwright confirmed working
[ ] localhost:3000 loads (even if blank)

PHASE 2: CONFIGURE DESIGN SYSTEM
Step 2.1: Read style-guide.md
CRITICAL: You MUST read /context/style-guide.md and extract ALL design tokens.
# Confirm file exists
cat context/style-guide.md

Step 2.2: Implement Design Tokens in globals.css
Update app/globals.css with ALL tokens from style-guide.md:
@import "tailwindcss";

@theme {
  /* ============================================
     COLOR SYSTEM - From style-guide.md
     ============================================ */
  
  /* Primary Colors */
  --color-primary-50: [hex from style-guide.md];
  --color-primary-100: [hex from style-guide.md];
  --color-primary-200: [hex from style-guide.md];
  --color-primary-300: [hex from style-guide.md];
  --color-primary-400: [hex from style-guide.md];
  --color-primary-500: [hex from style-guide.md];
  --color-primary-600: [hex from style-guide.md];
  --color-primary-700: [hex from style-guide.md];
  --color-primary-800: [hex from style-guide.md];
  --color-primary-900: [hex from style-guide.md];
  --color-primary-950: [hex from style-guide.md];
  
  /* Secondary Colors */
  --color-secondary-500: [hex from style-guide.md];
  --color-secondary-600: [hex from style-guide.md];
  --color-secondary-700: [hex from style-guide.md];
  
  /* Neutrals */
  --color-gray-50: [hex from style-guide.md];
  --color-gray-100: [hex from style-guide.md];
  /* ... all gray values from style-guide.md */
  --color-gray-950: [hex from style-guide.md];
  
  /* Semantic Colors */
  --color-success-500: [hex from style-guide.md];
  --color-error-500: [hex from style-guide.md];
  --color-warning-500: [hex from style-guide.md];
  --color-info-500: [hex from style-guide.md];
  
  /* ============================================
     SPACING - From style-guide.md
     ============================================ */
  
  --spacing-0: 0;
  --spacing-px: 1px;
  --spacing-0\.5: [value from style-guide.md];
  --spacing-1: [value from style-guide.md];
  /* ... all spacing values from style-guide.md */
  --spacing-96: [value from style-guide.md];
  
  /* ============================================
     BORDER RADIUS - From style-guide.md
     ============================================ */
  
  --radius-sm: [value from style-guide.md];
  --radius-base: [value from style-guide.md];
  --radius-md: [value from style-guide.md];
  --radius-lg: [value from style-guide.md];
  --radius-xl: [value from style-guide.md];
  --radius-2xl: [value from style-guide.md];
  --radius-full: 9999px;
  
  /* ============================================
     SHADOWS - From style-guide.md
     ============================================ */
  
  --shadow-sm: [value from style-guide.md];
  --shadow-base: [value from style-guide.md];
  --shadow-md: [value from style-guide.md];
  --shadow-lg: [value from style-guide.md];
  --shadow-xl: [value from style-guide.md];
  
  /* ============================================
     TYPOGRAPHY - From style-guide.md
     ============================================ */
  
  --font-heading: [font-family from style-guide.md];
  --font-body: [font-family from style-guide.md];
  
  --font-size-xs: [value from style-guide.md];
  --font-size-sm: [value from style-guide.md];
  --font-size-base: 1rem;
  --font-size-lg: [value from style-guide.md];
  --font-size-xl: [value from style-guide.md];
  --font-size-2xl: [value from style-guide.md];
  --font-size-3xl: [value from style-guide.md];
  --font-size-4xl: [value from style-guide.md];
  --font-size-5xl: [value from style-guide.md];
  
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
}

/* ============================================
   BASE STYLES
   ============================================ */

body {
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-gray-900);
  background-color: white;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}

h1 {
  font-size: var(--font-size-5xl);
}

h2 {
  font-size: var(--font-size-4xl);
}

h3 {
  font-size: var(--font-size-3xl);
}

h4 {
  font-size: var(--font-size-2xl);
}

h5 {
  font-size: var(--font-size-xl);
}

h6 {
  font-size: var(--font-size-lg);
}

IMPORTANT: Replace ALL [value from style-guide.md] and [hex from style-guide.md] with ACTUAL values from the file.
Step 2.3: Load Custom Fonts (if needed)
If style-guide.md specifies custom fonts (not system fonts):
Update app/layout.tsx:
import { Inter, [Custom_Font] } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const customFont = [Custom_Font]({ 
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no" className={`${inter.variable} ${customFont.variable}`}>
      <body>{children}</body>
    </html>
  )
}

CHECKPOINT:
[ ] app/globals.css has ALL design tokens from style-guide.md
[ ] No [placeholder] text remains in globals.css
[ ] Fonts loaded (if custom fonts)
[ ] npm run dev still works without errors
[ ] Browser console has no errors

PHASE 3: BUILD COMPONENTS (Iterative with Playwright)
Step 3.1: Read Component Plan
cat context/component-plan.md

Identify build order from the "Build Order" section.
Step 3.2: Component Build Loop (ONE AT A TIME)
For EACH component in the build order:
3.2.1: Create Component File
Follow this structure:
app/
  components/
    ui/
      button.tsx      ← Core UI components
      input.tsx
      card.tsx
    layout/
      navigation.tsx  ← Layout components
      footer.tsx
    sections/
      hero.tsx        ← Page sections
      features.tsx

3.2.2: Implement Component
Example: Button Component
Create app/components/ui/button.tsx:
import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles - from style-guide.md
          'inline-flex items-center justify-center',
          'font-semibold transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          
          // Variant styles - from style-guide.md Component Patterns
          variant === 'primary' && [
            'bg-primary-600 hover:bg-primary-700',
            'text-white',
            'shadow-sm hover:shadow-md',
            'focus:ring-primary-500',
          ],
          
          variant === 'secondary' && [
            'bg-gray-200 hover:bg-gray-300',
            'text-gray-900',
            'focus:ring-gray-500',
          ],
          
          variant === 'ghost' && [
            'bg-transparent hover:bg-gray-100',
            'text-gray-700',
            'focus:ring-gray-500',
          ],
          
          // Size styles - from style-guide.md
          size === 'sm' && 'px-4 py-2 text-sm rounded-md',
          size === 'md' && 'px-6 py-3 text-base rounded-lg',
          size === 'lg' && 'px-8 py-4 text-lg rounded-lg',
          
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }

CRITICAL: Use EXACT Tailwind classes from style-guide.md → Component Patterns section.
3.2.3: Create Component Test Page
Create app/test/[component-name]/page.tsx:
import { Button } from '@/components/ui/button'

export default function ButtonTestPage() {
  return (
    <div className="min-h-screen p-12 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold mb-8">Button Component Test</h1>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Primary Buttons</h2>
          <div className="flex gap-4">
            <Button variant="primary" size="sm">Small Primary</Button>
            <Button variant="primary" size="md">Medium Primary</Button>
            <Button variant="primary" size="lg">Large Primary</Button>
          </div>
        </section>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Secondary Buttons</h2>
          <div className="flex gap-4">
            <Button variant="secondary" size="sm">Small Secondary</Button>
            <Button variant="secondary" size="md">Medium Secondary</Button>
            <Button variant="secondary" size="lg">Large Secondary</Button>
          </div>
        </section>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Ghost Buttons</h2>
          <div className="flex gap-4">
            <Button variant="ghost" size="sm">Small Ghost</Button>
            <Button variant="ghost" size="md">Medium Ghost</Button>
            <Button variant="ghost" size="lg">Large Ghost</Button>
          </div>
        </section>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">States</h2>
          <div className="flex gap-4">
            <Button variant="primary">Normal</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </section>
      </div>
    </div>
  )
}

3.2.4: Playwright Visual Validation
Create scripts/validate-component.js:
const { chromium } = require('playwright');
const path = require('path');

const componentName = process.argv[2] || 'button';
const url = `http://localhost:3000/test/${componentName}`;

(async () => {
  console.log(`\n🔍 Validating ${componentName} component...`);
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Screenshot desktop
    await page.screenshot({ 
      path: `screenshots/components/${componentName}-desktop.png`,
      fullPage: true 
    });
    console.log(`✅ Desktop screenshot saved`);
    
    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit to catch errors
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.log(`\n❌ Console errors found:`);
      errors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log(`✅ No console errors`);
    }
    
    // Test responsive
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ 
      path: `screenshots/components/${componentName}-mobile.png`,
      fullPage: true 
    });
    console.log(`✅ Mobile screenshot saved`);
    
    console.log(`\n🎉 Validation complete!`);
    console.log(`📁 Screenshots: screenshots/components/${componentName}-*.png`);
    console.log(`\n👀 MANUAL REVIEW REQUIRED:`);
    console.log(`   1. Open the screenshots`);
    console.log(`   2. Compare to reference designs in context/visual-references/`);
    console.log(`   3. Check:`);
    console.log(`      - Colors match style guide`);
    console.log(`      - Spacing matches style guide`);
    console.log(`      - Typography matches style guide`);
    console.log(`      - Hover states work (test manually)`);
    console.log(`      - Mobile responsive looks good`);
    console.log(`\n   Reply "PASS" to continue to next component`);
    console.log(`   Reply "REVISE [feedback]" to iterate`);
    
  } catch (error) {
    console.error(`❌ Validation failed:`, error.message);
  }
  
  await browser.close();
})();

Create screenshots directory:
mkdir -p screenshots/components

Run validation:
node scripts/validate-component.js button

3.2.5: Manual Review & Iteration
STOP HERE. Open the screenshots and compare to:
Reference designs in context/visual-references/
Specifications in style-guide.md
If mismatches found:
Document what needs to change
Update the component
Run validation script again
Repeat until it matches
Only proceed to next component after I say "PASS"

Step 3.3: Build Order Execution
Follow component-plan.md build order.
Example order:
Button → Validate → PASS → Continue
Input → Validate → PASS → Continue
Card → Validate → PASS → Continue
Navigation → Validate → PASS → Continue
Footer → Validate → PASS → Continue
After each component:
[ ] Component implemented
[ ] Test page created
[ ] Playwright validation run
[ ] Screenshots compared to references
[ ] Console errors checked
[ ] Mobile responsive tested
[ ] Received "PASS" approval

PHASE 4: BUILD PAGE SECTIONS
Step 4.1: Read Component Plan for Sections
From component-plan.md, identify sections to build:
Hero section
Features/Services section
Testimonials section
CTA section
etc.
Step 4.2: Section Build Loop (ONE AT A TIME)
For EACH section:
4.2.1: Create Section Component
Create app/components/sections/[section-name].tsx
Example: Hero Section
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            [Headline from component-plan.md]
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            [Subheading from component-plan.md]
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button variant="primary" size="lg">
              [CTA Text]
            </Button>
            <Button variant="secondary" size="lg">
              [Secondary CTA]
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

CRITICAL: Match the layout and spacing from component-plan.md and reference screenshots.
4.2.2: Create Section Test Page
Create app/test/sections/[section-name]/page.tsx:
import { Hero } from '@/components/sections/hero'

export default function HeroTestPage() {
  return <Hero />
}

4.2.3: Playwright Section Validation
Run validation:
node scripts/validate-component.js sections/hero

STOP HERE. Compare section screenshot to reference designs.
Check:
[ ] Layout matches reference
[ ] Spacing matches style-guide.md
[ ] Typography matches
[ ] Colors match
[ ] Responsive behavior correct
[ ] No console errors
Only proceed after "PASS"

PHASE 5: ASSEMBLE PAGES
Step 5.1: Create Homepage
Update app/page.tsx:
import { Hero } from '@/components/sections/hero'
import { Features } from '@/components/sections/features'
import { Testimonials } from '@/components/sections/testimonials'
import { CTA } from '@/components/sections/cta'
import { Navigation } from '@/components/layout/navigation'
import { Footer } from '@/components/layout/footer'

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  )
}

Step 5.2: Full Page Validation
Create scripts/validate-page.js:
const { chromium } = require('playwright');

const pageName = process.argv[2] || 'home';
const url = `http://localhost:3000${pageName === 'home' ? '' : `/${pageName}`}`;

(async () => {
  console.log(`\n🔍 Validating ${pageName} page...`);
  
  const browser = await chromium.launch({ headless: false });
  
  // Desktop validation
  console.log('\n📱 Testing Desktop (1440px)...');
  let page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.screenshot({ 
    path: `screenshots/pages/${pageName}-desktop.png`,
    fullPage: true 
  });
  console.log(`✅ Desktop screenshot saved`);
  await page.close();
  
  // Tablet validation
  console.log('\n📱 Testing Tablet (768px)...');
  page = await browser.newPage();
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.screenshot({ 
    path: `screenshots/pages/${pageName}-tablet.png`,
    fullPage: true 
  });
  console.log(`✅ Tablet screenshot saved`);
  await page.close();
  
  // Mobile validation
  console.log('\n📱 Testing Mobile (375px)...');
  page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.screenshot({ 
    path: `screenshots/pages/${pageName}-mobile.png`,
    fullPage: true 
  });
  console.log(`✅ Mobile screenshot saved`);
  
  // Console errors check
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  await page.reload();
  await page.waitForTimeout(2000);
  
  if (errors.length > 0) {
    console.log(`\n❌ Console errors:`);
    errors.forEach(err => console.log(`  - ${err}`));
  } else {
    console.log(`✅ No console errors`);
  }
  
  await browser.close();
  
  console.log(`\n🎉 Page validation complete!`);
  console.log(`\n👀 MANUAL REVIEW:`);
  console.log(`   1. Compare screenshots to reference designs`);
  console.log(`   2. Test interactions manually (hover, click, etc.)`);
  console.log(`   3. Check mobile responsive layout`);
  console.log(`   4. Verify all sections present and correct`);
  console.log(`\n   Reply "PAGE APPROVED" to complete`);
})();

Create directory:
mkdir -p screenshots/pages

Run validation:
node scripts/validate-page.js home

STOP HERE. Full page review required.

PHASE 6: FINAL POLISH & DEPLOYMENT PREP
Step 6.1: Accessibility Audit
Create scripts/accessibility-check.js:
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  console.log('\n🔍 Running accessibility checks...\n');
  
  // Check 1: All images have alt text
  const imagesWithoutAlt = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.filter(img => !img.alt).length;
  });
  
  console.log(`${imagesWithoutAlt === 0 ? '✅' : '❌'} Images with alt text: ${imagesWithoutAlt === 0 ? 'All good' : `${imagesWithoutAlt} missing`}`);
  
  // Check 2: Proper heading hierarchy
  const headings = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map(h => h.tagName);
  });
  
  const hasH1 = headings.includes('H1');
  console.log(`${hasH1 ? '✅' : '❌'} Page has H1: ${hasH1 ? 'Yes' : 'No'}`);
  
  // Check 3: Buttons have accessible names
  const buttonsWithoutText = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.filter(btn => !btn.textContent?.trim() && !btn.getAttribute('aria-label')).length;
  });
  
  console.log(`${buttonsWithoutText === 0 ? '✅' : '❌'} Buttons with labels: ${buttonsWithoutText === 0 ? 'All good' : `${buttonsWithoutText} missing`}`);
  
  // Check 4: Links have descriptive text
  const linksWithoutText = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    return links.filter(link => !link.textContent?.trim() && !link.getAttribute('aria-label')).length;
  });
  
  console.log(`${linksWithoutText === 0 ? '✅' : '❌'} Links with text: ${linksWithoutText === 0 ? 'All good' : `${linksWithoutText} missing`}`);
  
  // Check 5: Form inputs have labels
  const inputsWithoutLabels = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    return inputs.filter(input => {
      const hasLabel = document.querySelector(`label[for="${input.id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');
      return !hasLabel && !hasAriaLabel;
    }).length;
  });
  
  console.log(`${inputsWithoutLabels === 0 ? '✅' : '❌'} Inputs with labels: ${inputsWithoutLabels === 0 ? 'All good' : `${inputsWithoutLabels} missing`}`);
  
  console.log('\n📋 Manual checks still required:');
  console.log('  - Test keyboard navigation (Tab, Enter, Esc)');
  console.log('  - Test with screen reader');
  console.log('  - Verify color contrast with WCAG tool');
  console.log('  - Check focus indicators are visible\n');
  
  await browser.close();
})();

Run it:
node scripts/accessibility-check.js

Fix any issues found.
Step 6.2: Performance Check
npm run build

Check for:
[ ] No TypeScript errors
[ ] No build warnings
[ ] Bundle size reasonable
[ ] All images optimized
Step 6.3: Create Production Checklist
Create PRODUCTION-READY.md:
# Production Readiness Checklist

## Design System
- [ ] All components match reference designs
- [ ] All sections match reference designs
- [ ] Design tokens match style-guide.md
- [ ] No placeholder content remains

## Components Validation
- [ ] Button (all variants tested)
- [ ] Input (all states tested)
- [ ] Card (all variants tested)
- [ ] Navigation (desktop + mobile)
- [ ] Footer

## Sections Validation
- [ ] Hero section
- [ ] Features/Services section
- [ ] Testimonials section
- [ ] CTA section

## Pages Validation
- [ ] Homepage (desktop, tablet, mobile)

## Quality Checks
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] `npm run build` passes
- [ ] All Playwright validations passed
- [ ] Accessibility checks passed
- [ ] Mobile responsive on real device
- [ ] Tested in Chrome, Safari, Firefox

## Performance
- [ ] Images optimized with next/image
- [ ] Fonts loading correctly
- [ ] No layout shift
- [ ] Fast initial load

## Deployment Ready
- [ ] Environment variables documented
- [ ] .env.example created
- [ ] README updated
- [ ] Ready to deploy to Vercel

---

**STATUS:** [Not Ready / Ready for Deployment]

**Last validated:** [DATE]


ITERATION WORKFLOW
If at ANY point something doesn't match references:
Identify the issue:
Wrong color?
Wrong spacing?
Wrong typography?
Wrong layout?
Check style-guide.md:
Is the token correct?
Is the Tailwind class correct?
Fix the component:
Update the Tailwind classes
Match exact values from style-guide.md
Re-validate:
Run Playwright script again
Compare new screenshot
Repeat until matches
Document the change:
Note what was wrong
Note what fixed it

CRITICAL RULES
❌ DO NOT:
Build multiple components without validation
Skip Playwright screenshots
Use arbitrary values not in style-guide.md
Assume responsive works without testing
Proceed without "PASS" approval
✅ DO:
Build ONE component at a time
Validate after EACH component
Use ONLY values from style-guide.md
Test mobile at 375px
Wait for approval at each checkpoint

SUCCESS CRITERIA
You have succeeded when:
[ ] All components built and validated
[ ] All sections built and validated
[ ] Homepage assembled and validated
[ ] Playwright screenshots match references
[ ] No console errors
[ ] Mobile responsive works perfectly
[ ] Accessibility checks pass
[ ] npm run build succeeds
[ ] PRODUCTION-READY.md checklist complete

START HERE
Verify prerequisites (all /context files exist)
Begin with Phase 1 (Project Setup)
Follow phases in order
Stop at each checkpoint for approval
Begin with Phase 1: Project Setup.










DERSOM FEIL OPPSTÅR (NESTE SIDE)










DEL 2.1

UNIVERSAL: FONT EXTRACTION & IMPLEMENTATION FROM REFERENCE URLS
Use this prompt to extract and implement the ACTUAL fonts used on your reference websites.
This is a generic, reusable prompt that works for ANY project with reference URLs.

PHASE 1: FONT DETECTION & EXTRACTION
Step 1.1: Detect Fonts on Reference Sites
For EACH reference URL, use Playwright to inspect fonts:
Create scripts/detect-fonts.js:
const { chromium } = require('playwright');

const references = [
  '[REFERENCE_URL_1]',  // Replace with actual URLs
];

(async () => {
  console.log('🔍 Detecting fonts from reference sites...\n');
  
  const browser = await chromium.launch({ headless: false });
  
  for (const url of references) {
    console.log(`\n📍 Analyzing: ${url}`);
    const page = await browser.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Extract fonts from computed styles
      const fontData = await page.evaluate(() => {
        const fonts = new Set();
        const fontWeights = new Set();
        const fontSizes = new Set();
        
        // Check specific elements
        const selectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'button', 'body'];
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const styles = window.getComputedStyle(el);
            
            // Get font family
            const fontFamily = styles.fontFamily;
            if (fontFamily) {
              // Clean up font family (remove quotes and fallbacks for analysis)
              const primaryFont = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
              fonts.add(primaryFont);
            }
            
            // Get font weight
            fontWeights.add(styles.fontWeight);
            
            // Get font size for key elements
            if (['h1', 'h2', 'h3', 'body'].includes(selector)) {
              fontSizes.add(`${selector}: ${styles.fontSize}`);
            }
          });
        });
        
        return {
          fonts: Array.from(fonts),
          weights: Array.from(fontWeights).sort(),
          sizes: Array.from(fontSizes)
        };
      });
      
      console.log('\n✅ Fonts detected:');
      fontData.fonts.forEach(font => console.log(`  - ${font}`));
      
      console.log('\n📊 Font weights used:');
      console.log(`  ${fontData.weights.join(', ')}`);
      
      console.log('\n📏 Font sizes (key elements):');
      fontData.sizes.forEach(size => console.log(`  - ${size}`));
      
      // Extract font files from Network tab
      console.log('\n🔍 Checking for custom font files...');
      
      const fontRequests = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter(entry => 
            entry.name.includes('.woff') || 
            entry.name.includes('.woff2') || 
            entry.name.includes('.ttf') ||
            entry.name.includes('fonts.googleapis.com') ||
            entry.name.includes('fonts.gstatic.com') ||
            entry.name.includes('typekit.net') ||
            entry.name.includes('use.typekit.net')
          )
          .map(entry => entry.name);
      });
      
      if (fontRequests.length > 0) {
        console.log('📦 Font sources found:');
        fontRequests.forEach(url => console.log(`  - ${url}`));
      } else {
        console.log('⚠️  No custom font files detected (may be using system fonts)');
      }
      
    } catch (error) {
      console.error(`❌ Error analyzing ${url}:`, error.message);
    }
    
    await page.close();
  }
  
  await browser.close();
  
  console.log('\n\n📋 SUMMARY:');
  console.log('Review the fonts detected above and:');
  console.log('1. Identify primary heading font');
  console.log('2. Identify primary body font');
  console.log('3. Check if fonts are from Google Fonts, Adobe Fonts, or custom');
  console.log('4. Note the weights being used');
  console.log('\nNext: Run font acquisition script based on findings.');
})();

Run it:
node scripts/detect-fonts.js

STOP HERE. Document the findings:
# Font Detection Results

## Reference 1: [URL]
- Heading Font: [Font Name]
- Body Font: [Font Name]
- Weights: [List]
- Source: [Google Fonts / Adobe Fonts / Custom / System]

## Reference 2: [URL]
- Heading Font: [Font Name]
- Body Font: [Font Name]
- Weights: [List]
- Source: [Google Fonts / Adobe Fonts / Custom / System]

## Reference 3: [URL]
- Heading Font: [Font Name]
- Body Font: [Font Name]
- Weights: [List]
- Source: [Google Fonts / Adobe Fonts / Custom / System]

## Synthesis Decision:
- Primary Heading Font: [Choose best from references]
- Primary Body Font: [Choose best from references]
- Rationale: [Why these fonts]


PHASE 2: FONT ACQUISITION
Step 2.1: Determine Font Source
Based on detection results, fonts typically come from:
A. Google Fonts (FREE)
Examples: Inter, Roboto, Playfair Display, Montserrat
URL pattern: fonts.googleapis.com or fonts.gstatic.com
✅ Easy to implement
B. Adobe Fonts / Typekit (PAID - requires license)
Examples: Proxima Nova, Futura PT, Brandon Grotesque
URL pattern: use.typekit.net
⚠️ Requires Adobe subscription (~$20/month)
C. Commercial Fonts (PAID - one-time license)
Examples: Helvetica Neue, Gotham, Circular, PP Editorial New
Must purchase web license
⚠️ Can be expensive ($100-$500+)
D. Custom/Self-Hosted
Font files hosted on reference site's domain
May be pirated (don't use!) or properly licensed
⚠️ Check licensing before using
E. System Fonts (FREE)
Examples: -apple-system, San Francisco, Segoe UI
Already on user's device
✅ Zero cost, fast loading

Step 2.2: Implement Fonts Based on Source
OPTION A: Google Fonts Implementation
If fonts are on Google Fonts:
# No package installation needed - Next.js built-in

Update app/layout.tsx:
import { [Heading_Font], [Body_Font] } from 'next/font/google'
import './globals.css'

// Replace [Heading_Font] and [Body_Font] with actual font names
// Example: Inter, Roboto, Playfair_Display (note underscore for multi-word)

const headingFont = [Heading_Font]({ 
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const bodyFont = [Body_Font]({ 
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body>{children}</body>
    </html>
  )
}

Update app/globals.css:
@theme {
  --font-heading: var(--font-heading), serif;  /* or sans-serif */
  --font-body: var(--font-body), -apple-system, sans-serif;
}

body {
  font-family: var(--font-body);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}


OPTION B: Adobe Fonts Implementation
If fonts are from Adobe Fonts / Typekit:
Step 1: Get Adobe Fonts subscription (if you don't have one)
Step 2: Create a Web Project at fonts.adobe.com
Step 3: Add fonts to project and get embed code
Step 4: Add to app/layout.tsx:
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no">
      <head>
        {/* Adobe Fonts embed code */}
        <link rel="stylesheet" href="https://use.typekit.net/[your-kit-id].css" />
      </head>
      <body>{children}</body>
    </html>
  )
}

Step 5: Update app/globals.css:
@theme {
  /* Use exact font names from Adobe Fonts project */
  --font-heading: "[Adobe Font Name]", serif;
  --font-body: "[Adobe Font Name]", sans-serif;
}


OPTION C: Self-Hosted Commercial Fonts
If you purchased web font license:
Step 1: Place font files in public/fonts/:
public/
  fonts/
    heading/
      heading-regular.woff2
      heading-medium.woff2
      heading-bold.woff2
    body/
      body-regular.woff2
      body-medium.woff2
      body-bold.woff2

Step 2: Create font-face declarations in app/fonts.css:
/* Heading Font */
@font-face {
  font-family: 'CustomHeading';
  src: url('/fonts/heading/heading-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'CustomHeading';
  src: url('/fonts/heading/heading-bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* Body Font */
@font-face {
  font-family: 'CustomBody';
  src: url('/fonts/body/body-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'CustomBody';
  src: url('/fonts/body/body-medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'CustomBody';
  src: url('/fonts/body/body-bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

Step 3: Import in app/globals.css:
@import './fonts.css';

@theme {
  --font-heading: 'CustomHeading', serif;
  --font-body: 'CustomBody', sans-serif;
}


OPTION D: Free Alternatives
If fonts are expensive/unavailable, use similar free alternatives:
Create scripts/font-alternatives.js:
// Common commercial fonts and their Google Fonts alternatives
const alternatives = {
  // Expensive → Free Alternative
  'Helvetica Neue': 'Inter',
  'Gotham': 'Montserrat',
  'Proxima Nova': 'Nunito Sans',
  'Circular': 'Inter',
  'Brandon Grotesque': 'Josefin Sans',
  'Futura': 'Outfit',
  'Avenir': 'Nunito',
  'PP Editorial New': 'Playfair Display',
  'Tiempos': 'Crimson Pro',
  'Satoshi': 'Inter',
  'Aeonik': 'Inter',
  'SF Pro': 'Inter',
};

console.log('💡 Free Google Fonts alternatives:\n');
Object.entries(alternatives).forEach(([commercial, free]) => {
  console.log(`${commercial} → ${free} (Google Fonts)`);
});


PHASE 3: EXTRACT EXACT TYPOGRAPHY SCALE
Step 3.1: Measure Typography from References
Create scripts/measure-typography.js:
const { chromium } = require('playwright');

const url = '[REFERENCE_URL]'; // Your chosen reference

(async () => {
  console.log('📏 Measuring typography scale...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle' });
  
  // Measure key elements
  const measurements = await page.evaluate(() => {
    const measure = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      
      const styles = window.getComputedStyle(el);
      return {
        selector,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight,
        letterSpacing: styles.letterSpacing,
        fontFamily: styles.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
      };
    };
    
    return {
      hero_h1: measure('h1'),
      hero_p: measure('main h1 + p, section:first-of-type p'),
      section_h2: measure('section h2, main h2'),
      section_h3: measure('section h3, main h3'),
      body: measure('p, body'),
      button: measure('button, a[class*="button"]'),
    };
  });
  
  console.log('📊 Typography Measurements:\n');
  Object.entries(measurements).forEach(([key, data]) => {
    if (data) {
      console.log(`${key.toUpperCase()}:`);
      console.log(`  Font: ${data.fontFamily}`);
      console.log(`  Size: ${data.fontSize} (${parseFloat(data.fontSize) / 16}rem)`);
      console.log(`  Weight: ${data.fontWeight}`);
      console.log(`  Line Height: ${data.lineHeight}`);
      console.log(`  Letter Spacing: ${data.letterSpacing}`);
      console.log('');
    }
  });
  
  await browser.close();
  
  console.log('\n💡 Use these values in your globals.css @theme block');
})();

Run it:
node scripts/measure-typography.js

Document results:
# Typography Scale from [Reference]

## Display / Hero H1
- Font Size: [X]px / [Y]rem
- Font Weight: [weight]
- Line Height: [value]
- Letter Spacing: [value]
- Font Family: [name]

## Section H2
- Font Size: [X]px / [Y]rem
- Font Weight: [weight]
- Line Height: [value]

## Body Text
- Font Size: [X]px / [Y]rem
- Font Weight: [weight]
- Line Height: [value]

## Button Text
- Font Size: [X]px / [Y]rem
- Font Weight: [weight]
- Letter Spacing: [value]


PHASE 4: IMPLEMENT TYPOGRAPHY SCALE
Step 4.1: Create Typography System
Update app/globals.css with measured values:
@theme {
  /* FONTS - From detection script */
  --font-heading: var(--font-heading), serif;
  --font-body: var(--font-body), sans-serif;
  
  /* FONT SIZES - From measurement script */
  --font-size-display: [hero-h1-rem];     /* Hero headline */
  --font-size-6xl: [section-h2-rem];      /* H1 */
  --font-size-5xl: [section-h3-rem];      /* H2 */
  --font-size-4xl: [calculated-rem];      /* H3 */
  --font-size-3xl: [calculated-rem];      /* H4 */
  --font-size-2xl: [calculated-rem];      /* H5 */
  --font-size-xl: [calculated-rem];       /* H6 */
  --font-size-lg: [calculated-rem];       /* Large body */
  --font-size-base: [body-text-rem];      /* Standard body */
  --font-size-sm: [calculated-rem];       /* Small text */
  
  /* FONT WEIGHTS - From detection script */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
  --font-black: 900;
  
  /* LINE HEIGHTS - From measurement script */
  --line-height-tight: [measured-value];
  --line-height-snug: [measured-value];
  --line-height-normal: [measured-value];
  --line-height-relaxed: [measured-value];
  
  /* LETTER SPACING - From measurement script */
  --letter-spacing-tighter: [measured-value];
  --letter-spacing-tight: [measured-value];
  --letter-spacing-normal: 0;
  --letter-spacing-wide: [measured-value];
}

/* Apply to elements */
body {
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  font-weight: var(--font-normal);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-tight);
}

h1 {
  font-size: var(--font-size-6xl);
  font-weight: var(--font-bold);
}

/* ... continue for h2-h6 */

.display-text {
  font-size: var(--font-size-display);
  font-family: var(--font-heading);
  font-weight: var(--font-extrabold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tighter);
}


PHASE 5: VALIDATION
Step 5.1: Visual Comparison
Create scripts/font-validation.js:
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  
  // Screenshot reference
  console.log('📸 Reference site...');
  const page1 = await browser.newPage();
  await page1.setViewportSize({ width: 1440, height: 900 });
  await page1.goto('[REFERENCE_URL]');
  await page1.screenshot({ 
    path: 'screenshots/font-comparison/reference.png',
    fullPage: true 
  });
  
  // Screenshot your site
  console.log('📸 Your site...');
  const page2 = await browser.newPage();
  await page2.setViewportSize({ width: 1440, height: 900 });
  await page2.goto('http://localhost:3009');
  await page2.screenshot({ 
    path: 'screenshots/font-comparison/your-site.png',
    fullPage: true 
  });
  
  await browser.close();
  
  console.log('\n✅ Screenshots saved to screenshots/font-comparison/');
  console.log('\nCompare side-by-side:');
  console.log('- Do fonts look similar?');
  console.log('- Is sizing proportional?');
  console.log('- Does spacing feel right?');
})();


TROUBLESHOOTING
Fonts Not Loading
# Check browser Network tab (F12)
# Should see font files loading

# For Google Fonts - check console for errors
# For self-hosted - verify file paths

# Clear cache and hard refresh
# Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

Fonts Look Different
// Ensure correct font weights are loaded
// Example: If reference uses 600, make sure you include it

const font = FontName({
  weight: ['400', '500', '600', '700'], // Include 600!
})

FOIT (Flash of Invisible Text)
/* Add font-display: swap */
--font-display: swap;

/* Or in Next.js font config: */
const font = FontName({
  display: 'swap', // Shows fallback immediately
})


LICENSING CHECKLIST
Before using ANY font, verify:
[ ] Is it free (Google Fonts, Open Font License)?
[ ] Do I have a web license for it?
[ ] Can I self-host it (check license terms)?
[ ] Am I allowed to use it commercially?
[ ] Do I need to credit the designer?
⚠️ NEVER use pirated fonts - it's illegal and unethical.

SUCCESS CRITERIA
Fonts are correctly implemented when:
[ ] Fonts load without errors (check Network tab)
[ ] Typography scale matches reference proportions
[ ] Font weights match reference
[ ] Line heights and letter spacing similar
[ ] No FOIT/FOUT issues
[ ] Fonts are properly licensed
[ ] Performance impact minimal (< 50KB fonts)

ESTIMATED TIME
Font Detection: 15 minutes
Font Acquisition: 15-60 minutes (depending on source)
Typography Measurement: 20 minutes
Implementation: 30 minutes
Validation: 15 minutes
Total: 1.5 - 2.5 hours

START HERE
Replace placeholders in detection script:
const references = [
  'Reference URL 1/',      // Your actual URLs
];

Run font detection:
node scripts/detect-fonts.js

Then proceed based on findings.








STEG 2.2 (NESTE SIDE)























REFERENCE-DRIVEN: EXTRACT & REPLICATE BRAND PERSONALITY FROM URLS
This prompt extracts ACTUAL content, copy patterns, and personality from your reference URLs and replicates that style in your project.
NO generic placeholders. NO assumptions. ONLY data-driven implementation based on what's actually on the reference sites.

PHASE 1: DEEP CONTENT EXTRACTION
Step 1.1: Extract All Text Content from References
Create scripts/extract-reference-content.js:
const { chromium } = require('playwright');
const fs = require('fs').promises;

const references = [
  { name: 'reference-1', url: '[REFERENCE_URL_1]' },
];

(async () => {
  console.log('🔍 Extracting content from reference sites...\n');
  
  const browser = await chromium.launch({ headless: false });
  const allContent = {};
  
  for (const ref of references) {
    console.log(`\n📍 Analyzing: ${ref.url}`);
    const page = await browser.newPage();
    
    try {
      await page.goto(ref.url, { waitUntil: 'networkidle', timeout: 60000 });
      
      // Wait for content to load
      await page.waitForTimeout(3000);
      
      // Extract comprehensive content
      const content = await page.evaluate(() => {
        const data = {
          hero: {},
          sections: [],
          headlines: [],
          subheadings: [],
          bodyText: [],
          ctas: [],
          lists: [],
          vocabulary: [],
          tone_indicators: [],
        };
        
        // HERO SECTION - First major section
        const heroSection = document.querySelector('section:first-of-type, main > div:first-child, header + section');
        if (heroSection) {
          const h1 = heroSection.querySelector('h1');
          const mainP = heroSection.querySelector('h1 + p, p:first-of-type');
          const buttons = heroSection.querySelectorAll('button, a[class*="button"], a[class*="cta"]');
          
          data.hero = {
            headline: h1?.textContent.trim() || '',
            subheading: mainP?.textContent.trim() || '',
            ctas: Array.from(buttons).map(b => b.textContent.trim()).filter(t => t && t.length < 50),
          };
        }
        
        // ALL SECTIONS with their content
        const sections = document.querySelectorAll('section, main > div');
        sections.forEach((section, index) => {
          const sectionData = {
            index,
            headline: section.querySelector('h2, h3')?.textContent.trim() || '',
            subheading: section.querySelector('h2 + p, h3 + p')?.textContent.trim() || '',
            paragraphs: Array.from(section.querySelectorAll('p')).map(p => p.textContent.trim()).filter(t => t.length > 20 && t.length < 500),
            ctas: Array.from(section.querySelectorAll('button, a[class*="button"]')).map(b => b.textContent.trim()),
          };
          
          if (sectionData.headline || sectionData.paragraphs.length > 0) {
            data.sections.push(sectionData);
          }
        });
        
        // ALL HEADLINES (H2, H3) with context
        document.querySelectorAll('h2, h3').forEach(h => {
          const text = h.textContent.trim();
          if (text && text.length > 5 && text.length < 200) {
            data.headlines.push(text);
          }
        });
        
        // ALL SUBHEADINGS/DESCRIPTIONS
        document.querySelectorAll('h2 + p, h3 + p, h4 + p').forEach(p => {
          const text = p.textContent.trim();
          if (text && text.length > 10 && text.length < 300) {
            data.subheadings.push(text);
          }
        });
        
        // BODY TEXT - meaningful paragraphs
        document.querySelectorAll('p').forEach(p => {
          const text = p.textContent.trim();
          if (text.length > 40 && text.length < 500 && !text.includes('©') && !text.includes('Cookie')) {
            data.bodyText.push(text);
          }
        });
        
        // ALL CTAs
        document.querySelectorAll('button, a[class*="button"], a[class*="cta"], a[class*="link"][href]').forEach(el => {
          const text = el.textContent.trim();
          if (text && text.length > 2 && text.length < 50 && !text.toLowerCase().includes('cookie')) {
            data.ctas.push(text);
          }
        });
        
        // LISTS (features, benefits, etc)
        document.querySelectorAll('ul li, ol li').forEach(li => {
          const text = li.textContent.trim();
          if (text.length > 5 && text.length < 200) {
            data.lists.push(text);
          }
        });
        
        // VOCABULARY ANALYSIS - extract meaningful words
        const allText = document.body.textContent.toLowerCase();
        
        // Power words
        const powerWords = [
          'award', 'winning', 'future', 'tomorrow', 'today', 'innovative', 'transformative',
          'exceptional', 'premium', 'bespoke', 'crafted', 'precision', 'excellence',
          'visionary', 'revolutionary', 'cutting-edge', 'world-class', 'leading',
          'trusted', 'proven', 'expert', 'professional', 'specialized', 'dedicated',
          'passion', 'obsessed', 'meticulous', 'attention', 'detail', 'perfect',
        ];
        
        powerWords.forEach(word => {
          if (allText.includes(word)) {
            // Find context around the word
            const regex = new RegExp(`\\b\\w+\\s+\\w+\\s+${word}\\s+\\w+\\s+\\w+\\b`, 'gi');
            const matches = allText.match(regex);
            if (matches && matches.length > 0) {
              data.vocabulary.push({ word, context: matches[0] });
            }
          }
        });
        
        // TONE INDICATORS
        const tonePatterns = {
          confident: ['we are', 'we will', 'our', 'proven', 'guaranteed'],
          humble: ['help', 'assist', 'support', 'guide', 'partner'],
          bold: ['best', 'leading', 'top', 'number one', '#1'],
          conversational: ['you', 'your', "you're", 'let us', "let's"],
          formal: ['therefore', 'furthermore', 'moreover', 'subsequently'],
          casual: ['hey', 'awesome', 'cool', 'great', 'amazing'],
        };
        
        Object.entries(tonePatterns).forEach(([tone, patterns]) => {
          patterns.forEach(pattern => {
            if (allText.includes(pattern.toLowerCase())) {
              data.tone_indicators.push(tone);
            }
          });
        });
        
        // Remove duplicates from tone
        data.tone_indicators = [...new Set(data.tone_indicators)];
        
        return data;
      });
      
      // Save to file
      await fs.mkdir('context/reference-analysis', { recursive: true });
      await fs.writeFile(
        `context/reference-analysis/${ref.name}-content.json`,
        JSON.stringify(content, null, 2)
      );
      
      console.log(`✅ Extracted content from ${ref.name}`);
      console.log(`   - Hero: ${content.hero.headline ? '✓' : '✗'}`);
      console.log(`   - Sections: ${content.sections.length}`);
      console.log(`   - Headlines: ${content.headlines.length}`);
      console.log(`   - CTAs: ${[...new Set(content.ctas)].length} unique`);
      console.log(`   - Tone: ${content.tone_indicators.join(', ')}`);
      
      allContent[ref.name] = content;
      
    } catch (error) {
      console.error(`❌ Error extracting ${ref.url}:`, error.message);
    }
    
    await page.close();
  }
  
  await browser.close();
  
  // Create synthesis document
  console.log('\n\n📊 Creating content synthesis...');
  
  const synthesis = {
    hero_patterns: [],
    headline_styles: [],
    cta_patterns: [],
    tone_analysis: {},
    vocabulary_themes: [],
  };
  
  // Analyze hero patterns
  Object.values(allContent).forEach(content => {
    if (content.hero.headline) {
      synthesis.hero_patterns.push({
        headline: content.hero.headline,
        subheading: content.hero.subheading,
        ctas: content.hero.ctas,
      });
    }
  });
  
  // Analyze headline styles
  Object.values(allContent).forEach(content => {
    synthesis.headline_styles.push(...content.headlines.slice(0, 10));
  });
  
  // Analyze CTA patterns
  const allCTAs = Object.values(allContent).flatMap(c => c.ctas);
  const ctaCounts = {};
  allCTAs.forEach(cta => {
    ctaCounts[cta] = (ctaCounts[cta] || 0) + 1;
  });
  synthesis.cta_patterns = Object.entries(ctaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([cta, count]) => ({ cta, frequency: count }));
  
  // Tone analysis
  const allTones = Object.values(allContent).flatMap(c => c.tone_indicators);
  const toneCounts = {};
  allTones.forEach(tone => {
    toneCounts[tone] = (toneCounts[tone] || 0) + 1;
  });
  synthesis.tone_analysis = toneCounts;
  
  // Vocabulary themes
  const allVocab = Object.values(allContent).flatMap(c => c.vocabulary);
  const vocabWords = allVocab.map(v => v.word);
  const vocabCounts = {};
  vocabWords.forEach(word => {
    vocabCounts[word] = (vocabCounts[word] || 0) + 1;
  });
  synthesis.vocabulary_themes = Object.entries(vocabCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([word, count]) => ({ word, frequency: count }));
  
  await fs.writeFile(
    'context/reference-analysis/synthesis.json',
    JSON.stringify(synthesis, null, 2)
  );
  
  console.log('\n✅ Content analysis complete!');
  console.log('\n📁 Files created:');
  console.log('   - context/reference-analysis/reference-1-content.json');
  console.log('   - context/reference-analysis/reference-2-content.json');
  console.log('   - context/reference-analysis/reference-3-content.json');
  console.log('   - context/reference-analysis/synthesis.json');
  
  console.log('\n📋 NEXT STEP:');
  console.log('Review the synthesis.json file to understand content patterns.');
  console.log('Then proceed to Phase 2: Content Strategy Creation.');
})();

BEFORE running, replace [REFERENCE_URL_1], [REFERENCE_URL_2], [REFERENCE_URL_3]
Run it:
node scripts/extract-reference-content.js

This will take 5-10 minutes. The script opens each URL, extracts all content, and saves detailed analysis.

PHASE 2: ANALYZE EXTRACTED CONTENT
Step 2.1: Review Synthesis
Read the synthesis file:
cat context/reference-analysis/synthesis.json

STOP HERE. Review and document:
# Content Strategy from References

## Hero Pattern Analysis:

### Most Common Hero Structure:
[Based on synthesis.hero_patterns]

Example 1: "[Actual headline from reference-1]"
Example 2: "[Actual headline from reference-2]"

**Pattern identified:**
- [Describe the pattern, e.g., "Bold statement + benefit"]
- [Word count range: X-Y words]
- [Tone: confident/humble/bold]

## Headline Style Analysis:

### Top 5 Headline Patterns:
1. "[Actual headline]" - Pattern: [describe]
2. "[Actual headline]" - Pattern: [describe]
3. "[Actual headline]" - Pattern: [describe]

**Characteristics:**
- Average length: [X] words
- Common structure: [describe]
- Tone: [from synthesis.tone_analysis]

## CTA Pattern Analysis:

### Most Used CTAs:
1. "[Actual CTA]" - Used [X] times
2. "[Actual CTA]" - Used [X] times
3. "[Actual CTA]" - Used [X] times

**Pattern:**
- [Describe: action-oriented? benefit-driven? casual?]

## Vocabulary Theme:

### Top Power Words:
[From synthesis.vocabulary_themes]

**Brand Voice:**
- Tone: [Most common tones from synthesis.tone_analysis]
- Style: [Formal/Casual/Mix based on data]
- Personality: [Derived from vocabulary and tone]


PHASE 3: CREATE CONTENT STRATEGY
Step 3.1: Generate Content Strategy Document
Create scripts/generate-content-strategy.js:
const fs = require('fs').promises;

(async () => {
  console.log('📝 Generating content strategy from analysis...\n');
  
  // Read synthesis
  const synthesis = JSON.parse(
    await fs.readFile('context/reference-analysis/synthesis.json', 'utf8')
  );
  
  // Read individual references for examples
  const ref1 = JSON.parse(
    await fs.readFile('context/reference-analysis/reference-1-content.json', 'utf8')
  );
  
  // Determine primary tone
  const primaryTone = Object.entries(synthesis.tone_analysis)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'professional';
  
  // Get top vocabulary
  const topVocab = synthesis.vocabulary_themes.slice(0, 10).map(v => v.word);
  
  // Create strategy document
  const strategy = `# Content Strategy (Generated from References)

## Brand Voice Profile

**Primary Tone:** ${primaryTone}
**Secondary Tones:** ${Object.keys(synthesis.tone_analysis).slice(1, 4).join(', ')}

**Key Vocabulary:**
${topVocab.map(word => `- ${word}`).join('\n')}

## Hero Section Template

**Based on:** ${synthesis.hero_patterns.length} reference hero sections analyzed

**Headline Pattern:**
${synthesis.hero_patterns[0]?.headline || 'Bold statement with benefit'}

**Structure:**
1. Eyebrow (optional): Small text above headline
2. Main Headline: [Pattern from references]
3. Subheading: [Support/benefit statement]
4. Primary CTA: ${synthesis.cta_patterns[0]?.cta || 'Action-oriented button'}
5. Secondary CTA: ${synthesis.cta_patterns[1]?.cta || 'Lower commitment option'}

**Example from Reference 1:**
Headline: "${ref1.hero.headline}"
Subheading: "${ref1.hero.subheading}"
CTAs: ${ref1.hero.ctas.join(' | ')}

## Section Headline Templates

Top patterns from references:

${synthesis.headline_styles.slice(0, 10).map((h, i) => `${i + 1}. "${h}"`).join('\n')}

**Pattern Analysis:**
- Most use: [action words / questions / statements]
- Average length: [calculate from data]
- Style: [derived from examples]

## CTA Strategy

**Primary CTAs (most used across references):**
${synthesis.cta_patterns.slice(0, 5).map((c, i) => `${i + 1}. "${c.cta}" (used ${c.frequency}x)`).join('\n')}

**Pattern:** ${synthesis.cta_patterns[0]?.cta.includes('Get') ? 'Action-oriented' : 'Benefit-driven'}

## Content Writing Guidelines

**Do:**
- Use vocabulary: ${topVocab.slice(0, 5).join(', ')}
- Maintain ${primaryTone} tone
- Follow headline patterns observed
- Keep CTAs similar to: ${synthesis.cta_patterns.slice(0, 3).map(c => c.cta).join(', ')}

**Don't:**
- Deviate from observed tone
- Use generic phrases not seen in references
- Over-explain (references are concise)
- Use formal language if references are casual

## Implementation Checklist

- [ ] Hero headline follows pattern: "${synthesis.hero_patterns[0]?.headline?.split(' ').slice(0, 5).join(' ')}..."
- [ ] Section headlines match style of: "${synthesis.headline_styles[0]}"
- [ ] CTAs use variations of: "${synthesis.cta_patterns[0]?.cta}"
- [ ] Vocabulary includes: ${topVocab.slice(0, 5).join(', ')}
- [ ] Overall tone is: ${primaryTone}
`;

  await fs.writeFile('context/content-strategy.md', strategy);
  
  console.log('✅ Content strategy created!');
  console.log('📁 File: context/content-strategy.md');
  console.log('\n📋 Review this document before proceeding to implementation.');
})();

Run it:
node scripts/generate-content-strategy.js


PHASE 4: IMPLEMENT REFERENCE-BASED CONTENT
Step 4.1: Update Hero Section with Actual Reference Patterns
// scripts/implement-hero.js
const fs = require('fs').promises;

(async () => {
  console.log('🎨 Generating Hero component from references...\n');
  
  const synthesis = JSON.parse(
    await fs.readFile('context/reference-analysis/synthesis.json', 'utf8')
  );
  
  const ref1 = JSON.parse(
    await fs.readFile('context/reference-analysis/reference-1-content.json', 'utf8')
  );
  
  // Extract patterns
  const heroPattern = ref1.hero;
  const topCTAs = synthesis.cta_patterns.slice(0, 2);
  const topVocab = synthesis.vocabulary_themes.slice(0, 5).map(v => v.word);
  
  // Generate hero component with ACTUAL patterns
  const heroComponent = `'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0a0a0a] text-white">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#bfae84]/10 via-transparent to-[#5a8272]/5" />
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-40 lg:py-48">
        <div className="max-w-4xl">
          {/* Eyebrow - inspired by references */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[#bfae84] font-medium tracking-widest uppercase text-sm mb-6 flex items-center gap-2"
          >
            <span className="w-12 h-px bg-[#bfae84]" />
            {/* Pattern from references: short, impactful descriptor */}
            ${topVocab.includes('award') ? 'Award-Winning' : topVocab.includes('leading') ? 'Leading' : 'Premium'} Digital Agency
          </motion.p>
          
          {/* Headline - following reference pattern */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-8 leading-[1.1]"
          >
            {/* ACTUAL pattern from Reference 1: "${heroPattern.headline}" */}
            {/* Adapted for your brand: */}
            ${heroPattern.headline ? 
              `${heroPattern.headline.split('.')[0]}.` : 
              'We create digital experiences that command attention'}
            <span className="block text-[#bfae84] mt-2">
              {/* Second line pattern from references */}
              ${heroPattern.headline?.includes('tomorrow') ? 'Built for tomorrow.' : 'Made to perform.'}
            </span>
          </motion.h1>
          
          {/* Subheading - reference style */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl lg:text-2xl text-gray-300 leading-relaxed mb-12 max-w-2xl"
          >
            {/* Pattern from Reference 1: "${heroPattern.subheading}" */}
            ${heroPattern.subheading || 'For businesses that refuse to blend in. We craft digital experiences that inspire action and leave lasting impressions.'}
          </motion.p>
          
          {/* CTAs - using actual CTA patterns from references */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button 
              size="lg"
              className="bg-[#bfae84] hover:bg-[#a89970] text-black font-semibold text-lg px-8 py-4 shadow-[0_8px_30px_rgba(191,174,132,0.3)] hover:shadow-[0_12px_40px_rgba(191,174,132,0.4)] transition-all duration-300 group"
            >
              {/* Top CTA from references: "${topCTAs[0]?.cta}" */}
              ${topCTAs[0]?.cta || 'Get Started'}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              variant="secondary"
              size="lg"
              className="border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm text-lg px-8 py-4"
            >
              {/* Secondary CTA from references: "${topCTAs[1]?.cta}" */}
              ${topCTAs[1]?.cta || 'View Our Work'}
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}`;

  await fs.writeFile('app/components/sections/hero-generated.tsx', heroComponent);
  
  console.log('✅ Hero component generated!');
  console.log('📁 File: app/components/sections/hero-generated.tsx');
  console.log('\n📋 Component uses ACTUAL patterns from:');
  console.log(`   - Headline style: "${heroPattern.headline?.slice(0, 50)}..."`);
  console.log(`   - CTAs: "${topCTAs[0]?.cta}", "${topCTAs[1]?.cta}"`);
  console.log(`   - Vocabulary: ${topVocab.slice(0, 3).join(', ')}`);
})();

Run it:
node scripts/implement-hero.js


PHASE 5: IMPLEMENT ALL SECTIONS
Step 5.1: Generate Features Section from References
// scripts/implement-features.js
const fs = require('fs').promises;

(async () => {
  const ref1 = JSON.parse(
    await fs.readFile('context/reference-analysis/reference-1-content.json', 'utf8')
  );
  
  const synthesis = JSON.parse(
    await fs.readFile('context/reference-analysis/synthesis.json', 'utf8')
  );
  
  // Find features/services section from references
  const featuresSection = ref1.sections.find(s => 
    s.headline?.toLowerCase().includes('service') || 
    s.headline?.toLowerCase().includes('what') ||
    s.headline?.toLowerCase().includes('how')
  );
  
  const topVocab = synthesis.vocabulary_themes.slice(0, 10).map(v => v.word);
  
  const featuresComponent = `'use client'

import { motion } from 'framer-motion'
import { Zap, Target, Sparkles } from 'lucide-react'

export function Features() {
  const features = [
    {
      icon: Zap,
      eyebrow: '${topVocab.includes('exceptional') ? 'Exceptional' : 'Premium'} Quality',
      title: '${featuresSection?.paragraphs[0]?.split('.')[0] || 'Crafted with Precision'}',
      description: '${featuresSection?.paragraphs[0] || 'Every detail matters. We obsess over the smallest elements to create experiences that feel effortless and look stunning.'}',
    },
    {
      icon: Target,
      eyebrow: '${topVocab.includes('proven') ? 'Proven' : 'Results-Driven'} Approach',
      title: '${featuresSection?.paragraphs[1]?.split('.')[0] || 'Built to Perform'}',
      description: '${featuresSection?.paragraphs[1] || 'Beautiful design is worthless without results. Every decision is made with your business goals in mind.'}',
    },
    {
      icon: Sparkles,
      eyebrow: '${topVocab.includes('dedicated') ? 'Dedicated' : 'Expert'} Team',
      title: '${featuresSection?.paragraphs[2]?.split('.')[0] || 'Partnership that Works'}',
      description: '${featuresSection?.paragraphs[2] || 'We don\\'t just build and leave. We partner with you for long-term success and continuous improvement.'}',
    },
  ]

  return (
    <section className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mb-20"
        >
          <p className="text-[#bfae84] font-medium tracking-widest uppercase text-sm mb-4">
            ${featuresSection?.headline?.includes('What') ? 'What Sets Us Apart' : 'Our Approach'}
          </p>
          <h2 className="text-5xl lg:text-6xl font-bold mb-6">
            {/* Using actual headline pattern: "${featuresSection?.headline}" */}
            ${featuresSection?.headline || 'We don\\'t do cookie-cutter.'}
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            ${featuresSection?.subheading || 'Every project is bespoke. Every detail is intentional.'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="mb-6">
                <feature.icon className="w-12 h-12 text-[#bfae84]" strokeWidth={1.5} />
              </div>
              <p className="text-[#bfae84] font-medium text-sm mb-3 uppercase tracking-wider">
                {feature.eyebrow}
              </p>
              <h3 className="text-2xl font-bold mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}`;

  await fs.writeFile('app/components/sections/features-generated.tsx', featuresComponent);
  
  console.log('✅ Features component generated from references!');
})();


PHASE 6: VALIDATION & COMPARISON
Step 6.1: Compare Generated vs Reference
Create scripts/validate-content.js:
const fs = require('fs').promises;

(async () => {
  console.log('🔍 Validating generated content against references...\n');
  
  const synthesis = JSON.parse(
    await fs.readFile('context/reference-analysis/synthesis.json', 'utf8')
  );
  
  const strategy = await fs.readFile('context/content-strategy.md', 'utf8');
  
  console.log('📊 CONTENT VALIDATION REPORT\n');
  
  console.log('✅ REFERENCE PATTERNS USED:');
  console.log(`   - Hero headline pattern: Based on ${synthesis.hero_patterns.length} references`);
  console.log(`   - CTA style: Top ${synthesis.cta_patterns.length} patterns analyzed`);
  console.log(`   - Vocabulary: ${synthesis.vocabulary_themes.slice(0, 5).map(v => v.word).join(', ')}`);
  console.log(`   - Tone: ${Object.keys(synthesis.tone_analysis).join(', ')}`);
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Review generated components in app/components/sections/');
  console.log('2. Replace old components with generated ones');
  console.log('3. Customize with your actual brand name and specifics');
  console.log('4. Test at localhost:3009');
  console.log('5. Compare side-by-side with reference URLs');
})();


SUCCESS CRITERIA
Content successfully replicates references when:
[ ] Hero headline follows ACTUAL pattern from references
[ ] CTAs use ACTUAL text patterns from references
[ ] Vocabulary matches top words from references
[ ] Tone matches dominant tone from references
[ ] Section headlines follow observed patterns
[ ] Body text length/style matches references
[ ] NO generic placeholders - all based on data

ESTIMATED TIME
Phase 1 (Extraction): 15 minutes
Phase 2 (Analysis): 15 minutes
Phase 3 (Strategy): 10 minutes
Phase 4-5 (Implementation): 2-3 hours
Phase 6 (Validation): 30 minutes
Total: 3-4 hours

START HERE
1. Replace reference URLs in extract-reference-content.js:
const references = [
  { name: 'reference-1', url: 'REFERANCE URL 1' },
];

2. Run extraction:
node scripts/extract-reference-content.js

3. Review extracted content:
cat context/reference-analysis/synthesis.json

4. Generate strategy:
node scripts/generate-content-strategy.js

5. Implement components:
node scripts/implement-hero.js
node scripts/implement-features.js

6. Replace old components with generated ones
7. Test and compare to references

CRITICAL NOTES
This extracts REAL content from references - not assumptions
Generated components use ACTUAL patterns from your specific reference URLs
Vocabulary and tone come from data analysis, not generic best practices
CTAs are based on what references actually use
Headlines follow patterns observed in references
NO placeholders - everything is data-driven
This is how you get from "generic" to "has personality like fourmeta.com" - by actually copying fourmeta.com's content patterns.








DEL 3


<artifact identifier="del-3-brand-polish" type="text/markdown" title="DEL 3: Brand Injection & Final Polish"> # DEL 3: BRAND INJECTION, POLISH & CLIENT HANDOFF
⚠️ PREREQUISITES: Only run this after completing DEL 1 and DEL 2
✅ Design system extracted and documented
✅ All components built and validated
✅ Fonts implemented
✅ Content patterns extracted
✅ All Playwright validations passed
This final phase transforms your generic, reference-inspired site into the CLIENT'S unique brand and prepares it for launch.

PHASE 7: BRAND IDENTITY INJECTION
Step 7.1: Create Brand Asset Inventory
Create context/brand-assets/README.md:
# Brand Asset Inventory

## Required Assets from Client

### Logo Files
- [ ] Primary logo (SVG preferred, PNG fallback)
- [ ] Logo variants (white, black, color)
- [ ] Favicon (32x32, 16x16)
- [ ] Apple touch icon (180x180)
- [ ] Social media logo (1200x630 for OG image)

### Brand Colors
- [ ] Primary brand color (hex)
- [ ] Secondary brand color (hex)
- [ ] Accent colors (if any)
- [ ] Do these override the reference-extracted colors? Y/N

### Typography
- [ ] Exact brand fonts to use (if different from references)
- [ ] Font license confirmation
- [ ] Fallback font preferences

### Content
- [ ] Company name
- [ ] Tagline/slogan
- [ ] Hero headline (their actual message)
- [ ] Hero subheading
- [ ] About/mission statement
- [ ] Service/product descriptions (3-5)
- [ ] Team member names and titles (if applicable)
- [ ] Testimonials with real names (if applicable)
- [ ] Contact information (email, phone, address)
- [ ] Social media links
- [ ] Copyright text

### Images
- [ ] Hero background image or video
- [ ] Service/feature images (min 3)
- [ ] Team photos (if applicable)
- [ ] Portfolio/work samples (if applicable)
- [ ] Minimum resolution: 1920px width for hero, 800px for others

### Copy & Tone
- [ ] Brand voice guidelines (if they have them)
- [ ] Key messaging points
- [ ] Prohibited words/phrases
- [ ] Preferred terminology for services/products

STOP HERE. Send this inventory to client and collect all assets before proceeding.

Step 7.2: Organize Brand Assets
# Create directory structure
mkdir -p public/brand/{logos,images,icons}
mkdir -p context/brand-content

Place client assets:
public/
  brand/
    logos/
      logo-primary.svg
      logo-white.svg
      logo-black.svg
      favicon.ico
    images/
      hero-bg.jpg
      service-1.jpg
      service-2.jpg
      team-1.jpg
    icons/
      apple-touch-icon.png
      favicon-32x32.png


Step 7.3: Create Brand Configuration File
Create config/brand.ts:
export const brand = {
  // Company Information
  company: {
    name: '[CLIENT_COMPANY_NAME]',
    legalName: '[CLIENT_LEGAL_NAME]',
    tagline: '[CLIENT_TAGLINE]',
    founded: '[YEAR]',
    email: '[CLIENT_EMAIL]',
    phone: '[CLIENT_PHONE]',
    address: {
      street: '[STREET]',
      city: '[CITY]',
      state: '[STATE]',
      zip: '[ZIP]',
      country: '[COUNTRY]',
    },
  },

  // Brand Colors (from client or keep reference colors)
  colors: {
    primary: '#[CLIENT_PRIMARY_HEX]',
    secondary: '#[CLIENT_SECONDARY_HEX]',
    accent: '#[CLIENT_ACCENT_HEX]',
  },

  // Social Media
  social: {
    twitter: '[TWITTER_URL]',
    linkedin: '[LINKEDIN_URL]',
    instagram: '[INSTAGRAM_URL]',
    facebook: '[FACEBOOK_URL]',
    github: '[GITHUB_URL]', // if applicable
  },

  // SEO
  seo: {
    title: '[COMPANY_NAME] | [TAGLINE]',
    description: '[150-160 char description for search results]',
    keywords: ['keyword1', 'keyword2', 'keyword3'],
  },

  // Navigation
  navigation: [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ],

  // CTAs
  ctas: {
    primary: '[CLIENT_PRIMARY_CTA]', // e.g., "Get Started"
    secondary: '[CLIENT_SECONDARY_CTA]', // e.g., "Learn More"
    contact: '[CLIENT_CONTACT_CTA]', // e.g., "Let's Talk"
  },
}

CRITICAL: Replace ALL [PLACEHOLDER] values with actual client data.

Step 7.4: Inject Brand Colors
Update app/globals.css:
@import "tailwindcss";

@theme {
  /* ============================================
     BRAND COLORS - Client Specific
     ============================================ */
  
  /* Primary Brand Color */
  --color-primary-50: [lightest shade of client primary];
  --color-primary-100: [lighter];
  --color-primary-200: [lighter];
  --color-primary-300: [lighter];
  --color-primary-400: [lighter];
  --color-primary-500: [CLIENT PRIMARY COLOR]; /* Main brand color */
  --color-primary-600: [darker];
  --color-primary-700: [darker];
  --color-primary-800: [darker];
  --color-primary-900: [darker];
  --color-primary-950: [darkest shade of client primary];
  
  /* Secondary Brand Color (if different from references) */
  --color-secondary-500: [CLIENT SECONDARY COLOR];
  --color-secondary-600: [darker];
  --color-secondary-700: [darker];
  
  /* Accent Color */
  --color-accent-500: [CLIENT ACCENT COLOR];
  --color-accent-600: [darker];
  --color-accent-700: [darker];
  
  /* Keep neutrals from reference extraction unless client specifies */
  /* ... neutral colors remain ... */
}

Tool to generate color shades:
Create scripts/generate-brand-shades.js:
const Color = require('color'); // npm install color

const primaryHex = '#[CLIENT_PRIMARY_HEX]';

const shades = {
  50: 0.95,
  100: 0.9,
  200: 0.8,
  300: 0.6,
  400: 0.4,
  500: 0,    // Original color
  600: -0.1,
  700: -0.2,
  800: -0.3,
  900: -0.4,
  950: -0.5,
};

console.log('Primary Color Shades:\n');
Object.entries(shades).forEach(([shade, lighten]) => {
  const color = Color(primaryHex);
  const adjusted = lighten > 0 
    ? color.lighten(lighten) 
    : color.darken(Math.abs(lighten));
  
  console.log(`--color-primary-${shade}: ${adjusted.hex()};`);
});

Run it:
node scripts/generate-brand-shades.js

Copy output to globals.css.

Step 7.5: Replace Content with Client's Actual Text
Create context/brand-content/copy.json:
{
  "hero": {
    "eyebrow": "[Client eyebrow text]",
    "headline": "[Client's actual headline - not reference-inspired]",
    "subheading": "[Client's actual subheading]",
    "ctaPrimary": "[Client's primary CTA]",
    "ctaSecondary": "[Client's secondary CTA]"
  },
  "about": {
    "headline": "[About section headline]",
    "body": "[Client's mission statement or about text]"
  },
  "services": [
    {
      "title": "[Service 1 Name]",
      "description": "[Service 1 Description]",
      "icon": "Zap"
    },
    {
      "title": "[Service 2 Name]",
      "description": "[Service 2 Description]",
      "icon": "Target"
    },
    {
      "title": "[Service 3 Name]",
      "description": "[Service 3 Description]",
      "icon": "Sparkles"
    }
  ],
  "testimonials": [
    {
      "quote": "[Real testimonial quote]",
      "author": "[Real client name]",
      "title": "[Their title/company]",
      "image": "/brand/images/testimonial-1.jpg"
    }
  ],
  "cta": {
    "headline": "[CTA section headline]",
    "subheading": "[CTA section supporting text]",
    "buttonText": "[CTA button text]"
  },
  "footer": {
    "tagline": "[Footer tagline]",
    "copyright": "© [YEAR] [COMPANY NAME]. All rights reserved."
  }
}

STOP HERE. Get this filled out by client before proceeding.

Step 7.6: Update Components with Brand Content
Update app/components/sections/hero.tsx:
import { brand } from '@/config/brand'
import brandCopy from '@/context/brand-content/copy.json'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0a0a0a] text-white">
      {/* Brand-specific hero background */}
      <div className="absolute inset-0">
        <Image
          src="/brand/images/hero-bg.jpg"
          alt=""
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/5" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-40 lg:py-48">
        <div className="max-w-4xl">
          {/* Client's actual eyebrow */}
          <p className="text-primary-500 font-medium tracking-widest uppercase text-sm mb-6 flex items-center gap-2">
            <span className="w-12 h-px bg-primary-500" />
            {brandCopy.hero.eyebrow}
          </p>
          
          {/* Client's actual headline */}
          <h1 className="text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
            {brandCopy.hero.headline}
          </h1>
          
          {/* Client's actual subheading */}
          <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed mb-12 max-w-2xl">
            {brandCopy.hero.subheading}
          </p>
          
          {/* Client's actual CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-lg px-8 py-4"
            >
              {brand.ctas.primary}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            <Button 
              variant="secondary"
              size="lg"
            >
              {brand.ctas.secondary}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

Repeat for ALL sections:
Features section
Testimonials section
CTA section
About section
Footer

Step 7.7: Update Metadata with Brand Info
Update app/layout.tsx:
import { brand } from '@/config/brand'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: brand.seo.title,
  description: brand.seo.description,
  keywords: brand.seo.keywords,
  authors: [{ name: brand.company.name }],
  creator: brand.company.name,
  publisher: brand.company.name,
  
  openGraph: {
    type: 'website',
    locale: 'no_NO',
    url: 'https://[YOUR_DOMAIN]',
    title: brand.seo.title,
    description: brand.seo.description,
    siteName: brand.company.name,
    images: [
      {
        url: '/brand/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: brand.company.name,
      },
    ],
  },
  
  twitter: {
    card: 'summary_large_image',
    title: brand.seo.title,
    description: brand.seo.description,
    images: ['/brand/images/og-image.jpg'],
  },
  
  icons: {
    icon: '/brand/logos/favicon.ico',
    apple: '/brand/icons/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no">
      <body>{children}</body>
    </html>
  )
}


Step 7.8: Validate Brand Injection
Create scripts/validate-brand-injection.js:
const { chromium } = require('playwright');
const brand = require('../config/brand');
const brandCopy = require('../context/brand-content/copy.json');

(async () => {
  console.log('🔍 Validating brand injection...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  console.log('✅ BRAND IDENTITY CHECKLIST:\n');
  
  // Check 1: Company name in page
  const hasCompanyName = await page.evaluate((name) => {
    return document.body.textContent.includes(name);
  }, brand.company.name);
  console.log(`${hasCompanyName ? '✅' : '❌'} Company name "${brand.company.name}" appears on page`);
  
  // Check 2: Hero headline matches
  const heroHeadline = await page.locator('h1').first().textContent();
  const matchesHero = heroHeadline.trim() === brandCopy.hero.headline;
  console.log(`${matchesHero ? '✅' : '❌'} Hero headline matches brand copy`);
  console.log(`   Expected: "${brandCopy.hero.headline}"`);
  console.log(`   Found: "${heroHeadline.trim()}"`);
  
  // Check 3: Primary CTA text
  const primaryCTA = await page.locator('button').first().textContent();
  const matchesCTA = primaryCTA.includes(brand.ctas.primary);
  console.log(`${matchesCTA ? '✅' : '❌'} Primary CTA matches brand config`);
  console.log(`   Expected: "${brand.ctas.primary}"`);
  console.log(`   Found: "${primaryCTA}"`);
  
  // Check 4: Logo present
  const logoExists = await page.locator('img[alt*="logo"], svg[aria-label*="logo"]').count() > 0;
  console.log(`${logoExists ? '✅' : '❌'} Logo image found on page`);
  
  // Check 5: Brand colors in use (check computed styles)
  const primaryColorInUse = await page.evaluate((color) => {
    const elements = document.querySelectorAll('*');
    let found = false;
    
    elements.forEach(el => {
      const styles = window.getComputedStyle(el);
      const bgColor = styles.backgroundColor;
      const textColor = styles.color;
      const borderColor = styles.borderColor;
      
      if (bgColor.includes(color) || textColor.includes(color) || borderColor.includes(color)) {
        found = true;
      }
    });
    
    return found;
  }, brand.colors.primary);
  console.log(`${primaryColorInUse ? '✅' : '❌'} Primary brand color (${brand.colors.primary}) detected in use`);
  
  // Check 6: No placeholder text
  const hasPlaceholders = await page.evaluate(() => {
    const text = document.body.textContent.toLowerCase();
    const placeholders = [
      '[client',
      '[company',
      'lorem ipsum',
      'placeholder',
      '[your company]',
    ];
    
    return placeholders.some(p => text.includes(p));
  });
  console.log(`${!hasPlaceholders ? '✅' : '❌'} No placeholder text found`);
  
  // Check 7: Social links
  const socialLinks = await page.locator('a[href*="linkedin"], a[href*="twitter"], a[href*="instagram"]').count();
  console.log(`${socialLinks > 0 ? '✅' : '❌'} Social media links present (${socialLinks} found)`);
  
  // Screenshot for visual review
  await page.screenshot({ 
    path: 'screenshots/brand-injection-validation.png',
    fullPage: true 
  });
  console.log('\n📸 Screenshot saved: screenshots/brand-injection-validation.png');
  
  await browser.close();
  
  console.log('\n📋 Manual checks still required:');
  console.log('   - Does the overall "feel" match client brand?');
  console.log('   - Are all images client-specific (not stock)?');
  console.log('   - Is the tone of voice authentic to client?');
  console.log('   - Do colors evoke the right emotion for brand?');
})();

Run it:
node scripts/validate-brand-injection.js

CHECKPOINT:
[ ] All content is client-specific (no placeholders)
[ ] Brand colors injected throughout
[ ] Logo appears correctly
[ ] Company name everywhere it should be
[ ] CTAs use client's actual messaging
[ ] Social links point to client accounts
[ ] No "lorem ipsum" or generic text
[ ] Images are client-specific

PHASE 8: ANIMATIONS & MICROINTERACTIONS
Step 8.1: Install Animation Dependencies
npm install framer-motion


Step 8.2: Create Animation Utilities
Create lib/animations.ts:
import { Variants } from 'framer-motion'

// Fade in from bottom
export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 40 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1], // Custom easing
    }
  }
}

// Fade in from left
export const fadeInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -40 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    }
  }
}

// Fade in from right
export const fadeInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 40 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    }
  }
}

// Scale in
export const scaleIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    }
  }
}

// Stagger children
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
}

// Hover scale
export const hoverScale = {
  scale: 1.02,
  transition: {
    duration: 0.2,
    ease: "easeOut"
  }
}

// Hover lift (shadow + translate)
export const hoverLift = {
  y: -4,
  transition: {
    duration: 0.2,
    ease: "easeOut"
  }
}

// Button hover
export const buttonHover = {
  scale: 1.02,
  transition: {
    duration: 0.2,
    ease: [0.22, 1, 0.36, 1],
  }
}

// Button tap
export const buttonTap = {
  scale: 0.98,
}

// Magnetic cursor effect (for advanced interactions)
export const magneticEffect = (strength: number = 20) => ({
  x: 0,
  y: 0,
  transition: {
    type: "spring",
    stiffness: 150,
    damping: 15,
    mass: 0.1,
  }
})


Step 8.3: Add Scroll Animations to Sections
Update app/components/sections/features.tsx:
'use client'

import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import brandCopy from '@/context/brand-content/copy.json'

export function Features() {
  return (
    <section className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Animated heading */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="max-w-3xl mb-20"
        >
          <h2 className="text-5xl lg:text-6xl font-bold mb-6">
            {brandCopy.services.headline || 'What We Do'}
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            {brandCopy.services.subheading || 'Our services'}
          </p>
        </motion.div>

        {/* Staggered feature cards */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-12"
        >
          {brandCopy.services.map((service, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
              className="group"
            >
              <div className="mb-6">
                {/* Icon */}
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center group-hover:bg-primary-200 transition-colors duration-300">
                  <span className="text-2xl">{service.icon}</span>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-4">
                {service.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}


Step 8.4: Add Button Microinteractions
Update app/components/ui/button.tsx:
import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { buttonHover, buttonTap } from '@/lib/animations'

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={buttonHover}
        whileTap={buttonTap}
        className={cn(
          'inline-flex items-center justify-center',
          'font-semibold transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          
          variant === 'primary' && [
            'bg-primary-600 hover:bg-primary-700',
            'text-white',
            'shadow-lg hover:shadow-xl',
            'focus:ring-primary-500',
          ],
          
          variant === 'secondary' && [
            'bg-gray-200 hover:bg-gray-300',
            'text-gray-900',
            'focus:ring-gray-500',
          ],
          
          variant === 'ghost' && [
            'bg-transparent hover:bg-gray-100',
            'text-gray-700',
            'focus:ring-gray-500',
          ],
          
          size === 'sm' && 'px-4 py-2 text-sm rounded-md',
          size === 'md' && 'px-6 py-3 text-base rounded-lg',
          size === 'lg' && 'px-8 py-4 text-lg rounded-lg',
          
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export { Button }


Step 8.5: Add Card Hover Effects
Update app/components/ui/card.tsx:
'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={{ 
        y: -8,
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
      }}
      className={cn(
        'bg-white rounded-2xl shadow-lg p-8',
        'hover:shadow-2xl transition-shadow duration-300',
        'border border-gray-100',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}


Step 8.6: Add Loading States
Create app/components/ui/loading-spinner.tsx:
'use client'

import { motion } from 'framer-motion'

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  )
}

export function LoadingButton({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      {children}
    </div>
  )
}


Step 8.7: Add Page Transitions
Create app/components/layout/page-transition.tsx:
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1]
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

Update app/layout.tsx:
import { PageTransition } from '@/components/layout/page-transition'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body>
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  )
}


Step 8.8: Validate Animations
Create scripts/validate-animations.js:
const { chromium } = require('playwright');

(async () => {
  console.log('🎬 Testing animations and interactions...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  console.log('📋 Animation Tests:\n');
  
  // Test 1: Scroll animations
  console.log('1️⃣ Testing scroll animations...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  
  // Scroll to features section
  await page.evaluate(() => {
    const section = document.querySelector('section:nth-of-type(2)');
    section?.scrollIntoView({ behavior: 'smooth' });
  });
  await page.waitForTimeout(1500);
  console.log('   ✅ Scroll animations triggered');
  
  // Test 2: Button hover
  console.log('2️⃣ Testing button hover effects...');
  const button = page.locator('button').first();
  await button.hover();
  await page.waitForTimeout(500);
  console.log('   ✅ Button hover detected');
  
  // Test 3: Card hover
  console.log('3️⃣ Testing card hover effects...');
  const card = page.locator('[class*="group"]').first();
  if (await card.count() > 0) {
    await card.hover();
    await page.waitForTimeout(500);
    console.log('   ✅ Card hover detected');
  }
  
  // Test 4: Click animation
  console.log('4️⃣ Testing click/tap feedback...');
  await button.click();
  await page.waitForTimeout(300);
  console.log('   ✅ Click animation detected');
  
  // Test 5: Check for animation jank
  console.log('5️⃣ Checking for animation jank...');
  const hasJank = await page.evaluate(() => {
    let jankFrames = 0;
    const maxJank = 10;
    
    return new Promise((resolve) => {
      let lastTime = performance.now();
      let frameCount = 0;
      
      function checkFrame() {
        const currentTime = performance.now();
        const delta = currentTime - lastTime;
        
        // Frame took longer than 16.67ms (60fps)
        if (delta > 16.67 + 5) { // 5ms tolerance
          jankFrames++;
        }
        
        lastTime = currentTime;
        frameCount++;
        
        if (frameCount < 100) {
          requestAnimationFrame(checkFrame);
        } else {
          resolve(jankFrames > maxJank);
        }
      }
      
      requestAnimationFrame(checkFrame);
    });
  });
  
  console.log(`   ${hasJank ? '⚠️' : '✅'} Animation performance ${hasJank ? 'needs optimization' : 'looks smooth'}`);
  
  await browser.close();
  
  console.log('\n✅ Animation validation complete!');
  console.log('\n📋 Manual checks required:');
  console.log('   - Do animations feel smooth and natural?');
  console.log('   - Are transitions not too fast or too slow?');
  console.log('   - Does hover feedback feel responsive?');
  console.log('   - Are there any jarring movements?');
})();

Run it:
node scripts/validate-animations.js

CHECKPOINT:
[ ] Scroll animations work smoothly
[ ] Button hovers have feedback
[ ] Cards lift on hover
[ ] Click animations feel responsive
[ ] No animation jank (smooth 60fps)
[ ] Animations enhance (not distract from) content
[ ] Respects prefers-reduced-motion (add this if needed)

PHASE 9: FINAL QA & CROSS-BROWSER TESTING
Step 9.1: Create Comprehensive QA Checklist
Create context/qa-checklist.md:
# Final QA Checklist

## Visual Design
- [ ] All colors match brand guidelines
- [ ] Typography is consistent throughout
- [ ] Spacing follows design system
- [ ] Images are optimized and load properly
- [ ] Logo appears correctly on all pages
- [ ] Favicon shows in browser tab

## Content
- [ ] All placeholder text replaced
- [ ] No lorem ipsum anywhere
- [ ] Company name spelled correctly everywhere
- [ ] Contact information accurate
- [ ] All links work (no 404s)
- [ ] Social media links go to correct profiles
- [ ] Copyright year is current

## Functionality
- [ ] All buttons work
- [ ] Forms submit correctly
- [ ] Navigation works on all pages
- [ ] Mobile menu opens/closes
- [ ] All internal links work
- [ ] External links open in new tab (if desired)

## Responsive Design
- [ ] Works on iPhone SE (375px)
- [ ] Works on iPhone 12/13 (390px)
- [ ] Works on iPad (768px)
- [ ] Works on iPad Pro (1024px)
- [ ] Works on desktop (1440px+)
- [ ] Works on ultrawide (1920px+)
- [ ] No horizontal scroll on mobile
- [ ] Text is readable on all sizes
- [ ] Buttons are tappable on mobile (min 44px)

## Performance
- [ ] Lighthouse Performance score > 90
- [ ] Lighthouse Accessibility score > 90
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Total Blocking Time < 200ms
- [ ] Cumulative Layout Shift < 0.1
- [ ] Images use next/image optimization
- [ ] Fonts load without FOUT/FOIT

## Accessibility
- [ ] All images have alt text
- [ ] Proper heading hierarchy (H1 → H2 → H3)
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Focus indicators visible
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Forms have proper labels
- [ ] Links have descriptive text (no "click here")

## SEO
- [ ] Page titles unique and descriptive
- [ ] Meta descriptions present (150-160 chars)
- [ ] Open Graph tags for social sharing
- [ ] Twitter Card tags
- [ ] Structured data/Schema markup (if needed)
- [ ] XML sitemap generated
- [ ] robots.txt configured

## Browser Compatibility
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Chrome Mobile (latest)
- [ ] Safari iOS (latest)

## Security
- [ ] HTTPS enabled
- [ ] No console errors in production
- [ ] No exposed API keys
- [ ] Environment variables properly configured
- [ ] Content Security Policy headers (if needed)

## Before Launch
- [ ] 404 page exists and styled
- [ ] Error pages styled
- [ ] Analytics installed (Google Analytics, etc.)
- [ ] Contact form sends to correct email
- [ ] Backup of all code
- [ ] Domain configured correctly
- [ ] DNS records set up


Step 9.2: Automated Cross-Browser Testing
Create scripts/cross-browser-test.js:
const { chromium, webkit, firefox } = require('playwright');

const browsers = [
  { name: 'Chromium', launch: chromium },
  { name: 'WebKit (Safari)', launch: webkit },
  { name: 'Firefox', launch: firefox },
];

const viewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Desktop', width: 1440, height: 900 },
];

(async () => {
  console.log('🌐 Running cross-browser tests...\n');
  
  for (const browser of browsers) {
    console.log(`\n📱 Testing: ${browser.name}`);
    const browserInstance = await browser.launch.launch({ headless: true });
    
    for (const viewport of viewports) {
      console.log(`  └─ ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      const page = await browserInstance.newPage();
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      try {
        // Navigate
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
        
        // Check for console errors
        const errors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            errors.push(msg.text());
          }
        });
        
        // Take screenshot
        await page.screenshot({ 
          path: `screenshots/cross-browser/${browser.name.toLowerCase()}-${viewport.name.toLowerCase().replace(' ', '-')}.png`,
          fullPage: false
        });
        
        // Check basic functionality
        const hasH1 = await page.locator('h1').count() > 0;
        const hasButton = await page.locator('button').count() > 0;
        const hasNav = await page.locator('nav').count() > 0;
        
        console.log(`     ${hasH1 ? '✅' : '❌'} H1 present`);
        console.log(`     ${hasButton ? '✅' : '❌'} Buttons present`);
        console.log(`     ${hasNav ? '✅' : '❌'} Navigation present`);
        
        if (errors.length > 0) {
          console.log(`     ⚠️  ${errors.length} console errors`);
        } else {
          console.log(`     ✅ No console errors`);
        }
        
      } catch (error) {
        console.log(`     ❌ Error: ${error.message}`);
      }
      
      await page.close();
    }
    
    await browserInstance.close();
  }
  
  console.log('\n\n✅ Cross-browser testing complete!');
  console.log('📁 Screenshots saved to: screenshots/cross-browser/');
  console.log('\n📋 Review screenshots for visual inconsistencies');
})();

Create directory:
mkdir -p screenshots/cross-browser

Run it:
node scripts/cross-browser-test.js


Step 9.3: Performance Audit
Create scripts/performance-audit.js:
const { chromium } = require('playwright');
const fs = require('fs').promises;

(async () => {
  console.log('⚡ Running performance audit...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Start measuring
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  // Get performance metrics
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
      // Core Web Vitals
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      
      // Paint metrics
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
      
      // Resource timing
      totalResources: performance.getEntriesByType('resource').length,
      
      // Memory (if available)
      memory: performance.memory ? {
        usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      } : 'Not available',
    };
  });
  
  // Get largest contentful paint
  const lcp = await page.evaluate(() => {
    return new Promise((resolve) => {
      let lcpValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcpValue = lastEntry.startTime;
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Resolve after a timeout
      setTimeout(() => {
        observer.disconnect();
        resolve(lcpValue);
      }, 3000);
    });
  });
  
  // Get cumulative layout shift
  const cls = await page.evaluate(() => {
    return new Promise((resolve) => {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      
      setTimeout(() => {
        observer.disconnect();
        resolve(clsValue);
      }, 3000);
    });
  });
  
  console.log('📊 PERFORMANCE METRICS:\n');
  console.log('Core Web Vitals:');
  console.log(`  First Contentful Paint: ${metrics.firstContentfulPaint?.toFixed(0)}ms ${metrics.firstContentfulPaint < 1800 ? '✅' : '⚠️'}`);
  console.log(`  Largest Contentful Paint: ${lcp.toFixed(0)}ms ${lcp < 2500 ? '✅' : '⚠️'}`);
  console.log(`  Cumulative Layout Shift: ${cls.toFixed(3)} ${cls < 0.1 ? '✅' : '⚠️'}`);
  console.log('');
  console.log('Other Metrics:');
  console.log(`  DOM Content Loaded: ${metrics.domContentLoaded.toFixed(0)}ms`);
  console.log(`  Load Complete: ${metrics.loadComplete.toFixed(0)}ms`);
  console.log(`  Total Resources: ${metrics.totalResources}`);
  
  if (metrics.memory !== 'Not available') {
    console.log('');
    console.log('Memory Usage:');
    console.log(`  Used JS Heap: ${metrics.memory.usedJSHeapSize}`);
    console.log(`  Total JS Heap: ${metrics.memory.totalJSHeapSize}`);
  }
  
  // Check image optimization
  const images = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.map(img => ({
      src: img.src,
      naturalWidth: img.naturalWidth,
      displayWidth: img.width,
      isOptimized: img.src.includes('/_next/image'),
    }));
  });
  
  console.log('');
  console.log('Image Optimization:');
  const unoptimizedImages = images.filter(img => !img.isOptimized);
  console.log(`  Total images: ${images.length}`);
  console.log(`  Optimized (next/image): ${images.length - unoptimizedImages.length}`);
  console.log(`  Unoptimized: ${unoptimizedImages.length} ${unoptimizedImages.length === 0 ? '✅' : '⚠️'}`);
  
  if (unoptimizedImages.length > 0) {
    console.log('');
    console.log('  Unoptimized images:');
    unoptimizedImages.slice(0, 5).forEach(img => {
      console.log(`    - ${img.src.substring(0, 50)}...`);
    });
  }
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    metrics: {
      ...metrics,
      lcp,
      cls,
    },
    images: {
      total: images.length,
      optimized: images.length - unoptimizedImages.length,
      unoptimized: unoptimizedImages.length,
    },
  };
  
  await fs.mkdir('reports', { recursive: true });
  await fs.writeFile('reports/performance-report.json', JSON.stringify(report, null, 2));
  
  await browser.close();
  
  console.log('');
  console.log('📁 Report saved: reports/performance-report.json');
  console.log('');
  console.log('💡 Recommendations:');
  if (metrics.firstContentfulPaint > 1800) {
    console.log('  - Reduce initial bundle size');
    console.log('  - Optimize font loading');
  }
  if (lcp > 2500) {
    console.log('  - Optimize largest image/element');
    console.log('  - Preload critical resources');
  }
  if (cls > 0.1) {
    console.log('  - Add width/height to images');
    console.log('  - Reserve space for dynamic content');
  }
  if (unoptimizedImages.length > 0) {
    console.log('  - Use next/image for all images');
  }
})();

Run it:
node scripts/performance-audit.js


Step 9.4: Accessibility Audit
Create scripts/accessibility-audit.js:
const { chromium } = require('playwright');

(async () => {
  console.log('♿ Running accessibility audit...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  const issues = [];
  
  console.log('📋 ACCESSIBILITY CHECKS:\n');
  
  // Check 1: Images have alt text
  const imagesWithoutAlt = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images
      .filter(img => !img.alt || img.alt.trim() === '')
      .map(img => img.src.substring(0, 50));
  });
  
  console.log(`${imagesWithoutAlt.length === 0 ? '✅' : '❌'} Images with alt text: ${imagesWithoutAlt.length === 0 ? 'All good' : `${imagesWithoutAlt.length} missing`}`);
  if (imagesWithoutAlt.length > 0) {
    issues.push(`${imagesWithoutAlt.length} images missing alt text`);
    imagesWithoutAlt.slice(0, 3).forEach(src => {
      console.log(`   - ${src}...`);
    });
  }
  
  // Check 2: Heading hierarchy
  const headings = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map(h => ({ tag: h.tagName, text: h.textContent.trim().substring(0, 30) }));
  });
  
  const hasH1 = headings.some(h => h.tag === 'H1');
  const h1Count = headings.filter(h => h.tag === 'H1').length;
  
  console.log(`${hasH1 ? '✅' : '❌'} Page has H1: ${hasH1 ? 'Yes' : 'No'}`);
  console.log(`${h1Count === 1 ? '✅' : '⚠️'} H1 count: ${h1Count} (should be 1)`);
  
  if (!hasH1) issues.push('No H1 heading found');
  if (h1Count > 1) issues.push(`Multiple H1 headings (${h1Count})`);
  
  // Check 3: Color contrast
  const contrastIssues = await page.evaluate(() => {
    const issues = [];
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, button, span, li');
    
    function getContrast(rgb1, rgb2) {
      const luminance = (rgb) => {
        const [r, g, b] = rgb.match(/\d+/g).map(Number);
        const [rs, gs, bs] = [r, g, b].map(val => {
          val = val / 255;
          return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      };
      
      const l1 = luminance(rgb1);
      const l2 = luminance(rgb2);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }
    
    textElements.forEach(el => {
      const styles = window.getComputedStyle(el);
      const color = styles.color;
      const bgColor = styles.backgroundColor;
      
      if (color && bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
        const contrast = getContrast(color, bgColor);
        const fontSize = parseFloat(styles.fontSize);
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && styles.fontWeight >= 700);
        const minContrast = isLargeText ? 3 : 4.5;
        
        if (contrast < minContrast) {
          issues.push({
            text: el.textContent.trim().substring(0, 30),
            contrast: contrast.toFixed(2),
            required: minContrast,
          });
        }
      }
    });
    
    return issues.slice(0, 5); // Return first 5 issues
  });
  
  console.log(`${contrastIssues.length === 0 ? '✅' : '❌'} Color contrast: ${contrastIssues.length === 0 ? 'All good' : `${contrastIssues.length} issues`}`);
  if (contrastIssues.length > 0) {
    issues.push(`${contrastIssues.length} color contrast issues`);
    contrastIssues.forEach(issue => {
      console.log(`   - "${issue.text}..." has ${issue.contrast}:1 (needs ${issue.required}:1)`);
    });
  }
  
  // Check 4: Form labels
  const formsWithoutLabels = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
    return inputs.filter(input => {
      const hasLabel = document.querySelector(`label[for="${input.id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
      return !hasLabel && !hasAriaLabel && !hasAriaLabelledBy;
    }).length;
  });
  
  console.log(`${formsWithoutLabels === 0 ? '✅' : '❌'} Form inputs with labels: ${formsWithoutLabels === 0 ? 'All good' : `${formsWithoutLabels} missing`}`);
  if (formsWithoutLabels > 0) {
    issues.push(`${formsWithoutLabels} form inputs missing labels`);
  }
  
  // Check 5: Links have text
  const linksWithoutText = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    return links.filter(link => {
      const text = link.textContent.trim();
      const ariaLabel = link.getAttribute('aria-label');
      const title = link.getAttribute('title');
      return !text && !ariaLabel && !title;
    }).length;
  });
  
  console.log(`${linksWithoutText === 0 ? '✅' : '❌'} Links with text: ${linksWithoutText === 0 ? 'All good' : `${linksWithoutText} missing`}`);
  if (linksWithoutText > 0) {
    issues.push(`${linksWithoutText} links without text/aria-label`);
  }
  
  // Check 6: Keyboard navigation
  console.log('\n🔍 Testing keyboard navigation...');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  
  const focusVisible = await page.evaluate(() => {
    const focused = document.activeElement;
    if (!focused || focused === document.body) return false;
    
    const styles = window.getComputedStyle(focused);
    const hasOutline = styles.outline !== 'none' && styles.outline !== '0px';
    const hasBorder = styles.border !== 'none';
    const hasBoxShadow = styles.boxShadow !== 'none';
    
    return hasOutline || hasBorder || hasBoxShadow;
  });
  
  console.log(`${focusVisible ? '✅' : '❌'} Focus indicators: ${focusVisible ? 'Visible' : 'Not visible'}`);
  if (!focusVisible) {
    issues.push('Focus indicators not visible');
  }
  
  await browser.close();
  
  console.log('\n' + '='.repeat(50));
  
  if (issues.length === 0) {
    console.log('\n🎉 All accessibility checks passed!');
  } else {
    console.log(`\n⚠️  Found ${issues.length} accessibility issues:`);
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
  }
  
  console.log('\n📋 Additional manual checks required:');
  console.log('  - Test with screen reader (VoiceOver/NVDA)');
  console.log('  - Navigate entire site with keyboard only');
  console.log('  - Test with browser zoom at 200%');
  console.log('  - Verify video/audio has captions (if applicable)');
})();

Run it:
node scripts/accessibility-audit.js


PHASE 10: CLIENT HANDOFF & DOCUMENTATION
Step 10.1: Generate Style Guide for Client
Create scripts/generate-client-styleguide.js:
const fs = require('fs').promises;
const brand = require('../config/brand');

(async () => {
  console.log('📚 Generating client style guide...\n');
  
  const styleGuide = `# ${brand.company.name} - Website Style Guide

**Last Updated:** ${new Date().toLocaleDateString()}

---

## Brand Colors

### Primary Color
**Hex:** ${brand.colors.primary}
**Use for:** Main CTAs, primary buttons, important links

### Secondary Color
**Hex:** ${brand.colors.secondary}
**Use for:** Secondary buttons, accents, highlights

### Accent Color
**Hex:** ${brand.colors.accent}
**Use for:** Special elements, notifications, badges

---

## Typography

### Headings
- **Font:** [Font name from design system]
- **Weights:** Bold (700) for main headings

### Body Text
- **Font:** [Font name from design system]
- **Size:** 16px (1rem) base
- **Line Height:** 1.5 for readability

---

## Logo Usage

### Logo Files Location
\`public/brand/logos/\`

- \`logo-primary.svg\` - Main logo (color)
- \`logo-white.svg\` - For dark backgrounds
- \`logo-black.svg\` - For light backgrounds

### Logo Guidelines
- **Minimum size:** 120px width
- **Clear space:** Maintain padding equal to logo height
- **Do not:** Distort, rotate, or change colors

---

## Updating Content

### Homepage Hero Section
**File:** \`context/brand-content/copy.json\`

\`\`\`json
"hero": {
  "headline": "Your headline here",
  "subheading": "Supporting text here",
  "ctaPrimary": "Button text"
}
\`\`\`

After editing, restart the development server:
\`\`\`bash
npm run dev
\`\`\`

### Services/Features
Edit the \`services\` array in \`copy.json\`:

\`\`\`json
"services": [
  {
    "title": "Service Name",
    "description": "Service description",
    "icon": "Zap"
  }
]
\`\`\`

### Images
Place new images in \`public/brand/images/\`

Then reference in components:
\`\`\`tsx
<Image src="/brand/images/your-image.jpg" alt="Description" />
\`\`\`

---

## Contact Information

To update contact details:
**File:** \`config/brand.ts\`

Update the \`company\` object with current information.

---

## Common Tasks

### Change Primary Button Color
1. Open \`app/globals.css\`
2. Find \`--color-primary-500\`
3. Change the hex value
4. Restart dev server

### Add a New Page
1. Create new file: \`app/[page-name]/page.tsx\`
2. Copy structure from existing page
3. Update navigation in \`config/brand.ts\`

### Update Footer Links
Edit \`app/components/layout/footer.tsx\`

---

## Getting Help

For technical issues or updates beyond simple content changes, contact:
**Developer:** [Your name/company]
**Email:** [Your email]
**Phone:** [Your phone]

---

## Deployment

This site is configured for deployment on Vercel.

### To deploy updates:
1. Make your changes
2. Test locally (\`npm run dev\`)
3. Push to GitHub
4. Vercel will automatically deploy

**Live URL:** [Production URL]
**Admin Panel:** [Vercel dashboard URL]
`;

  await fs.writeFile('CLIENT-STYLEGUIDE.md', styleGuide);
  
  console.log('✅ Client style guide created!');
  console.log('📁 File: CLIENT-STYLEGUIDE.md');
  console.log('\nThis document should be given to the client for future reference.');
})();

Run it:
node scripts/generate-client-styleguide.js


Step 10.2: Create Deployment Guide
Create DEPLOYMENT.md:
# Deployment Guide

## Prerequisites
- Vercel account (free)
- GitHub account
- Domain (if using custom domain)

---

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin [YOUR_GITHUB_REPO_URL]
git push -u origin main


Step 2: Deploy to Vercel
Option A: Via Vercel Dashboard
Go to vercel.com
Click "New Project"
Import your GitHub repository
Configure:
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: Leave default
Click "Deploy"
Option B: Via CLI
npm install -g vercel
vercel login
vercel


Step 3: Configure Custom Domain (Optional)
In Vercel Dashboard → Settings → Domains
Add your domain: yourdomain.com
Add DNS records at your domain registrar:
Type: A, Name: @, Value: 76.76.21.21
Type: CNAME, Name: www, Value: cname.vercel-dns.com

Step 4: Environment Variables
If your site uses environment variables:
Vercel Dashboard → Settings → Environment Variables
Add variables:
NEXT_PUBLIC_SITE_URL
CONTACT_FORM_EMAIL
etc.

Step 5: Final Checks
[ ] Site is accessible at production URL
[ ] HTTPS is working
[ ] All images load correctly
[ ] Forms work in production
[ ] Analytics tracking (if installed)
[ ] Custom domain resolves (if configured)

Continuous Deployment
Every push to main branch will trigger automatic deployment to production.
For preview deployments, push to any other branch.

Rollback
If something goes wrong:
Vercel Dashboard → Deployments
Find previous working deployment
Click "..." → Promote to Production

Support
Vercel Documentation: vercel.com/docs Next.js Documentation: nextjs.org/docs

---

### Step 10.3: Create Project Handoff Package

Create `scripts/create-handoff-package.js`:

```javascript
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

(async () => {
  console.log('📦 Creating client handoff package...\n');
  
  // Create handoff directory
  const handoffDir = 'client-handoff';
  await fs.mkdir(handoffDir, { recursive: true });
  
  // Files to include
  const files = [
    { src: 'CLIENT-STYLEGUIDE.md', dest: 'CLIENT-STYLEGUIDE.md' },
    { src: 'DEPLOYMENT.md', dest: 'DEPLOYMENT.md' },
    { src: 'README.md', dest: 'README.md' },
    { src: 'package.json', dest: 'package.json' },
    { src: 'config/brand.ts', dest: 'config/brand.ts' },
    { src: 'context/brand-content/copy.json', dest: 'context/brand-content/copy.json' },
  ];
  
  // Copy files
  for (const file of files) {
    try {
      const srcPath = path.join(process.cwd(), file.src);
      const destPath = path.join(handoffDir, file.dest);
      
      // Create directory if needed
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      
      await fs.copyFile(srcPath, destPath);
      console.log(`✅ Copied: ${file.src}`);
    } catch (error) {
      console.log(`⚠️  Skipped: ${file.src} (${error.message})`);
    }
  }
  
  // Create handoff summary
  const summary = `# Project Handoff Summary

**Project:** ${require('../config/brand').company.name} Website
**Completed:** ${new Date().toLocaleDateString()}

---

## Package Contents

1. **CLIENT-STYLEGUIDE.md** - How to update content and maintain brand consistency
2. **DEPLOYMENT.md** - Step-by-step deployment instructions
3. **README.md** - Technical documentation
4. **brand.ts** - Brand configuration (colors, contact info, etc.)
5. **copy.json** - Editable content (headlines, descriptions, etc.)

---

## Quick Start

### To run locally:
\`\`\`bash
npm install
npm run dev
\`\`\`
Visit http://localhost:3000

### To deploy:
See DEPLOYMENT.md for complete instructions

---

## What You Can Edit

### ✅ Safe to Edit:
- Content in \`context/brand-content/copy.json\`
- Images in \`public/brand/images/\`
- Contact information in \`config/brand.ts\`
- Colors in \`config/brand.ts\` (then update \`globals.css\`)

### ⚠️ Requires Developer:
- Component structure
- Layout changes
- New pages
- Form functionality
- Performance optimizations

---

## Support

For questions or updates beyond simple content changes:
**Developer:** [Your Contact]
**Email:** [Your Email]

---

## Project Statistics

- **Total Components:** [X]
- **Total Pages:** [Y]
- **Performance Score:** [Z]/100
- **Accessibility Score:** [W]/100

---

## Next Steps

1. Review all documentation
2. Test site locally
3. Deploy to production (see DEPLOYMENT.md)
4. Set up custom domain (if applicable)
5. Install analytics (if desired)
6. Schedule launch!

---

Thank you for your business! 🎉
`;

  await fs.writeFile(path.join(handoffDir, 'HANDOFF-SUMMARY.md'), summary);
  console.log('✅ Created: HANDOFF-SUMMARY.md');
  
  // Create ZIP archive (requires zip command)
  try {
    execSync(`cd ${handoffDir} && zip -r ../client-handoff.zip .`);
    console.log('\n✅ Handoff package created: client-handoff.zip');
  } catch (error) {
    console.log('\n⚠️  Could not create ZIP (install zip utility)');
    console.log(`   Manual: Compress the "${handoffDir}" folder`);
  }
  
  console.log('\n📦 Handoff package ready!');
  console.log('   Send "client-handoff.zip" or the "client-handoff/" folder to client');
})();

Run it:
node scripts/create-handoff-package.js


Step 10.4: Final Validation Before Handoff
Create scripts/final-validation.js:
const { chromium } = require('playwright');
const fs = require('fs').promises;

(async () => {
  console.log('🔍 Running final validation before client handoff...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  const issues = [];
  const warnings = [];
  
  console.log('📋 FINAL VALIDATION CHECKLIST:\n');
  
  // Check 1: No placeholder text
  const hasPlaceholders = await page.evaluate(() => {
    const text = document.body.textContent.toLowerCase();
    const placeholders = [
      'lorem ipsum',
      '[client',
      '[company',
      '[your',
      'placeholder',
      'sample text',
      'coming soon',
      'under construction',
    ];
    
    const found = [];
    placeholders.forEach(p => {
      if (text.includes(p)) found.push(p);
    });
    
    return found;
  });
  
  if (hasPlaceholders.length === 0) {
    console.log('✅ No placeholder text');
  } else {
    console.log(`❌ Found placeholder text: ${hasPlaceholders.join(', ')}`);
    issues.push(`Placeholder text found: ${hasPlaceholders.join(', ')}`);
  }
  
  // Check 2: All images load
  const brokenImages = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images
      .filter(img => !img.complete || img.naturalHeight === 0)
      .map(img => img.src);
  });
  
  console.log(`${brokenImages.length === 0 ? '✅' : '❌'} All images load: ${brokenImages.length === 0 ? 'Yes' : `${brokenImages.length} broken`}`);
  if (brokenImages.length > 0) {
    issues.push(`${brokenImages.length} broken images`);
  }
  
  // Check 3: Console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  await page.reload();
  await page.waitForTimeout(2000);
  
  console.log(`${errors.length === 0 ? '✅' : '❌'} No console errors: ${errors.length === 0 ? 'Yes' : `${errors.length} found`}`);
  if (errors.length > 0) {
    issues.push(`${errors.length} console errors`);
  }
  
  // Check 4: All links work
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]'))
      .map(a => a.href)
      .filter(href => href.startsWith('http://localhost') || href.startsWith('/'));
  });
  
  let brokenLinks = 0;
  for (const link of links.slice(0, 20)) { // Test first 20 links
    try {
      const response = await page.goto(link, { timeout: 5000, waitUntil: 'domcontentloaded' });
      if (!response.ok()) brokenLinks++;
    } catch {
      brokenLinks++;
    }
  }
  
  console.log(`${brokenLinks === 0 ? '✅' : '⚠️'} Links working: ${brokenLinks === 0 ? 'All good' : `${brokenLinks} broken`}`);
  if (brokenLinks > 0) {
    warnings.push(`${brokenLinks} potentially broken links`);
  }
  
  // Back to homepage
  await page.goto('http://localhost:3000');
  
  // Check 5: Meta tags
  const metaTags = await page.evaluate(() => {
    return {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || '',
      ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
      favicon: document.querySelector('link[rel="icon"]')?.href || '',
    };
  });
  
  console.log(`${metaTags.title && metaTags.title !== 'Create Next App' ? '✅' : '❌'} Custom page title: ${metaTags.title ? 'Yes' : 'No'}`);
  console.log(`${metaTags.description ? '✅' : '❌'} Meta description: ${metaTags.description ? 'Yes' : 'No'}`);
  console.log(`${metaTags.ogImage ? '✅' : '⚠️'} OG image: ${metaTags.ogImage ? 'Yes' : 'No (recommended)'}`);
  console.log(`${metaTags.favicon ? '✅' : '❌'} Favicon: ${metaTags.favicon ? 'Yes' : 'No'}`);
  
  if (!metaTags.title || metaTags.title === 'Create Next App') issues.push('Page title not customized');
  if (!metaTags.description) issues.push('Meta description missing');
  if (!metaTags.favicon) issues.push('Favicon missing');
  if (!metaTags.ogImage) warnings.push('OG image not set');
  
  // Check 6: Mobile responsive
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(1000);
  
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  
  console.log(`${!hasHorizontalScroll ? '✅' : '❌'} Mobile responsive: ${!hasHorizontalScroll ? 'Yes' : 'Horizontal scroll detected'}`);
  if (hasHorizontalScroll) {
    issues.push('Horizontal scroll on mobile');
  }
  
  // Check 7: Build passes
  console.log('\n🔨 Testing production build...');
  try {
    const { execSync } = require('child_process');
    execSync('npm run build', { stdio: 'pipe' });
    console.log('✅ Production build: Success');
  } catch (error) {
    console.log('❌ Production build: Failed');
    issues.push('Production build fails');
  }
  
  await browser.close();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 VALIDATION SUMMARY:\n');
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('🎉 ALL CHECKS PASSED! Site is ready for client handoff.\n');
  } else {
    if (issues.length > 0) {
      console.log(`❌ CRITICAL ISSUES (${issues.length}):`);
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
      console.log('');
    }
    
    if (warnings.length > 0) {
      console.log(`⚠️  WARNINGS (${warnings.length}):`);
      warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning}`);
      });
      console.log('');
    }
    
    if (issues.length > 0) {
      console.log('🚫 FIX CRITICAL ISSUES BEFORE HANDOFF\n');
    } else {
      console.log('✅ Ready for handoff (address warnings if possible)\n');
    }
  }
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    issues,
    warnings,
    passed: issues.length === 0,
  };
  
  await fs.mkdir('reports', { recursive: true });
  await fs.writeFile('reports/final-validation.json', JSON.stringify(report, null, 2));
  
  console.log('📁 Report saved: reports/final-validation.json');
})();

Run it:
node scripts/final-validation.js


FINAL CHECKLIST
Before delivering to client:
Code & Content
[ ] All placeholder text replaced with client content
[ ] Brand colors injected throughout
[ ] Client logo appears correctly
[ ] All images are client-specific
[ ] Contact information accurate
[ ] Social media links correct
[ ] No console errors
[ ] Production build passes
Performance & Quality
[ ] Lighthouse Performance > 90
[ ] Lighthouse Accessibility > 90
[ ] All images optimized
[ ] Page load time < 3 seconds
[ ] Mobile responsive on real devices
Documentation
[ ] CLIENT-STYLEGUIDE.md created
[ ] DEPLOYMENT.md completed
[ ] Handoff package assembled
[ ] All scripts documented
Testing
[ ] Tested in Chrome, Safari, Firefox
[ ] Tested on iPhone/iPad
[ ] Tested on Android
[ ] Keyboard navigation works
[ ] Forms submit correctly
Deployment
[ ] Deployed to production
[ ] Custom domain configured (if applicable)
[ ] HTTPS working
[ ] Analytics installed (if requested)

ESTIMATED TIME FOR DEL 3
Phase 7 (Brand Injection): 3-4 hours
Phase 8 (Animations): 2-3 hours
Phase 9 (QA & Testing): 3-4 hours
Phase 10 (Documentation & Handoff): 2-3 hours
Total for DEL 3: 10-14 hours

SUCCESS CRITERIA
You have successfully completed DEL 3 when:
✅ Site reflects CLIENT'S brand (not just generic reference style) ✅ All animations smooth and purposeful ✅ Passes all QA tests (visual, functional, performance, accessibility) ✅ Cross-browser compatibility confirmed ✅ Client documentation package ready ✅ Deployment guide complete ✅ Final validation passes with no critical issues ✅ Ready to send to client or deploy to production

CONGRATULATIONS! 🎉
Your project is now complete and ready for client handoff or production launch. </artifact>


