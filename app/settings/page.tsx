"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/authClient";
import AccountShell from "@/components/AccountShell";
import { useAlert } from "../../context/AlertContext";
import { TextField } from "@/components/form/TextField";
import PasswordField from "@/components/form/PasswordField";
import PrimaryButton from "@/components/form/PrimaryButton";
import FormError from "@/components/form/FormError";
import { SmartSkeleton } from "@/components/ui/SmartSkeleton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import styles from "./Settings.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; oldPassword?: string; newPassword?: string; confirmNewPassword?: string; form?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const { showAlert } = useAlert();

  const mismatch = useMemo(() => {
    if (!newPassword || !confirmNewPassword) return false;
    return newPassword !== confirmNewPassword;
  }, [newPassword, confirmNewPassword]);

  const canSave = useMemo(() => {
    if (isSaving) return false;
    if (!name.trim()) return false;

    // if changing password -> require old + confirm + min length
    if (newPassword || confirmNewPassword) {
      if (!oldPassword) return false;
      if (!newPassword || newPassword.length < 8) return false;
      if (mismatch) return false;
    }

    return true;
  }, [isSaving, name, newPassword, confirmNewPassword, oldPassword, mismatch]);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const oldPasswordRef = useRef<HTMLInputElement | null>(null);
  const newPasswordRef = useRef<HTMLInputElement | null>(null);
  const confirmNewPasswordRef = useRef<HTMLInputElement | null>(null);

  const validate = () => {
    const next: typeof errors = {};

    if (!name.trim()) next.name = "Nama wajib diisi.";
    else if (name.trim().length < 2) next.name = "Nama minimal 2 karakter.";

    if (newPassword || confirmNewPassword) {
      if (!oldPassword) next.oldPassword = "Password lama wajib diisi untuk mengganti password.";
      if (!newPassword) next.newPassword = "Password baru wajib diisi.";
      else if (newPassword.length < 8) next.newPassword = "Password baru minimal 8 karakter.";

      if (!confirmNewPassword) next.confirmNewPassword = "Konfirmasi password baru wajib diisi.";
      else if (confirmNewPassword !== newPassword) next.confirmNewPassword = "Konfirmasi password tidak sama.";
    }

    setErrors(next);

    if (next.name) nameRef.current?.focus();
    else if (next.oldPassword) oldPasswordRef.current?.focus();
    else if (next.newPassword) newPasswordRef.current?.focus();
    else if (next.confirmNewPassword) confirmNewPasswordRef.current?.focus();

    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (isSaving) return;
    setErrors({});
    if (!validate()) return;

    const isChangingPassword = Boolean(newPassword);

    setIsSaving(true);
    try {
      const res = await updateProfile({
        name,
        oldPassword: isChangingPassword ? oldPassword : undefined,
        newPassword: isChangingPassword ? newPassword : undefined,
      });

      if (!res.ok) {
        setErrors({ form: res.message });
        showAlert(res.message, { variant: "error" });
        return;
      }

      setName(res.user.name);
      setEmail(res.user.email);

      // If password changed, backend clears cookies -> force re-login.
      if (isChangingPassword) {
        showAlert(res.message, { variant: "warning", durationMs: 4500 });
        router.push("/login");
        return;
      }

      showAlert(res.message, { variant: "success" });
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    if (isLoggingOutAll) return;

    setIsLoggingOutAll(true);
    try {
      const res = await fetch("/api/auth/logout-all", { method: "POST" });
      const body = (await res.json().catch(() => null)) as unknown;
      const message = typeof (body as any)?.message === "string" ? (body as any).message : "Logout semua device.";

      if (!res.ok) {
        showAlert(message, { variant: "error" });
        return;
      }

      showAlert(message, { variant: "success" });

      // Server clears auth cookies; move user to login.
      router.push("/login");
    } finally {
      setIsLoggingOutAll(false);
      setShowLogoutAllConfirm(false);
    }
  };

  return (
    <AccountShell
      title="Settings"
      description="Kelola profil dan keamanan akun"
      breadcrumbs={[{ label: "Settings", href: "/settings" }]}
      onUserLoaded={(u) => {
        setName(u.name);
        setEmail(u.email);
      }}
    >
      {({ user, isLoadingUser, loadError }) => (
        <div className={styles.page}>
          {isLoadingUser ? (
            <div className={styles.grid}>
              <SmartSkeleton variant="form" />
              <SmartSkeleton variant="form" />
            </div>
          ) : !user ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔐</div>
              <h3>Akses Terbatas</h3>
              <p>{loadError ?? "Silakan login untuk mengakses settings."}</p>
              <Link className="primary-btn" href="/login">Login</Link>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {/* PROFILE CARD */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3>Profil</h3>
                    <p>Kelola informasi akun Anda</p>
                  </div>
                  <div className={styles.cardBody}>
                    <TextField
                      ref={nameRef}
                      label="Nama Lengkap"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      error={errors.name}
                    />
                    <TextField label="Email" type="email" value={email} disabled />
                  </div>
                </div>

                {/* SECURITY CARD */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3>Keamanan</h3>
                    <p>Ubah password akun Anda</p>
                  </div>
                  <div className={styles.cardBody}>
                    <PasswordField
                      ref={oldPasswordRef}
                      label="Password Lama"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      error={errors.oldPassword}
                    />
                    <PasswordField
                      ref={newPasswordRef}
                      label="Password Baru"
                      autoComplete="new-password"
                      placeholder="Minimal 8 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      error={errors.newPassword}
                    />
                    <PasswordField
                      ref={confirmNewPasswordRef}
                      label="Konfirmasi Password Baru"
                      autoComplete="new-password"
                      placeholder="Ulangi password baru"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      aria-invalid={Boolean(errors.confirmNewPassword) || mismatch}
                      error={errors.confirmNewPassword}
                      hint={!errors.confirmNewPassword && mismatch ? "Konfirmasi tidak sama." : undefined}
                    />
                    <p className={styles.hint}>
                      Mengganti password akan logout otomatis.
                    </p>
                  </div>
                </div>
              </div>

              <FormError message={errors.form} />

              <div className={styles.actions}>
                <PrimaryButton
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave}
                  isLoading={isSaving}
                  loadingLabel="Menyimpan..."
                >
                  Simpan Perubahan
                </PrimaryButton>
                <button 
                  className="secondary-btn" 
                  onClick={() => setShowLogoutAllConfirm(true)} 
                  disabled={isLoggingOutAll}
                >
                  Logout Semua Device
                </button>
              </div>

              <ConfirmModal
                open={showLogoutAllConfirm}
                title="Logout semua device?"
                description="Semua sesi di perangkat lain akan berakhir."
                confirmLabel="Logout Semua"
                cancelLabel="Batal"
                confirmVariant="danger"
                isConfirming={isLoggingOutAll}
                onCancel={() => setShowLogoutAllConfirm(false)}
                onConfirm={handleLogoutAll}
              />
            </>
          )}
        </div>
      )}
    </AccountShell>
  );
}
