'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchInputProps {
  placeholder: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
  value?: string; // Allow controlled component (for syncing with URL)
  defaultValue?: string; // Allow uncontrolled with default
  showClearButton?: boolean; // Show clear button when input has value
}

export function SearchInput({
  placeholder,
  onSearch,
  debounceMs = 300,
  className = '',
  disabled = false,
  value: controlledValue,
  defaultValue = '',
  showClearButton = true,
}: SearchInputProps) {
  // Always use internal state for immediate UI feedback
  const [internalValue, setInternalValue] = useState(
    controlledValue !== undefined ? controlledValue : defaultValue
  );
  const [isFocused, setIsFocused] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isUserTypingRef = useRef(false);
  const lastTypingTimeRef = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isControlled = controlledValue !== undefined;

  // Sync internal state with controlled value when it changes from outside (e.g., URL change)
  // But only if user is not actively typing
  // CRITICAL: This must NEVER sync while user is typing to prevent input from being reset
  useEffect(() => {
    if (isControlled) {
      const timeSinceLastTyping = Date.now() - lastTypingTimeRef.current;
      // Only sync if controlled value changed AND user hasn't typed recently (5000ms - increased for safety)
      // Also, don't sync if the values are the same (to avoid unnecessary updates)
      // CRITICAL: Don't sync if user is actively typing or just finished typing
      // Also check if input is focused - if focused, user might still be typing
      if (
        controlledValue !== undefined &&
        controlledValue !== internalValue &&
        timeSinceLastTyping > 5000 && // Increased from 2000ms to 5000ms for safety
        !isUserTypingRef.current &&
        !isFocused && // Don't sync if input is focused
        !isTyping // Don't sync if typing indicator is active
      ) {
        // Only sync if the controlled value is actually different AND not during typing
        setInternalValue(controlledValue);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledValue, isControlled, isFocused, isTyping]);

  // Debounce the search value with longer delay to prevent interference when typing fast
  // Use a longer debounce to ensure user can finish typing before URL updates
  const debouncedValue = useDebounce(internalValue, debounceMs);
  const previousDebouncedValue = useRef<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle search when debounced value changes
  useEffect(() => {
    // Only trigger if debounced value actually changed
    if (debouncedValue === previousDebouncedValue.current) {
      return;
    }

    previousDebouncedValue.current = debouncedValue;

    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Mark that user finished typing after a longer delay
    // This ensures the controlled value sync won't interfere with typing
    // Increased delay to prevent race conditions
    const finishTypingTimer = setTimeout(() => {
      isUserTypingRef.current = false;
      setIsTyping(false);
    }, 500); // Increased from 100ms to 500ms for safety

    // Use transition for non-blocking search update
    // Add a small delay before calling onSearch to ensure typing has stopped
    searchTimeoutRef.current = setTimeout(() => {
      startTransition(() => {
        try {
          onSearch(debouncedValue);
        } catch (error) {
          console.error('Search error:', error);
        }
      });
    }, 50); // Small delay to batch updates

    return () => {
      clearTimeout(finishTypingTimer);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  // Handle input change - always update internal state immediately for responsive UI
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Mark that user is actively typing
    isUserTypingRef.current = true;
    lastTypingTimeRef.current = Date.now();
    setIsTyping(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to clear typing state after user stops typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, debounceMs);

    // Update internal value immediately - this is what user sees
    // This follows React best practice: synchronous state update with e.target.value
    setInternalValue(newValue);
    // The debounced effect will handle onSearch after user stops typing
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
  };

  // Handle clear button
  const handleClear = () => {
    setInternalValue('');
    onSearch('');
    inputRef.current?.focus();
    isUserTypingRef.current = false;
    setIsTyping(false);
  };

  // Handle key down for additional functionality
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    }
    // Prevent form submission on Enter key
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const hasValue = internalValue.length > 0;
  const showLoading = isTyping || isPending;
  const showClear = showClearButton && hasValue && !disabled;

  return (
    <div className={`relative ${className}`}>
      <Search
        className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors ${
          isFocused ? 'text-primary' : 'text-gray-400'
        }`}
      />
      <Input
        ref={inputRef}
        type="text"
        value={internalValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={`pl-10 ${showClear ? 'pr-10' : ''} transition-all ${
          isFocused ? 'ring-2 ring-primary/20' : ''
        }`}
        aria-label={placeholder}
      />
      {/* Loading indicator - shows when typing or pending */}
      {showLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
        </div>
      )}
      {/* Clear button - shows when there's input and not loading */}
      {showClear && !showLoading && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </Button>
      )}
    </div>
  );
}
