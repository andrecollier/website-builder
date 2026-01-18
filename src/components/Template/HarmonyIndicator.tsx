'use client';

import { useMemo } from 'react';
import { HarmonyIndicatorProps } from '@/types';
import { cn } from '@/lib/utils';

/**
 * HarmonyIndicator component displays visual harmony score for Template Mode
 * Shows 0-100 score with visual indicator, issues, and improvement suggestions
 */
export function HarmonyIndicator({
  harmonyResult,
  isCalculating = false,
}: HarmonyIndicatorProps) {
  /**
   * Get score category and styling
   */
  const scoreInfo = useMemo(() => {
    if (!harmonyResult) {
      return {
        category: 'Not Calculated',
        description: 'Map sections to calculate harmony',
        color: 'text-[rgb(var(--muted-foreground))]',
        bgColor: 'bg-[rgb(var(--muted)/0.2)]',
        borderColor: 'border-[rgb(var(--border))]',
      };
    }

    const score = harmonyResult.score;

    if (score >= 80) {
      return {
        category: 'Excellent',
        description: 'Great visual consistency',
        color: 'text-[rgb(var(--success))]',
        bgColor: 'bg-[rgb(var(--success)/0.1)]',
        borderColor: 'border-[rgb(var(--success)/0.3)]',
      };
    } else if (score >= 60) {
      return {
        category: 'Good',
        description: 'Minor adjustments suggested',
        color: 'text-[rgb(var(--primary))]',
        bgColor: 'bg-[rgb(var(--primary)/0.1)]',
        borderColor: 'border-[rgb(var(--primary)/0.3)]',
      };
    } else if (score >= 40) {
      return {
        category: 'Fair',
        description: 'Some inconsistencies detected',
        color: 'text-[rgb(var(--warning))]',
        bgColor: 'bg-[rgb(var(--warning)/0.1)]',
        borderColor: 'border-[rgb(var(--warning)/0.3)]',
      };
    } else {
      return {
        category: 'Poor',
        description: 'Significant conflicts found',
        color: 'text-[rgb(var(--destructive))]',
        bgColor: 'bg-[rgb(var(--destructive)/0.1)]',
        borderColor: 'border-[rgb(var(--destructive)/0.3)]',
      };
    }
  }, [harmonyResult]);

  /**
   * Get severity styling for issues
   */
  const getSeverityStyle = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return {
          color: 'text-[rgb(var(--destructive))]',
          bgColor: 'bg-[rgb(var(--destructive)/0.1)]',
          icon: '●',
        };
      case 'medium':
        return {
          color: 'text-[rgb(var(--warning))]',
          bgColor: 'bg-[rgb(var(--warning)/0.1)]',
          icon: '●',
        };
      case 'low':
        return {
          color: 'text-[rgb(var(--muted-foreground))]',
          bgColor: 'bg-[rgb(var(--muted)/0.2)]',
          icon: '○',
        };
    }
  };

  /**
   * Get issue type label
   */
  const getIssueTypeLabel = (type: string) => {
    switch (type) {
      case 'color_clash':
        return 'Color Clash';
      case 'typography_mismatch':
        return 'Typography Mismatch';
      case 'spacing_inconsistent':
        return 'Spacing Inconsistent';
      default:
        return type;
    }
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
          Visual Harmony
        </h2>
        {harmonyResult && (
          <span className="text-sm text-[rgb(var(--muted-foreground))]">
            Advisory Score
          </span>
        )}
      </div>

      {/* Main Score Card */}
      <div
        className={cn(
          'rounded-lg p-6 border transition-all duration-200',
          scoreInfo.bgColor,
          scoreInfo.borderColor
        )}
        role="region"
        aria-label="Harmony score indicator"
      >
        {/* Loading State */}
        {isCalculating && (
          <div className="flex items-center justify-center gap-3">
            <div
              className="w-5 h-5 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin"
              role="status"
              aria-label="Calculating harmony"
            />
            <span className="text-[rgb(var(--foreground))]">
              Calculating harmony...
            </span>
          </div>
        )}

        {/* Score Display */}
        {!isCalculating && (
          <>
            <div className="flex items-center gap-6 mb-4">
              {/* Circular Score Indicator */}
              <div className="relative w-24 h-24 flex-shrink-0">
                {/* Background Circle */}
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-[rgb(var(--muted)/0.3)]"
                  />
                  {/* Progress Circle */}
                  {harmonyResult && (
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 40 * (1 - harmonyResult.score / 100)
                      }`}
                      className={cn('transition-all duration-500', scoreInfo.color)}
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                {/* Score Number */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={cn(
                      'text-2xl font-bold',
                      harmonyResult ? scoreInfo.color : 'text-[rgb(var(--muted-foreground))]'
                    )}
                  >
                    {harmonyResult ? Math.round(harmonyResult.score) : '—'}
                  </span>
                </div>
              </div>

              {/* Score Info */}
              <div className="flex-1">
                <h3
                  className={cn(
                    'text-xl font-semibold mb-1',
                    harmonyResult ? scoreInfo.color : 'text-[rgb(var(--foreground))]'
                  )}
                >
                  {scoreInfo.category}
                </h3>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">
                  {scoreInfo.description}
                </p>
                {harmonyResult && (
                  <p className="text-xs text-[rgb(var(--muted-foreground))] mt-2">
                    Score is advisory only and will not block generation
                  </p>
                )}
              </div>
            </div>

            {/* Issues Section */}
            {harmonyResult &&
              harmonyResult.issues &&
              harmonyResult.issues.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[rgb(var(--border))]">
                  <h4 className="text-sm font-semibold text-[rgb(var(--foreground))] mb-3">
                    Issues Detected ({harmonyResult.issues.length})
                  </h4>
                  <ul className="space-y-2" role="list">
                    {harmonyResult.issues.map((issue, index) => {
                      const severityStyle = getSeverityStyle(issue.severity);
                      return (
                        <li
                          key={index}
                          className={cn(
                            'p-3 rounded-lg flex items-start gap-3',
                            severityStyle.bgColor
                          )}
                        >
                          {/* Severity Indicator */}
                          <span
                            className={cn(
                              'text-lg leading-none mt-0.5',
                              severityStyle.color
                            )}
                            aria-label={`${issue.severity} severity`}
                          >
                            {severityStyle.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            {/* Issue Type */}
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  severityStyle.color
                                )}
                              >
                                {getIssueTypeLabel(issue.type)}
                              </span>
                              <span className="text-xs text-[rgb(var(--muted-foreground))]">
                                {issue.severity}
                              </span>
                            </div>
                            {/* Description */}
                            <p className="text-sm text-[rgb(var(--foreground))]">
                              {issue.description}
                            </p>
                            {/* Affected Sections */}
                            {issue.affectedSections &&
                              issue.affectedSections.length > 0 && (
                                <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                                  Affects: {issue.affectedSections.join(', ')}
                                </p>
                              )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

            {/* Suggestions Section */}
            {harmonyResult &&
              harmonyResult.suggestions &&
              harmonyResult.suggestions.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[rgb(var(--border))]">
                  <h4 className="text-sm font-semibold text-[rgb(var(--foreground))] mb-3 flex items-center gap-2">
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
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Suggestions
                  </h4>
                  <ul className="space-y-2" role="list">
                    {harmonyResult.suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-sm text-[rgb(var(--muted-foreground))]"
                      >
                        <span className="text-[rgb(var(--primary))] mt-0.5">•</span>
                        <span className="flex-1">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </>
        )}
      </div>

      {/* Info Card */}
      {!harmonyResult && !isCalculating && (
        <div
          className="mt-4 p-4 rounded-lg bg-[rgb(var(--muted)/0.1)] border border-[rgb(var(--border))] flex items-start gap-3"
          role="note"
        >
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
            className="text-[rgb(var(--muted-foreground))] flex-shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-[rgb(var(--foreground))] mb-1">
              Harmony Score Calculation
            </p>
            <p className="text-xs text-[rgb(var(--muted-foreground))]">
              The harmony score analyzes visual consistency between your selected
              references by comparing colors, typography, and spacing. A higher
              score indicates better visual cohesion across mixed sections.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default HarmonyIndicator;
