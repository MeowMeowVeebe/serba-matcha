"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Insight = {
  id: string;
  icon: string;
  title: string;
  description: string;
  value: string;
  change: string | null;
};

export default function InsightsStudioPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/insights");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setInsights(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Insights Studio"
      description="Analisis data dan insights"
      breadcrumbs={[{ label: "Insights Studio", href: "/insights-studio" }]}
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
                <p>{loadError ?? "Silakan login untuk mengakses Insights Studio."}</p>
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
                  {insights.map((item) => (
                    <div key={item.id} className={styles.stat}>
                      <span style={{ fontSize: 24 }}>{item.icon}</span>
                      <h4>{item.value}</h4>
                      <p>{item.title}</p>
                      {item.change && (
                        <span style={{ color: item.change.startsWith("+") ? "#7FB783" : "#E57373", fontSize: 12 }}>
                          {item.change}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.grid}>
                  <div className={styles.card}>
                    <div className={styles.cardIcon}>📈</div>
                    <h3>Trend Analysis</h3>
                    <p>Lihat tren performa bisnis dalam periode tertentu.</p>
                    <Link className="secondary-btn" href="/usage-trends">Lihat Trends</Link>
                  </div>
                  <div className={styles.card}>
                    <div className={styles.cardIcon}>🔥</div>
                    <h3>Engagement Pulse</h3>
                    <p>Monitor engagement harian dan peak hours.</p>
                    <Link className="secondary-btn" href="/engagement-pulse">Lihat Pulse</Link>
                  </div>
                  <div className={styles.card}>
                    <div className={styles.cardIcon}>🗺️</div>
                    <h3>Customer Journeys</h3>
                    <p>Pahami alur perjalanan user per persona.</p>
                    <Link className="secondary-btn" href="/customer-journeys">Lihat Journeys</Link>
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
