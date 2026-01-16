'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AccuracyBadge, SectionComparison } from '@/components/Comparison';

interface ComparisonResult {
  sectionName: string;
  sectionType: string;
  accuracy: number;
  mismatchedPixels: number;
  totalPixels: number;
  diffImagePath: string;
  referenceImagePath: string;
  generatedImagePath: string;
}

interface ComparisonReport {
  websiteId: string;
  timestamp: string;
  overallAccuracy: number;
  sections: ComparisonResult[];
  summary: {
    totalSections: number;
    sectionsAbove90: number;
    sectionsAbove80: number;
    sectionsBelow80: number;
  };
}

export default function ComparePage() {
  const params = useParams();
  const websiteId = params.id as string;

  const [report, setReport] = useState<ComparisonReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Fetch existing report
  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/compare?websiteId=${websiteId}`);
        const data = await response.json();

        if (data.success && data.report) {
          setReport(data.report);
        }
      } catch (err) {
        console.error('Error fetching report:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [websiteId]);

  // Run comparison
  async function runComparison(forceRecapture = false) {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId,
          forceRecapture,
        }),
      });

      const data = await response.json();

      if (data.success && data.report) {
        setReport(data.report);
      } else {
        setError(data.error || 'Comparison failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  }

  // Convert file paths to API URLs for images
  function getImageUrl(filePath: string): string {
    if (!filePath) return '';
    // Extract relative path from Websites folder
    const match = filePath.match(/Websites\/(.+)/);
    if (match) {
      return `/api/image?path=${encodeURIComponent(match[1])}`;
    }
    return '';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading comparison...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">
                Visual Comparison
              </h1>
            </div>

            {report && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Last run: {new Date(report.timestamp).toLocaleString()}
                </div>
                <AccuracyBadge accuracy={report.overallAccuracy} size="lg" />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Actions */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => runComparison(false)}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? 'Running...' : 'Run Comparison'}
          </button>
          <button
            onClick={() => runComparison(true)}
            disabled={isRunning}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Force Recapture
          </button>

          {error && (
            <div className="text-red-600 text-sm">
              Error: {error}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {report && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Overall Accuracy</div>
              <div className="text-2xl font-bold text-gray-900">
                {report.overallAccuracy.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Sections ≥90%</div>
              <div className="text-2xl font-bold text-green-600">
                {report.summary.sectionsAbove90}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Sections 80-90%</div>
              <div className="text-2xl font-bold text-yellow-600">
                {report.summary.sectionsAbove80}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Sections &lt;80%</div>
              <div className="text-2xl font-bold text-red-600">
                {report.summary.sectionsBelow80}
              </div>
            </div>
          </div>
        )}

        {/* Section Comparisons */}
        {report ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Section Comparisons ({report.sections.length})
            </h2>

            {report.sections.map((section, index) => (
              <SectionComparison
                key={section.sectionName}
                sectionName={section.sectionName}
                sectionType={section.sectionType}
                accuracy={section.accuracy}
                referenceImage={getImageUrl(section.referenceImagePath)}
                generatedImage={getImageUrl(section.generatedImagePath)}
                diffImage={getImageUrl(section.diffImagePath)}
                mismatchedPixels={section.mismatchedPixels}
                totalPixels={section.totalPixels}
                defaultExpanded={index === 0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              No comparison report found. Run a comparison to get started.
            </p>
            <button
              onClick={() => runComparison(true)}
              disabled={isRunning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isRunning ? 'Running...' : 'Start Comparison'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
