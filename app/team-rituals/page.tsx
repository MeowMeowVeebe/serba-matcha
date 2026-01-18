"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { AdaptiveHero } from "@/components/ui/AdaptiveHero";
import { SectionFeedback } from "@/components/ui/SectionFeedback";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Ritual = { id: string; title: string; detail: string };

export default function TeamRitualsPage() {
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/growth/rituals");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setRituals(json.data?.rituals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Team Rituals"
      description="Checklist rutin untuk menjaga tim tetap sinkron"
      breadcrumbs={[{ label: "Team Rituals", href: "/team-rituals" }]}
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
          <div className="team-rituals">
            {isLoadingUser || isLoading ? (
              <SmartSkeleton variant="card" />
            ) : !user ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔐</div>
                <h3>Akses Terbatas</h3>
                <p>{loadError ?? "Silakan login untuk mengakses Team Rituals."}</p>
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
                  badge="Checklist"
                  title="Team Rituals"
                  subtitle="Rangkaian rutinitas singkat untuk ops, security, dan growth."
                  actions={
                    <div className="btn-row">
                      <Link className="secondary-btn" href="/action-planner">
                        Open Action Planner
                      </Link>
                      <Link className="secondary-btn" href="/release-notes">
                        View Release Notes
                      </Link>
                    </div>
                  }
                />

                <div className="team-rituals__grid">
                  {rituals.map((ritual) => (
                    <div key={ritual.id} className="team-rituals__card">
                      <h4>{ritual.title}</h4>
                      <p>{ritual.detail}</p>
                      <div className="team-rituals__actions">
                        <button className="secondary-btn" type="button">Mark done</button>
                        <button className="secondary-btn" type="button">Assign</button>
                      </div>
                    </div>
                  ))}
                </div>

                <SectionFeedback prompt="Checklist ritual ini membantu menjaga fokus harian tim?" />
              </>
            )}
          </div>
        );
      }}
    </AccountShell>
  );
}
