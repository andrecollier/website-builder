/**
 * Responsive Styles Module
 *
 * Analyzes styles across breakpoints and generates responsive Tailwind classes
 * for component generation.
 */

import type { ViewportStyles } from '@/lib/playwright/responsive-capture';

// ====================
// TYPES
// ====================

/**
 * Responsive style change for a single property
 */
export interface ResponsiveStyleChange {
  property: string;
  /** Base value (mobile-first) */
  base: string;
  /** Tablet override (md:) */
  md?: string;
  /** Desktop override (lg:) */
  lg?: string;
  /** Extra large override (xl:) */
  xl?: string;
}

/**
 * Generated responsive class set
 */
export interface ResponsiveClasses {
  /** Base classes (no prefix, mobile-first) */
  base: string[];
  /** Medium breakpoint classes */
  md: string[];
  /** Large breakpoint classes */
  lg: string[];
  /** Extra large breakpoint classes */
  xl: string[];
}

/**
 * Layout analysis result
 */
export interface LayoutAnalysis {
  /** Layout type at each breakpoint */
  layoutType: {
    mobile: 'stack' | 'grid' | 'flex-row' | 'flex-col';
    tablet: 'stack' | 'grid' | 'flex-row' | 'flex-col';
    desktop: 'stack' | 'grid' | 'flex-row' | 'flex-col';
  };
  /** Number of columns at each breakpoint */
  columns: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  /** Gap values */
  gap: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

// ====================
// CSS TO TAILWIND MAPPINGS
// ====================

/**
 * Map CSS display values to Tailwind
 */
const DISPLAY_MAP: Record<string, string> = {
  flex: 'flex',
  grid: 'grid',
  block: 'block',
  'inline-block': 'inline-block',
  inline: 'inline',
  'inline-flex': 'inline-flex',
  none: 'hidden',
};

/**
 * Map CSS flex-direction to Tailwind
 */
const FLEX_DIRECTION_MAP: Record<string, string> = {
  row: 'flex-row',
  'row-reverse': 'flex-row-reverse',
  column: 'flex-col',
  'column-reverse': 'flex-col-reverse',
};

/**
 * Map CSS justify-content to Tailwind
 */
const JUSTIFY_MAP: Record<string, string> = {
  'flex-start': 'justify-start',
  'flex-end': 'justify-end',
  center: 'justify-center',
  'space-between': 'justify-between',
  'space-around': 'justify-around',
  'space-evenly': 'justify-evenly',
};

/**
 * Map CSS align-items to Tailwind
 */
const ALIGN_MAP: Record<string, string> = {
  'flex-start': 'items-start',
  'flex-end': 'items-end',
  center: 'items-center',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
};

/**
 * Map CSS text-align to Tailwind
 */
const TEXT_ALIGN_MAP: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

/**
 * Convert pixel value to Tailwind spacing class
 */
function pxToSpacing(px: string): string {
  const num = parseInt(px, 10);
  if (isNaN(num)) return '';

  // Tailwind spacing scale
  const scale: Record<number, string> = {
    0: '0',
    1: '0.5',
    2: '0.5',
    4: '1',
    6: '1.5',
    8: '2',
    10: '2.5',
    12: '3',
    14: '3.5',
    16: '4',
    20: '5',
    24: '6',
    28: '7',
    32: '8',
    36: '9',
    40: '10',
    44: '11',
    48: '12',
    56: '14',
    64: '16',
    72: '18',
    80: '20',
    96: '24',
  };

  // Find closest value
  let closest = 0;
  let minDiff = Infinity;
  for (const key of Object.keys(scale)) {
    const diff = Math.abs(parseInt(key) - num);
    if (diff < minDiff) {
      minDiff = diff;
      closest = parseInt(key);
    }
  }

  return scale[closest] || String(Math.round(num / 4));
}

/**
 * Convert pixel font size to Tailwind class
 */
function pxToFontSize(px: string): string {
  const num = parseFloat(px);
  if (isNaN(num)) return '';

  // Tailwind font size scale (approximate)
  if (num <= 12) return 'text-xs';
  if (num <= 14) return 'text-sm';
  if (num <= 16) return 'text-base';
  if (num <= 18) return 'text-lg';
  if (num <= 20) return 'text-xl';
  if (num <= 24) return 'text-2xl';
  if (num <= 30) return 'text-3xl';
  if (num <= 36) return 'text-4xl';
  if (num <= 48) return 'text-5xl';
  if (num <= 60) return 'text-6xl';
  if (num <= 72) return 'text-7xl';
  if (num <= 96) return 'text-8xl';
  return 'text-9xl';
}

/**
 * Extract grid columns from grid-template-columns
 */
function parseGridColumns(value: string): number {
  // repeat(3, 1fr) -> 3
  const repeatMatch = value.match(/repeat\((\d+)/);
  if (repeatMatch) {
    return parseInt(repeatMatch[1], 10);
  }

  // Count 1fr occurrences
  const frCount = (value.match(/\d+fr/g) || []).length;
  if (frCount > 0) return frCount;

  // Count space-separated values
  return value.trim().split(/\s+/).length;
}

// ====================
// ANALYSIS FUNCTIONS
// ====================

/**
 * Analyze layout changes across breakpoints
 */
export function analyzeLayoutChanges(
  responsiveStyles: ViewportStyles[]
): LayoutAnalysis {
  const getLayoutType = (
    styles: Record<string, string>
  ): 'stack' | 'grid' | 'flex-row' | 'flex-col' => {
    if (styles.display === 'grid') return 'grid';
    if (styles.display === 'flex') {
      return styles.flexDirection === 'column' ? 'flex-col' : 'flex-row';
    }
    return 'stack';
  };

  const getColumns = (styles: Record<string, string>): number => {
    if (styles.gridTemplateColumns) {
      return parseGridColumns(styles.gridTemplateColumns);
    }
    return 1;
  };

  const mobile = responsiveStyles.find((s) => s.viewport === 'mobile')?.styles || {};
  const tablet = responsiveStyles.find((s) => s.viewport === 'tablet')?.styles || {};
  const desktop = responsiveStyles.find((s) => s.viewport === 'desktop')?.styles || {};

  return {
    layoutType: {
      mobile: getLayoutType(mobile),
      tablet: getLayoutType(tablet),
      desktop: getLayoutType(desktop),
    },
    columns: {
      mobile: getColumns(mobile),
      tablet: getColumns(tablet),
      desktop: getColumns(desktop),
    },
    gap: {
      mobile: mobile.gap || '0px',
      tablet: tablet.gap || mobile.gap || '0px',
      desktop: desktop.gap || tablet.gap || mobile.gap || '0px',
    },
  };
}

/**
 * Detect responsive style changes between breakpoints
 */
export function detectResponsiveChanges(
  responsiveStyles: ViewportStyles[]
): ResponsiveStyleChange[] {
  const changes: ResponsiveStyleChange[] = [];

  const mobile = responsiveStyles.find((s) => s.viewport === 'mobile')?.styles || {};
  const tablet = responsiveStyles.find((s) => s.viewport === 'tablet')?.styles || {};
  const desktop = responsiveStyles.find((s) => s.viewport === 'desktop')?.styles || {};

  // Get all unique properties
  const allProps = new Set([
    ...Object.keys(mobile),
    ...Object.keys(tablet),
    ...Object.keys(desktop),
  ]);

  for (const prop of allProps) {
    const mobileVal = mobile[prop] || '';
    const tabletVal = tablet[prop] || '';
    const desktopVal = desktop[prop] || '';

    // Skip if all values are the same
    if (mobileVal === tabletVal && tabletVal === desktopVal) {
      continue;
    }

    const change: ResponsiveStyleChange = {
      property: prop,
      base: mobileVal,
    };

    // Only add breakpoint if different from previous
    if (tabletVal && tabletVal !== mobileVal) {
      change.md = tabletVal;
    }
    if (desktopVal && desktopVal !== (tabletVal || mobileVal)) {
      change.lg = desktopVal;
    }

    changes.push(change);
  }

  return changes;
}

/**
 * Generate Tailwind classes from responsive style changes
 */
export function generateTailwindClasses(
  changes: ResponsiveStyleChange[]
): ResponsiveClasses {
  const classes: ResponsiveClasses = {
    base: [],
    md: [],
    lg: [],
    xl: [],
  };

  for (const change of changes) {
    const { property, base, md, lg } = change;

    // Map property to Tailwind
    switch (property) {
      case 'display':
        if (base && DISPLAY_MAP[base]) classes.base.push(DISPLAY_MAP[base]);
        if (md && DISPLAY_MAP[md]) classes.md.push(DISPLAY_MAP[md]);
        if (lg && DISPLAY_MAP[lg]) classes.lg.push(DISPLAY_MAP[lg]);
        break;

      case 'flexDirection':
        if (base && FLEX_DIRECTION_MAP[base]) classes.base.push(FLEX_DIRECTION_MAP[base]);
        if (md && FLEX_DIRECTION_MAP[md]) classes.md.push(FLEX_DIRECTION_MAP[md]);
        if (lg && FLEX_DIRECTION_MAP[lg]) classes.lg.push(FLEX_DIRECTION_MAP[lg]);
        break;

      case 'justifyContent':
        if (base && JUSTIFY_MAP[base]) classes.base.push(JUSTIFY_MAP[base]);
        if (md && JUSTIFY_MAP[md]) classes.md.push(JUSTIFY_MAP[md]);
        if (lg && JUSTIFY_MAP[lg]) classes.lg.push(JUSTIFY_MAP[lg]);
        break;

      case 'alignItems':
        if (base && ALIGN_MAP[base]) classes.base.push(ALIGN_MAP[base]);
        if (md && ALIGN_MAP[md]) classes.md.push(ALIGN_MAP[md]);
        if (lg && ALIGN_MAP[lg]) classes.lg.push(ALIGN_MAP[lg]);
        break;

      case 'textAlign':
        if (base && TEXT_ALIGN_MAP[base]) classes.base.push(TEXT_ALIGN_MAP[base]);
        if (md && TEXT_ALIGN_MAP[md]) classes.md.push(TEXT_ALIGN_MAP[md]);
        if (lg && TEXT_ALIGN_MAP[lg]) classes.lg.push(TEXT_ALIGN_MAP[lg]);
        break;

      case 'gap':
        if (base) {
          const spacing = pxToSpacing(base);
          if (spacing) classes.base.push(`gap-${spacing}`);
        }
        if (md) {
          const spacing = pxToSpacing(md);
          if (spacing) classes.md.push(`gap-${spacing}`);
        }
        if (lg) {
          const spacing = pxToSpacing(lg);
          if (spacing) classes.lg.push(`gap-${spacing}`);
        }
        break;

      case 'gridTemplateColumns':
        if (base) {
          const cols = parseGridColumns(base);
          classes.base.push(`grid-cols-${cols}`);
        }
        if (md) {
          const cols = parseGridColumns(md);
          classes.md.push(`grid-cols-${cols}`);
        }
        if (lg) {
          const cols = parseGridColumns(lg);
          classes.lg.push(`grid-cols-${cols}`);
        }
        break;

      case 'fontSize':
        if (base) {
          const size = pxToFontSize(base);
          if (size) classes.base.push(size);
        }
        if (md) {
          const size = pxToFontSize(md);
          if (size) classes.md.push(size);
        }
        if (lg) {
          const size = pxToFontSize(lg);
          if (size) classes.lg.push(size);
        }
        break;

      case 'padding':
      case 'paddingTop':
      case 'paddingRight':
      case 'paddingBottom':
      case 'paddingLeft':
        const paddingDir = property.replace('padding', '').toLowerCase();
        const paddingPrefix = paddingDir
          ? `p${paddingDir[0]}`
          : 'p';
        if (base) {
          const spacing = pxToSpacing(base);
          if (spacing) classes.base.push(`${paddingPrefix}-${spacing}`);
        }
        if (md) {
          const spacing = pxToSpacing(md);
          if (spacing) classes.md.push(`${paddingPrefix}-${spacing}`);
        }
        if (lg) {
          const spacing = pxToSpacing(lg);
          if (spacing) classes.lg.push(`${paddingPrefix}-${spacing}`);
        }
        break;
    }
  }

  return classes;
}

/**
 * Convert ResponsiveClasses to a single className string
 */
export function classesToString(classes: ResponsiveClasses): string {
  const parts: string[] = [
    ...classes.base,
    ...classes.md.map((c) => `md:${c}`),
    ...classes.lg.map((c) => `lg:${c}`),
    ...classes.xl.map((c) => `xl:${c}`),
  ];

  return parts.join(' ');
}

/**
 * Generate common responsive layout pattern
 */
export function generateResponsiveLayoutClasses(
  layout: LayoutAnalysis
): string {
  const classes: string[] = [];

  // Base layout (mobile)
  if (layout.layoutType.mobile === 'flex-col') {
    classes.push('flex', 'flex-col');
  } else if (layout.layoutType.mobile === 'grid') {
    classes.push('grid', `grid-cols-${layout.columns.mobile}`);
  }

  // Tablet changes
  if (layout.layoutType.tablet !== layout.layoutType.mobile) {
    if (layout.layoutType.tablet === 'flex-row') {
      classes.push('md:flex-row');
    } else if (layout.layoutType.tablet === 'grid') {
      classes.push(`md:grid-cols-${layout.columns.tablet}`);
    }
  } else if (layout.columns.tablet !== layout.columns.mobile) {
    classes.push(`md:grid-cols-${layout.columns.tablet}`);
  }

  // Desktop changes
  if (layout.layoutType.desktop !== layout.layoutType.tablet) {
    if (layout.layoutType.desktop === 'flex-row') {
      classes.push('lg:flex-row');
    } else if (layout.layoutType.desktop === 'grid') {
      classes.push(`lg:grid-cols-${layout.columns.desktop}`);
    }
  } else if (layout.columns.desktop !== layout.columns.tablet) {
    classes.push(`lg:grid-cols-${layout.columns.desktop}`);
  }

  // Gap
  const mobileGap = pxToSpacing(layout.gap.mobile);
  const tabletGap = pxToSpacing(layout.gap.tablet);
  const desktopGap = pxToSpacing(layout.gap.desktop);

  if (mobileGap) classes.push(`gap-${mobileGap}`);
  if (tabletGap && tabletGap !== mobileGap) classes.push(`md:gap-${tabletGap}`);
  if (desktopGap && desktopGap !== tabletGap) classes.push(`lg:gap-${desktopGap}`);

  return classes.join(' ');
}

/**
 * Generate typical section responsive classes
 * Common patterns for landing page sections
 */
export function getSectionResponsiveClasses(
  sectionType: string
): string {
  const commonPatterns: Record<string, string> = {
    header: 'px-4 md:px-6 lg:px-8',
    hero: 'px-4 py-12 md:px-6 md:py-16 lg:px-8 lg:py-24 text-center lg:text-left',
    features:
      'px-4 py-12 md:px-6 md:py-16 lg:px-8 lg:py-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8',
    testimonials:
      'px-4 py-12 md:px-6 md:py-16 lg:px-8 lg:py-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    pricing:
      'px-4 py-12 md:px-6 md:py-16 lg:px-8 lg:py-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8',
    cta: 'px-4 py-12 md:px-6 md:py-16 lg:px-8 lg:py-20 text-center',
    footer: 'px-4 py-8 md:px-6 md:py-12 lg:px-8 lg:py-16',
  };

  return commonPatterns[sectionType] || 'px-4 py-8 md:px-6 md:py-12 lg:px-8';
}

export default {
  analyzeLayoutChanges,
  detectResponsiveChanges,
  generateTailwindClasses,
  classesToString,
  generateResponsiveLayoutClasses,
  getSectionResponsiveClasses,
};
