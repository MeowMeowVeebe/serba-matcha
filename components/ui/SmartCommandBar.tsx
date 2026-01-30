"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  category: "navigation" | "action" | "search" | "recent" | "suggestion";
  action: () => void;
  keywords?: string[];
}

interface SmartCommandBarProps {
  commands: CommandItem[];
  placeholder?: string;
  maxResults?: number;
  onClose?: () => void;
  recentLimit?: number;
}

export function SmartCommandBar({
  commands,
  placeholder = "Type a command or search...",
  maxResults = 10,
  onClose,
  recentLimit = 5,
}: SmartCommandBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load recent commands from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("matcha-recent-commands");
    if (saved) setRecentCommands(JSON.parse(saved));
  }, []);

  // Keyboard shortcut to open (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Fuzzy search implementation
  const fuzzyMatch = useCallback((text: string, pattern: string): number => {
    if (!pattern) return 1;
    const lowerText = text.toLowerCase();
    const lowerPattern = pattern.toLowerCase();
    
    if (lowerText.includes(lowerPattern)) return 2;
    
    let score = 0;
    let patternIdx = 0;
    for (let i = 0; i < lowerText.length && patternIdx < lowerPattern.length; i++) {
      if (lowerText[i] === lowerPattern[patternIdx]) {
        score += 1;
        patternIdx++;
      }
    }
    return patternIdx === lowerPattern.length ? score / lowerPattern.length : 0;
  }, []);

  // Filter and sort commands
  const filteredCommands = useMemo(() => {
    let results: (CommandItem & { score: number })[] = [];

    // Add suggestions based on context
    const contextSuggestions = getContextSuggestions();
    
    commands.forEach(cmd => {
      const labelScore = fuzzyMatch(cmd.label, query);
      const descScore = cmd.description ? fuzzyMatch(cmd.description, query) * 0.5 : 0;
      const keywordScore = cmd.keywords?.reduce((max, kw) => Math.max(max, fuzzyMatch(kw, query)), 0) || 0;
      const score = Math.max(labelScore, descScore, keywordScore);
      
      if (score > 0 || !query) {
        const isRecent = recentCommands.includes(cmd.id);
        results.push({ 
          ...cmd, 
          score: score + (isRecent ? 1 : 0),
          category: isRecent && !query ? "recent" : cmd.category,
        });
      }
    });

    // Sort by score and category priority
    const categoryPriority = { recent: 0, suggestion: 1, action: 2, navigation: 3, search: 4 };
    results.sort((a, b) => {
      if (!query) {
        return categoryPriority[a.category] - categoryPriority[b.category];
      }
      return b.score - a.score;
    });

    return results.slice(0, maxResults);
  }, [commands, query, fuzzyMatch, recentCommands, maxResults]);

  // Get context-aware suggestions
  function getContextSuggestions(): CommandItem[] {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const suggestions: CommandItem[] = [];

    if (path.includes("dashboard")) {
      suggestions.push({
        id: "suggestion-refresh",
        label: "Refresh Dashboard Data",
        icon: "🔄",
        category: "suggestion",
        action: () => window.location.reload(),
      });
    }

    if (path.includes("analytics") || path.includes("insights")) {
      suggestions.push({
        id: "suggestion-export",
        label: "Export Analytics Report",
        icon: "📊",
        category: "suggestion",
        action: () => console.log("Export report"),
      });
    }

    return suggestions;
  }

  // Execute command
  const executeCommand = useCallback((cmd: CommandItem) => {
    // Save to recent
    const newRecent = [cmd.id, ...recentCommands.filter(id => id !== cmd.id)].slice(0, recentLimit);
    setRecentCommands(newRecent);
    localStorage.setItem("matcha-recent-commands", JSON.stringify(newRecent));

    // Execute
    cmd.action();
    setIsOpen(false);
    setQuery("");
  }, [recentCommands, recentLimit]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
      case "Tab":
        e.preventDefault();
        if (filteredCommands.length > 0) {
          setQuery(filteredCommands[0].label);
        }
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const selectedEl = listRef.current?.children[selectedIndex] as HTMLElement;
    selectedEl?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, typeof filteredCommands> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const categoryLabels: Record<string, string> = {
    recent: "Recent",
    suggestion: "Suggestions",
    action: "Actions",
    navigation: "Navigation",
    search: "Search Results",
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="smart-command-overlay" onClick={() => setIsOpen(false)}>
      <div className="smart-command-bar glass-card" onClick={e => e.stopPropagation()}>
        <div className="smart-command-bar__input-wrapper">
          <svg className="smart-command-bar__icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
            <path d="M13 13L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="smart-command-bar__input"
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="smart-command-bar__shortcut">ESC</kbd>
        </div>

        {filteredCommands.length > 0 && (
          <div ref={listRef} className="smart-command-bar__list">
            {Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} className="smart-command-bar__group">
                <div className="smart-command-bar__group-label">{categoryLabels[category]}</div>
                {items.map((cmd, idx) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  return (
                    <button
                      key={cmd.id}
                      className={`smart-command-bar__item ${globalIndex === selectedIndex ? "smart-command-bar__item--selected" : ""}`}
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      {cmd.icon && <span className="smart-command-bar__item-icon">{cmd.icon}</span>}
                      <div className="smart-command-bar__item-content">
                        <span className="smart-command-bar__item-label">{cmd.label}</span>
                        {cmd.description && (
                          <span className="smart-command-bar__item-description">{cmd.description}</span>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd className="smart-command-bar__item-shortcut">{cmd.shortcut}</kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {query && filteredCommands.length === 0 && (
          <div className="smart-command-bar__empty">
            <p>No results found for &quot;{query}&quot;</p>
            <p className="smart-command-bar__empty-hint">Try different keywords or browse commands</p>
          </div>
        )}

        <div className="smart-command-bar__footer">
          <span><kbd>↑↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Select</span>
          <span><kbd>Tab</kbd> Autocomplete</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(modalContent, document.body);
}

// Hook to use command bar
export function useCommandBar() {
  const [commands, setCommands] = useState<CommandItem[]>([]);

  const registerCommand = useCallback((cmd: CommandItem) => {
    setCommands(prev => [...prev.filter(c => c.id !== cmd.id), cmd]);
  }, []);

  const unregisterCommand = useCallback((id: string) => {
    setCommands(prev => prev.filter(c => c.id !== id));
  }, []);

  return { commands, registerCommand, unregisterCommand };
}

export type { CommandItem };
