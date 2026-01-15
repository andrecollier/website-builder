/**
 * Effects Extractor Module
 *
 * Extracts effects information from page computed styles, including
 * box shadows (sm/md/lg/xl), border radii (sm/md/lg/full), and
 * transition durations (fast/normal/slow).
 */

import type { EffectsExtraction } from '@/types';

// ====================
// TYPES
// ====================

export interface RawEffectsData {
  boxShadows: string[];
  borderRadii: string[];
  transitions: string[];
}

export interface ShadowValue {
  shadow: string;
  blurRadius: number;
  frequency: number;
}

export interface RadiusValue {
  radiusPx: number;
  frequency: number;
  original: string;
}

export interface TransitionValue {
  durationMs: number;
  frequency: number;
  original: string;
}

// ====================
// CONFIGURATION
// ====================

const EFFECTS_CONFIG = {
  // Shadow categorization thresholds based on blur radius
  shadowThresholds: {
    sm: { maxBlur: 4 },    // Small shadows: blur <= 4px
    md: { maxBlur: 10 },   // Medium shadows: blur <= 10px
    lg: { maxBlur: 25 },   // Large shadows: blur <= 25px
    xl: { maxBlur: 50 },   // Extra large shadows: blur <= 50px
  },
  // Radius categorization thresholds (px)
  radiusThresholds: {
    sm: { max: 4 },        // Small radius: <= 4px
    md: { max: 8 },        // Medium radius: <= 8px
    lg: { max: 16 },       // Large radius: <= 16px
    // 'full' is special: typically 9999px or 50%
  },
  // Full radius detection threshold
  fullRadiusThreshold: 100,
  // Transition duration categorization thresholds (ms)
  transitionThresholds: {
    fast: { max: 150 },    // Fast: <= 150ms
    normal: { max: 300 },  // Normal: <= 300ms
    slow: { max: 500 },    // Slow: <= 500ms
  },
  // Default fallback values
  defaults: {
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    },
    radii: {
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      full: '9999px',
    },
    transitions: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
  },
} as const;

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Parse a box-shadow string and extract the blur radius
 * Box-shadow format: [inset] offset-x offset-y [blur-radius] [spread-radius] color
 */
export function parseShadowBlurRadius(shadowStr: string): number | null {
  if (!shadowStr || typeof shadowStr !== 'string') {
    return null;
  }

  const trimmed = shadowStr.trim().toLowerCase();

  // Handle 'none' and other non-shadow values
  if (trimmed === 'none' || trimmed === 'inherit' || trimmed === 'initial') {
    return null;
  }

  // Remove 'inset' if present for parsing
  const withoutInset = trimmed.replace(/\binset\b/gi, '').trim();

  // Match numeric values with units
  const valuePattern = /(-?[\d.]+)(px|rem|em)?/g;
  const matches = Array.from(withoutInset.matchAll(valuePattern));

  if (matches.length < 2) {
    return null;
  }

  // Box-shadow values: offset-x, offset-y, [blur-radius], [spread-radius]
  // Blur radius is the third numeric value if present
  if (matches.length >= 3) {
    const blurValue = parseFloat(matches[2][1]);
    const unit = matches[2][2] || 'px';

    if (isNaN(blurValue)) {
      return null;
    }

    // Convert to pixels
    switch (unit) {
      case 'rem':
      case 'em':
        return Math.round(blurValue * 16);
      default:
        return Math.round(blurValue);
    }
  }

  // If only 2 values, no blur radius (defaults to 0)
  return 0;
}

/**
 * Normalize a box-shadow string for consistent storage
 */
export function normalizeShadow(shadowStr: string): string | null {
  if (!shadowStr || typeof shadowStr !== 'string') {
    return null;
  }

  const trimmed = shadowStr.trim();

  // Handle 'none' and other non-shadow values
  if (trimmed.toLowerCase() === 'none' || trimmed === '' || trimmed === 'inherit') {
    return null;
  }

  return trimmed;
}

/**
 * Parse a border-radius value to pixels
 * Handles px, rem, em, and percentage values
 */
export function parseRadius(valueStr: string): number | null {
  if (!valueStr || typeof valueStr !== 'string') {
    return null;
  }

  const trimmed = valueStr.trim().toLowerCase();

  // Handle special values
  if (trimmed === '0' || trimmed === 'none' || trimmed === 'inherit' || trimmed === 'initial') {
    return 0;
  }

  // Handle percentage (treat as 'full' if >= 50%)
  if (trimmed.includes('%')) {
    const percentMatch = trimmed.match(/([\d.]+)%/);
    if (percentMatch) {
      const percent = parseFloat(percentMatch[1]);
      // 50% or more is considered 'full'
      return percent >= 50 ? 9999 : null;
    }
    return null;
  }

  // Match number with optional unit
  const match = trimmed.match(/^([\d.]+)(px|rem|em)?$/);
  if (!match) {
    return null;
  }

  const value = parseFloat(match[1]);
  if (isNaN(value)) {
    return null;
  }

  const unit = match[2] || 'px';

  switch (unit) {
    case 'px':
      return Math.round(value);
    case 'rem':
    case 'em':
      return Math.round(value * 16);
    default:
      return Math.round(value);
  }
}

/**
 * Parse a transition duration to milliseconds
 * Handles ms and s units
 */
export function parseTransitionDuration(valueStr: string): number | null {
  if (!valueStr || typeof valueStr !== 'string') {
    return null;
  }

  const trimmed = valueStr.trim().toLowerCase();

  // Handle special values
  if (trimmed === '0' || trimmed === '0s' || trimmed === '0ms') {
    return 0;
  }

  if (trimmed === 'none' || trimmed === 'inherit' || trimmed === 'initial') {
    return null;
  }

  // Match number with unit (ms or s)
  const match = trimmed.match(/^([\d.]+)(ms|s)?$/);
  if (!match) {
    return null;
  }

  const value = parseFloat(match[1]);
  if (isNaN(value) || value < 0) {
    return null;
  }

  const unit = match[2] || 'ms';

  switch (unit) {
    case 's':
      return Math.round(value * 1000);
    case 'ms':
    default:
      return Math.round(value);
  }
}

/**
 * Extract transition duration from a full transition shorthand
 * transition: property duration timing-function delay
 */
export function extractTransitionDuration(transitionStr: string): number | null {
  if (!transitionStr || typeof transitionStr !== 'string') {
    return null;
  }

  const trimmed = transitionStr.trim().toLowerCase();

  // Handle 'none' and empty values
  if (trimmed === 'none' || trimmed === '' || trimmed === 'all') {
    return null;
  }

  // Find duration patterns (number followed by ms or s)
  const durationPattern = /([\d.]+)(ms|s)\b/g;
  const matches = Array.from(trimmed.matchAll(durationPattern));

  if (matches.length === 0) {
    return null;
  }

  // First duration match is typically the duration (not delay)
  const value = parseFloat(matches[0][1]);
  const unit = matches[0][2];

  if (isNaN(value) || value <= 0) {
    return null;
  }

  return unit === 's' ? Math.round(value * 1000) : Math.round(value);
}

/**
 * Format a duration value for CSS output
 */
export function formatDuration(ms: number): string {
  return `${ms}ms`;
}

/**
 * Format a radius value for CSS output
 */
export function formatRadius(px: number): string {
  if (px >= EFFECTS_CONFIG.fullRadiusThreshold) {
    return '9999px';
  }
  // Convert to rem for consistency with Tailwind
  const rem = px / 16;
  // Use nice rem values when possible
  if (rem === Math.round(rem * 8) / 8) {
    return `${rem}rem`;
  }
  return `${px}px`;
}

// ====================
// SHADOW CATEGORIZATION
// ====================

/**
 * Categorize shadows by size based on blur radius
 */
export function categorizeShadows(shadows: ShadowValue[]): EffectsExtraction['shadows'] {
  const categories: { sm: ShadowValue[]; md: ShadowValue[]; lg: ShadowValue[]; xl: ShadowValue[] } = {
    sm: [],
    md: [],
    lg: [],
    xl: [],
  };

  for (const shadow of shadows) {
    const { blurRadius } = shadow;

    if (blurRadius <= EFFECTS_CONFIG.shadowThresholds.sm.maxBlur) {
      categories.sm.push(shadow);
    } else if (blurRadius <= EFFECTS_CONFIG.shadowThresholds.md.maxBlur) {
      categories.md.push(shadow);
    } else if (blurRadius <= EFFECTS_CONFIG.shadowThresholds.lg.maxBlur) {
      categories.lg.push(shadow);
    } else {
      categories.xl.push(shadow);
    }
  }

  // Select the most frequent shadow from each category
  const selectBest = (arr: ShadowValue[], defaultValue: string): string => {
    if (arr.length === 0) return defaultValue;
    const sorted = [...arr].sort((a, b) => b.frequency - a.frequency);
    return sorted[0].shadow;
  };

  return {
    sm: selectBest(categories.sm, EFFECTS_CONFIG.defaults.shadows.sm),
    md: selectBest(categories.md, EFFECTS_CONFIG.defaults.shadows.md),
    lg: selectBest(categories.lg, EFFECTS_CONFIG.defaults.shadows.lg),
    xl: selectBest(categories.xl, EFFECTS_CONFIG.defaults.shadows.xl),
  };
}

// ====================
// RADIUS CATEGORIZATION
// ====================

/**
 * Categorize radii by size
 */
export function categorizeRadii(radii: RadiusValue[]): EffectsExtraction['radii'] {
  const categories: { sm: RadiusValue[]; md: RadiusValue[]; lg: RadiusValue[]; full: RadiusValue[] } = {
    sm: [],
    md: [],
    lg: [],
    full: [],
  };

  for (const radius of radii) {
    const { radiusPx } = radius;

    // Skip 0 values
    if (radiusPx === 0) continue;

    // Check for 'full' radius first
    if (radiusPx >= EFFECTS_CONFIG.fullRadiusThreshold) {
      categories.full.push(radius);
    } else if (radiusPx <= EFFECTS_CONFIG.radiusThresholds.sm.max) {
      categories.sm.push(radius);
    } else if (radiusPx <= EFFECTS_CONFIG.radiusThresholds.md.max) {
      categories.md.push(radius);
    } else {
      categories.lg.push(radius);
    }
  }

  // Select the most frequent radius from each category and format
  const selectBest = (arr: RadiusValue[], defaultPx: number): string => {
    if (arr.length === 0) return formatRadius(defaultPx);
    const sorted = [...arr].sort((a, b) => b.frequency - a.frequency);
    return formatRadius(sorted[0].radiusPx);
  };

  return {
    sm: selectBest(categories.sm, 2),  // 0.125rem
    md: selectBest(categories.md, 6),  // 0.375rem
    lg: selectBest(categories.lg, 8),  // 0.5rem
    full: categories.full.length > 0 ? '9999px' : EFFECTS_CONFIG.defaults.radii.full,
  };
}

// ====================
// TRANSITION CATEGORIZATION
// ====================

/**
 * Categorize transitions by speed
 */
export function categorizeTransitions(transitions: TransitionValue[]): EffectsExtraction['transitions'] {
  const categories: { fast: TransitionValue[]; normal: TransitionValue[]; slow: TransitionValue[] } = {
    fast: [],
    normal: [],
    slow: [],
  };

  for (const transition of transitions) {
    const { durationMs } = transition;

    // Skip 0 values
    if (durationMs === 0) continue;

    if (durationMs <= EFFECTS_CONFIG.transitionThresholds.fast.max) {
      categories.fast.push(transition);
    } else if (durationMs <= EFFECTS_CONFIG.transitionThresholds.normal.max) {
      categories.normal.push(transition);
    } else {
      categories.slow.push(transition);
    }
  }

  // Select the most frequent duration from each category
  const selectBest = (arr: TransitionValue[], defaultMs: number): string => {
    if (arr.length === 0) return formatDuration(defaultMs);
    const sorted = [...arr].sort((a, b) => b.frequency - a.frequency);
    return formatDuration(sorted[0].durationMs);
  };

  return {
    fast: selectBest(categories.fast, 150),
    normal: selectBest(categories.normal, 200),
    slow: selectBest(categories.slow, 300),
  };
}

// ====================
// MAIN EXTRACTION
// ====================

/**
 * Extract effects information from raw page data
 */
export function extractEffects(rawData: RawEffectsData): EffectsExtraction {
  // Process box shadows
  const shadowValues: ShadowValue[] = [];
  for (const shadowStr of rawData.boxShadows) {
    const normalized = normalizeShadow(shadowStr);
    if (!normalized) continue;

    const blurRadius = parseShadowBlurRadius(shadowStr);
    if (blurRadius === null) continue;

    const existing = shadowValues.find((v) => v.shadow === normalized);
    if (existing) {
      existing.frequency += 1;
    } else {
      shadowValues.push({
        shadow: normalized,
        blurRadius,
        frequency: 1,
      });
    }
  }

  // Process border radii
  const radiusValues: RadiusValue[] = [];
  for (const radiusStr of rawData.borderRadii) {
    // Handle shorthand border-radius (take the first value for simplicity)
    const firstValue = radiusStr.split(/\s+/)[0];
    const radiusPx = parseRadius(firstValue);
    if (radiusPx === null) continue;

    const existing = radiusValues.find((v) => v.radiusPx === radiusPx);
    if (existing) {
      existing.frequency += 1;
    } else {
      radiusValues.push({
        radiusPx,
        frequency: 1,
        original: radiusStr,
      });
    }
  }

  // Process transitions
  const transitionValues: TransitionValue[] = [];
  for (const transitionStr of rawData.transitions) {
    const durationMs = extractTransitionDuration(transitionStr);
    if (durationMs === null || durationMs <= 0) continue;

    const existing = transitionValues.find((v) => v.durationMs === durationMs);
    if (existing) {
      existing.frequency += 1;
    } else {
      transitionValues.push({
        durationMs,
        frequency: 1,
        original: transitionStr,
      });
    }
  }

  // Categorize and select best values
  const shadows = categorizeShadows(shadowValues);
  const radii = categorizeRadii(radiusValues);
  const transitions = categorizeTransitions(transitionValues);

  return {
    shadows,
    radii,
    transitions,
  };
}

/**
 * Get default effects extraction for empty data
 */
export function getDefaultEffectsExtraction(): EffectsExtraction {
  return {
    shadows: { ...EFFECTS_CONFIG.defaults.shadows },
    radii: { ...EFFECTS_CONFIG.defaults.radii },
    transitions: { ...EFFECTS_CONFIG.defaults.transitions },
  };
}
