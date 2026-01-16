/**
 * Interactivity Generator Module
 *
 * Generates vanilla JavaScript for interactive elements in assembled pages.
 * Detects and adds functionality for:
 * - Dropdowns: Click-to-expand navigation and action menus
 * - Modals: Dialog/overlay windows with close actions
 * - Mobile menus: Responsive hamburger navigation
 * - Accordions: Expandable/collapsible content sections
 *
 * All generated JavaScript is vanilla ES6+ with no external dependencies,
 * making it suitable for static HTML exports.
 */

// ====================
// TYPES
// ====================

/**
 * Type of interactive element
 */
export type InteractiveElementType =
  | 'dropdown'
  | 'modal'
  | 'mobile-menu'
  | 'accordion';

/**
 * Detected interactive element in HTML
 */
export interface DetectedInteractiveElement {
  type: InteractiveElementType;
  selector: string;
  triggerSelector: string;
  targetSelector?: string;
  description: string;
}

/**
 * Options for interactivity generation
 */
export interface InteractivityOptions {
  /** Include dropdown functionality */
  includeDropdowns?: boolean;
  /** Include modal functionality */
  includeModals?: boolean;
  /** Include mobile menu functionality */
  includeMobileMenu?: boolean;
  /** Include accordion functionality */
  includeAccordions?: boolean;
  /** Add accessibility features (ARIA, keyboard navigation) */
  accessibility?: boolean;
  /** Add smooth animations */
  animations?: boolean;
}

/**
 * Result of interactivity generation
 */
export interface InteractivityResult {
  success: boolean;
  javascript: string;
  detectedElements: DetectedInteractiveElement[];
  metadata: {
    totalElements: number;
    byType: Record<InteractiveElementType, number>;
    hasAccessibility: boolean;
    hasAnimations: boolean;
    generatedAt: string;
  };
  error?: string;
}

// ====================
// CONSTANTS
// ====================

/**
 * Default interactivity options
 */
const DEFAULT_OPTIONS: Required<InteractivityOptions> = {
  includeDropdowns: true,
  includeModals: true,
  includeMobileMenu: true,
  includeAccordions: true,
  accessibility: true,
  animations: true,
};

/**
 * Common CSS selectors for detecting interactive elements
 */
const SELECTORS = {
  // Dropdowns
  dropdown: [
    '[data-dropdown]',
    '[role="menu"]',
    '.dropdown',
    '.dropdown-menu',
    '[aria-haspopup="true"]',
  ],
  dropdownTrigger: [
    '[data-dropdown-trigger]',
    '[aria-haspopup="true"]',
    '.dropdown-toggle',
    'button[aria-expanded]',
  ],

  // Modals
  modal: [
    '[data-modal]',
    '[role="dialog"]',
    '.modal',
    '[aria-modal="true"]',
    '.dialog',
  ],
  modalTrigger: [
    '[data-modal-trigger]',
    '[data-modal-open]',
    '[aria-haspopup="dialog"]',
  ],
  modalClose: [
    '[data-modal-close]',
    '.modal-close',
    '[aria-label*="close" i]',
    '.close',
  ],

  // Mobile Menu
  mobileMenu: [
    '[data-mobile-menu]',
    '.mobile-menu',
    '.mobile-nav',
    'nav[class*="mobile"]',
  ],
  mobileMenuToggle: [
    '[data-mobile-menu-toggle]',
    '.hamburger',
    '.menu-toggle',
    '[aria-label*="menu" i]',
  ],

  // Accordions
  accordion: [
    '[data-accordion]',
    '[role="region"][aria-labelledby]',
    '.accordion',
    '.collapse',
  ],
  accordionTrigger: [
    '[data-accordion-trigger]',
    '[aria-expanded]',
    '.accordion-trigger',
    'button[aria-controls]',
  ],
};

// ====================
// DETECTION FUNCTIONS
// ====================

/**
 * Detect all interactive elements in HTML
 *
 * @param html - HTML content to scan
 * @param options - Detection options
 * @returns Array of detected interactive elements
 */
export function detectInteractiveElements(
  html: string,
  options: InteractivityOptions = {}
): DetectedInteractiveElement[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const elements: DetectedInteractiveElement[] = [];

  if (opts.includeDropdowns) {
    elements.push(...detectDropdowns(html));
  }

  if (opts.includeModals) {
    elements.push(...detectModals(html));
  }

  if (opts.includeMobileMenu) {
    elements.push(...detectMobileMenu(html));
  }

  if (opts.includeAccordions) {
    elements.push(...detectAccordions(html));
  }

  return elements;
}

/**
 * Detect dropdown elements in HTML
 *
 * @param html - HTML content
 * @returns Detected dropdown elements
 */
function detectDropdowns(html: string): DetectedInteractiveElement[] {
  const elements: DetectedInteractiveElement[] = [];

  // Check for dropdown triggers
  for (const selector of SELECTORS.dropdownTrigger) {
    if (html.includes(selector)) {
      elements.push({
        type: 'dropdown',
        selector: selector,
        triggerSelector: selector,
        description: 'Click-to-expand dropdown menu',
      });
    }
  }

  return elements;
}

/**
 * Detect modal elements in HTML
 *
 * @param html - HTML content
 * @returns Detected modal elements
 */
function detectModals(html: string): DetectedInteractiveElement[] {
  const elements: DetectedInteractiveElement[] = [];

  // Check for modal containers
  for (const selector of SELECTORS.modal) {
    if (html.includes(selector)) {
      elements.push({
        type: 'modal',
        selector: selector,
        triggerSelector: SELECTORS.modalTrigger[0],
        targetSelector: selector,
        description: 'Modal dialog window',
      });
    }
  }

  return elements;
}

/**
 * Detect mobile menu elements in HTML
 *
 * @param html - HTML content
 * @returns Detected mobile menu elements
 */
function detectMobileMenu(html: string): DetectedInteractiveElement[] {
  const elements: DetectedInteractiveElement[] = [];

  // Check for mobile menu toggles
  for (const selector of SELECTORS.mobileMenuToggle) {
    if (html.includes(selector)) {
      elements.push({
        type: 'mobile-menu',
        selector: selector,
        triggerSelector: selector,
        targetSelector: SELECTORS.mobileMenu[0],
        description: 'Responsive mobile navigation menu',
      });
      break; // Only add one mobile menu
    }
  }

  return elements;
}

/**
 * Detect accordion elements in HTML
 *
 * @param html - HTML content
 * @returns Detected accordion elements
 */
function detectAccordions(html: string): DetectedInteractiveElement[] {
  const elements: DetectedInteractiveElement[] = [];

  // Check for accordion triggers
  for (const selector of SELECTORS.accordionTrigger) {
    if (html.includes(selector)) {
      elements.push({
        type: 'accordion',
        selector: selector,
        triggerSelector: selector,
        description: 'Expandable/collapsible content section',
      });
    }
  }

  return elements;
}

// ====================
// GENERATOR FUNCTIONS
// ====================

/**
 * Generate JavaScript for all detected interactive elements
 *
 * @param html - HTML content to generate interactivity for
 * @param options - Generation options
 * @returns Interactivity generation result
 */
export function generateInteractivity(
  html: string,
  options: InteractivityOptions = {}
): InteractivityResult {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const detectedElements = detectInteractiveElements(html, opts);

    // Count elements by type
    const byType: Record<InteractiveElementType, number> = {
      dropdown: 0,
      modal: 0,
      'mobile-menu': 0,
      accordion: 0,
    };

    for (const element of detectedElements) {
      byType[element.type]++;
    }

    // Generate JavaScript code
    const codeParts: string[] = [];

    // Add initialization wrapper
    codeParts.push(generateInitWrapper(opts));

    // Add type-specific code
    if (byType.dropdown > 0 && opts.includeDropdowns) {
      codeParts.push(generateDropdownCode(opts));
    }

    if (byType.modal > 0 && opts.includeModals) {
      codeParts.push(generateModalCode(opts));
    }

    if (byType['mobile-menu'] > 0 && opts.includeMobileMenu) {
      codeParts.push(generateMobileMenuCode(opts));
    }

    if (byType.accordion > 0 && opts.includeAccordions) {
      codeParts.push(generateAccordionCode(opts));
    }

    // Add initialization call
    codeParts.push(generateInitCall());

    const javascript = codeParts.join('\n\n');

    return {
      success: true,
      javascript,
      detectedElements,
      metadata: {
        totalElements: detectedElements.length,
        byType,
        hasAccessibility: opts.accessibility,
        hasAnimations: opts.animations,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      javascript: '',
      detectedElements: [],
      metadata: {
        totalElements: 0,
        byType: {
          dropdown: 0,
          modal: 0,
          'mobile-menu': 0,
          accordion: 0,
        },
        hasAccessibility: false,
        hasAnimations: false,
        generatedAt: new Date().toISOString(),
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate initialization wrapper
 *
 * @param options - Generation options
 * @returns JavaScript code
 */
function generateInitWrapper(options: Required<InteractivityOptions>): string {
  return `// Website Interactivity - Generated by Website Cooker
// Vanilla JavaScript - No dependencies required

(function() {
  'use strict';

  // Animation duration in milliseconds
  const ANIMATION_DURATION = ${options.animations ? '200' : '0'};

  // Accessibility features enabled
  const ACCESSIBILITY = ${options.accessibility};`;
}

/**
 * Generate dropdown JavaScript code
 *
 * @param options - Generation options
 * @returns JavaScript code
 */
function generateDropdownCode(options: Required<InteractivityOptions>): string {
  const animation = options.animations
    ? `
    dropdown.style.transition = \`opacity \${ANIMATION_DURATION}ms, transform \${ANIMATION_DURATION}ms\`;
    dropdown.style.opacity = isExpanded ? '1' : '0';
    dropdown.style.transform = isExpanded ? 'translateY(0)' : 'translateY(-8px)';`
    : '';

  const aria = options.accessibility
    ? `
    trigger.setAttribute('aria-expanded', isExpanded);`
    : '';

  return `  // Dropdown functionality
  function initDropdowns() {
    const triggers = document.querySelectorAll('[data-dropdown-trigger], [aria-haspopup="true"]');

    triggers.forEach(trigger => {
      const dropdownId = trigger.getAttribute('aria-controls') || trigger.getAttribute('data-dropdown');
      const dropdown = dropdownId ? document.getElementById(dropdownId) : trigger.nextElementSibling;

      if (!dropdown) return;

      // Hide dropdown initially
      dropdown.style.display = 'none';${animation}

      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isExpanded = dropdown.style.display !== 'none';

        // Close all other dropdowns
        document.querySelectorAll('[data-dropdown-trigger], [aria-haspopup="true"]').forEach(otherTrigger => {
          if (otherTrigger !== trigger) {
            const otherId = otherTrigger.getAttribute('aria-controls') || otherTrigger.getAttribute('data-dropdown');
            const otherDropdown = otherId ? document.getElementById(otherId) : otherTrigger.nextElementSibling;
            if (otherDropdown) {
              otherDropdown.style.display = 'none';${aria ? `
              otherTrigger.setAttribute('aria-expanded', 'false');` : ''}
            }
          }
        });

        // Toggle current dropdown
        dropdown.style.display = isExpanded ? 'none' : 'block';${aria}${animation}
      });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
      document.querySelectorAll('[data-dropdown-trigger], [aria-haspopup="true"]').forEach(trigger => {
        const dropdownId = trigger.getAttribute('aria-controls') || trigger.getAttribute('data-dropdown');
        const dropdown = dropdownId ? document.getElementById(dropdownId) : trigger.nextElementSibling;
        if (dropdown) {
          dropdown.style.display = 'none';${aria ? `
          trigger.setAttribute('aria-expanded', 'false');` : ''}
        }
      });
    });${
      options.accessibility
        ? `

    // Keyboard navigation
    triggers.forEach(trigger => {
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const dropdownId = trigger.getAttribute('aria-controls') || trigger.getAttribute('data-dropdown');
          const dropdown = dropdownId ? document.getElementById(dropdownId) : trigger.nextElementSibling;
          if (dropdown) {
            dropdown.style.display = 'none';
            trigger.setAttribute('aria-expanded', 'false');
            trigger.focus();
          }
        }
      });
    });`
        : ''
    }
  }`;
}

/**
 * Generate modal JavaScript code
 *
 * @param options - Generation options
 * @returns JavaScript code
 */
function generateModalCode(options: Required<InteractivityOptions>): string {
  const animation = options.animations
    ? `
      modal.style.transition = \`opacity \${ANIMATION_DURATION}ms\`;
      setTimeout(() => {
        modal.style.opacity = '1';
      }, 10);`
    : '';

  const aria = options.accessibility
    ? `
      modal.setAttribute('aria-hidden', 'false');

      // Trap focus within modal
      const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }`
    : '';

  return `  // Modal functionality
  function initModals() {
    const modalTriggers = document.querySelectorAll('[data-modal-trigger], [data-modal-open]');
    const modals = document.querySelectorAll('[data-modal], [role="dialog"]');

    // Hide all modals initially
    modals.forEach(modal => {
      modal.style.display = 'none';${aria ? `
      modal.setAttribute('aria-hidden', 'true');` : ''}
    });

    // Open modal handlers
    modalTriggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = trigger.getAttribute('data-modal-trigger') || trigger.getAttribute('data-modal-open') || trigger.getAttribute('aria-controls');
        const modal = modalId ? document.getElementById(modalId) : null;

        if (modal) {
          modal.style.display = 'flex';${animation}${aria}
        }
      });
    });

    // Close modal handlers
    modals.forEach(modal => {
      const closeButtons = modal.querySelectorAll('[data-modal-close], .modal-close, [aria-label*="close" i]');

      closeButtons.forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          modal.style.display = 'none';${aria ? `
          modal.setAttribute('aria-hidden', 'true');` : ''}
        });
      });

      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';${aria ? `
          modal.setAttribute('aria-hidden', 'true');` : ''}
        }
      });${
        options.accessibility
          ? `

      // Close on Escape key
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          modal.style.display = 'none';
          modal.setAttribute('aria-hidden', 'true');
        }
      });`
          : ''
      }
    });
  }`;
}

/**
 * Generate mobile menu JavaScript code
 *
 * @param options - Generation options
 * @returns JavaScript code
 */
function generateMobileMenuCode(
  options: Required<InteractivityOptions>
): string {
  const animation = options.animations
    ? `
      menu.style.transition = \`transform \${ANIMATION_DURATION}ms\`;
      menu.style.transform = isOpen ? 'translateX(0)' : 'translateX(-100%)';`
    : '';

  const aria = options.accessibility
    ? `
      toggle.setAttribute('aria-expanded', isOpen);
      menu.setAttribute('aria-hidden', !isOpen);`
    : '';

  return `  // Mobile menu functionality
  function initMobileMenu() {
    const toggles = document.querySelectorAll('[data-mobile-menu-toggle], .hamburger, .menu-toggle');
    const menu = document.querySelector('[data-mobile-menu], .mobile-menu, .mobile-nav');

    if (!menu) return;

    // Hide menu initially on mobile
    if (window.innerWidth < 768) {
      menu.style.display = 'block';
      menu.style.transform = 'translateX(-100%)';${animation}
    }

    toggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isOpen = menu.style.transform === 'translateX(0px)' || menu.style.transform === '';
        ${aria}${animation}

        // Toggle hamburger icon if it exists
        toggle.classList.toggle('active');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !Array.from(toggles).some(t => t.contains(e.target))) {
        menu.style.transform = 'translateX(-100%)';${aria ? `
        toggles.forEach(toggle => {
          toggle.setAttribute('aria-expanded', 'false');
          toggle.classList.remove('active');
        });
        menu.setAttribute('aria-hidden', 'true');` : ''}
      }
    });

    // Close menu on window resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        menu.style.transform = '';
        menu.style.display = '';
      } else {
        menu.style.display = 'block';
      }
    });
  }`;
}

/**
 * Generate accordion JavaScript code
 *
 * @param options - Generation options
 * @returns JavaScript code
 */
function generateAccordionCode(
  options: Required<InteractivityOptions>
): string {
  const animation = options.animations
    ? `
        content.style.transition = \`max-height \${ANIMATION_DURATION}ms, opacity \${ANIMATION_DURATION}ms\`;
        content.style.maxHeight = isExpanded ? content.scrollHeight + 'px' : '0';
        content.style.opacity = isExpanded ? '1' : '0';`
    : `
        content.style.maxHeight = isExpanded ? 'none' : '0';`;

  const aria = options.accessibility
    ? `
        trigger.setAttribute('aria-expanded', isExpanded);`
    : '';

  return `  // Accordion functionality
  function initAccordions() {
    const triggers = document.querySelectorAll('[data-accordion-trigger], .accordion-trigger, button[aria-controls]');

    triggers.forEach(trigger => {
      const contentId = trigger.getAttribute('aria-controls') || trigger.getAttribute('data-accordion');
      const content = contentId ? document.getElementById(contentId) : trigger.nextElementSibling;

      if (!content) return;

      // Hide content initially
      content.style.overflow = 'hidden';
      content.style.maxHeight = '0';${animation ? `
      content.style.opacity = '0';` : ''}${aria}

      trigger.addEventListener('click', (e) => {
        e.preventDefault();

        const isExpanded = content.style.maxHeight !== '0px' && content.style.maxHeight !== '0';
        ${aria}${animation}
      });${
        options.accessibility
          ? `

      // Keyboard navigation
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          trigger.click();
        }
      });`
          : ''
      }
    });
  }`;
}

/**
 * Generate initialization call
 *
 * @returns JavaScript code
 */
function generateInitCall(): string {
  return `  // Initialize all interactivity when DOM is ready
  function init() {
    if (typeof initDropdowns !== 'undefined') initDropdowns();
    if (typeof initModals !== 'undefined') initModals();
    if (typeof initMobileMenu !== 'undefined') initMobileMenu();
    if (typeof initAccordions !== 'undefined') initAccordions();
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();`;
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Check if HTML contains any interactive elements
 *
 * @param html - HTML content
 * @returns True if interactive elements are detected
 */
export function hasInteractiveElements(html: string): boolean {
  const elements = detectInteractiveElements(html);
  return elements.length > 0;
}

/**
 * Get summary of detected interactive elements
 *
 * @param html - HTML content
 * @returns Summary object
 */
export function getInteractivitySummary(html: string): {
  hasDropdowns: boolean;
  hasModals: boolean;
  hasMobileMenu: boolean;
  hasAccordions: boolean;
  totalElements: number;
} {
  const elements = detectInteractiveElements(html);
  const byType: Record<InteractiveElementType, number> = {
    dropdown: 0,
    modal: 0,
    'mobile-menu': 0,
    accordion: 0,
  };

  for (const element of elements) {
    byType[element.type]++;
  }

  return {
    hasDropdowns: byType.dropdown > 0,
    hasModals: byType.modal > 0,
    hasMobileMenu: byType['mobile-menu'] > 0,
    hasAccordions: byType.accordion > 0,
    totalElements: elements.length,
  };
}
