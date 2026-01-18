/**
 * Platform Detector
 *
 * Detects which platform/CMS a website was built with based on
 * HTML structure, CSS classes, and other signatures.
 */

export type Platform =
  | 'framer'
  | 'webflow'
  | 'wordpress-elementor'
  | 'wordpress-gutenberg'
  | 'wix'
  | 'squarespace'
  | 'shopify'
  | 'nextjs'
  | 'unknown';

export interface PlatformDetectionResult {
  platform: Platform;
  confidence: number; // 0-1
  signatures: string[];
  metadata: Record<string, unknown>;
}

interface PlatformSignature {
  platform: Platform;
  htmlPatterns: RegExp[];
  cssPatterns: RegExp[];
  metaPatterns: RegExp[];
  weight: number;
}

const PLATFORM_SIGNATURES: PlatformSignature[] = [
  {
    platform: 'framer',
    htmlPatterns: [
      /class="[^"]*framer-[a-zA-Z0-9]+/,
      /data-framer-/,
      /data-framer-name=/,
      /data-framer-component-type=/,
      /__framer-badge-container/,
    ],
    cssPatterns: [
      /--token-[a-f0-9-]+/,
      /\.framer-[a-zA-Z0-9]+/,
      /framer-styles-preset/,
      /\.ssr-variant/,
      /\.hidden-[a-z0-9]+/,
    ],
    metaPatterns: [
      /framer\.com/,
      /framerusercontent\.com/,
    ],
    weight: 1,
  },
  {
    platform: 'webflow',
    htmlPatterns: [
      /class="[^"]*w-[a-z-]+/,
      /data-wf-/,
      /data-w-id=/,
      /w-condition-invisible/,
    ],
    cssPatterns: [
      /--wf-/,
      /\.w-[a-z-]+/,
      /\.w-richtext/,
      /\.w-container/,
    ],
    metaPatterns: [
      /webflow\.com/,
      /assets\.website-files\.com/,
    ],
    weight: 1,
  },
  {
    platform: 'wordpress-elementor',
    htmlPatterns: [
      /class="[^"]*elementor-/,
      /data-elementor-/,
      /data-widget_type=/,
      /elementor-section/,
    ],
    cssPatterns: [
      /--e-/,
      /\.elementor-/,
      /\.e-/,
    ],
    metaPatterns: [
      /wp-content/,
      /elementor/i,
    ],
    weight: 1,
  },
  {
    platform: 'wordpress-gutenberg',
    htmlPatterns: [
      /class="[^"]*wp-block-/,
      /data-wp-/,
      /wp-block-/,
    ],
    cssPatterns: [
      /\.wp-block-/,
      /--wp--/,
    ],
    metaPatterns: [
      /wp-content/,
      /wordpress/i,
    ],
    weight: 0.8,
  },
  {
    platform: 'wix',
    htmlPatterns: [
      /class="[^"]*_[a-zA-Z0-9]+_/,
      /data-hook=/,
      /comp-[a-zA-Z0-9]+/,
      /wixui\./,
    ],
    cssPatterns: [
      /--wix-/,
      /\._[a-zA-Z0-9]+_/,
    ],
    metaPatterns: [
      /wix\.com/,
      /static\.wixstatic\.com/,
    ],
    weight: 1,
  },
  {
    platform: 'squarespace',
    htmlPatterns: [
      /class="[^"]*sqs-/,
      /data-block-type=/,
      /sqs-block/,
    ],
    cssPatterns: [
      /--sqs-/,
      /\.sqs-/,
    ],
    metaPatterns: [
      /squarespace\.com/,
      /static1\.squarespace\.com/,
    ],
    weight: 1,
  },
  {
    platform: 'shopify',
    htmlPatterns: [
      /class="[^"]*shopify-/,
      /data-shopify/,
      /shopify-section/,
    ],
    cssPatterns: [
      /--shopify-/,
      /\.shopify-/,
    ],
    metaPatterns: [
      /shopify\.com/,
      /cdn\.shopify\.com/,
    ],
    weight: 1,
  },
  {
    platform: 'nextjs',
    htmlPatterns: [
      /__next/,
      /data-nextjs-/,
      /_next\/static/,
    ],
    cssPatterns: [
      /\.__className_/,
    ],
    metaPatterns: [
      /_next\//,
      /vercel\.app/,
    ],
    weight: 0.5, // Lower weight as Next.js is often used with other systems
  },
];

/**
 * Detect platform from HTML content
 */
export function detectPlatform(
  html: string,
  css: string = '',
  meta: string = ''
): PlatformDetectionResult {
  const scores: Map<Platform, { score: number; signatures: string[] }> = new Map();

  // Initialize scores
  for (const sig of PLATFORM_SIGNATURES) {
    scores.set(sig.platform, { score: 0, signatures: [] });
  }

  // Check each platform's signatures
  for (const platformSig of PLATFORM_SIGNATURES) {
    const entry = scores.get(platformSig.platform)!;

    // Check HTML patterns
    for (const pattern of platformSig.htmlPatterns) {
      if (pattern.test(html)) {
        entry.score += platformSig.weight;
        entry.signatures.push(`html: ${pattern.source}`);
      }
    }

    // Check CSS patterns
    for (const pattern of platformSig.cssPatterns) {
      if (pattern.test(css)) {
        entry.score += platformSig.weight;
        entry.signatures.push(`css: ${pattern.source}`);
      }
    }

    // Check meta patterns
    for (const pattern of platformSig.metaPatterns) {
      if (pattern.test(meta) || pattern.test(html)) {
        entry.score += platformSig.weight * 0.5;
        entry.signatures.push(`meta: ${pattern.source}`);
      }
    }
  }

  // Find the platform with highest score
  let maxScore = 0;
  let detectedPlatform: Platform = 'unknown';
  let matchedSignatures: string[] = [];

  scores.forEach((data, platform) => {
    if (data.score > maxScore) {
      maxScore = data.score;
      detectedPlatform = platform;
      matchedSignatures = data.signatures;
    }
  });

  // Calculate confidence (normalize score)
  const maxPossibleScore = Math.max(
    ...PLATFORM_SIGNATURES.map(s =>
      (s.htmlPatterns.length + s.cssPatterns.length + s.metaPatterns.length * 0.5) * s.weight
    )
  );
  const confidence = Math.min(maxScore / maxPossibleScore, 1);

  return {
    platform: confidence > 0.1 ? detectedPlatform : 'unknown',
    confidence,
    signatures: matchedSignatures,
    metadata: extractPlatformMetadata(detectedPlatform, html, css),
  };
}

/**
 * Extract platform-specific metadata
 */
function extractPlatformMetadata(
  platform: Platform,
  html: string,
  css: string
): Record<string, unknown> {
  switch (platform) {
    case 'framer':
      return extractFramerMetadata(html, css);
    case 'webflow':
      return extractWebflowMetadata(html, css);
    default:
      return {};
  }
}

/**
 * Extract Framer-specific metadata
 */
function extractFramerMetadata(html: string, css: string): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};

  // Find page-level wrapper classes (framer-XXXXX)
  const pageClassMatches = css.match(/\.framer-([a-zA-Z0-9]+)\s*\{[^}]*flex-flow|\.framer-([a-zA-Z0-9]+)\.framer-/g);
  if (pageClassMatches) {
    const pageClasses = new Set<string>();
    for (const match of pageClassMatches) {
      const classMatch = match.match(/\.framer-([a-zA-Z0-9]+)/);
      if (classMatch) {
        pageClasses.add(`framer-${classMatch[1]}`);
      }
    }
    metadata.pageClasses = Array.from(pageClasses);
  }

  // Find layout wrapper class (the one that other selectors depend on)
  const layoutClassPattern = /\.framer-([a-zA-Z0-9]+)\s+\.framer-/g;
  const layoutClassCounts = new Map<string, number>();
  let layoutMatch;
  while ((layoutMatch = layoutClassPattern.exec(css)) !== null) {
    const className = `framer-${layoutMatch[1]}`;
    layoutClassCounts.set(className, (layoutClassCounts.get(className) || 0) + 1);
  }

  // The most referenced parent class is likely the layout wrapper
  let maxCount = 0;
  let layoutClass = '';
  layoutClassCounts.forEach((count, className) => {
    if (count > maxCount) {
      maxCount = count;
      layoutClass = className;
    }
  });
  if (layoutClass) {
    metadata.layoutWrapperClass = layoutClass;
  }

  // Find font preset wrapper class
  const fontPresetPattern = /\.framer-([a-zA-Z0-9]+)\s+\.framer-styles-preset/g;
  const fontClassCounts = new Map<string, number>();
  let fontMatch;
  while ((fontMatch = fontPresetPattern.exec(css)) !== null) {
    const className = `framer-${fontMatch[1]}`;
    fontClassCounts.set(className, (fontClassCounts.get(className) || 0) + 1);
  }

  let fontMaxCount = 0;
  let fontClass = '';
  fontClassCounts.forEach((count, className) => {
    if (count > fontMaxCount) {
      fontMaxCount = count;
      fontClass = className;
    }
  });
  if (fontClass) {
    metadata.fontPresetWrapperClass = fontClass;
  }

  // Find CSS tokens
  const tokenMatches = css.match(/--token-[a-f0-9-]+/g);
  if (tokenMatches) {
    metadata.tokenCount = new Set(tokenMatches).size;
  }

  // Detect responsive breakpoint classes
  const breakpointMatches = css.match(/\.hidden-[a-z0-9]+/g);
  if (breakpointMatches) {
    metadata.breakpointClasses = Array.from(new Set(breakpointMatches));
  }

  // Check for SSR variants
  metadata.hasSSRVariants = html.includes('ssr-variant') || css.includes('.ssr-variant');

  return metadata;
}

/**
 * Extract Webflow-specific metadata
 */
function extractWebflowMetadata(html: string, css: string): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};

  // Find interaction classes
  const interactionMatches = html.match(/data-w-id="[^"]+"/g);
  if (interactionMatches) {
    metadata.interactionCount = interactionMatches.length;
  }

  // Find collection classes
  metadata.hasCollections = html.includes('w-dyn-');

  return metadata;
}

export default detectPlatform;
