"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "./Badge";
import { Button } from "./Button";

export type Notification = {
  id: string;
  type: "security" | "activity" | "system" | "update";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export type NotificationCenterProps = {
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClear?: (id: string) => void;
};

const NOTIFICATION_ICONS = {
  security: "🔒",
  activity: "📊",
  system: "⚙️",
  update: "🔔",
};

const NOTIFICATION_COLORS = {
  security: "danger",
  activity: "primary",
  system: "default",
  update: "success",
} as const;

export function NotificationCenter({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onClear,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = filter === "unread" 
    ? notifications.filter((n) => !n.read)
    : notifications;

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.5rem",
          fontSize: "1.25rem",
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "0.25rem",
              right: "0.25rem",
              background: "var(--color-danger)",
              color: "white",
              fontSize: "0.625rem",
              fontWeight: 600,
              padding: "0.125rem 0.375rem",
              borderRadius: "999px",
              minWidth: "1.25rem",
              textAlign: "center",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 0.5rem)",
            right: 0,
            width: "400px",
            maxWidth: "calc(100vw - 2rem)",
            background: "white",
            border: "1px solid var(--color-gray-300)",
            borderRadius: "0.5rem",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
            zIndex: 1000,
            maxHeight: "600px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "1rem",
              borderBottom: "1px solid var(--color-gray-200)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
              Notifications
            </h3>
            {unreadCount > 0 && onMarkAllAsRead && (
              <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
                Mark all read
              </Button>
            )}
          </div>

          {/* Filter */}
          <div
            style={{
              padding: "0.75rem 1rem",
              borderBottom: "1px solid var(--color-gray-200)",
              display: "flex",
              gap: "0.5rem",
            }}
          >
            <Button
              variant={filter === "all" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All ({notifications.length})
            </Button>
            <Button
              variant={filter === "unread" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Unread ({unreadCount})
            </Button>
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filteredNotifications.length === 0 ? (
              <div
                style={{
                  padding: "3rem 1rem",
                  textAlign: "center",
                  color: "var(--color-gray-500)",
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📭</div>
                <div>No notifications</div>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    padding: "1rem",
                    borderBottom: "1px solid var(--color-gray-200)",
                    background: notification.read ? "transparent" : "var(--color-blue-50)",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onClick={() => {
                    if (!notification.read && onMarkAsRead) {
                      onMarkAsRead(notification.id);
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-gray-50)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notification.read
                      ? "transparent"
                      : "var(--color-blue-50)";
                  }}
                >
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <div style={{ fontSize: "1.5rem", flexShrink: 0 }}>
                      {NOTIFICATION_ICONS[notification.type]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.25rem" }}>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                          {notification.title}
                        </div>
                        <Badge
                          variant={NOTIFICATION_COLORS[notification.type]}
                          size="sm"
                        >
                          {notification.type}
                        </Badge>
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "var(--color-gray-600)", marginBottom: "0.5rem" }}>
                        {notification.message}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {notification.action && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              notification.action!.onClick();
                            }}
                          >
                            {notification.action.label}
                          </Button>
                        )}
                      </div>
                    </div>
                    {onClear && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClear(notification.id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.25rem",
                          opacity: 0.5,
                          fontSize: "1rem",
                        }}
                        title="Clear notification"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
