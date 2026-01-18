"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Journey = { id: string; persona: string; icon: string; steps: string[]; completion: number };

export default function CustomerJourneysPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/journeys");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setJourneys(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Customer Journeys"
      description="Alur perjalanan user"
      breadcrumbs={[{ label: "Journeys", href: "/customer-journeys" }]}
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
                <p>{loadError ?? "Silakan login untuk mengakses Customer Journeys."}</p>
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
              <div className={styles.grid}>
                {journeys.map((j) => (
                  <div key={j.id} className={styles.card}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <span style={{ fontSize: 28 }}>{j.icon}</span>
                      <h3 style={{ margin: 0 }}>{j.persona}</h3>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                      {j.steps.map((step, i) => (
                        <span key={step} style={{ 
                          padding: "4px 10px", 
                          background: "rgba(255,255,255,0.08)", 
                          borderRadius: 20,
                          fontSize: 12 
                        }}>
                          {i > 0 && "→ "}{step}
                        </span>
                      ))}
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                      <div style={{ 
                        width: `${j.completion}%`, 
                        height: "100%", 
                        background: "#7FB783",
                        borderRadius: 4 
                      }} />
                    </div>
                    <p style={{ marginTop: 8, fontSize: 13 }}>{j.completion}% complete</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }}
    </AccountShell>
  );
}
