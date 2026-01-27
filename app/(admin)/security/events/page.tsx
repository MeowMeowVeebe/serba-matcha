"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import AccountShell from "@/components/AccountShell";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type SecurityEvent = { id: string; time: string; event: string; severity: string };
type Stats = { criticalCount: number; warningCount: number; totalCount: number };

export default function SecurityEventsPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<Stats>({ criticalCount: 0, warningCount: 0, totalCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/security/events");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setEvents(json.data?.events || []);
      setStats(json.data?.stats || { criticalCount: 0, warningCount: 0, totalCount: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Security Events"
      description="Log aktivitas keamanan"
      breadcrumbs={[{ label: "Security", href: "/security" }, { label: "Events", href: "/security/events" }]}
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
                    <h4>{stats.criticalCount}</h4>
                    <p>Critical</p>
                  </div>
                  <div className={styles.stat}>
                    <h4>{stats.warningCount}</h4>
                    <p>Warning</p>
                  </div>
                  <div className={styles.stat}>
                    <h4>{stats.totalCount}</h4>
                    <p>Total</p>
                  </div>
                </div>

                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Event</th>
                        <th>Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((e) => (
                        <tr key={e.id}>
                          <td>{new Date(e.time).toLocaleString("id-ID")}</td>
                          <td>{e.event}</td>
                          <td>
                            <span className={`badge badge--${e.severity === "danger" ? "danger" : e.severity === "warning" ? "warning" : "info"}`}>
                              {e.severity.charAt(0).toUpperCase() + e.severity.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.actions}>
                  <Link className="secondary-btn" href="/security/sessions">Sessions</Link>
                  <Link className="secondary-btn" href="/admin/audit-logs">Audit Logs</Link>
                </div>
              </>
            )}
          </div>
        );
      }}
    </AccountShell>
  );
}
