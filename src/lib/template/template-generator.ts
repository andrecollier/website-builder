/**
 * Template Generator Module
 *
 * Generates final website from mixed sources (multiple reference websites).
 * Combines sections from different references with unified design tokens.
 * This is the core orchestration module for Template Mode's website generation.
 *
 * Coordinates with:
 * - reference-processor: For processing and caching reference websites
 * - token-merger: For creating unified design tokens
 * - harmony-checker: For validating visual consistency
 * - database client: For persisting template project data
 */

import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type {
  TemplateProject,
  Reference,
  SectionMapping,
  DesignSystem,
  MergeStrategy,
  HarmonyResult,
  SectionInfo,
  SectionType,
} from '@/types';
import { processReference, processReferences } from './reference-processor';
import { mergeTokens, createSimpleMergeStrategy } from './token-merger';
import { calculateHarmony as checkHarmony } from './harmony-checker';
import {
  getDb,
  createTemplateProject,
  updateTemplateProject,
  createTemplateReference,
  getTemplateProjectById,
  getTemplateReferencesByProject,
  type TemplateProjectInsert,
  type TemplateReferenceInsert,
} from '@/lib/db/client';

// ====================
// TYPE DEFINITIONS
// ====================

/**
 * Phase of the template generation process
 */
export type TemplateGenerationPhase =
  | 'initializing'
  | 'processing_references'
  | 'merging_tokens'
  | 'checking_harmony'
  | 'generating_sections'
  | 'saving_project'
  | 'complete';

/**
 * Progress update for the generation process
 */
export interface TemplateGenerationProgress {
  phase: TemplateGenerationPhase;
  percent: number;
  message: string;
  currentStep?: number;
  totalSteps?: number;
}

/**
 * Options for template generation
 */
export interface GenerateTemplateOptions {
  /** Project name for the template */
  projectName: string;
  /** List of reference URLs to process */
  referenceUrls: string[];
  /** Mapping of section types to reference indices */
  sectionMapping: SectionMapping;
  /** Index of the primary token source (defaults to 0) */
  primaryTokenSourceIndex?: number;
  /** Optional custom merge strategy */
  customMergeStrategy?: MergeStrategy;
  /** Force reprocessing of references */
  forceReprocess?: boolean;
  /** Skip harmony check */
  skipHarmonyCheck?: boolean;
  /** Minimum harmony score required (advisory only) */
  minHarmonyScore?: number;
  /** Callback for progress updates */
  onProgress?: (progress: TemplateGenerationProgress) => void;
  /** Output directory override */
  outputDir?: string;
  /** Skip database persistence */
  skipDatabase?: boolean;
}

/**
 * Result of template generation
 */
export interface TemplateGenerationResult {
  success: boolean;
  projectId: string;
  projectName: string;
  references: Reference[];
  mergedTokens: DesignSystem;
  harmonyScore: number | null;
  harmonyResult: HarmonyResult | null;
  outputPath: string;
  metadata: {
    totalReferences: number;
    totalSections: number;
    processingTimeMs: number;
    generatedAt: string;
  };
  errors: TemplateGenerationError[];
  warnings: string[];
}

/**
 * Error during template generation
 */
export interface TemplateGenerationError {
  phase: TemplateGenerationPhase;
  referenceUrl?: string;
  message: string;
  recoverable: boolean;
}

/**
 * Internal section composition result
 */
interface SectionComposition {
  sectionType: SectionType;
  referenceId: string;
  section: SectionInfo;
}

// ====================
// CONFIGURATION
// ====================

const TEMPLATE_GENERATOR_CONFIG = {
  /** Default output directory */
  defaultOutputDir: 'Websites/templates',
  /** Default harmony threshold (advisory) */
  defaultMinHarmonyScore: 60,
  /** Maximum references allowed */
  maxReferences: 10,
  /** Timeout for single reference processing (ms) */
  referenceProcessingTimeout: 60000,
} as const;

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Get the base directory for template outputs
 */
function getTemplatesBaseDir(customDir?: string): string {
  if (customDir) {
    if (customDir.startsWith('./') || customDir.startsWith('../')) {
      return path.resolve(process.cwd(), customDir);
    }
    return customDir;
  }
  return path.resolve(process.cwd(), TEMPLATE_GENERATOR_CONFIG.defaultOutputDir);
}

/**
 * Get the project directory path
 */
function getProjectDir(projectId: string, customDir?: string): string {
  return path.join(getTemplatesBaseDir(customDir), projectId);
}

/**
 * Ensure directory exists
 */
function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Create progress update helper
 */
function createProgressEmitter(
  onProgress?: (progress: TemplateGenerationProgress) => void
) {
  return (
    phase: TemplateGenerationPhase,
    percent: number,
    message: string,
    stepInfo?: { current: number; total: number }
  ) => {
    if (onProgress) {
      onProgress({
        phase,
        percent,
        message,
        currentStep: stepInfo?.current,
        totalSteps: stepInfo?.total,
      });
    }
  };
}

/**
 * Validate template generation options
 */
function validateOptions(options: GenerateTemplateOptions): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!options.projectName || options.projectName.trim().length === 0) {
    errors.push('Project name is required');
  }

  if (!options.referenceUrls || options.referenceUrls.length === 0) {
    errors.push('At least one reference URL is required');
  }

  if (options.referenceUrls.length > TEMPLATE_GENERATOR_CONFIG.maxReferences) {
    errors.push(
      `Maximum ${TEMPLATE_GENERATOR_CONFIG.maxReferences} references allowed`
    );
  }

  // Validate URLs
  options.referenceUrls.forEach((url, idx) => {
    try {
      new URL(url);
    } catch {
      errors.push(`Invalid URL at index ${idx}: ${url}`);
    }
  });

  // Validate section mapping
  if (!options.sectionMapping || Object.keys(options.sectionMapping).length === 0) {
    errors.push('Section mapping is required');
  }

  // Validate primary token source index
  if (
    options.primaryTokenSourceIndex !== undefined &&
    (options.primaryTokenSourceIndex < 0 ||
      options.primaryTokenSourceIndex >= options.referenceUrls.length)
  ) {
    errors.push('Primary token source index is out of bounds');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Save merged tokens to file system
 */
function saveMergedTokens(
  projectDir: string,
  tokens: DesignSystem
): void {
  const tokensPath = path.join(projectDir, 'design-tokens.json');
  ensureDirectory(projectDir);
  fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2), 'utf-8');
}

/**
 * Save section composition map
 */
function saveSectionComposition(
  projectDir: string,
  compositions: SectionComposition[]
): void {
  const compositionPath = path.join(projectDir, 'section-composition.json');
  ensureDirectory(projectDir);
  fs.writeFileSync(
    compositionPath,
    JSON.stringify(compositions, null, 2),
    'utf-8'
  );
}

/**
 * Save harmony report
 */
function saveHarmonyReport(
  projectDir: string,
  harmonyResult: HarmonyResult
): void {
  const reportPath = path.join(projectDir, 'harmony-report.json');
  ensureDirectory(projectDir);
  fs.writeFileSync(reportPath, JSON.stringify(harmonyResult, null, 2), 'utf-8');
}

/**
 * Save project metadata
 */
function saveProjectMetadata(
  projectDir: string,
  result: TemplateGenerationResult
): void {
  const metadataPath = path.join(projectDir, 'project-metadata.json');
  ensureDirectory(projectDir);

  const metadata = {
    projectId: result.projectId,
    projectName: result.projectName,
    references: result.references.map((ref) => ({
      id: ref.id,
      url: ref.url,
      name: ref.name,
      status: ref.status,
    })),
    harmonyScore: result.harmonyScore,
    generatedAt: result.metadata.generatedAt,
    totalReferences: result.metadata.totalReferences,
    totalSections: result.metadata.totalSections,
    processingTimeMs: result.metadata.processingTimeMs,
  };

  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
}

// ====================
// CORE GENERATION FUNCTIONS
// ====================

/**
 * Process all reference URLs into Reference objects
 */
async function processAllReferences(
  urls: string[],
  forceReprocess: boolean,
  emitProgress: (
    phase: TemplateGenerationPhase,
    percent: number,
    message: string,
    stepInfo?: { current: number; total: number }
  ) => void
): Promise<{ references: Reference[]; errors: TemplateGenerationError[] }> {
  const errors: TemplateGenerationError[] = [];
  const references: Reference[] = [];

  emitProgress(
    'processing_references',
    10,
    `Processing ${urls.length} reference website(s)...`,
    { current: 0, total: urls.length }
  );

  try {
    const results = await processReferences(urls, { forceReprocess });

    results.forEach((result, idx) => {
      if (result.reference.status === 'ready') {
        references.push(result.reference);
      } else {
        errors.push({
          phase: 'processing_references',
          referenceUrl: urls[idx],
          message: `Failed to process reference: ${result.reference.status}`,
          recoverable: false,
        });
      }

      emitProgress(
        'processing_references',
        10 + Math.floor((idx + 1) / urls.length * 30),
        `Processed ${idx + 1} of ${urls.length} references`,
        { current: idx + 1, total: urls.length }
      );
    });
  } catch (error) {
    errors.push({
      phase: 'processing_references',
      message: `Reference processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      recoverable: false,
    });
  }

  return { references, errors };
}

/**
 * Merge design tokens from references
 */
function mergeDesignTokens(
  references: Reference[],
  primaryIndex: number,
  customStrategy?: MergeStrategy,
  emitProgress?: (
    phase: TemplateGenerationPhase,
    percent: number,
    message: string
  ) => void
): { mergedTokens: DesignSystem | null; errors: TemplateGenerationError[] } {
  const errors: TemplateGenerationError[] = [];

  if (emitProgress) {
    emitProgress('merging_tokens', 40, 'Merging design tokens...');
  }

  try {
    const strategy =
      customStrategy ||
      createSimpleMergeStrategy(references[primaryIndex].id, references);

    const result = mergeTokens({
      references,
      strategy,
    });

    if (emitProgress) {
      emitProgress('merging_tokens', 50, 'Design tokens merged successfully');
    }

    return { mergedTokens: result.designSystem, errors };
  } catch (error) {
    errors.push({
      phase: 'merging_tokens',
      message: `Token merge error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      recoverable: false,
    });
    return { mergedTokens: null, errors };
  }
}

/**
 * Check visual harmony between references
 */
function performHarmonyCheck(
  references: Reference[],
  sectionMapping: SectionMapping,
  skipCheck: boolean,
  emitProgress?: (
    phase: TemplateGenerationPhase,
    percent: number,
    message: string
  ) => void
): {
  harmonyResult: HarmonyResult | null;
  harmonyScore: number | null;
  errors: TemplateGenerationError[];
} {
  const errors: TemplateGenerationError[] = [];

  if (skipCheck) {
    return { harmonyResult: null, harmonyScore: null, errors };
  }

  if (emitProgress) {
    emitProgress('checking_harmony', 55, 'Calculating visual harmony...');
  }

  try {
    const harmonyResult = checkHarmony({
      references,
      sectionMapping,
    });

    if (emitProgress) {
      emitProgress(
        'checking_harmony',
        60,
        `Harmony score: ${harmonyResult.score.toFixed(0)}%`
      );
    }

    return {
      harmonyResult,
      harmonyScore: harmonyResult.score,
      errors,
    };
  } catch (error) {
    errors.push({
      phase: 'checking_harmony',
      message: `Harmony check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      recoverable: true,
    });
    return { harmonyResult: null, harmonyScore: null, errors };
  }
}

/**
 * Compose sections from mapped references
 */
function composeSections(
  references: Reference[],
  sectionMapping: SectionMapping,
  emitProgress?: (
    phase: TemplateGenerationPhase,
    percent: number,
    message: string
  ) => void
): {
  compositions: SectionComposition[];
  errors: TemplateGenerationError[];
  warnings: string[];
} {
  const errors: TemplateGenerationError[] = [];
  const warnings: string[] = [];
  const compositions: SectionComposition[] = [];

  if (emitProgress) {
    emitProgress('generating_sections', 65, 'Composing sections...');
  }

  // Build reference lookup map
  const referenceMap = new Map<string, Reference>();
  references.forEach((ref) => referenceMap.set(ref.id, ref));

  // Process each section mapping
  Object.entries(sectionMapping).forEach(([sectionType, referenceId]) => {
    // Support both UUID-based and index-based referenceId
    let reference: Reference | undefined;

    // Check if referenceId is a numeric string (index)
    const referenceIndex = parseInt(referenceId, 10);
    if (!isNaN(referenceIndex) && referenceIndex >= 0 && referenceIndex < references.length) {
      // Use index to get reference
      reference = references[referenceIndex];
    } else {
      // Use as UUID to look up in map
      reference = referenceMap.get(referenceId);
    }

    if (!reference) {
      warnings.push(
        `Section type "${sectionType}" mapped to unknown reference "${referenceId}"`
      );
      return;
    }

    // Find matching section in reference
    const section = reference.sections.find(
      (s) => s.type === sectionType as SectionType
    );

    if (!section) {
      warnings.push(
        `Section type "${sectionType}" not found in reference "${reference.name}"`
      );
      return;
    }

    compositions.push({
      sectionType: sectionType as SectionType,
      referenceId: reference.id,
      section,
    });
  });

  if (emitProgress) {
    emitProgress(
      'generating_sections',
      80,
      `Composed ${compositions.length} sections`
    );
  }

  return { compositions, errors, warnings };
}

/**
 * Persist template project to database
 */
async function persistProject(
  projectId: string,
  projectName: string,
  references: Reference[],
  sectionMapping: SectionMapping,
  primaryTokenSourceIndex: number,
  harmonyScore: number | null,
  skipDatabase: boolean
): Promise<{ errors: TemplateGenerationError[] }> {
  const errors: TemplateGenerationError[] = [];

  if (skipDatabase) {
    return { errors };
  }

  try {
    const db = getDb();

    // Create template project
    const projectData: TemplateProjectInsert = {
      id: projectId,
      name: projectName,
      primary_token_source: references[primaryTokenSourceIndex]?.id || null,
      section_mapping_json: JSON.stringify(sectionMapping),
      harmony_score: harmonyScore,
      status: 'complete',
    };

    await createTemplateProject(projectData);

    // Create template references
    for (const reference of references) {
      const referenceData: TemplateReferenceInsert = {
        id: reference.id,
        project_id: projectId,
        url: reference.url,
        name: reference.name,
        tokens_json: JSON.stringify(reference.tokens),
        sections_json: JSON.stringify(reference.sections),
      };

      await createTemplateReference(referenceData);
    }
  } catch (error) {
    errors.push({
      phase: 'saving_project',
      message: `Database persistence error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      recoverable: true,
    });
  }

  return { errors };
}

// ====================
// MAIN GENERATION FUNCTION
// ====================

/**
 * Generate a complete website from multiple reference sources
 * This is the main entry point for Template Mode generation
 */
export async function generateTemplate(
  options: GenerateTemplateOptions
): Promise<TemplateGenerationResult> {
  const startTime = Date.now();
  const projectId = uuidv4();
  const allErrors: TemplateGenerationError[] = [];
  const allWarnings: string[] = [];
  const emitProgress = createProgressEmitter(options.onProgress);

  // Initialize result with defaults
  let result: TemplateGenerationResult = {
    success: false,
    projectId,
    projectName: options.projectName,
    references: [],
    mergedTokens: {} as DesignSystem,
    harmonyScore: null,
    harmonyResult: null,
    outputPath: '',
    metadata: {
      totalReferences: 0,
      totalSections: 0,
      processingTimeMs: 0,
      generatedAt: new Date().toISOString(),
    },
    errors: [],
    warnings: [],
  };

  try {
    // Phase 1: Initialize and validate
    emitProgress('initializing', 0, 'Initializing template generation...');

    const validation = validateOptions(options);
    if (!validation.isValid) {
      validation.errors.forEach((error) => {
        allErrors.push({
          phase: 'initializing',
          message: error,
          recoverable: false,
        });
      });
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    emitProgress('initializing', 5, 'Validation complete');

    // Phase 2: Process all references
    const { references, errors: refErrors } = await processAllReferences(
      options.referenceUrls,
      options.forceReprocess || false,
      emitProgress
    );
    allErrors.push(...refErrors);

    if (references.length === 0) {
      throw new Error('No references were successfully processed');
    }

    result.references = references;
    result.metadata.totalReferences = references.length;

    // Phase 3: Merge design tokens
    const primaryIndex = options.primaryTokenSourceIndex || 0;
    const { mergedTokens, errors: mergeErrors } = mergeDesignTokens(
      references,
      primaryIndex,
      options.customMergeStrategy,
      emitProgress
    );
    allErrors.push(...mergeErrors);

    if (!mergedTokens) {
      throw new Error('Failed to merge design tokens');
    }

    result.mergedTokens = mergedTokens;

    // Phase 4: Check harmony
    const { harmonyResult, harmonyScore, errors: harmonyErrors } =
      performHarmonyCheck(
        references,
        options.sectionMapping,
        options.skipHarmonyCheck || false,
        emitProgress
      );
    allErrors.push(...harmonyErrors);

    result.harmonyScore = harmonyScore;
    result.harmonyResult = harmonyResult;

    // Advisory harmony check
    if (
      harmonyScore !== null &&
      options.minHarmonyScore !== undefined &&
      harmonyScore < options.minHarmonyScore
    ) {
      allWarnings.push(
        `Harmony score ${harmonyScore.toFixed(0)}% is below recommended threshold of ${options.minHarmonyScore}%`
      );
    }

    // Phase 5: Compose sections
    const { compositions, errors: compErrors, warnings: compWarnings } =
      composeSections(references, options.sectionMapping, emitProgress);
    allErrors.push(...compErrors);
    allWarnings.push(...compWarnings);

    result.metadata.totalSections = compositions.length;

    // Phase 6: Save outputs
    emitProgress('saving_project', 85, 'Saving project files...');

    const projectDir = getProjectDir(projectId, options.outputDir);
    result.outputPath = projectDir;

    // Save all outputs to file system
    saveMergedTokens(projectDir, mergedTokens);
    saveSectionComposition(projectDir, compositions);
    if (harmonyResult) {
      saveHarmonyReport(projectDir, harmonyResult);
    }

    // Persist to database
    const { errors: dbErrors } = await persistProject(
      projectId,
      options.projectName,
      references,
      options.sectionMapping,
      primaryIndex,
      harmonyScore,
      options.skipDatabase || false
    );
    allErrors.push(...dbErrors);

    // Phase 7: Complete
    emitProgress('complete', 100, 'Template generation complete');

    result.success = allErrors.filter((e) => !e.recoverable).length === 0;
    result.errors = allErrors;
    result.warnings = allWarnings;
    result.metadata.processingTimeMs = Date.now() - startTime;

    // Save final metadata
    saveProjectMetadata(projectDir, result);

    return result;
  } catch (error) {
    // Handle catastrophic errors
    allErrors.push({
      phase: 'complete',
      message: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      recoverable: false,
    });

    result.success = false;
    result.errors = allErrors;
    result.warnings = allWarnings;
    result.metadata.processingTimeMs = Date.now() - startTime;

    return result;
  }
}

// ====================
// HELPER FUNCTIONS
// ====================

/**
 * Load existing template project from database
 */
export async function loadTemplateProject(
  projectId: string
): Promise<TemplateProject | null> {
  try {
    const projectRecord = await getTemplateProjectById(projectId);
    if (!projectRecord) {
      return null;
    }

    const referenceRecords = await getTemplateReferencesByProject(projectId);

    const references: Reference[] = referenceRecords.map((record) => ({
      id: record.id,
      url: record.url,
      name: record.name || '',
      tokens: JSON.parse(record.tokens_json || '{}'),
      sections: JSON.parse(record.sections_json || '[]'),
      status: 'ready',
    }));

    const project: TemplateProject = {
      id: projectRecord.id,
      name: projectRecord.name,
      references,
      sectionMapping: JSON.parse(projectRecord.section_mapping_json || '{}'),
      primaryTokenSource: projectRecord.primary_token_source,
      status: projectRecord.status as 'configuring' | 'processing' | 'complete',
      harmonyScore: projectRecord.harmony_score,
      createdAt: projectRecord.created_at,
    };

    return project;
  } catch (error) {
    return null;
  }
}

/**
 * Get template generation result summary
 */
export function getResultSummary(result: TemplateGenerationResult): string {
  const lines: string[] = [];

  lines.push(`Template Generation ${result.success ? 'Complete' : 'Failed'}`);
  lines.push(`Project: ${result.projectName} (${result.projectId})`);
  lines.push(`References: ${result.metadata.totalReferences}`);
  lines.push(`Sections: ${result.metadata.totalSections}`);

  if (result.harmonyScore !== null) {
    lines.push(`Harmony Score: ${result.harmonyScore.toFixed(0)}%`);
  }

  lines.push(
    `Processing Time: ${(result.metadata.processingTimeMs / 1000).toFixed(2)}s`
  );

  if (result.errors.length > 0) {
    lines.push(`Errors: ${result.errors.length}`);
  }

  if (result.warnings.length > 0) {
    lines.push(`Warnings: ${result.warnings.length}`);
  }

  lines.push(`Output: ${result.outputPath}`);

  return lines.join('\n');
}

// ====================
// EXPORTS
// ====================

export type {
  GenerateTemplateOptions,
  TemplateGenerationResult,
  TemplateGenerationError,
  TemplateGenerationProgress,
  TemplateGenerationPhase,
};
