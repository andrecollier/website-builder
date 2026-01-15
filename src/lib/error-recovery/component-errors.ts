/**
 * Component Error Recovery Module
 *
 * Provides comprehensive error handling for component detection and generation failures.
 * Includes error classification, retry logic, queue management, and persistence utilities.
 */

import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import type { ComponentType, FailedComponent } from '@/types';

// ====================
// ERROR TYPES
// ====================

/**
 * Component error codes for classification
 */
export type ComponentErrorCode =
  | 'DETECTION_FAILED'
  | 'DETECTION_TIMEOUT'
  | 'DETECTION_NO_ELEMENTS'
  | 'GENERATION_FAILED'
  | 'GENERATION_TIMEOUT'
  | 'GENERATION_INVALID_HTML'
  | 'VARIANT_A_FAILED'
  | 'VARIANT_B_FAILED'
  | 'VARIANT_C_FAILED'
  | 'ALL_VARIANTS_FAILED'
  | 'SCREENSHOT_FAILED'
  | 'STORAGE_FAILED'
  | 'DATABASE_FAILED'
  | 'UNKNOWN_ERROR';

/**
 * Component error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Extended component error with detailed information
 */
export interface ComponentError {
  id: string;
  code: ComponentErrorCode;
  componentType: ComponentType;
  message: string;
  details?: string;
  stack?: string;
  severity: ErrorSeverity;
  recoverable: boolean;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  websiteId?: string;
  componentId?: string;
  variantName?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Error recovery action result
 */
export interface RecoveryResult {
  success: boolean;
  error?: ComponentError;
  retried: boolean;
  skipped: boolean;
  message: string;
}

/**
 * Error queue state
 */
export interface ErrorQueueState {
  errors: ComponentError[];
  totalErrors: number;
  recoverableErrors: number;
  nonRecoverableErrors: number;
  retriedCount: number;
  skippedCount: number;
}

// ====================
// ERROR CLASSIFICATION
// ====================

/**
 * Error code to severity mapping
 */
const ERROR_SEVERITY_MAP: Record<ComponentErrorCode, ErrorSeverity> = {
  DETECTION_FAILED: 'medium',
  DETECTION_TIMEOUT: 'medium',
  DETECTION_NO_ELEMENTS: 'low',
  GENERATION_FAILED: 'high',
  GENERATION_TIMEOUT: 'medium',
  GENERATION_INVALID_HTML: 'medium',
  VARIANT_A_FAILED: 'low',
  VARIANT_B_FAILED: 'low',
  VARIANT_C_FAILED: 'low',
  ALL_VARIANTS_FAILED: 'high',
  SCREENSHOT_FAILED: 'medium',
  STORAGE_FAILED: 'high',
  DATABASE_FAILED: 'critical',
  UNKNOWN_ERROR: 'high',
};

/**
 * Error code to recoverability mapping
 */
const ERROR_RECOVERABLE_MAP: Record<ComponentErrorCode, boolean> = {
  DETECTION_FAILED: true,
  DETECTION_TIMEOUT: true,
  DETECTION_NO_ELEMENTS: false,
  GENERATION_FAILED: true,
  GENERATION_TIMEOUT: true,
  GENERATION_INVALID_HTML: true,
  VARIANT_A_FAILED: true,
  VARIANT_B_FAILED: true,
  VARIANT_C_FAILED: true,
  ALL_VARIANTS_FAILED: true,
  SCREENSHOT_FAILED: true,
  STORAGE_FAILED: true,
  DATABASE_FAILED: false,
  UNKNOWN_ERROR: false,
};

/**
 * Default max retries per error code
 */
const ERROR_MAX_RETRIES_MAP: Record<ComponentErrorCode, number> = {
  DETECTION_FAILED: 3,
  DETECTION_TIMEOUT: 2,
  DETECTION_NO_ELEMENTS: 0,
  GENERATION_FAILED: 3,
  GENERATION_TIMEOUT: 2,
  GENERATION_INVALID_HTML: 2,
  VARIANT_A_FAILED: 2,
  VARIANT_B_FAILED: 2,
  VARIANT_C_FAILED: 2,
  ALL_VARIANTS_FAILED: 2,
  SCREENSHOT_FAILED: 3,
  STORAGE_FAILED: 2,
  DATABASE_FAILED: 0,
  UNKNOWN_ERROR: 1,
};

/**
 * Get severity level for an error code
 */
export function getErrorSeverity(code: ComponentErrorCode): ErrorSeverity {
  return ERROR_SEVERITY_MAP[code] ?? 'high';
}

/**
 * Check if an error code is recoverable
 */
export function isErrorRecoverable(code: ComponentErrorCode): boolean {
  return ERROR_RECOVERABLE_MAP[code] ?? false;
}

/**
 * Get max retries for an error code
 */
export function getMaxRetries(code: ComponentErrorCode): number {
  return ERROR_MAX_RETRIES_MAP[code] ?? 1;
}

/**
 * Classify an error from an exception or message
 */
export function classifyError(
  error: Error | string,
  componentType: ComponentType
): ComponentErrorCode {
  const message = typeof error === 'string' ? error : error.message;
  const lowerMessage = message.toLowerCase();

  // Detection errors
  if (lowerMessage.includes('detection') || lowerMessage.includes('detect')) {
    if (lowerMessage.includes('timeout')) {
      return 'DETECTION_TIMEOUT';
    }
    if (lowerMessage.includes('no elements') || lowerMessage.includes('not found')) {
      return 'DETECTION_NO_ELEMENTS';
    }
    return 'DETECTION_FAILED';
  }

  // Generation errors
  if (lowerMessage.includes('generation') || lowerMessage.includes('generate')) {
    if (lowerMessage.includes('timeout')) {
      return 'GENERATION_TIMEOUT';
    }
    if (lowerMessage.includes('invalid html') || lowerMessage.includes('parse')) {
      return 'GENERATION_INVALID_HTML';
    }
    return 'GENERATION_FAILED';
  }

  // Variant-specific errors
  if (lowerMessage.includes('variant a') || lowerMessage.includes('pixel-perfect')) {
    return 'VARIANT_A_FAILED';
  }
  if (lowerMessage.includes('variant b') || lowerMessage.includes('semantic')) {
    return 'VARIANT_B_FAILED';
  }
  if (lowerMessage.includes('variant c') || lowerMessage.includes('modernized')) {
    return 'VARIANT_C_FAILED';
  }
  if (lowerMessage.includes('all variants')) {
    return 'ALL_VARIANTS_FAILED';
  }

  // Screenshot errors
  if (lowerMessage.includes('screenshot') || lowerMessage.includes('capture')) {
    return 'SCREENSHOT_FAILED';
  }

  // Storage errors
  if (
    lowerMessage.includes('storage') ||
    lowerMessage.includes('file') ||
    lowerMessage.includes('write') ||
    lowerMessage.includes('save')
  ) {
    return 'STORAGE_FAILED';
  }

  // Database errors
  if (
    lowerMessage.includes('database') ||
    lowerMessage.includes('sqlite') ||
    lowerMessage.includes('query')
  ) {
    return 'DATABASE_FAILED';
  }

  return 'UNKNOWN_ERROR';
}

// ====================
// ERROR CREATION
// ====================

/**
 * Create a component error from an exception
 */
export function createComponentError(
  error: Error | string,
  componentType: ComponentType,
  options: {
    websiteId?: string;
    componentId?: string;
    variantName?: string;
    code?: ComponentErrorCode;
    retryCount?: number;
    metadata?: Record<string, unknown>;
  } = {}
): ComponentError {
  const message = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'string' ? undefined : error.stack;
  const code = options.code ?? classifyError(error, componentType);

  return {
    id: randomUUID(),
    code,
    componentType,
    message,
    details: stack ? stack.split('\n').slice(1, 5).join('\n') : undefined,
    stack,
    severity: getErrorSeverity(code),
    recoverable: isErrorRecoverable(code),
    timestamp: new Date().toISOString(),
    retryCount: options.retryCount ?? 0,
    maxRetries: getMaxRetries(code),
    websiteId: options.websiteId,
    componentId: options.componentId,
    variantName: options.variantName,
    metadata: options.metadata,
  };
}

/**
 * Create a detection error
 */
export function createDetectionError(
  componentType: ComponentType,
  message: string,
  options: {
    websiteId?: string;
    timeout?: boolean;
    noElements?: boolean;
  } = {}
): ComponentError {
  let code: ComponentErrorCode = 'DETECTION_FAILED';
  if (options.timeout) {
    code = 'DETECTION_TIMEOUT';
  } else if (options.noElements) {
    code = 'DETECTION_NO_ELEMENTS';
  }

  return createComponentError(message, componentType, {
    websiteId: options.websiteId,
    code,
    metadata: { timeout: options.timeout, noElements: options.noElements },
  });
}

/**
 * Create a generation error
 */
export function createGenerationError(
  componentType: ComponentType,
  message: string,
  options: {
    websiteId?: string;
    componentId?: string;
    timeout?: boolean;
    invalidHtml?: boolean;
  } = {}
): ComponentError {
  let code: ComponentErrorCode = 'GENERATION_FAILED';
  if (options.timeout) {
    code = 'GENERATION_TIMEOUT';
  } else if (options.invalidHtml) {
    code = 'GENERATION_INVALID_HTML';
  }

  return createComponentError(message, componentType, {
    websiteId: options.websiteId,
    componentId: options.componentId,
    code,
    metadata: { timeout: options.timeout, invalidHtml: options.invalidHtml },
  });
}

/**
 * Create a variant error
 */
export function createVariantError(
  componentType: ComponentType,
  variantName: 'Variant A' | 'Variant B' | 'Variant C',
  message: string,
  options: {
    websiteId?: string;
    componentId?: string;
  } = {}
): ComponentError {
  const codeMap: Record<string, ComponentErrorCode> = {
    'Variant A': 'VARIANT_A_FAILED',
    'Variant B': 'VARIANT_B_FAILED',
    'Variant C': 'VARIANT_C_FAILED',
  };

  return createComponentError(message, componentType, {
    websiteId: options.websiteId,
    componentId: options.componentId,
    variantName,
    code: codeMap[variantName],
  });
}

// ====================
// ERROR QUEUE MANAGEMENT
// ====================

/**
 * In-memory error queue
 */
let errorQueue: ComponentError[] = [];

/**
 * Add an error to the queue
 */
export function addErrorToQueue(error: ComponentError): void {
  errorQueue.push(error);
}

/**
 * Remove an error from the queue by ID
 */
export function removeErrorFromQueue(errorId: string): boolean {
  const index = errorQueue.findIndex((e) => e.id === errorId);
  if (index !== -1) {
    errorQueue.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Get all errors in the queue
 */
export function getErrorQueue(): ComponentError[] {
  return [...errorQueue];
}

/**
 * Get recoverable errors from the queue
 */
export function getRecoverableErrors(): ComponentError[] {
  return errorQueue.filter((e) => e.recoverable && e.retryCount < e.maxRetries);
}

/**
 * Get non-recoverable errors from the queue
 */
export function getNonRecoverableErrors(): ComponentError[] {
  return errorQueue.filter((e) => !e.recoverable || e.retryCount >= e.maxRetries);
}

/**
 * Get errors by website ID
 */
export function getErrorsByWebsite(websiteId: string): ComponentError[] {
  return errorQueue.filter((e) => e.websiteId === websiteId);
}

/**
 * Get errors by component type
 */
export function getErrorsByComponentType(componentType: ComponentType): ComponentError[] {
  return errorQueue.filter((e) => e.componentType === componentType);
}

/**
 * Get error queue state
 */
export function getErrorQueueState(): ErrorQueueState {
  const recoverable = errorQueue.filter((e) => e.recoverable && e.retryCount < e.maxRetries);
  const nonRecoverable = errorQueue.filter((e) => !e.recoverable || e.retryCount >= e.maxRetries);
  const retried = errorQueue.filter((e) => e.retryCount > 0);
  const skipped = []; // Would need external tracking

  return {
    errors: [...errorQueue],
    totalErrors: errorQueue.length,
    recoverableErrors: recoverable.length,
    nonRecoverableErrors: nonRecoverable.length,
    retriedCount: retried.length,
    skippedCount: skipped.length,
  };
}

/**
 * Clear the error queue
 */
export function clearErrorQueue(): void {
  errorQueue = [];
}

/**
 * Clear errors for a specific website
 */
export function clearErrorsForWebsite(websiteId: string): number {
  const before = errorQueue.length;
  errorQueue = errorQueue.filter((e) => e.websiteId !== websiteId);
  return before - errorQueue.length;
}

// ====================
// RETRY LOGIC
// ====================

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(
  retryCount: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): number {
  const delay = baseDelay * Math.pow(2, retryCount);
  const jitter = Math.random() * 0.3 * delay; // Add up to 30% jitter
  return Math.min(delay + jitter, maxDelay);
}

/**
 * Check if an error can be retried
 */
export function canRetry(error: ComponentError): boolean {
  return error.recoverable && error.retryCount < error.maxRetries;
}

/**
 * Increment retry count for an error
 */
export function incrementRetryCount(error: ComponentError): ComponentError {
  return {
    ...error,
    retryCount: error.retryCount + 1,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a retry handler with exponential backoff
 */
export function createRetryHandler<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): () => Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 30000, onRetry } = options;

  return async () => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          onRetry?.(attempt + 1, lastError);
          const delay = calculateBackoffDelay(attempt, baseDelay, maxDelay);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError ?? new Error('Retry failed');
  };
}

// ====================
// FAILED COMPONENT CONVERSION
// ====================

/**
 * Convert ComponentError to FailedComponent format
 */
export function toFailedComponent(error: ComponentError): FailedComponent {
  return {
    id: error.id,
    websiteId: error.websiteId ?? '',
    componentType: error.componentType,
    error: error.message,
    attemptedAt: error.timestamp,
    retryCount: error.retryCount,
  };
}

/**
 * Convert FailedComponent to ComponentError format
 */
export function fromFailedComponent(
  failed: FailedComponent,
  options: {
    code?: ComponentErrorCode;
    severity?: ErrorSeverity;
  } = {}
): ComponentError {
  const code = options.code ?? classifyError(failed.error, failed.componentType);

  return {
    id: failed.id,
    code,
    componentType: failed.componentType,
    message: failed.error,
    severity: options.severity ?? getErrorSeverity(code),
    recoverable: isErrorRecoverable(code),
    timestamp: failed.attemptedAt,
    retryCount: failed.retryCount,
    maxRetries: getMaxRetries(code),
    websiteId: failed.websiteId,
  };
}

// ====================
// ERROR PERSISTENCE
// ====================

/**
 * Get the failed components directory path
 */
export function getFailedComponentsDir(websiteId: string): string {
  return path.join(process.cwd(), 'Websites', websiteId, 'failed-components');
}

/**
 * Ensure failed components directory exists
 */
export function ensureFailedComponentsDir(websiteId: string): string {
  const dir = getFailedComponentsDir(websiteId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Save a failed component error to disk
 */
export function saveFailedComponent(error: ComponentError): string {
  if (!error.websiteId) {
    throw new Error('Cannot save failed component without websiteId');
  }

  const dir = ensureFailedComponentsDir(error.websiteId);
  const fileName = `${error.componentType}.error.json`;
  const filePath = path.join(dir, fileName);

  // Load existing errors for this component type
  let existingErrors: ComponentError[] = [];
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      existingErrors = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // Start fresh if parsing fails
    }
  }

  // Add new error
  existingErrors.push(error);

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(existingErrors, null, 2));

  return filePath;
}

/**
 * Load failed component errors from disk
 */
export function loadFailedComponents(websiteId: string): ComponentError[] {
  const dir = getFailedComponentsDir(websiteId);
  if (!fs.existsSync(dir)) {
    return [];
  }

  const errors: ComponentError[] = [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.error.json'));

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        errors.push(...parsed);
      } else {
        errors.push(parsed);
      }
    } catch {
      // Skip files that can't be parsed
    }
  }

  return errors;
}

/**
 * Clear failed component errors for a component type
 */
export function clearFailedComponent(websiteId: string, componentType: ComponentType): boolean {
  const dir = getFailedComponentsDir(websiteId);
  const filePath = path.join(dir, `${componentType}.error.json`);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

/**
 * Clear all failed component errors for a website
 */
export function clearAllFailedComponents(websiteId: string): number {
  const dir = getFailedComponentsDir(websiteId);
  if (!fs.existsSync(dir)) {
    return 0;
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.error.json'));
  for (const file of files) {
    fs.unlinkSync(path.join(dir, file));
  }

  return files.length;
}

// ====================
// ERROR SUMMARY
// ====================

/**
 * Error summary for display
 */
export interface ErrorSummary {
  total: number;
  byCode: Record<ComponentErrorCode, number>;
  bySeverity: Record<ErrorSeverity, number>;
  byComponentType: Record<ComponentType, number>;
  recoverable: number;
  nonRecoverable: number;
  retryable: number;
}

/**
 * Generate error summary from queue
 */
export function generateErrorSummary(errors: ComponentError[] = errorQueue): ErrorSummary {
  const byCode = {} as Record<ComponentErrorCode, number>;
  const bySeverity = {} as Record<ErrorSeverity, number>;
  const byComponentType = {} as Record<ComponentType, number>;

  let recoverable = 0;
  let nonRecoverable = 0;
  let retryable = 0;

  for (const error of errors) {
    // Count by code
    byCode[error.code] = (byCode[error.code] ?? 0) + 1;

    // Count by severity
    bySeverity[error.severity] = (bySeverity[error.severity] ?? 0) + 1;

    // Count by component type
    byComponentType[error.componentType] = (byComponentType[error.componentType] ?? 0) + 1;

    // Count recoverable/non-recoverable
    if (error.recoverable) {
      recoverable++;
      if (error.retryCount < error.maxRetries) {
        retryable++;
      }
    } else {
      nonRecoverable++;
    }
  }

  return {
    total: errors.length,
    byCode,
    bySeverity,
    byComponentType,
    recoverable,
    nonRecoverable,
    retryable,
  };
}

/**
 * Format error for display
 */
export function formatErrorMessage(error: ComponentError): string {
  const prefix = error.recoverable ? '[RECOVERABLE]' : '[FATAL]';
  const severity = error.severity.toUpperCase();
  const type = error.componentType;
  const retry = error.retryCount > 0 ? ` (attempt ${error.retryCount}/${error.maxRetries})` : '';

  return `${prefix} [${severity}] ${type}: ${error.message}${retry}`;
}

/**
 * Get human-readable error code description
 */
export function getErrorCodeDescription(code: ComponentErrorCode): string {
  const descriptions: Record<ComponentErrorCode, string> = {
    DETECTION_FAILED: 'Failed to detect component on the page',
    DETECTION_TIMEOUT: 'Component detection timed out',
    DETECTION_NO_ELEMENTS: 'No matching elements found for component',
    GENERATION_FAILED: 'Failed to generate component code',
    GENERATION_TIMEOUT: 'Component generation timed out',
    GENERATION_INVALID_HTML: 'Source HTML was invalid or unparseable',
    VARIANT_A_FAILED: 'Failed to generate pixel-perfect variant',
    VARIANT_B_FAILED: 'Failed to generate semantic variant',
    VARIANT_C_FAILED: 'Failed to generate modernized variant',
    ALL_VARIANTS_FAILED: 'All variant generations failed',
    SCREENSHOT_FAILED: 'Failed to capture component screenshot',
    STORAGE_FAILED: 'Failed to save component to storage',
    DATABASE_FAILED: 'Database operation failed',
    UNKNOWN_ERROR: 'An unknown error occurred',
  };

  return descriptions[code] ?? 'Unknown error';
}
