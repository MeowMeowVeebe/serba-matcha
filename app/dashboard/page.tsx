"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Chart from "chart.js/auto";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import SkeletonBlock from "@/components/ui/SkeletonBlock";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import { Sparkline } from "@/components/ui/Sparkline";
import styles from "./Dashboard.module.css";

// Helper functions for order status
function getStatusBadgeVariant(status: string): string {
  switch (status) {
    case "delivered":
      return "success";
    case "preparing":
      return "warning";
    case "pending":
      return "info";
    case "cancelled":
      return "danger";
    default:
      return "default";
  }
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

type DashboardData = {
  metrics: {
    ordersToday: number;
    revenue: number;
    topDish: string;
  };
  recentOrders: Array<{
    id: string;
    customerName: string;
    item: string;
    total: number;
    status: "pending" | "preparing" | "delivered" | "cancelled";
  }>;
  chart: {
    labels: string[];
    values: number[];
  };
};

function DashboardInner({
  user,
  isLoadingUser,
  loadError,
}: {
  user: { name: string } | null;
  isLoadingUser: boolean;
  loadError: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Fetch dashboard data from API
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    setIsLoadingData(true);
    setDataError(null);

    try {
      const res = await fetch("/api/dashboard/data");
      if (!res.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Init chart when data is available
  useEffect(() => {
    if (!user || !dashboardData) {
      chartRef.current?.destroy();
      chartRef.current = null;
      return;
    }

    if (!canvasRef.current) return;

    chartRef.current?.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: dashboardData.chart.labels,
        datasets: [
          {
            label: "Pendapatan (Rp)",
            data: dashboardData.chart.values,
            borderColor: "#7FB783",
            backgroundColor: "rgba(127, 183, 131, 0.15)",
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: "#7FB783",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#fff",
            bodyColor: "#fff",
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(255, 255, 255, 0.06)" },
            ticks: { color: "rgba(255, 255, 255, 0.7)" },
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(255, 255, 255, 0.06)" },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)",
              callback: (value) => `Rp ${Number(value).toLocaleString("id-ID")}`,
            },
          },
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [user, dashboardData]);

  return (
    <div className={styles.page}>
      {/* Welcome Header */}
      <header className={styles.welcomeHeader}>
        <div>
          <h1 className={styles.welcomeTitle}>
            {user ? `Welcome back, ${user.name}` : "Dashboard"}
          </h1>
          <p className={styles.welcomeSubtitle}>
            Ringkasan aktivitas dan metrik utama Anda.
          </p>
        </div>
        {user && (
          <div className={styles.headerActions}>
            <Link className="secondary-btn" href="/admin/audit-logs">
              Audit Logs
            </Link>
            <Link className="primary-btn" href="/settings">
              Settings
            </Link>
          </div>
        )}
      </header>

      {/* Metrics Section */}
      <section id="metrics" className={styles.section}>
        <div className={styles.metricsGrid}>
          {isLoadingUser || isLoadingData ? (
          <>
            <div className={styles.metricCard} aria-hidden>
              <SkeletonBlock height={14} width="60%" />
              <div style={{ height: 10 }} />
              <SkeletonBlock height={22} width="40%" />
            </div>
            <div className={styles.metricCard} aria-hidden>
              <SkeletonBlock height={14} width="55%" />
              <div style={{ height: 10 }} />
              <SkeletonBlock height={22} width="35%" />
            </div>
            <div className={styles.metricCard} aria-hidden>
              <SkeletonBlock height={14} width="50%" />
              <div style={{ height: 10 }} />
              <SkeletonBlock height={22} width="45%" />
            </div>
          </>
        ) : user && dashboardData ? (
          <>
            <div className={styles.metricCard}>
              <h3>Orders Today</h3>
              <p>{dashboardData.metrics.ordersToday}</p>
              <Sparkline values={dashboardData.chart.values.slice(-5).map(v => v / 10000)} />
            </div>
            <div className={styles.metricCard}>
              <h3>Revenue</h3>
              <p>Rp {dashboardData.metrics.revenue.toLocaleString("id-ID")}</p>
            </div>
            <div className={styles.metricCard}>
              <h3>Top Dish</h3>
              <p>{dashboardData.metrics.topDish}</p>
            </div>
          </>
        ) : (
          <div style={{ gridColumn: "1 / -1" }}>
            <div className={styles.emptyState}>
              {loadError || dataError ? (
                <>
                  <div className={styles.emptyIcon}>⚠️</div>
                  <h3>Terjadi Kesalahan</h3>
                  <p>Gagal memuat data dashboard. Silakan coba lagi.</p>
                  <button 
                    className="primary-btn" 
                    onClick={() => window.location.reload()}
                  >
                    Muat Ulang
                  </button>
                </>
              ) : (
                <>
                  <div className={styles.emptyIcon}>🔐</div>
                  <h3>Akses Terbatas</h3>
                  <p>Silakan login untuk melihat data dashboard.</p>
                  <Link className="primary-btn" href="/login">
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
        </div>
      </section>

      {/* Charts Section */}
      {isLoadingUser || isLoadingData ? (
        <section id="charts" className={styles.section}>
          <SmartSkeleton variant="card" />
        </section>
      ) : user && dashboardData ? (
        <section id="charts" className={styles.section}>
          <div className={styles.chartCard}>
            <div className={styles.chartContainer}>
              <canvas ref={canvasRef} />
            </div>
          </div>
        </section>
      ) : null}

      {/* Orders Section */}
      {user && dashboardData && (
        <section id="orders" className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Orders</h2>
          </div>

          <div className={styles.tableWrap}>
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
                {dashboardData.recentOrders.length > 0 ? (
                  dashboardData.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="mono">{order.id}</td>
                      <td>{order.customerName}</td>
                      <td>{order.item}</td>
                      <td>
                        <span className={`badge badge--${getStatusBadgeVariant(order.status)}`}>
                          {formatStatus(order.status)}
                        </span>
                      </td>
                      <td>Rp{order.total.toLocaleString("id-ID")}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", opacity: 0.7 }}>
                      Belum ada order
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AccountShell
      title="Dashboard"
      description="Ringkasan aktivitas dan metrik utama"
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }]}
    >
      {({ user, isLoadingUser, loadError }) => (
        <DashboardInner user={user ? { name: user.name } : null} isLoadingUser={isLoadingUser} loadError={loadError} />
      )}
    </AccountShell>
  );
}
