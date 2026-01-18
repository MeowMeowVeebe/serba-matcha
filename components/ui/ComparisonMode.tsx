"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

interface ComparisonPanelProps {
  leftContent: ReactNode;
  rightContent: ReactNode;
  leftTitle?: string;
  rightTitle?: string;
  syncScroll?: boolean;
  showDiff?: boolean;
  className?: string;
}

export function ComparisonPanel({
  leftContent,
  rightContent,
  leftTitle = "Panel A",
  rightTitle = "Panel B",
  syncScroll = true,
  showDiff = false,
  className = "",
}: ComparisonPanelProps) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "overlay" | "swipe">("split");

  // Sync scroll between panels
  useEffect(() => {
    if (!syncScroll) return;

    const handleLeftScroll = () => {
      if (rightRef.current && leftRef.current) {
        rightRef.current.scrollTop = leftRef.current.scrollTop;
        rightRef.current.scrollLeft = leftRef.current.scrollLeft;
      }
    };

    const handleRightScroll = () => {
      if (leftRef.current && rightRef.current) {
        leftRef.current.scrollTop = rightRef.current.scrollTop;
        leftRef.current.scrollLeft = rightRef.current.scrollLeft;
      }
    };

    const leftEl = leftRef.current;
    const rightEl = rightRef.current;

    leftEl?.addEventListener("scroll", handleLeftScroll);
    rightEl?.addEventListener("scroll", handleRightScroll);

    return () => {
      leftEl?.removeEventListener("scroll", handleLeftScroll);
      rightEl?.removeEventListener("scroll", handleRightScroll);
    };
  }, [syncScroll]);

  // Handle split dragging
  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => setIsDragging(false);

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;

    const container = (e.target as HTMLElement).closest(".comparison-panel");
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const position = ((clientX - rect.left) / rect.width) * 100;
    setSplitPosition(Math.max(20, Math.min(80, position)));
  };

  return (
    <div className={`comparison-panel comparison-panel--${viewMode} ${className}`}>
      <div className="comparison-panel__toolbar">
        <div className="comparison-panel__view-modes">
          <button
            className={viewMode === "split" ? "active" : ""}
            onClick={() => setViewMode("split")}
          >
            ◫ Split
          </button>
          <button
            className={viewMode === "overlay" ? "active" : ""}
            onClick={() => setViewMode("overlay")}
          >
            ◉ Overlay
          </button>
          <button
            className={viewMode === "swipe" ? "active" : ""}
            onClick={() => setViewMode("swipe")}
          >
            ↔ Swipe
          </button>
        </div>
        <label className="comparison-panel__sync">
          <input
            type="checkbox"
            checked={syncScroll}
            onChange={() => {}}
          />
          Sync Scroll
        </label>
      </div>

      <div
        className="comparison-panel__container"
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchMove={handleDrag}
        onTouchEnd={handleDragEnd}
      >
        {viewMode === "split" && (
          <>
            <div
              className="comparison-panel__left"
              style={{ width: `${splitPosition}%` }}
            >
              <div className="comparison-panel__header">{leftTitle}</div>
              <div ref={leftRef} className="comparison-panel__content">
                {leftContent}
              </div>
            </div>

            <div
              className="comparison-panel__divider"
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              <div className="comparison-panel__divider-handle" />
            </div>

            <div
              className="comparison-panel__right"
              style={{ width: `${100 - splitPosition}%` }}
            >
              <div className="comparison-panel__header">{rightTitle}</div>
              <div ref={rightRef} className="comparison-panel__content">
                {rightContent}
              </div>
            </div>
          </>
        )}

        {viewMode === "overlay" && (
          <div className="comparison-panel__overlay">
            <div className="comparison-panel__header">
              {leftTitle} vs {rightTitle}
            </div>
            <div className="comparison-panel__content">
              <div className="comparison-panel__overlay-left">{leftContent}</div>
              <div
                className="comparison-panel__overlay-right"
                style={{ opacity: splitPosition / 100 }}
              >
                {rightContent}
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={splitPosition}
              onChange={e => setSplitPosition(Number(e.target.value))}
              className="comparison-panel__overlay-slider"
            />
          </div>
        )}

        {viewMode === "swipe" && (
          <div className="comparison-panel__swipe">
            <div className="comparison-panel__swipe-container">
              <div className="comparison-panel__swipe-left">
                <div className="comparison-panel__header">{leftTitle}</div>
                <div className="comparison-panel__content">{leftContent}</div>
              </div>
              <div
                className="comparison-panel__swipe-right"
                style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
              >
                <div className="comparison-panel__header">{rightTitle}</div>
                <div className="comparison-panel__content">{rightContent}</div>
              </div>
              <div
                className="comparison-panel__swipe-handle"
                style={{ left: `${splitPosition}%` }}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
              >
                <div className="comparison-panel__swipe-handle-icon">⟷</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Time Period Comparison
interface TimePeriodComparisonProps {
  data: { date: string; valueA: number; valueB: number; label: string }[];
  periodALabel?: string;
  periodBLabel?: string;
  className?: string;
}

export function TimePeriodComparison({
  data,
  periodALabel = "Current Period",
  periodBLabel = "Previous Period",
  className = "",
}: TimePeriodComparisonProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = Math.max(...data.flatMap(d => [d.valueA, d.valueB]));

  return (
    <div className={`time-comparison ${className}`}>
      <div className="time-comparison__legend">
        <div className="time-comparison__legend-item">
          <span className="time-comparison__legend-color time-comparison__legend-color--a" />
          {periodALabel}
        </div>
        <div className="time-comparison__legend-item">
          <span className="time-comparison__legend-color time-comparison__legend-color--b" />
          {periodBLabel}
        </div>
      </div>

      <div className="time-comparison__chart">
        {data.map((item, index) => {
          const heightA = (item.valueA / maxValue) * 100;
          const heightB = (item.valueB / maxValue) * 100;
          const diff = item.valueA - item.valueB;
          const diffPercent = item.valueB !== 0 ? ((diff / item.valueB) * 100).toFixed(1) : "N/A";

          return (
            <div
              key={index}
              className="time-comparison__bar-group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="time-comparison__bars">
                <div
                  className="time-comparison__bar time-comparison__bar--a"
                  style={{ height: `${heightA}%` }}
                />
                <div
                  className="time-comparison__bar time-comparison__bar--b"
                  style={{ height: `${heightB}%` }}
                />
              </div>
              <div className="time-comparison__label">{item.label}</div>

              {hoveredIndex === index && (
                <div className="time-comparison__tooltip">
                  <div className="time-comparison__tooltip-row">
                    <span>{periodALabel}:</span>
                    <strong>{item.valueA.toLocaleString()}</strong>
                  </div>
                  <div className="time-comparison__tooltip-row">
                    <span>{periodBLabel}:</span>
                    <strong>{item.valueB.toLocaleString()}</strong>
                  </div>
                  <div className={`time-comparison__tooltip-diff ${diff >= 0 ? "positive" : "negative"}`}>
                    {diff >= 0 ? "+" : ""}{diff.toLocaleString()} ({diffPercent}%)
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Data Diff Highlighter
interface DiffHighlighterProps {
  oldData: Record<string, unknown>;
  newData: Record<string, unknown>;
  className?: string;
}

export function DiffHighlighter({ oldData, newData, className = "" }: DiffHighlighterProps) {
  const allKeys = [...new Set([...Object.keys(oldData), ...Object.keys(newData)])];

  const getDiffType = (key: string): "added" | "removed" | "changed" | "unchanged" => {
    if (!(key in oldData)) return "added";
    if (!(key in newData)) return "removed";
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) return "changed";
    return "unchanged";
  };

  return (
    <div className={`diff-highlighter ${className}`}>
      <table className="diff-highlighter__table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Old Value</th>
            <th>New Value</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {allKeys.map(key => {
            const diffType = getDiffType(key);
            return (
              <tr key={key} className={`diff-highlighter__row diff-highlighter__row--${diffType}`}>
                <td className="diff-highlighter__key">{key}</td>
                <td className="diff-highlighter__old">
                  {key in oldData ? JSON.stringify(oldData[key]) : "-"}
                </td>
                <td className="diff-highlighter__new">
                  {key in newData ? JSON.stringify(newData[key]) : "-"}
                </td>
                <td className="diff-highlighter__status">
                  {diffType === "added" && <span className="diff-badge diff-badge--added">Added</span>}
                  {diffType === "removed" && <span className="diff-badge diff-badge--removed">Removed</span>}
                  {diffType === "changed" && <span className="diff-badge diff-badge--changed">Changed</span>}
                  {diffType === "unchanged" && <span className="diff-badge diff-badge--unchanged">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Export Comparison Report
interface ExportComparisonProps {
  leftData: unknown;
  rightData: unknown;
  leftTitle: string;
  rightTitle: string;
}

export function ExportComparisonButton({ leftData, rightData, leftTitle, rightTitle }: ExportComparisonProps) {
  const handleExport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      comparison: {
        [leftTitle]: leftData,
        [rightTitle]: rightData,
      },
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comparison-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button className="export-comparison-btn" onClick={handleExport}>
      📊 Export Comparison
    </button>
  );
}
