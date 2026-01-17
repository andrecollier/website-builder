# Website Cooker Agents

This document describes the AI agent system used for website extraction, generation, and improvement.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Extraction Pipeline                          │
├─────────────────────────────────────────────────────────────────┤
│  Phase 1: Capture     → Screenshots, page data, section detection│
│  Phase 2: Extract     → Design system tokens (colors, typography)│
│  Phase 3: Generate    → React components using design system    │
│  Phase 4: Compare     → Visual comparison with reference        │
│  Phase 5: Improve     → Fix low-accuracy sections (optional)    │
└─────────────────────────────────────────────────────────────────┘
```

## Pipeline Orchestrator

Located at: `src/agents/orchestrator/index.ts`

The main orchestrator coordinates the entire extraction pipeline:

```typescript
import { executeOrchestrator } from '@/agents/orchestrator';

const result = await executeOrchestrator({
  websiteId: 'website-xxx',
  url: 'https://example.com',
  onProgress: (progress) => console.log(progress),
});
```

### Pipeline Phases

| Phase | Agent | Model | Description |
|-------|-------|-------|-------------|
| 1. Capture | CaptureAgent | - | Playwright screenshots & DOM extraction |
| 2. Extract | ExtractorAgent | - | Design system synthesis |
| 3. Generate | GeneratorAgent | - | Component generation |
| 4. Compare | ComparatorAgent | - | Visual diff comparison |
| 5. Improve | ImprovementAgents | Claude | Fix low-accuracy sections |

## Improvement Agents (Claude Agent SDK)

Located at: `src/agents/`

These agents use the Claude Agent SDK to improve generated components.

### Available Agents

#### 1. ComponentFixer
**File:** `src/agents/component-fixer.ts`
**Purpose:** Fixes components with low visual accuracy (<80%)

```typescript
import { runComponentFixer } from '@/agents';

await runComponentFixer(websiteId, {
  targetAccuracy: 80,
  maxComponents: 5,
});
```

#### 2. CSSOptimizer
**File:** `src/agents/css-optimizer.ts`
**Purpose:** Fixes CSS and Framer-specific styling issues

```typescript
import { runCSSOptimizer } from '@/agents';

await runCSSOptimizer(websiteId, {
  fixType: 'all', // 'layout' | 'colors' | 'typography' | 'all'
});
```

#### 3. QualityChecker
**File:** `src/agents/quality-checker.ts`
**Purpose:** Validates TypeScript and build

```typescript
import { runQualityChecker } from '@/agents';

await runQualityChecker(websiteId, {
  checkTypes: true,
  runBuild: true,
  checkComponents: true,
});
```

#### 4. Improvement Orchestrator
**File:** `src/agents/improvement-orchestrator.ts`
**Purpose:** Coordinates all improvement agents

```typescript
import { improveWebsite } from '@/agents';

await improveWebsite(websiteId);
```

## API Endpoints

### Start Extraction
```bash
POST /api/start-extraction
{
  "url": "https://example.com"
}
```

### Check Status
```bash
GET /api/status?websiteId=website-xxx
```

### Get Improvement Analysis
```bash
GET /api/improve?websiteId=website-xxx&targetAccuracy=80
```

Response:
```json
{
  "success": true,
  "currentAccuracy": 64.35,
  "targetAccuracy": 80,
  "sectionsNeedingImprovement": [...],
  "summary": {
    "total": 10,
    "belowTarget": 7,
    "highPriority": 5,
    "mediumPriority": 1,
    "lowPriority": 1
  }
}
```

### Trigger Improvement
```bash
POST /api/improve
{
  "websiteId": "website-xxx",
  "targetAccuracy": 80,
  "autoFix": true
}
```

## MCP Tools

Located at: `src/agents/tools.ts`

The agents have access to these MCP tools:

| Tool | Description |
|------|-------------|
| `get_comparison_report` | Get visual comparison results |
| `list_components` | List all generated components |
| `get_component_source` | Read component source code |
| `get_reference_screenshot` | Get reference section screenshot |
| `get_diff_image` | Get visual diff image |
| `get_extracted_css` | Get extracted CSS from reference |
| `list_websites` | List all websites in database |

## Configuration

### Environment Variables

```bash
# Required for improvement agents
ANTHROPIC_API_KEY=sk-ant-...

# Optional
WEBSITES_DIR=./Websites  # Output directory
```

### Improvement Priority Levels

Sections are prioritized based on accuracy:

| Priority | Accuracy Range | Action |
|----------|---------------|--------|
| High | < 30% | Fix immediately |
| Medium | 30-60% | Should fix |
| Low | 60-80% | Optional improvement |

## Integration Examples

### Auto-improve After Extraction

```typescript
// In your extraction handler
const result = await executeOrchestrator({ websiteId, url });

if (result.success) {
  // Check if improvement is needed
  const report = result.data?.overallAccuracy;

  if (report && report < 80) {
    // Trigger improvement agents
    await improveWebsite(websiteId);
  }
}
```

### CLI Usage

```bash
# Run full improvement workflow
npx tsx src/agents/cli.ts improve website-xxx

# Fix specific components
npx tsx src/agents/cli.ts fix-component website-xxx

# Optimize CSS only
npx tsx src/agents/cli.ts optimize-css website-xxx

# Run quality checks
npx tsx src/agents/cli.ts check-quality website-xxx
```

## Output Structure

```
Websites/website-xxx/
├── reference/
│   └── sections/           # Reference screenshots
├── generated/
│   ├── src/components/     # Generated React components
│   └── screenshots/        # Generated screenshots
├── comparison/
│   ├── report.json         # Accuracy report
│   └── diffs/              # Visual diff images
├── design-system.json      # Extracted design tokens
├── tailwind.config.js      # Generated Tailwind config
└── variables.css           # CSS custom properties
```

## Troubleshooting

### Extraction Stuck at "Scrolling"
- Fixed: Added 30-second scroll timeout
- Location: `src/lib/playwright/scroll-loader.ts`

### "executeOrchestrator is not a function"
- Fixed: Renamed `orchestrator.ts` to `improvement-orchestrator.ts`
- The pipeline orchestrator is at `src/agents/orchestrator/index.ts`

### Missing ANTHROPIC_API_KEY
- Required for improvement agents
- Not required for extraction pipeline
- Set via environment variable or `.env` file
