export interface SearchInputState {
  value: string;
  debouncedValue: string;
  isFocused: boolean;
  isLoading: boolean;
  lastSearchTime: Date | null;
}

export interface SearchFilters {
  query?: string;
  region?: string;
  year?: number;
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
