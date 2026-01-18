"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export type SearchResult = {
  id: string;
  type: "user" | "log" | "setting" | "page";
  title: string;
  description?: string;
  url: string;
  icon?: string;
  metadata?: Record<string, any>;
};

export type SearchSuggestion = {
  id: string;
  query: string;
  description?: string;
};

const SEARCH_SUGGESTIONS: SearchSuggestion[] = [
  { id: "1", query: "users created last week", description: "Find recently created users" },
  { id: "2", query: "failed logins from IP", description: "Search login failures by IP" },
  { id: "3", query: "permissions for role admin", description: "View admin permissions" },
  { id: "4", query: "audit logs security events", description: "Filter security-related logs" },
  { id: "5", query: "active sessions today", description: "View today's active sessions" },
];

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem("recent-searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        return;
      }

      if (!isOpen) return;

      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleResultClick(results[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchDebounce = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(searchDebounce);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    
    // Simulate search - in production, this would call an API
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockResults: SearchResult[] = [
      {
        id: "1",
        type: "user",
        title: "John Doe",
        description: "john@example.com - Admin",
        url: "/admin/users?id=1",
        icon: "👤",
      },
      {
        id: "2",
        type: "log",
        title: "Login Attempt Failed",
        description: "IP: 192.168.1.1 - 2 hours ago",
        url: "/admin/audit-logs?filter=failed",
        icon: "📋",
      },
      {
        id: "3",
        type: "page",
        title: "Dashboard",
        description: "View analytics and metrics",
        url: "/dashboard",
        icon: "📊",
      },
      {
        id: "4",
        type: "page",
        title: "RBAC Management",
        description: "Manage roles and permissions",
        url: "/admin/rbac",
        icon: "🔐",
      },
      {
        id: "5",
        type: "setting",
        title: "Profile Settings",
        description: "Update your profile information",
        url: "/settings",
        icon: "⚙️",
      },
    ].filter((r) => 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setResults(mockResults);
    setIsLoading(false);
  };

  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    const newRecent = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem("recent-searches", JSON.stringify(newRecent));

    router.push(result.url);
    setIsOpen(false);
    setQuery("");
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.query);
  };

  const filteredSuggestions = SEARCH_SUGGESTIONS.filter((s) =>
    s.query.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: "0.5rem 1rem",
          border: "1px solid var(--color-gray-300)",
          borderRadius: "0.375rem",
          background: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.875rem",
          color: "var(--color-gray-500)",
        }}
      >
        <span>🔍</span>
        <span>Search...</span>
        <kbd
          style={{
            padding: "0.125rem 0.375rem",
            background: "var(--color-gray-100)",
            borderRadius: "0.25rem",
            fontSize: "0.75rem",
          }}
        >
          ⌘K
        </kbd>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 9998,
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Search Modal */}
          <div
            style={{
              position: "fixed",
              top: "10%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "700px",
              maxWidth: "calc(100vw - 2rem)",
              background: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
              zIndex: 9999,
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Search Input */}
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-gray-200)" }}>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "1.25rem",
                  }}
                >
                  🔍
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search users, logs, settings, pages..."
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem 0.75rem 3rem",
                    border: "none",
                    fontSize: "1.125rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Content */}
            <div style={{ overflowY: "auto", maxHeight: "500px" }}>
              {/* Recent Searches */}
              {!query && recentSearches.length > 0 && (
                <div style={{ padding: "1rem" }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--color-gray-500)",
                      textTransform: "uppercase",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Recent Searches
                  </div>
                  {recentSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => setQuery(search)}
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        borderRadius: "0.375rem",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--color-gray-100)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <span>🕐</span>
                      <span>{search}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {query && filteredSuggestions.length > 0 && results.length === 0 && !isLoading && (
                <div style={{ padding: "1rem" }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--color-gray-500)",
                      textTransform: "uppercase",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Suggestions
                  </div>
                  {filteredSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        borderRadius: "0.375rem",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--color-gray-100)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div style={{ fontWeight: 500, marginBottom: "0.25rem" }}>
                        {suggestion.query}
                      </div>
                      {suggestion.description && (
                        <div style={{ fontSize: "0.875rem", color: "var(--color-gray-600)" }}>
                          {suggestion.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-gray-500)" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
                  <div>Searching...</div>
                </div>
              )}

              {/* Results */}
              {!isLoading && results.length > 0 && (
                <div style={{ padding: "0.5rem" }}>
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        border: "none",
                        background: index === selectedIndex ? "var(--color-primary-light, #E8F5E9)" : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        borderRadius: "0.375rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      {result.icon && <span style={{ fontSize: "1.5rem" }}>{result.icon}</span>}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, marginBottom: "0.25rem" }}>
                          {result.title}
                        </div>
                        {result.description && (
                          <div style={{ fontSize: "0.875rem", color: "var(--color-gray-600)" }}>
                            {result.description}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: "0.875rem", color: "var(--color-gray-400)" }}>
                        {result.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!isLoading && query && results.length === 0 && filteredSuggestions.length === 0 && (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-gray-500)" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🔍</div>
                  <div>No results found for "{query}"</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
