'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchInputProps {
  placeholder: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
}

export function SearchInput({
  placeholder,
  onSearch,
  debounceMs = 300,
  className = '',
  disabled = false,
}: SearchInputProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the search value
  const debouncedValue = useDebounce(value, debounceMs);

  // Handle search when debounced value changes
  useEffect(() => {
    if (debouncedValue !== value) {
      setIsLoading(true);
      onSearch(debouncedValue);
      // Reset loading state after a short delay
      const timer = setTimeout(() => setIsLoading(false), 100);
      return () => clearTimeout(timer);
    }
  }, [debouncedValue, onSearch, value]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
  };

  // Handle key down for additional functionality
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setValue('');
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`pl-10 pr-4 ${isLoading ? 'animate-pulse' : ''}`}
        style={{
          // Ensure focus is maintained during search operations
          outline: isFocused ? '2px solid #3b82f6' : 'none',
          outlineOffset: '2px',
        }}
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      )}
    </div>
  );
}
