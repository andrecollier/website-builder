'use client';

import { useState, useCallback, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

// ====================
// TYPES
// ====================

/**
 * Supported programming languages for syntax highlighting
 */
export type CodeLanguage =
  | 'typescript'
  | 'tsx'
  | 'javascript'
  | 'jsx'
  | 'css'
  | 'scss'
  | 'html'
  | 'json'
  | 'markdown'
  | 'bash'
  | 'shell';

/**
 * Theme options for the code viewer
 */
export type CodeTheme = 'dark' | 'light';

/**
 * Props for the CodeViewer component
 */
export interface CodeViewerProps {
  /** The code string to display */
  code: string;
  /** Programming language for syntax highlighting */
  language?: CodeLanguage;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Starting line number (useful for displaying code snippets) */
  startingLineNumber?: number;
  /** Lines to highlight (array of line numbers) */
  highlightLines?: number[];
  /** Theme for the code display */
  theme?: CodeTheme;
  /** Title for the code block (e.g., filename) */
  title?: string;
  /** Whether to show the copy button */
  showCopy?: boolean;
  /** Maximum height before scrolling (in pixels or CSS value) */
  maxHeight?: string | number;
  /** Whether the code is collapsed by default */
  defaultCollapsed?: boolean;
  /** Whether to wrap long lines */
  wrapLongLines?: boolean;
  /** Callback when code is copied */
  onCopy?: (code: string) => void;
  /** Optional className for custom styling */
  className?: string;
}

// ====================
// CONFIGURATION
// ====================

/**
 * Language display labels for the header
 */
const LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  typescript: 'TypeScript',
  tsx: 'TSX',
  javascript: 'JavaScript',
  jsx: 'JSX',
  css: 'CSS',
  scss: 'SCSS',
  html: 'HTML',
  json: 'JSON',
  markdown: 'Markdown',
  bash: 'Bash',
  shell: 'Shell',
};

/**
 * Language icons (file extension indicators)
 */
const LANGUAGE_ICONS: Record<CodeLanguage, React.ReactNode> = {
  typescript: <span className="text-[#3178c6]">.ts</span>,
  tsx: <span className="text-[#3178c6]">.tsx</span>,
  javascript: <span className="text-[#f7df1e]">.js</span>,
  jsx: <span className="text-[#f7df1e]">.jsx</span>,
  css: <span className="text-[#264de4]">.css</span>,
  scss: <span className="text-[#cf649a]">.scss</span>,
  html: <span className="text-[#e34c26]">.html</span>,
  json: <span className="text-[#f5a623]">.json</span>,
  markdown: <span className="text-[rgb(var(--muted-foreground))]">.md</span>,
  bash: <span className="text-[#4eaa25]">.sh</span>,
  shell: <span className="text-[#4eaa25]">.sh</span>,
};

/**
 * Custom styles for line highlighting
 */
function getLineProps(
  highlightLines: number[],
  lineNumber: number
): React.HTMLAttributes<HTMLElement> {
  if (highlightLines.includes(lineNumber)) {
    return {
      style: {
        display: 'block',
        backgroundColor: 'rgba(var(--accent), 0.2)',
        borderLeft: '3px solid rgb(var(--accent))',
        marginLeft: '-3px',
        paddingLeft: '3px',
      },
    };
  }
  return {};
}

// ====================
// SUB-COMPONENTS
// ====================

/**
 * Copy button with feedback animation
 */
function CopyButton({
  onCopy,
  disabled,
}: {
  onCopy: () => void;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (disabled) return;
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopy, disabled]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all duration-200',
        'hover:bg-[rgb(var(--muted))]',
        'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-1',
        {
          'cursor-not-allowed opacity-50': disabled,
          'text-[rgb(var(--success))]': copied,
          'text-[rgb(var(--muted-foreground))]': !copied,
        }
      )}
      aria-label={copied ? 'Copied!' : 'Copy code to clipboard'}
    >
      {copied ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Copied!</span>
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

/**
 * Collapse toggle button
 */
function CollapseButton({
  isCollapsed,
  onToggle,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors duration-200',
        'text-[rgb(var(--muted-foreground))]',
        'hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
        'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-1'
      )}
      aria-expanded={!isCollapsed}
      aria-label={isCollapsed ? 'Expand code' : 'Collapse code'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('transition-transform duration-200', {
          'rotate-180': !isCollapsed,
        })}
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
      <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
    </button>
  );
}

/**
 * Code header with title, language badge, and action buttons
 */
function CodeHeader({
  title,
  language,
  lineCount,
  showCopy,
  onCopy,
  isCollapsible,
  isCollapsed,
  onToggleCollapse,
}: {
  title?: string;
  language: CodeLanguage;
  lineCount: number;
  showCopy: boolean;
  onCopy: () => void;
  isCollapsible: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 border-b border-[rgb(var(--border))] px-3 py-2',
        'bg-[rgb(var(--muted)/0.3)]'
      )}
    >
      {/* Left side: Title and language */}
      <div className="flex items-center gap-2 overflow-hidden">
        {/* File icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0 text-[rgb(var(--muted-foreground))]"
          aria-hidden="true"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>

        {/* Title or language name */}
        {title ? (
          <span className="truncate text-sm font-medium text-[rgb(var(--foreground))]">
            {title}
          </span>
        ) : (
          <span className="text-sm text-[rgb(var(--muted-foreground))]">
            {LANGUAGE_LABELS[language]}
          </span>
        )}

        {/* Language badge */}
        <span className="flex-shrink-0 rounded bg-[rgb(var(--muted))] px-1.5 py-0.5 font-mono text-[10px] font-medium">
          {LANGUAGE_ICONS[language]}
        </span>

        {/* Line count */}
        <span className="flex-shrink-0 text-xs text-[rgb(var(--muted-foreground))]">
          {lineCount} {lineCount === 1 ? 'line' : 'lines'}
        </span>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-1">
        {isCollapsible && (
          <CollapseButton
            isCollapsed={isCollapsed}
            onToggle={onToggleCollapse}
          />
        )}
        {showCopy && <CopyButton onCopy={onCopy} />}
      </div>
    </div>
  );
}

// ====================
// MAIN COMPONENT
// ====================

/**
 * CodeViewer component for displaying syntax-highlighted code
 *
 * Features:
 * - Syntax highlighting for multiple languages (TypeScript, TSX, CSS, etc.)
 * - Light and dark theme support
 * - Line numbers with optional starting offset
 * - Line highlighting for specific lines
 * - Copy to clipboard functionality
 * - Collapsible code blocks
 * - Long line wrapping option
 *
 * Usage:
 * ```tsx
 * // Basic usage
 * <CodeViewer code={myCode} language="tsx" />
 *
 * // With all options
 * <CodeViewer
 *   code={myCode}
 *   language="typescript"
 *   title="Component.tsx"
 *   showLineNumbers
 *   highlightLines={[5, 10, 15]}
 *   theme="dark"
 *   showCopy
 *   maxHeight={400}
 * />
 * ```
 */
export function CodeViewer({
  code,
  language = 'tsx',
  showLineNumbers = true,
  startingLineNumber = 1,
  highlightLines = [],
  theme = 'dark',
  title,
  showCopy = true,
  maxHeight,
  defaultCollapsed = false,
  wrapLongLines = false,
  onCopy,
  className,
}: CodeViewerProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Calculate line count
  const lineCount = useMemo(() => {
    return code.split('\n').length;
  }, [code]);

  // Determine if collapsible (more than 10 lines)
  const isCollapsible = lineCount > 10;

  // Handle copy action
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      onCopy?.(code);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      onCopy?.(code);
    }
  }, [code, onCopy]);

  // Toggle collapse
  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  // Get the appropriate theme style
  const themeStyle = theme === 'dark' ? oneDark : oneLight;

  // Custom style overrides for better integration with design system
  const customStyle: React.CSSProperties = {
    margin: 0,
    padding: '1rem',
    fontSize: '0.8125rem',
    lineHeight: '1.6',
    backgroundColor: theme === 'dark' ? 'rgb(30, 30, 30)' : 'rgb(250, 250, 250)',
    borderRadius: 0,
    ...(maxHeight && !isCollapsed
      ? {
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
          overflowY: 'auto' as const,
        }
      : {}),
  };

  // Empty state
  if (!code || code.trim() === '') {
    return (
      <div
        className={cn(
          'w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--muted)/0.3)] p-6',
          className
        )}
        role="status"
        aria-label="No code to display"
      >
        <div className="flex flex-col items-center justify-center gap-2 text-[rgb(var(--muted-foreground))]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span className="text-sm">No code to display</span>
        </div>
      </div>
    );
  }

  // Line props generator for highlighting
  const linePropsGenerator = highlightLines.length > 0
    ? (lineNumber: number) => getLineProps(highlightLines, lineNumber)
    : undefined;

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-lg border border-[rgb(var(--border))]',
        className
      )}
      role="region"
      aria-label={title ? `Code: ${title}` : 'Code viewer'}
    >
      {/* Header */}
      <CodeHeader
        title={title}
        language={language}
        lineCount={lineCount}
        showCopy={showCopy}
        onCopy={handleCopy}
        isCollapsible={isCollapsible}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Code Content */}
      {!isCollapsed && (
        <div className="overflow-x-auto">
          <SyntaxHighlighter
            language={language}
            style={themeStyle}
            showLineNumbers={showLineNumbers}
            startingLineNumber={startingLineNumber}
            wrapLines={highlightLines.length > 0 || wrapLongLines}
            wrapLongLines={wrapLongLines}
            lineProps={linePropsGenerator}
            customStyle={customStyle}
            codeTagProps={{
              style: {
                fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)',
              },
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      )}

      {/* Collapsed state */}
      {isCollapsed && (
        <div
          className={cn(
            'flex items-center justify-center py-4',
            'bg-[rgb(var(--muted)/0.2)] text-[rgb(var(--muted-foreground))]'
          )}
        >
          <button
            type="button"
            onClick={handleToggleCollapse}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors duration-200',
              'hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
              'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]'
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span>Show {lineCount} lines of code</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default CodeViewer;
