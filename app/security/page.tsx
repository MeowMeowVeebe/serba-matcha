"use client";

import Link from "next/link";
import { useMemo } from "react";
import AccountShell from "@/components/AccountShell";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import styles from "./Security.module.css";

function statusBadge(status: "active" | "recent" | string) {
  const variant = status === "active" ? "success" : status === "recent" ? "info" : "warning";
  const label = status === "active" ? "Active" : status === "recent" ? "Recent" : status;
  return <span className={`badge badge--${variant}`}>{label}</span>;
}

function severityBadge(severity: "info" | "warning" | "danger" | string) {
  const variant = severity === "danger" ? "danger" : severity === "warning" ? "warning" : "info";
  return <span className={`badge badge--${variant}`}>{severity.charAt(0).toUpperCase() + severity.slice(1)}</span>;
}

export default function SecurityCenterPage() {
  const sessions = useMemo(() => [
    { id: "current", device: "Current device", location: "Unknown", lastSeen: "Just now", status: "active" as const },
    { id: "2", device: "Chrome on Windows", location: "Jakarta", lastSeen: "2d ago", status: "recent" as const },
  ], []);

  const events = useMemo(() => [
    { id: "1", ts: new Date().toISOString(), message: "Login berhasil", severity: "info" as const },
    { id: "2", ts: new Date(Date.now() - 3600000).toISOString(), message: "Password diubah", severity: "warning" as const },
  ], []);

  return (
    <AccountShell
      title="Security Center"
      description="Kelola keamanan akun"
      breadcrumbs={[{ label: "Security", href: "/security" }]}
    >
      {({ user, isLoadingUser, loadError }) => (
        <div className={styles.page}>
          {isLoadingUser ? (
            <div className={styles.grid}>
              <SmartSkeleton variant="card" />
              <SmartSkeleton variant="card" />
            </div>
          ) : !user ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔐</div>
              <h3>Akses Terbatas</h3>
              <p>{loadError ?? "Silakan login untuk mengakses Security Center."}</p>
              <Link className="primary-btn" href="/login">Login</Link>
            </div>
          ) : (
            <>
              {/* Account Info */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>Informasi Akun</h3>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Nama</span>
                    <span className={styles.value}>{user.name}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Email</span>
                    <span className={styles.value}>{user.email}</span>
                  </div>
                  <div className={styles.actions}>
                    <Link className="secondary-btn" href="/settings">Edit Profil</Link>
                  </div>
                </div>
              </div>

              {/* Sessions */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>Sesi Aktif</h3>
                  <Link className="secondary-btn" href="/security/sessions">Kelola</Link>
                </div>
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Device</th>
                        <th>Lokasi</th>
                        <th>Terakhir</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((s) => (
                        <tr key={s.id}>
                          <td>{s.device}</td>
                          <td>{s.location}</td>
                          <td>{s.lastSeen}</td>
                          <td>{statusBadge(s.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Security Events */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>Event Keamanan</h3>
                  <Link className="secondary-btn" href="/security/events">Lihat Semua</Link>
                </div>
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Waktu</th>
                        <th>Event</th>
                        <th>Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((e) => (
                        <tr key={e.id}>
                          <td>{new Date(e.ts).toLocaleString("id-ID")}</td>
                          <td>{e.message}</td>
                          <td>{severityBadge(e.severity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </AccountShell>
  );
}
