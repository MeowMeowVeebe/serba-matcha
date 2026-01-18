"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { AdaptiveHero } from "@/components/ui/AdaptiveHero";
import { EmojiReactions } from "@/components/ui/EmojiReactions";
import { SectionFeedback } from "@/components/ui/SectionFeedback";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Feedback = { id: string; title: string; sentiment: string; detail: string };

export default function FeedbackHubPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/growth/feedback");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setFeedbacks(json.data?.feedbacks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Feedback Hub"
      description="Ringkasan feedback user dan highlight insight"
      breadcrumbs={[{ label: "Feedback Hub", href: "/feedback-hub" }]}
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
          <div className="feedback-hub">
            {isLoadingUser || isLoading ? (
              <SmartSkeleton variant="card" />
            ) : !user ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔐</div>
                <h3>Akses Terbatas</h3>
                <p>{loadError ?? "Silakan login untuk mengakses Feedback Hub."}</p>
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
                  badge="Insights"
                  title="Feedback Hub"
                  subtitle="Kumpulkan feedback terbaru untuk jadi bahan iterasi UI berikutnya."
                  actions={
                    <div className="btn-row">
                      <Link className="secondary-btn" href="/feature-spotlight">
                        Review Spotlight
                      </Link>
                      <Link className="secondary-btn" href="/settings">
                        Update preferences
                      </Link>
                    </div>
                  }
                />

                <div className="feedback-hub__grid">
                  {feedbacks.map((item) => (
                    <div key={item.id} className="feedback-hub__card">
                      <div>
                        <p className="feedback-hub__title">{item.title}</p>
                        <p className="feedback-hub__detail">{item.detail}</p>
                      </div>
                      <span className="feedback-hub__badge">{item.sentiment}</span>
                    </div>
                  ))}
                </div>

                <div className="feedback-hub__pulse">
                  <h4>Live sentiment</h4>
                  <EmojiReactions />
                </div>

                <SectionFeedback prompt="Feedback hub ini membantu merangkum insight user?" />
              </>
            )}
          </div>
        );
      }}
    </AccountShell>
  );
}
