"use client";

import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout, me, type AuthUser } from "@/lib/authClient";

export default function Page() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    void (async () => {
      setIsLoadingUser(true);
      const res = await me();
      if (!res.ok) {
        router.push("/login");
        return;
      }
      setUser(res.user);
      setIsLoadingUser(false);
    })();
  }, [router]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      router.push("/login");
    }
  };

  // INIT CHART
  useEffect(() => {
    if (!canvasRef.current) return;

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Pendapatan (Rp)",
            data: [500000, 650000, 700000, 450000, 800000, 750000, 900000],
            borderColor: "#FF4B3E",
            backgroundColor: "rgba(255,75,62,0.2)",
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#222" } },
          y: {
            beginAtZero: true,
            ticks: { color: "#222" },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, []);

  // TOGGLE THEME
  useEffect(() => {
    document.body.className = theme;

    if (!chartRef.current) return;

    const isDark = theme === "dark";

    chartRef.current.data.datasets[0].borderColor = isDark
      ? "#FFD93D"
      : "#FF4B3E";

    chartRef.current.options.scales!.x!.ticks!.color = isDark
      ? "#FFFFFF"
      : "#222222";

    chartRef.current.options.scales!.y!.ticks!.color = isDark
      ? "#FFFFFF"
      : "#222222";

    chartRef.current.update();
  }, [theme]);

  return (
    <>
      <div className="sidebar">
        <h2>Serba Matchia</h2>

        {isLoadingUser ? (
          <div className="sidebar-user sidebar-user-skeleton" aria-hidden />
        ) : user ? (
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user.name.slice(0, 1).toUpperCase()}</div>
            <div className="sidebar-user-meta">
              <p className="sidebar-user-name">{user.name}</p>
              <p className="sidebar-user-email">{user.email}</p>
            </div>
          </div>
        ) : null}

        <Link className="nav-link active" href="/dashboard">
          Dashboard
        </Link>
        <Link className="nav-link" href="/settings">
          Settings
        </Link>

        <button className="nav-link nav-link-btn" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>

      <div className="main">
        <div className="header">
          <h2>Dashboard</h2>
          <button onClick={() => setTheme(t => (t === "dark" ? "light" : "dark"))}>
            Toggle Dark Mode
          </button>
        </div>

        <div className="cards">
          <div className="card">
            <h3>Orders Today</h3>
            <p>120</p>
          </div>
          <div className="card">
            <h3>Revenue</h3>
            <p>Rp 15.000.000</p>
          </div>
          <div className="card">
            <h3>Top Dish</h3>
            <p>Nasi Goreng</p>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ maxWidth: "100%" }} />

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Item</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>001</td>
                <td>Alice</td>
                <td>Nasi Goreng</td>
                <td>Delivered</td>
                <td>Rp45.000</td>
              </tr>
              <tr>
                <td>002</td>
                <td>Bob</td>
                <td>Burger</td>
                <td>Preparing</td>
                <td>Rp60.000</td>
              </tr>
              <tr>
                <td>003</td>
                <td>Clara</td>
                <td>Salad</td>
                <td>Delivered</td>
                <td>Rp35.000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
