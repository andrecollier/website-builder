/**
 * Quality Report Generator Module
 *
 * This module generates comprehensive quality assessments for website exports,
 * including accuracy metrics, component status breakdowns, issues found, and
 * actionable recommendations for improving the export quality.
 *
 * Coordinates with:
 * - database client: For loading component and variant data
 * - component records: For status and accuracy information
 * - variant records: For detailed accuracy scores
 */

import type { ComponentType } from '@/types';
import {
  getDb,
  getWebsiteById,
  getComponentsByWebsite,
  getVariantsByComponent,
  type ComponentRecord,
  type VariantRecord,
} from '@/lib/db/client';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Overall quality level based on metrics
 */
export type QualityLevel = 'excellent' | 'good' | 'fair' | 'poor';

/**
 * Category of issue or recommendation
 */
export type IssueCategory =
  | 'accuracy'
  | 'completeness'
  | 'interactivity'
  | 'accessibility'
  | 'performance'
  | 'seo';

/**
 * Severity of an issue
 */
export type IssueSeverity = 'critical' | 'warning' | 'info';

/**
 * Individual issue or recommendation
 */
export interface QualityIssue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  affectedComponents?: string[];
  recommendation: string;
  resolved: boolean;
}

/**
 * Status breakdown for components
 */
export interface ComponentStatusBreakdown {
  approved: number;
  pending: number;
  rejected: number;
  skipped: number;
  failed: number;
  total: number;
}

/**
 * Accuracy metrics for components
 */
export interface AccuracyMetrics {
  overall: number;
  byComponentType: Record<ComponentType, number>;
  distribution: {
    excellent: number; // 90-100%
    good: number; // 70-89%
    fair: number; // 50-69%
    poor: number; // 0-49%
  };
}

/**
 * Complete quality report for a website
 */
export interface QualityReport {
  websiteId: string;
  websiteName: string;
  generatedAt: string;
  qualityLevel: QualityLevel;
  accuracy: AccuracyMetrics;
  componentStatus: ComponentStatusBreakdown;
  issues: QualityIssue[];
  recommendations: QualityIssue[];
  summary: {
    totalComponents: number;
    approvedComponents: number;
    averageAccuracy: number;
    criticalIssues: number;
    readyForExport: boolean;
  };
}

/**
 * Options for quality report generation
 */
export interface QualityReportOptions {
  /** Include detailed component-level information */
  includeDetails?: boolean;
  /** Minimum accuracy score to consider acceptable (default: 70) */
  minAcceptableScore?: number;
  /** Include resolved issues in report */
  includeResolvedIssues?: boolean;
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Calculate overall quality level from metrics
 */
function calculateQualityLevel(
  accuracy: number,
  componentStatus: ComponentStatusBreakdown
): QualityLevel {
  const approvalRate = componentStatus.approved / componentStatus.total;
  const hasFailures = componentStatus.failed > 0;

  if (accuracy >= 85 && approvalRate >= 0.9 && !hasFailures) {
    return 'excellent';
  } else if (accuracy >= 70 && approvalRate >= 0.7) {
    return 'good';
  } else if (accuracy >= 50 && approvalRate >= 0.5) {
    return 'fair';
  }
  return 'poor';
}

/**
 * Get component type display name
 */
function getComponentTypeName(type: ComponentType): string {
  const names: Record<ComponentType, string> = {
    header: 'Header',
    hero: 'Hero',
    features: 'Features',
    testimonials: 'Testimonials',
    pricing: 'Pricing',
    cta: 'Call to Action',
    footer: 'Footer',
    cards: 'Cards',
    gallery: 'Gallery',
    contact: 'Contact',
    faq: 'FAQ',
    stats: 'Statistics',
    team: 'Team',
    logos: 'Logos',
  };
  return names[type] || type;
}

// ====================
// METRICS CALCULATION
// ====================

/**
 * Calculate component status breakdown
 */
export function calculateComponentStatus(
  components: ComponentRecord[]
): ComponentStatusBreakdown {
  const breakdown: ComponentStatusBreakdown = {
    approved: 0,
    pending: 0,
    rejected: 0,
    skipped: 0,
    failed: 0,
    total: components.length,
  };

  for (const component of components) {
    switch (component.status) {
      case 'approved':
        breakdown.approved++;
        break;
      case 'pending':
        breakdown.pending++;
        break;
      case 'rejected':
        breakdown.rejected++;
        break;
      case 'skipped':
        breakdown.skipped++;
        break;
      case 'failed':
        breakdown.failed++;
        break;
    }
  }

  return breakdown;
}

/**
 * Calculate accuracy metrics from components and variants
 */
export async function calculateAccuracy(
  components: ComponentRecord[]
): Promise<AccuracyMetrics> {
  const metrics: AccuracyMetrics = {
    overall: 0,
    byComponentType: {} as Record<ComponentType, number>,
    distribution: {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
    },
  };

  if (components.length === 0) {
    return metrics;
  }

  const db = getDb();
  let totalScore = 0;
  let scoredCount = 0;
  const typeScores: Record<string, { total: number; count: number }> = {};

  for (const component of components) {
    // Get the accuracy score from the component or its selected variant
    let score: number | null = component.accuracy_score;

    if (score === null && component.selected_variant) {
      // Try to get score from selected variant
      const variants = getVariantsByComponent(component.id);
      const selectedVariant = variants.find(
        (v) => v.variant_name === component.selected_variant
      );
      score = selectedVariant?.accuracy_score ?? null;
    }

    if (score !== null) {
      totalScore += score;
      scoredCount++;

      // Track by component type
      if (!typeScores[component.type]) {
        typeScores[component.type] = { total: 0, count: 0 };
      }
      typeScores[component.type].total += score;
      typeScores[component.type].count++;

      // Track distribution
      if (score >= 90) {
        metrics.distribution.excellent++;
      } else if (score >= 70) {
        metrics.distribution.good++;
      } else if (score >= 50) {
        metrics.distribution.fair++;
      } else {
        metrics.distribution.poor++;
      }
    }
  }

  // Calculate overall average
  metrics.overall = scoredCount > 0 ? totalScore / scoredCount : 0;

  // Calculate per-type averages
  for (const [type, scores] of Object.entries(typeScores)) {
    metrics.byComponentType[type as ComponentType] =
      scores.count > 0 ? scores.total / scores.count : 0;
  }

  return metrics;
}

// ====================
// ISSUE DETECTION
// ====================

/**
 * Detect quality issues from component analysis
 */
export function detectIssues(
  components: ComponentRecord[],
  accuracy: AccuracyMetrics,
  options: QualityReportOptions = {}
): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const minScore = options.minAcceptableScore ?? 70;
  let issueIdCounter = 1;

  // Check for failed components
  const failedComponents = components.filter((c) => c.status === 'failed');
  if (failedComponents.length > 0) {
    issues.push({
      id: `issue-${issueIdCounter++}`,
      category: 'completeness',
      severity: 'critical',
      title: 'Failed Component Generation',
      description: `${failedComponents.length} component(s) failed to generate successfully.`,
      affectedComponents: failedComponents.map((c) => c.name),
      recommendation:
        'Review error messages and retry generation for failed components before exporting.',
      resolved: false,
    });
  }

  // Check for pending components
  const pendingComponents = components.filter((c) => c.status === 'pending');
  if (pendingComponents.length > 0) {
    issues.push({
      id: `issue-${issueIdCounter++}`,
      category: 'completeness',
      severity: 'warning',
      title: 'Unapproved Components',
      description: `${pendingComponents.length} component(s) have not been reviewed and approved.`,
      affectedComponents: pendingComponents.map((c) => c.name),
      recommendation:
        'Review and approve all pending components to ensure quality before export.',
      resolved: false,
    });
  }

  // Check for low accuracy components
  const lowAccuracyComponents = components.filter(
    (c) => c.accuracy_score !== null && c.accuracy_score < minScore
  );
  if (lowAccuracyComponents.length > 0) {
    issues.push({
      id: `issue-${issueIdCounter++}`,
      category: 'accuracy',
      severity: 'warning',
      title: 'Low Accuracy Scores',
      description: `${lowAccuracyComponents.length} component(s) have accuracy scores below ${minScore}%.`,
      affectedComponents: lowAccuracyComponents.map((c) => c.name),
      recommendation:
        'Consider regenerating variants or using custom code to improve visual accuracy.',
      resolved: false,
    });
  }

  // Check for rejected components
  const rejectedComponents = components.filter((c) => c.status === 'rejected');
  if (rejectedComponents.length > 0) {
    issues.push({
      id: `issue-${issueIdCounter++}`,
      category: 'completeness',
      severity: 'info',
      title: 'Rejected Components',
      description: `${rejectedComponents.length} component(s) have been rejected and will not be included in the export.`,
      affectedComponents: rejectedComponents.map((c) => c.name),
      recommendation:
        'Verify that rejected components are intentionally excluded from the final export.',
      resolved: false,
    });
  }

  // Check for components without variants selected
  const noVariantSelected = components.filter(
    (c) => c.status === 'approved' && !c.selected_variant && !c.custom_code
  );
  if (noVariantSelected.length > 0) {
    issues.push({
      id: `issue-${issueIdCounter++}`,
      category: 'completeness',
      severity: 'critical',
      title: 'Missing Variant Selection',
      description: `${noVariantSelected.length} approved component(s) have no variant selected or custom code.`,
      affectedComponents: noVariantSelected.map((c) => c.name),
      recommendation:
        'Select a variant or provide custom code for all approved components.',
      resolved: false,
    });
  }

  // Check overall accuracy
  if (accuracy.overall < minScore && components.length > 0) {
    issues.push({
      id: `issue-${issueIdCounter++}`,
      category: 'accuracy',
      severity: 'warning',
      title: 'Below Target Accuracy',
      description: `Overall accuracy (${accuracy.overall.toFixed(1)}%) is below the target threshold of ${minScore}%.`,
      recommendation:
        'Review components with low accuracy scores and consider regeneration or manual refinement.',
      resolved: false,
    });
  }

  return issues;
}

/**
 * Generate recommendations for improving export quality
 */
export function generateRecommendations(
  components: ComponentRecord[],
  accuracy: AccuracyMetrics,
  issues: QualityIssue[]
): QualityIssue[] {
  const recommendations: QualityIssue[] = [];
  let recIdCounter = 1;

  // Recommend interactivity additions
  const hasInteractiveComponents = components.some((c) =>
    ['header', 'hero', 'faq'].includes(c.type)
  );
  if (hasInteractiveComponents) {
    recommendations.push({
      id: `rec-${recIdCounter++}`,
      category: 'interactivity',
      severity: 'info',
      title: 'Enable Interactivity',
      description:
        'Some components may benefit from interactive features like dropdowns, accordions, or mobile menus.',
      recommendation:
        'Enable the "Add Interactivity" option in the export settings to include JavaScript for interactive elements.',
      resolved: false,
    });
  }

  // Recommend image optimization
  recommendations.push({
    id: `rec-${recIdCounter++}`,
    category: 'performance',
    severity: 'info',
    title: 'Optimize Images',
    description:
      'Optimizing images improves page load times and user experience.',
    recommendation:
      'Enable the "Optimize Images" option to convert images to WebP format with responsive srcset attributes.',
    resolved: false,
  });

  // Recommend SEO metadata
  recommendations.push({
    id: `rec-${recIdCounter++}`,
    category: 'seo',
    severity: 'info',
    title: 'Add SEO Metadata',
    description:
      'Adding proper meta tags improves search engine visibility and social sharing.',
    recommendation:
      'Fill out the SEO form with your site title, description, and Open Graph image before exporting.',
    resolved: false,
  });

  // Recommend accessibility review if low accuracy
  if (accuracy.overall < 70) {
    recommendations.push({
      id: `rec-${recIdCounter++}`,
      category: 'accessibility',
      severity: 'info',
      title: 'Review Accessibility',
      description:
        'Components with lower accuracy may have accessibility issues.',
      recommendation:
        'After export, run accessibility audits (Lighthouse, axe) and add missing ARIA labels and keyboard navigation.',
      resolved: false,
    });
  }

  // Add critical issue recommendations
  const criticalIssues = issues.filter((i) => i.severity === 'critical');
  if (criticalIssues.length > 0) {
    recommendations.push({
      id: `rec-${recIdCounter++}`,
      category: 'completeness',
      severity: 'critical',
      title: 'Resolve Critical Issues',
      description: `You have ${criticalIssues.length} critical issue(s) that should be addressed before exporting.`,
      recommendation:
        'Review and resolve all critical issues to ensure a complete and functional export.',
      resolved: false,
    });
  }

  return recommendations;
}

// ====================
// MAIN REPORT GENERATION
// ====================

/**
 * Generate a comprehensive quality report for a website
 */
export async function generateQualityReport(
  websiteId: string,
  options: QualityReportOptions = {}
): Promise<QualityReport> {
  // Load website data
  const website = getWebsiteById(websiteId);
  if (!website) {
    throw new Error(`Website not found: ${websiteId}`);
  }

  // Load all components for this website
  const components = getComponentsByWebsite(websiteId);

  // Calculate metrics
  const componentStatus = calculateComponentStatus(components);
  const accuracy = await calculateAccuracy(components);

  // Detect issues
  const issues = detectIssues(components, accuracy, options);

  // Generate recommendations
  const recommendations = generateRecommendations(components, accuracy, issues);

  // Filter out resolved issues if requested
  const filteredIssues = options.includeResolvedIssues
    ? issues
    : issues.filter((i) => !i.resolved);

  // Calculate quality level
  const qualityLevel = calculateQualityLevel(accuracy.overall, componentStatus);

  // Build summary
  const criticalIssues = filteredIssues.filter(
    (i) => i.severity === 'critical'
  ).length;
  const readyForExport =
    criticalIssues === 0 &&
    componentStatus.failed === 0 &&
    componentStatus.approved > 0;

  const report: QualityReport = {
    websiteId,
    websiteName: website.name,
    generatedAt: new Date().toISOString(),
    qualityLevel,
    accuracy,
    componentStatus,
    issues: filteredIssues,
    recommendations,
    summary: {
      totalComponents: componentStatus.total,
      approvedComponents: componentStatus.approved,
      averageAccuracy: Math.round(accuracy.overall * 10) / 10,
      criticalIssues,
      readyForExport,
    },
  };

  return report;
}

/**
 * Get a summary of quality metrics for quick display
 */
export async function getQualitySummary(websiteId: string): Promise<{
  qualityLevel: QualityLevel;
  averageAccuracy: number;
  approvedComponents: number;
  totalComponents: number;
  criticalIssues: number;
  readyForExport: boolean;
}> {
  const report = await generateQualityReport(websiteId, {
    includeDetails: false,
  });
  return report.summary;
}

/**
 * Check if a website is ready for export
 */
export async function isReadyForExport(websiteId: string): Promise<boolean> {
  const summary = await getQualitySummary(websiteId);
  return summary.readyForExport;
}
