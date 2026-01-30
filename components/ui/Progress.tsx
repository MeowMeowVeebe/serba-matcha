"use client";

export type ProgressProps = {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
  showLabel?: boolean;
  label?: string;
  striped?: boolean;
  animated?: boolean;
};

export function Progress({
  value,
  max = 100,
  size = "md",
  variant = "default",
  showLabel = false,
  label,
  striped = false,
  animated = false,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="progress-container">
      {showLabel && (
        <div className="progress-label">
          <span>{label || `${Math.round(percentage)}%`}</span>
        </div>
      )}
      <div className={`progress progress--${size}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div
          className={`progress-bar progress-bar--${variant} ${striped ? "progress-bar--striped" : ""} ${
            animated ? "progress-bar--animated" : ""
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Circular progress
export type CircularProgressProps = {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: "default" | "success" | "warning" | "danger";
  showLabel?: boolean;
};

export function CircularProgress({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  variant = "default",
  showLabel = true,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const colorMap = {
    default: "var(--color-primary)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    danger: "var(--color-danger)",
  };

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-gray-200)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colorMap[variant]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      </svg>
      {showLabel && (
        <div className="circular-progress-label">
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}
