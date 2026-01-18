/**
 * AI-Powered Component Generator
 *
 * Uses Claude's vision capabilities to generate pixel-perfect React components
 * by analyzing reference screenshots and combining with extracted semantic content.
 *
 * Phase B of the Quality Fix Plan.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { SectionContent, DesignSystem, ComponentType } from '@/types';
import * as fs from 'fs/promises';

// ====================
// TYPES
// ====================

export interface AIGenerationInput {
  /** Path to the section screenshot */
  screenshotPath: string;
  /** Extracted semantic content (headings, paragraphs, buttons, etc.) */
  content: SectionContent;
  /** Component type (header, hero, features, etc.) */
  sectionType: ComponentType;
  /** Design system tokens */
  designSystem: DesignSystem;
  /** PascalCase component name */
  componentName: string;
  /** Additional context from previous refinement attempts */
  previousFeedback?: string;
  /** Previous accuracy score if refining */
  previousAccuracy?: number;
}

export interface AIGenerationResult {
  success: boolean;
  /** Generated component code */
  code?: string;
  /** Error message if failed */
  error?: string;
  /** Tokens used in generation */
  tokensUsed?: number;
  /** Model used */
  model?: string;
}

// ====================
// SYSTEM PROMPT
// ====================

const SYSTEM_PROMPT = `You are an expert React/TypeScript developer specializing in pixel-perfect component recreation. Your task is to generate a React component that matches the provided screenshot exactly.

## Requirements

### Code Quality
- Use TypeScript with proper interfaces for props
- Use Tailwind CSS for ALL styling (no inline styles except for dynamic values)
- Add 'use client' directive at the top
- Export as both named export and default export
- Use semantic HTML elements (header, section, nav, footer, etc.)

### Visual Accuracy
- Match the layout, spacing, and proportions from the screenshot exactly
- Use the provided design system colors (convert hex to Tailwind utilities when possible)
- Match typography sizes and weights
- Preserve visual hierarchy and element relationships

### Content
- Use the EXACT text content provided in the extracted content
- Do not make up or modify any text
- Place content in the correct positions matching the screenshot layout

### Responsiveness
- Use mobile-first approach
- Add md: and lg: breakpoints for responsive behavior
- Ensure the component looks good at all screen sizes

### Output Format
- Output ONLY the complete component code
- No explanations, comments about the code, or markdown formatting
- The code should be directly usable in a .tsx file`;

// ====================
// MAIN FUNCTION
// ====================

/**
 * Generate a React component using Claude's vision capabilities
 *
 * @param input - Generation input with screenshot, content, and design system
 * @returns Generation result with code or error
 */
export async function generateComponentWithAI(
  input: AIGenerationInput
): Promise<AIGenerationResult> {
  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      success: false,
      error: 'ANTHROPIC_API_KEY environment variable is not set',
    };
  }

  const client = new Anthropic();

  try {
    // Read screenshot and convert to base64
    const screenshotBuffer = await fs.readFile(input.screenshotPath);
    const screenshotBase64 = screenshotBuffer.toString('base64');
    const mediaType = input.screenshotPath.endsWith('.png')
      ? 'image/png'
      : 'image/jpeg';

    // Build the user prompt
    const userPrompt = buildUserPrompt(input);

    // Call Claude API with vision
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
      system: SYSTEM_PROMPT,
    });

    // Extract code from response
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return {
        success: false,
        error: 'No text response from Claude',
      };
    }

    let code = textContent.text;

    // Extract code from markdown code blocks if present
    const codeBlockMatch = code.match(
      /```(?:typescript|tsx|jsx|ts)?\n([\s\S]*?)```/
    );
    if (codeBlockMatch) {
      code = codeBlockMatch[1].trim();
    }

    // Ensure 'use client' directive is present
    if (!code.includes("'use client'") && !code.includes('"use client"')) {
      code = "'use client';\n\n" + code;
    }

    return {
      success: true,
      code,
      tokensUsed: response.usage?.output_tokens,
      model: 'claude-sonnet-4-20250514',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for specific error types
    if (errorMessage.includes('rate_limit')) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please wait and try again.',
      };
    }

    if (errorMessage.includes('invalid_api_key')) {
      return {
        success: false,
        error: 'Invalid API key. Check ANTHROPIC_API_KEY.',
      };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ====================
// PROMPT BUILDER
// ====================

/**
 * Build the user prompt with all context
 */
function buildUserPrompt(input: AIGenerationInput): string {
  const {
    content,
    sectionType,
    designSystem,
    componentName,
    previousFeedback,
    previousAccuracy,
  } = input;

  // Format content for the prompt
  const contentSection = formatContentSection(content);

  // Format design system tokens
  const designTokens = formatDesignTokens(designSystem);

  // Build the prompt
  let prompt = `Generate a "${componentName}" component of type "${sectionType}" that matches the screenshot exactly.

## Extracted Content (use these EXACT texts)
${contentSection}

## Design System Tokens
${designTokens}

## Component Requirements
- Component name: ${componentName}
- Type: ${sectionType}
- Framework: React with TypeScript
- Styling: Tailwind CSS only
- Must be responsive (mobile-first with md: and lg: breakpoints)`;

  // Add refinement feedback if this is a retry
  if (previousFeedback && previousAccuracy !== undefined) {
    prompt += `

## Refinement Feedback
Previous attempt scored ${previousAccuracy.toFixed(1)}% visual accuracy.
Issues to fix: ${previousFeedback}

Please address these issues in this iteration while maintaining the overall structure.`;
  }

  return prompt;
}

/**
 * Format extracted content for the prompt
 */
function formatContentSection(content: SectionContent): string {
  const sections: string[] = [];

  // Headings
  if (content.headings && content.headings.length > 0) {
    sections.push('### Headings');
    content.headings.forEach((h) => {
      sections.push(`- H${h.level}: "${h.text}"`);
    });
  }

  // Paragraphs
  if (content.paragraphs && content.paragraphs.length > 0) {
    sections.push('\n### Paragraphs');
    content.paragraphs.forEach((p, i) => {
      sections.push(`- Paragraph ${i + 1}: "${p}"`);
    });
  }

  // Buttons
  if (content.buttons && content.buttons.length > 0) {
    sections.push('\n### Buttons/CTAs');
    content.buttons.forEach((b) => {
      const type = b.isPrimary ? 'Primary' : 'Secondary';
      sections.push(`- ${type} Button: "${b.text}"${b.href ? ` → ${b.href}` : ''}`);
    });
  }

  // Links
  if (content.links && content.links.length > 0) {
    sections.push('\n### Links');
    content.links.slice(0, 10).forEach((l) => {
      sections.push(`- "${l.text}" → ${l.href}`);
    });
    if (content.links.length > 10) {
      sections.push(`- ... and ${content.links.length - 10} more links`);
    }
  }

  // Images
  if (content.images && content.images.length > 0) {
    sections.push('\n### Images');
    content.images.forEach((img) => {
      sections.push(`- ${img.role} image: ${img.alt || 'no alt text'}`);
    });
  }

  // Layout
  if (content.layout) {
    sections.push(`\n### Layout: ${content.layout}`);
  }

  return sections.join('\n');
}

/**
 * Format design system tokens for the prompt
 */
function formatDesignTokens(designSystem: DesignSystem): string {
  const tokens: string[] = [];

  // Colors
  tokens.push('### Colors');
  if (designSystem.colors.primary) {
    tokens.push(`- Primary: ${designSystem.colors.primary}`);
  }
  if (designSystem.colors.secondary) {
    tokens.push(`- Secondary: ${designSystem.colors.secondary}`);
  }
  if (designSystem.colors.backgrounds?.length) {
    tokens.push(`- Backgrounds: ${designSystem.colors.backgrounds.slice(0, 3).join(', ')}`);
  }
  if (designSystem.colors.text?.length) {
    tokens.push(`- Text colors: ${designSystem.colors.text.slice(0, 3).join(', ')}`);
  }

  // Typography
  tokens.push('\n### Typography');
  if (designSystem.typography.fontFamily) {
    tokens.push(`- Font family: ${designSystem.typography.fontFamily}`);
  }
  if (designSystem.typography.headingSizes) {
    tokens.push(`- Heading sizes: ${Object.entries(designSystem.typography.headingSizes).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  }

  // Spacing
  if (designSystem.spacing) {
    tokens.push('\n### Spacing');
    if (designSystem.spacing.containerPadding) {
      tokens.push(`- Container padding: ${designSystem.spacing.containerPadding}`);
    }
    if (designSystem.spacing.sectionGap) {
      tokens.push(`- Section gap: ${designSystem.spacing.sectionGap}`);
    }
  }

  return tokens.join('\n');
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Check if AI generation is available
 */
export function isAIGenerationAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Get estimated tokens for generation
 * Based on average component complexity
 */
export function estimateTokens(sectionType: ComponentType): number {
  const estimates: Record<ComponentType, number> = {
    header: 1500,
    hero: 2500,
    features: 3500,
    testimonials: 3000,
    pricing: 4000,
    cta: 1500,
    footer: 2500,
    cards: 3000,
    gallery: 2500,
    contact: 2000,
    faq: 3000,
    stats: 2000,
    team: 3000,
    logos: 1500,
  };

  return estimates[sectionType] || 2500;
}
