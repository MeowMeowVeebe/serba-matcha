"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Trend = { id: string; label: string; value: string; change: string };
type DailyData = { id: string; day: string; users: number; sessions: number };

export default function UsageTrendsPage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/usage-trends");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setTrends(json.data?.trends || []);
      setDailyData(json.data?.dailyData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Usage Trends"
      description="Pantau pertumbuhan pengguna"
      breadcrumbs={[{ label: "Usage Trends", href: "/usage-trends" }]}
    >
      {({ user, isLoadingUser, loadError }) => {
        useEffect(() => {
          if (user) fetchData();
        }, [user]);

        return (
          <div className={styles.page}>
            {isLoadingUser || isLoading ? (
              <SmartSkeleton variant="table" />
            ) : !user ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔐</div>
                <h3>Akses Terbatas</h3>
                <p>{loadError ?? "Silakan login untuk mengakses Usage Trends."}</p>
                <Link className="primary-btn" href="/login">Login</Link>
              </div>
            ) : error ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>⚠️</div>
                <h3>Error</h3>
                <p>{error}</p>
                <button className="primary-btn" onClick={fetchData}>Coba Lagi</button>
              </div>
            ) : (
              <>
                <div className={styles.statsGrid}>
                  {trends.map((t) => (
                    <div key={t.id} className={styles.stat}>
                      <h4>{t.value}</h4>
                      <p>{t.label}</p>
                      <span style={{ color: t.change.startsWith("+") ? "#7FB783" : "#E57373", fontSize: 12 }}>
                        {t.change}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Hari</th>
                        <th>Active Users</th>
                        <th>Sessions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyData.map((d) => (
                        <tr key={d.id}>
                          <td>{d.day}</td>
                          <td>{d.users.toLocaleString()}</td>
                          <td>{d.sessions.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        );
      }}
    </AccountShell>
  );
}
