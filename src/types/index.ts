// Database Models

export type WebsiteStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Website {
  id: string;
  name: string;
  reference_url: string;
  created_at: string;
  updated_at: string;
  current_version: number;
  status: WebsiteStatus;
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
  | 'Visual Comparison'
  | 'Refinement'
  | 'Finalization';

export interface Phase {
  number: number;
  name: PhaseName;
  description: string;
}

export const PHASES: Phase[] = [
  { number: 1, name: 'Capturing Reference', description: 'Scrolling page to load all content' },
  { number: 2, name: 'Extracting Design', description: 'Analyzing typography and colors' },
  { number: 3, name: 'Analyzing Layout', description: 'Detecting sections and components' },
  { number: 4, name: 'Generating Components', description: 'Creating React components' },
  { number: 5, name: 'Building Pages', description: 'Assembling page layouts' },
  { number: 6, name: 'Visual Comparison', description: 'Comparing with reference' },
  { number: 7, name: 'Refinement', description: 'Fixing visual differences' },
  { number: 8, name: 'Finalization', description: 'Final checks and export prep' },
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
}

// API Types

export type ExtractionMode = 'single' | 'template';

export interface StartExtractionRequest {
  url: string;
  mode: ExtractionMode;
  name?: string;
  templateConfig?: TemplateConfig;
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
