/**
 * Framer Design Context
 *
 * Contains all Framer-specific design patterns, enhancements, and styles
 * that should be applied when generating components from Framer sites.
 *
 * This context was developed through iterative refinement of the
 * Fluence AI website (https://fluence.framer.website/)
 */

export interface FramerDesignContext {
  fonts: FramerFontConfig;
  colors: FramerColorPalette;
  gradients: FramerGradientConfig;
  shadows: FramerShadowConfig;
  animations: FramerAnimationConfig;
  componentEnhancements: FramerComponentEnhancements;
}

// =============================================================================
// Font Configuration
// =============================================================================

export interface FramerFontConfig {
  primary: string;
  fallbacks: string[];
  weights: number[];
  cdnUrl: string;
}

export const FRAMER_FONTS: FramerFontConfig = {
  primary: 'General Sans',
  fallbacks: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  weights: [400, 500, 600, 700],
  cdnUrl: "https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
};

// =============================================================================
// Color Palette
// =============================================================================

export interface FramerColorPalette {
  dark: {
    primary: string;
    secondary: string;
    text: string;
    textMuted: string;
  };
  light: {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  accent: {
    purple: string;
    pink: string;
    blue: string;
    orange: string;
  };
}

export const FRAMER_COLORS: FramerColorPalette = {
  dark: {
    primary: 'rgb(27, 12, 37)',      // Deep purple - used for About, Footer
    secondary: 'rgb(17, 7, 23)',      // Darker variant
    text: 'rgb(255, 255, 255)',
    textMuted: 'rgba(255, 255, 255, 0.6)'
  },
  light: {
    background: 'rgb(250, 250, 250)',
    surface: 'rgb(255, 255, 255)',
    text: 'rgb(27, 12, 37)',
    textMuted: 'rgba(27, 12, 37, 0.6)'
  },
  accent: {
    purple: 'rgb(168, 85, 247)',     // Primary accent
    pink: 'rgb(236, 72, 153)',       // Secondary accent
    blue: 'rgb(128, 169, 252)',      // Gradient component
    orange: 'rgb(252, 171, 131)'     // Gradient component
  }
};

// =============================================================================
// Gradient Configurations
// =============================================================================

export interface GradientOrb {
  position: { top?: string; bottom?: string; left?: string; right?: string };
  size: { width: string; height: string };
  gradient: string;
  blur: string;
  opacity: number;
}

export interface FramerGradientConfig {
  aboutSection: {
    topLeft: GradientOrb;
    bottomRight: GradientOrb;
  };
  footer: {
    topRight: GradientOrb;
    bottomLeft: GradientOrb;
  };
  hero: {
    background: string;
  };
}

export const FRAMER_GRADIENTS: FramerGradientConfig = {
  // About section gradient orbs (dark purple background)
  aboutSection: {
    topLeft: {
      position: { top: '-150px', left: '-150px' },
      size: { width: '500px', height: '450px' },
      gradient: 'linear-gradient(143deg, rgb(128, 169, 252) 0%, rgb(211, 123, 255) 31%, rgb(252, 171, 131) 70%, rgb(255, 73, 212) 100%)',
      blur: '40px',
      opacity: 0.9
    },
    bottomRight: {
      position: { bottom: '-180px', right: '-100px' },
      size: { width: '450px', height: '400px' },
      gradient: 'linear-gradient(140deg, rgb(239, 232, 246) 0%, rgb(213, 136, 251) 60%, rgb(255, 73, 212) 100%)',
      blur: '40px',
      opacity: 0.8
    }
  },

  // Footer/CTA section gradient orbs
  footer: {
    topRight: {
      position: { top: '-100px', right: '-150px' },
      size: { width: '400px', height: '400px' },
      gradient: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
      blur: '60px',
      opacity: 1
    },
    bottomLeft: {
      position: { bottom: '100px', left: '-100px' },
      size: { width: '300px', height: '300px' },
      gradient: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%)',
      blur: '50px',
      opacity: 1
    }
  },

  // Hero background gradient
  hero: {
    background: 'linear-gradient(180deg, rgb(250, 250, 250) 0%, rgb(245, 240, 255) 100%)'
  }
};

// =============================================================================
// Shadow Configuration
// =============================================================================

export interface FramerShadowConfig {
  card: string;
  cardHover: string;
  button: string;
  badge: string;
}

export const FRAMER_SHADOWS: FramerShadowConfig = {
  card: '0 4px 20px rgba(0, 0, 0, 0.08)',
  cardHover: '0 12px 40px rgba(0, 0, 0, 0.1)',
  button: '0 6px 20px rgba(0, 0, 0, 0.15)',
  badge: 'rgba(0, 0, 0, 0.07) 0px 2px 5px 0px, rgba(0, 0, 0, 0.06) 0px 8px 8px 0px'
};

// =============================================================================
// Animation Configuration
// =============================================================================

export interface FramerAnimationConfig {
  hover: {
    button: { transform: string; boxShadow: string };
    card: { transform: string; boxShadow: string };
    link: { opacity: number };
  };
  transition: {
    fast: string;
    medium: string;
    slow: string;
  };
}

export const FRAMER_ANIMATIONS: FramerAnimationConfig = {
  hover: {
    button: { transform: 'translateY(-2px)', boxShadow: FRAMER_SHADOWS.button },
    card: { transform: 'translateY(-4px)', boxShadow: FRAMER_SHADOWS.cardHover },
    link: { opacity: 0.85 }
  },
  transition: {
    fast: '150ms ease',
    medium: '200ms ease',
    slow: '300ms ease'
  }
};

// =============================================================================
// Component Enhancements
// =============================================================================

export interface FramerComponentEnhancements {
  darkSections: string[];
  gradientOrbs: boolean;
  watermarkText: boolean;
  pillBadges: boolean;
  glassButtons: boolean;
}

export const FRAMER_COMPONENT_ENHANCEMENTS: FramerComponentEnhancements = {
  // Sections that should have dark purple background
  darkSections: ['about', 'footer', 'cta'],

  // Whether to add gradient orbs to dark sections
  gradientOrbs: true,

  // Whether to add faint watermark text in footer
  watermarkText: true,

  // Use pill-shaped badges for tags
  pillBadges: true,

  // Use glassmorphism buttons in dark sections
  glassButtons: true
};

// =============================================================================
// Combined Design Context
// =============================================================================

export const FRAMER_DESIGN_CONTEXT: FramerDesignContext = {
  fonts: FRAMER_FONTS,
  colors: FRAMER_COLORS,
  gradients: FRAMER_GRADIENTS,
  shadows: FRAMER_SHADOWS,
  animations: FRAMER_ANIMATIONS,
  componentEnhancements: FRAMER_COMPONENT_ENHANCEMENTS
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate CSS for gradient orb
 */
export function generateGradientOrbCSS(orb: GradientOrb): React.CSSProperties {
  return {
    position: 'absolute',
    ...orb.position,
    width: orb.size.width,
    height: orb.size.height,
    backgroundImage: orb.gradient,
    borderRadius: '50%',
    filter: `blur(${orb.blur})`,
    opacity: orb.opacity,
    pointerEvents: 'none'
  };
}

/**
 * Generate font family string
 */
export function generateFontFamily(): string {
  return `'${FRAMER_FONTS.primary}', ${FRAMER_FONTS.fallbacks.join(', ')}`;
}

/**
 * Check if section should have dark theme
 */
export function isDarkSection(sectionType: string): boolean {
  return FRAMER_COMPONENT_ENHANCEMENTS.darkSections.includes(sectionType.toLowerCase());
}

/**
 * Get appropriate text color for section
 */
export function getSectionTextColor(sectionType: string): string {
  return isDarkSection(sectionType) ? FRAMER_COLORS.dark.text : FRAMER_COLORS.light.text;
}

/**
 * Get appropriate background color for section
 */
export function getSectionBackground(sectionType: string): string {
  return isDarkSection(sectionType) ? FRAMER_COLORS.dark.primary : FRAMER_COLORS.light.background;
}

export default FRAMER_DESIGN_CONTEXT;
