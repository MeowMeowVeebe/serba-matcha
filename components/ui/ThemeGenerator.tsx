"use client";

import { useState, useEffect, useCallback } from "react";

interface ColorHSL {
  h: number;
  s: number;
  l: number;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
}

interface ThemePreset {
  name: string;
  colors: ThemeColors;
  isDark: boolean;
}

const defaultPresets: ThemePreset[] = [
  {
    name: "Matcha Default",
    isDark: true,
    colors: {
      primary: "#7FB783",
      secondary: "#6B9C6F",
      accent: "#A8D5AA",
      success: "#7FB783",
      warning: "#F5A623",
      error: "#E57373",
      background: "#0F1419",
      surface: "#1A2027",
      text: "#F5F5F5",
      textMuted: "#9CA3AF",
      border: "#2D3748",
    },
  },
  {
    name: "Ocean Blue",
    isDark: true,
    colors: {
      primary: "#60A5FA",
      secondary: "#3B82F6",
      accent: "#93C5FD",
      success: "#34D399",
      warning: "#FBBF24",
      error: "#F87171",
      background: "#0F172A",
      surface: "#1E293B",
      text: "#F8FAFC",
      textMuted: "#94A3B8",
      border: "#334155",
    },
  },
  {
    name: "Sunset Orange",
    isDark: true,
    colors: {
      primary: "#FB923C",
      secondary: "#F97316",
      accent: "#FDBA74",
      success: "#4ADE80",
      warning: "#FCD34D",
      error: "#F87171",
      background: "#18120B",
      surface: "#292017",
      text: "#FEF3C7",
      textMuted: "#D6B98A",
      border: "#44382A",
    },
  },
  {
    name: "Purple Dream",
    isDark: true,
    colors: {
      primary: "#A78BFA",
      secondary: "#8B5CF6",
      accent: "#C4B5FD",
      success: "#34D399",
      warning: "#FBBF24",
      error: "#FB7185",
      background: "#13111C",
      surface: "#1F1B2E",
      text: "#F5F3FF",
      textMuted: "#A5A3B7",
      border: "#3D3654",
    },
  },
  {
    name: "Light Mode",
    isDark: false,
    colors: {
      primary: "#059669",
      secondary: "#10B981",
      accent: "#34D399",
      success: "#059669",
      warning: "#D97706",
      error: "#DC2626",
      background: "#FFFFFF",
      surface: "#F9FAFB",
      text: "#111827",
      textMuted: "#6B7280",
      border: "#E5E7EB",
    },
  },
];

function hexToHSL(hex: string): ColorHSL {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function generateComplementaryPalette(baseHex: string, isDark: boolean): ThemeColors {
  const base = hexToHSL(baseHex);
  
  return {
    primary: baseHex,
    secondary: hslToHex((base.h + 20) % 360, base.s, base.l - 10),
    accent: hslToHex(base.h, base.s - 20, base.l + 20),
    success: hslToHex(140, 60, isDark ? 55 : 40),
    warning: hslToHex(40, 90, isDark ? 60 : 50),
    error: hslToHex(0, 70, isDark ? 60 : 50),
    background: isDark ? hslToHex(base.h, 15, 8) : "#FFFFFF",
    surface: isDark ? hslToHex(base.h, 15, 12) : "#F9FAFB",
    text: isDark ? "#F5F5F5" : "#111827",
    textMuted: isDark ? "#9CA3AF" : "#6B7280",
    border: isDark ? hslToHex(base.h, 15, 20) : "#E5E7EB",
  };
}

interface ThemeGeneratorProps {
  onThemeChange?: (colors: ThemeColors) => void;
  className?: string;
}

export function ThemeGenerator({ onThemeChange, className = "" }: ThemeGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"presets" | "custom" | "export">("presets");
  const [selectedPreset, setSelectedPreset] = useState<ThemePreset>(defaultPresets[0]);
  const [customColors, setCustomColors] = useState<ThemeColors>(defaultPresets[0].colors);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [savedPresets, setSavedPresets] = useState<ThemePreset[]>([]);

  const applyTheme = useCallback((colors: ThemeColors) => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = `--theme-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });
    
    // Also apply to standard CSS variables
    root.style.setProperty("--color-primary", colors.primary);
    root.style.setProperty("--color-secondary", colors.secondary);
    root.style.setProperty("--color-accent", colors.accent);
    root.style.setProperty("--color-success", colors.success);
    root.style.setProperty("--color-warning", colors.warning);
    root.style.setProperty("--color-error", colors.error);
    root.style.setProperty("--color-bg", colors.background);
    root.style.setProperty("--color-bg-elevated", colors.surface);
    root.style.setProperty("--color-text", colors.text);
    root.style.setProperty("--color-text-muted", colors.textMuted);
    root.style.setProperty("--color-border", colors.border);
    
    onThemeChange?.(colors);
  }, [onThemeChange]);

  const handlePresetSelect = (preset: ThemePreset) => {
    setSelectedPreset(preset);
    setCustomColors(preset.colors);
    setIsDarkMode(preset.isDark);
    applyTheme(preset.colors);
  };

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    const newColors = { ...customColors, [key]: value };
    setCustomColors(newColors);
    applyTheme(newColors);
  };

  const handlePrimaryColorChange = (hex: string) => {
    const newPalette = generateComplementaryPalette(hex, isDarkMode);
    setCustomColors(newPalette);
    applyTheme(newPalette);
  };

  const saveCurrentTheme = () => {
    const name = prompt("Enter theme name:");
    if (name) {
      const newPreset: ThemePreset = {
        name,
        colors: customColors,
        isDark: isDarkMode,
      };
      setSavedPresets([...savedPresets, newPreset]);
      localStorage.setItem("matcha-custom-themes", JSON.stringify([...savedPresets, newPreset]));
    }
  };

  const exportThemeCSS = () => {
    const css = `:root {
${Object.entries(customColors).map(([key, value]) => 
  `  --theme-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value};`
).join("\n")}
}`;
    navigator.clipboard.writeText(css);
    alert("Theme CSS copied to clipboard!");
  };

  useEffect(() => {
    const saved = localStorage.getItem("matcha-custom-themes");
    if (saved) {
      setSavedPresets(JSON.parse(saved));
    }
  }, []);

  return (
    <div className={`theme-generator ${className}`}>
      <button 
        className="theme-generator__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open theme customizer"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M10 2V10L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span>Theme</span>
      </button>

      {isOpen && (
        <div className="theme-generator__panel glass-card">
          <div className="theme-generator__header">
            <h3>Theme Customizer</h3>
            <button onClick={() => setIsOpen(false)} className="theme-generator__close">×</button>
          </div>

          <div className="theme-generator__tabs">
            <button 
              className={`theme-generator__tab ${activeTab === "presets" ? "active" : ""}`}
              onClick={() => setActiveTab("presets")}
            >
              Presets
            </button>
            <button 
              className={`theme-generator__tab ${activeTab === "custom" ? "active" : ""}`}
              onClick={() => setActiveTab("custom")}
            >
              Custom
            </button>
            <button 
              className={`theme-generator__tab ${activeTab === "export" ? "active" : ""}`}
              onClick={() => setActiveTab("export")}
            >
              Export
            </button>
          </div>

          <div className="theme-generator__content">
            {activeTab === "presets" && (
              <div className="theme-generator__presets">
                {[...defaultPresets, ...savedPresets].map((preset, i) => (
                  <button
                    key={i}
                    className={`theme-preset ${selectedPreset.name === preset.name ? "active" : ""}`}
                    onClick={() => handlePresetSelect(preset)}
                  >
                    <div className="theme-preset__colors">
                      <span style={{ background: preset.colors.primary }} />
                      <span style={{ background: preset.colors.secondary }} />
                      <span style={{ background: preset.colors.accent }} />
                    </div>
                    <span className="theme-preset__name">{preset.name}</span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === "custom" && (
              <div className="theme-generator__custom">
                <div className="theme-generator__section">
                  <label>Primary Color (Auto-generates palette)</label>
                  <div className="color-picker-row">
                    <input
                      type="color"
                      value={customColors.primary}
                      onChange={(e) => handlePrimaryColorChange(e.target.value)}
                      className="color-picker"
                    />
                    <input
                      type="text"
                      value={customColors.primary}
                      onChange={(e) => handlePrimaryColorChange(e.target.value)}
                      className="color-input"
                    />
                  </div>
                </div>

                <div className="theme-generator__toggle">
                  <label>Dark Mode</label>
                  <button 
                    className={`toggle-switch ${isDarkMode ? "active" : ""}`}
                    onClick={() => {
                      setIsDarkMode(!isDarkMode);
                      handlePrimaryColorChange(customColors.primary);
                    }}
                  >
                    <span className="toggle-switch__thumb" />
                  </button>
                </div>

                <div className="theme-generator__colors-grid">
                  {Object.entries(customColors).map(([key, value]) => (
                    <div key={key} className="color-field">
                      <label>{key}</label>
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <button className="btn btn--primary" onClick={saveCurrentTheme}>
                  Save Theme
                </button>
              </div>
            )}

            {activeTab === "export" && (
              <div className="theme-generator__export">
                <h4>Export Options</h4>
                <button className="btn btn--secondary" onClick={exportThemeCSS}>
                  Copy CSS Variables
                </button>
                <pre className="theme-export-preview">
                  {Object.entries(customColors).map(([key, value]) => 
                    `--theme-${key}: ${value};`
                  ).join("\n")}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { defaultPresets, generateComplementaryPalette, hexToHSL, hslToHex };
export type { ThemeColors, ThemePreset, ColorHSL };
