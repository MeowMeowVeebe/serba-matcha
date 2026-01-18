"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface JourneyNode {
  id: string;
  label: string;
  description?: string;
  x: number;
  y: number;
  type: "start" | "action" | "decision" | "end" | "milestone";
  status?: "completed" | "active" | "pending" | "error";
  metrics?: {
    users?: number;
    conversionRate?: number;
    avgTime?: string;
  };
}

interface JourneyConnection {
  from: string;
  to: string;
  label?: string;
  weight?: number; // For flow visualization
}

interface JourneyMapProps {
  nodes: JourneyNode[];
  connections: JourneyConnection[];
  width?: number;
  height?: number;
  onNodeClick?: (node: JourneyNode) => void;
  showFlow?: boolean;
  className?: string;
}

export function JourneyMap({
  nodes,
  connections,
  width = 800,
  height = 500,
  onNodeClick,
  showFlow = true,
  className = "",
}: JourneyMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<JourneyNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [flowProgress, setFlowProgress] = useState(0);

  // Animate flow particles
  useEffect(() => {
    if (!showFlow) return;
    
    const animate = () => {
      setFlowProgress(prev => (prev + 0.5) % 100);
    };
    
    const interval = setInterval(animate, 50);
    return () => clearInterval(interval);
  }, [showFlow]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as Element).classList.contains("journey-map__bg")) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => setIsDragging(false);

  // Zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(2, prev.scale * delta)),
    }));
  };

  const getNodeColor = (type: JourneyNode["type"], status?: JourneyNode["status"]) => {
    if (status === "error") return "var(--color-error)";
    if (status === "active") return "var(--color-warning)";
    if (status === "completed") return "var(--color-success)";
    
    const colors: Record<string, string> = {
      start: "var(--color-primary)",
      action: "var(--color-secondary)",
      decision: "var(--color-warning)",
      end: "var(--color-success)",
      milestone: "var(--color-accent)",
    };
    return colors[type] || "var(--color-primary)";
  };

  const getNodeShape = (type: JourneyNode["type"]) => {
    switch (type) {
      case "start":
      case "end":
        return "circle";
      case "decision":
        return "diamond";
      default:
        return "rect";
    }
  };

  const renderNode = (node: JourneyNode) => {
    const shape = getNodeShape(node.type);
    const color = getNodeColor(node.type, node.status);
    const isHovered = hoveredNode === node.id;
    const isSelected = selectedNode?.id === node.id;
    const size = isHovered ? 1.1 : 1;

    return (
      <g
        key={node.id}
        className={`journey-node journey-node--${node.type} ${isSelected ? "journey-node--selected" : ""}`}
        transform={`translate(${node.x}, ${node.y}) scale(${size})`}
        onMouseEnter={() => setHoveredNode(node.id)}
        onMouseLeave={() => setHoveredNode(null)}
        onClick={() => {
          setSelectedNode(node);
          onNodeClick?.(node);
        }}
        style={{ cursor: "pointer" }}
      >
        {shape === "circle" && (
          <circle r="30" fill={color} className="journey-node__shape" />
        )}
        {shape === "rect" && (
          <rect x="-40" y="-25" width="80" height="50" rx="8" fill={color} className="journey-node__shape" />
        )}
        {shape === "diamond" && (
          <polygon points="0,-35 40,0 0,35 -40,0" fill={color} className="journey-node__shape" />
        )}
        
        {/* Node label */}
        <text
          y={shape === "circle" ? 5 : 0}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="12"
          fontWeight="500"
        >
          {node.label.length > 10 ? node.label.slice(0, 10) + "..." : node.label}
        </text>

        {/* Status indicator */}
        {node.status && (
          <circle
            cx={shape === "circle" ? 20 : 30}
            cy={shape === "circle" ? -20 : -18}
            r="8"
            fill={getNodeColor(node.type, node.status)}
            stroke="var(--color-bg)"
            strokeWidth="2"
          />
        )}

        {/* Hover tooltip */}
        {isHovered && node.metrics && (
          <g className="journey-node__tooltip" transform="translate(0, -50)">
            <rect x="-60" y="-40" width="120" height="35" rx="6" fill="var(--color-bg-elevated)" />
            <text y="-28" textAnchor="middle" fill="var(--color-text)" fontSize="10">
              {node.metrics.users && `${node.metrics.users} users`}
              {node.metrics.conversionRate && ` • ${node.metrics.conversionRate}%`}
            </text>
          </g>
        )}
      </g>
    );
  };

  const renderConnection = (conn: JourneyConnection, index: number) => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    if (!fromNode || !toNode) return null;

    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const controlX = fromNode.x + dx / 2;
    const controlY = fromNode.y + dy / 2 - Math.abs(dx) * 0.2;
    
    const path = `M ${fromNode.x} ${fromNode.y} Q ${controlX} ${controlY} ${toNode.x} ${toNode.y}`;
    const isHighlighted = hoveredNode === conn.from || hoveredNode === conn.to;
    const strokeWidth = conn.weight ? Math.max(2, Math.min(8, conn.weight / 10)) : 2;

    return (
      <g key={`${conn.from}-${conn.to}-${index}`} className="journey-connection">
        {/* Background path */}
        <path
          d={path}
          fill="none"
          stroke={isHighlighted ? "var(--color-primary)" : "var(--color-border)"}
          strokeWidth={strokeWidth}
          strokeOpacity={isHighlighted ? 0.8 : 0.4}
          className="journey-connection__line"
        />
        
        {/* Animated flow particles */}
        {showFlow && (
          <circle r="4" fill="var(--color-primary)">
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              path={path}
              begin={`${index * 0.3}s`}
            />
          </circle>
        )}

        {/* Arrow marker */}
        <circle
          cx={toNode.x - (dx / Math.sqrt(dx*dx + dy*dy)) * 35}
          cy={toNode.y - (dy / Math.sqrt(dx*dx + dy*dy)) * 35}
          r="4"
          fill={isHighlighted ? "var(--color-primary)" : "var(--color-border)"}
        />

        {/* Connection label */}
        {conn.label && (
          <text
            x={controlX}
            y={controlY - 10}
            textAnchor="middle"
            fill="var(--color-text-muted)"
            fontSize="10"
          >
            {conn.label}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className={`journey-map-container ${className}`}>
      <div className="journey-map__controls">
        <button onClick={() => setTransform(prev => ({ ...prev, scale: prev.scale * 1.2 }))}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <button onClick={() => setTransform(prev => ({ ...prev, scale: prev.scale * 0.8 }))}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 8h8" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <button onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="journey-map"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect className="journey-map__bg" width={width} height={height} fill="transparent" />

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Render connections first (behind nodes) */}
          {connections.map((conn, i) => renderConnection(conn, i))}
          
          {/* Render nodes */}
          {nodes.map(renderNode)}
        </g>
      </svg>

      {/* Node detail panel */}
      {selectedNode && (
        <div className="journey-map__detail glass-card">
          <button className="journey-map__detail-close" onClick={() => setSelectedNode(null)}>×</button>
          <h4>{selectedNode.label}</h4>
          {selectedNode.description && <p>{selectedNode.description}</p>}
          {selectedNode.metrics && (
            <div className="journey-map__metrics">
              {selectedNode.metrics.users && (
                <div className="journey-map__metric">
                  <span className="journey-map__metric-value">{selectedNode.metrics.users}</span>
                  <span className="journey-map__metric-label">Users</span>
                </div>
              )}
              {selectedNode.metrics.conversionRate && (
                <div className="journey-map__metric">
                  <span className="journey-map__metric-value">{selectedNode.metrics.conversionRate}%</span>
                  <span className="journey-map__metric-label">Conversion</span>
                </div>
              )}
              {selectedNode.metrics.avgTime && (
                <div className="journey-map__metric">
                  <span className="journey-map__metric-value">{selectedNode.metrics.avgTime}</span>
                  <span className="journey-map__metric-label">Avg Time</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type { JourneyNode, JourneyConnection };
