"use client";

import { useEffect, useState, useRef, useMemo } from "react";

interface AmbientBackgroundProps {
  variant?: "gradient" | "particles" | "geometric" | "waves" | "aurora";
  colorScheme?: "primary" | "secondary" | "warm" | "cool" | "rainbow";
  intensity?: "subtle" | "medium" | "vibrant";
  speed?: "slow" | "normal" | "fast";
  interactive?: boolean;
  enabled?: boolean;
  className?: string;
}

export function AmbientBackground({
  variant = "gradient",
  colorScheme = "primary",
  intensity = "subtle",
  speed = "slow",
  interactive = false,
  enabled = true,
  className = "",
}: AmbientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  const colors = useMemo(() => {
    const schemes: Record<string, string[]> = {
      primary: ["#7FB783", "#6B9C6F", "#A8D5AA", "#5A8A5E"],
      secondary: ["#60A5FA", "#3B82F6", "#93C5FD", "#2563EB"],
      warm: ["#FB923C", "#F97316", "#FDBA74", "#EA580C"],
      cool: ["#A78BFA", "#8B5CF6", "#C4B5FD", "#7C3AED"],
      rainbow: ["#F87171", "#FBBF24", "#34D399", "#60A5FA", "#A78BFA"],
    };
    return schemes[colorScheme];
  }, [colorScheme]);

  const opacityMap = { subtle: 0.1, medium: 0.2, vibrant: 0.35 };
  const speedMap = { slow: 0.0005, normal: 0.001, fast: 0.002 };

  useEffect(() => {
    if (!enabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let time = 0;
    const baseOpacity = opacityMap[intensity];
    const animSpeed = speedMap[speed];

    // Particle system for "particles" variant
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      opacity: number;
    }> = [];

    if (variant === "particles") {
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 4 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: Math.random() * baseOpacity + baseOpacity * 0.5,
        });
      }
    }

    // Geometric shapes for "geometric" variant
    const shapes: Array<{
      x: number;
      y: number;
      size: number;
      rotation: number;
      rotationSpeed: number;
      type: "circle" | "triangle" | "square";
      color: string;
    }> = [];

    if (variant === "geometric") {
      const types: Array<"circle" | "triangle" | "square"> = ["circle", "triangle", "square"];
      for (let i = 0; i < 15; i++) {
        shapes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 60 + 30,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.01,
          type: types[Math.floor(Math.random() * types.length)],
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    const animate = () => {
      time += animSpeed;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      switch (variant) {
        case "gradient":
          drawGradient(ctx, canvas, time, colors, baseOpacity, mousePos, interactive);
          break;
        case "particles":
          drawParticles(ctx, canvas, particles, baseOpacity, mousePos, interactive);
          break;
        case "geometric":
          drawGeometric(ctx, shapes, baseOpacity, time);
          break;
        case "waves":
          drawWaves(ctx, canvas, time, colors, baseOpacity);
          break;
        case "aurora":
          drawAurora(ctx, canvas, time, colors, baseOpacity);
          break;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [enabled, variant, colors, intensity, speed, interactive, mousePos]);

  useEffect(() => {
    if (!interactive) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [interactive]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`ambient-background ${className}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

// Drawing functions
function drawGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  time: number,
  colors: string[],
  opacity: number,
  mousePos: { x: number; y: number },
  interactive: boolean
) {
  const gradient = ctx.createRadialGradient(
    canvas.width / 2 + Math.sin(time) * 200 + (interactive ? (mousePos.x - canvas.width / 2) * 0.1 : 0),
    canvas.height / 2 + Math.cos(time) * 200 + (interactive ? (mousePos.y - canvas.height / 2) * 0.1 : 0),
    0,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width * 0.8
  );

  colors.forEach((color, i) => {
    const stop = i / (colors.length - 1);
    const adjustedColor = hexToRgba(color, opacity * (1 - stop * 0.5));
    gradient.addColorStop(stop, adjustedColor);
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Additional gradient blobs
  for (let i = 0; i < 3; i++) {
    const blobGradient = ctx.createRadialGradient(
      canvas.width * (0.2 + i * 0.3) + Math.sin(time + i) * 100,
      canvas.height * (0.3 + Math.sin(time + i * 2) * 0.3),
      0,
      canvas.width * (0.2 + i * 0.3),
      canvas.height * 0.5,
      300
    );
    blobGradient.addColorStop(0, hexToRgba(colors[i % colors.length], opacity));
    blobGradient.addColorStop(1, "transparent");
    ctx.fillStyle = blobGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; color: string; opacity: number }>,
  opacity: number,
  mousePos: { x: number; y: number },
  interactive: boolean
) {
  particles.forEach(p => {
    // Update position
    p.x += p.vx;
    p.y += p.vy;

    // Wrap around edges
    if (p.x < 0) p.x = canvas.width;
    if (p.x > canvas.width) p.x = 0;
    if (p.y < 0) p.y = canvas.height;
    if (p.y > canvas.height) p.y = 0;

    // Interactive mouse effect
    if (interactive) {
      const dx = mousePos.x - p.x;
      const dy = mousePos.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        p.vx -= dx * 0.0001;
        p.vy -= dy * 0.0001;
      }
    }

    // Draw particle
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(p.color, p.opacity);
    ctx.fill();
  });

  // Draw connections between nearby particles
  particles.forEach((p1, i) => {
    particles.slice(i + 1).forEach(p2 => {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = hexToRgba(p1.color, (1 - dist / 150) * opacity * 0.5);
        ctx.stroke();
      }
    });
  });
}

function drawGeometric(
  ctx: CanvasRenderingContext2D,
  shapes: Array<{ x: number; y: number; size: number; rotation: number; rotationSpeed: number; type: string; color: string }>,
  opacity: number,
  time: number
) {
  shapes.forEach(shape => {
    shape.rotation += shape.rotationSpeed;
    
    ctx.save();
    ctx.translate(shape.x, shape.y);
    ctx.rotate(shape.rotation);
    ctx.globalAlpha = opacity;
    ctx.fillStyle = shape.color;
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = 2;

    switch (shape.type) {
      case "circle":
        ctx.beginPath();
        ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case "triangle":
        ctx.beginPath();
        ctx.moveTo(0, -shape.size / 2);
        ctx.lineTo(-shape.size / 2, shape.size / 2);
        ctx.lineTo(shape.size / 2, shape.size / 2);
        ctx.closePath();
        ctx.stroke();
        break;
      case "square":
        ctx.strokeRect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
        break;
    }

    ctx.restore();
  });
}

function drawWaves(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  time: number,
  colors: string[],
  opacity: number
) {
  colors.forEach((color, i) => {
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    
    for (let x = 0; x <= canvas.width; x += 10) {
      const y = canvas.height * 0.7 +
        Math.sin(x * 0.01 + time * 10 + i) * 30 +
        Math.sin(x * 0.02 + time * 15 + i * 2) * 20;
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fillStyle = hexToRgba(color, opacity * (0.5 + i * 0.1));
    ctx.fill();
  });
}

function drawAurora(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  time: number,
  colors: string[],
  opacity: number
) {
  for (let i = 0; i < colors.length; i++) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(0.4, hexToRgba(colors[i], opacity * 0.8));
    gradient.addColorStop(0.6, hexToRgba(colors[(i + 1) % colors.length], opacity));
    gradient.addColorStop(1, "transparent");

    ctx.beginPath();
    ctx.moveTo(0, 0);
    
    for (let x = 0; x <= canvas.width; x += 5) {
      const y = canvas.height * 0.3 +
        Math.sin(x * 0.005 + time * 5 + i * 2) * 100 +
        Math.sin(x * 0.01 + time * 8 + i) * 50;
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

// Helper function
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Toggle Component for Ambient Background
interface AmbientToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  variant: AmbientBackgroundProps["variant"];
  onVariantChange: (variant: AmbientBackgroundProps["variant"]) => void;
}

export function AmbientToggle({ enabled, onToggle, variant, onVariantChange }: AmbientToggleProps) {
  const variants: AmbientBackgroundProps["variant"][] = ["gradient", "particles", "geometric", "waves", "aurora"];
  
  return (
    <div className="ambient-toggle">
      <button 
        className={`ambient-toggle__btn ${enabled ? "active" : ""}`}
        onClick={() => onToggle(!enabled)}
      >
        {enabled ? "🌈" : "⚫"}
      </button>
      {enabled && (
        <div className="ambient-toggle__options">
          {variants.map(v => (
            <button
              key={v}
              className={`ambient-toggle__option ${variant === v ? "active" : ""}`}
              onClick={() => onVariantChange(v)}
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
