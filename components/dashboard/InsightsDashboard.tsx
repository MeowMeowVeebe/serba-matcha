"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export type Insight = {
  id: string;
  type: "trend" | "anomaly" | "prediction" | "recommendation";
  title: string;
  description: string;
  severity: "info" | "warning" | "critical" | "success";
  metrics?: {
    current: number;
    previous: number;
    change: number;
  };
  action?: {
    label: string;
    onClick: () => void;
  };
};

const INSIGHT_ICONS = {
  trend: "📈",
  anomaly: "⚠️",
  prediction: "🔮",
  recommendation: "💡",
};

const SEVERITY_COLORS = {
  info: "primary",
  warning: "warning",
  critical: "danger",
  success: "success",
} as const;

export function InsightsDashboard() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Insight["type"]>("all");

  useEffect(() => {
    generateInsights();
  }, []);

  const generateInsights = async () => {
    setIsLoading(true);

    // Simulate AI-powered insights generation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const generatedInsights: Insight[] = [
      {
        id: "1",
        type: "trend",
        title: "Login Attempts Increased 45%",
        description: "Login activity has spiked significantly this week compared to last week. Peak hours are between 9-11 AM.",
        severity: "info",
        metrics: {
          current: 1450,
          previous: 1000,
          change: 45,
        },
      },
      {
        id: "2",
        type: "anomaly",
        title: "Unusual Failed Login Pattern Detected",
        description: "Multiple failed login attempts from IP 192.168.1.100 detected. Possible brute force attempt.",
        severity: "critical",
        action: {
          label: "Block IP",
          onClick: () => alert("IP blocked successfully"),
        },
      },
      {
        id: "3",
        type: "recommendation",
        title: "Enable Two-Factor Authentication",
        description: "Only 60% of admin users have 2FA enabled. Enabling 2FA for all admins will significantly improve security.",
        severity: "warning",
        action: {
          label: "View Settings",
          onClick: () => console.log("Navigate to security settings"),
        },
      },
      {
        id: "4",
        type: "trend",
        title: "3 Inactive Users (30+ Days)",
        description: "Three user accounts haven't logged in for over 30 days. Consider reviewing their access rights.",
        severity: "info",
        action: {
          label: "View Users",
          onClick: () => console.log("Navigate to users"),
        },
      },
      {
        id: "5",
        type: "prediction",
        title: "Expected 15% User Growth Next Week",
        description: "Based on historical trends, we predict approximately 150 new user registrations next week.",
        severity: "success",
        metrics: {
          current: 1000,
          previous: 870,
          change: 15,
        },
      },
      {
        id: "6",
        type: "recommendation",
        title: "Optimize Peak Hour Performance",
        description: "System experiences highest load during 9-11 AM. Consider implementing caching strategies for better performance.",
        severity: "warning",
        action: {
          label: "View Analytics",
          onClick: () => console.log("Navigate to analytics"),
        },
      },
      {
        id: "7",
        type: "anomaly",
        title: "Unusual Audit Log Volume",
        description: "Audit log entries increased by 200% in the last hour. This may indicate automated activity.",
        severity: "warning",
      },
      {
        id: "8",
        type: "recommendation",
        title: "Clean Up Old Audit Logs",
        description: "You have 50,000+ audit logs older than 90 days. Running cleanup will improve database performance.",
        severity: "info",
        action: {
          label: "Run Cleanup",
          onClick: () => alert("Cleanup scheduled"),
        },
      },
    ];

    setInsights(generatedInsights);
    setIsLoading(false);
  };

  const filteredInsights = filter === "all"
    ? insights
    : insights.filter((i) => i.type === filter);

  const getSummary = () => {
    const total = insights.length;
    const critical = insights.filter((i) => i.severity === "critical").length;
    const warnings = insights.filter((i) => i.severity === "warning").length;

    return `${total} insights • ${critical} critical • ${warnings} warnings`;
  };

  if (isLoading) {
    return (
      <Card variant="bordered">
        <CardHeader title="AI-Powered Insights" description="Analyzing your data..." />
        <CardBody>
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🧠</div>
            <div style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              Generating Insights
            </div>
            <div style={{ color: "var(--color-gray-600)" }}>
              Our AI is analyzing your system data...
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card variant="bordered">
      <CardHeader
        title="AI-Powered Insights"
        description={getSummary()}
      />
      <CardBody>
        {/* Filters */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <Button
            variant={filter === "all" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({insights.length})
          </Button>
          <Button
            variant={filter === "trend" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setFilter("trend")}
          >
            📈 Trends ({insights.filter((i) => i.type === "trend").length})
          </Button>
          <Button
            variant={filter === "anomaly" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setFilter("anomaly")}
          >
            ⚠️ Anomalies ({insights.filter((i) => i.type === "anomaly").length})
          </Button>
          <Button
            variant={filter === "prediction" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setFilter("prediction")}
          >
            🔮 Predictions ({insights.filter((i) => i.type === "prediction").length})
          </Button>
          <Button
            variant={filter === "recommendation" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setFilter("recommendation")}
          >
            💡 Recommendations ({insights.filter((i) => i.type === "recommendation").length})
          </Button>
        </div>

        {/* Natural Language Summary */}
        <div
          style={{
            padding: "1.5rem",
            background: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
            borderRadius: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>📊</div>
          <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6, color: "#2E7D32" }}>
            <strong>System Summary:</strong> Your system had <strong>45% more login activity</strong> this week compared to last week. 
            There are <strong>2 critical security alerts</strong> that require immediate attention. 
            Overall system health is <strong>good</strong>, with <strong>85% user satisfaction</strong> based on activity patterns.
          </p>
        </div>

        {/* Insights List */}
        <div style={{ display: "grid", gap: "1rem" }}>
          {filteredInsights.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-gray-500)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🔍</div>
              <div>No insights found for this filter</div>
            </div>
          ) : (
            filteredInsights.map((insight) => (
              <div
                key={insight.id}
                style={{
                  padding: "1.25rem",
                  border: "1px solid var(--color-gray-200)",
                  borderLeft: `4px solid var(--color-${insight.severity})`,
                  borderRadius: "0.5rem",
                  background: "white",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ display: "flex", alignItems: "start", gap: "1rem" }}>
                  <span style={{ fontSize: "2rem", flexShrink: 0 }}>
                    {INSIGHT_ICONS[insight.type]}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                        {insight.title}
                      </h4>
                      <Badge variant={SEVERITY_COLORS[insight.severity]} size="sm">
                        {insight.severity}
                      </Badge>
                    </div>
                    <p style={{ margin: 0, marginBottom: "0.75rem", color: "var(--color-gray-600)", lineHeight: 1.6 }}>
                      {insight.description}
                    </p>

                    {/* Metrics */}
                    {insight.metrics && (
                      <div
                        style={{
                          display: "flex",
                          gap: "1.5rem",
                          padding: "0.75rem",
                          background: "var(--color-gray-50)",
                          borderRadius: "0.375rem",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-gray-600)", marginBottom: "0.25rem" }}>
                            Current
                          </div>
                          <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                            {insight.metrics.current.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-gray-600)", marginBottom: "0.25rem" }}>
                            Previous
                          </div>
                          <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                            {insight.metrics.previous.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-gray-600)", marginBottom: "0.25rem" }}>
                            Change
                          </div>
                          <div
                            style={{
                              fontSize: "1.25rem",
                              fontWeight: 600,
                              color: insight.metrics.change > 0 ? "var(--color-success)" : "var(--color-danger)",
                            }}
                          >
                            {insight.metrics.change > 0 ? "+" : ""}{insight.metrics.change}%
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action */}
                    {insight.action && (
                      <Button variant="primary" size="sm" onClick={insight.action.onClick}>
                        {insight.action.label}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
}
