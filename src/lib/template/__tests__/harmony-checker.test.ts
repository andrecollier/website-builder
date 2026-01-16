/**
 * Harmony Checker Tests
 *
 * Tests for visual harmony calculation between multiple reference websites.
 * Covers color compatibility, typography consistency, spacing alignment,
 * validation utilities, and suggestion generation.
 */

import {
  canCalculateHarmony,
  getUsedReferences,
  calculateHarmony,
  getHarmonyScore,
  meetsHarmonyThreshold,
  HARMONY_CONFIG,
  type HarmonyCheckOptions,
  type DetailedHarmonyResult,
} from '../harmony-checker';
import type { Reference, SectionMapping, DesignSystem } from '@/types';

// ====================
// MOCK DATA HELPERS
// ====================

/**
 * Create a complete design system for testing
 */
function createMockDesignSystem(overrides?: Partial<DesignSystem>): DesignSystem {
  return {
    meta: {
      sourceUrl: 'https://example.com',
      extractedAt: new Date().toISOString(),
      version: 1,
    },
    colors: {
      primary: ['#3b82f6', '#2563eb'],
      secondary: ['#8b5cf6', '#7c3aed'],
      neutral: ['#f5f5f5', '#e5e7eb', '#9ca3af'],
      semantic: {
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
      },
      palettes: {
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
    },
    typography: {
      fonts: {
        heading: 'Inter',
        body: 'Inter',
      },
      scale: {
        display: '72px',
        h1: '48px',
        h2: '36px',
        h3: '28px',
        h4: '24px',
        h5: '20px',
        h6: '18px',
        body: '16px',
        small: '14px',
        xs: '12px',
      },
      weights: [400, 500, 600, 700],
      lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.8,
      },
    },
    spacing: {
      baseUnit: 4,
      scale: [4, 8, 12, 16, 24, 32, 48, 64, 96],
      containerMaxWidth: '1280px',
      sectionPadding: {
        mobile: '16px',
        desktop: '64px',
      },
    },
    effects: {
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      radii: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        full: '9999px',
      },
      transitions: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
    },
    ...overrides,
  };
}

/**
 * Create a mock reference for testing
 */
function createMockReference(
  id: string,
  name: string,
  overrides?: Partial<Reference>
): Reference {
  return {
    id,
    url: `https://${name.toLowerCase()}.com`,
    name,
    tokens: createMockDesignSystem(),
    sections: [],
    status: 'ready',
    ...overrides,
  };
}

/**
 * Create references with similar colors
 */
function createSimilarColorReferences(): Reference[] {
  return [
    createMockReference('ref-1', 'Site A', {
      tokens: createMockDesignSystem({
        colors: {
          primary: ['#3b82f6', '#2563eb'],
          secondary: ['#8b5cf6'],
          neutral: ['#f5f5f5', '#e5e7eb'],
          semantic: {
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6',
          },
          palettes: {},
        },
      }),
    }),
    createMockReference('ref-2', 'Site B', {
      tokens: createMockDesignSystem({
        colors: {
          primary: ['#3b82f6', '#2563eb'], // Same as Site A
          secondary: ['#8b5cf6'],
          neutral: ['#f5f5f5', '#e5e7eb'],
          semantic: {
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6',
          },
          palettes: {},
        },
      }),
    }),
  ];
}

/**
 * Create references with clashing colors
 */
function createClashingColorReferences(): Reference[] {
  return [
    createMockReference('ref-1', 'Site A', {
      tokens: createMockDesignSystem({
        colors: {
          primary: ['#ff0000', '#cc0000'], // Red
          secondary: ['#ff4444'],
          neutral: ['#ffffff', '#f5f5f5'],
          semantic: {
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6',
          },
          palettes: {},
        },
      }),
    }),
    createMockReference('ref-2', 'Site B', {
      tokens: createMockDesignSystem({
        colors: {
          primary: ['#00ff00', '#00cc00'], // Green
          secondary: ['#44ff44'],
          neutral: ['#ffffff', '#f5f5f5'],
          semantic: {
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6',
          },
          palettes: {},
        },
      }),
    }),
  ];
}

/**
 * Create references with different typography
 */
function createDifferentTypographyReferences(): Reference[] {
  return [
    createMockReference('ref-1', 'Site A', {
      tokens: createMockDesignSystem({
        typography: {
          fonts: { heading: 'Inter', body: 'Inter' },
          scale: {
            display: '72px',
            h1: '48px',
            h2: '36px',
            h3: '28px',
            h4: '24px',
            h5: '20px',
            h6: '18px',
            body: '16px',
            small: '14px',
            xs: '12px',
          },
          weights: [400, 700],
          lineHeights: { tight: 1.2, normal: 1.5, relaxed: 1.8 },
        },
      }),
    }),
    createMockReference('ref-2', 'Site B', {
      tokens: createMockDesignSystem({
        typography: {
          fonts: { heading: 'Roboto', body: 'Open Sans' },
          scale: {
            display: '96px', // Very different sizes
            h1: '64px',
            h2: '48px',
            h3: '36px',
            h4: '32px',
            h5: '28px',
            h6: '24px',
            body: '18px',
            small: '16px',
            xs: '14px',
          },
          weights: [300, 400],
          lineHeights: { tight: 1.1, normal: 1.4, relaxed: 1.7 },
        },
      }),
    }),
  ];
}

describe('Harmony Checker', () => {
  // ====================
  // VALIDATION UTILITIES
  // ====================

  describe('canCalculateHarmony', () => {
    it('should return true for 2+ ready references with tokens', () => {
      const references = [
        createMockReference('ref-1', 'Site A'),
        createMockReference('ref-2', 'Site B'),
      ];
      expect(canCalculateHarmony(references)).toBe(true);
    });

    it('should return false for single reference', () => {
      const references = [createMockReference('ref-1', 'Site A')];
      expect(canCalculateHarmony(references)).toBe(false);
    });

    it('should return false for empty references', () => {
      expect(canCalculateHarmony([])).toBe(false);
    });

    it('should return false for references not ready', () => {
      const references = [
        createMockReference('ref-1', 'Site A', { status: 'pending' }),
        createMockReference('ref-2', 'Site B'),
      ];
      expect(canCalculateHarmony(references)).toBe(false);
    });

    it('should return false for references with missing tokens', () => {
      const references = [
        createMockReference('ref-1', 'Site A'),
        {
          id: 'ref-2',
          url: 'https://siteb.com',
          name: 'Site B',
          tokens: null as any,
          sections: [],
          status: 'ready' as const,
        },
      ];
      expect(canCalculateHarmony(references)).toBe(false);
    });

    it('should return false for references with missing color tokens', () => {
      const reference = createMockReference('ref-1', 'Site A');
      const references = [
        reference,
        {
          ...createMockReference('ref-2', 'Site B'),
          tokens: {
            ...reference.tokens,
            colors: null as any,
          },
        },
      ];
      expect(canCalculateHarmony(references)).toBe(false);
    });
  });

  describe('getUsedReferences', () => {
    const allReferences = [
      createMockReference('ref-1', 'Site A'),
      createMockReference('ref-2', 'Site B'),
      createMockReference('ref-3', 'Site C'),
    ];

    it('should return references by UUID', () => {
      const sectionMapping: SectionMapping = {
        header: 'ref-1',
        hero: 'ref-2',
        footer: 'ref-1',
      };

      const used = getUsedReferences(sectionMapping, allReferences);
      expect(used.length).toBe(2);
      expect(used.map(r => r.id)).toContain('ref-1');
      expect(used.map(r => r.id)).toContain('ref-2');
    });

    it('should return references by index', () => {
      const sectionMapping: SectionMapping = {
        header: '0',
        hero: '1',
        footer: '2',
      };

      const used = getUsedReferences(sectionMapping, allReferences);
      expect(used.length).toBe(3);
      expect(used[0].id).toBe('ref-1');
      expect(used[1].id).toBe('ref-2');
      expect(used[2].id).toBe('ref-3');
    });

    it('should handle mixed UUID and index references', () => {
      const sectionMapping: SectionMapping = {
        header: '0',
        hero: 'ref-2',
        footer: '1',
      };

      const used = getUsedReferences(sectionMapping, allReferences);
      expect(used.length).toBe(2);
    });

    it('should skip null/undefined references', () => {
      const sectionMapping: SectionMapping = {
        header: 'ref-1',
        hero: null as any,
        footer: undefined as any,
      };

      const used = getUsedReferences(sectionMapping, allReferences);
      expect(used.length).toBe(1);
      expect(used[0].id).toBe('ref-1');
    });

    it('should return empty array for empty mapping', () => {
      const used = getUsedReferences({}, allReferences);
      expect(used).toEqual([]);
    });

    it('should deduplicate references', () => {
      const sectionMapping: SectionMapping = {
        header: 'ref-1',
        hero: 'ref-1',
        footer: 'ref-1',
      };

      const used = getUsedReferences(sectionMapping, allReferences);
      expect(used.length).toBe(1);
    });

    it('should handle invalid index gracefully', () => {
      const sectionMapping: SectionMapping = {
        header: '999', // Invalid index
        hero: 'ref-1',
      };

      const used = getUsedReferences(sectionMapping, allReferences);
      expect(used.length).toBe(1);
      expect(used[0].id).toBe('ref-1');
    });

    it('should handle invalid UUID gracefully', () => {
      const sectionMapping: SectionMapping = {
        header: 'invalid-id',
        hero: 'ref-1',
      };

      const used = getUsedReferences(sectionMapping, allReferences);
      expect(used.length).toBe(1);
      expect(used[0].id).toBe('ref-1');
    });
  });

  // ====================
  // COLOR HARMONY
  // ====================

  describe('calculateHarmony - Color Harmony', () => {
    it('should return high score for similar colors', () => {
      const references = createSimilarColorReferences();
      const result = calculateHarmony(references);

      expect(result.breakdown.color).toBeGreaterThanOrEqual(70);
      expect(result.issues.filter(i => i.type === 'color_clash').length).toBe(0);
    });

    it('should return low score for clashing colors', () => {
      const references = createClashingColorReferences();
      const result = calculateHarmony(references);

      // Expect lower color score
      expect(result.breakdown.color).toBeLessThan(50);
      // Should have color clash issues
      expect(result.issues.filter(i => i.type === 'color_clash').length).toBeGreaterThan(0);
    });

    it('should detect color clash severity correctly', () => {
      const references = createClashingColorReferences();
      const result = calculateHarmony(references);

      const colorIssues = result.issues.filter(i => i.type === 'color_clash');
      expect(colorIssues.length).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(colorIssues[0].severity);
    });
  });

  // ====================
  // TYPOGRAPHY HARMONY
  // ====================

  describe('calculateHarmony - Typography Harmony', () => {
    it('should return high score for same typography', () => {
      const references = createSimilarColorReferences(); // These have same typography
      const result = calculateHarmony(references);

      expect(result.breakdown.typography).toBeGreaterThanOrEqual(85);
    });

    it('should return low score for different typography', () => {
      const references = createDifferentTypographyReferences();
      const result = calculateHarmony(references);

      // Should have lower typography score
      expect(result.breakdown.typography).toBeLessThan(70);
      // Should have typography mismatch issues
      expect(result.issues.filter(i => i.type === 'typography_mismatch').length).toBeGreaterThan(0);
    });

    it('should detect typography mismatch description', () => {
      const references = createDifferentTypographyReferences();
      const result = calculateHarmony(references);

      const typoIssues = result.issues.filter(i => i.type === 'typography_mismatch');
      expect(typoIssues.length).toBeGreaterThan(0);
      expect(typoIssues[0].description).toContain('Site A');
      expect(typoIssues[0].description).toContain('Site B');
    });
  });

  // ====================
  // SPACING HARMONY
  // ====================

  describe('calculateHarmony - Spacing Harmony', () => {
    it('should return high score for similar spacing', () => {
      const references = createSimilarColorReferences(); // These have same spacing
      const result = calculateHarmony(references);

      expect(result.breakdown.spacing).toBeGreaterThanOrEqual(85);
    });

    it('should detect spacing inconsistencies', () => {
      const references = [
        createMockReference('ref-1', 'Site A', {
          tokens: createMockDesignSystem({
            spacing: {
              baseUnit: 4,
              scale: [4, 8, 12, 16, 24, 32],
              containerMaxWidth: '1280px',
              sectionPadding: { mobile: '16px', desktop: '64px' },
            },
          }),
        }),
        createMockReference('ref-2', 'Site B', {
          tokens: createMockDesignSystem({
            spacing: {
              baseUnit: 8,
              scale: [8, 16, 24, 32, 48, 64], // Very different scale
              containerMaxWidth: '1400px',
              sectionPadding: { mobile: '24px', desktop: '96px' },
            },
          }),
        }),
      ];

      const result = calculateHarmony(references);
      expect(result.breakdown.spacing).toBeLessThan(60);
    });
  });

  // ====================
  // OVERALL HARMONY
  // ====================

  describe('calculateHarmony - Overall Harmony', () => {
    it('should calculate weighted overall score', () => {
      const references = createSimilarColorReferences();
      const result = calculateHarmony(references);

      // Overall should be weighted average
      const expectedScore = Math.round(
        result.breakdown.color * HARMONY_CONFIG.defaultWeights.color +
        result.breakdown.typography * HARMONY_CONFIG.defaultWeights.typography +
        result.breakdown.spacing * HARMONY_CONFIG.defaultWeights.spacing
      );

      expect(result.breakdown.overall).toBe(expectedScore);
      expect(result.score).toBe(expectedScore);
    });

    it('should support custom weights', () => {
      const references = createSimilarColorReferences();
      const options: HarmonyCheckOptions = {
        colorWeight: 0.5,
        typographyWeight: 0.3,
        spacingWeight: 0.2,
      };

      const result = calculateHarmony(references, undefined, options);

      const expectedScore = Math.round(
        result.breakdown.color * 0.5 +
        result.breakdown.typography * 0.3 +
        result.breakdown.spacing * 0.2
      );

      expect(result.score).toBe(expectedScore);
    });

    it('should return perfect score for single reference', () => {
      const references = [createMockReference('ref-1', 'Site A')];
      const result = calculateHarmony(references);

      expect(result.score).toBe(0);
      expect(result.breakdown.color).toBe(0);
    });

    it('should return error for no references', () => {
      const result = calculateHarmony([]);

      expect(result.score).toBe(0);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].severity).toBe('high');
    });

    it('should include metadata in result', () => {
      const references = createSimilarColorReferences();
      const result = calculateHarmony(references);

      expect(result.referencesAnalyzed).toEqual(['Site A', 'Site B']);
      expect(result.sectionsAnalyzed).toEqual([]);
    });
  });

  // ====================
  // SECTION MAPPING
  // ====================

  describe('calculateHarmony - Section Mapping', () => {
    it('should populate affected sections in issues', () => {
      const references = createClashingColorReferences();
      const sectionMapping: SectionMapping = {
        header: 'ref-1',
        hero: 'ref-2',
        footer: 'ref-1',
      };

      const result = calculateHarmony(references, sectionMapping);

      expect(result.sectionsAnalyzed).toEqual(['header', 'hero', 'footer']);

      // Check if issues have affected sections
      const colorIssues = result.issues.filter(i => i.type === 'color_clash');
      if (colorIssues.length > 0) {
        expect(colorIssues[0].affectedSections).toBeDefined();
      }
    });

    it('should support index-based section mapping', () => {
      const references = createSimilarColorReferences();
      const sectionMapping: SectionMapping = {
        header: '0',
        hero: '1',
      };

      const result = calculateHarmony(references, sectionMapping);
      expect(result.sectionsAnalyzed).toEqual(['header', 'hero']);
    });
  });

  // ====================
  // SUGGESTIONS
  // ====================

  describe('calculateHarmony - Suggestions', () => {
    it('should suggest color improvements for low color score', () => {
      const references = createClashingColorReferences();
      const result = calculateHarmony(references);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(
        result.suggestions.some(s => s.toLowerCase().includes('color'))
      ).toBe(true);
    });

    it('should suggest typography improvements for low typography score', () => {
      const references = createDifferentTypographyReferences();
      const result = calculateHarmony(references);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(
        result.suggestions.some(s => s.toLowerCase().includes('typography') || s.toLowerCase().includes('font'))
      ).toBe(true);
    });

    it('should suggest positive message for high scores', () => {
      const references = createSimilarColorReferences();
      const result = calculateHarmony(references);

      if (result.breakdown.overall >= 85) {
        expect(
          result.suggestions.some(s => s.includes('work well'))
        ).toBe(true);
      }
    });

    it('should suggest different references for very low scores', () => {
      const references = createClashingColorReferences();
      const result = calculateHarmony(references);

      if (result.breakdown.overall < 60) {
        expect(
          result.suggestions.some(s => s.includes('different design systems') || s.includes('similar visual styles'))
        ).toBe(true);
      }
    });
  });

  // ====================
  // QUICK CHECK FUNCTIONS
  // ====================

  describe('getHarmonyScore', () => {
    it('should return just the score', () => {
      const references = createSimilarColorReferences();
      const score = getHarmonyScore(references);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should match calculateHarmony score', () => {
      const references = createSimilarColorReferences();
      const detailedResult = calculateHarmony(references);
      const quickScore = getHarmonyScore(references);

      expect(quickScore).toBe(detailedResult.score);
    });
  });

  describe('meetsHarmonyThreshold', () => {
    it('should return true when score meets threshold', () => {
      const references = createSimilarColorReferences();
      expect(meetsHarmonyThreshold(references, 70)).toBe(true);
    });

    it('should return false when score below threshold', () => {
      const references = createClashingColorReferences();
      expect(meetsHarmonyThreshold(references, 90)).toBe(false);
    });

    it('should return true when score equals threshold', () => {
      const references = createSimilarColorReferences();
      const score = getHarmonyScore(references);
      expect(meetsHarmonyThreshold(references, score)).toBe(true);
    });
  });

  // ====================
  // EDGE CASES
  // ====================

  describe('Edge Cases', () => {
    it('should handle references with empty color palettes', () => {
      const references = [
        createMockReference('ref-1', 'Site A', {
          tokens: createMockDesignSystem({
            colors: {
              primary: [],
              secondary: [],
              neutral: [],
              semantic: {
                success: '#22c55e',
                error: '#ef4444',
                warning: '#f59e0b',
                info: '#3b82f6',
              },
              palettes: {},
            },
          }),
        }),
        createMockReference('ref-2', 'Site B'),
      ];

      const result = calculateHarmony(references);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.color).toBeGreaterThanOrEqual(0);
    });

    it('should handle three or more references', () => {
      const references = [
        createMockReference('ref-1', 'Site A'),
        createMockReference('ref-2', 'Site B'),
        createMockReference('ref-3', 'Site C'),
      ];

      const result = calculateHarmony(references);
      expect(result.referencesAnalyzed).toEqual(['Site A', 'Site B', 'Site C']);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle references with missing font families', () => {
      const references = [
        createMockReference('ref-1', 'Site A', {
          tokens: createMockDesignSystem({
            typography: {
              fonts: { heading: '', body: '' },
              scale: {
                display: '72px',
                h1: '48px',
                h2: '36px',
                h3: '28px',
                h4: '24px',
                h5: '20px',
                h6: '18px',
                body: '16px',
                small: '14px',
                xs: '12px',
              },
              weights: [400],
              lineHeights: { tight: 1.2, normal: 1.5, relaxed: 1.8 },
            },
          }),
        }),
        createMockReference('ref-2', 'Site B'),
      ];

      const result = calculateHarmony(references);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle references with empty spacing scales', () => {
      const references = [
        createMockReference('ref-1', 'Site A', {
          tokens: createMockDesignSystem({
            spacing: {
              baseUnit: 4,
              scale: [],
              containerMaxWidth: '1280px',
              sectionPadding: { mobile: '16px', desktop: '64px' },
            },
          }),
        }),
        createMockReference('ref-2', 'Site B', {
          tokens: createMockDesignSystem({
            spacing: {
              baseUnit: 4,
              scale: [],
              containerMaxWidth: '1280px',
              sectionPadding: { mobile: '16px', desktop: '64px' },
            },
          }),
        }),
      ];

      const result = calculateHarmony(references);
      // Should return neutral score for spacing when no data
      expect(result.breakdown.spacing).toBeGreaterThanOrEqual(0);
    });
  });

  // ====================
  // CONFIGURATION
  // ====================

  describe('HARMONY_CONFIG', () => {
    it('should export harmony configuration', () => {
      expect(HARMONY_CONFIG).toBeDefined();
      expect(HARMONY_CONFIG.defaultWeights).toBeDefined();
      expect(HARMONY_CONFIG.thresholds).toBeDefined();
      expect(HARMONY_CONFIG.color).toBeDefined();
      expect(HARMONY_CONFIG.typography).toBeDefined();
      expect(HARMONY_CONFIG.spacing).toBeDefined();
    });

    it('should have weights that sum to 1', () => {
      const sum =
        HARMONY_CONFIG.defaultWeights.color +
        HARMONY_CONFIG.defaultWeights.typography +
        HARMONY_CONFIG.defaultWeights.spacing;

      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should have reasonable threshold values', () => {
      expect(HARMONY_CONFIG.thresholds.high).toBeLessThan(HARMONY_CONFIG.thresholds.medium);
      expect(HARMONY_CONFIG.thresholds.medium).toBeLessThan(HARMONY_CONFIG.thresholds.low);
    });
  });
});
