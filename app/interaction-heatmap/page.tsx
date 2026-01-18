"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

interface Hotspot {
  id: number;
  area: string;
  clicks: number;
  rate: string;
}

interface DeviceStat {
  id: number;
  type: string;
  percentage: number;
}

interface HeatmapSummary {
  totalClicks: number;
  avgSession: string;
  scrollDepth: number;
}

interface HeatmapData {
  hotspots: Hotspot[];
  deviceStats: DeviceStat[];
  summary: HeatmapSummary;
}

export default function InteractionHeatmapPage() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics/heatmap");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          throw new Error(json.error || "Unknown error");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <AccountShell
      title="Heatmap"
      description="Analisis interaksi UI"
      breadcrumbs={[{ label: "Heatmap", href: "/interaction-heatmap" }]}
    >
      {({ user, isLoadingUser, loadError }) => (
        <div className={styles.page}>
          {isLoadingUser || loading ? (
            <SmartSkeleton variant="card" />
          ) : !user ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔐</div>
              <h3>Akses Terbatas</h3>
              <p>{loadError ?? "Silakan login untuk mengakses Heatmap."}</p>
              <Link className="primary-btn" href="/login">Login</Link>
            </div>
          ) : error ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⚠️</div>
              <h3>Error</h3>
              <p>{error}</p>
            </div>
          ) : data ? (
            <>
              <div className={styles.statsGrid}>
                <div className={styles.stat}>
                  <h4>{data.summary.totalClicks.toLocaleString()}</h4>
                  <p>Total Clicks</p>
                </div>
                <div className={styles.stat}>
                  <h4>{data.summary.avgSession}</h4>
                  <p>Avg Session</p>
                </div>
                <div className={styles.stat}>
                  <h4>{data.summary.scrollDepth}%</h4>
                  <p>Scroll Depth</p>
                </div>
              </div>

              <div className={styles.card}>
                <h3>Hotspot Areas</h3>
                <div className={styles.list}>
                  {data.hotspots.map((h) => (
                    <div key={h.id} className={styles.listItem}>
                      <span>{h.area}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ opacity: 0.6, fontSize: 13 }}>{h.clicks} clicks</span>
                        <span style={{ fontWeight: 600, color: "#7FB783" }}>{h.rate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.card}>
                <h3>Device Breakdown</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
                  {data.deviceStats.map((d) => (
                    <div key={d.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span>{d.type}</span>
                        <span style={{ fontWeight: 600 }}>{d.percentage}%</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, height: 8 }}>
                        <div style={{ width: `${d.percentage}%`, height: "100%", background: "#7FB783", borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </AccountShell>
  );
}
