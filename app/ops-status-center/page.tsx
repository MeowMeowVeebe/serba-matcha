"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Service = { id: string; name: string; status: string; uptime: string };
type Queue = { id: string; name: string; count: number; status: string };
type Summary = { overallUptime: string; slaMet: string; queueItems: number };

export default function OpsStatusCenterPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [summary, setSummary] = useState<Summary>({ overallUptime: "0%", slaMet: "0%", queueItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ops/status");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setServices(json.data?.services || []);
      setQueues(json.data?.queues || []);
      setSummary(json.data?.summary || { overallUptime: "0%", slaMet: "0%", queueItems: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Status Center"
      description="Monitor sistem"
      breadcrumbs={[{ label: "Status", href: "/ops-status-center" }]}
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
                <p>{loadError ?? "Silakan login untuk mengakses Status Center."}</p>
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
                    <h4>{summary.overallUptime}</h4>
                    <p>Overall Uptime</p>
                  </div>
                  <div className={styles.stat}>
                    <h4>{summary.slaMet}</h4>
                    <p>SLA Met</p>
                  </div>
                  <div className={styles.stat}>
                    <h4>{summary.queueItems}</h4>
                    <p>Queue Items</p>
                  </div>
                </div>

                <div className={styles.card}>
                  <h3>Services</h3>
                  <div className={styles.list}>
                    {services.map((s) => (
                      <div key={s.id} className={styles.listItem}>
                        <div>
                          <strong>{s.name}</strong>
                          <span style={{ marginLeft: 8, opacity: 0.6, fontSize: 12 }}>{s.uptime}</span>
                        </div>
                        <span className={`badge badge--${s.status === "Operational" ? "success" : "warning"}`}>
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.card}>
                  <h3>Queues</h3>
                  <div className={styles.list}>
                    {queues.map((q) => (
                      <div key={q.id} className={styles.listItem}>
                        <span>{q.name}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontWeight: 600 }}>{q.count}</span>
                          <span className={`badge badge--${q.status === "Healthy" ? "success" : q.status === "Stable" ? "info" : "warning"}`}>
                            {q.status}
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
