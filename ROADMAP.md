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
- [ ] Visual Comparison System (Phase 5)
- [ ] Component generation fra screenshots
- [ ] Accuracy scoring

#### Planlagt
- [ ] Version history og rollback
- [ ] Template Mode (mix sections fra flere sider)
- [ ] Export til standalone filer

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

## Milepæler

| Milepæl | Versjon | Status |
|---------|---------|--------|
| Design extraction fungerer | v1.0-alpha | ✅ Ferdig |
| Component generation | v1.0-beta | ✅ Ferdig |
| Visual comparison | v1.0-beta | ⏳ Neste |
| Version history | v1.0 | ⏳ Planlagt |
| Next.js boilerplate | v2.0 | 📋 Roadmap |
| One-click deploy | v2.0 | 📋 Roadmap |
| AI tekst & bilder | v3.0 | 📋 Roadmap |
| SEO-pakke | v3.0 | 📋 Roadmap |
| Mailgun integration | v3.0 | 📋 Roadmap |
| Vercel env setup | v3.0 | 📋 Roadmap |

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

---

## Feedback & Prioritering

Funksjoner kan omprioriteres basert på bruker-feedback. Opprett issues for feature requests.
