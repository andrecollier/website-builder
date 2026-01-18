/**
 * Comparison Module
 *
 * Exports all comparison-related functions for visual diff,
 * screenshot capture, and comparison reports.
 */

export {
  compareImages,
  compareAllSections,
  type ComparisonResult,
  type ComparisonReport,
} from './visual-diff';

export {
  captureGeneratedScreenshots,
  runComparison,
  getExistingReport,
} from './compare-section';

export {
  checkGeneratedSiteStatus,
  startGeneratedSite,
  stopGeneratedSite,
} from './server-manager';

export {
  captureAndCompareComponent,
  validateAllComponents,
  getExistingValidationReport,
  type ComponentValidationResult,
  type ComponentValidationReport,
} from './component-validation';
