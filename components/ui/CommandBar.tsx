"use client";

import type { ReactNode } from "react";

export type CommandBarItem = {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  shortcut?: string;
  variant?: "primary" | "secondary" | "ghost";
};

type Props = {
  title?: string;
  items: CommandBarItem[];
  helperText?: string;
};

export function CommandBar({ title = "Quick Actions", items, helperText }: Props) {
  return (
    <div className="command-bar" role="region" aria-label="Quick command bar">
      <div className="command-bar__left">
        <span className="command-bar__title">{title}</span>
        {helperText ? <span className="command-bar__helper">{helperText}</span> : null}
      </div>
      <div className="command-bar__actions">
        {items.map((item, index) => {
          const content = (
            <span className="command-bar__actionContent">
              {item.icon ? <span className="command-bar__icon">{item.icon}</span> : null}
              <span>{item.label}</span>
              {item.shortcut ? <span className="command-bar__shortcut">{item.shortcut}</span> : null}
            </span>
          );

          if (item.href) {
            return (
              <a
                key={`${item.label}-${index}`}
                href={item.href}
                className={`command-bar__action command-bar__action--${item.variant ?? "secondary"}`}
              >
                {content}
              </a>
            );
          }

          return (
            <button
              key={`${item.label}-${index}`}
              type="button"
              onClick={item.onClick}
              className={`command-bar__action command-bar__action--${item.variant ?? "secondary"}`}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
