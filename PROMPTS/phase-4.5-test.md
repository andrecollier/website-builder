# Auto Claude Prompt - Phase 4.5 (End-to-End Test)

## Oppgave: Test hele Website Cooker pipeline med ekte URL

Dette er en **test-fase**, ikke en bygge-fase. Målet er å verifisere at Phase 1-4 fungerer sammen, og fikse eventuelle bugs.

**Test-URL:** https://fluence.framer.website/

---

## Steg 1: Verifiser at prosjektet starter

```bash
cd /Users/andrecollier/Personal/website-builder
npm install
npm run dev
```

Forventet resultat:
- [ ] Ingen build errors
- [ ] Server starter på localhost:3000
- [ ] Dashboard vises i browser

**Hvis det feiler:** Fiks build errors først.

---

## Steg 2: Test Screenshot Capture (Phase 2)

Manuelt eller via API, trigger extraction på:
```
https://fluence.framer.website/
```

Verifiser:
- [ ] Playwright åpner browser
- [ ] Siden scrolles (anti-lazy-load)
- [ ] Full-page screenshot lagres
- [ ] Section screenshots lagres
- [ ] Ingen tomme/hvite bilder

Forventet output:
```
Websites/website-001/
├── reference/
│   ├── full-page.png
│   └── sections/
│       ├── 01-header.png
│       ├── 02-hero.png
│       └── ...
```

**Hvis det feiler:** Debug Playwright-scriptet. Vanlige issues:
- Timeout (øk timeout)
- Lazy-load ikke trigget (juster scroll-script)
- CORS/cookie popups (håndter med Playwright)

---

## Steg 3: Test Design System Extraction (Phase 3)

Verifiser at tokens ekstraheres fra Fluence-siden:

- [ ] Farger ekstraheres (primary, secondary, neutral)
- [ ] Typography ekstraheres (fonts, sizes, weights)
- [ ] Spacing ekstraheres (padding, margin patterns)
- [ ] Effects ekstraheres (shadows, border-radius)

Forventet output:
```
Websites/website-001/
├── design-system.json
├── tailwind.config.js (generated)
└── globals.css (generated)
```

Sjekk at `design-system.json` inneholder reelle verdier, ikke placeholders:
```json
{
  "colors": {
    "primary": ["#actual-hex-value", ...]
  },
  "typography": {
    "fonts": {
      "heading": "Actual Font Name",
      "body": "Actual Font Name"
    }
  }
}
```

**Hvis det feiler:** Debug extractors. Vanlige issues:
- Computed styles ikke hentet
- Feil CSS selectors
- Font-detection feiler

---

## Steg 4: Test Token Editor UI (Phase 3)

Gå til `/editor` i browser:

- [ ] Farger vises med color pickers
- [ ] Typography vises med font info
- [ ] Live preview oppdateres ved endring
- [ ] "Save & Continue" fungerer

**Hvis det feiler:** Debug Editor-komponenter.

---

## Steg 5: Test Component Detection (Phase 4)

Verifiser at seksjoner detekteres fra Fluence-siden:

- [ ] Header/Navigation detektert
- [ ] Hero section detektert
- [ ] Features/content sections detektert
- [ ] Footer detektert

Forventet: Minst 4-6 seksjoner identifisert.

**Hvis det feiler:** Debug component-detector. Kanskje:
- Heuristikk matcher ikke Framer-struktur
- Semantiske tags mangler
- Bounding boxes feil

---

## Steg 6: Test Component Generation (Phase 4)

Verifiser at React-komponenter genereres:

- [ ] 3 varianter per komponent (A, B, C)
- [ ] Koden er gyldig TypeScript/React
- [ ] Tailwind classes brukes (ikke inline styles)
- [ ] Props interface definert

Forventet output:
```
Websites/website-001/current/src/components/
├── Header/
│   ├── Header.tsx
│   └── variants/
├── Hero/
├── Features/
└── Footer/
```

**Hvis det feiler:** Debug component-generator.

---

## Steg 7: Test Preview UI (Phase 4)

Gå til `/preview/[website-id]`:

- [ ] Komponenter vises
- [ ] Varianter kan velges
- [ ] Code viewer fungerer
- [ ] Approve workflow fungerer

**Hvis det feiler:** Debug Preview-komponenter.

---

## Steg 8: Dokumenter resultater

Lag en fil `TEST_RESULTS.md` med:

```markdown
# Phase 4.5 Test Results

**Test URL:** https://fluence.framer.website/
**Test dato:** [dato]

## Resultater

| Test | Status | Notater |
|------|--------|---------|
| Build & Start | ✅/❌ | |
| Screenshot Capture | ✅/❌ | |
| Design Extraction | ✅/❌ | |
| Token Editor | ✅/❌ | |
| Component Detection | ✅/❌ | |
| Component Generation | ✅/❌ | |
| Preview UI | ✅/❌ | |

## Bugs funnet og fikset

1. [Bug beskrivelse] - [Hvordan fikset]
2. ...

## Bugs som gjenstår

1. [Bug beskrivelse] - [Mulig løsning]
2. ...

## Screenshots

[Legg ved screenshots av fungerende deler]

## Klar for Phase 5?

[ ] Ja - alt fungerer
[ ] Nei - følgende må fikses først: ...
```

---

## Steg 9: Fiks bugs

For hver bug som oppdages:
1. Identifiser root cause
2. Implementer fix
3. Test på nytt
4. Commit med beskrivende melding

---

## Forventet utfall

Etter Phase 4.5 skal:
- ✅ Hele pipeline fungere end-to-end
- ✅ Fluence-siden være captured og analysert
- ✅ Komponenter være generert og visbare
- ✅ Alle kritiske bugs være fikset
- ✅ `TEST_RESULTS.md` dokumentere status

---

## Viktig

- **Ikke** bygg nye features
- **Kun** test og fiks eksisterende
- Dokumenter ALT som ikke fungerer
- Prioriter kritiske bugs over nice-to-have
- Commit ofte med "[test]" eller "[fix]" prefix
