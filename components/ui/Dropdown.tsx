"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

export type DropdownItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
};

export type DropdownProps = {
  trigger: ReactNode;
  items: (DropdownItem | "divider")[];
  align?: "left" | "right";
  className?: string;
};

export function Dropdown({ trigger, items, align = "left", className = "" }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled && item.onClick) {
      item.onClick();
      setIsOpen(false);
    }
  };

  return (
    <div className={`dropdown ${className}`} ref={dropdownRef}>
      <div className="dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div className={`dropdown-menu dropdown-menu--${align}`}>
          {items.map((item, index) => {
            if (item === "divider") {
              return <div key={`divider-${index}`} className="dropdown-divider" />;
            }

            return (
              <button
                key={item.key}
                className={`dropdown-item ${item.disabled ? "dropdown-item--disabled" : ""} ${
                  item.danger ? "dropdown-item--danger" : ""
                }`}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
              >
                {item.icon && <span className="dropdown-item__icon">{item.icon}</span>}
                <span className="dropdown-item__label">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
