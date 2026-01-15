'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { cn } from '@/lib/utils';

/**
 * Props for the ColorPicker component
 */
export interface ColorPickerProps {
  /** The current color value in hex format (e.g., "#ff0000") */
  value: string;
  /** Callback fired when the color changes */
  onChange: (color: string) => void;
  /** Optional label for the color picker */
  label?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * Validates if a string is a valid hex color
 * @param color - The color string to validate
 * @returns true if valid hex color (3 or 6 digits with optional #)
 */
function isValidHexColor(color: string): boolean {
  return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

/**
 * Normalizes a hex color to the full 6-digit format with #
 * @param color - The color string to normalize
 * @returns Normalized hex color (e.g., "#ff0000")
 */
function normalizeHexColor(color: string): string {
  let hex = color.replace('#', '');

  // Expand 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  return `#${hex.toLowerCase()}`;
}

/**
 * ColorPicker component using react-colorful with hex input
 * Provides an interactive color picker with manual hex code entry.
 *
 * Features:
 * - Visual color picker via react-colorful
 * - Manual hex input with validation
 * - Color preview swatch
 * - Accessible with proper ARIA attributes
 */
export function ColorPicker({
  value,
  onChange,
  label,
  disabled = false,
  className,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isInputValid, setIsInputValid] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(value);
    setIsInputValid(true);
  }, [value]);

  // Handle click outside to close picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handlePickerChange = useCallback(
    (color: string) => {
      if (!disabled) {
        setInputValue(color);
        setIsInputValid(true);
        onChange(color);
      }
    },
    [disabled, onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);

      // Validate and update if valid
      if (isValidHexColor(newValue)) {
        setIsInputValid(true);
        const normalized = normalizeHexColor(newValue);
        onChange(normalized);
      } else {
        setIsInputValid(false);
      }
    },
    [onChange]
  );

  const handleInputBlur = useCallback(() => {
    // If input is invalid on blur, revert to the current value
    if (!isValidHexColor(inputValue)) {
      setInputValue(value);
      setIsInputValid(true);
    }
  }, [inputValue, value]);

  const togglePicker = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled]);

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">
          {label}
        </label>
      )}

      {/* Color Swatch Trigger and Hex Input */}
      <div className="flex items-center gap-2">
        {/* Color Swatch Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={togglePicker}
          disabled={disabled}
          className={cn(
            'w-10 h-10 rounded-lg border-2 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--background))]',
            {
              'border-[rgb(var(--border))] hover:border-[rgb(var(--accent))]': !disabled,
              'border-[rgb(var(--border)/0.5)] cursor-not-allowed opacity-50': disabled,
            }
          )}
          style={{ backgroundColor: value }}
          aria-label={`Select color. Current color: ${value}`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        />

        {/* Hex Input */}
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-foreground))] text-sm font-mono"
            aria-hidden="true"
          >
            #
          </span>
          <input
            type="text"
            value={inputValue.replace('#', '')}
            onChange={(e) => {
              const newValue = e.target.value;
              setInputValue(`#${newValue}`);
              if (isValidHexColor(newValue)) {
                setIsInputValid(true);
                const normalized = normalizeHexColor(newValue);
                onChange(normalized);
              } else {
                setIsInputValid(false);
              }
            }}
            onBlur={handleInputBlur}
            disabled={disabled}
            className={cn(
              'w-24 h-10 pl-7 pr-3 rounded-lg font-mono text-sm uppercase',
              'bg-[rgb(var(--background))] text-[rgb(var(--foreground))]',
              'border transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--background))]',
              {
                'border-[rgb(var(--border))] hover:border-[rgb(var(--accent))]': isInputValid && !disabled,
                'border-[rgb(var(--error))]': !isInputValid,
                'border-[rgb(var(--border)/0.5)] cursor-not-allowed opacity-50': disabled,
              }
            )}
            placeholder="000000"
            maxLength={6}
            aria-label="Hex color code"
            aria-invalid={!isInputValid}
          />
        </div>
      </div>

      {/* Color Picker Popover */}
      {isOpen && !disabled && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Color picker"
          className={cn(
            'absolute z-50 mt-2 p-3 rounded-lg shadow-lg',
            'bg-[rgb(var(--background))] border border-[rgb(var(--border))]',
            'animate-in fade-in-0 zoom-in-95 duration-200'
          )}
        >
          {/* react-colorful picker */}
          <HexColorPicker
            color={value}
            onChange={handlePickerChange}
            style={{
              width: '200px',
              height: '200px',
            }}
          />

          {/* Color Preview in Popover */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-md border border-[rgb(var(--border))]"
                style={{ backgroundColor: value }}
                aria-hidden="true"
              />
              <span className="text-sm font-mono text-[rgb(var(--muted-foreground))] uppercase">
                {value}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error message for invalid input */}
      {!isInputValid && (
        <p
          className="mt-1 text-xs text-[rgb(var(--error))]"
          role="alert"
        >
          Please enter a valid hex color
        </p>
      )}
    </div>
  );
}

export default ColorPicker;
