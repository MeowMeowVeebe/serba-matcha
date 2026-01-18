"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Experiment = { id: string; name: string; status: string; owner: string; progress: number };
type Flag = { id: string; name: string; enabled: boolean; users: string };

export default function ExperimentControlRoomPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/features/control-room");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setExperiments(json.data?.experiments || []);
      setFlags(json.data?.flags || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Experiments"
      description="Kelola eksperimen"
      breadcrumbs={[{ label: "Experiments", href: "/experiment-control-room" }]}
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
                <p>{loadError ?? "Silakan login untuk mengakses Experiments."}</p>
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
                <div className={styles.card}>
                  <h3>Active Experiments</h3>
                  <div className={styles.list}>
                    {experiments.map((e) => (
                      <div key={e.id} className={styles.listItem}>
                        <div style={{ flex: 1 }}>
                          <strong>{e.name}</strong>
                          <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>{e.owner}</p>
                        </div>
                        <div style={{ width: 100, marginRight: 12 }}>
                          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, height: 6 }}>
                            <div style={{ width: `${e.progress}%`, height: "100%", background: "#7FB783", borderRadius: 4 }} />
                          </div>
                        </div>
                        <span className={`badge badge--${e.status === "Running" ? "success" : e.status === "Paused" ? "warning" : "info"}`}>
                          {e.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.card}>
                  <h3>Feature Flags</h3>
                  <div className={styles.list}>
                    {flags.map((f) => (
                      <div key={f.id} className={styles.listItem}>
                        <code style={{ fontSize: 13 }}>{f.name}</code>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ opacity: 0.6, fontSize: 12 }}>{f.users}</span>
                          <span className={`badge badge--${f.enabled ? "success" : "default"}`}>
                            {f.enabled ? "ON" : "OFF"}
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
