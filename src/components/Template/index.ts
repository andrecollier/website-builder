/**
 * Template Components Module
 *
 * Website template mixing and composition UI components for the "cooker" mode
 * where users combine sections from reference sites into a cohesive design.
 */

// Reference management components
export { ReferenceList } from './ReferenceList';
export { ReferenceCard } from './ReferenceCard';

// Section selection and composition
export { SectionPicker } from './SectionPicker';
export { MixerCanvas } from './MixerCanvas';

// Token and design system
export { TokenSourceSelector } from './TokenSourceSelector';
export { HarmonyIndicator } from './HarmonyIndicator';

// Preview
export { MixedPreview } from './MixedPreview';

// Types
export type { ReferenceCardProps } from './ReferenceCard';
export type { MixedPreviewProps } from './MixedPreview';
