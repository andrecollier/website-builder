/**
 * Framer Footer/CTA Section Enhancement
 *
 * Applies Framer-specific styling to Footer sections:
 * - Dark purple background
 * - Gradient orbs (top-right, bottom-left)
 * - Large watermark text
 * - Glass-style buttons
 */

import { FRAMER_COLORS, FRAMER_GRADIENTS, generateGradientOrbCSS, generateFontFamily } from '../context';

export interface FooterSectionStyles {
  container: React.CSSProperties;
  gradientOrbTopRight: React.CSSProperties;
  gradientOrbBottomLeft: React.CSSProperties;
  watermark: React.CSSProperties;
  ctaSection: React.CSSProperties;
  ctaBadge: React.CSSProperties;
  ctaHeading: React.CSSProperties;
  buttonGroup: React.CSSProperties;
  primaryButton: React.CSSProperties;
  secondaryButton: React.CSSProperties;
  divider: React.CSSProperties;
  footerContent: React.CSSProperties;
  footerLogo: React.CSSProperties;
  footerLinks: React.CSSProperties;
  copyright: React.CSSProperties;
}

export function getFooterSectionStyles(): FooterSectionStyles {
  const fontFamily = generateFontFamily();

  return {
    container: {
      backgroundColor: FRAMER_COLORS.dark.primary,
      padding: '100px 40px 40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      position: 'relative',
      overflow: 'hidden'
    },

    gradientOrbTopRight: generateGradientOrbCSS(FRAMER_GRADIENTS.footer.topRight),
    gradientOrbBottomLeft: generateGradientOrbCSS(FRAMER_GRADIENTS.footer.bottomLeft),

    watermark: {
      position: 'absolute',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      fontFamily,
      fontSize: '180px',
      fontWeight: 600,
      color: 'rgba(255, 255, 255, 0.03)',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      userSelect: 'none'
    },

    ctaSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      maxWidth: '800px',
      marginBottom: '100px',
      position: 'relative',
      zIndex: 1
    },

    ctaBadge: {
      display: 'inline-flex',
      padding: '6px 14px',
      backgroundColor: 'rgb(255, 255, 255)',
      borderRadius: '999px',
      boxShadow: 'rgba(0, 0, 0, 0.07) 0px 2px 5px 0px, rgba(0, 0, 0, 0.06) 0px 8px 8px 0px',
      width: 'fit-content',
      fontFamily,
      fontSize: '14px',
      fontWeight: 500,
      color: FRAMER_COLORS.dark.primary
    },

    ctaHeading: {
      fontFamily,
      fontSize: '76px',
      fontWeight: 500,
      lineHeight: '80px',
      color: FRAMER_COLORS.dark.text
    },

    buttonGroup: {
      display: 'flex',
      gap: '16px'
    },

    // Glass-style button (secondary)
    primaryButton: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '14px 28px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: FRAMER_COLORS.dark.text,
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.2)',
      fontFamily,
      fontSize: '16px',
      fontWeight: 500,
      textDecoration: 'none',
      backdropFilter: 'blur(10px)',
      boxShadow: 'rgba(255, 255, 255, 0.1) 0px 1px 2px 0px inset'
    },

    // Solid white button (primary CTA)
    secondaryButton: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '14px 28px',
      backgroundColor: 'rgb(255, 255, 255)',
      color: FRAMER_COLORS.dark.primary,
      borderRadius: '8px',
      fontFamily,
      fontSize: '16px',
      fontWeight: 500,
      textDecoration: 'none'
    },

    divider: {
      width: '100%',
      maxWidth: '1240px',
      height: '1px',
      backgroundColor: 'rgba(255,255,255,0.1)',
      marginBottom: '60px',
      position: 'relative',
      zIndex: 1
    },

    footerContent: {
      display: 'flex',
      justifyContent: 'space-between',
      width: '100%',
      maxWidth: '1240px',
      gap: '60px',
      position: 'relative',
      zIndex: 1
    },

    footerLogo: {
      fontFamily,
      fontSize: '24px',
      fontWeight: 500,
      color: FRAMER_COLORS.dark.text
    },

    footerLinks: {
      fontFamily,
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.8)',
      textDecoration: 'none'
    },

    copyright: {
      display: 'flex',
      justifyContent: 'space-between',
      width: '100%',
      maxWidth: '1240px',
      marginTop: '80px',
      paddingTop: '24px',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      position: 'relative',
      zIndex: 1,
      fontFamily,
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.4)'
    }
  };
}

/**
 * Social media icons for footer
 */
export const SOCIAL_ICONS = {
  facebook: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/></svg>',
  twitter: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  instagram: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>',
  linkedin: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>'
};
