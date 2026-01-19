"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { AdaptiveHero } from "@/components/ui/AdaptiveHero";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SectionFeedback } from "@/components/ui/SectionFeedback";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Experiment = { id: string; title: string; value: string; change: string };

export default function PricingLabPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/growth/pricing");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setExperiments(json.data?.experiments || []);
      setSummary(json.data?.summary || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Pricing Lab"
      description="Eksperimen pricing dan hasilnya"
      breadcrumbs={[{ label: "Pricing Lab", href: "/pricing-lab" }]}
      actions={
        <Link className="secondary-btn" href="/revenue-console">
          Back to Revenue Console
        </Link>
      }
    >
      {({ user, isLoadingUser, loadError }) => {
        useEffect(() => {
          if (user) fetchData();
        }, [user]);

        return (
          <div className="pricing-lab">
            {isLoadingUser || isLoading ? (
              <SmartSkeleton variant="card" />
            ) : !user ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔐</div>
                <h3>Akses Terbatas</h3>
                <p>{loadError ?? "Silakan login untuk mengakses Pricing Lab."}</p>
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
                  badge="Experiment"
                  title="Pricing Lab"
                  subtitle="Uji variasi pricing dan lihat dampaknya secara cepat."
                  actions={
                    <div className="btn-row">
                      <Link className="secondary-btn" href="/dashboard">
                        Dashboard
                      </Link>
                      <Link className="secondary-btn" href="/growth-calendar">
                        Growth Calendar
                      </Link>
                    </div>
                  }
                />

                <div className="pricing-lab__grid">
                  {experiments.map((experiment) => (
                    <MetricCard key={experiment.id} title={experiment.title} value={experiment.value} change={parseFloat(experiment.change) || 0} />
                  ))}
                </div>

                <div className="pricing-lab__summary">
                  <div>
                    <h4>Experiment summary</h4>
                    <p>{summary || "Tidak ada ringkasan eksperimen."}</p>
                  </div>
                  <button className="secondary-btn" type="button">Review experiment</button>
                </div>

                <SectionFeedback prompt="Pricing lab membantu evaluasi pricing?" />
              </>
            )}
          </div>
        );
      }}
    </AccountShell>
  );
}
