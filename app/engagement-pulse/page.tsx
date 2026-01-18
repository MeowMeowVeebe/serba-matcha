"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Pulse = { id: string; time: string; label: string; change: string; icon: string };
type TopCTA = { id: string; label: string; clicks: number; rate: string };

export default function EngagementPulsePage() {
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [topCTAs, setTopCTAs] = useState<TopCTA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/engagement");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setPulses(json.data?.pulses || []);
      setTopCTAs(json.data?.topCTAs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Engagement Pulse"
      description="Monitor engagement harian"
      breadcrumbs={[{ label: "Engagement", href: "/engagement-pulse" }]}
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
                <p>{loadError ?? "Silakan login untuk mengakses Engagement Pulse."}</p>
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
                  {pulses.map((p) => (
                    <div key={p.id} className={styles.stat}>
                      <span style={{ fontSize: 24 }}>{p.icon}</span>
                      <h4>{p.time}</h4>
                      <p>{p.label}</p>
                      <span style={{ color: p.change.startsWith("+") ? "#7FB783" : "#E57373", fontSize: 12 }}>
                        {p.change}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.card}>
                  <h3>Top CTAs Hari Ini</h3>
                  <div className={styles.list}>
                    {topCTAs.map((cta) => (
                      <div key={cta.id} className={styles.listItem}>
                        <span>{cta.label}</span>
                        <span style={{ opacity: 0.7 }}>{cta.clicks} clicks · {cta.rate}</span>
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
