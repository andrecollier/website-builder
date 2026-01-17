/**
 * Style Extractor Module
 *
 * Extracts computed styles from DOM elements using Playwright.
 * Converts CSS to inline styles for accurate visual reproduction.
 */

import type { Page, ElementHandle } from 'playwright';

/**
 * CSS properties to extract for accurate visual reproduction
 * Reduced set to avoid bloat while maintaining visual fidelity
 */
const STYLE_PROPERTIES = [
  // Layout (essential)
  'display',
  'position',
  'zIndex',

  // Positioning (critical for absolute/fixed elements)
  'top',
  'right',
  'bottom',
  'left',
  'transform',

  // Flexbox (essential for layout)
  'flexDirection',
  'justifyContent',
  'alignItems',
  'gap',

  // Box model (essential)
  'width',
  'height',
  'maxWidth',
  'padding',
  'margin',

  // Typography (essential)
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'textAlign',
  'color',

  // Colors & backgrounds (essential)
  'backgroundColor',
  'backgroundImage',

  // Borders (essential)
  'borderRadius',
  'border',

  // Effects (important for visual polish)
  'boxShadow',
  'opacity',
  'overflow',
  'objectFit',
];

/**
 * Extracted element with computed styles
 */
export interface ExtractedElement {
  tagName: string;
  attributes: Record<string, string>;
  computedStyles: Record<string, string>;
  innerText?: string;
  children: ExtractedElement[];
  innerHTML?: string;
}

/**
 * Extract computed styles from a single element
 */
async function extractElementStyles(
  page: Page,
  selector: string,
  maxDepth: number = 10
): Promise<ExtractedElement | null> {
  return page.evaluate(
    ({ selector, properties, maxDepth }) => {
      const element = document.querySelector(selector);
      if (!element) return null;

      // Use arrow function to avoid __name helper injection from esbuild/tsx
      const extractElement = (el: Element, depth: number): any => {
        if (depth > maxDepth) return null;

        const computed = window.getComputedStyle(el);
        const styles: Record<string, string> = {};

        // Extract specified properties
        for (const prop of properties) {
          const value = computed.getPropertyValue(
            prop.replace(/([A-Z])/g, '-$1').toLowerCase()
          );
          // Only include non-default values
          if (value && value !== 'none' && value !== 'normal' && value !== 'auto' && value !== '0px' && value !== 'rgba(0, 0, 0, 0)') {
            styles[prop] = value;
          }
        }

        // Get attributes
        const attrs: Record<string, string> = {};
        for (const attr of el.attributes) {
          if (!attr.name.startsWith('data-framer') && attr.name !== 'class') {
            attrs[attr.name] = attr.value;
          }
        }

        // Keep src, href, alt for important elements
        if (el.tagName === 'IMG') {
          attrs['src'] = (el as HTMLImageElement).src;
          attrs['alt'] = (el as HTMLImageElement).alt || '';
        }
        if (el.tagName === 'A') {
          attrs['href'] = (el as HTMLAnchorElement).href;
        }

        // Get children (limit to important elements)
        const children: any[] = [];
        const childElements = el.children;
        for (let i = 0; i < Math.min(childElements.length, 50); i++) {
          const child = extractElement(childElements[i], depth + 1);
          if (child) children.push(child);
        }

        // Get text content if no children
        let innerText: string | undefined;
        if (children.length === 0 && el.textContent) {
          innerText = el.textContent.trim().slice(0, 500);
        }

        return {
          tagName: el.tagName.toLowerCase(),
          attributes: attrs,
          computedStyles: styles,
          innerText,
          children,
        };
      };

      return extractElement(element, 0);
    },
    { selector, properties: STYLE_PROPERTIES, maxDepth }
  );
}

/**
 * Extract a section with full computed styles
 */
export async function extractSectionWithStyles(
  page: Page,
  boundingBox: { x: number; y: number; width: number; height: number }
): Promise<{ html: string; styles: Record<string, string> }> {
  // Find the element at this position and extract its computed styles
  const result = await page.evaluate(
    ({ y, height, properties }) => {
      // Find elements in this Y range
      const allElements = document.querySelectorAll('section, article, main > div, [class*="section"], [data-framer-name], header, footer, nav');
      let bestMatch: Element | null = null;
      let bestOverlap = 0;

      allElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const elemTop = rect.top + window.scrollY;
        const elemBottom = elemTop + rect.height;
        const sectionTop = y;
        const sectionBottom = y + height;

        const overlapTop = Math.max(elemTop, sectionTop);
        const overlapBottom = Math.min(elemBottom, sectionBottom);
        const overlap = Math.max(0, overlapBottom - overlapTop);

        if (overlap > bestOverlap && overlap > height * 0.3) {
          bestOverlap = overlap;
          bestMatch = el;
        }
      });

      if (!bestMatch) {
        return { html: '', styles: {} };
      }

      // Helper to find background from parent elements
      // Use arrow function to avoid __name helper injection from esbuild/tsx
      const findParentBackground = (el: Element): { backgroundColor?: string; backgroundImage?: string } => {
        let current: Element | null = el;
        while (current && current !== document.body) {
          const computed = window.getComputedStyle(current);
          const bgColor = computed.getPropertyValue('background-color');
          const bgImage = computed.getPropertyValue('background-image');

          // Check if this element has a real background
          const hasRealBg = bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent' && bgColor !== 'rgb(255, 255, 255)';
          const hasGradient = bgImage && bgImage !== 'none';

          if (hasRealBg || hasGradient) {
            return {
              backgroundColor: hasRealBg ? bgColor : undefined,
              backgroundImage: hasGradient ? bgImage : undefined
            };
          }
          current = current.parentElement;
        }
        return {};
      };

      // Helper to find gradient background from child elements (Framer backdrop layers)
      // Use arrow function to avoid __name helper injection from esbuild/tsx
      const findChildGradient = (el: Element): { backgroundColor?: string; backgroundImage?: string } => {
        // Look for direct children that might be backdrop layers
        const children = el.querySelectorAll(':scope > div, :scope > *');
        for (let i = 0; i < Math.min(children.length, 5); i++) {
          const child = children[i];
          const computed = window.getComputedStyle(child);
          const bgImage = computed.getPropertyValue('background-image');
          const bgColor = computed.getPropertyValue('background-color');
          const rect = child.getBoundingClientRect();
          const parentRect = el.getBoundingClientRect();

          // Check if this is a full-width backdrop element with a gradient
          const isFullWidth = rect.width >= parentRect.width * 0.9;
          const hasGradient = bgImage && bgImage !== 'none' && bgImage.includes('gradient');
          const hasDarkBg = bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent' && bgColor !== 'rgb(255, 255, 255)';

          if ((hasGradient || hasDarkBg) && isFullWidth) {
            return {
              backgroundColor: hasDarkBg ? bgColor : undefined,
              backgroundImage: hasGradient ? bgImage : undefined
            };
          }

          // Also check nested children (Framer uses nested divs)
          const nestedChildren = child.querySelectorAll(':scope > div');
          for (let j = 0; j < Math.min(nestedChildren.length, 3); j++) {
            const nested = nestedChildren[j];
            const nestedComputed = window.getComputedStyle(nested);
            const nestedBgImage = nestedComputed.getPropertyValue('background-image');
            const nestedBgColor = nestedComputed.getPropertyValue('background-color');
            const nestedRect = nested.getBoundingClientRect();

            const isNestedFullWidth = nestedRect.width >= parentRect.width * 0.9;
            const hasNestedGradient = nestedBgImage && nestedBgImage !== 'none' && nestedBgImage.includes('gradient');
            const hasNestedDarkBg = nestedBgColor && nestedBgColor !== 'rgba(0, 0, 0, 0)' && nestedBgColor !== 'transparent' && nestedBgColor !== 'rgb(255, 255, 255)';

            if ((hasNestedGradient || hasNestedDarkBg) && isNestedFullWidth) {
              return {
                backgroundColor: hasNestedDarkBg ? nestedBgColor : undefined,
                backgroundImage: hasNestedGradient ? nestedBgImage : undefined
              };
            }
          }
        }
        return {};
      };

      // Function to inline computed styles into HTML
      // Use arrow function to avoid __name helper injection from esbuild/tsx
      const processElement = (el: Element, isRoot: boolean = false): string => {
        const computed = window.getComputedStyle(el);
        const styleObj: string[] = [];

        // For root element, check if we need to inherit background from parent or find it in children
        let inheritedBg: { backgroundColor?: string; backgroundImage?: string } = {};
        if (isRoot) {
          const directBg = computed.getPropertyValue('background-color');
          const directBgImage = computed.getPropertyValue('background-image');
          const hasDirectBg = directBg && directBg !== 'rgba(0, 0, 0, 0)' && directBg !== 'transparent' && directBg !== 'rgb(255, 255, 255)';
          const hasDirectGradient = directBgImage && directBgImage !== 'none';

          if (!hasDirectBg && !hasDirectGradient) {
            // First look for gradient in child elements (Framer backdrop layers)
            inheritedBg = findChildGradient(el);

            // If not found in children, look in parent elements
            if (!inheritedBg.backgroundColor && !inheritedBg.backgroundImage && el.parentElement) {
              inheritedBg = findParentBackground(el.parentElement);
            }
          }
        }

        for (const prop of properties) {
          const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
          let value = computed.getPropertyValue(cssProp);

          // Skip default/empty values
          if (!value || value === 'none' || value === 'normal' || value === 'auto' ||
              value === '0px' || value === 'rgba(0, 0, 0, 0)' || value === 'rgb(0, 0, 0)' ||
              value === 'transparent' || value === 'start' || value === 'stretch') {
            // For background properties, use inherited value if available
            if (isRoot && prop === 'backgroundColor' && inheritedBg.backgroundColor) {
              value = inheritedBg.backgroundColor;
            } else if (isRoot && prop === 'backgroundImage' && inheritedBg.backgroundImage) {
              value = inheritedBg.backgroundImage;
            } else {
              continue;
            }
          }

          // Skip inherited font-family if it's just system fonts
          if (prop === 'fontFamily' && value.includes('system-ui')) {
            continue;
          }

          // Escape double quotes in values (especially for font-family)
          value = value.replace(/"/g, "'");

          // Simplify font-family to just the first font
          if (prop === 'fontFamily') {
            const firstFont = value.split(',')[0].trim().replace(/'/g, '');
            value = `'${firstFont}', sans-serif`;
          }

          styleObj.push(`${cssProp}: ${value}`);
        }

        const tagName = el.tagName.toLowerCase();
        const styleAttr = styleObj.length > 0 ? ` style="${styleObj.join('; ')}"` : '';

        // Build attributes
        let attrs = '';

        // Keep important attributes
        if (tagName === 'img') {
          const img = el as HTMLImageElement;
          attrs += ` src="${img.src}"`;
          if (img.alt) attrs += ` alt="${img.alt}"`;
        } else if (tagName === 'a') {
          const a = el as HTMLAnchorElement;
          attrs += ` href="${a.href}"`;
        } else if (tagName === 'button' || tagName === 'input') {
          const type = el.getAttribute('type');
          if (type) attrs += ` type="${type}"`;
        }

        // Process children
        let innerHTML = '';
        if (el.children.length > 0) {
          for (let i = 0; i < el.children.length; i++) {
            innerHTML += processElement(el.children[i], false);
          }
        } else {
          // Text content
          innerHTML = el.textContent?.trim() || '';
        }

        // Self-closing tags
        if (['img', 'br', 'hr', 'input'].includes(tagName)) {
          return `<${tagName}${attrs}${styleAttr} />`;
        }

        return `<${tagName}${attrs}${styleAttr}>${innerHTML}</${tagName}>`;
      };

      const html = processElement(bestMatch, true);

      // Get root styles (including inherited background from parent or child)
      const rootComputed = window.getComputedStyle(bestMatch);
      const rootStyles: Record<string, string> = {};

      // First check child elements for gradient backgrounds (Framer backdrop layers)
      let inheritedBackground = findChildGradient(bestMatch);
      // If not found in children, check parent elements
      if (!inheritedBackground.backgroundColor && !inheritedBackground.backgroundImage && bestMatch.parentElement) {
        inheritedBackground = findParentBackground(bestMatch.parentElement);
      }

      for (const prop of properties) {
        const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        let value = rootComputed.getPropertyValue(cssProp);

        // For background, use inherited value if element has transparent/white background
        if (prop === 'backgroundColor') {
          if (!value || value === 'rgba(0, 0, 0, 0)' || value === 'transparent' || value === 'rgb(255, 255, 255)') {
            if (inheritedBackground.backgroundColor) {
              value = inheritedBackground.backgroundColor;
            }
          }
        } else if (prop === 'backgroundImage') {
          if (!value || value === 'none') {
            if (inheritedBackground.backgroundImage) {
              value = inheritedBackground.backgroundImage;
            }
          }
        }

        if (value && value !== 'none' && value !== 'auto') {
          rootStyles[prop] = value;
        }
      }

      // Also find any large images in the region that might be background images
      // (Framer often has images in sibling elements, not children)
      const regionImages: string[] = [];
      const allImages = document.querySelectorAll('img');
      allImages.forEach((img) => {
        const rect = img.getBoundingClientRect();
        const imgTop = rect.top + window.scrollY;
        const imgBottom = imgTop + rect.height;

        // Check if image overlaps with section region
        const overlapsSection = imgTop < (y + height) && imgBottom > y;
        const isLargeImage = rect.width > 400 && rect.height > 200;

        if (overlapsSection && isLargeImage && img.src && !html.includes(img.src)) {
          // Image is in region but not already captured - add it as absolute positioned background
          const computed = window.getComputedStyle(img);
          const imgStyles = [
            'position: absolute',
            `width: ${rect.width}px`,
            `height: ${rect.height}px`,
            `top: ${imgTop - y}px`,
            'left: 0',
            'z-index: 0',
            `border-radius: ${computed.borderRadius}`,
            'object-fit: cover'
          ].join('; ');
          regionImages.push(`<img src="${img.src}" alt="${img.alt || ''}" style="${imgStyles}" />`);
        }
      });

      // Prepend region images to HTML if any found
      const finalHtml = regionImages.length > 0
        ? regionImages.join('') + html
        : html;

      return { html: finalHtml, styles: rootStyles };
    },
    { y: boundingBox.y, height: boundingBox.height, properties: STYLE_PROPERTIES }
  );

  return result;
}

/**
 * Convert extracted element tree to JSX with inline styles
 */
export function elementToJsx(element: ExtractedElement, indent: number = 0): string {
  const spaces = '  '.repeat(indent);
  const { tagName, attributes, computedStyles, innerText, children } = element;

  // Build style object
  const styleEntries = Object.entries(computedStyles)
    .map(([key, value]) => {
      // Convert to camelCase
      const camelKey = key.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      // Escape quotes in value
      const escapedValue = value.replace(/"/g, '\\"');
      return `${camelKey}: '${escapedValue}'`;
    });

  const styleAttr = styleEntries.length > 0
    ? ` style={{ ${styleEntries.join(', ')} }}`
    : '';

  // Build other attributes
  const attrEntries = Object.entries(attributes)
    .filter(([key]) => key !== 'style' && key !== 'class')
    .map(([key, value]) => {
      if (key === 'class') return `className="${value}"`;
      if (key === 'for') return `htmlFor="${value}"`;
      return `${key}="${value}"`;
    });

  const attrsStr = attrEntries.length > 0 ? ' ' + attrEntries.join(' ') : '';

  // Self-closing tags
  if (['img', 'br', 'hr', 'input'].includes(tagName)) {
    return `${spaces}<${tagName}${attrsStr}${styleAttr} />`;
  }

  // Handle children or text
  if (children.length > 0) {
    const childrenJsx = children
      .map(child => elementToJsx(child, indent + 1))
      .join('\n');
    return `${spaces}<${tagName}${attrsStr}${styleAttr}>\n${childrenJsx}\n${spaces}</${tagName}>`;
  } else if (innerText) {
    return `${spaces}<${tagName}${attrsStr}${styleAttr}>${innerText}</${tagName}>`;
  } else {
    return `${spaces}<${tagName}${attrsStr}${styleAttr} />`;
  }
}

/**
 * Clean up HTML by removing Framer-specific attributes and fixing common issues
 */
export function cleanHtmlForReact(html: string): string {
  return html
    // Remove Framer data attributes
    .replace(/\s*data-framer-[^=]*="[^"]*"/gi, '')
    // Remove class attributes (we're using inline styles)
    .replace(/\s*class="[^"]*"/gi, '')
    // Fix style attribute format for JSX
    .replace(/style="([^"]*)"/g, (_, styles) => {
      const styleObj = styles.split(';')
        .filter((s: string) => s.trim())
        .map((s: string) => {
          const [prop, ...valueParts] = s.split(':');
          if (!prop || valueParts.length === 0) return '';
          const value = valueParts.join(':').trim();
          const camelProp = prop.trim().replace(/-([a-z])/g, (_: string, l: string) => l.toUpperCase());
          return `${camelProp}: '${value.replace(/'/g, "\\'")}'`;
        })
        .filter((s: string) => s)
        .join(', ');
      return styleObj ? `style={{ ${styleObj} }}` : '';
    })
    // Self-close void elements
    .replace(/<(img|br|hr|input)([^>]*?)(?<!\/)>/gi, '<$1$2 />')
    // Remove empty style attributes
    .replace(/\s*style=\{\{\s*\}\}/g, '');
}
