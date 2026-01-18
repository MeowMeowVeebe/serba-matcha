"use client";

import { useState, useRef, type ReactNode, type MouseEvent } from "react";

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "bordered" | "glass";
  hoverEffect?: "tilt" | "lift" | "glow" | "all";
  onClick?: () => void;
  disabled?: boolean;
  actions?: ReactNode;
}

export function InteractiveCard({
  children,
  className = "",
  variant = "default",
  hoverEffect = "all",
  onClick,
  disabled = false,
  actions,
}: InteractiveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tiltStyle, setTiltStyle] = useState({ rotateX: 0, rotateY: 0 });
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || disabled) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate tilt angles (max 10 degrees)
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    // Calculate glow position as percentage
    const glowX = (x / rect.width) * 100;
    const glowY = (y / rect.height) * 100;

    if (hoverEffect === "tilt" || hoverEffect === "all") {
      setTiltStyle({ rotateX, rotateY });
    }
    setGlowPosition({ x: glowX, y: glowY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTiltStyle({ rotateX: 0, rotateY: 0 });
    setGlowPosition({ x: 50, y: 50 });
  };

  const cardClasses = [
    "interactive-card",
    `interactive-card--${variant}`,
    `interactive-card--hover-${hoverEffect}`,
    isHovered ? "interactive-card--hovered" : "",
    disabled ? "interactive-card--disabled" : "",
    onClick ? "interactive-card--clickable" : "",
    className,
  ].filter(Boolean).join(" ");

  const transform = [
    `perspective(1000px)`,
    `rotateX(${tiltStyle.rotateX}deg)`,
    `rotateY(${tiltStyle.rotateY}deg)`,
    isHovered && (hoverEffect === "lift" || hoverEffect === "all") ? "translateY(-8px)" : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={cardRef}
      className={cardClasses}
      style={{
        transform,
        "--glow-x": `${glowPosition.x}%`,
        "--glow-y": `${glowPosition.y}%`,
      } as React.CSSProperties}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={disabled ? undefined : onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
    >
      {/* Glow overlay */}
      {(hoverEffect === "glow" || hoverEffect === "all") && (
        <div className="interactive-card__glow" />
      )}
      
      {/* Accent border */}
      <div className="interactive-card__border" />
      
      {/* Content */}
      <div className="interactive-card__content">
        {children}
      </div>

      {/* Hidden actions that appear on hover */}
      {actions && (
        <div className={`interactive-card__actions ${isHovered ? "interactive-card__actions--visible" : ""}`}>
          {actions}
        </div>
      )}
    </div>
  );
}

// Metric Card with Micro-interactions
interface MetricCardProps {
  icon: string;
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  trend?: number[];
  onClick?: () => void;
}

export function MetricCard({
  icon,
  title,
  value,
  change,
  changeType = "neutral",
  trend,
  onClick,
}: MetricCardProps) {
  return (
    <InteractiveCard
      variant="elevated"
      hoverEffect="all"
      onClick={onClick}
      className="metric-card-interactive"
    >
      <div className="metric-card__header">
        <span className="metric-card__icon">{icon}</span>
        {change && (
          <span className={`metric-card__change metric-card__change--${changeType}`}>
            {change}
          </span>
        )}
      </div>
      <div className="metric-card__value">{value}</div>
      <div className="metric-card__title">{title}</div>
      {trend && trend.length > 0 && (
        <div className="metric-card__trend">
          <MiniSparkline data={trend} color={changeType === "positive" ? "#7FB783" : changeType === "negative" ? "#E57373" : "#9CA3AF"} />
        </div>
      )}
    </InteractiveCard>
  );
}

// Mini Sparkline for trends
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 40" className="mini-sparkline" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
