"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import AccountShell from "@/components/AccountShell";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Session = { id: string; device: string; location: string; lastSeen: string; status: string };
type Stats = { activeCount: number; totalCount: number };

export default function SecuritySessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats>({ activeCount: 0, totalCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/security/sessions");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setSessions(json.data?.sessions || []);
      setStats(json.data?.stats || { activeCount: 0, totalCount: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Sessions"
      description="Kelola sesi aktif"
      breadcrumbs={[{ label: "Security", href: "/dashboard/security" }, { label: "Sessions", href: "/dashboard/security/sessions" }]}
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
                <p>{loadError ?? "Silakan login."}</p>
                <Link className="primary-btn" href="/dashboard/login">Login</Link>
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
                    <p>Active</p>
                  </div>
                  <div className={styles.stat}>
                    <h4>{stats.totalCount}</h4>
                    <p>Total Sessions</p>
                  </div>
                </div>

                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Device</th>
                        <th>Location</th>
                        <th>Last Seen</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((s) => (
                        <tr key={s.id}>
                          <td>{s.device}</td>
                          <td>{s.location}</td>
                          <td>{s.lastSeen}</td>
                          <td>
                            <span className={`badge badge--${s.status === "active" ? "success" : "info"}`}>
                              {s.status === "active" ? "Active" : "Recent"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.actions}>
                  <Link className="secondary-btn" href="/dashboard/security/events">Security Events</Link>
                  <Link className="secondary-btn" href="/dashboard/security">Back</Link>
                </div>
              </>
            )}
          </div>
        );
      }}
    </AccountShell>
  );
}


