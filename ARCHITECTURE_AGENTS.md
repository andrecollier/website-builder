# Website Cooker - Multi-Agent Architecture

## Hvorfor Multi-Agent?

Website Cooker har flere distinkte oppgaver som kan dra nytte av spesialiserte agenter:

| Problem med Single Agent | Løsning med Multi-Agent |
|--------------------------|-------------------------|
| Én agent må holde alt i kontekst | Hver agent har fokusert kontekst |
| Sekvensiell prosessering | Parallell prosessering mulig |
| Vanskelig å debugge | Isolerte, testbare agenter |
| "Jack of all trades" | Spesialiserte eksperter |

---

## Foreslått Agent-Arkitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT                        │
│                                                             │
│  Ansvar:                                                    │
│  - Koordinerer hele pipeline                                │
│  - Holder state/progress                                    │
│  - Delegerer til sub-agents                                 │
│  - Håndterer feil og retries                               │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  CAPTURE AGENT  │  │ EXTRACTOR AGENT │  │ GENERATOR AGENT │
│                 │  │                 │  │                 │
│  - Playwright   │  │  - Colors       │  │  - Components   │
│  - Screenshots  │  │  - Typography   │  │  - Variants     │
│  - Lazy-load    │  │  - Spacing      │  │  - React/TSX    │
│  - Sections     │  │  - Effects      │  │  - Tailwind     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
                   ┌─────────────────┐
                   │ COMPARATOR AGENT│
                   │                 │
                   │  - Visual diff  │
                   │  - Accuracy     │
                   │  - Refinement   │
                   └─────────────────┘
```

---

## Agent Definisjoner

### 1. Orchestrator Agent (Hovedagent)

**Rolle:** Dirigent som koordinerer hele prosessen

```typescript
interface OrchestratorAgent {
  role: "orchestrator";
  responsibilities: [
    "Parse user request (URL input)",
    "Create execution plan",
    "Delegate to sub-agents",
    "Track progress",
    "Handle errors and retries",
    "Aggregate results",
    "Report to user"
  ];
  context: {
    currentWebsiteId: string;
    pipelineState: PipelineState;
    agentResults: Map<AgentType, Result>;
  };
}
```

**Input:** URL fra bruker
**Output:** Ferdig generert website

---

### 2. Capture Agent

**Rolle:** Ekspert på å fange nettsider visuelt

```typescript
interface CaptureAgent {
  role: "capture";
  tools: [
    "playwright_browser",
    "screenshot_taker",
    "scroll_controller",
    "section_detector"
  ];
  responsibilities: [
    "Open URL in browser",
    "Handle lazy-loading",
    "Wait for fonts/images",
    "Detect page sections",
    "Take full-page screenshot",
    "Take per-section screenshots",
    "Handle popups/modals"
  ];
  context: {
    url: string;
    viewport: { width: number; height: number };
    screenshotPaths: string[];
  };
}
```

**Input:** URL
**Output:** Screenshots + section metadata

---

### 3. Extractor Agent

**Rolle:** Ekspert på å analysere design systemer

```typescript
interface ExtractorAgent {
  role: "extractor";
  tools: [
    "style_analyzer",
    "color_extractor",
    "typography_analyzer",
    "spacing_calculator"
  ];
  responsibilities: [
    "Extract computed styles",
    "Identify color palette",
    "Detect typography scale",
    "Calculate spacing patterns",
    "Identify effects (shadows, radius)",
    "Generate design tokens",
    "Create Tailwind config"
  ];
  context: {
    pageStyles: ComputedStyles;
    extractedTokens: DesignSystem;
  };
}
```

**Input:** Page DOM + computed styles
**Output:** design-system.json + tailwind.config.js

---

### 4. Generator Agent

**Rolle:** Ekspert på å generere React-komponenter

```typescript
interface GeneratorAgent {
  role: "generator";
  tools: [
    "code_generator",
    "component_templates",
    "tailwind_converter",
    "typescript_validator"
  ];
  responsibilities: [
    "Analyze section screenshot",
    "Identify component type",
    "Generate React/TSX code",
    "Apply design tokens",
    "Create 3 variants (A/B/C)",
    "Ensure TypeScript validity",
    "Add accessibility attributes"
  ];
  context: {
    sectionScreenshot: string;
    designTokens: DesignSystem;
    componentType: ComponentType;
  };
}
```

**Input:** Section screenshot + design tokens
**Output:** React components (3 variants)

---

### 5. Comparator Agent

**Rolle:** Ekspert på visuell kvalitetssikring

```typescript
interface ComparatorAgent {
  role: "comparator";
  tools: [
    "pixelmatch",
    "screenshot_renderer",
    "diff_analyzer",
    "auto_refiner"
  ];
  responsibilities: [
    "Render generated component",
    "Take screenshot of rendered",
    "Compare with original",
    "Calculate accuracy score",
    "Identify mismatches",
    "Suggest refinements",
    "Auto-fix minor issues"
  ];
  context: {
    originalScreenshot: string;
    generatedScreenshot: string;
    accuracyThreshold: number;
  };
}
```

**Input:** Original + generated screenshots
**Output:** Accuracy score + diff + refinement suggestions

---

## Kommunikasjon mellom Agenter

### Message Protocol

```typescript
interface AgentMessage {
  from: AgentType;
  to: AgentType;
  type: "request" | "response" | "error";
  payload: any;
  correlationId: string;
  timestamp: Date;
}

// Eksempel: Orchestrator → Capture
{
  from: "orchestrator",
  to: "capture",
  type: "request",
  payload: {
    action: "capture_url",
    url: "https://fluence.framer.website/",
    options: {
      viewport: { width: 1440, height: 900 },
      waitForFonts: true
    }
  },
  correlationId: "job-001",
  timestamp: "2024-01-15T12:00:00Z"
}
```

### Context Sharing

```typescript
interface SharedContext {
  websiteId: string;
  referenceUrl: string;
  screenshotPaths: {
    fullPage: string;
    sections: Record<string, string>;
  };
  designTokens: DesignSystem;
  generatedComponents: GeneratedComponent[];
  comparisonResults: ComparisonResult[];
}
```

---

## Pipeline Flow

```
User Input: "https://fluence.framer.website/"
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ ORCHESTRATOR: Parse URL, create job, initialize pipeline    │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼ dispatch("capture", { url })
┌─────────────────────────────────────────────────────────────┐
│ CAPTURE AGENT: Open browser, scroll, take screenshots       │
│ Return: { fullPage: "...", sections: [...] }               │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼ dispatch("extractor", { dom, styles })
┌─────────────────────────────────────────────────────────────┐
│ EXTRACTOR AGENT: Analyze styles, extract tokens             │
│ Return: { designSystem: {...}, tailwindConfig: "..." }     │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼ parallel for each section
┌─────────────────────────────────────────────────────────────┐
│ GENERATOR AGENT (x N): Generate components per section      │
│ Return: { components: [variantA, variantB, variantC] }     │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼ parallel for each component
┌─────────────────────────────────────────────────────────────┐
│ COMPARATOR AGENT (x N): Compare and refine                  │
│ Return: { accuracy: 96.2, diff: "...", refined: "..." }    │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ ORCHESTRATOR: Aggregate results, save to DB, notify user    │
└─────────────────────────────────────────────────────────────┘
```

---

## Fordeler med denne arkitekturen

### 1. Parallellisering
```
Uten agents:  Capture → Extract → Generate → Compare (sekvensiell)
Med agents:   Capture → Extract → [Generate x 5 parallel] → [Compare x 5 parallel]
```

### 2. Spesialisert kontekst
- Capture Agent trenger bare vite om Playwright
- Generator Agent trenger bare screenshots + tokens
- Ingen agent trenger hele konteksten

### 3. Feilhåndtering
```typescript
// Orchestrator kan retry spesifikke agenter
if (generatorResult.failed) {
  await dispatch("generator", task, { retry: true, variant: "simplified" });
}
```

### 4. Skalerbarhet
- Flere Generator Agents kan kjøre parallelt
- Flere Comparator Agents kan kjøre parallelt
- Lett å legge til nye spesialiserte agenter

---

## Implementasjon med Claude Agent SDK

### Fil-struktur

```
src/agents/
├── orchestrator/
│   ├── agent.ts
│   ├── planner.ts
│   └── state-machine.ts
├── capture/
│   ├── agent.ts
│   ├── tools/
│   │   ├── playwright.ts
│   │   ├── scroll.ts
│   │   └── section-detect.ts
│   └── prompts/
├── extractor/
│   ├── agent.ts
│   ├── tools/
│   │   ├── color-extract.ts
│   │   ├── typography-extract.ts
│   │   └── spacing-extract.ts
│   └── prompts/
├── generator/
│   ├── agent.ts
│   ├── tools/
│   │   ├── code-gen.ts
│   │   ├── variant-gen.ts
│   │   └── validate.ts
│   └── prompts/
├── comparator/
│   ├── agent.ts
│   ├── tools/
│   │   ├── pixelmatch.ts
│   │   ├── diff-analyze.ts
│   │   └── auto-refine.ts
│   └── prompts/
├── shared/
│   ├── context.ts
│   ├── messages.ts
│   └── types.ts
└── index.ts
```

### Agent SDK Eksempel

```typescript
import { Agent, Tool } from "@anthropic/agent-sdk";

// Capture Agent
const captureAgent = new Agent({
  name: "capture",
  model: "claude-sonnet-4-20250514",
  systemPrompt: `You are a web capture specialist. Your job is to:
    1. Navigate to URLs using Playwright
    2. Handle lazy-loading by scrolling
    3. Wait for all content to load
    4. Take high-quality screenshots
    5. Detect and isolate page sections`,
  tools: [
    playwrightTool,
    scrollTool,
    screenshotTool,
    sectionDetectorTool
  ],
  maxTokens: 4096
});

// Generator Agent
const generatorAgent = new Agent({
  name: "generator",
  model: "claude-sonnet-4-20250514",
  systemPrompt: `You are a React component expert. Given a screenshot
    and design tokens, generate pixel-perfect React components with:
    - TypeScript interfaces
    - Tailwind CSS classes
    - Accessibility attributes
    - 3 variants: pixel-perfect, semantic, modernized`,
  tools: [
    codeGeneratorTool,
    typescriptValidatorTool,
    tailwindConverterTool
  ],
  maxTokens: 8192
});

// Orchestrator
const orchestrator = new Agent({
  name: "orchestrator",
  model: "claude-sonnet-4-20250514",
  systemPrompt: `You coordinate the Website Cooker pipeline...`,
  subAgents: [captureAgent, extractorAgent, generatorAgent, comparatorAgent],
  tools: [dispatchTool, aggregateTool, stateTool]
});
```

---

## Anbefaling: Når implementere?

### Option A: Etter Phase 5 (Anbefalt)
- Fullfør basic pipeline først (Phase 1-5)
- Test at alt fungerer
- Refaktorer til multi-agent som Phase 9

### Option B: Som del av Phase 6-8
- Implementer agents gradvis
- Phase 6: Orchestrator + state management
- Phase 7: Parallelliser med sub-agents
- Phase 8: Full agent-arkitektur

### Option C: Start fresh med agents
- Redesign hele systemet rundt agents
- Mer arbeid, men cleaner arkitektur
- Risiko: Må re-implementere mye

---

## Neste steg

1. **Fullfør Phase 4-5** med eksisterende arkitektur
2. **Test med Fluence** (Phase 4.5)
3. **Evaluer** hva som fungerer/ikke fungerer
4. **Planlegg agent-refaktor** basert på learnings
5. **Implementer Agent SDK** som Phase 9 eller gradvis

---

## Spørsmål å vurdere

1. Skal agents kjøre lokalt eller i cloud?
2. Hvordan håndtere agent failures?
3. Skal bruker kunne se agent-kommunikasjon (debugging)?
4. Hvor mye parallellisering er ønskelig?
5. Skal hver agent ha egen model (sonnet vs haiku)?
