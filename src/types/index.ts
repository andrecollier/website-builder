// Database Models

import type { RawPageData } from '@/lib/design-system/synthesizer';
export type { RawPageData };

export type WebsiteStatus = 'pending' | 'in_progress' | 'awaiting_approval' | 'completed' | 'failed';

export type WebsitePlatform =
  | 'framer'
  | 'webflow'
  | 'wordpress'
  | 'wix'
  | 'squarespace'
  | 'shopify'
  | 'nextjs'
  | 'custom'
  | 'unknown';

// Version Types

export interface Version {
  id: string;
  website_id: string;
  version_number: string;
  created_at: string;
  tokens_json: string | null;
  accuracy_score: number | null;
  changelog: string | null;
  is_active: boolean;
  parent_version_id: string | null;
}

export interface VersionInsert {
  id?: string;
  website_id: string;
  version_number: string;
  tokens_json?: string | null;
  accuracy_score?: number | null;
  changelog?: string | null;
  is_active?: boolean;
  parent_version_id?: string | null;
}

export interface VersionFile {
  id: string;
  version_id: string;
  file_path: string;
  file_hash: string;
  file_size: number;
  created_at: string;
}

export interface VersionFileInsert {
  id?: string;
  version_id: string;
  file_path: string;
  file_hash: string;
  file_size: number;
}

export type ChangelogEntryType = 'color' | 'typography' | 'spacing' | 'effects' | 'component' | 'layout' | 'other';

export interface ChangelogEntry {
  type: ChangelogEntryType;
  description: string;
  timestamp: string;
}

export interface Change {
  category: string;
  property: string;
  oldValue: string | null;
  newValue: string | null;
  description?: string;
}

export interface Website {
  id: string;
  name: string;
  reference_url: string;
  created_at: string;
  updated_at: string;
  current_version: number;
  status: WebsiteStatus;
  platform?: WebsitePlatform;
}

export interface WebsiteInsert {
  id?: string;
  name: string;
  reference_url: string;
  status?: WebsiteStatus;
}

// Extraction Phases

export type PhaseName =
  | 'Capturing Reference'
  | 'Extracting Design'
  | 'Analyzing Layout'
  | 'Generating Components'
  | 'Building Pages'
  | 'Building Project'
  | 'Visual Comparison'
  | 'Refinement'
  | 'Finalization';

export interface Phase {
  number: number;
  name: PhaseName;
  description: string;
}

export const PHASES: Phase[] = [
  { number: 1, name: 'Capturing Reference', description: 'Taking screenshots and detecting sections' },
  { number: 2, name: 'Extracting Design', description: 'Analyzing colors, typography, and spacing' },
  { number: 3, name: 'Generating Components', description: 'Creating React components from HTML' },
  { number: 4, name: 'Building Project', description: 'Scaffolding Next.js application' },
  { number: 5, name: 'Visual Comparison', description: 'Comparing screenshots with reference' },
];

// Error Types

export interface ExtractionError {
  id: string;
  phase: number;
  message: string;
  details?: string;
  timestamp: string;
  recoverable: boolean;
}

// Zustand Store State

export interface ExtractionState {
  // State
  currentPhase: number;
  totalPhases: number;
  subStatus: string;
  progress: number;
  isRunning: boolean;
  errors: ExtractionError[];
  currentWebsiteId: string | null;

  // Actions
  setPhase: (phase: number, subStatus: string) => void;
  setProgress: (progress: number) => void;
  startExtraction: (url: string) => void;
  setError: (error: ExtractionError) => void;
  clearError: (errorId: string) => void;
  reset: () => void;
  setWebsiteId: (id: string | null) => void;
  completeExtraction: () => void;
  updateFromStatus: (status: {
    phase: number;
    subStatus: string;
    progress: number;
    isRunning: boolean;
    errors?: ExtractionError[];
  }) => void;
}

// API Types

export type ExtractionMode = 'single' | 'template';

export interface StartExtractionRequest {
  url: string;
  mode: ExtractionMode;
  name?: string;
  templateConfig?: TemplateConfig;
  requireApproval?: boolean;
}

export interface StartExtractionResponse {
  success: boolean;
  websiteId: string;
  status: string;
  error?: string;
}

export interface StatusResponse {
  websiteId: string | null;
  phase: number;
  totalPhases: number;
  phaseName: string;
  subStatus: string;
  progress: number;
  errors: ExtractionError[];
}

// Template Mode Types

export type SectionType =
  | 'header'
  | 'hero'
  | 'features'
  | 'testimonials'
  | 'pricing'
  | 'cta'
  | 'footer';

export interface ReferenceUrl {
  id: string;
  url: string;
  name?: string;
  isValid: boolean;
}

export interface SectionAssignment {
  sectionType: SectionType;
  sourceId: string | null;
  order: number;
}

export interface TemplateConfig {
  urls: ReferenceUrl[];
  sections: SectionAssignment[];
}

// Template Project
export interface TemplateProject {
  id: string;
  name: string;
  references: Reference[];
  sectionMapping: SectionMapping;
  primaryTokenSource: string | null;
  status: 'configuring' | 'processing' | 'complete';
  harmonyScore: number | null;
  createdAt: string;
}

// Processed Reference
export interface Reference {
  id: string;
  url: string;
  name: string;
  tokens: DesignSystem;
  sections: SectionInfo[];
  status: 'pending' | 'processing' | 'ready' | 'error';
}

// Section Mapping
export interface SectionMapping {
  [sectionType: string]: string; // Maps SectionType to Reference ID
}

// Merge Strategy
export interface MergeStrategy {
  base: string; // Primary reference ID
  overrides: TokenOverride[];
}

export interface TokenOverride {
  referenceId: string;
  path: string; // e.g., "colors.primary"
  value: unknown;
}

// Harmony Results
export interface HarmonyResult {
  score: number; // 0-100
  issues: HarmonyIssue[];
  suggestions: string[];
}

export interface HarmonyIssue {
  type: 'color_clash' | 'typography_mismatch' | 'spacing_inconsistent';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedSections: SectionType[];
}

// Component Props Types

export interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export interface StatusBarProps {
  phase: number;
  totalPhases: number;
  phaseName: string;
  subStatus: string;
  progress: number;
}

export interface PhaseIndicatorProps {
  phase: Phase;
  currentPhase: number;
  progress: number;
}

export interface ProjectListProps {
  projects: Website[];
  onSelect: (project: Website) => void;
  onDelete: (projectId: string) => void;
  isLoading?: boolean;
}

export interface ErrorRecoveryPanelProps {
  errors: ExtractionError[];
  onRetry: (errorId: string) => void;
  onSkip: (errorId: string) => void;
  onRetryAll: () => void;
  onSkipAll: () => void;
  onDismiss: () => void;
}

export interface ReferenceListProps {
  references: ReferenceUrl[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, url: string) => void;
}

export interface SectionPickerProps {
  sections: SectionAssignment[];
  references: ReferenceUrl[];
  onAssign: (sectionType: SectionType, sourceId: string | null) => void;
}

export interface MixerCanvasProps {
  sections: SectionAssignment[];
  references: ReferenceUrl[];
  onReorder: (sections: SectionAssignment[]) => void;
}

export interface TokenSourceSelectorProps {
  references: ReferenceUrl[];
  primaryTokenSource: string | null;
  onSelect: (sourceId: string | null) => void;
}

export interface HarmonyIndicatorProps {
  harmonyResult: HarmonyResult | null;
  isCalculating?: boolean;
}

// Screenshot Capture Types

export type CapturePhase =
  | 'initializing'
  | 'scrolling'
  | 'waiting_images'
  | 'waiting_fonts'
  | 'capturing'
  | 'sections'
  | 'extracting'
  | 'generating'
  | 'awaiting_approval'
  | 'scaffolding'
  | 'validating'
  | 'comparing'
  | 'improving'
  | 'complete'
  | 'failed';

export interface CaptureProgress {
  phase: CapturePhase;
  percent: number;
  message: string;
  currentSection?: number;
  totalSections?: number;
}

export interface SectionInfo {
  id: string;
  type: SectionType;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  screenshotPath: string;
}

export interface CaptureResult {
  success: boolean;
  websiteId: string;
  fullPagePath: string;
  sections: SectionInfo[];
  metadata: {
    url: string;
    capturedAt: string;
    viewportWidth: number;
    viewportHeight: number;
    fullPageHeight: number;
  };
  error?: string;
  /** Raw page data extracted for design system generation */
  rawData?: RawPageData;
}

export interface CacheEntry {
  domain: string;
  capturedAt: string;
  expiresAt: string;
  fullPagePath: string;
  sections: SectionInfo[];
}

export interface CacheConfig {
  ttlHours: number;
  cacheDir: string;
}

// Playwright Capture Configuration

export const CAPTURE_CONFIG = {
  viewport: { width: 1440, height: 900 },
  scrollDistance: 300,
  scrollDelay: 500,
  animationWait: 3000, // Increased from 2s for Framer entrance animations
  maxRetries: 3,
  pageTimeout: 45000, // Increased from 30s for animation-heavy sites
  maxSections: 10,
} as const;

export const CACHE_CONFIG = {
  ttlHours: 12,
  baseDir: 'cache',
} as const;

// Design System Types

export interface ColorExtraction {
  primary: string[];      // Most used accent colors
  secondary: string[];    // Secondary colors
  neutral: string[];      // Grays, whites, blacks
  semantic: {
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  palettes: {
    [colorName: string]: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
  };
}

export interface TypographyExtraction {
  fonts: {
    heading: string;
    body: string;
    mono?: string;
  };
  scale: {
    display: string;
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    h6: string;
    body: string;
    small: string;
    xs: string;
  };
  weights: number[];
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface SpacingExtraction {
  baseUnit: number;       // 4 or 8
  scale: number[];        // [4, 8, 12, 16, 24, 32, 48, 64, 96]
  containerMaxWidth: string;
  sectionPadding: {
    mobile: string;
    desktop: string;
  };
}

export interface EffectsExtraction {
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

export interface DesignSystem {
  meta: {
    sourceUrl: string;
    extractedAt: string;
    version: number;
  };
  colors: ColorExtraction;
  typography: TypographyExtraction;
  spacing: SpacingExtraction;
  effects: EffectsExtraction;
}

// Editor State Types

export type EditorPanel = 'colors' | 'typography' | 'spacing' | 'effects';

export interface EditorState {
  // State
  originalTokens: DesignSystem | null;
  modifiedTokens: DesignSystem | null;
  activePanel: EditorPanel;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTokens: (tokens: DesignSystem) => void;
  updateColors: (colors: Partial<ColorExtraction>) => void;
  updateTypography: (typography: Partial<TypographyExtraction>) => void;
  updateSpacing: (spacing: Partial<SpacingExtraction>) => void;
  updateEffects: (effects: Partial<EffectsExtraction>) => void;
  setActivePanel: (panel: EditorPanel) => void;
  resetToOriginal: () => void;
  saveTokens: () => Promise<void>;
  reset: () => void;
}

// Token Cache Configuration

export const TOKEN_CACHE_CONFIG = {
  ttlHours: 24,
  baseDir: 'cache/tokens',
} as const;

// Extended Component Types (Phase 4)

export type ComponentType =
  | 'header'
  | 'hero'
  | 'features'
  | 'testimonials'
  | 'pricing'
  | 'cta'
  | 'footer'
  | 'cards'
  | 'gallery'
  | 'contact'
  | 'faq'
  | 'stats'
  | 'team'
  | 'logos';

// Detected Component from page analysis

export interface DetectedComponent {
  id: string;
  type: ComponentType;
  order: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  screenshotPath: string;
  htmlSnapshot: string;
  styles: Record<string, string>;
}

// Generated Component Variant

export interface ComponentVariant {
  id: string;
  name: 'Variant A' | 'Variant B' | 'Variant C';
  description: string;
  code: string;
  previewImage?: string;
  accuracyScore?: number;
}

// Full Generated Component

export interface GeneratedComponent {
  id: string;
  websiteId: string;
  name: string;
  type: ComponentType;
  order: number;
  variants: ComponentVariant[];
  selectedVariant: string | null;
  customCode?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped' | 'failed';
  errorMessage?: string;
  createdAt: string;
}

// Preview/Approval State

export interface PreviewState {
  websiteId: string | null;
  components: GeneratedComponent[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadComponents: (websiteId: string) => Promise<void>;
  selectVariant: (componentId: string, variantId: string) => void;
  updateCustomCode: (componentId: string, code: string) => void;
  approveComponent: (componentId: string) => Promise<void>;
  rejectComponent: (componentId: string) => void;
  skipComponent: (componentId: string) => void;
  retryComponent: (componentId: string) => Promise<void>;
  goToNext: () => void;
  goToPrevious: () => void;
  reset: () => void;
}

// Failed Component for Manual Review

export interface FailedComponent {
  id: string;
  websiteId: string;
  componentType: ComponentType;
  error: string;
  attemptedAt: string;
  retryCount: number;
}
