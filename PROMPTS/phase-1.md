# Auto Claude Prompt - Phase 1

## Oppgave: Implementer Phase 1 av Website Cooker

Les først disse filene for full kontekst:
- PROJECT_PLAN.md (hovedplan med alle 8 faser)
- DESIGN_SYSTEM_EXTRACTION.md (bakgrunn for hva systemet skal gjøre)

---

## Prosjektbeskrivelse

Website Cooker er en localhost-basert website builder som:
1. Tar en referanse-URL
2. Ekstraherer design systemet (farger, typografi, spacing)
3. Genererer en pixel-perfekt kopi med React/Tailwind
4. Sammenligner visuelt for nøyaktighet

---

## Din oppgave: Phase 1 - Project Setup & Dashboard

### 1.1 Initialize Next.js Project
- Next.js 14 med App Router
- TypeScript
- Tailwind CSS
- ESLint + Prettier
- SQLite database (bruk better-sqlite3 eller drizzle-orm)

### 1.2 Dashboard UI
Bygg et minimalistisk dark-mode dashboard med:
- Stort, sentrert URL input felt
- "Start Extraction" knapp
- "Template Mode" toggle
- Liste over tidligere genererte websites

### 1.3 Status Bar System
- Real-time progress indicator (1/8, 2/8, etc.)
- Sub-status tekst for hver fase
- Error Recovery panel

### 1.4 Template Mode UI
- Mulighet for flere referanse-URLer
- Section picker (velg header fra site A, hero fra site B)
- Drag-and-drop reordering

### 1.5 Database Setup
Initialiser SQLite med websites-tabellen:

```sql
CREATE TABLE websites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  reference_url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  current_version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'in_progress'
);
```

### 1.6 API Routes
Opprett placeholder API routes:
- /api/start-extraction
- /api/status

---

## Tech Stack
- Next.js 14 + React 18 + TypeScript
- Tailwind CSS
- Zustand (state management)
- Radix UI (UI komponenter)
- better-sqlite3 eller drizzle-orm

---

## Mappestruktur

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── template/
│   │   └── page.tsx          # Template Mode
│   ├── api/
│   │   ├── start-extraction/
│   │   │   └── route.ts
│   │   └── status/
│   │       └── route.ts
│   └── layout.tsx
├── components/
│   ├── Dashboard/
│   │   ├── UrlInput.tsx
│   │   ├── StatusBar.tsx
│   │   ├── PhaseIndicator.tsx
│   │   ├── ProjectList.tsx
│   │   └── ErrorRecoveryPanel.tsx
│   ├── Template/
│   │   ├── ReferenceList.tsx
│   │   ├── SectionPicker.tsx
│   │   └── MixerCanvas.tsx
│   └── ui/
├── lib/
│   └── store.ts              # Zustand store
├── db/
│   ├── schema.ts
│   └── client.ts
└── types/
    └── index.ts
```

---

## Deliverables

- [ ] Fungerende dashboard på localhost:3000
- [ ] URL validering
- [ ] Status bar komponent
- [ ] Template Mode interface
- [ ] API routes struktur
- [ ] SQLite database initialized

---

## Viktig

- Følg mappestrukturen i PROJECT_PLAN.md
- Dark mode som standard
- Responsiv design
- Ren, moderne UI
- Ikke installer Playwright ennå (det er Phase 2)
