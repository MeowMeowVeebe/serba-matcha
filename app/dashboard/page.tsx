"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Chart from "chart.js/auto";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import SkeletonBlock from "@/components/ui/SkeletonBlock";

// Types
type DashboardData = {
  metrics: {
    ordersToday: number;
    revenue: number;
    topDish: string;
    totalCustomers: number;
    avgOrderValue: number;
    pendingOrders: number;
  };
  recentOrders: Array<{
    id: string;
    customerName: string;
    item: string;
    total: number;
    status: "pending" | "preparing" | "delivered" | "cancelled";
    time: string;
  }>;
  chart: {
    labels: string[];
    values: number[];
  };
  popularItems: Array<{
    name: string;
    orders: number;
    revenue: number;
  }>;
};

// Icons
const Icons = {
  orders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  revenue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  customers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  trending: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  ),
  arrowUp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 15l-6-6-6 6" />
    </svg>
  ),
  arrowDown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
};

// Helper functions
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getStatusBadge(status: string) {
  const config: Record<string, { class: string; label: string }> = {
    delivered: { class: "matcha-badge--success", label: "Delivered" },
    preparing: { class: "matcha-badge--warning", label: "Preparing" },
    pending: { class: "matcha-badge--info", label: "Pending" },
    cancelled: { class: "matcha-badge--danger", label: "Cancelled" },
  };
  const { class: cls, label } = config[status] || { class: "matcha-badge--neutral", label: status };
  return <span className={`matcha-badge ${cls}`}>{label}</span>;
}

// Stat Card Component
function StatCard({ icon, label, value, trend, trendValue }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      {trend && trendValue && (
        <div className={`stat-card__trend stat-card__trend--${trend}`}>
          {trend === "up" ? Icons.arrowUp : trend === "down" ? Icons.arrowDown : null}
          {trendValue}
        </div>
      )}
    </div>
  );
}

// Quick Action Component
function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="quick-action">
      <div className="quick-action__icon">{icon}</div>
      <span className="quick-action__label">{label}</span>
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <AccountShell
      title="Dashboard"
      description="Ringkasan bisnis Serba Matcha"
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      {({ user, isLoadingUser }) => (
        <DashboardContent user={user} isLoadingUser={isLoadingUser} />
      )}
    </AccountShell>
  );
}

function DashboardContent({ user, isLoadingUser }: { user: any; isLoadingUser: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"week" | "month" | "year">("week");
  const [chartData, setChartData] = useState<{ labels: string[]; values: number[] } | null>(null);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const hasFetched = useRef(false);

  // Fetch data function with period parameter
  const fetchData = useCallback(async (period: "week" | "month" | "year" = "week", showRefresh = false) => {
    if (!user) return;
    if (showRefresh) setIsRefreshing(true);
    else if (!hasFetched.current) setIsLoading(true);
    else setIsChartLoading(true);
    
    try {
      const res = await fetch(`/api/dashboard/data?period=${period}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        // Update chart data from API response
        if (json.chart) {
          setChartData({ labels: json.chart.labels, values: json.chart.values });
        }
      }
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsChartLoading(false);
    }
  }, [user]);

  // Initial fetch - only once when user is available
  useEffect(() => {
    if (user && !hasFetched.current) {
      hasFetched.current = true;
      fetchData(activeTab);
    }
  }, [user, fetchData, activeTab]);

  // Fetch new data when tab changes
  const handleTabChange = useCallback((tab: "week" | "month" | "year") => {
    setActiveTab(tab);
    fetchData(tab);
  }, [fetchData]);

  // Chart initialization
  useEffect(() => {
    if (!chartData || !canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(34, 197, 94, 0.3)");
    gradient.addColorStop(1, "rgba(34, 197, 94, 0)");

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: chartData.labels,
        datasets: [{
          label: "Revenue",
          data: chartData.values,
          borderColor: "#22c55e",
          backgroundColor: gradient,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#22c55e",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1f2937",
            titleColor: "#fff",
            bodyColor: "#fff",
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (ctx) => formatCurrency(ctx.raw as number),
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#9ca3af" },
          },
          y: {
            grid: { color: "rgba(156, 163, 175, 0.1)" },
            ticks: {
              color: "#9ca3af",
              callback: (value) => formatCurrency(value as number),
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
    };
  }, [chartData]);

  if (isLoadingUser || isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return (
      <div className="matcha-empty">
        <div className="matcha-empty__icon">{Icons.chart}</div>
        <h3 className="matcha-empty__title">Akses Terbatas</h3>
        <p className="matcha-empty__text">Silakan login untuk melihat dashboard.</p>
        <Link href="/login" className="matcha-btn matcha-btn--primary">Login</Link>
      </div>
    );
  }

  const metrics = data?.metrics || { ordersToday: 0, revenue: 0, topDish: "-", totalCustomers: 0, avgOrderValue: 0, pendingOrders: 0 };
  const orders = data?.recentOrders || [];
  const popular = data?.popularItems || [];

  return (
    <div className="dashboard-page">
      {/* Welcome Section */}
      <section className="dashboard-welcome animate-fade-in">
        <div className="dashboard-welcome__content">
          <h1>Selamat datang, {user.name}! 👋</h1>
          <p>Berikut ringkasan bisnis Serba Matcha hari ini.</p>
        </div>
        <div className="dashboard-welcome__actions">
          <button 
            onClick={() => fetchData(activeTab, true)} 
            className={`matcha-btn matcha-btn--secondary ${isRefreshing ? "is-refreshing" : ""}`}
            disabled={isRefreshing}
          >
            <span className={`refresh-icon ${isRefreshing ? "spinning" : ""}`}>{Icons.refresh}</span>
            <span>{isRefreshing ? "Memuat..." : "Refresh"}</span>
          </button>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="matcha-grid matcha-grid--4 animate-fade-in animate-delay-1">
        <StatCard icon={Icons.orders} label="Orders Hari Ini" value={metrics.ordersToday} trend="up" trendValue="+12%" />
        <StatCard icon={Icons.revenue} label="Revenue" value={formatCurrency(metrics.revenue)} trend="up" trendValue="+8%" />
        <StatCard icon={Icons.customers} label="Total Customers" value={metrics.totalCustomers || 0} trend="neutral" trendValue="Stabil" />
        <StatCard icon={Icons.clock} label="Pending Orders" value={metrics.pendingOrders || 0} />
      </section>

      {/* Main Content Grid */}
      <div className="dashboard-main-grid animate-fade-in animate-delay-2">
        {/* Chart Section */}
        <div className="matcha-card">
          <div className="matcha-card__header">
            <h3><span className="matcha-card__header-icon">{Icons.chart}</span>Revenue Overview</h3>
            <div className="chart-period-tabs">
              {(["week", "month", "year"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`chart-period-tab ${activeTab === tab ? "chart-period-tab--active" : ""}`}
                  onClick={() => handleTabChange(tab)}
                  disabled={isChartLoading}
                >
                  <span className="chart-period-tab__label">
                    {tab === "week" ? "7 Hari" : tab === "month" ? "30 Hari" : "1 Tahun"}
                  </span>
                </button>
              ))}
              {isChartLoading && <span className="chart-loading-indicator">⏳</span>}
            </div>
          </div>
          <div className="matcha-card__body">
            <div className="chart-container">
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="matcha-card">
          <div className="matcha-card__header">
            <h3><span className="matcha-card__header-icon">{Icons.star}</span>Quick Actions</h3>
          </div>
          <div className="matcha-card__body">
            <div className="quick-actions">
              <QuickAction href="/settings" icon={Icons.orders} label="Kelola Menu" />
              <QuickAction href="/settings" icon={Icons.customers} label="Customers" />
              <QuickAction href="/security" icon={Icons.trending} label="Reports" />
              <QuickAction href="/settings" icon={Icons.star} label="Promo" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="dashboard-bottom-grid animate-fade-in animate-delay-3">
        {/* Recent Orders */}
        <div className="matcha-card">
          <div className="matcha-card__header">
            <h3><span className="matcha-card__header-icon">{Icons.orders}</span>Recent Orders</h3>
            <Link href="/settings" className="matcha-btn matcha-btn--ghost matcha-btn--sm">View All</Link>
          </div>
          <div className="matcha-card__body" style={{ padding: 0 }}>
            {orders.length > 0 ? (
              <table className="matcha-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Item</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.customerName}</td>
                      <td>{order.item}</td>
                      <td>{formatCurrency(order.total)}</td>
                      <td>{getStatusBadge(order.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="matcha-empty">
                <div className="matcha-empty__icon">{Icons.orders}</div>
                <h3 className="matcha-empty__title">Belum Ada Order</h3>
                <p className="matcha-empty__text">Order baru akan muncul di sini.</p>
              </div>
            )}
          </div>
        </div>

        {/* Popular Items */}
        <div className="matcha-card">
          <div className="matcha-card__header">
            <h3><span className="matcha-card__header-icon">{Icons.star}</span>Menu Populer</h3>
          </div>
          <div className="matcha-card__body">
            {popular.length > 0 ? (
              <div className="popular-items">
                {popular.map((item, idx) => (
                  <div key={idx} className="popular-item">
                    <div className="popular-item__rank">#{idx + 1}</div>
                    <div className="popular-item__info">
                      <div className="popular-item__name">{item.name}</div>
                      <div className="popular-item__stats">{item.orders} orders • {formatCurrency(item.revenue)}</div>
                    </div>
                    <div className="popular-item__bar">
                      <div className="popular-item__bar-fill" style={{ width: `${(item.orders / (popular[0]?.orders || 1)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="matcha-empty">
                <div className="matcha-empty__icon">{Icons.star}</div>
                <h3 className="matcha-empty__title">Belum Ada Data</h3>
                <p className="matcha-empty__text">Data menu populer akan muncul setelah ada order.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .dashboard-welcome {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          background: linear-gradient(135deg, var(--matcha-500) 0%, var(--matcha-700) 100%);
          border-radius: 16px;
          color: white;
        }

        .dashboard-welcome h1 {
          margin: 0 0 8px 0;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .dashboard-welcome p {
          margin: 0;
          opacity: 0.9;
        }

        .dashboard-welcome__actions .matcha-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .dashboard-welcome__actions .matcha-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .refresh-icon {
          display: inline-flex;
          transition: transform 0.3s ease;
        }
        
        .refresh-icon.spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .matcha-btn.is-refreshing {
          opacity: 0.8;
        }

        .dashboard-main-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        .dashboard-bottom-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 24px;
        }

        .chart-container {
          height: 300px;
          position: relative;
        }

        /* Modern Period Tabs */
        .chart-period-tabs {
          display: flex;
          background: var(--hover-bg);
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
        }

        .chart-period-tab {
          position: relative;
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .chart-period-tab::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--matcha-400), var(--matcha-600));
          opacity: 0;
          transition: opacity 0.25s ease;
          border-radius: 8px;
        }

        .chart-period-tab:hover {
          color: var(--text-primary);
        }

        .chart-period-tab--active {
          color: white;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
        }

        .chart-period-tab--active::before {
          opacity: 1;
        }

        .chart-period-tab__label {
          position: relative;
          z-index: 1;
        }

        .popular-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .popular-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .popular-item__rank {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--matcha-100);
          color: var(--matcha-700);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
        }

        :global(body.dark) .popular-item__rank {
          background: rgba(34, 197, 94, 0.15);
          color: var(--matcha-400);
        }

        .popular-item__info {
          flex: 1;
          min-width: 0;
        }

        .popular-item__name {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .popular-item__stats {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .popular-item__bar {
          width: 80px;
          height: 6px;
          background: var(--hover-bg);
          border-radius: 3px;
          overflow: hidden;
        }

        .popular-item__bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--matcha-400), var(--matcha-600));
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        @media (max-width: 1024px) {
          .dashboard-main-grid,
          .dashboard-bottom-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .dashboard-welcome {
            flex-direction: column;
            text-align: center;
            gap: 16px;
          }

          .dashboard-welcome h1 {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}

// Skeleton Loading
function DashboardSkeleton() {
  return (
    <div className="dashboard-page">
      <div style={{ height: 120, background: "var(--hover-bg)", borderRadius: 16 }} />
      <div className="matcha-grid matcha-grid--4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: 140, background: "var(--hover-bg)", borderRadius: 14 }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <div style={{ height: 400, background: "var(--hover-bg)", borderRadius: 14 }} />
        <div style={{ height: 400, background: "var(--hover-bg)", borderRadius: 14 }} />
      </div>
      <style jsx>{`
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
      `}</style>
    </div>
  );
}
