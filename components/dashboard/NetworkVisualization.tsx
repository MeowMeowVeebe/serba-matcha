"use client";

import { useEffect, useRef } from "react";
import { Card, CardHeader, CardBody } from "../ui/Card";

export type NetworkNode = {
  id: string;
  label: string;
  type: "user" | "role" | "permission";
  value?: number;
};

export type NetworkLink = {
  source: string;
  target: string;
  value?: number;
};

export type NetworkVisualizationProps = {
  nodes: NetworkNode[];
  links: NetworkLink[];
  width?: number;
  height?: number;
};

export function NetworkVisualization({ nodes, links, width = 800, height = 600 }: NetworkVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Simple force-directed graph simulation
    const nodePositions = new Map<string, { x: number; y: number; vx: number; vy: number }>();

    // Initialize positions
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) / 3;
      nodePositions.set(node.id, {
        x: width / 2 + radius * Math.cos(angle),
        y: height / 2 + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
      });
    });

    const getNodeColor = (type: string) => {
      switch (type) {
        case "user": return "#6B9C6F";
        case "role": return "#7FB783";
        case "permission": return "#A8D5A3";
        default: return "#999";
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw links
      ctx.strokeStyle = "#E5E7EB";
      ctx.lineWidth = 1;
      links.forEach((link) => {
        const source = nodePositions.get(link.source);
        const target = nodePositions.get(link.target);
        if (source && target) {
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach((node) => {
        const pos = nodePositions.get(node.id);
        if (!pos) return;

        const radius = 20 + (node.value || 0) * 2;

        // Node circle
        ctx.fillStyle = getNodeColor(node.type);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
        ctx.fill();

        // Node border
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node label
        ctx.fillStyle = "#374151";
        ctx.font = "12px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.label, pos.x, pos.y + radius + 15);
      });
    };

    // Simple physics simulation
    const simulate = () => {
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        // Repulsion between nodes
        nodes.forEach((node1) => {
          const pos1 = nodePositions.get(node1.id);
          if (!pos1) return;

          nodes.forEach((node2) => {
            if (node1.id === node2.id) return;
            const pos2 = nodePositions.get(node2.id);
            if (!pos2) return;

            const dx = pos2.x - pos1.x;
            const dy = pos2.y - pos1.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 500 / (distance * distance);

            pos1.vx -= (dx / distance) * force;
            pos1.vy -= (dy / distance) * force;
          });
        });

        // Attraction along links
        links.forEach((link) => {
          const source = nodePositions.get(link.source);
          const target = nodePositions.get(link.target);
          if (!source || !target) return;

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = distance * 0.01;

          source.vx += (dx / distance) * force;
          source.vy += (dy / distance) * force;
          target.vx -= (dx / distance) * force;
          target.vy -= (dy / distance) * force;
        });

        // Apply velocities and damping
        nodePositions.forEach((pos) => {
          pos.x += pos.vx;
          pos.y += pos.vy;
          pos.vx *= 0.9;
          pos.vy *= 0.9;

          // Keep within bounds
          pos.x = Math.max(50, Math.min(width - 50, pos.x));
          pos.y = Math.max(50, Math.min(height - 50, pos.y));
        });
      }

      draw();
    };

    simulate();
  }, [nodes, links, width, height]);

  return (
    <Card variant="bordered">
      <CardHeader
        title="Network Visualization"
        description="Interactive view of user-role-permission relationships"
      />
      <CardBody>
        <div style={{ overflowX: "auto" }}>
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
              border: "1px solid var(--color-gray-200)",
              borderRadius: "0.5rem",
            }}
          />
        </div>
        <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", fontSize: "0.875rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#6B9C6F" }} />
            <span>Users</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#7FB783" }} />
            <span>Roles</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#A8D5A3" }} />
            <span>Permissions</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
