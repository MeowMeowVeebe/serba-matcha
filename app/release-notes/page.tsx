"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { AdaptiveHero } from "@/components/ui/AdaptiveHero";
import { FilterChips } from "@/components/ui/FilterChips";
import { SectionFeedback } from "@/components/ui/SectionFeedback";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type ReleaseNote = { id: string; version: string; date: string; items: string[] };

export default function ReleaseNotesPage() {
  const [notes, setNotes] = useState<ReleaseNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/growth/release-notes");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setNotes(json.data?.notes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Release Notes"
      description="Catatan rilis terbaru untuk tim"
      breadcrumbs={[{ label: "Release Notes", href: "/release-notes" }]}
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
          <div className="release-notes">
            {isLoadingUser || isLoading ? (
              <SmartSkeleton variant="card" />
            ) : !user ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔐</div>
                <h3>Akses Terbatas</h3>
                <p>{loadError ?? "Silakan login untuk mengakses Release Notes."}</p>
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
                  badge="Updates"
                  title="Release Notes"
                  subtitle="Ikuti update terbaru fitur, perbaikan, dan eksperimen UI."
                  actions={
                    <div className="btn-row">
                      <Link className="secondary-btn" href="/feature-spotlight">
                        View Spotlight
                      </Link>
                      <Link className="secondary-btn" href="/feedback-hub">
                        Open Feedback Hub
                      </Link>
                    </div>
                  }
                />

                <FilterChips options={["All", "UI", "Security", "Ops"]} />

                <div className="release-notes__timeline">
                  {notes.map((note) => (
                    <div key={note.id} className="release-notes__card">
                      <div>
                        <h4>{note.version}</h4>
                        <p>{note.date}</p>
                      </div>
                      <ul>
                        {note.items.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <SectionFeedback prompt="Apakah release notes ini membantu tim mengikuti update?" />
              </>
            )}
          </div>
        );
      }}
    </AccountShell>
  );
}
