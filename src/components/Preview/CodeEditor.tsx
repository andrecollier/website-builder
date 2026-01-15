'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

// ====================
// MONACO TYPES
// ====================

/**
 * Monaco editor instance type (simplified for dynamic import compatibility)
 * The actual Monaco types are complex, so we define the subset we use
 */
interface IStandaloneCodeEditor {
  getValue: () => string;
  setValue: (value: string) => void;
  addCommand: (keybinding: number, handler: () => void) => void;
  onDidBlurEditorText: (listener: () => void) => void;
}

/**
 * Monaco namespace type (simplified for dynamic import compatibility)
 */
interface IMonaco {
  KeyMod: { CtrlCmd: number };
  KeyCode: { KeyS: number };
}

/**
 * OnMount callback type for Monaco editor
 */
type EditorOnMount = (editor: IStandaloneCodeEditor, monaco: IMonaco) => void;

// ====================
// DYNAMIC IMPORT
// ====================

/**
 * Monaco Editor with SSR disabled
 * Monaco doesn't support server-side rendering, so we must use dynamic import
 */
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <EditorLoadingState />,
  }
);

// ====================
// TYPES
// ====================

/**
 * Supported programming languages for the code editor
 */
export type EditorLanguage =
  | 'typescript'
  | 'javascript'
  | 'css'
  | 'scss'
  | 'html'
  | 'json'
  | 'markdown';

/**
 * Theme options for the code editor
 */
export type EditorTheme = 'vs-dark' | 'light';

/**
 * Props for the CodeEditor component
 */
export interface CodeEditorProps {
  /** The initial code to display and edit */
  code: string;
  /** Programming language for syntax highlighting and intellisense */
  language?: EditorLanguage;
  /** Theme for the editor */
  theme?: EditorTheme;
  /** Title for the editor (e.g., filename) */
  title?: string;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Height of the editor (CSS value or number in pixels) */
  height?: string | number;
  /** Minimum height of the editor */
  minHeight?: string | number;
  /** Maximum height of the editor */
  maxHeight?: string | number;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Whether to show minimap */
  showMinimap?: boolean;
  /** Whether to enable word wrap */
  wordWrap?: boolean;
  /** Font size in pixels */
  fontSize?: number;
  /** Tab size in spaces */
  tabSize?: number;
  /** Callback when code changes */
  onChange?: (value: string | undefined) => void;
  /** Callback when editor loses focus */
  onBlur?: (value: string) => void;
  /** Callback when editor is mounted */
  onMount?: EditorOnMount;
  /** Callback when save is triggered (Cmd/Ctrl + S) */
  onSave?: (value: string) => void;
  /** Whether the code has unsaved changes */
  isDirty?: boolean;
  /** Optional className for custom styling */
  className?: string;
}

// ====================
// CONFIGURATION
// ====================

/**
 * Language display labels for the header
 */
const LANGUAGE_LABELS: Record<EditorLanguage, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  css: 'CSS',
  scss: 'SCSS',
  html: 'HTML',
  json: 'JSON',
  markdown: 'Markdown',
};

/**
 * Language icons (file extension indicators)
 */
const LANGUAGE_ICONS: Record<EditorLanguage, React.ReactNode> = {
  typescript: <span className="text-[#3178c6]">.tsx</span>,
  javascript: <span className="text-[#f7df1e]">.jsx</span>,
  css: <span className="text-[#264de4]">.css</span>,
  scss: <span className="text-[#cf649a]">.scss</span>,
  html: <span className="text-[#e34c26]">.html</span>,
  json: <span className="text-[#f5a623]">.json</span>,
  markdown: <span className="text-[rgb(var(--muted-foreground))]">.md</span>,
};

/**
 * Monaco language identifiers (some differ from our types)
 */
const MONACO_LANGUAGE_MAP: Record<EditorLanguage, string> = {
  typescript: 'typescript',
  javascript: 'javascript',
  css: 'css',
  scss: 'scss',
  html: 'html',
  json: 'json',
  markdown: 'markdown',
};

/**
 * Default editor options
 */
const DEFAULT_EDITOR_OPTIONS = {
  fontSize: 13,
  fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)',
  lineHeight: 1.6,
  padding: { top: 16, bottom: 16 },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  scrollbar: {
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
  bracketPairColorization: { enabled: true },
  renderLineHighlight: 'line' as const,
  cursorBlinking: 'smooth' as const,
  cursorSmoothCaretAnimation: 'on' as const,
};

// ====================
// SUB-COMPONENTS
// ====================

/**
 * Loading state while Monaco editor initializes
 */
function EditorLoadingState() {
  return (
    <div
      className="flex items-center justify-center h-full min-h-[200px] bg-[rgb(var(--muted)/0.2)]"
      role="status"
      aria-label="Loading code editor"
    >
      <div className="flex flex-col items-center gap-3 text-[rgb(var(--muted-foreground))]">
        <svg
          className="animate-spin h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-sm">Loading editor...</span>
      </div>
    </div>
  );
}

/**
 * Unsaved changes indicator
 */
function UnsavedIndicator() {
  return (
    <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-[rgb(var(--warning)/0.2)] text-[rgb(var(--warning))]">
      <span
        className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--warning))] animate-pulse"
        aria-hidden="true"
      />
      Unsaved
    </span>
  );
}

/**
 * Editor header with title, language badge, and status
 */
function EditorHeader({
  title,
  language,
  lineCount,
  isDirty,
  readOnly,
}: {
  title?: string;
  language: EditorLanguage;
  lineCount: number;
  isDirty?: boolean;
  readOnly?: boolean;
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
        {/* Edit icon */}
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
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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

      {/* Right side: Status indicators */}
      <div className="flex items-center gap-2">
        {readOnly && (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Read-only
          </span>
        )}
        {isDirty && !readOnly && <UnsavedIndicator />}
      </div>
    </div>
  );
}

/**
 * Editor footer with keyboard shortcuts hint
 */
function EditorFooter({ readOnly }: { readOnly?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 border-t border-[rgb(var(--border))] px-3 py-1.5',
        'bg-[rgb(var(--muted)/0.2)] text-xs text-[rgb(var(--muted-foreground))]'
      )}
    >
      <div className="flex items-center gap-4">
        {!readOnly && (
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--muted))] font-mono text-[10px]">
              Cmd/Ctrl + S
            </kbd>
            <span>to save</span>
          </span>
        )}
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--muted))] font-mono text-[10px]">
            Cmd/Ctrl + F
          </kbd>
          <span>to find</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span>Monaco Editor</span>
      </div>
    </div>
  );
}

/**
 * Error state component
 */
function EditorErrorState({ message }: { message: string }) {
  return (
    <div
      className="flex items-center justify-center h-full min-h-[200px] bg-[rgb(var(--error)/0.1)] border border-[rgb(var(--error)/0.3)] rounded-lg"
      role="alert"
    >
      <div className="flex flex-col items-center gap-2 p-4 text-center">
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
          className="text-[rgb(var(--error))]"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span className="text-sm font-medium text-[rgb(var(--error))]">
          Failed to load editor
        </span>
        <span className="text-xs text-[rgb(var(--muted-foreground))]">
          {message}
        </span>
      </div>
    </div>
  );
}

// ====================
// MAIN COMPONENT
// ====================

/**
 * CodeEditor component with Monaco editor for inline code editing
 *
 * Features:
 * - Full Monaco editor with syntax highlighting and intellisense
 * - Support for TypeScript, JavaScript, CSS, HTML, JSON, and Markdown
 * - Light and dark theme support
 * - Customizable dimensions and options
 * - Save shortcut (Cmd/Ctrl + S) support
 * - Read-only mode
 * - Unsaved changes indicator
 * - SSR-safe with dynamic import
 *
 * Usage:
 * ```tsx
 * // Basic usage
 * <CodeEditor code={myCode} onChange={handleChange} />
 *
 * // With all options
 * <CodeEditor
 *   code={myCode}
 *   language="typescript"
 *   title="Component.tsx"
 *   theme="vs-dark"
 *   height={400}
 *   onChange={handleChange}
 *   onSave={handleSave}
 *   isDirty={hasUnsavedChanges}
 * />
 * ```
 */
export function CodeEditor({
  code,
  language = 'typescript',
  theme = 'vs-dark',
  title,
  readOnly = false,
  height = 400,
  minHeight,
  maxHeight,
  showLineNumbers = true,
  showMinimap = false,
  wordWrap = true,
  fontSize = 13,
  tabSize = 2,
  onChange,
  onBlur,
  onMount,
  onSave,
  isDirty = false,
  className,
}: CodeEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<IStandaloneCodeEditor | null>(null);
  const currentValueRef = useRef(code);

  // Track current value for blur callback
  useEffect(() => {
    currentValueRef.current = code;
  }, [code]);

  // Calculate line count
  const lineCount = useMemo(() => {
    return code.split('\n').length;
  }, [code]);

  // Compute editor options
  const editorOptions = useMemo(
    () => ({
      ...DEFAULT_EDITOR_OPTIONS,
      fontSize,
      tabSize,
      lineNumbers: showLineNumbers ? ('on' as const) : ('off' as const),
      minimap: { enabled: showMinimap },
      wordWrap: wordWrap ? ('on' as const) : ('off' as const),
      readOnly,
    }),
    [fontSize, tabSize, showLineNumbers, showMinimap, wordWrap, readOnly]
  );

  // Handle editor mount
  const handleEditorMount = useCallback(
    (editor: IStandaloneCodeEditor, monaco: IMonaco) => {
      editorRef.current = editor;

      // Add save command (Cmd/Ctrl + S)
      if (!readOnly && onSave) {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          const value = editor.getValue();
          onSave(value);
        });
      }

      // Handle blur event
      editor.onDidBlurEditorText(() => {
        if (onBlur) {
          const value = editor.getValue();
          onBlur(value);
        }
      });

      // Call user's onMount callback
      onMount?.(editor, monaco);
    },
    [readOnly, onSave, onBlur, onMount]
  );

  // Handle editor change
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      currentValueRef.current = value ?? '';
      onChange?.(value);
    },
    [onChange]
  );

  // Handle validation errors
  const handleValidation = useCallback((markers: unknown[]) => {
    // Only show critical errors, not warnings
    const errors = (markers as Array<{ severity: number; message: string }>).filter(
      (marker) => marker.severity >= 8
    );
    if (errors.length > 0) {
      setError(errors[0].message);
    } else {
      setError(null);
    }
  }, []);

  // Compute container styles
  const containerStyle = useMemo(() => {
    const styles: React.CSSProperties = {};
    if (height) {
      styles.height = typeof height === 'number' ? `${height}px` : height;
    }
    if (minHeight) {
      styles.minHeight = typeof minHeight === 'number' ? `${minHeight}px` : minHeight;
    }
    if (maxHeight) {
      styles.maxHeight = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;
    }
    return styles;
  }, [height, minHeight, maxHeight]);

  // If there's a critical error, show error state
  if (error) {
    return <EditorErrorState message={error} />;
  }

  return (
    <div
      className={cn(
        'flex flex-col w-full overflow-hidden rounded-lg border border-[rgb(var(--border))]',
        className
      )}
      role="region"
      aria-label={title ? `Code editor: ${title}` : 'Code editor'}
    >
      {/* Header */}
      <EditorHeader
        title={title}
        language={language}
        lineCount={lineCount}
        isDirty={isDirty}
        readOnly={readOnly}
      />

      {/* Editor Container */}
      <div
        className="flex-1 overflow-hidden"
        style={containerStyle}
      >
        <MonacoEditor
          defaultValue={code}
          language={MONACO_LANGUAGE_MAP[language]}
          theme={theme}
          options={editorOptions}
          onMount={handleEditorMount}
          onChange={handleEditorChange}
          onValidate={handleValidation}
        />
      </div>

      {/* Footer */}
      <EditorFooter readOnly={readOnly} />
    </div>
  );
}

export default CodeEditor;
