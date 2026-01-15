/**
 * Utility functions for the Website Cooker application
 */

/**
 * Validates if a string is a valid HTTP/HTTPS URL
 * @param url - The URL string to validate
 * @returns true if the URL is valid and uses http/https protocol
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Type for className inputs - can be string, undefined, null, false, or an object with boolean values
 */
type ClassValue = string | undefined | null | false | Record<string, boolean>;

/**
 * Merges class names together, filtering out falsy values
 * A simpler alternative to clsx/tailwind-merge for basic class name composition
 * @param inputs - Class name values to merge
 * @returns A single space-separated string of class names
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}

/**
 * Generates a unique ID string
 * @param prefix - Optional prefix for the ID
 * @returns A unique identifier string
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  const id = `${timestamp}-${randomPart}`;
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * Formats a date string or Date object for display
 * @param date - The date to format (string or Date object)
 * @returns A formatted date string
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a relative time string (e.g., "2 hours ago")
 * @param date - The date to format (string or Date object)
 * @returns A relative time string
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    return formatDate(d);
  }
}

/**
 * Extracts a display name from a URL
 * @param url - The URL to extract a name from
 * @returns A human-readable name based on the URL hostname
 */
export function getNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove 'www.' prefix if present
    const hostname = parsed.hostname.replace(/^www\./, '');
    // Capitalize first letter
    return hostname.charAt(0).toUpperCase() + hostname.slice(1);
  } catch {
    return 'Untitled';
  }
}

/**
 * Truncates a string to a maximum length with ellipsis
 * @param str - The string to truncate
 * @param maxLength - Maximum length before truncation
 * @returns The truncated string with ellipsis if needed
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Debounces a function call
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Calculates progress percentage across phases
 * @param currentPhase - Current phase number (1-based)
 * @param totalPhases - Total number of phases
 * @param phaseProgress - Progress within current phase (0-100)
 * @returns Overall progress percentage (0-100)
 */
export function calculateOverallProgress(
  currentPhase: number,
  totalPhases: number,
  phaseProgress: number
): number {
  if (currentPhase < 1) return 0;
  if (currentPhase > totalPhases) return 100;

  const completedPhasesProgress = ((currentPhase - 1) / totalPhases) * 100;
  const currentPhaseContribution = (phaseProgress / 100) * (100 / totalPhases);

  return Math.round(completedPhasesProgress + currentPhaseContribution);
}
