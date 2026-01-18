# Website Cooker - Roadmap

## Versjonsoversikt

### v1.0 - Design Extraction (Nåværende fokus)
**Mål:** Ekstrahere design fra referanse-URLer og skjermbilder

#### Ferdig
- [x] Dashboard med URL input
- [x] Playwright integration med anti-lazy-load
- [x] Screenshot capture (full-page + seksjoner)
- [x] Design system extraction (farger, fonts, spacing)
- [x] Section detection med viewport-basert fallback
- [x] Token Editor UI

#### Under utvikling
- [x] Visual Comparison System (Phase 5) - UI ferdig, screenshot capture bug gjenstår
- [x] Component generation fra screenshots (placeholder-templates)
- [x] Accuracy scoring (Pixelmatch integration)
- [ ] Phase 5 fix: DOM-basert screenshot capture

#### Planlagt
- [ ] Version history og rollback
- [ ] Template Mode (mix sections fra flere sider)
- [ ] Export til standalone filer
- [ ] Dev Server Management i Dashboard
  - Start/stopp dev servere fra UI
  - Swap mellom preview av ulike genererte prosjekter
  - Automatisk port-allokering (unngå konflikter)
  - Status-indikatorer for kjørende servere

---

### v2.0 - Next.js Integration (Fremtidig)
**Mål:** Implementere genererte React-komponenter direkte inn i en Next.js boilerplate

#### Planlagte features
- [ ] Next.js boilerplate template
  - App Router struktur
  - Tailwind CSS pre-konfigurert
  - TypeScript setup
  - Optimaliserte default-innstillinger

- [ ] Automatisk prosjekt-scaffolding
  - Opprett nytt Next.js prosjekt fra template
  - Kopier genererte komponenter til riktig mappe
  - Sett opp routing automatisk

- [ ] Design tokens integration
  - Generer tailwind.config.js fra ekstraherte tokens
  - CSS variables for runtime theming
  - Font-loading setup

- [ ] Component Library
  - Standardiserte props interfaces
  - Storybook integration
  - Dokumentasjon auto-generert

- [ ] One-click deploy
  - Vercel integration
  - Preview deployments
  - Environment variables

---

### v3.0 - Content & Production Package (Fremtidig)
**Mål:** Komplett innholdspakke for produksjonsklare nettsider

#### Planlagte features
- [ ] **Tekst & Innhold**
  - AI-generert tekst basert på bransje/niche
  - Placeholder-tekst erstatning
  - Flerspråklig støtte
  - Content management integration

- [ ] **Bildegenerering**
  - AI-genererte bilder for seksjoner
  - Stock photo integration
  - Bilde-optimalisering (WebP, lazy-load)
  - Automatisk alt-tekst

- [ ] **SEO-pakke**
  - Meta tags auto-generering
  - Open Graph / Twitter Cards
  - Sitemap.xml generering
  - robots.txt
  - Structured data (JSON-LD)
  - Lighthouse score optimalisering

- [ ] **E-post Integration (Mailgun)**
  - Kontaktskjema backend
  - Newsletter signup
  - Transactional emails
  - Email templates

- [ ] **Vercel Environment Setup**
  - Automatisk environment variables
  - API keys management
  - Production/Preview/Development miljøer
  - Domain configuration
  - Analytics integration

---

### v4.0 - AI Image Asset Recreation (Fremtidig)
**Mål:** Ekstrahere og gjenskape bilde-assets med AI (Nano Banana Pro)

#### Konsept
Alle bilder som ekstraheres fra referanse-URLer lagres som detaljerte prompts som senere kan gjenskapes med AI-bildegenerering. Dette gjør det mulig å:
- Erstatte stock-bilder med unike, merkevare-tilpassede bilder
- Generere nye bilder basert på eksisterende design-stil
- Tilpasse bilder til spesifikk brand identity

#### Planlagte features
- [ ] **Image Prompt Extraction**
  - Analysere bilder fra referanse-URL
  - Generere detaljerte text-to-image prompts
  - Lagre prompts sammen med original metadata
  - Kategorisere bilder (hero, product, team, icons, etc.)
  - **Asset Metadata Capture:**
    - Bildestørrelse (width, height, aspect ratio)
    - Border radius (rounded corners)
    - Object-fit og object-position
    - Shadow og filter effekter
    - Mask og clip-path
    - Overlay og gradient overlays

- [ ] **Prompt Generation Factors**
  - **Brand/Innhold**: Tilpasse prompts basert på bransje og merkevare
  - **Fargepalett**: Integrere design system farger i prompts
  - **Kunststil**: Identifisere og matche visuell stil (minimal, corporate, playful, etc.)
  - **Ikon-stil**: Line icons, filled, 3D, isometric, etc.
  - **Foto-stil**: Stock, editorial, lifestyle, product photography

- [ ] **Realisme-parametre**
  - Kamera-innstillinger (focal length, aperture, DOF)
  - Lyssetting (natural, studio, dramatic, soft)
  - Komposisjon og framing
  - Post-processing stil (film grain, color grading)

- [ ] **Custom Prompt Override**
  - Manuell redigering av genererte prompts
  - Prompt templates per kategori
  - Brand guideline integration
  - A/B testing av ulike prompts

- [ ] **Nano Banana Pro Integration**
  - API-kobling for bildegenerering
  - Batch-generering av alle assets
  - Varianter per bilde (3-5 alternativer)
  - Kvalitetskontroll og scoring

- [ ] **Asset Management**
  - Versjonering av genererte bilder
  - Sammenligning original vs generert
  - Export i multiple formater/størrelser
  - CDN-optimalisert lagring

---

## Milepæler

| Milepæl | Versjon | Status |
|---------|---------|--------|
| Design extraction fungerer | v1.0-alpha | ✅ Ferdig |
| Component generation | v1.0-beta | ✅ Ferdig |
| Visual comparison UI | v1.0-beta | ✅ Ferdig |
| Visual comparison fix | v1.0-beta | ⏳ Neste (screenshot capture bug) |
| Version history | v1.0 | ⏳ Planlagt |
| Next.js boilerplate | v2.0 | 📋 Roadmap |
| One-click deploy | v2.0 | 📋 Roadmap |
| AI tekst & bilder | v3.0 | 📋 Roadmap |
| SEO-pakke | v3.0 | 📋 Roadmap |
| Mailgun integration | v3.0 | 📋 Roadmap |
| Vercel env setup | v3.0 | 📋 Roadmap |
| Image prompt extraction | v4.0 | 📋 Roadmap |
| Nano Banana Pro integration | v4.0 | 📋 Roadmap |
| Asset management | v4.0 | 📋 Roadmap |

---

## Teknisk arkitektur

### v1.0
```
Reference URL → Playwright → Screenshots → Design Tokens → Component Code
```

### v2.0
```
Component Code → Next.js Boilerplate → Configured Project → Deploy
```

### v3.0
```
Generated Site → AI Content → SEO Optimization → Email Integration → Production Ready
```

### v4.0
```
Extracted Images → Vision AI Analysis → Prompt Generation → Nano Banana Pro → Brand-Matched Assets
                                              ↓
                        [Brand Guidelines, Colors, Style, Camera Settings]
```

---

## Feedback & Prioritering

Funksjoner kan omprioriteres basert på bruker-feedback. Opprett issues for feature requests.
