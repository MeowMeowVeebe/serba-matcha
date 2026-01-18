"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { AdaptiveHero } from "@/components/ui/AdaptiveHero";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SectionFeedback } from "@/components/ui/SectionFeedback";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Metric = { id: string; title: string; value: string; change: string };
type Experiment = { id: string; name: string };

export default function RevenueConsolePage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/growth/revenue");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setMetrics(json.data?.metrics || []);
      setExperiments(json.data?.experiments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Revenue Console"
      description="Monitoring revenue dan eksperimen pricing"
      breadcrumbs={[{ label: "Revenue Console", href: "/revenue-console" }]}
      actions={
        <Link className="secondary-btn" href="/dashboard">
          Back to Dashboard
        </Link>
      }
    >
      {({ user, isLoadingUser, loadError }) => {
        useEffect(() => {
          if (user) fetchData();
        }, [user]);

        return (
          <div className="revenue-console">
            {isLoadingUser || isLoading ? (
              <SmartSkeleton variant="card" />
            ) : !user ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔐</div>
                <h3>Akses Terbatas</h3>
                <p>{loadError ?? "Silakan login untuk mengakses Revenue Console."}</p>
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
                <AdaptiveHero
                  badge="Finance"
                  title="Revenue Console"
                  subtitle="Pantau metrik revenue dan eksperimen pricing dalam satu layar."
                  actions={
                    <div className="btn-row">
                      <Link className="secondary-btn" href="/feature-spotlight">
                        Pricing experiments
                      </Link>
                      <Link className="secondary-btn" href="/usage-trends">
                        Usage trends
                      </Link>
                    </div>
                  }
                />

                <div className="revenue-console__grid">
                  {metrics.map((metric) => (
                    <MetricCard key={metric.id} title={metric.title} value={metric.value} change={metric.change} />
                  ))}
                </div>

                <div className="revenue-console__experiments">
                  <div>
                    <h4>Pricing experiments</h4>
                    <p>Kontrol experiment pricing untuk segment tertentu.</p>
                  </div>
                  <div className="revenue-console__tags">
                    {experiments.map((exp) => (
                      <span key={exp.id}>{exp.name}</span>
                    ))}
                  </div>
                </div>

                <SectionFeedback prompt="Revenue console ini membantu monitoring finance?" />
              </>
            )}
          </div>
        );
      }}
    </AccountShell>
  );
}
