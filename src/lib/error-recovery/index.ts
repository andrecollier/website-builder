/**
 * Error Recovery Module Exports
 *
 * Comprehensive error handling for component detection and generation failures.
 * Includes:
 * - Error classification with severity levels and recoverability
 * - Error creation helpers for detection, generation, and variant errors
 * - Error queue management for tracking and processing errors
 * - Retry logic with exponential backoff and jitter
 * - Failed component persistence to disk
 * - Error summary and reporting utilities
 */

// ====================
// ERROR TYPES
// ====================

export {
  type ComponentErrorCode,
  type ErrorSeverity,
  type ComponentError,
  type RecoveryResult,
  type ErrorQueueState,
  type ErrorSummary,
} from './component-errors';

// ====================
// ERROR CLASSIFICATION
// ====================

export {
  getErrorSeverity,
  isErrorRecoverable,
  getMaxRetries,
  classifyError,
} from './component-errors';

// ====================
// ERROR CREATION
// ====================

export {
  createComponentError,
  createDetectionError,
  createGenerationError,
  createVariantError,
} from './component-errors';

// ====================
// ERROR QUEUE MANAGEMENT
// ====================

export {
  addErrorToQueue,
  removeErrorFromQueue,
  getErrorQueue,
  getRecoverableErrors,
  getNonRecoverableErrors,
  getErrorsByWebsite,
  getErrorsByComponentType,
  getErrorQueueState,
  clearErrorQueue,
  clearErrorsForWebsite,
} from './component-errors';

// ====================
// RETRY LOGIC
// ====================

export {
  calculateBackoffDelay,
  canRetry,
  incrementRetryCount,
  createRetryHandler,
} from './component-errors';

// ====================
// FAILED COMPONENT CONVERSION
// ====================

export {
  toFailedComponent,
  fromFailedComponent,
} from './component-errors';

// ====================
// ERROR PERSISTENCE
// ====================

export {
  getFailedComponentsDir,
  ensureFailedComponentsDir,
  saveFailedComponent,
  loadFailedComponents,
  clearFailedComponent,
  clearAllFailedComponents,
} from './component-errors';

// ====================
// ERROR SUMMARY & REPORTING
// ====================

export {
  generateErrorSummary,
  formatErrorMessage,
  getErrorCodeDescription,
} from './component-errors';
