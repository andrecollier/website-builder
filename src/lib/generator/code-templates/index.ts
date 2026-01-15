/**
 * Code Templates Module Exports
 *
 * Complete component code generation templates including:
 * - Header: Navigation headers with logo, nav links, and CTAs
 * - Hero: Hero sections with headlines, CTAs, and images
 * - Features: Feature grids with icons and descriptions
 * - Testimonials: Customer testimonials with ratings and avatars
 * - Pricing: Pricing tables with tiers and feature lists
 * - Footer: Site footers with link groups, social links, and copyright
 *
 * Each component template provides three variant strategies:
 * - Pixel-perfect: Exact visual reproduction with inline styles
 * - Semantic: Clean HTML architecture with proper semantics
 * - Modernized: Accessibility (ARIA), performance optimizations, and best practices
 */

// ====================
// HEADER TEMPLATES
// ====================

export {
  generatePixelPerfectHeader,
  generateSemanticHeader,
  generateModernizedHeader,
  headerTemplates,
  getHeaderTemplate,
  generateAllHeaderVariants,
  type HeaderTemplateProps,
  type HeaderVariantStrategy,
} from './header';

// ====================
// HERO TEMPLATES
// ====================

export {
  generatePixelPerfectHero,
  generateSemanticHero,
  generateModernizedHero,
  heroTemplates,
  getHeroTemplate,
  generateAllHeroVariants,
  type HeroTemplateProps,
  type HeroVariantStrategy,
} from './hero';

// ====================
// FEATURES TEMPLATES
// ====================

export {
  generatePixelPerfectFeatures,
  generateSemanticFeatures,
  generateModernizedFeatures,
  featuresTemplates,
  getFeaturesTemplate,
  generateAllFeaturesVariants,
  type FeaturesTemplateProps,
  type FeaturesVariantStrategy,
} from './features';

// ====================
// TESTIMONIALS TEMPLATES
// ====================

export {
  generatePixelPerfectTestimonials,
  generateSemanticTestimonials,
  generateModernizedTestimonials,
  testimonialsTemplates,
  getTestimonialsTemplate,
  generateAllTestimonialsVariants,
  type TestimonialsTemplateProps,
  type TestimonialsVariantStrategy,
} from './testimonials';

// ====================
// PRICING TEMPLATES
// ====================

export {
  generatePixelPerfectPricing,
  generateSemanticPricing,
  generateModernizedPricing,
  pricingTemplates,
  getPricingTemplate,
  generateAllPricingVariants,
  type PricingTemplateProps,
  type PricingVariantStrategy,
} from './pricing';

// ====================
// FOOTER TEMPLATES
// ====================

export {
  generatePixelPerfectFooter,
  generateSemanticFooter,
  generateModernizedFooter,
  footerTemplates,
  getFooterTemplate,
  generateAllFooterVariants,
  type FooterTemplateProps,
  type FooterVariantStrategy,
} from './footer';

// ====================
// UNIFIED TYPES
// ====================

/**
 * All available component template types
 */
export type ComponentTemplateType =
  | 'header'
  | 'hero'
  | 'features'
  | 'testimonials'
  | 'pricing'
  | 'footer';

/**
 * Variant strategy options for all templates
 */
export type VariantStrategy = 'pixel-perfect' | 'semantic' | 'modernized';

/**
 * Union type of all template props
 */
export type TemplateProps =
  | import('./header').HeaderTemplateProps
  | import('./hero').HeroTemplateProps
  | import('./features').FeaturesTemplateProps
  | import('./testimonials').TestimonialsTemplateProps
  | import('./pricing').PricingTemplateProps
  | import('./footer').FooterTemplateProps;

// ====================
// TEMPLATE REGISTRY
// ====================

/**
 * Registry of all component template generators
 */
export const componentTemplates = {
  header: {
    'pixel-perfect': generatePixelPerfectHeader,
    'semantic': generateSemanticHeader,
    'modernized': generateModernizedHeader,
  },
  hero: {
    'pixel-perfect': generatePixelPerfectHero,
    'semantic': generateSemanticHero,
    'modernized': generateModernizedHero,
  },
  features: {
    'pixel-perfect': generatePixelPerfectFeatures,
    'semantic': generateSemanticFeatures,
    'modernized': generateModernizedFeatures,
  },
  testimonials: {
    'pixel-perfect': generatePixelPerfectTestimonials,
    'semantic': generateSemanticTestimonials,
    'modernized': generateModernizedTestimonials,
  },
  pricing: {
    'pixel-perfect': generatePixelPerfectPricing,
    'semantic': generateSemanticPricing,
    'modernized': generateModernizedPricing,
  },
  footer: {
    'pixel-perfect': generatePixelPerfectFooter,
    'semantic': generateSemanticFooter,
    'modernized': generateModernizedFooter,
  },
} as const;

/**
 * Get template generator for a specific component type and strategy
 *
 * @param componentType - The type of component (header, hero, etc.)
 * @param strategy - The variant strategy (pixel-perfect, semantic, modernized)
 * @returns Template generator function or undefined if not found
 */
export function getComponentTemplate(
  componentType: ComponentTemplateType,
  strategy: VariantStrategy
): ((props: TemplateProps) => string) | undefined {
  const templates = componentTemplates[componentType];
  if (!templates) return undefined;
  return templates[strategy] as ((props: TemplateProps) => string) | undefined;
}

/**
 * List of all supported component types
 */
export const SUPPORTED_COMPONENT_TYPES: ComponentTemplateType[] = [
  'header',
  'hero',
  'features',
  'testimonials',
  'pricing',
  'footer',
];

/**
 * List of all supported variant strategies
 */
export const SUPPORTED_VARIANT_STRATEGIES: VariantStrategy[] = [
  'pixel-perfect',
  'semantic',
  'modernized',
];

/**
 * Check if a component type is supported
 *
 * @param type - Component type to check
 * @returns True if the component type is supported
 */
export function isComponentTypeSupported(type: string): type is ComponentTemplateType {
  return SUPPORTED_COMPONENT_TYPES.includes(type as ComponentTemplateType);
}

/**
 * Check if a variant strategy is supported
 *
 * @param strategy - Strategy to check
 * @returns True if the strategy is supported
 */
export function isVariantStrategySupported(strategy: string): strategy is VariantStrategy {
  return SUPPORTED_VARIANT_STRATEGIES.includes(strategy as VariantStrategy);
}
