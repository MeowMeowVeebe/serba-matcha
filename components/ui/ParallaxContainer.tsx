"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface ParallaxLayerProps {
  children: ReactNode;
  speed?: number; // 0 = no movement, 1 = normal scroll, <1 = slower, >1 = faster
  className?: string;
  direction?: "vertical" | "horizontal" | "both";
}

export function ParallaxLayer({ 
  children, 
  speed = 0.5, 
  className = "",
  direction = "vertical" 
}: ParallaxLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      if (!layerRef.current) return;
      
      const rect = layerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Calculate how far the element is from the center of the viewport
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = windowHeight / 2;
      const distanceFromCenter = elementCenter - viewportCenter;
      
      // Apply parallax effect based on distance from center
      const parallaxOffset = distanceFromCenter * (1 - speed);
      
      if (direction === "vertical" || direction === "both") {
        setOffset(prev => ({ ...prev, y: parallaxOffset }));
      }
      if (direction === "horizontal" || direction === "both") {
        setOffset(prev => ({ ...prev, x: parallaxOffset * 0.3 }));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed, direction]);

  return (
    <div
      ref={layerRef}
      className={`parallax-layer ${className}`}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}

interface ParallaxContainerProps {
  children: ReactNode;
  className?: string;
}

export function ParallaxContainer({ children, className = "" }: ParallaxContainerProps) {
  return (
    <div className={`parallax-container ${className}`}>
      {children}
    </div>
  );
}

// Parallax Card Component for Dashboard
interface ParallaxCardProps {
  children: ReactNode;
  index?: number;
  className?: string;
}

export function ParallaxCard({ children, index = 0, className = "" }: ParallaxCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ y: 0, rotate: 0, scale: 1 });

  useEffect(() => {
    const handleScroll = () => {
      if (!cardRef.current) return;
      
      const rect = cardRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate visibility percentage
      const visiblePercent = Math.max(0, Math.min(1, 
        (windowHeight - rect.top) / (windowHeight + rect.height)
      ));
      
      // Stagger effect based on index
      const staggerDelay = index * 0.1;
      const adjustedPercent = Math.max(0, visiblePercent - staggerDelay);
      
      // Calculate transforms
      const y = (1 - adjustedPercent) * 30;
      const rotate = (1 - adjustedPercent) * 2;
      const scale = 0.95 + (adjustedPercent * 0.05);
      
      setTransform({ y, rotate, scale });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [index]);

  return (
    <div
      ref={cardRef}
      className={`parallax-card ${className}`}
      style={{
        transform: `translateY(${transform.y}px) rotate(${transform.rotate}deg) scale(${transform.scale})`,
        opacity: transform.scale,
        willChange: "transform, opacity",
        transition: "transform 0.1s ease-out, opacity 0.1s ease-out",
      }}
    >
      {children}
    </div>
  );
}

// Floating Elements for Background
interface FloatingElementProps {
  size?: number;
  color?: string;
  delay?: number;
  duration?: number;
  shape?: "circle" | "square" | "triangle";
}

export function FloatingElement({ 
  size = 40, 
  color = "var(--color-primary)", 
  delay = 0,
  duration = 20,
  shape = "circle"
}: FloatingElementProps) {
  const shapeStyles: Record<string, React.CSSProperties> = {
    circle: { borderRadius: "50%" },
    square: { borderRadius: "8px" },
    triangle: { 
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      borderRadius: "0"
    },
  };

  return (
    <div
      className="floating-element"
      style={{
        width: size,
        height: size,
        background: color,
        opacity: 0.1,
        position: "absolute",
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        ...shapeStyles[shape],
      }}
    />
  );
}
