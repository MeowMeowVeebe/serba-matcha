"use client";

import { useState, useEffect } from "react";
import { Badge } from "../ui/Badge";
import { Card, CardHeader, CardBody } from "../ui/Card";

export type Activity = {
  id: string;
  type: "user_created" | "login" | "logout" | "profile_updated" | "user_deleted" | "permission_changed" | "security_alert";
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  action: string;
  description: string;
  timestamp: Date;
  status: "success" | "failure" | "warning";
  metadata?: Record<string, any>;
};

const ACTIVITY_ICONS = {
  user_created: "👤",
  login: "🔐",
  logout: "🚪",
  profile_updated: "📝",
  user_deleted: "🗑️",
  permission_changed: "🔑",
  security_alert: "⚠️",
};

const ACTIVITY_COLORS = {
  success: "success",
  failure: "danger",
  warning: "warning",
} as const;

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState<"all" | "success" | "failure">("all");
  const [viewMode, setViewMode] = useState<"timeline" | "list">("list");
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    // Fetch initial activities
    fetchActivities();

    // Set up live updates if enabled
    if (isLive) {
      const interval = setInterval(() => {
        fetchActivities();
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isLive]);

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/dashboard/recent-activity?limit=20");
      if (response.ok) {
        const data = await response.json();
        const mappedActivities: Activity[] = data.activities.map((activity: any) => ({
          id: activity.id,
          type: mapActionToType(activity.action),
          user: activity.user,
          action: activity.action,
          description: getActivityDescription(activity),
          timestamp: new Date(activity.timestamp),
          status: activity.status,
          metadata: activity.metadata,
        }));
        setActivities(mappedActivities);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    }
  };

  const mapActionToType = (action: string): Activity["type"] => {
    if (action.includes("login")) return "login";
    if (action.includes("logout")) return "logout";
    if (action.includes("register") || action.includes("created")) return "user_created";
    if (action.includes("update")) return "profile_updated";
    if (action.includes("delete")) return "user_deleted";
    if (action.includes("permission") || action.includes("role")) return "permission_changed";
    return "security_alert";
  };

  const getActivityDescription = (activity: any): string => {
    const userName = activity.user?.name || activity.user?.email || "Unknown user";
    const action = activity.action.replace("auth:", "").replace("user:", "").replace("_", " ");
    return `${userName} ${action}`;
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const filteredActivities = filter === "all"
    ? activities
    : activities.filter((a) => a.status === filter);

  const groupByHour = (activities: Activity[]) => {
    const groups: Record<string, Activity[]> = {};
    activities.forEach((activity) => {
      const hour = activity.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      if (!groups[hour]) {
        groups[hour] = [];
      }
      groups[hour].push(activity);
    });
    return groups;
  };

  const activityGroups = viewMode === "timeline" ? groupByHour(filteredActivities) : {};

  return (
    <Card variant="bordered">
      <CardHeader
        title="Live Activity Feed"
        description={
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>Real-time system events</span>
            {isLive && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--color-success)" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "currentColor", animation: "pulse 2s infinite" }} />
                Live
              </span>
            )}
          </div>
        }
      />
      <CardBody>
        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setFilter("all")}
              style={{
                padding: "0.375rem 0.75rem",
                border: filter === "all" ? "2px solid var(--color-primary)" : "1px solid var(--color-gray-300)",
                borderRadius: "0.375rem",
                background: filter === "all" ? "var(--color-primary-light, #E8F5E9)" : "white",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              All ({activities.length})
            </button>
            <button
              onClick={() => setFilter("success")}
              style={{
                padding: "0.375rem 0.75rem",
                border: filter === "success" ? "2px solid var(--color-success)" : "1px solid var(--color-gray-300)",
                borderRadius: "0.375rem",
                background: filter === "success" ? "var(--color-success-light, #D1FAE5)" : "white",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Success ({activities.filter((a) => a.status === "success").length})
            </button>
            <button
              onClick={() => setFilter("failure")}
              style={{
                padding: "0.375rem 0.75rem",
                border: filter === "failure" ? "2px solid var(--color-danger)" : "1px solid var(--color-gray-300)",
                borderRadius: "0.375rem",
                background: filter === "failure" ? "var(--color-danger-light, #FEE2E2)" : "white",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Failed ({activities.filter((a) => a.status === "failure").length})
            </button>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              onClick={() => setViewMode(viewMode === "list" ? "timeline" : "list")}
              style={{
                padding: "0.375rem 0.75rem",
                border: "1px solid var(--color-gray-300)",
                borderRadius: "0.375rem",
                background: "white",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              {viewMode === "list" ? "📋 List" : "🕐 Timeline"}
            </button>
            <button
              onClick={() => setIsLive(!isLive)}
              style={{
                padding: "0.375rem 0.75rem",
                border: "1px solid var(--color-gray-300)",
                borderRadius: "0.375rem",
                background: isLive ? "var(--color-success-light, #D1FAE5)" : "white",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              {isLive ? "⏸️ Pause" : "▶️ Live"}
            </button>
          </div>
        </div>

        {/* Activity List */}
        <div style={{ maxHeight: "500px", overflowY: "auto" }}>
          {viewMode === "list" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    padding: "0.75rem",
                    border: "1px solid var(--color-gray-200)",
                    borderRadius: "0.375rem",
                    display: "flex",
                    alignItems: "start",
                    gap: "0.75rem",
                    background: "white",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{ACTIVITY_ICONS[activity.type]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: "0.25rem" }}>
                      {activity.description}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-gray-600)" }}>
                      {formatTimestamp(activity.timestamp)}
                    </div>
                  </div>
                  <Badge variant={ACTIVITY_COLORS[activity.status]} size="sm">
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {Object.entries(activityGroups).map(([hour, acts]) => (
                <div key={hour} style={{ marginBottom: "1.5rem" }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: "var(--color-gray-600)",
                      marginBottom: "0.75rem",
                      position: "sticky",
                      top: 0,
                      background: "white",
                      padding: "0.5rem 0",
                    }}
                  >
                    {hour}
                  </div>
                  <div style={{ borderLeft: "2px solid var(--color-gray-300)", paddingLeft: "1rem" }}>
                    {acts.map((activity) => (
                      <div
                        key={activity.id}
                        style={{
                          marginBottom: "0.75rem",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: "-1.625rem",
                            top: "0.5rem",
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: "var(--color-primary)",
                            border: "2px solid white",
                          }}
                        />
                        <div
                          style={{
                            padding: "0.75rem",
                            border: "1px solid var(--color-gray-200)",
                            borderRadius: "0.375rem",
                            background: "white",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                            <span>{ACTIVITY_ICONS[activity.type]}</span>
                            <span style={{ fontWeight: 500 }}>{activity.description}</span>
                            <Badge variant={ACTIVITY_COLORS[activity.status]} size="sm">
                              {activity.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardBody>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Card>
  );
}
