"use client";

import Link from "next/link";
import { useMemo } from "react";
import AccountShell from "@/components/AccountShell";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

export default function SecurityEventsPage() {
  const events = useMemo(() => [
    { id: "1", time: new Date().toISOString(), event: "Login berhasil", severity: "info" },
    { id: "2", time: new Date(Date.now() - 3600000).toISOString(), event: "Password diubah", severity: "warning" },
    { id: "3", time: new Date(Date.now() - 7200000).toISOString(), event: "Session expired", severity: "info" },
    { id: "4", time: new Date(Date.now() - 86400000).toISOString(), event: "Login gagal (3x)", severity: "danger" },
  ], []);

  return (
    <AccountShell
      title="Security Events"
      description="Log aktivitas keamanan"
      breadcrumbs={[{ label: "Security", href: "/security" }, { label: "Events", href: "/security/events" }]}
    >
      {({ user, isLoadingUser, loadError }) => (
        <div className={styles.page}>
          {isLoadingUser ? (
            <SmartSkeleton variant="table" />
          ) : !user ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔐</div>
              <h3>Akses Terbatas</h3>
              <p>{loadError ?? "Silakan login."}</p>
              <Link className="primary-btn" href="/login">Login</Link>
            </div>
          ) : (
            <>
              <div className={styles.statsGrid}>
                <div className={styles.stat}>
                  <h4>{events.filter(e => e.severity === "danger").length}</h4>
                  <p>Critical</p>
                </div>
                <div className={styles.stat}>
                  <h4>{events.filter(e => e.severity === "warning").length}</h4>
                  <p>Warning</p>
                </div>
                <div className={styles.stat}>
                  <h4>{events.length}</h4>
                  <p>Total</p>
                </div>
              </div>

              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Event</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e.id}>
                        <td>{new Date(e.time).toLocaleString("id-ID")}</td>
                        <td>{e.event}</td>
                        <td>
                          <span className={`badge badge--${e.severity === "danger" ? "danger" : e.severity === "warning" ? "warning" : "info"}`}>
                            {e.severity.charAt(0).toUpperCase() + e.severity.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.actions}>
                <Link className="secondary-btn" href="/security/sessions">Sessions</Link>
                <Link className="secondary-btn" href="/admin/audit-logs">Audit Logs</Link>
              </div>
            </>
          )}
        </div>
      )}
    </AccountShell>
  );
}
