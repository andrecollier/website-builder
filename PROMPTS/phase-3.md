# Auto Claude Prompt - Phase 3

## Oppgave: Implementer Phase 3 av Website Cooker

Les først disse filene for full kontekst:
- PROJECT_PLAN.md (hovedplan med alle 8 faser)
- DESIGN_SYSTEM_EXTRACTION.md (detaljert bakgrunn for extraction)

Phase 1 (Dashboard) og Phase 2 (Playwright) er ferdige.

---

## Din oppgave: Phase 3 - Design System Extraction & Token Editor

### 3.1 Color Extraction
Lag `src/lib/design-system/color-extractor.ts`:

```typescript
interface ColorExtraction {
  primary: string[];      // Mest brukte aksent-farger
  secondary: string[];    // Sekundære farger
  neutral: string[];      // Grays, whites, blacks
  semantic: {
    success: string;
    error: string;
    warning: string;
    info: string;
  };
}
```

Extraction-logikk:
- Hent alle `background-color` og `color` fra computed styles
- Grupper farger etter frekvens og bruksområde
- Konverter til hex-format
- Beregn kontrast-ratio (WCAG AA: 4.5:1)
- Generer full palette (50-950 shades) fra hovedfargene

### 3.2 Typography Extraction
Lag `src/lib/design-system/typography-extractor.ts`:

```typescript
interface TypographyExtraction {
  fonts: {
    heading: string;      // Font family for headings
    body: string;         // Font family for body
    mono?: string;        // Monospace if found
  };
  scale: {
    display: string;      // Største heading
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    h6: string;
    body: string;
    small: string;
    xs: string;
  };
  weights: number[];      // [300, 400, 500, 600, 700]
  lineHeights: {
    tight: number;        // 1.1-1.2
    normal: number;       // 1.4-1.6
    relaxed: number;      // 1.7-2.0
  };
}
```

Extraction-logikk:
- Finn alle `font-family` verdier
- Ekstraher `font-size` fra h1-h6, p, span, etc.
- Konverter px til rem (base 16px)
- Finn `font-weight` og `line-height` patterns

### 3.3 Spacing Extraction
Lag `src/lib/design-system/spacing-extractor.ts`:

```typescript
interface SpacingExtraction {
  baseUnit: number;       // 4 eller 8
  scale: number[];        // [4, 8, 12, 16, 24, 32, 48, 64, 96]
  containerMaxWidth: string;
  sectionPadding: {
    mobile: string;
    desktop: string;
  };
}
```

Extraction-logikk:
- Analyser `padding`, `margin`, `gap` verdier
- Finn mønster (4pt grid, 8pt grid, etc.)
- Identifiser container max-width
- Finn section spacing patterns

### 3.4 Effects Extraction
Lag `src/lib/design-system/effects-extractor.ts`:

```typescript
interface EffectsExtraction {
  shadows: {
    sm: string;           // box-shadow verdier
    md: string;
    lg: string;
    xl: string;
  };
  radii: {
    sm: string;           // border-radius
    md: string;
    lg: string;
    full: string;
  };
  transitions: {
    fast: string;         // 150ms
    normal: string;       // 300ms
    slow: string;         // 500ms
  };
}
```

### 3.5 Design System Output
Lag `src/lib/design-system/synthesizer.ts`:

Kombiner alle extractions til ett design system:

```typescript
interface DesignSystem {
  meta: {
    sourceUrl: string;
    extractedAt: string;
    version: number;
  };
  colors: ColorExtraction;
  typography: TypographyExtraction;
  spacing: SpacingExtraction;
  effects: EffectsExtraction;
}
```

Generer også:
- `tailwind.config.js` med custom theme
- `globals.css` med CSS variables
- `design-system.json` for lagring

### 3.6 Token Editor UI
Lag `src/app/editor/page.tsx` med:

**Color Editor:**
- Visual color picker for hver farge
- Palette preview (alle shades)
- Kontrast-checker mot bakgrunn
- "Generate shades" knapp

**Typography Editor:**
- Font family dropdown (Google Fonts)
- Size slider for hver heading
- Weight selector
- Live preview av tekst

**Spacing Editor:**
- Visual box model display
- Drag-to-adjust spacing
- Grid unit selector (4px/8px)

**Effects Editor:**
- Shadow preview med sliders
- Border radius preview
- Transition timing curves

### 3.7 Live Preview Panel
Lag `src/components/Editor/LivePreview.tsx`:
- Viser sample komponenter med current tokens
- Updates instantly on token change
- Toggle: light/dark mode
- Responsive preview: mobile/tablet/desktop

### 3.8 Token Caching
Lag `src/lib/cache/token-cache.ts`:
- Cache ekstraherte tokens per domene
- 24 timer TTL
- Skip extraction hvis cache finnes
- Force re-extract option

### 3.9 Error Recovery
- Fallback verdier for manglende tokens
- Partial extraction (fortsett hvis noe feiler)
- Manual override i Token Editor
- Validation av alle verdier

---

## Filer som skal lages

```
src/lib/design-system/
├── color-extractor.ts
├── typography-extractor.ts
├── spacing-extractor.ts
├── effects-extractor.ts
├── synthesizer.ts
├── tailwind-generator.ts    # Generer tailwind.config
├── css-generator.ts         # Generer CSS variables
└── index.ts

src/app/editor/
└── page.tsx                 # Token Editor page

src/components/Editor/
├── TokenEditor.tsx          # Hovedkomponent
├── ColorEditor.tsx          # Farge-editing
├── ColorPicker.tsx          # Color picker widget
├── TypographyEditor.tsx     # Font-editing
├── SpacingEditor.tsx        # Spacing-editing
├── EffectsEditor.tsx        # Shadows, radius, etc.
├── LivePreview.tsx          # Real-time preview
└── index.ts

src/lib/cache/
├── token-cache.ts           # Token caching
└── index.ts
```

---

## Database Update

Legg til i schema:

```sql
CREATE TABLE design_tokens (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL,
  tokens_json TEXT NOT NULL,
  is_modified BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (website_id) REFERENCES websites(id)
);
```

---

## Deliverables

- [ ] Color extraction fungerer
- [ ] Typography extraction fungerer
- [ ] Spacing extraction fungerer
- [ ] Effects extraction fungerer
- [ ] Design system JSON genereres
- [ ] Tailwind config genereres fra tokens
- [ ] CSS variables genereres
- [ ] Token Editor UI med live preview
- [ ] Caching for tokens (24t TTL)
- [ ] Error recovery med fallbacks

---

## Test når ferdig

1. Kjør extraction på en URL
2. Åpne Token Editor (`/editor`)
3. Verifiser:
   - Farger vises korrekt
   - Typography scale er riktig
   - Live preview oppdateres ved endring
   - "Save & Continue" lagrer tokens
4. Sjekk at `design-system.json` genereres i website-mappen

---

## Viktig

- Extraction skjer via Playwright (gjenbruk Phase 2)
- Token Editor må være responsiv
- Alle endringer skal kunne resettes
- Preview må matche faktisk output
