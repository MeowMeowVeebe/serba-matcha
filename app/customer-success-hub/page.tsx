"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { AdaptiveHero } from "@/components/ui/AdaptiveHero";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SectionFeedback } from "@/components/ui/SectionFeedback";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Signal = { id: string; title: string; value: string; change: string };

export default function CustomerSuccessHubPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [statusSummary, setStatusSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/growth/customer-success");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setSignals(json.data?.signals || []);
      setStatusSummary(json.data?.statusSummary || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Customer Success Hub"
      description="NPS dan status renewal pelanggan"
      breadcrumbs={[{ label: "Customer Success Hub", href: "/customer-success-hub" }]}
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
          <div className="success-hub">
            {isLoadingUser || isLoading ? (
              <SmartSkeleton variant="card" />
            ) : !user ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔐</div>
                <h3>Akses Terbatas</h3>
                <p>{loadError ?? "Silakan login untuk mengakses Customer Success Hub."}</p>
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
                  badge="Success"
                  title="Customer Success Hub"
                  subtitle="Pantau NPS, renewal, dan peluang ekspansi dengan cepat."
                  actions={
                    <div className="btn-row">
                      <Link className="secondary-btn" href="/feedback-hub">
                        Feedback Hub
                      </Link>
                      <Link className="secondary-btn" href="/revenue-console">
                        Revenue Console
                      </Link>
                    </div>
                  }
                />

                <div className="success-hub__grid">
                  {signals.map((signal) => (
                    <MetricCard key={signal.id} title={signal.title} value={signal.value} change={signal.change} />
                  ))}
                </div>

                <div className="success-hub__status">
                  <div>
                    <h4>Renewal status board</h4>
                    <p>{statusSummary || "Tidak ada data status."}</p>
                  </div>
                  <button className="secondary-btn" type="button">Open accounts</button>
                </div>

                <SectionFeedback prompt="Customer success hub membantu monitor kesehatan pelanggan?" />
              </>
            )}
          </div>
        );
      }}
    </AccountShell>
  );
}
