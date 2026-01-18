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

const SYSTEM_PROMPT = `You are an expert React/TypeScript developer specializing in pixel-perfect component recreation. Your task is to generate a React component that achieves >90% visual accuracy compared to the provided screenshot.

## CRITICAL REQUIREMENTS FOR VISUAL ACCURACY

### Layout Analysis (STUDY THE SCREENSHOT CAREFULLY)
1. SPACING: Count the approximate pixels between elements. Use Tailwind's spacing scale:
   - gap-1 = 4px, gap-2 = 8px, gap-4 = 16px, gap-6 = 24px, gap-8 = 32px, gap-12 = 48px, gap-16 = 64px
   - py/px for padding, my/mx for margin
2. PROPORTIONS: Measure relative widths (1/2, 1/3, 2/3, full) and max-widths (max-w-md, max-w-lg, max-w-xl, max-w-2xl, max-w-4xl, max-w-6xl, max-w-7xl)
3. ALIGNMENT: Identify flex/grid layouts, justify-content, align-items, text alignment

### Typography Precision
- HEADING SIZES: Match the visual hierarchy exactly
  - Display/Hero: text-4xl md:text-5xl lg:text-6xl or larger
  - Section: text-2xl md:text-3xl lg:text-4xl
  - Sub-section: text-xl md:text-2xl
- FONT WEIGHTS: font-light, font-normal, font-medium, font-semibold, font-bold
- LINE HEIGHT: leading-tight (1.25), leading-snug (1.375), leading-normal (1.5), leading-relaxed (1.625)
- LETTER SPACING: tracking-tight, tracking-normal, tracking-wide

### Color Matching
- Use the EXACT colors from the design system tokens provided
- For backgrounds: Match opacity and gradients (bg-gradient-to-b, from-X, to-Y)
- For text: Use the exact text colors provided (text-[#hexcode] if needed)
- For buttons: Primary buttons should use primary color, secondary use lighter variants

### Element Positioning
- VERTICAL CENTERING: Use flex items-center for vertical centering
- HORIZONTAL CENTERING: Use mx-auto or justify-center
- ABSOLUTE POSITIONING: Use relative parent with absolute children where needed for overlays

### Code Quality
- Use TypeScript with proper interfaces for props
- Use Tailwind CSS for ALL styling (avoid inline styles)
- Add 'use client' directive at the top
- Export as both named export and default export
- Use semantic HTML elements (header, section, nav, footer, main, article)

### Content Rules
- Use the EXACT text content provided - copy it character-for-character
- Place content in the EXACT positions matching the screenshot
- Include ALL buttons, links, and CTAs from the extracted content
- For images, use the provided src URLs or placeholder divs with aspect ratios

### Responsiveness (MANDATORY)
- Mobile-first: Start with mobile styles, then add sm:, md:, lg:, xl: breakpoints
- Stack layouts on mobile, use flex-row/grid on larger screens
- Adjust text sizes and spacing per breakpoint
- Hide/show elements appropriately (hidden sm:block, etc.)

### Output Format
- Output ONLY the complete component code
- No explanations, comments about the code, or markdown formatting
- The code should be directly usable in a .tsx file
- Include all necessary imports (React, Image from next/image if needed)`;

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

  // Get component-specific layout guidance
  const layoutGuidance = getComponentLayoutGuidance(sectionType);

  // Build the prompt
  let prompt = `TASK: Generate a "${componentName}" component of type "${sectionType}" that achieves >90% visual accuracy to the screenshot.

## STEP 1: Analyze the Screenshot
Look at the screenshot carefully and identify:
1. Overall layout structure (is it centered? full-width? split-screen?)
2. Number of distinct visual sections/blocks
3. Background colors and gradients
4. Image placements and sizes
5. Text sizes and hierarchy
6. Button styles and positions
7. Spacing between elements

## STEP 2: Extracted Content (USE THESE EXACT TEXTS)
${contentSection}

## STEP 3: Design System Tokens (APPLY THESE)
${designTokens}

## STEP 4: Component-Specific Layout
${layoutGuidance}

## STEP 5: Implementation Requirements
- Component name: ${componentName}
- Framework: React with TypeScript
- Styling: Tailwind CSS only (no inline styles except for background images)
- Images: Use next/image Image component with proper width/height or fill prop
- Responsive: mobile-first with sm:, md:, lg:, xl: breakpoints
- Container: Use max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 for content areas`;

  // Add refinement feedback if this is a retry
  if (previousFeedback && previousAccuracy !== undefined) {
    prompt += `

## CRITICAL: REFINEMENT REQUIRED
Previous attempt achieved only ${previousAccuracy.toFixed(1)}% visual accuracy.
The following issues MUST be fixed:
${previousFeedback}

Focus specifically on the areas mentioned above. Keep what works, fix what doesn't.
Target: >90% visual accuracy.`;
  }

  prompt += `

## OUTPUT
Generate the complete React component code only. No explanations or markdown formatting.`;

  return prompt;
}

/**
 * Get component-specific layout guidance
 */
function getComponentLayoutGuidance(sectionType: ComponentType): string {
  const guidance: Record<ComponentType, string> = {
    header: `Header Layout:
- Fixed or sticky positioning (sticky top-0 z-50)
- Logo on left, navigation center or right
- Horizontal nav items with appropriate spacing (gap-6 or gap-8)
- Mobile hamburger menu (hidden md:flex for desktop nav)
- Background often white/transparent with blur`,

    hero: `Hero Layout:
- Full viewport height or large padding (min-h-[80vh] or py-20 lg:py-32)
- Centered content with max-width constraint
- Large headline (text-4xl md:text-5xl lg:text-6xl)
- Subheadline below (text-lg md:text-xl)
- CTA buttons with proper prominence
- Background image or gradient overlay if present
- Often uses flex items-center justify-center`,

    features: `Features Layout:
- Section padding (py-16 md:py-24)
- Section heading centered
- Grid of feature cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Each card: icon + heading + description
- Consistent card spacing (gap-8 or gap-12)
- May have alternating layouts (image-text, text-image)`,

    testimonials: `Testimonials Layout:
- Section with centered heading
- Quote text with larger font size
- Avatar/photo of person
- Name and title below quote
- May be carousel/slider or grid
- Often has subtle background color`,

    pricing: `Pricing Layout:
- Section padding with centered heading
- Typically 3 pricing tiers side by side (grid-cols-1 md:grid-cols-3)
- Each tier: name, price, feature list, CTA button
- Middle tier often highlighted (popular/recommended)
- Feature lists with checkmarks or bullets`,

    cta: `CTA Layout:
- Section with contrasting background (often primary color or dark)
- Centered content with constrained width
- Compelling headline
- Brief supporting text
- Prominent action button(s)
- Generous vertical padding (py-16 md:py-24)`,

    footer: `Footer Layout:
- Dark or contrasting background
- Multi-column layout (grid-cols-2 md:grid-cols-4)
- Logo in first column
- Link groups in subsequent columns
- Copyright at bottom
- May include social icons, newsletter form`,

    cards: `Cards Layout:
- Grid of equal-sized cards (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3)
- Each card: image, title, description, optional CTA
- Consistent card styling (rounded corners, shadows)
- Hover effects for interactivity`,

    gallery: `Gallery Layout:
- Grid or masonry layout for images
- Various aspect ratios or consistent thumbnails
- Lightbox functionality possible
- Captions below or on hover`,

    contact: `Contact Layout:
- Two-column or centered form
- Form fields with labels
- Contact info alongside (address, phone, email)
- Map embed possible
- Submit button prominently placed`,

    faq: `FAQ Layout:
- Accordion-style questions
- Question text more prominent
- Answer text when expanded
- Expand/collapse icons`,

    stats: `Stats Layout:
- Row or grid of stat items
- Large numbers (text-4xl or larger)
- Labels below numbers
- Often centered in section
- May have icons`,

    team: `Team Layout:
- Grid of team member cards
- Photo prominent
- Name and role
- Optional bio and social links`,

    logos: `Logos Layout:
- Horizontal row of logos
- Grayscale or muted colors
- Consistent sizing
- May scroll or carousel`,
  };

  return guidance[sectionType] || 'Standard section layout with appropriate spacing and responsive behavior.';
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

  // Colors - comprehensive extraction
  tokens.push('### Colors (USE THESE EXACT VALUES)');

  // Handle both array and string primary colors
  const primaryColors = designSystem.colors.primary;
  if (primaryColors) {
    if (Array.isArray(primaryColors)) {
      tokens.push(`- Primary: ${primaryColors[0]} (main), ${primaryColors.slice(1).join(', ')}`);
    } else {
      tokens.push(`- Primary: ${primaryColors}`);
    }
  }

  const secondaryColors = designSystem.colors.secondary;
  if (secondaryColors) {
    if (Array.isArray(secondaryColors)) {
      tokens.push(`- Secondary: ${secondaryColors[0]} (main), ${secondaryColors.slice(1).join(', ')}`);
    } else {
      tokens.push(`- Secondary: ${secondaryColors}`);
    }
  }

  if (designSystem.colors.backgrounds?.length) {
    tokens.push(`- Backgrounds: ${designSystem.colors.backgrounds.join(', ')}`);
    tokens.push(`  → Use these for section backgrounds, cards, overlays`);
  }

  if (designSystem.colors.text?.length) {
    const [headingColor, bodyColor, mutedColor] = designSystem.colors.text;
    tokens.push(`- Text colors:`);
    if (headingColor) tokens.push(`  → Headings: ${headingColor}`);
    if (bodyColor) tokens.push(`  → Body text: ${bodyColor}`);
    if (mutedColor) tokens.push(`  → Muted/secondary text: ${mutedColor}`);
  }

  if (designSystem.colors.neutral?.length) {
    tokens.push(`- Neutral/Gray scale: ${designSystem.colors.neutral.join(', ')}`);
  }

  if (designSystem.colors.accent?.length) {
    tokens.push(`- Accent colors: ${designSystem.colors.accent.join(', ')}`);
  }

  // Typography - detailed
  tokens.push('\n### Typography (MATCH THESE SIZES)');

  // Handle new fonts structure
  if (designSystem.typography.fonts) {
    if (designSystem.typography.fonts.heading) {
      tokens.push(`- Heading font: ${designSystem.typography.fonts.heading}`);
    }
    if (designSystem.typography.fonts.body) {
      tokens.push(`- Body font: ${designSystem.typography.fonts.body}`);
    }
  } else if (designSystem.typography.fontFamily) {
    tokens.push(`- Font family: ${designSystem.typography.fontFamily}`);
  }

  // Handle scale or headingSizes
  if (designSystem.typography.scale) {
    tokens.push(`- Font scale:`);
    const scale = designSystem.typography.scale;
    if (scale.display) tokens.push(`  → Display (hero): ${scale.display}`);
    if (scale.h1) tokens.push(`  → H1: ${scale.h1}`);
    if (scale.h2) tokens.push(`  → H2: ${scale.h2}`);
    if (scale.h3) tokens.push(`  → H3: ${scale.h3}`);
    if (scale.body) tokens.push(`  → Body: ${scale.body}`);
    if (scale.small) tokens.push(`  → Small: ${scale.small}`);
  } else if (designSystem.typography.headingSizes) {
    tokens.push(`- Heading sizes:`);
    Object.entries(designSystem.typography.headingSizes).forEach(([k, v]) => {
      tokens.push(`  → ${k}: ${v}`);
    });
  }

  if (designSystem.typography.weights?.length) {
    tokens.push(`- Font weights available: ${designSystem.typography.weights.join(', ')}`);
  }

  if (designSystem.typography.lineHeights) {
    tokens.push(`- Line heights: tight=${designSystem.typography.lineHeights.tight}, normal=${designSystem.typography.lineHeights.normal}, relaxed=${designSystem.typography.lineHeights.relaxed}`);
  }

  // Spacing - critical for visual accuracy
  tokens.push('\n### Spacing (CRITICAL FOR ACCURACY)');

  if (designSystem.spacing) {
    if (designSystem.spacing.baseUnit) {
      tokens.push(`- Base unit: ${designSystem.spacing.baseUnit}px (use multiples: 4, 8, 12, 16, 24, 32, 48, 64)`);
    }
    if (designSystem.spacing.containerMaxWidth) {
      tokens.push(`- Container max-width: ${designSystem.spacing.containerMaxWidth} (use max-w-7xl or similar)`);
    }
    if (designSystem.spacing.sectionPadding) {
      const sp = designSystem.spacing.sectionPadding;
      tokens.push(`- Section padding: mobile=${sp.mobile}, desktop=${sp.desktop}`);
    }
    if (designSystem.spacing.containerPadding) {
      tokens.push(`- Container padding: ${designSystem.spacing.containerPadding}`);
    }
    if (designSystem.spacing.sectionGap) {
      tokens.push(`- Section gap: ${designSystem.spacing.sectionGap}`);
    }
  }

  // Effects - borders, shadows, transitions
  tokens.push('\n### Effects');

  if (designSystem.effects) {
    if (designSystem.effects.radii) {
      tokens.push(`- Border radius: sm=${designSystem.effects.radii.sm}, md=${designSystem.effects.radii.md}, lg=${designSystem.effects.radii.lg}, full=${designSystem.effects.radii.full}`);
    }
    if (designSystem.effects.shadows) {
      tokens.push(`- Shadows available: ${Object.keys(designSystem.effects.shadows).join(', ')}`);
    }
  }

  // Tailwind class recommendations
  tokens.push('\n### Tailwind Class Recommendations');
  tokens.push(`- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`);
  tokens.push(`- Section: py-16 md:py-24 lg:py-32`);
  tokens.push(`- Heading (hero): text-4xl md:text-5xl lg:text-6xl font-bold leading-tight`);
  tokens.push(`- Heading (section): text-2xl md:text-3xl lg:text-4xl font-semibold`);
  tokens.push(`- Body text: text-base md:text-lg leading-relaxed`);
  tokens.push(`- Primary button: bg-primary text-white px-6 py-3 rounded-lg font-medium`);
  tokens.push(`- Secondary button: border border-primary text-primary px-6 py-3 rounded-lg`);

  return tokens.join('\n');
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Check if AI generation is available
 */
export function isAIGenerationAvailable(): boolean {
  const available = !!process.env.ANTHROPIC_API_KEY;
  console.log(`[AI-Generator] isAIGenerationAvailable: ${available}, key length: ${process.env.ANTHROPIC_API_KEY?.length || 0}`);
  return available;
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
