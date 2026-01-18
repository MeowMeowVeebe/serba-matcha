"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Step = { id: string; title: string; description: string; done: boolean };

export default function OpsPlaybookPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ops/playbook");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setSteps(json.data?.steps || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completed = steps.filter(s => s.done).length;

  const toggle = (id: string) => {
    setSteps(steps.map(s => s.id === id ? { ...s, done: !s.done } : s));
  };

  return (
    <AccountShell
      title="Ops Playbook"
      description="Checklist harian"
      breadcrumbs={[{ label: "Playbook", href: "/ops-playbook" }]}
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
                <p>{loadError ?? "Silakan login untuk mengakses Ops Playbook."}</p>
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
                    <h4>{completed}/{steps.length}</h4>
                    <p>Completed</p>
                  </div>
                  <div className={styles.stat}>
                    <h4>{steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0}%</h4>
                    <p>Progress</p>
                  </div>
                </div>

                <div className={styles.card}>
                  <h3>Daily Checklist</h3>
                  <div className={styles.list}>
                    {steps.map((s) => (
                      <div 
                        key={s.id} 
                        className={styles.listItem}
                        style={{ opacity: s.done ? 0.6 : 1, cursor: "pointer" }}
                        onClick={() => toggle(s.id)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <input 
                            type="checkbox" 
                            checked={s.done} 
                            onChange={() => toggle(s.id)}
                            style={{ width: 18, height: 18 }}
                          />
                          <div>
                            <strong style={{ textDecoration: s.done ? "line-through" : "none" }}>{s.title}</strong>
                            <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>{s.description}</p>
                          </div>
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
