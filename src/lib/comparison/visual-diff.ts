/**
 * Visual Diff Module
 *
 * Provides pixel-level comparison between reference and generated screenshots
 * using Pixelmatch for accurate visual difference detection.
 */

import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// ====================
// INTERFACES
// ====================

export interface ComparisonResult {
  sectionName: string;
  sectionType: string;
  accuracy: number;
  mismatchedPixels: number;
  totalPixels: number;
  diffImagePath: string;
  referenceImagePath: string;
  generatedImagePath: string;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface ComparisonReport {
  websiteId: string;
  timestamp: string;
  overallAccuracy: number;
  sections: ComparisonResult[];
  summary: {
    totalSections: number;
    sectionsAbove90: number;
    sectionsAbove80: number;
    sectionsBelow80: number;
  };
}

// ====================
// IMAGE UTILITIES
// ====================

/**
 * Load a PNG image from file path
 */
async function loadPNG(imagePath: string): Promise<PNG> {
  const buffer = await fs.promises.readFile(imagePath);
  return new Promise((resolve, reject) => {
    const png = new PNG();
    png.parse(buffer, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

/**
 * Resize image to target dimensions using sharp
 */
async function resizeImage(
  imagePath: string,
  targetWidth: number,
  targetHeight: number
): Promise<Buffer> {
  return sharp(imagePath)
    .resize(targetWidth, targetHeight, {
      fit: 'fill',
      kernel: 'lanczos3',
    })
    .png()
    .toBuffer();
}

/**
 * Get image dimensions
 */
async function getImageDimensions(imagePath: string): Promise<{ width: number; height: number }> {
  const metadata = await sharp(imagePath).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

// ====================
// COMPARISON FUNCTIONS
// ====================

/**
 * Compare two images and generate a diff image
 *
 * @param referencePath - Path to the reference (original) image
 * @param generatedPath - Path to the generated image
 * @param diffOutputPath - Path where diff image will be saved
 * @returns ComparisonResult with accuracy and pixel data
 */
export async function compareImages(
  referencePath: string,
  generatedPath: string,
  diffOutputPath: string
): Promise<Omit<ComparisonResult, 'sectionName' | 'sectionType'>> {
  // Get dimensions of both images
  const refDimensions = await getImageDimensions(referencePath);
  const genDimensions = await getImageDimensions(generatedPath);

  // Use reference dimensions as target (generated should match reference)
  const targetWidth = refDimensions.width;
  const targetHeight = refDimensions.height;

  // Load and resize images to same dimensions
  let refBuffer: Buffer;
  let genBuffer: Buffer;

  if (refDimensions.width === genDimensions.width && refDimensions.height === genDimensions.height) {
    // Same size, load directly
    refBuffer = await fs.promises.readFile(referencePath);
    genBuffer = await fs.promises.readFile(generatedPath);
  } else {
    // Different sizes, resize generated to match reference
    refBuffer = await fs.promises.readFile(referencePath);
    genBuffer = await resizeImage(generatedPath, targetWidth, targetHeight);
  }

  // Parse PNGs
  const refPNG = PNG.sync.read(refBuffer);
  const genPNG = PNG.sync.read(genBuffer);

  // Create diff PNG
  const diff = new PNG({ width: targetWidth, height: targetHeight });

  // Run pixelmatch
  const mismatchedPixels = pixelmatch(
    refPNG.data,
    genPNG.data,
    diff.data,
    targetWidth,
    targetHeight,
    {
      threshold: 0.1,
      alpha: 0.1,
      diffColor: [255, 0, 0],      // Red for differences
      diffColorAlt: [0, 255, 0],   // Green for anti-aliased
    }
  );

  // Save diff image
  const diffDir = path.dirname(diffOutputPath);
  if (!fs.existsSync(diffDir)) {
    fs.mkdirSync(diffDir, { recursive: true });
  }

  const diffBuffer = PNG.sync.write(diff);
  await fs.promises.writeFile(diffOutputPath, diffBuffer);

  // Calculate accuracy
  const totalPixels = targetWidth * targetHeight;
  const accuracy = ((totalPixels - mismatchedPixels) / totalPixels) * 100;

  return {
    accuracy: Math.round(accuracy * 100) / 100,
    mismatchedPixels,
    totalPixels,
    diffImagePath: diffOutputPath,
    referenceImagePath: referencePath,
    generatedImagePath: generatedPath,
    dimensions: {
      width: targetWidth,
      height: targetHeight,
    },
  };
}

/**
 * Compare all sections for a website
 *
 * Uses type-based matching: matches reference sections to generated sections
 * by section type (header, hero, features, etc.) rather than by index.
 *
 * @param websiteId - The website ID
 * @param websitesDir - Base directory for websites
 * @returns Full comparison report
 */
export async function compareAllSections(
  websiteId: string,
  websitesDir: string
): Promise<ComparisonReport> {
  const websiteDir = path.join(websitesDir, websiteId);
  const referenceDir = path.join(websiteDir, 'reference', 'sections');
  const generatedDir = path.join(websiteDir, 'generated', 'screenshots');
  const diffDir = path.join(websiteDir, 'comparison', 'diffs');
  const metadataPath = path.join(websiteDir, 'reference', 'metadata.json');

  // Check if directories exist
  if (!fs.existsSync(referenceDir)) {
    throw new Error(`Reference directory not found: ${referenceDir}`);
  }

  // Load metadata for section info
  let sections: Array<{ id: string; type: string }> = [];
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(await fs.promises.readFile(metadataPath, 'utf-8'));
    sections = metadata.sections || [];
  }

  // Get list of reference and generated screenshots
  const referenceFiles = fs.readdirSync(referenceDir)
    .filter(f => f.endsWith('.png'))
    .sort();

  const generatedFiles = fs.existsSync(generatedDir)
    ? fs.readdirSync(generatedDir).filter(f => f.endsWith('.png')).sort()
    : [];

  // Normalize type names to handle aliases (e.g., calltoaction -> cta)
  const normalizeType = (type: string): string => {
    const typeAliases: Record<string, string> = {
      'calltoaction': 'cta',
      'call-to-action': 'cta',
      'contactform': 'contact',
      'featurelist': 'features',
    };
    return typeAliases[type] || type;
  };

  // Build a map of generated screenshots by type
  // e.g., { header: ['01-header.png'], hero: ['02-hero.png', '03-hero.png'], features: [...] }
  const generatedByType = new Map<string, string[]>();
  for (const genFile of generatedFiles) {
    // Extract type from filename (e.g., "02-hero.png" -> "hero")
    const match = genFile.match(/^\d+-([a-z]+)(?:\d+)?\.png$/i);
    if (match) {
      const type = normalizeType(match[1].toLowerCase());
      if (!generatedByType.has(type)) {
        generatedByType.set(type, []);
      }
      generatedByType.get(type)!.push(genFile);
    }
  }

  // Track which generated files have been used (for type-based matching)
  const usedGeneratedByType = new Map<string, number>();

  const results: ComparisonResult[] = [];

  for (let i = 0; i < referenceFiles.length; i++) {
    const refFile = referenceFiles[i];
    const refPath = path.join(referenceDir, refFile);
    const diffPath = path.join(diffDir, refFile.replace('.png', '-diff.png'));

    // Get section info from metadata
    const sectionInfo = sections[i] || { id: `section-${i}`, type: 'unknown' };
    const sectionName = refFile.replace('.png', '');
    const sectionType = sectionInfo.type.toLowerCase();

    // Find matching generated screenshot by type
    let genPath = '';
    const typeMatches = generatedByType.get(sectionType) || [];
    const typeIndex = usedGeneratedByType.get(sectionType) || 0;

    if (typeIndex < typeMatches.length) {
      genPath = path.join(generatedDir, typeMatches[typeIndex]);
      usedGeneratedByType.set(sectionType, typeIndex + 1);
    }

    // Check if generated screenshot exists
    if (!genPath || !fs.existsSync(genPath)) {
      // No generated screenshot, 0% accuracy
      results.push({
        sectionName,
        sectionType: sectionInfo.type,
        accuracy: 0,
        mismatchedPixels: 0,
        totalPixels: 0,
        diffImagePath: '',
        referenceImagePath: refPath,
        generatedImagePath: '',
        dimensions: { width: 0, height: 0 },
      });
      continue;
    }

    try {
      const comparison = await compareImages(refPath, genPath, diffPath);
      results.push({
        sectionName,
        sectionType: sectionInfo.type,
        ...comparison,
      });
    } catch (error) {
      console.error(`Error comparing ${sectionName}:`, error);
      results.push({
        sectionName,
        sectionType: sectionInfo.type,
        accuracy: 0,
        mismatchedPixels: 0,
        totalPixels: 0,
        diffImagePath: '',
        referenceImagePath: refPath,
        generatedImagePath: genPath,
        dimensions: { width: 0, height: 0 },
      });
    }
  }

  // Calculate overall accuracy (weighted by pixel count)
  const totalPixels = results.reduce((sum, r) => sum + r.totalPixels, 0);
  const totalMatched = results.reduce((sum, r) => sum + (r.totalPixels - r.mismatchedPixels), 0);
  const overallAccuracy = totalPixels > 0
    ? Math.round((totalMatched / totalPixels) * 10000) / 100
    : 0;

  // Generate summary
  const summary = {
    totalSections: results.length,
    sectionsAbove90: results.filter(r => r.accuracy >= 90).length,
    sectionsAbove80: results.filter(r => r.accuracy >= 80 && r.accuracy < 90).length,
    sectionsBelow80: results.filter(r => r.accuracy < 80).length,
  };

  const report: ComparisonReport = {
    websiteId,
    timestamp: new Date().toISOString(),
    overallAccuracy,
    sections: results,
    summary,
  };

  // Save report
  const reportPath = path.join(websiteDir, 'comparison', 'report.json');
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));

  return report;
}
