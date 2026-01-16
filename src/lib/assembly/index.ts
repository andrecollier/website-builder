/**
 * Assembly Module Exports
 *
 * Complete page assembly pipeline including:
 * - Page assembler for combining approved components into complete HTML pages
 * - Asset handler for downloading and optimizing images (WebP, lazy loading, srcset)
 * - Interactivity generator for adding JavaScript to interactive elements
 *
 * This module handles the final assembly stage before export, taking generated
 * components and preparing them for deployment in various formats.
 */

// ====================
// PAGE ASSEMBLER
// ====================

export {
  assemblePage,
  getPageStructure,
  validateComponentsForAssembly,
  type AssemblyPhase,
  type AssemblyProgress,
  type AssemblyOptions,
  type AssembledComponent,
  type PageStructure,
  type AssemblyResult,
  type AssemblyWarning,
  type AssemblyError,
} from './page-assembler';

// ====================
// ASSET HANDLER
// ====================

export {
  processAssets,
  downloadAssets,
  optimizeImages,
  generateImageSrcset,
  type AssetPhase,
  type AssetProgress,
  type AssetHandlerOptions,
  type DetectedAsset,
  type ProcessedAsset,
  type AssetHandlerResult,
  type AssetWarning,
  type AssetError,
} from './asset-handler';

// ====================
// INTERACTIVITY
// ====================

export {
  generateInteractivity,
  detectInteractiveElements,
  hasInteractiveElements,
  getInteractivitySummary,
  type InteractiveElementType,
  type DetectedInteractiveElement,
  type InteractivityOptions,
  type InteractivityResult,
} from './interactivity';
