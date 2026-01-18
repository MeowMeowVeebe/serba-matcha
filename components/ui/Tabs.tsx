"use client";

import { useState, type ReactNode } from "react";

export type Tab = {
  key: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  disabled?: boolean;
  badge?: string | number;
};

export type TabsProps = {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (key: string) => void;
  variant?: "line" | "pills" | "enclosed";
  size?: "sm" | "md" | "lg";
};

export function Tabs({ tabs, defaultTab, onChange, variant = "line", size = "md" }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key);

  const handleTabChange = (key: string) => {
    const tab = tabs.find((t) => t.key === key);
    if (tab && !tab.disabled) {
      setActiveTab(key);
      onChange?.(key);
    }
  };

  const activeTabContent = tabs.find((tab) => tab.key === activeTab)?.content;

  return (
    <div className="tabs">
      {/* Tab List */}
      <div className={`tabs-list tabs-list--${variant} tabs-list--${size}`} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tabs-tab ${activeTab === tab.key ? "tabs-tab--active" : ""} ${
              tab.disabled ? "tabs-tab--disabled" : ""
            }`}
            onClick={() => handleTabChange(tab.key)}
            disabled={tab.disabled}
            role="tab"
            aria-selected={activeTab === tab.key}
          >
            {tab.icon && <span className="tabs-tab__icon">{tab.icon}</span>}
            <span className="tabs-tab__label">{tab.label}</span>
            {tab.badge !== undefined && <span className="tabs-tab__badge">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tabs-content" role="tabpanel">
        {activeTabContent}
      </div>
    </div>
  );
}
