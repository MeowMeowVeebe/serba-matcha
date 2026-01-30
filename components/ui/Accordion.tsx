"use client";

import { useState, type ReactNode } from "react";

export type AccordionItem = {
  key: string;
  title: string;
  content: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};

export type AccordionProps = {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  variant?: "default" | "bordered" | "separated";
};

export function Accordion({ items, allowMultiple = false, defaultOpen = [], variant = "default" }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(defaultOpen));

  const toggleItem = (key: string) => {
    const item = items.find((i) => i.key === key);
    if (item?.disabled) return;

    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        if (!allowMultiple) {
          next.clear();
        }
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className={`accordion accordion--${variant}`}>
      {items.map((item, index) => {
        const isOpen = openItems.has(item.key);
        const isLast = index === items.length - 1;

        return (
          <div
            key={item.key}
            className={`accordion-item ${isOpen ? "accordion-item--open" : ""} ${
              item.disabled ? "accordion-item--disabled" : ""
            } ${!isLast ? "accordion-item--not-last" : ""}`}
          >
            <button
              className="accordion-trigger"
              onClick={() => toggleItem(item.key)}
              disabled={item.disabled}
              aria-expanded={isOpen}
            >
              {item.icon && <span className="accordion-icon">{item.icon}</span>}
              <span className="accordion-title">{item.title}</span>
              <span className={`accordion-chevron ${isOpen ? "accordion-chevron--open" : ""}`}>›</span>
            </button>

            {isOpen && (
              <div className="accordion-content">
                <div className="accordion-content-inner">{item.content}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
