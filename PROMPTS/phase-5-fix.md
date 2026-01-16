# Auto Claude Prompt - Phase 5 Fix: Screenshot Capture

## Kontekst

Phase 5 (Visual Comparison System) er implementert, men har en kritisk bug i screenshot-capture som gjør at kun 1 av 10 seksjoner blir fanget.

### Nåværende Status
- ✅ Pixelmatch integration fungerer
- ✅ API endpoints (`/api/compare`) fungerer
- ✅ Compare Dashboard UI fungerer
- ✅ Side-by-side og Diff view modes eksisterer
- ❌ Screenshot capture feiler for seksjon 2-10
- ❌ View mode tabs (Side-by-Side, Overlay, Diff) vises ikke i UI

---

## Problem 1: Screenshot Capture Failure

### Feilmelding
```
Error capturing section 2-10: page.screenshot: Clipped area is either empty or outside the resulting image
```

### Rotårsak
Filen `src/lib/comparison/compare-section.ts` bruker bounding boxes fra original metadata:

```
Section 1: y=0, height=1440
Section 2: y=1440, height=1440
Section 3: y=2880, height=1440
...
Section 10: y=12960, height=1434
Total original page height: 14394px
```

Men den genererte siden er mye kortere (kun ~5000px) fordi:
1. Kun 5 komponenter er generert (FAQ, Features, Header, Pricing, Testimonials)
2. Komponentene er placeholder-templates (nesten tomme)

Når Playwright prøver å ta screenshot på y=1440+, finnes ikke den posisjonen.

### Løsning

Endre `captureGeneratedScreenshots()` i `src/lib/comparison/compare-section.ts` til å:

1. **Ikke bruke metadata bounding boxes** - de refererer til original site
2. **Finne komponenter via DOM** - bruk CSS selectors eller data-attributes
3. **Ta full-page screenshot og slice** - alternativ tilnærming

#### Foreslått implementasjon (Alternativ A - DOM-basert):

```typescript
export async function captureGeneratedScreenshots(options: CaptureOptions): Promise<string[]> {
  // ... setup code ...

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: viewportWidth, height: viewportHeight },
    });
    const page = await context.newPage();

    await page.goto(generatedSiteUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(2000);

    // NY TILNÆRMING: Finn komponenter via DOM istedenfor metadata
    // Finn alle direkte children av main element
    const componentHandles = await page.$$('main > *');

    for (let i = 0; i < componentHandles.length; i++) {
      const handle = componentHandles[i];
      const boundingBox = await handle.boundingBox();

      if (!boundingBox) continue;

      // Match med reference section basert på index
      // (eller bruk data-section attribute hvis tilgjengelig)
      const sectionIndex = i;
      if (sectionIndex >= sections.length) break;

      const section = sections[sectionIndex];
      const sectionNumber = String(sectionIndex + 1).padStart(2, '0');
      const filename = `${sectionNumber}-${section.type}.png`;
      const outputPath = path.join(outputDir, filename);

      try {
        // Scroll til komponent
        await handle.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);

        // Ta screenshot av denne komponenten
        await handle.screenshot({
          path: outputPath,
          type: 'png',
        });

        capturedPaths.push(outputPath);
        console.log(`Captured: ${filename}`);
      } catch (error) {
        console.error(`Error capturing component ${i + 1}:`, error);
      }
    }
  } finally {
    if (browser) await browser.close();
  }

  return capturedPaths;
}
```

#### Foreslått implementasjon (Alternativ B - Full-page slice):

```typescript
export async function captureGeneratedScreenshots(options: CaptureOptions): Promise<string[]> {
  // ... setup code ...

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(generatedSiteUrl, { waitUntil: 'networkidle' });

    // Ta full-page screenshot
    const fullPagePath = path.join(outputDir, 'full-page.png');
    await page.screenshot({
      path: fullPagePath,
      fullPage: true,
    });

    // Hent faktiske DOM-posisjoner for hver komponent
    const componentBounds = await page.evaluate(() => {
      const components: Array<{ y: number; height: number }> = [];
      const mainChildren = document.querySelector('main')?.children || [];

      Array.from(mainChildren).forEach((el) => {
        const rect = el.getBoundingClientRect();
        const scrollY = window.scrollY;
        components.push({
          y: rect.top + scrollY,
          height: rect.height,
        });
      });

      return components;
    });

    // Bruk sharp til å slice full-page image
    const sharp = require('sharp');

    for (let i = 0; i < Math.min(componentBounds.length, sections.length); i++) {
      const bounds = componentBounds[i];
      const section = sections[i];
      const sectionNumber = String(i + 1).padStart(2, '0');
      const filename = `${sectionNumber}-${section.type}.png`;
      const outputPath = path.join(outputDir, filename);

      await sharp(fullPagePath)
        .extract({
          left: 0,
          top: Math.round(bounds.y),
          width: viewportWidth,
          height: Math.round(bounds.height),
        })
        .toFile(outputPath);

      capturedPaths.push(outputPath);
      console.log(`Captured: ${filename}`);
    }

    // Slett full-page temp fil
    fs.unlinkSync(fullPagePath);

  } finally {
    if (browser) await browser.close();
  }

  return capturedPaths;
}
```

---

## Problem 2: View Mode Tabs Ikke Synlige

### Observasjon fra tests
```
[INFO] Side-by-Side tab: false
[INFO] Overlay tab: false
[INFO] Diff tab: false
```

### Filer å sjekke
- `src/components/Comparison/SectionComparison.tsx` - Hovedkomponenten
- `src/components/Comparison/SideBySideView.tsx`
- `src/components/Comparison/OverlayView.tsx`
- `src/components/Comparison/DiffView.tsx`

### Mulig årsak
View mode tabs er kanskje ikke inkludert i SectionComparison komponenten, eller de har feil CSS som gjør dem usynlige.

---

## Problem 3: Bilde API

### Observasjon
```
[INFO] Images in Side-by-Side view: 0
```

Bildene lastes ikke. Sjekk at `/api/image` endpoint fungerer korrekt.

### Fil å sjekke
- `src/app/api/image/route.ts`

---

## Testkommandoer

Kjør testene for å verifisere fixes:

```bash
# Kjør Phase 5 tester (17 tester)
npm run test:phase5

# Se detaljert rapport
npm run test:report

# Kjør diagnostikk script
npm run diagnose:phase5
```

### Forventet resultat etter fix
- Alle 10 seksjoner skal ha generert screenshot
- View mode tabs skal være synlige
- Bilder skal lastes i Side-by-Side view
- Accuracy skal fortsatt være lav (~10%) fordi komponenter er placeholders - dette er OK

---

## Filer som skal endres

1. **`src/lib/comparison/compare-section.ts`**
   - Endre `captureGeneratedScreenshots()` til å bruke DOM-basert capture
   - Ikke bruk metadata bounding boxes

2. **`src/components/Comparison/SectionComparison.tsx`**
   - Legg til view mode tabs (Side-by-Side, Overlay, Diff)
   - Sørg for at de er synlige

3. **`src/app/api/image/route.ts`** (hvis nødvendig)
   - Verifiser at bildene serveres korrekt

---

## Test website

Bruk denne websiten for testing:
```
Website ID: website-58f08468-e52f-47b2-a853-423fd8938e5a
URL: https://fluence.framer.website/
```

### Testprosedyre
1. Start dev server: `npm run dev`
2. Åpne: http://localhost:3002/compare/website-58f08468-e52f-47b2-a853-423fd8938e5a
3. Klikk "Force Recapture"
4. Verifiser at alle 10 seksjoner får screenshots
5. Verifiser at view mode tabs fungerer

---

## Deliverables

- [ ] Screenshot capture fungerer for alle seksjoner (eller så mange som finnes på generert side)
- [ ] View mode tabs er synlige og fungerer
- [ ] Bilder lastes korrekt i comparison view
- [ ] Alle 17 Phase 5 tester passerer
- [ ] Ingen errors i server log ved screenshot capture

---

## Viktig

- **IKKE** endre accuracy-beregningen - den er korrekt
- **IKKE** endre Phase 4 (component generation) - det er en separat oppgave
- Fokuser kun på å fikse screenshot capture og UI-visning
- Test med `npm run test:phase5` etter hver endring
