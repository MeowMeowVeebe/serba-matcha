"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export type BarChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
};

export type BarChartProps = {
  data: BarChartData;
  height?: number;
  horizontal?: boolean;
  options?: any;
};

export function BarChart({ data, height = 300, horizontal = false, options = {} }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Destroy previous chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Create new chart
    chartRef.current = new Chart(ctx, {
      type: horizontal ? "bar" : "bar",
      data: {
        labels: data.labels,
        datasets: data.datasets.map((dataset, index) => ({
          ...dataset,
          backgroundColor: dataset.backgroundColor || `hsla(${index * 60}, 70%, 50%, 0.8)`,
          borderColor: dataset.borderColor || `hsl(${index * 60}, 70%, 50%)`,
          borderWidth: 1,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: horizontal ? "y" : "x",
        plugins: {
          legend: {
            display: data.datasets.length > 1,
            position: "top",
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          x: {
            grid: {
              display: !horizontal,
              color: "rgba(0, 0, 0, 0.05)",
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              display: horizontal,
              color: "rgba(0, 0, 0, 0.05)",
            },
          },
        },
        ...options,
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, horizontal, options]);

  return (
    <div style={{ height: `${height}px`, position: "relative" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
