"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";

export type Command = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string[];
  category: "navigation" | "action" | "settings" | "search";
  action: () => void;
};

export type CommandPaletteProps = {
  commands?: Command[];
  recentCommands?: string[];
  onCommandExecute?: (commandId: string) => void;
};

export function CommandPalette({ commands = [], recentCommands = [], onCommandExecute }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Default commands
  const defaultCommands: Command[] = [
    {
      id: "goto-dashboard",
      label: "Go to Dashboard",
      description: "View dashboard analytics",
      icon: "📊",
      category: "navigation",
      action: () => router.push("/dashboard"),
    },
    {
      id: "goto-users",
      label: "Go to Users",
      description: "Manage users",
      icon: "👥",
      category: "navigation",
      action: () => router.push("/admin/users"),
    },
    {
      id: "goto-audit-logs",
      label: "Go to Audit Logs",
      description: "View audit logs",
      icon: "📋",
      category: "navigation",
      action: () => router.push("/admin/audit-logs"),
    },
    {
      id: "goto-rbac",
      label: "Go to RBAC",
      description: "Manage roles and permissions",
      icon: "🔐",
      category: "navigation",
      action: () => router.push("/admin/rbac"),
    },
    {
      id: "goto-profile",
      label: "Go to Profile",
      description: "View your profile",
      icon: "👤",
      category: "navigation",
      action: () => router.push("/settings"),
    },
    {
      id: "refresh-data",
      label: "Refresh Data",
      description: "Reload current page data",
      icon: "↻",
      category: "action",
      action: () => window.location.reload(),
    },
    {
      id: "toggle-theme",
      label: "Toggle Theme",
      description: "Switch between light and dark mode",
      icon: "🌓",
      category: "settings",
      action: () => {
        const body = document.body;
        body.classList.toggle("dark");
      },
    },
    {
      id: "sign-out",
      label: "Sign Out",
      description: "Log out from your account",
      icon: "🚪",
      category: "action",
      action: () => router.push("/api/auth/logout"),
    },
  ];

  const allCommands = [...defaultCommands, ...commands];

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search) return allCommands;

    const searchLower = search.toLowerCase();
    return allCommands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(searchLower) ||
        cmd.description?.toLowerCase().includes(searchLower) ||
        cmd.category.toLowerCase().includes(searchLower)
    );
  }, [search, allCommands]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open/close with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      if (!isOpen) return;

      // Close with Escape
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearch("");
        setSelectedIndex(0);
        return;
      }

      // Navigate with arrow keys
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const executeCommand = (command: Command) => {
    command.action();
    if (onCommandExecute) {
      onCommandExecute(command.id);
    }
    setIsOpen(false);
    setSearch("");
    setSelectedIndex(0);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 9998,
          animation: "fadeIn 0.2s ease-out",
        }}
        onClick={() => setIsOpen(false)}
      />

      {/* Command Palette */}
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          maxWidth: "calc(100vw - 2rem)",
          background: "white",
          borderRadius: "0.75rem",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
          zIndex: 9999,
          animation: "slideDown 0.2s ease-out",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Search Input */}
        <div style={{ padding: "1rem", borderBottom: "1px solid var(--color-gray-200)" }}>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid var(--color-gray-300)",
              borderRadius: "0.375rem",
              fontSize: "1rem",
              outline: "none",
            }}
          />
          <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--color-gray-500)" }}>
            <kbd style={{ padding: "0.125rem 0.375rem", background: "var(--color-gray-100)", borderRadius: "0.25rem" }}>
              ↑↓
            </kbd>{" "}
            to navigate,{" "}
            <kbd style={{ padding: "0.125rem 0.375rem", background: "var(--color-gray-100)", borderRadius: "0.25rem" }}>
              Enter
            </kbd>{" "}
            to select,{" "}
            <kbd style={{ padding: "0.125rem 0.375rem", background: "var(--color-gray-100)", borderRadius: "0.25rem" }}>
              Esc
            </kbd>{" "}
            to close
          </div>
        </div>

        {/* Commands List */}
        <div style={{ overflowY: "auto", maxHeight: "400px" }}>
          {Object.keys(groupedCommands).length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-gray-500)" }}>
              No commands found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category}>
                <div
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--color-gray-500)",
                    textTransform: "uppercase",
                    background: "var(--color-gray-50)",
                  }}
                >
                  {category}
                </div>
                {cmds.map((cmd, index) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <button
                      key={cmd.id}
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        border: "none",
                        background: isSelected ? "var(--color-primary-light, #E8F5E9)" : "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        textAlign: "left",
                        transition: "background 0.15s",
                      }}
                    >
                      {cmd.icon && <span style={{ fontSize: "1.5rem" }}>{cmd.icon}</span>}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{cmd.label}</div>
                        {cmd.description && (
                          <div style={{ fontSize: "0.75rem", color: "var(--color-gray-600)" }}>
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <div style={{ display: "flex", gap: "0.25rem" }}>
                          {cmd.shortcut.map((key) => (
                            <kbd
                              key={key}
                              style={{
                                padding: "0.125rem 0.375rem",
                                background: "var(--color-gray-200)",
                                borderRadius: "0.25rem",
                                fontSize: "0.75rem",
                              }}
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
