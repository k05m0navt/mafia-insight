'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface YearFilterProps {
  selectedYear: number | null;
  onYearChange: (year: number | null) => void;
  availableYears?: number[];
  className?: string;
}

export function YearFilter({
  selectedYear,
  onYearChange,
  availableYears,
  className = '',
}: YearFilterProps) {
  // Generate years from 2020 to current year + 1
  const currentYear = new Date().getFullYear();
  const defaultYears = Array.from(
    { length: currentYear - 2020 + 2 },
    (_, i) => currentYear + 1 - i
  );

  const years = availableYears || defaultYears;

  const handleValueChange = (value: string) => {
    if (value === 'all') {
      onYearChange(null);
    } else {
      onYearChange(parseInt(value));
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Filter by Year
      </label>
      <Select
        value={selectedYear ? selectedYear.toString() : 'all'}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years</SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
