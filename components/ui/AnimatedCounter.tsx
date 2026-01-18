"use client";

import { useEffect, useState, useRef } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  easing?: "linear" | "easeOut" | "easeInOut" | "spring";
}

export function AnimatedCounter({
  value,
  duration = 1500,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
  easing = "easeOut",
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number>();

  const easingFunctions = {
    linear: (t: number) => t,
    easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
    easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    spring: (t: number) => 1 - Math.pow(Math.cos(t * Math.PI / 2), 3),
  };

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();
    const easeFn = easingFunctions[easing];

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeFn(progress);
      
      const current = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, easing]);

  const formattedValue = displayValue.toFixed(decimals);
  const [intPart, decPart] = formattedValue.split(".");

  return (
    <span className={`animated-counter ${className}`}>
      {prefix}
      <span className="animated-counter__int">
        {parseInt(intPart).toLocaleString()}
      </span>
      {decimals > 0 && decPart && (
        <span className="animated-counter__dec">.{decPart}</span>
      )}
      {suffix}
    </span>
  );
}

// Animated Percentage with Ring
interface AnimatedRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  duration?: number;
  showValue?: boolean;
  className?: string;
}

export function AnimatedRing({
  value,
  size = 80,
  strokeWidth = 8,
  color = "var(--color-primary)",
  bgColor = "var(--color-border)",
  duration = 1500,
  showValue = true,
  className = "",
}: AnimatedRingProps) {
  const [progress, setProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progressRatio, 3);
      
      setProgress(value * easedProgress);

      if (progressRatio < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <div className={`animated-ring ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="animated-ring__svg">
        <circle
          className="animated-ring__bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          className="animated-ring__progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showValue && (
        <div className="animated-ring__value">
          <AnimatedCounter value={progress} decimals={0} suffix="%" />
        </div>
      )}
    </div>
  );
}
