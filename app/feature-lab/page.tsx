"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Experiment = { id: string; name: string; status: string; result: string; icon: string };
type Component = { id: string; name: string; description: string; status: string };

export default function FeatureLabPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/features/experiments");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setExperiments(json.data?.experiments || []);
      setComponents(json.data?.components || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Feature Lab"
      description="Eksperimen UI"
      breadcrumbs={[{ label: "Feature Lab", href: "/feature-lab" }]}
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
                <p>{loadError ?? "Silakan login untuk mengakses Feature Lab."}</p>
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
                <div className={styles.grid}>
                  {experiments.map((e) => (
                    <div key={e.id} className={styles.card}>
                      <span style={{ fontSize: 28 }}>{e.icon}</span>
                      <h3>{e.name}</h3>
                      <p>{e.result}</p>
                      <span className={`badge badge--${e.status === "Winner" ? "success" : e.status === "Testing" ? "warning" : "info"}`}>
                        {e.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.card}>
                  <h3>Component Library</h3>
                  <div className={styles.list}>
                    {components.map((c) => (
                      <div key={c.id} className={styles.listItem}>
                        <div>
                          <strong>{c.name}</strong>
                          <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>{c.description}</p>
                        </div>
                        <span className={`badge badge--${c.status === "Stable" ? "success" : "warning"}`}>
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.actions}>
                  <Link className="secondary-btn" href="/feature-spotlight">Feature Spotlight</Link>
                  <Link className="secondary-btn" href="/experiment-control-room">Experiments</Link>
                </div>
              </>
            )}
          </div>
        );
      }}
    </AccountShell>
  );
}
