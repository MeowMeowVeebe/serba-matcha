"use client";

import { useEffect, useRef, type ReactNode, type MouseEvent } from "react";
import { createPortal } from "react-dom";

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  variant?: "glass" | "solid" | "minimal";
  showCloseButton?: boolean;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  footer?: ReactNode;
  className?: string;
}

export function GlassModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  variant = "glass",
  showCloseButton = true,
  closeOnOverlay = true,
  closeOnEscape = true,
  footer,
  className = "",
}: GlassModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle focus trap and body scroll lock
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = "";
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className={`glass-modal-overlay ${isOpen ? "glass-modal-overlay--open" : ""}`}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`glass-modal glass-modal--${size} glass-modal--${variant} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "glass-modal-title" : undefined}
        tabIndex={-1}
      >
        {/* Glassmorphism layers */}
        <div className="glass-modal__backdrop" />
        <div className="glass-modal__noise" />
        <div className="glass-modal__gradient" />
        
        {/* Content */}
        <div className="glass-modal__inner">
          {(title || showCloseButton) && (
            <div className="glass-modal__header">
              {title && (
                <h2 id="glass-modal-title" className="glass-modal__title">
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  className="glass-modal__close"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M15 5L5 15M5 5L15 15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          <div className="glass-modal__body">
            {children}
          </div>

          {footer && (
            <div className="glass-modal__footer">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Portal to body
  if (typeof window === "undefined") return null;
  return createPortal(modalContent, document.body);
}

// Glass Dropdown Component
interface GlassDropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  align?: "left" | "right" | "center";
  className?: string;
}

export function GlassDropdown({
  trigger,
  children,
  isOpen,
  onToggle,
  onClose,
  align = "left",
  className = "",
}: GlassDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: Event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div ref={dropdownRef} className={`glass-dropdown ${className}`}>
      <div onClick={onToggle} className="glass-dropdown__trigger">
        {trigger}
      </div>
      
      {isOpen && (
        <div className={`glass-dropdown__content glass-dropdown__content--${align}`}>
          <div className="glass-dropdown__backdrop" />
          <div className="glass-dropdown__inner">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// Glass Card Component
interface GlassCardProps {
  children: ReactNode;
  className?: string;
  intensity?: "light" | "medium" | "heavy";
  hover?: boolean;
}

export function GlassCard({ 
  children, 
  className = "", 
  intensity = "medium",
  hover = true 
}: GlassCardProps) {
  return (
    <div className={`glass-card glass-card--${intensity} ${hover ? "glass-card--hover" : ""} ${className}`}>
      <div className="glass-card__backdrop" />
      <div className="glass-card__content">
        {children}
      </div>
    </div>
  );
}

// Glass Tooltip
interface GlassTooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export function GlassTooltip({ content, children, position = "top" }: GlassTooltipProps) {
  return (
    <div className="glass-tooltip-wrapper">
      {children}
      <div className={`glass-tooltip glass-tooltip--${position}`}>
        <div className="glass-tooltip__backdrop" />
        <div className="glass-tooltip__content">{content}</div>
      </div>
    </div>
  );
}
