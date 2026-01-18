/**
 * Semantic UI/UX Analyzer
 *
 * Extracts detailed descriptions of UI elements, layout patterns,
 * and design decisions from captured sections using Playwright.
 *
 * This data can be used for:
 * - AI-powered component regeneration
 * - Better validation feedback
 * - Design system documentation
 * - Future style variations
 */

import type { Page } from 'playwright';

// ====================
// TYPE DEFINITIONS
// ====================

export interface ElementDescription {
  type: 'heading' | 'text' | 'button' | 'link' | 'image' | 'icon' | 'input' | 'card' | 'list' | 'nav' | 'container' | 'unknown';
  role?: string;
  text?: string;
  level?: number; // For headings (h1-h6)
  src?: string; // For images
  alt?: string;
  href?: string; // For links
  alignment?: 'left' | 'center' | 'right';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: string; // e.g., 'primary', 'secondary', 'outline'
  boundingBox: { x: number; y: number; width: number; height: number };
  styles: {
    color?: string;
    backgroundColor?: string;
    fontSize?: string;
    fontWeight?: string;
    fontFamily?: string;
    padding?: string;
    margin?: string;
    borderRadius?: string;
    boxShadow?: string;
  };
  children?: ElementDescription[];
}

export interface LayoutPattern {
  type: 'grid' | 'flex-row' | 'flex-column' | 'stack' | 'centered' | 'sidebar' | 'hero' | 'cards' | 'unknown';
  columns?: number;
  rows?: number;
  gap?: string;
  alignment?: string;
  justification?: string;
}

export interface SectionSemantics {
  sectionId: string;
  sectionType: string;
  summary: string; // Human-readable summary
  purpose: string; // What this section does
  layout: LayoutPattern;
  elements: ElementDescription[];
  colorScheme: {
    background: string[];
    text: string[];
    accent: string[];
  };
  typography: {
    headingFont?: string;
    bodyFont?: string;
    headingSizes: string[];
    bodySizes: string[];
  };
  spacing: {
    sectionPadding: string;
    elementGap: string;
    contentWidth: string;
  };
  interactiveElements: Array<{
    type: 'button' | 'link' | 'input' | 'form';
    text?: string;
    action?: string;
  }>;
  images: Array<{
    src: string;
    alt?: string;
    role: 'hero' | 'decorative' | 'content' | 'icon' | 'logo';
    dimensions: { width: number; height: number };
  }>;
  accessibility: {
    hasLandmarks: boolean;
    headingStructure: string[];
    interactiveElementsCount: number;
  };
}

export interface SemanticExtractionResult {
  url: string;
  extractedAt: string;
  pageTitle: string;
  pageDescription?: string;
  sections: SectionSemantics[];
  globalStyles: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
  };
}

// ====================
// MAIN EXTRACTION FUNCTION
// ====================

/**
 * Extract semantic descriptions from a section
 */
export async function extractSectionSemantics(
  page: Page,
  sectionSelector: string,
  sectionId: string,
  sectionType: string
): Promise<SectionSemantics> {
  const semantics = await page.evaluate(
    ({ selector, id, type }) => {
      const section = document.querySelector(selector);
      if (!section) {
        return null;
      }

      // Helper to get computed styles
      const getStyles = (el: Element) => {
        const computed = getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          fontFamily: computed.fontFamily,
          padding: computed.padding,
          margin: computed.margin,
          borderRadius: computed.borderRadius,
          boxShadow: computed.boxShadow,
        };
      };

      // Helper to determine element size category
      const getSizeCategory = (fontSize: string): 'xs' | 'sm' | 'md' | 'lg' | 'xl' => {
        const size = parseInt(fontSize);
        if (size <= 12) return 'xs';
        if (size <= 14) return 'sm';
        if (size <= 18) return 'md';
        if (size <= 24) return 'lg';
        return 'xl';
      };

      // Helper to determine text alignment
      const getAlignment = (el: Element): 'left' | 'center' | 'right' => {
        const textAlign = getComputedStyle(el).textAlign;
        if (textAlign === 'center') return 'center';
        if (textAlign === 'right' || textAlign === 'end') return 'right';
        return 'left';
      };

      // Helper to determine button variant
      const getButtonVariant = (el: Element): string => {
        const styles = getComputedStyle(el);
        const bg = styles.backgroundColor;
        const border = styles.border;

        if (bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
          if (border && border !== 'none') return 'outline';
          return 'ghost';
        }

        // Check if it looks like a primary button (darker/colored background)
        const bgColor = bg.match(/\d+/g)?.map(Number) || [255, 255, 255];
        const brightness = (bgColor[0] * 299 + bgColor[1] * 587 + bgColor[2] * 114) / 1000;

        return brightness < 128 ? 'primary' : 'secondary';
      };

      // Extract elements recursively
      const extractElements = (container: Element, depth = 0): any[] => {
        if (depth > 5) return []; // Limit depth

        const elements: any[] = [];
        const children = container.children;

        for (const child of Array.from(children)) {
          const tag = child.tagName.toLowerCase();
          const rect = child.getBoundingClientRect();
          const styles = getStyles(child);

          // Skip invisible elements
          if (rect.width === 0 || rect.height === 0) continue;

          let element: any = {
            boundingBox: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            },
            styles: {
              color: styles.color,
              backgroundColor: styles.backgroundColor,
              fontSize: styles.fontSize,
              fontWeight: styles.fontWeight,
              borderRadius: styles.borderRadius,
            },
          };

          // Determine element type
          if (/^h[1-6]$/.test(tag)) {
            element.type = 'heading';
            element.level = parseInt(tag[1]);
            element.text = child.textContent?.trim().substring(0, 100);
            element.alignment = getAlignment(child);
            element.size = getSizeCategory(styles.fontSize);
          } else if (tag === 'p' || tag === 'span') {
            const text = child.textContent?.trim();
            if (text && text.length > 0) {
              element.type = 'text';
              element.text = text.substring(0, 200);
              element.alignment = getAlignment(child);
              element.size = getSizeCategory(styles.fontSize);
            } else {
              continue;
            }
          } else if (tag === 'button' || (tag === 'a' && child.classList.toString().includes('button'))) {
            element.type = 'button';
            element.text = child.textContent?.trim();
            element.variant = getButtonVariant(child);
            element.size = getSizeCategory(styles.fontSize);
          } else if (tag === 'a') {
            element.type = 'link';
            element.text = child.textContent?.trim();
            element.href = (child as HTMLAnchorElement).href;
          } else if (tag === 'img') {
            element.type = 'image';
            element.src = (child as HTMLImageElement).src?.substring(0, 200);
            element.alt = (child as HTMLImageElement).alt;
          } else if (tag === 'svg' || child.querySelector('svg')) {
            element.type = 'icon';
          } else if (tag === 'input' || tag === 'textarea' || tag === 'select') {
            element.type = 'input';
            element.role = (child as HTMLInputElement).type || tag;
          } else if (tag === 'nav') {
            element.type = 'nav';
            element.children = extractElements(child, depth + 1);
          } else if (tag === 'ul' || tag === 'ol') {
            element.type = 'list';
            element.children = extractElements(child, depth + 1);
          } else if (child.children.length > 0) {
            // Container element
            const innerElements = extractElements(child, depth + 1);
            if (innerElements.length > 0) {
              element.type = 'container';
              element.children = innerElements;
            } else {
              continue;
            }
          } else {
            continue;
          }

          elements.push(element);
        }

        return elements;
      };

      // Detect layout pattern
      const detectLayout = (container: Element): any => {
        const styles = getComputedStyle(container);
        const display = styles.display;
        const flexDirection = styles.flexDirection;
        const gridTemplateColumns = styles.gridTemplateColumns;

        if (display === 'grid') {
          const cols = gridTemplateColumns.split(' ').filter(c => c !== 'none').length;
          return {
            type: 'grid',
            columns: cols,
            gap: styles.gap,
          };
        }

        if (display === 'flex') {
          return {
            type: flexDirection === 'column' ? 'flex-column' : 'flex-row',
            gap: styles.gap,
            alignment: styles.alignItems,
            justification: styles.justifyContent,
          };
        }

        // Check for common patterns
        const children = container.children;
        if (children.length >= 3) {
          const firstRect = children[0].getBoundingClientRect();
          const secondRect = children[1]?.getBoundingClientRect();

          if (secondRect && Math.abs(firstRect.y - secondRect.y) < 10) {
            // Children are in a row
            return { type: 'flex-row' };
          }
        }

        return { type: 'stack' };
      };

      // Extract colors used in section
      const extractColors = (container: Element): any => {
        const backgrounds = new Set<string>();
        const texts = new Set<string>();
        const accents = new Set<string>();

        const walk = (el: Element) => {
          const styles = getComputedStyle(el);

          if (styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'transparent') {
            backgrounds.add(styles.backgroundColor);
          }

          if (styles.color) {
            texts.add(styles.color);
          }

          // Check for accent colors (buttons, links)
          const tag = el.tagName.toLowerCase();
          if (tag === 'button' || tag === 'a') {
            if (styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
              accents.add(styles.backgroundColor);
            }
          }

          for (const child of Array.from(el.children)) {
            walk(child);
          }
        };

        walk(container);

        return {
          background: Array.from(backgrounds).slice(0, 5),
          text: Array.from(texts).slice(0, 5),
          accent: Array.from(accents).slice(0, 3),
        };
      };

      // Extract typography info
      const extractTypography = (container: Element): any => {
        const headingSizes = new Set<string>();
        const bodySizes = new Set<string>();
        let headingFont: string | undefined;
        let bodyFont: string | undefined;

        const walk = (el: Element) => {
          const tag = el.tagName.toLowerCase();
          const styles = getComputedStyle(el);

          if (/^h[1-6]$/.test(tag)) {
            headingSizes.add(styles.fontSize);
            if (!headingFont) headingFont = styles.fontFamily.split(',')[0].trim();
          } else if (tag === 'p' || tag === 'span' || tag === 'li') {
            bodySizes.add(styles.fontSize);
            if (!bodyFont) bodyFont = styles.fontFamily.split(',')[0].trim();
          }

          for (const child of Array.from(el.children)) {
            walk(child);
          }
        };

        walk(container);

        return {
          headingFont,
          bodyFont,
          headingSizes: Array.from(headingSizes),
          bodySizes: Array.from(bodySizes),
        };
      };

      // Extract interactive elements
      const extractInteractive = (container: Element): any[] => {
        const interactive: any[] = [];

        const buttons = container.querySelectorAll('button, [role="button"], a.button, .btn');
        buttons.forEach(btn => {
          interactive.push({
            type: 'button',
            text: btn.textContent?.trim().substring(0, 50),
          });
        });

        const links = container.querySelectorAll('a:not(.button):not(.btn)');
        links.forEach(link => {
          const text = link.textContent?.trim();
          if (text && text.length > 0 && text.length < 100) {
            interactive.push({
              type: 'link',
              text: text.substring(0, 50),
              action: (link as HTMLAnchorElement).href,
            });
          }
        });

        const forms = container.querySelectorAll('form');
        forms.forEach(() => {
          interactive.push({ type: 'form' });
        });

        return interactive.slice(0, 20);
      };

      // Extract images
      const extractImages = (container: Element): any[] => {
        const images: any[] = [];

        const imgElements = container.querySelectorAll('img');
        imgElements.forEach(img => {
          const rect = img.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;

          // Determine image role
          let role: 'hero' | 'decorative' | 'content' | 'icon' | 'logo' = 'content';

          if (rect.width > 800 && rect.height > 400) {
            role = 'hero';
          } else if (rect.width < 50 || rect.height < 50) {
            role = 'icon';
          } else if (img.alt?.toLowerCase().includes('logo')) {
            role = 'logo';
          } else if (!img.alt || img.alt === '') {
            role = 'decorative';
          }

          images.push({
            src: img.src?.substring(0, 200),
            alt: img.alt,
            role,
            dimensions: {
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            },
          });
        });

        return images.slice(0, 20);
      };

      // Extract accessibility info
      const extractAccessibility = (container: Element): any => {
        const landmarks = container.querySelectorAll('main, nav, header, footer, aside, section[aria-label], [role]');
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const interactive = container.querySelectorAll('button, a, input, select, textarea');

        const headingStructure: string[] = [];
        headings.forEach(h => {
          headingStructure.push(`${h.tagName}: ${h.textContent?.trim().substring(0, 30)}`);
        });

        return {
          hasLandmarks: landmarks.length > 0,
          headingStructure: headingStructure.slice(0, 10),
          interactiveElementsCount: interactive.length,
        };
      };

      // Generate summary
      const generateSummary = (sectionType: string, elements: any[], images: any[], interactive: any[]): string => {
        const parts: string[] = [];

        // Section type description
        const typeDescriptions: Record<string, string> = {
          hero: 'Hero section with prominent headline and call-to-action',
          header: 'Navigation header with menu and branding',
          footer: 'Footer section with links and information',
          features: 'Feature showcase section',
          testimonials: 'Customer testimonials section',
          pricing: 'Pricing plans section',
          cta: 'Call-to-action section',
          faq: 'Frequently asked questions section',
        };

        parts.push(typeDescriptions[sectionType] || `${sectionType} section`);

        // Count key elements
        const headings = elements.filter(e => e.type === 'heading');
        const buttons = interactive.filter(e => e.type === 'button');
        const heroImages = images.filter(i => i.role === 'hero');

        if (headings.length > 0) {
          parts.push(`${headings.length} heading(s)`);
        }
        if (buttons.length > 0) {
          parts.push(`${buttons.length} button(s)`);
        }
        if (heroImages.length > 0) {
          parts.push('with hero image');
        } else if (images.length > 0) {
          parts.push(`${images.length} image(s)`);
        }

        return parts.join(', ');
      };

      // Extract spacing
      const sectionStyles = getComputedStyle(section);
      const spacing = {
        sectionPadding: sectionStyles.padding,
        elementGap: sectionStyles.gap || '0px',
        contentWidth: `${section.getBoundingClientRect().width}px`,
      };

      // Build the result
      const elements = extractElements(section);
      const images = extractImages(section);
      const interactive = extractInteractive(section);

      return {
        sectionId: id,
        sectionType: type,
        summary: generateSummary(type, elements, images, interactive),
        purpose: `Displays ${type} content to users`,
        layout: detectLayout(section),
        elements,
        colorScheme: extractColors(section),
        typography: extractTypography(section),
        spacing,
        interactiveElements: interactive,
        images,
        accessibility: extractAccessibility(section),
      };
    },
    { selector: sectionSelector, id: sectionId, type: sectionType }
  );

  if (!semantics) {
    return {
      sectionId,
      sectionType,
      summary: 'Section not found',
      purpose: 'Unknown',
      layout: { type: 'unknown' },
      elements: [],
      colorScheme: { background: [], text: [], accent: [] },
      typography: { headingSizes: [], bodySizes: [] },
      spacing: { sectionPadding: '0px', elementGap: '0px', contentWidth: '0px' },
      interactiveElements: [],
      images: [],
      accessibility: { hasLandmarks: false, headingStructure: [], interactiveElementsCount: 0 },
    };
  }

  return semantics;
}

/**
 * Extract semantics for all sections on a page
 */
export async function extractPageSemantics(
  page: Page,
  sections: Array<{ id: string; type: string; boundingBox: { y: number; height: number } }>
): Promise<SemanticExtractionResult> {
  const title = await page.title();
  const description = await page.$eval(
    'meta[name="description"]',
    (el) => el.getAttribute('content')
  ).catch(() => undefined) ?? undefined;

  const sectionSemantics: SectionSemantics[] = [];

  for (const section of sections) {
    // Scroll to section for accurate extraction
    await page.evaluate((y) => window.scrollTo(0, y), section.boundingBox.y);
    await page.waitForTimeout(100);

    // Try to find the section by its position
    const selector = `[data-section-id="${section.id}"], [data-framer-name]`;

    const semantics = await extractSectionSemantics(
      page,
      selector,
      section.id,
      section.type
    );

    sectionSemantics.push(semantics);
  }

  // Extract global styles
  const globalStyles = await page.evaluate(() => {
    const body = document.body;
    const styles = getComputedStyle(body);

    // Find primary button for accent color
    const primaryBtn = document.querySelector('button, .btn, [role="button"]');
    const primaryColor = primaryBtn ? getComputedStyle(primaryBtn).backgroundColor : undefined;

    return {
      backgroundColor: styles.backgroundColor,
      textColor: styles.color,
      fontFamily: styles.fontFamily.split(',')[0].trim(),
      primaryColor: primaryColor !== 'rgba(0, 0, 0, 0)' ? primaryColor : undefined,
    };
  });

  return {
    url: page.url(),
    extractedAt: new Date().toISOString(),
    pageTitle: title,
    pageDescription: description,
    sections: sectionSemantics,
    globalStyles,
  };
}

/**
 * Format semantic extraction as human-readable text
 */
export function formatSemanticReport(result: SemanticExtractionResult): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('              SEMANTIC UI/UX EXTRACTION REPORT');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push(`Page: ${result.pageTitle}`);
  lines.push(`URL: ${result.url}`);
  lines.push(`Extracted: ${new Date(result.extractedAt).toLocaleString()}`);
  lines.push('');

  if (result.globalStyles.fontFamily) {
    lines.push(`Primary Font: ${result.globalStyles.fontFamily}`);
  }
  if (result.globalStyles.primaryColor) {
    lines.push(`Primary Color: ${result.globalStyles.primaryColor}`);
  }
  lines.push('───────────────────────────────────────────────────────────');

  for (const section of result.sections) {
    lines.push('');
    lines.push(`## ${section.sectionType.toUpperCase()} (${section.sectionId})`);
    lines.push(`   ${section.summary}`);
    lines.push('');
    lines.push(`   Layout: ${section.layout.type}${section.layout.columns ? ` (${section.layout.columns} columns)` : ''}`);
    lines.push(`   Spacing: ${section.spacing.sectionPadding}`);

    if (section.colorScheme.background.length > 0) {
      lines.push(`   Background: ${section.colorScheme.background[0]}`);
    }

    if (section.typography.headingFont) {
      lines.push(`   Heading Font: ${section.typography.headingFont}`);
    }

    if (section.interactiveElements.length > 0) {
      lines.push(`   Interactive: ${section.interactiveElements.map(e => e.text || e.type).join(', ')}`);
    }

    if (section.images.length > 0) {
      lines.push(`   Images: ${section.images.length} (${section.images.map(i => i.role).join(', ')})`);
    }

    lines.push(`   Accessibility: ${section.accessibility.interactiveElementsCount} interactive elements`);
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');

  return lines.join('\n');
}
