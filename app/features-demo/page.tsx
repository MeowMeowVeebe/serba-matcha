"use client";

import { useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ThemeCustomizer } from "@/components/ui/ThemeCustomizer";
import { NotificationCenter, Notification } from "@/components/ui/NotificationCenter";
import { GlobalSearch } from "@/components/ui/GlobalSearch";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { InsightsDashboard } from "@/components/dashboard/InsightsDashboard";
import { DraggableWidgets } from "@/components/dashboard/DraggableWidgets";
import { NetworkVisualization } from "@/components/dashboard/NetworkVisualization";
import { useToast } from "@/components/ui/ToastManager";

export default function FeaturesDemoPage() {
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "security",
      title: "Security Alert",
      message: "Unusual login activity detected from IP 192.168.1.100",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      read: false,
    },
    {
      id: "2",
      type: "activity",
      title: "New User Registered",
      message: "John Doe has created an account",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: false,
    },
    {
      id: "3",
      type: "system",
      title: "Database Backup Complete",
      message: "Scheduled backup completed successfully",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      read: true,
    },
  ]);

  const mockNetworkData = {
    nodes: [
      { id: "admin", label: "Admin", type: "role" as const, value: 5 },
      { id: "user", label: "User", type: "role" as const, value: 3 },
      { id: "john", label: "John", type: "user" as const },
      { id: "jane", label: "Jane", type: "user" as const },
      { id: "read", label: "Read", type: "permission" as const },
      { id: "write", label: "Write", type: "permission" as const },
      { id: "delete", label: "Delete", type: "permission" as const },
    ],
    links: [
      { source: "john", target: "admin" },
      { source: "jane", target: "user" },
      { source: "admin", target: "read" },
      { source: "admin", target: "write" },
      { source: "admin", target: "delete" },
      { source: "user", target: "read" },
    ],
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          🎨 Matcha Features Showcase
        </h1>
        <p style={{ color: "var(--color-gray-600)" }}>
          Explore all the new features implemented in this dashboard
        </p>
      </div>

      {/* Quick Actions Bar */}
      <Card variant="bordered" style={{ marginBottom: "2rem" }}>
        <CardBody>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <ThemeCustomizer />
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={(id) => {
                setNotifications((prev) =>
                  prev.map((n) => (n.id === id ? { ...n, read: true } : n))
                );
              }}
              onMarkAllAsRead={() => {
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
              }}
              onClear={(id) => {
                setNotifications((prev) => prev.filter((n) => n.id !== id));
              }}
            />
            <GlobalSearch />
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                addToast({
                  type: "success",
                  title: "Success!",
                  message: "This is a success toast notification",
                })
              }
            >
              🎉 Show Toast
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                addToast({
                  type: "error",
                  title: "Error",
                  message: "This is an error toast",
                  duration: 3000,
                })
              }
            >
              ❌ Error Toast
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                addToast({
                  type: "info",
                  title: "Info",
                  message: "Press Cmd/Ctrl + K to open command palette",
                })
              }
            >
              ℹ️ Info Toast
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Feature Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Section 1: Theme & Notifications */}
        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
            1️⃣ Theme System & Notifications
          </h2>
          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            <Card variant="bordered">
              <CardHeader title="Theme Customizer" description="Personalize your experience" />
              <CardBody>
                <ul style={{ marginLeft: "1.5rem", lineHeight: 1.8 }}>
                  <li>5 theme modes (Light, Dark, High Contrast, Sepia, Ocean)</li>
                  <li>6 accent colors to choose from</li>
                  <li>4 font sizes (Small to Extra Large)</li>
                  <li>Dyslexia-friendly font option</li>
                  <li>Saved to localStorage</li>
                </ul>
              </CardBody>
            </Card>
            <Card variant="bordered">
              <CardHeader title="Notification Center" description="Stay updated" />
              <CardBody>
                <ul style={{ marginLeft: "1.5rem", lineHeight: 1.8 }}>
                  <li>Real-time notifications</li>
                  <li>4 categories: Security, Activity, System, Updates</li>
                  <li>Unread counter badge</li>
                  <li>Mark as read/unread</li>
                  <li>Filter all/unread</li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* Section 2: Search & Commands */}
        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
            2️⃣ Global Search & Command Palette
          </h2>
          <Card variant="bordered">
            <CardHeader
              title="Advanced Search"
              description="Press Cmd/Ctrl + K to try it"
            />
            <CardBody>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                <div>
                  <h4 style={{ marginBottom: "0.5rem" }}>Global Search Features:</h4>
                  <ul style={{ marginLeft: "1.5rem", lineHeight: 1.8 }}>
                    <li>Search across users, logs, settings, pages</li>
                    <li>AI-powered suggestions</li>
                    <li>Recent searches history</li>
                    <li>Fuzzy matching (typo tolerance)</li>
                    <li>Keyboard navigation</li>
                  </ul>
                </div>
                <div>
                  <h4 style={{ marginBottom: "0.5rem" }}>Command Palette Features:</h4>
                  <ul style={{ marginLeft: "1.5rem", lineHeight: 1.8 }}>
                    <li>Quick navigation to any page</li>
                    <li>Execute common actions</li>
                    <li>Grouped by category</li>
                    <li>Keyboard shortcuts</li>
                    <li>Recent commands tracking</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* Section 3: Dashboard Widgets */}
        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
            3️⃣ Draggable Dashboard Widgets
          </h2>
          <DraggableWidgets />
        </section>

        {/* Section 4: AI Insights */}
        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
            4️⃣ AI-Powered Insights
          </h2>
          <InsightsDashboard />
        </section>

        {/* Section 5: Activity Feed */}
        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
            5️⃣ Real-time Activity Feed
          </h2>
          <ActivityFeed />
        </section>

        {/* Section 6: Network Visualization */}
        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
            6️⃣ Network Visualization
          </h2>
          <NetworkVisualization nodes={mockNetworkData.nodes} links={mockNetworkData.links} />
        </section>

        {/* Section 7: PWA */}
        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
            7️⃣ Progressive Web App (PWA)
          </h2>
          <Card variant="bordered">
            <CardHeader title="PWA Features" description="Works offline, feels native" />
            <CardBody>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
                <div>
                  <h4 style={{ marginBottom: "0.5rem" }}>✅ Installed</h4>
                  <ul style={{ marginLeft: "1.5rem", lineHeight: 1.8, fontSize: "0.875rem" }}>
                    <li>Service Worker registered</li>
                    <li>Manifest.json configured</li>
                    <li>Installable on mobile & desktop</li>
                  </ul>
                </div>
                <div>
                  <h4 style={{ marginBottom: "0.5rem" }}>📱 Features</h4>
                  <ul style={{ marginLeft: "1.5rem", lineHeight: 1.8, fontSize: "0.875rem" }}>
                    <li>Offline capability</li>
                    <li>Background sync</li>
                    <li>Push notifications</li>
                    <li>Add to home screen</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* Section 8: Onboarding */}
        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
            8️⃣ Interactive Onboarding
          </h2>
          <Card variant="bordered">
            <CardHeader title="First-Time User Experience" />
            <CardBody>
              <p style={{ marginBottom: "1rem" }}>
                New users automatically see a guided tour highlighting key features. The tour can be:
              </p>
              <ul style={{ marginLeft: "1.5rem", lineHeight: 1.8, marginBottom: "1rem" }}>
                <li>Skipped at any time</li>
                <li>Navigated with Previous/Next buttons</li>
                <li>Restarted from the button in the bottom-right corner</li>
                <li>Shows progress indicator</li>
                <li>Highlights target elements with pulsing borders</li>
              </ul>
              <p style={{ color: "var(--color-gray-600)", fontSize: "0.875rem" }}>
                Clear localStorage and refresh to see the onboarding tour again
              </p>
            </CardBody>
          </Card>
        </section>
      </div>

      {/* Summary */}
      <Card variant="bordered" style={{ marginTop: "3rem", background: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)" }}>
        <CardBody>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1rem", color: "#2E7D32" }}>
            🎉 All Features Implemented Successfully!
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem", fontSize: "0.875rem" }}>
            <div>
              <strong>✅ Theme System</strong>
              <p>5 modes, custom colors, font sizes</p>
            </div>
            <div>
              <strong>✅ Notifications</strong>
              <p>Real-time updates with categories</p>
            </div>
            <div>
              <strong>✅ Global Search</strong>
              <p>AI-powered with suggestions</p>
            </div>
            <div>
              <strong>✅ Command Palette</strong>
              <p>Quick actions via Cmd+K</p>
            </div>
            <div>
              <strong>✅ Drag & Drop</strong>
              <p>Customizable widget layout</p>
            </div>
            <div>
              <strong>✅ AI Insights</strong>
              <p>Smart recommendations</p>
            </div>
            <div>
              <strong>✅ Activity Feed</strong>
              <p>Live updates every 5s</p>
            </div>
            <div>
              <strong>✅ Visualizations</strong>
              <p>Network graphs & charts</p>
            </div>
            <div>
              <strong>✅ PWA Support</strong>
              <p>Offline-first, installable</p>
            </div>
            <div>
              <strong>✅ Onboarding</strong>
              <p>Interactive guided tour</p>
            </div>
            <div>
              <strong>✅ Matcha Theme</strong>
              <p>Green & white color scheme</p>
            </div>
            <div>
              <strong>✅ Toast Notifications</strong>
              <p>Beautiful stacked toasts</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
