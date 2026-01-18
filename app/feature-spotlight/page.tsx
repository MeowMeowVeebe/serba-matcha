"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

type Feature = { id: string; icon: string; name: string; description: string; adoption: number };
type Testimonial = { id: string; team: string; quote: string };

export default function FeatureSpotlightPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/features/spotlight");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setFeatures(json.data?.features || []);
      setTestimonials(json.data?.testimonials || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AccountShell
      title="Feature Spotlight"
      description="Fitur unggulan"
      breadcrumbs={[{ label: "Spotlight", href: "/feature-spotlight" }]}
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
                <p>{loadError ?? "Silakan login untuk mengakses Feature Spotlight."}</p>
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
                  {features.map((f) => (
                    <div key={f.id} className={styles.stat}>
                      <span style={{ fontSize: 24 }}>{f.icon}</span>
                      <h4>{f.name}</h4>
                      <p>{f.description}</p>
                      <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, height: 6, marginTop: 8 }}>
                        <div style={{ width: `${f.adoption}%`, height: "100%", background: "#7FB783", borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 11, opacity: 0.6 }}>{f.adoption}% adoption</span>
                    </div>
                  ))}
                </div>

                <div className={styles.card}>
                  <h3>Feedback Tim</h3>
                  <div className={styles.list}>
                    {testimonials.map((t) => (
                      <div key={t.id} className={styles.listItem}>
                        <strong>{t.team}</strong>
                        <span style={{ opacity: 0.7, fontStyle: "italic" }}>"{t.quote}"</span>
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
