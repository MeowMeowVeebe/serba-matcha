"use client";

export type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  variant?: "text" | "circular" | "rectangular";
  className?: string;
};

export function Skeleton({ width, height = 20, variant = "text", className = "" }: SkeletonProps) {
  const baseClass = "ds-skeleton";
  const variantClass = `ds-skeleton--${variant}`;

  const style: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  return <div className={`${baseClass} ${variantClass} ${className}`} style={style} aria-busy="true" aria-live="polite" />;
}

export type SkeletonTextProps = {
  lines?: number;
  className?: string;
};

export function SkeletonText({ lines = 3, className = "" }: SkeletonTextProps) {
  return (
    <div className={`ds-skeleton-text ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? "60%" : "100%"} height={14} />
      ))}
    </div>
  );
}

export type SkeletonCardProps = {
  hasHeader?: boolean;
  lines?: number;
  className?: string;
};

export function SkeletonCard({ hasHeader = true, lines = 3, className = "" }: SkeletonCardProps) {
  return (
    <div className={`ds-skeleton-card ${className}`}>
      {hasHeader && (
        <div className="ds-skeleton-card__header">
          <Skeleton width="40%" height={20} />
          <Skeleton width="60%" height={14} />
        </div>
      )}
      <div className="ds-skeleton-card__body">
        <SkeletonText lines={lines} />
      </div>
    </div>
  );
}
