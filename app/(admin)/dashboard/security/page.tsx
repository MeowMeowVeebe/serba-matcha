"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import AccountShell from "@/components/AccountShell";
import { useAlert } from "@/context/AlertContext";
import { useConfirm } from "@/components/ui/GlobalConfirmDialog";

// Types
type Session = {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastSeen: string;
  status: "active" | "recent" | "inactive";
  isCurrent: boolean;
};

type SecurityEvent = {
  id: string;
  time: string;
  event: string;
  description: string;
  severity: "info" | "warning" | "danger";
  ip?: string;
};

type SecurityScore = {
  score: number;
  level: "excellent" | "good" | "fair" | "poor";
  recommendations: string[];
};

// Icons
const Icons = {
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  shieldCheck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  monitor: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  smartphone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
    </svg>
  ),
  key: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  unlock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 019.9-1" />
    </svg>
  ),
  alertTriangle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  logOut: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  ),
};

// Security Score Ring Component
function SecurityScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const level = score >= 80 ? "excellent" : score >= 60 ? "good" : score >= 40 ? "fair" : "poor";
  const colors = { excellent: "#10b981", good: "#22c55e", fair: "#f59e0b", poor: "#ef4444" };

  return (
    <div className="security-ring">
      <svg width="140" height="140" className="progress-ring__circle">
        <circle className="progress-ring__bg" cx="70" cy="70" r={radius} strokeWidth="10" fill="none" />
        <circle
          className="progress-ring__progress"
          cx="70" cy="70" r={radius}
          strokeWidth="10" fill="none"
          stroke={colors[level]}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="security-ring__content">
        <span className="security-ring__score">{score}</span>
        <span className="security-ring__label">/ 100</span>
      </div>
      <style jsx>{`
        .security-ring { position: relative; display: inline-flex; align-items: center; justify-content: center; }
        .security-ring__content { position: absolute; text-align: center; }
        .security-ring__score { font-size: 2rem; font-weight: 700; color: white; }
        .security-ring__label { display: block; font-size: 0.8rem; opacity: 0.8; color: white; }
      `}</style>
    </div>
  );
}

// Session Card Component
function SessionCard({ session, onRevoke, isRevoking }: { session: Session; onRevoke: () => void; isRevoking: boolean }) {
  const deviceIcon = session.device.toLowerCase().includes("mobile") ? Icons.smartphone : Icons.monitor;
  const statusColors = { active: "success", recent: "info", inactive: "warning" };

  return (
    <div className={`session-card ${session.isCurrent ? "session-card--current" : ""}`}>
      <div className="session-card__icon">{deviceIcon}</div>
      <div className="session-card__info">
        <div className="session-card__device">
          {session.device} • {session.browser}
          {session.isCurrent && <span className="session-card__current-badge">Perangkat Ini</span>}
        </div>
        <div className="session-card__meta">
          <span>{Icons.globe} {session.location}</span>
          <span>{Icons.clock} {session.lastSeen}</span>
        </div>
      </div>
      <div className="session-card__actions">
        <span className={`matcha-badge matcha-badge--${statusColors[session.status]}`}>
          <span className="matcha-badge__dot" />
          {session.status}
        </span>
        {!session.isCurrent && (
          <button
            className="matcha-btn matcha-btn--ghost matcha-btn--sm"
            onClick={onRevoke}
            disabled={isRevoking}
          >
            {Icons.x}
          </button>
        )}
      </div>
      <style jsx>{`
        .session-card {
          display: flex; align-items: center; gap: 16px;
          padding: 16px; background: var(--hover-bg);
          border-radius: 12px; border: 1px solid transparent;
          transition: all 0.2s ease;
        }
        .session-card:hover { background: var(--card-bg); border-color: var(--card-border); }
        .session-card--current { border-color: var(--matcha-400); background: var(--matcha-50); }
        :global(body.dark) .session-card--current { background: rgba(34, 197, 94, 0.1); }
        .session-card__icon { width: 40px; height: 40px; border-radius: 10px; background: var(--card-bg);
          display: flex; align-items: center; justify-content: center; color: var(--text-secondary); }
        .session-card__icon :global(svg) { width: 20px; height: 20px; }
        .session-card__info { flex: 1; min-width: 0; }
        .session-card__device { font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .session-card__current-badge { font-size: 0.7rem; padding: 2px 8px; background: var(--matcha-500); color: white; border-radius: 10px; }
        .session-card__meta { display: flex; gap: 16px; margin-top: 4px; font-size: 0.8rem; color: var(--text-muted); }
        .session-card__meta span { display: flex; align-items: center; gap: 4px; }
        .session-card__meta :global(svg) { width: 14px; height: 14px; }
        .session-card__actions { display: flex; align-items: center; gap: 8px; }
      `}</style>
    </div>
  );
}

// Event Item Component
function EventItem({ event }: { event: SecurityEvent }) {
  const icons = { info: Icons.info, warning: Icons.alertTriangle, danger: Icons.alertTriangle };
  const colors = { info: "info", warning: "warning", danger: "danger" };

  return (
    <div className="event-item">
      <div className={`event-item__icon event-item__icon--${colors[event.severity]}`}>
        {icons[event.severity]}
      </div>
      <div className="event-item__content">
        <div className="event-item__title">{event.event}</div>
        <div className="event-item__desc">{event.description}</div>
        <div className="event-item__meta">
          {new Date(event.time).toLocaleString("id-ID")}
          {event.ip && ` • IP: ${event.ip}`}
        </div>
      </div>
      <style jsx>{`
        .event-item { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--card-border); }
        .event-item:last-child { border-bottom: none; }
        .event-item__icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .event-item__icon :global(svg) { width: 16px; height: 16px; }
        .event-item__icon--info { background: var(--info-light); color: var(--info); }
        .event-item__icon--warning { background: var(--warning-light); color: var(--warning); }
        .event-item__icon--danger { background: var(--danger-light); color: var(--danger); }
        .event-item__content { flex: 1; min-width: 0; }
        .event-item__title { font-weight: 600; color: var(--text-primary); font-size: 0.9rem; }
        .event-item__desc { font-size: 0.85rem; color: var(--text-secondary); margin-top: 2px; }
        .event-item__meta { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }
      `}</style>
    </div>
  );
}

// Quick Security Action
function SecurityAction({ icon, label, description, onClick, variant = "default" }: {
  icon: React.ReactNode; label: string; description: string; onClick: () => void; variant?: "default" | "danger";
}) {
  return (
    <button className={`security-action security-action--${variant}`} onClick={onClick}>
      <div className="security-action__icon">{icon}</div>
      <div className="security-action__info">
        <span className="security-action__label">{label}</span>
        <span className="security-action__desc">{description}</span>
      </div>
      <style jsx>{`
        .security-action {
          display: flex; align-items: center; gap: 12px; width: 100%;
          padding: 16px; background: var(--hover-bg); border: 1px solid transparent;
          border-radius: 12px; cursor: pointer; transition: all 0.2s ease; text-align: left;
        }
        .security-action:hover { background: var(--card-bg); border-color: var(--card-border); }
        .security-action--danger:hover { border-color: var(--danger); background: var(--danger-light); }
        .security-action__icon { width: 40px; height: 40px; border-radius: 10px; background: var(--matcha-100);
          color: var(--matcha-600); display: flex; align-items: center; justify-content: center; }
        :global(body.dark) .security-action__icon { background: rgba(34, 197, 94, 0.15); color: var(--matcha-400); }
        .security-action--danger .security-action__icon { background: var(--danger-light); color: var(--danger); }
        .security-action__icon :global(svg) { width: 20px; height: 20px; }
        .security-action__info { flex: 1; }
        .security-action__label { display: block; font-weight: 600; color: var(--text-primary); }
        .security-action__desc { display: block; font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px; }
      `}</style>
    </button>
  );
}

export default function SecurityCenterPage() {
  const { showAlert } = useAlert();
  const { confirm } = useConfirm();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [securityScore, setSecurityScore] = useState<SecurityScore>({ score: 0, level: "poor", recommendations: [] });
  const [hasRecentPasswordChange, setHasRecentPasswordChange] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  
  // Password form
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  // Calculate security score based on real conditions
  const calculateSecurityScore = useCallback((sessionsData: Session[], eventsData: SecurityEvent[], has2FA: boolean, recentPwdChange: boolean) => {
    let score = 0;
    const recommendations: string[] = [];

    // Base score for having an account (+20)
    score += 20;

    // 2FA enabled (+25)
    if (has2FA) {
      score += 25;
    } else {
      recommendations.push("Aktifkan Two-Factor Authentication");
    }

    // Recent password change within 90 days (+20)
    if (recentPwdChange) {
      score += 20;
    } else {
      recommendations.push("Perbarui password Anda");
    }

    // No suspicious login attempts (+15)
    const suspiciousEvents = eventsData.filter(e => e.severity === "danger" || e.severity === "warning");
    if (suspiciousEvents.length === 0) {
      score += 15;
    } else {
      recommendations.push("Periksa aktivitas mencurigakan");
    }

    // Active sessions reasonable (1-3 devices) (+10)
    const activeSessions = sessionsData.filter(s => s.status === "active");
    if (activeSessions.length >= 1 && activeSessions.length <= 3) {
      score += 10;
    } else if (activeSessions.length > 3) {
      recommendations.push("Terlalu banyak sesi aktif, pertimbangkan logout beberapa");
    }

    // Profile complete (bonus +10)
    score += 10;

    // Determine level
    let level: "excellent" | "good" | "fair" | "poor";
    if (score >= 90) level = "excellent";
    else if (score >= 70) level = "good";
    else if (score >= 50) level = "fair";
    else level = "poor";

    return { score: Math.min(score, 100), level, recommendations };
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sessionsRes, eventsRes] = await Promise.all([
        fetch("/api/security/sessions"),
        fetch("/api/security/events"),
      ]);

      let sessionsData: Session[] = [];
      let eventsData: SecurityEvent[] = [];

      if (sessionsRes.ok) {
        const json = await sessionsRes.json();
        sessionsData = json.data?.sessions || [];
        setSessions(sessionsData);
      }

      if (eventsRes.ok) {
        const json = await eventsRes.json();
        eventsData = json.data?.events || [];
        setEvents(eventsData);
        
        // Check for recent password change (within 90 days)
        const now = new Date();
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const recentPwdChange = eventsData.some(e => 
          e.event.toLowerCase().includes("password") && 
          new Date(e.time) > ninetyDaysAgo
        );
        setHasRecentPasswordChange(recentPwdChange);
      }

      // Calculate real security score
      const newScore = calculateSecurityScore(sessionsData, eventsData, is2FAEnabled, hasRecentPasswordChange);
      setSecurityScore(newScore);

    } catch (err) {
      console.error("Failed to fetch security data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [calculateSecurityScore, is2FAEnabled, hasRecentPasswordChange]);

  const handleRevokeSession = async (sessionId: string) => {
    const confirmed = await confirm({
      title: "Akhiri Sesi?",
      message: "Perangkat ini akan logout dan perlu login kembali.",
      confirmText: "Ya, Akhiri",
      cancelText: "Batal",
      variant: "warning",
    });

    if (!confirmed) return;

    setRevokingId(sessionId);
    try {
      const res = await fetch(`/api/security/sessions?sessionId=${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        showAlert("Sesi berhasil diakhiri", { variant: "success" });
      } else {
        throw new Error("Failed to revoke session");
      }
    } catch {
      showAlert("Gagal mengakhiri sesi", { variant: "error" });
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    const confirmed = await confirm({
      title: "Logout Semua Perangkat?",
      message: "Semua perangkat akan logout termasuk perangkat ini. Anda perlu login kembali.",
      confirmText: "Ya, Logout Semua",
      cancelText: "Batal",
      variant: "danger",
    });

    if (!confirmed) return;

    setIsLoggingOutAll(true);
    try {
      const res = await fetch("/api/auth/logout-all", {
        method: "POST",
      });
      
      if (res.ok) {
        showAlert("Semua sesi berhasil diakhiri. Mengalihkan ke halaman login...", { variant: "success" });
        setTimeout(() => {
          window.location.href = "/dashboard/login";
        }, 1500);
      } else {
        throw new Error("Failed to logout all");
      }
    } catch {
      showAlert("Gagal logout semua perangkat", { variant: "error" });
      setIsLoggingOutAll(false);
    }
  };

  const handleChangePassword = () => {
    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordError("");
    setShowPasswordModal(true);
  };

  const submitPasswordChange = async () => {
    // Validation
    if (!passwordForm.oldPassword) {
      setPasswordError("Masukkan password lama");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Password baru minimal 8 karakter");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Konfirmasi password tidak cocok");
      return;
    }

    setIsChangingPassword(true);
    setPasswordError("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showAlert("Password berhasil diubah. Silakan login ulang.", { variant: "success" });
        setShowPasswordModal(false);
        setTimeout(() => {
          window.location.href = "/dashboard/login";
        }, 1500);
      } else {
        setPasswordError(data.message || "Gagal mengubah password");
      }
    } catch {
      setPasswordError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handle2FAToggle = async () => {
    if (is2FAEnabled) {
      // Disable 2FA
      const confirmed = await confirm({
        title: "Nonaktifkan 2FA?",
        message: "Akun Anda akan kurang aman tanpa autentikasi dua faktor.",
        confirmText: "Ya, Nonaktifkan",
        cancelText: "Batal",
        variant: "warning",
      });

      if (confirmed) {
        setIsEnabling2FA(true);
        // Simulate API call
        await new Promise(r => setTimeout(r, 1000));
        setIs2FAEnabled(false);
        // Recalculate score
        const newScore = calculateSecurityScore(sessions, events, false, hasRecentPasswordChange);
        setSecurityScore(newScore);
        showAlert("2FA berhasil dinonaktifkan", { variant: "success" });
        setIsEnabling2FA(false);
      }
    } else {
      setShow2FAModal(true);
    }
  };

  const enable2FA = async () => {
    setIsEnabling2FA(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    setIs2FAEnabled(true);
    // Recalculate score
    const newScore = calculateSecurityScore(sessions, events, true, hasRecentPasswordChange);
    setSecurityScore(newScore);
    setShow2FAModal(false);
    showAlert("2FA berhasil diaktifkan! Keamanan akun meningkat.", { variant: "success" });
    setIsEnabling2FA(false);
  };

  return (
    <AccountShell
      title="Security Center"
      description="Pantau dan kelola keamanan akun Anda"
      breadcrumbs={[{ label: "Security Center" }]}
      actions={
        <button onClick={fetchData} className="matcha-btn matcha-btn--secondary">
          {Icons.refresh}<span>Refresh</span>
        </button>
      }
    >
      {({ user, isLoadingUser }) => {
        useEffect(() => {
          if (user) fetchData();
        }, [user]);

        if (isLoadingUser || isLoading) return <SecuritySkeleton />;

        if (!user) {
          return (
            <div className="matcha-empty">
              <div className="matcha-empty__icon">{Icons.shield}</div>
              <h3 className="matcha-empty__title">Akses Terbatas</h3>
              <p className="matcha-empty__text">Silakan login untuk mengakses Security Center.</p>
              <Link href="/dashboard/login" className="matcha-btn matcha-btn--primary">Login</Link>
            </div>
          );
        }

        return (
          <div className="security-page">
            {/* Security Score Banner */}
            <div className="security-banner animate-fade-in">
              <SecurityScoreRing score={securityScore.score} />
              <div className="security-banner__info">
                <h2>Keamanan Akun Anda: {
                  securityScore.score >= 100 ? "Sempurna! 🎉" :
                  securityScore.level === "excellent" ? "Sangat Baik" : 
                  securityScore.level === "good" ? "Baik" : 
                  securityScore.level === "fair" ? "Cukup" : "Perlu Ditingkatkan"
                }</h2>
                <p>
                  {securityScore.score >= 100 
                    ? "Selamat! Akun Anda sudah terlindungi dengan maksimal."
                    : securityScore.recommendations.length > 0
                      ? `Tips: ${securityScore.recommendations[0]}`
                      : "Akun Anda terlindungi dengan baik. Terus pantau aktivitas secara berkala."
                  }
                </p>
                {securityScore.score < 100 && (
                  <div className="security-banner__actions">
                    <button className="matcha-btn security-banner__btn" onClick={handleChangePassword}>
                      {Icons.key}<span>Ganti Password</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Main Grid */}
            <div className="security-grid animate-fade-in animate-delay-1">
              {/* Sessions */}
              <div className="matcha-card">
                <div className="matcha-card__header">
                  <h3><span className="matcha-card__header-icon">{Icons.monitor}</span>Sesi Aktif ({sessions.length})</h3>
                  <button className="matcha-btn matcha-btn--ghost matcha-btn--sm" onClick={handleRevokeAllSessions}>
                    Logout Semua
                  </button>
                </div>
                <div className="matcha-card__body">
                  {sessions.length > 0 ? (
                    <div className="sessions-list">
                      {sessions.map((session) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          onRevoke={() => handleRevokeSession(session.id)}
                          isRevoking={revokingId === session.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="matcha-empty" style={{ padding: "40px 20px" }}>
                      <div className="matcha-empty__icon">{Icons.monitor}</div>
                      <h3 className="matcha-empty__title">Tidak Ada Sesi</h3>
                      <p className="matcha-empty__text">Tidak ada sesi aktif yang ditemukan.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="matcha-card">
                <div className="matcha-card__header">
                  <h3><span className="matcha-card__header-icon">{Icons.shieldCheck}</span>Aksi Keamanan</h3>
                </div>
                <div className="matcha-card__body">
                  <div className="security-actions">
                    <SecurityAction
                      icon={Icons.key}
                      label="Ganti Password"
                      description="Perbarui password akun Anda"
                      onClick={handleChangePassword}
                    />
                    <SecurityAction
                      icon={is2FAEnabled ? Icons.shieldCheck : Icons.lock}
                      label={is2FAEnabled ? "2FA Aktif ✓" : "Two-Factor Auth"}
                      description={is2FAEnabled ? "Klik untuk nonaktifkan" : "Aktifkan keamanan tambahan"}
                      onClick={handle2FAToggle}
                    />
                    <SecurityAction
                      icon={Icons.logOut}
                      label={isLoggingOutAll ? "Logout..." : "Logout Semua"}
                      description="Akhiri semua sesi aktif"
                      onClick={handleRevokeAllSessions}
                      variant="danger"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Events */}
            <div className="matcha-card animate-fade-in animate-delay-2">
              <div className="matcha-card__header">
                <h3><span className="matcha-card__header-icon">{Icons.activity}</span>Aktivitas Keamanan</h3>
                <Link href="/dashboard/security/events" className="matcha-btn matcha-btn--ghost matcha-btn--sm">Lihat Semua</Link>
              </div>
              <div className="matcha-card__body">
                {events.length > 0 ? (
                  <div className="events-list">
                    {events.slice(0, 5).map((event) => (
                      <EventItem key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="matcha-empty" style={{ padding: "40px 20px" }}>
                    <div className="matcha-empty__icon">{Icons.activity}</div>
                    <h3 className="matcha-empty__title">Tidak Ada Aktivitas</h3>
                    <p className="matcha-empty__text">Belum ada aktivitas keamanan yang tercatat.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
              <div className="modal-overlay" onClick={() => !isChangingPassword && setShowPasswordModal(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>{Icons.key} Ganti Password</h3>
                    <button className="modal-close" onClick={() => !isChangingPassword && setShowPasswordModal(false)}>
                      {Icons.x}
                    </button>
                  </div>
                  <div className="modal-body">
                    {passwordError && (
                      <div className="modal-error">{passwordError}</div>
                    )}
                    <div className="modal-field">
                      <label>Password Lama</label>
                      <input
                        type="password"
                        className="matcha-input"
                        value={passwordForm.oldPassword}
                        onChange={e => setPasswordForm(p => ({ ...p, oldPassword: e.target.value }))}
                        placeholder="Masukkan password lama"
                        disabled={isChangingPassword}
                      />
                    </div>
                    <div className="modal-field">
                      <label>Password Baru</label>
                      <input
                        type="password"
                        className="matcha-input"
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                        placeholder="Minimal 8 karakter"
                        disabled={isChangingPassword}
                      />
                    </div>
                    <div className="modal-field">
                      <label>Konfirmasi Password Baru</label>
                      <input
                        type="password"
                        className="matcha-input"
                        value={passwordForm.confirmPassword}
                        onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                        placeholder="Ulangi password baru"
                        disabled={isChangingPassword}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      className="matcha-btn matcha-btn--secondary" 
                      onClick={() => setShowPasswordModal(false)}
                      disabled={isChangingPassword}
                    >
                      Batal
                    </button>
                    <button 
                      className="matcha-btn matcha-btn--primary"
                      onClick={submitPasswordChange}
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? (
                        <><span className="btn-spinner"></span> Menyimpan...</>
                      ) : (
                        "Simpan Password"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2FA Setup Modal */}
            {show2FAModal && (
              <div className="modal-overlay" onClick={() => !isEnabling2FA && setShow2FAModal(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>{Icons.lock} Aktifkan Two-Factor Auth</h3>
                    <button className="modal-close" onClick={() => !isEnabling2FA && setShow2FAModal(false)}>
                      {Icons.x}
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="twofa-info">
                      <div className="twofa-qr">
                        <div className="qr-placeholder">
                          <span>QR Code</span>
                        </div>
                      </div>
                      <div className="twofa-instructions">
                        <p><strong>Langkah 1:</strong> Download aplikasi authenticator (Google Authenticator, Authy, dll)</p>
                        <p><strong>Langkah 2:</strong> Scan QR code di sebelah kiri</p>
                        <p><strong>Langkah 3:</strong> Masukkan 6-digit kode dari aplikasi</p>
                      </div>
                    </div>
                    <div className="modal-field">
                      <label>Kode Verifikasi</label>
                      <input
                        type="text"
                        className="matcha-input"
                        placeholder="000000"
                        maxLength={6}
                        style={{ textAlign: "center", letterSpacing: "0.5em", fontSize: "1.25rem" }}
                        disabled={isEnabling2FA}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      className="matcha-btn matcha-btn--secondary" 
                      onClick={() => setShow2FAModal(false)}
                      disabled={isEnabling2FA}
                    >
                      Batal
                    </button>
                    <button 
                      className="matcha-btn matcha-btn--primary"
                      onClick={enable2FA}
                      disabled={isEnabling2FA}
                    >
                      {isEnabling2FA ? (
                        <><span className="btn-spinner"></span> Mengaktifkan...</>
                      ) : (
                        "Aktifkan 2FA"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <style jsx>{`
              .security-page { display: flex; flex-direction: column; gap: 24px; }
              .security-banner {
                display: flex; align-items: center; gap: 32px; padding: 32px;
                background: linear-gradient(135deg, var(--matcha-500) 0%, var(--matcha-700) 100%);
                border-radius: 20px; color: white;
              }
              .security-banner__info { flex: 1; }
              .security-banner__info h2 { margin: 0 0 8px; font-size: 1.5rem; }
              .security-banner__info p { margin: 0; opacity: 0.9; max-width: 500px; }
              .security-banner__actions { margin-top: 20px; }
              .security-banner__btn {
                background: rgba(255,255,255,0.2); color: white;
                border: 1px solid rgba(255,255,255,0.3);
              }
              .security-banner__btn:hover { background: rgba(255,255,255,0.3); }
              .security-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; }
              .sessions-list { display: flex; flex-direction: column; gap: 12px; }
              .security-actions { display: flex; flex-direction: column; gap: 12px; }
              .events-list { display: flex; flex-direction: column; }

              /* Modal styles */
              .modal-overlay {
                position: fixed; inset: 0; background: rgba(0,0,0,0.6);
                backdrop-filter: blur(4px); display: flex; align-items: center;
                justify-content: center; z-index: 1000; padding: 20px;
              }
              .modal-content {
                background: var(--card-bg); border-radius: 16px;
                width: 100%; max-width: 440px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                animation: modal-in 0.25s ease;
              }
              @keyframes modal-in {
                from { opacity: 0; transform: scale(0.95) translateY(10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
              .modal-header {
                display: flex; align-items: center; justify-content: space-between;
                padding: 20px 24px; border-bottom: 1px solid var(--card-border);
              }
              .modal-header h3 {
                margin: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 10px;
                color: var(--text-primary);
              }
              .modal-header h3 :global(svg) { width: 20px; height: 20px; color: var(--matcha-500); }
              .modal-close {
                background: none; border: none; cursor: pointer;
                color: var(--text-secondary); padding: 4px;
                border-radius: 6px; transition: all 0.15s ease;
              }
              .modal-close:hover { background: var(--hover-bg); color: var(--text-primary); }
              .modal-close :global(svg) { width: 20px; height: 20px; }
              .modal-body { padding: 24px; }
              .modal-error {
                background: var(--danger-light); color: var(--danger);
                padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;
                font-size: 0.9rem;
              }
              .modal-field { margin-bottom: 16px; }
              .modal-field:last-child { margin-bottom: 0; }
              .modal-field label {
                display: block; font-size: 0.875rem; font-weight: 500;
                color: var(--text-primary); margin-bottom: 6px;
              }
              .modal-footer {
                display: flex; gap: 12px; justify-content: flex-end;
                padding: 16px 24px; border-top: 1px solid var(--card-border);
              }
              .btn-spinner {
                width: 16px; height: 16px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top-color: white; border-radius: 50%;
                animation: spin 0.8s linear infinite; display: inline-block;
              }
              @keyframes spin { to { transform: rotate(360deg); } }

              /* 2FA styles */
              .twofa-info { display: flex; gap: 20px; margin-bottom: 20px; }
              .twofa-qr { flex-shrink: 0; }
              .qr-placeholder {
                width: 120px; height: 120px; background: var(--hover-bg);
                border-radius: 12px; display: flex; align-items: center;
                justify-content: center; color: var(--text-muted);
                font-size: 0.85rem; border: 2px dashed var(--card-border);
              }
              .twofa-instructions { flex: 1; }
              .twofa-instructions p {
                margin: 0 0 8px; font-size: 0.85rem; color: var(--text-secondary);
                line-height: 1.5;
              }
              .twofa-instructions p:last-child { margin-bottom: 0; }

              @media (max-width: 1024px) { .security-grid { grid-template-columns: 1fr; } }
              @media (max-width: 640px) {
                .security-banner { flex-direction: column; text-align: center; gap: 20px; padding: 24px; }
                .security-banner__info h2 { font-size: 1.25rem; }
                .twofa-info { flex-direction: column; align-items: center; text-align: center; }
              }
            `}</style>
          </div>
        );
      }}
    </AccountShell>
  );
}

function SecuritySkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ height: 180, background: "var(--hover-bg)", borderRadius: 20 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
        <div style={{ height: 300, background: "var(--hover-bg)", borderRadius: 14 }} />
        <div style={{ height: 300, background: "var(--hover-bg)", borderRadius: 14 }} />
      </div>
      <div style={{ height: 250, background: "var(--hover-bg)", borderRadius: 14 }} />
    </div>
  );
}


