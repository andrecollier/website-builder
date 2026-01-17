/**
 * Agent System Type Definitions
 *
 * Type definitions for the Claude Agent SDK based multi-agent architecture.
 * Defines types for agent context, results, tool interfaces, and agent-specific parameters.
 */

import type {
  CaptureProgress,
  CaptureResult,
  DesignSystem,
  GeneratedComponent,
  ExtractionError,
} from '@/types';
import type { SharedContextState } from './shared/context';

/**
 * Agent type identifiers
 * Each agent has a specific role in the extraction pipeline
 */
export type AgentType =
  | 'orchestrator' // Coordinates the entire pipeline
  | 'capture' // Handles Playwright operations
  | 'extractor' // Extracts design tokens
  | 'generator' // Generates React components
  | 'scaffold' // Creates runnable Next.js project
  | 'comparator'; // Compares visual outputs

/**
 * Agent Context Interface
 *
 * Provides type-safe access to shared context for agents.
 * This is the primary interface agents use to read/write shared state.
 */
export interface AgentContext {
  /** Current website ID being processed */
  websiteId: string;

  /** Reference URL being extracted */
  url: string;

  /** Get the current shared context state (read-only snapshot) */
  getState(): SharedContextState;

  /** Update the shared context with partial state changes */
  updateState(updates: Partial<Omit<SharedContextState, 'websiteId' | 'url' | 'startedAt'>>): void;

  /** Update progress information */
  updateProgress(progress: CaptureProgress): void;

  /** Add an error to the error log */
  addError(error: ExtractionError): void;

  /** Mark the context as complete */
  complete(): void;

  /** Mark the context as failed with an error */
  fail(error: ExtractionError): void;
}

/**
 * Standard result type for agent operations
 *
 * All agent operations should return this type to enable consistent error handling.
 */
export interface AgentResult<T = unknown> {
  /** Whether the operation succeeded */
  success: boolean;

  /** Result data (present if success = true) */
  data?: T;

  /** Error information (present if success = false) */
  error?: {
    message: string;
    details?: string;
    recoverable: boolean;
  };

  /** Agent that produced this result */
  agentType: AgentType;

  /** Human-readable message about the result */
  message: string;
}

/**
 * Re-export AgentMessage from messages.ts for convenience
 * This is the message protocol for agent communication via the event bus
 */
export type { AgentMessage } from './shared/messages';

// ============================================================================
// Tool Input/Output Types
// ============================================================================

/**
 * Capture Agent Tool Types
 */
export interface NavigateToolInput {
  url: string;
  waitForSelector?: string;
  timeout?: number;
}

export interface NavigateToolOutput {
  success: boolean;
  finalUrl: string;
  title: string;
}

export interface ScrollToolInput {
  /** Amount to scroll in pixels (default: viewport height) */
  amount?: number;
  /** Whether to wait for lazy-loaded content */
  waitForContent?: boolean;
}

export interface ScrollToolOutput {
  success: boolean;
  scrolledAmount: number;
  reachedBottom: boolean;
}

export interface ScreenshotToolInput {
  /** Section identifier (optional, for section screenshots) */
  sectionId?: string;
  /** Whether to capture full page */
  fullPage?: boolean;
  /** Output file path */
  outputPath: string;
}

export interface ScreenshotToolOutput {
  success: boolean;
  filePath: string;
  width: number;
  height: number;
}

export interface DetectSectionsToolInput {
  /** Minimum section height in pixels */
  minHeight?: number;
}

export interface DetectSectionsToolOutput {
  success: boolean;
  sections: Array<{
    id: string;
    type: string;
    bounds: { x: number; y: number; width: number; height: number };
  }>;
}

/**
 * Capture Agent Result
 */
export interface CaptureAgentResult extends AgentResult<CaptureResult> {
  agentType: 'capture';
}

/**
 * Extractor Agent Tool Types
 */
export interface ExtractColorsToolInput {
  /** Path to screenshot to analyze */
  screenshotPath: string;
}

export interface ExtractColorsToolOutput {
  success: boolean;
  colors: Array<{
    hex: string;
    rgb: { r: number; g: number; b: number };
    frequency: number;
    role?: 'primary' | 'secondary' | 'accent' | 'background' | 'text';
  }>;
}

export interface ExtractTypographyToolInput {
  /** HTML content to analyze */
  htmlContent: string;
}

export interface ExtractTypographyToolOutput {
  success: boolean;
  fontFamilies: string[];
  fontSizes: number[];
  fontWeights: number[];
  lineHeights: number[];
}

export interface ExtractSpacingToolInput {
  /** Screenshot path for spacing analysis */
  screenshotPath: string;
}

export interface ExtractSpacingToolOutput {
  success: boolean;
  spacing: number[];
  scale: 'linear' | 'fibonacci' | 'custom';
}

export interface ExtractEffectsToolInput {
  /** CSS styles to analyze */
  cssContent: string;
}

export interface ExtractEffectsToolOutput {
  success: boolean;
  shadows: string[];
  borderRadius: number[];
  effects: Record<string, unknown>;
}

/**
 * Extractor Agent Result
 */
export interface ExtractorAgentResult extends AgentResult<DesignSystem> {
  agentType: 'extractor';
}

/**
 * Generator Agent Tool Types
 */
export interface GenerateComponentToolInput {
  /** Section identifier */
  sectionId: string;
  /** Section screenshot path */
  screenshotPath: string;
  /** Design system to use */
  designSystem: DesignSystem;
  /** Component type (e.g., 'hero', 'features', 'cta') */
  componentType: string;
}

export interface GenerateComponentToolOutput {
  success: boolean;
  componentCode: string;
  componentPath: string;
}

export interface GenerateVariantsToolInput {
  /** Base component code */
  baseComponent: string;
  /** Design system to use */
  designSystem: DesignSystem;
  /** Number of variants to generate */
  variantCount: number;
}

export interface GenerateVariantsToolOutput {
  success: boolean;
  variants: Array<{
    code: string;
    description: string;
  }>;
}

/**
 * Generator Agent Result
 */
export interface GeneratorAgentResult extends AgentResult<GeneratedComponent[]> {
  agentType: 'generator';
}

/**
 * Comparator Agent Tool Types
 */
export interface CompareImagesToolInput {
  /** Reference image path */
  referencePath: string;
  /** Generated component screenshot path */
  generatedPath: string;
  /** Comparison threshold (0-1, default: 0.1) */
  threshold?: number;
}

export interface CompareImagesToolOutput {
  success: boolean;
  /** Match percentage (0-100) */
  accuracy: number;
  /** Number of different pixels */
  diffPixels: number;
  /** Path to diff image */
  diffImagePath?: string;
}

export interface CalculateAccuracyToolInput {
  /** Array of comparison results */
  comparisons: Array<{
    componentId: string;
    accuracy: number;
  }>;
}

export interface CalculateAccuracyToolOutput {
  success: boolean;
  /** Overall accuracy score (0-100) */
  overallAccuracy: number;
  /** Per-component breakdown */
  breakdown: Array<{
    componentId: string;
    accuracy: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
  }>;
}

/**
 * Comparator Agent Result
 */
export interface ComparatorAgentResult extends AgentResult<{ overallAccuracy: number }> {
  agentType: 'comparator';
}

/**
 * Orchestrator Agent Tool Types
 */
export interface DelegateToolInput {
  /** Agent to delegate to */
  targetAgent: Exclude<AgentType, 'orchestrator'>;
  /** Task description for the agent */
  task: string;
  /** Additional parameters for the agent */
  params?: Record<string, unknown>;
}

export interface DelegateToolOutput {
  success: boolean;
  agentType: AgentType;
  result: AgentResult;
}

export interface TrackProgressToolInput {
  /** Current phase number */
  phase: number;
  /** Progress percentage (0-100) */
  percent: number;
  /** Progress message */
  message: string;
}

export interface TrackProgressToolOutput {
  success: boolean;
  updated: boolean;
}

export interface HandleErrorToolInput {
  /** Error to handle */
  error: ExtractionError;
  /** Whether to continue pipeline after error */
  continueOnError?: boolean;
}

export interface HandleErrorToolOutput {
  success: boolean;
  shouldContinue: boolean;
  errorLogged: boolean;
}

/**
 * Orchestrator Agent Result
 */
export interface OrchestratorAgentResult extends AgentResult<{
  captureResult?: CaptureResult;
  designSystem?: DesignSystem;
  components?: GeneratedComponent[];
  overallAccuracy?: number;
}> {
  agentType: 'orchestrator';
}

/**
 * Union type of all agent results for type-safe handling
 */
export type AnyAgentResult =
  | OrchestratorAgentResult
  | CaptureAgentResult
  | ExtractorAgentResult
  | GeneratorAgentResult
  | ComparatorAgentResult;

/**
 * Helper type to extract result data type from an agent result
 */
export type AgentResultData<T extends AgentResult> = T extends AgentResult<infer U> ? U : never;

/**
 * Agent configuration options
 */
export interface AgentConfig {
  /** Agent type */
  type: AgentType;
  /** Model to use (from Claude Agent SDK) */
  model: 'sonnet' | 'opus' | 'haiku' | 'inherit';
  /** Maximum retries for failed operations */
  maxRetries?: number;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Whether to enable verbose logging */
  verbose?: boolean;
}

/**
 * Retry result with attempt tracking
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: string;
  attempts: number;
}
