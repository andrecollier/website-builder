# Comprehensive Implementation Plan: World-Class Component Generation

## Status: Phase A Complete, Phases B-D Ready

### Completed
- **Phase A: Content Flow** - `extractSectionContent()` extracts headings, paragraphs, buttons, links, images
- Content flows through pipeline: capture → metadata → component-generator → variant-generator
- Semantic (B) and Modernized (C) variants now use actual text content

### Remaining Phases

## Phase B: AI-Powered Component Generation

Create `src/lib/generator/ai-generator.ts` that uses Claude to generate pixel-perfect components.

### Implementation

```typescript
// src/lib/generator/ai-generator.ts
import Anthropic from '@anthropic-ai/sdk';
import type { SectionContent, DesignSystem, ComponentType } from '@/types';
import * as fs from 'fs/promises';

interface AIGenerationInput {
  screenshotPath: string;      // Path to section screenshot
  content: SectionContent;      // Extracted semantic content
  sectionType: ComponentType;   // header, hero, features, etc.
  designSystem: DesignSystem;   // Extracted design tokens
  componentName: string;        // PascalCase name
}

interface AIGenerationResult {
  success: boolean;
  code?: string;
  error?: string;
  tokensUsed?: number;
}

/**
 * Generate a React component using Claude's vision capabilities
 */
export async function generateComponentWithAI(
  input: AIGenerationInput
): Promise<AIGenerationResult> {
  const client = new Anthropic();

  // Read screenshot and convert to base64
  const screenshotBuffer = await fs.readFile(input.screenshotPath);
  const screenshotBase64 = screenshotBuffer.toString('base64');
  const mediaType = input.screenshotPath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  // Build the prompt
  const systemPrompt = `You are an expert React/TypeScript developer. Generate a pixel-perfect React component that matches the provided screenshot exactly.

Requirements:
- Use TypeScript with proper interfaces
- Use Tailwind CSS for all styling
- Make it responsive (mobile-first with md: and lg: breakpoints)
- Use semantic HTML elements
- Include 'use client' directive
- Export as both named and default export
- Use the EXACT text content provided (headings, paragraphs, buttons)
- Match colors and spacing from the design system

Output ONLY the code, no explanations.`;

  const userPrompt = `Generate a ${input.sectionType} component named "${input.componentName}" that matches this screenshot exactly.

## Extracted Content (use these exact texts):
${JSON.stringify(input.content, null, 2)}

## Design System Tokens:
${JSON.stringify({
  colors: input.designSystem.colors,
  typography: input.designSystem.typography,
  spacing: input.designSystem.spacing,
}, null, 2)}

Generate a complete React component with Tailwind CSS that:
1. Uses the exact headings and paragraphs from the extracted content
2. Matches the visual layout from the screenshot
3. Uses colors from the design system
4. Is fully responsive`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: screenshotBase64,
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
      system: systemPrompt,
    });

    // Extract code from response
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return { success: false, error: 'No text response from Claude' };
    }

    let code = textContent.text;

    // Extract code from markdown code blocks if present
    const codeBlockMatch = code.match(/```(?:typescript|tsx|jsx)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      code = codeBlockMatch[1].trim();
    }

    return {
      success: true,
      code,
      tokensUsed: response.usage?.output_tokens,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

## Phase C: Visual Refinement Loop

Add iterative improvement using visual comparison feedback.

### Implementation

```typescript
// src/lib/generator/refinement-loop.ts
import { generateComponentWithAI } from './ai-generator';
import { runComparison } from '../comparison/compare-section';
import type { SectionContent, DesignSystem, ComponentType } from '@/types';
import * as fs from 'fs/promises';
import * as path from 'path';

interface RefinementInput {
  websiteId: string;
  sectionId: string;
  screenshotPath: string;
  content: SectionContent;
  sectionType: ComponentType;
  designSystem: DesignSystem;
  componentName: string;
  minAccuracy: number;  // Target accuracy (default 90%)
  maxAttempts: number;  // Max iterations (default 3)
}

interface RefinementResult {
  success: boolean;
  finalCode: string;
  finalAccuracy: number;
  attempts: number;
  history: Array<{
    attempt: number;
    accuracy: number;
    feedback?: string;
  }>;
}

/**
 * Generate component and iterate until accuracy target is met
 */
export async function generateUntilPerfect(
  input: RefinementInput
): Promise<RefinementResult> {
  const { minAccuracy = 90, maxAttempts = 3 } = input;
  const history: RefinementResult['history'] = [];

  let currentCode = '';
  let currentAccuracy = 0;
  let attempts = 0;
  let feedback = '';

  while (attempts < maxAttempts && currentAccuracy < minAccuracy) {
    attempts++;

    // Generate component (with feedback if not first attempt)
    const result = await generateComponentWithAI({
      ...input,
      // Include feedback from previous iteration
      ...(feedback && { additionalContext: `Previous attempt scored ${currentAccuracy}%. Issues: ${feedback}` }),
    });

    if (!result.success || !result.code) {
      history.push({
        attempt: attempts,
        accuracy: 0,
        feedback: result.error || 'Generation failed',
      });
      continue;
    }

    currentCode = result.code;

    // Write component to file for comparison
    const componentDir = path.join(
      process.cwd(),
      'Websites',
      input.websiteId,
      'generated',
      'src',
      'components',
      input.componentName
    );
    await fs.mkdir(componentDir, { recursive: true });
    await fs.writeFile(
      path.join(componentDir, `${input.componentName}.tsx`),
      currentCode
    );

    // Compare with reference screenshot
    try {
      const comparison = await runComparison({
        websiteId: input.websiteId,
        websitesDir: path.join(process.cwd(), 'Websites'),
        autoStartServer: true,
      });

      currentAccuracy = comparison.overallAccuracy;
      feedback = comparison.sections
        .filter(s => s.accuracy < minAccuracy)
        .map(s => `${s.name}: ${s.accuracy}%`)
        .join(', ');
    } catch (error) {
      feedback = 'Comparison failed';
    }

    history.push({
      attempt: attempts,
      accuracy: currentAccuracy,
      feedback: currentAccuracy >= minAccuracy ? 'Target reached!' : feedback,
    });
  }

  return {
    success: currentAccuracy >= minAccuracy,
    finalCode: currentCode,
    finalAccuracy: currentAccuracy,
    attempts,
    history,
  };
}
```

## Phase D: Design System Integration

Enhance generated components to properly use design tokens.

### Implementation

```typescript
// src/lib/generator/design-system-injector.ts
import type { DesignSystem } from '@/types';

/**
 * Convert design system colors to CSS custom properties
 */
export function generateCSSVariables(designSystem: DesignSystem): string {
  const vars: string[] = [];

  // Primary colors
  if (designSystem.colors.primary) {
    vars.push(`  --color-primary: ${designSystem.colors.primary};`);
  }
  if (designSystem.colors.secondary) {
    vars.push(`  --color-secondary: ${designSystem.colors.secondary};`);
  }

  // Background colors
  designSystem.colors.backgrounds?.forEach((bg, i) => {
    vars.push(`  --color-bg-${i + 1}: ${bg};`);
  });

  // Text colors
  designSystem.colors.text?.forEach((color, i) => {
    vars.push(`  --color-text-${i + 1}: ${color};`);
  });

  // Typography
  if (designSystem.typography.fontFamily) {
    vars.push(`  --font-family: ${designSystem.typography.fontFamily};`);
  }

  return `:root {\n${vars.join('\n')}\n}`;
}

/**
 * Generate Tailwind config extension from design system
 */
export function generateTailwindConfig(designSystem: DesignSystem): string {
  const colors: Record<string, string> = {};

  if (designSystem.colors.primary) {
    colors.primary = designSystem.colors.primary;
  }
  if (designSystem.colors.secondary) {
    colors.secondary = designSystem.colors.secondary;
  }

  return `
module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(colors, null, 6)},
      fontFamily: {
        sans: ['${designSystem.typography.fontFamily || 'Inter'}', 'sans-serif'],
      },
    },
  },
};
`;
}
```

---

## Multi-Agent Execution Strategy

### Agent 1: AI Generator Agent (NEW)
**Files:** `src/lib/generator/ai-generator.ts`
**Task:** Create Claude-powered component generation with vision

### Agent 2: Refinement Loop Agent (NEW)
**Files:** `src/lib/generator/refinement-loop.ts`
**Task:** Implement iterative improvement until accuracy target

### Agent 3: Design System Injector (NEW)
**Files:** `src/lib/generator/design-system-injector.ts`
**Task:** Generate CSS variables and Tailwind config from design tokens

### Agent 4: Integration Agent
**Files:** `src/lib/generator/variant-generator.ts`, `src/agents/generator/index.ts`
**Task:** Integrate AI generator into existing pipeline

---

## Start Prompts

### Prompt for Agent 1 (AI Generator):
```
Create src/lib/generator/ai-generator.ts that uses Claude's vision API to generate React components.

Input:
- Screenshot (base64)
- SectionContent (headings, paragraphs, buttons, links)
- DesignSystem (colors, typography, spacing)
- Component type and name

Output:
- Complete TypeScript/React component with Tailwind CSS
- Pixel-perfect match to screenshot
- Uses actual extracted text content

Use @anthropic-ai/sdk for Claude API.
Use claude-sonnet-4-20250514 model with vision.
```

### Prompt for Agent 2 (Refinement Loop):
```
Create src/lib/generator/refinement-loop.ts that iterates until visual accuracy > 90%.

Flow:
1. Generate component with AI
2. Write to file
3. Start preview server
4. Screenshot generated component
5. Compare with reference screenshot
6. If accuracy < 90%, regenerate with feedback
7. Max 3 attempts

Use existing comparison infrastructure from src/lib/comparison/.
```

### Prompt for Agent 3 (Design System):
```
Create src/lib/generator/design-system-injector.ts

Functions:
- generateCSSVariables(designSystem) - outputs :root {} block
- generateTailwindConfig(designSystem) - outputs tailwind.config.js extend
- injectDesignTokens(code, designSystem) - replaces hardcoded colors with tokens
```

### Prompt for Agent 4 (Integration):
```
Update src/lib/generator/variant-generator.ts to:
1. For Variant A (pixel-perfect): Call AI generator instead of template
2. Keep Variants B and C as they are (they already use content)

Update src/agents/generator/index.ts to:
1. Pass screenshot path to variant generator
2. Enable AI generation when ANTHROPIC_API_KEY is set
3. Add refinement loop option
```

---

## Complete Pipeline Prompt (Copy This)

```
Implement world-class component generation with AI.

## Phase B: Create AI Generator
1. Create src/lib/generator/ai-generator.ts
2. Use Claude vision API (claude-sonnet-4-20250514)
3. Input: screenshot + content + design system
4. Output: pixel-perfect React component

## Phase C: Add Refinement Loop
1. Create src/lib/generator/refinement-loop.ts
2. Generate → Compare → Regenerate with feedback
3. Target: 90% visual accuracy
4. Max 3 iterations

## Phase D: Design System Integration
1. Create src/lib/generator/design-system-injector.ts
2. Generate CSS variables from design tokens
3. Generate Tailwind config extension

## Integration
1. Update variant-generator.ts to use AI for Variant A
2. Keep Variants B and C (already using content extraction)
3. Add refinement loop to orchestrator

Test on: https://clearpath-template.framer.website
Success: Hero shows "A Path That Shapes Your Future." with >90% visual accuracy
```

---

## File Structure After Implementation

```
src/lib/generator/
├── ai-generator.ts          # NEW - Claude vision API integration
├── refinement-loop.ts       # NEW - Iterative improvement
├── design-system-injector.ts # NEW - Token injection
├── component-generator.ts   # EXISTING - Main orchestration
├── variant-generator.ts     # UPDATE - Use AI for Variant A
└── responsive-styles.ts     # EXISTING - Responsive classes

src/agents/
├── generator/index.ts       # UPDATE - Add AI generation option
└── orchestrator/index.ts    # UPDATE - Add refinement loop phase
```

---

## Environment Setup

```bash
# Required: Set Anthropic API key for AI generation
export ANTHROPIC_API_KEY="your-key-here"

# Test the pipeline
npm run extract -- --url https://clearpath-template.framer.website --ai
```
