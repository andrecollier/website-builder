# Auto Claude Prompt - Phase 8

## Oppgave: Implementer Phase 8 av Website Cooker

Les først PROJECT_PLAN.md for full kontekst.

Phase 1-7 er ferdige.

---

## Din oppgave: Phase 8 - Final Assembly & Export

### 8.1 Page Assembler
Lag `src/lib/assembly/page-assembler.ts`:

```typescript
interface AssemblyConfig {
  websiteId: string;
  components: ApprovedComponent[];
  designTokens: DesignSystem;
  options: AssemblyOptions;
}

interface AssemblyOptions {
  includeInteractivity: boolean;    // JS functionality
  optimizeImages: boolean;
  generateSitemap: boolean;
  addAnalytics: boolean;
  seoMetadata: SEOMetadata;
}

interface AssembledPage {
  html: string;
  css: string;
  js?: string;
  assets: Asset[];
}

async function assemblePage(config: AssemblyConfig): Promise<AssembledPage> {
  // 1. Order components correctly
  const orderedComponents = orderByPosition(config.components);

  // 2. Generate page layout
  const layout = generateLayout(orderedComponents, config.designTokens);

  // 3. Add interactivity if enabled
  if (config.options.includeInteractivity) {
    await addInteractivity(layout);
  }

  // 4. Optimize for production
  const optimized = await optimizeForProduction(layout);

  return optimized;
}
```

### 8.2 Asset Handler
Lag `src/lib/assembly/asset-handler.ts`:

```typescript
interface Asset {
  type: 'image' | 'font' | 'icon' | 'video';
  originalUrl: string;
  localPath: string;
  optimizedPath?: string;
  size: number;
  dimensions?: { width: number; height: number };
}

async function processAssets(
  websiteId: string,
  components: Component[]
): Promise<Asset[]> {
  const assets: Asset[] = [];

  // 1. Extract all asset URLs from components
  const urls = extractAssetUrls(components);

  // 2. Download each asset
  for (const url of urls) {
    const asset = await downloadAsset(url, websiteId);
    assets.push(asset);
  }

  // 3. Optimize images
  const optimized = await optimizeImages(assets.filter(a => a.type === 'image'));

  // 4. Generate placeholders for stock photos (optional)
  // await generatePlaceholders(assets);

  return assets;
}

async function optimizeImages(images: Asset[]): Promise<Asset[]> {
  // Use sharp for optimization
  // - Resize to max dimensions
  // - Convert to WebP
  // - Generate srcset variants
  // - Lazy loading attributes
}
```

### 8.3 Interactivity Generator
Lag `src/lib/assembly/interactivity.ts`:

```typescript
type InteractiveElement =
  | 'dropdown'
  | 'modal'
  | 'accordion'
  | 'tabs'
  | 'carousel'
  | 'mobile_menu'
  | 'scroll_animations'
  | 'form_validation';

interface InteractivityConfig {
  elements: InteractiveElement[];
  framework: 'vanilla' | 'react';
}

async function addInteractivity(
  page: AssembledPage,
  config: InteractivityConfig
): Promise<AssembledPage> {
  // Detect interactive elements in components
  const detected = detectInteractiveElements(page);

  // Generate JS for each type
  for (const element of detected) {
    switch (element.type) {
      case 'dropdown':
        await addDropdownJS(page, element);
        break;
      case 'modal':
        await addModalJS(page, element);
        break;
      case 'mobile_menu':
        await addMobileMenuJS(page, element);
        break;
      // ... etc
    }
  }

  return page;
}
```

### 8.4 Export Options
Lag `src/lib/export/`:

#### Option A: Next.js Project
```typescript
async function exportAsNextJS(websiteId: string): Promise<string> {
  // Generate complete Next.js project
  // - package.json with dependencies
  // - next.config.js
  // - app/ directory structure
  // - components/
  // - public/ with assets
  // - tailwind.config.js
  // - README with setup instructions

  const outputPath = `exports/${websiteId}-nextjs/`;
  // ... generate files
  return outputPath;
}
```

#### Option B: Static HTML/CSS
```typescript
async function exportAsStatic(websiteId: string): Promise<string> {
  // Generate static site
  // - index.html
  // - styles.css (compiled Tailwind)
  // - scripts.js (if interactivity enabled)
  // - assets/ folder
  // - No build step required

  const outputPath = `exports/${websiteId}-static/`;
  // ... generate files
  return outputPath;
}
```

#### Option C: Components Only
```typescript
async function exportComponents(websiteId: string): Promise<string> {
  // Export just the components
  // - React components (.tsx)
  // - tailwind.config.js
  // - design-tokens.json
  // - README with usage instructions

  const outputPath = `exports/${websiteId}-components/`;
  // ... generate files
  return outputPath;
}
```

### 8.5 Export UI
Lag `src/app/export/[id]/page.tsx`:

```
┌─────────────────────────────────────────────────────────────┐
│  Export Website: Website 001                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Export Format:                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ○ Next.js Project (Recommended)                     │   │
│  │   Full Next.js 14 app, ready to deploy             │   │
│  │                                                     │   │
│  │ ○ Static HTML/CSS                                   │   │
│  │   No build step, works anywhere                    │   │
│  │                                                     │   │
│  │ ○ Components Only                                   │   │
│  │   Just React components + design tokens            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Options:                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [✓] Include JavaScript interactivity               │   │
│  │ [✓] Optimize images (WebP, lazy loading)           │   │
│  │ [✓] Generate sitemap.xml                           │   │
│  │ [ ] Add analytics placeholder                       │   │
│  │ [✓] Include README with setup instructions         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  SEO Metadata:                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Title: [________________________]                   │   │
│  │ Description: [________________________]             │   │
│  │ OG Image: [Auto-generated from hero]               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│         [ Preview ] [ Export & Download ]                   │
└─────────────────────────────────────────────────────────────┘
```

### 8.6 Quality Report
Lag `src/lib/export/quality-report.ts`:

```typescript
interface QualityReport {
  websiteId: string;
  generatedAt: Date;
  referenceUrl: string;
  version: string;

  // Accuracy
  overallAccuracy: number;
  sectionScores: { name: string; accuracy: number }[];

  // Components
  componentsGenerated: number;
  componentsApproved: number;
  componentsFailed: number;

  // Issues
  issuesFound: Issue[];
  issuesResolved: Issue[];
  issuesPending: Issue[];

  // Stats
  totalIterations: number;
  versionsCreated: number;
  exportFormat: string;

  // Recommendations
  recommendations: string[];
}

function generateQualityReport(websiteId: string): QualityReport {
  // Aggregate all data about the website generation
  // Format for human readability
}
```

Output format:
```
═══════════════════════════════════════════════════════════════
                    WEBSITE GENERATION REPORT
═══════════════════════════════════════════════════════════════

Reference:  https://fluence.framer.website/
Generated:  Websites/website-001/
Version:    v2.1
Export:     Next.js Project

───────────────────────────────────────────────────────────────
                         ACCURACY
───────────────────────────────────────────────────────────────

Overall Accuracy: 96.2%  ✓ EXCELLENT

Section Scores:
  • Header:        98.2%  ✓
  • Hero:          96.1%  ✓
  • Features:      95.4%  ✓
  • Testimonials:  94.8%  ✓
  • Footer:        96.5%  ✓

───────────────────────────────────────────────────────────────
                        COMPONENTS
───────────────────────────────────────────────────────────────

Generated:    5 components
Approved:     5 / 5  (100%)
Failed:       0
Manual Edits: 1 (Hero button color)

───────────────────────────────────────────────────────────────
                          ISSUES
───────────────────────────────────────────────────────────────

Resolved (3):
  ✓ [Medium] Hero button color adjusted
  ✓ [Low] Footer spacing fixed
  ✓ [Low] Feature card shadow tweaked

Pending (0):
  None! All issues resolved.

───────────────────────────────────────────────────────────────
                          STATS
───────────────────────────────────────────────────────────────

Refinement Iterations: 12
Versions Created:      3
Processing Time:       ~4 minutes

───────────────────────────────────────────────────────────────
                      EXPORT READY  ✓
───────────────────────────────────────════════════════════════
```

### 8.7 One-Click Preview
Lag preview-funksjonalitet:

```typescript
async function launchPreview(websiteId: string): Promise<string> {
  // 1. Build the website
  await buildWebsite(websiteId);

  // 2. Start local dev server
  const port = await findAvailablePort(3001);
  await startDevServer(websiteId, port);

  // 3. Return URL
  return `http://localhost:${port}`;
}
```

### 8.8 Download as ZIP
```typescript
async function downloadAsZip(websiteId: string): Promise<Buffer> {
  // 1. Run export
  const exportPath = await exportAsNextJS(websiteId);

  // 2. Create ZIP archive
  const zip = new JSZip();
  await addDirectoryToZip(zip, exportPath);

  // 3. Generate buffer
  return await zip.generateAsync({ type: 'nodebuffer' });
}
```

---

## Filer som skal lages

```
src/lib/assembly/
├── page-assembler.ts
├── asset-handler.ts
├── interactivity.ts
└── index.ts

src/lib/export/
├── nextjs-exporter.ts
├── static-exporter.ts
├── components-exporter.ts
├── quality-report.ts
├── zip-generator.ts
└── index.ts

src/app/export/
└── [id]/
    └── page.tsx

src/components/Export/
├── FormatSelector.tsx
├── OptionsPanel.tsx
├── SEOForm.tsx
├── QualityReportView.tsx
├── PreviewButton.tsx
├── DownloadButton.tsx
└── index.ts
```

---

## Deliverables

- [ ] Page assembler combines all components
- [ ] Asset handler downloads and optimizes images
- [ ] Interactivity generator adds JS functionality
- [ ] Export as Next.js project
- [ ] Export as static HTML/CSS
- [ ] Export as components only
- [ ] Export UI with options
- [ ] Quality report generation
- [ ] One-click preview
- [ ] Download as ZIP

---

## Test når ferdig

1. Fullfør en website med alle komponenter godkjent
2. Gå til `/export/[id]`
3. Test hver export-type:
   - Next.js: `npm install && npm run dev` skal fungere
   - Static: Åpne index.html i browser
   - Components: Import i eksisterende prosjekt
4. Verifiser:
   - Alle bilder inkludert og optimalisert
   - Interaktivitet fungerer (dropdowns, modals)
   - Quality report er nøyaktig
5. Download ZIP og verifiser innhold

---

## Viktig

- Eksportert kode skal være produksjonsklar
- Ingen hardkodede paths eller secrets
- README med klare instruksjoner
- Optimaliserte assets (WebP, lazy loading)
- SEO-vennlig output
