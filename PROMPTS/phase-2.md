# Auto Claude Prompt - Phase 2

## Oppgave: Implementer Phase 2 av Website Cooker

Les først disse filene for full kontekst:
- PROJECT_PLAN.md (hovedplan med alle 8 faser)
- DESIGN_SYSTEM_EXTRACTION.md (detaljert bakgrunn for extraction)

Phase 1 er ferdig - dashboard, status bar og database er på plass.

---

## Din oppgave: Phase 2 - Playwright Integration & Anti-Lazy-Load

### 2.1 Installer Playwright
```bash
npm install -D playwright @playwright/test
npx playwright install chromium
```

### 2.2 Anti-Lazy-Load Script
Lag `src/lib/playwright/capture.ts` med:

```typescript
// KRITISK: Scroll hele siden for å trigge lazy-load
async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0); // Tilbake til toppen
          resolve();
        }
      }, 100);
    });
  });
}
```

Capture-funksjonen må:
1. Åpne URL med Playwright
2. Sette viewport til 1440x900
3. Scrolle hele siden (trigge lazy-load)
4. Vente på alle bilder (`img.complete`)
5. Vente på fonts (`document.fonts.ready`)
6. Vente 2 sekunder på animasjoner
7. Ta full-page screenshot

### 2.3 Section Detection
Lag `src/lib/playwright/section-detector.ts`:
- Identifiser seksjoner automatisk (header, hero, features, footer, etc.)
- Bruk semantiske HTML-tags (`<header>`, `<main>`, `<section>`, `<footer>`)
- Fallback til heuristikk (store div-er med mye innhold)
- Ta individuelle screenshots per seksjon
- Lagre bounding box koordinater

### 2.4 Screenshot Storage
Struktur for hver website:
```
Websites/website-XXX/
├── reference/
│   ├── full-page.png
│   ├── sections/
│   │   ├── 01-header.png
│   │   ├── 02-hero.png
│   │   ├── 03-features.png
│   │   └── ...
│   └── metadata.json
```

### 2.5 Caching System
Lag `src/lib/cache/screenshot-cache.ts`:
- Cache screenshots per domene
- 12 timers TTL (time-to-live)
- Sjekk cache før nye screenshots tas
- Manual cache clear funksjon

Struktur:
```
cache/
├── example.com/
│   ├── screenshots/
│   │   ├── full-page.png
│   │   └── sections/
│   ├── metadata.json
│   └── expires_at.txt
```

### 2.6 Error Recovery
- Retry logic: 3 forsøk ved timeout
- Partial capture: Fortsett hvis én seksjon feiler
- Mark failed sections for manual review
- Detaljert error logging til database

### 2.7 API Integration
Oppdater `/api/start-extraction/route.ts`:
- Start Playwright capture
- Send status updates via WebSocket eller polling
- Returner screenshot paths når ferdig

### 2.8 Status Updates
Integrer med eksisterende StatusBar:
- "Scrolling page to load all content..."
- "Waiting for images to load..."
- "Capturing section 3/7: Features..."
- "Screenshots saved successfully"

---

## Filer som skal lages/oppdateres

```
src/lib/playwright/
├── capture.ts           # Hovedlogikk for screenshot
├── scroll-loader.ts     # Anti lazy-load scroll
├── section-detector.ts  # Finn seksjoner automatisk
└── index.ts             # Exports

src/lib/cache/
├── screenshot-cache.ts  # Cache-logikk
└── index.ts

src/app/api/
├── start-extraction/
│   └── route.ts         # Oppdater med Playwright
└── capture-status/
    └── route.ts         # Ny: SSE for live status
```

---

## Tech Stack for Phase 2
- Playwright (chromium)
- Server-Sent Events (SSE) for live status updates

---

## Deliverables

- [ ] Playwright installert og konfigurert
- [ ] Anti-lazy-load scroll fungerer
- [ ] Section detection identifiserer seksjoner
- [ ] Full-page og section screenshots lagres
- [ ] Caching system fungerer
- [ ] Error recovery med retry logic
- [ ] Status updates vises i dashboard
- [ ] API routes oppdatert

---

## Test når ferdig

1. Start dashboard: `npm run dev`
2. Lim inn en URL (f.eks. https://stripe.com)
3. Klikk "Start Extraction"
4. Verifiser:
   - Status bar viser progress
   - Screenshots lagres i `Websites/website-001/reference/`
   - Alle seksjoner er fanget (ingen hvite/tomme bilder)

---

## Viktig

- Playwright skal kjøre i `headless: false` under utvikling (for debugging)
- Håndter CORS og cookie-popups hvis mulig
- Timeout på 30 sekunder per side
- Max 10 seksjoner per side (for ytelse)
