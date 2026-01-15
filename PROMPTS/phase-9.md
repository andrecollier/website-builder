# Auto Claude Prompt - Phase 9

## Oppgave: Implementer Phase 9 av Website Cooker

Les først:
- PROJECT_PLAN.md (hovedplan)
- ARCHITECTURE_AGENTS.md (agent-arkitektur)

Phase 1-8 er ferdige. Website Cooker fungerer end-to-end.

---

## Din oppgave: Phase 9 - Agent SDK Refactor

Refaktorer Website Cooker til multi-agent arkitektur med Claude Agent SDK.

### 9.1 Install Agent SDK

```bash
npm install @anthropic-ai/sdk
# eller for TypeScript agent framework
npm install @anthropic/agent-sdk
```

### 9.2 Agent Structure

```
src/agents/
├── orchestrator/
│   ├── agent.ts              # Main orchestrator
│   ├── planner.ts            # Task planning
│   ├── state-machine.ts      # Pipeline state
│   └── prompts/
│       └── system.ts
├── capture/
│   ├── agent.ts              # Capture agent
│   ├── tools/
│   │   ├── playwright.ts
│   │   ├── scroll.ts
│   │   └── section-detect.ts
│   └── prompts/
│       └── system.ts
├── extractor/
│   ├── agent.ts              # Extractor agent
│   ├── tools/
│   │   ├── color-extract.ts
│   │   ├── typography-extract.ts
│   │   ├── spacing-extract.ts
│   │   └── effects-extract.ts
│   └── prompts/
│       └── system.ts
├── generator/
│   ├── agent.ts              # Generator agent
│   ├── tools/
│   │   ├── code-gen.ts
│   │   ├── variant-gen.ts
│   │   └── validate.ts
│   └── prompts/
│       └── system.ts
├── comparator/
│   ├── agent.ts              # Comparator agent
│   ├── tools/
│   │   ├── pixelmatch.ts
│   │   ├── diff-analyze.ts
│   │   └── auto-refine.ts
│   └── prompts/
│       └── system.ts
├── shared/
│   ├── context.ts            # Shared context
│   ├── messages.ts           # Message protocol
│   ├── tools.ts              # Shared tools
│   └── types.ts
└── index.ts                  # Agent registry
```

### 9.3 Orchestrator Agent

```typescript
// src/agents/orchestrator/agent.ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

interface PipelineState {
  websiteId: string;
  currentPhase: Phase;
  completedPhases: Phase[];
  context: SharedContext;
  errors: AgentError[];
}

const orchestratorSystemPrompt = `You are the Orchestrator Agent for Website Cooker.

Your responsibilities:
1. Receive user requests (URLs to process)
2. Create execution plans
3. Delegate tasks to specialized agents:
   - Capture Agent: Screenshots and lazy-load handling
   - Extractor Agent: Design token extraction
   - Generator Agent: React component generation
   - Comparator Agent: Visual comparison and refinement
4. Track progress and handle errors
5. Aggregate results and report to user

You coordinate the pipeline but do NOT do the actual work yourself.
Delegate to the appropriate specialist agent.`;

export class OrchestratorAgent {
  private state: PipelineState;

  async process(url: string): Promise<GeneratedWebsite> {
    // 1. Initialize state
    this.state = initializeState(url);

    // 2. Create execution plan
    const plan = await this.createPlan(url);

    // 3. Execute phases
    for (const phase of plan.phases) {
      await this.executePhase(phase);
    }

    // 4. Aggregate and return results
    return this.aggregateResults();
  }

  private async executePhase(phase: Phase): Promise<void> {
    switch (phase.type) {
      case 'capture':
        await this.delegateTo('capture', phase.config);
        break;
      case 'extract':
        await this.delegateTo('extractor', phase.config);
        break;
      case 'generate':
        // Run in parallel for each section
        await this.parallelDelegate('generator', phase.sections);
        break;
      case 'compare':
        await this.parallelDelegate('comparator', phase.components);
        break;
    }
  }

  private async delegateTo(agent: AgentType, config: any): Promise<AgentResult> {
    const agentInstance = getAgent(agent);
    return await agentInstance.execute(config, this.state.context);
  }

  private async parallelDelegate(agent: AgentType, items: any[]): Promise<AgentResult[]> {
    return await Promise.all(
      items.map(item => this.delegateTo(agent, item))
    );
  }
}
```

### 9.4 Capture Agent

```typescript
// src/agents/capture/agent.ts
import Anthropic from "@anthropic-ai/sdk";

const captureSystemPrompt = `You are the Capture Agent for Website Cooker.

Your ONLY job is to capture websites visually:
1. Navigate to URLs using Playwright
2. Handle lazy-loading by scrolling the entire page
3. Wait for fonts, images, and animations
4. Take full-page screenshots
5. Detect and isolate page sections
6. Take per-section screenshots

You have access to these tools:
- playwright_navigate: Open a URL
- playwright_scroll: Scroll to trigger lazy-load
- playwright_screenshot: Take screenshots
- section_detector: Identify page sections

Return structured data about what you captured.
Do NOT extract styles or generate code - that's other agents' jobs.`;

const captureTools = [
  {
    name: "playwright_navigate",
    description: "Navigate to a URL and wait for load",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to navigate to" },
        viewport: {
          type: "object",
          properties: {
            width: { type: "number" },
            height: { type: "number" }
          }
        }
      },
      required: ["url"]
    }
  },
  {
    name: "playwright_scroll",
    description: "Scroll the page to trigger lazy-loading",
    input_schema: {
      type: "object",
      properties: {
        strategy: {
          type: "string",
          enum: ["full", "incremental", "sections"]
        }
      }
    }
  },
  {
    name: "playwright_screenshot",
    description: "Take a screenshot",
    input_schema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["full", "section", "element"] },
        selector: { type: "string" },
        outputPath: { type: "string" }
      },
      required: ["type", "outputPath"]
    }
  },
  {
    name: "section_detector",
    description: "Detect sections on the page",
    input_schema: {
      type: "object",
      properties: {
        strategy: {
          type: "string",
          enum: ["semantic", "heuristic", "combined"]
        }
      }
    }
  }
];

export class CaptureAgent {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  async execute(config: CaptureConfig, context: SharedContext): Promise<CaptureResult> {
    const messages = [
      {
        role: "user",
        content: `Capture the website at ${config.url}

Requirements:
- Viewport: ${config.viewport.width}x${config.viewport.height}
- Handle lazy-loading
- Wait for all images and fonts
- Take full-page screenshot
- Detect and screenshot individual sections
- Save to: ${config.outputPath}

Return the paths to all screenshots and section metadata.`
      }
    ];

    let response = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: captureSystemPrompt,
      tools: captureTools,
      messages
    });

    // Agentic loop - handle tool calls
    while (response.stop_reason === "tool_use") {
      const toolResults = await this.handleToolCalls(response.content);
      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });

      response = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: captureSystemPrompt,
        tools: captureTools,
        messages
      });
    }

    return this.parseResult(response);
  }

  private async handleToolCalls(content: any[]): Promise<any[]> {
    const results = [];

    for (const block of content) {
      if (block.type === "tool_use") {
        const result = await this.executeTool(block.name, block.input);
        results.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result)
        });
      }
    }

    return results;
  }

  private async executeTool(name: string, input: any): Promise<any> {
    switch (name) {
      case "playwright_navigate":
        return await playwrightNavigate(input);
      case "playwright_scroll":
        return await playwrightScroll(input);
      case "playwright_screenshot":
        return await playwrightScreenshot(input);
      case "section_detector":
        return await detectSections(input);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
```

### 9.5 Generator Agent (Parallel)

```typescript
// src/agents/generator/agent.ts

const generatorSystemPrompt = `You are the Generator Agent for Website Cooker.

Your ONLY job is to generate React components from screenshots:
1. Analyze a section screenshot
2. Identify the component type (header, hero, features, etc.)
3. Generate TypeScript React code with Tailwind CSS
4. Create 3 variants:
   - Variant A: Pixel-perfect match
   - Variant B: Semantic match (cleaner code)
   - Variant C: Modernized (better accessibility/performance)
5. Validate TypeScript syntax
6. Return all variants

You receive:
- Section screenshot (as image)
- Design tokens (colors, typography, spacing)
- Component type hint

You return:
- 3 React component variants
- Props interface
- Accuracy estimate per variant

Do NOT capture screenshots or extract tokens - use what you're given.`;

export class GeneratorAgent {
  async execute(config: GeneratorConfig, context: SharedContext): Promise<GeneratorResult> {
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: config.screenshotBase64
            }
          },
          {
            type: "text",
            text: `Generate a React component for this ${config.sectionType} section.

Design Tokens:
${JSON.stringify(context.designTokens, null, 2)}

Requirements:
- TypeScript with proper interfaces
- Tailwind CSS classes (use design tokens)
- Responsive (mobile-first)
- Accessibility attributes
- 3 variants (A: pixel-perfect, B: semantic, C: modern)

Return valid TSX code for each variant.`
          }
        ]
      }
    ];

    // ... agentic loop similar to CaptureAgent
  }
}

// Parallel execution helper
export async function generateComponentsParallel(
  sections: SectionConfig[],
  context: SharedContext
): Promise<GeneratorResult[]> {
  const agent = new GeneratorAgent();

  // Run all generations in parallel
  return await Promise.all(
    sections.map(section => agent.execute(section, context))
  );
}
```

### 9.6 Shared Context

```typescript
// src/agents/shared/context.ts

export interface SharedContext {
  // Job info
  jobId: string;
  websiteId: string;
  referenceUrl: string;

  // Capture results
  screenshots: {
    fullPage: string;
    sections: Record<string, string>;
  };

  // Extraction results
  designTokens: DesignSystem;

  // Generation results
  components: GeneratedComponent[];

  // Comparison results
  comparisons: ComparisonResult[];

  // Metadata
  startedAt: Date;
  currentPhase: string;
}

export function createContext(url: string): SharedContext {
  return {
    jobId: generateId(),
    websiteId: `website-${Date.now()}`,
    referenceUrl: url,
    screenshots: { fullPage: '', sections: {} },
    designTokens: null,
    components: [],
    comparisons: [],
    startedAt: new Date(),
    currentPhase: 'initializing'
  };
}

export function updateContext(
  context: SharedContext,
  phase: string,
  data: Partial<SharedContext>
): SharedContext {
  return {
    ...context,
    ...data,
    currentPhase: phase
  };
}
```

### 9.7 Message Protocol

```typescript
// src/agents/shared/messages.ts

export interface AgentMessage {
  id: string;
  from: AgentType;
  to: AgentType;
  type: 'request' | 'response' | 'error' | 'progress';
  payload: any;
  correlationId: string;
  timestamp: Date;
}

export interface AgentRequest extends AgentMessage {
  type: 'request';
  payload: {
    action: string;
    params: any;
    context: SharedContext;
  };
}

export interface AgentResponse extends AgentMessage {
  type: 'response';
  payload: {
    success: boolean;
    result?: any;
    error?: string;
    updatedContext: Partial<SharedContext>;
  };
}

// Event emitter for real-time updates
export class AgentEventBus {
  private handlers: Map<string, Function[]> = new Map();

  on(event: string, handler: Function): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
  }

  emit(event: string, data: any): void {
    const handlers = this.handlers.get(event) || [];
    handlers.forEach(h => h(data));
  }
}

export const agentBus = new AgentEventBus();
```

### 9.8 Agent Registry

```typescript
// src/agents/index.ts

import { OrchestratorAgent } from './orchestrator/agent';
import { CaptureAgent } from './capture/agent';
import { ExtractorAgent } from './extractor/agent';
import { GeneratorAgent } from './generator/agent';
import { ComparatorAgent } from './comparator/agent';

export type AgentType =
  | 'orchestrator'
  | 'capture'
  | 'extractor'
  | 'generator'
  | 'comparator';

const agents: Record<AgentType, any> = {
  orchestrator: OrchestratorAgent,
  capture: CaptureAgent,
  extractor: ExtractorAgent,
  generator: GeneratorAgent,
  comparator: ComparatorAgent
};

export function getAgent(type: AgentType): any {
  const AgentClass = agents[type];
  if (!AgentClass) {
    throw new Error(`Unknown agent type: ${type}`);
  }
  return new AgentClass();
}

// Main entry point
export async function processWebsite(url: string): Promise<GeneratedWebsite> {
  const orchestrator = getAgent('orchestrator') as OrchestratorAgent;
  return await orchestrator.process(url);
}
```

### 9.9 Update API Routes

```typescript
// src/app/api/start-extraction/route.ts (updated)

import { processWebsite } from '@/agents';
import { agentBus } from '@/agents/shared/messages';

export async function POST(request: Request) {
  const { url } = await request.json();

  // Start processing with agents
  const resultPromise = processWebsite(url);

  // Set up SSE for progress updates
  const stream = new ReadableStream({
    start(controller) {
      agentBus.on('progress', (data) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      });

      resultPromise.then((result) => {
        controller.enqueue(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
        controller.close();
      }).catch((error) => {
        controller.enqueue(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

### 9.10 Model Selection per Agent

```typescript
// Different models for different tasks

const agentModels: Record<AgentType, string> = {
  orchestrator: "claude-sonnet-4-20250514",  // Good at planning
  capture: "claude-haiku-3-5-20241022",      // Fast, simple tasks
  extractor: "claude-sonnet-4-20250514",     // Good at analysis
  generator: "claude-sonnet-4-20250514",     // Best at coding
  comparator: "claude-haiku-3-5-20241022"    // Fast comparisons
};

// Use haiku for simple/fast tasks, sonnet for complex/coding tasks
```

---

## Deliverables

- [ ] Agent SDK installed and configured
- [ ] Orchestrator Agent coordinates pipeline
- [ ] Capture Agent handles Playwright
- [ ] Extractor Agent extracts design tokens
- [ ] Generator Agent creates React components (parallel)
- [ ] Comparator Agent does visual comparison (parallel)
- [ ] Shared context passed between agents
- [ ] Message protocol for agent communication
- [ ] Real-time progress updates via SSE
- [ ] API routes updated to use agents

---

## Test når ferdig

1. Start app: `npm run dev`
2. Lim inn URL: `https://fluence.framer.website/`
3. Verifiser i console/logs:
   - Orchestrator creates plan
   - Capture Agent runs first
   - Extractor Agent runs after capture
   - Generator Agents run in parallel
   - Comparator Agents run in parallel
4. Verifiser at output er samme som før refactor
5. Sammenlign hastighet (should be faster with parallelization)

---

## Viktig

- Ikke endre funksjonalitet, bare arkitektur
- Alle eksisterende features må fortsatt fungere
- Parallellisering for Generator og Comparator
- Bruk haiku for enkle tasks, sonnet for komplekse
- God error handling - én agent som feiler skal ikke stoppe alt
