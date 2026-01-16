'use client';

import { cn } from '@/lib/utils';
import type {
  QualityReport,
  QualityLevel,
  IssueSeverity,
  IssueCategory,
  QualityIssue,
} from '@/lib/export/quality-report';
import { AccuracyBadge } from '@/components/Comparison/AccuracyBadge';

/**
 * Props for the QualityReportView component
 */
export interface QualityReportViewProps {
  /** The quality report data to display */
  report: QualityReport;
  /** Whether to show detailed information */
  showDetails?: boolean;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * Get color classes for quality level
 */
function getQualityLevelColor(level: QualityLevel): string {
  const colors: Record<QualityLevel, string> = {
    excellent: 'bg-green-500/10 text-green-600 border-green-500/20',
    good: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    fair: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    poor: 'bg-red-500/10 text-red-600 border-red-500/20',
  };
  return colors[level];
}

/**
 * Get display label for quality level
 */
function getQualityLevelLabel(level: QualityLevel): string {
  const labels: Record<QualityLevel, string> = {
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Needs Improvement',
  };
  return labels[level];
}

/**
 * Get icon for quality level
 */
function getQualityLevelIcon(level: QualityLevel): string {
  const icons: Record<QualityLevel, string> = {
    excellent: '✓',
    good: '✓',
    fair: '!',
    poor: '✗',
  };
  return icons[level];
}

/**
 * Get color classes for issue severity
 */
function getSeverityColor(severity: IssueSeverity): string {
  const colors: Record<IssueSeverity, string> = {
    critical: 'text-red-600 bg-red-500/10 border-red-500/20',
    warning: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20',
    info: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
  };
  return colors[severity];
}

/**
 * Get icon for issue severity
 */
function getSeverityIcon(severity: IssueSeverity): React.ReactNode {
  const icons: Record<IssueSeverity, React.ReactNode> = {
    critical: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    warning: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    info: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  };
  return icons[severity];
}

/**
 * Get display label for issue category
 */
function getCategoryLabel(category: IssueCategory): string {
  const labels: Record<IssueCategory, string> = {
    accuracy: 'Accuracy',
    completeness: 'Completeness',
    interactivity: 'Interactivity',
    accessibility: 'Accessibility',
    performance: 'Performance',
    seo: 'SEO',
  };
  return labels[category];
}

/**
 * IssueCard Component - displays a single issue or recommendation
 */
function IssueCard({ issue }: { issue: QualityIssue }) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg border-2 transition-all duration-200',
        getSeverityColor(issue.severity)
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(issue.severity)}</div>
        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold">{issue.title}</h4>
            <span className="text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap">
              {getCategoryLabel(issue.category)}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs leading-relaxed opacity-90">{issue.description}</p>

          {/* Affected Components */}
          {issue.affectedComponents && issue.affectedComponents.length > 0 && (
            <div className="text-xs opacity-80">
              <span className="font-medium">Affected: </span>
              {issue.affectedComponents.join(', ')}
            </div>
          )}

          {/* Recommendation */}
          <div className="pt-2 border-t border-current opacity-20" />
          <div className="text-xs opacity-90">
            <span className="font-medium">Recommendation: </span>
            {issue.recommendation}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * QualityReportView Component
 *
 * Displays comprehensive quality assessment including accuracy metrics,
 * component status breakdown, issues found, and actionable recommendations.
 * Uses AccuracyBadge for consistent accuracy score display.
 */
export function QualityReportView({
  report,
  showDetails = true,
  className,
}: QualityReportViewProps) {
  const criticalIssues = report.issues.filter((i) => i.severity === 'critical');
  const warningIssues = report.issues.filter((i) => i.severity === 'warning');
  const infoIssues = report.issues.filter((i) => i.severity === 'info');

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">
            Quality Report
          </h3>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 font-medium text-sm',
              getQualityLevelColor(report.qualityLevel)
            )}
          >
            <span>{getQualityLevelIcon(report.qualityLevel)}</span>
            <span>{getQualityLevelLabel(report.qualityLevel)}</span>
          </span>
        </div>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Generated on {new Date(report.generatedAt).toLocaleString()}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Accuracy */}
        <div className="p-4 rounded-lg border-2 border-[rgb(var(--border))] bg-[rgb(var(--background))]">
          <div className="text-xs text-[rgb(var(--muted-foreground))] mb-2">
            Overall Accuracy
          </div>
          <div className="flex items-center gap-2">
            <AccuracyBadge accuracy={report.summary.averageAccuracy} size="lg" />
          </div>
        </div>

        {/* Approved Components */}
        <div className="p-4 rounded-lg border-2 border-[rgb(var(--border))] bg-[rgb(var(--background))]">
          <div className="text-xs text-[rgb(var(--muted-foreground))] mb-2">
            Approved Components
          </div>
          <div className="text-2xl font-bold text-[rgb(var(--foreground))]">
            {report.summary.approvedComponents}
            <span className="text-sm font-normal text-[rgb(var(--muted-foreground))] ml-1">
              / {report.summary.totalComponents}
            </span>
          </div>
        </div>

        {/* Critical Issues */}
        <div className="p-4 rounded-lg border-2 border-[rgb(var(--border))] bg-[rgb(var(--background))]">
          <div className="text-xs text-[rgb(var(--muted-foreground))] mb-2">
            Critical Issues
          </div>
          <div
            className={cn('text-2xl font-bold', {
              'text-[rgb(var(--success))]': report.summary.criticalIssues === 0,
              'text-[rgb(var(--destructive))]': report.summary.criticalIssues > 0,
            })}
          >
            {report.summary.criticalIssues}
          </div>
        </div>

        {/* Export Status */}
        <div className="p-4 rounded-lg border-2 border-[rgb(var(--border))] bg-[rgb(var(--background))]">
          <div className="text-xs text-[rgb(var(--muted-foreground))] mb-2">
            Export Status
          </div>
          <div
            className={cn('text-sm font-semibold', {
              'text-[rgb(var(--success))]': report.summary.readyForExport,
              'text-[rgb(var(--warning))]': !report.summary.readyForExport,
            })}
          >
            {report.summary.readyForExport ? '✓ Ready' : '! Not Ready'}
          </div>
        </div>
      </div>

      {/* Component Status Breakdown */}
      {showDetails && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[rgb(var(--foreground))]">
            Component Status
          </h4>
          <div className="space-y-2">
            {/* Progress Bar */}
            <div className="h-3 w-full rounded-full overflow-hidden bg-[rgb(var(--muted))]">
              <div className="h-full flex">
                {report.componentStatus.approved > 0 && (
                  <div
                    className="bg-green-500"
                    style={{
                      width: `${(report.componentStatus.approved / report.componentStatus.total) * 100}%`,
                    }}
                  />
                )}
                {report.componentStatus.pending > 0 && (
                  <div
                    className="bg-yellow-500"
                    style={{
                      width: `${(report.componentStatus.pending / report.componentStatus.total) * 100}%`,
                    }}
                  />
                )}
                {report.componentStatus.rejected > 0 && (
                  <div
                    className="bg-gray-500"
                    style={{
                      width: `${(report.componentStatus.rejected / report.componentStatus.total) * 100}%`,
                    }}
                  />
                )}
                {report.componentStatus.failed > 0 && (
                  <div
                    className="bg-red-500"
                    style={{
                      width: `${(report.componentStatus.failed / report.componentStatus.total) * 100}%`,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-[rgb(var(--foreground))]">
                  Approved: {report.componentStatus.approved}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-[rgb(var(--foreground))]">
                  Pending: {report.componentStatus.pending}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="text-[rgb(var(--foreground))]">
                  Rejected: {report.componentStatus.rejected}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-[rgb(var(--foreground))]">
                  Failed: {report.componentStatus.failed}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accuracy Distribution */}
      {showDetails && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[rgb(var(--foreground))]">
            Accuracy Distribution
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
              <div className="text-xs text-[rgb(var(--muted-foreground))] mb-1">
                Excellent (90+%)
              </div>
              <div className="text-xl font-bold text-green-600">
                {report.accuracy.distribution.excellent}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
              <div className="text-xs text-[rgb(var(--muted-foreground))] mb-1">
                Good (70-89%)
              </div>
              <div className="text-xl font-bold text-blue-600">
                {report.accuracy.distribution.good}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
              <div className="text-xs text-[rgb(var(--muted-foreground))] mb-1">
                Fair (50-69%)
              </div>
              <div className="text-xl font-bold text-yellow-600">
                {report.accuracy.distribution.fair}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
              <div className="text-xs text-[rgb(var(--muted-foreground))] mb-1">
                Poor (0-49%)
              </div>
              <div className="text-xl font-bold text-red-600">
                {report.accuracy.distribution.poor}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[rgb(var(--foreground))] flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/10 text-red-600 text-xs font-bold">
              {criticalIssues.length}
            </span>
            Critical Issues
          </h4>
          <div className="space-y-3">
            {criticalIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {showDetails && warningIssues.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[rgb(var(--foreground))] flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500/10 text-yellow-600 text-xs font-bold">
              {warningIssues.length}
            </span>
            Warnings
          </h4>
          <div className="space-y-3">
            {warningIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[rgb(var(--foreground))]">
            Recommendations
          </h4>
          <div className="space-y-3">
            {report.recommendations.map((recommendation) => (
              <IssueCard key={recommendation.id} issue={recommendation} />
            ))}
          </div>
        </div>
      )}

      {/* No Issues Message */}
      {report.issues.length === 0 && report.recommendations.length === 0 && (
        <div className="p-6 rounded-lg border-2 border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-600"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-green-600 mb-1">
                Everything looks great!
              </h4>
              <p className="text-xs text-[rgb(var(--muted-foreground))]">
                Your website is ready to export with no issues detected.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QualityReportView;
