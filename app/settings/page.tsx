"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout, logoutAll, me, updateProfile, type AuthUser } from "@/lib/authClient";
import { useAlert } from "../../context/AlertContext";

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const { showAlert } = useAlert();

  const canSave = useMemo(() => {
    if (isSaving) return false;
    // Boleh save name saja tanpa old password
    if (newPassword && !oldPassword) return false;
    return true;
  }, [isSaving, newPassword, oldPassword]);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  useEffect(() => {
    void (async () => {
      setIsLoadingUser(true);
      const res = await me();
      if (!res.ok) {
        router.push("/login");
        return;
      }
      setUser(res.user);
      setName(res.user.name);
      setEmail(res.user.email);
      setIsLoadingUser(false);
    })();
  }, [router]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      router.push("/login");
    }
  };

  const handleLogoutAll = async () => {
    if (isLoggingOutAll) return;
    setIsLoggingOutAll(true);
    try {
      const res = await logoutAll();
      showAlert(res.message ?? "Logout semua device.");
    } finally {
      setIsLoggingOutAll(false);
      router.push("/login");
    }
  };

  const handleSave = async () => {
    if (!canSave) return;

    setIsSaving(true);
    try {
      const res = await updateProfile({
        name,
        oldPassword: oldPassword || undefined,
        newPassword: newPassword || undefined,
      });

      if (!res.ok) {
        showAlert(res.message);
        return;
      }

      setUser(res.user);
      setName(res.user.name);
      setEmail(res.user.email);
      showAlert(res.message);
      setOldPassword("");
      setNewPassword("");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>Serba Matchia</h2>

        {isLoadingUser ? (
          <div className="sidebar-user sidebar-user-skeleton" aria-hidden />
        ) : user ? (
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user.name.slice(0, 1).toUpperCase()}</div>
            <div className="sidebar-user-meta">
              <p className="sidebar-user-name">{user.name}</p>
              <p className="sidebar-user-email">{user.email}</p>
            </div>
          </div>
        ) : null}

        <Link className="nav-link" href="/dashboard">
          Dashboard
        </Link>
        <Link className="nav-link active" href="/settings">
          Settings
        </Link>

        <button className="nav-link nav-link-btn" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>

      <div className="main">
        <div className="header">
          <h2>Settings</h2>
          <button onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
            Toggle Dark Mode
          </button>
        </div>

        <div className="settings-grid">
          {/* PROFILE */}
          <div className="card">
            <div className="card-header">
              <h3>Your Profile</h3>
            </div>

            <div className="form-group">
              <label>Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} disabled />
            </div>
          </div>

          {/* SECURITY */}
          <div className="card">
            <div className="card-header">
              <h3>Keamanan</h3>
              <p>Ubah password akun</p>
            </div>

            <div className="form-group">
              <label>Password Lama</label>
              <input
                type="password"
                placeholder="********"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password Baru</label>
              <input
                type="password"
                placeholder="********"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="action-bar">
          <button className="primary-btn" onClick={handleSave} disabled={!canSave}>
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
          <button className="secondary-btn" onClick={handleLogoutAll} disabled={isLoggingOutAll}>
            {isLoggingOutAll ? "Logging out..." : "Logout semua device"}
          </button>
        </div>
      </div>
    </>
  );
}
