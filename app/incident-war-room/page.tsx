"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Incident = { id: string; incidentId: string; time: string; status: string; detail: string; severity: string };
type Stats = { active: number; resolved: number; highSeverity: number };

export default function IncidentWarRoomPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<Stats>({ active: 0, resolved: 0, highSeverity: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ops/incidents");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setIncidents(json.data?.incidents || []);
      setStats(json.data?.stats || { active: 0, resolved: 0, highSeverity: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Incident Room"
      description="Kelola insiden"
      breadcrumbs={[{ label: "Incidents", href: "/incident-war-room" }]}
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
                <p>{loadError ?? "Silakan login untuk mengakses Incident Room."}</p>
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
                    <h4>{stats.active}</h4>
                    <p>Active</p>
                  </div>
                  <div className={styles.stat}>
                    <h4>{stats.resolved}</h4>
                    <p>Resolved</p>
                  </div>
                  <div className={styles.stat}>
                    <h4>{stats.highSeverity}</h4>
                    <p>High Severity</p>
                  </div>
                </div>

                <div className={styles.card}>
                  <h3>Incident Timeline</h3>
                  <div className={styles.list}>
                    {incidents.map((i) => (
                      <div key={i.id} className={styles.listItem}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <code style={{ fontSize: 12, opacity: 0.7 }}>{i.incidentId}</code>
                            <span className={`badge badge--${i.severity === "high" ? "danger" : i.severity === "medium" ? "warning" : "info"}`}>
                              {i.severity}
                            </span>
                          </div>
                          <strong>{i.detail}</strong>
                          <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>{i.time}</p>
                        </div>
                        <span className={`badge badge--${i.status === "Resolved" ? "success" : i.status === "Mitigated" ? "warning" : "info"}`}>
                          {i.status}
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
