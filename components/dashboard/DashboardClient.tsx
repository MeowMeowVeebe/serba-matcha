"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "../ui/Card";
import { MetricCard } from "./MetricCard";
import { LineChart } from "./LineChart";
import { BarChart } from "./BarChart";
import { Select } from "../ui/Select";
import { Badge } from "../ui/Badge";
import { Skeleton } from "../ui/Skeleton";
import { Button } from "../ui/Button";
import { DateRangePicker, DateRangeValue } from "../ui/DateRangePicker";
import { Dropdown } from "../ui/Dropdown";

type DashboardMetrics = {
  overview: {
    totalUsers: { value: number; change: number; percentage: number };
    activeSessions: { value: number };
    failedLogins: { value: number };
    securityEvents: { value: number };
  };
  charts: {
    userGrowth: Array<{ date: string; count: number }>;
    loginActivity: Array<{ hour: number; count: number }>;
    topActions: Array<{ action: string; count: number }>;
  };
};

type RecentActivity = {
  id: string;
  action: string;
  status: string;
  timestamp: string;
  user: { id: string; email: string; name: string | null } | null;
};

export function DashboardClient() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7d");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<DateRangeValue | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareMetrics, setCompareMetrics] = useState<DashboardMetrics | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    fetchMetrics();
    fetchRecentActivity();
  }, [dateRange]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    // Refresh every 30 seconds when auto-refresh is enabled
    const interval = setInterval(() => {
      setIsRefreshing(true);
      fetchMetrics();
      fetchRecentActivity();
      setTimeout(() => setIsRefreshing(false), 500);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, dateRange]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/dashboard/metrics");
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch("/api/dashboard/recent-activity?limit=10");
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.activities);
      }
    } catch (error) {
      console.error("Failed to fetch recent activity:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      "auth:login": "Login",
      "auth:logout": "Logout",
      "auth:register": "Register",
      "auth:password_reset": "Password Reset",
      "user:update": "Update Profile",
      "user:delete": "Delete User",
      "rbac:role_assign": "Assign Role",
      "rbac:permission_grant": "Grant Permission",
    };
    return labels[action] || action;
  };

  const getStatusBadge = (status: string) => {
    const variant = status === "success" ? "success" : status === "failure" ? "danger" : "default";
    return (
      <Badge variant={variant} size="sm">
        {status}
      </Badge>
    );
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchMetrics();
    fetchRecentActivity();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const prepareExportData = () => {
    if (!metrics) return null;

    return {
      metadata: {
        exportDate: new Date().toISOString(),
        dateRange: dateRange,
        generatedBy: "Dashboard Analytics"
      },
      overview: {
        totalUsers: {
          value: metrics.overview.totalUsers.value,
          change: metrics.overview.totalUsers.change,
          percentage: metrics.overview.totalUsers.percentage
        },
        activeSessions: metrics.overview.activeSessions.value,
        failedLogins: metrics.overview.failedLogins.value,
        securityEvents: metrics.overview.securityEvents.value
      },
      charts: {
        userGrowth: metrics.charts.userGrowth,
        loginActivity: metrics.charts.loginActivity,
        topActions: metrics.charts.topActions
      },
      recentActivity: recentActivity.map(activity => ({
        action: activity.action,
        status: activity.status,
        user: activity.user ? (activity.user.name || activity.user.email) : "Unknown",
        timestamp: activity.timestamp
      }))
    };
  };

  const exportToCSV = () => {
    const data = prepareExportData();
    if (!data) return;

    const csvRows: string[] = [];
    
    // Header
    csvRows.push("Dashboard Metrics Export");
    csvRows.push(`Export Date: ${data.metadata.exportDate}`);
    csvRows.push(`Date Range: ${data.metadata.dateRange}`);
    csvRows.push("");
    
    // Overview Metrics
    csvRows.push("OVERVIEW METRICS");
    csvRows.push("Metric,Value,Change,Percentage");
    csvRows.push(`Total Users,${data.overview.totalUsers.value},${data.overview.totalUsers.change},${data.overview.totalUsers.percentage}%`);
    csvRows.push(`Active Sessions,${data.overview.activeSessions},,`);
    csvRows.push(`Failed Logins,${data.overview.failedLogins},,`);
    csvRows.push(`Security Events,${data.overview.securityEvents},,`);
    csvRows.push("");
    
    // User Growth
    csvRows.push("USER GROWTH");
    csvRows.push("Date,Count");
    data.charts.userGrowth.forEach(item => {
      csvRows.push(`${item.date},${item.count}`);
    });
    csvRows.push("");
    
    // Login Activity
    csvRows.push("LOGIN ACTIVITY BY HOUR");
    csvRows.push("Hour,Count");
    data.charts.loginActivity.forEach(item => {
      csvRows.push(`${item.hour}:00,${item.count}`);
    });
    csvRows.push("");
    
    // Top Actions
    csvRows.push("TOP ACTIONS");
    csvRows.push("Action,Count");
    data.charts.topActions.forEach(item => {
      csvRows.push(`"${item.action}",${item.count}`);
    });
    csvRows.push("");
    
    // Recent Activity
    csvRows.push("RECENT ACTIVITY");
    csvRows.push("Action,Status,User,Timestamp");
    data.recentActivity.forEach(activity => {
      csvRows.push(`"${activity.action}",${activity.status},"${activity.user}",${activity.timestamp}`);
    });
    
    // Create and download CSV
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    downloadFile(blob, `dashboard-export-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportToJSON = () => {
    const data = prepareExportData();
    if (!data) return;

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    downloadFile(blob, `dashboard-export-${dateRange}-${new Date().toISOString().split('T')[0]}.json`);
  };

  const exportToExcel = () => {
    const data = prepareExportData();
    if (!data) return;

    // Create a simple HTML table that Excel can open
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8"></head>
      <body>
        <table border="1">
          <tr><td colspan="4"><b>Dashboard Metrics Export</b></td></tr>
          <tr><td colspan="4">Export Date: ${data.metadata.exportDate}</td></tr>
          <tr><td colspan="4">Date Range: ${data.metadata.dateRange}</td></tr>
          <tr><td colspan="4"></td></tr>
          
          <tr><td colspan="4"><b>OVERVIEW METRICS</b></td></tr>
          <tr><th>Metric</th><th>Value</th><th>Change</th><th>Percentage</th></tr>
          <tr><td>Total Users</td><td>${data.overview.totalUsers.value}</td><td>${data.overview.totalUsers.change}</td><td>${data.overview.totalUsers.percentage}%</td></tr>
          <tr><td>Active Sessions</td><td>${data.overview.activeSessions}</td><td></td><td></td></tr>
          <tr><td>Failed Logins</td><td>${data.overview.failedLogins}</td><td></td><td></td></tr>
          <tr><td>Security Events</td><td>${data.overview.securityEvents}</td><td></td><td></td></tr>
          <tr><td colspan="4"></td></tr>
          
          <tr><td colspan="4"><b>USER GROWTH</b></td></tr>
          <tr><th>Date</th><th>Count</th><th></th><th></th></tr>
    `;

    data.charts.userGrowth.forEach(item => {
      html += `<tr><td>${item.date}</td><td>${item.count}</td><td></td><td></td></tr>`;
    });

    html += `
          <tr><td colspan="4"></td></tr>
          <tr><td colspan="4"><b>LOGIN ACTIVITY BY HOUR</b></td></tr>
          <tr><th>Hour</th><th>Count</th><th></th><th></th></tr>
    `;

    data.charts.loginActivity.forEach(item => {
      html += `<tr><td>${item.hour}:00</td><td>${item.count}</td><td></td><td></td></tr>`;
    });

    html += `
          <tr><td colspan="4"></td></tr>
          <tr><td colspan="4"><b>TOP ACTIONS</b></td></tr>
          <tr><th>Action</th><th>Count</th><th></th><th></th></tr>
    `;

    data.charts.topActions.forEach(item => {
      html += `<tr><td>${item.action}</td><td>${item.count}</td><td></td><td></td></tr>`;
    });

    html += `
          <tr><td colspan="4"></td></tr>
          <tr><td colspan="4"><b>RECENT ACTIVITY</b></td></tr>
          <tr><th>Action</th><th>Status</th><th>User</th><th>Timestamp</th></tr>
    `;

    data.recentActivity.forEach(activity => {
      html += `<tr><td>${activity.action}</td><td>${activity.status}</td><td>${activity.user}</td><td>${activity.timestamp}</td></tr>`;
    });

    html += `
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    downloadFile(blob, `dashboard-export-${dateRange}-${new Date().toISOString().split('T')[0]}.xls`);
  };

  const downloadFile = (blob: Blob, fileName: string) => {
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCustomDateRange = (range: DateRangeValue) => {
    setCustomDateRange(range);
    setDateRange("custom");
  };

  const toggleCompareMode = async () => {
    if (!compareMode) {
      // Enable compare mode - fetch previous period data
      setCompareMode(true);
      try {
        const response = await fetch(`/api/dashboard/metrics?range=${getPreviousPeriod(dateRange)}`);
        if (response.ok) {
          const data = await response.json();
          setCompareMetrics(data);
        }
      } catch (error) {
        console.error("Failed to fetch comparison data:", error);
      }
    } else {
      setCompareMode(false);
      setCompareMetrics(null);
    }
  };

  const getPreviousPeriod = (range: string): string => {
    // Return the previous period for comparison
    switch (range) {
      case "24h": return "24h-prev";
      case "7d": return "7d-prev";
      case "30d": return "30d-prev";
      case "90d": return "90d-prev";
      default: return "7d-prev";
    }
  };

  const calculateChange = (current: number, previous: number): string => {
    if (previous === 0) return "+100%";
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
      setShowPrintPreview(false);
    }, 500);
  };

  return (
    <div className={`dashboard-container ${showPrintPreview ? "print-preview-mode" : ""}`}>
      {/* Print Header - Only visible when printing */}
      <div className="print-only print-header" style={{ display: "none" }}>
        <div className="print-header__logo">Dashboard Analytics Report</div>
        <div className="print-header__date">
          Generated: {new Date().toLocaleDateString("en-US", { 
            year: "numeric", 
            month: "long", 
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })}
        </div>
      </div>

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard Analytics</h1>
          <p className="dashboard-subtitle">
            Overview of system metrics and activities
            {lastUpdated && (
              <span style={{ marginLeft: "0.5rem", opacity: 0.7 }}>
                {isRefreshing ? " • Refreshing..." : ` • Updated ${lastUpdated.toLocaleTimeString()}`}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <Select
            options={[
              { value: "24h", label: "Last 24 Hours" },
              { value: "7d", label: "Last 7 Days" },
              { value: "30d", label: "Last 30 Days" },
              { value: "90d", label: "Last 90 Days" },
            ]}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            inputSize="sm"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? "Disable auto-refresh (30s)" : "Enable auto-refresh (30s)"}
          >
            {autoRefresh ? "🔄 Auto" : "⏸️ Manual"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? "⟳ Refreshing..." : "↻ Refresh"}
          </Button>
          <DateRangePicker
            value={customDateRange || undefined}
            onChange={handleCustomDateRange}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleCompareMode}
            title="Compare with previous period"
          >
            {compareMode ? "📊 Comparing" : "📊 Compare"}
          </Button>
          <div style={{ position: "relative" }}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={!metrics}
            >
              📥 Export ▼
            </Button>
            {showExportMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "0.25rem",
                  backgroundColor: "white",
                  border: "1px solid var(--color-gray-300)",
                  borderRadius: "0.375rem",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  zIndex: 10,
                  minWidth: "150px"
                }}
              >
                <button
                  onClick={() => { exportToCSV(); setShowExportMenu(false); }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "0.5rem 1rem",
                    textAlign: "left",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-gray-100)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  📄 Export as CSV
                </button>
                <button
                  onClick={() => { exportToJSON(); setShowExportMenu(false); }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "0.5rem 1rem",
                    textAlign: "left",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-gray-100)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  📋 Export as JSON
                </button>
                <button
                  onClick={() => { exportToExcel(); setShowExportMenu(false); }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "0.5rem 1rem",
                    textAlign: "left",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-gray-100)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  📊 Export as Excel
                </button>
                <div style={{ borderTop: "1px solid var(--color-gray-300)", margin: "0.25rem 0" }} />
                <button
                  onClick={() => { handlePrint(); setShowExportMenu(false); }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "0.5rem 1rem",
                    textAlign: "left",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-gray-100)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  🖨️ Print Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Banner */}
      {compareMode && compareMetrics && (
        <div style={{
          padding: "1rem",
          backgroundColor: "var(--color-blue-50)",
          border: "1px solid var(--color-blue-200)",
          borderRadius: "0.5rem",
          marginBottom: "1.5rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>Comparison Mode Active</strong>
              <p style={{ fontSize: "0.875rem", marginTop: "0.25rem", opacity: 0.8 }}>
                Comparing current period with previous {dateRange}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={toggleCompareMode}>
              ✕ Exit Comparison
            </Button>
          </div>
        </div>
      )}

      {/* Metrics Overview */}
      <div className="dashboard-metrics">
        <MetricCard
          title="Total Users"
          value={metrics?.overview.totalUsers.value || 0}
          change={metrics?.overview.totalUsers.percentage}
          changeLabel={compareMode && compareMetrics ? 
            `vs prev period (${compareMetrics.overview.totalUsers.value})` : 
            "vs yesterday"}
          trend={metrics && metrics.overview.totalUsers.percentage > 0 ? "up" : "down"}
          isLoading={loading}
          icon={<span>👥</span>}
        />
        <MetricCard
          title="Active Sessions"
          value={metrics?.overview.activeSessions.value || 0}
          isLoading={loading}
          icon={<span>🔐</span>}
        />
        <MetricCard
          title="Failed Logins"
          value={metrics?.overview.failedLogins.value || 0}
          trend={metrics && metrics.overview.failedLogins.value > 10 ? "down" : "neutral"}
          isLoading={loading}
          icon={<span>⚠️</span>}
        />
        <MetricCard
          title="Security Events"
          value={metrics?.overview.securityEvents.value || 0}
          isLoading={loading}
          icon={<span>🛡️</span>}
        />
      </div>

      {/* Charts */}
      <div className="dashboard-charts">
        {/* User Growth Chart */}
        <Card variant="bordered">
          <CardHeader title="User Growth" description="New user registrations over time" />
          <CardBody>
            {loading ? (
              <Skeleton height={300} />
            ) : metrics ? (
              <LineChart
                data={{
                  labels: metrics.charts.userGrowth.map((item) => formatDate(item.date)),
                  datasets: [
                    {
                      label: "Current Period",
                      data: metrics.charts.userGrowth.map((item) => item.count),
                      borderColor: "#6B9C6F",
                      backgroundColor: "rgba(107, 156, 111, 0.1)",
                    },
                    ...(compareMode && compareMetrics ? [
                      {
                        label: "Previous Period",
                        data: compareMetrics.charts.userGrowth.map((item) => item.count),
                        borderColor: "#9CA3AF",
                        backgroundColor: "rgba(156, 163, 175, 0.1)",
                      }
                    ] : []),
                  ],
                }}
              />
            ) : (
              <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
                No data available
              </div>
            )}
          </CardBody>
        </Card>

        {/* Login Activity Chart */}
        <Card variant="bordered">
          <CardHeader title="Login Activity" description="Login attempts by hour of day" />
          <CardBody>
            {loading ? (
              <Skeleton height={300} />
            ) : metrics ? (
              <BarChart
                data={{
                  labels: metrics.charts.loginActivity.map((item) => `${item.hour}h`),
                  datasets: [
                    {
                      label: "Current Period",
                      data: metrics.charts.loginActivity.map((item) => item.count),
                      backgroundColor: "rgba(168, 213, 163, 0.8)",
                    },
                    ...(compareMode && compareMetrics ? [
                      {
                        label: "Previous Period",
                        data: compareMetrics.charts.loginActivity.map((item) => item.count),
                        backgroundColor: "rgba(156, 163, 175, 0.6)",
                      }
                    ] : []),
                  ],
                }}
              />
            ) : (
              <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
                No data available
              </div>
            )}
          </CardBody>
        </Card>

        {/* Top Actions Chart */}
        <Card variant="bordered">
          <CardHeader title="Top Actions" description="Most frequent user actions" />
          <CardBody>
            {loading ? (
              <Skeleton height={300} />
            ) : metrics ? (
              <BarChart
                data={{
                  labels: metrics.charts.topActions.map((item) => getActionLabel(item.action)),
                  datasets: [
                    {
                      label: "Count",
                      data: metrics.charts.topActions.map((item) => item.count),
                      backgroundColor: [
                        "#6B9C6F",
                        "#7FB783",
                        "#A8D5A3",
                        "#8FC88A",
                        "#5A8A5E",
                        "#BDE0B9",
                        "#4A7A4E",
                        "#C8E6C9",
                        "#81C784",
                        "#66BB6A",
                      ],
                    },
                  ],
                }}
                horizontal
              />
            ) : (
              <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
                No data available
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card variant="bordered">
          <CardHeader title="Recent Activity" description="Latest system events" />
          <CardBody>
            {loading ? (
              <div className="activity-list">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="activity-item">
                    <Skeleton width={100} height={14} />
                    <Skeleton width="100%" height={12} />
                    <Skeleton width={80} height={12} />
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="activity-list">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-item__header">
                      <span className="activity-item__action">{getActionLabel(activity.action)}</span>
                      {getStatusBadge(activity.status)}
                    </div>
                    <div className="activity-item__details">
                      {activity.user && (
                        <span className="activity-item__user">
                          {activity.user.name || activity.user.email}
                        </span>
                      )}
                      <span className="activity-item__time">{formatTime(activity.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No recent activity</div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
