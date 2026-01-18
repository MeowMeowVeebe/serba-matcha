"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { AdaptiveHero } from "@/components/ui/AdaptiveHero";
import { SectionFeedback } from "@/components/ui/SectionFeedback";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Campaign = { id: string; date: string; title: string; note: string };

export default function GrowthCalendarPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/growth/calendar");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setCampaigns(json.data?.campaigns || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Growth Calendar"
      description="Agenda campaign dan eksperimen growth"
      breadcrumbs={[{ label: "Growth Calendar", href: "/growth-calendar" }]}
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
          <div className="growth-calendar">
            {isLoadingUser || isLoading ? (
              <SmartSkeleton variant="card" />
            ) : !user ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔐</div>
                <h3>Akses Terbatas</h3>
                <p>{loadError ?? "Silakan login untuk mengakses Growth Calendar."}</p>
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
                  badge="Planner"
                  title="Growth Calendar"
                  subtitle="Pantau agenda campaign agar timing lebih tepat."
                  actions={
                    <div className="btn-row">
                      <Link className="secondary-btn" href="/engagement-pulse">
                        Engagement Pulse
                      </Link>
                      <Link className="secondary-btn" href="/usage-trends">
                        Usage Trends
                      </Link>
                    </div>
                  }
                />

                <div className="growth-calendar__grid">
                  {campaigns.map((item) => (
                    <div key={item.id} className="growth-calendar__card">
                      <span>{item.date}</span>
                      <h4>{item.title}</h4>
                      <p>{item.note}</p>
                    </div>
                  ))}
                </div>

                <SectionFeedback prompt="Apakah kalender growth ini membantu merencanakan campaign?" />
              </>
            )}
          </div>
        );
      }}
    </AccountShell>
  );
}
