"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";

interface Widget {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  content?: ReactNode;
}

interface LayoutPreset {
  id: string;
  name: string;
  widgets: Omit<Widget, "content">[];
}

interface DashboardBuilderProps {
  widgets: Widget[];
  onLayoutChange: (widgets: Widget[]) => void;
  columns?: number;
  rowHeight?: number;
  gap?: number;
  editable?: boolean;
  className?: string;
}

export function DashboardBuilder({
  widgets,
  onLayoutChange,
  columns = 12,
  rowHeight = 80,
  gap = 16,
  editable = true,
  className = "",
}: DashboardBuilderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [ghostPosition, setGhostPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const getColumnWidth = useCallback(() => {
    if (!containerRef.current) return 0;
    return (containerRef.current.offsetWidth - gap * (columns - 1)) / columns;
  }, [columns, gap]);

  const snapToGrid = useCallback((value: number, cellSize: number) => {
    return Math.round(value / cellSize);
  }, []);

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, widgetId: string) => {
    if (!editable) return;
    
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const rect = (e.target as HTMLElement).closest(".dashboard-widget")?.getBoundingClientRect();

    if (rect) {
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });
    }

    setDraggingId(widgetId);
    setGhostPosition({
      x: widget.x,
      y: widget.y,
      width: widget.width,
      height: widget.height,
    });
  }, [editable, widgets]);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!draggingId || !containerRef.current) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const containerRect = containerRef.current.getBoundingClientRect();
    const colWidth = getColumnWidth();

    const relativeX = clientX - containerRect.left - dragOffset.x;
    const relativeY = clientY - containerRect.top - dragOffset.y;

    const gridX = Math.max(0, Math.min(columns - ghostPosition.width, snapToGrid(relativeX, colWidth + gap)));
    const gridY = Math.max(0, snapToGrid(relativeY, rowHeight + gap));

    setGhostPosition(prev => ({ ...prev, x: gridX, y: gridY }));
  }, [draggingId, dragOffset, columns, gap, rowHeight, getColumnWidth, snapToGrid, ghostPosition.width]);

  const handleDragEnd = useCallback(() => {
    if (!draggingId) return;

    onLayoutChange(
      widgets.map(w =>
        w.id === draggingId
          ? { ...w, x: ghostPosition.x, y: ghostPosition.y }
          : w
      )
    );
    setDraggingId(null);
  }, [draggingId, ghostPosition, widgets, onLayoutChange]);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent, widgetId: string) => {
    if (!editable) return;
    e.stopPropagation();
    
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    setResizingId(widgetId);
    setGhostPosition({
      x: widget.x,
      y: widget.y,
      width: widget.width,
      height: widget.height,
    });
  }, [editable, widgets]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingId || !containerRef.current) return;

    const widget = widgets.find(w => w.id === resizingId);
    if (!widget) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const colWidth = getColumnWidth();

    const relativeX = e.clientX - containerRect.left;
    const relativeY = e.clientY - containerRect.top;

    const startX = widget.x * (colWidth + gap);
    const startY = widget.y * (rowHeight + gap);

    const newWidth = Math.max(
      widget.minWidth || 2,
      Math.min(columns - widget.x, snapToGrid(relativeX - startX, colWidth + gap))
    );
    const newHeight = Math.max(
      widget.minHeight || 2,
      snapToGrid(relativeY - startY, rowHeight + gap)
    );

    setGhostPosition(prev => ({ ...prev, width: newWidth, height: newHeight }));
  }, [resizingId, widgets, columns, gap, rowHeight, getColumnWidth, snapToGrid]);

  const handleResizeEnd = useCallback(() => {
    if (!resizingId) return;

    onLayoutChange(
      widgets.map(w =>
        w.id === resizingId
          ? { ...w, width: ghostPosition.width, height: ghostPosition.height }
          : w
      )
    );
    setResizingId(null);
  }, [resizingId, ghostPosition, widgets, onLayoutChange]);

  // Event listeners
  useEffect(() => {
    if (draggingId) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [draggingId, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (resizingId) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleResizeMove);
      window.removeEventListener("mouseup", handleResizeEnd);
    };
  }, [resizingId, handleResizeMove, handleResizeEnd]);

  const colWidth = getColumnWidth();
  const maxRow = Math.max(...widgets.map(w => w.y + w.height), 4);

  return (
    <div
      ref={containerRef}
      className={`dashboard-builder ${editable ? "dashboard-builder--editable" : ""} ${className}`}
      style={{
        minHeight: maxRow * (rowHeight + gap) + gap,
        position: "relative",
      }}
    >
      {/* Grid background */}
      {editable && (
        <div
          className="dashboard-builder__grid"
          style={{
            backgroundSize: `${colWidth + gap}px ${rowHeight + gap}px`,
            backgroundPosition: `${gap / 2}px ${gap / 2}px`,
          }}
        />
      )}

      {/* Widgets */}
      {widgets.map(widget => {
        const isDragging = draggingId === widget.id;
        const isResizing = resizingId === widget.id;
        const isActive = isDragging || isResizing;

        const displayX = isActive ? ghostPosition.x : widget.x;
        const displayY = isActive ? ghostPosition.y : widget.y;
        const displayWidth = isActive ? ghostPosition.width : widget.width;
        const displayHeight = isActive ? ghostPosition.height : widget.height;

        return (
          <div
            key={widget.id}
            className={`dashboard-widget ${isDragging ? "dashboard-widget--dragging" : ""} ${isResizing ? "dashboard-widget--resizing" : ""}`}
            style={{
              left: displayX * (colWidth + gap),
              top: displayY * (rowHeight + gap),
              width: displayWidth * (colWidth + gap) - gap,
              height: displayHeight * (rowHeight + gap) - gap,
            }}
          >
            {editable && (
              <div
                className="dashboard-widget__drag-handle"
                onMouseDown={e => handleDragStart(e, widget.id)}
                onTouchStart={e => handleDragStart(e, widget.id)}
              >
                <span className="dashboard-widget__title">{widget.title}</span>
                <span className="dashboard-widget__drag-icon">⋮⋮</span>
              </div>
            )}
            <div className="dashboard-widget__content">
              {widget.content}
            </div>
            {editable && (
              <div
                className="dashboard-widget__resize-handle"
                onMouseDown={e => handleResizeStart(e, widget.id)}
              />
            )}
          </div>
        );
      })}

      {/* Ghost indicator */}
      {(draggingId || resizingId) && (
        <div
          className="dashboard-builder__ghost"
          style={{
            left: ghostPosition.x * (colWidth + gap),
            top: ghostPosition.y * (rowHeight + gap),
            width: ghostPosition.width * (colWidth + gap) - gap,
            height: ghostPosition.height * (rowHeight + gap) - gap,
          }}
        />
      )}
    </div>
  );
}

// Layout Presets Manager
interface LayoutPresetsProps {
  currentLayout: Widget[];
  onApplyPreset: (widgets: Widget[]) => void;
  className?: string;
}

export function LayoutPresets({ currentLayout, onApplyPreset, className = "" }: LayoutPresetsProps) {
  const [presets, setPresets] = useState<LayoutPreset[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("matcha-dashboard-presets");
      if (saved) return JSON.parse(saved);
    }
    return defaultPresets;
  });
  const [isOpen, setIsOpen] = useState(false);

  const savePreset = () => {
    const name = prompt("Enter preset name:");
    if (!name) return;

    const newPreset: LayoutPreset = {
      id: `preset-${Date.now()}`,
      name,
      widgets: currentLayout.map(({ content, ...rest }) => rest),
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem("matcha-dashboard-presets", JSON.stringify(updated));
  };

  const deletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem("matcha-dashboard-presets", JSON.stringify(updated));
  };

  return (
    <div className={`layout-presets ${className}`}>
      <button className="layout-presets__trigger" onClick={() => setIsOpen(!isOpen)}>
        📐 Layouts
      </button>

      {isOpen && (
        <div className="layout-presets__dropdown">
          <div className="layout-presets__header">
            <span>Saved Layouts</span>
            <button onClick={savePreset}>+ Save Current</button>
          </div>
          <div className="layout-presets__list">
            {presets.map(preset => (
              <div key={preset.id} className="layout-presets__item">
                <button
                  className="layout-presets__apply"
                  onClick={() => {
                    onApplyPreset(preset.widgets as Widget[]);
                    setIsOpen(false);
                  }}
                >
                  {preset.name}
                </button>
                {!preset.id.startsWith("default-") && (
                  <button
                    className="layout-presets__delete"
                    onClick={() => deletePreset(preset.id)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const defaultPresets: LayoutPreset[] = [
  {
    id: "default-grid",
    name: "Grid View",
    widgets: [
      { id: "w1", type: "metric", title: "Metric 1", x: 0, y: 0, width: 3, height: 2 },
      { id: "w2", type: "metric", title: "Metric 2", x: 3, y: 0, width: 3, height: 2 },
      { id: "w3", type: "metric", title: "Metric 3", x: 6, y: 0, width: 3, height: 2 },
      { id: "w4", type: "metric", title: "Metric 4", x: 9, y: 0, width: 3, height: 2 },
      { id: "w5", type: "chart", title: "Chart", x: 0, y: 2, width: 8, height: 4 },
      { id: "w6", type: "list", title: "Activity", x: 8, y: 2, width: 4, height: 4 },
    ],
  },
  {
    id: "default-focus",
    name: "Focus View",
    widgets: [
      { id: "w1", type: "chart", title: "Main Chart", x: 0, y: 0, width: 12, height: 4 },
      { id: "w2", type: "metric", title: "Metric 1", x: 0, y: 4, width: 4, height: 2 },
      { id: "w3", type: "metric", title: "Metric 2", x: 4, y: 4, width: 4, height: 2 },
      { id: "w4", type: "metric", title: "Metric 3", x: 8, y: 4, width: 4, height: 2 },
    ],
  },
];

export type { Widget, LayoutPreset };
