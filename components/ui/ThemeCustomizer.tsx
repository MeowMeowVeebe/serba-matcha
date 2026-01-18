"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

export type ThemeMode = "light" | "dark" | "high-contrast" | "sepia" | "ocean";
export type FontSize = "small" | "medium" | "large" | "extra-large";

export type ThemePreferences = {
  mode: ThemeMode;
  accentColor: string;
  fontSize: FontSize;
  dyslexiaFont: boolean;
};

const THEME_PRESETS = {
  light: { name: "Light", bg: "#FFFFFF", text: "#222222" },
  dark: { name: "Dark", bg: "#1A1F1A", text: "#FFFFFF" },
  "high-contrast": { name: "High Contrast", bg: "#000000", text: "#FFFF00" },
  sepia: { name: "Sepia", bg: "#F4ECD8", text: "#5C4B37" },
  ocean: { name: "Ocean Blue", bg: "#E8F4F8", text: "#0D3B52" },
};

const ACCENT_COLORS = [
  { name: "Matcha Green", value: "#6B9C6F" },
  { name: "Ocean Blue", value: "#3B82F6" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Rose", value: "#EC4899" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Teal", value: "#14B8A6" },
];

const FONT_SIZES = {
  small: "14px",
  medium: "16px",
  large: "18px",
  "extra-large": "20px",
};

const THEME_PREFERENCES_STORAGE_KEY = "theme-preferences";

const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  mode: "light",
  accentColor: "#6B9C6F",
  fontSize: "medium",
  dyslexiaFont: false,
};

function applyTheme(prefs: ThemePreferences) {
  const root = document.documentElement;

  // Apply theme mode
  root.setAttribute("data-theme", prefs.mode);

  // Apply accent color
  root.style.setProperty("--color-primary", prefs.accentColor);

  // Apply font size
  root.style.setProperty("--base-font-size", FONT_SIZES[prefs.fontSize]);

  // Apply dyslexia font
  if (prefs.dyslexiaFont) {
    root.style.setProperty("--font-family", "OpenDyslexic, Arial, sans-serif");
  } else {
    root.style.setProperty("--font-family", "Inter, sans-serif");
  }

  // Apply specific theme colors
  if (prefs.mode === "high-contrast") {
    root.style.setProperty("--color-bg", "#000000");
    root.style.setProperty("--color-text", "#FFFF00");
    root.style.setProperty("--color-border", "#FFFF00");
  } else if (prefs.mode === "sepia") {
    root.style.setProperty("--color-bg", "#F4ECD8");
    root.style.setProperty("--color-text", "#5C4B37");
    root.style.setProperty("--color-card", "#FAF5E8");
  } else if (prefs.mode === "ocean") {
    root.style.setProperty("--color-bg", "#E8F4F8");
    root.style.setProperty("--color-text", "#0D3B52");
    root.style.setProperty("--color-card", "#FFFFFF");
  }
}

export function ThemeCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState<ThemePreferences>(DEFAULT_THEME_PREFERENCES);

  const readSavedPreferences = useCallback((): ThemePreferences | null => {
    if (typeof window === "undefined") return null;

    try {
      const saved = window.localStorage.getItem(THEME_PREFERENCES_STORAGE_KEY);
      if (!saved) return null;

      const parsed = JSON.parse(saved) as Partial<ThemePreferences>;

      const mode = parsed.mode;
      const fontSize = parsed.fontSize;

      const isValidMode =
        mode === "light" || mode === "dark" || mode === "high-contrast" || mode === "sepia" || mode === "ocean";
      const isValidFontSize =
        fontSize === "small" || fontSize === "medium" || fontSize === "large" || fontSize === "extra-large";

      return {
        ...DEFAULT_THEME_PREFERENCES,
        ...(isValidMode ? { mode } : null),
        ...(typeof parsed.accentColor === "string" ? { accentColor: parsed.accentColor } : null),
        ...(isValidFontSize ? { fontSize } : null),
        ...(typeof parsed.dyslexiaFont === "boolean" ? { dyslexiaFont: parsed.dyslexiaFont } : null),
      };
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    // We intentionally sync state from localStorage after hydration.
    const saved = readSavedPreferences();
    const next = saved ?? DEFAULT_THEME_PREFERENCES;
    setPreferences(next);
    applyTheme(next);
  }, [readSavedPreferences]);

  const updatePreferences = (updates: Partial<ThemePreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    applyTheme(newPrefs);

    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(THEME_PREFERENCES_STORAGE_KEY, JSON.stringify(newPrefs));
    } catch {
      // Ignore write failures (private mode/quota/etc)
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(true)}
        title="Theme Customizer"
      >
        🎨
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Theme Customizer"
        size="lg"
      >
        <div style={{ padding: "1.5rem" }}>
          {/* Theme Mode */}
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1rem", fontSize: "1rem", fontWeight: 600 }}>
              Theme Mode
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem" }}>
              {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => updatePreferences({ mode: key as ThemeMode })}
                  style={{
                    padding: "1rem",
                    border: preferences.mode === key ? "2px solid var(--color-primary)" : "1px solid var(--color-gray-300)",
                    borderRadius: "0.5rem",
                    background: preset.bg,
                    color: preset.text,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{preset.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1rem", fontSize: "1rem", fontWeight: 600 }}>
              Accent Color
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "0.75rem" }}>
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => updatePreferences({ accentColor: color.value })}
                  style={{
                    padding: "0.75rem",
                    border: preferences.accentColor === color.value ? "2px solid var(--color-primary)" : "1px solid var(--color-gray-300)",
                    borderRadius: "0.5rem",
                    background: "white",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: color.value,
                    }}
                  />
                  <span style={{ fontSize: "0.75rem" }}>{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1rem", fontSize: "1rem", fontWeight: 600 }}>
              Font Size
            </h3>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {Object.entries(FONT_SIZES).map(([key, size]) => (
                <Button
                  key={key}
                  variant={preferences.fontSize === key ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => updatePreferences({ fontSize: key as FontSize })}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1).replace("-", " ")}
                </Button>
              ))}
            </div>
          </div>

          {/* Dyslexia Font */}
          <div style={{ marginBottom: "2rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={preferences.dyslexiaFont}
                onChange={(e) => updatePreferences({ dyslexiaFont: e.target.checked })}
                style={{ width: "20px", height: "20px" }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>Dyslexia-Friendly Font</div>
                <div style={{ fontSize: "0.875rem", color: "var(--color-gray-600)" }}>
                  Use OpenDyslexic font for better readability
                </div>
              </div>
            </label>
          </div>

          {/* Preview */}
          <div
            style={{
              padding: "1.5rem",
              border: "1px solid var(--color-gray-300)",
              borderRadius: "0.5rem",
              background: "var(--color-bg)",
            }}
          >
            <h4 style={{ marginBottom: "0.5rem", color: "var(--color-primary)" }}>Preview</h4>
            <p style={{ marginBottom: "0.5rem" }}>
              This is how your text will look with the current settings.
            </p>
            <Button variant="primary" size="sm">
              Sample Button
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
