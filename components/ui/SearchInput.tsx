"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { Input } from "./Input";

export type SearchInputProps = {
  onSearch: (query: string) => void;
  debounceMs?: number;
  placeholder?: string;
  minChars?: number;
  showClearButton?: boolean;
  isLoading?: boolean;
};

export function SearchInput({
  onSearch,
  debounceMs = 300,
  placeholder = "Search...",
  minChars = 0,
  showClearButton = true,
  isLoading = false,
}: SearchInputProps) {
  const [query, setQuery] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query.length >= minChars) {
      timeoutRef.current = setTimeout(() => {
        onSearch(query);
      }, debounceMs);
    } else if (query.length === 0) {
      onSearch("");
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, debounceMs, minChars, onSearch]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="search-input">
      <Input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        leftIcon={isLoading ? <span className="search-input__spinner">⏳</span> : <span>🔍</span>}
        rightIcon={
          showClearButton && query.length > 0 ? (
            <button className="search-input__clear" onClick={handleClear} aria-label="Clear search">
              ✕
            </button>
          ) : undefined
        }
      />
    </div>
  );
}

// Highlight matched text
export function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="highlight">
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}
