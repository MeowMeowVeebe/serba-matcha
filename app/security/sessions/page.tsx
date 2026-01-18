"use client";

import Link from "next/link";
import { useMemo } from "react";
import AccountShell from "@/components/AccountShell";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "@/styles/pages.module.css";

export default function SecuritySessionsPage() {
  const sessions = useMemo(() => [
    { id: "1", device: "Current Device", location: "Jakarta", lastSeen: "Just now", status: "active" },
    { id: "2", device: "Chrome on Windows", location: "Jakarta", lastSeen: "2 days ago", status: "recent" },
    { id: "3", device: "Safari on iPhone", location: "Bandung", lastSeen: "7 days ago", status: "recent" },
  ], []);

  return (
    <AccountShell
      title="Sessions"
      description="Kelola sesi aktif"
      breadcrumbs={[{ label: "Security", href: "/security" }, { label: "Sessions", href: "/security/sessions" }]}
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
                  <h4>{sessions.filter(s => s.status === "active").length}</h4>
                  <p>Active</p>
                </div>
                <div className={styles.stat}>
                  <h4>{sessions.length}</h4>
                  <p>Total Sessions</p>
                </div>
              </div>

              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Device</th>
                      <th>Location</th>
                      <th>Last Seen</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id}>
                        <td>{s.device}</td>
                        <td>{s.location}</td>
                        <td>{s.lastSeen}</td>
                        <td>
                          <span className={`badge badge--${s.status === "active" ? "success" : "info"}`}>
                            {s.status === "active" ? "Active" : "Recent"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.actions}>
                <Link className="secondary-btn" href="/security/events">Security Events</Link>
                <Link className="secondary-btn" href="/security">Back</Link>
              </div>
            </>
          )}
        </div>
      )}
    </AccountShell>
  );
}
