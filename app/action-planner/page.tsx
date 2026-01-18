"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Action = { id: string; title: string; description: string; owner: string; priority: string };
type Stats = { highPriority: number; total: number; teams: number };

export default function ActionPlannerPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [stats, setStats] = useState<Stats>({ highPriority: 0, total: 0, teams: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ops/planner");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setActions(json.data?.actions || []);
      setStats(json.data?.stats || { highPriority: 0, total: 0, teams: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Action Planner"
      description="Prioritas tindakan"
      breadcrumbs={[{ label: "Planner", href: "/action-planner" }]}
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
                <p>{loadError ?? "Silakan login untuk mengakses Action Planner."}</p>
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
                    <h4>{stats.highPriority}</h4>
                    <p>High Priority</p>
                  </div>
                  <div className={styles.stat}>
                    <h4>{stats.total}</h4>
                    <p>Total Actions</p>
                  </div>
                  <div className={styles.stat}>
                    <h4>{stats.teams}</h4>
                    <p>Teams</p>
                  </div>
                </div>

                <div className={styles.card}>
                  <h3>Action Items</h3>
                  <div className={styles.list}>
                    {actions.map((a) => (
                      <div key={a.id} className={styles.listItem}>
                        <div style={{ flex: 1 }}>
                          <strong>{a.title}</strong>
                          <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>{a.description}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, opacity: 0.7 }}>{a.owner}</span>
                          <span className={`badge badge--${a.priority === "High" ? "danger" : a.priority === "Medium" ? "warning" : "info"}`}>
                            {a.priority}
                          </span>
                        </div>
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
