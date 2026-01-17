/**
 * Framer About Section Enhancement
 *
 * Applies Framer-specific styling to About sections:
 * - Dark purple background
 * - Gradient orbs (top-left, bottom-right)
 * - White text with pill badge
 */

import { FRAMER_COLORS, FRAMER_GRADIENTS, generateGradientOrbCSS } from '../context';

export interface AboutSectionStyles {
  container: React.CSSProperties;
  gradientOrbTopLeft: React.CSSProperties;
  gradientOrbBottomRight: React.CSSProperties;
  content: React.CSSProperties;
  badge: React.CSSProperties;
  heading: React.CSSProperties;
}

export function getAboutSectionStyles(): AboutSectionStyles {
  return {
    container: {
      backgroundColor: FRAMER_COLORS.dark.primary,
      padding: '100px 40px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '500px'
    },

    gradientOrbTopLeft: generateGradientOrbCSS(FRAMER_GRADIENTS.aboutSection.topLeft),
    gradientOrbBottomRight: generateGradientOrbCSS(FRAMER_GRADIENTS.aboutSection.bottomRight),

    content: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '24px',
      maxWidth: '900px',
      position: 'relative',
      zIndex: 1
    },

    badge: {
      display: 'inline-flex',
      padding: '6px 14px',
      backgroundColor: 'rgb(255, 255, 255)',
      borderRadius: '999px',
      boxShadow: 'rgba(0, 0, 0, 0.07) 0px 2px 5px 0px, rgba(0, 0, 0, 0.06) 0px 8px 8px 0px',
      fontFamily: "'General Sans', sans-serif",
      fontSize: '14px',
      fontWeight: 500,
      color: FRAMER_COLORS.dark.primary
    },

    heading: {
      fontFamily: "'General Sans', sans-serif",
      fontSize: '60px',
      fontWeight: 500,
      lineHeight: '66px',
      color: FRAMER_COLORS.dark.text,
      margin: 0
    }
  };
}

/**
 * Generate About section JSX template
 */
export function generateAboutSectionTemplate(badgeText: string, headingText: string): string {
  return `
<div style={{
  backgroundColor: 'rgb(27, 12, 37)',
  padding: '100px 40px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  minHeight: '500px'
}}>
  {/* Top-left gradient orb */}
  <div style={{
    position: 'absolute',
    top: '-150px',
    left: '-150px',
    width: '500px',
    height: '450px',
    backgroundImage: 'linear-gradient(143deg, rgb(128, 169, 252) 0%, rgb(211, 123, 255) 31%, rgb(252, 171, 131) 70%, rgb(255, 73, 212) 100%)',
    borderRadius: '50%',
    filter: 'blur(40px)',
    opacity: 0.9,
    pointerEvents: 'none'
  }}></div>

  {/* Bottom-right gradient orb */}
  <div style={{
    position: 'absolute',
    bottom: '-180px',
    right: '-100px',
    width: '450px',
    height: '400px',
    backgroundImage: 'linear-gradient(140deg, rgb(239, 232, 246) 0%, rgb(213, 136, 251) 60%, rgb(255, 73, 212) 100%)',
    borderRadius: '50%',
    filter: 'blur(40px)',
    opacity: 0.8,
    pointerEvents: 'none'
  }}></div>

  {/* Content */}
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '24px',
    maxWidth: '900px',
    position: 'relative',
    zIndex: 1
  }}>
    <div style={{
      display: 'inline-flex',
      padding: '6px 14px',
      backgroundColor: 'rgb(255, 255, 255)',
      borderRadius: '999px',
      boxShadow: 'rgba(0, 0, 0, 0.07) 0px 2px 5px 0px, rgba(0, 0, 0, 0.06) 0px 8px 8px 0px'
    }}>
      <p style={{
        fontFamily: "'General Sans', sans-serif",
        fontSize: '14px',
        fontWeight: 500,
        color: 'rgb(27, 12, 37)'
      }}>${badgeText}</p>
    </div>

    <h2 style={{
      fontFamily: "'General Sans', sans-serif",
      fontSize: '60px',
      fontWeight: 500,
      lineHeight: '66px',
      color: 'rgb(255, 255, 255)',
      margin: 0
    }}>
      ${headingText}
    </h2>
  </div>
</div>
`;
}
