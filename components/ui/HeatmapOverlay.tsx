"use client";

export function HeatmapOverlay({ points }: { points: Array<{ x: number; y: number; intensity: number }> }) {
  return (
    <div className="heatmap-overlay">
      {points.map((point, index) => (
        <span
          key={index}
          className="heatmap-overlay__point"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            opacity: point.intensity,
          }}
        />
      ))}
    </div>
  );
}
