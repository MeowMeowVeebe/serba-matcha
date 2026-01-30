"use client";

export type StatusIndicator = {
  label: string;
  value: string;
  tone?: "success" | "warning" | "info";
};

const toneClass = (tone?: StatusIndicator["tone"]) => {
  switch (tone) {
    case "success":
      return "status-chip--success";
    case "warning":
      return "status-chip--warning";
    default:
      return "status-chip--info";
  }
};

export function StatusIndicators({ items }: { items: StatusIndicator[] }) {
  return (
    <div className="status-indicators" aria-label="System status">
      {items.map((item) => (
        <span key={item.label} className={`status-chip ${toneClass(item.tone)}`}>
          <span className="status-chip__label">{item.label}</span>
          <span className="status-chip__value">{item.value}</span>
        </span>
      ))}
    </div>
  );
}
