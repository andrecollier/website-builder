/**
 * Export Module Exports
 *
 * Complete export pipeline supporting multiple formats:
 * - Next.js exporter for complete Next.js 14 projects with App Router
 * - Static exporter for standalone HTML/CSS bundles (no build step required)
 * - Components exporter for React components with design tokens and Tailwind config
 * - Quality report generator for accuracy metrics and recommendations
 * - ZIP generator for packaging and download functionality
 *
 * This module provides the final stage of the Website Cooker pipeline,
 * delivering production-ready websites in user-selected formats.
 */

// ====================
// QUALITY REPORT
// ====================

export {
  generateQualityReport,
  calculateComponentStatus,
  calculateAccuracy,
  detectIssues,
  generateRecommendations,
  getQualitySummary,
  isReadyForExport,
  type QualityReport,
  type QualityLevel,
  type QualityIssue,
  type IssueCategory,
  type IssueSeverity,
  type ComponentStatusBreakdown,
  type AccuracyMetrics,
  type QualityReportOptions,
} from './quality-report';

// ====================
// NEXT.JS EXPORTER
// ====================

export {
  exportNextJS,
  getExportSummary,
  isExportReady,
  type NextJSExportPhase,
  type NextJSExportProgress,
  type SEOMetadata,
  type NextJSExportOptions,
  type NextJSExportResult,
  type ExportError,
} from './nextjs-exporter';

// ====================
// STATIC EXPORTER
// ====================

export {
  exportStatic,
  getExportSummary as getStaticExportSummary,
  isExportReady as isStaticExportReady,
  type StaticExportPhase,
  type StaticExportProgress,
  type StaticExportOptions,
  type StaticExportResult,
  type SEOMetadata as StaticSEOMetadata,
  type ExportError as StaticExportError,
} from './static-exporter';

// ====================
// COMPONENTS EXPORTER
// ====================

export {
  exportComponents,
  getExportSummary as getComponentsExportSummary,
  isExportReady as isComponentsExportReady,
  type ComponentsExportPhase,
  type ComponentsExportProgress,
  type ComponentsExportOptions,
  type ComponentsExportResult,
  type ExportError as ComponentsExportError,
} from './components-exporter';

// ====================
// ZIP GENERATOR
// ====================

export {
  generateZip,
  packageExport,
  streamZip,
  getZipSummary,
  isReadyForZip,
  type ZipPhase,
  type ZipProgress,
  type ZipOptions,
  type ZipResult,
  type StreamZipOptions,
} from './zip-generator';
