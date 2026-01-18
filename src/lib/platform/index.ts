/**
 * Platform Detection and Adapters
 *
 * Exports platform detection utilities and platform-specific adapters
 * for handling different website builders/CMS platforms.
 */

export { detectPlatform, type Platform, type PlatformDetectionResult } from './detector';
export {
  extractFramerConfig,
  getFramerWrapperClasses,
  transformGlobalsCssForFramer,
  fixFramerComponentIssues,
  isCarouselComponent,
  fixCarouselComponent,
  type FramerConfig,
} from './adapters/framer';
