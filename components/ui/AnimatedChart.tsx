"use client";

import { useEffect, useState, useRef } from "react";

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

// Animated Line Chart with Draw Effect
interface AnimatedLineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  color?: string;
  fillGradient?: boolean;
  showDots?: boolean;
  showLabels?: boolean;
  duration?: number;
  className?: string;
}

export function AnimatedLineChart({
  data,
  width = 400,
  height = 200,
  strokeWidth = 2,
  color = "var(--color-primary)",
  fillGradient = true,
  showDots = true,
  showLabels = false,
  duration = 1500,
  className = "",
}: AnimatedLineChartProps) {
  const [drawProgress, setDrawProgress] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const padding = { top: 20, right: 20, bottom: 30, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = data.map(d => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.value - min) / range) * chartHeight,
  }));

  const pathD = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = points[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 3;
    const cp2x = point.x - (point.x - prev.x) / 3;
    return `${acc} C ${cp1x} ${prev.y}, ${cp2x} ${point.y}, ${point.x} ${point.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  useEffect(() => {
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setDrawProgress(eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [duration]);

  const pathLength = pathRef.current?.getTotalLength() || 1000;

  return (
    <svg 
      width={width} 
      height={height} 
      className={`animated-line-chart ${className}`}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <clipPath id="revealClip">
          <rect x="0" y="0" width={width * drawProgress} height={height} />
        </clipPath>
      </defs>

      {fillGradient && (
        <path
          d={areaD}
          fill="url(#lineGradient)"
          clipPath="url(#revealClip)"
          className="animated-line-chart__area"
        />
      )}

      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={pathLength}
        strokeDashoffset={pathLength * (1 - drawProgress)}
        className="animated-line-chart__line"
      />

      {showDots && points.map((point, i) => (
        <g key={i} style={{ opacity: drawProgress > i / points.length ? 1 : 0 }}>
          <circle
            cx={point.x}
            cy={point.y}
            r={hoveredIndex === i ? 6 : 4}
            fill={color}
            className="animated-line-chart__dot"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
          {hoveredIndex === i && (
            <g className="animated-line-chart__tooltip">
              <rect
                x={point.x - 30}
                y={point.y - 35}
                width="60"
                height="25"
                rx="4"
                fill="var(--color-bg-elevated)"
                stroke="var(--color-border)"
              />
              <text
                x={point.x}
                y={point.y - 18}
                textAnchor="middle"
                fill="var(--color-text)"
                fontSize="12"
              >
                {data[i].value}
              </text>
            </g>
          )}
        </g>
      ))}

      {showLabels && points.map((point, i) => (
        <text
          key={`label-${i}`}
          x={point.x}
          y={height - 8}
          textAnchor="middle"
          fill="var(--color-text-muted)"
          fontSize="10"
          style={{ opacity: drawProgress > i / points.length ? 1 : 0 }}
        >
          {data[i].label}
        </text>
      ))}
    </svg>
  );
}

// Animated Bar Chart
interface AnimatedBarChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  barRadius?: number;
  duration?: number;
  stagger?: number;
  className?: string;
}

export function AnimatedBarChart({
  data,
  width = 400,
  height = 200,
  barRadius = 4,
  duration = 800,
  stagger = 100,
  className = "",
}: AnimatedBarChartProps) {
  const [animatedHeights, setAnimatedHeights] = useState<number[]>(data.map(() => 0));

  const padding = { top: 20, right: 20, bottom: 40, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const max = Math.max(...data.map(d => d.value));
  const barWidth = chartWidth / data.length - 8;

  useEffect(() => {
    data.forEach((d, i) => {
      setTimeout(() => {
        const startTime = performance.now();
        const targetHeight = (d.value / max) * chartHeight;

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          
          setAnimatedHeights(prev => {
            const next = [...prev];
            next[i] = targetHeight * eased;
            return next;
          });

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      }, i * stagger);
    });
  }, [data, duration, stagger, chartHeight, max]);

  return (
    <svg 
      width={width} 
      height={height} 
      className={`animated-bar-chart ${className}`}
      viewBox={`0 0 ${width} ${height}`}
    >
      {data.map((d, i) => {
        const x = padding.left + i * (chartWidth / data.length) + 4;
        const barHeight = animatedHeights[i];
        const y = padding.top + chartHeight - barHeight;

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={barRadius}
              fill={d.color || "var(--color-primary)"}
              className="animated-bar-chart__bar"
            />
            <text
              x={x + barWidth / 2}
              y={height - 8}
              textAnchor="middle"
              fill="var(--color-text-muted)"
              fontSize="10"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
