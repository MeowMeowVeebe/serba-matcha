"use client";

import { useEffect, useState, type ReactNode } from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  animation?: "shimmer" | "pulse" | "wave";
  className?: string;
}

export function BrandedSkeleton({
  width = "100%",
  height = 20,
  variant = "text",
  animation = "shimmer",
  className = "",
}: SkeletonProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    text: { borderRadius: "4px" },
    circular: { borderRadius: "50%" },
    rectangular: { borderRadius: "0" },
    rounded: { borderRadius: "8px" },
  };

  return (
    <div
      className={`branded-skeleton branded-skeleton--${animation} ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...variantStyles[variant],
      }}
    />
  );
}

// Card Skeleton
export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton-card ${className}`}>
      <div className="skeleton-card__header">
        <BrandedSkeleton variant="circular" width={40} height={40} />
        <div className="skeleton-card__header-text">
          <BrandedSkeleton width="60%" height={14} />
          <BrandedSkeleton width="40%" height={12} />
        </div>
      </div>
      <div className="skeleton-card__body">
        <BrandedSkeleton height={12} />
        <BrandedSkeleton width="90%" height={12} />
        <BrandedSkeleton width="75%" height={12} />
      </div>
      <div className="skeleton-card__footer">
        <BrandedSkeleton width={80} height={32} variant="rounded" />
        <BrandedSkeleton width={80} height={32} variant="rounded" />
      </div>
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table__header">
        {Array.from({ length: cols }).map((_, i) => (
          <BrandedSkeleton key={i} height={16} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table__row" style={{ animationDelay: `${rowIndex * 0.1}s` }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <BrandedSkeleton key={colIndex} height={14} width={`${60 + Math.random() * 30}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

// Chart Skeleton
export function ChartSkeleton({ type = "bar" }: { type?: "bar" | "line" | "pie" }) {
  if (type === "pie") {
    return (
      <div className="skeleton-chart skeleton-chart--pie">
        <BrandedSkeleton variant="circular" width={200} height={200} />
        <div className="skeleton-chart__legend">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-chart__legend-item">
              <BrandedSkeleton variant="circular" width={12} height={12} />
              <BrandedSkeleton width={60} height={12} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="skeleton-chart skeleton-chart--bar">
      <div className="skeleton-chart__bars">
        {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
          <div key={i} className="skeleton-chart__bar" style={{ animationDelay: `${i * 0.1}s` }}>
            <BrandedSkeleton height={`${h}%`} variant="rounded" />
          </div>
        ))}
      </div>
      <div className="skeleton-chart__axis">
        <BrandedSkeleton height={2} />
      </div>
    </div>
  );
}

// Metric Card Skeleton
export function MetricSkeleton() {
  return (
    <div className="skeleton-metric">
      <div className="skeleton-metric__icon">
        <BrandedSkeleton variant="rounded" width={48} height={48} />
      </div>
      <div className="skeleton-metric__content">
        <BrandedSkeleton width={100} height={28} />
        <BrandedSkeleton width={80} height={14} />
      </div>
      <div className="skeleton-metric__trend">
        <BrandedSkeleton width={60} height={24} variant="rounded" />
      </div>
    </div>
  );
}

// Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="skeleton-dashboard">
      <div className="skeleton-dashboard__header">
        <BrandedSkeleton width={200} height={32} />
        <BrandedSkeleton width={120} height={36} variant="rounded" />
      </div>
      <div className="skeleton-dashboard__metrics">
        {[1, 2, 3, 4].map(i => (
          <MetricSkeleton key={i} />
        ))}
      </div>
      <div className="skeleton-dashboard__charts">
        <ChartSkeleton type="bar" />
        <ChartSkeleton type="pie" />
      </div>
      <TableSkeleton rows={5} cols={5} />
    </div>
  );
}

// Content Loading Wrapper with Tips
interface LoadingWrapperProps {
  isLoading: boolean;
  children: ReactNode;
  skeleton?: ReactNode;
  showTips?: boolean;
  minLoadTime?: number;
}

const loadingTips = [
  "💡 Tip: Use keyboard shortcuts for faster navigation",
  "🎯 Did you know? You can customize your dashboard layout",
  "⚡ Pro tip: Export data with one click using Cmd+E",
  "🔍 Try the global search with Cmd+K",
  "📊 Your data updates in real-time automatically",
  "🎨 Customize your theme in settings",
];

export function LoadingWrapper({
  isLoading,
  children,
  skeleton,
  showTips = true,
  minLoadTime = 300,
}: LoadingWrapperProps) {
  const [showContent, setShowContent] = useState(!isLoading);
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowContent(true), minLoadTime);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isLoading, minLoadTime]);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % loadingTips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading]);

  if (showContent) {
    return <div className="loading-wrapper loading-wrapper--loaded">{children}</div>;
  }

  return (
    <div className="loading-wrapper loading-wrapper--loading">
      {skeleton || <DashboardSkeleton />}
      {showTips && (
        <div className="loading-wrapper__tip">
          <p>{loadingTips[currentTip]}</p>
        </div>
      )}
    </div>
  );
}
