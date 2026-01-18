"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Alert = { id: string; name: string; channel: string; status: string; triggered: number };
type Stats = { activeCount: number; totalTriggered: number; channels: number };

export default function AlertStudioPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<Stats>({ activeCount: 0, totalTriggered: 0, channels: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/features/alerts");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setAlerts(json.data?.alerts || []);
      setStats(json.data?.stats || { activeCount: 0, totalTriggered: 0, channels: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Alert Studio"
      description="Kelola alert rules"
      breadcrumbs={[{ label: "Alerts", href: "/alert-studio" }]}
    >
      {({ user, isLoadingUser, loadError }) => {
        useEffect(() => {
          if (user) fetchData();
        }, [user]);

        return (
          <div className={styles.page}>
            {isLoadingUser || isLoading ? (
              <SmartSkeleton variant="card" />
            ) : !user ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔐</div>
                <h3>Akses Terbatas</h3>
                <p>{loadError ?? "Silakan login untuk mengakses Alert Studio."}</p>
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
                  <div className={styles.stat}>
                    <h4>{stats.activeCount}</h4>
                    <p>Active Rules</p>
                  </div>
                  <div className={styles.stat}>
                    <h4>{stats.totalTriggered}</h4>
                    <p>Triggered Today</p>
                  </div>
                  <div className={styles.stat}>
                    <h4>{stats.channels}</h4>
                    <p>Channels</p>
                  </div>
                </div>

                <div className={styles.card}>
                  <h3>Alert Rules</h3>
                  <div className={styles.list}>
                    {alerts.map((a) => (
                      <div key={a.id} className={styles.listItem}>
                        <div style={{ flex: 1 }}>
                          <strong>{a.name}</strong>
                          <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>
                            {a.channel} · {a.triggered} triggered
                          </p>
                        </div>
                        <span className={`badge badge--${a.status === "active" ? "success" : "default"}`}>
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      }}
    </AccountShell>
  );
}
