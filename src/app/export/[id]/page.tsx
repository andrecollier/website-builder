'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FormatSelector,
  OptionsPanel,
  SEOForm,
  QualityReportView,
  PreviewButton,
  DownloadButton,
  type ExportFormat,
  type ExportOptions,
  type SEOMetadata,
} from '@/components/Export';
import type { QualityReport } from '@/lib/export/quality-report';

interface ExportState {
  format: ExportFormat;
  options: ExportOptions;
  seoMetadata: SEOMetadata;
}

export default function ExportPage() {
  const params = useParams();
  const websiteId = params.id as string;

  const [report, setReport] = useState<QualityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Export configuration state
  const [exportState, setExportState] = useState<ExportState>({
    format: 'nextjs',
    options: {
      enableInteractivity: true,
      optimizeImages: true,
      generateSitemap: true,
    },
    seoMetadata: {
      title: '',
      description: '',
      ogImage: '',
      ogImageAlt: '',
    },
  });

  // Fetch quality report
  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/export/quality?websiteId=${websiteId}`);
        const data = await response.json();

        if (data.success && data.report) {
          setReport(data.report);
          // Initialize SEO metadata with website name
          setExportState((prev) => ({
            ...prev,
            seoMetadata: {
              ...prev.seoMetadata,
              title: data.report.websiteName || '',
            },
          }));
        } else {
          setError(data.error || 'Failed to load quality report');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [websiteId]);

  // Update format selection
  function handleFormatChange(format: ExportFormat) {
    setExportState((prev) => ({ ...prev, format }));
  }

  // Update export options
  function handleOptionsChange(options: ExportOptions) {
    setExportState((prev) => ({ ...prev, options }));
  }

  // Update SEO metadata
  function handleSEOChange(seoMetadata: SEOMetadata) {
    setExportState((prev) => ({ ...prev, seoMetadata }));
  }

  // Generate preview
  async function handlePreview() {
    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch('/api/export/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId,
          format: exportState.format,
          options: exportState.options,
          seoMetadata: exportState.seoMetadata,
        }),
      });

      const data = await response.json();

      if (data.success && data.previewUrl) {
        window.open(data.previewUrl, '_blank', 'noopener,noreferrer');
      } else {
        setError(data.error || 'Preview generation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsExporting(false);
    }
  }

  // Download export
  async function handleDownload() {
    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch('/api/export/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId,
          format: exportState.format,
          options: exportState.options,
          seoMetadata: exportState.seoMetadata,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${websiteId}-${exportState.format}-export.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading export options...</p>
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
                Export Website
              </h1>
            </div>

            {report && (
              <div className="text-sm text-gray-500">
                {report.websiteName}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-600"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="text-red-600 font-medium">Error: {error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Format Selection */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                1. Select Export Format
              </h2>
              <FormatSelector
                selectedFormat={exportState.format}
                onSelect={handleFormatChange}
                disabled={isExporting}
              />
            </section>

            {/* Export Options */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                2. Configure Options
              </h2>
              <OptionsPanel
                options={exportState.options}
                onChange={handleOptionsChange}
                disabled={isExporting}
              />
            </section>

            {/* SEO Metadata */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                3. SEO & Metadata
              </h2>
              <SEOForm
                metadata={exportState.seoMetadata}
                onChange={handleSEOChange}
                disabled={isExporting}
              />
            </section>

            {/* Action Buttons */}
            <section className="flex items-center gap-4 pt-4">
              <DownloadButton
                onDownload={handleDownload}
                loading={isExporting}
                disabled={!report || isExporting}
              />
              <PreviewButton
                onPreview={handlePreview}
                loading={isExporting}
                disabled={!report || isExporting}
              />
            </section>
          </div>

          {/* Right Column - Quality Report */}
          <div className="lg:col-span-1">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quality Report
              </h2>
              {report ? (
                <QualityReportView report={report} showDetails={false} />
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-gray-500">
                    No quality report available. Please ensure components have been generated and approved.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
