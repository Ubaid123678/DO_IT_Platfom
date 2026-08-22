"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Select, type SelectOption } from "../ui/Select";

export interface FilterBarSearch {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface FilterBarFilter {
  key: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}

export interface FilterBarProps {
  search?: FilterBarSearch;
  filters?: FilterBarFilter[];
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
}

export function FilterBar({ search, filters = [], onClearFilters, hasActiveFilters = false }: FilterBarProps) {
  const [localSearch, setLocalSearch] = useState(search?.value ?? "");
  const [prevSearchValue, setPrevSearchValue] = useState(search?.value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (search?.value !== prevSearchValue) {
    setPrevSearchValue(search?.value);
    setLocalSearch(search?.value ?? "");
  }

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search?.onChange(value), 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      {search && (
        <div className="relative w-full min-w-[200px] max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-hint" />
          <input
            type="text"
            value={localSearch}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder={search.placeholder ?? "Search…"}
            className="h-10 w-full rounded-[10px] border border-border bg-surface pl-9 pr-8 text-sm text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-text-hint hover:text-text-primary"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {filters.slice(0, 3).map((filter) => (
        <div key={filter.key} className="w-full sm:w-auto">
          <Select
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            options={filter.options}
            aria-label={filter.label}
            className="sm:w-[180px]"
          />
        </div>
      ))}

      {onClearFilters && hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-medium text-text-secondary transition-colors hover:bg-bg"
        >
          <X className="h-4 w-4" />
          Clear filters
        </button>
      )}
    </div>
  );
}
