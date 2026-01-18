"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";

interface KeyBinding {
  key: string;
  description: string;
  action: () => void;
  category: "navigation" | "action" | "editing" | "view";
}

interface VimNavigationContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  mode: "normal" | "insert" | "visual";
  setMode: (mode: "normal" | "insert" | "visual") => void;
  registerBinding: (binding: KeyBinding) => void;
  unregisterBinding: (key: string) => void;
  bindings: KeyBinding[];
  showCheatsheet: boolean;
  setShowCheatsheet: (show: boolean) => void;
}

const VimNavigationContext = createContext<VimNavigationContextType | null>(null);

// Default bindings
const defaultBindings: KeyBinding[] = [
  { key: "j", description: "Move down", action: () => {}, category: "navigation" },
  { key: "k", description: "Move up", action: () => {}, category: "navigation" },
  { key: "h", description: "Move left", action: () => {}, category: "navigation" },
  { key: "l", description: "Move right", action: () => {}, category: "navigation" },
  { key: "gg", description: "Go to top", action: () => window.scrollTo({ top: 0, behavior: "smooth" }), category: "navigation" },
  { key: "G", description: "Go to bottom", action: () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), category: "navigation" },
  { key: "/", description: "Search", action: () => {}, category: "action" },
  { key: "?", description: "Show help", action: () => {}, category: "view" },
  { key: "Escape", description: "Normal mode", action: () => {}, category: "editing" },
  { key: "i", description: "Insert mode", action: () => {}, category: "editing" },
];

export function VimNavigationProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("matcha-vim-mode") === "true";
    }
    return false;
  });
  const [mode, setMode] = useState<"normal" | "insert" | "visual">("normal");
  const [bindings, setBindings] = useState<KeyBinding[]>(defaultBindings);
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const [keyBuffer, setKeyBuffer] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Save preference
  useEffect(() => {
    localStorage.setItem("matcha-vim-mode", String(enabled));
  }, [enabled]);

  // Handle key presses
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if typing in input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        if (e.key === "Escape") {
          setMode("normal");
          (target as HTMLInputElement).blur();
        }
        return;
      }

      // Handle Escape
      if (e.key === "Escape") {
        setMode("normal");
        setKeyBuffer("");
        setShowCheatsheet(false);
        return;
      }

      // Handle ? for cheatsheet
      if (e.key === "?" && !e.shiftKey) {
        e.preventDefault();
        setShowCheatsheet(prev => !prev);
        return;
      }

      // Handle / for search
      if (e.key === "/" && mode === "normal") {
        e.preventDefault();
        const searchInput = document.querySelector("[data-vim-search]") as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          setMode("insert");
        }
        return;
      }

      // Handle insert mode
      if (e.key === "i" && mode === "normal") {
        setMode("insert");
        return;
      }

      // Buffer multi-key commands
      const newBuffer = keyBuffer + e.key;
      
      // Check for matching binding
      const exactMatch = bindings.find(b => b.key === newBuffer);
      if (exactMatch) {
        e.preventDefault();
        exactMatch.action();
        setKeyBuffer("");
        return;
      }

      // Check if buffer could lead to a match
      const possibleMatch = bindings.some(b => b.key.startsWith(newBuffer));
      if (possibleMatch) {
        setKeyBuffer(newBuffer);
        // Clear buffer after timeout
        setTimeout(() => setKeyBuffer(""), 1000);
        return;
      }

      // Handle navigation keys
      if (mode === "normal") {
        const listItems = document.querySelectorAll("[data-vim-item]");
        
        switch (e.key) {
          case "j":
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, listItems.length - 1));
            break;
          case "k":
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
            break;
          case "Enter":
            e.preventDefault();
            (listItems[selectedIndex] as HTMLElement)?.click();
            break;
          case "g":
            if (keyBuffer === "g") {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setSelectedIndex(0);
              setKeyBuffer("");
            } else {
              setKeyBuffer("g");
            }
            break;
          case "G":
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
            setSelectedIndex(listItems.length - 1);
            break;
        }
      }

      setKeyBuffer("");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, mode, bindings, keyBuffer, selectedIndex]);

  // Update selected item visual
  useEffect(() => {
    const items = document.querySelectorAll("[data-vim-item]");
    items.forEach((item, i) => {
      if (i === selectedIndex) {
        item.classList.add("vim-selected");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("vim-selected");
      }
    });
  }, [selectedIndex]);

  const registerBinding = useCallback((binding: KeyBinding) => {
    setBindings(prev => [...prev.filter(b => b.key !== binding.key), binding]);
  }, []);

  const unregisterBinding = useCallback((key: string) => {
    setBindings(prev => prev.filter(b => b.key !== key));
  }, []);

  return (
    <VimNavigationContext.Provider
      value={{
        enabled,
        setEnabled,
        mode,
        setMode,
        registerBinding,
        unregisterBinding,
        bindings,
        showCheatsheet,
        setShowCheatsheet,
      }}
    >
      {children}
      {enabled && <VimModeIndicator mode={mode} keyBuffer={keyBuffer} />}
      {showCheatsheet && <VimCheatsheet />}
    </VimNavigationContext.Provider>
  );
}

export function useVimNavigation() {
  const context = useContext(VimNavigationContext);
  if (!context) {
    throw new Error("useVimNavigation must be used within VimNavigationProvider");
  }
  return context;
}

// Mode Indicator
function VimModeIndicator({ mode, keyBuffer }: { mode: string; keyBuffer: string }) {
  return (
    <div className={`vim-mode-indicator vim-mode-indicator--${mode}`}>
      <span className="vim-mode-indicator__mode">{mode.toUpperCase()}</span>
      {keyBuffer && <span className="vim-mode-indicator__buffer">{keyBuffer}</span>}
    </div>
  );
}

// Cheatsheet Modal
function VimCheatsheet() {
  const { bindings, setShowCheatsheet } = useVimNavigation();

  const categories = {
    navigation: "Navigation",
    action: "Actions",
    editing: "Editing",
    view: "View",
  };

  const grouped = bindings.reduce((acc, b) => {
    if (!acc[b.category]) acc[b.category] = [];
    acc[b.category].push(b);
    return acc;
  }, {} as Record<string, KeyBinding[]>);

  return (
    <div className="vim-cheatsheet-overlay" onClick={() => setShowCheatsheet(false)}>
      <div className="vim-cheatsheet" onClick={e => e.stopPropagation()}>
        <div className="vim-cheatsheet__header">
          <h3>⌨️ Keyboard Shortcuts</h3>
          <button onClick={() => setShowCheatsheet(false)}>×</button>
        </div>
        <div className="vim-cheatsheet__content">
          {Object.entries(categories).map(([key, label]) => {
            const items = grouped[key];
            if (!items?.length) return null;

            return (
              <div key={key} className="vim-cheatsheet__section">
                <h4>{label}</h4>
                <div className="vim-cheatsheet__list">
                  {items.map(binding => (
                    <div key={binding.key} className="vim-cheatsheet__item">
                      <kbd>{binding.key}</kbd>
                      <span>{binding.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="vim-cheatsheet__footer">
          Press <kbd>?</kbd> to toggle • <kbd>Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}

// Vim Toggle Button
export function VimModeToggle({ className = "" }: { className?: string }) {
  const { enabled, setEnabled } = useVimNavigation();

  return (
    <button
      className={`vim-toggle ${enabled ? "vim-toggle--active" : ""} ${className}`}
      onClick={() => setEnabled(!enabled)}
      title={enabled ? "Disable Vim mode" : "Enable Vim mode"}
    >
      <span className="vim-toggle__icon">⌨️</span>
      <span className="vim-toggle__label">Vim</span>
    </button>
  );
}

// Vim-navigable List wrapper
interface VimListProps {
  children: ReactNode;
  onSelect?: (index: number) => void;
  className?: string;
}

export function VimList({ children, onSelect, className = "" }: VimListProps) {
  return (
    <div className={`vim-list ${className}`} role="listbox">
      {children}
    </div>
  );
}

interface VimListItemProps {
  children: ReactNode;
  index: number;
  onClick?: () => void;
  className?: string;
}

export function VimListItem({ children, index, onClick, className = "" }: VimListItemProps) {
  return (
    <div
      className={`vim-list-item ${className}`}
      data-vim-item={index}
      onClick={onClick}
      role="option"
    >
      {children}
    </div>
  );
}

export type { KeyBinding };
