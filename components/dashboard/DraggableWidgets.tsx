"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "../ui/Card";
import { Button } from "../ui/Button";
import { MetricCard } from "./MetricCard";
import { LineChart } from "./LineChart";
import { BarChart } from "./BarChart";

export type Widget = {
  id: string;
  type: "metric" | "chart" | "activity" | "custom";
  title: string;
  size: "1x1" | "2x1" | "2x2" | "1x2";
  position: { x: number; y: number };
  data?: any;
};

const DEFAULT_WIDGETS: Widget[] = [
  {
    id: "metric-users",
    type: "metric",
    title: "Total Users",
    size: "1x1",
    position: { x: 0, y: 0 },
  },
  {
    id: "metric-sessions",
    type: "metric",
    title: "Active Sessions",
    size: "1x1",
    position: { x: 1, y: 0 },
  },
  {
    id: "chart-growth",
    type: "chart",
    title: "User Growth",
    size: "2x1",
    position: { x: 0, y: 1 },
  },
  {
    id: "activity-feed",
    type: "activity",
    title: "Recent Activity",
    size: "1x2",
    position: { x: 2, y: 0 },
  },
];

export function DraggableWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [draggedWidget, setDraggedWidget] = useState<Widget | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    // Load saved layout
    const saved = localStorage.getItem("dashboard-layout");
    if (saved) {
      setWidgets(JSON.parse(saved));
    }
  }, []);

  const saveLayout = (newWidgets: Widget[]) => {
    setWidgets(newWidgets);
    localStorage.setItem("dashboard-layout", JSON.stringify(newWidgets));
  };

  const handleDragStart = (widget: Widget) => {
    if (!isEditing) return;
    setDraggedWidget(widget);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (x: number, y: number) => {
    if (!draggedWidget) return;

    const newWidgets = widgets.map((w) =>
      w.id === draggedWidget.id ? { ...w, position: { x, y } } : w
    );

    saveLayout(newWidgets);
    setDraggedWidget(null);
  };

  const handleResize = (widgetId: string, newSize: Widget["size"]) => {
    const newWidgets = widgets.map((w) =>
      w.id === widgetId ? { ...w, size: newSize } : w
    );
    saveLayout(newWidgets);
  };

  const handleRemove = (widgetId: string) => {
    const newWidgets = widgets.filter((w) => w.id !== widgetId);
    saveLayout(newWidgets);
  };

  const addWidget = (widget: Omit<Widget, "position">) => {
    const newWidget: Widget = {
      ...widget,
      position: { x: 0, y: widgets.length },
    };
    saveLayout([...widgets, newWidget]);
    setShowLibrary(false);
  };

  const resetLayout = () => {
    saveLayout(DEFAULT_WIDGETS);
  };

  const exportLayout = () => {
    const dataStr = JSON.stringify(widgets, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dashboard-layout-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importLayout = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const layout = JSON.parse(event.target?.result as string);
        saveLayout(layout);
      } catch (error) {
        alert("Invalid layout file");
      }
    };
    reader.readAsText(file);
  };

  const getSizeClass = (size: Widget["size"]) => {
    switch (size) {
      case "1x1": return "span-1-1";
      case "2x1": return "span-2-1";
      case "2x2": return "span-2-2";
      case "1x2": return "span-1-2";
    }
  };

  const renderWidget = (widget: Widget) => {
    const content = (
      <div style={{ height: "100%" }}>
        {widget.type === "metric" && (
          <MetricCard
            title={widget.title}
            value={Math.floor(Math.random() * 1000)}
            change={Math.floor(Math.random() * 20) - 10}
            trend={Math.random() > 0.5 ? "up" : "down"}
          />
        )}
        {widget.type === "chart" && (
          <Card variant="bordered" style={{ height: "100%" }}>
            <CardHeader title={widget.title} />
            <CardBody>
              <LineChart
                data={{
                  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                  datasets: [
                    {
                      label: "Data",
                      data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 100)),
                      borderColor: "#6B9C6F",
                    },
                  ],
                }}
                height={200}
              />
            </CardBody>
          </Card>
        )}
        {widget.type === "activity" && (
          <Card variant="bordered" style={{ height: "100%" }}>
            <CardHeader title={widget.title} />
            <CardBody>
              <div style={{ fontSize: "0.875rem" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    style={{
                      padding: "0.5rem",
                      borderBottom: "1px solid var(--color-gray-200)",
                    }}
                  >
                    Activity item {i}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    );

    return (
      <div
        key={widget.id}
        draggable={isEditing}
        onDragStart={() => handleDragStart(widget)}
        style={{
          position: "relative",
          cursor: isEditing ? "move" : "default",
          opacity: draggedWidget?.id === widget.id ? 0.5 : 1,
        }}
        className={getSizeClass(widget.size)}
      >
        {content}
        {isEditing && (
          <div
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
              display: "flex",
              gap: "0.25rem",
              background: "white",
              padding: "0.25rem",
              borderRadius: "0.25rem",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            }}
          >
            <select
              value={widget.size}
              onChange={(e) => handleResize(widget.id, e.target.value as Widget["size"])}
              style={{
                padding: "0.25rem",
                fontSize: "0.75rem",
                border: "1px solid var(--color-gray-300)",
                borderRadius: "0.25rem",
              }}
            >
              <option value="1x1">1×1</option>
              <option value="2x1">2×1</option>
              <option value="2x2">2×2</option>
              <option value="1x2">1×2</option>
            </select>
            <button
              onClick={() => handleRemove(widget.id)}
              style={{
                padding: "0.25rem 0.5rem",
                border: "none",
                background: "var(--color-danger)",
                color: "white",
                borderRadius: "0.25rem",
                cursor: "pointer",
                fontSize: "0.75rem",
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Button
          variant={isEditing ? "primary" : "secondary"}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "✓ Done Editing" : "✏️ Edit Layout"}
        </Button>
        {isEditing && (
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowLibrary(true)}>
              ➕ Add Widget
            </Button>
            <Button variant="secondary" size="sm" onClick={resetLayout}>
              ↺ Reset Layout
            </Button>
            <Button variant="secondary" size="sm" onClick={exportLayout}>
              💾 Export Layout
            </Button>
            <label>
              <input
                type="file"
                accept=".json"
                onChange={importLayout}
                style={{ display: "none" }}
              />
              <Button variant="secondary" size="sm" as="span">
                📂 Import Layout
              </Button>
            </label>
          </>
        )}
      </div>

      {/* Widget Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          minHeight: "400px",
        }}
        onDragOver={handleDragOver}
      >
        {widgets.map((widget) => renderWidget(widget))}
      </div>

      {/* Widget Library Modal */}
      {showLibrary && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowLibrary(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "0.75rem",
              padding: "2rem",
              maxWidth: "600px",
              width: "calc(100% - 2rem)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "1rem" }}>Widget Library</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
              <button
                onClick={() =>
                  addWidget({
                    id: `metric-${Date.now()}`,
                    type: "metric",
                    title: "New Metric",
                    size: "1x1",
                  })
                }
                style={{
                  padding: "1rem",
                  border: "1px solid var(--color-gray-300)",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📊</div>
                <div style={{ fontWeight: 600 }}>Metric Card</div>
                <div style={{ fontSize: "0.875rem", color: "var(--color-gray-600)" }}>
                  Display key metrics
                </div>
              </button>
              <button
                onClick={() =>
                  addWidget({
                    id: `chart-${Date.now()}`,
                    type: "chart",
                    title: "New Chart",
                    size: "2x1",
                  })
                }
                style={{
                  padding: "1rem",
                  border: "1px solid var(--color-gray-300)",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📈</div>
                <div style={{ fontWeight: 600 }}>Chart Widget</div>
                <div style={{ fontSize: "0.875rem", color: "var(--color-gray-600)" }}>
                  Visualize data trends
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .span-1-1 { grid-column: span 1; grid-row: span 1; }
        .span-2-1 { grid-column: span 2; grid-row: span 1; }
        .span-2-2 { grid-column: span 2; grid-row: span 2; }
        .span-1-2 { grid-column: span 1; grid-row: span 2; }
      `}</style>
    </div>
  );
}
